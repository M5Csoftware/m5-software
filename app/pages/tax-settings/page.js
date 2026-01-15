"use client";
import { OutlinedButtonWithLeftImage } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import {
  DateInputBox,
  FractionNumberInputBox,
} from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import UploadModal from "@/app/components/UploadModal";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import React, { useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";

function TaxSettings() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const { server } = useContext(GlobalContext);
  const [awbreset, setAwbreset] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const taxValue = watch("tax");

  // Fetch existing tax setting when tax type is selected
  useEffect(() => {
    const fetchTaxSetting = async () => {
      if (!taxValue) return;

      try {
        const res = await axios.get(`${server}/tax-settings`);
        const taxSettings = res.data;

        // Find the selected tax type
        const existingSetting = taxSettings.find(
          (setting) => setting.tax === taxValue
        );

        if (existingSetting) {
          // Convert decimal back to percentage (0.18 → 18)
          setValue("taxAmount", (existingSetting.taxAmount * 100).toFixed(2));

          // Format date for input (YYYY-MM-DD)
          const date = new Date(existingSetting.effectiveDate);
          const formattedDate = date.toISOString().split("T")[0];
          setValue("effectiveDate", formattedDate);

          console.log("Loaded existing tax setting:", existingSetting);
        } else {
          // Clear fields if no existing setting found
          setValue("taxAmount", "");
          setValue("effectiveDate", "");
        }
      } catch (error) {
        console.error("Error fetching tax settings:", error);
        // Don't show error notification for 404 (no settings found yet)
        if (error.response?.status !== 404) {
          showNotification("error", "Failed to fetch tax settings!");
        }
      }
    };

    fetchTaxSetting();
  }, [taxValue, server, setValue]);

  const onSubmit = async (data) => {
    console.log("Form data before conversion:", data);

    // Convert taxAmount to decimal (e.g., 18 → 0.18)
    const formattedData = {
      ...data,
      taxAmount: parseFloat(data.taxAmount) / 100,
    };

    console.log("Form data after conversion:", formattedData);

    try {
      const res = await axios.post(`${server}/tax-settings`, formattedData);

      console.log("Tax settings saved:", res.data);
      showNotification("success", "Tax settings data saved successfully!");
    } catch (error) {
      console.error(
        "Error saving tax settings:",
        error.response?.data || error.message
      );
      showNotification("error", "Tax settings data save failed!");
    }
  };

  //handle refresh btn
  const handleRefresh = () => {
    setAwbreset(!awbreset);
    setValue("tax", "");
    setValue("taxAmount", "");
    setValue("effectiveDate", "");
  };

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Heading
          title={`Tax Settings`}
          onClickBulkUploadBtn={() => setShowUploadModal(true)}
          onRefresh={handleRefresh}
          codeListBtn="hidden"
        />

        {/* Name Dropdown */}
        <div>
          <LabeledDropdown
            options={["CGST", "SGST", "IGST"]}
            setValue={setValue}
            title={`Name`}
            register={register}
            value="tax"
            resetFactor={awbreset}
          />
        </div>

        {/* Tax Amount and Effective Date Inputs */}
        <div className="flex justify-between gap-3">
          <FractionNumberInputBox
            placeholder={`Tax Amount %`}
            value={`taxAmount`}
            register={register}
            setValue={setValue}
            resetFactor={awbreset}
            initialValue={watch("taxAmount")}
          />
          <input type="hidden" {...register("tax", { required: true })} />

          <DateInputBox
            placeholder={`Effective Date`}
            value={`effectiveDate`}
            register={register}
            setValue={setValue}
            resetFactor={awbreset}
            initialValue={watch("effectiveDate")}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <OutlinedButtonWithLeftImage
            label={`Update Tax Setting`}
            icon={`/update.svg`}
            type="submit"
          />
        </div>
      </form>

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </>
  );
}

export default TaxSettings;
