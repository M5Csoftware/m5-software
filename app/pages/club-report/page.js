"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { X } from "lucide-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const ClubReport = () => {
  const { register, setValue, getValues } = useForm();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [resetFactor, setResetFactor] = useState(0);
  const [rowData, setRowData] = useState([]);
  const { server } = useContext(GlobalContext);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, visible: true });
  }, []);

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const columns = [
    { key: "srNo", label: "Sr No." }, // Added Sr No column
    { key: "awbNo", label: "Awb Number" },
    { key: "date", label: "Date" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "Destination" },
    { key: "shipperFullName", label: "Consignee Name" },
    { key: "clubNo", label: "Club Number" },
    { key: "bagNo", label: "Bag Number" },
    { key: "bag", label: "Bag Weight" },
    { key: "runNo", label: "Run Number" },
    { key: "alMawb", label: "Al Mawb Number" },
    { key: "forwarder", label: "Forwarder" },
    { key: "forwardingNo", label: "Forwarding Number" },
  ];

  // Function to fetch club report data with pagination
  const fetchClubReportWithPagination = async (filters, page = 1) => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      const { runNo, clubNo, from, to } = filters;

      if (!runNo && !clubNo && !from && !to) {
        showNotification("error", "Enter at least one filter");
        setIsLoading(false);
        return;
      }

      if (runNo) query.append("runNo", runNo);
      if (clubNo) query.append("clubNo", clubNo);
      if (from) query.append("from", dmyToYmd(from));
      if (to) query.append("to", dmyToYmd(to));
      
      // Add pagination parameters
      query.append("page", page.toString());
      query.append("limit", pageLimit.toString());

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const res = await fetch(`${server}/club-report?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Fetch failed");

      setRowData(data.shipments || []);
      
      // Set pagination info
      if (data.pagination) {
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalRecords(data.pagination.totalRecords);
      }

      showNotification(
        "success", 
        `Data loaded successfully (Page ${data.pagination?.currentPage || page} of ${data.pagination?.totalPages || 1})`
      );
    } catch (err) {
      showNotification("error", err.message);
      setRowData([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;

    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch new page
    fetchClubReportWithPagination(currentFilters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have current filters, refetch with new limit (reset to page 1)
    if (currentFilters) {
      setCurrentPage(1);
      fetchClubReportWithPagination(currentFilters, 1);
    }
  };

  const handleShow = async () => {
    const filters = {
      runNo: getValues("runNo"),
      clubNo: getValues("clubNo"),
      from: getValues("from"),
      to: getValues("to"),
    };

    // Store filters for pagination
    setCurrentFilters(filters);

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    await fetchClubReportWithPagination(filters, 1);
  };

  const handleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleRefresh = () => {
    setResetFactor((prev) => prev + 1);
    setRowData([]);
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    showNotification("success", "Page refreshed");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullScreen(false);
      if (e.key === "Enter") handleShow();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleShow]);

  const handleDownloadCSV = () => {
    if (!rowData.length) {
      showNotification("error", "No data to download");
      return;
    }

    // Create CSV header
    const headers = columns.map((col) => col.label).join(",");

    // Map rowData to CSV rows
    const rows = rowData.map((row) =>
      columns
        .map((col) => {
          let val = row[col.key];
          if (val === undefined || val === null) val = "";
          // Escape commas and quotes
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `club_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              disabled={isLoading}
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
            disabled={currentPage === 1 || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`Club Report`}
        bulkUploadBtn="hidden"
        fullscreenBtn
        onClickFullscreenBtn={handleFullScreen}
        onRefresh={handleRefresh}
        codeListBtn="hidden"
      />
      <div className="flex gap-3 mt-5">
        <InputBox
          register={register}
          setValue={setValue}
          value={`runNo`}
          placeholder={`Run Number`}
          resetFactor={resetFactor}
        />
        <InputBox
          register={register}
          setValue={setValue}
          value={`clubNo`}
          placeholder={`Club Number`}
          resetFactor={resetFactor}
        />
        <DateInputBox
          register={register}
          setValue={setValue}
          value={`from`}
          placeholder="From"
          resetFactor={resetFactor}
        />
        <DateInputBox
          register={register}
          setValue={setValue}
          value={`to`}
          placeholder="To"
          resetFactor={resetFactor}
        />
        <div>
          <OutlinedButtonRed 
            label={isLoading ? "Loading..." : "Show"} 
            onClick={handleShow}
            disabled={isLoading}
          />
        </div>
        <div>
          <SimpleButton 
            name={`Download CSV`} 
            onClick={handleDownloadCSV}
            disabled={!rowData.length || isLoading}
          />
        </div>
      </div>

      <div>
        <TableWithSorting
          setValue={setValue}
          register={register}
          rowData={rowData}
          columns={columns}
          className={`h-[55vh]`}
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

        {isFullScreen && (
          <div className="fixed inset-0 z-50 p-10 bg-white">
            <div className="flex justify-between items-center mb-2 mx-1">
              <Heading
                title={`Sales Details`}
                codeListBtn="hidden"
                bulkUploadBtn="hidden"
                refreshBtn="hidden"
              />
              <X
                onClick={() => setIsFullScreen(false)}
                className="cursor-pointer text-black"
              />
            </div>

            <div className="h-full mb-20">
              <TableWithSorting
                register={register}
                setValue={setValue}
                name="refShipper"
                columns={columns}
                rowData={rowData}
                className={"h-[85vh]"}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed label={`Close`} /> */}</div>
      </div>
    </div>
  );
};

export default ClubReport;