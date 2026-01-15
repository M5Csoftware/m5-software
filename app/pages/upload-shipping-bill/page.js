"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import SingleAwb from "@/app/components/shipping-bill/SingleAwb";
import MultipleAwb from "@/app/components/shipping-bill/MultipleAwb";

function UploadShippingBill() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("Single AWB");
  const [refreshKey, setRefreshKey] = useState(0); // 🔑 Track refresh

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset(); // clear parent registered fields
    setRefreshKey((prev) => prev + 1); // force child remount
  };

  return (
    <form className="flex flex-col gap-9">
      <Heading
        title={`Upload Shipping Bill`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id={`Single AWB`}
          label={`Single AWB`}
          name={`demo`}
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id={`Multiple AWB`}
          label={`Multiple AWB`}
          name={`demo`}
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      {/* ✅ Pass refreshKey so child remounts on refresh */}
      {demoRadio === "Single AWB" && (
        <SingleAwb 
          key={`single-${refreshKey}`} 
          register={register}
          setValue={setValue}
        />
      )}
      {demoRadio === "Multiple AWB" && (
        <MultipleAwb 
          key={`multiple-${refreshKey}`}
          register={register}
          setValue={setValue}
        />
      )}
    </form>
  );
}

export default UploadShippingBill;