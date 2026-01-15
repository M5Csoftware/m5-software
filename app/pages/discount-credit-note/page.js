"use client"
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const DiscountCreditNote = () => {
  const { register, setValue } = useForm();
  const [checked, setChecked] = useState(false);

  return (
    <div className="">
      <div className="space-y-4">
        <Heading
          title={`Discount Credit Note`}
          fullscreenBtn
          bulkUploadBtn="hidden"
        />

        <LabeledDropdown
          options={["1", "2", "3"]}
          value="monthFile"
          title={`Month File`}
          register={register}
          setValue={setValue}
        />

        <div className="flex gap-2">
          <LabeledDropdown
            options={["1", "2", "3"]}
            value="branch"
            title={`Branch`}
            register={register}
            setValue={setValue}
          />

          <DateInputBox
            placeholder="Invoice Date"
            value="invoiceDate"
            register={register}
            setValue={setValue}
          />

          <InputBox
            placeholder="Invoice Sr.No"
            value="invoiceSrNo"
            register={register}
            setValue={setValue}
          />

          <InputBox
            placeholder="Invoice No"
            value="invoiceNo"
            register={register}
            setValue={setValue}
          />
        </div>

        <div className="flex gap-2">
          <InputBox
            placeholder="Customer"
            value="customer"
            register={register}
            setValue={setValue}
          />

          <InputBox
            placeholder=""
            value="branch"
            register={register}
            setValue={setValue}
            disabled
          />

          <InputBox
            placeholder="GST"
            value="gst"
            register={register}
            setValue={setValue}
            disabled
          />

          <InputBox
            placeholder="Fwd"
            value="fwd"
            register={register}
            setValue={setValue}
            disabled
          />

          <InputBox
            placeholder="GST No"
            value="gstNo"
            register={register}
            setValue={setValue}
            disabled
          />
        </div>

        <div className="flex gap-2">
          <div className="w-[375px]">
            <InputBox
              placeholder="AWB No"
              value="awbNo"
              register={register}
              setValue={setValue}
            />
          </div>{" "}
          <div className="w-[375px]">
            <InputBox
              placeholder="State"
              value="state"
              register={register}
              setValue={setValue}
            />
          </div>{" "}
          <div className="w-[375px]">
            <InputBox
              placeholder="Credit Amount"
              value="creditAmount"
              register={register}
              setValue={setValue}
            />
          </div>
          <div className="flex justify-center items-center w-[100px]">
            <RedCheckbox
              label={`Ex-T`}
              isChecked={checked}
              setChecked={setChecked}
            />
          </div>
          <div className="w-[200px]">
            <OutlinedButtonRed label={`Add`} />
          </div>
        </div>
      </div>

      <div className="flex gap-10 mt-4">
        {/* Left side */}
        <div className="w-1/2 space-y-2 ">
          <RedLabelHeading label={`Amount Details`} />
          <div className="flex gap-2">
            <InputBox
              placeholder={`Excel Path`}
              value="excelPath"
              register={register}
              setValue={setValue}
            />
            <div>
              <OutlinedButtonRed label={`Browse`} />
            </div>
            <div>
              <SimpleButton name={`Add`} />
            </div>
          </div>

          <div className="h-[275px] rounded-lg border-battleship-gray border-[2px] border-opacity-50"></div>
        </div>

        {/* Right Side */}
        <div className="w-1/2">
          <RedLabelHeading label={`Amount Details`} />

          <div className="space-y-4 mt-2">
            <InputBox
              placeholder="Claim Amount"
              value="claimAmount"
              register={register}
              setValue={setValue}
            />
            <InputBox
              placeholder="Amount"
              value="amount"
              register={register}
              setValue={setValue}
              disabled
            />
            <InputBox
              placeholder="SGST"
              value="sgst"
              register={register}
              setValue={setValue}
              disabled
            />
            <InputBox
              placeholder="CGST"
              value="cgst"
              register={register}
              setValue={setValue}
              disabled
            />
            <InputBox
              placeholder="IGST"
              value="igst"
              register={register}
              setValue={setValue}
              disabled
            />
            <InputBox
              placeholder="Grand Total"
              value="grandTotal"
              register={register}
              setValue={setValue}
              inputClassname="bg-[#FFFF80]"
              disabled
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <div className="w-1/2">
          <LabeledDropdown
            options={["1", "2", "3"]}
            value="branch"
            title={`Branch`}
            register={register}
            setValue={setValue}
          />
        </div>{" "}
        <div className="w-1/2">
          <LabeledDropdown
            options={["1", "2", "3"]}
            value="searchInvoiceNo"
            title={`Search Invoice No`}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className="w-[190px]">
          <OutlinedButtonRed label={`Search`} />
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <div>
          <OutlinedButtonRed label={`Close`} />
        </div>

        <div className="flex gap-2">
          <div>
            <OutlinedButtonRed label={`New`} />
          </div>
          <div>
            <OutlinedButtonRed label={`Remove Bill`} />
          </div>
          <div>
            <SimpleButton name={`Create Bill`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountCreditNote;
