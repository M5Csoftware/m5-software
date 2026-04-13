"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import CodeList from "@/app/components/CodeList";
import NotificationFlag from "@/app/components/Notificationflag";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useDebounce } from "@/app/hooks/useDebounce";

const TrackingReport = () => {
  const { register, setValue, handleSubmit, reset, watch } = useForm();
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientName, setClientName] = useState("");
  const { server, setToggleCodeList } = useContext(GlobalContext);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const watchCode = watch("code");

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const columns = [
    { key: "runNo", label: "Run No" },
    { key: "awbNo", label: "Awb No" },
    { key: "mawbNo", label: "Mawb No" },
    { key: "clubNo", label: "Club No" },
    { key: "customerCode", label: "Customer Code" },
    { key: "destination", label: "Destination" },
    { key: "pcs", label: "Pcs" },
    { key: "actWeight", label: "Actual Weight" },
    { key: "bagWeight", label: "Bag Weight" },
    { key: "serviceType", label: "Service Type" },
    { key: "bagNo", label: "Bag No" },
    { key: "forwarder", label: "Forwarder" },
    { key: "forwardingNo", label: "Forwarding No" },
    { key: "network", label: "Network" },
    { key: "counterPart", label: "Counter Part" },
    { key: "status", label: "Status" },
    { key: "bookingDate", label: "Booking Date" },
    { key: "unholdDate", label: "Unhold Date" },
    { key: "flightDate", label: "Flight Date" },
    { key: "landingDate", label: "Landing Date" },
    { key: "dateOfConnections", label: "Date of Connections" },
    { key: "deliveryDate", label: "Delivery Date" },
    { key: "deliveryRemarks", label: "Delivery Remarks" },
  ];

  const codeListColumns = useMemo(
    () => [
      { key: "accountCode", label: "Customer Code" },
      { key: "name", label: "Customer Name" },
    ],
    [],
  );

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Fetch all customer accounts for code list
  useEffect(() => {
    fetchCustomerAccountsForCodeList();
  }, []);

  const fetchCustomerAccountsForCodeList = async () => {
    try {
      const response = await axios.get(`${server}/customer-account`);
      if (response.data) {
        const accounts = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setCustomerAccounts(
          accounts.map((acc) => ({
            accountCode: acc.accountCode,
            name: acc.name,
          })),
        );
      }
    } catch (error) {
      console.error("Error fetching customer accounts for code list:", error);
    }
  };

  // Auto-fetch client name when code changes
  const debouncedWatchCode = useDebounce(watchCode, 500);

  useEffect(() => {
    const fetchClientName = async () => {
      if (debouncedWatchCode && debouncedWatchCode.trim() !== "") {
        try {
          const customerRes = await axios.get(`${server}/customer-account`, {
            params: { accountCode: debouncedWatchCode.trim().toUpperCase() },
          });
          const customerData = customerRes.data || {};
          const name = customerData.name || "";
          setClientName(name);
          setValue("client", name);
        } catch (err) {
          console.warn(`No customer data found for accountCode: ${watchCode}`);
          setClientName("");
          setValue("client", "");
        }
      } else {
        setClientName("");
        setValue("client", "");
      }
    };

    fetchClientName();
  }, [debouncedWatchCode, server, setValue]);

  // Function to fetch tracking data with pagination
  const fetchTrackingData = async (filters, page = 1) => {
    setLoading(true);
    try {
      const {
        runNumber,
        code,
        branch,
        sector,
        destination,
        network,
        service,
        counterPart,
        from,
        to,
      } = filters;

      // Build query parameters
      const params = {};

      // Date range
      if (from && to) {
        const fromParsed = parseDateDDMMYYYY(from);
        const toParsed = parseDateDDMMYYYY(to);

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

        params.fromDate = fromParsed.toISOString();
        params.toDate = toParsed.toISOString();
      }

      // Other filters
      if (runNumber) params.runNumber = runNumber.toUpperCase();
      if (code) params.accountCode = code.toUpperCase();
      if (branch) params.branch = branch.toUpperCase();
      if (sector) params.sector = sector;
      if (destination) params.destination = destination;
      if (network) params.network = network;
      if (service) params.service = service;
      if (counterPart) params.counterPart = counterPart;

      // Pagination parameters
      params.page = page;
      params.limit = pageLimit;

      console.log("Fetching tracking data with pagination:", {
        page,
        limit: pageLimit,
      });

      const response = await axios.get(`${server}/tracking-report`, { params });

      // Handle response with pagination
      const responseData = response.data.data || [];
      const pagination = response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: responseData.length,
        limit: pageLimit,
      };

      if (responseData && Array.isArray(responseData)) {
        setRowData(responseData);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);

        if (responseData.length > 0) {
          showNotification(
            "success",
            `Found ${responseData.length} records (Page ${pagination.currentPage} of ${pagination.totalPages})`,
          );
        } else {
          showNotification("info", "No records found");
        }
      } else {
        setRowData([]);
        setTotalRecords(0);
        setTotalPages(1);
        showNotification("info", "No records found");
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      showNotification("error", "Error fetching data. Please try again.");
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
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Fetch new page
    fetchTrackingData(currentFilters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have current filters, refetch with new limit (reset to page 1)
    if (currentFilters) {
      setCurrentPage(1);
      fetchTrackingData(currentFilters, 1);
    }
  };

  const onSubmit = (data) => {
    const {
      runNumber,
      code,
      branch,
      sector,
      destination,
      network,
      service,
      counterPart,
      from,
      to,
    } = data;

    const mandatoryPresence = !!(branch || sector || code);
    const optionalPresence = !!(runNumber || data.origin);

    if (mandatoryPresence) {
      if (!from || !to) {
        showNotification(
          "error",
          "From and To dates are required for Branch, Sector, or Account Code searches.",
        );
        return;
      }
    } else if (optionalPresence) {
      // Dates are optional
    } else if (
      !runNumber &&
      !code &&
      !branch &&
      !sector &&
      !destination &&
      !network &&
      !service &&
      !counterPart &&
      !data.status &&
      !data.origin &&
      !from &&
      !to
    ) {
      showNotification("error", "Please enter at least one filter criteria");
      return;
    }

    // Date range validation
    if ((from && !to) || (!from && to)) {
      showNotification("error", "Please enter both From and To dates");
      return;
    }

    // Store filters for pagination
    setCurrentFilters(data);

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    fetchTrackingData(data, 1);
  };

  const handleRefresh = () => {
    reset({
      runNumber: "",
      branch: "",
      status: "",
      origin: "",
      sector: "",
      destination: "",
      network: "",
      service: "",
      code: "",
      client: "",
      counterPart: "",
      from: "",
      to: "",
    });
    setRowData([]);
    setClientName("");
    setRefreshKey((prev) => prev + 1);
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    showNotification("success", "Page refreshed successfully");
  };

  const handleClose = () => {
    reset();
    setRowData([]);
    setClientName("");
    setRefreshKey((prev) => prev + 1);
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
  };
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (e.target.tagName === "BUTTON") {
      e.target.click();
      return;
    }

    const form = e.target.form;
    const inputs = Array.from(
      form.querySelectorAll(
        'input:not([disabled]):not([readonly]):not([type="checkbox"]), select:not([disabled])',
      ),
    );
    const currentIndex = inputs.indexOf(e.target);

    if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
      inputs[currentIndex + 1].focus();
    } else {
      // Last input → submit the form
      handleSubmit(onSubmit)();
    }
  };

  // Handle code list action
  const handleCodeListAction = (action, data) => {
    if (action === "edit") {
      setValue("code", data.accountCode);
      setToggleCodeList(false);
    }
  };

  // Download Excel
  const downloadExcel = async () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to export");
      return;
    }

    try {
      const XLSX = await import("xlsx");
      const wsData = [
        columns.map((col) => col.label),
        ...rowData.map((row) => columns.map((col) => row[col.key] || "")),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const colWidths = columns.map(() => ({ wch: 15 }));
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Tracking Report");
      XLSX.writeFile(
        wb,
        `tracking_report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );

      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Failed to download Excel file");
    }
  };

  // Download CSV
  const downloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to export");
      return;
    }

    try {
      const headers = columns.map((col) => col.label).join(",");
      const csvContent = rowData
        .map((row) =>
          columns
            .map((col) => {
              const value = row[col.key] || "";
              return `"${value.toString().replace(/"/g, '""')}"`;
            })
            .join(","),
        )
        .join("\n");
      const fullCsvContent = headers + "\n" + csvContent;

      const blob = new Blob([fullCsvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tracking_report_${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification("success", "CSV file downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Failed to download CSV file");
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
    <>
      <form
        className="flex flex-col gap-9"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={handleKeyDown}
      >
        <NotificationFlag
          type={notification.type}
          message={notification.message}
          visible={notification.visible}
          setVisible={(visible) =>
            setNotification((prev) => ({ ...prev, visible }))
          }
        />

        <Heading
          title={`Tracking Report`}
          bulkUploadBtn="hidden"
          codeListBtn={true}
          onRefresh={handleRefresh}
        />

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <InputBox
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="runNumber"
            />
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="branch"
            />
            <InputBox
              placeholder="Status"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="status"
            />
            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="origin"
            />
          </div>

          <div className="flex gap-3">
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="sector"
            />
            <InputBox
              placeholder="Destination"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="destination"
            />
            <InputBox
              placeholder="Network"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="network"
            />
            <InputBox
              placeholder="Service"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="service"
            />
          </div>

          <div className="flex gap-3">
            <div>
              <InputBox
                placeholder="Code"
                register={register}
                setValue={setValue}
                resetFactor={refreshKey}
                value="code"
              />
            </div>
            <div className="w-[83%]">
              <DummyInputBoxWithLabelDarkGray
                label="Client"
                register={register}
                setValue={setValue}
                value="client"
                resetFactor={refreshKey}
                readOnly={true}
                displayValue={clientName}
              />
            </div>
            <InputBox
              placeholder="Counter Part"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="counterPart"
            />
          </div>

          <div className="flex gap-3">
            <DateInputBox
              placeholder="From"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="from"
            />
            <DateInputBox
              placeholder="To"
              register={register}
              setValue={setValue}
              resetFactor={refreshKey}
              value="to"
            />
            <div className="flex gap-2">
              <OutlinedButtonRed
                label={loading ? "Loading..." : "Show"}
                type="submit"
                disabled={loading}
              />

              <OutlinedButtonRed
                label={"Excel"}
                onClick={downloadExcel}
                type="button"
              />

              <SimpleButton
                name={"Download CSV"}
                onClick={downloadCSV}
                type="button"
              />
            </div>
          </div>

          <div>
            {loading ? (
              <div className="flex justify-center items-center h-[45vh] border border-[#D0D5DD] rounded">
                <p className="text-gray-500">Loading tracking data...</p>
              </div>
            ) : rowData.length > 0 ? (
              <>
                <TableWithSorting
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  name="tracking"
                  columns={columns}
                  rowData={rowData}
                />
                {/* Pagination Controls */}
                <PaginationControls />
              </>
            ) : (
              <div className="flex justify-center items-center h-[45vh] border border-[#D0D5DD] rounded">
                <p className="text-gray-500">
                  Enter filter criteria and click 'Show' to load tracking data
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div className="text-sm text-gray-600">
              {totalRecords > 0 && <span>Total Records: {totalRecords}</span>}
            </div>
          </div>
        </div>
      </form>

      {/* Code List for Customer Accounts */}
      <CodeList
        data={customerAccounts}
        columns={codeListColumns}
        name="Customer Accounts"
        handleAction={handleCodeListAction}
      />
    </>
  );
};

export default TrackingReport;
