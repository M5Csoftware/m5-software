"use client";
import BranchManifest from "@/app/components/BranchManifest";
import { OutlinedButtonRed, RadioRedButton } from "@/app/components/Buttons";
import ClientManifest from "@/app/components/ClientManifest";
import Heading from "@/app/components/Heading";
import OrgShipper from "@/app/components/OrgShipper";
import {
  RadioButtonLarge,
  RadioMidRedButton,
} from "@/app/components/RadioButton";
import RefShipper from "@/app/components/RefShipper";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const CreateChildNumber = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { register, setValue } = useForm();
  const [accountType, setAccountType] = useState("shipperSettingOrgShipper");
  const [tabChange, setTabChange] = useState(false);
  const [demoRadio, setDemoRadio] = useState("Org Shipper");

  const handleTabChange = (index, value) => {
    setActiveTab(index);
    setAccountType(value);
  };

  //handle refresh btn
  const [awbreset, setAwbreset] = useState(false);
  const handleRefresh = () => {
    setAwbreset(!awbreset);
  };

  return (
    <div className="w-full flex flex-col gap-[17px]">
      <Heading
        title={`Create Child Number`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex items-start justify-between bg-[#D9D9D9] p-4 rounded-[10px] gap-10 h-[100px]">
        {/* Left Section: Shipper + Consignee Settings */}
        <div className="flex flex-row w-full gap-12 justify-between ">
          {/* Shipper Setting */}
          <div className="flex flex-col gap-2 w-full">
            <div className="font-semibold text-red text-sm">
              Shipper Setting
            </div>
            <div className="flex flex-row gap-2 ">
              <RadioButtonLarge
                id="Org Shipper"
                label="Org Shipper"
                name="demo"
                register={register}
                setValue={setValue}
                selectedValue={demoRadio}
                setSelectedValue={setDemoRadio}
              />
              <RadioButtonLarge
                id="Ref Shipper"
                label="Ref Shipper"
                name="demo"
                register={register}
                setValue={setValue}
                selectedValue={demoRadio}
                setSelectedValue={setDemoRadio}
              />
            </div>
          </div>

          {/* Consignee Setting */}
          <div className="flex flex-col gap-2 w-full">
            <div className="font-semibold text-red text-sm">
              Consignee Setting
            </div>
            <div className="flex flex-row gap-2">
              <RadioButtonLarge
                id="Org Shipper"
                label="Org Shipper"
                name="demo"
                register={register}
                setValue={setValue}
                selectedValue={demoRadio}
                setSelectedValue={setDemoRadio}
              />
              <RadioButtonLarge
                id="Ref Shipper"
                label="Ref Shipper"
                name="demo"
                register={register}
                setValue={setValue}
                selectedValue={demoRadio}
                setSelectedValue={setDemoRadio}
              />
            </div>
          </div>
        </div>
        <div className=" w-[304px] pt-7 py-3 ">
          <OutlinedButtonRed label="Change Preferences" />
        </div>
      </div>

      {demoRadio === "Org Shipper" && <OrgShipper awbreset={awbreset} onRefresh={handleRefresh} />}
      {demoRadio === "Ref Shipper" && <RefShipper />}
    </div>
  );
};

export default CreateChildNumber;
