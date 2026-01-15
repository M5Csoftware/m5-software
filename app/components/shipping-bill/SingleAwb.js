"use client";
import React, { useState, useEffect, useContext } from "react";
import InputBox from "@/app/components/InputBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import NotificationFlag from "@/app/components/Notificationflag";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";

const SingleAwb = ({ register, setValue }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { server } = useContext(GlobalContext);
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
            showNotification("success", "Customer details loaded");
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

  const handleUpload = async () => {
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

    setUploading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("awbNo", formData.awbNumber);
      formDataToSend.append("pdf", selectedFile);
      formDataToSend.append("uploadType", "single");

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
        showNotification("success", "Shipping bill uploaded successfully");
        // Reset form
        setFormData({
          awbNumber: "",
          accountCode: "",
          customerName: "",
          fileName: "",
        });
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Upload error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to upload shipping bill"
      );
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

      <div className="flex gap-2 mt-4">
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
              name={uploading ? "Uploading..." : "Upload"}
              onClick={handleUpload}
              disabled={loading || uploading || !selectedFile}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleAwb;
