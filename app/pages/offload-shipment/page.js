"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import AwbWise from "@/app/components/offload-shipment/AwbWise";
import RunWise from "@/app/components/offload-shipment/RunWise";
import Modal from "@/app/components/Modal";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DateInputBox } from "@/app/components/InputBox";
import { SimpleButton } from "@/app/components/Buttons";

function OffloadShipment() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("AWB Wise");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };
  const dateFilters = [
    { label: "This Month", value: "this_month" },
    { label: "Date Wise", value: "date_wise" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "Month Name", value: "month_name" }, // can be implemented later
    { label: "Last Financial Year", value: "last_fy" },
    { label: "Custom", value: "custom" },
  ];

  return (
    <div className="flex flex-col gap-9">
      <Heading
        title="Offload Shipment"
        bulkUploadBtn="hidden"
        tableReportBtn
        codeListBtn="hidden"
        fullscreenBtn={false}
        onRefresh={handleRefresh}
        onClickTableReportBtn={() => setShowDownloadModal(true)}
      />

      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id="AWB Wise"
          label="AWB Wise"
          name="offload-shipment"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Run Wise"
          label="Run Wise"
          name="offload-shipment"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>
      {showDownloadModal && (
        <Modal
          title="Offload Shipment Report"
          onClose={() => setShowDownloadModal(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-end">

              <LabeledDropdown
                options={dateFilters.map((option) => option.label)}
                register={register}
                setValue={setValue}
                title="Date Range"
                value="dateRange"
              />

              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                value="fromDate"
              />

              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                value="toDate"
              />
              <div>
                <SimpleButton
                  name="Download"
                  type="button"
                //   onClick={handleDownload}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
      {demoRadio === "AWB Wise" && <AwbWise key={`details-${refreshKey}`} />}
      {demoRadio === "Run Wise" && <RunWise key={`summary-${refreshKey}`} />}
    </div>
  );
}

export default OffloadShipment;
