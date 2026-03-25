"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { jsPDF } from "jspdf";
import { RedLabelHeading } from "../Heading";
import InputBox, { DateInputBox } from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import NotificationFlag from "@/app/components/Notificationflag";

const server = "https://m5c-server.vercel.app/api/portal/get-shipments";

const Poa = () => {
  const { register, setValue, watch, reset } = useForm();
  const [awbFound, setAwbFound] = useState(false);
  const [receiverName, setReceiverName] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const airwaybillNumber = watch("airwaybillNumber");
  const date = watch("date");

  // ✅ FIX: Handle all common date formats robustly
  const formatDate = (dateStr) => {
    if (!dateStr) return "";

    // Format: YYYY-MM-DD  →  DD/MM/YYYY
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-");
      return `${day}/${month}/${year}`;
    }

    // Format: DD/MM/YYYY  →  already correct
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      return dateStr;
    }

    // Format: MM/DD/YYYY  →  DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [month, day, year] = dateStr.split("/");
      return `${day}/${month}/${year}`;
    }

    // Format: YYYYMMDD  →  DD/MM/YYYY
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      return `${day}/${month}/${year}`;
    }

    // Fallback: use UTC methods to avoid timezone shift
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }

    return "";
  };

  const handleClose = () => {
    reset({ airwaybillNumber: "", date: "" });
    setAwbFound(false);
    setReceiverName("");
    setPdfUrl("");
    showNotification("success", "Cleared");
  };

  // ===== AWB Lookup =====
  useEffect(() => {
    const checkAwb = async () => {
      if (!airwaybillNumber || airwaybillNumber.length < 3) {
        setAwbFound(false);
        setReceiverName("");
        setPdfUrl("");
        return;
      }

      try {
        const res = await axios.get(server, {
          params: { awbNo: airwaybillNumber },
        });

        if (res.data?.shipment) {
          if (!awbFound) showNotification("success", "AWB found");
          setAwbFound(true);
          setReceiverName(res.data.shipment.receiverFullName || "____________");
        } else {
          if (awbFound) showNotification("error", "AWB not found");
          setAwbFound(false);
          setReceiverName("");
          setPdfUrl("");
        }
      } catch (err) {
        console.error(err);
        showNotification("error", "Error checking AWB");
        setAwbFound(false);
        setReceiverName("");
        setPdfUrl("");
      }
    };

    const timeout = setTimeout(checkAwb, 500);
    return () => clearTimeout(timeout);
  }, [airwaybillNumber]);

  useEffect(() => {
    if (!date) {
      setPdfUrl("");
    }
  }, [date]);

  const buildPdfDoc = () => {
    console.log("📅 date value from form:", date); // ← check this in browser console
    const formattedDate = formatDate(date);
    console.log("📅 formatted date:", formattedDate);
    const doc = new jsPDF();
    doc.setFontSize(12);

    doc.text("The Superintendent,", 20, 20);
    doc.text("Canada Border Services Agency,", 20, 30);
    doc.text("Vancouver International Airport,", 20, 40);
    doc.text("Vancouver BC.", 20, 50);
    doc.text(`Subject: CCN: 80KT${airwaybillNumber}`, 20, 70);

    doc.text(
      "Kindly refer to the subject cited above. It is submitted that I do hereby authorize ATG CUSTOMS BROKERS INC. to transact business on my behalf with CBSA.",
      20,
      90,
      { maxWidth: 170 },
    );

    doc.text(
      "I declare that this is my personal shipment and this does not have anything for sale. This is a personal shipment with items for personal and family use and neither for sale nor for any commercial activity.",
      20,
      110,
      { maxWidth: 170 },
    );

    doc.text("Thank you for your cooperation.", 20, 140);
    doc.text("Regards,", 20, 160);
    doc.text(`Name - ${receiverName}`, 20, 170);
    doc.text(`Date - ${formattedDate}`, 20, 180);

    return doc;
  };

  // ===== Generate PDF Preview =====
  const handleGeneratePDF = () => {
    if (!awbFound) return showNotification("error", "AWB not verified");
    if (!date) return showNotification("error", "Please enter a date");

    const doc = buildPdfDoc();
    const pdfDataUri = doc.output("datauristring");
    setPdfUrl(pdfDataUri);

    showNotification("success", "PDF preview generated");
  };

  // ===== Download PDF =====
  const handleDownloadPDF = () => {
    if (!awbFound) return showNotification("error", "AWB not verified");
    if (!date) return showNotification("error", "Please enter a date");

    const doc = buildPdfDoc();
    doc.save(`POA_${airwaybillNumber}.pdf`);

    showNotification("success", "PDF downloaded");
  };

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      {/* Search Form */}
      <div className="flex flex-col gap-3">
        <RedLabelHeading label="Search Airwaybills" />
        <div className="flex gap-2">
          <div className="w-full flex gap-2">
            <InputBox
              placeholder="Airwaybill Number"
              register={register}
              setValue={setValue}
              value="airwaybillNumber"
            />
            <DateInputBox
              placeholder="Date"
              register={register}
              setValue={setValue}
              value="date"
            />
          </div>
          <div>
            <OutlinedButtonRed label="Create" onClick={handleGeneratePDF} />
          </div>
          <div>
            <SimpleButton
              name="Download PDF"
              onClick={handleDownloadPDF}
              disabled={!awbFound}
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-3">
        <RedLabelHeading label="Preview" />
        <div className="bg-white w-full h-[412px] border border-[#D0D5DD] rounded-md flex items-center justify-center overflow-hidden">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="PDF Preview"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          ) : (
            <span className="text-gray-400">
              {awbFound
                ? `Ready to generate PDF for ${airwaybillNumber}`
                : "Entered AWB not verified"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Poa;
