"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import SearchAndReplace from "@/app/components/SearchAndReplace"

const EUComponent = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch, reset } = useForm();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runInfo, setRunInfo] = useState(null);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const runNo = watch("runNo");

  const columnsEU = [
    { key: "trackingNumber", label: "Tracking Number" },
    { key: "refrenceNumber", label: "Reference Number" },
    { key: "bagNo", label: "Bag Number" },
    { key: "bagLabel", label: "Bag Label" },
    { key: "internalAccountNumber", label: "Internal Account Number" },
    { key: "shipperFullName", label: "Shipper Full Name" },
    { key: "shipperAddress1", label: "Shipper Address 1" },
    { key: "shipperAddress2", label: "Shipper Address 2" },
    { key: "shipperCity", label: "Shipper City" },
    { key: "shipperState", label: "Shipper State" },
    { key: "shipperPincode", label: "Shipper Pincode" },
    { key: "shipperCountry", label: "Shipper Country" },
    { key: "receieverFullName", label: "Consignee Full Name" },
    { key: "receiverAddressLine1", label: "Consignee Address 1" },
    { key: "receiverAddressLine2", label: "Consignee Address 2" },
    { key: "receiverCity", label: "Consignee City" },
    { key: "receiverState", label: "Consignee State" },
    { key: "receiverPincode", label: "Consignee Pincode" },
    { key: "receiverCountry", label: "Consignee Country" },
    { key: "receiverEmail", label: "Consignee Email" },
    { key: "receiverPhoneNumber", label: "Consignee Phone Number" },
    { key: "pcs", label: "Pcs" },
    { key: "totalWeight", label: "Total Weight" },
    { key: "weightUom", label: "Weight UOM" },
    { key: "totalValue", label: "Total Value" },
    { key: "currency", label: "Currency" },
    { key: "incoterms", label: "Incoterms" },
    { key: "vendor", label: "Vendor" },
    { key: "service", label: "Service" },
    { key: "returnAction", label: "Return Action" },
    { key: "goodsType", label: "Goods Description" },
  ];

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Handle data update from search and replace
  const handleDataUpdate = (updatedData) => {
    setRows(updatedData);
  };

  // Handle individual replacements
  const handleReplace = (oldValue, newValue, location) => {
    showNotification(
      "success",
      `Replaced "${oldValue}" with "${newValue}" in row ${location.rowIndex + 1}, ${location.columnLabel}`
    );
  };

  const handleShow = async () => {
    if (!runNo || runNo.trim() === "") {
      showNotification("error", "Please enter a Run Number");
      return;
    }

    setLoading(true);
    setRows([]);
    setRunInfo(null);

    try {
      const endpoint = `${server}/overseas-manifest/eu?runNo=${runNo}`;
      const response = await axios.get(endpoint);

      if (response.data.success) {
        const fetchedData = response.data.data || [];
        const rowsWithId = fetchedData.map((row, index) => ({
          ...row,
          id: index + 1,
        }));

        setRows(rowsWithId);
        setRunInfo(response.data.runInfo);
        showNotification("success", `Found ${response.data.count} records`);
      } else {
        showNotification("error", response.data.message || "No data found");
        setRows([]);
        setRunInfo(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch data"
      );
      setRows([]);
      setRunInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (rows.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const columns = columnsEU;
      const fileName = `EU_Manifest_${runNo}_${new Date().getTime()}.csv`;

      const headers = columns.map((col) => col.label).join(",");
      const csvRows = rows.map((row) =>
        columns
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
  };

  const handleDownloadPDF = () => {
    if (rows.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const doc = new jsPDF("landscape");
      doc.setFontSize(16);
      doc.text("EU Manifest", 14, 15);

      if (runInfo) {
        doc.setFontSize(10);
        doc.text(`Run No: ${runInfo.runNo || ""}`, 14, 25);
        doc.text(`Sector: ${runInfo.sector || ""}`, 14, 30);
        doc.text(`Flight: ${runInfo.flight || ""}`, 14, 35);
      }

      const tableColumn = columnsEU.map((col) => col.label);
      const tableRows = rows.map((row) =>
        columnsEU.map((col) => {
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

      doc.save(`EU_Manifest_${runNo}_${new Date().getTime()}.pdf`);
      showNotification("success", "PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      showNotification("error", `Failed to generate PDF: ${error.message}`);
    }
  };

  const handleDownloadExcel = () => {
    if (rows.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const columns = columnsEU;
      const fileName = `EU_Manifest_${runNo}_${new Date().getTime()}.xlsx`;
      const sheetName = "EU Manifest";

      const data = rows.map((row) => {
        const formattedRow = {};
        columns.forEach((col) => {
          formattedRow[col.label] = row[col.key] || "";
        });
        return formattedRow;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      const colWidths = columns.map(() => ({ wch: 20 }));
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
        data={rows}
        columns={columnsEU}
        onDataUpdate={handleDataUpdate}
        onReplace={handleReplace}
        isActive={true}
        tableId="eu-data-table"
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
            onClick={handleShow}
            disabled={loading}
          />
          <div>
            <DownloadDropdown
              handleDownloadPDF={handleDownloadPDF}
              handleDownloadExcel={handleDownloadExcel}
              handleDownloadCSV={handleDownloadCSV}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <TableWithSorting
            columns={columnsEU}
            rowData={rows}
            register={register}
            setValue={setValue}
            className={`h-[50vh]`}
            tableId="eu-data-table" // Add tableId prop
          />
        </div>
      </div>
    </div>
  );
};

export default EUComponent;