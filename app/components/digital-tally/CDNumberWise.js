import React, { useEffect, useState } from "react";
import { RedLabelHeading } from "../Heading";
import InputBox from "../InputBox";
import { useForm } from "react-hook-form";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxWithLabelDarkGray,
} from "../DummyInputBox";
import RedCheckbox from "../RedCheckBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { TableWithSorting } from "../Table";
import { LabeledDropdown } from "../Dropdown";

const CDNumberWise = ({ register, setValue, errors, trigger }) => {
  const { watch } = useForm();
  const [hold, setHold] = useState("");
  const [Portal, setPortal] = useState("");
  const [WhatsApp, setWhatsApp] = useState("");
  const [EMail, setEMail] = useState("");

  const [rowData, setRowData] = useState([]);
  const columns = [
    { key: "aebNo.", label: "AWB No." },
    { key: "rcvDate ", label: "Rcv Date " },
    { key: "actWgt ", label: "Act Wgt " },
    { key: "volWgt", label: "Vol. Wgt" },
    { key: "service", label: "Service" },
    { key: "status", label: "Status" },
    { key: "holdReason", label: "Hold Reason" },
  ];

  // ✅ Watch the selected dropdown value
  const selectedHoldReason = watch("holdReason");

  // ✅ Update the input value when dropdown changes
  useEffect(() => {
    setValue("holdReasonInput", selectedHoldReason);
  }, [selectedHoldReason, setValue]);

  const holdReasons = [
    "Damaged Packaging - DPKG",
    "Leaking Content - LEAK",
    "Prohibited Item - PROH",
    "Broken Content - BROK",
    "Packaging Not Secure - PNS",
    "Item Missing - MISI",
    "Tampered Shipment - TAMP",
    "Incomplete Address - INA",
    "Incorrect Address - ICA",
    "Address Change Requested - ADD",
    "Address Not Found - ANF",
    "Wrong Pincode - WPIN",
    "Awaiting Flight - AFD",
    "Hub Delay - HUBD",
    "KYC Not Verified - KYC",
    "Invoice Missing - INV",
    "Content Declaration Needed - CDN",
    "Customs Docs Missing - CDM",
    "Prohibited Country - PRCN",
    "Routing Error - RERR",
    "Lithium Battery Hold - LITH",
    "Liquids Not Allowed - LIQ",
    "Jewellery Not Allowed - JEWL",
    "Perishables Not Allowed - PERI",
    "Restricted Electronics - RELE",
    "Leather Item Restriction - LTHR",
    "Custom Hold - CSTM",
    "Account Deactivated - AC",
    "Payment Pending - PAY",
    "Duplicate Shipment - DUP",
    "Manual Inspection Required - MANI",
    "System Flagged Hold - SYSF",
    "Transit Damage Suspected - TDS",
    "No One Available - NOA",
    "Delivery Rescheduled - DRS",
    "Customer Requested Hold - CRH",
    "Wrong Contact Number - WCN",
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-6 w-full">
        <div className="flex flex-col gap-3 w-full">
          <RedLabelHeading label={"Client Details"} />
          <div className="flex gap-2">
            <div>
              <InputBox
                placeholder="Code"
                register={register}
                setValue={setValue}
                value="code"
                error={errors.code}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Code is required",
                }}
              />
            </div>
            <InputBox
              placeholder="Client"
              register={register}
              setValue={setValue}
              value="client"
              error={errors.client}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "Client name is required",
              }}
            />
          </div>
          <InputBox
            placeholder="MAWB Number"
            register={register}
            setValue={setValue}
            value="mawbNumber"
            error={errors.mawbNumber}
            trigger={trigger}
            watch={watch}
            validation={{
              required: "MAWB Number is required",
              minLength: {
                value: 2,
                message: "Minimum 2 characters required",
              },
            }}
          />
          <div className="flex gap-2">
            <div className="w-full flex flex-col gap-3">
              <RedLabelHeading label={"Tally"} />
              <InputBox
                placeholder="Actual Weight"
                register={register}
                setValue={setValue}
                value="actualWeight"
                error={errors.actualWeight}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Actual weight is required",
                  min: { value: 1, message: "Must be at least 1" },
                }}
              />
              <InputBox
                placeholder="Length"
                register={register}
                setValue={setValue}
                value="length"
                error={errors.length}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Length is required",
                  min: { value: 1, message: "Must be at least 1" },
                }}
              />
              <InputBox
                placeholder="Breadth"
                register={register}
                setValue={setValue}
                value="breadth"
                error={errors.breadth}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Breadth is required",
                  min: { value: 1, message: "Must be at least 1" },
                }}
              />
              <InputBox
                placeholder="Height"
                register={register}
                setValue={setValue}
                value="height"
                error={errors.height}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Height is required",
                  min: { value: 1, message: "Must be at least 1" },
                }}
              />
              <InputBox
                placeholder="Vol. Weight"
                register={register}
                setValue={setValue}
                value="volWeight"
                error={errors.volWeight}
                trigger={trigger}
                watch={watch}
                validation={{
                  required: "Vol. Weight is required",
                  min: { value: 1, message: "Must be at least 1" },
                }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <RedCheckbox
              isChecked={hold}
              setChecked={setHold}
              id="hold"
              register={register}
              setValue={setValue}
              label={"Hold"}
            />
            <LabeledDropdown
              options={holdReasons}
              register={register}
              setValue={setValue}
              title={`Hold Reason`}
              value={`holdReason`}
              onChange={(val) => setValue("holdReason", val)}
            />
          </div>

          <InputBox
            placeholder={`Hold Reason`}
            register={register}
            setValue={setValue}
            value={`holdReason`}
            error={errors.holdReason}
            trigger={trigger}
            watch={watch}
            validation={{
              required: "Hold reason is required",
            }}
          />
          <div className="w-full flex flex-row-reverse">
            <div>
              <SimpleButton name={"Add to table"} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <RedLabelHeading label={"Shipment Details"} />
          <div className="flex gap-2">
            <InputBox
              register={register}
              placeholder={`CD Number`}
              setValue={setValue}
              value={`cdNumber`}
              error={errors.cdNumber}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "CD Number is required",
              }}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-semibold text-red text-sm">
              Consignee Details
            </div>
            <InputBox
              register={register}
              placeholder={""}
              setValue={setValue}
              value={"ConsigneeDetails"}
              error={errors.ConsigneeDetails}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "Consignee details are required",
              }}
              isTextArea
              className="w-full h-[207px]"
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="font-semibold text-red text-sm">
              Consignor Details
            </div>
            <InputBox
              register={register}
              placeholder={""}
              setValue={setValue}
              value={"ConsignorDetails"}
              error={errors.ConsignorDetails}
              trigger={trigger}
              watch={watch}
              validation={{
                required: "Consignor details are required",
              }}
              isTextArea
              className="w-full h-[207px]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <RedLabelHeading label={`Total AWB: 6`} />
        <TableWithSorting
          register={register}
          setValue={setValue}
          name="bagging"
          columns={columns}
          rowData={rowData}
        />
      </div>

      <div className="flex justify-between">
        <div className="w-[144px]">
          <OutlinedButtonRed label={"Close"} />
        </div>
        <div>
          <div className="flex justify-between gap-7">
            <RedCheckbox
              isChecked={Portal}
              setChecked={setPortal}
              id="portal"
              register={register}
              setValue={setValue}
              label={"Portal"}
            />
            <RedCheckbox
              isChecked={WhatsApp}
              setChecked={setWhatsApp}
              id="whatsApp"
              register={register}
              setValue={setValue}
              label={"WhatsApp"}
            />
            <RedCheckbox
              isChecked={EMail}
              setChecked={setEMail}
              id="eMail"
              register={register}
              setValue={setValue}
              label={"EMail"}
            />
            <div>
              <SimpleButton name={"Send Alert"} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CDNumberWise;
