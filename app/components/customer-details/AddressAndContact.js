"use client";
import Heading from "@/app/components/Heading";
import React, { useContext, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { SimpleButton } from "../Buttons";
import RadioButton from "../RadioButton";
import { LabeledDropdown } from "../Dropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";

// Custom Input Box Component for better data persistence
// Custom Input Box Component with floating label design
const CustomInputBox = ({
  placeholder,
  value,
  onChange,
  disabled = false,
  type = "text",
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    let newValue = e.target.value;
    // Convert to uppercase for specific field types
    if (["code", "panNo", "gstNo", "tanNo", "kycNo"].includes(type)) {
      newValue = newValue.toUpperCase();
    }
    onChange(newValue);
  };

  const isPlaceholderFloating = isFocused || (value && value !== "");

  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value || ""}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
        className={`border border-[#979797] outline-none bg-transparent rounded-md h-8 text-sm px-4 py-2 w-full ${
          disabled ? "bg-gray-100 cursor-not-allowed" : ""
        }`}
      />
      {placeholder && (
        <label
          className={`absolute transition-all px-2 left-4 ${
            isPlaceholderFloating
              ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
              : "top-1/2 -translate-y-1/2 text-sm text-[#979797]"
          }`}
        >
          {placeholder}
        </label>
      )}
    </div>
  );
};

