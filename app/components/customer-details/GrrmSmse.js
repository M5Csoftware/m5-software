import React, { useContext, useState } from "react";
import InputBox from "../InputBox";
import { SimpleButton } from "../Buttons";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";
import axios from "axios";

// Red Checkbox Component
const RedCheckbox = ({ isChecked, setChecked, id, label }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={(e) => setChecked(e.target.checked)}
        className="w-4 h-4 accent-[#EA1B40] cursor-pointer"
      />
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 cursor-pointer"
      >
        {label}
      </label>
    </div>
  );
};

const GrrmSmse = ({
  register,
  setValue,
  customerData,
  getValues,
  watch,
  mode = "create",
  reset,
  setStep,
  onSaveSuccess,
}) => {
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Helper function to show notifications
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Function to send email to customer using the new email route
  const sendCustomerEmail = async (user) => {
    try {
      const userEmail = user.emailId || user.email;

      if (!userEmail) {
        console.error("No email found for user:", user);
        showNotification("error", "User email not found. Cannot send email.");
        return false;
      }

      // console.log("=== Sending Welcome Email ===");
      // console.log("Email:", userEmail);
      // console.log("Name:", user.fullName || user.name);
      // console.log("Account Code:", user.accountCode);

      // Call the email API route
      const response = await axios.post(`${server}/send-account-email`, {
        email: userEmail,
        fullName: user.fullName || user.name,
        accountCode: user.accountCode,
      });

      // console.log("Email API response:", response.data);

      if (response.data.success) {
        showNotification(
          "success",
          `Welcome email sent successfully to ${userEmail}`
        );
        return true;
      } else {
        showNotification(
          "error",
          `Failed to send email: ${response.data.message}`
        );
        return false;
      }
    } catch (error) {
      console.error(
        "Error sending email:",
        error.response?.data || error.message
      );
      showNotification(
        "error",
        `Failed to send email: ${error.response?.data?.error || error.message}`
      );
      return false;
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    try {
      setLoading(true);

      // Get all form values
      let allFormData = {};

      if (getValues && typeof getValues === "function") {
        allFormData = getValues();
        // console.log("✅ Data from getValues:", allFormData);
      } else {
        showNotification(
          "error",
          "Form data collection failed. Please try again."
        );
        console.error("❌ getValues is not available");
        setLoading(false);
        return;
      }

      // Merge with customerData for any missing fields (edit mode)
      if (customerData && Object.keys(customerData).length > 0) {
        allFormData = { ...customerData, ...allFormData };
        // console.log("✅ Merged with customerData");
      }

      // console.log("=== Saving Customer Account ===");
      // console.log("Mode:", mode);
      // console.log("Account Code:", allFormData.accountCode);
      // console.log("Name:", allFormData.name);
      // console.log("Send Email:", sendEmail);
      // console.log("Full Form Data:", allFormData);

      // Validate required fields
      if (!allFormData.accountCode || allFormData.accountCode.trim() === "") {
        showNotification(
          "error",
          "Account Code is required. Please go to Step 1 (Address & Contact) and fill in the Account Code field."
        );
        console.error("❌ Account Code is missing");
        setLoading(false);
        return;
      }

      if (!allFormData.name || allFormData.name.trim() === "") {
        showNotification(
          "error",
          "Name is required. Please go to Step 1 (Address & Contact) and fill in the Name field."
        );
        console.error("❌ Name is missing");
        setLoading(false);
        return;
      }

      // Prepare payload - ensure all table data is included
      const payload = {
        // Address and Contact (Step 0)
        accountType: allFormData.accountType || "agent",
        accountCode: allFormData.accountCode,
        name: allFormData.name,
        addressLine1: allFormData.addressLine1 || "",
        addressLine2: allFormData.addressLine2 || "",
        city: allFormData.city || "",
        state: allFormData.state || "",
        country: allFormData.country || "",
        pinCode: allFormData.pinCode || "",
        contactPerson: allFormData.contactPerson || "",
        email: allFormData.email || "",
        telNo: allFormData.telNo || "",
        panNo: allFormData.panNo || "",
        tanNo: allFormData.tanNo || "",
        gstNo: allFormData.gstNo || "",
        kycNo: allFormData.kycNo || "",

        // Customer Details (Step 1)
        branch: allFormData.branch || "",
        hub: allFormData.hub || "",
        companyName: allFormData.branchName || "",
        salesPersonName: allFormData.salesPersonName || "",
        referenceBy: allFormData.referenceBy || "",
        managedBy: allFormData.managedBy || "",
        collectionBy: allFormData.collectionBy || "",
        accountManager: allFormData.accountManager || "",
        reportPerson: allFormData.reportPerson || "",
        salesCoordinator: allFormData.salesCoordinator || "",
        applicableTariff: allFormData.applicableTariff || "",
        gst: allFormData.gst || "",
        account: allFormData.account || "Activate",
        fuel: allFormData.fuel || "",
        fuelPercentage: allFormData.fuelPercentage || "",
        rateModify: allFormData.rateModify || "",
        billingEmailId: allFormData.billingEmailId || "",
        paymentTerms: allFormData.paymentTerms || "",
        rateType: allFormData.rateType || "",
        parentCode: allFormData.parentCode || "",
        billingTag: allFormData.billingTag || "",
        currency: allFormData.currency || "",
        csb: allFormData.csb || "",
        branded: allFormData.branded || "",
        handling: allFormData.handling || "",
        modeType: allFormData.modeType || "",
        deactivateReason: allFormData.deactivateReason || "",
        groupCode: allFormData.groupCode || "",
        outOrGroupCode: allFormData.outOrGroupCode || "",

        // Credit Limit (Step 2)
        enableOS: allFormData.enableOS || false,
        openingBalance: allFormData.openingBalance || "",
        creditLimit: allFormData.creditLimit || "",
        leftOverBalance: parseFloat(allFormData.leftOverBalance) || 0,
        noOfDaysCredit: allFormData.noOfDaysCredit || "",
        portalBalance: allFormData.portalBalance || "",
        totalSales: allFormData.totalSales || "",
        totalPayment: allFormData.totalPayment || "",
        totalDebitNote: allFormData.totalDebitNote || "",
        totalCreditNote: allFormData.totalCreditNote || "",
        outstanding: allFormData.outstanding || "",
        volumeMetricWtSector: allFormData.volumeMetricWtSector || "",
        volumeMetricWtService: allFormData.volumeMetricWtService || "",
        divisible: allFormData.divisible || "",
        volWtDivisibleTable: allFormData.volWtDivisibleTable || [],

        // Service Settings (Step 3)
        allServiceSettings: allFormData.allServiceSettings || false,
        serviceSettingsSector: allFormData.serviceSettingsSector || "",
        serviceSettingsService: allFormData.serviceSettingsService || "",
        serviceSettingServiceTable:
          allFormData.serviceSettingTable ||
          allFormData.serviceSettingServiceTable ||
          [],
        serviceSettingVolDiscTable:
          allFormData.volDiscTable ||
          allFormData.serviceSettingVolDiscTable ||
          [],
        enableVolDiscount: allFormData.enableVolDiscount || false,
        volDiscountSector: allFormData.volDiscountSector || "",
        volDiscountService: allFormData.volDiscountService || "",
        volDiscountWeight: allFormData.volDiscountWeight || "",
        volDiscount: allFormData.volDiscount || "",

        // Portal Settings (Step 4)
        enablePortalPassword: allFormData.enablePortalPassword || false,
        portalPasswordSector: allFormData.portalPasswordSector || "",
        upsLabel: allFormData.upsLabel || false,
        yadelLabel: allFormData.yadelLabel || false,
        post11Label: allFormData.post11Label || false,
        dhlLabel: allFormData.dhlLabel || false,
        upsStandardLabel: allFormData.upsStandardLabel || false,
        enableLabelSetting: allFormData.enableLabelSetting || false,

        // Rate Hike (Step 5)
        rateHikeService: allFormData.rateHikeService || "",
        rateHikeAmount: allFormData.rateHikeAmount || "",
        rateHikeFrom: allFormData.rateHikeFrom || "",
        rateHikeTo: allFormData.rateHikeTo || "",
        rateHikeTable: allFormData.rateHikeTable || [],

        // Upload Signature (Step 6)
        signatureImage: allFormData.signatureImage || "",
        stampImage: allFormData.stampImage || "",
        bankName: allFormData.bankName || "",
        accountNumber: allFormData.accountNumber || "",
        companyCode: allFormData.companyCode || "",
        ifsc: allFormData.ifsc || "",
        bankAddress: allFormData.bankAddress || "",

        // GRRM SMSE (Step 7 - Final)
        gm: allFormData.gm || "",
        rm: allFormData.rm || "",
        sm: allFormData.sm || "",
        se: allFormData.se || "",

        //grouping
        accountClass: allFormData.accountClass || "",
      };

      // console.log("Payload to send:", payload);

      let response;
      let isNewAccount = false;

      if (mode === "edit" || (customerData && customerData._id)) {
        // Update existing customer
        // console.log(
        //   "Updating customer with accountCode:",
        //   allFormData.accountCode
        // );
        response = await axios.put(`${server}/customer-account`, payload);
        // console.log("Update response:", response.data);

        if (response.status === 200) {
          showNotification("success", "Customer account updated successfully!");
          // console.log("=== Update Successful ===");
        } else {
          throw new Error("Failed to update customer account");
        }
      } else {
        // Create new customer
        // console.log("Creating new customer");
        response = await axios.post(`${server}/customer-account`, payload);
        // console.log("Create response:", response.data);

        if (response.status === 201) {
          isNewAccount = true;
          showNotification("success", "Customer account created successfully!");
          // console.log("=== Creation Successful ===");
        } else {
          throw new Error("Failed to create customer account");
        }
      }

      // Send email if checkbox is checked (only for new accounts or updates)
      if (sendEmail) {
        // console.log("Preparing to send email...");
        await sendCustomerEmail({
          emailId: allFormData.email || allFormData.emailId,
          fullName: allFormData.name,
          accountCode: allFormData.accountCode,
        });
      }

      // Clear form after successful save
      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (error) {
      console.error("Error saving customer account:", error);
      console.error("Error details:", error.response?.data || error.message);

      // Handle duplicate key error (E11000)
      if (
        error.response?.data?.error?.includes("E11000") ||
        error.response?.data?.error?.includes("duplicate key")
      ) {
        showNotification(
          "error",
          `Account code "${allFormData.accountCode}" already exists. Please use a different code or update the existing account.`
        );
      } else {
        const errorMessage =
          error.response?.data?.details ||
          error.response?.data?.error ||
          error.message ||
          "Failed to save customer account";

        showNotification("error", errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to reset/clear all form fields
  const resetForm = () => {
    // console.log("=== Resetting Form ===");

    if (reset && typeof reset === "function") {
      // Use react-hook-form reset if available
      reset({
        accountType: "agent",
        // Reset all other fields to empty/default values
      });
      // console.log("Form reset using react-hook-form reset()");
    } else {
      // Manual reset using setValue
      const fields = [
        "accountCode",
        "name",
        "accountType",
        "addressLine1",
        "addressLine2",
        "city",
        "state",
        "country",
        "pinCode",
        "contactPerson",
        "email",
        "telNo",
        "panNo",
        "tanNo",
        "gstNo",
        "kycNo",
        "branch",
        "hub",
        "branchName",
        "salesPersonName",
        "referenceBy",
        "managedBy",
        "collectionBy",
        "accountManager",
        "reportPerson",
        "salesCoordinator",
        "applicableTariff",
        "gst",
        "account",
        "fuel",
        "fuelPercentage",
        "billingEmailId",
        "paymentTerms",
        "billingTag",
        "currency",
        "csb",
        "modeType",
        "deactivateReason",
        "groupCode",
        "outOrGroupCode",
        "enableOS",
        "openingBalance",
        "creditLimit",
        "leftOverBalance",
        "noOfDaysCredit",
        "portalBalance",
        "volumeMetricWtSector",
        "volumeMetricWtService",
        "divisible",
        "volWtDivisibleTable",
        "allServiceSettings",
        "serviceSettingsSector",
        "serviceSettingsService",
        "serviceSettingVolDiscTable",
        "enableVolDiscount",
        "volDiscountSector",
        "volDiscountService",
        "volDiscountWeight",
        "volDiscount",
        "enablePortalPassword",
        "portalPasswordSector",
        "upsLabel",
        "yadelLabel",
        "post11Label",
        "dhlLabel",
        "upsStandardLabel",
        "enableLabelSetting",
        "rateHikeService",
        "rateHikeAmount",
        "rateHikeFrom",
        "rateHikeTo",
        "rateHikeTable",
        "signatureImage",
        "stampImage",
        "bankName",
        "accountNumber",
        "ifsc",
        "bankAddress",
        "gm",
        "rm",
        "sm",
        "se",
        "totalSales",
        "totalPayment",
        "totalDebitNote",
        "totalCreditNote",
        "outstanding",
      ];

      const booleanFields = [
        "enableOS",
        "allServiceSettings",
        "enableVolDiscount",
        "enablePortalPassword",
        "upsLabel",
        "yadelLabel",
        "post11Label",
        "dhlLabel",
        "upsStandardLabel",
        "enableLabelSetting",
      ];

      const arrayFields = [
        "volWtDivisibleTable",
        "serviceSettingVolDiscTable",
        "rateHikeTable",
      ];

      fields.forEach((field) => {
        if (booleanFields.includes(field)) {
          setValue(field, false);
        } else if (arrayFields.includes(field)) {
          setValue(field, []);
        } else if (field === "accountType") {
          setValue(field, "agent");
        } else if (field === "account") {
          setValue(field, "Activate");
        } else {
          setValue(field, "");
        }
      });

      // console.log("Form reset using setValue()");
    }

    // Reset email checkbox to default (checked)
    setSendEmail(true);

    // Go back to first step
    if (setStep && typeof setStep === "function") {
      setStep(0);
      // console.log("Navigated to first step");
    }

    // Call success callback if provided
    if (onSaveSuccess && typeof onSaveSuccess === "function") {
      onSaveSuccess();
    }

    // console.log("=== Form Reset Complete ===");
  };

  return (
    <div className="mt-3 flex flex-col gap-[173px]">
      <div className="w-full flex flex-col gap-3 h-[40vh]">
        <div className="">
          <h2 className="text-[16px] text-red font-semibold">
            Service Settings (Optional)
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          <InputBox
            placeholder="GM"
            register={register}
            setValue={setValue}
            value="gm"
            initialValue={customerData?.gm || ""}
          />
          <InputBox
            placeholder="RM"
            register={register}
            setValue={setValue}
            value="rm"
            initialValue={customerData?.rm || ""}
          />
          <InputBox
            placeholder="SM"
            register={register}
            setValue={setValue}
            value="sm"
            initialValue={customerData?.sm || ""}
          />
          <InputBox
            placeholder="SE"
            register={register}
            setValue={setValue}
            value="se"
            initialValue={customerData?.se || ""}
          />
        </div>

        <div className="flex flex-row justify-between items-center mt-4">
          {/* Email Checkbox */}
          <RedCheckbox
            isChecked={sendEmail}
            setChecked={setSendEmail}
            id="sendEmail"
            label="Send welcome email with account details to customer"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <div>
          <SimpleButton
            name={
              loading ? "Saving..." : sendEmail ? "Save & Send Email" : "Save"
            }
            type="button"
            onClick={handleSave}
            disabled={loading}
          />
        </div>
      </div>

      {/* Notification Flag */}
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
    </div>
  );
};

export default GrrmSmse;
