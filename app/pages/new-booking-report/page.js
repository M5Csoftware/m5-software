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

const NewBookingReport = () => {
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
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const { server } = useContext(GlobalContext);
  const [reports, setReports] = useState([]);

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
    { key: "manifestNo", label: "Manifest Number" },
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
    { key: "chargeableWt", label: "Chargeable Wt" },
    { key: "content", label: "Shipment Content" },
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
    { key: "entryType", label: "Entry Type" },
    { key: "isQuickInscan", label: "Quick Inscan" },
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
        // Fetch customer account by code
        const response = await axios.get(
          `${server}/customer-account?accountCode=${codeValue.trim()}`,
        );

        if (response.data && response.data.name) {
          setValue("client", response.data.name);
        } else {
          setValue("client", "");
        }
      } catch (error) {
        console.error("Error fetching customer name:", error);
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

  // Update the onSubmit function to use GET instead of POST
  const onSubmit = async (data) => {
    setIsLoading(true); // Start loading
    try {
      console.log("Form data received:", data);

      // Validate dates before submission
      if (!data.from || !data.to) {
        showNotification("error", "Please select both From and To dates");
        return;
      }

      // Parse DD/MM/YYYY format from DateInputBox
      const fromDate = parseDateDDMMYYYY(data.from);
      const toDate = parseDateDDMMYYYY(data.to);

      console.log("Parsed dates:", { fromDate, toDate });

      // Check if dates are valid
      if (
        !fromDate ||
        !toDate ||
        isNaN(fromDate.getTime()) ||
        isNaN(toDate.getTime())
      ) {
        showNotification(
          "error",
          "Invalid date format. Please select valid dates.",
        );
        return;
      }

      // Set time ranges for proper filtering
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      // Build query parameters for GET request
      const params = new URLSearchParams({
        code: data.code || "",
        runNumber: data.runNumber || "",
        origin: data.origin || "",
        sector: data.sector || "",
        salePerson: data.salePerson || "",
        branch: data.branch || "",
        destination: data.destination || "",
        service: data.service || "",
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        holdShipments: holdShipments.toString(),
        skipMum: skipMum.toString(),
        skipAmd: skipAmd.toString(),
        csbV: csbV.toString(),
        includeChild: includeChild.toString(),
        balanceShipment: balanceShipment.toString(),
      });

      console.log("Submitting data with params:", params.toString());

      // Use GET request instead of POST
      const response = await axios.get(
        `${server}/reports/new-booking-report?${params.toString()}`,
      );

      console.log("API Response count:", response.data?.length || 0);

      // Filter only available columns and remove empty/null values
      const allowedKeys = columns.map((col) => col.key);
      const filteredData = (response.data || []).map((item) => {
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
      showNotification("", "");

      // Populate client input from API response only if code was provided
      if (
        data.code &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        const first = response.data[0];
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

      if (filteredData.length > 0) {
        showNotification(
          "success",
          `New booking report generated (${filteredData.length} records)`,
        );
      } else {
        showNotification("error", "No records found for selected criteria");
      }
    } catch (error) {
      console.error("Error Downloading report:", error);
      const errorMessage =
        error.response?.data?.error || "Error downloading booking report";
      setReports([]);
      showNotification("error", errorMessage);
    } finally {
      setIsLoading(false); // Stop loading
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
    link.setAttribute("download", "new-booking-report.csv");
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
    showNotification("success", "Refreshed");
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
        title={"New Booking Report"}
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        bulkUploadBtn="hidden"
      />
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 items-center">
          <InputBox
            placeholder={"Code"}
            register={register}
            setValue={setValue}
            value={"code"}
            resetFactor={added}
          />
          <DummyInputBoxWithLabelDarkGray
            label="Client"
            register={register}
            setValue={setValue}
            value="client"
            resetFactor={added}
            inputValue={watch("client") || ""}
          />
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
        </div>

        <div className="flex gap-3">
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

        <div className="flex gap-3">
          <div className="w-[19.4%]">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
              trigger={trigger}
              error={errors.from}
              validation={{ required: "From date is required" }}
              maxToday
              resetFactor={added}
            />
          </div>
          <div className="w-[19.4%]">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
              maxToday
              trigger={trigger}
              error={errors.to}
              validation={{
                required: "To date is required",
              }}
              resetFactor={added}
            />
          </div>

          <div>
            <OutlinedButtonRed
              type="submit"
              label={isLoading ? "Loading..." : "View"}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-between items-center gap-3">
            <div className="w-[120px] ml-2">
              <RedCheckbox
                isChecked={holdShipments}
                setChecked={setHoldShipments}
                id="holdShipments"
                register={register}
                setValue={setValue}
                label="Hold Shipments"
              />
            </div>

            <div className="w-[98px]">
              <RedCheckbox
                isChecked={skipMum}
                setChecked={setSkipMum}
                id="skipMum"
                register={register}
                setValue={setValue}
                label="Skip MUM"
              />
            </div>

            <div className="w-[90px]">
              <RedCheckbox
                isChecked={skipAmd}
                setChecked={setSkipAmd}
                id="skipAmd"
                register={register}
                setValue={setValue}
                label="Skip AMD"
              />
            </div>
            <div className="w-[90px]">
              <RedCheckbox
                isChecked={csbV}
                setChecked={setcsbV}
                id="csbV"
                register={register}
                setValue={setValue}
                label="CSB V"
              />
            </div>

            <div className="w-[150px]">
              <RedCheckbox
                isChecked={balanceShipment}
                setChecked={setBalanceShipmet}
                id="balanceShipment"
                register={register}
                setValue={setValue}
                label="Balance Shipment"
              />
            </div>
            <div className="w-[150px]">
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
          name="newBookingReportTable"
          columns={columns}
          rowData={reports}
          className={`h-72`}
        />
        <div className="flex justify-between items-center">
          <div></div>

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

export default NewBookingReport;
