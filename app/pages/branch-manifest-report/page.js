// pages/index.js
"use client";
import { RadioRedButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import ManifestO from "@/app/components/ManifestO";
import ManifestR from "@/app/components/ManifestR";
import RadioButton, {
  RadioMidButton,
  RadioMidRedButton,
} from "@/app/components/RadioButton";
import { useState } from "react";
import { useForm } from "react-hook-form";

export default function BranchManifestReport   () {
  const [activeTab, setActiveTab] = useState(0);
  const { register, setValue } = useForm();
  const [accountType, setAccountType] = useState("manifestO");
  const [tabChange, setTabChange] = useState(false);
  // Mock function for demonstration

  const tabs = [
    {
      id: "manifestO",
      label: "Manifest (O)",
      value: "Manifest (O)",
      RadioComponent: RadioMidRedButton, // Radio button for this tab
    },
    {
      id: "manifestR",
      label: "Manifest (R)",
      value: "Manifest (R)",
    
      RadioComponent: RadioMidRedButton, // Radio button for this tab
    },
  ];

  const handleTabChange = (index, value) => {
    setActiveTab(index);
    setAccountType(value);
  };

  return (
    <div className="w-full flex flex-col gap-[34px]">
      <Heading
        title={`Branch Manifest Report`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
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
          } `}
        >
          <ManifestO
            register={register}
            setValue={setValue}
            tabChange={tabChange}
            // reset={reset}
          />
        </div>
        <div
          className={`${
            activeTab === 1
              ? "w-full h-full opacity-100"
              : "w-0 h-0 opacity-0 overflow-hidden"
          } `}
        >
          <ManifestR
            register={register}
            setValue={setValue}
            tabChange={tabChange}
            // reset={reset}
          />
        </div>
       
      </div>
    </div>
  );
}
