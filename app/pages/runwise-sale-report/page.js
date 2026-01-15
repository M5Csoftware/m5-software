"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { DropdownOptionOnly } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const RunWiseSaleReport = () => {
  const { register, setValue } = useForm();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "shipmentDate", label: "Shipment Date" },
    { key: "customerCode", label: "Customer Code" },
    { key: "customerName", label: "Customer Name" },
    { key: "salePerson", label: "Sale Person" },
    { key: "consigneeName", label: "Consignee Name" },
    { key: "consigneeAddress", label: "Consignee Address" },
  ];

  const rowData = [
    {
      awbNo: "AWB1001",
      shipmentDate: "10/12/2024",
      customerCode: "CUST001",
      customerName: "John Doe",
      salePerson: "Alice Smith",
      consigneeName: "Bob Johnson",
      consigneeAddress: "123 Main Street, Cityville",
    },
    {
      awbNo: "AWB1002",
      shipmentDate: "11/12/2024",
      customerCode: "CUST002",
      customerName: "Jane Williams",
      salePerson: "Michael Brown",
      consigneeName: "Sara Davis",
      consigneeAddress: "456 Elm Street, Townsville",
    },
    {
      awbNo: "AWB1003",
      shipmentDate: "12/12/2024",
      customerCode: "CUST003",
      customerName: "Robert Wilson",
      salePerson: "Laura Martin",
      consigneeName: "Tom Clark",
      consigneeAddress: "789 Pine Avenue, Villagetown",
    },
  ];

  return (
    <div className="">
      <div className="space-y-4">
        <Heading
          title={`Run Wise Sale Report`}
          fullscreenBtn
          onClickFullscreenBtn={() => setIsFullscreen(true)}
          bulkUploadBtn="hidden"
        />

        <div className="flex gap-2 pt-6">
          <div className="w-[630px]">
            <DateInputBox
              placeholder="From"
              value="from"
              register={register}
              setValue={setValue}
            />
          </div>
          <div className="w-[630px]">
            <DateInputBox
              placeholder="To"
              value="to"
              register={register}
              setValue={setValue}
            />{" "}
          </div>

          <div className="w-[175px]">
            <OutlinedButtonRed label={`Show`} />
          </div>
          <div>
            <DownloadDropdown buttonClassname={`w-[175px]`} />
          </div>
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            className={`h-[45vh]`}
            columns={columns}
            rowData={rowData}
          />
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-10 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Run Wise Sale Report</h2>
            <button onClick={() => setIsFullscreen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="Forwarding Number Report"
              columns={columns}
              rowData={rowData}
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <div className="w-[175px]">
          {/* <OutlinedButtonRed label={`Close`} /> */}
        </div>
        <div></div>
      </div>
    </div>
  );
};

export default RunWiseSaleReport;
