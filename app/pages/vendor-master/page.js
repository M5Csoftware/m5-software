"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import axios from "axios";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import {
  AddButton,
  EditButton,
  DeleteButton,
} from "@/app/components/AddUpdateDeleteButton";
import { RedLabelHeading } from "@/app/components/Heading";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  vendorCode,
}) => {
  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm(e);
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete vendor{" "}
          <span className="font-semibold">{vendorCode}</span>?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            No
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

function VendorMaster() {
  const {
    server,
    setCodeListConfig,
    setToggleCodeList,
  } = useContext(GlobalContext);

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
    watch,
  } = useForm();

  const [data, setData] = useState([]);
  const [dataUpdate, setDataUpdate] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [addButton, setAddButton] = useState(true);
  const [editButton, setEditButton] = useState(true);
  const [deleteButton, setDeleteButton] = useState(true);
  const [activeTab, setActiveTab] = useState("vendorDetails");
  const [disabledInput, setDisabledInput] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Notification state structure
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };
  const code = watch("code");

  // Helper function to show notifications

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${server}/vendor-master`);
        if (response.status === 200) setData(response.data);
      } catch (error) {
        console.error("Failed to fetch vendor data:", error);
      }
    };
    fetchData();
  }, [dataUpdate]);

  useEffect(() => {
    if (!code || code.trim() === "") {
      setAddButton(true);
      setEditButton(true);
      setDeleteButton(true);
      return;
    }

    const matched = data.find(
      (b) => b.code?.toLowerCase() === code?.toLowerCase()
    );

    if (matched) {
      Object.keys(matched).forEach((key) => {
        if (matched[key] !== undefined) setValue(key, matched[key]);
      });
      setSelectedVendor(matched);
      setAddButton(true);
      setEditButton(false);
      setDeleteButton(false);
      setDisabledInput(true);
    } else {
      reset({ code });
      setAddButton(false);
      setEditButton(true);
      setDeleteButton(true);
      setDisabledInput(false);
    }
  }, [code, data]);

  const handleAdd = async (formData) => {
    try {
      const res = await axios.post(`${server}/vendor-master`, formData);
      // console.log("Vendor added:", res.data);

      showNotification("success", "New Vendor Added Successfully");

      // Update data and refresh form
      setDataUpdate((prev) => !prev);
      handleRefresh();
    } catch (error) {
      console.error("Add failed:", error);
      showNotification("error", "Vendor data add failed!");
    }
  };

  const handleEdit = async (formData) => {
    if (!selectedVendor || !selectedVendor.code) return;

    try {
      const res = await axios.put(
        `${server}/vendor-master?code=${selectedVendor.code}`,
        formData
      );
      // console.log("Vendor updated:", res.data);

      showNotification(
        "success",
        `${formData.code} has been Updated Successfully`
      );

      // Update data and refresh form
      setDataUpdate((prev) => !prev);
      handleRefresh();
    } catch (error) {
      console.error("Edit failed:", error);
      showNotification("error", "Vendor data update failed!");
    }
  };

  const handleEditButton = (data) => {
    if (!editing) {
      setDisabledInput(false);
      setEditing(true);
    } else {
      setEditing(false);
      handleEdit(data);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (e) => {
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!selectedVendor?.code) {
      setShowDeleteModal(false);
      return;
    }

    try {
      await axios.delete(`${server}/vendor-master`, {
        params: { code: selectedVendor.code },
      });
      // console.log("Vendor deleted");

      // Close modal first
      setShowDeleteModal(false);

      // Show notification
      showNotification(
        "success",
        `${selectedVendor.code} has been Deleted Successfully`
      );

      // Reset form and state
      reset();
      setDisabledInput(false);
      setEditing(false);
      setAddButton(true);
      setEditButton(true);
      setDeleteButton(true);
      setSelectedVendor(null);

      // Update data
      setDataUpdate((prev) => !prev);
    } catch (error) {
      console.error("Delete failed:", error);
      setShowDeleteModal(false);
      showNotification("error", "Vendor data delete failed!");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleRefresh = () => {
    // console.log("Refreshing...");
    setDataUpdate((prev) => !prev);
    reset({
      code: "",
      companyName: "",
      addressLine1: "",
      addressLine2: "",
      pincode: "",
      city: "",
      state: "",
      country: "",
      managerName: "",
      emailId: "",
      telephoneNo: "",
      panNo: "",
      serviceTaxNo: "",
      cinNo: "",
      ssl: "",
      smtp: "",
      portno: "",
      from: "",
      password: "",
      cc: "",
      bcc: "",
    });

    setSelectedVendor(null);
    setDisabledInput(false);
    setEditing(false);
    setAddButton(true);
    setEditButton(true);
    setDeleteButton(true);
  };

  const columns = useMemo(
    () => [
      { key: "code", label: "Code" },
      { key: "companyName", label: "Company Name" },
    ],
    []
  );

  const openCodeList = () => {
    setCodeListConfig({
      data,
      columns,
      name: "Vendor Master",
      handleAction: (action, rowData) => {
        if (action === "edit") {
          setValue("code", rowData.code);
          setSelectedVendor(rowData);
          setToggleCodeList(false);
        } else if (action === "delete") {
          setValue("code", rowData.code);
          setSelectedVendor(rowData);
          handleDeleteClick();
        }
      },
    });

    setToggleCodeList(true);
  };


  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleAdd)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Vendor Master"
        onRefresh={handleRefresh}
        bulkUploadBtn="hidden"
        onClickCodeList={openCodeList}
      />
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm">
          <div
            className={`cursor-pointer ${activeTab === "vendorDetails" ? "text-red" : "text-dim-gray"
              }`}
            onClick={() => setActiveTab("vendorDetails")}
          >
            Vendor Details
          </div>
          <Image
            src="/arrow-right-red.svg"
            alt="arrow"
            width={20}
            height={20}
          />
          <div
            className={`cursor-pointer ${activeTab === "logoSettings" ? "text-red" : "text-dim-gray"
              }`}
            onClick={() => setActiveTab("logoSettings")}
          >
            Logo Setting
          </div>
          <Image
            src="/arrow-right-red.svg"
            alt="arrow"
            width={20}
            height={20}
          />
          <div
            className={`cursor-pointer ${activeTab === "emailSettings" ? "text-red" : "text-dim-gray"
              }`}
            onClick={() => setActiveTab("emailSettings")}
          >
            Email Setting
          </div>
        </div>
        <div className="flex gap-3">
          <AddButton onClick={handleSubmit(handleAdd)} disabled={addButton} />
          <EditButton
            onClick={handleSubmit(handleEditButton)}
            disabled={editButton}
            label={editing ? "Update" : "Edit"}
          />
          <DeleteButton onClick={handleDeleteClick} disabled={deleteButton} />
        </div>
      </div>

      <div className="flex w-full">
        <div className={activeTab === "vendorDetails" ? "w-full" : "hidden"}>
          <VendorDetails
            register={register}
            setValue={setValue}
            setActiveTab={setActiveTab}
            initialValue={selectedVendor}
            trigger={trigger}
            errors={errors}
            watch={watch}
            disabledInput={disabledInput}
            data={data}
          />
        </div>
        <div className={activeTab === "logoSettings" ? "w-full" : "hidden"}>
          <LogoSetting
            setActiveTab={setActiveTab}
            vendorCode={code}
            showNotification={showNotification}
          />
        </div>
        <div className={activeTab === "emailSettings" ? "w-full" : "hidden"}>
          <EmailSetting
            register={register}
            setValue={setValue}
            watch={watch}
            vendorCode={code}
            showNotification={showNotification}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        vendorCode={code}
      />

      {/* Notification Flag */}
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
    </form>
  );
}

function VendorDetails({
  register,
  setValue,
  setActiveTab,
  trigger,
  errors,
  watch,
  data,
  selectedVendor,
  disabledInput = false,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <RedLabelHeading label={"Vendor Details"} />

        <div className="flex flex-row gap-3">
          <InputBox
            placeholder="Code"
            register={register}
            setValue={setValue}
            value="code"
            initialValue={selectedVendor?.code || ""}
            error={errors.code}
            trigger={trigger}
            watch={watch}
            validation={{
              required: "Code is required",
              minLength: { value: 2, message: "Minimum 2 characters required" },
            }}
          />
          <InputBox
            placeholder="Company Name"
            register={register}
            setValue={setValue}
            value="companyName"
            error={errors.companyName}
            trigger={trigger}
            disabled={disabledInput}
            validation={{
              required: "Company Name is required",
              minLength: { value: 3, message: "Minimum 3 characters required" },
            }}
            initialValue={watch("companyName") || ""}
          />
        </div>

        <div className="flex flex-row gap-3">
          <InputBox
            placeholder="Address Line 1"
            register={register}
            setValue={setValue}
            value="addressLine1"
            error={errors.addressLine1}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "Address Line 1 is required",
            }}
            initialValue={watch("addressLine1") || ""}
          />
          <InputBox
            placeholder="Address Line 2"
            register={register}
            setValue={setValue}
            value="addressLine2"
            error={errors.addressLine2}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "Address Line 2 is required",
            }}
            initialValue={watch("addressLine2") || ""}
          />
        </div>

        <div className="flex flex-row gap-3">
          <InputBox
            placeholder="Pin code"
            register={register}
            setValue={setValue}
            value="pincode"
            error={errors.pincode}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "Pincode is required",
              pattern: {
                value: /^[0-9]{6}$/,
                message: "Enter a valid 6-digit pincode",
              },
            }}
            initialValue={watch("pincode") || ""}
          />
          <InputBox
            placeholder="City"
            register={register}
            setValue={setValue}
            value="city"
            error={errors.city}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "City is required",
            }}
            initialValue={watch("city") || ""}
          />
        </div>

        <div className="flex flex-row gap-3">
          <InputBox
            placeholder="State"
            register={register}
            setValue={setValue}
            value="state"
            error={errors.state}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "State is required",
            }}
            initialValue={watch("state") || ""}
          />
          <InputBox
            placeholder="Country"
            register={register}
            setValue={setValue}
            value="country"
            error={errors.country}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "Country is required",
            }}
            initialValue={watch("country") || ""}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <RedLabelHeading label={"Branch Manager"} />

        <div className="flex flex-row gap-3">
          <InputBox
            placeholder="Manager Name"
            register={register}
            setValue={setValue}
            value="managerName"
            error={errors.managerName}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "Manager Name is required",
              minLength: { value: 3, message: "Minimum 3 characters required" },
            }}
            initialValue={watch("managerName") || ""}
          />
        </div>
        <div className="flex flex-row gap-3">
          <InputBox
            placeholder="E-Mail ID"
            register={register}
            setValue={setValue}
            value="emailId"
            error={errors.emailId}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "Email ID is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email format",
              },
            }}
            initialValue={watch("emailId") || ""}
          />
          <InputBox
            placeholder="Mobile No."
            register={register}
            setValue={setValue}
            value="telephoneNo"
            error={errors.telephoneNo}
            disabled={disabledInput}
            trigger={trigger}
            validation={{
              required: "Mobile No. is required",
              pattern: {
                value: /^[0-9]{10}$/,
                message: "Enter a valid 10-digit number",
              },
            }}
            initialValue={watch("telephoneNo") || ""}
          />
        </div>
        <div className="flex flex-row gap-3">
          <InputBox
            placeholder="PAN No."
            register={register}
            setValue={setValue}
            value="panNo"
            disabled={disabledInput}
            initialValue={watch("panNo") || ""}
          />
          <InputBox
            placeholder="Service Tax No."
            register={register}
            setValue={setValue}
            disabled={disabledInput}
            value="serviceTaxNo"
            initialValue={watch("serviceTaxNo") || ""}
          />
        </div>
        <div className="flex flex-row gap-3 justify-between">
          <InputBox
            placeholder="CIN No."
            register={register}
            disabled={disabledInput}
            setValue={setValue}
            value="cinNo"
            initialValue={watch("cinNo") || ""}
          />
        </div>
      </div>
      <div className="flex w-full flex-row-reverse">
        <div>
          <OutlinedButtonRed
            label={"Next"}
            onClick={() => setActiveTab("logoSettings")}
          />
        </div>
      </div>
    </div>
  );
}

function LogoSetting({ setActiveTab, vendorCode, showNotification }) {
  const { server } = useContext(GlobalContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      showNotification("error", "Please select a valid image file");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showNotification("error", "Please select a file first");
      return;
    }

    if (!vendorCode) {
      showNotification("error", "Please save vendor details first");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("logo", selectedFile);
      formData.append("vendorCode", vendorCode);

      const response = await axios.post(
        `${server}/vendor-master/upload-logo`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        showNotification("success", "Logo uploaded successfully");
        setActiveTab("emailSettings");
      } else {
        showNotification("error", "Failed to upload logo");
      }
    } catch (error) {
      console.error("Upload error:", error);
      showNotification("error", "Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 h-[435px]">
      <div
        className={`w-full h-80 border-dashed border-2 ${dragActive ? "border-red bg-red-50" : "border-[#979797] bg-[#FAFAFA]"
          } rounded-lg p-6 text-center flex flex-col items-center justify-center gap-2 transition-all`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="flex flex-col items-center gap-4 w-full h-full">
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src={preview}
                alt="Logo preview"
                width={300}
                height={300}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <button
              type="button"
              onClick={clearSelection}
              className="text-sm text-red hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <div className="text-gray-500 flex gap-2 flex-col">
              <span className="block font-medium">
                Drag & Drop to Upload File
              </span>
              <span className="block text-sm">OR</span>
            </div>
            <label
              htmlFor="fileInput"
              className="cursor-pointer bg-red text-white rounded-md h-8 w-28 flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              Browse File
            </label>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="text-xs text-gray-400 mt-2">
              Supported formats: JPG, PNG, GIF (Max 5MB)
            </span>
          </>
        )}
      </div>
      <button
        type="button"
        className={`px-6 py-3 rounded-md transition-colors ${uploading || !selectedFile
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-red text-white hover:bg-red-600"
          }`}
        onClick={handleUpload}
        disabled={uploading || !selectedFile}
      >
        {uploading ? "Uploading..." : "Upload Logo"}
      </button>
    </div>
  );
}

function EmailSetting({
  register,
  setValue,
  watch,
  vendorCode,
  showNotification,
}) {
  const { server } = useContext(GlobalContext);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!vendorCode) {
      showNotification("error", "Please save vendor details first");
      return;
    }

    // Get all form values
    const ssl = watch("ssl");
    const smtp = watch("smtp");
    const portNo = watch("portNo");
    const from = watch("from");
    const email = watch("email");
    const password = watch("password");
    const cc = watch("cc");
    const bcc = watch("bcc");

    setSaving(true);

    try {
      const emailData = {
        code: vendorCode,
        ssl: ssl || false,
        smtp: smtp || "",
        portNo: portNo ? parseInt(portNo) : null,
        from: from || "",
        email: email || "",
        password: password || "",
        cc: cc || "",
        bcc: bcc || "",
      };

      // console.log("Sending email data:", emailData);

      const response = await axios.post(
        `${server}/vendor-master/save-email-data`,
        emailData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // console.log("Response:", response.data);

      if (response.data.success) {
        showNotification("success", "Email settings saved successfully");

        // Reset email settings fields after save
        setValue("ssl", false);
        setValue("smtp", "");
        setValue("portNo", "");
        setValue("from", "");
        setValue("email", "");
        setValue("password", "");
        setValue("cc", "");
        setValue("bcc", "");
      } else {
        showNotification(
          "error",
          response.data.error || "Failed to save email settings"
        );
      }
    } catch (error) {
      console.error("Save email settings error:", error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to save email settings";
      showNotification("error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Reset form fields
    setValue("ssl", false);
    setValue("smtp", "");
    setValue("portNo", "");
    setValue("from", "");
    setValue("email", "");
    setValue("password", "");
    setValue("cc", "");
    setValue("bcc", "");
  };

  return (
    <div className="flex flex-col gap-3">
      <RedLabelHeading label={"Email Settings"} />

      <div className="flex flex-row gap-3 items-center">
        <div className="flex items-center gap-2 w-1/2">
          <input
            type="checkbox"
            id="ssl"
            {...register("ssl")}
            className="w-4 h-4 text-red bg-gray-100 border-gray-300 rounded focus:ring-red cursor-pointer"
          />
          <label
            htmlFor="ssl"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            Enable SSL
          </label>
        </div>
        <div className="w-1/2">
          <InputBox
            placeholder="SMTP Server (e.g., smtp.gmail.com)"
            register={register}
            setValue={setValue}
            value="smtp"
            initialValue={watch("smtp") || ""}
          />
        </div>
      </div>

      <div className="flex flex-row gap-3">
        <InputBox
          placeholder="Port No. (e.g., 587)"
          register={register}
          setValue={setValue}
          value="portNo"
          type="number"
          initialValue={watch("portNo") || ""}
        />
        <InputBox
          placeholder="From Name"
          register={register}
          setValue={setValue}
          value="from"
          initialValue={watch("from") || ""}
        />
      </div>

      <div className="flex flex-row gap-3">
        <InputBox
          placeholder="E-Mail ID (SMTP Email)"
          register={register}
          setValue={setValue}
          value="email"
          type="email"
          initialValue={watch("email") || ""}
        />
        <InputBox
          placeholder="Password (App Password)"
          register={register}
          setValue={setValue}
          value="password"
          type="password"
          initialValue={watch("password") || ""}
        />
      </div>

      <InputBox
        placeholder="CC (Comma separated emails)"
        register={register}
        setValue={setValue}
        value="cc"
        initialValue={watch("cc") || ""}
      />

      <InputBox
        placeholder="BCC (Comma separated emails)"
        register={register}
        setValue={setValue}
        value="bcc"
        initialValue={watch("bcc") || ""}
      />

      <div className="flex flex-row-reverse gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="px-6 py-2 border font-semibold text-sm border-red text-red rounded-md hover:bg-red-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !vendorCode}
          className={`px-6 py-2 rounded-md transition-colors font-semibold text-sm ${saving || !vendorCode
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-red text-white hover:bg-red-600 "
            }`}
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

export default VendorMaster;
