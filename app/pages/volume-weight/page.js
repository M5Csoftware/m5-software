"use client"
import React, { useMemo, useState, useEffect, useContext } from "react";
import { AwbWindowHeading } from "@/app/components/Heading";
import { useForm } from "react-hook-form";
import { NumberInputBox } from "@/app/components/InputBox";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import { TableWithCTA } from "@/app/components/Table";
import { DummyInputBoxWithLabelTransparent } from "@/app/components/DummyInputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";

function VolumeWeight({ awbNo}) {
  const { register, setValue, handleSubmit, reset, watch } = useForm();
  const [rowData, setRowData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [division, setDivision] = useState(5000);
  const [volumeWeight, setVolumeWeight] = useState(0.0);
  const [totalPcs, setTotalPcs] = useState(0);
  const [totalVolWeight, setTotalVolWeight] = useState(0);
  const [ totalKg, setTotalKg ] = useState(0);
  const {actualWtt, setActualWtt} = useContext(GlobalContext);


  useEffect(() => {
    const total = rowData.reduce((sum, item) => sum + item.volumeWeight, 0);
    setTotalKg(total.toFixed(2));
  
    const pcsTotal = rowData.reduce((sum, item) => sum + Number(item.pcs || 0), 0); // Convert pcs to number
    setTotalPcs(pcsTotal);
    
    setTotalVolWeight(total.toFixed(2));
  }, [rowData]);
  
  
  

  const columns = useMemo(
    () => [
      { key: "boxNo", label: "Box No" },
      { key: "length", label: "Length" },
      { key: "width", label: "Width" },
      { key: "height", label: "Height" },
      { key: "pcs", label: "PCs" },
      { key: "volumeWeight", label: "Volume Wt." },
    ],
    []
  );

  // Calculate volumeWeight based on length, width, height, and division
  useEffect(() => {
    const { length, width, height } = watch();
    if (length && width && height) {
      const calculatedVolumeWeight = (length * width * height) / division;
      setVolumeWeight(calculatedVolumeWeight);
      setValue("volumeWeight", calculatedVolumeWeight); // Update the form value for volumeWeight
    }
  }, [watch("length"), watch("width"), watch("height"), division, setValue]);

  // Calculate and update the totalKg based on rowData
  useEffect(() => {
    const total = rowData.reduce((sum, item) => sum + item.volumeWeight, 0);
    setTotalKg(total.toFixed(2)); // Set the total volume weight
  }, [rowData]);

  const addToArray = (data) => {
    const pcsCount = Number(data.pcs) || 1; // Ensure pcs is at least 1

    setRowData((prev) => {
      let updatedData = [...prev];

      if (editIndex !== null) {
        // Remove the old entry before adding the new ones
        updatedData = updatedData.filter((_, i) => i !== editIndex);
      }

      // Generate new rows based on updated pcs
      const newEntries = Array.from({ length: pcsCount }, (_, i) => ({
        ...data,
        boxNo: updatedData.length + i + 1, // Assign new box numbers
        pcs: 1, // Each row represents one piece
      }));

      setEditIndex(null);
      return [...updatedData, ...newEntries];
    });

    reset(); // Reset the form after adding
  };

  const handleEdit = (index) => {
    const selectedData = rowData[index];
    if (selectedData) {
      setValue("length", selectedData.length);
      setValue("width", selectedData.width);
      setValue("height", selectedData.height);
      setValue("pcs", selectedData.pcs);
      setValue("volumeWeight", selectedData.volumeWeight);
      setEditIndex(index);
    }
  };

  const handleDelete = (index) => {
    setRowData((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({ ...item, boxNo: idx + 1 }))
    );
  };

  return (
    <form
      onSubmit={handleSubmit(addToArray)}
      className={`flex flex-col gap-7 bg-white`}
    >
      <AwbWindowHeading label={`Volume Weight`} awbNo={awbNo} />
      <div className="flex gap-4">
        <NumberInputBox
          placeholder="Length"
          register={register}
          setValue={setValue}
          value="length"
        />
        <NumberInputBox
          placeholder="Width"
          register={register}
          setValue={setValue}
          value="width"
        />
        <NumberInputBox
          placeholder="Height"
          register={register}
          setValue={setValue}
          value="height"
        />
        <NumberInputBox
          placeholder="Pcs"
          register={register}
          setValue={setValue}
          value="pcs"
        />
        <DummyInputBoxWithLabelTransparent
          watch={watch}
          label="Volume Wt."
          register={register}
          setValue={setValue}
          value="volumeWeight"
          inputValue={volumeWeight}
        />
        <OutlinedButtonRed
          type="submit"
          label={editIndex !== null ? `Update(${editIndex + 1})` : "Add"}
        />
      </div>
      <div className="bg-white-smoke border border-silver rounded-lg py-3.5 px-5 flex flex-col gap-3">
        <div className="flex justify-end gap-9">
          <div className="flex bg-[#7676801F] px-5 py-1.5 text-sm gap-5 items-center rounded-md ">
            <span className="text-[#667085]">Total Kg</span>
            <span>{totalKg} Kg</span> {/* Display totalKg */}
          </div>
          <div className="flex bg-[#7676801F] px-5 py-1.5 text-sm gap-5 items-center rounded-md ">
            <span className="text-[#667085]">Division</span>
            <span>{division}</span>
          </div>
        </div>
        <TableWithCTA
          columns={columns}
          name={`volumeWeight`}
          register={register}
          setValue={setValue}
          rowData={rowData}
          handleDelete={handleDelete}
          handleEdit={handleEdit}
        />
      </div>
      <div className="flex justify-between">
        <div>
          <OutlinedButtonRed label={`Delete All Boxes`} />
        </div>
          <div className="bg-[#FFE5E9] py-[10px] px-4 rounded-md flex gap-5 text-center items-center">
            <h1 className="text-base font-medium text-red">Total Pcs</h1>
            <span className="text-black">{totalPcs}</span>
            {/* Dynamically updated Total Pcs */}
          </div>

          <div className="bg-[#FFE5E9] py-[10px] px-4 rounded-md flex gap-5 items-center">
            <h1 className="text-base font-medium text-red">Total Vol. Weight</h1>
            <span>{totalVolWeight} kg</span>
            {/* Dynamically updated Total Vol. Weight */}
          </div>

        <div className="bg-[#FFE5E9] py-[10px] px-4 rounded-md flex gap-5 items-center">
          <h1 className="text-base font-medium text-red">Total Act. Weight</h1>
          <span className="font-normal">{actualWtt} kg</span>
        </div>
      </div>
    </form>
  );
}

export default VolumeWeight;
