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
          Are you sure you want to delete Credit Note{" "}
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

const CreditNote = ({ onClose }) => {
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
      creditAmount: "",
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
  const [creditNoteOptions, setCreditNoteOptions] = useState([]);
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
  const creditAmount = watch("creditAmount");
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

        const response = await axios.get(`${server}/credit-note`);

        let invoiceNumber = 1;
        if (response.data && response.data.length > 0) {
          invoiceNumber = response.data.length + 1;
        }

        const paddedSrNo = String(invoiceNumber).padStart(2, "0");
        setValue("invoiceSrNo", paddedSrNo);

        const paddedInvoiceNo = String(invoiceNumber).padStart(4, "0");
        const invoiceNo = `CR/${selectedBranch}/${shortYear}/${paddedInvoiceNo}`;
        setValue("invoiceNo", invoiceNo);
      } catch (error) {
        console.error("Error generating invoice numbers:", error);
        setValue("invoiceSrNo", "01");
        const date = new Date(invoiceDate);
        const year = date.getFullYear();
        const shortYear =
          year.toString().slice(2) + (year + 1).toString().slice(2);
        setValue("invoiceNo", `CR/${selectedBranch}/${shortYear}/0001`);
      }
    };

    generateInvoiceNumbers();
  }, [selectedBranch, invoiceDate, server, setValue]);

  // Fetch credit note numbers when search branch changes
  useEffect(() => {
    const fetchCreditNoteNumbers = async () => {
      if (!searchBranch) {
        setCreditNoteOptions([]);
        return;
      }

      try {
        const response = await axios.get(
          `${server}/credit-note?branch=${searchBranch}`
        );

        if (response.data && response.data.length > 0) {
          const creditNoteNos = response.data.map(
            (note) => note.clientDetails.invoiceNo
          );
          setCreditNoteOptions(creditNoteNos);
        } else {
          setCreditNoteOptions([]);
        }
      } catch (error) {
        console.error("Error fetching credit note numbers:", error);
        setCreditNoteOptions([]);
      }
    };

    fetchCreditNoteNumbers();
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
        // Calculate total credit amount from all rows
        const totalCreditAmount = rowData.reduce((sum, row) => {
          return sum + parseFloat(row.creditAmount);
        }, 0);

        // Get branch service tax
        const branchResponse = await axios.get(`${server}/branch-master`);
        const branch = branchResponse.data.find(
          (b) => b.code === selectedBranch
        );

        if (!branch || !branch.serviceTax) {
          setValue("amount", totalCreditAmount.toFixed(2));
          setValue("sgst", "0.00");
          setValue("cgst", "0.00");
          setValue("igst", "0.00");
          setValue("grandTotal", totalCreditAmount.toFixed(2));
          return;
        }

        const serviceTaxPrefix = branch.serviceTax.substring(0, 2);
        const gstNoPrefix = gst.substring(0, 2);

        if (serviceTaxPrefix === gstNoPrefix) {
          // Same state - CGST and SGST
          const sgst = (totalCreditAmount * 0.09).toFixed(2);
          const cgst = (totalCreditAmount * 0.09).toFixed(2);
          const grandTotal = (
            totalCreditAmount +
            parseFloat(sgst) +
            parseFloat(cgst)
          ).toFixed(2);

          setValue("amount", totalCreditAmount.toFixed(2));
          setValue("sgst", sgst);
          setValue("cgst", cgst);
          setValue("igst", "0.00");
          setValue("grandTotal", grandTotal);
        } else {
          // Different state - IGST
          const igst = (totalCreditAmount * 0.18).toFixed(2);
          const grandTotal = (totalCreditAmount + parseFloat(igst)).toFixed(2);

          setValue("amount", totalCreditAmount.toFixed(2));
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
      { key: "creditAmount", label: "Amount" },
    ],
    []
  );

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Handle Add button - Add AWB to table
  const handleAdd = () => {
    if (!awbNo || !creditAmount) {
      showNotification("error", "Please enter AWB No and Credit Amount");
      return;
    }

    if (rowData.some((row) => row.awbNo === awbNo)) {
      showNotification("error", "AWB already added");
      return;
    }

    const newRow = {
      awbNo,
      creditAmount: parseFloat(creditAmount).toFixed(2),
    };

    setRowData([...rowData, newRow]);

    setValue("awbNo", "");
    setValue("creditAmount", "");

    showNotification("success", "AWB added to table");
  };

  // Handle Search button
  const handleSearch = async () => {
    if (!searchInvoiceNo) {
      showNotification("error", "Please select a credit note number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.get(
        `${server}/credit-note?invoiceNo=${searchInvoiceNo}`
      );

      if (response.data && response.data.length > 0) {
        const creditNote = response.data[0];

        setValue("monthFile", creditNote.monthFile);
        setValue("branch", creditNote.clientDetails.branch);
        setValue(
          "invoiceDate",
          new Date(creditNote.clientDetails.invoiceDate)
            .toISOString()
            .split("T")[0]
        );
        setValue("invoiceSrNo", creditNote.clientDetails.invoiceSrNo);
        setValue("invoiceNo", creditNote.clientDetails.invoiceNo);
        setValue("accountCode", creditNote.clientDetails.accountCode);
        setValue("name", creditNote.clientDetails.customerName);
        setValue("gstNo", creditNote.clientDetails.gstNo);
        setValue("gst", creditNote.clientDetails.gstNo);
        setValue("state", creditNote.clientDetails.state);
        setValue("forwarding", creditNote.clientDetails.forwarding);

        setValue("amount", creditNote.amountDetails.amount.toFixed(2));
        setValue("sgst", creditNote.amountDetails.sgst.toFixed(2));
        setValue("cgst", creditNote.amountDetails.cgst.toFixed(2));
        setValue("igst", creditNote.amountDetails.igst.toFixed(2));
        setValue("grandTotal", creditNote.amountDetails.grandTotal.toFixed(2));

        setRowData(creditNote.creditItems);
        setIsSearched(true);
        setCurrentInvoiceNo(creditNote.clientDetails.invoiceNo);

        showNotification("success", "Credit note loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching credit note:", error);
      showNotification("error", "Failed to fetch credit note");
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

      const creditNoteData = {
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
        creditItems: rowData,
      };

      const response = await axios.post(
        `${server}/credit-note`,
        creditNoteData
      );

      if (response.status === 201) {
        showNotification("success", "Credit note created successfully!");
        setTimeout(() => {
          handleNew();
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating credit note:", error);
      showNotification(
        "error",
        error.response?.data?.error || "Failed to create credit note"
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
        `${server}/credit-note?invoiceNo=${currentInvoiceNo}`
      );

      if (response.status === 200) {
        showNotification("success", "Credit note deleted successfully!");
        setTimeout(() => {
          handleRefresh();
        }, 1500);
      }
    } catch (error) {
      console.error("Error deleting credit note:", error);
      showNotification(
        "error",
        error.response?.data?.error || "Failed to delete credit note"
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
      creditAmount: "",
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
    setCreditNoteOptions([]);
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
      creditAmount: "",
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
          title={`Credit Note`}
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
                key={`creditAmount-${formKey}`}
                placeholder="Credit Amount"
                value="creditAmount"
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
            options={creditNoteOptions}
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
      <div className="flex justify-end mt-6">
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

export default CreditNote;