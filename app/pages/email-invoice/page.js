"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import Normal from "@/app/components/email-invoice/Normal";
import CreditNote from "@/app/components/email-invoice/CreditNote";
import DebitNote from "@/app/components/email-invoice/DebitNote";


function EmailInvoice() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("Normal");
  const [refreshKey, setRefreshKey] = useState(0);


  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-3">
      <Heading
        title="Email Invoice"
        bulkUploadBtn="hidden"
        downloadBtn= {false}
        codeListBtn={true}
        fullscreenBtn={false}
        onRefresh={handleRefresh}
      />

      <div className="flex w-full gap-3 mt-6">
        <RadioButtonLarge
          id="Normal"
          label="Normal"
          name="email-invoice"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Credit Note"
          label="Credit Note"
          name="email-invoice"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Debit Note"
          label="Debit Note"
          name="email-invoice"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      {demoRadio === "Normal" && <Normal key={`details-${refreshKey}`} />}
      {demoRadio === "Credit Note" && <CreditNote key={`summary-${refreshKey}`} />}
      {demoRadio === "Debit Note" && <DebitNote key={`summary-${refreshKey}`} />}
    </div>
  );
}

export default EmailInvoice;
