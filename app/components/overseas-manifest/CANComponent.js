"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import SearchAndReplace from "@/app/components/SearchAndReplace";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useContext, useRef } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { FiUpload, FiDownload, FiFileText, FiSave } from "react-icons/fi";
import JsBarcode from "jsbarcode";
import html2canvas from "html2canvas";

const CANComponent = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();
  const [manifestRows, setManifestRows] = useState([]);
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [activeTable, setActiveTable] = useState("manifest");
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [runInfo, setRunInfo] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState("");
  const [showAirportModal, setShowAirportModal] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [manifestPdfLoading, setManifestPdfLoading] = useState(false);
  const [invoicePdfLoading, setInvoicePdfLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const fileInputRef = useRef(null);

  // Track if data has been modified via search/replace
  const [manifestModified, setManifestModified] = useState(false);
  const [invoiceModified, setInvoiceModified] = useState(false);
  const [manifestLoading, setManifestLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const runNo = watch("runNo");

  const columnsCAN = [
    { key: "awbNo", label: "AWB No" },
    { key: "shipperName", label: "Shipper Name" },
    { key: "recieverName", label: "Consignee Name" },
    { key: "description", label: "Description" },
    { key: "destination", label: "Destination" },
    { key: "pcs", label: "Pcs" },
    { key: "weight", label: "Weight" },
    { key: "weightForValue", label: "Weight For Value" },
    { key: "rateRequired", label: "Rate Required" },
    { key: "valueRequired", label: "Value Required" },
    { key: "roundOffRemove", label: "Round Off Remove" },
    { key: "finalValue", label: "Final Value" },
    { key: "crossCheck", label: "Cross Check" },
  ];

  const invoiceColumns = [
    { key: "awbNo", label: "AWB No" },
    { key: "box", label: "Box" },
    { key: "description", label: "Description" },
    { key: "hsn", label: "HSN" },
    { key: "qty", label: "QTY" },
    { key: "rate", label: "Rate" },
    { key: "amt", label: "Amount" },
    { key: "customValue", label: "Custom Value" },
    { key: "customCurrency", label: "Currency" },
  ];

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Handle data update from SearchAndReplace component
  const handleDataUpdate = (updatedData) => {
    if (activeTable === "manifest") {
      setManifestRows(updatedData);
      setManifestModified(true);
    } else {
      setInvoiceRows(updatedData);
      setInvoiceModified(true);
    }
  };

  // Handle individual replacements
  const handleReplace = (oldValue, newValue, location) => {
    showNotification(
      "success",
      `Replaced "${oldValue}" with "${newValue}" in row ${
        location.rowIndex + 1
      }, ${location.columnLabel}`,
    );
  };

  // Get current columns based on active table
  const getCurrentColumns = () => {
    return activeTable === "manifest" ? columnsCAN : invoiceColumns;
  };

  // Get current rows based on active table
  const getCurrentRows = () => {
    return activeTable === "manifest" ? manifestRows : invoiceRows;
  };

  // Save data function
  const handleSaveData = async (dataType) => {
    if (!runNo || runNo.trim() === "") {
      showNotification("error", "Please enter a Run Number");
      return;
    }

    const dataToSave = dataType === "manifest" ? manifestRows : invoiceRows;

    if (dataToSave.length === 0) {
      showNotification("error", `No ${dataType} data to save`);
      return;
    }

    setSaveLoading(true);

    try {
      // Remove 80KT prefix before saving and remove id field
      const processedData = dataToSave.map((row) => {
        const processedRow = { ...row };
        if (processedRow.awbNo && processedRow.awbNo.startsWith("80KT")) {
          processedRow.awbNo = processedRow.awbNo.substring(4);
        }
        delete processedRow.id;
        return processedRow;
      });

      const endpoint = `${server}/overseas-manifest/can/duplicate-data`;
      const response = await axios.post(endpoint, {
        runNo,
        dataType,
        data: processedData,
        runInfo,
        modifiedBy: "user",
      });

      if (response.data.success) {
        showNotification("success", response.data.message);

        // Reset modification flag
        if (dataType === "manifest") {
          setManifestModified(false);
        } else {
          setInvoiceModified(false);
        }
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to save data",
        );
      }
    } catch (error) {
      console.error("Error saving data:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to save data",
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShow = async () => {
    if (!runNo || runNo.trim() === "") {
      showNotification("error", "Please enter a Run Number");
      return;
    }

    setManifestLoading(true);
    setManifestRows([]);
    setInvoiceRows([]);
    setInvoiceData(null);
    setRunInfo(null);
    setActiveTable("manifest");
    setManifestModified(false);

    try {
      const endpoint = `${server}/overseas-manifest/can?runNo=${runNo}`;
      const response = await axios.get(endpoint);

      if (response.data.success) {
        const fetchedData = response.data.data || [];
        const processedData = fetchedData.map((row, index) => ({
          ...row,
          id: index + 1,
          awbNo: row.awbNo ? `80KT${row.awbNo}` : row.awbNo,
        }));

        setManifestRows(processedData);
        setRunInfo(response.data.runInfo);
        showNotification(
          "success",
          `Found ${response.data.count} records for manifest`,
        );
      } else {
        showNotification(
          "error",
          response.data.message || "No manifest data found",
        );
        setManifestRows([]);
        setRunInfo(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch manifest data",
      );
      setManifestRows([]);
      setRunInfo(null);
    } finally {
      setManifestLoading(false);
    }
  };

  const handleShowInvoice = async () => {
    if (!runNo || runNo.trim() === "") {
      showNotification("error", "Please enter a Run Number");
      return;
    }

    setInvoiceLoading(true);
    setActiveTable("invoice");
    setInvoiceModified(false);

    try {
      const endpoint = `${server}/overseas-manifest/can/invoice?runNo=${runNo}`;
      const response = await axios.get(endpoint);

      if (response.data.success) {
        const finalInvoiceData = response.data.data.finalInvoice || [];

        const formattedInvoiceData = finalInvoiceData.map((item, index) => ({
          ...item,
          id: index + 1,
          awbNo: item.awbNo || "",
          box: item.box || "-",
          description: item.description || "",
          hsn: item.hsn || "",
          qty: item.qty || 0,
          rate: parseFloat(item.rate || 0).toFixed(2),
          amt: parseFloat(item.amt || 0).toFixed(2),
          customValue: parseFloat(item.customValue || 0).toFixed(2),
          customCurrency: item.customCurrency || "CAD",
        }));

        setInvoiceRows(formattedInvoiceData);
        setInvoiceData(response.data.data);
        setRunInfo(response.data.runInfo);
        showNotification(
          "success",
          `Found ${finalInvoiceData.length} invoice items`,
        );
      } else {
        showNotification(
          "error",
          response.data.message || "No invoice data found",
        );
        setInvoiceRows([]);
        setInvoiceData(null);
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch invoice data",
      );
      setInvoiceRows([]);
      setInvoiceData(null);
    } finally {
      setInvoiceLoading(false);
    }
  };

  // Function to generate MANIFEST PDF
  const handleGenerateManifestPDF = async () => {
    if (manifestRows.length === 0) {
      showNotification(
        "error",
        "No manifest data to generate PDF. Please load manifest data first.",
      );
      return;
    }

    setManifestPdfLoading(true);

    try {
      const contentDiv = document.createElement("div");
      contentDiv.className = "text-[10px] leading-tight p-4 bg-white w-full";
      contentDiv.style.position = "absolute";
      contentDiv.style.left = "-9999px";
      contentDiv.style.top = "0";
      contentDiv.style.width = "800px";
      contentDiv.style.fontFamily = "Arial, sans-serif";

      let tableRowsHTML = "";
      manifestRows.forEach((row, idx) => {
        const awbNo =
          row.awbNo && !row.awbNo.startsWith("80KT")
            ? `80KT${row.awbNo}`
            : row.awbNo;

        let barcodeSVG = "";
        if (awbNo) {
          try {
            const tempDiv = document.createElement("div");
            tempDiv.style.display = "none";
            document.body.appendChild(tempDiv);

            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("id", `temp-barcode-${idx}`);
            svg.setAttribute("height", "25");
            svg.setAttribute("width", "120");
            tempDiv.appendChild(svg);

            JsBarcode(svg, awbNo, {
              format: "CODE128",
              width: 1,
              height: 25,
              fontSize: 0,
              displayValue: false,
              margin: 0,
              background: "#ffffff",
              lineColor: "#000000",
            });

            barcodeSVG = svg.outerHTML;
            document.body.removeChild(tempDiv);
          } catch (error) {
            console.error("Error generating barcode for", awbNo, error);
            barcodeSVG = `<svg height="25" width="120" xmlns="http://www.w3.org/2000/svg"><text x="60" y="15" text-anchor="middle" font-size="10" fill="red">${awbNo}</text></svg>`;
          }
        } else {
          barcodeSVG = `<svg height="25" width="120" xmlns="http://www.w3.org/2000/svg"><text x="60" y="15" text-anchor="middle" font-size="10" fill="gray">NO AWB</text></svg>`;
        }

        tableRowsHTML += `
        <tr style="vertical-align: top;">
          <td style="padding: 8px;">${idx + 1}</td>
          <td style="padding: 8px; text-align: center;">
           <div style="height: 25px; width: 120px; margin: 0 auto;">
              ${barcodeSVG}
            </div>
            <div style="margin-bottom: 5px; font-weight: bold; font-size: 9px;">${
              awbNo || "N/A"
            }</div>
           
          </td>
          <td style="padding: 8px;">${row.shipperName || "N/A"}</td>
          <td style="padding: 8px;">${row.recieverName || "N/A"}</td>
          <td style="padding: 8px; text-align: center;">${row.pcs || 0}</td>
          <td style="padding: 8px; text-align: right;">${parseFloat(
            row.weight || 0,
          ).toFixed(2)}</td>
          <td style="padding: 8px;">${row.destination || "DDP"}</td>
          <td style="padding: 8px;">${row.description || ""}</td>
          <td style="padding: 8px; text-align: right;">${parseFloat(
            row.finalValue || 0,
          ).toFixed(2)}</td>
        </tr>`;
      });

      contentDiv.innerHTML = `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <div><strong>FROM:</strong> M5C LOGISTICS</div>
          <div style="text-align: right;"><strong>TO:</strong> DCW SOLUTIONS INC<br/>13937 60 AVE SURREY, BC V3X0K7</div>
        </div>
      </div>
      <h2 style="text-align: center; font-weight: bold; margin-bottom: 16px; font-size: 12px; color: #000080;">MANIFEST REPORT-OUTBOUND</h2>
      <div style="margin-bottom: 10px; font-size: 9px;">
        <div style="display: flex; justify-content: space-between;">
          <div>
            <strong>Run No:</strong> ${runInfo?.runNo || runNo || "N/A"} &nbsp; 
            <strong>Date:</strong> ${
              runInfo?.date
                ? new Date(runInfo.date).toLocaleDateString()
                : new Date().toLocaleDateString()
            }
          </div>
          <div>
            <strong>Flight:</strong> ${runInfo?.flight || "N/A"} &nbsp;
            <strong>Total Shipments:</strong> ${manifestRows.length}
          </div>
        </div>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-top: 2px solid #000080; border-bottom: 2px solid #ff0000; background-color: #f0f0f0;">
            <th style="padding: 8px; text-align: left;">SrNo</th>
            <th style="padding: 8px; text-align: center;">AWB No.</th>
            <th style="padding: 8px; text-align: left;">Shipper</th>
            <th style="padding: 8px; text-align: left;">Consignee</th>
            <th style="padding: 8px; text-align: center;">PCS</th>
            <th style="padding: 8px; text-align: center;">Weight</th>
            <th style="padding: 8px; text-align: left;">Dest</th>
            <th style="padding: 8px; text-align: left;">Description</th>
            <th style="padding: 8px; text-align: center;">Value</th>
          </tr>
        </thead>
        <tbody>${tableRowsHTML}</tbody>    
      </table>`;

      document.body.appendChild(contentDiv);

      const canvas = await html2canvas(contentDiv, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      document.body.removeChild(contentDiv);

      // Save PDF
      const fileName = `CAN_Manifest_${
        runInfo?.runNo || runNo || "Report"
      }_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      showNotification("success", "MANIFEST PDF generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("error", `Failed to generate PDF: ${error.message}`);
    } finally {
      setManifestPdfLoading(false);
    }
  };

  // Function to generate INVOICE PDF
  const handleGenerateInvoicePDF = async () => {
    if (invoiceRows.length === 0 || !invoiceData) {
      showNotification(
        "error",
        "No invoice data to generate PDF. Please load invoice data first.",
      );
      return;
    }

    setInvoicePdfLoading(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const awbGroups = {};

      invoiceRows.forEach((row) => {
        const awbNo = row.awbNo || "NO_AWB";
        if (!awbGroups[awbNo]) awbGroups[awbNo] = [];
        awbGroups[awbNo].push(row);
      });

      const awbNumbers = Object.keys(awbGroups);

      for (let awbIndex = 0; awbIndex < awbNumbers.length; awbIndex++) {
        const currentAwbNo = awbNumbers[awbIndex];
        const awbItems = awbGroups[currentAwbNo];
        const awbTotal = awbItems
          .reduce((sum, row) => sum + parseFloat(row.amt || 0), 0)
          .toFixed(2);

        const invoiceDataFormatted = {
          shipperName: invoiceData?.shipperName || "M5C LOGISTICS",
          shipperAddress: invoiceData?.shipperAddress || "",
          shipperCity: invoiceData?.shipperCity || "Delhi, India",
          shipperKycType: invoiceData?.shipperKycType || "PAN",
          shipperAadhar: invoiceData?.shipperAadhar || "",
          consigneeName: invoiceData?.consigneeName || "DCW SOLUTIONS INC",
          consigneeAddress: invoiceData?.consigneeAddress || "13937 60 AVE",
          consigneeCity: invoiceData?.consigneeCity || "SURREY",
          consigneeState: invoiceData?.consigneeState || "BC",
          consigneePin: invoiceData?.consigneePin || "V3X0K7",
          consigneePhone: invoiceData?.consigneePhone || "",
          preCarriageBy: invoiceData?.preCarriageBy || "AIR",
          flightNo: runInfo?.flight || invoiceData?.flightNo || "",
          placeOfReceipt: invoiceData?.placeOfReceipt || "Delhi",
          portOfLoading: invoiceData?.portOfLoading || "IGI Airport",
          awbNo: currentAwbNo,
          date: runInfo?.date
            ? new Date(runInfo.date).toLocaleDateString()
            : new Date().toLocaleDateString(),
          weight: invoiceData?.totalWeight
            ? `${invoiceData.totalWeight} KG`
            : "",
          buyerOrderNo: invoiceData?.buyerOrderNo || "",
          otherReference: invoiceData?.otherReference || "",
          buyerIfOther: invoiceData?.buyerIfOther || "",
          countryOfOrigin: invoiceData?.countryOfOrigin || "INDIA",
          destination: invoiceData?.destination || "CANADA",
          terms: invoiceData?.terms || "DDP",
          currency: invoiceData?.currency || "CAD",
          total: awbTotal,
          declaration:
            invoiceData?.declaration ||
            "The above mentioned items are not for commercial use and value declared only for custom purpose.",
          items: awbItems.map((row) => ({
            boxNo: row.box || "",
            description: row.description || "",
            hsn: row.hsn || "",
            quantity: row.qty || "",
            rate: parseFloat(row.rate || 0).toFixed(2),
            amount: parseFloat(row.amt || 0).toFixed(2),
          })),
        };

        const contentDiv = document.createElement("div");
        contentDiv.style.position = "absolute";
        contentDiv.style.left = "0";
        contentDiv.style.top = "0";
        contentDiv.style.zIndex = "-1";
        contentDiv.style.width = "800px";
        contentDiv.style.fontFamily = "Arial, sans-serif";

        let tableRowsHTML = "";
        invoiceDataFormatted.items.forEach((item, idx) => {
          const prevBoxNo = invoiceDataFormatted.items[idx - 1]?.boxNo;
          const showBoxNo = item.boxNo !== prevBoxNo;

          tableRowsHTML += `
          <tr class="pb-2">
            <td style="vertical-align: top; padding: 4px; line-height: 1.2; text-align: center;">${
              showBoxNo ? item.boxNo : ""
            }</td>
            <td style="border-left: 2px solid black; vertical-align: top; padding: 4px; padding-bottom: 8px; line-height: 1.2; text-align: left;">${
              item.description
            }</td>
            <td style="border-left: 2px solid black; vertical-align: top; padding: 4px; padding-bottom: 8px; line-height: 1.2; text-align: center;">${
              item.hsn
            }</td>
            <td style="border-left: 2px solid black; vertical-align: top; padding: 4px; padding-bottom: 8px; line-height: 1.2; text-align: center;">${
              item.quantity
            }</td>
            <td style="border-left: 2px solid black; vertical-align: top; padding: 4px; padding-bottom: 8px; line-height: 1.2; text-align: center;">${
              item.rate
            }</td>
            <td style="border-left: 2px solid black; vertical-align: top; padding: 4px; padding-bottom: 8px; line-height: 1.2; text-align: center;">${
              item.amount
            }</td>
          </tr>`;
        });

        contentDiv.innerHTML = `
        <div style="padding: 24px; background-color: white; border: 2px solid black; max-width: 56rem; margin-left: auto; margin-right: auto; font-size: 12px;">
          <div style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 8px; padding-bottom: 8px;">INVOICE</div>
          <div style="display: flex; border: 2px solid black; border-bottom: 0;">
            <div style="flex: 1; border-right: 2px solid black;">
              <div style="padding: 8px; height: 100px;">
                <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">Exporter</div>
                <div style="font-size: 12px;">
                  <div>${invoiceDataFormatted.shipperName}</div>
                  <div>${invoiceDataFormatted.shipperAddress}</div>
                  <div>${invoiceDataFormatted.shipperCity}</div>
                  <div style="margin-top: 8px; margin-bottom: 4px;"><span style="font-weight: 600;">${invoiceDataFormatted.shipperKycType} &nbsp;&nbsp;</span>${invoiceDataFormatted.shipperAadhar}</div>
                </div>
              </div>
              <div style="flex: 1; border-top: 2px solid black; margin-top: 16px;">
                <div style="padding: 8px;">
                  <div style="font-weight: 600; margin-bottom: 4px;">Consignee</div>
                  <div style="font-size: 12px; height: 100px;">
                    <div>${invoiceDataFormatted.consigneeName}</div>
                    <div>${invoiceDataFormatted.consigneeAddress}</div>
                    <div>${invoiceDataFormatted.consigneeCity}</div>
                    <div>${invoiceDataFormatted.consigneeState}</div>
                    <div>${invoiceDataFormatted.consigneePin}</div>
                    <div>${invoiceDataFormatted.consigneePhone}</div>
                  </div>
                </div>
                <div style="display: flex; font-size: 12px;">
                  <div style="width: 50%;">
                    <div style="flex: 1; border: 2px solid black; border-left: 0; height: 60px; padding: 4px;"><span style="font-weight: 600;">Pre-Carriage by</span><div>${invoiceDataFormatted.preCarriageBy}</div></div>
                    <div style="flex: 1; border-right: 2px solid black; height: 60px; padding: 4px;"><span style="font-weight: 600;">Vessel / Flight No.</span><div>${invoiceDataFormatted.flightNo}</div></div>
                  </div>
                  <div style="width: 50%;">
                    <div style="flex: 1; border-bottom: 2px solid black; border-top: 2px solid black; height: 60px; padding: 4px;"><span style="font-weight: 600;">Place of Receipt by pre-carrier</span><div>${invoiceDataFormatted.placeOfReceipt}</div></div>
                    <div style="flex: 1; height: 60px; padding: 4px;"><div style="font-weight: 600;">Port of Loading</div><div>${invoiceDataFormatted.portOfLoading}</div></div>
                  </div>
                </div>
              </div>
            </div>
            <div style="flex: 1;">
              <div style="display: flex; font-size: 12px;">
                <div style="border-right: 2px solid black; border-bottom: 2px solid black; padding: 8px; width: 50%; height: 50px;"><span style="font-weight: 600;">Awb No. and Date</span><div>${invoiceDataFormatted.awbNo} &nbsp;&nbsp;&nbsp;&nbsp; ${invoiceDataFormatted.date}</div></div>
                <div style="flex: 1; border-bottom: 2px solid black; margin-top: 8px;"><div style="font-weight: 600; margin-left: 16px;"><h2>Exporter Ref/Weight</h2><p style="font-weight: normal;">${invoiceDataFormatted.weight}</p></div></div>
              </div>
              <div style="margin-bottom: 8px; border-bottom: 2px solid black; font-size: 12px; height: 40px; margin-top: 8px;"><span style="font-weight: 600; margin-left: 8px;">Buyer's order no. and date</span><div>${invoiceDataFormatted.buyerOrderNo}</div></div>
              <div style="margin-bottom: 8px; border-bottom: 2px solid black; font-size: 12px; height: 30px;"><span style="font-weight: 600; margin-left: 8px;">Other Reference (s)</span><div>${invoiceDataFormatted.otherReference}</div></div>
              <div style="border-bottom: 2px solid black; font-size: 12px; height: 70px;"><span style="font-weight: 600; margin-left: 8px;">Buyer (if other has consignee)</span><div>${invoiceDataFormatted.buyerIfOther}</div></div>
              <div style="display: flex; font-size: 12px; border-bottom: 2px solid black; height: 80px;">
                <div style="flex: 1; border-right: 2px solid black; padding: 8px;"><span style="font-weight: 600;">Country of origin of goods</span><div>${invoiceDataFormatted.countryOfOrigin}</div></div>
                <div style="flex: 1; padding: 8px;"><span style="font-weight: 600;">Country of final destination</span><div>${invoiceDataFormatted.destination}</div></div>
              </div>
              <div style="flex: 1; font-size: 12px;"><div style="font-weight: 600; text-align: center; padding: 8px;">Terms of delivery & Payment<span style="font-weight: normal; margin-top: 8px; display: block;">${invoiceDataFormatted.terms}</span></div></div>
            </div>
          </div>
          <div style="height: 525px; border: 2px solid black;">
            <table style="width: 100%; font-size: 12px; text-align: center; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 4px; text-align: left; font-weight: 600; border-bottom: 2px solid black; width: 98px; vertical-align: top; line-height: 1.2;"><div style="display: flex; justify-content: center; align-items: start; line-height: normal; padding-bottom: 4px; min-height: 20px; text-align: start; width: 100%;">Box No</div></th>
                  <th style="border-left: 2px solid black; padding: 4px; text-align: left; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;"><div style="display: flex; justify-content: center; align-items: start;">Description</div></th>
                  <th style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;"><div style="display: flex; justify-content: center; align-items: start;">HSN</div></th>
                  <th style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;"><div style="display: flex; justify-content: center; align-items: start;">Quantity</div></th>
                  <th style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;"><div style="display: flex; justify-content: center; align-items: start;">Rates</div></th>
                  <th style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;"><div style="display: flex; justify-content: center; align-items: start;">Amount</div></th>
                </tr>
              </thead>
              <tbody style="border-bottom: 2px solid black;">${tableRowsHTML}</tbody>
            </table>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: end; border: 2px solid black; border-top: 0; padding: 4px;">
            <div style="font-size: 12px;">Value declared for custom purpose only.</div>
            <div style="text-align: right;">
              <div style="display: flex; justify-content: end; width: 128px;">
                <span style="margin-right: 8px; font-weight: 600;">Total :</span>
                <span style="margin-right: 4px;">${invoiceDataFormatted.currency}</span>
                <span style="font-weight: 600;">${invoiceDataFormatted.total}</span>
              </div>
            </div>
          </div>
          <div style="height: 40px; border: 2px solid black; border-top: 0; border-bottom: 0;"></div>
          <div style="border: 2px solid black;">
            <div style="display: flex; justify-content: space-between;">
              <div style="border-right: 2px solid black; padding: 8px;">
                <div style="font-weight: 600; margin-bottom: 4px;">Declaration:</div>
                <div style="font-size: 12px;">${invoiceDataFormatted.declaration}</div>
              </div>
              <div style="text-align: right; font-weight: 600; margin-top: 40px; font-size: 12px; padding: 8px;">
                <div>Signature / Date / Co stamp.</div>
              </div>
            </div>
          </div>
        </div>`;

        document.body.appendChild(contentDiv);
        await new Promise((resolve) => setTimeout(resolve, 100));

        const canvas = await html2canvas(contentDiv, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          allowTaint: true,
          width: 800,
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.85);

        if (awbIndex > 0) pdf.addPage();

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        if (pdfHeight <= pageHeight) {
          pdf.addImage(
            imgData,
            "JPEG",
            0,
            0,
            pdfWidth,
            pdfHeight,
            undefined,
            "FAST",
          );
        } else {
          const scale = pageHeight / pdfHeight;
          const scaledWidth = pdfWidth * scale;
          const scaledHeight = pageHeight;
          const xOffset = (pdfWidth - scaledWidth) / 2;
          pdf.addImage(
            imgData,
            "JPEG",
            xOffset,
            0,
            scaledWidth,
            scaledHeight,
            undefined,
            "FAST",
          );
        }

        document.body.removeChild(contentDiv);
      }

      // Save PDF with all pages
      const fileName = `CAN_Invoice_${
        runInfo?.runNo || runNo || "Report"
      }_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      showNotification(
        "success",
        `Invoice PDF generated with ${awbNumbers.length} page(s) - one per AWB`,
      );
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      showNotification(
        "error",
        `Failed to generate invoice PDF: ${error.message}`,
      );
    } finally {
      setInvoicePdfLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    const rowsToUse = activeTable === "manifest" ? manifestRows : invoiceRows;
    const columnsToUse =
      activeTable === "manifest" ? columnsCAN : invoiceColumns;

    if (rowsToUse.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const doc = new jsPDF(
        activeTable === "manifest" ? "landscape" : "portrait",
      );
      doc.setFontSize(16);
      doc.text(
        `${activeTable === "manifest" ? "CAN Manifest" : "CAN Invoice"} Report`,
        14,
        15,
      );

      if (runInfo) {
        doc.setFontSize(10);
        doc.text(`Run No: ${runInfo.runNo || ""}`, 14, 25);
        doc.text(`Sector: ${runInfo.sector || "CAN"}`, 14, 30);
        doc.text(`Flight: ${runInfo.flight || "N/A"}`, 14, 35);
        doc.text(
          `Date: ${
            runInfo.date ? new Date(runInfo.date).toLocaleDateString() : "N/A"
          }`,
          14,
          40,
        );
        doc.text(`Total Records: ${rowsToUse.length}`, 200, 25);
      }

      if (activeTable === "manifest") {
        const totalPcs = rowsToUse.reduce(
          (sum, row) => sum + (row.pcs || 0),
          0,
        );
        const totalWeight = rowsToUse.reduce(
          (sum, row) => sum + parseFloat(row.weight || 0),
          0,
        );
        const totalValue = rowsToUse.reduce(
          (sum, row) => sum + parseFloat(row.finalValue || 0),
          0,
        );

        doc.setFontSize(10);
        doc.text(`Summary:`, 14, 50);
        doc.text(`Total PCS: ${totalPcs}`, 14, 55);
        doc.text(`Total Weight: ${totalWeight.toFixed(2)} kg`, 14, 60);
        doc.text(`Total Value: ${totalValue.toFixed(2)} CAD`, 14, 65);
      }

      const tableColumn = columnsToUse.map((col) => col.label);
      const tableRows = rowsToUse.map((row) =>
        columnsToUse.map((col) => {
          if (col.key === "awbNo" && row[col.key]) {
            return row[col.key].startsWith("80KT")
              ? row[col.key]
              : `80KT${row[col.key]}`;
          }
          const value = row[col.key];
          return value !== null && value !== undefined ? String(value) : "";
        }),
      );

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: activeTable === "manifest" ? 75 : 45,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [220, 38, 38] },
        margin: { left: 5, right: 5 },
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
          14,
          doc.internal.pageSize.height - 10,
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 10,
        );
      }

      const fileName = `CAN_${
        activeTable === "manifest" ? "Manifest" : "Invoice"
      }_${runInfo?.runNo || runNo || "Report"}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      showNotification("success", "PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("error", `Failed to generate PDF: ${error.message}`);
    }
  };

  const handleDownloadCSV = () => {
    const rowsToUse = activeTable === "manifest" ? manifestRows : invoiceRows;
    const columnsToUse =
      activeTable === "manifest" ? columnsCAN : invoiceColumns;

    if (rowsToUse.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const fileName = `CAN_${
        activeTable === "manifest" ? "Manifest" : "Invoice"
      }_${runNo}_${new Date().getTime()}.csv`;

      const headers = columnsToUse.map((col) => col.label).join(",");
      const csvRows = rowsToUse.map((row) =>
        columnsToUse
          .map((col) => {
            let value = row[col.key] || "";
            if (col.key === "awbNo" && value && !value.startsWith("80KT")) {
              value = `80KT${value}`;
            }
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(","),
      );

      const csvContent = [headers, ...csvRows].join("\n");
      downloadCSVFile(csvContent, fileName);
      showNotification("success", "CSV downloaded successfully");
    } catch (error) {
      console.error("Error generating CSV:", error);
      showNotification("error", `Failed to generate CSV: ${error.message}`);
    }
  };

  const downloadCSVFile = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExcel = () => {
    const rowsToUse = activeTable === "manifest" ? manifestRows : invoiceRows;
    const columnsToUse =
      activeTable === "manifest" ? columnsCAN : invoiceColumns;

    if (rowsToUse.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const fileName = `CAN_${
        activeTable === "manifest" ? "Manifest" : "Invoice"
      }_${runNo}_${new Date().getTime()}.xlsx`;
      const sheetName =
        activeTable === "manifest" ? "CAN Manifest" : "CAN Invoice";

      const data = rowsToUse.map((row) => {
        const formattedRow = {};
        columnsToUse.forEach((col) => {
          let value = row[col.key] || "";
          if (col.key === "awbNo" && value && !value.startsWith("80KT")) {
            value = `80KT${value}`;
          }
          formattedRow[col.label] = value;
        });
        return formattedRow;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const colWidths = columnsToUse.map(() => ({ wch: 20 }));
      ws["!cols"] = colWidths;

      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!ws[cellAddress]) continue;

          if (!ws[cellAddress].s) ws[cellAddress].s = {};
          ws[cellAddress].s.border = {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          };

          if (R === 0) {
            ws[cellAddress].s.font = { bold: true };
            ws[cellAddress].s.fill = { fgColor: { rgb: "E0E0E0" } };
          }

          ws[cellAddress].s.alignment = { wrapText: true, vertical: "top" };
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      XLSX.writeFile(wb, fileName);
      showNotification("success", "Excel downloaded successfully");
    } catch (error) {
      console.error("Error generating Excel:", error);
      showNotification("error", `Failed to generate Excel: ${error.message}`);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "text/csv",
      ];

      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(xlsx|xls|csv)$/)
      ) {
        showNotification("error", "Please select a valid Excel or CSV file");
        return;
      }

      setUploadFile(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      showNotification("error", "Please select a file first");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);

      const endpoint = `${server}/overseas-manifest/can/upload-can-values`;
      const response = await axios.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        showNotification(
          "success",
          response.data.message || "File uploaded and processed successfully!",
        );
        setShowUploadModal(false);
        setUploadFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        showNotification("error", response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to upload file",
      );
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadStoredData = async () => {
    setDownloadLoading(true);
    try {
      const endpoint = `${server}/overseas-manifest/can/download-can-values`;
      const response = await axios.get(endpoint, { responseType: "blob" });

      const contentDisposition = response.headers["content-disposition"];
      let filename = `CAN_Weight_Values_${new Date().getTime()}.xlsx`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showNotification("success", "Weight values downloaded successfully");
    } catch (error) {
      console.error("Error downloading stored data:", error);
      if (error.response?.status === 404) {
        showNotification(
          "error",
          "No weight values found. Please upload values first.",
        );
      } else {
        showNotification(
          "error",
          error.response?.data?.message || "Failed to download stored data",
        );
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleViewSampleFormat = () => {
    const sampleData = [
      { WEIGHT: 1, "VALUE PER KG": 2.05 },
      { WEIGHT: 2, "VALUE PER KG": 1.76 },
      { WEIGHT: 3, "VALUE PER KG": 1.77 },
      { WEIGHT: 4, "VALUE PER KG": 1.78 },
      { WEIGHT: 5, "VALUE PER KG": 1.79 },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample Format");

    ws["!cols"] = [{ wch: 10 }, { wch: 15 }];

    XLSX.writeFile(wb, "CAN_Weight_Values_Sample_Format.xlsx");
  };

  const xmlEscape = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const handleAirportSelect = (airport) => {
    setSelectedAirport(airport);
    setShowAirportModal(false);

    // Now finally call XML generator
    handleDownloadXML(runNo, airport);
  };

  const handleDownloadXML = async (runNo, selectedAirport) => {
    try {
      // console.log("RAW runNo →", runNo);
      // console.log("selectedAirport →", selectedAirport);
      // console.log(
//         "Final API URL →",
//         `${server}/overseas-manifest/can/run?runNo=${runNo}`,
//       );

      // simple normalization
      const normalizedRunNo = `${runNo || ""}`.trim();

      if (!normalizedRunNo) {
        showNotification("error", "Invalid Run No");
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      const etaDate = "";

      // SUBLOCATION MAPPING
      const airportMap = {
        YYZ: {
          code: "3103",
          name: "International Warehousing and Distribution",
          port: "0497",
        },
        YVR: {
          code: "5431",
          name: "Aero Pacific Express Ltd.",
          port: "0821",
        },
      };

      const airport = airportMap[selectedAirport];

      // 1. Fetch Bagging
      const bagRes = await fetch(
        `${server}/overseas-manifest/can/run?runNo=${normalizedRunNo}`,
      );
      const bagJson = await bagRes.json();
      // console.log("BAG JSON →", bagJson);

      if (!bagJson.success || !bagJson.data) {
        showNotification("error", "Bagging run not found");
        return;
      }

      const bag = bagJson.data;

      // 2. Only AWBs (skip childShipment)
      const awbList = bag.rowData
        .map((r) => (r.awbNo ? r.awbNo.trim().toUpperCase() : null))
        .filter(Boolean);
      // console.log("AWB LIST →", awbList);

      const shipmentsXML = [];

      // Loop through AWBs
      for (const awb of awbList) {
        // Fetch Shipment
        const shipRes = await fetch(
          `${server}/overseas-manifest/can/shipments?awb=${awb}`,
        );
        const shipJson = await shipRes.json();
        const shipment = shipJson.data;

        if (!shipment) continue;

        // Shipper
        const shipperName = shipment.shipperFullName || "";
        const shipperCity = shipment.shipperCity || "";
        const shipperState = shipment.shipperState || "";
        const shipperPin = shipment.shipperPincode || "";
        const shipperAddress1 = shipment.shipperAddressLine1 || "";

        // Consignee
        const conName = shipment.receiverFullName || "";
        const conAddr1 = shipment.receiverAddressLine1 || "";
        const conAddr2 = shipment.receiverAddressLine2 || "";
        const conCity = shipment.receiverCity || "";
        const conState = shipment.receiverState || "";
        const conZip = shipment.receiverPincode || "";
        const conPhone = shipment.receiverPhoneNumber || "";

        // Weight + PCS
        const weight = shipment.totalActualWt || 0;
        const pcs = shipment.pcs || 1;

        const ccNumber = `80KT${awb}`;

        // 3. Generate <detail> from shipmentAndPackageDetails
        const detailsXML = [];
        const pkg = shipment.shipmentAndPackageDetails || {};

        for (const boxNo of Object.keys(pkg)) {
          const items = pkg[boxNo];
          for (const item of items) {
            detailsXML.push(`
            <detail 
              productNumber="${item.context || ""}"
              quantity="${boxNo}"
              valueForConversion="${item.rate || "0"}"
              discount="0"
              netValueForConversion="${item.rate || "0"}"
              vfdCode="0"
              classification="${item.hsnNo || ""}"
              gstCode=""
              countryOfOrigin="IN"
              tariffTreatment=""
              cciQuantity="${item.qty || 1}"
              invoiceDiscountAmount="0"
              pageNumber="1"
            />
          `);
          }
        }

        const detailsBlock =
          detailsXML.length > 0
            ? detailsXML.join("\n")
            : `
            <detail 
              productNumber=""
              quantity="1"
              valueForConversion="0"
              discount="0"
              netValueForConversion="0"
              vfdCode="0"
              classification=""
              gstCode=""
              countryOfOrigin="IN"
              tariffTreatment=""
              cciQuantity="1"
              invoiceDiscountAmount="0"
              pageNumber="1"
            />
          `;

        // 4. Build shipment XML
        const xml = `
  <shipment container="" numberOfContainers="1"
    orderNumber="${awb} DDP"
    previousCargoControlNumber="${shipment.alMawb || ""}"
    adviceNoteDate="${today}"
    referenceNumber="M5C"
    sublocationCode="${airport.code}"
    sublocation="${airport.name}"
    directShipmentDate="${today}"
    rmd_time="00"
    weight="${weight}"
    cargoControlNumber="${ccNumber}"
    vendorName="${shipperName}"
    port="${airport.port}"
    carrierCode="80KT"
    clientName="TALPURI"
    locationOfGoods=""
    isEDI="0"
    etaDate="${etaDate}"
    transactionNumber=""
    customerNumber="1001"
    shippedPer=""
    over_credit_lim=""
  >
    <ccis>
      <cci
        purchaseOrder="${awb}"
        countryOfExport="IN"
        countryOfOrigin="IN"
        locationOfGoods="IN"
        directShipmentMode="1"
        directShipmentLocation="India"
        currency="CAD"
        numberOfPackages="${pcs}"
        packageUOM="PK"
        measurement="${weight}"
        measurementUOM="KGM"
        tariffTreatment="2"
        directShipmentDate="${today}"
        customerNumber="1001"
        exportPackingExcluded="0"
        exportPackingIncluded="0"
        transportationChargesExcluded="0"
        transportationChargesIncluded="0"
        vendorCityZip="${shipperPin}"
        vendorName="${shipperName}"
        vendorZip="${shipperPin}"
        countryDirectShipment="IN"
        deliveryPartySource="${conName}"
        exporterCityZip="${conZip}"
        originatorName="${shipperName}"
        originatorAddress1="${shipperAddress1}"
        vendorAddress1="${shipperAddress1}"
      >

        <shipper 
          name="${shipperName}"
          city="${shipperCity}"
          state="${shipperState}"
          postalCode="${shipperPin}"
          country="IN"
          phone=""
          contact="${shipperName}"
        />

        <vendor 
          name="${shipperName}"
          city="${shipperCity}"
          state="${shipperState}"
          postalCode="${shipperPin}"
          country="IN"
          phone=""
          contact="${shipperName}"
        />

        <consignee 
          name="${conName}"
          address1="${(conAddr1 + " " + conAddr2).trim()}"
          city="${conCity}"
          province="${conState}"
          postalCode="${conZip}"
          country="CA"
          emailAddress="${shipment.receiverEmail || ""}"
          phone="${conPhone}"
          contact="${conName}"
          fax="00000"
        />

        <invoiceSummary 
          transportationCharges="0"
          miscellaneousCost="0"
          exportPacking="0"
          cashDiscount="0"
          tradeDiscount="0"
          sampleDiscount="0"
          volumeDiscount="0"
          invoiceAmount="${shipment.totalInvoiceValue || ""}"
          isDutyIncluded="false"
          vendorName="${shipperName}"
          weight="${weight}"
          invoiceNumber="${awb}"
          currency="CAD"
          placeOfExport="IN"
          vendorNumber="${shipperName}"
          vendorStateCode="${shipperState}"
          sequence="0"
        >
          <details>
            ${detailsBlock}
          </details>
        </invoiceSummary>

      </cci>
    </ccis>
  </shipment>
      `;

        shipmentsXML.push(xml);
      }

      // 5. Final wrap
      const finalXML = `<?xml version="1.0" encoding="iso-8859-1"?>\n<shipments>\n${shipmentsXML.join(
        "\n",
      )}\n</shipments>`;

      // Download file
      const blob = new Blob([finalXML], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CAN_XML_${normalizedRunNo}.xml`;
      a.click();

      showNotification("success", "XML downloaded");
    } catch (err) {
      // console.log(err);
      showNotification("error", "XML generation failed");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      {/* Search and Replace Component */}
      <SearchAndReplace
        data={getCurrentRows()}
        columns={getCurrentColumns()}
        onDataUpdate={handleDataUpdate}
        onReplace={handleReplace}
        isActive={true}
        tableId="can-data-table"
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <h3 className="text-xl font-semibold text-gray-800">
                Upload CAN Weight Values
              </h3>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl p-1"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Upload an Excel file with WEIGHT and VALUE PER KG columns. This
                data will be used for CAN manifest calculations.
              </p>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">
                  Required Format:
                </h4>
                <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                  <li>Excel file (.xlsx, .xls) or CSV (.csv)</li>
                  <li>First row should have column headers</li>
                  <li>
                    Column A: <strong>WEIGHT</strong> (numeric values)
                  </li>
                  <li>
                    Column B: <strong>VALUE PER KG</strong> (numeric values)
                  </li>
                </ul>
                <button
                  onClick={handleViewSampleFormat}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Download Sample Format
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center">
                    <FiUpload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-700 font-medium mb-1">
                      {uploadFile ? uploadFile.name : "Click to select file"}
                    </p>
                    <p className="text-sm text-gray-500">
                      Drag and drop or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supports .xlsx, .xls, .csv files
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {uploadFile && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">
                      {uploadFile.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Size: {(uploadFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setUploadFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                disabled={uploadLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!uploadFile || uploadLoading}
                className="px-5 py-2.5 bg-red text-white rounded-lg hover:bg-red disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
              >
                {uploadLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  "Upload File"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <InputBox
            register={register}
            setValue={setValue}
            value="runNo"
            placeholder="Run Number"
          />
        </div>
        <div className="flex gap-2">
          {/* Manifest Button - Show/Save toggle */}
          {manifestModified ? (
            <button
              onClick={() => handleSaveData("manifest")}
              disabled={saveLoading}
              className="border transition-all border-green-600 bg-green-50 text-green-700 font-semibold text-sm rounded-md px-8 py-2.5 flex items-center justify-center gap-2 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[120px]"
            >
              {saveLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Save Manifest
                </>
              )}
            </button>
          ) : (
            <div>
              <OutlinedButtonRed
                label={manifestLoading ? "Loading..." : "Manifest"}
                onClick={handleShow}
                disabled={manifestLoading}
                className="min-w-[120px]"
              />
            </div>
          )}

          {/* Invoice Button - Show/Save toggle */}
          {invoiceModified ? (
            <button
              onClick={() => handleSaveData("invoice")}
              disabled={saveLoading}
              className="border transition-all border-green-600 bg-green-50 text-green-700 font-semibold text-sm rounded-md px-8 py-2.5 flex items-center justify-center gap-2 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[120px]"
            >
              {saveLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Save Invoice
                </>
              )}
            </button>
          ) : (
            <div>
              <OutlinedButtonRed
                label={invoiceLoading ? "Loading..." : "Invoice"}
                onClick={handleShowInvoice}
                disabled={invoiceLoading}
                className="min-w-[120px]"
              />
            </div>
          )}

          <div>
            <DownloadCsvExcel
              handleDownloadPDF={handleDownloadPDF}
              handleDownloadExcel={handleDownloadExcel}
              handleDownloadCSV={handleDownloadCSV}
              className="min-w-[140px]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="bg-white rounded-lg border shadow-sm">
          <TableWithSorting
            columns={activeTable === "manifest" ? columnsCAN : invoiceColumns}
            rowData={activeTable === "manifest" ? manifestRows : invoiceRows}
            register={register}
            setValue={setValue}
            className={`h-[50vh] rounded-lg`}
          />
        </div>

        <div className="flex gap-3">
          {/* Upload Button */}
          <div className="w-1/5">
            <button
              onClick={() => setShowUploadModal(true)}
              className="border w-full transition-all border-red text-red font-semibold text-sm rounded-md px-12 py-1 flex items-center justify-center gap-2 hover:bg-[#00000033] shadow-sm"
            >
              <FiUpload className="w-4 h-4" />
              <span>Upload</span>
            </button>
          </div>

          {/* Download Stored Data Button */}
          <div className="w-1/5">
            <button
              onClick={handleDownloadStoredData}
              disabled={downloadLoading}
              className="border w-full transition-all border-red text-red font-semibold text-sm rounded-md px-12 py-1 flex items-center justify-center gap-2 hover:bg-[#00000033] disabled:cursor-not-allowed disabled:opacity-70 shadow-sm"
              title="Download stored weight values as Excel"
            >
              {downloadLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <FiDownload className="w-4 h-4" />
                  <span>Values</span>
                </>
              )}
            </button>
          </div>

          {/* MANIFEST PDF Button */}
          <div className="w-1/5">
            <SimpleButton
              name={manifestPdfLoading ? "Generating..." : "Manifest PDF"}
              onClick={handleGenerateManifestPDF}
              disabled={manifestPdfLoading || manifestRows.length === 0}
              // className="min-h-[44px] justify-center"
            />
          </div>

          {/* INVOICE PDF Button */}
          <div className="w-1/5">
            <SimpleButton
              name={invoicePdfLoading ? "Generating..." : "Invoice PDF"}
              onClick={handleGenerateInvoicePDF}
              disabled={invoicePdfLoading || invoiceRows.length === 0}
              // className="min-h-[44px] justify-center"
            />
          </div>

          {showAirportModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg text-center font-semibold mb-4">
                  Select Airport
                </h2>

                <div className="flex gap-3 flex-col">
                  <div className="flex gap-3">
                    <div>
                      <SimpleButton
                        name={`YYZ`}
                        onClick={() => handleAirportSelect("YYZ")}
                      />
                    </div>
                    <div>
                      <SimpleButton
                        name={`YVR`}
                        onClick={() => handleAirportSelect("YVR")}
                      />
                    </div>
                  </div>
                  <div>
                    <OutlinedButtonRed
                      onClick={() => setShowAirportModal(false)}
                      label="Close"
                    />{" "}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="w-1/5">
            <SimpleButton
              name="Download XML"
              onClick={() => {
                if (!runNo) {
                  showNotification("error", "Enter Run No first");
                  return;
                }
                setShowAirportModal(true); // open modal instead of calling function directly
              }}
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-yellow-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <FiFileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> AWB numbers are prefixed with "80KT".
                {activeTable === "manifest"
                  ? " MANIFEST shows shipment details with calculated values."
                  : " INVOICE shows itemized package details with HSN codes."}
                Press <strong>Ctrl+F</strong> to open search and replace. The
                dropdown download button exports the currently displayed table
                data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CANComponent;
