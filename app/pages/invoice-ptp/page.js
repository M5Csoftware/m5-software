"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import { useForm } from "react-hook-form";
import React, { useState, useEffect } from "react";
import { LabeledDropdown } from "@/app/components/Dropdown";
import InvoicePTP from "@/app/components/invoice-ptp/InvoicePTP";
import NotificationFlag from "@/app/components/Notificationflag";

function InvoicePtp() {
  const { register, setValue, watch } = useForm();
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedFYear, setSelectedFYear] = useState("");
  const [fYearOptions, setFYearOptions] = useState([]);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Watch the fYear value
  const fYearValue = watch("fYear");

  // Generate F-Year options based on current year
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];

    // Generate options for current year and next few years
    for (let i = 0; i < 5; i++) {
      const year = currentYear + i;
      years.push(`${year}-${year + 1}`);
    }

    setFYearOptions(years);

    // Set default value to current financial year
    const defaultFYear = `${currentYear}-${currentYear + 1}`;
    setValue("fYear", defaultFYear);
  }, [setValue]);

  // Auto-update year when it changes
  useEffect(() => {
    const interval = setInterval(() => {
      const currentYear = new Date().getFullYear();
      const years = [];

      for (let i = 0; i < 5; i++) {
        const year = currentYear + i;
        years.push(`${year}-${year + 1}`);
      }

      setFYearOptions(years);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    // Only show invoice if a value is selected
    if (fYearValue) {
      setSelectedFYear(fYearValue);
      setShowInvoice(true);
    } else {
      showNotification("error", "Please select a Financial Year first");
    }
  };

  const handleClose = () => {
    setShowInvoice(false);
  };

  // If showInvoice is true, render only the InvoicePTP component
  if (showInvoice) {
    return <InvoicePTP fYear={selectedFYear} onClose={handleClose} />;
  }

  // Otherwise, show the form
  return (
    <>
      <form className="flex flex-col gap-9">
        <Heading
          title={`Invoice PTP`}
          bulkUploadBtn="hidden"
          codeListBtn={true}
          onRefresh={() => {
            console.log("Refresh clicked");
            // or any refresh logic
          }}
          fullscreenBtn={false}
        />

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <LabeledDropdown
                options={fYearOptions}
                value="fYear"
                title={`F Year`}
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

      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />
    </>
  );
}

export default InvoicePtp;
