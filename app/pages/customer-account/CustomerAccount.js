"use client";
import React, { useContext, useEffect, useState, useMemo } from "react";
import AddressAndContact from "@/app/components/customer-details/AddressAndContact";
import CreditLimit from "@/app/components/customer-details/CreditLimit";
import CustomerDetails from "@/app/components/customer-details/CustomerDetails";
import GrrmSmse from "@/app/components/customer-details/GrrmSmse";
import PortalSetting from "@/app/components/customer-details/PortalSetting";
import RateHike from "@/app/components/customer-details/RateHike";
import ServiceSetting from "@/app/components/customer-details/ServiceSetting";
import StepsNavbar from "@/app/components/customer-details/StepsNavbar";
import UploadSignature from "@/app/components/customer-details/UploadSignature";
import Heading from "@/app/components/Heading";
import NotificationFlag from "@/app/components/Notificationflag";
import BulkUploadModal from "@/app/components/BulkUploadModal";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useDebounce } from "@/app/hooks/useDebounce";
import Image from "next/image";

const CustomerAccount = ({ onBack, prefilledUserData, onSaveSuccess }) => {
  const { register, setValue, handleSubmit, getValues, watch, reset } = useForm(
    {
      defaultValues: prefilledUserData
        ? {
          accountType: prefilledUserData.accountType,
          accountCode: prefilledUserData.accountCode,
          companyName:
            prefilledUserData.companyName || prefilledUserData.fullName,
          fullName: prefilledUserData.fullName,
          name: prefilledUserData.fullName,
          emailId: prefilledUserData.emailId,
          email: prefilledUserData.emailId,
          mobileNumber: prefilledUserData.mobileNumber,
          mobile: prefilledUserData.mobileNumber,
          phone: prefilledUserData.mobileNumber,
          addressLine1: prefilledUserData.addressLine1,
          addressLine2: prefilledUserData.addressLine2,
          address1: prefilledUserData.addressLine1,
          address2: prefilledUserData.addressLine2,
          zipCode: prefilledUserData.zipCode,
          pincode: prefilledUserData.zipCode,
          pinCode: prefilledUserData.zipCode,
          city: prefilledUserData.city,
          state: prefilledUserData.state,
          country: prefilledUserData.country,
          gstNumber: prefilledUserData.gstNumber,
          gstin: prefilledUserData.gstNumber,
          gst: prefilledUserData.gstNumber,
          gstNo: prefilledUserData.gstNumber,
          sector: prefilledUserData.sector,
          turnover: prefilledUserData.turnover,
          contactPerson: prefilledUserData.fullName,
          telNo: prefilledUserData.mobileNumber,
        }
        : {},
    }
  );

  const [step, setStep] = useState(0);
  const [customerData, setCustomerData] = useState(null);
  const [resetFactor, setResetFactor] = useState(false);
  const {
    server,
    setToggleCodeList,
    setCodeListConfig,
  } = useContext(GlobalContext);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [isPrefilledDataSet, setIsPrefilledDataSet] = useState(false);
  const [hasCheckedAccountCode, setHasCheckedAccountCode] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const steps = [
    { label: "Address & Contact" },
    { label: "Customer Details" },
    { label: "Credit Limit" },
    { label: "Service Setting" },
    { label: "Portal Setting" },
    { label: "Rate Hike" },
    { label: "Upload Signature" },
    { label: "GR,RM,SM,SE" },
  ];

  const accountCode = watch("accountCode");
  const debouncedAccountCode = useDebounce(accountCode, 500);

  // Notification handler
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Field mapping for bulk upload - maps Excel/CSV column names to database fields
  const fieldMapping = {
    // Address and Contact (Step 0) - from Excel
    "accountType": "accountType",
    "accountCode": "accountCode",
    "name": "name",
    "addressLine1": "addressLine1",
    "addressLine2": "addressLine2",
    "city": "city",
    "state": "state",
    "country": "country",
    "pinCode": "pinCode",
    "contactPerson": "contactPerson",
    "email": "email",
    "telNo": "telNo",
    "panNo": "panNo",
    "gstNo": "gstNo",
    "kycNo": "kycNo",

    // Customer Details (Step 1) - from Excel
    "branch": "branch",
    "hub": "hub",
    "salesPersonName": "salesPersonName",
    "referenceBy": "referenceBy",
    "managedBy": "managedBy",
    "collectionBy": "collectionBy",
    "accountManager": "accountManager",
    "reportPerson": "reportPerson",
    "salesCoordinator": "salesCoordinator",
    "applicableTariff": "applicableTariff",
    "gst": "gst",
    "account": "account",
    "fuel": "fuel",
    "billingEmailId": "billingEmailId",
    "paymentTerms": "paymentTerms",
    "rateType": "rateType",
    "parentCode": "parentCode",
    "billingTag": "billingTag",
    "currency": "currency",
    "csb": "csb",
    "branded": "branded",
    "handling": "handling",
    "modeType": "modeType",
    "deactivateReason": "deactivateReason",

    // Credit Limit (Step 2) - from Excel
    "openingBalance": "openingBalance",
    "creditLimit": "creditLimit",
    "portalPasswordSector": "portalPasswordSector",

    // Portal Settings (Step 4) - from Excel
    "upsLabel": "upsLabel",
    "yadelLabel": "yadelLabel",
    "post11Label": "post11Label",
    "dhlLabel": "dhlLabel",
    "upsStandardLabel": "upsStandardLabel",
    "enableLabelSetting": "enableLabelSetting",

    // GRRM SMSE (Step 7) - from Excel
    "gm": "gm",
    "rm": "rm",
    "sm": "sm",
    "se": "se",
  };

  // Generate and download sample Excel file
  const downloadSampleFile = async () => {
    // Create sample data based on your Excel headers
    const sampleData = [
      {
        accountType: "agent",
        accountCode: "DL001",
        name: "DRISHTI",
        addressLine1: "WZ 136A VN",
        addressLine2: "LANE 6",
        city: "New Delhi",
        state: "Delhi",
        country: "INDIA",
        pinCode: "110058",
        contactPerson: "DRISHTI",
        email: "drishti@m5clogs.com",
        telNo: "9891196021",
        panNo: "AAQCM6359K1Z",
        gstNo: "07AAQCM6359K1Z",
        kycNo: "0",
        branch: "DEL",
        hub: "",
        salesPersonName: "Altaf",
        referenceBy: "Drishti",
        managedBy: "Suraj",
        collectionBy: "",
        accountManager: "",
        reportPerson: "",
        salesCoordinator: "",
        applicableTariff: "DL001",
        gst: "GST-Additional",
        account: "Active",
        fuel: "Yes",
        billingEmailId: "drishti@m5clogs.com",
        paymentTerms: "Credit",
        rateType: "",
        parentCode: "",
        billingTag: "Yes",
        currency: "INR",
        csb: "",
        branded: "",
        handling: "",
        modeType: "normal",
        deactivateReason: "",
        openingBalance: "10000",
        creditLimit: "10000000",
        portalPasswordSector: "drishti@123",
        upsLabel: "False",
        yadelLabel: "False",
        post11Label: "False",
        dhlLabel: "False",
        upsStandardLabel: "False",
        enableLabelSetting: "False",
        gm: "",
        rm: "",
        sm: "",
        se: ""
      }
    ];

    // Create workbook
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();

    // Convert data to worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Sample Customer Accounts");

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    // Create blob and download
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-customer-accounts.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showNotification("success", "Sample file downloaded successfully");
  };

  // Parse Excel/CSV file
  const parseFile = async (file) => {
    return new Promise((resolve, reject) => {
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'csv') {
        // Parse CSV
        import("papaparse").then(Papa => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              resolve(results.data);
            },
            error: (error) => {
              reject(error);
            }
          });
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const XLSX = await import("xlsx");
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            // Convert to array of objects with headers
            const headers = jsonData[0];
            const rows = jsonData.slice(1).map(row => {
              const obj = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });

            resolve(rows);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format'));
      }
    });
  };

  // Map parsed data to database format
  const mapDataToPayload = (rowData) => {
    const payload = {};

    // Boolean fields
    const booleanFields = [
      'enableOS', 'allServiceSettings', 'enableVolDiscount',
      'enablePortalPassword', 'upsLabel', 'yadelLabel', 'post11Label',
      'dhlLabel', 'upsStandardLabel', 'enableLabelSetting'
    ];

    // Numeric fields
    const numericFields = [
      'openingBalance', 'creditLimit', 'leftOverBalance', 'noOfDaysCredit',
      'portalBalance', 'totalSales', 'totalPayment', 'totalDebitNote',
      'totalCreditNote', 'outstanding', 'fuelPercentage', 'rateHikeAmount'
    ];

    Object.keys(fieldMapping).forEach(excelColumn => {
      const dbField = fieldMapping[excelColumn];
      const value = rowData[excelColumn];

      if (value !== undefined && value !== null && value !== '') {
        // Convert boolean fields
        if (booleanFields.includes(dbField)) {
          payload[dbField] = value === 'TRUE' || value === 'true' || value === '1' || value === 1 || value === true;
        }
        // Convert numeric fields
        else if (numericFields.includes(dbField)) {
          payload[dbField] = parseFloat(value) || 0;
        }
        // String fields
        else {
          payload[dbField] = value.toString().trim();
        }
      }
    });

    // Set defaults for required fields if not present
    if (!payload.accountType) payload.accountType = 'agent';
    if (!payload.account) payload.account = 'Activate';

    return payload;
  };

  // Handle bulk upload
  const handleBulkUpload = async (file) => {
    try {
      showNotification("info", "Processing file...");

      // Parse the file
      const parsedData = await parseFile(file);

      if (!parsedData || parsedData.length === 0) {
        showNotification("error", "No data found in file");
        return;
      }

      console.log(`Found ${parsedData.length} rows in file`);

      // Process each row and save to database
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];

        try {
          // Map data to payload format
          const payload = mapDataToPayload(row);

          // Validate required fields
          if (!payload.accountCode || !payload.name) {
            errors.push(`Row ${i + 2}: Missing required fields (Account Code or Name)`);
            errorCount++;
            continue;
          }

          console.log(`Processing row ${i + 1}:`, payload.accountCode);

          // Save to database
          const response = await axios.post(`${server}/customer-account`, payload);

          if (response.status === 201) {
            successCount++;
            console.log(`✓ Row ${i + 1} saved successfully`);
          }
        } catch (error) {
          errorCount++;
          const errorMsg = error.response?.data?.error || error.message;

          // Check for duplicate key error
          if (errorMsg.includes('E11000') || errorMsg.includes('duplicate')) {
            errors.push(`Row ${i + 2}: Account code already exists`);
          } else {
            errors.push(`Row ${i + 2}: ${errorMsg}`);
          }
          console.error(`✗ Row ${i + 1} failed:`, errorMsg);
        }
      }

      // Show summary notification
      if (successCount > 0 && errorCount === 0) {
        showNotification("success", `Successfully uploaded ${successCount} customer accounts`);
      } else if (successCount > 0 && errorCount > 0) {
        showNotification("warning", `Uploaded ${successCount} accounts. ${errorCount} failed. Check console for details.`);
        console.warn("Upload errors:", errors);
      } else {
        showNotification("error", `Upload failed. ${errorCount} errors. Check console for details.`);
        console.error("Upload errors:", errors);
      }

      // Refresh customer accounts list
      fetchCustomerAccountsForCodeList();

    } catch (error) {
      console.error("Bulk upload error:", error);
      showNotification("error", `Bulk upload failed: ${error.message}`);
    }
  };

  // Fetch all customer accounts for code list
  useEffect(() => {
    fetchCustomerAccountsForCodeList();
  }, []);

  const fetchCustomerAccountsForCodeList = async () => {
    try {
      const response = await axios.get(`${server}/customer-account`);
      if (response.data) {
        const accounts = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setCustomerAccounts(
          accounts.map((acc) => ({
            accountCode: acc.accountCode,
            name: acc.name || acc.fullName || acc.companyName,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching customer accounts for code list:", error);
    }
  };

  // Code list columns
  const codeListColumns = useMemo(
    () => [
      { key: "accountCode", label: "Account Code" },
      { key: "name", label: "Customer Name" },
    ],
    []
  );

  const openCodeList = () => {
    setCodeListConfig({
      data: customerAccounts,
      columns: codeListColumns,
      name: "Customer Accounts",
      handleAction: (action, rowData) => {
        if (action === "edit") {
          setValue("accountCode", rowData.accountCode);
          setToggleCodeList(false);
          showNotification(
            "success",
            `Account ${rowData.accountCode} selected`
          );
        }
      },
    });

    setToggleCodeList(true);
  };

  // Refresh handler
  const handleRefresh = () => {
    setStep(0);
    setCustomerData(null);
    setResetFactor(!resetFactor);
    setIsPrefilledDataSet(false);
    setHasCheckedAccountCode(false);
    setInitialLoadComplete(false);
    setFormKey((prev) => prev + 1);

    const defaultValues = prefilledUserData
      ? {
        accountType: prefilledUserData.accountType,
        accountCode: prefilledUserData.accountCode,
        companyName: prefilledUserData.companyName || prefilledUserData.fullName,
        fullName: prefilledUserData.fullName,
        name: prefilledUserData.fullName,
        emailId: prefilledUserData.emailId,
        email: prefilledUserData.emailId,
        mobileNumber: prefilledUserData.mobileNumber,
        mobile: prefilledUserData.mobileNumber,
        phone: prefilledUserData.mobileNumber,
        addressLine1: prefilledUserData.addressLine1,
        addressLine2: prefilledUserData.addressLine2,
        address1: prefilledUserData.addressLine1,
        address2: prefilledUserData.addressLine2,
        zipCode: prefilledUserData.zipCode,
        pincode: prefilledUserData.zipCode,
        pinCode: prefilledUserData.zipCode,
        city: prefilledUserData.city,
        state: prefilledUserData.state,
        country: prefilledUserData.country,
        gstNumber: prefilledUserData.gstNumber,
        gstin: prefilledUserData.gstNumber,
        gst: prefilledUserData.gstNumber,
        gstNo: prefilledUserData.gstNumber,
        sector: prefilledUserData.sector,
        turnover: prefilledUserData.turnover,
        contactPerson: prefilledUserData.fullName,
        telNo: prefilledUserData.mobileNumber,
      }
      : {};

    reset(defaultValues, { keepDefaultValues: false });
    showNotification("success", "Form refreshed successfully");
  };

  useEffect(() => {
    if (prefilledUserData && !isPrefilledDataSet && !initialLoadComplete) {
      const mappedData = {
        accountType: prefilledUserData.accountType,
        accountCode: prefilledUserData.accountCode,
        companyName: prefilledUserData.companyName || prefilledUserData.fullName,
        fullName: prefilledUserData.fullName,
        name: prefilledUserData.fullName || prefilledUserData.companyName,
        contactPerson: prefilledUserData.fullName || prefilledUserData.companyName,
        emailId: prefilledUserData.emailId,
        email: prefilledUserData.emailId,
        mobileNumber: prefilledUserData.mobileNumber,
        mobile: prefilledUserData.mobileNumber,
        phone: prefilledUserData.mobileNumber,
        telNo: prefilledUserData.mobileNumber,
        addressLine1: prefilledUserData.addressLine1,
        addressLine2: prefilledUserData.addressLine2,
        address1: prefilledUserData.addressLine1,
        address2: prefilledUserData.addressLine2,
        zipCode: prefilledUserData.zipCode,
        pincode: prefilledUserData.zipCode,
        pinCode: prefilledUserData.zipCode,
        city: prefilledUserData.city,
        state: prefilledUserData.state,
        country: prefilledUserData.country,
        gstNumber: prefilledUserData.gstNumber,
        gstin: prefilledUserData.gstNumber,
        gst: prefilledUserData.gstNumber,
        gstNo: prefilledUserData.gstNumber,
        sector: prefilledUserData.sector,
        turnover: prefilledUserData.turnover,
        panNo: prefilledUserData.panNo,
        kycNo: prefilledUserData.kycNo,
      };

      reset(mappedData, { keepDefaultValues: false });
      setIsPrefilledDataSet(true);
      setInitialLoadComplete(true);
    }
  }, [prefilledUserData, reset, isPrefilledDataSet, initialLoadComplete]);

  const onSubmit = async (data) => {
    try {
      let response;
      if (customerData) {
        response = await axios.put(
          `${server}/customer-account?accountCode=${customerData.accountCode}`,
          data
        );
        if (response.status === 200) {
          setCustomerData(response.data);
          showNotification("success", "Account updated successfully");
        }
      } else {
        response = await axios.post(`${server}/customer-account`, data);
        if (response.status === 201) {
          setCustomerData(response.data);
          showNotification("success", "Account created successfully");
        }
      }
    } catch (error) {
      showNotification("error", "Error processing account");
    }
  };

  useEffect(() => {
    const booleanKeys = new Set([
      "enableOS", "allServiceSettings", "enableVolDiscount",
      "enablePortalPassword", "upsLabel", "yadelLabel", "post11Label",
      "dhlLabel", "upsStandardLabel", "enableLabelSetting",
    ]);

    const fetchCustomerAccount = async () => {
      try {
        const res = await axios.get(`${server}/customer-account?accountCode=${debouncedAccountCode.toUpperCase()}`);
        if (res.status === 200) {
          const accountData = res.data;
          setCustomerData(accountData);
          setHasCheckedAccountCode(true);

          for (const [key, value] of Object.entries(accountData)) {
            if (key !== "accountCode" && key !== "_id") {
              setValue(key, value);
            }
          }
          showNotification("success", `Account ${accountCode} loaded`);
        }
      } catch (error) {
        setCustomerData(null);
        setHasCheckedAccountCode(true);
      }
    };

    if (debouncedAccountCode && debouncedAccountCode.length >= 5) {
      if (!prefilledUserData || (isPrefilledDataSet && initialLoadComplete)) {
        fetchCustomerAccount();
      }
    } else {
      if (!prefilledUserData || (!isPrefilledDataSet && initialLoadComplete)) {
        setCustomerData(null);
        setHasCheckedAccountCode(false);

        for (const key of Object.keys(getValues())) {
          if (key !== "accountCode" && key !== "_id" && key !== "accountType") {
            if (booleanKeys.has(key)) {
              setValue(key, false);
            } else {
              setValue(key, "");
            }
          }
        }
      }
    }
  }, [debouncedAccountCode, prefilledUserData, isPrefilledDataSet, initialLoadComplete, server, getValues, setValue]);

  const handleFormSaveSuccess = () => {
    setCustomerData(null);
    setHasCheckedAccountCode(false);
    setIsPrefilledDataSet(false);
    setStep(0);

    if (onSaveSuccess && typeof onSaveSuccess === 'function') {
      onSaveSuccess();
    }

    showNotification("success", "Customer account saved successfully");
  };

  return (
    <div className="flex flex-col gap-9" key={formKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <div className="flex items-center gap-3">
        {onBack && (
          <span onClick={onBack} className="cursor-pointer">
            <Image
              src="./back-filled.svg"
              alt="back_arrow"
              width={15}
              height={13}
            />
          </span>
        )}
        <Heading
          title="Customer Account"
          bulkUploadBtn={true}
          onRefresh={handleRefresh}
          onClickBulkUploadBtn={() => setShowBulkUpload(true)}
          onClickCodeList={openCodeList}
        />
      </div>

      <StepsNavbar
        steps={steps}
        step={step}
        setStep={setStep}
        register={register}
        setValue={setValue}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex w-full text-sm">
        <div className={`transition-all duration-200 ease-in-out ${step === 0 ? "w-full h-full opacity-100" : "w-0 h-0 opacity-0 overflow-hidden"}`}>
          <AddressAndContact
            resetFactor={resetFactor}
            customerData={customerData || prefilledUserData}
            getValues={getValues}
            watch={watch}
            setStep={setStep}
            register={register}
            setValue={setValue}
            handleSubmit={handleSubmit}
            prefilledUserData={prefilledUserData}
          />
        </div>
        <div className={`transition-all duration-200 ease-in-out ${step === 1 ? "w-full h-full opacity-100" : "w-0 h-0 opacity-0 overflow-hidden"}`}>
          <CustomerDetails
            resetFactor={resetFactor}
            customerData={customerData || prefilledUserData}
            watch={watch}
            setStep={setStep}
            register={register}
            setValue={setValue}
            handleSubmit={handleSubmit}
            prefilledUserData={prefilledUserData}
          />
        </div>
        <div className={`transition-all duration-200 ease-in-out ${step === 2 ? "w-full h-full opacity-100" : "w-0 h-0 opacity-0 overflow-hidden"}`}>
          <CreditLimit
            resetFactor={resetFactor}
            customerData={customerData}
            getValues={getValues}
            setStep={setStep}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className={`transition-all duration-200 ease-in-out ${step === 3 ? "w-full h-full opacity-100" : "w-0 h-0 opacity-0 overflow-hidden"}`}>
          <ServiceSetting
            resetFactor={resetFactor}
            customerData={customerData}
            getValues={getValues}
            setStep={setStep}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className={`transition-all duration-200 ease-in-out ${step === 4 ? "w-full h-full opacity-100" : "w-0 h-0 opacity-0 overflow-hidden"}`}>
          <PortalSetting
            resetFactor={resetFactor}
            customerData={customerData}
            setStep={setStep}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className={`transition-all duration-200 ease-in-out ${step === 5 ? "w-full h-full opacity-100" : "w-0 h-0 opacity-0 overflow-hidden"}`}>
          <RateHike
            resetFactor={resetFactor}
            customerData={customerData}
            getValues={getValues}
            setStep={setStep}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className={`transition-all duration-200 ease-in-out ${step === 6 ? "w-full h-full opacity-100" : "w-0 h-0 opacity-0 overflow-hidden"}`}>
          <UploadSignature
            resetFactor={resetFactor}
            customerData={customerData}
            getValues={getValues}
            watch={watch}
            setStep={setStep}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className={`transition-all duration-200 ease-in-out ${step === 7 ? "w-full h-full opacity-100" : "w-0 h-0 opacity-0 overflow-hidden"}`}>
          <GrrmSmse
            resetFactor={resetFactor}
            customerData={customerData || prefilledUserData}
            setStep={setStep}
            register={register}
            setValue={setValue}
            getValues={getValues}
            watch={watch}
            reset={reset}
            mode={customerData ? "edit" : "create"}
            onSaveSuccess={handleFormSaveSuccess}
          />
        </div>
      </form>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          onClose={() => setShowBulkUpload(false)}
          onFileUpload={handleBulkUpload}
          onDownloadSample={downloadSampleFile} // Pass the download function
          acceptedTypes={[".xls", ".xlsx", ".csv"]}
          title="Bulk Upload Customer Accounts"
          setVisible={(visible) => setNotification((prev) => ({ ...prev, visible }))}
        />
      )}
    </div>
  );
};

export default CustomerAccount;