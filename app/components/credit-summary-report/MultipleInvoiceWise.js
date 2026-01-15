"use client";
import React, { useState, useEffect, useContext } from "react";
import InputBox from "@/app/components/InputBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { LabeledDropdown } from "../Dropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { X } from "lucide-react";
import axios from "axios";
import * as XLSX from "xlsx";

const MultipleInvoiceWise = ({
  register,
  setValue,
  isFullscreen,
  setIsFullscreen,
}) => {
  const { server } = useContext(GlobalContext);

  const [branches, setBranches] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoiceInput, setInvoiceInput] = useState("");
  const [invoiceNumbers, setInvoiceNumbers] = useState([]);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    branch: "",
  });

  const columns = [
    { key: "SrNo", label: "Sr No." },
    { key: "InvoiceNo", label: "Invoice No." },
    { key: "InvoiceDate", label: "Invoice Date" },
    { key: "CustomerCode", label: "Customer Code" },
    { key: "CustomerName", label: "Customer Name" },
    { key: "GSTNo", label: "GST No." },
    { key: "Branch", label: "Branch" },
    { key: "SalePerson", label: "Sale Person" },
    { key: "FromDate", label: "From Date" },
    { key: "ToDate", label: "To Date" },
    { key: "NonTaxable", label: "Non-Taxable" },
    { key: "BasicAmount", label: "Basic Amount" },
    { key: "MiscAmount", label: "Misc Amount" },
    { key: "Fuel", label: "Fuel" },
    { key: "Taxable", label: "Taxable" },
    { key: "SGST", label: "SGST" },
    { key: "CGST", label: "CGST" },
    { key: "IGST", label: "IGST" },
    { key: "GrandTotal", label: "Grand Total" },
    { key: "IRN", label: "IRN" },
  ];

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(
        `${server}/credit-summary-report?action=branches`
      );
      if (response.data && Array.isArray(response.data)) {
        const branchOptions = [...response.data.map((branch) => branch.code)];
        setBranches(branchOptions);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      showNotification("error", "Failed to fetch branches");
    }
  };

  // Add invoice number to the list
  const handleAddInvoice = () => {
    const trimmedInvoice = invoiceInput.trim();

    if (!trimmedInvoice) {
      showNotification("error", "Please enter an invoice number");
      return;
    }

    if (invoiceNumbers.includes(trimmedInvoice)) {
      showNotification("error", "Invoice number already added");
      return;
    }

    setInvoiceNumbers((prev) => [...prev, trimmedInvoice]);
    setInvoiceInput("");
    // Clear the input field using setValue
    if (setValue) {
      setValue("invoiceNumber", "");
    }
    showNotification("success", "Invoice number added");
  };

  // Remove invoice number from the list
  const handleRemoveInvoice = (invoiceToRemove) => {
    setInvoiceNumbers((prev) =>
      prev.filter((invoice) => invoice !== invoiceToRemove)
    );
    showNotification("success", "Invoice number removed");
  };

  // Handle Enter key press in invoice input
  const handleInvoiceKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddInvoice();
    }
  };

  // Fetch credit notes based on invoice numbers
  const handleShow = async () => {
    if (invoiceNumbers.length === 0) {
      showNotification("error", "Please add at least one invoice number");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        invoiceNumbers: invoiceNumbers,
      };

      // Only add branch to payload if it's not "All" or empty
      if (formData.branch && formData.branch !== "All") {
        payload.branch = formData.branch;
      }

      console.log("Sending payload:", payload);

      const response = await axios.post(
        `${server}/credit-summary-report/multiple-invoice`,
        payload
      );

      if (response.data.success) {
        // Format the data for display
        const formattedData = response.data.data.map((row) => ({
          ...row,
          InvoiceDate: new Date(row.InvoiceDate).toLocaleDateString("en-GB"),
          BasicAmount: parseFloat(row.BasicAmount || 0).toFixed(2),
          MiscAmount: parseFloat(row.MiscAmount || 0).toFixed(2),
          Fuel: parseFloat(row.Fuel || 0).toFixed(2),
          Taxable: parseFloat(row.Taxable || 0).toFixed(2),
          SGST: parseFloat(row.SGST || 0).toFixed(2),
          CGST: parseFloat(row.CGST || 0).toFixed(2),
          IGST: parseFloat(row.IGST || 0).toFixed(2),
          GrandTotal: parseFloat(row.GrandTotal || 0).toFixed(2),
        }));

        setRowData(formattedData);
        showNotification(
          "success",
          `Found ${response.data.summary.totalRecords} records`
        );
      }
    } catch (error) {
      console.error("Error fetching credit notes:", error);
      showNotification("error", "Failed to fetch credit summary data");
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  // Download Excel
  const handleDownload = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = rowData.map((row) => ({
        "Sr No.": row.SrNo,
        "Invoice No.": row.InvoiceNo,
        "Invoice Date": row.InvoiceDate,
        "Customer Code": row.CustomerCode,
        "Customer Name": row.CustomerName,
        "GST No.": row.GSTNo,
        Branch: row.Branch,
        "Sale Person": row.SalePerson,
        "From Date": row.FromDate,
        "To Date": row.ToDate,
        "Non-Taxable": row.NonTaxable,
        "Basic Amount": row.BasicAmount,
        "Misc Amount": row.MiscAmount,
        Fuel: row.Fuel,
        Taxable: row.Taxable,
        SGST: row.SGST,
        CGST: row.CGST,
        IGST: row.IGST,
        "Grand Total": row.GrandTotal,
        IRN: row.IRN,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws["!cols"] = [
        { wch: 8 }, // Sr No.
        { wch: 15 }, // Invoice No.
        { wch: 15 }, // Invoice Date
        { wch: 15 }, // Customer Code
        { wch: 25 }, // Customer Name
        { wch: 20 }, // GST No.
        { wch: 10 }, // Branch
        { wch: 20 }, // Sale Person
        { wch: 12 }, // From Date
        { wch: 12 }, // To Date
        { wch: 12 }, // Non-Taxable
        { wch: 15 }, // Basic Amount
        { wch: 15 }, // Misc Amount
        { wch: 12 }, // Fuel
        { wch: 15 }, // Taxable
        { wch: 12 }, // SGST
        { wch: 12 }, // CGST
        { wch: 12 }, // IGST
        { wch: 15 }, // Grand Total
        { wch: 25 }, // IRN
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Multiple Invoice Report");

      // Generate filename with current date
      const fileName = `Multiple_Invoice_Credit_Report_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);

      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Failed to download Excel file");
    }
  };

  return (
    <div>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <div>
        <div className="space-y-3">
          {/* Branch dropdown */}
          <div className="mt-6">
            <LabeledDropdown
              options={branches}
              value="branch"
              title="Branch"
              register={register}
              setValue={(name, value) => {
                setFormData((prev) => ({ ...prev, branch: value }));
                if (setValue) setValue(name, value);
              }}
            />
          </div>

          {/* Invoice numbers input with Add button */}
          <div className="flex gap-2">
            <InputBox
              placeholder="Invoice Number"
              value="invoiceNumber"
              register={register}
              setValue={(name, value) => {
                setInvoiceInput(value);
                if (setValue) setValue(name, value);
              }}
              onKeyPress={handleInvoiceKeyPress}
            />
            <div className="w-[175px]">
              <OutlinedButtonRed label="Add" onClick={handleAddInvoice} />
            </div>
            {/* Show button */}
            <div className="w-[175px]">
              <OutlinedButtonRed
                label={loading ? "Loading..." : "Show"}
                onClick={handleShow}
                disabled={loading}
              />
            </div>
            <div>
              <SimpleButton name="Download" onClick={handleDownload} />
            </div>
          </div>

          {/* Display added invoice numbers with remove button */}
          {invoiceNumbers.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-md border border-gray-200">
              {invoiceNumbers.map((invoice, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-gray-300 shadow-sm"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {invoice}
                  </span>
                  <button
                    onClick={() => handleRemoveInvoice(invoice)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-0.5 transition-colors"
                    title="Remove invoice"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Normal Table */}
          {!isFullscreen && (
            <TableWithSorting
              columns={columns}
              rowData={rowData}
              register={register}
              setValue={setValue}
              className="h-[45vh]"
            />
          )}
        </div>

        {/* Fullscreen Overlay */}
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-white flex flex-col p-12">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Credit Summary Report Multiple Invoice Wise</h2>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <TableWithSorting
                columns={columns}
                rowData={rowData}
                register={register}
                setValue={setValue}
                className="h-full w-full"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <div>{/* <OutlinedButtonRed label="Close" /> */}</div>
        </div>
      </div>
    </div>
  );
};

export default MultipleInvoiceWise;
