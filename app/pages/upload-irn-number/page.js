"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting, TableWithCheckbox } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import axios from "axios";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";

function UploadIrnNumber() {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();
  const [rowData, setRowData] = useState([]);
  const [fileFormat, setFileFormat] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Watch form values
  const branch = watch("branch");
  const invoiceType = watch("invoiceType");
  const date = watch("date");
  const watchedFileName = watch("fileName");

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${server}/branch-master`);
      if (response.data) {
        setBranches(response.data.map((b) => b.code));
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      showNotification("error", "Failed to fetch branches");
    }
  };

  const columns = useMemo(
    () => [
      { key: "srNo", label: "Sr No" },
      { key: "ackNo", label: "Ack No" },
      { key: "ackDate", label: "Ack Date" },
      { key: "docNo", label: "Document No" },
      { key: "docDate", label: "Document Date" },
      { key: "docType", label: "Document Type" },
      { key: "invValue", label: "Inv Value" },
      { key: "recipientGSTIN", label: "Recipient GSTIN" },
      { key: "status", label: "Status" },
      { key: "irn", label: "IRN" },
      { key: "signedQrCode", label: "Signed QR Code" },
      { key: "ewayBill", label: "Eway Bill No" },
      { key: "excelFile", label: "Excel File" },
    ],
    []
  );

  // Handle browse button click
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file selection and preview
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExtension = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      showNotification("error", "Please select a valid Excel file");
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setValue("fileName", file.name, {
      shouldValidate: true,
      shouldDirty: true,
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, {
        cellDates: true,
        dateNF: "dd/mm/yyyy",
      });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: "",
      });

      // console.log("Excel Raw Data:", jsonData); // Debug log

      if (!jsonData || jsonData.length === 0) {
        showNotification(
          "error",
          "The Excel file is empty. Please upload a file with data."
        );
        setRowData([]);
        return;
      }

      // Get the first row to check actual column names
      if (jsonData.length > 0) {
        // console.log("Excel Column Names:", Object.keys(jsonData[0]));
      }

      // Map Excel data to table format with multiple possible column name variations
      const mappedData = jsonData.map((row, index) => {
        // Get the Excel File value and normalize it
        const excelFileValue =
          row["Excel File"] ||
          row["excel file"] ||
          row["ExcelFile"] ||
          row["Excel_File"] ||
          row["EXCEL_FILE"] ||
          "";

        const mapped = {
          srNo:
            row["Sl. No"] ||
            row["Sl No"] ||
            row["Sr No"] ||
            row["Sr. No"] ||
            index + 1,
          ackNo:
            row["Ack No"] ||
            row["ackNo"] ||
            row["AckNo"] ||
            row["ACK_NO"] ||
            row["Ack_No"] ||
            "",
          ackDate:
            row["Ack Date"] ||
            row["ackDate"] ||
            row["AckDate"] ||
            row["ACK_DATE"] ||
            row["Ack_Date"] ||
            "",
          docNo:
            row["Doc No"] ||
            row["Document No"] ||
            row["docNo"] ||
            row["DocumentNo"] ||
            row["DOC_NO"] ||
            row["Document_No"] ||
            "",
          docDate:
            row["Doc Date"] ||
            row["Document Date"] ||
            row["docDate"] ||
            row["DocumentDate"] ||
            row["DOC_DATE"] ||
            row["Document_Date"] ||
            "",
          docType:
            row["Doc Type"] ||
            row["Document Type"] ||
            row["docType"] ||
            row["DocumentType"] ||
            row["DOC_TYPE"] ||
            row["Document_Type"] ||
            "",
          invValue:
            row["Inv Value"] ||
            row["invValue"] ||
            row["InvValue"] ||
            row["Inv Value."] ||
            row["INV_VALUE"] ||
            row["Inv_Value"] ||
            row["Invoice_Value"] ||
            row["invoice_value"] ||
            row["Value"] ||
            "",
          recipientGSTIN:
            row["Recipient GSTIN"] ||
            row["recipientGSTIN"] ||
            row["RecipientGSTIN"] ||
            row["GSTIN"] ||
            row["RECIPIENT_GSTIN"] ||
            row["Recipient_GSTIN"] ||
            row["Gstin"] ||
            "",
          status: row["Status"] || row["status"] || row["STATUS"] || "",
          irn: row["IRN"] || row["irn"] || row["Irn"] || row["IRN_NO"] || "",
          signedQrCode:
            row["Signed QR Code"] ||
            row["signedQrCode"] ||
            row["SignedQRCode"] ||
            row["QR Code"] ||
            row["SignedQrCOde"] ||
            row["Signed_QR_Code"] ||
            row["QRCode"] ||
            row["qrCode"] ||
            row["Qr_Code"] ||
            row["signed_qr_code"] ||
            "",
          ewayBill:
            row["Eway Bill No"] ||
            row["ewayBill"] ||
            row["Eway Bill No."] ||
            row["E-way Bill"] ||
            row["EWAY_BILL_NO"] ||
            row["Eway_Bill_No"] ||
            row["EWayBillNo"] ||
            row["eway_bill_no"] ||
            row["E-way Bill No"] ||
            row["Ewb No"] ||
            row["EWB_NO"] ||
            "",
          excelFile: excelFileValue,
          // Store the boolean value for backend
          isExcel: excelFileValue.toString().trim().toLowerCase() === "yes",
        };

        // Log individual row mapping for debugging
        if (index === 0) {
          // console.log("First Row Mapping:", mapped);
          // console.log("Raw Row Data:", row);
        }

        return mapped;
      });

      // console.log("Mapped Data:", mappedData); // Debug log

      setRowData(mappedData);
      showNotification(
        "success",
        `File loaded successfully! ${mappedData.length} records found.`
      );
    } catch (error) {
      console.error("Error reading file:", error);
      showNotification(
        "error",
        "Error reading file. Please ensure it's a valid Excel file."
      );
      setRowData([]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    // Validation checks
    if (!selectedFile) {
      showNotification("error", "Please select a file first");
      return;
    }

    if (!branch) {
      showNotification("error", "Please select a branch");
      return;
    }

    if (!invoiceType) {
      showNotification("error", "Please select an invoice type");
      return;
    }

    if (!date) {
      showNotification("error", "Please enter a date");
      return;
    }

    if (rowData.length === 0) {
      showNotification("error", "No data found in the uploaded file");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("branch", branch);
      formData.append("invoiceType", invoiceType);
      formData.append("date", date);

      const response = await axios.post(
        `${server}/upload-irn-number`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const result = response.data;

      if (result.successCount > 0) {
        let message = `Upload completed! Success: ${result.successCount}, Failed: ${result.failedCount}`;

        if (result.results.failed.length > 0) {
          const failedDocs = result.results.failed
            .slice(0, 3)
            .map((f) => `Row ${f.row}: ${f.error}`)
            .join("; ");
          message += `. Failed: ${failedDocs}`;
          if (result.results.failed.length > 3) {
            message += ` and ${result.results.failed.length - 3} more`;
          }
        }
        showNotification("success", message);

        // Log detailed results to console
        if (result.results.failed.length > 0) {
          console.log("Failed uploads:", result.results.failed);
        }
        if (result.results.success.length > 0) {
          // console.log("Successful uploads:", result.results.success);
        }

        // Keep the data in table after successful upload
      } else {
        showNotification("error", "All records failed to upload.");
        console.log("Failed uploads:", result.results.failed);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showNotification("error", "Error uploading file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    setRowData([]);
    setSelectedFile(null);
    setFileName("");
    setValue("branch", "");
    setValue("invoiceType", "");
    setValue("date", "");
    setValue("fileName", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setNotification({
      type: "",
      message: "",
      visible: false,
    });
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title={`Upload IRN Number`}
        bulkUploadBtn="hidden"
        codeListBtn={true}
        onRefresh={() => {
          handleClose();
        }}
        fullscreenBtn={false}
      />

      <div className="flex flex-col gap-3 mt-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <LabeledDropdown
              options={branches}
              value="branch"
              title={`Branch`}
              register={register}
              setValue={setValue}
            />

            <LabeledDropdown
              options={[
                "Export",
                "Import",
                "Credit Note",
                "Duty",
                "Domestic",
                "Air Cargo",
              ]}
              value="invoiceType"
              title={`Invoice Type`}
              register={register}
              setValue={setValue}
            />
            {/* <InputBox
              register={register}
              setValue={setValue}
              value="date"
              type="date"
            /> */}
            <DateInputBox
              register={register}
              setValue={setValue}
              value={`date`}
              placeholder="Date"
            />
          </div>
          <div className="flex gap-2">
            <DummyInputBoxWithLabelDarkGray
              placeholder={"File Name"}
              register={register}
              setValue={setValue}
              value={"fileName"}
            />
            <div className="min-w-[120px]">
              <OutlinedButtonRed
                type="button"
                label={"Browse"}
                onClick={handleBrowseClick}
              />
              <input
                ref={fileInputRef}
                id="file-upload"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex gap-2">
              <SimpleButton
                type="button"
                name={loading ? "Uploading..." : "Upload"}
                onClick={handleUpload}
                disabled={loading || !selectedFile || rowData.length === 0}
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className={`h-[45vh]`}
        />
      </div>

      <div className="flex justify-between">
        <div>
          {/* <OutlinedButtonRed
            type="button"
            label={"Close"}
            onClick={handleClose}
          /> */}
        </div>
      </div>
    </form>
  );
}

export default UploadIrnNumber;
