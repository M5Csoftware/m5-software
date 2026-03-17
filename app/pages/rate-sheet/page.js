"use client";

import { RadioRedButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import { RadioMidRedButton } from "@/app/components/RadioButton";
import UploadRate from "@/app/components/rat-sheet/UploadRate";
import ViewRate from "@/app/components/rat-sheet/ViewRate";
import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";

const RateSheet = () => {
  const { server } = useContext(GlobalContext);
  const [activeTab, setActiveTab] = useState(0); // Track active tab
  const [tabChange, setTabChange] = useState(false);
  const [accountType, setAccountType] = useState("ViewRate");
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key
  const [rateSheetData, setRateSheetData] = useState([]); // Store rate sheet data for download
  
  const { register, setValue, handleSubmit, getValues, watch, reset } = useForm();
  const { rates } = useContext(GlobalContext);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const tabs = [
    {
      id: "ViewRate",
      label: "View Rate",
      value: "viewRate",
      RadioComponent: RadioMidRedButton,
    },
    {
      id: "Upload Rate",
      label: "Upload Rate",
      value: "uploadRate",
      RadioComponent: RadioMidRedButton,
    },
  ];

  const handleTabChange = (index, value) => {
    setActiveTab(index);
    setAccountType(value);
    setTabChange(!tabChange);
  };

  // 🔄 Refresh functionality - keeps tab, clears form and child components
  const handleRefresh = () => {
    reset(); // Reset parent form
    setRefreshKey((prev) => prev + 1); // Force child component remount
    setRateSheetData([]); // Clear stored data
    showNotification("info", "Page refreshed successfully");
  };

  // 📥 Download Excel functionality
  const handleDownload = async () => {
    try {
      // Fetch latest data from API
      const response = await axios.get(`${server}/rate-sheet`);
      const data = response.data;

      if (!data || data.length === 0) {
        showNotification("error", "No data available to download");
        return;
      }

      // Prepare data for Excel export
      const excelData = data.map((item) => {
        const row = {
          Shipper: item.shipper || "",
          Network: item.network || "",
          Service: item.service || "",
          Type: item.type === "B" ? "Bulk" : "Slab",
          "Min Weight": item.minWeight || "",
          "Max Weight": item.maxWeight || "",
        };

        // Add all 35 zones
        for (let i = 1; i <= 35; i++) {
          row[`Zone ${i}`] = item[i.toString()] || "";
        }

        return row;
      });

      // Create worksheet
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Shipper
        { wch: 15 }, // Network
        { wch: 15 }, // Service
        { wch: 10 }, // Type
        { wch: 12 }, // Min Weight
        { wch: 12 }, // Max Weight
        ...Array(35).fill({ wch: 10 }), // Zones 1-35
      ];
      worksheet["!cols"] = colWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rate Sheet");

      // Generate filename with timestamp
      const fileName = `Rate_Sheet_${new Date().toISOString().split("T")[0]}.xlsx`;
      
      // Download file
      XLSX.writeFile(workbook, fileName);
      
      showNotification("success", "Rate sheet downloaded successfully");
    } catch (error) {
      console.error("Error downloading rate sheet:", error);
      showNotification("error", "Failed to download rate sheet");
    }
  };

  const onSubmit = async (rowData) => {
    try {
      console.log("Uploading data:", rowData);
      const response = await axios.post(`${server}/rate-sheet`, rowData);
      console.log("Upload successful", response.data);
      showNotification("success", "Data uploaded successfully");
      
      // Optionally refresh the view after upload
      if (activeTab === 0) {
        setRefreshKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error uploading data:", error);
      showNotification("error", "Failed to upload data");
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      
      <Heading
        title="Rate Sheet"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        downloadBtn
        onClickDownloadBtn={handleDownload}
        onRefresh={handleRefresh}
      />
      
      <RadioRedButton
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        register={register}
        setValue={setValue}
        accountType={accountType}
        setAccountType={setAccountType}
      />
      
      <div className="flex w-full">
        <div
          className={`${
            activeTab === 0
              ? "w-full h-full opacity-100"
              : "w-0 h-0 opacity-0 overflow-hidden"
          }`}
        >
          {/* ✅ Pass refreshKey so child remounts on refresh */}
          <ViewRate
            key={`view-${refreshKey}`}
            rateData={rates}
            register={register}
            setValue={setValue}
            tabChange={tabChange}
            reset={reset}
            watch={watch}
            onDataUpdate={setRateSheetData}
          />
        </div>
        
        <div
          className={`${
            activeTab === 1
              ? "w-full h-full opacity-100"
              : "w-0 h-0 opacity-0 overflow-hidden"
          }`}
        >
          {/* ✅ Pass refreshKey so child remounts on refresh */}
          <UploadRate
            key={`upload-${refreshKey}`}
            register={register}
            setValue={setValue}
            tabChange={tabChange}
            reset={reset}
            watch={watch}
            onSubmit={onSubmit}
          />
        </div>
      </div>
    </form>
  );
};

export default RateSheet;