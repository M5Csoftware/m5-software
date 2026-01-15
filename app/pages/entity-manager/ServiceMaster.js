import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import CodeList from "@/app/components/CodeList";
import InputBox from "@/app/components/InputBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import NotificationFlag from "@/app/components/Notificationflag";

const ServiceMaster = ({ setCurrentView }) => {
  const {
    register,
    setValue,   
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: "",
      softwareStatus: "Active",
      portalStatus: "Active",
      multiplePcsAllow: false,
      averageWeightAllow: false,
      noOfPcs: "",
      averageLimit: "",
      boxLimit: "",
      volDiscountPercent: "",
      minActualWeightperPcs: "",
      maxActualWeightperPcs: "",
      minVolumeWeightperPcs: "",
      maxVolumeWeightperPcs: "",
      minActualWeightperAWB: "",
      maxActualWeightperAWB: "",
      minVolumeWeightperAWB: "",
      maxVolumeWeightperAWB: "",
      minChargeableWeightperAWB: "",
      maxChargeableWeightperAWB: "",
      maxShipmentValue: "",
      maxPcsperAWB: "",
    },
  });

  // WATCH THE CODE FIELD
  const codeValue = useWatch({ control, name: "code" });
  
  // State for radio button selections
  const [softwareStatus, setSoftwareStatus] = useState("Active");
  const [portalStatus, setPortalStatus] = useState("Active");
  const [multiplePcs, setMultiplePcs] = useState(false);
  const [averageWeight, setAverageWeight] = useState(false);
  const [matchedEntity, setMatchedEntity] = useState(null);

  const [data, setData] = useState([]);
  const [serviceData, setServiceData] = useState(null);
  const { server, setToggleCodeList, setCodeListConfig } = useContext(GlobalContext);
  const [Added, setAdded] = useState(false);

  // Track if ServiceMaster already exists for this code
  const [editId, setEditId] = useState(null);

  // Loading and notification states
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Ref to track debounce timeout
  const fetchTimeoutRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  const columns = useMemo(() => {
    return [
      { key: "code", label: "Service Code" },
      { key: "name", label: "Service Name" },
      { key: "sector", label: "Sector" },
    ];
  }, []);

  // Fetch service list (entity-manager, base data)
  useEffect(() => {
    const fetchEntity = async () => {
      try {
        const response = await axios.get(`${server}/entity-manager`, {
          params: { entityType: "Service" },
        });

        setData(response.status === 200 ? response.data : []);
      } catch (error) {
        console.error("Error fetching services:", error);
        setData([]);
      }
    };

    if (server) fetchEntity();
  }, [server]);

  // AUTO-FILL LOGIC FROM ENTITY MANAGER WHEN USER TYPES CODE
  useEffect(() => {
    if (!codeValue || data.length === 0) return;

    const match = data.find(
      (item) => item.code?.toLowerCase() === codeValue.toLowerCase()
    );

    if (match) {
      setMatchedEntity(match);

      setValue("serviceName", match.name || "");
      setValue("sector", match.sector || "");

      const portal = match.activeOnPortal ? "Active" : "In-Active";
      setPortalStatus(portal);
      setValue("portalStatus", portal);

      const software = match.activeOnSoftware ? "Active" : "In-Active";
      setSoftwareStatus(software);
      setValue("softwareStatus", software);
    } else {
      setMatchedEntity(null);

      setValue("serviceName", "");
      setValue("sector", "");

      setPortalStatus("Active");
      setSoftwareStatus("Active");

      setValue("portalStatus", "Active");
      setValue("softwareStatus", "Active");
    }
  }, [codeValue, data, setValue]);

  // NEW: Effect to fetch service master data when code changes
  useEffect(() => {
    if (!codeValue || codeValue.trim() === "") {
      clearServiceMasterFields();
      return;
    }

    // Clear previous timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Set a new timeout (debounce of 500ms)
    fetchTimeoutRef.current = setTimeout(() => {
      // Check if code exists in entity manager first
      const existsInEntityManager = data.some(
        (item) => item.code?.toLowerCase() === codeValue.toLowerCase()
      );
      
      if (existsInEntityManager) {
        fetchServiceMasterData(codeValue);
      } else {
        // If code doesn't exist in entity manager, clear service master fields
        clearServiceMasterFields();
        showNotification("warning", "Service code not found in entity manager. Please enter a valid code.");
      }
    }, 500);

    // Cleanup function
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [codeValue, data]); // Added data dependency

  // Function to fetch service master data
 // Function to fetch service master data
const fetchServiceMasterData = async (code) => {
  if (!code || !server || code.trim() === "") {
    setEditId(null);
    setServiceData(null);
    return;
  }

  try {
    setIsLoading(true);
    const res = await axios.get(`${server}/service-master/getService`, {
      params: { code: code.trim() },
    });

    // Check if service was found
    if (res.data.found === false || !res.data._id) {
      // No existing service master found - set default values
      setEditId(null);
      setServiceData(null);
      
      // Set default values for checkboxes
      setMultiplePcs(false);
      setAverageWeight(false);
      setValue("multiplePcsAllow", false);
      setValue("averageWeightAllow", false);
      
      setValue("noOfPcs", "");
      setValue("averageLimit", "");
      setValue("boxLimit", "");
      setValue("volDiscountPercent", "");
      
      // Reset all other fields
      const resetFields = [
        "minActualWeightperPcs",
        "maxActualWeightperPcs",
        "minVolumeWeightperPcs",
        "maxVolumeWeightperPcs",
        "minActualWeightperAWB",
        "maxActualWeightperAWB",
        "minVolumeWeightperAWB",
        "maxVolumeWeightperAWB",
        "minChargeableWeightperAWB",
        "maxChargeableWeightperAWB",
        "maxShipmentValue",
        "maxPcsperAWB"
      ];
      
      resetFields.forEach(field => setValue(field, ""));
      
      // Clear any existing notification about loading
      setNotification(prev => ({ ...prev, visible: false }));
      
      return;
    }

    // Service found - populate data
    const s = res.data;
    setServiceData(s);
    setEditId(s._id);

    // Set statuses from DB
    const swStatus = s.softwareStatus || "Active";
    const ptStatus = s.portalStatus || "Active";
    
    // FIXED: Properly handle boolean values for checkboxes
    const multiPcs = Boolean(s.multiplePcsAllow);
    const avgWeight = Boolean(s.averageWeightAllow);

    setSoftwareStatus(swStatus);
    setPortalStatus(ptStatus);
    setMultiplePcs(multiPcs);
    setAverageWeight(avgWeight);
    
    setValue("softwareStatus", swStatus);
    setValue("portalStatus", ptStatus);
    setValue("multiplePcsAllow", multiPcs);
    setValue("averageWeightAllow", avgWeight);

    // Service details
    setValue("serviceName", s.serviceName || matchedEntity?.name || "");

    // New fields - IMPORTANT: Use proper conditional checks for zero values
    setValue("noOfPcs", s.noOfPcs !== undefined && s.noOfPcs !== 0 ? s.noOfPcs.toString() : "");
    setValue("averageLimit", s.averageLimit !== undefined && s.averageLimit !== 0 ? s.averageLimit.toString() : "");
    setValue("boxLimit", s.boxLimit !== undefined && s.boxLimit !== 0 ? s.boxLimit.toString() : "");
    
    // ✅ FIXED: Properly set volume discount percentage (ONLY for Service Master form)
    if (s.volDiscountPercent !== undefined && s.volDiscountPercent !== null && s.volDiscountPercent !== 0) {
      setValue("volDiscountPercent", s.volDiscountPercent.toString());
    } else {
      setValue("volDiscountPercent", "");
    }

    // Per Pcs
    setValue("minActualWeightperPcs", s.perPcs?.minActualWeight ? s.perPcs.minActualWeight.toString() : "");
    setValue("maxActualWeightperPcs", s.perPcs?.maxActualWeight ? s.perPcs.maxActualWeight.toString() : "");
    setValue("minVolumeWeightperPcs", s.perPcs?.minVolumeWeight ? s.perPcs.minVolumeWeight.toString() : "");
    setValue("maxVolumeWeightperPcs", s.perPcs?.maxVolumeWeight ? s.perPcs.maxVolumeWeight.toString() : "");

    // Per AWB
    setValue("minActualWeightperAWB", s.perAWB?.minActualWeight ? s.perAWB.minActualWeight.toString() : "");
    setValue("maxActualWeightperAWB", s.perAWB?.maxActualWeight ? s.perAWB.maxActualWeight.toString() : "");
    setValue("minVolumeWeightperAWB", s.perAWB?.minVolumeWeight ? s.perAWB.minVolumeWeight.toString() : "");
    setValue("maxVolumeWeightperAWB", s.perAWB?.maxVolumeWeight ? s.perAWB.maxVolumeWeight.toString() : "");
    setValue(
      "minChargeableWeightperAWB",
      s.perAWB?.minChargeableWeight ? s.perAWB.minChargeableWeight.toString() : ""
    );
    setValue(
      "maxChargeableWeightperAWB",
      s.perAWB?.maxChargeableWeight ? s.perAWB.maxChargeableWeight.toString() : ""
    );

    // Others
    setValue("maxShipmentValue", s.maxShipmentValue ? s.maxShipmentValue.toString() : "");
    setValue("maxPcsperAWB", s.maxPcsPerAWB ? s.maxPcsPerAWB.toString() : "");

  } catch (error) {
    console.error("Error fetching service-master by code:", error);
    setEditId(null);
    setServiceData(null);
    showNotification("error", "Error loading service data. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  // Function to clear all service master fields
  const clearServiceMasterFields = () => {
    setEditId(null);
    setServiceData(null);
    
    // Reset to default values (but keep code and basic info from entity manager)
    setMultiplePcs(false);
    setAverageWeight(false);
    setValue("multiplePcsAllow", false);
    setValue("averageWeightAllow", false);
    setValue("noOfPcs", "");
    setValue("averageLimit", "");
    setValue("boxLimit", "");
    setValue("volDiscountPercent", "");
    
    // Reset all other fields
    const resetFields = [
      "minActualWeightperPcs",
      "maxActualWeightperPcs",
      "minVolumeWeightperPcs",
      "maxVolumeWeightperPcs",
      "minActualWeightperAWB",
      "maxActualWeightperAWB",
      "minVolumeWeightperAWB",
      "maxVolumeWeightperAWB",
      "minChargeableWeightperAWB",
      "maxChargeableWeightperAWB",
      "maxShipmentValue",
      "maxPcsperAWB"
    ];
    
    resetFields.forEach(field => setValue(field, ""));
  };

  // Keep the handleCodeBlur for manual trigger if needed
  const handleCodeBlur = () => {
    if (codeValue && codeValue.trim() !== "") {
      // Check if the code exists in entity manager first
      const existsInEntityManager = data.some(
        (item) => item.code?.toLowerCase() === codeValue.toLowerCase()
      );
      
      if (existsInEntityManager) {
        fetchServiceMasterData(codeValue);
      } else {
        clearServiceMasterFields();
        showNotification("warning", "Service code not found in entity manager. Please enter a valid code.");
      }
    } else {
      clearServiceMasterFields();
    }
  };

  // Handle checkbox changes
  const handleMultiplePcsChange = (e) => {
    const value = e.target.checked;
    setMultiplePcs(value);
    setValue("multiplePcsAllow", value);
    if (!value) {
      setValue("noOfPcs", "");
    }
  };

  const handleAverageWeightChange = (e) => {
    const value = e.target.checked;
    setAverageWeight(value);
    setValue("averageWeightAllow", value);
    if (!value) {
      setValue("averageLimit", "");
    }
  };

  // SAVE FUNCTION
  const onSubmit = async (formData) => {
    // Validate code exists in entity manager
    if (!formData.code || formData.code.trim() === "") {
      showNotification("error", "Please enter a service code");
      return;
    }

    const existsInEntityManager = data.some(
      (item) => item.code?.toLowerCase() === formData.code.toLowerCase()
    );
    
    if (!existsInEntityManager) {
      showNotification("error", "Service code not found in entity manager. Please enter a valid code.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        softwareStatus: formData.softwareStatus,
        portalStatus: formData.portalStatus,
        code: formData.code?.trim(),
        serviceName: formData.serviceName?.trim(),

        multiplePcsAllow: Boolean(formData.multiplePcsAllow),
        noOfPcs: Number(formData.noOfPcs || 0),

        averageWeightAllow: Boolean(formData.averageWeightAllow),
        averageLimit: Number(formData.averageLimit || 0),
        boxLimit: Number(formData.boxLimit || 0),
        volDiscountPercent: Number(formData.volDiscountPercent || 0),

        perPcs: {
          minActualWeight: Number(formData.minActualWeightperPcs || 0),
          maxActualWeight: Number(formData.maxActualWeightperPcs || 0),
          minVolumeWeight: Number(formData.minVolumeWeightperPcs || 0),
          maxVolumeWeight: Number(formData.maxVolumeWeightperPcs || 0),
        },

        perAWB: {
          minActualWeight: Number(formData.minActualWeightperAWB || 0),
          maxActualWeight: Number(formData.maxActualWeightperAWB || 0),
          minVolumeWeight: Number(formData.minVolumeWeightperAWB || 0),
          maxVolumeWeight: Number(formData.maxVolumeWeightperAWB || 0),
          minChargeableWeight: Number(formData.minChargeableWeightperAWB || 0),
          maxChargeableWeight: Number(formData.maxChargeableWeightperAWB || 0),
        },

        maxShipmentValue: Number(formData.maxShipmentValue || 0),
        maxPcsPerAWB: Number(formData.maxPcsperAWB || 0),
      };

      let response;

      if (editId) {
        // UPDATE EXISTING
        response = await axios.put(`${server}/service-master`, payload, {
          params: { id: editId },
        });
        showNotification("success", "Service Updated Successfully!");
      } else {
        // CREATE NEW
        response = await axios.post(`${server}/service-master`, payload);
        showNotification("success", "Service Saved Successfully!");
      }

      // After successful save, fetch the updated data to persist the values
      setTimeout(() => {
        fetchServiceMasterData(formData.code);
      }, 100);
      
    } catch (error) {
      console.error("Save error:", error);
      showNotification("error", error?.response?.data?.error || "Failed to save service");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = () => {
    setAdded(!Added);
    reset({
      code: "", // Clear code on refresh
      serviceName: "",
      sector: "",
      softwareStatus: "Active",
      portalStatus: "Active",
      multiplePcsAllow: false,
      averageWeightAllow: false,
      noOfPcs: "",
      averageLimit: "",
      boxLimit: "",
      volDiscountPercent: "",
      minActualWeightperPcs: "",
      maxActualWeightperPcs: "",
      minVolumeWeightperPcs: "",
      maxVolumeWeightperPcs: "",
      minActualWeightperAWB: "",
      maxActualWeightperAWB: "",
      minVolumeWeightperAWB: "",
      maxVolumeWeightperAWB: "",
      minChargeableWeightperAWB: "",
      maxChargeableWeightperAWB: "",
      maxShipmentValue: "",
      maxPcsperAWB: "",
    });
    
    setSoftwareStatus("Active");
    setPortalStatus("Active");
    setMultiplePcs(false);
    setAverageWeight(false);
    setMatchedEntity(null);
    setEditId(null);
    setServiceData(null);
    showNotification("success", "Page refreshed successfully");
  };

  const openCodeList = () => {
    setCodeListConfig({
      data,
      columns,
      name: "Service Master",
      handleAction: (selectedItem) => {
        setValue("code", selectedItem.code);
        setValue("serviceName", selectedItem.name);
        setValue("sector", selectedItem.sector);
        
        // After selecting from code list, immediately check for service master
        setTimeout(() => {
          fetchServiceMasterData(selectedItem.code);
        }, 100);
      },
    });

    setToggleCodeList(true);
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading 
        title={"Service Master"} 
        bulkUploadBtn="hidden" 
        onRefresh={handleRefresh} 
        onClickCodeList={openCodeList} 
      />

      {/* Status Section */}
      <div className="flex gap-6">
        {/* Software Status */}
        <div className="flex items-center gap-4 px-3 py-2 rounded-lg border border-[#979797]">
          <span className="text-base font-medium text-gray-800">
            Software Status
          </span>

          {["Active", "In-Active"].map((status) => (
            <label
              key={status}
              onClick={() => {
                setSoftwareStatus(status);
                setValue("softwareStatus", status);
              }}
              className="flex gap-2 items-center cursor-pointer"
            >
              <div
                className={`rounded-full w-5 h-5 border-2 flex items-center justify-center ${
                  softwareStatus === status
                    ? status === "Active"
                      ? "border-green-500"
                      : "border-red"
                    : "border-gray-400"
                }`}
              >
                {softwareStatus === status && (
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status === "Active" ? "bg-green-500" : "bg-red"
                    }`}
                  ></div>
                )}
                <input
                  type="radio"
                  {...register("softwareStatus")}
                  checked={softwareStatus === status}
                  className="hidden"
                  value={status}
                />
              </div>

              <span
                className={`text-base font-medium ${
                  softwareStatus === status
                    ? status === "Active"
                      ? "text-green-500"
                      : "text-red"
                    : "text-gray-500"
                }`}
              >
                {status}
              </span>
            </label>
          ))}
        </div>

        {/* Portal Status */}
        <div className="flex items-center gap-4 px-3 py-2 rounded-lg border border-[#979797]">
          <span className="text-base font-medium text-gray-800">
            Portal Status
          </span>

          {["Active", "In-Active"].map((status) => (
            <label
              key={status}
              onClick={() => {
                setPortalStatus(status);
                setValue("portalStatus", status);
              }}
              className="flex gap-2 items-center cursor-pointer"
            >
              <div
                className={`rounded-full w-5 h-5 border-2 flex items-center justify-center ${
                  portalStatus === status
                    ? status === "Active"
                      ? "border-green-500"
                      : "border-red"
                    : "border-gray-400"
                }`}
              >
                {portalStatus === status && (
                  <div
                    className={`w-2 h-2 rounded-full ${
                      status === "Active" ? "bg-green-500" : "bg-red"
                    }`}
                  ></div>
                )}
                <input
                  type="radio"
                  {...register("portalStatus")}
                  checked={portalStatus === status}
                  className="hidden"
                  value={status}
                />
              </div>

              <span
                className={`text-base font-medium ${
                  portalStatus === status
                    ? status === "Active"
                      ? "text-green-500"
                      : "text-red"
                    : "text-gray-500"
                }`}
              >
                {status}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* CODE + SERVICE NAME */}
      <div className="flex gap-9">
        <div className="w-1/2 relative">
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Code"}
            value={"code"}
            resetFactor={Added}
            disabled={isLoading}
            onBlur={handleCodeBlur}
            required={true}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="h-4 w-4 border-2 border-red border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <div className="w-1/2">
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Service Name"}
            value={"serviceName"}
            initialValue={matchedEntity?.name || ""}
            resetFactor={Added}
            disabled={isLoading}
            required={true}
          />
        </div>
      </div>

      {/* SECTOR FIELD */}
      <InputBox
        register={register}
        setValue={setValue}
        placeholder={"Sector"}
        value={"sector"}
        initialValue={matchedEntity?.sector || ""}
        resetFactor={Added}
        disabled={isLoading}
      />

      {/* CHANGED: Multiple Pcs Allow Section - Changed to Checkbox */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 px-3 py-2 rounded-lg border border-[#979797]">
          <label className="flex gap-2 items-center cursor-pointer">
            <input
              type="checkbox"
              {...register("multiplePcsAllow")}
              checked={multiplePcs}
              onChange={handleMultiplePcsChange}
              className="w-5 h-5 text-red focus:ring-red focus:ring-2 rounded border-gray-300"
            />
            <span className="text-base font-medium text-gray-800">
              Multiple Pcs Allow
            </span>
          </label>
        </div>

        {/* No. of Pcs Input - Enabled only when checkbox is checked */}
        {multiplePcs === true && (
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"No. of Pcs"}
            value={"noOfPcs"}
            initialValue={serviceData?.noOfPcs ? serviceData.noOfPcs.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
        )}
      </div>

      {/* CHANGED: Average Weight Allow Section - Changed to Checkbox */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4 px-3 py-2 rounded-lg border border-[#979797]">
          <label className="flex gap-2 items-center cursor-pointer">
            <input
              type="checkbox"
              {...register("averageWeightAllow")}
              checked={averageWeight}
              onChange={handleAverageWeightChange}
              className="w-5 h-5 text-red focus:ring-red focus:ring-2 rounded border-gray-300"
            />
            <span className="text-base font-medium text-gray-800">
              Average Weight Allow
            </span>
          </label>
        </div>

        {/* Average Limit Input - Enabled only when checkbox is checked */}
        {averageWeight === true && (
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Average Limit (kg)"}
            value={"averageLimit"}
            initialValue={serviceData?.averageLimit ? serviceData.averageLimit.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
        )}

        {/* CHANGED: Box Limit and Volume Discount are always enabled (not dependent on checkbox) */}
        <div className="flex gap-9">
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Box Limit (kg)"}
            value={"boxLimit"}
            initialValue={serviceData?.boxLimit ? serviceData.boxLimit.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Vol Discount %"}
            value={"volDiscountPercent"}
            initialValue={serviceData?.volDiscountPercent ? serviceData.volDiscountPercent.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Per Pcs Section */}
      <div className="flex flex-col gap-3">
        <RedLabelHeading label={"Per Pcs"} />

        <div className="flex gap-9">
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Min - Actual Weight per Pcs (kg)"}
            value={"minActualWeightperPcs"}
            initialValue={serviceData?.perPcs?.minActualWeight ? serviceData.perPcs.minActualWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Max - Actual Weight per Pcs (kg)"}
            value={"maxActualWeightperPcs"}
            initialValue={serviceData?.perPcs?.maxActualWeight ? serviceData.perPcs.maxActualWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-9">
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Min - Volume Weight per Pcs (kg)"}
            value={"minVolumeWeightperPcs"}
            initialValue={serviceData?.perPcs?.minVolumeWeight ? serviceData.perPcs.minVolumeWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Max - Volume Weight per Pcs (kg)"}
            value={"maxVolumeWeightperPcs"}
            initialValue={serviceData?.perPcs?.maxVolumeWeight ? serviceData.perPcs.maxVolumeWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Per AWB */}
      <div className="flex flex-col gap-3">
        <RedLabelHeading label={"Per AWB"} />

        <div className="flex gap-9">
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Min - Actual Weight per AWB (kg)"}
            value={"minActualWeightperAWB"}
            initialValue={serviceData?.perAWB?.minActualWeight ? serviceData.perAWB.minActualWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Max - Actual Weight per AWB (kg)"}
            value={"maxActualWeightperAWB"}
            initialValue={serviceData?.perAWB?.maxActualWeight ? serviceData.perAWB.maxActualWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-9">
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Min - Volume Weight per AWB (kg)"}
            value={"minVolumeWeightperAWB"}
            initialValue={serviceData?.perAWB?.minVolumeWeight ? serviceData.perAWB.minVolumeWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Max - Volume Weight per AWB (kg)"}
            value={"maxVolumeWeightperAWB"}
            initialValue={serviceData?.perAWB?.maxVolumeWeight ? serviceData.perAWB.maxVolumeWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-9">
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Min - Chargeable Weight per AWB (kg)"}
            value={"minChargeableWeightperAWB"}
            initialValue={serviceData?.perAWB?.minChargeableWeight ? serviceData.perAWB.minChargeableWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={"Max - Chargeable Weight per AWB (kg)"}
            value={"maxChargeableWeightperAWB"}
            initialValue={serviceData?.perAWB?.maxChargeableWeight ? serviceData.perAWB.maxChargeableWeight.toString() : ""}
            resetFactor={Added}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-9">
        <InputBox
          register={register}
          setValue={setValue}
          placeholder={"Max Shipment Value"}
          value={"maxShipmentValue"}
          initialValue={serviceData?.maxShipmentValue ? serviceData.maxShipmentValue.toString() : ""}
          resetFactor={Added}
          disabled={isLoading}
        />
        <InputBox
          register={register}
          setValue={setValue}
          placeholder={"Max Pcs per AWB"}
          value={"maxPcsperAWB"}
          initialValue={serviceData?.maxPcsPerAWB ? serviceData.maxPcsPerAWB.toString() : ""}
          resetFactor={Added}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end mt-3">
        <div>
          <SimpleButton 
            name={isSaving ? (editId ? "Updating..." : "Saving...") : (editId ? "Update" : "Save")} 
            type="submit"
            disabled={isSaving || isLoading}
          />
        </div>
      </div>
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 border-2 border-red border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium">Loading service data...</span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default ServiceMaster;