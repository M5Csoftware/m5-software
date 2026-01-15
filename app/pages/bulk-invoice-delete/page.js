"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithCheckbox } from "@/app/components/Table";
import { LabeledDropdown } from "@/app/components/Dropdown";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, count, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Confirm Deletion
          </h3>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-bold text-red-600">{count}</span> invoice(s)?
          </p>
          <p className="text-sm text-red-500 mt-2">
            ⚠️ This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            No
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 bg-red text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Deleting..." : "Yes"}
          </button>
        </div>
      </div>
    </div>
  );
};

function BulkInvoiceDelete() {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [monthFile, setMonthFile] = useState(false);
  const [monthFiles, setMonthFiles] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Watch form values
  const customerCode = watch("Customer");
  const selectedMonthFile = watch("monthFile");
  const fromDate = watch("from");
  const toDate = watch("to");

  const toISODate = (val) => {
    if (!val) return null;

    // already yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // dd/mm/yyyy or mm/dd/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [a, b, c] = val.split("/");
      const iso = `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : iso;
    }

    return null;
  };

  // Fetch month files on component mount
  useEffect(() => {
    fetchMonthFiles();
  }, []);

  // Fetch customer name when customer code changes
  useEffect(() => {
    if (customerCode && customerCode.trim() !== "") {
      fetchCustomerName(customerCode);
    } else {
      setValue("name", "");
    }
  }, [customerCode]);

  const fetchMonthFiles = async () => {
    try {
      const response = await axios.get(`${server}/month-files`);
      if (response.data.success) {
        setMonthFiles(response.data.data.map((file) => file.monthFile));
      }
    } catch (error) {
      console.error("Error fetching month files:", error);
      setNotification({
        type: "error",
        message: "Failed to fetch month files",
        visible: true,
      });
    }
  };

  const fetchCustomerName = async (accountCode) => {
    try {
      const response = await axios.post(`${server}/bulk-invoice-delete`, {
        accountCode: accountCode.trim(),
      });

      if (response.data.success) {
        setValue("name", response.data.data.name);
      }
    } catch (error) {
      console.error("Error fetching customer name:", error);
      setValue("name", "");
      if (error.response?.status === 404) {
        setNotification({
          type: "error",
          message: "Customer not found",
          visible: true,
        });
      }
    }
  };

  const handleShow = async () => {
    if (!fromDate || !toDate) {
      setNotification({
        type: "error",
        message: "Please select both From and To dates",
        visible: true,
      });
      return;
    }

    if (monthFile && !selectedMonthFile) {
      setNotification({
        type: "error",
        message: "Please select a month file",
        visible: true,
      });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (monthFile && selectedMonthFile) {
        params.append("monthFile", selectedMonthFile);
        console.log("Month File selected:", selectedMonthFile);
      }

      if (customerCode && customerCode.trim() !== "") {
        params.append("customerCode", customerCode.trim());
        console.log("Customer Code:", customerCode.trim());
      }

      const fromISO = toISODate(fromDate);
      const toISO = toISODate(toDate);

      if (!fromISO || !toISO) {
        setNotification({
          type: "error",
          message: "Invalid date format",
          visible: true,
        });
        setLoading(false);
        return;
      }

      params.append("fromDate", fromISO);
      params.append("toDate", toISO);

      console.log("Fetching invoices with params:", params.toString());

      const response = await axios.get(
        `${server}/bulk-invoice-delete?${params.toString()}`
      );

      console.log("Response:", response.data);

      if (response.data.success) {
        setRowData(response.data.data);
        console.log("Row data set:", response.data.data);
        setNotification({
          type: "success",
          message:
            response.data.message ||
            `Found ${response.data.totalRecords} invoice(s)`,
          visible: true,
        });
      } else {
        setRowData([]);
        setNotification({
          type: "warning",
          message: response.data.message || "No invoices found",
          visible: true,
        });
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      console.error("Error response:", error.response?.data);
      setNotification({
        type: "error",
        message: error.response?.data?.error || "Failed to fetch invoices",
        visible: true,
      });
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (selectedItems.length === 0) {
      setNotification({
        type: "error",
        message: "Please select at least one invoice to delete",
        visible: true,
      });
      return;
    }

    // Open confirmation modal
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setDeleting(true);
    try {
      const invoiceIds = selectedItems.map((item) => item._id);

      console.log("Deleting invoice IDs:", invoiceIds);

      const response = await axios.delete(`${server}/bulk-invoice-delete`, {
        data: { invoiceIds },
      });

      if (response.data.success) {
        setNotification({
          type: "success",
          message: response.data.message,
          visible: true,
        });

        // Close modal, clear selection and refresh data
        setShowDeleteModal(false);
        setSelectedItems([]);
        handleShow();
      }
    } catch (error) {
      console.error("Error deleting invoices:", error);
      setNotification({
        type: "error",
        message: error.response?.data?.error || "Failed to delete invoices",
        visible: true,
      });
    } finally {
      setLoading(false);
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleting(false);
  };

  const columns = useMemo(
    () => [
      { key: "invoiceNo", label: "Invoice No" },
      { key: "financialYear", label: "Financial Year" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "invoiceDate", label: "Invoice Date" },
      { key: "basicAmt", label: "Basic Amount" },
      { key: "miscAmt", label: "Misc Amount" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "grandTotal", label: "Grand Total" },
    ],
    []
  );

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        count={selectedItems.length}
        loading={loading}
      />

      <form className="flex flex-col gap-3">
        <Heading
          title={`Bulk Invoice Delete`}
          bulkUploadBtn="hidden"
          codeListBtn={true}
          onRefresh={() => {
            setRowData([]);
            setSelectedItems([]);
            setValue("Customer", "");
            setValue("name", "");
            setValue("from", "");
            setValue("to", "");
            setValue("monthFile", "");
            setMonthFile(false);
          }}
          fullscreenBtn={false}
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div
                className={`w-full ${!monthFile ? "opacity-50 pointer-events-none" : ""
                  }`}
              >
                <LabeledDropdown
                  options={monthFiles}
                  value="monthFile"
                  title={`Month File`}
                  register={register}
                  setValue={setValue}
                  disabled={!monthFile}
                />
              </div>
              <div className="min-w-[120px] py-2">
                <RedCheckbox
                  register={register}
                  setValue={setValue}
                  label={`Month File`}
                  id={`monthFile`}
                  isChecked={monthFile}
                  setChecked={setMonthFile}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-full">
                <InputBox
                  placeholder={`Customer Code`}
                  register={register}
                  setValue={setValue}
                  value={`Customer`}
                />
              </div>

              <DummyInputBoxWithLabelDarkGray
                placeholder={"Customer Name"}
                register={register}
                setValue={setValue}
                value={"name"}
              />

              <DateInputBox
                register={register}
                setValue={setValue}
                value={`from`}
                placeholder="From"
              />

              <DateInputBox
                register={register}
                setValue={setValue}
                value={`to`}
                placeholder="To"
              />

              <div>
                <OutlinedButtonRed
                  type="button"
                  label={loading ? "Loading..." : "Show"}
                  onClick={handleShow}
                  disabled={loading}
                />
              </div>
              <div className="flex gap-2">
                <SimpleButton
                  type="button"
                  name={
                    deleting
                      ? "Deleting..."
                      : `Delete ${selectedItems.length > 0
                        ? `(${selectedItems.length})`
                        : ""
                      }`
                  }
                  onClick={handleDeleteClick}
                  disabled={(loading && deleting) || selectedItems.length === 0}
                  perm="Billing Deletion"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <TableWithCheckbox
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={rowData}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            name="invoices"
          />
        </div>

        <div className="flex justify-between">
          <div>
            {/* <OutlinedButtonRed
              type="button"
              label={"Close"}
              onClick={() => window.history.back()}
            /> */}
          </div>
          <div className="flex gap-2">
            <SimpleButton
              type="button"
              name={
                deleting
                  ? "Deleting..."
                  : `Delete ${selectedItems.length > 0
                    ? `(${selectedItems.length})`
                    : ""
                  }`
              }
              onClick={handleDeleteClick}
              disabled={(loading && deleting) || selectedItems.length === 0}
              perm="Billing Deletion"
            />
          </div>
        </div>
      </form>
    </>
  );
}

export default BulkInvoiceDelete;
