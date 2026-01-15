"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { X } from "lucide-react";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const ClubReport = () => {
  const { register, setValue, getValues } = useForm();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [resetFactor, setResetFactor] = useState(0);
  const [rowData, setRowData] = useState([]);
  const { server } = useContext(GlobalContext);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, visible: true });
  }, []);

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const columns = [
    { key: "awbNo", label: "Awb Number" },
    { key: "date", label: "Date" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "Destination" },
    { key: "shipperFullName", label: "Consignee Name" },
    { key: "clubNo", label: "Club Number" },
    { key: "bagNo", label: "Bag Number" },
    { key: "bag", label: "Bag Weight" },
    { key: "runNo", label: "Run Number" },
    { key: "alMawb", label: "Al Mawb Number" },
    { key: "forwarder", label: "Forwarder" },
    { key: "forwardingNo", label: "Forwarding Number" },
  ];

  const handleShow = async () => {
    try {
      const query = new URLSearchParams();
      const runNo = getValues("runNo");
      const clubNo = getValues("clubNo");
      const from = getValues("from");
      const to = getValues("to");

      if (!runNo && !clubNo && !from && !to) {
        showNotification("error", "Enter at least one filter");
        return;
      }

      if (runNo) query.append("runNo", runNo);
      if (clubNo) query.append("clubNo", clubNo);
      if (from) query.append("from", dmyToYmd(from));
      if (to) query.append("to", dmyToYmd(to));

      const res = await fetch(`${server}/club-report?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Fetch failed");

      setRowData(data.shipments || []);
      showNotification("success", "Data loaded successfully");
    } catch (err) {
      showNotification("error", err.message);
      setRowData([]);
    }
  };

  const handleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleRefresh = () => {
    setResetFactor((prev) => prev + 1);
    setRowData([]);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullScreen(false);
      if (e.key === "Enter") handleShow();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleShow]);

  const handleDownloadCSV = () => {
    if (!rowData.length) {
      showNotification("error", "No data to download");
      return;
    }

    // Create CSV header
    const headers = columns.map((col) => col.label).join(",");

    // Map rowData to CSV rows
    const rows = rowData.map((row) =>
      columns
        .map((col) => {
          let val = row[col.key];
          if (val === undefined || val === null) val = "";
          // Escape commas and quotes
          return `"${val.toString().replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `club_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`Club Report`}
        bulkUploadBtn="hidden"
        fullscreenBtn
        onClickFullscreenBtn={handleFullScreen}
        onRefresh={handleRefresh}
        codeListBtn="hidden"
      />
      <div className="flex gap-3 mt-5">
        <InputBox
          register={register}
          setValue={setValue}
          value={`runNo`}
          placeholder={`Run Number`}
          resetFactor={resetFactor}
        />
        <InputBox
          register={register}
          setValue={setValue}
          value={`clubNo`}
          placeholder={`Club Number`}
          resetFactor={resetFactor}
        />
        <DateInputBox
          register={register}
          setValue={setValue}
          value={`from`}
          placeholder="From"
          resetFactor={resetFactor}
        />
        <DateInputBox
          register={register}
          setValue={setValue}
          value={`to`}
          placeholder="To"
          resetFactor={resetFactor}
        />
        <div>
          <OutlinedButtonRed label={`Show`} onClick={handleShow} />
        </div>
        <div>
          <SimpleButton name={`Download CSV`} onClick={handleDownloadCSV} />
        </div>
      </div>

      <div>
        <TableWithSorting
          setValue={setValue}
          register={register}
          rowData={rowData}
          columns={columns}
          className={`h-[55vh]`}
        />
        {isFullScreen && (
          <div className="fixed inset-0 z-50 p-10 bg-white">
            <div className="flex justify-between items-center mb-2 mx-1">
              <Heading
                title={`Sales Details`}
                codeListBtn="hidden"
                bulkUploadBtn="hidden"
                refreshBtn="hidden"
              />
              <X
                onClick={() => setIsFullScreen(false)}
                className="cursor-pointer text-black"
              />
            </div>

            <div className="h-full mb-20">
              <TableWithSorting
                register={register}
                setValue={setValue}
                name="refShipper"
                columns={columns}
                rowData={rowData}
                className={"h-[85vh]"}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed label={`Close`} /> */}</div>
      </div>
    </div>
  );
};

export default ClubReport;
