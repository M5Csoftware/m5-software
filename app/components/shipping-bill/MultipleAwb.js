"use client";
import React, { useState, useEffect, useContext } from "react";
import InputBox from "@/app/components/InputBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";

const MultipleAwb = ({ register, setValue }) => {
  const [rowData, setRowData] = useState([]);
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const [formData, setFormData] = useState({
    awbNumber: "",
    accountCode: "",
    customerName: "",
    fileName: "",
  });

  const columns = [
    { key: "SrNo", label: "Sr No." },
    { key: "AWB", label: "AWB" },
    { key: "CustomerCode", label: "Customer Code" },
    { key: "CustomerName", label: "Customer Name" },
  ];

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Sync form data with register/setValue
  useEffect(() => {
    if (setValue) {
      setValue("awbNumber", formData.awbNumber);
      setValue("accountCode", formData.accountCode);
      setValue("customerName", formData.customerName);
      setValue("fileName", formData.fileName);
    }
  }, [formData, setValue]);

  // Fetch customer details when AWB number changes
  useEffect(() => {
    const fetchAwbDetails = async () => {
      if (formData.awbNumber && formData.awbNumber.length >= 5) {
        setLoading(true);
        try {
          const response = await axios.get(
            `${server}/awb-details?awbNo=${formData.awbNumber}`
          );

          if (response.data.success) {
            setFormData((prev) => ({
              ...prev,
              accountCode: response.data.data.accountCode,
              customerName: response.data.data.customerName,
            }));
          }
        } catch (error) {
          console.error("Error fetching AWB details:", error);
          setFormData((prev) => ({
            ...prev,
            accountCode: "",
            customerName: "",
          }));
          showNotification(
            "error",
            error.response?.data?.message || "AWB Number not found"
          );
        } finally {
          setLoading(false);
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          accountCode: "",
          customerName: "",
        }));
      }
    };

    const debounceTimer = setTimeout(fetchAwbDetails, 500);
    return () => clearTimeout(debounceTimer);
  }, [formData.awbNumber, server]);

  const handleBrowse = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.type !== "application/pdf") {
          showNotification("error", "Please select a PDF file");
          return;
        }
        setSelectedFile(file);
        setFormData((prev) => ({ ...prev, fileName: file.name }));
        showNotification("success", `File selected: ${file.name}`);
      }
    };
    input.click();
  };

  const handleAdd = () => {
    if (!formData.awbNumber) {
      showNotification("error", "Please enter AWB Number");
      return;
    }
    if (!selectedFile) {
      showNotification("error", "Please select a PDF file");
      return;
    }
    if (!formData.accountCode) {
      showNotification("error", "Customer details not loaded");
      return;
    }

    // Check if AWB already exists in table
    const existingAwb = rowData.find((row) => row.AWB === formData.awbNumber);
    if (existingAwb) {
      showNotification("error", "AWB already added to the list");
      return;
    }

    const newRow = {
      SrNo: rowData.length + 1,
      AWB: formData.awbNumber,
      CustomerCode: formData.accountCode,
      CustomerName: formData.customerName,
      file: selectedFile,
    };

    setRowData([...rowData, newRow]);
    showNotification("success", "AWB added to upload list");

    // Reset form but keep the file for next entry
    setFormData({
      awbNumber: "",
      accountCode: "",
      customerName: "",
      fileName: formData.fileName, // Keep file name
    });
  };

  const handleUploadAll = async () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to upload");
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      // Upload each AWB one by one
      for (let i = 0; i < rowData.length; i++) {
        const row = rowData[i];
        try {
          const formDataToSend = new FormData();
          formDataToSend.append("awbNo", row.AWB);
          formDataToSend.append("pdf", row.file);
          formDataToSend.append("uploadType", "multiple");

          const response = await axios.post(
            `${server}/upload-shipping-bill`,
            formDataToSend,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (response.data.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Error uploading AWB ${row.AWB}:`, error);
          failCount++;
        }
      }

      // Show summary notification
      if (failCount === 0) {
        showNotification(
          "success",
          `All ${successCount} shipping bills uploaded successfully`
        );
        // Clear table
        setRowData([]);
        setSelectedFile(null);
        setFormData({
          awbNumber: "",
          accountCode: "",
          customerName: "",
          fileName: "",
        });
      } else {
        showNotification(
          "warning",
          `${successCount} uploaded successfully, ${failCount} failed`
        );
      }
    } catch (error) {
      console.error("Upload error:", error);
      showNotification("error", "Failed to upload shipping bills");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="w-full">
            <InputBox
              placeholder="AWB Number"
              value="awbNumber"
              register={register}
              setValue={(name, value) => {
                setFormData((prev) => ({ ...prev, awbNumber: value }));
                if (setValue) setValue(name, value);
              }}
            />
          </div>
          <div className="w-full">
            <DummyInputBoxWithLabelDarkGray
              placeholder={"Customer Code"}
              register={register}
              setValue={setValue}
              value={"accountCode"}
              disabled={true}
            />
          </div>
          <DummyInputBoxWithLabelDarkGray
            placeholder={"Customer Name"}
            register={register}
            setValue={setValue}
            value={"customerName"}
            disabled={true}
          />
        </div>
      </div>

      <div className="space-y-3 mt-4">
        <div className="flex gap-2">
          <div className="w-full">
            <DummyInputBoxWithLabelDarkGray
              placeholder={"Pdf File"}
              register={register}
              setValue={setValue}
              value={"fileName"}
              disabled={true}
            />
          </div>
          <div className="flex gap-2 w-[20%]">
            <OutlinedButtonRed
              label={loading ? "Loading..." : "Browse"}
              onClick={handleBrowse}
              disabled={loading || uploading}
            />
            <div>
              <SimpleButton
                name="Add"
                onClick={handleAdd}
                disabled={loading || uploading}
              />
            </div>
          </div>
        </div>

        <TableWithSorting
          register={register}
          setValue={setValue}
          rowData={rowData}
          columns={columns}
          className="h-[45vh]"
        />
      </div>

      <div className="flex justify-end mt-4">
        <div>
          <SimpleButton
            name={uploading ? "Uploading..." : "Upload"}
            onClick={handleUploadAll}
            disabled={uploading || rowData.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default MultipleAwb;
