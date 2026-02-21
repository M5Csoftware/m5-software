"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import React, { useContext, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { TableWithSorting } from "@/app/components/Table";
import { RedCheckboxBase } from "../RedCheckBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import * as XLSX from "xlsx";
import NotificationFlag from "@/app/components/Notificationflag";
import { Cross, X, AlertTriangle } from "lucide-react";

// List of common Indian zip code prefixes (first 2 digits) for accurate validation
const INDIAN_ZIP_PREFIXES = [
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19", // Delhi and surrounding
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29", // UP, Bihar, etc.
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39", // Rajasthan, Gujarat
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49", // Maharashtra, MP
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59", // South India
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69", // Tamil Nadu, Kerala
  "70",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "78",
  "79", // West Bengal, NE
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89", // Jharkhand, Odisha
];

// Helper function to validate if a zip code is Indian
const isIndianZipCode = (zipCode) => {
  if (!zipCode) return false;

  const zipStr = zipCode.toString().trim();

  // Indian zip codes are EXACTLY 6 digits starting with 1-9
  const indianZipPattern = /^[1-9][0-9]{5}$/;

  if (!indianZipPattern.test(zipStr)) {
    return false;
  }

  // Additional check: Indian zip codes start with specific prefixes
  const prefix = zipStr.substring(0, 2);
  return INDIAN_ZIP_PREFIXES.includes(prefix);
};

const validateReceiverZipCode = (zipCode) => {
  if (!zipCode || zipCode.toString().trim() === "") {
    return {
      isValid: false,
      message: "❌ Receiver zip code is required",
    };
  }

  const zipStr = zipCode.toString().trim();

  // CRITICAL: Block Indian zip codes completely
  if (isIndianZipCode(zipStr)) {
    return {
      isValid: false,
      message: `🚫 INDIAN ZIP CODE DETECTED! We only ship internationally. Indian pincode "${zipStr}" is NOT allowed for receiver address.`,
    };
  }

  // Validate international zip code formats

  // US zip codes: 5 digits or 5+4 format
  if (/^\d{5}(-\d{4})?$/.test(zipStr)) {
    return {
      isValid: true,
      message: "✓ Valid US zip code",
    };
  }

  // Canadian postal codes: A1A 1A1 format (with or without space)
  if (/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/.test(zipStr)) {
    return {
      isValid: true,
      message: "✓ Valid Canadian postal code",
    };
  }

  // UK postcodes: Various formats
  if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(zipStr)) {
    return {
      isValid: true,
      message: "✓ Valid UK postcode",
    };
  }

  // Australian postcodes: 4 digits
  if (/^\d{4}$/.test(zipStr)) {
    return {
      isValid: true,
      message: "✓ Valid Australian postcode",
    };
  }

  // European postcodes: Various formats (3-7 alphanumeric)
  if (/^[A-Z0-9]{3,7}$/i.test(zipStr) || /^\d{5}$/.test(zipStr)) {
    return {
      isValid: true,
      message: "✓ Valid European postal code",
    };
  }

  // Generic international: At least 3 characters, not matching Indian pattern
  if (zipStr.length >= 3) {
    return {
      isValid: true,
      message: "✓ Valid international zip code",
    };
  }

  return {
    isValid: false,
    message:
      "❌ Invalid zip code format. Must be a valid international postal code.",
  };
};

