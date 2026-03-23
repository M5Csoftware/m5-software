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

// ─────────────────────────────────────────────
// Helper: normalise apiUseCase → string[] always
// ─────────────────────────────────────────────
const normalizeUseCases = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // not JSON
    }
    if (raw.includes(","))
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    return raw.trim() ? [raw.trim()] : [];
  }
  return [];
};

const ApiUserForm = ({ user, apiUserList = [], onSave, onClose }) => {
  const { register, handleSubmit, setValue } = useForm();

  const [userType, setUserType] = useState("Test User");
  const [userData, setUserData] = useState({});
  const [useCases, setUseCases] = useState([]);      // normalised string[]
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

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

  // ─── populate form whenever `user` changes ──────────────────────────────
  useEffect(() => {
    if (!user) return;

    setUserData(user);

    // Determine userType from status
    const status = (user.status || user.Status || "").toLowerCase();
    const liveUser = status === "active" || status === "approved";
    const type = liveUser ? "Live User" : "Test User";
    setUserType(type);
    setValue("apiUserType", type);

    // Explicitly set every form field so InputBox initialValue re-renders
    setValue("accountCode",  user.customerCode || "");
    setValue("username",     user.email || "");
    setValue("accessKey",    user.apiKey || "");
    setValue("contact",      user.contact || user.phone || "");
    setValue("customerName", user.customerName || "");
    setValue("branch",       user.branch || "");
    setValue("apiStatus",    status);

    // Normalise use cases (field is apiUseCase, not useCase)
    const cases = normalizeUseCases(user.apiUseCase);
    setUseCases(cases);
    setValue("apiUseCase", JSON.stringify(cases));
  }, [user]);

  // ─── submit ─────────────────────────────────────────────────────────────
  const submitForm = (data) => {
    if (onSave) {
      onSave({ ...data, apiUseCase: useCases, userType });
    }
  };

  // ─── status label for display ───────────────────────────────────────────
  const statusLabel = () => {
    const s = (userData.status || userData.Status || "").toLowerCase();
    const map = {
      approved: "Approved",
      active: "Active",
      "non-approved": "Non-Approved",
      rejected: "Non-Approved",
      deactivated: "De-activated",
      inactive: "De-activated",
      pending: "Pending",
    };
    return map[s] || userData.status || userData.Status || "";
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(submitForm)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification((n) => ({ ...n, visible: v }))}
      />

      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
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
          <AddButton disabled={false} onClick={() => {}} />
          <EditButton disabled={false} onClick={() => {}} label={user ? "Update" : "Edit"} />
          <DeleteButton disabled={false} onClick={() => {}} />
        </div>
      </div>

      {/* ── User Type Radio ── */}
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

      {/* ── Main Fields ── */}
      <div className="flex flex-col gap-6">
        <div className="flex w-full gap-6">
          {/* Left column */}
          <div className="flex flex-col w-1/2 gap-4">
            <InputBox
              placeholder="Account Code"
              register={register}
              setValue={setValue}
              value="accountCode"
              initialValue={userData.customerCode || ""}
            />

            <InputBox
              placeholder="Email / Username"
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
              initialValue={userData.apiKey || ""}
            />

            <InputBox
              placeholder="Contact / Phone"
              register={register}
              setValue={setValue}
              value="contact"
              initialValue={userData.contact || userData.phone || ""}
            />
              <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 font-medium px-1">Applied On</label>
              <div className="border border-gray-300 rounded-md px-4 h-10 flex items-center text-sm text-gray-600 bg-gray-50 cursor-default select-none">
                {userData.appliedOn
                  ? new Date(userData.appliedOn).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col w-1/2 gap-4">
            <InputBox
              placeholder="Customer Name"
              register={register}
              setValue={setValue}
              value="customerName"
              initialValue={userData.customerName || ""}
            />

            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              value="branch"
              initialValue={userData.branch || ""}
            />

            <LabeledDropdown
              title="API Status"
              value="apiStatus"
              options={["approved", "active", "pending", "non-approved", "deactivated"]}
              register={register}
              setValue={setValue}
              defaultValue={statusLabel()}
            />

            {/* Applied On – read-only, matches InputBox height */}
          
          </div>
        </div>

        {/* ── Use Cases ── */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-700">
            API Use Cases
            {useCases.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({useCases.length} selected)
              </span>
            )}
          </label>

          {useCases.length === 0 ? (
            <div className="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-400 text-center bg-gray-50">
              No use cases assigned
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {useCases.map((uc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium"
                >
                  <span className="w-4 h-4 flex items-center justify-center rounded-full bg-blue-200 text-blue-700 text-[10px] font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  {uc}
                </span>
              ))}
            </div>
          )}

          {/* Hidden textarea for form submission compatibility */}
          <input
            type="hidden"
            {...register("apiUseCase")}
            value={JSON.stringify(useCases)}
          />
        </div>
      </div>

      {/* ── Save Button ── */}
      <div className="flex justify-end gap-3">
        <SimpleButton name="Save" type="submit" />
      </div>

      {/* ── History / Related Table ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-gray-700">API Request History</h2>
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