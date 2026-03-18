"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
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
import NotificationFlag from "@/app/components/Notificationflag";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { X } from "lucide-react";

function BookingWithSale() {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      runNumber: "",
      from: "",
      to: "",
    },
  });
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const [totals, setTotals] = useState({
    totalActualWeight: 0,
    totalChargeableWeight: 0,
    grandTotal: 0,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const { server } = useContext(GlobalContext);

  const runNumber = watch("runNumber");
  const fromDate = watch("from");
  const toDate = watch("to");

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "date", label: "Shipment Date" },
      { key: "runNo", label: "Run No" },
      { key: "bag", label: "Bag No" },
      { key: "flightDate", label: "Flight Date" },
      { key: "manifestNo", label: "Manifest Number" },
      { key: "branch", label: "Branch" },
      { key: "origin", label: "Origin Name" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination Name" },
      { key: "accountCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "salesPersonName", label: "Sale Person" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "receiverAddressLine1", label: "Consignee Address Line 1" },
      { key: "receiverCity", label: "Consignee City" },
      { key: "receiverState", label: "Consignee State" },
      { key: "receiverPincode", label: "Consignee Zip Code" },
      { key: "receiverPhoneNumber", label: "Consignee Phone No" },
      { key: "service", label: "Service Type" },
      { key: "shipmentType", label: "UPS Service" },
      { key: "forwarder", label: "Shipment Forwarder To" },
      { key: "forwardingNo", label: "Shipment Forwarding No" },
      { key: "payment", label: "Payment Type" },
      { key: "pcs", label: "Pcs" },
      { key: "goodstype", label: "Goods Desc" },
      { key: "totalActualWt", label: "Act Weight" },
      { key: "totalVolWt", label: "Vol Weight" },
      { key: "volDisc", label: "Vol Discount" },
      { key: "content", label: "Shipment Content" },
      { key: "totalInvoiceValue", label: "Customs Value" },
      { key: "currency", label: "Customs Currency Code" },
      { key: "clubNo", label: "Container No" },
      { key: "holdReason", label: "Hold Reason" },
      { key: "otherHoldReason", label: "Reason 2" },
      { key: "csb", label: "CSB" },
      { key: "insertUser", label: "Insert User" },
      { key: "alMawb", label: "Local MF No" },
      { key: "basicAmt", label: "Basic Amount" },
      { key: "discount", label: "Discount Per Kg" },
      { key: "discountAmt", label: "Discount Amount" },
      { key: "hikeAmt", label: "Rate Hike" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "handlingAmount", label: "Handling" },
      { key: "overWtHandling", label: "OVWT" },
      { key: "miscChg", label: "Mischg" },
      { key: "miscChgReason", label: "Misc Remark" },
      { key: "fuelAmt", label: "Fuel" },
      { key: "duty", label: "Non Taxable" },
      { key: "totalAmt", label: "Grand Total" },
      { key: "billNo", label: "Bill No" },
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

  // Helper function to parse DD/MM/YYYY format
  const parseDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
  };

  const fetchShipments = async (page = 1) => {
    try {
      setLoading(true);

      let url = `${server}/booking-with-sale`;
      const queryParams = new URLSearchParams();

      if (runNumber && !fromDate && !toDate) {
        setSearchType("runNo");
        queryParams.append("runNo", runNumber);
      } else if ((fromDate || toDate) && !runNumber) {
        setSearchType("date");

        if (fromDate) {
          const fromDateObj = parseDateDDMMYYYY(fromDate);
          if (!fromDateObj || isNaN(fromDateObj.getTime())) {
            showNotification("error", "Invalid From date format");
            setLoading(false);
            return;
          }
          fromDateObj.setHours(0, 0, 0, 0);
          queryParams.append("fromDate", fromDateObj.toISOString());
        }

        if (toDate) {
          const toDateObj = parseDateDDMMYYYY(toDate);
          if (!toDateObj || isNaN(toDateObj.getTime())) {
            showNotification("error", "Invalid To date format");
            setLoading(false);
            return;
          }
          toDateObj.setHours(23, 59, 59, 999);
          queryParams.append("toDate", toDateObj.toISOString());
        }
      } else if (runNumber && (fromDate || toDate)) {
        showNotification(
          "error",
          "Please search by either Run Number OR Date Range, not both"
        );
        setLoading(false);
        return;
      } else {
        showNotification(
          "error",
          "Please enter either Run Number or Date Range"
        );
        setLoading(false);
        return;
      }

      // Add pagination parameters
      queryParams.append("page", page.toString());
      queryParams.append("limit", pageLimit.toString());

      url += `?${queryParams.toString()}`;
      
      setCurrentFilters({ runNumber, from: fromDate, to: toDate });

      const response = await axios.get(url);
      const data = response.data.data || [];
      const pagination = response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: data.length,
      };

      if (data.length === 0) {
        showNotification("info", "No shipments found");
      } else {
        showNotification("success", `Found ${data.length} shipment(s) (Page ${pagination.currentPage} of ${pagination.totalPages})`);
      }

      setRowData(data);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);
      // Wait, totals should probably come from backend or be calculated from all pages?
      // Usually totals for weight/amt should be for the entire dataset.
      // If the backend doesn't provide it, we might only have totals for the current page.
      // For now, I'll calculate from the current page if not provided.
      calculateTotals(data);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      showNotification(
        "error",
        `Error fetching shipments: ${
          error.response?.data?.error || error.message
        }`
      );
      setRowData([]);
      setCurrentPage(1);
      setTotals({
        totalActualWeight: 0,
        totalChargeableWeight: 0,
        grandTotal: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (data) => {
    const totals = data.reduce(
      (acc, item) => {
        const chargeableWeight = Math.max(
          item.totalActualWt || 0,
          item.totalVolWt || 0
        );
        return {
          totalActualWeight: acc.totalActualWeight + (item.totalActualWt || 0),
          totalChargeableWeight: acc.totalChargeableWeight + chargeableWeight,
          grandTotal: acc.grandTotal + (item.totalAmt || 0),
        };
      },
      { totalActualWeight: 0, totalChargeableWeight: 0, grandTotal: 0 }
    );

    setTotals(totals);
  };

  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const ws_data = [columns.map((col) => col.label)];
    rowData.forEach((row) => {
      ws_data.push(columns.map((col) => row[col.key] || ""));
    });

    const ws =
      typeof XLSX !== "undefined" ? XLSX.utils.aoa_to_sheet(ws_data) : null;
    if (!ws) {
      handleDownloadCSV();
      return;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Shipments");
    XLSX.writeFile(wb, "booking_with_sale.xlsx");
    showNotification("success", "Excel file downloaded successfully");
  };

  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const headers = columns.map((col) => `"${col.label}"`).join(",");
    const rows = rowData.map((row) =>
      columns
        .map((col) => {
          const value = row[col.key] || "";
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [headers, ...rows].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "booking_with_sale.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("success", "CSV file downloaded successfully");
  };

  const handleClose = () => {
    setRowData([]);
    setSearchType(null);
    setTotals({
      totalActualWeight: 0,
      totalChargeableWeight: 0,
      grandTotal: 0,
    });
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    setValue("runNumber", "");
    setValue("from", "");
    setValue("to", "");
  };

  const handleRefresh = () => {
    // Clear all states first
    setRowData([]);
    setSearchType(null);
    setTotals({
      totalActualWeight: 0,
      totalChargeableWeight: 0,
      grandTotal: 0,
    });
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);

    // Increment form key to force complete remount
    setFormKey((prev) => prev + 1);

    // Reset form
    reset({
      runNumber: "",
      from: "",
      to: "",
    });

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

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchShipments(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      fetchShipments(1);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1 && rowData.length === 0) return null;

    return (
      <div className="flex items-center justify-between border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 border-b-0 bg-gray-50 px-4 py-3">
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
              className="border rounded px-2 py-1 text-sm bg-white"
              disabled={loading}
            >
              <option value={30}>30</option>
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
            type="button"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
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
            type="button"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <form className="flex flex-col gap-5" key={formKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title={`Booking With Sale`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => setIsFullscreen(true)}
      />

      <div className="flex flex-col gap-3 mt-5">
        <div className="flex flex-col gap-3">
          <div className="flex">
            <InputBox
              key={`runNumber-${formKey}`}
              placeholder={`Run Number`}
              register={register}
              setValue={setValue}
              value="runNumber"
              type="text"
              disabled={searchType === "date"}
            />
          </div>

          <div className="flex gap-3">
            <DateInputBox
              key={`from-${formKey}`}
              placeholder="From"
              register={register}
              setValue={setValue}
              value="from"
              type="date"
              disabled={searchType === "runNo"}
            />
            <DateInputBox
              key={`to-${formKey}`}
              placeholder="To"
              register={register}
              setValue={setValue}
              value="to"
              type="date"
              disabled={searchType === "runNo"}
            />
            <div>
              <OutlinedButtonRed
                type="button"
                label={loading ? "Loading..." : "Show"}
                onClick={() => fetchShipments(1)}
                disabled={loading}
              />
            </div>
            <div className="flex justify-between">
              <div></div>
              <div className="flex gap-2">
                <DownloadCsvExcel
                  label="Download"
                  handleDownloadExcel={handleDownloadExcel}
                  handleDownloadCSV={handleDownloadCSV}
                />
              </div>
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
          className={`border-b-0 rounded-b-none h-[45vh]`}
        />

        <PaginationControls />

        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16">
          <div>
            <span className="font-sans">Total Actual Weight :</span>
            <span className="text-red ml-2">
              {totals.totalActualWeight.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="font-sans">Chargeable Weight :</span>
            <span className="text-red ml-2">
              {totals.totalChargeableWeight.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="font-sans">Grand Total :</span>
            <span className="text-red ml-2">
              {totals.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Booking With Sale - Fullscreen View
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
          <div className="flex justify-end border-t border-gray-300 pt-4 mt-4 gap-16">
            <div>
              <span className="font-sans">Total Actual Weight :</span>
              <span className="text-red ml-2 font-semibold">
                {totals.totalActualWeight.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-sans">Chargeable Weight :</span>
              <span className="text-red ml-2 font-semibold">
                {totals.totalChargeableWeight.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-sans">Grand Total :</span>
              <span className="text-red ml-2 font-semibold">
                {totals.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default BookingWithSale;
