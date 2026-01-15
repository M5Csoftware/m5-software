"use client"
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import DateRangeWise from "@/app/components/discount-credit-ns/DateRangeWise";
import MultipleInvoiceWise from "@/app/components/discount-credit-ns/MultipleInvoiceWise";

const DiscountCreditNoteSummary = () => {
  const { register, setValue, watch } = useForm();
  const [selectedValue, setSelectedValue] = useState("dateRangeWise");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className="">
      <Heading
        title="Discount Credit Note Summary"
        fullscreenBtn
        bulkUploadBtn="hidden"
        onClickFullscreenBtn={() => setIsFullscreen(true)}
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

      {selectedValue === "dateRangeWise" ? (
        <DateRangeWise
          register={register}
          setValue={setValue}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      ) : (
        <MultipleInvoiceWise
          register={register}
          setValue={setValue}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      )}
    </div>
  );
};

export default DiscountCreditNoteSummary;
