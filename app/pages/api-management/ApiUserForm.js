"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";

import InputBox from "@/app/components/InputBox";
import { SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/app/components/AddUpdateDeleteButton";

const ApiUserForm = ({ user, apiUserList = [], onSave, onClose }) => {
  const { register, handleSubmit, setValue } = useForm();

  const [userType, setUserType] = useState("Test User");
  const [userData, setUserData] = useState({});
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const columns = [
    { key: "shipperAccount", label: "Shipper Account" },
    { key: "siteId", label: "Site ID" },
    { key: "password", label: "Password" },
    { key: "accessKey", label: "Access Key" },
    { key: "apiStatus", label: "API Status" },
    { key: "tag", label: "Tag" },
    { key: "tracking", label: "Tracking" },
    { key: "shipping", label: "Shipping" },
    { key: "logDate", label: "Log Date" },
  ];

  const submitForm = (data) => {
    console.log(userData, userType);
  };

  useEffect(() => {
    if (!user) return;

    setUserData(user);
    console.log(user);
  }, [user]);

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(submitForm)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      
      {/* Header Section with Back Button */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          {/* Back Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer"
              aria-label="Go back"
            >
              <Image 
                src="/back-filled.svg" 
                alt="Back" 
                width={15} 
                height={13}
                className="rotate-0"
              />
            </button>
          )}
          
          <div>
            <h1 className="text-[24px] font-bold">API Management</h1>
            <p className="text-sm font-sans text-[#979797]">
              {user ? "Edit API user details" : "Add new API user"}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <AddButton disabled={false} onClick={() => console.log("hello")} />
          <EditButton
            disabled={false}
            onClick={() => console.log("hello")}
            label={false ? "Update" : "Edit"}
          />
          <DeleteButton disabled={false} onClick={() => console.log("hello")} />
        </div>
      </div>

      {/* Radio Buttons */}
      <div className="flex w-full gap-4">
        {["Live User", "Test User"].map((type) => (
          <RadioButtonLarge
            key={type}
            id={type}
            label={type}
            name="apiUserType"
            selectedValue={userType}
            setSelectedValue={(v) => {
              setUserType(v);
              setValue("apiUserType", v);
            }}
            register={register}
            setValue={setValue}
          />
        ))}
      </div>

      {/* Entire Form Section */}
      <div className="flex flex-col gap-6">
        {/* Top Two Column Layout — FLEX ONLY */}
        <div className="flex w-full gap-6">
          {/* Left Column */}
          <div className="flex flex-col w-1/2 gap-4">
            <InputBox
              placeholder="Account Code"
              register={register}
              setValue={setValue}
              value="accountCode"
              initialValue={userData.customerCode || ""}
            />

            <InputBox
              placeholder="Username"
              register={register}
              setValue={setValue}
              value="username"
              initialValue={userData.email || ""}
            />

            <InputBox
              placeholder="Access Key"
              register={register}
              setValue={setValue}
              value="accessKey"
              initialValue={userData.apiKey}
            />
          </div>

          {/* Right Column */}
          <div className="flex flex-col w-1/2 gap-4">
            <InputBox
              placeholder="Customer Name"
              register={register}
              setValue={setValue}
              value="customerName"
              initialValue={userData.customerName || ""}
            />

            <LabeledDropdown
              title="API Status"
              value="apiStatus"
              options={["Live", "Test"]}
              register={register}
              setValue={setValue}
              defaultValue={userData.status || ""}
            />
          </div>
        </div>

        {/* Use Case Row (full width) */}
        <div className="flex flex-col w-full">
          <InputBox
            placeholder="Use Case"
            isTextArea
            className="min-h-[110px]"
            register={register}
            setValue={setValue}
            value="useCase"
            initialValue={userData.useCase || ""}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3">
        <SimpleButton name="Save" type="submit" />
      </div>

      {/* Table */}
      <div className="flex flex-col gap-3">
        <div className="border rounded-lg max-h-[320px] overflow-auto">
          <TableWithSorting
            columns={columns}
            rowData={apiUserList}
            register={register}
            setValue={setValue}
            name="apiReqData"
          />
        </div>
      </div>
    </form>
  );
};

export default ApiUserForm;