function ManualAWB() {
  const { register, setValue, watch, handleSubmit } = useForm();
  const { server } = useContext(GlobalContext);
  const [isChecked, setChecked] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [excelData, setExcelData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [awbInfo, setAwbInfo] = useState(null);
  const fileInputRef = useRef(null);

  // Notification states
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const [lastUploadData, setLastUploadData] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [sectorDestinationServiceErrors, setSectorDestinationServiceErrors] =
    useState([]);

  const flightDate = watch("flightDate");

  // Columns based on Excel data + essential fields
  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "accountCode", label: "Account Code" },
      { key: "origin", label: "Origin" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "service", label: "Service" },
      { key: "goodstype", label: "Goods Type" },
      { key: "pcs", label: "PCS" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "totalVolWt", label: "Volume Weight" },
      { key: "chargeableWt", label: "Chargeable Wt" },
      { key: "totalInvoiceValue", label: "Invoice Value" },
      { key: "currency", label: "Currency" },
      { key: "contentDisplay", label: "Content" },
      { key: "receiverFullName", label: "Receiver Name" },
      { key: "receiverPhoneNumber", label: "Receiver Phone" },
      { key: "receiverEmail", label: "Receiver Email" },
      { key: "receiverCity", label: "Receiver City" },
      { key: "receiverState", label: "Receiver State" },
      { key: "receiverPincode", label: "Receiver Pincode (International)" },
      { key: "shipperFullName", label: "Shipper Name" },
      { key: "shipperPhoneNumber", label: "Shipper Phone" },
      { key: "shipperKycType", label: "Shipper KYC Type" },
      { key: "shipperKycNumber", label: "Shipper KYC No" },
      { key: "reference", label: "Reference No" },
      { key: "flight", label: "Flight" },
      { key: "csb", label: "CSB" },
      {
        key: "zipValidation",
        label: "Zip Code Status",
        render: (row) => {
          const validation = validateReceiverZipCode(row.receiverPincode);
          if (!validation.isValid) {
            return (
              <span
                style={{
                  color: "#dc2626",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              >
                {validation.message}
              </span>
            );
          }
          return (
            <span style={{ color: "#16a34a", fontSize: "12px" }}>
              {validation.message}
            </span>
          );
        },
      },
    ],
    [],
  );

  const calculateVolumeWeight = (length, breadth, height) => {
    const volume = (length || 0) * (breadth || 0) * (height || 0);
    return Math.round((volume / 5000) * 100) / 100;
  };

  // Transform Excel row to Shipment JSON (WITH AWB from Excel)
  const transformExcelToShipment = (excelRow, index) => {
    const timestamp = Date.now() + index;

    // Parse comma-separated values
    const totalPcs = Number(excelRow.PCS) || 1;

    const parseCSV = (value) => {
      if (value === null || value === undefined || value === "") return [];
      if (Array.isArray(value)) return value;
      return value
        .toString()
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");
    };

    const lengths = parseCSV(excelRow.Length);
    const breadths = parseCSV(excelRow.Breadth);
    const heights = parseCSV(excelRow.Height);
    const weights = parseCSV(excelRow.ActualWeight);
    const contents = parseCSV(excelRow.ShipmentContent);
    const hsnCodes = parseCSV(excelRow.HSNCode);
    const quantities = parseCSV(excelRow.Quantity);
    const rates = parseCSV(excelRow.Rate);

    // CRITICAL: Check if dimensions are provided
    const hasDimensions =
      lengths.some((v) => Number(v) > 0) &&
      breadths.some((v) => Number(v) > 0) &&
      heights.some((v) => Number(v) > 0);

    // Create boxes array
    const boxes = [];
    const maxBoxes = Math.max(
      lengths.length,
      breadths.length,
      heights.length,
      weights.length,
      totalPcs,
    );

    if (maxBoxes === 1 && totalPcs > 1) {
      const length = Number(lengths[0] || 0);
      const breadth = Number(breadths[0] || 0);
      const height = Number(heights[0] || 0);
      const weight = Number(weights[0] || 0);

      // Only calculate volume weight if dimensions exist
      const volumeWeight = hasDimensions
        ? calculateVolumeWeight(length, breadth, height)
        : 0;

      for (let i = 0; i < totalPcs; i++) {
        boxes.push({
          length: hasDimensions ? length.toString() : "0",
          width: hasDimensions ? breadth.toString() : "0",
          height: hasDimensions ? height.toString() : "0",
          pcs: 1,
          actualWt: weight / totalPcs,
          volumeWeight: volumeWeight / totalPcs,
          boxNo: i + 1,
        });
      }
    } else {
      for (let i = 0; i < maxBoxes; i++) {
        const length = Number(lengths[i] || lengths[0] || 0);
        const breadth = Number(breadths[i] || breadths[0] || 0);
        const height = Number(heights[i] || heights[0] || 0);
        const weight = Number(weights[i] || weights[0] || 0);

        // Only calculate volume weight if dimensions exist
        const volumeWeight = hasDimensions
          ? calculateVolumeWeight(length, breadth, height)
          : 0;

        boxes.push({
          length: hasDimensions ? length.toString() : "0",
          width: hasDimensions ? breadth.toString() : "0",
          height: hasDimensions ? height.toString() : "0",
          pcs: 1,
          actualWt: weight,
          volumeWeight: volumeWeight,
          boxNo: i + 1,
        });
      }
    }

    // Create shipmentAndPackageDetails with items mapped to boxes
    const shipmentAndPackageDetails = {};

    const maxItems = Math.max(
      contents.length,
      hsnCodes.length,
      quantities.length,
      rates.length,
      1,
    );

    // Map items to boxes
    if (maxItems === boxes.length && maxItems > 1) {
      for (let i = 0; i < maxItems; i++) {
        const quantity = Number(quantities[i] || quantities[0] || 1);
        const rate = Number(rates[i] || rates[0] || 0);
        const amount = (quantity * rate).toFixed(2);

        shipmentAndPackageDetails[i + 1] = [
          {
            id: `${timestamp}${i}`,
            context: contents[i] || contents[0] || "",
            sku: hsnCodes[i] || hsnCodes[0] || "",
            hsnNo: hsnCodes[i] || hsnCodes[0] || "",
            qty: quantity.toString(),
            rate: rate.toString(),
            amount: amount,
          },
        ];
      }
    } else if (maxItems > boxes.length && boxes.length > 1) {
      const itemsPerBox = Math.ceil(maxItems / boxes.length);
      for (let boxIdx = 0; boxIdx < boxes.length; boxIdx++) {
        const boxItems = [];
        const startIdx = boxIdx * itemsPerBox;
        const endIdx = Math.min(startIdx + itemsPerBox, maxItems);

        for (let i = startIdx; i < endIdx; i++) {
          const quantity = Number(quantities[i] || quantities[0] || 1);
          const rate = Number(rates[i] || rates[0] || 0);
          const amount = (quantity * rate).toFixed(2);

          boxItems.push({
            id: `${timestamp}${i}`,
            context: contents[i] || contents[0] || "",
            sku: hsnCodes[i] || hsnCodes[0] || "",
            hsnNo: hsnCodes[i] || hsnCodes[0] || "",
            qty: quantity.toString(),
            rate: rate.toString(),
            amount: amount,
          });
        }
        if (boxItems.length > 0) {
          shipmentAndPackageDetails[boxIdx + 1] = boxItems;
        }
      }
    } else {
      const packageItems = [];
      for (let i = 0; i < maxItems; i++) {
        const quantity = Number(quantities[i] || quantities[0] || 1);
        const rate = Number(rates[i] || rates[0] || 0);
        const amount = (quantity * rate).toFixed(2);

        packageItems.push({
          id: `${timestamp}${i}`,
          context: contents[i] || contents[0] || "",
          sku: hsnCodes[i] || hsnCodes[0] || "",
          hsnNo: hsnCodes[i] || hsnCodes[0] || "",
          qty: quantity.toString(),
          rate: rate.toString(),
          amount: amount,
        });
      }
      shipmentAndPackageDetails[1] = packageItems;
    }

    let totalInvoiceValue = 0;
    Object.values(shipmentAndPackageDetails).forEach((boxItems) => {
      boxItems.forEach((item) => {
        totalInvoiceValue += parseFloat(item.amount);
      });
    });

    const totalActualWt = boxes.reduce((sum, box) => sum + box.actualWt, 0);
    const totalVolWt = hasDimensions
      ? boxes.reduce((sum, box) => sum + box.volumeWeight, 0)
      : 0;

    const chargeableWt = Math.ceil(
      hasDimensions ? Math.max(totalActualWt, totalVolWt) : totalActualWt,
    );

    const firstBoxItems =
      shipmentAndPackageDetails[1] ||
      Object.values(shipmentAndPackageDetails)[0] ||
      [];
    const contentArray =
      firstBoxItems.length > 0 ? [firstBoxItems[0].context] : [];

    const receiverZipcode = excelRow.ConsigneeZipcode?.toString().trim() || "";
    const zipValidation = validateReceiverZipCode(receiverZipcode);

    if (!zipValidation.isValid) {
      return {
        error: true,
        validationErrors: [
          {
            field: "ConsigneeZipcode",
            value: receiverZipcode,
            message: zipValidation.message,
            rowIndex: index + 2,
          },
        ],
        rawData: excelRow,
      };
    }

    const shipment = {
      awbNo: excelRow.AWBNo?.toString().trim() || "",
      accountCode: excelRow.AccountCode?.toString().trim() || "DEFAULT",
      status: "Shipment Created!",
      date: new Date(),
      excelRowNumber: index + 2, // Store original Excel row number (1-based + header)
      sector: (excelRow.Sector?.toString().trim() || "").toUpperCase(),
      origin: excelRow.Origin?.toString().trim() || "",
      destination: (
        excelRow.Destination?.toString().trim() || ""
      ).toUpperCase(),
      reference: excelRow.ReferenceNo?.toString().trim() || "",
      forwardingNo: "",
      forwarder: "",
      goodstype: excelRow.GoodsType?.toString().trim() || "",
      payment: "Credit",

      boxes: boxes,

      chargeableWt: chargeableWt,
      totalActualWt: totalActualWt,
      totalVolWt: totalVolWt,
      pcs: totalPcs,

      totalInvoiceValue: totalInvoiceValue,
      currency: excelRow.InvoiceCurrency?.toString().trim() || "INR",
      currencys: excelRow.InvoiceCurrency?.toString().trim() || "INR",
      content: contentArray,

      shipmentAndPackageDetails: shipmentAndPackageDetails,

      operationRemark: excelRow.OperationRemark?.toString().trim() || "",
      automation: false,
      handling: false,
      csb: isChecked,
      commercialShipment: false,
      isHold: true,
      holdReason: "Hold for amount",
      otherHoldReason: "",
      basicAmt: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      totalAmt: 0,
      discount: 0,
      discountAmt: 0,
      duty: 0,
      fuelAmt: 0,
      fuelPercentage: 0,
      handlingAmount: 0,
      hikeAmt: 0,
      manualAmount: 0,
      miscChg: 0,
      miscChgReason: "",
      overWtHandling: 0,
      volDisc: 0,
      cashRecvAmount: 0,
      billNo: "",
      manifestNo: "",
      runNo: "",
      alMawb: "",
      bag: "",
      clubNo: "",
      company: "",
      customer: "",
      flight: flightDate,
      network: "",
      networkName: "",
      obc: "",
      service: (excelRow.Service?.toString().trim() || "").toUpperCase(),
      localMF: "",

      receiverFullName: excelRow.ConsigneeName?.toString().trim() || "",
      receiverPhoneNumber: excelRow.ConsigneeTelephone?.toString().trim() || "",
      receiverEmail: excelRow.ConsigneeEmailId?.toString().trim() || "",
      receiverAddressLine1:
        excelRow.ConsigneeAddressLine1?.toString().trim() || "",
      receiverAddressLine2:
        excelRow.ConsigneeAddressLine2?.toString().trim() || "",
      receiverCity: excelRow.ConsigneeCity?.toString().trim() || "",
      receiverState: excelRow.ConsigneeState?.toString().trim() || "",
      receiverCountry: (excelRow.Destination?.toString().trim() || "").toUpperCase(),
      receiverPincode: receiverZipcode,

      shipperFullName: excelRow.ConsignorName?.toString().trim() || "",
      shipperPhoneNumber: excelRow.ConsignorTelephone?.toString().trim() || "",
      shipperEmail: "",
      shipperAddressLine1:
        excelRow.ConsignorAddressLine1?.toString().trim() || "",
      shipperAddressLine2:
        excelRow.ConsignorAddressLine2?.toString().trim() || "",
      shipperCity: excelRow.ConsignorCity?.toString().trim() || "",
      shipperState: excelRow.ConsignorState?.toString().trim() || "",
      shipperCountry: "INDIA",
      shipperPincode: excelRow.ConsignorPincode?.toString().trim() || "",
      shipperKycType: excelRow.ConsignorKycType?.toString().trim() || "",
      shipperKycNumber: excelRow.ConsignorKycNo?.toString().trim() || "",

      coLoader: "",
      coLoaderNumber: 0,
      insertUser: "11111111",
      updateUser: "11111111",
      billingLocked: false,
      awbStatus: "",
      isBilled: false,
      notifType: "",
      notifMsg: "",
      runDate: null,
      completeDataLock: false,
      gstNumber: "",
      adCode: "",
      termsOfInvoice: "",
      crnNumber: "",
      mhbsNumber: "",
      exportThroughEcommerce: false,
      meisScheme: false,
      shipmentType: excelRow.ShipmentType || "Non-Document",

      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    };

    shipment.contentDisplay = contentArray.length > 0 ? contentArray[0] : "";
    shipment.isValid = true;
    shipment.zipValidationStatus = zipValidation;

    return shipment;
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const selectedFileName = file.name;
      setFileName(selectedFileName);
      setValue("weight", selectedFileName, { shouldValidate: true });
      setValidationErrors([]);
      setSectorDestinationServiceErrors([]);
      setRowData([]);
      setAwbInfo(null);

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const validationErrorsFound = [];
          jsonData.forEach((row, index) => {
            const zipcode = row.ConsigneeZipcode?.toString().trim() || "";
            const validation = validateReceiverZipCode(zipcode);
            if (!validation.isValid) {
              validationErrorsFound.push({
                row: index + 2,
                zipcode: zipcode,
                message: validation.message,
                isIndianZip: validation.message.includes("INDIAN ZIP CODE"),
              });
            }
          });

          setValidationErrors(validationErrorsFound);

          try {
            setLoading(true);
            const sectorDestServiceResponse = await axios.post(
              `${server}/bulk-upload/validate-sector-destination`,
              { shipments: jsonData },
            );

            if (!sectorDestServiceResponse.data.success) {
              const sdsErrors =
                sectorDestServiceResponse.data.validationErrors || [];
              setSectorDestinationServiceErrors(sdsErrors);

              let errorSummary = `🚫 SECTOR-DESTINATION-SERVICE MISMATCH (${sdsErrors.length} issues):\n`;
              errorSummary += sdsErrors
                .slice(0, 5)
                .map((err) => {
                  const rowsText =
                    err.rowIndices.length > 3
                      ? `Rows ${err.rowIndices.slice(0, 3).join(", ")}... (+${err.rowIndices.length - 3} more)`
                      : `Row${err.rowIndices.length > 1 ? "s" : ""} ${err.rowIndices.join(", ")}`;
                  return `   • ${err.sector} → ${err.destination} → ${err.service} (${rowsText})`;
                })
                .join("\n");

              if (sdsErrors.length > 5) {
                errorSummary += `\n   ...and ${sdsErrors.length - 5} more issues`;
              }

              showNotification(
                "error",
                `❌ VALIDATION FAILED!\n\n${errorSummary}\n\n⚠️ These sector-destination-service combinations do not exist in your zone matrix.\nPlease verify your Excel data.`,
              );
            }
          } catch (sdError) {
            console.error(
              "Sector-Destination-Service validation error:",
              sdError,
            );
            showNotification(
              "error",
              "Error validating sector-destination-service combinations. Please try again.",
            );
          } finally {
            setLoading(false);
          }

          if (validationErrorsFound.length > 0) {
            const indianZipErrors = validationErrorsFound.filter((err) =>
              err.message.includes("INDIAN ZIP CODE"),
            );
            const otherErrors = validationErrorsFound.filter(
              (err) => !err.message.includes("INDIAN ZIP CODE"),
            );

            let errorSummary = "";
            if (indianZipErrors.length > 0) {
              errorSummary += `🚫 INDIAN ZIP CODES DETECTED (${indianZipErrors.length} shipments):\n`;
              errorSummary += indianZipErrors
                .slice(0, 5)
                .map((err) => `   • Row ${err.row}: "${err.zipcode}"`)
                .join("\n");
              if (indianZipErrors.length > 5) {
                errorSummary += `\n   ...and ${indianZipErrors.length - 5} more Indian zip codes`;
              }
            }

            if (otherErrors.length > 0) {
              if (errorSummary) errorSummary += "\n\n";
              errorSummary += `⚠️ OTHER ISSUES (${otherErrors.length} shipments):\n`;
              errorSummary += otherErrors
                .slice(0, 3)
                .map(
                  (err) =>
                    `   • Row ${err.row}: "${err.zipcode}" - ${err.message}`,
                )
                .join("\n");
              if (otherErrors.length > 3) {
                errorSummary += `\n   ...and ${otherErrors.length - 3} more issues`;
              }
            }

            showNotification(
              "error",
              `❌ VALIDATION FAILED!\n\n${errorSummary}\n\n⚠️ IMPORTANT: We only ship internationally!\nReceiver zip codes MUST be from: UK, USA, Canada, Australia, or Europe.\nIndian pincodes are NOT allowed.`,
            );
          } else if (sectorDestinationServiceErrors.length === 0) {
            showNotification(
              "success",
              `✅ Excel file loaded successfully!\n📦 ${jsonData.length} shipments found\n🌍 All receiver zip codes are valid international codes\n✓ All sector-destination-service combinations verified`,
            );
          }

          setExcelData(jsonData);
          console.log("Excel data loaded:", jsonData.length, "rows");
        } catch (error) {
          console.error("Error reading Excel file:", error);
          showNotification(
            "error",
            "Error reading Excel file. Please make sure it's a valid Excel file.",
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleShow = async () => {
    if (!flightDate) {
      showNotification("error", "Please enter Flight Date");
      return;
    }

    if (excelData.length === 0) {
      showNotification("error", "Please select an Excel file first");
      return;
    }

    if (validationErrors.length > 0) {
      const indianZipCount = validationErrors.filter(
        (err) => err.isIndianZip,
      ).length;
      const otherErrorCount = validationErrors.length - indianZipCount;

      showNotification(
        "error",
        `🚫 CANNOT PROCEED - INVALID ZIP CODES DETECTED!\n\n` +
        `❌ Total errors: ${validationErrors.length}\n` +
        (indianZipCount > 0
          ? `   • Indian pincodes: ${indianZipCount}\n`
          : "") +
        (otherErrorCount > 0
          ? `   • Other invalid formats: ${otherErrorCount}\n`
          : "") +
        `\n⚠️ ACTION REQUIRED:\n` +
        `1. Fix the invalid zip codes in your Excel file\n` +
        `2. Remove all Indian pincodes from ConsigneeZipcode column\n` +
        `3. Re-upload the corrected file\n\n` +
        `✓ We only accept international zip codes (UK, USA, Canada, Australia, Europe)`,
      );
      return;
    }

    if (sectorDestinationServiceErrors.length > 0) {
      let errorSummary = `🚫 SECTOR-DESTINATION-SERVICE MISMATCH!\n\n`;
      errorSummary += `❌ ${sectorDestinationServiceErrors.length} invalid combinations found:\n\n`;

      sectorDestinationServiceErrors.slice(0, 5).forEach((err) => {
        const rowsText =
          err.rowIndices.length > 3
            ? `Rows ${err.rowIndices.slice(0, 3).join(", ")}... (+${err.rowIndices.length - 3} more)`
            : `Row${err.rowIndices.length > 1 ? "s" : ""} ${err.rowIndices.join(", ")}`;
        errorSummary += `• ${err.sector} → ${err.destination} → ${err.service}\n  ${rowsText}\n\n`;
      });

      if (sectorDestinationServiceErrors.length > 5) {
        errorSummary += `...and ${sectorDestinationServiceErrors.length - 5} more mismatches\n\n`;
      }

      errorSummary += `⚠️ ACTION REQUIRED:\n`;
      errorSummary += `2. fix the Sector/Destination/Service values in your Excel\n`;
      errorSummary += `4. Re-upload the corrected file`;

      showNotification("error", errorSummary);
      return;
    }

    try {
      setLoading(true);

      const transformedResults = excelData.map((row, index) => {
        return transformExcelToShipment(row, index);
      });

      const validShipments = [];
      const allValidationErrors = [];

      transformedResults.forEach((result) => {
        if (result.error) {
          allValidationErrors.push(...result.validationErrors);
        } else if (result.isValid) {
          validShipments.push(result);
        }
      });

      if (allValidationErrors.length > 0) {
        const indianZipErrors = allValidationErrors.filter((err) =>
          err.message.includes("INDIAN ZIP CODE"),
        );
        const otherErrors = allValidationErrors.filter(
          (err) => !err.message.includes("INDIAN ZIP CODE"),
        );

        const errorMessages = [];
        if (indianZipErrors.length > 0) {
          const indianErrorSummary = indianZipErrors
            .slice(0, 10)
            .map(
              (err) => `Row ${err.rowIndex}: "${err.value}" - ${err.message}`,
            )
            .join("\n");
          errorMessages.push(
            `Indian Zip Codes Found (${indianZipErrors.length}):\n${indianErrorSummary}`,
          );
        }
        if (otherErrors.length > 0) {
          const otherErrorSummary = otherErrors
            .slice(0, 10)
            .map(
              (err) => `Row ${err.rowIndex}: "${err.value}" - ${err.message}`,
            )
            .join("\n");
          errorMessages.push(
            `Other Zip Code Errors (${otherErrors.length}):\n${otherErrorSummary}`,
          );
        }

        let errorSummary = errorMessages.join("\n\n");
        if (allValidationErrors.length > 10) {
          errorSummary += `\n\n...and ${allValidationErrors.length - 10} more errors`;
        }

        showNotification(
          "error",
          `❌ CRITICAL ERROR: ${errorSummary}\n\n🚫 BLOCKED: Only ${validShipments.length} valid international shipments will be processed.\n\n⚠️ REMINDER: We ship ONLY to international destinations!\nAccepted countries: UK, USA, Canada, Australia, Europe\nIndian pincodes are STRICTLY NOT ALLOWED for receiver addresses.`,
        );
      }

      setRowData(validShipments);

      if (validShipments.length === 0) {
        showNotification(
          "error",
          `❌ NO VALID SHIPMENTS FOUND!\n\nAll receiver zip codes are either:\n• Indian pincodes (NOT allowed)\n• Invalid international formats\n\n🌍 REQUIRED: Valid international zip codes from:\n   ✓ UK (e.g., SW1A 1AA)\n   ✓ USA (e.g., 90210)\n   ✓ Canada (e.g., A1A 1A1)\n   ✓ Australia (e.g., 2000)\n   ✓ Europe (e.g., 75001)\n\n🚫 Indian pincodes (6 digits) are STRICTLY PROHIBITED.`,
        );
      } else {
        showNotification(
          "success",
          `✅ Data loaded successfully!\n📦 Valid international shipments: ${validShipments.length}\n` +
          (allValidationErrors.length > 0
            ? `⚠️ Filtered out: ${allValidationErrors.length} invalid shipments\n`
            : "") +
          `🌍 All receiver zip codes are valid international codes\n` +
          `✓ All sector-destination-service combinations verified`,
        );
      }
    } catch (error) {
      console.error("Error:", error);
      showNotification(
        "error",
        error.response?.data?.message ||
        "Error processing data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to upload. Please click Show first.");
      return;
    }

    const invalidShipments = [];
    rowData.forEach((row) => {
      const validation = validateReceiverZipCode(row.receiverPincode);
      if (!validation.isValid) {
        invalidShipments.push({
          row: row.excelRowNumber,
          awbNo: row.awbNo,
          zipcode: row.receiverPincode,
          message: validation.message,
          isIndianZip: validation.message.includes("INDIAN ZIP CODE"),
        });
      }
    });

    if (invalidShipments.length > 0) {
      const indianZipShipments = invalidShipments.filter((s) => s.isIndianZip);
      const otherInvalidShipments = invalidShipments.filter(
        (s) => !s.isIndianZip,
      );

      let errorSummary = "";
      if (indianZipShipments.length > 0) {
        errorSummary += `🚫 INDIAN PINCODES (${indianZipShipments.length} shipments):\n`;
        errorSummary += indianZipShipments
          .slice(0, 5)
          .map((err) => `   • AWB ${err.awbNo}: "${err.zipcode}"`)
          .join("\n");
        if (indianZipShipments.length > 5) {
          errorSummary += `\n   ...and ${indianZipShipments.length - 5} more Indian zip codes`;
        }
      }

      if (otherInvalidShipments.length > 0) {
        if (errorSummary) errorSummary += "\n\n";
        errorSummary += `⚠️ OTHER INVALID FORMATS (${otherInvalidShipments.length} shipments):\n`;
        errorSummary += otherInvalidShipments
          .slice(0, 3)
          .map((err) => `   • AWB ${err.awbNo}: "${err.zipcode}"`)
          .join("\n");
        if (otherInvalidShipments.length > 3) {
          errorSummary += `\n   ...and ${otherInvalidShipments.length - 3} more`;
        }
      }

      showNotification(
        "error",
        `❌ UPLOAD BLOCKED - INVALID ZIP CODES!\n\n` +
        `${errorSummary}\n\n` +
        `🚫 CRITICAL: These appear to be INDIAN PINCODES or invalid formats.\n\n` +
        `⚠️ UPLOAD COMPLETELY BLOCKED!\n` +
        `You CANNOT upload until these are fixed:\n` +
        `1. Go back to your Excel file\n` +
        `2. Fix the ConsigneeZipcode column for the rows listed above\n` +
        `3. Replace Indian pincodes with valid international zip codes\n` +
        `4. Re-upload the corrected file\n\n` +
        `✓ Accepted: UK, USA, Canada, Australia, Europe\n` +
        `✗ NOT Accepted: Indian pincodes (6-digit codes like 110001, 400001, etc.)`,
      );
      return;
    }

    try {
      setLoading(true);
      const uploadData = {
        shipments: rowData,
        flightDate: flightDate,
        csbChecked: isChecked,
      };

      const response = await axios.post(
        `${server}/bulk-upload/manual-awb`,
        uploadData,
      );

      if (response.data.success) {
        showNotification(
          "success",
          `🎉 Upload successful!\n` +
          `✓ Uploaded: ${rowData.length} shipments\n` +
          `🌍 All shipments have valid international receiver zip codes.\n` +
          `✓ All sector-destination-service combinations verified`,
        );

        setRowData([]);
        setExcelData([]);
        setFileName("");
        setAwbInfo(null);
        setValidationErrors([]);
        setSectorDestinationServiceErrors([]);
        setValue("weight", "");
        setValue("flightDate", "");
        setChecked(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      showNotification(
        "error",
        error.response?.data?.message ||
        "Error uploading data. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRowData([]);
    setExcelData([]);
    setFileName("");
    setAwbInfo(null);
    setValidationErrors([]);
    setSectorDestinationServiceErrors([]);
    setValue("weight", "");
    setValue("flightDate", "");
    setChecked(false);
    setLastUploadData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const totalErrors =
    validationErrors.length + sectorDestinationServiceErrors.length;
  const hasAnyErrors = totalErrors > 0;

  return (
    <>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleShow)}>
        <div className="flex gap-3">
          <div className="w-full relative">
            <DateInputBox
              placeholder="Flight Date"
              value="flightDate"
              setValue={setValue}
              register={register}
            />
          </div>
          <div className="relative w-full">
            <input
              type="text"
              value={fileName}
              readOnly
              placeholder="Excel Path"
              className="border border-[#979797] outline-none bg-gray-100 rounded-md h-8 text-sm px-4 pr-8 w-full cursor-default"
            />
            {fileName && (
              <button
                type="button"
                onClick={() => {
                  setFileName("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  setValue("weight", "");
                  setExcelData([]);
                  setRowData([]);
                  setAwbInfo(null);
                  setValidationErrors([]);
                  setSectorDestinationServiceErrors([]);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 font-bold hover:text-red-700"
              >
                ×
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              style={{ display: "none" }}
            />
          </div>
          <div className="flex gap-2">
            <OutlinedButtonRed
              type="button"
              label={"Browse"}
              onClick={handleBrowseClick}
            />
            <OutlinedButtonRed
              type="submit"
              label={loading ? "Loading..." : "Show"}
              disabled={loading || hasAnyErrors}
            />
          </div>
        </div>

        <div className="flex justify-between">
          <RedCheckboxBase
            label={"CSB V"}
            isChecked={isChecked}
            setChecked={setChecked}
            id={"csb"}
            register={register}
            setValue={setValue}
          />
          <div className="">
            <SimpleButton
              type="button"
              name={loading ? "Uploading..." : "Upload"}
              onClick={handleUpload}
              disabled={loading || rowData.length === 0}
            />
          </div>
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={rowData}
          />
        </div>
      </form>

      {validationErrors.length > 0 && (
        <div
          className="rounded-md p-4 mb-2 border-2"
          style={{
            backgroundColor: "#FEE2E2",
            borderColor: "#DC2626",
          }}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h3
                className="font-bold text-lg mb-2 flex items-center"
                style={{ color: "#991B1B" }}
              >
                <X className="mr-2" size={24} /> INVALID ZIP CODES -{" "}
                {validationErrors.length} Shipments Blocked
              </h3>
              <div className="bg-white rounded p-3 mb-3 border border-red-300">
                <p className="text-sm mb-2" style={{ color: "#DC2626" }}>
                  Indian pincodes (6-digit codes like 110001, 400001, etc.) are{" "}
                  <strong>NOT ALLOWED</strong> for receiver addresses.
                </p>
              </div>
              <span
                className="text-sm font-semibold mb-1"
                style={{ color: "#991B1B" }}
              >
                ⚠️ Action Required: Fix these {validationErrors.length}{" "}
                shipments in your Excel file:
              </span>
              <div className="mt-2 text-xs font-mono max-h-32 overflow-y-auto" style={{ color: "#991B1B" }}>
                {validationErrors.map((err, idx) => (
                  <div key={idx}>• Row {err.row}: "{err.zipcode}" - {err.message}</div>
                ))}
              </div>
              <span className="text-xs mt-2 block" style={{ color: "#DC2626" }}>
                These shipments will be automatically filtered out and NOT
                processed.
              </span>
            </div>
          </div>
        </div>
      )}

      {sectorDestinationServiceErrors.length > 0 && (
        <div
          className="rounded-md p-4 mb-2 border-2"
          style={{
            backgroundColor: "#FEF3C7",
            borderColor: "#F59E0B",
          }}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <h3
                className="font-bold text-lg mb-2 flex items-center"
                style={{ color: "#92400E" }}
              >
                <AlertTriangle className="mr-2" size={24} />{" "}
                SECTOR-DESTINATION-SERVICE MISMATCH -{" "}
                {sectorDestinationServiceErrors.length} Issues Found
              </h3>
              <div className="bg-white rounded p-3 mb-3 border border-amber-300">
                <p className="text-sm mb-2" style={{ color: "#F59E0B" }}>
                  The following sector-destination-service combinations{" "}
                  <strong>do not exist or currently not active</strong> in zone matrix.
                </p>
              </div>
              <div className="space-y-2">
                {sectorDestinationServiceErrors.slice(0, 10).map((err, idx) => (
                  <div
                    key={idx}
                    className="text-sm"
                    style={{ color: "#92400E" }}
                  >
                    <strong>
                      {err.sector} → {err.destination} → {err.service}
                    </strong>
                    <span className="ml-2 text-xs" style={{ color: "#D97706" }}>
                      (Row{err.rowIndices.length > 1 ? "s" : ""}:{" "}
                      {err.rowIndices.length > 5
                        ? `${err.rowIndices.slice(0, 5).join(", ")}... +${err.rowIndices.length - 5} more`
                        : err.rowIndices.join(", ")}
                      )
                    </span>
                  </div>
                ))}
                {sectorDestinationServiceErrors.length > 10 && (
                  <div
                    className="text-sm font-semibold"
                    style={{ color: "#92400E" }}
                  >
                    ...and {sectorDestinationServiceErrors.length - 10} more
                    mismatches
                  </div>
                )}
              </div>
              <div className="mt-3 text-sm" style={{ color: "#92400E" }}>
                <strong>⚠️ Action Required:</strong>
                <ul className="list-disc ml-5 mt-1">
                  <li>
                    Verify sector-destination-service combinations in your Excel
                    file
                  </li>
                  <li>
                    Update the Excel data to match zone
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
    </>
  );
}

export default ManualAWB;
