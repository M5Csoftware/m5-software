"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { TableWithSorting } from "../Table";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import * as XLSX from "xlsx";
import NotificationFlag from "../Notificationflag";

const Excel = ({ onClose, onSave, refreshKey }) => {
  const { register, setValue } = useForm();
  const [rowData, setRowData] = useState([]);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "fwdNo", label: "FWD No." },
    { key: "forwarder", label: "Forwarder" },
    { key: "coLoader", label: "Co-Loader" },
    { key: "coLoaderNo", label: "Co-Loader No." },
  ];

  // Validate File Type
  const validateFile = (file) => {
    if (!file) return false;

    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (!validTypes.includes(file.type)) {
      setError("Only CSV or Excel files allowed.");
      showNotification("error", "Invalid file type");
      return false;
    }

    showNotification("success", "File accepted");
    setError("");
    return true;
  };

  // Handle File Browse
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (validateFile(file)) {
      readExcel(file);
    }
  };

  // Drag & Drop
  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (validateFile(file)) {
      showNotification("success", "File dropped");
      readExcel(file);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
    showNotification("success", "Drop file to upload");
  };

  const handleDragLeave = () => setDragging(false);

  // Parse Excel/CSV Data
  const readExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

      const mappedData = jsonData.map((row) => ({
        awbNo: row["AWB No."] || "",
        fwdNo: row["FWD No."] || "",
        forwarder: row["Forwarder"] || "",
        coLoader: row["Co-Loader"] || "",
        coLoaderNo: row["Co-Loader No."] || "",
      }));

      setRowData(mappedData);
      setFileUploaded(true);
      showNotification("success", "File parsed successfully");
    };
    reader.readAsArrayBuffer(file);
  };

  // Download Sample CSV
  const downloadSample = () => {
    const sample = [
      ["AWB No.", "FWD No.", "Forwarder", "Co-Loader", "Co-Loader No."],
      ["1234567890", "FWD123", "DHL", "XYZ", "COL123"],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sample);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");
    XLSX.writeFile(workbook, "sample.csv");

    showNotification("success", "Sample CSV downloaded");
  };

  // Save Data
  const handleSave = () => {
    if (rowData.length === 0) {
      setError("No data to save.");
      showNotification("error", "No data available");
      return;
    }

    showNotification("success", "Data saved!");
    if (onSave) onSave(rowData);
  };

  useEffect(() => {
    setRowData([]);
    setFileUploaded(false);
    showNotification("success", "Form reset");
  }, [refreshKey]);

  return (
    <div className="flex flex-col gap-8">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <div className="flex gap-9">
        {/* Upload Section */}
        <div className="flex flex-col gap-5 w-full">
          <div
            className={`w-full h-[235px] border-dashed border-2 rounded-lg p-20 pt-9 text-center flex flex-col items-center justify-center gap-2 ${
              dragging
                ? "border-red-500 bg-red-50"
                : "border-[#979797] bg-[#FAFAFA]"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-gray-500 pt-[15%] text-xs flex gap-2 flex-col">
              <span className="block font-medium">
                Drag & Drop to Upload File
              </span>
              <span className="block text-xs">OR</span>
            </div>

            <label
              htmlFor="fileInput"
              className="bg-red text-white rounded-md text-xs flex items-center justify-center py-[6px] px-6 cursor-pointer"
            >
              Browse File
            </label>

            <input
              id="fileInput"
              type="file"
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <OutlinedButtonRed
            label="Download Sample CSV File"
            onClick={downloadSample}
          />
        </div>

        {/* Table Preview */}
        <div className="w-full h-[296px] flex flex-col gap-3 overflow-auto">
          <TableWithSorting
            register={register}
            setValue={setValue}
            name="Uploaded Data"
            columns={columns}
            rowData={rowData}
          />
          <SimpleButton name="Save" onClick={handleSave} perm="CC Edit" />
        </div>
      </div>

      <div className="flex justify-between"></div>
    </div>
  );
};

export default Excel;
