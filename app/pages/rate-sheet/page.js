"use client";

import { RadioRedButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import { RadioMidRedButton } from "@/app/components/RadioButton";
import UploadRate from "@/app/components/rat-sheet/UploadRate";
import ViewRate from "@/app/components/rat-sheet/ViewRate";
import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios"; // Import axios for data fetching
import NotificationFlag from "@/app/components/Notificationflag";

const RateSheet = () => {
  const { server } = useContext(GlobalContext);
  const [activeTab, setActiveTab] = useState(0); // Track active tab
  const [tabChange, setTabChange] = useState(false);
  const [accountType, setAccountType] = useState("ViewRate");
  const { register, setValue, handleSubmit, getValues, watch, reset } =
    useForm();
  const { rates } = useContext(GlobalContext);
  // State to store fetched rates

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
      id: "ViewRate",
      label: "View Rate",
      value: "viewRate",
      RadioComponent: RadioMidRedButton,
    },
    {
      id: "Upload Rate",
      label: "Upload Rate",
      value: "uploadRate",
      RadioComponent: RadioMidRedButton,
    },
  ];
  const handleTabChange = (index, value) => {
    setActiveTab(index);
    setAccountType(value);
    setTabChange(!tabChange);
    if (value === "viewRate") {
      // fetchRates(); // Fetch rates when the View Rate tab is active
    }
  };

  // Fetch data when the "View Rate" tab is selected

  const onSubmit = async (rowData) => {
    try {
      console.log("Uploading data:", rowData);
      const response = await axios.post(`${server}/rate-sheet`, rowData); // Send the sanitized data to the backend
      console.log("Upload successful", response.data);
      showNotification("success", "Data uploaded successfully");
    } catch (error) {
      console.error("Error uploading data:", error);
      showNotification("error", "Failed to upload data");
      sh;
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading title="Rate Sheet" bulkUploadBtn="hidden" codeListBtn="hidden" />
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
          className={`${activeTab === 0
            ? "w-full h-full opacity-100"
            : "w-0 h-0 opacity-0 overflow-hidden"
            } `}
        >
          <ViewRate
            rateData={rates} // Pass fetched rate data to ViewRate
            register={register}
            setValue={setValue}
            tabChange={tabChange}
            reset={reset}
            watch={watch}
          />
        </div>
        <div
          className={`${activeTab === 1
            ? "w-full h-full opacity-100"
            : "w-0 h-0 opacity-0 overflow-hidden"
            } `}
        >
          <UploadRate
            register={register}
            setValue={setValue}
            tabChange={tabChange}
            reset={reset}
            watch={watch}
            onSubmit={onSubmit} // Pass the handleUploadData function to UploadRate
          />
        </div>
      </div>
    </form>
  );
};

export default RateSheet;
