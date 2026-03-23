"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxLightGray,
  DummyInputBoxTransparent,
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelDarkGrayAndRedText,
  DummyInputBoxWithLabelTransparent,
} from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import * as XLSX from "xlsx";
import { X } from "lucide-react";
import NotificationFlag from "@/app/components/Notificationflag";

function CreditLimitReport() {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      Customer: "",
      name: "",
    },
  });
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [grandTotal, setGrandTotal] = useState("0.00");
  const [totalCreditBalance, setTotalCreditBalance] = useState("0.00");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  const printRef = useRef(null);

  // Watch form values for filtering
  const customerCode = watch("Customer");
  const customerName = watch("name");

  const columns = useMemo(
    () => [
      { key: "accountCode", label: "Code" },
      { key: "name", label: "Name" },
      { key: "companyCode", label: "Company Code" },
      { key: "branch", label: "Branch Code" },
      { key: "salesPersonName", label: "Sale Person" },
      { key: "referenceBy", label: "Reference By" },
      { key: "collectionBy", label: "Collection By" },
      { key: "accountManager", label: "Account Manager" },
      { key: "reportPerson", label: "Report Person" },
      { key: "paymentTerms", label: "Pay Type" },
      { key: "billingCycle", label: "Billing Cycle" },
      { key: "openingBalance", label: "Opening Balance", type: "number" },
      { key: "creditLimit", label: "Credit Limit", type: "number" },
      { key: "totalAmt", label: "Total Sale", type: "number" },
      { key: "amount", label: "Total Receipt", type: "number" },
      { key: "debitAmount", label: "Total Debit", type: "number" },
      { key: "creditAmount", label: "Total Credit", type: "number" },
      { key: "leftOverBalance", label: "Total Outstanding", type: "number" },
      { key: "creditBalance", label: "Credit Balance", type: "number" },
      { key: "groupCode", label: "Group Code" },
      { key: "currency", label: "Currency" },
    ],
    []
  );

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Function to fetch data with pagination
  const fetchCreditLimitReportWithPagination = async (
    filters = null,
    page = 1
  ) => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.accountCode && filters.accountCode.trim()) {
          params.append("accountCode", filters.accountCode.trim());
        }
        if (filters.customerName && filters.customerName.trim()) {
          params.append("customerName", filters.customerName.trim());
        }
      }

      // Add pagination parameters
      params.append("page", page.toString());
      params.append("limit", pageLimit.toString());

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const response = await axios.get(
        `${server}/credit-limit-report?${params.toString()}`
      );

      if (response.data.success) {
        setRowData(response.data.data);
        setTotalRecords(response.data.totalRecords);
        setGrandTotal(response.data.grandTotal);

        // Get pagination info
        const pagination = response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: response.data.totalRecords,
          limit: pageLimit,
        };

        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);

        // Calculate total credit balance for current page
        const creditBalanceSum = response.data.data.reduce((sum, record) => {
          return sum + (parseFloat(record.creditBalance) || 0);
        }, 0);
        setTotalCreditBalance(creditBalanceSum.toFixed(2));

        if (response.data.data.length === 0) {
          showNotification("info", "No records found");
        } else {
          showNotification(
            "success",
            `Fetched ${response.data.data.length} records (Page ${pagination.currentPage} of ${pagination.totalPages})`
          );
        }
      } else {
        console.error("Failed to fetch report:", response.data.error);
        setRowData([]);
        setTotalRecords(0);
        setGrandTotal("0.00");
        setTotalCreditBalance("0.00");
        showNotification("error", "Failed to fetch report");
      }
    } catch (error) {
      console.error("Error fetching credit limit report:", error);
      setRowData([]);
      setTotalRecords(0);
      setGrandTotal("0.00");
      setTotalCreditBalance("0.00");
      showNotification("error", `Error fetching report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load all data on component mount
  useEffect(() => {
    fetchCreditLimitReportWithPagination(null, 1);
  }, []);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;

    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Prepare filters
    const filters = {};
    if (customerCode && customerCode.trim()) {
      filters.accountCode = customerCode.trim();
    }
    if (customerName && customerName.trim()) {
      filters.customerName = customerName.trim();
    }

    // Fetch new page
    fetchCreditLimitReportWithPagination(filters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // Prepare filters
    const filters = {};
    if (customerCode && customerCode.trim()) {
      filters.accountCode = customerCode.trim();
    }
    if (customerName && customerName.trim()) {
      filters.customerName = customerName.trim();
    }

    // Reset to page 1 and fetch with new limit
    setCurrentPage(1);
    fetchCreditLimitReportWithPagination(
      Object.keys(filters).length > 0 ? filters : null,
      1
    );
  };

  // Handle show button click with filters
  const handleShow = () => {
    const filters = {};
    if (customerCode && customerCode.trim()) {
      filters.accountCode = customerCode.trim();
    }
    if (customerName && customerName.trim()) {
      filters.customerName = customerName.trim();
    }

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page with filters
    fetchCreditLimitReportWithPagination(
      Object.keys(filters).length > 0 ? filters : null,
      1
    );
  };

  // Handle refresh with complete reset
  const handleRefresh = () => {
    // Clear all states first
    setRowData([]);
    setTotalRecords(0);
    setGrandTotal("0.00");
    setTotalCreditBalance("0.00");

    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);

    // Increment form key to force complete remount
    setFormKey((prev) => prev + 1);

    // Reset form
    reset({
      Customer: "",
      name: "",
    });

    // Fetch all data again
    fetchCreditLimitReportWithPagination(null, 1);

    // Show refresh notification
    showNotification("success", "Page refreshed successfully");
  };

  // Escape key handler for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Handle print functionality
  const handlePrint = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to print");
      return;
    }

    const printStyles = `
      <style>
        @media print {
          * { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; }
          .print-container { width: 100%; }
          .print-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
          .print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .print-table th, .print-table td { border: 1px solid #000; padding: 4px; text-align: left; }
          .print-table th { background-color: #f0f0f0; font-weight: bold; }
          .print-footer { margin-top: 20px; display: flex; justify-content: space-between; font-weight: bold; }
          .no-print { display: none; }
        }
      </style>
    `;

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Credit Limit Report</title>
          ${printStyles}
        </head>
        <body>
          <div class="print-container">
            <h1 class="print-title">Credit Limit Report</h1>
            <table class="print-table">
              <thead>
                <tr>
                  ${columns.map((col) => `<th>${col.label}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${rowData
                  .map(
                    (row) => `
                  <tr>
                    ${columns
                      .map((col) => `<td>${row[col.key] || ""}</td>`)
                      .join("")}
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="print-footer">
              <div>Total Records: ${totalRecords}</div>
              <div>Total Credit: ${totalCreditBalance}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.print();
    showNotification("success", "Print dialog opened");
  };

  // Handle Excel download
  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = rowData.map((row) => {
        const formattedRow = {};
        columns.forEach((col) => {
          const value = row[col.key];
          if (col.type === "number" && typeof value === "number") {
            formattedRow[col.label] = value.toFixed(2);
          } else {
            formattedRow[col.label] = value !== null && value !== undefined ? value : "";
          }
        });
        return formattedRow;
      });

      // Add summary row
      const summaryRow = {};
      columns.forEach((col, index) => {
        if (index === 0) {
          summaryRow[col.label] = `Total Records: ${totalRecords}`;
        } else if (index === columns.length - 1) {
          summaryRow[col.label] = `Total Credit: ${totalCreditBalance}`;
        } else {
          summaryRow[col.label] = "";
        }
      });
      excelData.push(summaryRow);

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Credit Limit Report");

      // Save file
      XLSX.writeFile(
        wb,
        `credit-limit-report-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Error downloading Excel file");
    }
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Prepare CSV content
      const headers = columns.map((col) => col.label).join(",");
      const csvContent = rowData
        .map((row) => {
          return columns
            .map((col) => {
              const rawValue = row[col.key];
              let value = (col.type === "number" && typeof rawValue === "number")
                ? rawValue.toFixed(2)
                : (rawValue !== null && rawValue !== undefined ? rawValue : "");
              
              // Escape quotes and wrap in quotes if contains comma
              return typeof value === "string" && value.includes(",")
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            })
            .join(",");
        })
        .join("\n");

      // Add summary
      const summaryLine = `Total Records: ${totalRecords},,,,,,,,,,,,,,,,,,,Total Credit: ${totalCreditBalance}`;

      const fullCSV = `${headers}\n${csvContent}\n${summaryLine}`;

      // Create and download file
      const blob = new Blob([fullCSV], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `credit-limit-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("success", "CSV file downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Error downloading CSV file");
    }
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
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const code = watch("Customer");

    if (!code || code.length < 3) {
      setValue("name", "");
      return;
    }

    const fetchName = async () => {
      try {
        const res = await axios.get(
          `${server}/credit-summary-report?action=customer&accountCode=${code.toUpperCase()}`
        );

        if (res.data?.customerName) {
          setValue("name", res.data.customerName); // auto-fill
        } else {
          setValue("name", "");
        }
      } catch (err) {
        console.error("Error fetching customer name:", err);
        setValue("name", "");
      }
    };

    fetchName();
  }, [watch("Customer")]);

  return (
    <form className="flex flex-col gap-3" key={formKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title={`Credit Limit Report`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => setIsFullscreen(true)}
      />
      <div className="flex flex-col gap-3 mt-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="w-full">
              <InputBox
                key={`Customer-${formKey}`}
                placeholder={`Customer Code`}
                register={register}
                setValue={setValue}
                value={`Customer`}
                name="Customer"
              />
            </div>

            <div className="w-full">
              <InputBox
                key={`name-${formKey}`}
                placeholder={`Customer Name`}
                register={register}
                setValue={setValue}
                value={`name`}
                name="name"
                initialValue={watch("name") || ""}
              />
            </div>
            <div className="">
              <OutlinedButtonRed
                label={loading ? `Loading...` : `Show`}
                onClick={handleShow}
                disabled={loading}
                type="button"
              />
            </div>
            <div>
              <DownloadCsvExcel
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
              />
            </div>
          </div>
        </div>
      </div>
      <div ref={printRef}>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className={`border-b-0 rounded-b-none h-[45vh]`}
          loading={loading}
        />

        {/* Pagination Controls */}
        <PaginationControls />

        <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2">
          {/* Left side: Total Records */}
          <div>
            <span className="font-sans">Total Records: </span>
            <span className="text-red">{totalRecords}</span>
          </div>

          {/* Right side: Total Credit Balance */}
          <div>
            Total Credit: <span className="text-red">{totalCreditBalance}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Credit Limit Report - Fullscreen View
            </h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <TableWithSorting
              register={register}
              setValue={setValue}
              columns={columns}
              rowData={rowData}
              className="h-full w-full"
            />
          </div>
          <div className="flex justify-between items-center border-t border-gray-300 pt-4 mt-4">
            <div>
              <span className="font-sans font-semibold">Total Records: </span>
              <span className="text-red font-semibold">{totalRecords}</span>
            </div>
            <div>
              <span className="font-semibold">Total Credit: </span>
              <span className="text-red font-semibold">
                {totalCreditBalance}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed type="button" label={"Close"} /> */}</div>
        <div className="flex gap-2">
          {/* <OutlinedButtonRed 
            type="button" 
            label={"Print"} 
            onClick={handlePrint}
          /> */}
        </div>
      </div>
    </form>
  );
}

export default CreditLimitReport;