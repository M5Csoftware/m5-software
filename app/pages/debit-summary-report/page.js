"use client"
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import DateRangeWise from "@/app/components/debit-summary-report/DateRangeWise";
import MultipleInvoiceWise from "@/app/components/debit-summary-report/MultipleInvoiceWise";

const DebitSummaryReport = () => {
  const { register, setValue, watch, reset } = useForm();
  const [selectedValue, setSelectedValue] = useState("dateRangeWise");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Force remount on refresh

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleRefresh = () => {
    // Reset all form values
    reset();
    
    // Reset to default tab
    setSelectedValue("dateRangeWise");
    
    // Force remount of child components to reset their local state
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="">
      <Heading
        title="Debit Summary Report"
        fullscreenBtn
        bulkUploadBtn="hidden"
        onClickFullscreenBtn={() => setIsFullscreen(true)}
        onRefresh={handleRefresh}
      />

      <div className="flex gap-4 mt-10">
        <RadioButtonLarge
          id="dateRangeWise"
          name="dateRangeWise"
          register={register}
          setValue={setValue}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
          label="Date Range Wise"
        />
        <RadioButtonLarge
          id="multipleInvoiceWise"
          name="multipleInvoiceWise"
          register={register}
          setValue={setValue}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
          label="Multiple Invoice Wise"
        />
      </div>

      {/* Use refreshKey to force remount child components */}
      {selectedValue === "dateRangeWise" ? (
        <DateRangeWise
          key={`dateRange-${refreshKey}`}
          register={register}
          setValue={setValue}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      ) : (
        <MultipleInvoiceWise
          key={`multipleInvoice-${refreshKey}`}
          register={register}
          setValue={setValue}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      )}
    </div>
  );
};

export default DebitSummaryReport;