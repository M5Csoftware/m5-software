"use client";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { SimpleButton } from "@/app/components/Buttons";
import { MonthInput } from "@/app/components/MonthInput";
import LoaderAnimation from "@/app/components/Loader";
import NotificationFlag from "@/app/components/Notificationflag";
import Heading from "@/app/components/Heading";
import { downloadStateHSSB } from "../dashboard/HssbStates";

const HSSBStateWiseReport = () => {
  const { register, setValue, handleSubmit } = useForm();
  const { states, server } = useContext(GlobalContext);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  const onDownload = async (form) => {
    if (!form.state || !form.from || !form.to) {
      setNotification({
        visible: true,
        type: "error",
        message: "Please select state, from month and to month",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${server}/hssb-report/state?state=${form.state}&from=${form.from}&to=${form.to}`
      );
      const data = await res.json();

      if (!data || data.success === false) {
        throw new Error(data.message || "Failed to fetch report data");
      }

      downloadStateHSSB(data);
      setNotification({
        visible: true,
        type: "success",
        message: "Report downloaded successfully",
      });
    } catch (error) {
      console.error("Download failed:", error);
      setNotification({
        visible: true,
        type: "error",
        message: error.message || "Failed to download report",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setValue("state", "");
    setValue("from", "");
    setValue("to", "");
  };

  return (
    <div className="flex flex-col gap-9">
      <LoaderAnimation show={isLoading} />
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="HSSB State Wise Report"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="bg-seasalt border border-french-gray rounded-md p-5 flex flex-col gap-4">
        <form onSubmit={handleSubmit(onDownload)} className="flex flex-col">
          <div className="flex w-full gap-3 pb-2">
            <div className="flex w-full gap-3 items-end">
              {/* State Dropdown */}
              <div className="w-1/4">
                <LabeledDropdown
                  register={register}
                  setValue={setValue}
                  value="state"
                  title="Select State"
                  options={["All States", ...states.map((s) => s.name)]}
                />
              </div>

              {/* From Date */}
              <div className="w-1/4">
                <MonthInput
                  register={register}
                  setValue={setValue}
                  value="from"
                  placeholder="From"
                />
              </div>

              {/* To Date */}
              <div className="w-1/4">
                <MonthInput
                  register={register}
                  setValue={setValue}
                  value="to"
                  placeholder="To"
                />
              </div>

              <div className="w-1/4 pb-1">
                <SimpleButton name={isLoading ? "Downloading..." : "Download Report"} type="submit" disabled={isLoading} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HSSBStateWiseReport;
