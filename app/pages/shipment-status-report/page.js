"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { Dropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import InputBox, { DateInputBox} from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import * as XLSX from "xlsx";

const ShipmentStatusReport = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, getValues, reset, watch } = useForm();
  const [ShipmentReportReset, setShipmentReportReset] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "error",
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const router = useRouter();

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const columns = [
    { key: "awbNo", label: "AwbNo" },
    { key: "createdAt", label: "ShipmentDate" },
    { key: "branch", label: "Branch" },
    { key: "origin", label: "OriginName" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "DestinationName" },
    { key: "accountCode", label: "CustomerCode" },
    { key: "customer", label: "CustomerName" },
    { key: "salePerson", label: "SalePerson" },
    { key: "counterpart", label: "Counter part" },
    { key: "receiverFullName", label: "ConsigneeName" },
    { key: "receiverAddressLine1", label: "ConsigneeAddress" },
    { key: "pcs", label: "Pcs" },
    { key: "goodstype", label: "GoodsDesc" },
    { key: "service", label: "ServiceType" },
    { key: "totalActualWt", label: "ActWeight" },
    { key: "content", label: "ShipmentContent" },
    { key: "holdReason", label: "HoldReason" },
    { key: "operationRemark", label: "ShipmentRemark" },
  ];

  const toDDMMYYYY = (date) => {
    if (!date) return "";

    if (/^\d{8}$/.test(String(date))) {
      const str = String(date);
      return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return date;

    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  const handleRefresh = () => {
    setShipmentReportReset(!ShipmentReportReset);
    setShipments([]);
    reset();
    setNotification({ visible: false, message: "", type: "error" });
  };

  // Fetch customer name by account code
  const fetchCustomerNameByAccountCode = async (accountCode) => {
    if (!accountCode || accountCode.trim() === "") {
      setValue("client", "");
      return;
    }

    try {
      const response = await axios.get(
        `${server}/customer-account?accountCode=${accountCode.trim()}`
      );

      if (response.data) {
        const customerData = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        if (customerData && customerData.name) {
          setValue("client", customerData.name);
          showNotification("success", "Customer name loaded successfully");
        } else {
          setValue("client", "");
          showNotification("error", "Customer not found");
        }
      }
    } catch (error) {
      console.error("Error fetching customer name:", error);
      setValue("client", "");
      showNotification("error", "Failed to fetch customer name");
    }
  };

  // Watch for accountCode changes
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "code") {
        const accountCode = value.code;
        
        if (accountCode && accountCode.trim() !== "") {
          const timeoutId = setTimeout(() => {
            fetchCustomerNameByAccountCode(accountCode);
          }, 500);
          
          return () => clearTimeout(timeoutId);
        } else {
          setValue("client", "");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // Fetch shipments from backend with all filters
  const fetchShipments = async () => {
    const filters = getValues();

    if (!filters.from || !filters.to) {
      setNotification({
        visible: true,
        message: "Please select From and To dates",
        type: "error",
      });
      setShipments([]);
      return;
    }

    const fromParsed = parseDateDDMMYYYY(filters.from);
    const toParsed = parseDateDDMMYYYY(filters.to);

    if (
      !fromParsed ||
      !toParsed ||
      isNaN(fromParsed.getTime()) ||
      isNaN(toParsed.getTime())
    ) {
      setNotification({
        visible: true,
        message: "Invalid date format",
        type: "error",
      });
      setShipments([]);
      return;
    }

    fromParsed.setHours(0, 0, 0, 0);
    toParsed.setHours(23, 59, 59, 999);

    filters.from = fromParsed.toISOString();
    filters.to = toParsed.toISOString();

    try {
      const res = await fetch(`${server}/shipment-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setNotification({
          visible: true,
          message: "No shipments found for the given filters",
          type: "error",
        });
        setShipments([]);
        return;
      }

      setNotification({
        visible: true,
        message: `${data.length} shipments found`,
        type: "success",
      });
      const formatted = data.map((item) => ({
        ...item,
        createdAt: toDDMMYYYY(item.createdAt),
      }));
      setShipments(formatted);
    } catch (err) {
      setNotification({
        visible: true,
        message: `Error fetching shipments: ${err.message}`,
        type: "error",
      });
      setShipments([]);
    }
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
    link.download = "shipment_report.csv";
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
    const worksheet = XLSX.utils.json_to_sheet(shipments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipments");
    XLSX.writeFile(workbook, "shipment_report.xlsx");
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

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === "Enter") {
        fetchShipments();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form className="flex flex-col gap-9">
        <Heading
          title="Shipment Status Report"
          bulkUploadBtn="hidden"
          onRefresh={handleRefresh}
          codeListBtn="hidden"
          fullscreenBtn={true}
          onClickFullscreenBtn={() => setIsFullscreen(true)}
        />

        <div className="flex flex-col gap-3">
          {/* Filters */}
          <div className="flex gap-3 items-center">
            <div className="w-[495px]">
              <InputBox
                placeholder="Code"
                register={register}
                setValue={setValue}
                resetFactor={ShipmentReportReset}
                value="code"
              />
            </div>
            <DummyInputBoxWithLabelDarkGray
              register={register}
              label="Customer Name"
              setValue={setValue}
              value="client"
            />
          </div>

          <div className="flex gap-3">
            <InputBox
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="runNumber"
            />
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="branch"
            />
            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="origin"
            />
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="sector"
            />
            <Dropdown
              options={["All", "Hold", "Pending", "Delivered"]}
              value="status"
              title="Select Status"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
            />
          </div>

          <div className="flex gap-3">
            <InputBox
              placeholder="Destination"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="destination"
            />
            <InputBox
              placeholder="Network"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="network"
            />
            <InputBox
              placeholder="Service"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="service"
            />
            <InputBox
              placeholder="Counter Part"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="counterPart"
            />
          </div>

          <div className="flex gap-3">
            <DateInputBox
              placeholder="From"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="from"
            />
            <DateInputBox
              placeholder="To"
              register={register}
              setValue={setValue}
              resetFactor={ShipmentReportReset}
              value="to"
            />
            <div className="flex gap-2">
              <OutlinedButtonRed label="Show" onClick={fetchShipments} />
              <OutlinedButtonRed label="Excel" onClick={handleDownloadExcel} />
              <SimpleButton
                name="Download CSV"
                onClick={handleDownloadCSV}
                disabled={!shipments.length}
              />
            </div>
          </div>

          {/* Table */}
          <TableWithSorting
            register={register}
            setValue={setValue}
            name="shipments"
            rowData={shipments}
            columns={columns}
            className="h-[40vh]"
          />

          {/* Fullscreen overlay */}
          {isFullscreen && (
            <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Shipments Status Report
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
                  name="shipments"
                  rowData={shipments}
                  columns={columns}
                  className="h-full w-full"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <div></div>
          </div>
        </div>
      </form>
    </>
  );
};

export default ShipmentStatusReport;