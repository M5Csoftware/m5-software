import React, { useState } from "react";
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

const PortalEntryClientWise = ({ register, setValue }) => {
  // const { register, setValue } = useForm();
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
  "Wrong Contact Number - WCN"
];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6 w-full">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-4">
            <RedLabelHeading label={"Client Details"} />
            <div className="flex gap-3">
              <div>
                <InputBox
                  placeholder="Code"
                  register={register}
                  setValue={setValue}
                  value="code"
                />
              </div>
              <InputBox
                placeholder="Client"
                register={register}
                setValue={setValue}
                value="client"
              />
            </div>
          </div>
          <InputBox
            placeholder="MAWB Number"
            register={register}
            setValue={setValue}
            value="mawbNumber"
          />
          <div className="flex gap-3 ">
            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-col gap-4">
                <RedLabelHeading label={"Tally"} />
                <InputBox
                  placeholder="Actual Weight"
                  register={register}
                  setValue={setValue}
                  value="actualWeight"
                />
              </div>
              <InputBox
                placeholder="Length"
                register={register}
                setValue={setValue}
                value="length"
              />
              <InputBox
                placeholder="Breadth"
                register={register}
                setValue={setValue}
                value="breadth"
              />
              <InputBox
                placeholder="Height"
                register={register}
                setValue={setValue}
                value="height"
              />
              <InputBox
                placeholder="Vol. Weight"
                register={register}
                setValue={setValue}
                value="volWeight"
              />
            </div>

            <div className="w-full flex flex-col gap-3">
              <div className="flex flex-col gap-4">
                <RedLabelHeading label={"Portal"} />
                <DummyInputBoxWithLabelDarkGray
                  label="Actual Weight"
                  register={register}
                  setValue={setValue}
                  value="actualWeight"
                />
              </div>
              <DummyInputBoxWithLabelDarkGray
                label="Length"
                register={register}
                setValue={setValue}
                value="length"
              />
              <DummyInputBoxWithLabelDarkGray
                label="Breadth"
                register={register}
                setValue={setValue}
                value="breadth"
              />
              <DummyInputBoxWithLabelDarkGray
                label="Height"
                register={register}
                setValue={setValue}
                value="height"
              />
              <DummyInputBoxWithLabelDarkGray
                label="Result"
                register={register}
                setValue={setValue}
                value="result"
              />
            </div>
          </div>

          <div className="flex gap-3">
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
             
            />
          </div>
          <InputBox
            register={register}
            placeholder={`Hold Reason`}
            setValue={setValue}
            value={`holdReason`}
          />
          <div className="w-full flex flex-row-reverse">
            <div>
              <SimpleButton name={"Add to table"} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col gap-4">
            <RedLabelHeading label={"Shipment Details"} />
            <div className="flex flex-col gap-3">
              <InputBox
                register={register}
                placeholder={`Manifest Number`}
                setValue={setValue}
                value={`manifestNumber`}
              />
              <InputBox
                register={register}
                placeholder={`CD  Number`}
                setValue={setValue}
                value={`cdNumber`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <RedLabelHeading label={"  Consignee Details"} />
            <InputBox
              register={register}
              placeholder={""}
              setValue={setValue}
              value={"ConsigneeDetails"}
              isTextArea
              className="w-full h-[207px]"
            />
          </div>

          <div className="flex flex-col gap-4">
            <RedLabelHeading label={"Consignor Details"} />
            <InputBox
              register={register}
              placeholder={""}
              setValue={setValue}
              value={"ConsignorDetails"}
              isTextArea
              className="w-full h-[207px]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
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

export default PortalEntryClientWise;
