"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  InputBoxYellow,
} from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import * as XLSX from "xlsx";

const RtoShipmentReport = () => {
  const { register, setValue, watch, getValues } = useForm();
  const { server } = useContext(GlobalContext);

  // Data states
  const [tableData, setTableData] = useState([]);
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
  const [pageLimit, setPageLimit] = useState(30); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  // Add Sr No column to the columns array
  const columns = useMemo(
    () => [
      { key: "srNo", label: "Sr No." },
      { key: "awbNo", label: "AWB No" },
      { key: "date", label: "Shipment Date" },
      { key: "branch", label: "Branch" },
      { key: "origin", label: "Origin" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "accountCode", label: "Customer Code" },
      { key: "name", label: "Customer Name" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "receiverAddressLine1", label: "Consignee Address" },
      { key: "pcs", label: "PCS" },
      { key: "goodstype", label: "Goods Description" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "content", label: "Shipment Content" },
      { key: "shipmentRemark", label: "Shipment Remark" },
    ],
    []
  );

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Watch accountCode for auto-population
  const accountCode = watch("code");

  // Show notification helper
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Fetch customer name when account code changes
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (!accountCode || accountCode.length < 3) {
        setCustomerName("");
        setValue("name", "");
        return;
      }

      try {
        const res = await axios.post(`${server}/rto-shipment-report`, {
          accountCode: accountCode.trim(),
        });

        if (res.data.success) {
          setCustomerName(res.data.data.name);
          setValue("name", res.data.data.name);
        } else {
          setCustomerName("");
          setValue("name", "");
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
        setCustomerName("");
        setValue("name", "");
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchCustomerName, 500);
    return () => clearTimeout(timeoutId);
  }, [accountCode, server, setValue]);

  // Function to fetch shipments with pagination
  const fetchShipmentsWithPagination = async (filters, page = 1) => {
    setLoading(true);

    try {
      // Get form values from filters
      const branch = filters.branch || "";
      const origin = filters.origin || "";
      const sector = filters.sector || "";
      const destination = filters.destination || "";
      const code = filters.code || "";
      const from = filters.from || "";
      const to = filters.to || "";

      // Check if dates are mandatory based on specific filters
      const mandatoryPresence = !!(
        branch ||
        sector ||
        code ||
        destination
      );
      const optionalPresence = !!(origin);

      if (optionalPresence) {
      // Dates are optional
    } else if (mandatoryPresence) {
      if (!from  || !to) {

          showNotification(
            "error",
            "From and To dates are required for specific filter searches.",
          );
          setLoading(false);
          return;
      }
    } else if (!from || !to) {
        // General behavior: require dates
        showNotification("error", "Please select From and To dates");
        setLoading(false);
        return;
      }

      // Validate date range
      if (from && to && new Date(dmyToYmd(from)) > new Date(dmyToYmd(to))) {
        showNotification("error", "'From' date cannot be later than 'To' date");
        setLoading(false);
        return;
      }

      // Build query string
      const params = new URLSearchParams();

      if (branch) params.append("branch", branch);
      if (origin) params.append("origin", origin);
      if (sector) params.append("sector", sector);
      if (destination) params.append("destination", destination);
      if (code) params.append("accountCode", code);
      if (from) params.append("from", dmyToYmd(from));
      if (to) params.append("to", dmyToYmd(to));
      
      // Add pagination parameters
      params.append("page", page.toString());
      params.append("limit", pageLimit.toString());

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const res = await axios.get(
        `${server}/rto-shipment-report?${params.toString()}`
      );

      if (res.data.success) {
        setTableData(res.data.data || []);
        
        // Set pagination info
        if (res.data.pagination) {
          setCurrentPage(res.data.pagination.currentPage);
          setTotalPages(res.data.pagination.totalPages);
          setTotalRecords(res.data.pagination.totalRecords);
        }

        if (res.data.data.length === 0) {
          showNotification("info", "No shipments found for the given criteria");
        } else {
          showNotification(
            "success",
            `Successfully loaded ${res.data.data.length} shipment(s) (Page ${res.data.pagination?.currentPage || page} of ${res.data.pagination?.totalPages || 1})`
          );
        }
      } else {
        showNotification("error", res.data.message || "Failed to fetch data");
        setTableData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Error fetching shipments:", err);
      showNotification(
        "error",
        err.response?.data?.message || "Failed to fetch data"
      );
      setTableData([]);
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
    fetchShipmentsWithPagination(currentFilters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have current filters, refetch with new limit (reset to page 1)
    if (currentFilters) {
      setCurrentPage(1);
      fetchShipmentsWithPagination(currentFilters, 1);
    }
  };

  const fetchShipments = async () => {
    // Get current form values
    const filters = {
      branch: watch("branch") || "",
      origin: watch("origin") || "",
      sector: watch("sector") || "",
      destination: watch("destination") || "",
      code: watch("code") || "",
      from: watch("from") || "",
      to: watch("to") || "",
    };

    // Store filters for pagination
    setCurrentFilters(filters);

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    await fetchShipmentsWithPagination(filters, 1);
  };

  // Download Excel
  const handleDownload = () => {
    if (tableData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = tableData.map((row) => ({
        "Sr No.": row.srNo,
        "AWB No": row.awbNo,
        "Shipment Date": row.date,
        Branch: row.branch,
        Origin: row.origin,
        Sector: row.sector,
        Destination: row.destination,
        "Customer Code": row.accountCode,
        "Customer Name": row.name,
        "Consignee Name": row.receiverFullName,
        "Consignee Address": row.receiverAddressLine1,
        PCS: row.pcs,
        "Goods Description": row.goodstype,
        "Actual Weight": row.totalActualWt,
        "Shipment Content": row.content,
        "Shipment Remark": row.shipmentRemark,
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "RTO Shipment Report");

      // Set column widths
      const colWidths = [
        { wch: 8 },  // Sr No.
        { wch: 15 }, // AWB No
        { wch: 15 }, // Shipment Date
        { wch: 15 }, // Branch
        { wch: 12 }, // Origin
        { wch: 12 }, // Sector
        { wch: 15 }, // Destination
        { wch: 15 }, // Customer Code
        { wch: 25 }, // Customer Name
        { wch: 25 }, // Consignee Name
        { wch: 35 }, // Consignee Address
        { wch: 8 },  // PCS
        { wch: 20 }, // Goods Description
        { wch: 15 }, // Actual Weight
        { wch: 25 }, // Shipment Content
        { wch: 25 }, // Shipment Remark
      ];
      ws["!cols"] = colWidths;

      // Generate filename with current date
      const filename = `RTO_Shipment_Report_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      showNotification("error", "Failed to download the report");
    }
  };

  // Close/Reset
  const handleClose = () => {
    setValue("branch", "");
    setValue("origin", "");
    setValue("sector", "");
    setValue("destination", "");
    setValue("code", "");
    setValue("name", "");
    setValue("from", "");
    setValue("to", "");
    setTableData([]);
    setCustomerName("");
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1 && tableData.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{tableData.length}</span> of{" "}
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
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
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
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading title="RTO Shipment Report" bulkUploadBtn="hidden" codeListBtn />

      <div className="flex flex-col gap-3">
        {/* First Row - Branch, Origin, Sector, Destination */}
        <div className="flex gap-3 w-full">
          <InputBox
            placeholder="Branch"
            register={register}
            setValue={setValue}
            value="branch"
          />
          <InputBox
            placeholder="Origin"
            register={register}
            setValue={setValue}
            value="origin"
          />
          <InputBox
            placeholder="Sector"
            register={register}
            setValue={setValue}
            value="sector"
          />
          <InputBox
            placeholder="Destination"
            register={register}
            setValue={setValue}
            value="destination"
          />
        </div>

        {/* Second Row - Code, Customer Name, From Date, To Date, Buttons */}
        <div className="flex gap-3 w-full justify-between items-center">
          <div className="flex gap-3 flex-1">
            <div className="w-[27%]">
            <InputBox
              placeholder="Code"
              register={register}
              setValue={setValue}
              value="code"
            />
            </div>
            <div className="w-[69%]">
            <DummyInputBoxWithLabelDarkGray
              register={register}
              label="Customer Name"
              setValue={setValue}
              value="name"
            />
            </div>
            <DateInputBox
              placeholder="From"
              register={register}
              setValue={setValue}
              value="from"
              type="date"
            />
            <DateInputBox
              placeholder="To"
              register={register}
              setValue={setValue}
              value="to"
              type="date"
            />
          </div>
          
          <div className="flex gap-3 w-[24%]">
            <OutlinedButtonRed
              label={loading ? "Loading..." : "Show"}
              onClick={fetchShipments}
              type="button"
              disabled={loading}
            />
            <SimpleButton
              name="Download"
              onClick={handleDownload}
              type="button"
              disabled={tableData.length === 0}
            />
          </div>
        </div>

        {/* Data Table */}
        <TableWithSorting
          columns={columns}
          rowData={tableData}
          register={register}
          setValue={setValue}
          name="rtoShipmentReport"
          className="h-[45vh]"
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
    </div>
  );
};

export default RtoShipmentReport;