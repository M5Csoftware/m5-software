"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { DateInputBox } from "@/app/components/InputBox";
import { PlusIcon } from "lucide-react";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import BookingSection from "./BookingSection";
import OperationsSection from "./OperationsSection";
import CustomerServiceSection from "./CustomerServiceSection";
import BillingSection from "./BillingSection";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";

const CustomReports = () => {
  const { register, setValue, watch } = useForm();
  const department = watch("department");
  const [selectedFields, setSelectedFields] = useState({
    Booking: [],
    Operations: [],
    "Customer Service": [],
    Billing: [],
  });

  const allSelectedFields = Object.values(selectedFields).flat();

  const dynamicColumns = allSelectedFields.map((field) => ({
    key: field.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, ""), // convert to safe key
    label: field,
  }));

  const handleFieldChange = (dept, fields) => {
    setSelectedFields((prev) => ({
      ...prev,
      [dept]: fields,
    }));
  };

  const resetFields = () => {
    setSelectedFields({
      Booking: [],
      Operations: [],
      "Customer Service": [],
      Billing: [],
    });
  };

  const { server } = useContext(GlobalContext);

  const columns = [{ key: "awbNumber", label: "AWB Number" }];

  const fetchBookingData = async () => {
    const res = await fetch(`${server}/custom-reports/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: selectedFields.Booking,
      }),
    });

    const data = await res.json();
    // console.log("Result:", data);
  };

  return (
    <div>
      <div className="flex flex-col gap-3">
        <Heading
          title={`Custom Reports`}
          fullscreenBtn
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
        />

        <div className="flex gap-6">
          {/* Left Side */}
          <div className="w-1/3 p-4 bg-white h-[75vh] rounded-lg shadow-sm border-opacity-30 border-battleship-gray border-[1px]">
            <RedLabelHeading label="Select Date Fields to add in your Report" />

            <div className="flex flex-col mt-2">
              <LabeledDropdown
                setValue={setValue}
                register={register}
                value={`department`}
                options={[
                  "Booking",
                  "Operations",
                  "Customer Service",
                  "Billing",
                ]}
                title={`Department`}
              />
              {/* DYNAMIC ACCORDING TO DEPARTMENT */}

              {!department && (
                <div className="flex justify-center mt-6 items-center gap-2">
                  <div className="w-3 h-3 bg-red rounded-full" />
                  <span className="text-sm font-semibold">
                    Select a Department to get specific reports
                  </span>
                </div>
              )}

              {department === "Booking" && (
                <div className="rounded mt-6 h-[60vh] overflow-y-auto table-scrollbar">
                  <BookingSection
                    preSelectedFields={selectedFields.Booking}
                    onChange={(fields) => handleFieldChange("Booking", fields)}
                  />
                </div>
              )}

              {department === "Operations" && (
                <div className="rounded mt-6 h-[60vh] overflow-y-auto table-scrollbar">
                  <OperationsSection
                    preSelectedFields={selectedFields.Operations}
                    onChange={(fields) =>
                      handleFieldChange("Operations", fields)
                    }
                  />
                </div>
              )}

              {department === "Customer Service" && (
                <div className="rounded mt-6 h-[60vh] overflow-y-auto table-scrollbar">
                  <CustomerServiceSection
                    preSelectedFields={selectedFields["Customer Service"]}
                    onChange={(fields) =>
                      handleFieldChange("Customer Service", fields)
                    }
                  />
                </div>
              )}

              {department === "Billing" && (
                <div className="rounded mt-6 h-[60vh] overflow-y-auto table-scrollbar">
                  <BillingSection
                    preSelectedFields={selectedFields.Billing}
                    onChange={(fields) => handleFieldChange("Billing", fields)}
                  />
                </div>
              )}
            </div>
          </div>
          {/* Right Side */}
          <div className="w-2/3 bg-white h-[75vh] flex flex-col gap-4">
            {/* Selcted fileds card */}
            <div className="flex items-center justify-between p-4 border-opacity-30 rounded-lg shadow-sm border-battleship-gray border-[1px]">
              <div>
                <h2 className="font-semibold">Selected Fields</h2>
                <span className="font-extralight text-sm text-battleship-gray">
                  {allSelectedFields.length} Fields selected for your report
                </span>
              </div>

              <div className="h-8 w-8 bg-red rounded-md p-2 flex items-center justify-center text-sm text-white">
                {allSelectedFields.length}
              </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col gap-3">
              <RedLabelHeading label="Filters" />
              <div className="flex gap-6">
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
              <div className="flex gap-3">
                <LabeledDropdown
                  setValue={setValue}
                  register={register}
                  title="Sector"
                  value="sector"
                  options={["DEL"]}
                />
                <LabeledDropdown
                  setValue={setValue}
                  register={register}
                  title="Shipment Type"
                  value="shipmentType"
                  options={["abc"]}
                />
                <LabeledDropdown
                  setValue={setValue}
                  register={register}
                  title="Status"
                  value="status"
                  options={["DEL"]}
                />
              </div>
              <div className="w-full cursor-pointer bg-[#F2F2F2] rounded-lg flex justify-center items-center border-opacity-30 shadow-sm border-battleship-gray border-[1px] p-2">
                <button className=" flex justify-center items-center opacity-75 gap-2 text-sm tracking-wide">
                  <PlusIcon size={16} />
                  Add More Filters
                </button>
              </div>
            </div>

            {/* Reports Preview */}
            <div className="p-4 bg-white rounded-lg border-battleship-gray border-opacity-30 border-[1px] h-[60vh] shadow-sm">
              <RedLabelHeading label="Reports Preview" />
              <TableWithSorting
                setValue={setValue}
                register={register}
                columns={dynamicColumns}
                rowData={[]} // later you'll fill data here
                className={`h-[38vh] border-battleship-gray mt-4`}
              />
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="flex justify-end items-center gap-4">
          <div>
            <OutlinedButtonRed
              label={"Reset Fields"}
              type="button"
              buttonIcon
              onClick={resetFields}
            />
          </div>
          <div>
            <OutlinedButtonRed label={"Save Template"} type="button" saveIcon />
          </div>
          <div>
            <SimpleButton name={"Generate Report"} type="button" reportIcon />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomReports;
