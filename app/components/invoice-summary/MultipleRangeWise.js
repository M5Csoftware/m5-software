"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import DownloadCsvExcel from "../DownloadCsvExcel";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import * as XLSX from "xlsx";
import { X } from "lucide-react";

function MultipleRangeWise() {
  const { register, setValue } = useForm();
  const { server } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoiceInput, setInvoiceInput] = useState("");
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page

  const columns = useMemo(
    () => [
      { key: "srNo", label: "SR No" },
      { key: "invoiceNo", label: "Invoice No" },
      { key: "invoiceDate", label: "Invoice Date" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "gstNo", label: "GST No" },
      { key: "state", label: "State" },
      { key: "salePerson", label: "Sale Person Name" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
      { key: "basicAmount", label: "Basic Amount" },
      { key: "discount", label: "Discount" },
      { key: "basicAmountAfterDiscount", label: "Basic Amount After Discount" },
      { key: "miscAmount", label: "Misc Amount" },
      { key: "fuel", label: "Fuel" },
      { key: "taxable", label: "Taxable" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "nonTaxable", label: "Non Taxable" },
      { key: "grandTotal", label: "Grand Total" },
    ],
    []
  );

  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const invoiceNumbers = pastedText
      .split(/[\n,\s]+/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0);

    if (invoiceNumbers.length > 0) {
      // Remove duplicates and add to existing list
      const newInvoices = [...new Set([...invoiceList, ...invoiceNumbers])];
      setInvoiceList(newInvoices);
      setInvoiceInput("");

      setNotification({
        type: "success",
        message: `Added ${invoiceNumbers.length} invoice(s)`,
        visible: true,
      });
    }
  };

  // Handle manual input
  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const invoiceNum = invoiceInput.trim();

      if (invoiceNum && !invoiceList.includes(invoiceNum)) {
        setInvoiceList([...invoiceList, invoiceNum]);
        setInvoiceInput("");

        setNotification({
          type: "success",
          message: "Invoice added",
          visible: true,
        });
      } else if (invoiceList.includes(invoiceNum)) {
        setNotification({
          type: "error",
          message: "Invoice already added",
          visible: true,
        });
      }
    }
  };

  // Remove invoice from list
  const removeInvoice = (invoiceToRemove) => {
    setInvoiceList(invoiceList.filter((inv) => inv !== invoiceToRemove));
    if (selectedInvoice === invoiceToRemove) {
      setSelectedInvoice(null);
    }
  };

  // Clear all invoices
  const clearAllInvoices = () => {
    setInvoiceList([]);
    setSelectedInvoice(null);
    setRowData([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || invoiceList.length === 0) return;

    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch new page
    fetchInvoiceData(invoiceList, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have invoice list, refetch with new limit (reset to page 1)
    if (invoiceList.length > 0) {
      setCurrentPage(1);
      fetchInvoiceData(invoiceList, 1);
    }
  };

  // Fetch invoice data with pagination
  const fetchInvoiceData = async (invoices, page = 1) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${server}/invoice-summary/multiple-invoice`,
        {
          invoiceNumbers: invoices,
          page: page,
          limit: pageLimit,
        }
      );

      if (response.data.success) {
        setRowData(response.data.data);
        
        // Set pagination info
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalRecords(response.data.pagination.totalRecords);
        }

        setNotification({
          type: "success",
          message: `Found ${response.data.data.length} invoice(s) (Page ${response.data.pagination?.currentPage || page} of ${response.data.pagination?.totalPages || 1})`,
          visible: true,
        });
      } else {
        setRowData([]);
        setTotalRecords(0);
        setTotalPages(1);
        setNotification({
          type: "error",
          message: response.data.message || "No data found",
          visible: true,
        });
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      setRowData([]);
      setTotalRecords(0);
      setTotalPages(1);
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to fetch data",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShow = async () => {
    if (invoiceList.length === 0) {
      setNotification({
        type: "error",
        message: "Please add at least one invoice number",
        visible: true,
      });
      return;
    }

    // Reset to page 1 for new search
    setCurrentPage(1);
    
    // Fetch first page
    await fetchInvoiceData(invoiceList, 1);
  };

  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to download",
        visible: true,
      });
      return;
    }

    const headers = columns.map((col) => col.label).join(",");
    const rows = rowData.map((row) => {
      return columns
        .map((col) => {
          const value = row[col.key] || "";
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `multiple_invoice_summary_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      type: "success",
      message: "CSV downloaded successfully",
      visible: true,
    });
  };

  const handleDownloadExcel = () => {
    if (!rowData || rowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to download",
        visible: true,
      });
      return;
    }

    const wsData = [
      columns.map((col) => col.label),
      ...rowData.map((row) => columns.map((col) => row[col.key] || "")),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.label.length, 15),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Multiple Invoice Summary");

    XLSX.writeFile(wb, `multiple_invoice_summary_${new Date().getTime()}.xlsx`);

    setNotification({
      type: "success",
      message: "Excel downloaded successfully",
      visible: true,
    });
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1 && rowData.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{rowData.length}</span> of{" "}
            <span className="font-medium">{totalRecords}</span> records
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="limit" className="text-sm text-gray-600">
              Rows per page:
            </label>
            <select
              id="limit"
              value={pageLimit}
              onChange={handleLimitChange}
              className="border rounded px-2 py-1 text-sm"
              disabled={loading}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || loading || invoiceList.length === 0}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading || invoiceList.length === 0}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading || invoiceList.length === 0}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading || invoiceList.length === 0}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

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

      <form className="flex flex-col gap-4">
        {/* Split View: Invoice List (Left) + Table (Right) */}
        <div className="flex gap-4 h-[450px]">
          {/* Left Side: Invoice List */}
          <div className="w-64 flex flex-col border border-gray-300 rounded h-full">
            <div className="p-3 border-b border-gray-300 bg-gray-100 font-semibold flex justify-between items-center">
              <span>Invoice Numbers</span>
              {invoiceList.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllInvoices}
                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Input for pasting/typing invoice numbers */}
            <div className="p-3 border-b border-gray-300">
              <input
                type="text"
                value={invoiceInput}
                onChange={(e) => setInvoiceInput(e.target.value)}
                onPaste={handlePaste}
                onKeyPress={handleInputKeyPress}
                placeholder="Paste or type invoice..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste multiple or press Enter
              </p>
            </div>

            {/* Invoice List with count */}
            <div className="px-3 py-2 border-b border-gray-300 bg-gray-50 text-sm font-medium">
              Total: {invoiceList.length} invoice(s)
            </div>

            {/* Invoice List */}
            <div className="flex-1 overflow-y-auto">
              {invoiceList.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No invoices added yet
                </div>
              ) : (
                invoiceList.map((invoice) => (
                  <div
                    key={invoice}
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`px-3 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between ${
                      selectedInvoice === invoice
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : ""
                    }`}
                  >
                    <span className="flex-1 truncate">{invoice}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeInvoice(invoice);
                      }}
                      className="ml-2 p-1 hover:bg-red-100 rounded transition"
                    >
                      <X size={16} className="text-red-600" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Show Button */}
            <div className="p-3 border-t border-gray-300">
              <OutlinedButtonRed
                label={loading ? "Loading..." : "Show"}
                onClick={handleShow}
                disabled={loading || invoiceList.length === 0}
              />
            </div>
          </div>

          {/* Right Side: Main Table */}
          <div className="flex-1 overflow-x-auto">
            <div>
              <TableWithSorting
                register={register}
                setValue={setValue}
                columns={columns}
                rowData={rowData}
                className="h-[450px]"
              />
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        <PaginationControls />

        {/* Total Records Display */}
        <div className="flex justify-between">
          <div className="text-sm text-gray-600">
            {totalRecords > 0 && (
              <span>Total Records: {totalRecords}</span>
            )}
          </div>
          <div className="flex gap-2">
            <DownloadCsvExcel
              handleDownloadExcel={handleDownloadExcel}
              handleDownloadCSV={handleDownloadCSV}
            />
          </div>
        </div>
      </form>
    </>
  );
}

export default MultipleRangeWise;