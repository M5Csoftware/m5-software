"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const CpPage = () => {
  const { register, setValue, reset } = useForm();
  const [resetFactor, setResetFactor] = useState();

  const handleRefresh = () => {
    setResetFactor(!resetFactor);
  };
  return (
    <div>
      <Heading
        title={`CP Label`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />
      <div className="flex gap-3">
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
                <OutlinedButtonRed label={`Search`} />
              </div>
            </div>
            <div className="flex gap-3">
              <InputBox
                resetFactor={resetFactor}
                register={register}
                setValue={setValue}
                placeholder={`Sector`}
                value={`sector`}
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                placeholder="Date"
                value={`date`}
                resetFactor={resetFactor}
              />
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Origin`}
                value={`origin`}
                resetFactor={resetFactor}
              />
            </div>
            <div className="flex gap-3">
              <div>
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`Code`}
                  value={`accountCode`}
                  resetFactor={resetFactor}
                />
              </div>

              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Customer`}
                value={`customer`}
                resetFactor={resetFactor}
              />
            </div>
            <div className="">
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Consignor`}
                value={`consigor`}
                resetFactor={resetFactor}
              />
            </div>

            <RedLabelHeading label={`Consignee Details`} />
            <div className="flex flex-col gap-3">
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Consignee`}
                value={`consignee`}
                resetFactor={resetFactor}
              />
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Address Line 1`}
                value={`addressLine1`}
                resetFactor={resetFactor}
              />
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Address Line 2`}
                value={`addressLine2`}
                resetFactor={resetFactor}
              />
              <div className="flex gap-3">
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`Zipcode`}
                  value={`zipcode`}
                  resetFactor={resetFactor}
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`City`}
                  value={`city`}
                  resetFactor={resetFactor}
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`State`}
                  value={`state`}
                  resetFactor={resetFactor}
                />
              </div>
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Telephone`}
                value={`telephone`}
                resetFactor={resetFactor}
              />
              <LabeledDropdown
                register={register}
                setValue={setValue}
                title={`Billing Service`}
                value={`billingService`}
                options={[]}
                resetFactor={resetFactor}
              />
            </div>

            <RedLabelHeading label={`Service Details`} />
            <div className=" flex flex-col gap-3">
              <LabeledDropdown
                register={register}
                setValue={setValue}
                title={`Billing Service`}
                value={`billingService`}
                options={[]}
                resetFactor={resetFactor}
              />
              <div className="flex gap-3">
                <InputBox
                  register={register}
                  setValue={setValue}
                  value={`pcs`}
                  placeholder={`Pcs`}
                  disabled
                  resetFactor={resetFactor}
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  value={`actualWt`}
                  resetFactor={resetFactor}
                  placeholder={`Actual Wt`}
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  value={`value`}
                  placeholder={`Value`}
                  disabled
                  resetFactor={resetFactor}
                />
              </div>
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Ops Remark`}
                value={`operationRemarks`}
                resetFactor={resetFactor}
              />
              <div className="flex gap-3">
                <RedCheckbox
                  id={`hold`}
                  label={`Hold`}
                  register={register}
                  setValue={setValue}
                  setChecked={true}
                  isChecked={true}
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  placeholder={`Hold Reason`}
                  value={`holdReason`}
                  resetFactor={resetFactor}
                />
              </div>
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Content`}
                value={`content`}
                resetFactor={resetFactor}
              />
            </div>
            <div className="mt-3 flex gap-3 justify-start">
              <div className="w-[160px]">
                <OutlinedButtonRed label={`Remove`} />
              </div>
              <div className="w-[160px]">
                <OutlinedButtonRed label={`Print`} />
              </div>
              <div className="w-[160px]">
                <SimpleButton name={`Create`} />
              </div>
            </div>
          </div>
        </div>

        <div className="w-1/3 mt-2">
          <RedLabelHeading label={`DPD Label Preview`} />
          <div className="h-[726px] rounded-md border-[1px] mt-1 mb-3 shadow-sm"></div>
          <InputBox
            register={register}
            setValue={setValue}
            placeholder={`DPD Number`}
            value={`dpdNo`}
            resetFactor={resetFactor}
          />
        </div>

        <div className="w-1/3 mt-2">
          <RedLabelHeading label={`Dummy No.`} />
          <div className="h-[726px] rounded-md border-[1px] mt-1 mb-3 shadow-sm"></div>
          <InputBox
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

export default CpPage;
