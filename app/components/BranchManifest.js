import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import InputBox, { DateInputBox } from "./InputBox";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";
import { TableWithSorting } from "./Table";

const BranchManifest = () => {
  const { handleSubmit, register, setValue, reset, getValues, watch } =
    useForm();
  const [rowData, setRowData] = useState([]);

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
    {
      date: "2025-01-01",
      manifestNo: "manifest009",
      noofAwb: "ABCD001",
      pcs: "10",
      weight: "25kg",
      amount: "9000",
      status: "good",
    },
    {
      date: "2025-01-02",
      manifestNo: "manifest010",
      noofAwb: "ABCD002",
      pcs: "15",
      weight: "30kg",
      amount: "12000",
      status: "average",
    },
    {
      date: "2025-01-03",
      manifestNo: "manifest011",
      noofAwb: "ABCD003",
      pcs: "20",
      weight: "40kg",
      amount: "15000",
      status: "excellent",
    },
  ];

  const sampleUser = [
    { branch: "BRANCH001", customer: "JACK", dummy: "JACK-BACK" },
  ];

  // Load all data into the table by default

  useEffect(() => {
    setRowData();
  });

  const handleSaveAndFilter = () => {
    const fromDate = getValues("from");
    const toDate = getValues("to");

    let filteredData = sampleData;

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);

      filteredData = sampleData.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= from && itemDate <= to;
      });
    }

    setRowData(filteredData);
    // console.log("Saved Data:", filteredData);
  };

  useEffect(() => {
    if (getValues("customer") === "DL001") {
      setValue("dummy", sampleUser[0].dummy);
    } else {
      reset();
    }
  }, [watch("customer")]);

  return (
    <form className="" onSubmit={handleSubmit((data) => console.log(data))}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <InputBox
            placeholder="Branch"
            register={register}
            setValue={setValue}
            value="branch"
          />
          <div className="flex gap-3">
            <div className="w-[206px]">
              <InputBox
                placeholder="Customer"
                register={register}
                setValue={setValue}
                value="customer"
              />
            </div>
            <InputBox register={register} setValue={setValue} value="dummy" />
          </div>
          <div className="flex gap-3">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
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
          <div>
            <SimpleButton name={"Save"} onClick={handleSaveAndFilter} />
          </div>
          <div>
            <OutlinedButtonRed label="Close"  />
          </div>
        </div>
      </div>
    </form>
  );
};

export default BranchManifest;
