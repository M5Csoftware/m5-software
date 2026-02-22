"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import AutoAWB from "@/app/components/bulk-upload/AutoAWB";
import ManualAWB from "@/app/components/bulk-upload/ManualAWB";

function BulkUpload() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("Auto AWB No");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = demoRadio === "Auto AWB No" ? "/auto-awb-bulkUpload.xlsx" : "/shipment_full_sample.xlsx";
    link.setAttribute("download", demoRadio === "Auto AWB No" ? "auto-awb-bulkUpload.xlsx" : "shipment_full_sample.xlsx");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };


  return (
    <div className="flex flex-col gap-3">
      <Heading
        title="Bulk Upload"
        bulkUploadBtn="hidden"
        downloadBtn={true}
        codeListBtn={true}
        fullscreenBtn={false}
        onRefresh={handleRefresh}
        onClickDownloadBtn={handleDownloadTemplate}
      />

      <div className="flex w-full gap-3 mt-3 mb-6">
        <RadioButtonLarge
          id="Auto AWB No"
          label="Auto AWB No"
          name="bulk-upload"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Manual AWB No"
          label="Manual AWB No"
          name="bulk-upload"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      {/* ✅ Conditionally render like in POAEntry */}
      {demoRadio === "Auto AWB No" && <AutoAWB key={`details-${refreshKey}`} />}
      {demoRadio === "Manual AWB No" && <ManualAWB key={`summary-${refreshKey}`} />}
    </div>
  );
}

export default BulkUpload;
