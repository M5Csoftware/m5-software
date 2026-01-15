"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

const RunNumberReport = () => {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const columns = [
    { key: "runNo", label: "Run No" },
    { key: "sector", label: "Sector" },
    { key: "date", label: "Date" },
    { key: "flight", label: "Flight" },
    { key: "flightNo", label: "Flight No" },
    { key: "counterPart", label: "Counter Part" },
    { key: "obc", label: "OBC" },
    { key: "almawb", label: "AL Mawb" },
    { key: "runWt", label: "Run Wt" },
    { key: "masterWt", label: "Master Wt" },
    { key: "diffWt", label: "Diff Wt" },
  ];

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleFetchData = async () => {
    const fromDate = watch("from");
    const toDate = watch("to");
    const runNo = watch("runNo");

    // Validation - at least one filter must be provided
    if (!fromDate && !toDate && (!runNo || runNo.trim() === "")) {
      showNotification(
        "error",
        "Please provide at least one filter: Run Number or Date Range"
      );
      return;
    }

    // If dates are provided, validate them
    if ((fromDate || toDate) && !(fromDate && toDate)) {
      showNotification("error", "Please select both From and To dates");
      return;
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      showNotification("error", "From date cannot be after To date");
      return;
    }

    setLoading(true);

    try {
      // Build query params
      const params = new URLSearchParams();

      // Add date range if both dates are provided
      if (fromDate && toDate) {
        params.append("from", dmyToYmd(fromDate));
        params.append("to", dmyToYmd(toDate));
      }

      // Add runNo filter if provided
      if (runNo && runNo.trim() !== "") {
        params.append("runNo", runNo.trim());
      }

      const response = await axios.get(
        `${server}/run-number-report?${params.toString()}`
      );

      if (response.data.success) {
        setRowData(response.data.data);
        showNotification(
          "success",
          `Successfully fetched ${response.data.count} records`
        );
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to fetch data"
        );
        setRowData([]);
      }
    } catch (error) {
      console.error("Error fetching run number report:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch report data"
      );
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("warning", "No data to download");
      return;
    }

    try {
      // Create CSV header
      const headers = columns.map((col) => col.label).join(",");

      // Create CSV rows
      const rows = rowData.map((row) =>
        columns
          .map((col) => {
            const value = row[col.key] || "";
            // Escape commas and quotes in values
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
      );

      // Combine header and rows
      const csv = [headers, ...rows].join("\n");

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      const fromDate = watch("from") || "all";
      const toDate = watch("to") || "all";
      const fileName = `run_number_report_${fromDate}_to_${toDate}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "CSV downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Failed to download CSV");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading title="Run Number Report" bulkUploadBtn="hidden" />

      <div className="flex gap-3">
        <InputBox
          register={register}
          setValue={setValue}
          placeholder={`Run Number`}
          value={`runNo`}
        />
        <DateInputBox
          register={register}
          setValue={setValue}
          value={`from`}
          placeholder="From"
        />
        <DateInputBox
          register={register}
          setValue={setValue}
          value={`to`}
          placeholder="To"
        />
        <div>
          <OutlinedButtonRed
            label={loading ? "Loading..." : "Show"}
            onClick={handleFetchData}
            disabled={loading}
          />
        </div>
        <div>
          <SimpleButton
            name="Download CSV"
            onClick={handleDownloadCSV}
            disabled={rowData.length === 0}
          />
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          name="bagging"
          columns={columns}
          rowData={rowData}
          className="h-[450px]"
        />
      </div>

      <div className="flex justify-end"></div>
    </div>
  );
};

export default RunNumberReport;
