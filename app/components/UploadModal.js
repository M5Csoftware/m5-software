"use client";
import React, { useState } from "react";
import Image from "next/image";
import classNames from "classnames";
import { OutlinedButtonRed } from "./Buttons";
import * as XLSX from "xlsx";


const UploadModal = ({ onClose, onFileChange, setVisible, entityType = "Service", }) => {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // store file until Upload clicked

  const BULK_TEMPLATES = {
    Service: {
      sample: {
        code: "SRV100",
        name: "Test Express Service",
        sector: "Logistics",
        activeOnPortal: "TRUE",
        activeOnSoftware: "TRUE",
      },
    },

    Country: {
      sample: {
        code: "IN",
        name: "India",
      },
    },

    State: {
      sample: {
        code: "MH",
        name: "Maharashtra",
      },
    },

    City: {
      sample: {
        code: "BOM",
        name: "Mumbai",
      },
    },

    "Misc Charges": {
      sample: {
        code: "MSC01",
        name: "Fuel Surcharge",
        hsn: "9965",
        taxCharges: "TRUE",
        fuelCharges: "TRUE",
      },
    },
  };

  const handleFileSelect = (file) => {
    if (
      file &&
      (file.type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
        file.type === "application/vnd.ms-excel") // .xls
    ) {
      setFileUploaded(true);
      setFileName(file.name);
      setSelectedFile(file);
      setError("");
    } else {
      setError("Please select a valid .xls or .xlsx file.");
      setFileUploaded(false);
      setFileName("");
      setSelectedFile(null);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleUploadClick = () => {
    if (selectedFile) {
      // simulate change event for parent (EntityManager)
      const fakeEvent = { target: { files: [selectedFile] } };
      onFileChange(fakeEvent);
      onClose();
      setVisible(true);
    }
  };

  const handleSampleDownload = () => {
    const template = BULK_TEMPLATES[entityType];

    if (!template) {
      alert("No sample format available for this entity");
      return;
    }

    const ws = XLSX.utils.json_to_sheet([template.sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    XLSX.writeFile(wb, `${entityType}_sample.xlsx`);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => {
    setDragging(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-50">
      <div className="bg-white px-8 py-6 flex flex-col gap-3 items-center rounded-lg shadow-lg w-[485px] h-[425px]">
        <h2 className="font-bold text-sm">
          Bulk Upload – {entityType}
        </h2>


        <div className="flex px-4 py-2 gap-2 bg-[#FBF3E0] border-2 border-[#F9F06D] rounded-lg text-[#C3B600] text-xs">
          <Image src="/i_icon.svg" width={16} height={16} alt="" />
          <h3>Download the Sample Excel file before uploading</h3>
        </div>

        <button
          type="button"
          className="flex px-4 py-2 gap-2 text-[var(--primary-color)] text-xs"
          onClick={handleSampleDownload}
        >
          <Image src="/download_red.svg" width={16} height={16} alt="" />
          <h3>Download Sample Excel File</h3>
        </button>

        {/* Drag & Drop Area */}
        <div
          className={classNames(
            "file-input-wrapper border-2 border-dashed rounded-lg",
            dragging ? "border-[var(--primary-color)]" : "border-[#979797]"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label
            htmlFor="file-upload"
            className={classNames(
              "bg-[#FAFAFA] rounded-lg flex flex-col gap-2 w-[365px] h-40 justify-center items-center cursor-pointer text-center",
              "text-[#A0AEC0]"
            )}
          >
            {!fileUploaded ? (
              <Image src="/upload_file.svg" width={24} height={24} alt="" />
            ) : (
              <Image src="/file-uploaded.svg" width={36} height={36} alt="" />
            )}
            <span>
              {fileUploaded
                ? `File Selected: ${fileName}`
                : "Drag & Drop to Upload File"}
            </span>
            {!fileUploaded && <span className="text-[#A0AEC0]">OR</span>}
            {!fileUploaded && (
              <span className="bg-[#c50b30e7] rounded-md px-1.5 py-2 text-white">
                Browse File
              </span>
            )}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".xls,.xlsx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && <p className="text-red-500 text-xs">{error}</p>}

        {/* Footer Buttons */}
        <div className="flex gap-4 mt-4">
          <OutlinedButtonRed label={"Cancel"} onClick={onClose} />
          <button
            disabled={!fileUploaded}
            onClick={handleUploadClick}
            className={`transition-all text-white font-semibold rounded-md text-sm py-2.5 px-11 ${fileUploaded
              ? "bg-[#c50b30e7] hover:bg-[#c50b30cc]"
              : "bg-[#C50B31] cursor-not-allowed "
              }`}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
