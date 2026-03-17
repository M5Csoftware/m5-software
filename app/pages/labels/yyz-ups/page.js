"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";

// Editable Input Box Component
const EditableInputBox = ({
  placeholder,
  register,
  setValue,
  value,
  initialValue = "",
  resetFactor = false,
  isTextArea = false,
  className = "",
  validation = {},
  error,
  trigger,
  type = "input",
  disabled = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    let newValue = e.target.value;
    if (
      [
        "code",
        "panNo",
        "gstNo",
        "cinNo",
        "awbNo",
        "eventCode",
        "accountCode",
      ].includes(value)
    ) {
      newValue = newValue.toUpperCase();
    }
    setInputValue(newValue);
    setValue(value, newValue);
    if (trigger) {
      trigger(value);
    }
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setInputValue("");
    setValue(value, null);
  }, [resetFactor]);

  return isTextArea ? (
    <div className="relative w-full">
      <textarea
        {...register(value)}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`border border-[#979797] outline-none bg-transparent rounded-md h-8 text-sm px-4 py-2 w-full ${
          disabled ? "bg-white-smoke" : ""
        }  ${className}`}
      />
      {placeholder && (
        <label
          htmlFor={value}
          className={`absolute transition-all px-2 left-4 ${
            isPlaceholderFloating
              ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
              : `${
                  error ? "top-1/3" : "top-1/2"
                } -translate-y-1/2 -bottom-6  text-sm text-[#979797]`
          }`}
        >
          {placeholder}
        </label>
      )}
      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  ) : (
    <div className="relative w-full">
      <input
        type={type}
        {...register(value, validation)}
        value={inputValue}
        id={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
        className={`border outline-none bg-transparent rounded-md h-8 text-sm px-4 py-2 w-full ${
          error ? "border-red" : "border-[#979797]"
        } ${disabled ? "bg-white-smoke" : ""}  ${className}`}
      />
      {placeholder && (
        <label
          htmlFor={value}
          className={`absolute transition-all px-2  left-4 ${
            isPlaceholderFloating
              ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
              : `${
                  error ? "top-1/3" : "top-1/2"
                } -translate-y-1/2  text-sm text-[#979797]`
          }`}
        >
          {placeholder}
        </label>
      )}
      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  );
};

const LabelPage = () => {
  const { register, setValue, reset, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [resetFactor, setResetFactor] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shipmentData, setShipmentData] = useState(null);
  const [childNumbers, setChildNumbers] = useState([]);
  const [labelPreviews, setLabelPreviews] = useState([]);
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const [labelsCreated, setLabelsCreated] = useState(false);
  const [labelsSaved, setLabelsSaved] = useState(false);
  const [consigneeEdited, setConsigneeEdited] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const awbNo = watch("awbNo");

  // Watch consignee fields for changes
  const consignee = watch("consignee");
  const addressLine1 = watch("addressLine1");
  const addressLine2 = watch("addressLine2");
  const zipcode = watch("zipcode");
  const city = watch("city");
  const state = watch("state");
  const telephone = watch("telephone");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  const handleRefresh = async () => {
    if (labelsCreated && !labelsSaved) {
      const confirmDelete = window.confirm(
        "Labels have been created but not saved. Do you want to delete them?"
      );
      if (!confirmDelete) {
        return;
      }
    }

    if (awbNo) {
      try {
        await axios.delete(`${server}/labels/ups?awbNo=${awbNo.toUpperCase()}`);
      } catch (error) {
        console.error("Error deleting labels:", error);
      }
    }

    setResetFactor(!resetFactor);
    setFormKey((prev) => prev + 1);
    reset();
    setShipmentData(null);
    setChildNumbers([]);
    setLabelPreviews([]);
    setCurrentLabelIndex(0);
    setLabelsCreated(false);
    setLabelsSaved(false);
    setConsigneeEdited(false);
  };

  const handleSearch = async () => {
    if (!awbNo) {
      showNotification("error", "Please enter AWB Number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`${server}/labels/ups?awbNo=${awbNo.toUpperCase()}`);

      if (response.data.success) {
        const data = response.data.data;
        setShipmentData(data);

        const extractedChildNumbers = [];

        if (data.pcs > 1) {
          if (
            data.childShipments &&
            Array.isArray(data.childShipments) &&
            data.childShipments.length > 0
          ) {
            data.childShipments.forEach((childShipment) => {
              extractedChildNumbers.push({
                sno: extractedChildNumbers.length + 1,
                childNo: childShipment.childAwbNo,
                forwardingNo: childShipment.forwardingNo || "",
                consigneeName:
                  childShipment.consigneeName || data.receiverFullName || "",
                consigneeCity:
                  childShipment.consigneeCity || data.receiverCity || "",
              });
            });

            const hasSavedLabels = extractedChildNumbers.some(
              (child) => child.forwardingNo
            );
            setLabelsSaved(hasSavedLabels);
          }
        } else {
          if (data.forwardingNo) {
            setLabelsSaved(true);
          }
        }

        const formatDDMMYYYY = (d) => {
          const date = new Date(d);
          const dd = String(date.getDate()).padStart(2, "0");
          const mm = String(date.getMonth() + 1).padStart(2, "0");
          const yyyy = date.getFullYear();
          return `${dd}-${mm}-${yyyy}`;
        };

        setValue("date", data.date ? formatDDMMYYYY(data.date) : "");

        setChildNumbers(extractedChildNumbers);

        setValue("sector", data.sector || "");
        // setValue(
        //   "date",
        //   data.date ? new Date(data.date).toISOString().split("T")[0] : ""
        // );
        setValue("origin", data.origin || "");
        setValue("accountCode", data.accountCode || "");
        setValue("customer", data.customer || "");
        setValue("consigor", data.shipperFullName || "");
        setValue("pcs", data.pcs || 0);
        setValue("actualWt", data.totalActualWt || 0);
        setValue("value", data.totalInvoiceValue || 0);
        setValue("operationRemarks", data.operationRemark || "");
        setValue("content", data.content?.join(", ") || "");
        setValue("hold", data.isHold || false);
        setValue("holdReason", data.holdReason || "");

        setValue("consignee", data.receiverFullName || "");
        setValue("addressLine1", data.receiverAddressLine1 || "");
        setValue("addressLine2", data.receiverAddressLine2 || "");
        setValue("zipcode", data.receiverPincode || "");
        setValue("city", data.receiverCity || "");
        setValue("state", data.receiverState || "");
        setValue("telephone", data.receiverPhoneNumber || "");

        setValue("billingService", "UPS LABEL STANDARD XI");

        if (data.forwardingNo) {
          setValue("dpdNo", data.forwardingNo);
        } else if (extractedChildNumbers.length > 0) {
          const forwardingNos = extractedChildNumbers
            .map((child) => child.forwardingNo)
            .filter(Boolean)
            .join(", ");
          if (forwardingNos) {
            setValue("dpdNo", forwardingNos);
          }
        }

        if (data.isHold) {
          showNotification(
            "error",
            `Shipment is on hold. Reason: ${data.holdReason || "Not specified"}`
          );
        } else if (data.pcs > 1 && extractedChildNumbers.length === 0) {
          showNotification(
            "warning",
            "Please generate Child AWB Numbers before creating labels"
          );
        } else {
          showNotification("success", "Shipment data loaded successfully");
        }

        // Reset consignee edited flag after loading data
        setConsigneeEdited(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch shipment data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!shipmentData) {
      showNotification("error", "Please search for a shipment first");
      return;
    }

    if (shipmentData.isHold) {
      showNotification("error", "Cannot create label - Shipment is on hold");
      return;
    }

    if (shipmentData.pcs > 1 && childNumbers.length === 0) {
      showNotification(
        "error",
        "Cannot create label - Please generate Child AWB Numbers first"
      );
      return;
    }

    setLoading(true);
    try {
      const consigneeData = {
        consignee: watch("consignee"),
        addressLine1: watch("addressLine1"),
        addressLine2: watch("addressLine2"),
        zipcode: watch("zipcode"),
        city: watch("city"),
        state: watch("state"),
        telephone: watch("telephone"),
      };

      const response = await axios.post(`${server}/labels/ups`, {
        awbNo: shipmentData.awbNo,
        consigneeData: consigneeData,
      });

      if (response.data.success) {
        setLabelPreviews(response.data.labels);
        setLabelsCreated(true);
        setLabelsSaved(false);

        const trackingNumbers = response.data.labels
          .map((label) => label.trackingNumber)
          .filter(Boolean)
          .join(", ");

        setValue("dpdNo", trackingNumbers);

        if (response.data.labels.length > 0 && childNumbers.length > 0) {
          const updatedChildNumbers = childNumbers.map((child) => {
            const matchingLabel = response.data.labels.find(
              (label) => label.childNo === child.childNo
            );
            return {
              ...child,
              forwardingNo: matchingLabel?.trackingNumber || "",
            };
          });
          setChildNumbers(updatedChildNumbers);
        }

        showNotification(
          "success",
          `UPS labels created successfully! (${
            response.data.labels.length
          } label${
            response.data.labels.length !== 1 ? "s" : ""
          }) - Click Save to store`
        );
      }
    } catch (error) {
      console.error("Create label error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to create UPS labels"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!labelsCreated) {
      showNotification("error", "No labels to save");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${server}/labels/ups`, {
        awbNo: shipmentData.awbNo,
        action: "save",
        labels: labelPreviews,
      });

      if (response.data.success) {
        setLabelsSaved(true);
        showNotification("success", "Forwarding numbers saved successfully!");
      }
    } catch (error) {
      console.error("Save error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to save forwarding numbers"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConsignee = async () => {
    if (!shipmentData) {
      showNotification("error", "No shipment data to update");
      return;
    }

    setLoading(true);
    try {
      const consigneeData = {
        consignee: watch("consignee"),
        addressLine1: watch("addressLine1"),
        addressLine2: watch("addressLine2"),
        zipcode: watch("zipcode"),
        city: watch("city"),
        state: watch("state"),
        telephone: watch("telephone"),
      };

      const response = await axios.put(`${server}/labels/ups`, {
        awbNo: shipmentData.awbNo,
        consigneeData: consigneeData,
      });

      if (response.data.success) {
        setConsigneeEdited(false);
        showNotification("success", "Consignee details updated successfully!");
      }
    } catch (error) {
      console.error("Update consignee error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to update consignee details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (labelPreviews.length === 0) {
      showNotification("error", "No labels to print");
      return;
    }

    labelPreviews.forEach((label, index) => {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head><title>Print UPS Label ${index + 1}</title></head>
          <body style="margin:0;padding:0;">
            <embed src="${
              label.labelUrl
            }" type="application/pdf" width="100%" height="100%" />
          </body>
        </html>
      `);
      printWindow.document.close();
    });
  };

  const handlePreviousLabel = () => {
    if (currentLabelIndex > 0) {
      setCurrentLabelIndex(currentLabelIndex - 1);
    }
  };

  const handleNextLabel = () => {
    if (currentLabelIndex < labelPreviews.length - 1) {
      setCurrentLabelIndex(currentLabelIndex + 1);
    }
  };

  // Effect to detect consignee field changes
  useEffect(() => {
    if (shipmentData) {
      const hasChanges =
        consignee !== (shipmentData.receiverFullName || "") ||
        addressLine1 !== (shipmentData.receiverAddressLine1 || "") ||
        addressLine2 !== (shipmentData.receiverAddressLine2 || "") ||
        zipcode !== (shipmentData.receiverPincode || "") ||
        city !== (shipmentData.receiverCity || "") ||
        state !== (shipmentData.receiverState || "") ||
        telephone !== (shipmentData.receiverPhoneNumber || "");

      setConsigneeEdited(hasChanges);
    }
  }, [
    consignee,
    addressLine1,
    addressLine2,
    zipcode,
    city,
    state,
    telephone,
    shipmentData,
  ]);

  return (
    <div>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title={`YYZ UPS Label`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex gap-3">
        {/* Left Column - Form */}
        <div className="w-1/3 flex flex-col mt-3">
          <RedLabelHeading label={`Consignor Details`} />

          <div className="flex flex-col gap-3 mt-2">
            <div className="flex gap-3">
              <InputBox
                resetFactor={resetFactor}
                register={register}
                setValue={setValue}
                placeholder={`Airwaybill Number`}
                value={`awbNo`}
              />
              <div>
                <OutlinedButtonRed
                  label={loading ? "Searching..." : "Search"}
                  onClick={handleSearch}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <EditableInputBox
                key={`sector-${formKey}`}
                resetFactor={resetFactor}
                register={register}
                setValue={setValue}
                placeholder={`Sector`}
                value={`sector`}
                initialValue={watch("sector")}
                disabled={true}
              />
              <DateInputBox
                key={`date-${formKey}-${watch("date")}`} 
                register={register}
                setValue={setValue}
                placeholder="Date"
                value="date"
                resetFactor={resetFactor}
                initialValue={watch("date") || ""}
              />

              <EditableInputBox
                key={`origin-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Origin`}
                value={`origin`}
                resetFactor={resetFactor}
                initialValue={watch("origin")}
                disabled={true}
              />
            </div>

            <div className="flex gap-3">
              <EditableInputBox
                key={`accountCode-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Code`}
                value={`accountCode`}
                resetFactor={resetFactor}
                initialValue={watch("accountCode")}
                disabled={true}
              />
              <EditableInputBox
                key={`customer-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Customer`}
                value={`customer`}
                resetFactor={resetFactor}
                initialValue={watch("customer")}
                disabled={true}
              />
            </div>

            <EditableInputBox
              key={`consigor-${formKey}`}
              register={register}
              setValue={setValue}
              placeholder={`Consignor`}
              value={`consigor`}
              resetFactor={resetFactor}
              initialValue={watch("consigor")}
              disabled={true}
            />

            <RedLabelHeading label={`Consignee Details`} />

            <div className="flex flex-col gap-3">
              <EditableInputBox
                key={`consignee-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Consignee`}
                value={`consignee`}
                resetFactor={resetFactor}
                initialValue={watch("consignee")}
              />
              <EditableInputBox
                key={`addressLine1-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Address Line 1`}
                value={`addressLine1`}
                resetFactor={resetFactor}
                initialValue={watch("addressLine1")}
              />
              <EditableInputBox
                key={`addressLine2-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Address Line 2`}
                value={`addressLine2`}
                resetFactor={resetFactor}
                initialValue={watch("addressLine2")}
              />
              <div className="flex gap-3">
                <EditableInputBox
                  key={`zipcode-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder={`Zipcode`}
                  value={`zipcode`}
                  resetFactor={resetFactor}
                  initialValue={watch("zipcode")}
                />
                <EditableInputBox
                  key={`city-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder={`City`}
                  value={`city`}
                  resetFactor={resetFactor}
                  initialValue={watch("city")}
                />
                <EditableInputBox
                  key={`state-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder={`State`}
                  value={`state`}
                  resetFactor={resetFactor}
                  initialValue={watch("state")}
                />
              </div>
              <EditableInputBox
                key={`telephone-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Telephone`}
                value={`telephone`}
                resetFactor={resetFactor}
                initialValue={watch("telephone")}
              />

              {consigneeEdited && (
                <div className="mt-2">
                  <SimpleButton
                    name={loading ? "Updating..." : "Update Consignee"}
                    onClick={handleUpdateConsignee}
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            <RedLabelHeading label={`Service Details`} />

            <div className="flex flex-col gap-3">
              <LabeledDropdown
                key={`billingService-${formKey}`}
                register={register}
                setValue={setValue}
                title={`Billing Service`}
                value={`billingService`}
                options={["UPS LABEL STANDARD XI"]}
                resetFactor={resetFactor}
              />
              <div className="flex gap-3">
                <EditableInputBox
                  key={`pcs-${formKey}`}
                  register={register}
                  setValue={setValue}
                  value={`pcs`}
                  placeholder={`Pcs`}
                  resetFactor={resetFactor}
                  initialValue={watch("pcs")}
                  disabled={true}
                />
                <EditableInputBox
                  key={`actualWt-${formKey}`}
                  register={register}
                  setValue={setValue}
                  value={`actualWt`}
                  resetFactor={resetFactor}
                  placeholder={`Actual Wt`}
                  initialValue={watch("actualWt")}
                  disabled={true}
                />
                <EditableInputBox
                  key={`value-${formKey}`}
                  register={register}
                  setValue={setValue}
                  value={`value`}
                  placeholder={`Value`}
                  resetFactor={resetFactor}
                  initialValue={watch("value")}
                />
              </div>
              <EditableInputBox
                key={`operationRemarks-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Ops Remark`}
                value={`operationRemarks`}
                resetFactor={resetFactor}
                initialValue={watch("operationRemarks")}
                disabled={true}
              />

              {shipmentData?.isHold && (
                <div className="flex gap-3">
                  <RedCheckbox
                    id={`hold`}
                    label={`Hold`}
                    register={register}
                    setValue={setValue}
                    setChecked={true}
                    isChecked={true}
                    disabled
                  />
                  <EditableInputBox
                    key={`holdReason-${formKey}`}
                    register={register}
                    setValue={setValue}
                    placeholder={`Hold Reason`}
                    value={`holdReason`}
                    resetFactor={resetFactor}
                    initialValue={watch("holdReason")}
                    disabled={true}
                  />
                </div>
              )}

              <EditableInputBox
                key={`content-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Content`}
                value={`content`}
                resetFactor={resetFactor}
                initialValue={watch("content")}
                disabled={true}
              />
            </div>

            <div className="mt-3 flex gap-3 justify-start">
              <div className="w-[160px]">
                <OutlinedButtonRed label={`Remove`} onClick={handleRefresh} />
              </div>
              <div className="w-[160px]">
                <OutlinedButtonRed
                  label={`Print All`}
                  onClick={handlePrint}
                  disabled={labelPreviews.length === 0}
                />
              </div>
              <div className="w-[160px]">
                <SimpleButton
                  name={
                    loading
                      ? labelsCreated
                        ? "Saving..."
                        : "Creating..."
                      : labelsCreated && !labelsSaved
                      ? "Save"
                      : "Create"
                  }
                  onClick={
                    labelsCreated && !labelsSaved ? handleSave : handleCreate
                  }
                  disabled={
                    loading ||
                    !shipmentData ||
                    shipmentData?.isHold ||
                    labelsSaved
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Label Preview */}
        <div className="w-1/3 mt-2">
          <div className="flex justify-between items-center">
            <RedLabelHeading
              label={
                labelPreviews.length > 1
                  ? `UPS Label Preview (${currentLabelIndex + 1}/${
                      labelPreviews.length
                    })`
                  : `UPS Label Preview`
              }
            />
            {labelPreviews.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousLabel}
                  disabled={currentLabelIndex === 0}
                  className={`px-3 py-1 text-sm rounded ${
                    currentLabelIndex === 0
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  Prev
                </button>
                <button
                  onClick={handleNextLabel}
                  disabled={currentLabelIndex === labelPreviews.length - 1}
                  className={`px-3 py-1 text-sm rounded ${
                    currentLabelIndex === labelPreviews.length - 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </div>
          <div className="h-[643px] rounded-md border-[1px] mt-1 mb-3 shadow-sm">
            {labelPreviews.length > 0 &&
            labelPreviews[currentLabelIndex]?.labelUrl ? (
              <embed
                src={labelPreviews[currentLabelIndex].labelUrl}
                type="application/pdf"
                width="100%"
                height="100%"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No label preview
              </div>
            )}
          </div>
          <EditableInputBox
            key={`dpdNo-${formKey}`}
            register={register}
            setValue={setValue}
            placeholder={`UPS Tracking Numbers`}
            value={`dpdNo`}
            resetFactor={resetFactor}
            initialValue={watch("dpdNo")}
            disabled={true}
          />
        </div>

        {/* Right Column - Child Numbers Table */}
        <div className="w-1/3 mt-2">
          <RedLabelHeading
            label={`Child AWB Numbers ${
              childNumbers.length > 0 ? `(${childNumbers.length})` : ""
            }`}
          />
          <div className="h-[643px] rounded-md border-[1px] mb-3 shadow-sm overflow-auto bg-gray-50">
            {childNumbers.length > 0 ? (
              <div className="p-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-red-50 border-b border-gray-300">
                      <th className="p-2 text-left font-semibold text-gray-700 border-r border-gray-300">
                        S.No
                      </th>
                      <th className="p-2 text-left font-semibold text-gray-700 border-r border-gray-300">
                        Child No
                      </th>
                      <th className="p-2 text-left font-semibold text-gray-700">
                        Forwarding No
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {childNumbers.map((child, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-200 hover:bg-gray-100"
                      >
                        <td className="p-2 border-r border-gray-200">
                          {child.sno}
                        </td>
                        <td className="p-2 border-r border-gray-200 font-medium">
                          {child.childNo}
                        </td>
                        <td className="p-2 text-blue-600">
                          {child.forwardingNo || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {shipmentData
                  ? shipmentData.pcs > 1
                    ? "No child AWB numbers found"
                    : "Single piece shipment - no child AWBs needed"
                  : "Search for a shipment to view details"}
              </div>
            )}
          </div>
          <EditableInputBox
            key={`labelUrl-${formKey}`}
            register={register}
            setValue={setValue}
            placeholder={`Label Url`}
            value={`labelUrl`}
            resetFactor={resetFactor}
            initialValue={watch("labelUrl")}
            disabled={true}
          />
        </div>
      </div>
    </div>
  );
};

export default LabelPage;
