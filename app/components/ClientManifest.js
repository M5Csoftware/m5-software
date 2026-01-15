import React, { useMemo, useState } from "react";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";
import InputBox from "./InputBox";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { TableWithSorting } from "./Table";

const ClientManifest = () => {
  const { register, setValue } = useForm();
   const [rowData, setRowData] = useState([]);
  
  const data = [
    {
      date: "10/12/2024",
      manifestNo: "GJ128-91",
      noOfAwb: "5",
      pcs: "8",
      weight: "100 Kgs",
      amount: "58,000",
      status: "dispatched",
    },
    {
      date: "10/12/2024",
      manifestNo: "17:35:00",
      noOfAwb: "Credit Limit Exceed",
      pcs: "1148558",
      weight: "1148558",
      amount: "1148558",
      status: "1148558",
    },
  ];


    const columns = useMemo(
      () => [
        { key: "date", label: "Date" },
        { key: "manifestNo", label: "Manifest No." },
        { key: "noofAwb", label: "No. of AWB" },
        { key: "pcs", label: "Pcs" },
        { key: "weight", label: "Weight" },
        { key: "amount", label: "Amount" },
        { key: "status", label: "Status" },
      ],
      []
    );
  
    const sampleData = [
      { date: "2025-01-01", manifestNo: "manifest009", noofAwb: "ABCD001", pcs: "10", weight: "25kg", amount: "9000", status: "good" },
      { date: "2025-01-02", manifestNo: "manifest010", noofAwb: "ABCD002", pcs: "15", weight: "30kg", amount: "12000", status: "average" },
      { date: "2025-01-03", manifestNo: "manifest011", noofAwb: "ABCD003", pcs: "20", weight: "40kg", amount: "15000", status: "excellent" },
    ];

  return (
    <form>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-[14px] font-semibold">
              Shipment Origin / Destination
            </h1>
          </div>
          <div className="flex gap-3 ">
            <div className="w-[219px]">
              <InputBox
                placeholder="Branch"
                register={register}
                setValue={setValue}
                value="branch"
              />
            </div>

            <div className="w-full">
              <InputBox register={register} setValue={setValue} value="dummy" />
            </div>
          </div>

          <div className="flex gap-3">
            <InputBox
              placeholder="GST"
              register={register}
              setValue={setValue}
              value="gst"
            />
            <InputBox
              placeholder="Rate Type"
              register={register}
              setValue={setValue}
              value="ratetype"
            />
          </div>
          <div className="flex gap-3">
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
          </div>
          <div className="flex gap-3">
            <InputBox
              placeholder="Weight"
              register={register}
              setValue={setValue}
              value="weight"
            />
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              value="branch"
            />
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

        <div className="flex justify-between">
          <div className="flex  gap-4">
            <SimpleButton name={"Find Rate"} />
            <div>
              <OutlinedButtonRed label={"Edit"} />
            </div>
          </div>
          <div>
            <OutlinedButtonRed label={"Print"} />
          </div>
        </div>
      </div>
    </form>
  );
};

export default ClientManifest;
