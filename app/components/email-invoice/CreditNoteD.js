"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import DownloadCsvExcel from "../DownloadCsvExcel";
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
import { TableWithSorting, TableWithCheckbox } from "@/app/components/Table";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { LabeledDropdown } from "../Dropdown";

function CreditNoteD() {
  const { register, setValue } = useForm();
  const [rowData, setRowData] = useState([]);
  const [monthFile, setMonthFile] = useState(false);
  const [withPdf, setPdf] = useState(false);

  const columns = useMemo(
    () => [
      { key: "invoiceNo", label: "Invoice No" },
      { key: "monthFile", label: "Month File" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "invoiceDate", label: "Invoice Date" },
      { key: "basicAmt", label: "Basic Amount" },
      { key: "miscAmt", label: "Misc Amount" },
      { key: "serviceTax", label: "Service Tax" },
      { key: "sbc", label: "SBC" },
      { key: "kyc", label: "KYC" },
      { key: "grandTotal", label: "Grand Total" },
    ],
    []
  );

  return (
    <form className="flex flex-col gap-9">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <LabeledDropdown
              options={["1", "2", "3"]}
              value="branch"
              title={`Branch`}
              register={register}
              setValue={setValue}
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
              placeholder={"Customer Name"}
              register={register}
              setValue={setValue}
              value={"name"}
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
      </div>
      {/* <div className="flex justify-end">
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Convert Pdf"
          id="convertPdf"
          isChecked={withPdf}
          setChecked={setPdf}
        />
      </div> */}
      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
        />
      </div>
      <div className="flex justify-between">
        <div>
          <OutlinedButtonRed type="button" label={"Close"} />
        </div>
        <div className="flex gap-2">
          <OutlinedButtonRed type="button" label={"PDF"} />
          <SimpleButton type="button" name={"Send"} />
        </div>
      </div>
    </form>
  );
}

export default CreditNoteD;
