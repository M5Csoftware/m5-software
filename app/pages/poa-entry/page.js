"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import AwbPoa from "@/app/components/poa-entry/AwbPoa";
import ExcelPoa from "@/app/components/poa-entry/ExcelPoa";
import RunWishPoa from "@/app/components/poa-entry/RunWishPoa";
import * as XLSX from "xlsx";

function POAEntry() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("AWB");
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };

  // 📥 Download Excel/CSV functionality
  const handleDownload = () => {
    // Sample data - replace this with your actual data source
    const sampleData = [
      {
        awbNo: "MPL003118",
        shipmentDate: "2025-11-08",
        consigneeName: "Altaf"
      },
      {
        awbNo: "MPL003119",
        shipmentDate: "2025-11-09",
        consigneeName: "John Smith"
      },
      {
        awbNo: "MPL003120",
        shipmentDate: "2025-11-10",
        consigneeName: "Mike Johnson"
      },
      {
        awbNo: "MPL003121",
        shipmentDate: "2025-11-05",
        consigneeName: "Pierre Dubois"
      },
      {
        awbNo: "MPL003122",
        shipmentDate: "2025-11-12",
        consigneeName: "Sarah Wilson"
      }
    ];

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "POA Data");
    
    // Generate Excel file and download
    const fileName = `POA_Entry_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <form className="flex flex-col gap-9">
      <Heading
        title={`POA Entry`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        downloadBtn
        onClickDownloadBtn={handleDownload}
        onRefresh={handleRefresh}
      />

      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id={`AWB`}
          label={`AWB`}
          name={`demo`}
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id={`Run Wise`}
          label={`Run Wise`}
          name={`demo`}
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id={`Excel`}
          label={`Excel`}
          name={`demo`}
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      {/* ✅ Pass refreshKey so child remounts on refresh */}
      {demoRadio === "AWB" && <AwbPoa key={`awb-${refreshKey}`} />}
      {demoRadio === "Run Wise" && <RunWishPoa key={`run-${refreshKey}`} />}
      {demoRadio === "Excel" && <ExcelPoa key={`excel-${refreshKey}`} />}
    </form>
  );
}

export default POAEntry;