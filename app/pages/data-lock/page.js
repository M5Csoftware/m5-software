"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { GlobalContext } from "@/app/lib/GlobalContext";

import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const DataLock = () => {
  const { register, setValue, watch } = useForm();
  const [demoRadio, setDemoRadio] = useState("AWB");
  const [checked, setChecked] = useState(false);
  const { accounts, server } = useContext(GlobalContext);
  const [branches, setBranches] = useState([]);
  const [resetFactor, setResetFactor] = useState(false);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const normalizeDate = (val) => {
    if (!val) return null;

    // DateInputBox gives DD/MM/YYYY format
    // Parse it manually to avoid timezone issues
    const parts = val.split("/");

    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validate the parsed values
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900)
      return null;

    // Return in YYYY-MM-DD format for backend
    const monthStr = String(month).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");

    return `${year}-${monthStr}-${dayStr}`;
  };

  const accountCode = watch("accountCode");

  const handleRefresh = () => {
    setResetFactor(!resetFactor);
    setChecked(false);
  };

  useEffect(() => {
    if (!accountCode) {
      setValue("customer", "");
      return;
    }

    const match = accounts.find((acc) => acc.accountCode === accountCode);

    if (match) setValue("customer", match.name);
    else setValue("customer", "");
  }, [accountCode, accounts, setValue]);

  useEffect(() => {
    fetch(`${server}/branch-master/get-branch`)
      .then((res) => res.json())
      .then((data) => {
        // console.log(data);
        setBranches(data);
      });
  }, []);

  const handleLock = async () => {
    const awbNo = watch("awbNo");
    const from = watch("from");
    const to = watch("to");

    if (checked) {
      // Only validate that the raw values exist
      if (!from || !to) {
        return showNotification("error", "Pick valid dates");
      }

      const fromISO = normalizeDate(from);
      const toISO = normalizeDate(to);

      // Now check if normalization worked
      if (!fromISO || !toISO) {
        return showNotification("error", "Invalid date format");
      }

      const res = await fetch(`${server}/data-lock/awb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromISO,
          to: toISO,
          all: true,
          lock: true,
        }),
      });

      const data = await res.json();
      return showNotification("success", data.message);
    }

    if (!awbNo) return showNotification("error", "Enter AWB No");

    const res = await fetch(`${server}/data-lock/awb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        awbNo,
        lock: true,
      }),
    });

    const data = await res.json();
    showNotification("success", data.message);
  };

  const handleUnlock = async () => {
    const awbNo = watch("awbNo");
    const from = watch("from");
    const to = watch("to");

    if (checked) {
      // Only validate that the raw values exist
      if (!from || !to) {
        return showNotification("error", "Pick valid dates");
      }

      const fromISO = normalizeDate(from);
      const toISO = normalizeDate(to);

      // Now check if normalization worked
      if (!fromISO || !toISO) {
        return showNotification("error", "Invalid date format");
      }

      const res = await fetch(`${server}/data-lock/awb`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromISO,
          to: toISO,
          all: true,
          lock: false,
        }),
      });

      const data = await res.json();
      return showNotification("success", data.message);
    }

    if (!awbNo) return showNotification("error", "Enter AWB No");

    const res = await fetch(`${server}/data-lock/awb`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ awbNo, lock: false }),
    });

    const data = await res.json();
    showNotification("success", data.message);
  };

  const handleCustomerLock = async () => {
    const accountCode = watch("accountCode");
    const from = watch("from");
    const to = watch("to");

    // Validate fields exist first
    if (!accountCode || !from || !to) {
      return showNotification("error", "Fill all fields");
    }

    const fromISO = normalizeDate(from);
    const toISO = normalizeDate(to);

    // Check if dates are valid after normalization
    if (!fromISO || !toISO) {
      return showNotification("error", "Invalid date format");
    }

    try {
      const res = await fetch(`${server}/data-lock/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountCode,
          from: fromISO,
          to: toISO,
          lock: true,
        }),
      });

      const data = await res.json();
      showNotification("success", data.message);
    } catch {
      showNotification("error", "Request failed");
    }
  };

  const handleCustomerUnlock = async () => {
    const accountCode = watch("accountCode");
    const from = watch("from");
    const to = watch("to");

    // Validate fields exist first
    if (!accountCode || !from || !to) {
      return showNotification("error", "Fill all fields");
    }

    const fromISO = normalizeDate(from);
    const toISO = normalizeDate(to);

    // Check if dates are valid after normalization
    if (!fromISO || !toISO) {
      return showNotification("error", "Invalid date format");
    }

    try {
      const res = await fetch(`${server}/data-lock/customer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountCode,
          from: fromISO,
          to: toISO,
          lock: false,
        }),
      });

      const data = await res.json();
      showNotification("success", data.message);
    } catch {
      showNotification("error", "Request failed");
    }
  };

  const handleBranchLock = async () => {
    const branch = watch("branch");
    const from = watch("from");
    const to = watch("to");

    // Validate fields exist first
    if (!branch || !from || !to) {
      return showNotification("error", "Fill all fields");
    }

    const fromISO = normalizeDate(from);
    const toISO = normalizeDate(to);

    // Check if dates are valid after normalization
    if (!fromISO || !toISO) {
      return showNotification("error", "Invalid date format");
    }

    try {
      const res = await fetch(`${server}/data-lock/branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch,
          fromDate: fromISO,
          toDate: toISO,
          lock: true,
        }),
      });

      const data = await res.json();
      showNotification("success", data.message);
    } catch {
      showNotification("error", "Request failed");
    }
  };

  const handleBranchUnlock = async () => {
    const branch = watch("branch");
    const from = watch("from");
    const to = watch("to");

    // Validate fields exist first
    if (!branch || !from || !to) {
      return showNotification("error", "Fill all fields");
    }

    const fromISO = normalizeDate(from);
    const toISO = normalizeDate(to);

    // Check if dates are valid after normalization
    if (!fromISO || !toISO) {
      return showNotification("error", "Invalid date format");
    }

    try {
      const res = await fetch(`${server}/data-lock/branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch,
          fromDate: fromISO,
          toDate: toISO,
          lock: false,
        }),
      });

      const data = await res.json();
      showNotification("success", data.message);
    } catch {
      showNotification("error", "Request failed");
    }
  };

  useEffect(() => {
    if (checked) {
      setResetFactor(!resetFactor);
    } else {
      setResetFactor(!resetFactor);
    }
  }, [checked]);

  return (
    <div className="flex flex-col gap-9">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`Data Lock`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <RadioButtonLarge
            register={register}
            setValue={setValue}
            id={`AWB`}
            label={`AWB Wise`}
            name={`demo`}
            selectedValue={demoRadio}
            setSelectedValue={setDemoRadio}
          />
          <RadioButtonLarge
            register={register}
            setValue={setValue}
            id={`branchWise`}
            label={`Branch Wise`}
            name={`demo`}
            selectedValue={demoRadio}
            setSelectedValue={setDemoRadio}
          />
          <RadioButtonLarge
            register={register}
            setValue={setValue}
            id={`customerWise`}
            label={`Customer Wise`}
            name={`demo`}
            selectedValue={demoRadio}
            setSelectedValue={setDemoRadio}
          />
        </div>

        {demoRadio === "branchWise" && (
          <>
            <div className="mt-6">
              <LabeledDropdown
                options={branches.map((b) => b.code)}
                register={register}
                setValue={setValue}
                value="branch"
                title="Branch"
                resetFactor={resetFactor}
              />
            </div>
            <div className="flex gap-3">
              <DateInputBox
                register={register}
                setValue={setValue}
                value="from"
                placeholder="From"
                resetFactor={resetFactor}
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value="to"
                placeholder="To"
                resetFactor={resetFactor}
              />
            </div>

            <div className="flex justify-end">
              <div className="flex gap-3">
                <OutlinedButtonRed
                  label="Unlock"
                  unlockIcon
                  onClick={handleBranchUnlock}
                  perm="Billing Edit"
                />
                <SimpleButton
                  name="Lock"
                  lockIcon
                  onClick={handleBranchLock}
                  perm="Billing Edit"
                />
              </div>
            </div>
          </>
        )}

        {demoRadio === "AWB" && (
          <>
            <div className="flex flex-col gap-3 mt-6">
              <div>
                <InputBox
                  placeholder="Airway Bill Number"
                  register={register}
                  setValue={setValue}
                  value="awbNo"
                  resetFactor={resetFactor}
                  disabled={checked}
                />
              </div>
              <div className="flex gap-3">
                <div className="w-1/3 flex justify-start items-center">
                  <RedCheckbox
                    register={register}
                    setValue={setValue}
                    value="active"
                    label="ALL Shipments"
                    id={`checkBox`}
                    isChecked={checked}
                    setChecked={setChecked}
                  />
                </div>
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value="from"
                  placeholder="From"
                  resetFactor={resetFactor}
                  disabled={!checked}
                />
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value="to"
                  placeholder="To"
                  resetFactor={resetFactor}
                  disabled={!checked}
                />
              </div>
              <div className="flex justify-end">
                <div className="flex gap-3">
                  <OutlinedButtonRed
                    label="Unlock"
                    unlockIcon
                    onClick={handleUnlock}
                    perm="Billing Edit"
                  />
                  <SimpleButton
                    name="Lock"
                    lockIcon
                    onClick={handleLock}
                    perm="Billing Edit"
                  />{" "}
                </div>
              </div>
            </div>
          </>
        )}

        {demoRadio === "customerWise" && (
          <>
            <div className="flex gap-3 mt-6">
              <div className="w-1/2">
                <InputBox
                  placeholder="Customer Code"
                  register={register}
                  setValue={setValue}
                  value="accountCode"
                  resetFactor={resetFactor}
                />
              </div>
              <div className="flex gap-3 w-1/2">
                <InputBox
                  placeholder="Customer Name"
                  register={register}
                  setValue={setValue}
                  value="customer"
                  initialValue={watch("customer")}
                  resetFactor={resetFactor}
                  disabled
                />
              </div>
            </div>
            <div className="flex gap-3">
              <DateInputBox
                register={register}
                setValue={setValue}
                value="from"
                placeholder="From"
                resetFactor={resetFactor}
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value="to"
                placeholder="To"
                resetFactor={resetFactor}
              />
            </div>

            <div className="flex justify-end">
              <div className="flex gap-3">
                <OutlinedButtonRed
                  label={"Unlock"}
                  unlockIcon
                  onClick={handleCustomerUnlock}
                  perm="Billing Edit"
                />
                <SimpleButton
                  name={"Lock"}
                  lockIcon
                  onClick={handleCustomerLock}
                  perm="Billing Edit"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataLock;
