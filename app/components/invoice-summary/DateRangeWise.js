"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import DownloadCsvExcel from "../DownloadCsvExcel";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { LabeledDropdown } from "../Dropdown";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";
import * as XLSX from "xlsx";
import { GlobalContext } from "@/app/lib/GlobalContext";

function DateRangeWise() {
  const { register, setValue, watch, getValues } = useForm();
  const { server } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
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
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  // Watch customer input for auto-population
  const customerCode = watch("Customer");
  const selectedBranch = watch("branch");
  const fromDate = watch("from");
  const toDate = watch("to");

  const columns = useMemo(
    () => [
      { key: "srNo", label: "SR No" },
      { key: "invoiceNo", label: "Invoice No" },
      { key: "invoiceDate", label: "Invoice Date" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "gstNo", label: "GST No" },
      { key: "branch", label: "Branch" },
      { key: "salePerson", label: "Sale Person Name" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
      { key: "nonTaxable", label: "Non Taxable" },
      { key: "basicAmount", label: "Basic Amount" },
      { key: "miscAmount", label: "Misc Amount" },
      { key: "fuel", label: "Fuel" },
      { key: "taxable", label: "Taxable" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "grandTotal", label: "Grand Total" },
      { key: "irn", label: "IRN" },
    ],
    []
  );

  const showNotification = (type, message) => {
    setNotification({ visible: true, type, message });
  };

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch customer name when account code changes
  useEffect(() => {
    if (customerCode && customerCode.trim().length > 0) {
      fetchCustomerName(customerCode.trim());
    } else {
      setCustomerName("");
      setValue("name", "");
    }
  }, [customerCode]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${server}/branch-master`);
      if (response.data && Array.isArray(response.data)) {
        // Create array of branch codes
        const branchOptions = response.data.map((branch) => `${branch.code}`);
        setBranches(branchOptions);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      showNotification("error", "Failed to fetch branches");
    }
  };

  const fetchCustomerName = async (code) => {
    try {
      const response = await axios.get(
        `${server}/customer-account?accountCode=${code}`
      );
      if (response.data && response.data.name) {
        const name = response.data.name;
        setCustomerName(name);
        setValue("name", name);
      }
    } catch (error) {
      console.error("Error fetching customer name:", error);
      setCustomerName("");
      setValue("name", "");
      if (error.response?.status !== 404) {
        showNotification("error", "Failed to fetch customer details");
      }
    }
  };

  // Function to fetch invoice summary with pagination
  const fetchInvoiceSummaryWithPagination = async (filters, page = 1) => {
    setLoading(true);
    try {
      const { fromDate, toDate, selectedBranch, customerCode } = filters;

      if (!fromDate || !toDate) {
        showNotification("error", "Please select from and to dates");
        setLoading(false);
        return;
      }

      const fromParsed = parseDateDDMMYYYY(fromDate);
      const toParsed = parseDateDDMMYYYY(toDate);

      if (
        !fromParsed ||
        !toParsed ||
        isNaN(fromParsed.getTime()) ||
        isNaN(toParsed.getTime())
      ) {
        showNotification("error", "Invalid date format");
        setLoading(false);
        return;
      }

      fromParsed.setHours(0, 0, 0, 0);
      toParsed.setHours(23, 59, 59, 999);

      const params = new URLSearchParams({
        fromDate: fromParsed.toISOString(),
        toDate: toParsed.toISOString(),
      });

      if (selectedBranch) {
        // Extract branch code if format is "CODE - Name", otherwise use as is
        const branchCode = selectedBranch.split(" - ")[0];
        params.append("branch", branchCode);
      }

      if (customerCode && customerCode.trim()) {
        params.append("accountCode", customerCode.trim());
      }

      // Add pagination parameters
      params.append("page", page.toString());
      params.append("limit", pageLimit.toString());

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const response = await axios.get(
        `${server}/invoice-summary?${params.toString()}`
      );

      if (response.data.success) {
        setRowData(response.data.data);
        
        // Set pagination info
        if (response.data.pagination) {
          setCurrentPage(response.data.pagination.currentPage);
          setTotalPages(response.data.pagination.totalPages);
          setTotalRecords(response.data.pagination.totalRecords);
        }

        showNotification(
          "success",
          `Found ${response.data.data.length} invoice(s) (Page ${response.data.pagination?.currentPage || page} of ${response.data.pagination?.totalPages || 1})`
        );
      } else {
        setRowData([]);
        setTotalRecords(0);
        setTotalPages(1);
        showNotification(
          "error",
          response.data.message || "No data found"
        );
      }
    } catch (error) {
      console.error("Error fetching invoice summary:", error);
      setRowData([]);
      setTotalRecords(0);
      setTotalPages(1);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;

    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch new page
    fetchInvoiceSummaryWithPagination(currentFilters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have current filters, refetch with new limit (reset to page 1)
    if (currentFilters) {
      setCurrentPage(1);
      fetchInvoiceSummaryWithPagination(currentFilters, 1);
    }
  };

  const handleShow = async (e) => {
    e.preventDefault();

    // Store filters for pagination
    setCurrentFilters({
      fromDate,
      toDate,
      selectedBranch,
      customerCode,
    });

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    await fetchInvoiceSummaryWithPagination({
      fromDate,
      toDate,
      selectedBranch,
      customerCode,
    }, 1);
  };

  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    // Create CSV header
    const headers = columns.map((col) => col.label).join(",");

    // Create CSV rows
    const rows = rowData.map((row) => {
      return columns
        .map((col) => {
          const value = row[col.key] || "";
          // Escape values containing commas or quotes
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

    // Combine header and rows
    const csvContent = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `invoice_summary_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("success", "CSV downloaded successfully");
  };

  const handleDownloadExcel = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    // Create worksheet data with headers
    const wsData = [
      columns.map((col) => col.label),
      ...rowData.map((row) => columns.map((col) => row[col.key] || "")),
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.label.length, 15),
    }));
    ws["!cols"] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Summary");

    // Download
    XLSX.writeFile(wb, `invoice_summary_${new Date().getTime()}.xlsx`);

    showNotification("success", "Excel downloaded successfully");
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
            disabled={currentPage === 1 || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading || !currentFilters}
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

      <form className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <LabeledDropdown
                options={branches}
                value="branch"
                title={`Branch`}
                register={register}
                setValue={setValue}
              />
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
                disabled={true}
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
                  label={loading ? "Loading..." : "Show"}
                  onClick={handleShow}
                  disabled={loading}
                />
              </div>
              <div className="">
                <DownloadCsvExcel
                  handleDownloadExcel={handleDownloadExcel}
                  handleDownloadCSV={handleDownloadCSV}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={rowData}
            className="h-[450px]"
          />
          
          {/* Pagination Controls */}
          <PaginationControls />

          {/* Total Records Display */}
          <div className="flex justify-between mt-2">
            <div className="text-sm text-gray-600">
              {totalRecords > 0 && (
                <span>Total Records: {totalRecords}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div></div>
        </div>
      </form>
    </>
  );
}

export default DateRangeWise;