const AddressAndContact = ({
  register,
  setValue,
  setStep,
  customerData,
  watch,
  resetFactor,
  prefilledUserData,
  getValues,
}) => {
  const [accountType, setAccountType] = useState("agent");
  const [suggestedCode, setSuggestedCode] = useState("");
  const [loadingCode, setLoadingCode] = useState(false);
  const [fetchedData, setFetchedData] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Local state for all form fields
  const [formData, setFormData] = useState({
    accountCode: "",
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    pinCode: "",
    contactPerson: "",
    email: "",
    telNo: "",
    panNo: "",
    gstNo: "",
    kycNo: "",
    tanNo: "",
  });

  const searchParams = useSearchParams();
  const accountCodeFromUrl = searchParams.get("accountCode");

  const { countries, states, cities, server, accounts } =
    useContext(GlobalContext);

  // Determine which data source to use - prioritize prefilledUserData when available
  const dataSource = prefilledUserData || fetchedData || customerData;

  // Watch state field for suggested code generation
  const selectedState = watch("state");

  // Fetch customer data if accountCode is present in URL (Edit Mode)
  useEffect(() => {
    const fetchCustomerData = async () => {
      if (accountCodeFromUrl && !prefilledUserData) {
        try {
          setLoading(true);
          setIsEditMode(true);

          console.log("=== Fetching customer data for edit ===");
          // console.log("Account Code:", accountCodeFromUrl);

          const response = await axios.get(
            `${server}/customer-account?accountCode=${accountCodeFromUrl}`
          );

          // console.log("Fetched customer data:", response.data);
          setFetchedData(response.data);
        } catch (error) {
          console.error("Error fetching customer data:", error);
          alert("Failed to fetch customer data. Please try again.");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCustomerData();
  }, [accountCodeFromUrl, server, prefilledUserData]);

  // Set account type from data source
  useEffect(() => {
    const newAccountType = dataSource?.accountType || "agent";
    setAccountType(newAccountType);
    setValue("accountType", newAccountType);
  }, [dataSource, setValue]);

  // Initialize form data from data source
  useEffect(() => {
    if (dataSource) {
      // console.log("=== Initializing form data from dataSource ===");
      // console.log("dataSource:", dataSource);

      const newFormData = {
        accountCode: dataSource.accountCode || "",
        name:
          dataSource.fullName ||
          dataSource.name ||
          dataSource.companyName ||
          "",
        addressLine1: dataSource.addressLine1 || "",
        addressLine2: dataSource.addressLine2 || "",
        city: dataSource.city || "",
        state: dataSource.state || "",
        country: dataSource.country || "",
        pinCode:
          dataSource.zipCode || dataSource.pinCode || dataSource.pincode || "",
        contactPerson:
          dataSource.fullName ||
          dataSource.contactPerson ||
          dataSource.name ||
          "",
        email: dataSource.emailId || dataSource.email || "",
        telNo:
          dataSource.mobileNumber || dataSource.telNo || dataSource.phone || "",
        panNo: dataSource.panNo || "",
        gstNo:
          dataSource.gstNumber ||
          dataSource.gstNo ||
          dataSource.gstin ||
          dataSource.gst ||
          "",
        kycNo: dataSource.kycNo || "",
        tanNo: dataSource.tanNo || "",
      };

      // console.log("Setting form data:", newFormData);
      setFormData(newFormData);

      // Also update react-hook-form values
      Object.entries(newFormData).forEach(([key, value]) => {
        if (value) {
          setValue(key, value, {
            shouldValidate: false,
            shouldDirty: true,
            shouldTouch: true,
          });
        }
      });
    }
  }, [dataSource, setValue]);

  // Handle field changes - update both local state and react-hook-form
  const handleFieldChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setValue(fieldName, value, {
      shouldValidate: false,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // Generate suggested code when state changes (only in create mode and no prefilled data)
  useEffect(() => {
    if (
      formData.state &&
      !isEditMode &&
      !prefilledUserData &&
      !formData.accountCode
    ) {
      generateSuggestedCode(formData.state);
    } else if (isEditMode || prefilledUserData) {
      setSuggestedCode("");
    }
  }, [formData.state, isEditMode, prefilledUserData, formData.accountCode]);

  const generateSuggestedCode = async (state) => {
    try {
      setLoadingCode(true);

      // console.log("=== Generating Suggested Code ===");
      // console.log("Selected state:", state);

      const response = await axios.post(`${server}/portal/auth/assign-code`, {
        state: state,
      });

      // console.log("Suggested code response:", response.data);

      if (response.data.success) {
        setSuggestedCode(response.data.accountCode);
        // console.log("Suggested code:", response.data.accountCode);
      } else {
        setSuggestedCode("");
        console.error("Failed to generate code:", response.data.message);
      }
    } catch (error) {
      console.error("Error generating suggested code:", error);
      setSuggestedCode("");
    } finally {
      setLoadingCode(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading customer data...</div>
      </div>
    );
  }

  return (
    <div className="">
      {/* {(isEditMode || prefilledUserData?.accountCode) && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-green font-semibold">
            {isEditMode
              ? `Edit Mode: Updating customer with code #${accountCodeFromUrl}`
              : `Completing account setup for code #${prefilledUserData?.accountCode}`}
          </p>
        </div>
      )} */}

      <div className="h-[55vh]">
        <div className="flex flex-col gap-3">
          <div className="flex gap-6 ">
            <RadioButton
              id="agent"
              name="accountType"
              register={register}
              setValue={setValue}
              value="agent"
              selectedValue={accountType}
              setSelectedValue={setAccountType}
              label={`Agent`}
            />
            <RadioButton
              id="customer"
              name="accountType"
              register={register}
              setValue={setValue}
              value="customer"
              selectedValue={accountType}
              setSelectedValue={setAccountType}
              label={`Customer`}
            />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <div className="w-[150px]">
                <CustomInputBox
                  placeholder="Code"
                  value={formData.accountCode}
                  onChange={(value) => handleFieldChange("accountCode", value)}
                  disabled={isEditMode || !!prefilledUserData?.accountCode}
                />
              </div>
              <div className="w-full">
                <CustomInputBox
                  placeholder="Name"
                  value={formData.name}
                  onChange={(value) => handleFieldChange("name", value)}
                />
              </div>
            </div>

            {/* Suggested Code Display - Only show in create mode without prefilled data */}
            {!isEditMode &&
              !prefilledUserData?.accountCode &&
              formData.state && (
                <div className="ml-[10px] mt-1">
                  {loadingCode ? (
                    <p className="text-sm text-gray-500 italic">
                      Generating suggested code...
                    </p>
                  ) : suggestedCode ? (
                    <p className="text-sm text-gray-700">
                      Suggested code:{" "}
                      <span className="font-semibold text-green-600">
                        {suggestedCode}
                      </span>
                    </p>
                  ) : null}
                </div>
              )}

            {/* Show assigned code message */}
            {prefilledUserData?.accountCode && (
              <div className="ml-[10px] mt-1">
                <p className="text-sm text-green-600">
                  ✓ Account code{" "}
                  <span className="font-semibold">
                    {prefilledUserData.accountCode}
                  </span>{" "}
                  has been assigned. Please complete all details and save.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-3">
          <div className="w-full flex flex-col gap-3 ">
            <div>
              <h2 className="text-[16px] text-red font-semibold">Address</h2>
            </div>
            <div className="flex flex-col gap-3">
              <CustomInputBox
                placeholder="Address Line 1"
                value={formData.addressLine1}
                onChange={(value) => handleFieldChange("addressLine1", value)}
              />
              <CustomInputBox
                placeholder="Address Line 2"
                value={formData.addressLine2}
                onChange={(value) => handleFieldChange("addressLine2", value)}
              />
              <LabeledDropdown
                options={cities.map((city) => city.name)}
                register={register}
                setValue={(field, value) => {
                  setValue(field, value);
                  handleFieldChange(field, value);
                }}
                value="city"
                title="City"
                selectedValue={formData.city}
                resetFactor={resetFactor}
              />
              <LabeledDropdown
                options={states.map((state) => state.name)}
                register={register}
                setValue={(field, value) => {
                  setValue(field, value);
                  handleFieldChange(field, value);
                }}
                value="state"
                title="State"
                selectedValue={formData.state}
                resetFactor={resetFactor}
              />

              <LabeledDropdown
                options={countries.map((country) => country.name)}
                register={register}
                setValue={(field, value) => {
                  setValue(field, value);
                  handleFieldChange(field, value);
                }}
                value="country"
                title="Country"
                selectedValue={formData.country}
                resetFactor={resetFactor}
              />
              <CustomInputBox
                placeholder="Pin Code"
                value={formData.pinCode}
                onChange={(value) => handleFieldChange("pinCode", value)}
              />
            </div>
          </div>

          <div className="w-full flex flex-col gap-3">
            <div className="">
              <h2 className="text-[16px] text-red font-semibold">
                Contact Details
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <CustomInputBox
                placeholder="Contact Person"
                value={formData.contactPerson}
                onChange={(value) => handleFieldChange("contactPerson", value)}
              />
              <CustomInputBox
                placeholder="E-Mail I'd"
                value={formData.email}
                onChange={(value) => handleFieldChange("email", value)}
                type="email"
              />
              <CustomInputBox
                placeholder="Tel No."
                value={formData.telNo}
                onChange={(value) => handleFieldChange("telNo", value)}
              />
              <div className="flex gap-3">
                <CustomInputBox
                  placeholder="PAN No."
                  value={formData.panNo}
                  onChange={(value) => handleFieldChange("panNo", value)}
                />
                <CustomInputBox
                  placeholder="Tan No."
                  value={formData.tanNo}
                  onChange={(value) => handleFieldChange("tanNo", value)}
                />
              </div>

              <CustomInputBox
                placeholder="GST No."
                value={formData.gstNo}
                onChange={(value) => handleFieldChange("gstNo", value)}
              />
              <CustomInputBox
                placeholder="KYC No."
                value={formData.kycNo}
                onChange={(value) => handleFieldChange("kycNo", value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8 w-full">
        <div className="flex justify-end">
          <SimpleButton onClick={() => setStep(1)} name="Next" />
        </div>
      </div>
    </div>
  );
};

export default AddressAndContact;
