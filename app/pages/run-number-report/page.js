"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

const RunNumberReport = () => {
  const { register, setValue, watch, getValues } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const columns = [
    { key: "srNo", label: "Sr No." }, // Added Sr No column
    { key: "runNo", label: "Run No" },
    { key: "sector", label: "Sector" },
    { key: "date", label: "Date" },
    { key: "flight", label: "Flight" },
    { key: "flightNo", label: "Flight No" },
    { key: "counterPart", label: "Counter Part" },
    { key: "obc", label: "OBC" },
    { key: "almawb", label: "AL Mawb" },
    { key: "runWt", label: "Run Wt" },
    { key: "masterWt", label: "Master Wt" },
    { key: "diffWt", label: "Diff Wt" },
  ];

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Function to fetch data with pagination
  const fetchDataWithPagination = async (filters, page = 1) => {
    const fromDate = filters.from;
    const toDate = filters.to;
    const runNo = filters.runNo;

    // Validation - at least one filter must be provided
    if (!fromDate && !toDate && (!runNo || runNo.trim() === "")) {
      showNotification(
        "error",
        "Please provide at least one filter: Run Number or Date Range"
      );
      return;
    }

    // If dates are provided, validate them
    if ((fromDate || toDate) && !(fromDate && toDate)) {
      showNotification("error", "Please select both From and To dates");
      return;
    }

    if (fromDate && toDate && new Date(dmyToYmd(fromDate)) > new Date(dmyToYmd(toDate))) {
      showNotification("error", "From date cannot be after To date");
      return;
    }

    setLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();

      // Add date range if both dates are provided
      if (fromDate && toDate) {
        params.append("from", dmyToYmd(fromDate));
        params.append("to", dmyToYmd(toDate));
      }

      // Add runNo filter if provided
      if (runNo && runNo.trim() !== "") {
        params.append("runNo", runNo.trim().toUpperCase());
      }

      // Add pagination parameters
      params.append("page", page.toString());
      params.append("limit", pageLimit.toString());

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const response = await axios.get(
        `${server}/run-number-report?${params.toString()}`
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
          `Successfully fetched ${response.data.data.length} records (Page ${response.data.pagination?.currentPage || page} of ${response.data.pagination?.totalPages || 1})`
        );
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to fetch data"
        );
        setRowData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching run number report:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch report data"
      );
      setRowData([]);
      setTotalRecords(0);
      setTotalPages(1);
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
    fetchDataWithPagination(currentFilters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have current filters, refetch with new limit (reset to page 1)
    if (currentFilters) {
      setCurrentPage(1);
      fetchDataWithPagination(currentFilters, 1);
    }
  };

  const handleFetchData = async () => {
    const filters = {
      from: watch("from"),
      to: watch("to"),
      runNo: watch("runNo"),
    };

    // Store filters for pagination
    setCurrentFilters(filters);

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    await fetchDataWithPagination(filters, 1);
  };

  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("warning", "No data to download");
      return;
    }

    try {
      // Create CSV header
      const headers = columns.map((col) => col.label).join(",");

      // Create CSV rows
      const rows = rowData.map((row) =>
        columns
          .map((col) => {
            const value = row[col.key] || "";
            // Escape commas and quotes in values
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      );

      // Combine header and rows
      const csv = [headers, ...rows].join("\n");

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const fromDate = watch("from") || "all";
      const toDate = watch("to") || "all";
      const fileName = `run_number_report_${fromDate}_to_${toDate}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "CSV downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Failed to download CSV");
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
    <div className="flex flex-col gap-6">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading title="Run Number Report" bulkUploadBtn="hidden" />

      <div className="flex gap-3">
        <InputBox
          register={register}
          setValue={setValue}
          placeholder={`Run Number`}
          value={`runNo`}
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
            onClick={handleFetchData}
            disabled={loading}
          />
        </div>
        <div>
          <SimpleButton
            name="Download CSV"
            onClick={handleDownloadCSV}
            disabled={rowData.length === 0}
          />
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          name="bagging"
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

      <div className="flex justify-end"></div>
    </div>
  );
};

export default RunNumberReport;