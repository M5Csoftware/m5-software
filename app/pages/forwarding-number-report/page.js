"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithSorting } from "@/app/components/Table";
import { X } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import NotificationFlag from "@/app/components/Notificationflag";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ForwardingNumberReport = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, getValues, reset } = useForm();
  const [dateFormat, setdateFormat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [ForwardingReportReset, setForwardingReportReset] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "error",
  });

  const contentRef = useRef(null);

  // Updated columns to include parent/child info
  const columns = [
    { key: "awbNo", label: "AwbNo" },
    { key: "parentAwbNo", label: "Parent AWB" },
    { key: "createdAt", label: "ShipmentDate" },
    { key: "runNo", label: "RunNo" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "DestinationName" },
    { key: "accountCode", label: "CustomerCode" },
    { key: "customer", label: "CustomerName" },
    { key: "receiverFullName", label: "ConsigneeName" },
    { key: "service", label: "ServiceType" },
    { key: "upsService", label: "UPSService" },
    { key: "forwarder", label: "ShipmentForwarderTo" },
    { key: "forwardingNo", label: "ShipmentForwardingNo" },
  ];

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const handleDownloadPDF = async () => {
    if (!shipments.length) {
      setNotification({
        visible: true,
        message: "No data available to download",
        type: "error",
      });
      return;
    }

    const input = contentRef.current;
    if (!input) return;

    input.style.visibility = "visible";
    input.style.position = "static";

    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "letter");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    input.style.visibility = "hidden";
    input.style.position = "absolute";

    pdf.save(
      `Forwarding_Number_Report_${new Date().toISOString().slice(0, 10)}.pdf`
    );

    setNotification({
      visible: true,
      message: "PDF downloaded successfully",
      type: "success",
    });
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

    // Prepare data for export - flatten nested objects if needed
    const exportData = shipments.map((item) => ({
      AwbNo: item.awbNo || "",
      ParentAWB: item.parentAwbNo || "",
      ShipmentDate: item.createdAt || "",
      RunNo: item.runNo || "",
      Sector: item.sector || "",
      DestinationName: item.destination || "",
      CustomerCode: item.accountCode || "",
      CustomerName: item.customer || "",
      ConsigneeName: item.receiverFullName || "",
      ServiceType: item.service || "",
      UPSService: item.upsService || "",
      ShipmentForwarderTo: item.forwarder || "",
      ShipmentForwardingNo: item.forwardingNo || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ForwardingReport");
    XLSX.writeFile(
      wb,
      `Forwarding_Number_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    setNotification({
      visible: true,
      message: "Excel file downloaded successfully",
      type: "success",
    });
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

    const headers = [
      "AwbNo",
      "Parent AWB",
      "ShipmentDate",
      "RunNo",
      "Sector",
      "DestinationName",
      "CustomerCode",
      "CustomerName",
      "ConsigneeName",
      "ServiceType",
      "UPSService",
      "ShipmentForwarderTo",
      "ShipmentForwardingNo",
    ];

    const csvRows = shipments.map((item) => [
      item.awbNo || "",
      item.parentAwbNo || "",
      item.createdAt || "",
      item.runNo || "",
      item.sector || "",
      item.destination || "",
      item.accountCode || "",
      item.customer || "",
      item.receiverFullName || "",
      item.service || "",
      item.upsService || "",
      item.forwarder || "",
      item.forwardingNo || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(
      blob,
      `Forwarding_Number_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );

    setNotification({
      visible: true,
      message: "CSV file downloaded successfully",
      type: "success",
    });
  };

  const fetchShipments = async (e) => {
    if (e) e.preventDefault();
    try {
      const filters = getValues();

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

      if (!filters.from || !filters.to) {
        setNotification({
          visible: true,
          message: "Please select From and To dates",
          type: "error",
        });
        setShipments([]);
        return;
      }

      // ✅ Use the new endpoint for forwarding report
      const res = await axios.post(
        `${server}/shipment-status/forwarding-no-report`,
        filters
      );

      if (!res.data || res.data.length === 0) {
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
        message: `${res.data.length} shipments found (including child shipments)`,
        type: "success",
      });
      setShipments(res.data);
    } catch (err) {
      setNotification({
        visible: true,
        message: `Error fetching shipments: ${err.message}`,
        type: "error",
      });
      setShipments([]);
    }
  };

  const handleRefresh = () => {
    setForwardingReportReset(!ForwardingReportReset);
    setShipments([]);
    reset();
    setdateFormat(false);
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

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <form className="flex flex-col gap-9" onSubmit={fetchShipments}>
        <Heading
          title="Forwarding Number Report"
          bulkUploadBtn="hidden"
          fullscreenBtn={true}
          onClickFullscreenBtn={() => setIsFullscreen(true)}
          codeListBtn="hidden"
          onRefresh={handleRefresh}
        />
        <div className="flex flex-col gap-3">
          {/* Filters */}
          <div className="flex gap-2">
            <InputBox
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              value="runNumber"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              value="branch"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              value="origin"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              value="sector"
              resetFactor={ForwardingReportReset}
            />
          </div>

          <div className="flex gap-2">
            <InputBox
              placeholder="Counter Part"
              register={register}
              setValue={setValue}
              value="counterPart"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Destination"
              register={register}
              setValue={setValue}
              value="destination"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Service"
              register={register}
              setValue={setValue}
              value="service"
              resetFactor={ForwardingReportReset}
            />
            <InputBox
              placeholder="Network"
              register={register}
              setValue={setValue}
              value="network"
              resetFactor={ForwardingReportReset}
            />
          </div>

          <div className="flex gap-2 items-center">
            <div className="w-[350px]">
              <InputBox
                placeholder="Code"
                register={register}
                setValue={setValue}
                value="code"
                resetFactor={ForwardingReportReset}
              />
            </div>
            <InputBox
              placeholder="Client"
              register={register}
              setValue={setValue}
              value="client"
              resetFactor={ForwardingReportReset}
            />
            <div className="w-[250px]">
              <RedCheckbox
                isChecked={dateFormat}
                setChecked={setdateFormat}
                id="singleForwarding"
                register={register}
                setValue={setValue}
                value="singleForwarding"
                label="Single Forwarding No."
              />
            </div>
          </div>

          <div className="flex gap-2">
            <div className="w-full flex gap-2">
              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                value="from"
                resetFactor={ForwardingReportReset}
              />
              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                value="to"
                resetFactor={ForwardingReportReset}
              />
            </div>
            <div className="flex gap-2">
              <OutlinedButtonRed label="Show" type="submit" />
              <DownloadDropdown
                handleDownloadPDF={handleDownloadPDF}
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
              />
            </div>
          </div>

          {/* Table */}
          <div className="flex flex-col gap-3">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="Forwarding Number Report"
              className="min-h-[40vh] max-h-[45vh]"
              columns={columns}
              rowData={shipments}
            />

            {isFullscreen && (
              <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Forwarding Number Report
                  </h2>
                  <button onClick={() => setIsFullscreen(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-auto">
                  <TableWithSorting
                    register={register}
                    setValue={setValue}
                    name="Forwarding Number Report"
                    columns={columns}
                    rowData={shipments}
                    className="h-full w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden content for PDF rendering */}
        <div
          ref={contentRef}
          className="text-[10px] leading-tight p-4 bg-white w-full"
          style={{
            visibility: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <h2 className="text-center font-bold mb-4 text-xs">
            Forwarding Number Report (Including Child Shipments)
          </h2>

          <table className="w-full border-collapse">
            <thead className="border-y-2 border-t-[#000080] border-y-[#ff0000]">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="pt-2 pb-4 px-2 text-left">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shipments.map((item, idx) => (
                <tr
                  key={idx}
                  className={`align-top ${item.isChild ? "bg-gray-50" : ""}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 pt-3">
                      {item[col.key] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </form>
    </>
  );
};

export default ForwardingNumberReport;
