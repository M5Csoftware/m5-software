"use client"
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxLightGray,
  DummyInputBoxWithLabelLightGray,
} from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import Image from "next/image";
import React from "react";
import { useForm } from "react-hook-form";

const CounterPartInscan = () => {
  const { register, setValue } = useForm();
  return (
    <div className="flex flex-col gap-3">
      <Heading
        title={`Counter Part Inscan`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />

      <div className="flex">
        <div className="flex flex-col gap-2 mt-1">
          <RedLabelHeading label={`Run Received`} />
          <div className="w-[200px] border rounded-md h-[338px] mb-2"></div>
          <RedLabelHeading label={`Scanned`} />
          <div className="w-[200px] border rounded-md h-[338px]"></div>
        </div>

        <div className="mt-1 ml-6 w-full">
          <RedLabelHeading label={`Scan Airwaybill Number`} />
          <div className="flex flex-col gap-3">
            <div className="flex gap-3 mt-2">
              <div className="w-1/2">
                <DummyInputBoxWithLabelLightGray
                  setValue={setValue}
                  register={register}
                  value={`statusDate`}
                  label={`Status Date`}
                  inputValue={"--/--/--"}
                />
              </div>
              <div className="w-1/2">
                <DummyInputBoxWithLabelLightGray
                  setValue={setValue}
                  register={register}
                  value={`time`}
                  label={`Time`}
                  inputValue={"00:00"}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div>
                <InputBox
                  setValue={setValue}
                  register={register}
                  value={"location"}
                  placeholder="Location"
                />
              </div>
              <div className="w-full">
                <DummyInputBoxWithLabelLightGray
                  setValue={setValue}
                  register={register}
                  value={`time`}
                  placeholder={`Shipment arrived at Destination Country`}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <LabeledDropdown
                options={["1", "2"]}
                setValue={setValue}
                register={register}
                value={`dropdown`}
                title={`Run Number`}
              />
              <button type="button" className={``}>
                <Image src={`/refresh.svg`} alt="" width={24} height={24} />
              </button>
            </div>

            <div className="flex gap-3">
              <div className="w-full">
                <LabeledDropdown
                  options={["1", "2"]}
                  setValue={setValue}
                  register={register}
                  value={`awbNo`}
                  title={`AWB No.`}
                />
              </div>
              <div>
                <SimpleButton name={`Scan`} />
              </div>
            </div>
          </div>

          <div className="mt-4 w-full ">
            <RedLabelHeading label={`Shipment Origin/Destination`} />
            <div className="flex gap-3 mt-2">
              <div className="w-1/4">
                <DummyInputBoxWithLabelLightGray
                  setValue={setValue}
                  register={register}
                  value={`date`}
                  label={`Date`}
                  placeholder={`--/--/--`}
                />
              </div>
              <div className="w-1/4">
                <DummyInputBoxWithLabelLightGray
                  setValue={setValue}
                  register={register}
                  value={`origin`}
                  label={`Origin`}
                  placeholder={`Del`}
                />
              </div>{" "}
              <div className="w-1/4">
                <DummyInputBoxWithLabelLightGray
                  setValue={setValue}
                  register={register}
                  value={`sector`}
                  label={`Sector`}
                  placeholder={`Del`}
                />
              </div>{" "}
              <div className="w-1/4">
                <DummyInputBoxWithLabelLightGray
                  setValue={setValue}
                  register={register}
                  value={`destination`}
                  label={`Destination`}
                  placeholder={`Aus`}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 ">
            <RedLabelHeading label={`Customer Details`} />
            <div className="flex gap-3">
              <div>
                <InputBox
                  setValue={setValue}
                  register={register}
                  value={"network"}
                  placeholder="Network"
                />
              </div>
              <div className="w-full">
                <DummyInputBoxWithLabelLightGray
                  setValue={setValue}
                  register={register}
                  value={`del`}
                  placeholder={`Del`}
                />
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <div className="w-1/4">
                <LabeledDropdown
                  options={["1", "2"]}
                  setValue={setValue}
                  register={register}
                  value={`dropdown`}
                  title={`Run Number`}
                  disabled
                />
              </div>
              <div className="w-1/4">
                <InputBox
                  setValue={setValue}
                  register={register}
                  value={"pcs"}
                  placeholder="Pcs"
                />
              </div>
              <div className="w-1/4">
                <InputBox
                  setValue={setValue}
                  register={register}
                  value={"actualWt"}
                  placeholder={`Actual Weight`}
                />
              </div>
              <div className="w-1/4">
                <InputBox
                  setValue={setValue}
                  register={register}
                  value={"volumeWt"}
                  placeholder="Volume Weight"
                />
              </div>
            </div>
            <div>
              <LabeledDropdown
                options={["1", "2"]}
                setValue={setValue}
                register={register}
                value={`dropdown`}
                title={`Run Number`}
                disabled
              />
            </div>
          </div>

          <div className="flex gap-6 mt-3">
            <div className="w-1/2">
              <RedLabelHeading label={`Consignor Details`} />
              <div className="border h-[200px] rounded-md mt-1"></div>
            </div>
            <div className="w-1/2">
              <RedLabelHeading label={`Consignee Details`} />
              <div className="border h-[200px] rounded-md mt-1"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div>
          <OutlinedButtonRed label={"Close"} type="button" />
        </div>
        <div>
          <SimpleButton name={`Save`} />
        </div>
      </div>
    </div>
  );
};

export default CounterPartInscan;
