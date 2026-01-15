import React, { useContext, useEffect, useState } from "react";
import InputBox, { DateInputBox } from "./InputBox";
import { LabeledDropdown } from "./Dropdown";
import {
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelTransparent,
} from "./DummyInputBox";
import { DeleteButton, EditButton } from "./AddUpdateDeleteButton";
import { OutlinedButtonRed, SimpleButton } from "./Buttons";
import { GlobalContext } from "../lib/GlobalContext";


const HubAirport = ({
  register,
  setValue,
  watch,
  selectRunEntry,
  runEntryrReset,
}) => {
  const [runNumber, setRunNumber] = useState("");
  const { sectors, hub, counterpart } = useContext(GlobalContext);
    const [selectedZoneNumber, setSelectedZoneNumber] = useState("");
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
      }, );

  // Generate or clear Unique ID when Run Number changes
  useEffect(() => {
    if (runNumber) {
      const newUniqueId = `run-${runNumber}-${Math.floor(
        Math.random() * 1000
      )}`;
      setValue("uniqueID", newUniqueId); // Set the generated unique ID in the form
    } else {
      setValue("uniqueID", ""); // Clear the unique ID when runNumber is empty
    }
  }, [runNumber, setValue]);

  return (
    <div className="flex flex-col gap-11">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <div>
            <h2 className="text-[16px] text-red font-semibold">Run Details</h2>
          </div>
          <div className="flex gap-1 text-center">
            <h2 className="text-[16px] font-semibold">Branch:</h2>
            <h2 className="text-[16px] rounded bg-[#FFE5E9] text-red px-[10px] py-[2px] font-semibold">
              New Delhi
            </h2>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <div className="flex flex-col gap-3 w-full">
            {/* Run Number Input */}
            <InputBox
              resetFactor={runEntryrReset}
              placeholder="Run Number"
              register={register}
              setValue={(key, value) => {
                setValue(key, value);
                if (key === "runNumber") setRunNumber(value); // Update Run Number
              }}
              value="runNumber"
              initialValue={selectRunEntry?.runNumber || ""}
              watch={watch}
            />
            <LabeledDropdown
              options={sectors.map((sector) => sector.name)}
              register={register}
              setValue={setValue}
              value="sector"
              title="Sector"
              resetFactor={runEntryrReset}
              defaultValue={watch("sector") || ""}
            />
            <InputBox
              resetFactor={runEntryrReset}
              placeholder="Flight"
              register={register}
              setValue={setValue}
              value="flight"
              initialValue={watch("flight") || ""}
            />
            <InputBox
              resetFactor={runEntryrReset}
              placeholder="OBC"
              register={register}
              setValue={setValue}
              value="obc"
              initialValue={watch("obc") || ""}
            />
            <LabeledDropdown
              options={hub.map((hub) => hub.name)}
              register={register}
              setValue={setValue}
              value="hub"
              title="Hub"
              resetFactor={runEntryrReset}
              defaultValue={watch("hub") || ""}
            />
          </div>
          <div className="flex flex-col gap-3 w-full">
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
              options={counterpart.map((counterpart) => counterpart.name)}
              register={register}
              setValue={setValue}
              value="counterpart"
              title="Counter Part"
              resetFactor={runEntryrReset}
              defaultValue={watch("counterpart") || ""}
            />
            <InputBox
              resetFactor={runEntryrReset}
              placeholder="Flight number"
              register={register}
              setValue={setValue}
              value="flightnumber"
              initialValue={watch("flightnumber") || ""}
            />
            <InputBox
              resetFactor={runEntryrReset}
              placeholder="A/L MAWB"
              register={register}
              setValue={setValue}
              value="almawb"
              initialValue={watch("almawb") || ""}
            />
            {/* Unique ID Display */}
            <DummyInputBoxWithLabelDarkGray
              register={register}
              label="Unique ID"
              setValue={setValue}
              value="uniqueID"
              readOnly={true} // Make it read-only
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex gap-2">
          <EditButton />
          <DeleteButton />
        </div>
        <div className="flex gap-2">
          <div>
            <SimpleButton type="submit" name={"Create"} />
          </div>
          <div>
            <OutlinedButtonRed label="Close" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HubAirport;
