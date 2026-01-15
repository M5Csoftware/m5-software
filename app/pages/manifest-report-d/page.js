"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxWithLabelDarkGray,
} from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import RedCheckbox from "@/app/components/RedCheckBox";
import Table from "@/app/components/Table";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

export default function ManifestReportD() {
  const [demoRadio, setDemoRadio] = useState("Manifest (O)");
  const { register, setValue } = useForm();
  const [rowData, setrowData] = useState([]);
  const [enableCanada, setEnableCanada] = useState(false);
  const [singleAddress, setSingleAddress] = useState(false);
  const [enableBagNumber, setEnableBagNumber] = useState(false);

  const columns = useMemo(
    () => [
      { key: "serviceName", label: "Service Name" },
      { key: "chgWeight", label: "Chg. Weight" },
      { key: "volWeight", label: "Vol. Weight" },
      { key: "estRate", label: "Est. Rate" },
    ],
    []
  );

  const handleRadioChange = (value) => {
    setDemoRadio(value);
    let converted = "";
    if (value === "Manifest (O)") converted = "Manifest (O)";
    else if (value === "Manifest (O) with Currency")
      converted = "Manifest (O) with Currency";
    else if (value === "Manifest (R)") converted = "Manifest (R)";
    else if (value === "Manifest (R) with Currency")
      converted = "Manifest (R) with Currency";
  };

  return (
    <div className="flex flex-col gap-3">
      <Heading
        title="Manifest Report D"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />

      <div className="flex flex-row gap-3">
        {[
          "Manifest (O)",
          "Manifest (O) with Currency",
          "Manifest (R)",
          "Manifest (R) with Currency",
        ].map((type) => (
          <RadioButtonLarge
            key={type}
            id={type}
            label={type}
            name="accountType"
            register={register}
            setValue={setValue}
            selectedValue={demoRadio}
            setSelectedValue={handleRadioChange}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="flex gap-3">
            <RedCheckbox
              id="enableCanada"
              label="Canada M/f"
              isChecked={enableCanada}
              setChecked={setEnableCanada}
              register={register}
              setValue={setValue}
            />

            <RedCheckbox
              id="singleAddress"
              label="Single Address"
              isChecked={singleAddress}
              setChecked={setSingleAddress}
              register={register}
              setValue={setValue}
            />
          </div>

          <div className="flex gap-2 items-center">
            <div className="w-full">
              <RedCheckbox
                id="enableBagNumber"
                label="Bag Number"
                isChecked={enableBagNumber}
                setChecked={setEnableBagNumber}
                register={register}
                setValue={setValue}
              />
            </div>
            <InputBox
              value="from"
              placeholder="From"
              register={register}
              setValue={setValue}
              disabled={!enableBagNumber}
            />
            <InputBox
              value="to"
              placeholder="To"
              register={register}
              setValue={setValue}
              disabled={!enableBagNumber}
            />
          </div>
        </div>

        <RedLabelHeading label="Run Details" />
        
        <div className="flex flex-col gap-3">
          {/* First Row */}
          <div className="flex gap-3 w-full">
            <InputBox
              value="runNumber"
              placeholder="Run Number"
              register={register}
              setValue={setValue}
            />
            <DummyInputBoxWithLabelDarkGray
              label="Sector"
              value="sector"
              register={register}
              setValue={setValue}
            />
            <DummyInputBoxWithLabelDarkGray
              label="A/L MAWB"
              value="a/lMawb"
              register={register}
              setValue={setValue}
            />
            <DummyInputBoxWithLabelDarkGray
              label="OBC"
              value="obc"
              register={register}
              setValue={setValue}
            />
          </div>

          {/* Second Row - Fixed with equal spacing and proper alignment */}
          <div className="flex gap-3 w-full justify-between items-center">
            <div className="flex gap-3 flex-1">
              <DummyInputBoxWithLabelDarkGray
                label="Date"
                value="date"
                register={register}
                setValue={setValue}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Counter Part"
                value="counterPart"
                register={register}
                setValue={setValue}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Flight"
                value="flight"
                register={register}
                setValue={setValue}
              />
            </div>
            
            <div className="flex gap-3 w-[24%]">
              <OutlinedButtonRed label="View" />
              <SimpleButton name="Download" />
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          rowData={rowData}
          register={register}
          setValue={setValue}
          name="manifestreportd"
        />
      </div>
    </div>
  );
}