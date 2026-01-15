"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import AwbWish from "@/app/components/update-forwarding-number/AwbWish";
import Excel from "@/app/components/update-forwarding-number/Excel";
import Heading from "@/app/components/Heading";

function UpdateForwardingNumber() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("AWB Wise");
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1); // 🔄 trigger child reset
  };

  return (
    <form className="flex flex-col gap-9">
      <div>
        <Heading
          title={`Update Forwarding Number`}
          bulkUploadBtn="hidden"
          onRefresh={handleRefresh}
          codeListBtn="hidden"
        />
      </div>
      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id={`AWB Wise`}
          label={`AWB Wise`}
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
      {demoRadio == "AWB Wise" && <AwbWish  refreshKey={refreshKey} />}
      {demoRadio == "Excel" && <Excel refreshKey={refreshKey}/>}
    </form>
  );
}

export default UpdateForwardingNumber;
