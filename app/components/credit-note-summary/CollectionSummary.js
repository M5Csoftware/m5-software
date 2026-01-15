"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { LabeledDropdown } from "@/app/components/Dropdown";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxLightGray,
  DummyInputBoxTransparent,
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelDarkGrayAndRedText,
  DummyInputBoxWithLabelTransparent,
} from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

function CollectionSummary() {
  const { register, setValue } = useForm();
  const [rowData, setRowData] = useState([]);
  const [withBookingDate, setBookingDate] = useState(false);
  const [withUnbilled, setUnbilled] = useState(false);
  const [withDHL, setDHL] = useState(false);
  const [withDate, setDate] = useState(false);
  const [withBranchWise, setBrnachWise] = useState(false);
  const [withConsignor, setConsignor] = useState(false);

  const columns = useMemo(
    () => [
      { key: "AwbNo", label: "AWB No" },
      { key: "BookingDate", label: "Booking Date" },
      { key: "FlightDate", label: "Flight Date" },
      { key: "RunNo", label: "Run No" },
      { key: "HUB", label: "HUB" },
      { key: "ClubNo", label: "Club No" },
      { key: "Branch", label: "Branch" },
      { key: "State", label: "State" },
      { key: "City", label: "City" },
      { key: "Type", label: "Type" },
      { key: "SalePerson", label: "Sale Person" },
      { key: "RefrenceBy", label: "Reference By" },
      { key: "ManagedBy", label: "Managed By" },
      { key: "CollectionBy", label: "Collection By" },
      { key: "AccountManager", label: "Account Manager" },
      { key: "GM", label: "GM" },
      { key: "RM", label: "RM" },
      { key: "SM", label: "SM" },
      { key: "RateType", label: "Rate Type" },
      { key: "OpeningAccount", label: "Opening Account" },
      { key: "Currency", label: "Currency" },
      { key: "OriginName", label: "Origin Name" },
      { key: "Sector", label: "Sector" },
      { key: "DestinationCode", label: "Destination Code" },
      { key: "CustomerCode", label: "Customer Code" },
      { key: "CustomerName", label: "Customer Name" },
      { key: "ConsignorName", label: "Consignor Name" },
      { key: "ConsigneeName", label: "Consignee Name" },
      { key: "ConsigneeAddressLine1", label: "Consignee Address Line 1" },
      { key: "ConsigneeCity", label: "Consignee City" },
      { key: "ConsigneeState", label: "Consignee State" },
      { key: "ConsigneeZipCode", label: "Consignee Zip Code" },
      { key: "ConsigneePhoneNo", label: "Consignee Phone No" },
      { key: "ShipmentForwarderTo", label: "Shipment Forwarder To" },
      { key: "ShipmentForwardingNo", label: "Shipment Forwarding No" },
      { key: "ServiceType", label: "Service Type" },
      { key: "Pcs", label: "PCS" },
      { key: "GoodsDesc", label: "Goods Description" },
      { key: "ActWeight", label: "Actual Weight" },
      { key: "VolWeight", label: "Volumetric Weight" },
      { key: "VolDiscount", label: "Volume Discount" },
      { key: "ChgWeight", label: "Chargeable Weight" },
      { key: "BagWeight", label: "Bag Weight" },
      { key: "PaymentType", label: "Payment Type" },
      { key: "BillingTag", label: "Billing Tag" },
      { key: "BasicAmount", label: "Basic Amount" },
      { key: "DiscountPerKg", label: "Discount Per Kg" },
      { key: "DiscountAmt", label: "Discount Amount" },
      { key: "BasicAmtAfterDiscount", label: "Basic Amount After Discount" },
      { key: "RateHike", label: "Rate Hike" },
      { key: "SGST", label: "SGST" },
      { key: "CGST", label: "CGST" },
      { key: "IGST", label: "IGST" },
      { key: "Handling", label: "Handling" },
      { key: "OVWT", label: "Overweight" },
      { key: "Mischg", label: "Misc Charge" },
      { key: "MiscRemark", label: "Misc Remark" },
      { key: "Fuel", label: "Fuel" },
      { key: "NonTaxable", label: "Non Taxable" },
      { key: "GrandTotal", label: "Grand Total" },
      { key: "Currency1", label: "Currency 1" },
      { key: "BillNo", label: "Bill No" },
      { key: "CRAmount", label: "CR Amount" },
      { key: "CRBillNo", label: "CR Bill No" },
      { key: "AwbCheck", label: "AWB Check" },
      { key: "ShipmentRemark", label: "Shipment Remark" },
      { key: "CSB", label: "CSB" },
      { key: "HandlingTag", label: "Handling Tag" },
    ],
    []
  );

  return (
    <form className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {/* Row 1 - 4 columns */}
        <div className="grid grid-cols-4 gap-3">
          <InputBox
            placeholder={`Run Number`}
            register={register}
            setValue={setValue}
            value={`runNumber`}
          />
          <LabeledDropdown
            options={["ABC", "XYZ", "LMN"]}
            title="Payment"
            register={register}
            setValue={setValue}
            value="payment"
          />
          <InputBox
            placeholder={`Branch`}
            register={register}
            setValue={setValue}
            value={`branch`}
          />
          <InputBox
            placeholder={`Origin`}
            register={register}
            setValue={setValue}
            value={`origin`}
          />
        </div>

        {/* Row 2 - 4 columns */}
        <div className="grid grid-cols-4 gap-3">
          <InputBox
            placeholder={`Sector`}
            register={register}
            setValue={setValue}
            value={`sector`}
          />
          <InputBox
            placeholder={`Destination`}
            register={register}
            setValue={setValue}
            value={`destination`}
          />
          <InputBox
            placeholder={`Network`}
            register={register}
            setValue={setValue}
            value={`network`}
          />
          <InputBox
            placeholder={`Counter Part`}
            register={register}
            setValue={setValue}
            value={`counterPart`}
          />
        </div>

        {/* Row 3 - 4 columns */}
        <div className="grid grid-cols-4 gap-3">
          <LabeledDropdown
            options={["ABC", "XYZ", "LMN"]}
            title="Sale Person"
            register={register}
            setValue={setValue}
            value="salePerson"
          />
          <LabeledDropdown
            options={["ABC", "XYZ", "LMN"]}
            title="Sale Ref. Person"
            register={register}
            setValue={setValue}
            value="saleRefPerson"
          />
          <InputBox
            placeholder={`Company`}
            register={register}
            setValue={setValue}
            value={`company`}
          />
          <InputBox
            placeholder={`State`}
            register={register}
            setValue={setValue}
            value={`state`}
          />
        </div>

        {/* Row 4 - 4 columns */}
        <div className="grid grid-cols-4 gap-3">
          <LabeledDropdown
            options={["ABC", "XYZ", "LMN"]}
            title="Account Manager"
            register={register}
            setValue={setValue}
            value="accountManager"
          />
          <LabeledDropdown
            options={["ABC", "XYZ", "LMN"]}
            title="Type"
            register={register}
            setValue={setValue}
            value="type"
          />
          <InputBox
            placeholder={`Customer Code`}
            register={register}
            setValue={setValue}
            value={`customerCode`}
          />
          <DummyInputBoxWithLabelDarkGray
            placeholder={"Customer Name"}
            register={register}
            setValue={setValue}
            value={"name"}
          />
        </div>

        {/* Row 5 - Date range and button */}
        <div className="grid grid-cols-4 gap-3">
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
          <div>
            {" "}
            <OutlinedButtonRed type="button" label={"Show"} />
          </div>
          <div>
            {" "}
            <DownloadDropdown label="Download" />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center w-full">
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Booking Date"
          id="bookngDate"
          isChecked={withBookingDate}
          setChecked={setBookingDate}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Unbilled Shipment"
          id="unbilledShipment"
          isChecked={withUnbilled}
          setChecked={setUnbilled}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Skip DHL"
          id="skipDHL"
          isChecked={withDHL}
          setChecked={setDHL}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="YYYYMMDD"
          id="date"
          isChecked={withDate}
          setChecked={setDate}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Special Report Branch Wise"
          id="branchWise"
          isChecked={withBranchWise}
          setChecked={setBrnachWise}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Consignor Wise"
          id="consignorWise"
          isChecked={withConsignor}
          setChecked={setConsignor}
        />
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className={`border-b-0 rounded-b-none h-[35vh]`}
        />
        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0  text-gray-900  bg-[#D0D5DDB8] rounded rounded-t-none  font-sans px-4 py-2 gap-16">
          <div>
            <span className="font-sans ">Total Bag Weight :</span>
            <span className="text-red"> {/* {totalBalance} */}20000 </span>
          </div>
          <div>
            <span className="font-sans ">Total Weight :</span>
            <span className="text-red"> {/* {totalBalance} */}20000 </span>
          </div>

          <div className="flex justify-between items-center">
            <p className="flex gap-16">
              <div>
                Grand Total : <span className="text-red">1231231.00</span>{" "}
              </div>
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed type="button" label={"Close"} /> */}</div>
        <div className="flex gap-2">
          {/* <OutlinedButtonRed type="button" label={"Print"} /> */}
        </div>
      </div>
    </form>
  );
}

export default CollectionSummary;
