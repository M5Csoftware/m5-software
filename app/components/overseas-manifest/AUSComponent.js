"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import SearchAndReplace from "@/app/components/SearchAndReplace";
import html2canvas from "html2canvas";

const AUSComponent = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch, reset } = useForm();
  const [clubChecked, setClubChecked] = useState(false);
  const [audChecked, setAudChecked] = useState(false);
  const [rows, setRows] = useState([]);
  const [invoiceRows, setInvoiceRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoicePdfLoading, setInvoicePdfLoading] = useState(false);
  const [runInfo, setRunInfo] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [currentView, setCurrentView] = useState("standard"); // standard, tla, bag-report, bag-barcode, bag-tag, invoice
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const runNo = watch("runNo");

  const columnsAUS = [
    { key: "hawb", label: "HAWB" },
    { key: "customerId", label: "Customer ID" },
    { key: "recieverFullName", label: "Customer Name" },
    { key: "recieverAddress", label: "Customer Address" },
    { key: "receivercity", label: "City" },
    { key: "recieverstate", label: "State" },
    { key: "receiverPostcode", label: "Postcode" },
    { key: "receiverCountry", label: "Country" },
    { key: "content", label: "Description of Goods" },
    { key: "pcs", label: "Count" },
    { key: "received", label: "Received" },
    { key: "weight", label: "Weight" },
    { key: "shipperName", label: "Shipper Name" },
    { key: "shipperAddress1", label: "Shipper Address 1" },
    { key: "shipperAddress2", label: "Shipper Address 2" },
    { key: "shipperCity", label: "Shipper City" },
    { key: "shipperState", label: "Shipper State" },
    { key: "shipperPostcode", label: "Shipper Postcode" },
    { key: "shipperCountry", label: "Shipper Country" },
    { key: "origin", label: "Origin" },
    { key: "destination", label: "Destination" },
    { key: "totalValue", label: "Total Value" },
    { key: "currency", label: "Currency" },
    { key: "sac", label: "SAC" },
  ];

  const columnsTlaManifest = [
    { key: "customerRef", label: "Customer Ref" },
    { key: "connoteNo", label: "CONNOTE NO." },
    { key: "weight", label: "Weight" },
    { key: "cnee", label: "CNEE" },
    { key: "cneeCompany", label: "CNEE Company" },
    { key: "tel", label: "Tel" },
    { key: "address", label: "Address" },
    { key: "suburb", label: "Suburb" },
    { key: "state", label: "State" },
    { key: "postalCode", label: "P/C" },
    { key: "destination", label: "Destination" },
    { key: "pcs", label: "PCS" },
    { key: "commodity", label: "Commodity" },
    { key: "innerItems", label: "Inner Items" },
    { key: "unitValue", label: "Unit Value" },
    { key: "ttlValue", label: "TTL Value" },
    { key: "cmeter", label: "CMETER" },
    { key: "shipper", label: "Shipper" },
    { key: "shipperAdd", label: "Shipper Add" },
    { key: "shipperCity", label: "Shipper City" },
    { key: "shipperState", label: "Shipper State" },
    { key: "shipperPc", label: "Shipper PC" },
    { key: "shipperCountryCode", label: "Shipper Country Code" },
    { key: "shipperContact", label: "Shipper Contact" },
    { key: "insurance", label: "Insurance" },
    { key: "receiver", label: "Receiver" },
    { key: "receiverTel", label: "Receiver Tel" },
    { key: "receiverAddress", label: "Receiver Address" },
    { key: "receiverSuburb", label: "Receiver Suburb" },
    { key: "receiverState", label: "Receiver State" },
    { key: "receiverPc", label: "Receiver P/C" },
    { key: "clear", label: "Clear" },
    { key: "fbaPo", label: "FBA PO" },
    { key: "fbaShipmentId", label: "FBA Shipment ID" },
    { key: "invoiceRef", label: "Invoice Ref" },
    { key: "importerAbn", label: "Importer ABN" },
    { key: "vendorId", label: "Vendor ID" },
    { key: "consignorTin", label: "Consignor TIN" },
    { key: "dg", label: "DG" },
    { key: "directLodge", label: "Direct Lodge" },
    { key: "packages", label: "Packages" },
    { key: "peNumber", label: "PE Number" },
    { key: "cneeEmail", label: "CNEE Email" },
    { key: "marksAndNumbers", label: "Marks And Numbers" },
    { key: "currency", label: "Currency" },
    { key: "woodenBox", label: "Wooden Box" },
    { key: "hasForklift", label: "Has Forklift" },
    { key: "receiverEmail", label: "Receiver Email" },
    { key: "fbaUnit", label: "FBA Unit" },
  ];

  const columnsBagReport = [
    { key: "srNo", label: "SR No." },
    { key: "awbNo", label: "AWB No." },
    { key: "pcs", label: "PCS" },
    { key: "runNo", label: "Run No." },
    { key: "childAwbNo", label: "Child AWB" },
    { key: "bagNo", label: "Bag No." },
    { key: "bagWeight", label: "Bag Weight" },
  ];

  const columnsBagBarcode = [
    { key: "hbl", label: "HBL" },
    { key: "barcode", label: "BARCODE" },
    { key: "courier", label: "COURIER" },
    { key: "connote", label: "CONNOTE" },
    { key: "sn", label: "SN" },
  ];

  const columnsTag = [
    { key: "bagTag", label: "Bag Tag" },
    { key: "reference", label: "Reference" },
    { key: "destination", label: "Destination" },
    { key: "isLetter", label: "Is Letter" },
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

  // Handle data update from search and replace
  const handleDataUpdate = (updatedData) => {
    if (currentView === "invoice") {
      setInvoiceRows(updatedData);
    } else {
      setRows(updatedData);
    }
  };

  // Handle individual replacements
  const handleReplace = (oldValue, newValue, location) => {
    showNotification(
      "success",
      `Replaced "${oldValue}" with "${newValue}" in row ${location.rowIndex + 1}, ${location.columnLabel}`
    );
  };

  // Get current columns based on view type
  const getCurrentColumns = () => {
    if (currentView === "tla") return columnsTlaManifest;
    if (currentView === "bag-report") return columnsBagReport;
    if (currentView === "bag-barcode") return columnsBagBarcode;
    if (currentView === "bag-tag") return columnsTag;
    if (currentView === "invoice") return invoiceColumns;
    return columnsAUS;
  };

  // Get current rows based on view type
  const getCurrentRows = () => {
    if (currentView === "invoice") return invoiceRows;
    return rows;
  };

  // ========== UNIFIED FETCH FUNCTION ==========
  const handleShow = async (viewType = "standard") => {
    if (!runNo || runNo.trim() === "") {
      showNotification("error", "Please enter a Run Number");
      return;
    }

    setLoading(true);
    setRows([]);
    setInvoiceRows([]);
    setInvoiceData(null);
    setRunInfo(null);

    try {
      let endpoint;
      let isInvoiceView = viewType === "invoice";

      if (isInvoiceView) {
        endpoint = `${server}/overseas-manifest/aus/invoice?runNo=${runNo}`;
      } else if (viewType === "standard") {
        endpoint = `${server}/overseas-manifest/aus?runNo=${runNo}`;
      } else {
        endpoint = `${server}/overseas-manifest/aus?runNo=${runNo}&format=${viewType}`;
      }

      const response = await axios.get(endpoint);

      if (response.data.success) {
        if (isInvoiceView) {
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
            customCurrency: item.customCurrency || "AUD",
          }));

          setInvoiceRows(formattedInvoiceData);
          setInvoiceData(response.data.data);
          setRunInfo(response.data.runInfo);
          showNotification("success", `Found ${finalInvoiceData.length} invoice items`);
        } else {
          const fetchedData = response.data.data || [];
          const rowsWithId = fetchedData.map((row, index) => ({
            ...row,
            id: viewType === "bag-report" ? row.srNo : index + 1,
          }));

          setRows(rowsWithId);
          setRunInfo(response.data.runInfo);
          
          let viewName = "Standard Manifest";
          if (viewType === "tla") viewName = "TLA Manifest";
          else if (viewType === "bag-report") viewName = "Bag Report";
          else if (viewType === "bag-barcode") viewName = "Bag Barcode";
          else if (viewType === "bag-tag") viewName = "Bag Tag";
          
          showNotification("success", `Loaded ${viewName} with ${response.data.count} records`);
        }

        setCurrentView(viewType);
      } else {
        showNotification("error", response.data.message || "No data found");
        setRows([]);
        setInvoiceRows([]);
        setRunInfo(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch data"
      );
      setRows([]);
      setInvoiceRows([]);
      setRunInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // ========== DOWNLOAD FUNCTIONS ==========
  const handleDownloadCSV = () => {
    const rowsToUse = getCurrentRows();
    const columnsToUse = getCurrentColumns();

    if (rowsToUse.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      let fileName;

      if (currentView === "tla") {
        fileName = `TLA_Manifest_${runNo}_${new Date().getTime()}.csv`;
      } else if (currentView === "bag-report") {
        fileName = `Bag_Report_${runNo}_${new Date().getTime()}.csv`;
        const headers = columnsToUse.map((col) => col.label).join(",");
        const csvRows = [];
        
        rowsToUse.forEach((row, rowIndex) => {
          const childAwbs = row.childAwbNo ? row.childAwbNo.split(', ') : [''];
          
          childAwbs.forEach((childAwb, childIndex) => {
            const rowData = columnsToUse.map((col) => {
              let value = '';
              if (col.key === 'childAwbNo') {
                value = childAwb.trim();
              } else if (childIndex === 0) {
                value = row[col.key] || "";
              } else {
                value = "";
              }
              return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(rowData.join(","));
          });
          
          if (rowIndex < rowsToUse.length - 1) {
            csvRows.push(columnsToUse.map(() => '""').join(","));
          }
        });

        const csvContent = [headers, ...csvRows].join("\n");
        downloadCSVFile(csvContent, fileName);
        showNotification("success", "Bag Report CSV downloaded successfully");
        return;
      } else if (currentView === "bag-barcode") {
        fileName = `Bag_Barcode_${runNo}_${new Date().getTime()}.csv`;
        const headers = columnsToUse.map((col) => col.label).join(",");
        const csvRows = [];
        
        rowsToUse.forEach((row, rowIndex) => {
          const barcodes = row.barcode ? row.barcode.split(', ') : [''];
          const serialNumbers = row.sn ? row.sn.split(', ') : [''];
          
          const maxLength = Math.max(barcodes.length, serialNumbers.length);
          
          for (let i = 0; i < maxLength; i++) {
            const rowData = columnsToUse.map((col) => {
              let value = '';
              if (col.key === 'barcode') {
                value = barcodes[i] ? barcodes[i].trim() : '';
              } else if (col.key === 'sn') {
                value = serialNumbers[i] ? serialNumbers[i].trim() : '';
              } else if (i === 0) {
                value = row[col.key] || "";
              } else {
                value = "";
              }
              return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(rowData.join(","));
          }
          
          if (rowIndex < rowsToUse.length - 1) {
            csvRows.push(columnsToUse.map(() => '""').join(","));
          }
        });

        const csvContent = [headers, ...csvRows].join("\n");
        downloadCSVFile(csvContent, fileName);
        showNotification("success", "Bag Barcode CSV downloaded successfully");
        return;
      } else if (currentView === "bag-tag") {
        fileName = `Bag_Tag_${runNo}_${new Date().getTime()}.csv`;
        const headers = columnsToUse.map((col) => col.label).join(",");
        const csvRows = [];
        
        rowsToUse.forEach((row, rowIndex) => {
          const references = row.reference ? row.reference.split(', ') : [''];
          
          references.forEach((ref, refIndex) => {
            const rowData = columnsToUse.map((col) => {
              let value = '';
              if (col.key === 'reference') {
                value = ref.trim();
              } else if (refIndex === 0) {
                value = row[col.key] || "";
              } else {
                value = "";
              }
              return `"${String(value).replace(/"/g, '""')}"`;
            });
            csvRows.push(rowData.join(","));
          });
          
          if (rowIndex < rowsToUse.length - 1) {
            csvRows.push(columnsToUse.map(() => '""').join(","));
          }
        });

        const csvContent = [headers, ...csvRows].join("\n");
        downloadCSVFile(csvContent, fileName);
        showNotification("success", "Bag Tag CSV downloaded successfully");
        return;
      } else if (currentView === "invoice") {
        fileName = `AUS_Invoice_${runNo}_${new Date().getTime()}.csv`;
      } else {
        if (clubChecked) {
          const clubbedData = {};
          rowsToUse.forEach((row) => {
            const key = `${row.recieverFullName}_${row.recieverAddress}_${row.receivercity}_${row.receiverPostcode}`;
            if (!clubbedData[key]) {
              clubbedData[key] = { ...row, totalValue: 0, pcs: 0, weight: 0 };
            }
            clubbedData[key].totalValue = (
              parseFloat(clubbedData[key].totalValue) +
              parseFloat(row.totalValue || 0)
            ).toFixed(2);
            clubbedData[key].pcs += parseInt(row.pcs || 0);
            clubbedData[key].weight += parseFloat(row.weight || 0);
          });

          const clubbedRows = Object.values(clubbedData);
          const headers = columnsAUS.map((col) => col.label).join(",");
          const csvRows = clubbedRows.map((row) =>
            columnsAUS
              .map((col) => {
                const value = row[col.key] || "";
                return `"${String(value).replace(/"/g, '""')}"`;
              })
              .join(",")
          );

          const csvContent = [headers, ...csvRows].join("\n");
          downloadCSVFile(
            csvContent,
            `AUS_Manifest_Clubbed_${runNo}_${new Date().getTime()}.csv`
          );
          showNotification("success", "Clubbed CSV downloaded successfully");
          return;
        }
        fileName = `AUS_Manifest_${runNo}_${new Date().getTime()}.csv`;
      }

      const headers = columnsToUse.map((col) => col.label).join(",");
      const csvRows = rowsToUse.map((row) =>
        columnsToUse
          .map((col) => {
            const value = row[col.key] || "";
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(",")
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

  const handleDownloadPDF = () => {
    const rowsToUse = getCurrentRows();
    const columnsToUse = getCurrentColumns();

    if (rowsToUse.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const doc = new jsPDF("landscape");
      doc.setFontSize(16);
      
      let title = "Overseas Manifest";
      if (currentView === "bag-report") title = "Bag Report";
      else if (currentView === "tla") title = "TLA Manifest";
      else if (currentView === "bag-barcode") title = "Bag Barcode";
      else if (currentView === "bag-tag") title = "Bag Tag";
      else if (currentView === "invoice") title = "AUS Invoice";
      
      doc.text(title, 14, 15);

      if (runInfo) {
        doc.setFontSize(10);
        doc.text(`Run No: ${runInfo.runNo || ""}`, 14, 25);
        doc.text(`Sector: ${runInfo.sector || ""}`, 14, 30);
        doc.text(`Flight: ${runInfo.flight || ""}`, 14, 35);
      }

      const tableColumn = columnsToUse.map((col) => col.label);
      const tableRows = rowsToUse.map((row) =>
        columnsToUse.map((col) => {
          const value = row[col.key];
          return value !== null && value !== undefined ? String(value) : "";
        })
      );

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [220, 38, 38] },
        margin: { left: 5, right: 5 },
      });

      doc.save(`${title.replace(/\s+/g, '_')}_${runNo}_${new Date().getTime()}.pdf`);
      showNotification("success", "PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("error", `Failed to generate PDF: ${error.message}`);
    }
  };

  const handleDownloadExcel = () => {
    const rowsToUse = getCurrentRows();
    const columnsToUse = getCurrentColumns();

    if (rowsToUse.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      let fileName, sheetName;

      if (currentView === "tla") {
        fileName = `TLA_Manifest_${runNo}_${new Date().getTime()}.xlsx`;
        sheetName = "TLA Manifest";
      } else if (currentView === "bag-report") {
        fileName = `Bag_Report_${runNo}_${new Date().getTime()}.xlsx`;
        sheetName = "Bag Report";
      } else if (currentView === "bag-barcode") {
        fileName = `Bag_Barcode_${runNo}_${new Date().getTime()}.xlsx`;
        sheetName = "Bag Barcode";
      } else if (currentView === "bag-tag") {
        fileName = `Bag_Tag_${runNo}_${new Date().getTime()}.xlsx`;
        sheetName = "Bag Tag";
      } else if (currentView === "invoice") {
        fileName = `AUS_Invoice_${runNo}_${new Date().getTime()}.xlsx`;
        sheetName = "AUS Invoice";
      } else {
        fileName = `AUS_Manifest_${runNo}_${new Date().getTime()}.xlsx`;
        sheetName = "AUS Manifest";
      }

      const data = rowsToUse.map((row) => {
        const formattedRow = {};
        columnsToUse.forEach((col) => {
          formattedRow[col.label] = row[col.key] || "";
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
            ws[cellAddress].s.fill = {
              fgColor: { rgb: "E0E0E0" },
            };
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

  // ========== INVOICE PDF FUNCTION ==========
  const handleGenerateInvoicePDF = async () => {
    // If invoice view is not loaded, load it first
    if (currentView !== "invoice" || invoiceRows.length === 0) {
      await handleShow("invoice");
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (invoiceRows.length === 0 || !invoiceData) {
      showNotification(
        "error",
        "No invoice data to generate PDF. Please try again."
      );
      return;
    }

    setInvoicePdfLoading(true);

    try {
      const pdf = new jsPDF("p", "mm", "a4");

      // Group invoice rows by AWB No
      const awbGroups = {};
      invoiceRows.forEach((row) => {
        const awbNo = row.awbNo || "NO_AWB";
        if (!awbGroups[awbNo]) {
          awbGroups[awbNo] = [];
        }
        awbGroups[awbNo].push(row);
      });

      const awbNumbers = Object.keys(awbGroups);

      // Generate a separate page for each AWB
      for (let awbIndex = 0; awbIndex < awbNumbers.length; awbIndex++) {
        const currentAwbNo = awbNumbers[awbIndex];
        const awbItems = awbGroups[currentAwbNo];

        // Calculate total for this AWB
        const awbTotal = awbItems
          .reduce((sum, row) => {
            return sum + parseFloat(row.customValue || 0);
          }, 0)
          .toFixed(2);

        // Prepare invoice data structure for this AWB
        const invoiceDataFormatted = {
          shipperName: invoiceData?.shipperName || "M5C LOGISTICS",
          shipperAddress: invoiceData?.shipperAddress || "F-280, SECTOR-63",
          shipperCity: invoiceData?.shipperCity || "NOIDA",
          shipperState: invoiceData?.shipperState || "UTTAR PRADESH",
          shipperPin: invoiceData?.shipperPin || "201301",
          shipperKycType: invoiceData?.shipperKycType || "PAN",
          shipperAadhar: invoiceData?.shipperAadhar || "ABCDE1234F",
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
          destination: invoiceData?.destination || "AUSTRALIA",
          terms: invoiceData?.terms || "DDP",
          currency: invoiceData?.currency || "AUD",
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
            customValue: parseFloat(row.customValue || 0).toFixed(2),
          })),
        };

        // Create hidden content div for this AWB
        const contentDiv = document.createElement("div");
        contentDiv.style.position = "absolute";
        contentDiv.style.left = "0";
        contentDiv.style.top = "0";
        contentDiv.style.zIndex = "-1";
        contentDiv.style.width = "800px";
        contentDiv.style.fontFamily = "Arial, sans-serif";

        // Build table rows
        let tableRowsHTML = "";
        invoiceDataFormatted.items.forEach((item, idx) => {
          const prevBoxNo = invoiceDataFormatted.items[idx - 1]?.boxNo;
          const showBoxNo = item.boxNo !== prevBoxNo;

          tableRowsHTML += `
          <tr class="pb-2">
            <td class="border-black p-1 pb-3 text-center align-top" style="vertical-align: top; padding: 4px; line-height: 1.2; text-align: center;">
              ${showBoxNo ? item.boxNo : ""}
            </td>
            <td class="border-l border-black p-1 pb-3 text-left align-top" style="border-left: 2px solid black; vertical-align: top; padding: 4px; line-height: 1.2; text-align: left;">
              ${item.description}
            </td>
            <td class="border-l border-black p-1 pb-3 text-center align-top" style="border-left: 2px solid black; vertical-align: top; padding: 4px; line-height: 1.2; text-align: center;">
              ${item.hsn}
            </td>
            <td class="border-l border-black p-1 pb-3 text-center align-top" style="border-left: 2px solid black; vertical-align: top; padding: 4px; line-height: 1.2; text-align: center;">
              ${item.quantity}
            </td>
            <td class="border-l border-black p-1 pb-3 text-center align-top" style="border-left: 2px solid black; vertical-align: top; padding: 4px; line-height: 1.2; text-align: center;">
              ${item.rate}
            </td>
            <td class="border-l border-black p-1 pb-3 text-center align-top" style="border-left: 2px solid black; vertical-align: top; padding: 4px; line-height: 1.2; text-align: center;">
              ${item.amount}
            </td>
            <td class="border-l border-black p-1 pb-3 text-center align-top" style="border-left: 2px solid black; vertical-align: top; padding: 4px; line-height: 1.2; text-align: center;">
              ${item.customValue}
            </td>
            <td class="border-l border-black p-1 pb-3 text-center align-top" style="border-left: 2px solid black; vertical-align: top; padding: 4px; line-height: 1.2; text-align: center;">
              ${invoiceDataFormatted.currency}
            </td>
          </tr>
        `;
        });

        contentDiv.innerHTML = `
        <div class="p-6 bg-white border border-black max-w-4xl mx-auto text-xs" style="padding: 24px; background-color: white; border: 2px solid black; max-width: 56rem; margin-left: auto; margin-right: auto; font-size: 12px;">
          <!-- Header -->
          <div class="text-center text-xl font-bold mb-2 border-black pb-2" style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 8px; padding-bottom: 8px;">
            INVOICE - AUSTRALIA
          </div>

          <!-- Top Section -->
          <div class="flex border border-black border-b-0" style="display: flex; border: 2px solid black; border-bottom: 0;">
            <!-- Exporter Column -->
            <div class="flex-1 border-r border-black tracking-wide" style="flex: 1; border-right: 2px solid black;">
              <div class="p-2" style="padding: 8px; height: 100px;">
                <div class="font-semibold mb-1 text-sm" style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">Exporter</div>
                <div class="text-xs" style="font-size: 12px;">
                  <div>${invoiceDataFormatted.shipperName}</div>
                  <div>${invoiceDataFormatted.shipperAddress}</div>
                  <div>${invoiceDataFormatted.shipperCity}</div>
                  <div class="mt-2 mb-1" style="margin-top: 8px; margin-bottom: 4px;">
                    <span class="font-semibold" style="font-weight: 600;">${invoiceDataFormatted.shipperKycType} &nbsp;&nbsp;</span>
                    ${invoiceDataFormatted.shipperAadhar}
                  </div>
                </div>
              </div>
              
              <div class="flex-1 border-black border-t mt-4" style="flex: 1; border-top: 2px solid black; margin-top: 16px;">
                <div class="p-2" style="padding: 8px;">
                  <div class="font-semibold mb-1" style="font-weight: 600; margin-bottom: 4px;">Consignee</div>
                  <div class="text-xs" style="font-size: 12px; height: 100px;">
                    <div>${invoiceDataFormatted.consigneeName}</div>
                    <div>${invoiceDataFormatted.consigneeAddress}</div>
                    <div>${invoiceDataFormatted.consigneeCity}</div>
                    <div>${invoiceDataFormatted.consigneeState}</div>
                    <div>${invoiceDataFormatted.consigneePin}</div>
                    <div>${invoiceDataFormatted.consigneePhone}</div>
                  </div>
                </div>

                <div class="flex text-xs" style="display: flex; font-size: 12px;">
                  <div class="w-full" style="width: 50%;">
                    <div class="flex-1 border border-l-0 border-black p-1" style="flex: 1; border: 2px solid black; border-left: 0; height: 60px; padding: 4px;">
                      <span class="font-semibold" style="font-weight: 600;">Pre-Carriage by</span>
                      <div>${invoiceDataFormatted.preCarriageBy}</div>
                    </div>
                    <div class="flex-1 border-r border-black p-1" style="flex: 1; border-right: 2px solid black; height: 60px; padding: 4px;">
                      <span class="font-semibold" style="font-weight: 600;">Vessel / Flight No.</span>
                      <div>${invoiceDataFormatted.flightNo}</div>
                    </div>
                  </div>
                  <div class="w-full" style="width: 50%;">
                    <div class="flex-1 border-b border-t border-black p-1" style="flex: 1; border-bottom: 2px solid black; border-top: 2px solid black; height: 60px; padding: 4px;">
                      <span class="font-semibold" style="font-weight: 600;">Place of Receipt by pre-carrier</span>
                      <div>${invoiceDataFormatted.placeOfReceipt}</div>
                    </div>
                    <div class="flex-1 border-black p-1" style="flex: 1; height: 60px; padding: 4px;">
                      <div class="font-semibold" style="font-weight: 600;">Port of Loading</div>
                      <div>${invoiceDataFormatted.portOfLoading}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- AWB and Details Column -->
            <div class="flex-1 border-black" style="flex: 1;">
              <div class="flex text-xs" style="display: flex; font-size: 12px;">
                <div class="border-r border-b border-black p-2 w-1/2" style="border-right: 2px solid black; border-bottom: 2px solid black; padding: 8px; width: 50%; height: 50px;">
                  <span class="font-semibold" style="font-weight: 600;">Awb No. and Date</span>
                  <div>${invoiceDataFormatted.awbNo} &nbsp;&nbsp;&nbsp;&nbsp; ${invoiceDataFormatted.date}</div>
                </div>
                <div class="flex-1 border-b border-black mt-2" style="flex: 1; border-bottom: 2px solid black; margin-top: 8px;">
                  <div class="font-semibold ml-4" style="font-weight: 600; margin-left: 16px;">
                    <h2>Exporter Ref/Weight</h2>
                    <p class="font-normal" style="font-weight: normal;">${invoiceDataFormatted.weight}</p>
                  </div>
                </div>
              </div>
              
              <div class="mb-2 border-b border-black text-xs mt-2" style="margin-bottom: 8px; border-bottom: 2px solid black; font-size: 12px; height: 40px; margin-top: 8px;">
                <span class="font-semibold ml-2" style="font-weight: 600; margin-left: 8px;">Buyer's order no. and date</span>
                <div>${invoiceDataFormatted.buyerOrderNo}</div>
              </div>
              
              <div class="mb-2 border-b border-black text-xs" style="margin-bottom: 8px; border-bottom: 2px solid black; font-size: 12px; height: 30px;">
                <span class="font-semibold ml-2" style="font-weight: 600; margin-left: 8px;">Other Reference (s)</span>
                <div>${invoiceDataFormatted.otherReference}</div>
              </div>
              
              <div class="border-b border-black text-xs" style="border-bottom: 2px solid black; font-size: 12px; height: 70px;">
                <span class="font-semibold ml-2" style="font-weight: 600; margin-left: 8px;">Buyer (if other has consignee)</span>
                <div>${invoiceDataFormatted.buyerIfOther}</div>
              </div>
              
              <div class="flex text-xs border-b border-black" style="display: flex; font-size: 12px; border-bottom: 2px solid black; height: 80px;">
                <div class="flex-1 border-r p-2 border-black" style="flex: 1; border-right: 2px solid black; padding: 8px;">
                  <span class="font-semibold" style="font-weight: 600;">Country of origin of goods</span>
                  <div>${invoiceDataFormatted.countryOfOrigin}</div>
                </div>
                <div class="flex-1 p-2" style="flex: 1; padding: 8px;">
                  <span class="font-semibold" style="font-weight: 600;">Country of final destination</span>
                  <div>${invoiceDataFormatted.destination}</div>
                </div>
              </div>
              
              <div class="flex-1 text-xs" style="flex: 1; font-size: 12px;">
                <div class="font-semibold text-center p-2" style="font-weight: 600; text-align: center; padding: 8px;">
                  Terms of delivery & Payment
                  <span class="font-normal mt-2 block" style="font-weight: normal; margin-top: 8px; display: block;">${invoiceDataFormatted.terms}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <div class="border border-black" style="height: 525px; border: 2px solid black;">
            <table class="w-full text-xs text-center" style="width: 100%; font-size: 12px; text-align: center; border-collapse: collapse;">
              <thead>
                <tr class="bg-gray-100" style="background-color: #f3f4f6;">
                  <th class="p-1 text-left font-semibold border-black border-b" style="padding: 4px; text-align: left; font-weight: 600; border-bottom: 2px solid black; width: 98px; vertical-align: top; line-height: 1.2;">
                    <div style="display: flex; justify-content: center; align-items: start; line-height: normal; padding-bottom: 4px; min-height: 20px; text-align: start; width: 100%;">Box No</div>
                  </th>
                  <th class="border-l border-black p-1 text-left font-semibold border-b" style="border-left: 2px solid black; padding: 4px; text-align: left; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;">
                    <div style="display: flex; justify-content: center; align-items: start;">Description</div>
                  </th>
                  <th class="border-l border-black p-1 text-center font-semibold border-b" style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;">
                    <div style="display: flex; justify-content: center; align-items: start;">HSN</div>
                  </th>
                  <th class="border-l border-black p-1 text-center font-semibold border-b" style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;">
                    <div style="display: flex; justify-content: center; align-items: start;">Quantity</div>
                  </th>
                  <th class="border-l border-black p-1 text-center font-semibold border-b" style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;">
                    <div style="display: flex; justify-content: center; align-items: start;">Rates</div>
                  </th>
                  <th class="border-l border-black p-1 text-center font-semibold border-b" style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;">
                    <div style="display: flex; justify-content: center; align-items: start;">Amount</div>
                  </th>
                  <th class="border-l border-black p-1 text-center font-semibold border-b" style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;">
                    <div style="display: flex; justify-content: center; align-items: start;">Custom Value</div>
                  </th>
                  <th class="border-l border-black p-1 text-center font-semibold border-b" style="border-left: 2px solid black; padding: 4px; text-align: center; font-weight: 600; border-bottom: 2px solid black; vertical-align: top; line-height: 1.2;">
                    <div style="display: flex; justify-content: center; align-items: start;">Currency</div>
                  </th>
                </tr>
              </thead>
              <tbody class="border-b border-black" style="border-bottom: 2px solid black;">
                ${tableRowsHTML}
              </tbody>
            </table>
          </div>

          <!-- Total -->
          <div class="flex justify-between items-end border-t-0 border-black border p-1" style="display: flex; justify-content: space-between; align-items: end; border: 2px solid black; border-top: 0; padding: 4px;">
            <div class="text-xs" style="font-size: 12px;">Value declared for custom purpose only.</div>
            <div class="text-right" style="text-align: right;">
              <div class="flex justify-end" style="display: flex; justify-content: end; width: 128px;">
                <span class="mr-2 font-semibold" style="margin-right: 8px; font-weight: 600;">Total :</span>
                <span class="mr-1" style="margin-right: 4px;">${invoiceDataFormatted.currency}</span>
                <span class="font-semibold" style="font-weight: 600;">${invoiceDataFormatted.total}</span>
              </div>
            </div>
          </div>
          
          <div class="border border-black border-y-0" style="height: 40px; border: 2px solid black; border-top: 0; border-bottom: 0;"></div>

          <!-- Declaration -->
          <div class="border border-black" style="border: 2px solid black;">
            <div class="flex justify-between" style="display: flex; justify-content: space-between;">
              <div class="border-r border-black p-2" style="border-right: 2px solid black; padding: 8px;">
                <div class="font-semibold mb-1" style="font-weight: 600; margin-bottom: 4px;">Declaration:</div>
                <div class="text-xs" style="font-size: 12px;">${invoiceDataFormatted.declaration}</div>
              </div>
              <div class="text-right font-semibold text-xs p-2" style="text-align: right; font-weight: 600; margin-top: 40px; font-size: 12px; padding: 8px;">
                <div>Signature / Date / Co stamp.</div>
              </div>
            </div>
          </div>
        </div>
      `;

        document.body.appendChild(contentDiv);

        // Wait for rendering
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Convert to canvas
        const canvas = await html2canvas(contentDiv, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          allowTaint: true,
          width: 800,
        });

        // Generate image data
        const imgData = canvas.toDataURL("image/jpeg", 0.85);

        // Add new page if not first AWB
        if (awbIndex > 0) {
          pdf.addPage();
        }

        // Add image to PDF
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Fit to one page
        if (pdfHeight <= pageHeight) {
          pdf.addImage(
            imgData,
            "JPEG",
            0,
            0,
            pdfWidth,
            pdfHeight,
            undefined,
            "FAST"
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
            "FAST"
          );
        }

        // Clean up
        document.body.removeChild(contentDiv);
      }

      // Save PDF with all pages
      const fileName = `AUS_Invoice_${
        runInfo?.runNo || runNo || "Report"
      }_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      showNotification(
        "success",
        `Invoice PDF generated with ${awbNumbers.length} page(s) - one per AWB`
      );
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
      showNotification(
        "error",
        `Failed to generate invoice PDF: ${error.message}`
      );
    } finally {
      setInvoicePdfLoading(false);
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
        tableId="aus-data-table"
      />

      <div className="flex gap-3">
        <InputBox
          register={register}
          setValue={setValue}
          value={`runNo`}
          placeholder={`Run Number`}
        />
        <div className="flex gap-2">
          <OutlinedButtonRed
            label={loading ? "Loading..." : "Show"}
            onClick={() => handleShow(currentView)}
            disabled={loading}
          />
          <DownloadDropdown
            handleDownloadPDF={handleDownloadPDF}
            handleDownloadExcel={handleDownloadExcel}
            handleDownloadCSV={handleDownloadCSV}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-start gap-6">
          <div>
            <RedCheckbox
              label={`Club Value`}
              isChecked={clubChecked}
              setChecked={setClubChecked}
              id="clubValue"
              register={register}
              setValue={setValue}
            />
          </div>
          <div>
            <RedCheckbox
              label={`AUD Currency`}
              isChecked={audChecked}
              setChecked={setAudChecked}
              id="audCurrency"
              register={register}
              setValue={setValue}
            />
          </div>
        </div>
        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            columns={getCurrentColumns()}
            rowData={getCurrentRows()}
            className={`h-[50vh]`}
            tableId="aus-data-table"
          />
        </div>
        <div className="flex gap-6 mt-1">
          <OutlinedButtonRed
            label={"Manifest"}
            onClick={() => handleShow("standard")}
            disabled={loading}
          />
          <OutlinedButtonRed
            label={"TLA Manifest"}
            onClick={() => handleShow("tla")}
            disabled={loading}
          />
          <OutlinedButtonRed
            label={"Bag R-Order"}
            onClick={() => handleShow("bag-report")}
            disabled={loading}
          />
          <OutlinedButtonRed 
            label={"Bag Tag"} 
            onClick={() => handleShow("bag-tag")}
            disabled={loading}
          />
          <OutlinedButtonRed 
            label={"Bag Barcode"} 
            onClick={() => handleShow("bag-barcode")}
            disabled={loading}
          />
          <OutlinedButtonRed
            label={invoicePdfLoading ? "Generating..." : "Invoice PDF"}
            onClick={handleGenerateInvoicePDF}
            disabled={invoicePdfLoading || loading}
          />
        </div>
      </div>
    </div>
  );
};

export default AUSComponent;