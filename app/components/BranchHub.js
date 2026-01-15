import React, { useEffect, useState } from "react";
import InputBox, { DateInputBox } from "./InputBox";
import { useForm } from "react-hook-form";
import { LabeledDropdown } from "./Dropdown";
import {
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelTransparent,
} from "./DummyInputBox";
import { DeleteButton, EditButton } from "./AddUpdateDeleteButton";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";

const BranchHub = ({
  register,
  setValue,
  runEntryrReset,
  reset,
  selectRunEntry,
  watch,
}) => {
  // const { register, setValue } = useForm();
  const [date, setDate] = useState("");
  const [newData, setNewData] = useState(true);

  useEffect(() => {
    const formatDate = (date) => {
      const formattedDate =
        date.getDate().toString().padStart(2, "0") +
        "/" +
        (currentDate.getMonth() + 1).toString().padStart(2, "0") +
        "/" +
        currentDate.getFullYear().toString();

      return formattedDate;
    };

    const currentDate = new Date();

    if (newData) {
      setDate(formatDate(currentDate));
    } else {
      setDate("--/--/----");
    }
  });

  return (
    <div className=" flex flex-col gap-11">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="">
            <h2 className="text-[16px] text-red font-semibold">Run Details</h2>
          </div>
          <div className="flex gap-1 text-center">
            <h2 className="text-[16px]  font-semibold">Branch:</h2>
            <h2 className="text-[16px] rounded bg-[#FFE5E9] text-red px-[10px] py-[2px] font-semibold">
              New Delhi
            </h2>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <div className=" flex flex-col gap-3 w-full">
            <InputBox
              resetFactor={runEntryrReset}
              reset={reset}
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              value="runNumber"
              initialValue={selectRunEntry?.runNumber || ""}
            />
            <InputBox
              resetFactor={runEntryrReset}
              reset={reset}
              placeholder="OBC"
              register={register}
              setValue={setValue}
              value="obc"
              initialValue={watch("obc") || ""}
            />
            <InputBox
              resetFactor={runEntryrReset}
              reset={reset}
              placeholder="CD Number"
              register={register}
              setValue={setValue}
              value="cdNumber"
              initialValue={watch("cdNumber") || ""}
            />

            <DummyInputBoxWithLabelDarkGray
              register={register}
              label={`Origin`}
              setValue={setValue}
              value={`origin`}
            />
          </div>
          <div className=" flex flex-col gap-3 w-full">
            <DummyInputBoxWithLabelTransparent
              watch={watch}
              label={`Date`}
              inputValue={date}
              register={register}
              setValue={setValue}
              resetFactor={runEntryrReset}
              value={`date`}
            />
            <LabeledDropdown
              options={["Rail", "By road", "Air"]}
              register={register}
              setValue={setValue}
              value="transportType"
              title="Transport Type"
              defaultValue={watch("transportType") || ""}
              resetFactor={runEntryrReset}
            />

            <LabeledDropdown
              options={["USA", "UK", "Europe", "Australia"]}
              register={register}
              setValue={setValue}
              value="destination"
              title="Destination"
              defaultValue={watch("destination") || ""}
              resetFactor={runEntryrReset}
            />
          </div>
        </div>
      </div>

      <div className=" flex justify-between">
        <div className="flex gap-2 ">
          <EditButton />
          <DeleteButton />
        </div>
        <div className="flex gap-2">
          <div>
            <SimpleButton type="submit" name={"Create"} />
          </div>
          <div>
            <OutlinedButtonRed label={"Close"} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BranchHub;
