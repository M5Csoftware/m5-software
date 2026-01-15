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
    link.download = "dummy_shipment_report.csv";
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

    XLSX.writeFile(workbook, "dummy_shipment_report.xlsx");
  };

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
        flightDate: toDDMMYYYY(item.flightDate),
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
              // setValue={setValue}
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
                label={"Show"}
                onClick={(e) => {
                  e.preventDefault();
                  fetchShipments();
                }}
              />

              <OutlinedButtonRed
                label={"Excel"}
                onClick={handleDownloadExcel}
              />

              <SimpleButton
                name={"Download CSV"}
                onClick={handleDownloadCSV}
                // disabled={!shipments.length}
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
        </div>
      </form>
    </>
  );
};

export default ChildShipmentStatusReport;
