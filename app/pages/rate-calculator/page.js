import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import React from "react";
import { useForm } from "react-hook-form";

const RateCalculator = () => {
  const { register, setValue } = useForm();
  return (
    <div>
      <Heading
        title={`Rate Calculator`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />

      <div className="py-3">
        <RedLabelHeading label="Shipment Details" />
        <div className="flex gap-3 mt-2">
          <div className="w-1/2 flex flex-col gap-3">
            <div className="flex gap-3">
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Customer Code`}
                value={`accountCode`}
              />{" "}
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Customer Name`}
                value={`accountCode`}
                disabled
              />
            </div>
            <LabeledDropdown
              register={register}
              setValue={setValue}
              placeholder={`Sector`}
              value={`sector`}
              options={[]}
            />
            <LabeledDropdown
              register={register}
              setValue={setValue}
              placeholder={`Service`}
              value={`service`}
              options={[]}
            />
            <LabeledDropdown
              register={register}
              setValue={setValue}
              placeholder={`Destination`}
              value={`destination`}
              options={[]}
            />
            <div className="flex gap-3 items-center text-sm">
              <div className="w-1/2 py-1.5 flex items-center justify-center bg-yellow-100 text-yellow-900 rounded-md">
                Volumetric Weight: <span>(Kg)</span>
              </div>
              <div className="w-1/2 flex py-1.5 items-center justify-center bg-green-100 text-green-900 rounded-md">
                Chargeable Weight: <span>(Kg)</span>
              </div>
            </div>
          </div>
          <div className="w-1/2 flex flex-col gap-3">
            <InputBox
              register={register}
              setValue={setValue}
              placeholder={`Zipcode`}
              value={`zipcode`}
            />
            <LabeledDropdown
              register={register}
              setValue={setValue}
              placeholder={`Shipment Purpose`}
              value={`shipmentPurpose`}
              options={[]}
            />
            <div className="flex gap-3">
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Weight`}
                value={`weight`}
              />{" "}
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Length`}
                value={`length`}
              />{" "}
              <InputBox
                register={register}
                setValue={setValue}
                placeholder={`Height`}
                value={`height`}
              />
            </div>
            <InputBox
              register={register}
              setValue={setValue}
              placeholder={`Actual Weight`}
              value={`actualWt`}
            />
            <div className="flex gap-3">
              <div className="w-1/2">
                <SimpleButton name="Calculate Rate" />
              </div>
              <div className="w-1/2">
                <OutlinedButtonRed label={`Reset`} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateCalculator;
