"use client";
import React, { useState } from "react";
import InputBox from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import RedCheckbox from "../RedCheckBox";

const PortalSetting = ({ register, setValue, setStep, customerData }) => {
  const [enablePortalPassword, setEnablePortalPassword] = useState(false);
  const [upsLabel, setUpsLabel] = useState(false);
  const [upsStandardLabel, setUpsStandardLabel] = useState(false);
  const [yadelLabel, setYadelLabel] = useState(false);
  const [post11Label, setPost11Label] = useState(false);
  const [dhlLabel, setDhlLabel] = useState(false);
  const [enableLabelSetting, setEnableLabelSetting] = useState(false);

  return (
    <div>
      <h1 className="text-red font-semibold text-base ">Portal Password</h1>
      <div className="flex flex-col gap-4 h-[55vh]">
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3 ">
            <RedCheckbox
              isChecked={
                customerData?.enablePortalPassword || enablePortalPassword
              }
              setChecked={setEnablePortalPassword}
              id="enablePortalPassword"
              register={register}
              setValue={setValue}
              label={"Enable"}
            />
            <div className="w-full">
              <InputBox
                placeholder="Password"
                register={register}
                setValue={setValue}
                value="portalPasswordSector"
                initialValue={customerData?.portalPasswordSector || ""}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <RedCheckbox
              isChecked={customerData?.upsLabel || upsLabel}
              setChecked={setUpsLabel}
              id="upsLabel"
              register={register}
              setValue={setValue}
              label={"UPS Label"}
            />
            <RedCheckbox
              isChecked={customerData?.yadelLabel || yadelLabel}
              setChecked={setYadelLabel}
              id="yadelLabel"
              register={register}
              setValue={setValue}
              label={"Yodel Label"}
            />
            <RedCheckbox
              isChecked={customerData?.post11Label || post11Label}
              setChecked={setPost11Label}
              id="post11Label"
              register={register}
              setValue={setValue}
              label={"Post 11 Label"}
            />
            <RedCheckbox
              isChecked={customerData?.dhlLabel || dhlLabel}
              setChecked={setDhlLabel}
              id="dhlLabel"
              register={register}
              setValue={setValue}
              label={"DHL Label"}
            />
            <RedCheckbox
              isChecked={customerData?.upsStandardLabel || upsStandardLabel}
              setChecked={setUpsStandardLabel}
              id="upsStandardLabel"
              register={register}
              setValue={setValue}
              label={"UPS Standard Label"}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-red font-semibold text-base ">
              Label Settings
            </h1>
          </div>
          <RedCheckbox
            isChecked={customerData?.enableLabelSetting || enableLabelSetting}
            setChecked={setEnableLabelSetting}
            id="enableLabelSetting"
            register={register}
            setValue={setValue}
            label={"Enable"}
          />
        </div>
      </div>
      <div className="flex justify-between mt-2">
        <div>
          <OutlinedButtonRed
            label={"Back"}
            onClick={() => setStep((prevStep) => prevStep - 1)}
          />
        </div>

        <div>
          <SimpleButton
            onClick={() => setStep((prevStep) => prevStep + 1)}
            name={"Next"}
          />
        </div>
      </div>
    </div>
  );
};

export default PortalSetting;
