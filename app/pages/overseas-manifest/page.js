"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import AUSComponent from "@/app/components/overseas-manifest/AUSComponent";
import EUComponent from "@/app/components/overseas-manifest/EUComponent";
import UKComponent from "@/app/components/overseas-manifest/UKComponent";
import CANComponent from "@/app/components/overseas-manifest/CANComponent";
import USAComponent from "@/app/components/overseas-manifest/USAComponent";

function OverseasManifest() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("aus");
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <Heading
        title="Overseas Manifest"
        bulkUploadBtn="hidden"
        downloadBtn={false}
        codeListBtn={true}
        fullscreenBtn={false}
        onRefresh={handleRefresh}
      />

      <div className="flex w-full gap-3 mb-3">
        <RadioButtonLarge
          id="aus"
          label="AUS"
          name="overseas-manifest"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="eu"
          label="EU"
          name="overseas-manifest"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="uk"
          label="UK"
          name="overseas-manifest"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="can"
          label="CAN"
          name="overseas-manifest"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="usa"
          label="USA"
          name="overseas-manifest"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      {demoRadio === "aus" && <AUSComponent key={`aus-${refreshKey}`} />}
      {demoRadio === "eu" && <EUComponent key={`eu-${refreshKey}`} />}
      {demoRadio === "uk" && <UKComponent key={`uk-${refreshKey}`} />}
      {demoRadio === "can" && <CANComponent key={`can-${refreshKey}`} />}
      {demoRadio === "usa" && <USAComponent key={`usa-${refreshKey}`} />}
    </div>
  );
}

export default OverseasManifest;