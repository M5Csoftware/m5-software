"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import { useForm } from "react-hook-form";
import React, { useState } from "react";
import { LabeledDropdown } from "@/app/components/Dropdown";
import ApplyExtraCharges from "@/app/components/extra-charges/ApplyExtraCharges";
import NotificationFlag from "@/app/components/Notificationflag";

function ExtraCharges() {
  const { register, setValue, watch } = useForm();
  const [showCharges, setShowCharges] = useState(false);
  const [selectedCharges, setSelectedCharges] = useState("");
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const extraChargesValue = watch("extraCharges");

  const handleNext = () => {
    // Only show invoice if a value is selected
    if (extraChargesValue) {
      setSelectedCharges(extraChargesValue);
      setShowCharges(true);
    } else {
      showNotification("error", "Please select an Extra Charges");
    }
  };

  const handleClose = () => {
    setShowCharges(false);
  };

  if (showCharges) {
    return (
      <ApplyExtraCharges extraCharges={selectedCharges} onClose={handleClose} />
    );
  }

  // Otherwise, show the form
  return (
    <form className="flex flex-col gap-9">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`Apply Extra Charges`}
        bulkUploadBtn="hidden"
        codeListBtn={true}
        onRefresh={() => console.log("Refresh clicked")}
        fullscreenBtn={false}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <LabeledDropdown
              options={[
                "EX- Extra Charges",
                "RF- Reforwarding Charges",
                "RT- Return Charges for RTO",
                "AD- Address Collection",
                "RB- Rest Billing",
                "WD- Weight Difference",
              ]}
              value="extraCharges"
              title={`Extra Charges`}
              register={register}
              setValue={setValue}
            />
            <div className="min-w-[120px]">
              <OutlinedButtonRed
                type="button"
                label="Next"
                onClick={handleNext}
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default ExtraCharges;
