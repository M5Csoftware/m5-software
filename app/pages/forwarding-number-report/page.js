"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithSorting } from "@/app/components/Table";
import { X } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import NotificationFlag from "@/app/components/Notificationflag";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ForwardingNumberReport = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, getValues, reset } = useForm();
  const [dateFormat, setdateFormat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [ForwardingReportReset, setForwardingReportReset] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "error",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination
  const [isLoading, setIsLoading] = useState(false);

  const contentRef = useRef(null);

  // Updated columns to include parent/child info
  const columns = [
    { key: "awbNo", label: "AwbNo" },
    { key: "parentAwbNo", label: "Parent AWB" },
    { key: "createdAt", label: "ShipmentDate" },
    { key: "runNo", label: "RunNo" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "DestinationName" },
    { key: "accountCode", label: "CustomerCode" },
    { key: "customer", label: "CustomerName" },
    { key: "receiverFullName", label: "ConsigneeName" },
    { key: "service", label: "ServiceType" },
    { key: "upsService", label: "UPSService" },
    { key: "forwarder", label: "ShipmentForwarderTo" },
    { key: "forwardingNo", label: "ShipmentForwardingNo" },
  ];

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const handleDownloadPDF = async () => {
    if (!shipments.length) {
      setNotification({
        visible: true,
        message: "No data available to download",
        type: "error",
      });
      return;
    }

    const input = contentRef.current;
    if (!input) return;

    input.style.visibility = "visible";
    input.style.position = "static";

    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "letter");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    input.style.visibility = "hidden";
    input.style.position = "absolute";

    pdf.save(
      `Forwarding_Number_Report_${new Date().toISOString().slice(0, 10)}.pdf`
    );

    setNotification({
      visible: true,
      message: "PDF downloaded successfully",
      type: "success",
    });
  };

  const handleDownloadExcel = () => {
    if (!shipments.length) {
      setNotification({
        visible: true,
        message: "No data available to download",
        type: "error",
      });
      return;
    }

    // Prepare data for export - flatten nested objects if needed
    const exportData = shipments.map((item) => ({
      AwbNo: item.awbNo || "",
      ParentAWB: item.parentAwbNo || "",
      ShipmentDate: item.createdAt || "",
      RunNo: item.runNo || "",
      Sector: item.sector || "",
      DestinationName: item.destination || "",
      CustomerCode: item.accountCode || "",
      CustomerName: item.customer || "",
      ConsigneeName: item.receiverFullName || "",
      ServiceType: item.service || "",
      UPSService: item.upsService || "",
      ShipmentForwarderTo: item.forwarder || "",
      ShipmentForwardingNo: item.forwardingNo || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ForwardingReport");
    XLSX.writeFile(
      wb,
      `Forwarding_Number_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    setNotification({
      visible: true,
      message: "Excel file downloaded successfully",
      type: "success",
    });
  };

  const handleDownloadCSV = () => {
    if (!shipments.length) {
      setNotification({
        visible: true,
        message: "No data available to download",
        type: "error",
      });
      return;
    }

    const headers = [
      "AwbNo",
      "Parent AWB",
      "ShipmentDate",
      "RunNo",
      "Sector",
      "DestinationName",
      "CustomerCode",
      "CustomerName",
      "ConsigneeName",
      "ServiceType",
      "UPSService",
      "ShipmentForwarderTo",
      "ShipmentForwardingNo",
    ];

    const csvRows = shipments.map((item) => [
      item.awbNo || "",
      item.parentAwbNo || "",
      item.createdAt || "",
      item.runNo || "",
      item.sector || "",
      item.destination || "",
      item.accountCode || "",
      item.customer || "",
      item.receiverFullName || "",
      item.service || "",
      item.upsService || "",
      item.forwarder || "",
      item.forwardingNo || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(
      blob,
      `Forwarding_Number_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );

    setNotification({
      visible: true,
      message: "CSV file downloaded successfully",
      type: "success",
    });
  };

  // Function to fetch shipments with pagination
  const fetchShipmentsWithPagination = async (filters, page = 1) => {
    setIsLoading(true);
    
    try {
      // Check if dates are mandatory based on specific filters
      const mandatoryPresence = !!(
        filters.branch ||
        filters.sector ||
        filters.code ||
        filters.counterPart ||
        filters.destination ||
        filters.service ||
        filters.network
      );
      const optionalPresence = !!(filters.runNumber || filters.origin);

      if (optionalPresence) {
      // Dates are optional
    } else if (mandatoryPresence) {
      if (!filters.from  || !filters.to) {

          setNotification({
            visible: true,
            message: "From and To dates are required for specific filter searches.",
            type: "error",
          });
          setShipments([]);
          setIsLoading(false);
          return;
      }
    } else {
        // Check if at least one filter is provided
        const hasFilter = Object.keys(filters).some(
          (key) => filters[key] && filters[key].toString().trim() !== ""
        );
        if (!hasFilter) {
          setNotification({
            visible: true,
            message: "Please select at least one filter",
            type: "error",
          });
          setShipments([]);
          setIsLoading(false);
          return;
        }
        
        // If they provided some other filter (not mandatory/optional lists), 
        // we should check if dates are needed. 
        // For ForwardingNumberReport, the rule is "at least one filter".
        // So if they provided a filter not in our mandatory/optional lists, we let it through.
      }
      
      let fromParsed = null;
      let toParsed = null;
      
      if (filters.from && filters.to) {
        fromParsed = parseDateDDMMYYYY(filters.from);
        toParsed = parseDateDDMMYYYY(filters.to);
        
        if (fromParsed && toParsed && !isNaN(fromParsed.getTime()) && !isNaN(toParsed.getTime())) {
          fromParsed.setHours(0, 0, 0, 0);
          toParsed.setHours(23, 59, 59, 999);
          filters.from = fromParsed.toISOString();
          filters.to = toParsed.toISOString();
        } else {
          setNotification({
            visible: true,
            message: "Invalid date format",
            type: "error",
          });
          setShipments([]);
          setIsLoading(false);
          return;
        }
      }

      // Build filtered object with normalization
      const normalizedFilters = {
        ...filters,
        runNumber: filters.runNumber?.toUpperCase(),
        branch: filters.branch?.toUpperCase(),
        origin: filters.origin?.toUpperCase(),
        sector: filters.sector?.toUpperCase(),
        counterPart: filters.counterPart?.toUpperCase(),
        destination: filters.destination?.toUpperCase(),
        service: filters.service?.toUpperCase(),
        network: filters.network?.toUpperCase(),
        code: filters.code?.toUpperCase(),
        // Add pagination parameters
        page,
        limit: pageLimit,
      };

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      // ✅ Use the new endpoint for forwarding report
      const res = await axios.post(
        `${server}/shipment-status/forwarding-no-report`,
        normalizedFilters
      );

      // Handle response with pagination
      const shipmentsData = res.data.data || [];
      const pagination = res.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: shipmentsData.length,
        limit: pageLimit,
      };

      if (!shipmentsData || shipmentsData.length === 0) {
        setNotification({
          visible: true,
          message: "No shipments found for the given filters",
          type: "error",
        });
        setShipments([]);
      } else {
        setNotification({
          visible: true,
          message: `${shipmentsData.length} shipments found (Page ${pagination.currentPage} of ${pagination.totalPages})`,
          type: "success",
        });
        setShipments(shipmentsData);
      }

      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);
    } catch (err) {
      setNotification({
        visible: true,
        message: `Error fetching shipments: ${err.message}`,
        type: "error",
      });
      setShipments([]);
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

  const fetchShipments = async (e) => {
    if (e) e.preventDefault();
    
    const filters = getValues();
    
    // Store filters for pagination
    setCurrentFilters(filters);
    
    // Reset to page 1 for new search
    setCurrentPage(1);
    
    // Fetch first page
    await fetchShipmentsWithPagination(filters, 1);
  };

  const handleRefresh = () => {
    setForwardingReportReset(!ForwardingReportReset);
    setShipments([]);
    reset();
    setdateFormat(false);
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1 && shipments.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{shipments.length}</span> of{" "}
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
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <form className="flex flex-col gap-9" onSubmit={fetchShipments}>
        <Heading
          title="Forwarding Number Report"
          bulkUploadBtn="hidden"
          fullscreenBtn={true}
          onClickFullscreenBtn={() => setIsFullscreen(true)}
          codeListBtn="hidden"
          onRefresh={handleRefresh}
        />
        <div className="flex flex-col gap-3">
          {/* Filters */}
          <div className="flex gap-2">
            <InputBox
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              value="runNumber"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              value="branch"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              value="origin"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              value="sector"
              resetFactor={ForwardingReportReset}
            />
          </div>

          <div className="flex gap-2">
            <InputBox
              placeholder="Counter Part"
              register={register}
              setValue={setValue}
              value="counterPart"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Destination"
              register={register}
              setValue={setValue}
              value="destination"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Service"
              register={register}
              setValue={setValue}
              value="service"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Network"
              register={register}
              setValue={setValue}
              value="network"
              resetFactor={ForwardingReportReset}
            />
          </div>

          <div className="flex gap-2 items-center">
            <div className="w-[350px]">
              <InputBox
                placeholder="Code"
                register={register}
                setValue={setValue}
                value="code"
                resetFactor={ForwardingReportReset}
              />
            </div>
            <InputBox
              placeholder="Client"
              register={register}
              setValue={setValue}
              value="client"
              resetFactor={ForwardingReportReset}
            />
            <div className="w-[250px]">
              <RedCheckbox
                isChecked={dateFormat}
                setChecked={setdateFormat}
                id="singleForwarding"
                register={register}
                setValue={setValue}
                value="singleForwarding"
                label="Single Forwarding No."
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="w-full flex gap-2">
              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                value="from"
                resetFactor={ForwardingReportReset}
              />
              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                value="to"
                resetFactor={ForwardingReportReset}
              />
            </div>
            <div className="flex gap-2">
              <OutlinedButtonRed 
                label={isLoading ? "Loading..." : "Show"} 
                type="submit"
                disabled={isLoading}
              />
              <DownloadDropdown
                handleDownloadPDF={handleDownloadPDF}
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex flex-col gap-3">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="Forwarding Number Report"
              className="min-h-[40vh] max-h-[45vh]"
              columns={columns}
              rowData={shipments}
            />

            {/* Pagination Controls */}
            <PaginationControls />

            {isFullscreen && (
              <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Forwarding Number Report
                  </h2>
                  <button onClick={() => setIsFullscreen(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <TableWithSorting
                    register={register}
                    setValue={setValue}
                    name="Forwarding Number Report"
                    columns={columns}
                    rowData={shipments}
                    className="h-full w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Total Records Display */}
          <div className="flex justify-between">
            <div className="text-sm text-gray-600">
              {totalRecords > 0 && (
                <span>Total Records: {totalRecords}</span>
              )}
            </div>
          </div>
        </div>

        {/* Hidden content for PDF rendering */}
        <div
          ref={contentRef}
          className="text-[10px] leading-tight p-4 bg-white w-full"
          style={{
            visibility: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <h2 className="text-center font-bold mb-4 text-xs">
            Forwarding Number Report (Including Child Shipments)
          </h2>

          <table className="w-full border-collapse">
            <thead className="border-y-2 border-t-[#000080] border-y-[#ff0000]">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="pt-2 pb-4 px-2 text-left">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shipments.map((item, idx) => (
                <tr
                  key={idx}
                  className={`align-top ${item.isChild ? "bg-gray-50" : ""}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 pt-3">
                      {item[col.key] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>
    </>
  );
};

export default ForwardingNumberReport;