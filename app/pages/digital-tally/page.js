"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useMemo, useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import PortalEntry from "@/app/components/digital-tally/PortalEntry";
import ManualEntry from "@/app/components/digital-tally/ManualEntry";

// import PortalEntryClientWise from "@/app/components/digital-tally/PortalEntryClientWise";
// import CDNumberWise from "@/app/components/digital-tally/CDNumberWise";

import axios from "axios";
import CodeList from "@/app/components/CodeList";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useAuth } from "@/app/Context/AuthContext";
import pushAWBLog from "@/app/lib/pushAWBLog";
import NotificationFlag from "@/app/components/Notificationflag";

const DigitalTally = () => {
  const {
    register,
    setValue,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm();
  const [demoRadio, setDemoRadio] = useState("Portal Entry");
  const [data, setData] = useState([]);
  const [dataUpdate, setDataUpdate] = useState(false);
  const { setToggleCodeList, server } = useContext(GlobalContext);
  const [selectedTally, setSelectedTally] = useState(null);
  const { user } = useAuth();
  const [loading, isLoading] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const getCustomerName = async (accountCode) => {
    try {
      if (!accountCode) return "";
      const customerResponse = await axios.get(
        `${server}/customer-account?accountCode=${accountCode}`
      );
      return customerResponse.data?.name || "";
    } catch (err) {
      console.warn("Failed to fetch customer name:", err);
      return "";
    }
  };

  const handleRadioChange = (value) => {
    setDemoRadio(value);
    setValue("entryType", value);
  };

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await axios.get(`${server}/customer-account`);
        console.log("customet data", response.data);
        if (response.status === 200) {
          console.log(response.data);
          setData(response.data);
        } else {
          console.error(
            "Failed to fetch entities:",
            response.status,
            response.statusText
          );
          // setData([]);
        }
      } catch (error) {
        console.error("Error fetching entities:", error);
        // setData([]);
      }
    };

    fetchBranch();
  }, [dataUpdate, demoRadio]);

  const onSubmit = async (formData) => {
    // ✅ Explicitly grab values from watch

    const combinedData = {
      ...formData,
      entryType: demoRadio,
      statusDate: watch("statusDate"),
      time: watch("time"),
      hubCode: watch("hubCode"),
      hubName: watch("hubName"),
      service: watch("service"),
      ConsigneeDetails: watch("ConsigneeDetails"),
      ConsignorDetails: watch("ConsignorDetails"),
    };

    console.log("📤 Sending to server:", combinedData);
    showNotification("success", "Saved successfully");

    try {
      // 1) Create DigitalTally entry
      isLoading(true);

      const response = await axios.post(
        `${server}/digital-tally`,
        combinedData
      );
      if (!response || !response.data) return; // nothing to do

      const resp = response.data;

      // 2) Resolve account code and AWB number
      const accountCode =
        resp.accountCode || resp.code || combinedData.accountCode || "";
      const awbNo =
        resp.mawbNumber ||
        resp.awbNo ||
        resp.mawb ||
        combinedData.mawbNumber ||
        combinedData.awbNo ||
        "";

      if (!awbNo || !accountCode) {
        // missing crucial data — skip AWB logging
        return;
      }

      // 3) Get customer name (best-effort)
      let customer = "";
      try {
        if (accountCode) customer = await getCustomerName(accountCode);
      } catch (e) {
        // ignore customer lookup failure and continue with empty customer
      }

      // 4) Push AWB log (may throw if hostname unavailable)
      try {
        await pushAWBLog({
          awbNo,
          accountCode,
          customer,
          action: "Digital Tally - Portal Entry",
          actionUser: user?.userId || "System",
        });
      } catch (err) {
        // don't break user flow if AWB logging fails (e.g. hostname not ready)
        console.error("AWB log failed:", err);
        showNotification("error", "AWB log failed");
      }
      console.log("📥 Received from server:", resp);
      isLoading(false);
      showNotification("success", "Saved successfully");
    } catch (error) {
      // creation of DigitalTally failed
      console.error("DigitalTally submit error:", error);
      showNotification("error", "DigitalTally submit error");
    }
  };

  const columns = useMemo(() => {
    const columnMapping = {
      "Customer Account": [
        { key: "accountCode", label: "Account Code" },
        { key: "name", label: "Name" },
      ],
    };

    return columnMapping["Customer Account"] || [];
  }, []);

  const handleAction = async (action, rowData) => {
    if (action === "edit") {
      setSelectedTally(rowData);
      setToggleCodeList(false);
      console.log(selectedTally);
      // Add your edit logic here
    } else if (action === "delete") {
      const { accountCode } = rowData; // ✅ Use accountCode (not code)

      if (!accountCode) {
        console.error("Account code not found in rowData. Cannot delete.");
        showNotification("error", "Account code not found");
        return;
      }

      try {
        console.log("Delete action triggered for accountCode:", accountCode);
        const response = await axios.delete(`${server}/customer-account`, {
          params: { code: accountCode }, // ✅ Send as ?code=... in query param
        });
        console.log("Deletion successful:", response.data);
        showNotification("success", "Deletion successful");
      } catch (error) {
        showNotification("error", "Deletion failed");
        console.error(
          "Error during deletion:",
          error.response?.data || error.message
        );
      } finally {
        setDataUpdate(!dataUpdate); // ✅ Refresh data after deletion
      }
    }
  };

  const handleRefresh = () => {
    setSelectedTally(null);
    setValue("entryType", "Portal Entry");
    setDataUpdate(!dataUpdate);

    setResetKey((prev) => prev + 1); // remount child
    Object.keys(watch()).forEach((field) => setValue(field, "")); // reset all inputs
  };

  return (
    <>
      {" "}
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <Heading
          title="Digital Tally"
          bulkUploadBtn="hidden"
          onRefresh={handleRefresh}
        />

        <div className="flex w-full gap-3">
          {["Portal Entry", "Manual Entry"].map((type) => (
            <RadioButtonLarge
              key={type}
              id={type}
              label={type}
              name="entryType"
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={handleRadioChange}
            />
          ))}
        </div>

        <input type="hidden" {...register("entryType")} value={demoRadio} />

        {/* Conditional Components */}
        {demoRadio === "Portal Entry" && (
          <PortalEntry
            key={resetKey}
            register={register}
            setValue={setValue}
            watch={watch}
            trigger={trigger}
            errors={errors}
            selectedTally={selectedTally}
            loading={loading}
            isLoading={isLoading}
          />
        )}
        {demoRadio === "Manual Entry" && (
          <ManualEntry
            register={register}
            setValue={setValue}
            watch={watch}
            trigger={trigger}
            errors={errors}
            key={resetKey}
            selectedTally={selectedTally}
            loading={loading}
            isLoading={isLoading}
          />
        )}

        <CodeList
          handleAction={handleAction}
          data={data}
          columns={columns}
          name={"Digital Tally"}
        />
      </form>
    </>
  );
};

export default DigitalTally;
