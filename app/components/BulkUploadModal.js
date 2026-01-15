"use client";
import React, { useState } from "react";
import Image from "next/image";
import classNames from "classnames";

const BulkUploadModal = ({
  onClose,
  onFileUpload, // callback for when file is uploaded
  onDownloadSample, // NEW: callback for downloading sample file
  acceptedTypes = [".xls", ".xlsx", ".csv"], // added .csv
  title = "Bulk Upload Customer Accounts",
  setVisible,
}) => {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (file) => {
    if (file) {
      const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;
      if (acceptedTypes.includes(fileExtension)) {
        setFileUploaded(true);
        setFileName(file.name);
        setSelectedFile(file);
        setError("");
      } else {
        setError(`Please select a valid file (${acceptedTypes.join(", ")})`);
        setFileUploaded(false);
        setFileName("");
        setSelectedFile(null);
      }
    }
  };

  const handleFileChange = (e) => handleFileSelect(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUploadClick = () => {
    if (selectedFile && onFileUpload) {
      onFileUpload(selectedFile);
      onClose();
      if (setVisible) setVisible(true);
    }
  };

  // Updated: Use the onDownloadSample callback instead of direct file link
  const handleSampleDownload = () => {
    if (onDownloadSample) {
      onDownloadSample();
    } else if (sampleFileLink) {
      // Keep backward compatibility
      const link = document.createElement("a");
      link.href = sampleFileLink;
      link.download = sampleFileLink.split("/").pop();
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-50">
      <div className="bg-white px-8 py-6 flex flex-col gap-3 items-center rounded-lg shadow-lg w-[485px] h-[425px]">
        <h2 className="font-bold text-sm">{title}</h2>

        {/* Always show download sample button */}
        <div className="flex flex-col items-center gap-2 mt-2">
          <button
            type="button"
            className="flex px-4 py-2 gap-2 text-[var(--primary-color)] text-xs hover:opacity-80 transition-opacity"
            onClick={handleSampleDownload}
          >
            <Image src="/download_red.svg" width={16} height={16} alt="Download" />
            Download Sample File
          </button>
          <p className="text-xs text-gray-500 text-center">
            Download a sample Excel file with proper formatting
          </p>
        </div>

        <div
          className={classNames(
            "file-input-wrapper border-2 border-dashed rounded-lg mt-2",
            dragging ? "border-[var(--primary-color)]" : "border-[#979797]"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <label
            htmlFor="file-upload"
            className="bg-[#FAFAFA] rounded-lg flex flex-col gap-2 w-[365px] h-40 justify-center items-center cursor-pointer text-center text-[#A0AEC0] hover:bg-gray-50 transition-colors"
          >
            {!fileUploaded ? (
              <Image src="/upload_file.svg" width={24} height={24} alt="Upload" />
            ) : (
              <Image src="/file-uploaded.svg" width={36} height={36} alt="File uploaded" />
            )}
            <span className="text-sm">
              {fileUploaded
                ? `File Selected: ${fileName}`
                : "Drag & Drop to Upload File"}
            </span>
            {!fileUploaded && <span className="text-[#A0AEC0] text-xs">OR</span>}
            {!fileUploaded && (
              <span className="bg-[#c50b30e7] rounded-md px-1.5 py-2 text-white text-xs">
                Browse File
              </span>
            )}
          </label>
          <input
            id="file-upload"
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

        <div className="flex gap-4 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-md text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!fileUploaded}
            onClick={handleUploadClick}
            className={classNames(
              "transition-all text-white font-semibold rounded-md text-sm py-2.5 px-11",
              fileUploaded
                ? "bg-[#c50b30e7] hover:bg-[#c50b30cc]"
                : "bg-gray-400 cursor-not-allowed"
            )}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;