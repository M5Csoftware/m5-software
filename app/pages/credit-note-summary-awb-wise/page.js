"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import SaleDetails from "@/app/components/credit-note-summary/SaleDetails";
import SaleSummary from "@/app/components/credit-note-summary/SaleSummary";
import CollectionSummary from "@/app/components/credit-note-summary/CollectionSummary";



function CreditReportSummaryAwbWise() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("Sale Details");
  const [refreshKey, setRefreshKey] = useState(0);


  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <Heading
        title="Credit Note Summary AWB No. Wise"
        bulkUploadBtn="hidden"
        downloadBtn= {false}
        codeListBtn={true}
        fullscreenBtn={false}
        onRefresh={handleRefresh}
      />

      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id="Sale Details"
          label="Sale Details"
          name="credit-note-summary"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Sale Summary"
          label="Sale Summary"
          name="credit-note-summary"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Sale Summary With Collection Summary"
          label="Sale Summary With Collection Summary"
          name="credit-note-summary"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        
      </div>

      {demoRadio === "Sale Details" && <SaleDetails key={`details-${refreshKey}`} />}
      {demoRadio === "Sale Summary" && <SaleSummary key={`summary-${refreshKey}`} />}
      {demoRadio === "Sale Summary With Collection Summary" && <CollectionSummary key={`summary-${refreshKey}`} />}
    </div>
  );
}

export default CreditReportSummaryAwbWise;
