"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useMemo, useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";

function MonthFileManager() {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Watch form values
  const month = watch("month");
  const year = watch("year");
  const generatedMonthFile = watch("generatedMonthFile");

  const columns = useMemo(
    () => [
      { key: "month", label: "Month" },
      { key: "year", label: "Year" },
      { key: "monthFile", label: "Month File" },
      { key: "createdAt", label: "Created Date" },
    ],
    []
  );

  // Generate month file when month and year change
  useEffect(() => {
    if (month && year) {
      const fileName = `TR${String(month).padStart(2, '0')}${year}`;
      setValue("generatedMonthFile", fileName);
    } else {
      setValue("generatedMonthFile", "");
    }
  }, [month, year, setValue]);

  // Fetch all month files
  const fetchMonthFiles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${server}/month-files`);

      if (response.data.success) {
        setRowData(response.data.data);
        setTotalRecords(response.data.data.length);
      } else {
        console.error("Failed to fetch month files:", response.data.error);
        setRowData([]);
        setTotalRecords(0);
      }
    } catch (error) {
      console.error("Error fetching month files:", error);
      setRowData([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchMonthFiles();
  }, []);

  // Handle add month file
  const handleAdd = async () => {
    if (!month || !year || !generatedMonthFile) {
      alert("Please enter month and year to generate month file");
      return;
    }

    // Validate month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    if (monthNum < 1 || monthNum > 12) {
      alert("Month must be between 1 and 12");
      return;
    }

    if (yearNum < 2000 || yearNum > 2099) {
      alert("Year must be between 2000 and 2099");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${server}/month-files`, {
        month: monthNum,
        year: yearNum,
        monthFile: generatedMonthFile,
      });

      if (response.data.success) {
        alert("Month file added successfully");
        // Clear form
        setValue("month", "");
        setValue("year", "");
        setValue("generatedMonthFile", "");
        // Refresh table
        fetchMonthFiles();
      } else {
        alert(response.data.error || "Failed to add month file");
      }
    } catch (error) {
      console.error("Error adding month file:", error);
      alert(error.response?.data?.error || "Error adding month file");
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setValue("month", "");
    setValue("year", "");
    setValue("generatedMonthFile", "");
    fetchMonthFiles();
  };

  return (
    <form className="flex flex-col gap-9">
      <Heading
        title={`Month File Manager`}
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={true}
      />
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <div className="w-full">
            <InputBox
              placeholder={`Month (1-12)`}
              register={register}
              setValue={setValue}
              value={`month`}
              name="month"
              type="number"
            />
          </div>

          <div className="w-full">
            <InputBox
              placeholder={`Year`}
              register={register}
              setValue={setValue}
              value={`year`}
              name="year"
              type="number"
            />
          </div>

          <div className="w-full">
            <InputBox
              placeholder={`Generated Month File`}
              register={register}
              setValue={setValue}
              value={`generatedMonthFile`}
              name="generatedMonthFile"
              disabled
            />
          </div>

          <div className="">
            <OutlinedButtonRed 
              label={loading ? `Adding...` : `Add`} 
              onClick={handleAdd}
              disabled={loading || !generatedMonthFile}
              type="button"
            />
          </div>
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className={`border-b-0 rounded-b-none h-[45vh]`}
          loading={loading}
        />
        <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2">
          <div>
            <span className="font-sans">Total Records: </span>
            <span className="text-red">{totalRecords}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div>
          <OutlinedButtonRed type="button" label={"Close"} />
        </div>
      </div>
    </form>
  );
}

export default MonthFileManager;