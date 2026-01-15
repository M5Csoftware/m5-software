"use client";
import { useState } from "react";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import { SearchableDropDrown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InvoiceMain from "./InvoiceMain";
import { useForm } from "react-hook-form";

const Invoice = () => {
  const { register, setValue, watch } = useForm();
  const [step, setStep] = useState(1);

  // generate FY list dynamically
  const getFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const start = currentYear - i;
      years.push(`${start}-${(start + 1).toString().slice(-2)}`);
    }
    return years;
  };

  const fYear = watch("fYear");

  return (
    <div className="flex flex-col gap-8">
      {step === 1 && (
        <div>
          <Heading title="Invoice" codeListBtn="hidden" bulkUploadBtn="hidden"  refreshBtn="hidden"/>

          <div className="flex gap-3 mt-6">
            <SearchableDropDrown
              options={getFinancialYears()}
              register={register}
              setValue={setValue}
              value="fYear"
              title="F Year"
            />
            <div>
              <OutlinedButtonRed
                label="Next"
                onClick={() => fYear && setStep(2)}
                disabled={!fYear}
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && <InvoiceMain fYear={fYear} />}
    </div>
  );
};

export default Invoice;
