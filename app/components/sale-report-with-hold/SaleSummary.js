"use client";

import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";

import Heading from "@/app/components/Heading";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import DownloadDropdown from "../DownloadDropdown";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import { Dropdown } from "../Dropdown";

function SaleSummary() {
  const { register, setValue } = useForm();
  const [rowData] = useState([]);
  const [withBooking, setWithBooking] = useState(false);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "shipmentDate", label: "Shipment Date" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "salePerson", label: "Sale Person" },
      { key: "consigneeName", label: "Consignee Name" },
      { key: "consigneeAddress", label: "Consignee Address" },
    ],
    []
  );

  return (
    <form className="flex flex-col gap-3">
      {/* 🔹 Filters Section */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <InputBox
            placeholder="Run Number"
            register={register}
            setValue={setValue}
            value="Run Number"
          />
          <Dropdown
            title="Payment"
            options={[
              "General Entry",
              "Debit Note",
              "Credit Note",
              "On Account",
              "TDS",
              "Othe",
            ]}
            value="Payment"
            register={register}
            setValue={setValue}
            defaultValue=""
          />
          <InputBox
            placeholder="Branch"
            register={register}
            setValue={setValue}
            value="Branch"
          />
          <InputBox
            placeholder="Origin"
            register={register}
            setValue={setValue}
            value="Origin"
          />
        </div>
        <div className="flex gap-3">
          <InputBox
            placeholder="Sector"
            register={register}
            setValue={setValue}
            value="Sector"
          />
          <InputBox
            placeholder="Destination"
            register={register}
            setValue={setValue}
            value="Destination"
          />
          <InputBox
            placeholder="Network"
            register={register}
            setValue={setValue}
            value="Network"
          />
          <InputBox
            placeholder="Counter Part"
            register={register}
            setValue={setValue}
            value="Couter Part"
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Wrap inputs in fixed-width divs */}

          <Dropdown
            title="Sale Person"
            options={[
              "General Entry",
              "Debit Note",
              "Credit Note",
              "On Account",
              "TDS",
              "Othe",
            ]}
            value="salePerson"
            register={register}
            setValue={setValue}
            defaultValue=""
          />

          <Dropdown
            title="Sale Ref. Person"
            options={[
              "General Entry",
              "Debit Note",
              "Credit Note",
              "On Account",
              "TDS",
              "Othe",
            ]}
            value="saleRefPerson"
            register={register}
            setValue={setValue}
            defaultValue=""
          />

          <Dropdown
            title="Company"
            options={[
              "General Entry",
              "Debit Note",
              "Credit Note",
              "On Account",
              "TDS",
              "Othe",
            ]}
            value="Company"
            register={register}
            setValue={setValue}
            defaultValue=""
          />
        </div>
        <div className="flex gap-3">
          <div className="w-full">
            <InputBox
              placeholder={`Customer`}
              register={register}
              setValue={setValue}
              value={`Customer`}
            />
          </div>

          <DummyInputBoxWithLabelDarkGray
            placeholder={"DEL"}
            register={register}
            setValue={setValue}
            value={"State"}
          />
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
          <div className>
            <OutlinedButtonRed label={`Show`} />
          </div>
        </div>
      </div>

      {/* 🔹 Table Section */}
      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className="border-b-0 rounded-b-none h-[45vh]"
        />

        {/* Totals Row */}
        <div className="flex justify-between border border-t-0 border-[#D0D5DD] border-opacity-75 bg-[#D0D5DDB8] text-gray-900 rounded rounded-t-none font-sans px-4 py-2">
          <div>
            <span>Total Weight: </span>
            <span className="text-red">20000kg</span>
          </div>
          <div>
            Grand Total: <span className="text-red">1231231.00</span>
          </div>
        </div>
      </div>

      {/* 🔹 Footer Buttons */}
      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-2">
          <OutlinedButtonRed label="Print" className=" px-10 py-1" />
          <DownloadDropdown type="button" name={"Download"} />
        </div>
      </div>
    </form>
  );
}

export default SaleSummary;
