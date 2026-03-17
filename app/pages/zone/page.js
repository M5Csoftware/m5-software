"use client";
import { RadioRedButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import { RadioMidRedButton } from "@/app/components/RadioButton";
import UploadZones from "@/app/components/zone/UploadZones";
import ViewZones from "@/app/components/zone/ViewZones";
import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";

const Zone = () => {
  const { server } = useContext(GlobalContext);
  const [activeTab, setActiveTab] = useState(0);
  const [tabChange, setTabChange] = useState(false);
  const [accountType, setAccountType] = useState("ViewZones");
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key
  const { register, setValue, handleSubmit, getValues, watch, reset } = useForm();
  const { zones } = useContext(GlobalContext);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const tabs = [
    {
      id: "ViewZones",
      label: "View Zones",
      value: "viewZones",
      RadioComponent: RadioMidRedButton,
    },
    {
      id: "Upload Zones",
      label: "Upload Zones",
      value: "uploadZones",
      RadioComponent: RadioMidRedButton,
    },
  ];

  // Handle tab changes
  const handleTabChange = (index, value) => {
    setActiveTab(index);
    setAccountType(value);
    setTabChange(!tabChange);
  };

  // Upload zone data
  const onSubmit = async (rowData) => {
    try {
      const response = await axios.post(`${server}/zones`, rowData);
      // console.log("Upload successful", response.data);
      showNotification("success", "Data uploaded successfully");
      
      // After successful upload, refresh the form
      handleRefresh();
    } catch (error) {
      console.error("Error uploading data:", error);
      showNotification("error", "Failed to upload data");
    }
  };

  // Handle refresh - similar to Total Outstanding
  const handleRefresh = () => {
    // Reset react-hook-form
    reset({
      Customer: "",
      from: "",
      to: "",
      sector: "",
      zoneTariff: "",
      effectiveDateFrom: "",
      effectiveDateTo: "",
      remoteZones: [],
      unserviceableZones: [],
    });
    
    // Reset tab to View Zones
    setActiveTab(0);
    setAccountType("ViewZones");
    
    // Increment refresh key to force child components to re-render
    setRefreshKey(prev => prev + 1);
    
    // Toggle tabChange to trigger child refresh
    setTabChange(prev => !prev);
    
    showNotification("success", "Page refreshed successfully");
  };

  return (
    <form 
      className="flex flex-col gap-3" 
      onSubmit={handleSubmit(onSubmit)}
      key={refreshKey} // Add key to force form re-render
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading 
        title="Zone" 
        bulkUploadBtn="hidden" 
        codeListBtn="hidden" 
        onRefresh={handleRefresh} 
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
          }`}
        >
          <ViewZones
            zones={zones}
            register={register}
            setValue={setValue}
            tabChange={tabChange}
            reset={reset}
            watch={watch}
            key={`view-${refreshKey}`} // Add key for refresh
          />
        </div>
        <div
          className={`${
            activeTab === 1
              ? "w-full h-full opacity-100"
              : "w-0 h-0 opacity-0 overflow-hidden"
          }`}
        >
          <UploadZones
            register={register}
            setValue={setValue}
            tabChange={tabChange}
            reset={reset}
            watch={watch}
            onSubmit={onSubmit}
            key={`upload-${refreshKey}`} // Add key for refresh
          />
        </div>
      </div>
    </form>
  );
};

export default Zone;