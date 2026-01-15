import React, { useEffect, useMemo, useState } from "react";
import InputBox, { DateInputBox } from "./InputBox";
import { useForm } from "react-hook-form";
import { LabeledDropdown } from "./Dropdown";
import RedCheckbox from "./RedCheckBox";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";
import {
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelDarkGrayAndRedText,
} from "./DummyInputBox";
import { exportAccountLedgerData } from "../lib/exportData";
import { TableWithSorting } from "./Table";

const SaleDetails = () => {
  const { register, setValue, getValues } = useForm();
  const [bookingDate, setBookingDate] = useState(false);
  const [unBilledShipment, setUnBilledShipment] = useState(false);
  const [skipDHL, setSkipDHL] = useState(false);
  const [speacialReport, setSpeacialReport] = useState(false);
  const [consignorDetail, setConsignorDetail] = useState(false);
  const [rowData, setRowData] = useState([]);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "saleType", label: "Sale Type" },
      { key: "date", label: "Date" },
      { key: "customerCode", label: "Customer Code" },
      { key: "consigneeName", label: "Consignee Name" },
      { key: "shipmentForwarder", label: "Shipment Forwarder" },
    ],
    []
  );

  const sampleData = [
    {
      awbNo: "AWB001",
      saleType: "ABC",
      date: "2025-01-03",
      customerCode: "NAME002",
      consigneeName: "XYZ",
      shipmentForwarder: "ONE",
    },
  ];

  useEffect(() => {
    setRowData(sampleData);
  }, []);

  return (
    <form className="flex flex-col gap-9">
      <div className=" flex  flex-col gap-3">
        <div className="flex gap-2">
          <InputBox
            placeholder="Run Number"
            register={register}
            setValue={setValue}
            value="runNumber"
          />
          <InputBox
            placeholder="Customer"
            register={register}
            setValue={setValue}
            value="customer"
          />
          <InputBox
            placeholder="Branch"
            register={register}
            setValue={setValue}
            value="branch"
          />
          <LabeledDropdown
            options={["bank", "card", "cash"]}
            register={register}
            setValue={setValue}
            value="payment"
            title="Payment"
          />
        </div>
        <div className="flex gap-2">
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
          <InputBox
            placeholder="Network"
            register={register}
            setValue={setValue}
            value="network"
          />
        </div>
        <div className="flex gap-2">
          <InputBox
            placeholder="Counter Part"
            register={register}
            setValue={setValue}
            value="counterPart"
          />
          <LabeledDropdown
            options={[]}
            register={register}
            setValue={setValue}
            value="accountManager"
            title="Account Manager"
          />
          <LabeledDropdown
            options={[]}
            register={register}
            setValue={setValue}
            value="salePerson"
            title="Sale Person"
          />
          <LabeledDropdown
            options={[]}
            register={register}
            setValue={setValue}
            value="saleRefPerson"
            title="Sale Ref. Person"
          />
        </div>
        <div className="flex gap-2">
          <LabeledDropdown
            options={[]}
            register={register}
            setValue={setValue}
            value="company"
            title="Company"
          />

          <InputBox
            placeholder="State"
            register={register}
            setValue={setValue}
            value="state"
          />
        </div>
        <div className="flex gap-2">
          <DateInputBox
            register={register}
            setValue={setValue}
            value={`from`}
            placeholder="From"
          />
          <DateInputBox
            register={register}
            setValue={setValue}
            value={`to`}
            placeholder="To"
          />
        </div>

        <div className="flex justify-around">
          <RedCheckbox
            isChecked={bookingDate}
            setChecked={setBookingDate}
            id="bookingDate"
            register={register}
            setValue={setValue}
            label={"Booking Date"}
          />
          <RedCheckbox
            isChecked={unBilledShipment}
            setChecked={setUnBilledShipment}
            id="unBilledShipment"
            register={register}
            setValue={setValue}
            label={"UnBilled Shipment"}
          />
          <RedCheckbox
            isChecked={skipDHL}
            setChecked={setSkipDHL}
            id="skipDHL"
            register={register}
            setValue={setValue}
            label={"skip DHL"}
          />
          <RedCheckbox
            isChecked={speacialReport}
            setChecked={setSpeacialReport}
            id="speacialReport"
            register={register}
            setValue={setValue}
            label={"Speacial Report Branch Wise"}
          />
          <RedCheckbox
            isChecked={consignorDetail}
            setChecked={setConsignorDetail}
            id="consignorDetail"
            register={register}
            setValue={setValue}
            label={"Consignor Detail Wise"}
          />
          <div>
            <SimpleButton name={"Search"} />
          </div>
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          name="refShipper"
          columns={columns}
          rowData={rowData}
        />
      </div>

      <div className="flex gap-2">
        <DummyInputBoxWithLabelDarkGray
          placeholder={"0.00"}
          label={`Total Actual Weight`}
          register={register}
          setValue={setValue}
          value={"totalActualWeight"}
        />
        <DummyInputBoxWithLabelDarkGray
          placeholder={"0.00"}
          label={`Total Chargeable Weight `}
          register={register}
          setValue={setValue}
          value={"ottalChargeableWeight "}
        />
        <DummyInputBoxWithLabelDarkGrayAndRedText
          placeholder={"0.00"}
          label={`Grand Total`}
          register={register}
          setValue={setValue}
          value={"grandTotal"}
        />
      </div>
      <div className="flex  justify-between">
        <div className="w-36">
          <OutlinedButtonRed label={`Close`} />
        </div>
        <div>
        <SimpleButton
          onClick={() => {
            exportAccountLedgerData(rowData, getValues("code"));
          }}
          name={`Download CSV`}
        />
        </div>
   
      </div>
    </form>
  );
};

export default SaleDetails;
