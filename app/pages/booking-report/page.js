"use client";
import React, { useContext, useState, useMemo, useEffect } from "react";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";

const BookingReport = () => {
  const {
    register,
    setValue,
    trigger,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const [dateFormat, setDateFormat] = useState(false);
  const [holdShipments, setHoldShipments] = useState(false);
  const [skipMum, setSkipMum] = useState(false);
  const [skipAmd, setSkipAmd] = useState(false);
  const [includeChild, setIncludeChild] = useState(false);
  const [balanceShipment, setBalanceShipmet] = useState(false);
  const [added, setAdded] = useState(false);
  const [csbV, setcsbV] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { server } = useContext(GlobalContext);
  const [reports, setReports] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [hasMore, setHasMore] = useState(false);
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  // Watch the code field for changes
  const codeValue = watch("code");

  // Notification state
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

  const baseColumns = [
    { key: "awbNo", label: "AwbNo" },
    { key: "createdAt", label: "ShipmentDate" },
    { key: "runNo", label: "RunNo" },
    { key: "bagNo", label: "BagNo" },
    { key: "flight", label: "Flight Date" },
    { key: "manifestNumber", label: "ManifestNumber" },
    { key: "branch", label: "Branch" },
    { key: "origin", label: "Origin Name" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "DestinationName" },
    { key: "accountCode", label: "CustomerCode" },
    { key: "name", label: "Customer Name" },
    { key: "salesPersonName", label: "Sales Person Name" },
    { key: "receiverFullName", label: "ConsigneeName" },
    { key: "receiverAddressLine1", label: "ConsigneeAddressLine1" },
    { key: "receiverCity", label: "ConsigneeCity" },
    { key: "receiverState", label: "ConsigneeState" },
    { key: "receiverPincode", label: "ConsigneeZipCode" },
    { key: "receiverPhoneNumber", label: "ConsigneePhoneNo" },
    { key: "service", label: "Service" },
    { key: "upsService", label: "UPSService" },
    { key: "shipmentForwarderTo", label: "ShipmentForwarderTo" },
    { key: "shipmentForwardingNo", label: "ShipmentForwardingNo" },
    { key: "payment", label: "PaymentType" },
    { key: "pcs", label: "Pcs" },
    { key: "goodstype", label: "Goods Type" },
    { key: "totalActualWt", label: "Actual Weight" },
    { key: "totalVolWt", label: "Volume Weight" },
    { key: "volDisc", label: "Volumetric Discount" },
    { key: "chargableWt", label: "Chargable Weight" },
    { key: "totalInvoiceValue", label: "Custom Value" },
    { key: "currency", label: "Currency" },
    { key: "containerNo", label: "ContainerNo" },
    { key: "isHold", label: "Hold Shipment" },
    { key: "holdReason", label: "Hold Reason" },
    { key: "otherHoldReason", label: "Hold Reason 2" },
    { key: "unholdDate", label: "Unhold Date" },
    { key: "csb", label: "CSB" },
    { key: "userBranch", label: "User Branch" },
    { key: "insertUser", label: "Insert User" },
    { key: "localMfNo", label: "LocalMfNo" },
  ];

  // Dynamically add Master AWB column when includeChild is checked
  const columns = useMemo(() => {
    if (includeChild) {
      // Insert Master AWB column right after AwbNo (at index 1)
      return [
        baseColumns[0], // AwbNo
        { key: "masterAwbNo", label: "Master AWB" },
        ...baseColumns.slice(1),
      ];
    }
    return baseColumns;
  }, [includeChild]);

  // ✅ Fetch customer name when code is entered
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (!codeValue || codeValue.trim() === "") {
        setValue("client", "");
        return;
      }

      try {
        // Fetch customer account by code (using same endpoint as PaymentCollectionReport)
        const response = await axios.get(
          `${server}/customer-account?accountCode=${codeValue.trim().toUpperCase()}`,
        );

        if (response.data && response.data.name) {
          setValue("client", response.data.name);
        } else {
          setValue("client", "");
        }
      } catch (error) {
        console.error("Error fetching customer name:", error);
        // Don't show error notification for this background fetch
        if (error.response?.status === 404) {
          setValue("client", "Customer not found");
        } else {
          setValue("client", "");
        }
      }
    };

    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(() => {
      fetchCustomerName();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [codeValue, server, setValue]);

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

  // Function to fetch reports with pagination
  const fetchReports = async (filters, page = 1) => {
    setIsLoading(true);
    try {
      // Format dates to ISO string to ensure proper format
      const formattedData = {
        ...filters,
        page,
        limit: pageLimit,
      };

      console.log("Fetching reports with pagination:", {
        page,
        limit: pageLimit,
      });

      const response = await axios.post(
        `${server}/reports/booking-report`,
        formattedData,
      );

      console.log("API Response:", response.data);

      // Handle response with pagination
      const responseData = response.data.data || [];
      const pagination = response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: responseData.length,
        limit: pageLimit,
      };

      // filter only available columns and remove empty/null values
      const allowedKeys = columns.map((col) => col.key);
      const filteredData = responseData.map((item) => {
        let filtered = {};
        allowedKeys.forEach((key) => {
          if (
            item[key] !== undefined &&
            item[key] !== null &&
            item[key] !== ""
          ) {
            if (typeof item[key] === "boolean") {
              filtered[key] = item[key] ? "Yes" : "No";
            } else filtered[key] = item[key];
          }
        });
        return filtered;
      });

      setReports(filteredData);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);
      setHasMore(pagination.currentPage < pagination.totalPages);

      if (filteredData.length > 0) {
        showNotification(
          "success",
          `Booking report generated (${filteredData.length} records, Page ${pagination.currentPage} of ${pagination.totalPages})`,
        );
      } else {
        showNotification("error", "No records found for selected criteria");
      }

      return filteredData;
    } catch (error) {
      console.error("Error Downloading report:", error);
      const errorMessage =
        error.response?.data?.error || "Error downloading booking report";
      setReports([]);
      showNotification("error", errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const { from, to, runNumber, origin, sector, branch, code } = data;

      // Check if dates are mandatory based on specific filters
      const mandatoryPresence = !!(branch || sector || code);
      const optionalPresence = !!(runNumber || origin);

      if (optionalPresence) {
        // Run Number or Origin present: Dates are optional even if mandatory filters are present
      } else if (mandatoryPresence) {
        if (!from || !to) {
          showNotification(
            "error",
            "From and To dates are required for Branch, Sector, or Account Code Search.",
          );
          return;
        }
      } else if (!from || !to) {
        showNotification("error", "Please select both From and To dates");
        return;
      }

      let fromDateObj = null;
      let toDateObj = null;

      if (from && to) {
        fromDateObj = parseDateDDMMYYYY(from);
        toDateObj = parseDateDDMMYYYY(to);

        if (
          !fromDateObj ||
          !toDateObj ||
          isNaN(fromDateObj.getTime()) ||
          isNaN(toDateObj.getTime())
        ) {
          showNotification(
            "error",
            "Invalid date format. Please select valid dates.",
          );
          return;
        }

        fromDateObj.setHours(0, 0, 0, 0);
        toDateObj.setHours(23, 59, 59, 999);
      }

      // Format dates to ISO string to ensure proper format
      const filters = {
        code: data.code?.toUpperCase() || undefined,
        runNumber: data.runNumber?.toUpperCase() || undefined,
        origin: data.origin?.toUpperCase() || undefined,
        sector: data.sector?.toUpperCase() || undefined,
        salePerson: data.salePerson?.toUpperCase() || undefined,
        branch: data.branch?.toUpperCase() || undefined,
        destination: data.destination?.toUpperCase() || undefined,
        service: data.service?.toUpperCase() || undefined,
        from: fromDateObj ? fromDateObj.toISOString() : undefined,
        to: toDateObj ? toDateObj.toISOString() : undefined,
        holdShipments,
        skipMum,
        skipAmd,
        csbV,
        includeChild,
        balanceShipment,
      };

      // Store filters for pagination
      setCurrentFilters(filters);

      // Reset to page 1 for new search
      setCurrentPage(1);

      // Fetch first page
      await fetchReports(filters, 1);

      // populate client input from API response only if code was provided
      if (data.code && reports.length > 0) {
        const first = reports[0];
        const clientName =
          first.name ||
          first.customer ||
          first.customerName ||
          first.client ||
          "";
        setValue("client", clientName);
      } else if (!data.code) {
        setValue("client", "");
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;

    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Fetch new page
    fetchReports(currentFilters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have current filters, refetch with new limit (reset to page 1)
    if (currentFilters) {
      setCurrentPage(1);
      fetchReports(currentFilters, 1);
    }
  };

  const handleDownloadCSV = () => {
    if (!reports || reports.length === 0) {
      showNotification("error", "Nothing to download");
      return;
    }

    const csvHeaders = columns.map((col) => col.label).join(",");
    const csvRows = reports.map((row) =>
      columns.map((col) => `"${row[col.key] || ""}"`).join(","),
    );
    const csvContent = [csvHeaders, ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "booking-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("success", "CSV downloaded");
  };

  const handleRefresh = () => {
    setAdded(!added);
    setReports([]);
    setValue("client", "");
    // Reset all checkboxes
    setHoldShipments(false);
    setSkipMum(false);
    setSkipAmd(false);
    setcsbV(false);
    setBalanceShipmet(false);
    setIncludeChild(false);
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    showNotification("success", "Refreshed");
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{reports.length}</span> of{" "}
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
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-9">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading
        title={"Booking Report"}
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        bulkUploadBtn="hidden"
      />
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <InputBox
            placeholder={"Code"}
            register={register}
            setValue={setValue}
            value={"code"}
            resetFactor={added}
          />
          <div className="md:col-span-1 lg:col-span-2">
            <DummyInputBoxWithLabelDarkGray
              label="Client"
              register={register}
              setValue={setValue}
              value="client"
              resetFactor={added}
              inputValue={watch("client") || ""}
            />
          </div>
          <InputBox
            placeholder={"Run Number"}
            register={register}
            setValue={setValue}
            value={"runNumber"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Branch"}
            register={register}
            setValue={setValue}
            value={"branch"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Origin"}
            register={register}
            setValue={setValue}
            value={"origin"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Sector"}
            register={register}
            setValue={setValue}
            value={"sector"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Sale Person"}
            register={register}
            setValue={setValue}
            value={"salePerson"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Destination"}
            register={register}
            setValue={setValue}
            value={"destination"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Service"}
            register={register}
            setValue={setValue}
            value={"service"}
            resetFactor={added}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          <DateInputBox
            register={register}
            setValue={setValue}
            value="from"
            placeholder="From"
            trigger={trigger}
            error={errors.from}
            maxToday
            resetFactor={added}
          />
          <DateInputBox
            register={register}
            setValue={setValue}
            value="to"
            placeholder="To"
            maxToday
            trigger={trigger}
            error={errors.to}
            resetFactor={added}
          />

          <div className="col-span-1 lg:col-span-3 flex flex-wrap items-center gap-4">
            <div className="flex-none">
              <OutlinedButtonRed
                type="submit"
                label={isLoading ? "Loading..." : "View"}
                disabled={isLoading}
              />
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg">
              <RedCheckbox
                isChecked={holdShipments}
                setChecked={setHoldShipments}
                id="holdShipments"
                register={register}
                setValue={setValue}
                label="Hold Shipments"
              />
              <RedCheckbox
                isChecked={skipMum}
                setChecked={setSkipMum}
                id="skipMum"
                register={register}
                setValue={setValue}
                label="Skip MUM"
              />
              <RedCheckbox
                isChecked={skipAmd}
                setChecked={setSkipAmd}
                id="skipAmd"
                register={register}
                setValue={setValue}
                label="Skip AMD"
              />
              <RedCheckbox
                isChecked={csbV}
                setChecked={setcsbV}
                id="csbV"
                register={register}
                setValue={setValue}
                label="CSB V"
              />
              <RedCheckbox
                isChecked={balanceShipment}
                setChecked={setBalanceShipmet}
                id="balanceShipment"
                register={register}
                setValue={setValue}
                label="Balance Shipment"
              />
              <RedCheckbox
                isChecked={includeChild}
                setChecked={setIncludeChild}
                id="includeChild"
                register={register}
                setValue={setValue}
                label="Include Child"
              />
            </div>
          </div>
        </div>

        <TableWithSorting
          register={register}
          setValue={setValue}
          name="bookingReportTable"
          columns={columns}
          rowData={reports}
          className={`h-[50vh]`}
        />

        {/* Pagination Controls */}
        <PaginationControls />

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {totalRecords > 0 && <span>Total Records: {totalRecords}</span>}
          </div>

          <div>
            <SimpleButton
              disabled={reports.length == 0}
              name={"Download"}
              onClick={handleDownloadCSV}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default BookingReport;
