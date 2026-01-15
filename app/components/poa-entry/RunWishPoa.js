"use client";

import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { RedLabelHeading } from "../Heading";
import InputBox, { DateInputBox } from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import NotificationFlag from "@/app/components/Notificationflag";

const PoaRunAWB = () => {
  const { server } = useContext(GlobalContext);

  const { register, setValue, watch, reset } = useForm({
    defaultValues: { runNumber: "", date: "" },
  });

  const [runFound, setRunFound] = useState(false);
  const [awbList, setAwbList] = useState([]);
  const [pdfUrls, setPdfUrls] = useState({});

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const runNumber = watch("runNumber");
  const date = watch("date");

  const formatDate = (dateVal) => {
    if (!dateVal) return "";

    // Case 1: Date object
    if (dateVal instanceof Date && !isNaN(dateVal)) {
      const dd = String(dateVal.getDate()).padStart(2, "0");
      const mm = String(dateVal.getMonth() + 1).padStart(2, "0");
      const yyyy = dateVal.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }

    // Case 2: MM/DD/YYYY string
    if (typeof dateVal === "string" && dateVal.includes("/")) {
      const [mm, dd, yyyy] = dateVal.split("/");
      if (!mm || !dd || !yyyy) return "";
      return `${dd}/${mm}/${yyyy}`;
    }

    // Case 3: YYYY-MM-DD string
    if (typeof dateVal === "string" && dateVal.includes("-")) {
      const [yyyy, mm, dd] = dateVal.split("-");
      if (!yyyy || !mm || !dd) return "";
      return `${dd}/${mm}/${yyyy}`;
    }

    return "";
  };

  const handleClose = () => {
    reset();
    setRunFound(false);
    setAwbList([]);
    setPdfUrls({});
    showNotification("success", "Cleared");
  };

  // Fetch AWBs for Run No
  useEffect(() => {
    const fetchAWBs = async () => {
      if (!runNumber || runNumber.length < 3) {
        setRunFound(false);
        setAwbList([]);
        setPdfUrls({});
        return;
      }

      try {
        const res = await axios.get(`${server}/portal/get-shipments`, {
          params: { runNo: runNumber },
        });

        if (res.data?.shipments?.length > 0) {
          setRunFound(true);
          setAwbList(res.data.shipments);

          showNotification(
            "success",
            `Found ${res.data.shipments.length} AWBs for Run No ${runNumber}`
          );
        } else {
          setRunFound(false);
          setAwbList([]);
          setPdfUrls({});
          showNotification("error", "Run No not found");
        }
      } catch (err) {
        console.error(err);
        setRunFound(false);
        setAwbList([]);
        setPdfUrls({});
        showNotification("error", "Error fetching AWBs");
      }
    };

    const timeout = setTimeout(fetchAWBs, 500);
    return () => clearTimeout(timeout);
  }, [runNumber, server]);

  useEffect(() => {
    if (!date) setPdfUrls({});
  }, [date]);

  // Create PDF for one AWB
  const generatePDF = (awb) => {
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
    doc.text(`Name - ${awb.receiverFullName || "____________"}`, 20, 170);
    doc.text(`Date - ${formatDate(date)}`, 20, 180);

    return doc.output("blob");
  };

  // Preview PDF
  const handleGeneratePDFs = () => {
    if (!runFound || awbList.length === 0)
      return showNotification("error", "No AWBs available");

    if (!date) return showNotification("error", "Enter a date");

    const first = awbList[0];
    const blob = generatePDF(first);
    const url = URL.createObjectURL(blob);

    setPdfUrls({ [first.awbNo]: url });

    showNotification("success", "Preview generated");
  };

  // Download ZIP
  const handleDownloadAllPDFs = async () => {
    if (!runFound || awbList.length === 0)
      return showNotification("error", "No AWBs available");

    if (!date) return showNotification("error", "Enter a date");

    const zip = new JSZip();

    awbList.forEach((awb) => {
      const blob = generatePDF(awb);
      zip.file(`POA_${awb.awbNo}.pdf`, blob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, `POAs_RunNo_${runNumber}.zip`);

    showNotification("success", "ZIP downloaded");
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
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              value="runNumber"
            />

            <DateInputBox
              placeholder="Date"
              register={register}
              setValue={setValue}
              value="date"
            />
          </div>

          <div>
            <OutlinedButtonRed label="Create" onClick={handleGeneratePDFs} />
          </div>

          <div>
            <SimpleButton
              name="Download All PDFs"
              onClick={handleDownloadAllPDFs}
              disabled={
                !runFound || awbList.length === 0 || !pdfUrls[awbList[0]?.awbNo]
              }
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="flex flex-col gap-3">
        <RedLabelHeading label="Preview" />

        <div className="bg-white w-full h-[412px] border border-[#D0D5DD] rounded-md flex items-center justify-center overflow-hidden">
          {pdfUrls && awbList.length > 0 && pdfUrls[awbList[0].awbNo] ? (
            <iframe
              src={pdfUrls[awbList[0].awbNo]}
              width="100%"
              height="100%"
              title="PDF Preview"
              style={{ border: "none" }}
            />
          ) : (
            <span className="text-gray-400">
              {runFound
                ? `Click "Create" to preview PDFs for ${awbList.length} AWBs`
                : "Enter a valid Run No"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoaRunAWB;
