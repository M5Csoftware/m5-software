"use client";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { SimpleButton } from "@/app/components/Buttons";
import { DateInputBox } from "@/app/components/InputBox";
import InputBox from "@/app/components/InputBox";
import Heading from "@/app/components/Heading";
import NotificationFlag from "@/app/components/Notificationflag";
import LoaderAnimation from "@/app/components/Loader";
import axios from "axios";
import { saveAs } from "file-saver";
import ExcelJS from "exceljs";

const HoldReport = () => {
  const { server } = useContext(GlobalContext);
  const {
    register,
    setValue,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [customerGstMap, setCustomerGstMap] = useState({});
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

  React.useEffect(() => {
    const fetchCustomerGst = async () => {
      try {
        const res = await axios.get(`${server}/customer-account`);
        const data = res.data.data || res.data || [];
        const map = {};
        data.forEach((cust) => {
          if (cust.accountCode) {
            map[cust.accountCode.toUpperCase()] = cust.gst || "";
          }
        });
        setCustomerGstMap(map);
      } catch (err) {
        console.error("Failed to fetch customer GST info:", err);
      }
    };
    if (server) fetchCustomerGst();
  }, [server]);

  const columns = [
    { key: "awbNo", label: "AwbNo" },
    { key: "createdAt", label: "ShipmentDate" },
    { key: "branch", label: "Branch" },
    { key: "origin", label: "OriginName" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "DestinationName" },
    { key: "accountCode", label: "CustomerCode" },
    { key: "gst", label: "ServiceTaxOption" },
    { key: "name", label: "CustomerName" },
    { key: "receiverFullName", label: "ConsigneeName" },
    { key: "service", label: "ServiceType" },
    { key: "shipmentForwardingNo", label: "ForwardingNo" },
    { key: "pcs", label: "Pcs" },
    { key: "totalActualWt", label: "ActWeight" },
    { key: "chargableWt", label: "ChgWeight" },
    { key: "holdReason", label: "HoldReason" },
    { key: "reason2", label: "Reason2" },
    { key: "rejectedDate", label: "Rejected Dt." },
    { key: "localMfNo", label: "LocalMfNo" },
    { key: "rcvingDate", label: "Rcving Dt." },
    { key: "unholdDate", label: "Unhold Dt." },
    { key: "remark", label: "Other Remark" },
  ];

  const parseDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  };

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDownloadExcel = async (data) => {
    if (!data.from || !data.to) {
      showNotification("error", "From and To dates are strictly required.");
      return;
    }

    setIsLoading(true);
    try {
      const fromDateObj = parseDateDDMMYYYY(data.from);
      const toDateObj = parseDateDDMMYYYY(data.to);

      fromDateObj.setHours(0, 0, 0, 0);
      toDateObj.setHours(23, 59, 59, 999);

      const filters = {
        ...data,
        from: fromDateObj.toISOString(),
        to: toDateObj.toISOString(),
        isHold: true,
      };

      const response = await axios.post(
        `${server}/reports/booking-report`,
        filters,
      );
      const reports = response.data.data || response.data || [];

      if (reports.length === 0) {
        showNotification(
          "error",
          "No hold shipments found for the selected criteria.",
        );
        setIsLoading(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();

      const groups = {
        "LHR-DPD-COU": [],
        CANADA: [],
        "AUS-COURIER": [],
        "AUS-SORTING": [],
        BRANDED: [],
        "IN TRANSIT": [],
        OTHERS: [],
      };

      reports.forEach((item) => {
        const sector = (item.sector || "").toUpperCase();
        const reason = (item.holdReason || "").toUpperCase();
        const accCode = (item.accountCode || "").toUpperCase();

        const itemWithGstAndDate = {
          ...item,
          gst: item.gst || customerGstMap[accCode] || "",
          createdAt: formatDate(item.createdAt),
          rejectedDate: formatDate(item.rejectedDate),
          rcvingDate: formatDate(item.rcvingDate),
          unholdDate: formatDate(item.unholdDate),
        };

        if (!reason || reason.trim() === "") {
          groups["IN TRANSIT"].push(itemWithGstAndDate);
        } else if (sector === "CANADA") {
          groups["CANADA"].push(itemWithGstAndDate);
        } else if (sector === "BRANDED") {
          groups["BRANDED"].push(itemWithGstAndDate);
        } else if (sector === "UK" || sector === "LHR") {
          groups["LHR-DPD-COU"].push(itemWithGstAndDate);
        } else if (sector === "AUSTRALIA" || sector === "AUS") {
          if (reason.includes("SORT")) {
            groups["AUS-SORTING"].push(itemWithGstAndDate);
          } else {
            groups["AUS-COURIER"].push(itemWithGstAndDate);
          }
        } else {
          groups["OTHERS"].push(itemWithGstAndDate);
        }
      });

      const headerStyle = {
        font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEA1B40" },
        },
        alignment: { vertical: "middle", horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      const cellStyle = {
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
        alignment: { vertical: "middle", horizontal: "center" },
      };

      Object.entries(groups).forEach(([sheetName, data]) => {
        if (data.length === 0 && sheetName === "OTHERS") return;

        const worksheet = workbook.addWorksheet(sheetName);
        worksheet.columns = columns.map((col) => ({
          header: col.label,
          key: col.key,
          width: 18,
        }));

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
          cell.style = headerStyle;
        });

        data.forEach((item) => {
          const row = worksheet.addRow(item);
          for (let i = 1; i <= columns.length; i++) {
            row.getCell(i).style = cellStyle;
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer]),
        `Hold_Report_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      showNotification(
        "success",
        `Report downloaded with ${reports.length} shipments.`,
      );
    } catch (error) {
      console.error("Excel download failed:", error);
      showNotification(
        "error",
        "Failed to generate report. Server might be down or endpoint changed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setValue("from", "");
    setValue("to", "");
    setValue("awbNo", "");
    setValue("accountCode", "");
    setValue("branch", "");
    showNotification("success", "Filters cleared.");
  };

  return (
    <div className="flex flex-col gap-9">
      <LoaderAnimation show={isLoading} />
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading
        title="Hold Report"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="bg-seasalt border border-french-gray rounded-md p-6 flex flex-col gap-6">
        <form
          onSubmit={handleSubmit(handleDownloadExcel)}
          className="flex flex-col gap-5"
        >
          <div className="flex gap-3 items-end">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From Date *"
              trigger={trigger}
              error={errors.from}
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To Date *"
              trigger={trigger}
              error={errors.to}
            />
            <InputBox
              placeholder="AWB No"
              register={register}
              setValue={setValue}
              value="awbNo"
            />
            <InputBox
              placeholder="Customer Code"
              register={register}
              setValue={setValue}
              value="accountCode"
            />
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              value="branch"
            />
            <div className="pb-1">
              <SimpleButton
                name={isLoading ? "Processing..." : "Download Excel"}
                type="submit"
                disabled={isLoading}
              />
            </div>
          </div>
        </form>
      </div>

      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-md border border-dashed border-gray-300">
        <p className="text-gray-400">
          Select date range and click Download Excel to generate the report.
        </p>
      </div>
    </div>
  );
};

export default HoldReport;
