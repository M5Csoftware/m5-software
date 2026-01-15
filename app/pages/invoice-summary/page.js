"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import DateRangeWise from "@/app/components/invoice-summary/DateRangeWise";
import MultipleRangeWise from "@/app/components/invoice-summary/MultipleRangeWise";

function InvoiceSummary() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("Date Range Wise");
  const [refreshKey, setRefreshKey] = useState(0);


  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-9">
      <Heading
        title="Invoice Summary"
        bulkUploadBtn="hidden"
        downloadBtn= {false}
        codeListBtn={true}
        fullscreenBtn={false}
        onRefresh={handleRefresh}
      />

      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id="Date Range Wise"
          label="Date Range Wise"
          name="invoice-summary"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Multiple Range Wise"
          label="Multiple Range Wise"
          name="invoice-summary"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      {demoRadio === "Date Range Wise" && <DateRangeWise key={`details-${refreshKey}`} />}
      {demoRadio === "Multiple Range Wise" && <MultipleRangeWise key={`summary-${refreshKey}`} />}
    </div>
  );
}

export default InvoiceSummary;
