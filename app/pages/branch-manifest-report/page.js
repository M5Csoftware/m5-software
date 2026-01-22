// pages/index.js
"use client";
import { RadioRedButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import ManifestO from "@/app/components/ManifestO";
import ManifestR from "@/app/components/ManifestR";
import { RadioMidRedButton } from "@/app/components/RadioButton";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";

export default function BranchManifestReport() {
  const [activeTab, setActiveTab] = useState(0);
  const { register, setValue, reset } = useForm();
  const [accountType, setAccountType] = useState("manifestO");
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Refs to access child component methods
  const manifestORef = useRef(null);
  const manifestRRef = useRef(null);

  const tabs = [
    {
      id: "manifestO",
      label: "Manifest (O)",
      value: "Manifest (O)",
      RadioComponent: RadioMidRedButton,
    },
    {
      id: "manifestR",
      label: "Manifest (R)",
      value: "Manifest (R)",
      RadioComponent: RadioMidRedButton,
    },
  ];

  const handleTabChange = (index, value) => {
    setActiveTab(index);
    setAccountType(value);
    
    // Call refresh when switching tabs
    handleRefresh();
  };

  // Refresh function that resets the form and triggers child refresh
  const handleRefresh = () => {
    // Reset the parent form
    reset();
    
    // Trigger refresh in the active component
    if (activeTab === 0 && manifestORef.current?.handleRefresh) {
      manifestORef.current.handleRefresh();
    } else if (activeTab === 1 && manifestRRef.current?.handleRefresh) {
      manifestRRef.current.handleRefresh();
    }
    
    // Force re-render by updating refresh key
    setRefreshKey(prev => prev + 1);
    
    console.log("Page refreshed");
  };

  return (
    <div className="w-full flex flex-col gap-[34px]" key={refreshKey}>
      <Heading
        title={`Branch Manifest Report`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        refreshBtn="block" // Show refresh button
        onRefresh={handleRefresh} // Pass refresh handler
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
            ref={manifestORef}
            register={register}
            setValue={setValue}
            reset={reset} // Pass reset function
            tabChange={activeTab === 0} // Pass active state
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
            ref={manifestRRef}
            register={register}
            setValue={setValue}
            reset={reset} // Pass reset function
            tabChange={activeTab === 1} // Pass active state
          />
        </div>
      </div>
    </div>
  );
}