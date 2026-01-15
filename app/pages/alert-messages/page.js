"use client";
import React, { useState, useContext, useEffect } from "react";
import Heading from "@/app/components/Heading";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { SimpleButton } from "@/app/components/Buttons";
import InputBox from "@/app/components/InputBox";
import { useForm } from "react-hook-form";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import CodeList from "@/app/components/CodeList";

export default function AlertMessages({ setCurrentView }) {
  const { server } = useContext(GlobalContext);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };
  const [resetFactor, setResetFactor] = useState(0);
  const [shipmentData, setShipmentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [listData, setListData] = useState([]);
  const { toggleCodeList } = useContext(GlobalContext);

  useEffect(() => {
    const fetchAllAlerts = async () => {
      try {
        const res = await axios.get(`${server}/alert-notif`);

        const filtered = (res.data || []).filter(
          (item) => item.notifType && item.notifType !== ""
        );

        setListData(filtered);
      } catch (err) {
        console.log(err);
      }
    };

    if (toggleCodeList) {
      fetchAllAlerts();
    }
  }, [toggleCodeList, server]);

  const columns = [
    { key: "awbNo", label: "AWB No" },
    { key: "notifType", label: "Status" },
  ];

  const handleAction = (action, row) => {
    if (action === "edit") {
      setValue("awbNo", row.awbNo);
      setValue("type", row.notifType);
      setValue("notifMsg", row.notifMsg || "");
    }
  };

  const {
    handleSubmit,
    register,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm({
    defaultValues: {
      awbNo: "",
      type: "Close",
      notifMsg: "",
    },
  });

  const awbNo = watch("awbNo");
  const notifType = watch("type");

  // Fetch AWB details when AWB number changes
  useEffect(() => {
    if (!awbNo || awbNo.trim().length < 4) {
      setShipmentData(null);
      setValue("notifMsg", "");
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(
          `${server}/alert-notif?awbNo=${awbNo.trim()}`
        );

        if (response.data.exists) {
          setShipmentData(response.data);
          setValue("type", response.data.notifType || "Close");
          setValue("notifMsg", response.data.notifMsg || "");
          showNotification("success", "AWB details fetched successfully");

          // show warning if open
          if (response.data.notifType === "Open" && response.data.notifMsg) {
            showNotification("warning", response.data.notifMsg);
          }
        }
      } catch (error) {
        if (error.response?.status === 404) {
          showNotification("error", "AWB not found in database");
          setShipmentData(null);
          setValue("type", "Close");
          setValue("notifMsg", "");
        } else {
          console.error("Error fetching AWB details:", error);
          showNotification("error", "Error fetching AWB details");
        }
      } finally {
        setIsLoading(false);
      }
    }, 600); // debounce delay

    return () => clearTimeout(timeoutId);
  }, [awbNo, server, setValue]);

  // Clear message when type is set to Close
  useEffect(() => {
    if (notifType === "Close") {
      setValue("notifMsg", "");
    }
  }, [notifType, setValue]);

  const onSubmit = async (data) => {
    try {
      if (!data.awbNo || data.awbNo.trim().length === 0) {
        showNotification("error", "Please enter AWB number");
        return;
      }

      if (data.type === "Open" && !data.notifMsg) {
        showNotification(
          "error",
          "Please enter notification message for Open type"
        );
        return;
      }

      setIsLoading(true);

      const payload = {
        awbNo: data.awbNo.trim().toUpperCase(),
        notifType: data.type,
        notifMsg: data.type === "Open" ? data.notifMsg : "",
      };

      const response = await axios.post(`${server}/alert-notif`, payload);

      if (response.status === 200) {
        showNotification("success", "Alert message saved successfully");
        setShipmentData(response.data);
      }
    } catch (error) {
      console.error("Error saving alert message:", error);
      if (error.response?.status === 404) {
        showNotification("error", "AWB not found in database");
      } else {
        showNotification(
          "error",
          error.response?.data?.error || "Error saving alert message"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    reset({
      awbNo: "",
      type: "Close",
      notifMsg: "",
    });
    setResetFactor((prev) => prev + 1);
    setShipmentData(null);
    showNotification("success", "Form refreshed");
  };

  return (
    <form
      autoComplete="off"
      className="flex flex-col gap-5"
      onSubmit={handleSubmit(onSubmit)}
    >
      <CodeList
        handleAction={handleAction}
        data={listData}
        columns={columns}
        name="Alert Messages"
      />

      <Heading
        title="Alert Messages"
        disabled={false}
        onRefresh={handleRefresh}
        bulkUploadBtn="hidden"
        codeListBtn
      />

      <div className="flex flex-col gap-3">
        <InputBox
          placeholder="AWB No."
          register={register}
          setValue={setValue}
          value="awbNo"
          resetFactor={resetFactor}
          error={errors.awbNo}
          trigger={trigger}
          validation={{
            required: "AWB Number is required",
            minLength: { value: 4, message: "Minimum 4 characters required" },
          }}
        />

        <LabeledDropdown
          options={["Open", "Close"]}
          value="type"
          title="Type"
          register={register}
          setValue={setValue}
          resetFactor={resetFactor}
          defaultValue="Close"
        />

        {notifType === "Open" && (
          <InputBox
            placeholder="Notification Message"
            register={register}
            setValue={setValue}
            value="notifMsg"
            error={errors.notifMsg}
            trigger={trigger}
            validation={{
              required:
                notifType === "Open"
                  ? "Message is required for Open type"
                  : false,
            }}
          />
        )}

        {shipmentData && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <p className="font-semibold text-blue-800 mb-1">Current Status:</p>
            <p className="text-blue-700">
              AWB: {shipmentData.awbNo} - Type: {shipmentData.notifType}
            </p>
            {shipmentData.notifMsg && (
              <p className="text-blue-700 mt-1">
                Message: {shipmentData.notifMsg}
              </p>
            )}
          </div>
        )}

        <NotificationFlag
          type={notification.type}
          message={notification.message}
          visible={notification.visible}
          setVisible={(visible) =>
            setNotification((prev) => ({ ...prev, visible }))
          }
        />

        <div className="flex justify-end">
          <div className="flex gap-2">
            <SimpleButton
              type="submit"
              name={isLoading ? "Saving..." : "Submit"}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
