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
    []
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
          }))
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
          params: { accountCode: watchCode.trim() },
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

  // Submit handler
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { from, to, code, runNumber, branch, statusFilter } = data;

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

      const complaintsRes = await axios.get(`${server}/complaint-report`, {
        params: { from: fromFormatted, to: toFormatted },
      });

      console.log("API Response:", complaintsRes.data);

      // Use reports directly from API response
      const reportsFromAPI = complaintsRes.data?.reports || [];
      setReports(reportsFromAPI);

      // Apply client-side filters
      let filteredReports = reportsFromAPI;

      if (code && code.trim() !== "") {
        filteredReports = filteredReports.filter(
          (report) =>
            report.customerCode &&
            report.customerCode.toString().toLowerCase() ===
              code.trim().toLowerCase()
        );
      }

      if (runNumber && runNumber.trim() !== "") {
        filteredReports = filteredReports.filter(
          (report) =>
            report.sector &&
            report.sector
              .toString()
              .toLowerCase()
              .includes(runNumber.trim().toLowerCase())
        );
      }

      if (branch && branch.trim() !== "") {
        filteredReports = filteredReports.filter(
          (report) =>
            report.actionUser &&
            report.actionUser
              .toString()
              .toLowerCase()
              .includes(branch.trim().toLowerCase())
        );
      }

      if (statusFilter && statusFilter.trim() !== "") {
        filteredReports = filteredReports.filter(
          (report) =>
            report.status &&
            report.status.toLowerCase() === statusFilter.trim().toLowerCase()
        );
      }
      showNotification("success", "Complaint report fetched successfully.");

      setReports(filteredReports);

      // ... rest of your code
    } catch (error) {
      console.error("Error fetching complaint report:", error);
      showNotification("error", "Failed to fetch complaints.");
    } finally {
      setIsLoading(false);
    }
  };

  // Close button handler
  const handleClose = () => {
    reset();
    setReports([]);
    setClientName("");
    setIsLoading(false);
    setAdded((prev) => !prev);
  };

  // Refresh button handler
  const handleRefresh = () => {
    reset();
    setReports([]);
    setClientName("");
    setIsLoading(false);
    setAdded((prev) => !prev);
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
          .join(",")
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
          `${server}/customer-account?accountCode=${code.trim()}`
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

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-9">
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
          <TableWithSorting
            register={register}
            setValue={setValue}
            name="bookingReportTable"
            columns={columns}
            rowData={reports}
            className="h-72"
          />

          {/* Footer actions */}
          <div className="flex justify-between mt-1">
            <div>
              {/* <OutlinedButtonRed
                label="Close"
                type="button"
                onClick={handleClose}
              /> */}
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
