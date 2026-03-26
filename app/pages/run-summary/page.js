"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function RunSummary() {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();
  const [rowData, setRowData] = useState([]);
  const [checked, setChecked] = useState(false);
  const [resetFactor, setResetFactor] = useState(false);
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

  const parseDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const [d, m, y] = dateStr.split("/");
    return new Date(y, m - 1, d);
  };

  const runNumber = watch("runNumber");
  const fromDate = watch("from");
  const toDate = watch("to");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleRefresh = () => {
    setResetFactor(!resetFactor);
    setChecked(false);
    setRowData([]);
    setValue("runNumber", "");
    setValue("from", "");
    setValue("to", "");
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
  };

  // Determine which filter is active
  const isRunNumberActive = runNumber && runNumber.trim() !== "";
  const isDateRangeActive =
    (fromDate && fromDate !== "") || (toDate && toDate !== "");
  const isAllActive = checked;

  const columns = [
    { key: "runNo", label: "Run No." },
    { key: "flightDate", label: "Flight Date" },
    { key: "alMawb", label: "AL MAWB" },
    { key: "obc", label: "OBC" },
    { key: "flight", label: "Flight" },
    { key: "counterPart", label: "Counter Part" },
    { key: "countBag", label: "Count Bag" },
    { key: "countAwb", label: "Count AWB" },
    { key: "bagWeight", label: "Bag Weight" },
    { key: "totalActualWt", label: "Total Actual Weight" },
    { key: "chargableWt", label: "Chargable Weight" },
  ];

  // Function to fetch data with pagination
  const fetchDataWithPagination = async (filters, page = 1) => {
    setLoading(true);
    setRowData([]);

    try {
      let url = `${server}/run-summary`;
      const params = new URLSearchParams();

      const filterType = filters.filterType;
      const runNumber = filters.runNumber;
      const fromDate = filters.fromDate;
      const toDate = filters.toDate;

      if (filterType === "runNumber") {
        // Fetch specific run number
        params.append("runNo", runNumber.toUpperCase());
      } else if (filterType === "all") {
        // Fetch all data - need to provide a wide date range
        const startDate = new Date("2000-01-01").toISOString().split("T")[0];
        const endDate = new Date().toISOString().split("T")[0];
        params.append("fromDate", startDate);
        params.append("toDate", endDate);
      } else if (filterType === "dateRange") {
        params.append("fromDate", fromDate);
        params.append("toDate", toDate);
      }

      // Add pagination parameters
      params.append("page", page.toString());
      params.append("limit", pageLimit.toString());

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const response = await axios.get(`${url}?${params.toString()}`);

      // console.log("API Response:", response.data);

      if (response.data.success) {
        const fetchedData = response.data.data || [];
        const pagination = response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: fetchedData.length,
          limit: pageLimit,
        };

        console.log("Fetched data:", fetchedData);

        const formattedData = fetchedData.map((row) => {
          const newRow = { ...row };
          Object.keys(newRow).forEach((key) => {
            if (key === "flightDate") {
              newRow[key] = toDDMMYYYY(newRow[key]);
            } else if (typeof newRow[key] === "number") {
              newRow[key] = newRow[key].toFixed(2);
            }
          });
          return newRow;
        });

        setRowData(formattedData);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);
        
        showNotification(
          "success", 
          `Found ${fetchedData.length} records (Page ${pagination.currentPage} of ${pagination.totalPages})`
        );
      } else {
        showNotification("error", response.data.message || "No data found");
        setRowData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch data"
      );
      setRowData([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleShow = async () => {
    // Determine which filter is being used
    let filterType = null;
    let filterParams = {};

    if (isRunNumberActive) {
      filterType = "runNumber";
      filterParams = { runNumber };
    } else if (isAllActive) {
      filterType = "all";
    } else if (isDateRangeActive) {
      filterType = "dateRange";
      
      const fromParsed = parseDateDDMMYYYY(fromDate);
      const toParsed = parseDateDDMMYYYY(toDate);

      if (
        !fromParsed ||
        !toParsed ||
        isNaN(fromParsed.getTime()) ||
        isNaN(toParsed.getTime())
      ) {
        showNotification("error", "Invalid date");
        return;
      }

      fromParsed.setHours(0, 0, 0, 0);
      toParsed.setHours(23, 59, 59, 999);

      filterParams.fromDate = fromParsed.toISOString();
      filterParams.toDate = toParsed.toISOString();
    }

    // Validate based on filter type
    if (filterType === "runNumber") {
      if (!runNumber || runNumber.trim() === "") {
        showNotification("error", "Please enter a Run Number");
        return;
      }
    } else if (filterType === "dateRange") {
      if (!fromDate || !toDate) {
        showNotification("error", "Please select both From and To dates");
        return;
      }
    } else if (filterType === null) {
      showNotification("error", "Please select a filter option");
      return;
    }

    // Store filters for pagination
    setCurrentFilters({
      filterType,
      ...filterParams,
    });
    
    // Reset to page 1 for new search
    setCurrentPage(1);
    
    // Fetch first page
    await fetchDataWithPagination(
      {
        filterType,
        ...filterParams,
      },
      1
    );
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

  const toDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDownloadPDF = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const doc = new jsPDF("landscape");

      doc.setFontSize(16);
      doc.text("Run Summary Report", 14, 15);

      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);

      const tableColumn = columns.map((col) => col.label);
      const tableRows = rowData.map((row) =>
        columns.map((col) => {
          const value = row[col.key];
          return value !== null && value !== undefined ? String(value) : "";
        })
      );

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 38, 38] },
        margin: { left: 5, right: 5 },
      });

      doc.save(`Run_Summary_${new Date().getTime()}.pdf`);
      showNotification("success", "PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("error", `Failed to generate PDF: ${error.message}`);
    }
  };

  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const data = rowData.map((row) => {
        const formattedRow = {};
        columns.forEach((col) => {
          formattedRow[col.label] = row[col.key] || "";
        });
        return formattedRow;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const colWidths = columns.map(() => ({ wch: 20 }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Run Summary");

      XLSX.writeFile(wb, `Run_Summary_${new Date().getTime()}.xlsx`);
      showNotification("success", "Excel downloaded successfully");
    } catch (error) {
      console.error("Error generating Excel:", error);
      showNotification("error", `Failed to generate Excel: ${error.message}`);
    }
  };

  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const headers = columns.map((col) => col.label).join(",");
      const csvRows = rowData.map((row) =>
        columns
          .map((col) => {
            const value = row[col.key] || "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      );

      const csvContent = [headers, ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `Run_Summary_${new Date().getTime()}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "CSV downloaded successfully");
    } catch (error) {
      console.error("Error generating CSV:", error);
      showNotification("error", `Failed to generate CSV: ${error.message}`);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (newChecked) => {
    setChecked(newChecked);
    if (newChecked) {
      // Clear other filters when ALL is checked
      setValue("runNumber", "");
      setValue("from", "");
      setValue("to", "");
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
    <form className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title={`Run Summary`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={false}
      />

      <div className="flex flex-col gap-3 mt-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <InputBox
              placeholder={`Run Number`}
              register={register}
              setValue={setValue}
              value={`runNumber`}
              disabled={isAllActive || isDateRangeActive}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <RedCheckbox
            register={register}
            setValue={setValue}
            value="active"
            label="ALL"
            id={`checkBox`}
            isChecked={checked}
            setChecked={handleCheckboxChange}
            disabled={isRunNumberActive || isDateRangeActive}
          />
          <DateInputBox
            register={register}
            setValue={setValue}
            value="from"
            placeholder="From"
            resetFactor={resetFactor}
            disabled={isRunNumberActive || isAllActive}
          />
          <DateInputBox
            register={register}
            setValue={setValue}
            value="to"
            placeholder="To"
            resetFactor={resetFactor}
            disabled={isRunNumberActive || isAllActive}
          />
          <div className="flex gap-2">
            <OutlinedButtonRed
              type="button"
              label={loading ? "Loading..." : "Show"}
              onClick={handleShow}
              disabled={loading}
            />
            <DownloadDropdown
              handleDownloadPDF={handleDownloadPDF}
              handleDownloadExcel={handleDownloadExcel}
              handleDownloadCSV={handleDownloadCSV}
            />
          </div>
          <div className="flex justify-end">
            <div className="flex gap-2">
              <DownloadDropdown
                handleDownloadPDF={handleDownloadPDF}
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
          className={`h-[45vh]`}
        />
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
      </div>
    </form>
  );
}

export default RunSummary;