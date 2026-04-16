"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { Dropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { GlobalContext } from "@/app/lib/GlobalContext";

const ChildShipmentStatusReport = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, getValues, reset } = useForm();
  const [dateFormat, setdateFormat] = useState(false);
  const [shipments, setShipments] = useState([]);
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

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [DummyShipmentReset, setDummyShipmentReset] = useState(false);
  const router = useRouter();

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const toDDMMYYYY = (date) => {
    if (!date) return "";

    // YYYYMMDD (number or string)
    if (/^\d{8}$/.test(String(date))) {
      const d = String(date);
      return `${d.slice(6, 8)}/${d.slice(4, 6)}/${d.slice(0, 4)}`;
    }

    const dt = new Date(date);
    if (isNaN(dt.getTime())) return date;

    return `${String(dt.getDate()).padStart(2, "0")}/${String(
      dt.getMonth() + 1
    ).padStart(2, "0")}/${dt.getFullYear()}`;
  };

  const handleRefresh = () => {
    setDummyShipmentReset(!DummyShipmentReset);
    setShipments([]);
    reset();
    setNotification({ visible: false, message: "", type: "error" }); // reset notifications
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
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

    const headers = columns.map((c) => c.label);
    const csv = [
      headers.join(","),
      ...shipments.map((row) =>
        columns.map((col) => `"${row[col.key] ?? ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "child_shipment_report.csv";
    link.click();
    URL.revokeObjectURL(url);
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

    // Use the visible columns
    const exportData = shipments.map((row) => {
      let obj = {};
      columns.forEach((col) => {
        obj[col.label] = row[col.key] ?? "";
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipments");

    XLSX.writeFile(workbook, "child_shipment_report.xlsx");
  };

  // Function to fetch shipments with pagination
  const fetchShipmentsWithPagination = async (filters, page = 1) => {
    setIsLoading(true);

    // Check if dates are mandatory based on specific filters
    const mandatoryPresence = !!(
      filters.code ||
      filters.client ||
      filters.branch ||
      filters.sector ||
      filters.destination ||
      filters.network ||
      filters.service ||
      filters.counterPart ||
      (filters.status && filters.status !== "All")
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
    } else if (!filters.from || !filters.to) {
      // General behavior: require dates
      setNotification({
        visible: true,
        message: "Please select From and To dates",
        type: "error",
      });
      setShipments([]);
      setIsLoading(false);
      return;
    }

    const fromParsed = filters.from ? parseDateDDMMYYYY(filters.from) : null;
    const toParsed = filters.to ? parseDateDDMMYYYY(filters.to) : null;

    if (mandatoryPresence && (!fromParsed || !toParsed)) {
      setNotification({
        visible: true,
        message: "From and To dates are required for specific filter searches.",
        type: "error",
      });
      setShipments([]);
      setIsLoading(false);
      return;
    }

    if (filters.from || filters.to) {
      if (
        (filters.from && (!fromParsed || isNaN(fromParsed.getTime()))) ||
        (filters.to && (!toParsed || isNaN(toParsed.getTime())))
      ) {
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

    // Build query parameters
    const params = new URLSearchParams();
    if (fromParsed) {
      fromParsed.setHours(0, 0, 0, 0);
      params.append('from', fromParsed.toISOString());
    }
    if (toParsed) {
      toParsed.setHours(23, 59, 59, 999);
      params.append('to', toParsed.toISOString());
    }
    
    // Add other filters if they exist
    if (filters.code) params.append('code', filters.code);
    if (filters.client) params.append('client', filters.client);
    if (filters.runNumber) params.append('runNumber', filters.runNumber);
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.origin) params.append('origin', filters.origin);
    if (filters.sector) params.append('sector', filters.sector);
    if (filters.status && filters.status !== "All") params.append('status', filters.status);
    if (filters.destination) params.append('destination', filters.destination);
    if (filters.network) params.append('network', filters.network);
    if (filters.service) params.append('service', filters.service);
    if (filters.counterPart) params.append('counterPart', filters.counterPart);
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('limit', pageLimit.toString());

    console.log("Fetching with pagination:", { page, limit: pageLimit });

    try {
      const res = await fetch(`${server}/shipment-status?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const responseData = await res.json();

      // Handle response with pagination
      const shipmentsData = responseData.data || [];
      const pagination = responseData.pagination || {
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
        const formatted = shipmentsData.map((item) => ({
          ...item,
          createdAt: toDDMMYYYY(item.createdAt),
          flightDate: toDDMMYYYY(item.flightDate),
        }));
        setShipments(formatted);
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

  const fetchShipments = async () => {
    const filters = getValues();
    
    // Store filters for pagination
    setCurrentFilters(filters);
    
    // Reset to page 1 for new search
    setCurrentPage(1);
    
    // Fetch first page
    await fetchShipmentsWithPagination(filters, 1);
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        fetchShipments();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      window.addEventListener("keydown", handleKeyDown);
    } else {
      window.removeEventListener("keydown", handleKeyDown);
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

  const columns = [
    { key: "awbNo", label: "AwbNo" },
    { key: "mAwb", label: "Master Awb" },
    { key: "createdAt", label: "ShipmentDate" },
    { key: "runNo", label: "RunNo" },
    { key: "clubNo", label: "ClubNo" },
    { key: "alMawb", label: "AlMawb" },
    { key: "bag", label: "BagNo" },
    { key: "obc", label: "OBC" },
    { key: "flight", label: "Flight" },
    { key: "flightDate", label: "Flight Date" },
    { key: "counterPart", label: "Counter Part" },
    { key: "branch", label: "Branch" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "DestinationName" },
    { key: "accountCode", label: "CustomerCode" },
    { key: "customer", label: "CustomerName" },
    { key: "receiverFullName", label: "ConsigneeName" },
    { key: "receiverAddressLine1", label: "ConsigneeAddress" },
    { key: "pcs", label: "Pcs" },
    { key: "goodstype", label: "GoodsDesc" },
    { key: "totalActualWt", label: "ActWeight" },
    { key: "content", label: "ShipmentContent" },
    { key: "operationRemark", label: "ShipmentRemark" },
    { key: "holdReason", label: "HoldReason" },
  ];

  return (
    <>
      {" "}
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form className="flex flex-col gap-9">
        <Heading
          title={`Child Shipment Status Report`}
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          onRefresh={handleRefresh}
          fullscreenBtn={true}
          onClickFullscreenBtn={() => setIsFullscreen(true)}
        />
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <div className="w-[375px]">
              <InputBox
                placeholder="Code"
                register={register}
                setValue={setValue}
                resetFactor={DummyShipmentReset}
                value="code"
              />
            </div>
            <InputBox
              placeholder="Client"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="client"
            />
          </div>

          <div className="flex gap-3">
            <InputBox
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="runNumber"
            />
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="branch"
            />
            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="origin"
            />
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="sector"
            />
            <Dropdown
              options={["All", "Hold", "Pending", "Delivered"]}
              value="status"
              title="Select Status"
              defaultValue="All"
              register={register}
            />
          </div>

          <div className="flex gap-3">
            <InputBox
              placeholder="Destination"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="destination"
            />
            <InputBox
              placeholder="Network"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="network"
            />
            <InputBox
              placeholder="Service"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="service"
            />
            <InputBox
              placeholder="Counter Part"
              register={register}
              setValue={setValue}
              resetFactor={DummyShipmentReset}
              value="counterPart"
            />
          </div>

          <div className="flex gap-3 ">
            <div className="w-full flex gap-3">
              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                resetFactor={DummyShipmentReset}
                value="from"
              />
              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                resetFactor={DummyShipmentReset}
                value="to"
              />
            </div>
            <div className="flex gap-2">
              <OutlinedButtonRed
                label={isLoading ? "Loading..." : "Show"}
                onClick={(e) => {
                  e.preventDefault();
                  fetchShipments();
                }}
                disabled={isLoading}
              />

              <OutlinedButtonRed
                label={"Excel"}
                onClick={handleDownloadExcel}
              />

              <SimpleButton
                name={"Download CSV"}
                onClick={handleDownloadCSV}
                disabled={!shipments.length || isLoading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 relative">
            {/* Normal table view */}
            {!isFullscreen && (
              <>
                <TableWithSorting
                  register={register}
                  setValue={setValue}
                  name="shipments"
                  rowData={shipments}
                  columns={columns}
                  className="h-[40vh]"
                />
                {/* Pagination Controls */}
                <PaginationControls />
              </>
            )}

            {/* Fullscreen overlay */}
            {isFullscreen && (
              <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Child Shipments Status Report
                  </h2>
                  <button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFullscreen(false)}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <TableWithSorting
                    register={register}
                    setValue={setValue}
                    name="shipments "
                    rowData={shipments}
                    columns={columns}
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
      </form>
    </>
  );
};

export default ChildShipmentStatusReport;