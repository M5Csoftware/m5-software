"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { RedCheckbox } from "@/app/components/Checkbox";

const CsbVReport = () => {
  const { register, setValue } = useForm();

  const [tableData] = useState([]);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };
  const [isChecked, setChecked] = useState(false);

  // Table columns
  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "date", label: "Shipment Date" },
      { key: "branch", label: "Branch" },
      { key: "origin", label: "Origin" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "accountCode", label: "Customer Code" },
      { key: "name", label: "Customer Name" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "receiverAddressLine1", label: "Consignee Address" },
      { key: "pcs", label: "PCS" },
      { key: "goodstype", label: "Goods Description" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "content", label: "Shipment Content" },
      { key: "shipmentRemark", label: "Shipment Remark" },
    ],
    []
  );

  const handleShow = () => {
    // Show logic will be added here
    console.log("Show button clicked");
    showNotification("success", "Data loaded successfully");
  };

  const handleDownload = () => {
    // Download logic will be added here
    console.log("Download button clicked");
  };

  const handleClose = () => {
    setValue("branch", "");
    setValue("origin", "");
    setValue("sector", "");
    setValue("destination", "");
    setValue("code", "");
    setValue("name", "");
    setValue("from", "");
    setValue("to", "");
  };

  return (
    <form className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading title="CSB V Report" bulkUploadBtn="hidden" codeListBtn />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-4 mt-3">
          {/* First Row - Run No */}
          <InputBox
            placeholder="Run No."
            register={register}
            setValue={setValue}
            value="runNo"
          />

          {/* Second Row - Branch, Origin, Sector, Destination */}
          <div className="flex gap-3">
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              value="branch"
            />
            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              value="origin"
            />
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

          {/* Third Row - Code, Customer Name, From Date, To Date, Show Button */}
          <div className="flex gap-3 w-full items-end">
            <div className="flex gap-3 flex-1">
              <div className="w-[27%]">
                <InputBox
                  placeholder="Code"
                  register={register}
                  setValue={setValue}
                  value="code"
                />
              </div>
              <div className="w-[69%]">
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Customer Name"
                  setValue={setValue}
                  value="name"
                />
              </div>
              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                value="from"
                type="date"
              />
              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                value="to"
                type="date"
              />
            </div>
            
            <div className="flex gap-3 w-[24%]">
              <OutlinedButtonRed
                label="Show"
                onClick={handleShow}
                type="button"
              />
              <SimpleButton
                name="Download"
                onClick={handleDownload}
                type="button"
              />
            </div>
          </div>
        </div>

        <RedCheckbox
          label="Balance Shipment"
          isChecked={isChecked}
          setChecked={setChecked}
          id="balanceShipment"
          register={register}
          setValue={setValue}
        />

        {/* Data Table */}
        <div className="flex flex-col gap-4">
          <div>
            <TableWithSorting
              columns={columns}
              rowData={tableData}
              register={register}
              setValue={setValue}
              name="csbVReport"
              className="h-[45vh]"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div>
            {/* <OutlinedButtonRed
              label="Close"
              onClick={handleClose}
              type="button"
            /> */}
          </div>
        </div>
      </div>
    </form>
  );
};

export default CsbVReport;