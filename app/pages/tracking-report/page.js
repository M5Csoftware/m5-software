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
import * as XLSX from "xlsx";

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
    []
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
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching customer accounts for code list:", error);
    }
  };

  // Auto-fetch client name when code changes
  useEffect(() => {
    const fetchClientName = async () => {
      if (watchCode && watchCode.trim() !== "") {
        try {
          const customerRes = await axios.get(`${server}/customer-account`, {
            params: { accountCode: watchCode.trim() },
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
  }, [watchCode, server, setValue]);

  // Function to fetch tracking data
  const fetchTrackingData = async (data) => {
    setLoading(true);
    try {
      const {
        runNumber,
        code,
        sector,
        destination,
        network,
        service,
        counterPart,
        from,
        to,
      } = data;

      // Build query parameters
      const params = {};
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

      if (runNumber) params.runNumber = runNumber;
      if (code) params.accountCode = code;
      if (sector) params.sector = sector;
      if (destination) params.destination = destination;
      if (network) params.network = network;
      if (service) params.service = service;
      if (counterPart) params.counterPart = counterPart;

      const response = await axios.get(`${server}/tracking-report`, { params });

      if (response.data && Array.isArray(response.data)) {
        setRowData(response.data);
        showNotification("success", `Found ${response.data.length} records`);
      } else {
        setRowData([]);
        showNotification("info", "No records found");
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      showNotification("error", "Error fetching data. Please try again.");
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data) => {
    const {
      runNumber,
      code,
      sector,
      destination,
      network,
      service,
      counterPart,
      from,
      to,
    } = data;

    if (
      !runNumber &&
      !code &&
      !sector &&
      !destination &&
      !network &&
      !service &&
      !counterPart &&
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

    fetchTrackingData(data);
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
    showNotification("success", "Page refreshed successfully");
  };

  const handleClose = () => {
    reset();
    setRowData([]);
    setClientName("");
    setRefreshKey((prev) => prev + 1);
  };

  // Handle code list action
  const handleCodeListAction = (action, data) => {
    if (action === "edit") {
      setValue("code", data.accountCode);
      setToggleCodeList(false);
    }
  };

  // Download Excel
  const downloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to export");
      return;
    }

    try {
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
        `tracking_report_${new Date().toISOString().split("T")[0]}.xlsx`
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
            .join(",")
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

  return (
    <>
      <form className="flex flex-col gap-9" onSubmit={handleSubmit(onSubmit)}>
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
              <TableWithSorting
                register={register}
                setValue={setValue}
                resetFactor={refreshKey}
                name="tracking"
                columns={columns}
                rowData={rowData}
              />
            ) : (
              <div className="flex justify-center items-center h-[45vh] border border-[#D0D5DD] rounded">
                <p className="text-gray-500">
                  Enter filter criteria and click 'Show' to load tracking data
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <div>
              {/* <OutlinedButtonRed label={"Close"} onClick={handleClose} type="button" /> */}
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
