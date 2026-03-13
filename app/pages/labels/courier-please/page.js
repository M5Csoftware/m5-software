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

const AmsDpdPage = () => {
  const { register, setValue, reset, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [resetFactor, setResetFactor] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [shipmentData, setShipmentData] = useState(null);
  const [labelPreviews, setLabelPreviews] = useState([]);
  const [currentLabelIndex, setCurrentLabelIndex] = useState(0);
  const [labelsCreated, setLabelsCreated] = useState(false);
  const [labelsSaved, setLabelsSaved] = useState(false);
  const [retryInfo, setRetryInfo] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const awbNo = watch("awbNo");

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleRefresh = async () => {
    if (labelsCreated && !labelsSaved) {
      const confirmDelete = window.confirm(
        "Labels have been created but not saved. Do you want to discard them?"
      );
      if (!confirmDelete) {
        return;
      }
    }

    if (awbNo) {
      try {
        await axios.delete(`${server}/labels/couriersplease?awbNo=${awbNo.toUpperCase()}`);
      } catch (error) {
        console.error("Error deleting labels:", error);
      }
    }

    setResetFactor(!resetFactor);
    setFormKey((prev) => prev + 1);
    reset();
    setShipmentData(null);
    setLabelPreviews([]);
    setCurrentLabelIndex(0);
    setLabelsCreated(false);
    setLabelsSaved(false);
    setRetryInfo(null);
    setCountdown(0);
  };

  const handleSearch = async () => {
    if (!awbNo) {
      showNotification("error", "Please enter AWB Number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `${server}/labels/couriersplease?action=search&awbNo=${awbNo.toUpperCase()}`
      );

      if (response.data.success) {
        const data = response.data.data;
        setShipmentData(data);

        // Check if label already saved
        if (data.cpConsignmentNumber || data.forwardingNo) {
          setLabelsSaved(true);
        }

        const formatDDMMYYYY = (d) => {
          const date = new Date(d);
          const dd = String(date.getDate()).padStart(2, "0");
          const mm = String(date.getMonth() + 1).padStart(2, "0");
          const yyyy = date.getFullYear();
          return `${dd}-${mm}-${yyyy}`;
        };

        setValue("date", data.date ? formatDDMMYYYY(data.date) : "");

        // Populate form
        setValue("sector", data.sector || "");
        // setValue(
        //   "date",
        //   data.date ? new Date(data.date).toISOString().split("T")[0] : ""
        // );
        setValue("origin", data.origin || "");
        setValue("accountCode", data.accountCode || "");
        setValue("customer", data.customer || "");
        setValue("consigor", data.shipperFullName || "");
        setValue("consignee", data.receiverFullName || "");
        setValue("addressLine1", data.receiverAddressLine1 || "");
        setValue("addressLine2", data.receiverAddressLine2 || "");
        setValue("zipcode", data.receiverPincode || "");
        setValue("city", data.receiverCity || "");
        setValue("state", data.receiverState || "");
        setValue("telephone", data.receiverPhoneNumber || "");
        setValue("billingService", "NPU - NO PICK UP SERVICE");
        setValue("pcs", data.pcs || 0);
        setValue("actualWt", data.totalActualWt || 0);
        setValue("value", data.totalInvoiceValue || 0);
        setValue("operationRemarks", data.operationRemark || "");
        setValue("holdReason", data.holdReason || "");
        setValue("content", data.content?.join(", ") || "");

        if (data.cpConsignmentNumber || data.forwardingNo) {
          setValue("dpdNo", data.cpConsignmentNumber || data.forwardingNo);
        }

        if (data.isHold) {
          showNotification(
            "error",
            `Shipment on hold: ${data.holdReason || "Not specified"}`
          );
        } else {
          showNotification("success", "Shipment loaded successfully");
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch shipment"
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
      showNotification("error", "Cannot create label - Shipment on hold");
      return;
    }

    setLoading(true);
    setRetryInfo(null);
    setCountdown(0);

    try {
      const response = await axios.post(`${server}/labels/couriersplease`, {
        awbNo: shipmentData.awbNo,
        action: "create",
      });

      if (response.data.success) {
        setLabelPreviews(response.data.labels);
        setLabelsCreated(true);
        setLabelsSaved(false);
        setCurrentLabelIndex(0);

        const dpdNumbers = response.data.labels
          .map((label) => label.dpdNumber)
          .filter(Boolean)
          .join(", ");

        setValue("dpdNo", dpdNumbers);
        showNotification(
          "success",
          `Labels created! (${response.data.labels.length}) - Click Save to store`
        );
      }
    } catch (error) {
      console.error("Create error:", error);

      if (error.response?.status === 429) {
        const errorData = error.response.data;
        const retryAfter = errorData.retryAfter || 60;

        setRetryInfo({
          consignmentNumber: errorData.consignmentNumber,
          status: 429,
          message: "Rate limit exceeded",
          suggestion: `Wait ${retryAfter} seconds before retry`,
          retryAfter: retryAfter,
        });

        setCountdown(retryAfter);

        if (errorData.consignmentNumber) {
          setValue("dpdNo", errorData.consignmentNumber);
        }

        showNotification(
          "warning",
          `⚠️ Rate limit. Shipment created but label unavailable. Wait ${retryAfter}s.`
        );
      } else if (error.response?.status === 404) {
        const errorData = error.response.data;

        setRetryInfo({
          consignmentNumber: errorData.consignmentNumber,
          status: 404,
          message: "Label not ready",
          suggestion: errorData.suggestion || "Wait 30-60 seconds",
          retryAfter: 30,
        });

        setCountdown(30);

        if (errorData.consignmentNumber) {
          setValue("dpdNo", errorData.consignmentNumber);
        }

        showNotification(
          "warning",
          "⚠️ Shipment created but label processing. Wait 30s."
        );
      } else {
        showNotification(
          "error",
          error.response?.data?.message || "Failed to create label"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryLabel = async () => {
    if (!retryInfo?.consignmentNumber) {
      showNotification("error", "No consignment number for retry");
      return;
    }

    if (countdown > 0) {
      showNotification("warning", `⏱️ Wait ${countdown} more seconds`);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(
        `${server}/labels/couriersplease?action=get-label&consignmentNumber=${retryInfo.consignmentNumber}`
      );

      if (response.data.success) {
        setLabelPreviews(response.data.labels);
        setLabelsCreated(true);
        setLabelsSaved(false);
        setRetryInfo(null);
        setCountdown(0);
        setCurrentLabelIndex(0);

        showNotification("success", "Label retrieved! Click Save to store.");
      }
    } catch (error) {
      console.error("Retry error:", error);

      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter || 60;
        setCountdown(retryAfter);
        showNotification(
          "warning",
          `⚠️ Still rate limited. Wait ${retryAfter}s.`
        );
        setRetryInfo((prev) => ({ ...prev, retryAfter: retryAfter }));
      } else if (error.response?.status === 404) {
        setCountdown(30);
        showNotification("warning", "⚠️ Label not ready. Wait 30s more.");
      } else {
        showNotification(
          "error",
          error.response?.data?.message || "Failed to retrieve label"
        );
      }
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
      const response = await axios.post(`${server}/labels/couriersplease`, {
        awbNo: shipmentData.awbNo,
        action: "save",
        labels: labelPreviews,
      });

      if (response.data.success) {
        setLabelsSaved(true);
        showNotification("success", "Consignment numbers saved!");
      }
    } catch (error) {
      console.error("Save error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to save"
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
          <head><title>Print Label ${index + 1}</title></head>
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
        title={`Couriers Please Label`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      {/* Retry Banner */}
      {retryInfo && (
        <div
          className={`mb-3 p-4 rounded-md border ${
            retryInfo.status === 429
              ? "bg-red-50 border-red-200"
              : "bg-yellow-50 border-yellow-200"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3
                className={`text-sm font-semibold mb-1 ${
                  retryInfo.status === 429 ? "text-red-800" : "text-yellow-800"
                }`}
              >
                {retryInfo.status === 429
                  ? "🚫 Rate Limit Exceeded"
                  : "⏳ Label Not Ready"}
              </h3>
              <p
                className={`text-sm mb-2 ${
                  retryInfo.status === 429 ? "text-red-700" : "text-yellow-700"
                }`}
              >
                {retryInfo.message}
              </p>
              <p
                className={`text-xs mb-2 ${
                  retryInfo.status === 429 ? "text-red-600" : "text-yellow-600"
                }`}
              >
                Consignment: <strong>{retryInfo.consignmentNumber}</strong>
              </p>
              <p
                className={`text-xs ${
                  retryInfo.status === 429 ? "text-red-600" : "text-yellow-600"
                }`}
              >
                💡 {retryInfo.suggestion}
              </p>
              {countdown > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 transition-all duration-1000 ${
                        retryInfo.status === 429
                          ? "bg-red-600"
                          : "bg-yellow-600"
                      }`}
                      style={{
                        width: `${
                          (countdown / (retryInfo.retryAfter || 60)) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-mono font-semibold min-w-[60px] text-right">
                    {countdown}s
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={handleRetryLabel}
              disabled={loading || countdown > 0}
              className={`ml-4 px-4 py-2 text-white text-sm font-medium rounded transition-colors ${
                loading || countdown > 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : retryInfo.status === 429
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              {loading
                ? "Retrying..."
                : countdown > 0
                ? `Wait ${countdown}s`
                : "Retry Now"}
            </button>
          </div>
        </div>
      )}

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
              <DummyInputBoxWithLabelDarkGray
                key={`sector-${formKey}`}
                resetFactor={resetFactor}
                register={register}
                setValue={setValue}
                placeholder={`Sector`}
                value={`sector`}
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

              <DummyInputBoxWithLabelDarkGray
                key={`origin-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Origin`}
                value={`origin`}
                resetFactor={resetFactor}
              />
            </div>

            <div className="flex gap-3">
              <DummyInputBoxWithLabelDarkGray
                key={`accountCode-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Code`}
                value={`accountCode`}
                resetFactor={resetFactor}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`customer-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Customer`}
                value={`customer`}
                resetFactor={resetFactor}
              />
            </div>

            <DummyInputBoxWithLabelDarkGray
              key={`consigor-${formKey}`}
              register={register}
              setValue={setValue}
              placeholder={`Consignor`}
              value={`consigor`}
              resetFactor={resetFactor}
            />

            <RedLabelHeading label={`Consignee Details`} />

            <div className="flex flex-col gap-3">
              <DummyInputBoxWithLabelDarkGray
                key={`consignee-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Consignee`}
                value={`consignee`}
                resetFactor={resetFactor}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`addressLine1-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Address Line 1`}
                value={`addressLine1`}
                resetFactor={resetFactor}
              />
              <DummyInputBoxWithLabelDarkGray
                key={`addressLine2-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Address Line 2`}
                value={`addressLine2`}
                resetFactor={resetFactor}
              />
              <div className="flex gap-3">
                <DummyInputBoxWithLabelDarkGray
                  key={`zipcode-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder={`Zipcode`}
                  value={`zipcode`}
                  resetFactor={resetFactor}
                />
                <DummyInputBoxWithLabelDarkGray
                  key={`city-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder={`City`}
                  value={`city`}
                  resetFactor={resetFactor}
                />
                <DummyInputBoxWithLabelDarkGray
                  key={`state-${formKey}`}
                  register={register}
                  setValue={setValue}
                  placeholder={`State`}
                  value={`state`}
                  resetFactor={resetFactor}
                />
              </div>
              <DummyInputBoxWithLabelDarkGray
                key={`telephone-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Telephone`}
                value={`telephone`}
                resetFactor={resetFactor}
              />
            </div>

            <RedLabelHeading label={`Service Details`} />

            <div className="flex flex-col gap-3">
              <LabeledDropdown
                key={`billingService-${formKey}`}
                register={register}
                setValue={setValue}
                title={`Billing Service`}
                value={`billingService`}
                options={["NPU - NO PICK UP SERVICE"]}
                resetFactor={resetFactor}
              />
              <div className="flex gap-3">
                <DummyInputBoxWithLabelDarkGray
                  key={`pcs-${formKey}`}
                  register={register}
                  setValue={setValue}
                  value={`pcs`}
                  placeholder={`Pcs`}
                  resetFactor={resetFactor}
                />
                <DummyInputBoxWithLabelDarkGray
                  key={`actualWt-${formKey}`}
                  register={register}
                  setValue={setValue}
                  value={`actualWt`}
                  resetFactor={resetFactor}
                  placeholder={`Actual Wt`}
                />
                <DummyInputBoxWithLabelDarkGray
                  key={`value-${formKey}`}
                  register={register}
                  setValue={setValue}
                  value={`value`}
                  placeholder={`Value`}
                  resetFactor={resetFactor}
                />
              </div>
              <DummyInputBoxWithLabelDarkGray
                key={`operationRemarks-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Ops Remark`}
                value={`operationRemarks`}
                resetFactor={resetFactor}
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
                  <DummyInputBoxWithLabelDarkGray
                    key={`holdReason-${formKey}`}
                    register={register}
                    setValue={setValue}
                    placeholder={`Hold Reason`}
                    value={`holdReason`}
                    resetFactor={resetFactor}
                  />
                </div>
              )}
              <DummyInputBoxWithLabelDarkGray
                key={`content-${formKey}`}
                register={register}
                setValue={setValue}
                placeholder={`Content`}
                value={`content`}
                resetFactor={resetFactor}
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
              {retryInfo && (
                <div className="w-[160px]">
                  <SimpleButton
                    name={
                      loading
                        ? "Retrying..."
                        : countdown > 0
                        ? `Wait ${countdown}s`
                        : "Retry"
                    }
                    onClick={handleRetryLabel}
                    disabled={loading || countdown > 0}
                  />
                </div>
              )}
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
                    labelsSaved ||
                    retryInfo
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
                  ? `DPD Label (${currentLabelIndex + 1}/${
                      labelPreviews.length
                    })`
                  : `DPD Label Preview`
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
          <div className="h-[750px] rounded-md border-[1px] mt-1 mb-3 shadow-sm overflow-auto bg-gray-50">
            {labelPreviews.length > 0 &&
            labelPreviews[currentLabelIndex]?.labelUrl ? (
              <embed
                src={labelPreviews[currentLabelIndex].labelUrl}
                type="application/pdf"
                width="100%"
                height="100%"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>No label preview</p>
                {retryInfo && (
                  <p className="text-xs mt-2 text-center px-4">
                    Shipment created. Click "Retry Now" above.
                  </p>
                )}
              </div>
            )}
          </div>
          <DummyInputBoxWithLabelDarkGray
            key={`dpdNo-${formKey}`}
            register={register}
            setValue={setValue}
            placeholder={`DPD Number`}
            value={`dpdNo`}
            resetFactor={resetFactor}
          />
        </div>

        {/* Right Column - Child Labels */}
        <div className="w-1/3 mt-2">
          <RedLabelHeading
            label={`Child Labels ${
              labelPreviews.length > 1 ? `(${labelPreviews.length - 1})` : ""
            }`}
          />
          <div className="h-[750px] rounded-md border-[1px] mb-3 shadow-sm overflow-auto bg-gray-50">
            {labelPreviews.length > 1 ? (
              <div className="p-2 space-y-2">
                {labelPreviews.slice(1).map((label, index) => (
                  <div key={index} className="border rounded p-2 bg-white">
                    <p className="text-sm font-semibold mb-1">
                      Child {index + 1}
                    </p>
                    <p className="text-xs text-gray-600 mb-1">
                      DPD: {label.dpdNumber || "N/A"}
                    </p>
                    <embed
                      src={label.labelUrl}
                      type="application/pdf"
                      width="100%"
                      height="300px"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                {labelPreviews.length === 1
                  ? "Single piece"
                  : "No child labels"}
              </div>
            )}
          </div>
          <DummyInputBoxWithLabelDarkGray
            key={`labelUrl-${formKey}`}
            register={register}
            setValue={setValue}
            placeholder={`Label Url`}
            value={`labelUrl`}
            resetFactor={resetFactor}
          />
        </div>
      </div>
    </div>
  );
};

export default AmsDpdPage;
