"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { SearchInputBox } from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

const RateHike = () => {
  const { register, setValue } = useForm();
  const [demoRadio, setDemoRadio] = useState("percentageInput");

  return (
    <div className="flex flex-col gap-4">
      <Heading title={`Rate Hike`} bulkUploadBtn="hidden" />
      <div className="w-full flex gap-4">
        <div className="w-full flex flex-col gap-3">
          <div className="flex gap-4">
            <InputBox
              value={`customerName`}
              placeholder={`Customer`}
              setValue={setValue}
              register={register}
            />
            <InputBox
              value={`branch`}
              placeholder={`Branch`}
              setValue={setValue}
              register={register}
              disabled
            />
          </div>
          <div className="flex gap-4">
            <LabeledDropdown
              setValue={setValue}
              register={register}
              options={[]}
              value={`rateTariff`}
              title={`Rate Tariff`}
            />
            <InputBox
              value={`zoneTariff`}
              placeholder={`Zone Tariff`}
              setValue={setValue}
              register={register}
              disabled
            />
          </div>
          <div className="flex gap-4">
            <LabeledDropdown
              setValue={setValue}
              register={register}
              options={[]}
              value={`service`}
              title={`Service`}
            />
            <LabeledDropdown
              setValue={setValue}
              register={register}
              options={[]}
              value={`country`}
              title={`Country`}
            />
            <div>
              <OutlinedButtonRed label={`Show`} />
            </div>
          </div>
          <div className="bg-white border rounded h-[35vh]"></div>
          <div className="flex gap-4 items-center">
            <RadioButtonLarge
              id={"percentageInput"}
              label={`Rate Hike Percentage (%)`}
              name={`percentageInput`}
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={setDemoRadio}
            />
            <RadioButtonLarge
              id={`flatInput`}
              label={`Flat Hike`}
              name={`flatInput`}
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={setDemoRadio}
            />
          </div>
        </div>

        <div className="w-1/3 flex flex-col gap-3">
          <InputBox
            value={`searchZoneList`}
            placeholder={`Search Zone List`}
            setValue={setValue}
            register={register}
          />

          <div className="flex flex-col gap-3">
            {" "}
            <div className="bg-white border rounded h-[45.7vh]"></div>
            <div>
              {demoRadio === "percentageInput" ? (
                <InputBox
                  value={`percentageRateHike`}
                  placeholder={`Hike Rate%`}
                  setValue={setValue}
                  register={register}
                />
              ) : (
                <InputBox
                  value={`flatRateHike`}
                  placeholder={`Flat Hike`}
                  setValue={setValue}
                  register={register}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-end items-center">
          <div className="flex gap-4">
            <OutlinedButtonRed label={`Hike`} />
            <SimpleButton name={`Save Tariff`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateHike;
