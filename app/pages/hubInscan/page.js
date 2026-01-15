"use client";
import React, { useState } from "react";
import Image from "next/image";
import InputBox, { InputBoxRed } from "@/app/components/InputBox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { RedLabelHeading } from "@/app/components/Heading";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import { RedCheckboxBase } from "@/app/components/RedCheckBox";

function HubInscan() {
  const { register, handleSubmit, setValue } = useForm();
  const [scanned, setScanned] = useState([]);
  const [isChecked, setChecked] = useState(false);

  const onScan = (data) => {
    console.log("Scanning data:", data);
    setScanned([...scanned, data]);
  };

  return (
    <div className="flex flex-row justify-between gap-12">
      <form onSubmit={handleSubmit(onScan)} className="flex flex-col gap-4">
        <Heading
          title={`Hub Inscan`}
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
        />
        <div className="flex flex-col gap-4">
          <div className="flex gap-6">
            <div className="flex-1">
              <h2 className="font-bold text-sm pb-2">Consignor Details</h2>
              <div className="bg-white w-full h-36 border rounded-md"></div>
            </div>

            <div className="flex-1">
              <h2 className="font-bold text-sm pb-2">Consignee Details</h2>
              <div className="bg-white w-full h-36 border rounded-md"></div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-sm font-semibold">
              Shipment Origin / Destination
            </div>
            <div className="flex flex-row gap-4">
              <InputBox
                placeholder="Date"
                register={register}
                setValue={setValue}
                value={"date"}
              />

              <InputBox
                placeholder="Origin"
                register={register}
                setValue={setValue}
                value={"origin"}
              />

              <InputBox
                placeholder="Sector"
                register={register}
                setValue={setValue}
                value={"sector"}
              />
              <InputBox
                placeholder="Destination"
                register={register}
                setValue={setValue}
                value={"destination"}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-sm font-semibold">Customer Details</div>
            <div className="flex flex-row gap-4">
              <InputBox
                placeholder="Customer"
                register={register}
                setValue={setValue}
                value="customer"
              />

              <InputBox
                register={register}
                setValue={setValue}
                value="customer"
              ></InputBox>
            </div>
            <div className="flex flex-row gap-4">
              <InputBox
                placeholder="Network"
                register={register}
                setValue={setValue}
                value="network"
              />

              <InputBox
                register={register}
                setValue={setValue}
                value="network"
              ></InputBox>
              <InputBox
                register={register}
                setValue={setValue}
                value="network"
              ></InputBox>
            </div>
            <div className="flex flex-row gap-4">
              <LabeledDropdown
                options={["NDox", "NDox", "NDox"]}
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
                placeholder="Volume"
                register={register}
                setValue={setValue}
                value="volume"
              />
              <InputBox
                placeholder="Chargable Wt."
                register={register}
                setValue={setValue}
                value="chargableWt"
              />
              <InputBox
                placeholder="Volume Discount"
                register={register}
                setValue={setValue}
                value="volumeDiscount"
              />
              <LabeledDropdown
                options={["Cash", "Cheque", "DD", "RTGS", "NEFT", "IMPS"]}
                register={register}
                setValue={setValue}
                title={`Payment`}
                value={`payment`}
              />
            </div>
            <div>
              <InputBox
                placeholder="Service"
                register={register}
                setValue={setValue}
                value="service"
              />
            </div>
            <div className="flex flex-col gap-4">
              <RedLabelHeading label={"Scan Airwaybill No."} />
              <div className="flex flex-row gap-4">
                <DummyInputBoxWithLabelDarkGray
                  label={"Status Date"}
                  register={register}
                  setValue={setValue}
                  value={"statusdate"}
                />
                <DummyInputBoxWithLabelDarkGray
                  label={"Time"}
                  register={register}
                  setValue={setValue}
                  value={"time"}
                />
              </div>
              <div className="flex flex-row gap-4">
                <InputBox
                  placeholder="Location"
                  register={register}
                  setValue={setValue}
                  value="location"
                />
                <InputBox
                  register={register}
                  setValue={setValue}
                  value="location"
                />
              </div>
              <div className="flex flex-row gap-4">
                <LabeledDropdown
                  options={["PB105-02", "PB105-02", "PB105-02"]}
                  register={register}
                  setValue={setValue}
                  title={`ManifestNo`}
                  value={`manifestNo`}
                />
                <button type="button">
                  <Image src={`/refresh.svg`} alt="refresh" width={24} height={24} />
                </button>
              </div>
              <div className="flex flex-row gap-4">
                <InputBoxRed
                  placeholder="Awb No."
                  register={register}
                  setValue={setValue}
                  value="awbNo"
                />
                <InputBoxRed
                  placeholder="Actual Wt."
                  register={register}
                  setValue={setValue}
                  value="actualWt"
                />
              </div>

              <div className="flex flex-row gap-4">
                <RedCheckboxBase
                  label={"Hold"}
                  isChecked={isChecked}
                  setChecked={setChecked}
                  id={"hold"}
                  register={register}
                  setValue={setValue}
                  flip={true}
                />
                <LabeledDropdown
                  options={["PB105-02", "PB105-02", "PB105-02"]}
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
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setScanned([])}
              className="p-2 bg-red text-white rounded-md w-36 h-10 text-sm font-semibold"
            >
              Scans
            </button>
            <button
              type="button"
              onClick={() => setScanned([])}
              className="p-2 border border-red text-red rounded-md w-36 h-10 text-sm font-semibold"
            >
              Send Email
            </button>
            <button
              type="button"
              onClick={() => setScanned([])}
              className="p-2 border border-red text-red rounded-md w-36 h-10 text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </form>

      {/* Manifested and Scanned */}
      <div className="flex flex-col gap-12 mt-4">
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold">Manifested</h2>
          <div className="bg-white min-w-56 h-[304px] border rounded-md"></div>
        </div>
        <div className="flex flex-col gap-4">
          <RedLabelHeading label={"Scanned"} />
          <div className="bg-white min-w-56 h-[304px] border rounded-md"></div>
        </div>
      </div>
    </div>
  );
}

export default HubInscan;
