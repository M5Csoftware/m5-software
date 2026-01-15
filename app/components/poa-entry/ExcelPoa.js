"use client";

import React, { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { RedLabelHeading } from "../Heading";
import InputBox, { DateInputBox } from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { TableWithSorting } from "../Table";
import NotificationFlag from "@/app/components/Notificationflag";

const ExcelPoa = () => {
  const { register, setValue, watch } = useForm({
    defaultValues: { excelPath: "", date: "" },
  });

  const [fileName, setFileName] = useState("");
  const [rowData, setRowData] = useState([]);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const fileInputRef = useRef(null);
  const watchedDate = watch("date", "");

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "shipmentDate", label: "Shipment Date" },
    { key: "consigneeName", label: "Consignee Name" },
  ];

  const handleBrowseClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Convert row headings dynamically
  const mapRow = (rawRow, currentDate) => {
    const norm = {};
    Object.keys(rawRow).forEach((k) => {
      const nk = k
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      norm[nk] = rawRow[k];
    });

    const awb = (
      [
        rawRow["AWB No."],
        rawRow["AWB No"],
        rawRow["awbNo"],
        rawRow["awb"],
        norm["awbno"],
        norm["airwaybill"],
        norm["airwaybillno"],
        norm["airwaybillnumber"],
        norm["awb"],
      ].find((v) => v) || ""
    )
      .toString()
      .trim();

    const consignee = (
      [
        rawRow["Consignee Name"],
        rawRow["Consignee"],
        rawRow["consigneeName"],
        norm["consigneename"],
        norm["consignee"],
        norm["receivername"],
        norm["receiver"],
        norm["name"],
      ].find((v) => v) || ""
    )
      .toString()
      .trim();

    return {
      awbNo: awb,
      shipmentDate: currentDate || "",
      consigneeName: consignee,
    };
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (
      !name.endsWith(".csv") &&
      !name.endsWith(".xls") &&
      !name.endsWith(".xlsx")
    ) {
      showNotification("error", "Select a valid CSV or Excel file");
      return;
    }

    setFileName(file.name);
    setValue("excelPath", file.name, { shouldDirty: true, shouldTouch: true });

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const arrayBuffer = ev.target.result;
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const mapped = json
          .map((row) => mapRow(row, formatDate(watchedDate)))
          .filter((r) => r.awbNo !== "");

        setRowData(mapped);
        showNotification("success", "File loaded successfully");
      } catch (err) {
        console.error(err);
        showNotification("error", "Invalid or unreadable Excel file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Update dates across rows
  useEffect(() => {
    if (watchedDate && rowData.length > 0) {
      setRowData((prev) =>
        prev.map((row) => ({
          ...row,
          shipmentDate: formatDate(watchedDate),
        }))
      );
      showNotification("success", "Date applied to all rows");
    }
  }, [watchedDate]);

  // Create PDFs (internal state)
  const handleCreate = () => {
    if (!rowData.length) {
      showNotification("error", "No rows to generate PDFs");
      return;
    }

    setPdfGenerated(true);
    setShowPopup(true);
    showNotification("success", "PDFs created");
  };

  // Generate individual PDF
  const generateLetterPDF = (awb) => {
    const doc = new jsPDF();
    doc.setFontSize(12);

    doc.text("The Superintendent,", 20, 20);
    doc.text("Canada Border Services Agency,", 20, 30);
    doc.text("Vancouver International Airport,", 20, 40);
    doc.text("Vancouver BC.", 20, 50);
    doc.text(`Subject: CCN: 80KT${awb.awbNo}`, 20, 70);

    doc.text(
      "Kindly refer to the subject cited above. It is submitted that I do hereby authorize ATG CUSTOMS BROKERS INC. to transact business on my behalf with CBSA.",
      20,
      90,
      { maxWidth: 170 }
    );

    doc.text(
      "I declare that this is my personal shipment and this does not have anything for sale. This is a personal shipment with items for personal and family use and neither for sale nor for any commercial activity.",
      20,
      110,
      { maxWidth: 170 }
    );

    doc.text("Thank you for your cooperation.", 20, 140);
    doc.text("Regards,", 20, 160);
    doc.text(`Name - ${awb.consigneeName || "____________"}`, 20, 170);
    doc.text(`Date - ${awb.shipmentDate || "____/__/____"}`, 20, 180);

    return doc.output("blob");
  };

  // Download ZIP
  const handleDownloadAllPDFs = async () => {
    if (!pdfGenerated) {
      showNotification("error", "Generate PDFs before downloading");
      return;
    }
    if (rowData.length === 0) {
      showNotification("error", "No rows available");
      return;
    }

    const zip = new JSZip();
    rowData.forEach((awb) => {
      zip.file(`POA_${awb.awbNo}.pdf`, generateLetterPDF(awb));
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `POAs_${fileName.replace(/\.[^/.]+$/, "")}.zip`);
    showNotification("success", "ZIP downloaded successfully");
  };

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      {/* Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 cursor-pointer"
          onClick={() => setShowPopup(false)}
        >
          <div className="bg-green-500 text-white px-6 py-3 rounded shadow">
            PDFs ready! (Click to dismiss)
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <RedLabelHeading label="Search Airwaybills" />
        <div className="flex gap-2">
          <div className="w-full flex gap-2">
            {/* File box */}
            <div className="relative w-full">
              <input
                type="text"
                value={fileName}
                readOnly
                placeholder="Excel Path"
                className="border border-[#979797] outline-none bg-gray-100 rounded-md h-10 px-4 pr-8 w-full cursor-default"
              />
              {fileName && (
                <button
                  type="button"
                  onClick={() => {
                    setFileName("");
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    setValue("excelPath", "");
                    setRowData([]);
                    showNotification("success", "File cleared");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 font-bold hover:text-red-700"
                >
                  ×
                </button>
              )}
            </div>

            <DateInputBox
              placeholder="Date"
              register={register}
              setValue={setValue}
              value="date"
            />
          </div>

          <div className="flex gap-2">
            <div className="w-[144px]">
              <OutlinedButtonRed label="Browse" onClick={handleBrowseClick} />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xls, .xlsx"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            <div className="w-[144px]">
              <SimpleButton name="Create" onClick={handleCreate} />
            </div>

            <div>
              <SimpleButton
                name="Download ZIP"
                onClick={handleDownloadAllPDFs}
              />
            </div>
          </div>
        </div>
      </div>

      <TableWithSorting
        register={register}
        setValue={setValue}
        name="ExcelPoa"
        columns={columns}
        rowData={rowData}
      />
    </div>
  );
};

export default ExcelPoa;
