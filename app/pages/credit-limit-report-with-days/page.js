"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import DownloadDropdown from "@/app/components/DownloadDropdown";

import Heading from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  SearchInputBox,
} from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

function CreditLimitReportWithDays() {
  const { register, setValue } = useForm();
  const [rowData, setRowData] = useState([]);
  const [withHoldAWB, setWithHoldAWB] = useState(false);

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
      <Heading
        title={`Credit Limit Report (With Days) `}
        bulkUploadBtn="hidden"
        codeListBtn={true}
        onRefresh={() => console.log("Refresh clicked")}
        fullscreenBtn={true}
      />
      <div className="flex flex-col gap-3 mt-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
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
            <div className="flex gap-2">
              <div className="w-30">
                <OutlinedButtonRed label="Show" />
              </div>
              <div className="w-40">
                <OutlinedButtonRed label="Show All" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <SearchInputBox placeholder="Search Report" />
      </div>
      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className={`border-b-0 rounded-b-none h-[45vh]`}
        />
        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0  text-gray-900  bg-[#D0D5DDB8] rounded rounded-t-none  font-sans px-4 py-2 gap-16">
          <div>
            <span className="font-sans ">Total :</span>
            <span className="text-red"> {/* {totalBalance} */}20000 </span>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <div>
          {/* <OutlinedButtonRed type="button" label={"Close"} /> */}
        </div>
        <div className="flex gap-2">
          <OutlinedButtonRed type="button" label={"Print"} />
          <DownloadDropdown label="Download" />
        </div>
      </div>
    </form>
  );
}

export default CreditLimitReportWithDays;
