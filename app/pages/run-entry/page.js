"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import Heading from "@/app/components/Heading";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import {
  DeleteButton,
  EditButton,
} from "@/app/components/AddUpdateDeleteButton";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import NotificationFlag from "@/app/components/Notificationflag";

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function RunEntry() {
  const [accountType, setAccountType] = useState("hubAirport");
  const [demoRadio, setDemoRadio] = useState("Hub Airport");
  const [editMode, setEditMode] = useState(false);
  const { server, sectors, hub, counterpart } = useContext(GlobalContext);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    trigger,
  } = useForm();

  const [selectRunEntry, setSelectRunEntry] = useState(null);
  const [runEntryrReset, setRunEntryReset] = useState(false);
  const [date, setDate] = useState("");
  const [newData, setNewData] = useState(true);

  // Button state variables
  const [addButton, setAddButton] = useState(false);
  const [editButton, setEditButton] = useState(true);
  const [deleteButton, setDeleteButton] = useState(true);
  const [disabledInput, setDisabledInput] = useState(false);
  const [editing, setEditing] = useState(false);

  // Loading states for buttons
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [responseMsg, setResponseMsg] = useState("");
  const [visibleFlag, setVisibleFlag] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Add ref to prevent concurrent fetches
  const fetchingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Watch runNo and apply debouncing
  const runNo = watch("runNo");
  const debouncedRunNo = useDebounce(runNo, 800);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Fields that should be reset when no data is found
  const FIELDS_TO_RESET = [
    "obc",
    "cdNumber",
    "hub",
    "origin",
    "sector",
    "flight",
    "flightnumber",
    "almawb",
    "counterpart",
    "transportType",
    "destination",
    "destination1",
    "uniqueID",
  ];

  // Date formatting functions
  const formatDateForInput = (dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date) => {
    const formattedDate =
      date.getDate().toString().padStart(2, "0") +
      "/" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      date.getFullYear().toString();
    return formattedDate;
  };

  // Reset form state helper
  const resetFormState = () => {
    setSelectRunEntry(null);
    setAddButton(false);
    setEditButton(true);
    setDeleteButton(true);
    setDisabledInput(false);
    setEditing(false);
    setEditMode(false);
    setIsLoading(false);
  };

  // Update form with fetched data
  const updateFormWithData = (runData) => {
    Object.keys(runData).forEach((key) => {
      if (runData[key] !== undefined) {
        if (key === "date") {
          const formattedInputDate = formatDateForInput(runData[key]);
          const formattedDisplayDate = formatDisplayDate(
            new Date(runData[key])
          );
          setValue(key, formattedInputDate);
          setDate(formattedDisplayDate);
        } else {
          setValue(key, runData[key]);
        }
      }
    });

    if (!runData.uniqueID && runData.runNo) {
      const newUniqueId = `${runData.runNo.trim()}00`;
      setValue("uniqueID", newUniqueId, {
        shouldValidate: true,
        shouldDirty: true,
      });
      // console.log("Generated unique ID for existing entry:", newUniqueId);
    }

    setSelectRunEntry(runData);
    setAddButton(true);
    setEditButton(false);
    setDeleteButton(false);
    setDisabledInput(true);
    setEditing(false);
    setEditMode(false);
    setIsLoading(false);
  };

  const handleRadioChange = (value) => {
    setDemoRadio(value);
    let converted = "";
    if (value === "Hub Airport") converted = "hubAirport";
    else if (value === "Hub Hub") converted = "hubHub";
    else if (value === "Branch Hub") converted = "branchHub";

    setAccountType(converted);
    setValue("accountType", converted);
    setEditMode(false);
    setEditing(false);
  };

  const handleRefresh = () => {
    setRunEntryReset(!runEntryrReset);
    setEditMode(false);
    setEditing(false);
    resetFormState();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Generate unique ID when runNo changes
  useEffect(() => {
    // console.log("RunNo changed:", runNo);
    if (runNo && typeof runNo === "string" && runNo.trim() !== "") {
      const newUniqueId = `${runNo.trim()}00`;
      // console.log("Setting unique ID:", newUniqueId);
      setValue("uniqueID", newUniqueId, {
        shouldValidate: true,
        shouldDirty: true,
      });
    } else {
      // console.log("Clearing unique ID");
      setValue("uniqueID", "", { shouldValidate: true, shouldDirty: true });
    }
  }, [runNo, setValue]);

  // Handle Edit button click
  const handleEditButton = (data) => {
    if (!editing) {
      setDisabledInput(false);
      setEditing(true);
      setEditMode(true);
    } else {
      setEditing(false);
      setEditMode(false);
      handleUpdate(data);
    }
  };

  // Handle Cancel edit
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditing(false);
    if (selectRunEntry) {
      updateFormWithData(selectRunEntry);
    }
  };

  const onSubmit = async (formData) => {
    const combinedData = {
      ...formData,
      accountType: accountType,
    };

    // console.log("Submitting data:", combinedData);
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${server}/run-entry/run-bag`,
        combinedData
      );

      if (response.status === 201) {
        // console.log("Run entry created successfully!");
        showNotification("success", "Run-entry data added successfully!");

        reset({
          runNo: "",
          obc: "",
          cdNumber: "",
          hub: "",
          origin: "",
          sector: "",
          flight: "",
          flightnumber: "",
          almawb: "",
          counterpart: "",
          transportType: "",
          destination: "",
          destination1: "",
          uniqueID: "",
          accountType: accountType,
        });

        resetFormState();
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      if (error.response?.status === 400) {
        showNotification(
          "error",
          error.response.data.error || "Validation error"
        );
      } else {
        showNotification("error", "Run-entry data adding failed!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    if (!selectRunEntry || !selectRunEntry._id) {
      // console.log("No matching entry found for update");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await axios.put(
        `${server}/run-entry?id=${selectRunEntry._id}`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        // console.log("Run entry updated successfully!");
        setDisabledInput(true);
        setEditMode(false);
        setEditing(false);

        const runNoValue = formData.runNo;
        if (runNoValue && runNoValue.trim().length >= 3) {
          fetchRunData(runNoValue, accountType);
        }
        showNotification("success", "Run-entry data updated successfully!");
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      if (error.response?.status === 404) {
        showNotification("error", "Run entry not found");
      } else {
        showNotification("error", "Run-entry data updating failed!");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectRunEntry || !selectRunEntry._id) {
      // console.log("No matching entry found for deletion");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await axios.delete(
        `${server}/run-entry/run-bag?id=${selectRunEntry._id}`
      );

      if (response.status === 200) {
        // console.log("Run entry deleted successfully!");
        reset();
        resetFormState();
        showNotification("success", "Run-entry data deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      if (error.response?.status === 404) {
        showNotification("error", "Run entry not found");
      } else if (error.response?.status === 400) {
        showNotification(
          "error",
          error.response.data.error || "Validation error"
        );
      } else {
        showNotification("error", "Run-entry data deleting failed!");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Main fetch function
  const fetchRunData = async (runNo, accType) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (
      !runNo ||
      runNo.trim() === "" ||
      runNo.length < 3 ||
      fetchingRef.current
    ) {
      if (!runNo || runNo.trim() === "" || runNo.length < 3) {
        resetFormState();
        if (runNo && runNo.trim() !== "") {
          const newUniqueId = `${runNo.trim()}00`;
          setValue("uniqueID", newUniqueId, {
            shouldValidate: true,
            shouldDirty: true,
          });
        } else {
          setValue("uniqueID", "", {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
      return;
    }

    fetchingRef.current = true;
    setIsLoading(true);

    abortControllerRef.current = new AbortController();

    try {
      // console.log(`Fetching data for runNo: ${runNo}, accountType: ${accType}`);

      const response = await axios.get(
        `${server}/run-entry/run-bag?runNo=${runNo.toUpperCase()}&accountType=${accType}`,
        {
          signal: abortControllerRef.current.signal,
          timeout: 10000,
        }
      );

      if (response.status === 200) {
        const runData = response.data;
        // console.log("Fetched data:", runData);
        updateFormWithData(runData);
      }
    } catch (error) {
      if (axios.isCancel(error)) {
        // console.log("Request was cancelled");
        return;
      }

      if (error.response?.status === 404) {
        // console.log(
//           `No data found for runNo: ${runNo}, accountType: ${accType}`
//         );
        showNotification("error", "Run entry not found");
        resetFormState();

        FIELDS_TO_RESET.forEach((field) => setValue(field, ""));

        const currentDate = new Date();
        const formattedInputDate = formatDateForInput(currentDate);
        const formattedDisplayDate = formatDisplayDate(currentDate);

        setValue("date", formattedInputDate);
        setDate(formattedDisplayDate);

        if (runNo && runNo.trim() !== "") {
          const newUniqueId = `${runNo.trim()}00`;
          setValue("uniqueID", newUniqueId, {
            shouldValidate: true,
            shouldDirty: true,
          });
          // console.log("Generated unique ID for new entry:", newUniqueId);
        }
      } else if (
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout")
      ) {
        console.error("Request timeout:", error);
        showNotification("error", "Request timed out. Please try again.");
        setIsLoading(false);
      } else {
        console.error("Error fetching run data:", error);
        showNotification("error", "Error fetching run data. Please try again.");
        setIsLoading(false);
      }
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  };

  // Fetch data when debouncedRunNo or accountType changes
  useEffect(() => {
    if (
      debouncedRunNo &&
      debouncedRunNo.trim() !== "" &&
      debouncedRunNo.trim().length >= 3
    ) {
      fetchRunData(debouncedRunNo, accountType);
    } else {
      resetFormState();
      if (debouncedRunNo && debouncedRunNo.trim() !== "") {
        const newUniqueId = `${debouncedRunNo.trim()}00`;
        setValue("uniqueID", newUniqueId, {
          shouldValidate: true,
          shouldDirty: true,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRunNo, accountType]);

  // Initialize date on component mount
  useEffect(() => {
    const currentDate = new Date();
    const formattedDisplayDate = formatDisplayDate(currentDate);
    const formattedInputDate = formatDateForInput(currentDate);

    if (newData) {
      setDate(formattedDisplayDate);
      setValue("date", formattedInputDate);
    } else {
      setDate("--/--/----");
    }
  }, [newData, setValue]);

  const defaultValues = {
    runNo: "",
    obc: "",
    cdNumber: "",
    hub: "",
    origin: "",
    sector: "",
    flight: "",
    flightnumber: "",
    almawb: "",
    counterpart: "",
    transportType: "",
    destination: "",
    destination1: "",
    uniqueID: "",
  };

  useEffect(() => {
    reset(defaultValues);
    setEditMode(false);
    setEditing(false);
    resetFormState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoRadio, reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      return false;
    }
  };

  return (
    <form
      className="flex flex-col gap-[34px]"
      onSubmit={handleSubmit(editing ? handleUpdate : onSubmit)}
      onKeyDown={handleKeyDown}
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="RUN Entry"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex w-full gap-3">
        {["Hub Airport", "Hub Hub", "Branch Hub"].map((type) => (
          <RadioButtonLarge
            key={type}
            id={type}
            label={type}
            name="accountType"
            register={register}
            setValue={setValue}
            selectedValue={demoRadio}
            setSelectedValue={handleRadioChange}
          />
        ))}
      </div>

      {["Hub Airport", "Hub Hub", "Branch Hub"].includes(demoRadio) && (
        <div className="flex flex-col gap-11">
          <div className="flex flex-col gap-3">
            <div className="flex justify-between flex-row-reverse">
              <div className="flex gap-1 text-center justify-center flex-row-reverse">
                <div className="flex gap-1 flex-row-reverse text-center justify-center">
                  <h2 className="text-[16px] rounded bg-[#FFE5E9] text-red px-[10px] py-[2px] font-semibold">
                    New Delhi
                  </h2>
                  <h2 className="text-[16px] font-semibold flex flex-row-reverse">
                    Branch:
                  </h2>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <div className="flex flex-col gap-3 w-full">
                <InputBox
                  resetFactor={runEntryrReset}
                  placeholder="Run Number"
                  register={register}
                  setValue={setValue}
                  value="runNo"
                  error={errors.runNo}
                  trigger={trigger}
                  validation={{
                    required: "Run Number is required",
                    minLength: {
                      value: 3,
                      message: "Run Number must be at least 3 characters",
                    },
                  }}
                  initialValue={watch("runNo") || ""}
                />

                {demoRadio === "Hub Hub" && (
                  <>
                    <InputBox
                      resetFactor={runEntryrReset}
                      placeholder="OBC"
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="obc"
                      error={errors.obc}
                      trigger={trigger}
                      validation={{ required: "OBC is required" }}
                      initialValue={watch("obc") || ""}
                    />
                    <InputBox
                      resetFactor={runEntryrReset}
                      placeholder="CD Number"
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="cdNumber"
                      error={errors.cdNumber}
                      trigger={trigger}
                      validation={{ required: "CD Number is required" }}
                      initialValue={watch("cdNumber") || ""}
                    />
                    <LabeledDropdown
                      options={hub.map((hub) => hub.name)}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="hub"
                      title="Hub"
                      error={errors.hub}
                      trigger={trigger}
                      validation={{ required: "Hub is required" }}
                      resetFactor={runEntryrReset}
                      defaultValue={watch("hub") || ""}
                    />
                  </>
                )}

                {demoRadio === "Branch Hub" && (
                  <>
                    <InputBox
                      resetFactor={runEntryrReset}
                      placeholder="OBC"
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="obc"
                      validation={{ required: "OBC is required" }}
                      error={errors.obc}
                      trigger={trigger}
                      initialValue={watch("obc") || ""}
                    />
                    <InputBox
                      resetFactor={runEntryrReset}
                      placeholder="CD Number"
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="cdNumber"
                      error={errors.cdNumber}
                      trigger={trigger}
                      validation={{ required: "CD Number is required" }}
                      initialValue={watch("cdNumber") || ""}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      label="Origin"
                      setValue={setValue}
                      value="origin"
                      disabled={disabledInput}
                    />
                  </>
                )}

                {demoRadio === "Hub Airport" && (
                  <>
                    <LabeledDropdown
                      options={sectors.map((sector) => sector.name)}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="sector"
                      title="Sector"
                      resetFactor={runEntryrReset}
                      defaultValue={watch("sector") || ""}
                      error={errors.sector}
                      trigger={trigger}
                      validation={{ required: "Sector is required" }}
                    />
                    <InputBox
                      resetFactor={runEntryrReset}
                      placeholder="Flight"
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="flight"
                      initialValue={watch("flight") || ""}
                      error={errors.flight}
                      trigger={trigger}
                      validation={{ required: "Flight is required" }}
                    />
                    <InputBox
                      resetFactor={runEntryrReset}
                      placeholder="OBC"
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="obc"
                      initialValue={watch("obc") || ""}
                      error={errors.obc}
                      trigger={trigger}
                      validation={{ required: "OBC is required" }}
                    />
                    <LabeledDropdown
                      options={hub.map((hub) => hub.name)}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="hub"
                      title="Hub"
                      resetFactor={runEntryrReset}
                      defaultValue={watch("hub") || ""}
                      error={errors.hub}
                      trigger={trigger}
                      validation={{ required: "Hub is required" }}
                    />
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3 w-full">
                <DateInputBox
                  placeholder="Flight Date"
                  value="date"
                  register={register}
                  setValue={setValue}
                  initialValue={watch("date") || ""}
                  disabled={disabledInput}
                  resetFactor={runEntryrReset}
                  trigger={trigger}
                  todayDate={!watch("date")}
                />

                {demoRadio === "Hub Hub" && (
                  <>
                    <LabeledDropdown
                      options={["Rail", "By road", "Air"]}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="transportType"
                      title="Transport Type"
                      resetFactor={runEntryrReset}
                      defaultValue={watch("transportType") || ""}
                      error={errors.transportType}
                      trigger={trigger}
                      validation={{ required: "Transport Type is required" }}
                    />
                    <LabeledDropdown
                      options={sectors.map((sector) => sector.name)}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="sector"
                      title="Sector"
                      resetFactor={runEntryrReset}
                      defaultValue={watch("sector") || ""}
                      error={errors.sector}
                      trigger={trigger}
                      validation={{ required: "Sector is required" }}
                    />
                    <LabeledDropdown
                      options={["DEL", "AHM", "MUM"]}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="destination"
                      title="Destination"
                      error={errors.destination}
                      trigger={trigger}
                      validation={{ required: "Destination is required" }}
                      resetFactor={runEntryrReset}
                      defaultValue={watch("destination") || ""}
                    />
                  </>
                )}

                {demoRadio === "Branch Hub" && (
                  <>
                    <LabeledDropdown
                      options={["Rail", "By road", "Air"]}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="transportType"
                      title="Transport Type"
                      resetFactor={runEntryrReset}
                      error={errors.transportType}
                      trigger={trigger}
                      validation={{ required: "Transport Type is required" }}
                      defaultValue={watch("transportType") || ""}
                    />
                    <LabeledDropdown
                      options={hub.map((hub) => hub.name)}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="hub"
                      title="Hub"
                      resetFactor={runEntryrReset}
                      defaultValue={watch("hub") || ""}
                      error={errors.hub}
                      trigger={trigger}
                      validation={{ required: "Hub is required" }}
                    />
                  </>
                )}

                {demoRadio === "Hub Airport" && (
                  <>
                    <LabeledDropdown
                      options={counterpart.map((c) => c.name)}
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="counterpart"
                      title="Counter Part"
                      error={errors.counterpart}
                      trigger={trigger}
                      validation={{ required: "Counter Part is required" }}
                      resetFactor={runEntryrReset}
                      defaultValue={watch("counterpart") || ""}
                    />
                    <InputBox
                      resetFactor={runEntryrReset}
                      placeholder="Flight number"
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="flightnumber"
                      error={errors.flightnumber}
                      trigger={trigger}
                      validation={{ required: "Flight number is required" }}
                      initialValue={watch("flightnumber") || ""}
                    />
                    <InputBox
                      resetFactor={runEntryrReset}
                      placeholder="A/L MAWB"
                      register={register}
                      setValue={setValue}
                      disabled={disabledInput}
                      value="almawb"
                      error={errors.almawb}
                      trigger={trigger}
                      validation={{ required: "A/L MAWB is required" }}
                      initialValue={watch("almawb") || ""}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      resetFactor={runEntryrReset}
                      label="Unique ID"
                      register={register}
                      setValue={setValue}
                      value="uniqueID"
                      initialValue={watch("uniqueID") || ""}
                      readOnly={true}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <div className="flex gap-2">
              <EditButton
                disabled={
                  editButton ||
                  isLoading ||
                  isUpdating ||
                  isSubmitting ||
                  isDeleting
                }
                onClick={handleSubmit(handleEditButton)}
                label={isUpdating ? "Updating..." : editing ? "Update" : "Edit"}
              />
              <DeleteButton
                disabled={
                  deleteButton ||
                  isLoading ||
                  isDeleting ||
                  isSubmitting ||
                  isUpdating
                }
                onClick={handleDelete}
                perm="Operation Deletion"
                label={isDeleting ? "Deleting..." : "Delete"}
              />
            </div>
            <div className="flex gap-2">
              {!editing && (
                <>
                  <SimpleButton
                    type="submit"
                    name={isSubmitting ? "Creating..." : "Create"}
                    disabled={
                      addButton ||
                      isLoading ||
                      isSubmitting ||
                      isUpdating ||
                      isDeleting
                    }
                  />
                </>
              )}
              {editing && (
                <OutlinedButtonRed
                  label="Cancel"
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
