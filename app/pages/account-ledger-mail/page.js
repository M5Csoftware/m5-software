"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithCheckbox } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import toast from "react-hot-toast";
import NotificationFlag from "@/app/components/Notificationflag";
import CodeList from "@/app/components/CodeList";

function AccountLedgerMail() {
  const { server, setToggleCodeList, toggleCodeList } =
    useContext(GlobalContext);
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      "Sale Person": "",
      from: "",
      to: "",
    },
  });
  const [rowData, setRowData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [withHoldAWB, setWithHoldAWB] = useState(false);
  const [loading, setLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [formKey, setFormKey] = useState(0);
  const [salesEmployees, setSalesEmployees] = useState([]);

  // Notification state
  const [notification, setNotification] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  const salesPerson = watch("Sale Person");
  const fromDate = watch("from");
  const toDate = watch("to");

  const columns = useMemo(
    () => [
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "emailId", label: "Email ID" },
      { key: "openingBalance", label: "Opening Balance" },
      { key: "branch", label: "Branch" },
      { key: "salePerson", label: "Sale Person" },
    ],
    []
  );

  const codeListColumns = useMemo(
    () => [
      { key: "userId", label: "User ID" },
      { key: "userName", label: "User Name" },
    ],
    []
  );

  const toISODate = (val) => {
    if (!val) return null;

    // already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // DD/MM/YYYY or MM/DD/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [a, b, c] = val.split("/");
      const iso = `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : iso;
    }

    return null;
  };

  // Fetch sales employees on component mount
  useEffect(() => {
    fetchSalesEmployees();
  }, []);

  const fetchSalesEmployees = async () => {
    try {
      const response = await axios.get(
        `${server}/employee-master/employees?department=Sales`
      );
      if (response.data.success) {
        setSalesEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching sales employees:", error);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ visible: true, type, message });
  };

  const handleShow = async (e) => {
    e.preventDefault();

    if (!salesPerson || salesPerson.trim() === "") {
      showNotification("error", "Please enter Sales Person name/ID");
      return;
    }

    setLoading(true);
    setGeneratedFiles([]); // Reset generated files

    try {
      const params = {
        salesPerson: salesPerson.trim(),
      };

      const fromISO = toISODate(fromDate);
      const toISO = toISODate(toDate);

      if (fromDate && !fromISO) {
        showNotification("error", "Invalid From date");
        return;
      }
      if (toDate && !toISO) {
        showNotification("error", "Invalid To date");
        return;
      }

      if (fromISO) params.from = fromISO;
      if (toISO) params.to = toISO;

      const response = await axios.get(`${server}/account-ledger-mail`, {
        params,
      });

      if (response.data.success) {
        setRowData(response.data.data || []);
        setSelectedItems([]);

        if (response.data.data.length === 0) {
          showNotification("error", response.data.message);
        } else {
          toast.success(`Found ${response.data.count} customer(s)`);
        }
      } else {
        showNotification("error", response.data.message);
        setRowData([]);
      }
    } catch (error) {
      console.error("Error fetching account ledger data:", error);
      showNotification(
        "error",
        error.response?.data?.message ||
          "Error fetching data. Please try again."
      );
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setValue("Sale Person", "");
    setValue("from", "");
    setValue("to", "");
    setRowData([]);
    setSelectedItems([]);
    setWithHoldAWB(false);
    setGeneratedFiles([]);
  };

  const handleExcelExport = async () => {
    if (selectedItems.length === 0) {
      showNotification("error", "Please select at least one row to export");
      return;
    }

    setExcelLoading(true);
    setGeneratedFiles([]);

    try {
      const accountCodes = selectedItems.map((item) => item.customerCode);

      const response = await axios.post(
        `${server}/account-ledger-mail/account-ledger-excel`,
        {
          accountCodes,
          withHoldAWB,
        }
      );

      if (response.data.success) {
        const files = response.data.files || [];
        setGeneratedFiles(files);

        // Log file names to console
        // console.log("Generated Excel Files:");
        files.forEach((file) => {
          // console.log(`- ${file.fileName}`);
        });

        showNotification(
          "success",
          `${files.length} Excel file(s) generated successfully and uploaded to Cloudinary`
        );
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to generate Excel files"
        );
      }
    } catch (error) {
      console.error("Error generating Excel:", error);
      showNotification(
        "error",
        error.response?.data?.message ||
          "Error generating Excel files. Please try again."
      );
    } finally {
      setExcelLoading(false);
    }
  };

  const handleSend = async () => {
    if (generatedFiles.length === 0) {
      showNotification("error", "Please generate Excel files first");
      return;
    }

    if (selectedItems.length === 0) {
      showNotification("error", "Please select at least one row to send email");
      return;
    }

    setSendLoading(true);

    try {
      const response = await axios.post(
        `${server}/account-ledger-mail/send-email`,
        {
          files: generatedFiles,
          customers: selectedItems,
        }
      );

      if (response.data.success) {
        const { sentEmails, failedEmails } = response.data;

        if (!failedEmails || failedEmails.length === 0) {
          showNotification(
            "success",
            `Emails sent successfully to ${sentEmails.length} customer(s)`
          );
          // Reset generated files after successful sending
          setGeneratedFiles([]);
        } else {
          showNotification(
            "error",
            `${sentEmails.length} email(s) sent. Failed for ${failedEmails.length} customer(s).`
          );
        }

        // console.log("Email sending result:", response.data);
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to send emails"
        );
      }
    } catch (error) {
      console.error("Error sending emails:", error);
      showNotification(
        "error",
        error.response?.data?.message ||
          "Error sending emails. Please try again."
      );
    } finally {
      setSendLoading(false);
    }
  };

  // Handle refresh with complete reset (similar to Sales Report)
  const handleRefresh = () => {
    // Clear all states first
    setRowData([]);
    setSelectedItems([]);
    setWithHoldAWB(false);
    setGeneratedFiles([]);

    // Increment form key to force complete remount
    setFormKey((prev) => prev + 1);

    // Reset form
    reset({
      "Sale Person": "",
      from: "",
      to: "",
    });

    // Show refresh notification
    showNotification("success", "Page refreshed successfully");
  };

  // Handle code list action
  const handleCodeListAction = (action, data) => {
    if (action === "edit") {
      setValue("Sale Person", data.userId);
      setToggleCodeList(false);
    }
  };

  return (
    <>
      <form className="flex flex-col gap-3" key={formKey}>
        <Heading
          title={`Account Ledger Mail`}
          bulkUploadBtn="hidden"
          codeListBtn={true}
          onRefresh={handleRefresh}
          fullscreenBtn={false}
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-full">
                <InputBox
                  key={`Sale Person-${formKey}`}
                  placeholder={`Sale Person`}
                  register={register}
                  setValue={setValue}
                  value={`Sale Person`}
                />
              </div>
              <DateInputBox
                key={`from-${formKey}`}
                register={register}
                setValue={setValue}
                value={`from`}
                placeholder="From"
              />
              <DateInputBox
                key={`to-${formKey}`}
                register={register}
                setValue={setValue}
                value={`to`}
                placeholder="To"
              />
              <div>
                <OutlinedButtonRed
                  label={loading ? "Loading..." : "Show"}
                  onClick={handleShow}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <RedCheckbox
                key={`withHoldAWB-${formKey}`}
                register={register}
                setValue={setValue}
                label={`With Hold AWB`}
                id={`withHoldAWBNo`}
                isChecked={withHoldAWB}
                setChecked={setWithHoldAWB}
              />
              <div>
                <span className="text-red text-sm font-semibold">
                  *For Full Ledger Leave the Date Range Blank
                </span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <TableWithCheckbox
            name="accountLedger"
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={rowData}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            className={`h-[45vh]`}
          />
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2 items-center">
            {/* <OutlinedButtonRed
              type="button"
              label={"Close"}
              onClick={handleClose}
            /> */}
            {selectedItems.length > 0 && (
              <span className="text-sm text-gray-600">
                {selectedItems.length} row(s) selected
              </span>
            )}
            {generatedFiles.length > 0 && (
              <span className="text-sm text-green-600 font-medium">
                {generatedFiles.length} file(s) generated
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <OutlinedButtonRed
              tooltip={
                selectedItems.length === 0
                  ? "Please select at least one row!"
                  : ""
              }
              label={excelLoading ? "Generating..." : "Excel"}
              className="px-10 py-1"
              onClick={handleExcelExport}
              disabled={excelLoading || selectedItems.length === 0}
            />
            <SimpleButton
              tooltip={
                generatedFiles.length === 0
                  ? "Please generate excel first!"
                  : ""
              }
              type="button"
              name={
                sendLoading ? (
                  "Sending..."
                ) : (
                  <span className="flex items-center gap-2">
                    Send
                    <img
                      src="/send-icon.svg"
                      alt="send icon"
                      className="w-4 h-4"
                    />
                  </span>
                )
              }
              onClick={handleSend}
              disabled={sendLoading || generatedFiles.length === 0}
            />
          </div>
        </div>
      </form>

      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      {/* Code List for Sales Employees */}
      <CodeList
        data={salesEmployees}
        columns={codeListColumns}
        name="Sales Employees"
        handleAction={handleCodeListAction}
      />
    </>
  );
}

export default AccountLedgerMail;
