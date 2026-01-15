"use client";
import React, { useState } from "react";
import Image from "next/image";
import InputBox, { InputBoxRed } from "@/app/components/InputBox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { useForm } from "react-hook-form";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import { RedCheckboxBase } from "@/app/components/RedCheckBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";

function HubInscanClient() {
  const { register, handleSubmit, setValue, reset } = useForm();
  const [scanned, setScanned] = useState([]);
  const [isChecked, setChecked] = useState(false);
  const [isMailChecked, setMailChecked] = useState(false);
  const [isPortalChecked, setPortalChecked] = useState(false);

  const onScan = (data) => {
    console.log("Scanning data:", data);
    setScanned([...scanned, data]);
  };
  const handleRefresh = () => {
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onScan)} className="flex flex-col gap-6">
      <div className="">
        <Heading
          title={`Hub Inscan (Client)`}
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          onRefresh={handleRefresh}
        />
      </div>

      {/* Top Right Checkboxes */}
      <div className="flex gap-4 justify-end">
        <RedCheckboxBase
          label="Mail"
          isChecked={isMailChecked}
          setChecked={setMailChecked}
          id="mail"
          register={register}
          setValue={setValue}
        />
        <RedCheckboxBase
          label="Portal"
          isChecked={isPortalChecked}
          setChecked={setPortalChecked}
          id="portal"
          register={register}
          setValue={setValue}
        />
      </div>

      <div className="flex flex-row gap-8">
        {/* Left Sidebar (Manifested & Scanned) */}
        <div className="flex flex-col gap-8 min-w-64">
          <div>
            <RedLabelHeading label={"Manifested"} />
            <div className="bg-white w-full h-[26rem] border rounded-md"></div>
          </div>
          <div>
            <RedLabelHeading label={"Scanned"} />
            <div className="bg-white w-full h-[26rem] border rounded-md"></div>
          </div>
        </div>

        {/* Right Section (Form Fields) */}
        <div className="flex flex-col gap-6 flex-1">
          {/* Scan Airwaybill Number */}
          <RedLabelHeading label={"Scan Airwaybill Number"} />
          <div className="grid grid-cols-2 gap-4">
            <DummyInputBoxWithLabelDarkGray
              label={"Status Date"}
              register={register}
              setValue={setValue}
              value={"statusDate"}
            />
            <DummyInputBoxWithLabelDarkGray
              label={"Time"}
              register={register}
              setValue={setValue}
              value={"time"}
            />
          </div>

          <div className="flex flex-row gap-3">
            <div className="max-w-[150px]">
              <InputBox
                placeholder="Location"
                register={register}
                setValue={setValue}
                value="location"
              />
            </div>
            <DummyInputBoxWithLabelDarkGray
              register={register}
              setValue={setValue}
              value="loaction"
              label={`Location Name`}
            />
          </div>

          <div className="flex flex-row items-center gap-4">
            <LabeledDropdown
              options={["1", "2", "3"]}
              register={register}
              setValue={setValue}
              title={`Manifest`}
              value={`manifest`}
            />
            <button type="button">
              <Image
                src={`/refresh.svg`}
                alt="refresh"
                width={24}
                height={24}
              />
            </button>
          </div>

          <div className="flex gap-3">
            <div className="w-full">
              <InputBox
                placeholder={`AWB No.`}
                register={register}
                setValue={setValue}
                value={`awbNo`}
              />
            </div>
            <div className="w-full">
              <InputBox
                placeholder={`Rcv Wt.`}
                register={register}
                setValue={setValue}
                value={`rcvWt`}
              />
            </div>

            <div>
              <SimpleButton type="button" name={`Scan`} />
            </div>
          </div>

          <div className="flex flex-row gap-4 items-center">
            <RedCheckboxBase
              label={"Hold"}
              isChecked={isChecked}
              setChecked={setChecked}
              id={"hold"}
              register={register}
              setValue={setValue}
            />
            <LabeledDropdown
              options={["Reason1", "Reason2"]}
              register={register}
              setValue={setValue}
              title={`Hold Reason`}
              value={`holdReason`}
            />
            <InputBox
              placeholder="Other Reason"
              register={register}
              setValue={setValue}
              value="otherReason"
            />
          </div>

          {/* Shipment Origin/Destination */}
          <RedLabelHeading label={"Shipment Origin/Destination"} />
          <div className="grid grid-cols-4 gap-4">
            <InputBox
              placeholder="Date"
              register={register}
              setValue={setValue}
              value="date"
            />
            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              value="origin"
            />
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              value="sector"
            />
            <InputBox
              placeholder="Destination"
              register={register}
              setValue={setValue}
              value="destination"
            />
          </div>

          {/* Customer Details */}
          <RedLabelHeading label={"Customer Details"} />
          <div className="flex flex-row gap-3">
            <div className="max-w-[150px]">
              <InputBox
                placeholder="Customer Code"
                register={register}
                setValue={setValue}
                value="customerCode"
              />
            </div>
            <DummyInputBoxWithLabelDarkGray
              register={register}
              setValue={setValue}
              value="customer"
              label={`Customer Name`}
            />
          </div>
          <div className="flex flex-row gap-3">
            <div className="max-w-[150px]">
              <InputBox
                placeholder="Network"
                register={register}
                setValue={setValue}
                value="network"
              />
            </div>
            <DummyInputBoxWithLabelDarkGray
              register={register}
              setValue={setValue}
              value="network"
              label={`Network Type`}
            />
          </div>
          <div className="grid grid-cols-6 gap-4">
            <LabeledDropdown
              options={["NDox", "Docs"]}
              register={register}
              setValue={setValue}
              title={`Goods Type`}
              value={`goodsType`}
            />
            <InputBox
              placeholder="Pcs"
              register={register}
              setValue={setValue}
              value="pcs"
            />
            <InputBox
              placeholder="Vol. Wt"
              register={register}
              setValue={setValue}
              value="volWt"
            />
            <InputBox
              placeholder="Chrg Wt"
              register={register}
              setValue={setValue}
              value="chrgWt"
            />
            <InputBox
              placeholder="Vol. Disc."
              register={register}
              setValue={setValue}
              value="volDisc"
            />
            <LabeledDropdown
              options={["Cash", "Credit"]}
              register={register}
              setValue={setValue}
              title={`Payment`}
              value={`payment`}
            />
          </div>
          <InputBox
            placeholder="Service"
            register={register}
            setValue={setValue}
            value="service"
          />

          {/* Consignor & Consignee */}
          <div className="grid grid-cols-2 gap-6 mt-4">
            <div>
              <RedLabelHeading label={"Consignor Details"} />
              <div className="bg-white w-full h-24 border rounded-md"></div>
            </div>
            <div>
              <RedLabelHeading label={"Consignee Details"} />
              <div className="bg-white w-full h-24 border rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex justify-between">
        <div>
          <OutlinedButtonRed
            type="button"
            label={"Close"}
            onClick={handleRefresh}
          />
        </div>

        <div>
          <SimpleButton type="button" name={"Save"} onClick={handleRefresh} />
        </div>
      </div>
    </form>
  );
}

export default HubInscanClient;
