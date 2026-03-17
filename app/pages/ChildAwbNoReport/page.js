"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

const ChildAwbNoReport = () => {
  const { register, setValue, handleSubmit, getValues } = useForm();
  const [rowData, setRowData] = useState([]);
  const [currDate, setCurrDate] = useState([]);
  const { server } = useContext(GlobalContext);

  const columns = [
    { key: "childAwbNo", label: "AWB No." },
    { key: "createdAt", label: "Shipment Date" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "Destination" },
    { key: "shipperName", label: "Consignor Name" },
    { key: "consigneeName", label: "Consignee Name" },
    { key: "bagWeight", label: "Bag Weight" },
    { key: "runNumber", label: "Run No." },
    { key: "bagNo", label: "Bag No." },
    { key: "alMawb", label: "AL MAWB No" },
    { key: "forwarder", label: "Forwarder" },
    { key: "forwardingNo", label: "Forwarding No" },
  ];

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Format createdAt before rendering
  const formattedData = rowData.map((row) => {
    let formattedDate = "";
    if (row.createdAt) {
      const d = new Date(row.createdAt);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      formattedDate = `${day}/${month}/${year}`;
    }

    return { ...row, createdAt: formattedDate };
  });

  const fetchData = async () => {
    const { runNumber, mawbNumber } = getValues();

    if (!runNumber && !mawbNumber) {
      showNotification("error", "Please enter Run Number or MAWB Number");
      return;
    }

    try {
      let finalData = [];

      if (runNumber && !mawbNumber) {
        // Fetch bagging data by run number
        const res = await axios.get(`${server}/bagging?runNo=${runNumber.toUpperCase()}`);
        const baggingData = res.data;

        if (!baggingData || !baggingData.rowData) {
          showNotification("error", "No data found for this run number");
          setRowData([]);
          return;
        }

        // Process each AWB in the bagging data
        for (const item of baggingData.rowData) {
          const awbNo = item.childShipment || item.awbNo;
          
          if (!awbNo) continue;

          try {
            // Fetch child shipment details
            const childRes = await axios.get(
              `${server}/portal/create-child?childAwbNo=${awbNo}`
            );
            
            const childData = childRes.data;

            // Fetch master shipment details
            let masterData = null;
            if (childData && childData.masterAwbNo) {
              try {
                const masterRes = await axios.get(
                  `${server}/bagging?awbNo=${childData.masterAwbNo}`
                );
                masterData = masterRes.data;
              } catch (err) {
                console.log("Master data not found:", err);
              }
            }

            finalData.push({
              childAwbNo: awbNo,
              createdAt: childData?.createdAt || baggingData.date || "",
              sector: masterData?.sector || baggingData.sector || "",
              destination: childData?.destination || masterData?.destination || "",
              shipperName: masterData?.shipperName || "",
              consigneeName: childData?.consigneeName || masterData?.consigneeName || "",
              bagWeight: item.bagWeight || "",
              runNumber: baggingData.runNo || runNumber,
              bagNo: item.bagNo || "",
              alMawb: baggingData.alMawb || "",
              forwarder: masterData?.forwarder || "",
              forwardingNo: item.forwardingNo || childData?.forwardingNo || "",
            });
          } catch (err) {
            console.error(`Error fetching details for AWB ${awbNo}:`, err);
            // Add basic info even if detailed fetch fails
            finalData.push({
              childAwbNo: awbNo,
              createdAt: baggingData.date || "",
              sector: baggingData.sector || "",
              destination: "",
              shipperName: "",
              consigneeName: "",
              bagWeight: item.bagWeight || "",
              runNumber: baggingData.runNo || runNumber,
              bagNo: item.bagNo || "",
              alMawb: baggingData.alMawb || "",
              forwarder: "",
              forwardingNo: item.forwardingNo || "",
            });
          }
        }
      } else if (!runNumber && mawbNumber) {
        // Fetch by MAWB number
        const res = await axios.get(
          `${server}/portal/create-child?masterAwbNo=${mawbNumber.toUpperCase()}`
        );
        const childShipments = Array.isArray(res.data) ? res.data : [res.data];

        for (const child of childShipments) {
          finalData.push({
            childAwbNo: child.childAwbNo || "",
            createdAt: child.createdAt || "",
            sector: child.sector || "",
            destination: child.destination || "",
            shipperName: child.shipperName || "",
            consigneeName: child.consigneeName || "",
            bagWeight: "",
            runNumber: "",
            bagNo: "",
            alMawb: mawbNumber,
            forwarder: "",
            forwardingNo: child.forwardingNo || "",
          });
        }
      } else if (runNumber && mawbNumber) {
        // Fetch by both - combine results
        const [baggingRes, childRes] = await Promise.all([
          axios.get(`${server}/bagging?runNo=${runNumber.toUpperCase()}`),
          axios.get(`${server}/portal/create-child?masterAwbNo=${mawbNumber.toUpperCase()}`),
        ]);

        const baggingData = baggingRes.data;
        const childShipments = Array.isArray(childRes.data) ? childRes.data : [childRes.data];

        // Process bagging data first
        if (baggingData && baggingData.rowData) {
          for (const item of baggingData.rowData) {
            const awbNo = item.childShipment || item.awbNo;
            
            if (!awbNo) continue;

            // Find matching child shipment
            const matchingChild = childShipments.find(
              child => child.childAwbNo === awbNo || child.masterAwbNo === awbNo
            );

            finalData.push({
              childAwbNo: awbNo,
              createdAt: matchingChild?.createdAt || baggingData.date || "",
              sector: baggingData.sector || matchingChild?.sector || "",
              destination: matchingChild?.destination || "",
              shipperName: matchingChild?.shipperName || "",
              consigneeName: matchingChild?.consigneeName || "",
              bagWeight: item.bagWeight || "",
              runNumber: baggingData.runNo || runNumber,
              bagNo: item.bagNo || "",
              alMawb: baggingData.alMawb || mawbNumber,
              forwarder: "",
              forwardingNo: item.forwardingNo || matchingChild?.forwardingNo || "",
            });
          }
        }
      }

      setRowData(finalData);
      
      if (finalData.length === 0) {
        showNotification("info", "No data found for the given criteria");
      } else {
        showNotification("success", `Found ${finalData.length} record(s)`);
      }

      console.log("Processed Data:", finalData);
    } catch (err) {
      console.error("Error fetching data:", err);
      showNotification("error", err.response?.data?.error || "Error fetching data");
      setRowData([]);
    }
  };

  const getDate = () => {
    const today = new Date();
    const formattedToday = today.toISOString().split("T")[0];

    const from = getValues("from");
    const to = getValues("to");

    console.log(from, to);
    setCurrDate([from, to]);

    if (!from) setValue("from", formattedToday);
    if (!to) setValue("to", formattedToday);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Tab" || event.key === "Enter") {
        getDate();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const csvHeaders = columns.map((col) => col.label).join(",");
    const csvRows = rowData.map((row) =>
      columns.map((col) => `"${row[col.key] || ""}"`).join(",")
    );
    const csvContent = [csvHeaders, ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "child-awb-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("success", "CSV downloaded successfully");
  };

  const onSubmit = (data) => {
    console.log("data :", data);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="flex flex-row gap-3 items-center">
        <Heading
          title="Child AWB No. Report"
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
        />
      </div>

      <div className="flex flex-row gap-3 mt-3">
        <InputBox
          placeholder="Run Number"
          register={register}
          setValue={setValue}
          value="runNumber"
        />
        <InputBox
          placeholder="MAWB Number"
          register={register}
          setValue={setValue}
          value="mawbNumber"
        />

        <DateInputBox
          placeholder="From"
          register={register}
          setValue={setValue}
          value="from"
          initialValue={currDate[0] || ""}
        />
        <DateInputBox
          placeholder="To"
          register={register}
          setValue={setValue}
          value="to"
          initialValue={currDate[1] || ""}
        />

        <div className="flex gap-2"> 
          <OutlinedButtonRed label="Show" onClick={fetchData} />
          <SimpleButton name="Download" onClick={handleDownloadCSV} />
        </div>
      </div>

      <TableWithSorting
        register={register}
        setValue={setValue}
        name="bagging"
        columns={columns}
        rowData={formattedData}
        className="h-[450px]"
      />

      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-3">
         
        </div>
      </div>
    </form>
  );
};

export default ChildAwbNoReport;