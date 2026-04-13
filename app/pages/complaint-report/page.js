"use client";
import Heading from "@/app/components/Heading";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import { Dropdown } from "@/app/components/Dropdown";
import CodeList from "@/app/components/CodeList";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import * as XLSX from "xlsx";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

const ComplaintReport = () => {
  const { server, setToggleCodeList } = useContext(GlobalContext);
  const {
    register,
    setValue,
    trigger,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const [added, setAdded] = useState(false);
  const [reports, setReports] = useState([]);
  const [clientName, setClientName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customerAccounts, setCustomerAccounts] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const watchCode = watch("code");

  const codeListColumns = useMemo(
    () => [
      { key: "accountCode", label: "Customer Code" },
      { key: "name", label: "Customer Name" },
    ],
    [],
  );

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

  useEffect(() => {
    if (!watchCode || watchCode.trim() === "") {
      setClientName("");
      setValue("client", "");
      return;
    }

    const fetchClientName = async () => {
      try {
        const res = await axios.get(`${server}/customer-account`, {
          params: { accountCode: watchCode.trim().toUpperCase() },
        });
        const name = res.data?.name || "";
        setClientName(name);
        setValue("client", name);
      } catch (err) {
        console.warn("No client found for code", watchCode);
        setClientName("");
        setValue("client", "");
      }
    };

    fetchClientName();
  }, [watchCode, server, setValue]);

  const columns = [
    { key: "complaintNo", label: "Complaint No.", sortable: true },
    { key: "jobID", label: "Job ID", sortable: true },
    { key: "compDate", label: "Complaint Date", sortable: true },
    { key: "awbNo", label: "AWB No", sortable: true },
    { key: "customerCode", label: "Customer Code", sortable: true },
    { key: "customerName", label: "Customer Name", sortable: true },
    { key: "sector", label: "Sector", sortable: true },
    { key: "compType", label: "Complaint Type", sortable: true },
    { key: "caseType", label: "Case Type", sortable: true },
    { key: "assignTo", label: "Assign To", sortable: true },
    { key: "status", label: "Status", sortable: true },
    { key: "action", label: "Action", sortable: true },
    { key: "actionUser", label: "Action User", sortable: true },
  ];

  // Handle code list action
  const handleCodeListAction = (action, data) => {
    if (action === "edit") {
      setValue("code", data.accountCode);
      setToggleCodeList(false);
    }
  };

  // Function to fetch reports with pagination
  const fetchReports = async (filters, page = 1) => {
    setIsLoading(true);
    try {
      const { from, to, code, runNumber, branch, statusFilter } = filters;

      if (!from || !to) {
        showNotification("error", "Please select both From and To dates");
        setIsLoading(false);
        return;
      }

      // Convert DD/MM/YYYY to YYYY-MM-DD
      const formatDateForAPI = (dateStr) => {
        const [day, month, year] = dateStr.split("/");
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      };

      const fromFormatted = formatDateForAPI(from);
      const toFormatted = formatDateForAPI(to);

      console.log("Sending dates to API:", fromFormatted, toFormatted);
      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const complaintsRes = await axios.get(`${server}/complaint-report`, {
        params: {
          from: fromFormatted,
          to: toFormatted,
          page,
          limit: pageLimit,
        },
      });

      // console.log("API Response:", complaintsRes.data);

      // Get reports and pagination from API response
      const reportsFromAPI = complaintsRes.data?.reports || [];
      const pagination = complaintsRes.data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: reportsFromAPI.length,
        limit: pageLimit,
      };

      // Apply client-side filters
      let filteredReports = reportsFromAPI;

      if (code && code.trim() !== "") {
        filteredReports = filteredReports.filter(
          (report) =>
            report.customerCode &&
            report.customerCode.toString().toLowerCase() ===
              code.trim().toLowerCase(),
        );
      }

      if (runNumber && runNumber.trim() !== "") {
        filteredReports = filteredReports.filter(
          (report) =>
            report.sector &&
            report.sector
              .toString()
              .toLowerCase()
              .includes(runNumber.trim().toLowerCase()),
        );
      }

      if (branch && branch.trim() !== "") {
        filteredReports = filteredReports.filter(
          (report) =>
            report.actionUser &&
            report.actionUser
              .toString()
              .toLowerCase()
              .includes(branch.trim().toLowerCase()),
        );
      }

      if (statusFilter && statusFilter.trim() !== "") {
        filteredReports = filteredReports.filter(
          (report) =>
            report.status &&
            report.status.toLowerCase() === statusFilter.trim().toLowerCase(),
        );
      }

      setReports(filteredReports);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);

      showNotification(
        "success",
        `Complaint report fetched successfully. Found ${filteredReports.length} records (Page ${pagination.currentPage} of ${pagination.totalPages})`,
      );
    } catch (error) {
      console.error("Error fetching complaint report:", error);
      showNotification("error", "Failed to fetch complaints.");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit handler
  const onSubmit = async (data) => {
    // Store filters for pagination
    setCurrentFilters(data);

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    await fetchReports(data, 1);
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

  // Close button handler
  const handleClose = () => {
    reset();
    setReports([]);
    setClientName("");
    setIsLoading(false);
    setAdded((prev) => !prev);
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
  };

  // Refresh button handler
  const handleRefresh = () => {
    reset();
    setReports([]);
    setClientName("");
    setIsLoading(false);
    setAdded((prev) => !prev);
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
  };

  // Excel download handler
  const handleExcelDownload = () => {
    if (!reports.length) {
      showNotification("error", "No data available to export!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(reports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ComplaintReport");
    XLSX.writeFile(workbook, "ComplaintReport.xlsx");
  };

  // CSV download handler
  const handleCsvDownload = () => {
    if (!reports.length) {
      showNotification("error", "No data available to export!");
      return;
    }
    const headers = Object.keys(reports[0]).join(",");
    const rows = reports
      .map((r) =>
        Object.values(r)
          .map((val) => `"${val}"`)
          .join(","),
      )
      .join("\n");
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "ComplaintReport.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      handleSubmit(onSubmit)();
    }
  };

  useEffect(() => {
    const code = watch("code");

    if (!code || code.trim().length < 3) {
      setClientName("");
      setValue("client", "");
      return;
    }

    const fetchClient = async () => {
      try {
        const res = await axios.get(
          `${server}/customer-account?accountCode=${code.trim()}`,
        );

        const name = res.data?.name || "";
        setClientName(name);
        setValue("client", name);
      } catch (err) {
        console.warn("Customer not found:", code);
        setClientName("");
        setValue("client", "");
      }
    };

    fetchClient();
  }, [watch("code")]);

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1 && reports.length === 0) return null;

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
            disabled={
              currentPage === totalPages || isLoading || !currentFilters
            }
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={
              currentPage === totalPages || isLoading || !currentFilters
            }
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-9"
        onKeyDown={handleKeyDown}
      >
        <Heading
          title="Complaint Report"
          bulkUploadBtn="hidden"
          codeListBtn={true}
          onRefresh={handleRefresh}
        />
        <div className="flex flex-col gap-4">
          {/* Row 1 */}
          <div className="flex gap-3 items-center">
            <div>
              <InputBox
                placeholder="Code"
                register={register}
                setValue={setValue}
                value="code"
                resetFactor={added}
              />
            </div>
            <DummyInputBoxWithLabelDarkGray
              label="Client"
              register={register}
              setValue={setValue}
              value="client"
              displayValue={clientName}
              inputValue={watch("client") || ""}
            />
          </div>

          {/* Row 2 */}
          <div className="flex gap-3">
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              value="runNumber"
              resetFactor={added}
            />
            <InputBox
              placeholder="Complaint User"
              register={register}
              setValue={setValue}
              value="branch"
              resetFactor={added}
            />
            <div className="w-full">
              <Dropdown
                title="Complaint Status"
                options={["Open", "Close"]}
                value="statusFilter"
                register={register}
                setValue={setValue}
                defaultValue=""
                resetFactor={added}
              />
            </div>
          </div>

          {/* Date range */}
          <div className="flex gap-3">
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
            <div className="flex gap-2">
              {isLoading ? (
                <OutlinedButtonRed
                  type="button"
                  label="Loading..."
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
              ) : (
                <OutlinedButtonRed type="submit" label="Show" />
              )}

              <OutlinedButtonRed
                label="Excel"
                type="button"
                onClick={handleExcelDownload}
              />
              <SimpleButton name="CSV" onClick={handleCsvDownload} />
            </div>
          </div>

          {/* Table */}
          {reports.length > 0 ? (
            <>
              <TableWithSorting
                register={register}
                setValue={setValue}
                name="bookingReportTable"
                columns={columns}
                rowData={reports}
                className="h-72"
              />
              {/* Pagination Controls */}
              <PaginationControls />
            </>
          ) : (
            <div className="flex justify-center items-center h-[45vh] border border-[#D0D5DD] rounded">
              <p className="text-gray-500">
                Enter filter criteria and click 'Show' to load complaint data
              </p>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-between mt-1">
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

export default ComplaintReport;
