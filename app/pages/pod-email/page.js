"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import Auto from '@/app/components/pod-email/Auto';
import Custom from '@/app/components/pod-email/Custom';

function PODEmail() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("Auto");
  const [refreshKey, setRefreshKey] = useState(0);
  

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };
  
  return (
    <form className="flex flex-col gap-9">
      <Heading
        title="POD Email"
        bulkUploadBtn="hidden" 
        codeListBtn="hidden" 
        onRefresh={handleRefresh}
      />

      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id="Auto"
          label="Auto"
          name="pod-email"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Custom"
          label="Custom"
          name="pod-email"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>
      {demoRadio === "Auto" && <Auto key={`details-${refreshKey}`} />}
      {demoRadio === "Custom" && <Custom key={`summary-${refreshKey}`} />}
    </form>
  );
}

export default PODEmail;
