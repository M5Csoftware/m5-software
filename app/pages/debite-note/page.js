"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import React, { useState, useMemo, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, invoiceNo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete Debit Note{" "}
          <span className="font-semibold">{invoiceNo}</span>?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const DebitNote = ({ onClose }) => {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      monthFile: "",
      branch: "",
      invoiceDate: "",
      invoiceSrNo: "",
      invoiceNo: "",
      awbNo: "",
      accountCode: "",
      name: "",
      debitAmount: "",
      gst: "",
      forwarding: "",
      gstNo: "",
      state: "",
      amount: "0.00",
      sgst: "0.00",
      cgst: "0.00",
      igst: "0.00",
      grandTotal: "0.00",
      excelPath: "",
      searchBranch: "",
      searchInvoiceNo: ""
    }
  });
  const { server } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [monthFileOptions, setMonthFileOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [debitNoteOptions, setDebitNoteOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState(null);
  const [resetFactor, setResetFactor] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Watch form values
  const selectedBranch = watch("branch");
  const invoiceDate = watch("invoiceDate");
  const awbNo = watch("awbNo");
  const debitAmount = watch("debitAmount");
  const searchBranch = watch("searchBranch");
  const searchInvoiceNo = watch("searchInvoiceNo");
  const gst = watch("gst");

  // Fetch month files
  useEffect(() => {
    const fetchMonthFiles = async () => {
      try {
        const response = await axios.get(`${server}/month-files`);
        if (response.data.success && response.data.data) {
          const monthFilesList = response.data.data.map(
            (file) => file.monthFile
          );
          setMonthFileOptions(monthFilesList);
        }
      } catch (error) {
        console.error("Error fetching month files:", error);
        showNotification("error", "Failed to fetch month files");
      }
    };

    fetchMonthFiles();
  }, [server]);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${server}/branch-master`);
        const branches = response.data.map((branch) => ({
          label: branch.code,
          value: branch.code,
          serviceTax: branch.serviceTax,
        }));
        setBranchOptions(branches);
      } catch (error) {
        console.error("Error fetching branches:", error);
        showNotification("error", "Failed to fetch branches");
      }
    };

    fetchBranches();
  }, [server]);

  // Generate Invoice Sr No and Invoice No based on invoice date
  useEffect(() => {
    const generateInvoiceNumbers = async () => {
      if (!selectedBranch || !invoiceDate) return;

      try {
        const date = new Date(invoiceDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        let fYear;
        if (month >= 3) {
          fYear = `${year}-${year + 1}`;
        } else {
          fYear = `${year - 1}-${year}`;
        }

        const [year1, year2] = fYear.split("-");
        const shortYear = year1.slice(2) + year2.slice(2);

        const response = await axios.get(`${server}/debit-note`);

        let invoiceNumber = 1;
        if (response.data && response.data.length > 0) {
          invoiceNumber = response.data.length + 1;
        }

        const paddedSrNo = String(invoiceNumber).padStart(2, "0");
        setValue("invoiceSrNo", paddedSrNo);

        const paddedInvoiceNo = String(invoiceNumber).padStart(4, "0");
        const invoiceNo = `DR/${selectedBranch}/${shortYear}/${paddedInvoiceNo}`;
        setValue("invoiceNo", invoiceNo);
      } catch (error) {
        console.error("Error generating invoice numbers:", error);
        setValue("invoiceSrNo", "01");
        const date = new Date(invoiceDate);
        const year = date.getFullYear();
        const shortYear =
          year.toString().slice(2) + (year + 1).toString().slice(2);
        setValue("invoiceNo", `DR/${selectedBranch}/${shortYear}/0001`);
      }
    };

    generateInvoiceNumbers();
  }, [selectedBranch, invoiceDate, server, setValue]);

  // Fetch debit note numbers when search branch changes
  useEffect(() => {
    const fetchDebitNoteNumbers = async () => {
      if (!searchBranch) {
        setDebitNoteOptions([]);
        return;
      }

      try {
        const response = await axios.get(
          `${server}/debit-note?branch=${searchBranch}`
        );

        if (response.data && response.data.length > 0) {
          const debitNoteNos = response.data.map(
            (note) => note.clientDetails.invoiceNo
          );
          setDebitNoteOptions(debitNoteNos);
        } else {
          setDebitNoteOptions([]);
        }
      } catch (error) {
        console.error("Error fetching debit note numbers:", error);
        setDebitNoteOptions([]);
      }
    };

    fetchDebitNoteNumbers();
  }, [searchBranch, server]);

  // Fetch shipment data when AWB number is entered
  useEffect(() => {
    const fetchShipmentData = async () => {
      if (!awbNo) return;

      try {
        const response = await axios.get(
          `${server}/portal/get-shipments?awbNo=${awbNo}`
        );

        if (response.data && response.data.shipment) {
          const shipment = response.data.shipment;

          setValue("accountCode", shipment.accountCode);

          const customerResponse = await axios.get(
            `${server}/customer-account?accountCode=${shipment.accountCode}`
          );

          if (customerResponse.data) {
            setValue("name", customerResponse.data.name);
            setValue("gstNo", customerResponse.data.gstNo);
            setValue("gst", customerResponse.data.gstNo);
            setValue("state", customerResponse.data.state);
            setValue("forwarding", shipment.forwardingNo || "");
          }
        }
      } catch (error) {
        console.error("Error fetching shipment data:", error);
        showNotification("error", "Shipment not found");
      }
    };

    fetchShipmentData();
  }, [awbNo, server, setValue]);

  // Calculate total amounts whenever rowData changes
  useEffect(() => {
    const calculateTotalAmounts = async () => {
      if (rowData.length === 0 || !selectedBranch || !gst) {
        setValue("amount", "0.00");
        setValue("sgst", "0.00");
        setValue("cgst", "0.00");
        setValue("igst", "0.00");
        setValue("grandTotal", "0.00");
        return;
      }

      try {
        // Calculate total debit amount from all rows
        const totalDebitAmount = rowData.reduce((sum, row) => {
          return sum + parseFloat(row.debitAmount);
        }, 0);

        // Get branch service tax
        const branchResponse = await axios.get(`${server}/branch-master`);
        const branch = branchResponse.data.find(
          (b) => b.code === selectedBranch
        );

        if (!branch || !branch.serviceTax) {
          setValue("amount", totalDebitAmount.toFixed(2));
          setValue("sgst", "0.00");
          setValue("cgst", "0.00");
          setValue("igst", "0.00");
          setValue("grandTotal", totalDebitAmount.toFixed(2));
          return;
        }

        const serviceTaxPrefix = branch.serviceTax.substring(0, 2);
        const gstNoPrefix = gst.substring(0, 2);

        if (serviceTaxPrefix === gstNoPrefix) {
          // Same state - CGST and SGST
          const sgst = (totalDebitAmount * 0.09).toFixed(2);
          const cgst = (totalDebitAmount * 0.09).toFixed(2);
          const grandTotal = (
            totalDebitAmount +
            parseFloat(sgst) +
            parseFloat(cgst)
          ).toFixed(2);

          setValue("amount", totalDebitAmount.toFixed(2));
          setValue("sgst", sgst);
          setValue("cgst", cgst);
          setValue("igst", "0.00");
          setValue("grandTotal", grandTotal);
        } else {
          // Different state - IGST
          const igst = (totalDebitAmount * 0.18).toFixed(2);
          const grandTotal = (totalDebitAmount + parseFloat(igst)).toFixed(2);

          setValue("amount", totalDebitAmount.toFixed(2));
          setValue("sgst", "0.00");
          setValue("cgst", "0.00");
          setValue("igst", igst);
          setValue("grandTotal", grandTotal);
        }
      } catch (error) {
        console.error("Error calculating total amounts:", error);
      }
    };

    calculateTotalAmounts();
  }, [rowData, selectedBranch, gst, server, setValue]);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB" },
      { key: "debitAmount", label: "Amount" },
    ],
    []
  );

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Handle Add button - Add AWB to table
  const handleAdd = () => {
    if (!awbNo || !debitAmount) {
      showNotification("error", "Please enter AWB No and Debit Amount");
      return;
    }

    if (rowData.some((row) => row.awbNo === awbNo)) {
      showNotification("error", "AWB already added");
      return;
    }

    const newRow = {
      awbNo,
      debitAmount: parseFloat(debitAmount).toFixed(2),
    };

    setRowData([...rowData, newRow]);

    setValue("awbNo", "");
    setValue("debitAmount", "");

    showNotification("success", "AWB added to table");
  };

  // Handle Search button
  const handleSearch = async () => {
    if (!searchInvoiceNo) {
      showNotification("error", "Please select a debit note number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.get(
        `${server}/debit-note?invoiceNo=${searchInvoiceNo}`
      );

      if (response.data && response.data.length > 0) {
        const debitNote = response.data[0];

        setValue("monthFile", debitNote.monthFile);
        setValue("branch", debitNote.clientDetails.branch);
        setValue(
          "invoiceDate",
          new Date(debitNote.clientDetails.invoiceDate)
            .toISOString()
            .split("T")[0]
        );
        setValue("invoiceSrNo", debitNote.clientDetails.invoiceSrNo);
        setValue("invoiceNo", debitNote.clientDetails.invoiceNo);
        setValue("accountCode", debitNote.clientDetails.accountCode);
        setValue("name", debitNote.clientDetails.customerName);
        setValue("gstNo", debitNote.clientDetails.gstNo);
        setValue("gst", debitNote.clientDetails.gstNo);
        setValue("state", debitNote.clientDetails.state);
        setValue("forwarding", debitNote.clientDetails.forwarding);

        setValue("amount", debitNote.amountDetails.amount.toFixed(2));
        setValue("sgst", debitNote.amountDetails.sgst.toFixed(2));
        setValue("cgst", debitNote.amountDetails.cgst.toFixed(2));
        setValue("igst", debitNote.amountDetails.igst.toFixed(2));
        setValue("grandTotal", debitNote.amountDetails.grandTotal.toFixed(2));

        setRowData(debitNote.debitItems);
        setIsSearched(true);
        setCurrentInvoiceNo(debitNote.clientDetails.invoiceNo);

        showNotification("success", "Debit note loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching debit note:", error);
      showNotification("error", "Failed to fetch debit note");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Create Bill button
  const handleCreateBill = async () => {
    try {
      if (rowData.length === 0) {
        showNotification("error", "Please add at least one AWB");
        return;
      }

      if (!watch("invoiceDate") || !watch("monthFile")) {
        showNotification("error", "Please fill all required fields");
        return;
      }

      setIsLoading(true);

      const debitNoteData = {
        fYear: calculateFYear(watch("invoiceDate")),
        monthFile: watch("monthFile"),
        clientDetails: {
          branch: selectedBranch,
          invoiceDate: new Date(watch("invoiceDate")),
          invoiceSrNo: watch("invoiceSrNo"),
          invoiceNo: watch("invoiceNo"),
          accountCode: watch("accountCode"),
          customerName: watch("name"),
          gstNo: watch("gstNo"),
          state: watch("state"),
          forwarding: watch("forwarding") || "",
        },
        amountDetails: {
          amount: parseFloat(watch("amount")) || 0,
          sgst: parseFloat(watch("sgst")) || 0,
          cgst: parseFloat(watch("cgst")) || 0,
          igst: parseFloat(watch("igst")) || 0,
          grandTotal: parseFloat(watch("grandTotal")) || 0,
        },
        debitItems: rowData,
      };

      const response = await axios.post(
        `${server}/debit-note`,
        debitNoteData
      );

      if (response.status === 201) {
        showNotification("success", "Debit note created successfully!");
        setTimeout(() => {
          handleNew();
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating debit note:", error);
      showNotification(
        "error",
        error.response?.data?.error || "Failed to create debit note"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Remove Bill button - Open modal
  const handleRemoveBill = () => {
    if (!isSearched || !currentInvoiceNo) {
      showNotification("error", "Please search a bill first to remove it");
      return;
    }
    setShowDeleteModal(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setIsLoading(true);

    try {
      const response = await axios.delete(
        `${server}/debit-note?invoiceNo=${currentInvoiceNo}`
      );

      if (response.status === 200) {
        showNotification("success", "Debit note deleted successfully!");
        setTimeout(() => {
          handleRefresh();
        }, 1500);
      }
    } catch (error) {
      console.error("Error deleting debit note:", error);
      showNotification(
        "error",
        error.response?.data?.error || "Failed to delete debit note"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFYear = (date) => {
    const invoiceDate = new Date(date);
    const year = invoiceDate.getFullYear();
    const month = invoiceDate.getMonth();

    if (month >= 3) {
      return `${year}-${year + 1}`;
    } else {
      return `${year - 1}-${year}`;
    }
  };

  const handleNew = () => {
    // Clear all states
    setRowData([]);
    setIsSearched(false);
    setCurrentInvoiceNo(null);
    
    // Increment form key to force complete remount
    setFormKey(prev => prev + 1);
    
    // Reset all form values
    reset({
      monthFile: "",
      branch: "",
      invoiceDate: "",
      invoiceSrNo: "",
      invoiceNo: "",
      awbNo: "",
      accountCode: "",
      name: "",
      debitAmount: "",
      gst: "",
      forwarding: "",
      gstNo: "",
      state: "",
      amount: "0.00",
      sgst: "0.00",
      cgst: "0.00",
      igst: "0.00",
      grandTotal: "0.00",
      excelPath: ""
    });
  };

  const handleRefresh = () => {
    // Clear all states first
    setRowData([]);
    setIsSearched(false);
    setCurrentInvoiceNo(null);
    setDebitNoteOptions([]);
    setResetFactor(!resetFactor);
    
    // Increment form key to force complete remount
    setFormKey(prev => prev + 1);
    
    // Reset form
    reset({
      monthFile: "",
      branch: "",
      invoiceDate: "",
      invoiceSrNo: "",
      invoiceNo: "",
      awbNo: "",
      accountCode: "",
      name: "",
      debitAmount: "",
      gst: "",
      forwarding: "",
      gstNo: "",
      state: "",
      amount: "0.00",
      sgst: "0.00",
      cgst: "0.00",
      igst: "0.00",
      grandTotal: "0.00",
      excelPath: "",
      searchBranch: "",
      searchInvoiceNo: ""
    });
    
    // Show refresh notification
    showNotification("success", "Page refreshed successfully");
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        invoiceNo={currentInvoiceNo}
      />

      <div className="space-y-4">
        <Heading
          fullscreenBtn={false}
          bulkUploadBtn="hidden"
          title={`Debit Note`}
          onRefresh={handleRefresh}
        />
        <div className="flex gap-10" key={formKey}>
          <div className="w-1/2 space-y-2">
            <div>
              <RedLabelHeading label={"Client Details"} />
            </div>
            <div className="flex gap-2">
              <LabeledDropdown
                key={`monthFile-${formKey}`}
                options={monthFileOptions}
                value="monthFile"
                title={`Month File`}
                register={register}
                setValue={setValue}
              />

              <LabeledDropdown
                key={`branch-${formKey}`}
                options={branchOptions.map((b) => b.value)}
                value="branch"
                title={`Branch`}
                register={register}
                setValue={setValue}
              />
            </div>

            <div className="flex gap-2">
              <DateInputBox
                key={`invoiceDate-${formKey}`}
                placeholder={`Invoice Date`}
                register={register}
                setValue={setValue}
                value={`invoiceDate`}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`invoiceSrNo-${formKey}`}
                placeholder={"Invoice Sr No."}
                register={register}
                setValue={setValue}
                value={"invoiceSrNo"}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`invoiceNo-${formKey}`}
                placeholder={"Invoice No"}
                register={register}
                setValue={setValue}
                value={"invoiceNo"}
              />
            </div>
            <div className="flex gap-2">
              <InputBox
                key={`awbNo-${formKey}`}
                placeholder="AWB No"
                value="awbNo"
                register={register}
                setValue={setValue}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`accountCode-${formKey}`}
                placeholder={"Client Code"}
                register={register}
                setValue={setValue}
                value={"accountCode"}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`name-${formKey}`}
                placeholder={"Client Name"}
                register={register}
                setValue={setValue}
                value={"name"}
              />
            </div>
            <div className="flex gap-2">
              <InputBox
                key={`debitAmount-${formKey}`}
                placeholder="Debit Amount"
                value="debitAmount"
                register={register}
                setValue={setValue}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`gst-${formKey}`}
                placeholder={"GST"}
                register={register}
                setValue={setValue}
                value={"gst"}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`forwarding-${formKey}`}
                placeholder={"FWD"}
                register={register}
                setValue={setValue}
                value={"forwarding"}
              />
            </div>
            <div className="flex gap-2">
              <DummyInputBoxWithLabelDarkGray
                key={`gstNo-${formKey}`}
                placeholder={"GST No"}
                register={register}
                setValue={setValue}
                value={"gstNo"}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`state-${formKey}`}
                placeholder={"State"}
                register={register}
                setValue={setValue}
                value={"state"}
              />
              <div className="w-full">
                <OutlinedButtonRed
                  type="button"
                  label={"Add"}
                  onClick={handleAdd}
                />
              </div>
            </div>
          </div>
          {/* Right Side */}
          <div className="w-1/2">
            <RedLabelHeading label={`Amount Details`} />

            <div className="space-y-2 mt-2">
              <DummyInputBoxWithLabelDarkGray
                key={`amount-${formKey}`}
                placeholder={"Amount"}
                register={register}
                setValue={setValue}
                value={"amount"}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`sgst-${formKey}`}
                placeholder={"SGST"}
                register={register}
                setValue={setValue}
                value={"sgst"}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`cgst-${formKey}`}
                placeholder={"CGST"}
                register={register}
                setValue={setValue}
                value={"cgst"}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`igst-${formKey}`}
                placeholder={"IGST"}
                register={register}
                setValue={setValue}
                value={"igst"}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`grandTotal-${formKey}`}
                placeholder={"Grand Total"}
                register={register}
                setValue={setValue}
                value={"grandTotal"}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4" key={`table-${formKey}`}>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className="h-[275px]"
        />
        <div className="flex gap-2 mt-4">
          <DummyInputBoxWithLabelDarkGray
            key={`excelPath-${formKey}`}
            placeholder={"Excel Path"}
            register={register}
            setValue={setValue}
            value={"excelPath"}
          />
          <div className="flex gap-2">
            <div>
              <OutlinedButtonRed label={`Browse`} type="button" />
            </div>
            <div>
              <SimpleButton name={"Add"} type="button" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-4" key={`search-${formKey}`}>
        <div className="w-1/2">
          <LabeledDropdown
            key={`searchBranch-${formKey}`}
            options={branchOptions.map((b) => b.value)}
            value="searchBranch"
            title={`Branch`}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className="w-1/2">
          <LabeledDropdown
            key={`searchInvoiceNo-${formKey}`}
            options={debitNoteOptions}
            value="searchInvoiceNo"
            title={`Search Invoice No`}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className="w-[190px]">
          <OutlinedButtonRed
            label={isLoading ? "Loading..." : "Search"}
            type="button"
            onClick={handleSearch}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <div>
          <OutlinedButtonRed
            label={`Back`}
            type="button"
            onClick={handleClose}
          />
        </div>

        <div className="flex gap-2">
          <div>
            <OutlinedButtonRed
              label={`New`}
              type="button"
              onClick={handleNew}
            />
          </div>
          <div>
            <OutlinedButtonRed 
              label="Remove Bill"
              type="button"
              onClick={handleRemoveBill}
              disabled={!isSearched || isLoading}
              perm="Accounts Deletion"
            />
          </div>
          <div>
            <SimpleButton
              name={isLoading ? "Loading..." : "Create Bill"}
              type="button"
              onClick={handleCreateBill}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebitNote;