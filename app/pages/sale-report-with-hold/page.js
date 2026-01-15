"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import SaleDetails from "@/app/components/sale-report-with-hold/SaleDetails";
import SaleSummary from "@/app/components/sale-report-with-hold/SaleSummary";
import { GlobalContext } from "@/app/lib/GlobalContext";
import CodeList from "@/app/components/CodeList";
import NotificationFlag from "@/app/components/Notificationflag";

function SaleReportWithHold() {
  const { register, setValue, reset } = useForm();
  const [demoRadio, setDemoRadio] = useState("Sale Details");
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { server } = useContext(GlobalContext);
  const [codeList, setCodeList] = useState([]);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };

  // Fetch customer codes for CodeList
  useEffect(() => {
    const fetchCodeList = async () => {
      try {
        const res = await fetch(`${server}/amount-log/customer`);
        const data = await res.json();
        setCodeList(data);
      } catch (err) {
        console.error("Failed to fetch customers", err);
        setCodeList([]);
      }
    };
    fetchCodeList();
  }, [server]);

  return (
    <div className="flex flex-col gap-4">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Sale Report (With Hold)"
        bulkUploadBtn="hidden"
        codeListBtn={true}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => setIsFullscreen(true)}
        onRefresh={handleRefresh}
      />
      {/* 🔹 Customer CodeList */}
      <CodeList
        data={codeList}
        handleAction={(item) => {
          setValue("accountCode", item.accountCode);
          setValue("customerName", item.name);
        }}
        columns={[
          { key: "accountCode", label: "Customer Code" },
          { key: "name", label: "Customer Name" },
        ]}
        name="Customer Code List"
      />

      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id="Sale Details"
          label="Sale Details"
          name="sale-report"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Sale Summary"
          label="Sale Summary"
          name="sale-report"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      {/* ✅ Conditionally render like in POAEntry */}
      {demoRadio === "Sale Details" && (
        <SaleDetails
          key={`details-${refreshKey}`}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      )}
      {demoRadio === "Sale Summary" && (
        <SaleSummary
          key={`summary-${refreshKey}`}
          isFullscreen={isFullscreen}
          setIsFullscreen={setIsFullscreen}
        />
      )}
    </div>
  );
}

export default SaleReportWithHold;
