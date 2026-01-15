import React, { useMemo, useState } from "react";
import { LabeledDropdown } from "../Dropdown";
import InputBox, { DateInputBox } from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import Table from "../Table";

const RateHike = ({ register, setValue, setStep, getValues, customerData }) => {
  const columns = useMemo(
    () => [
      { key: "service", label: "Service Name" },
      { key: "amount", label: "Amount" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
    ],
    []
  );

  const [rowData, setRowData] = useState([]);

  const handleAdd = () => {
    const newRow = {
      service: getValues("rateHikeService"),
      amount: getValues("rateHikeAmount"),
      fromDate: getValues("rateHikeFrom"),
      toDate: getValues("rateHikeTo"),
    };

    setRowData((prevRowData) => [...prevRowData, newRow]); // Append newRow to the existing array
  };
  return (
    <div>
      <div className="flex flex-col gap-3 h-[55vh]">
        <div className="flex flex-row-reverse text-[14px] font-bold underline decoration-red cursor-pointer">
          <span onClick={() => setStep(6)} className="text-red">
            Skip
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <LabeledDropdown
              options={["Canada", "USA", "etc"]}
              register={register}
              setValue={setValue}
              value="rateHikeService"
              title="Service"
              defaultValue={customerData?.rateHikeService || ""}
            />
            <InputBox
              placeholder="Amount"
              register={register}
              setValue={setValue}
              value="rateHikeAmount"
              initialValue={customerData?.rateHikeAmount || ""}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-3 w-full">
              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                value="rateHikeFrom"
                initialValue={customerData?.rateHikeFrom || ""}
              />
              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                value="rateHikeTo"
                initialValue={customerData?.rateHikeTo || ""}
              />
            </div>
            <div className="w-40">
              <SimpleButton name={`Add`} onClick={handleAdd} />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Table
            columns={columns}
            rowData={customerData?.rateHikeTable || rowData}
            register={register}
            setValue={setValue}
            name={"rateHike"}
          />
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <div>
          <OutlinedButtonRed
            label={"Back"}
            onClick={() => setStep((prevStep) => prevStep - 1)}
          />
        </div>

        <div>
          <SimpleButton
            onClick={() => setStep((prevStep) => prevStep + 1)}
            name={"Next"}
          />
        </div>
      </div>
    </div>
  );
};

export default RateHike;
