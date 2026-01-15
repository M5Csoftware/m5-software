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

function ManualAWB() {
  const { register, setValue, watch, handleSubmit } = useForm();
  const { server, accounts } = useContext(GlobalContext);
  const [isChecked, setChecked] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [excelData, setExcelData] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const flightDate = watch("flightDate");

  // Columns based ONLY on Excel data + essential fields
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
      { key: "content", label: "Content" },
      { key: "contentDisplay", label: "Content" }, // Changed from "content"

      { key: "receiverFullName", label: "Receiver Name" },
      { key: "receiverPhoneNumber", label: "Receiver Phone" },
      { key: "receiverEmail", label: "Receiver Email" },
      { key: "receiverCity", label: "Receiver City" },
      { key: "receiverState", label: "Receiver State" },
      { key: "receiverPincode", label: "Receiver Pincode" },
      { key: "shipperFullName", label: "Shipper Name" },
      { key: "shipperPhoneNumber", label: "Shipper Phone" },
      { key: "shipperKycType", label: "Shipper KYC Type" },
      { key: "shipperKycNumber", label: "Shipper KYC No" },
      { key: "reference", label: "Reference No" },
      { key: "flight", label: "Flight" },
      { key: "csb", label: "CSB" },
    ],
    []
  );

  // Transform Excel row to Shipment JSON
  const transformExcelToShipment = (excelRow, index) => {
    const accountCode = excelRow.AccountCode?.toString().trim() || "DEFAULT";

    const selectedAccount = accounts.find((a) => a.accountCode === accountCode);

    const volDisc = Number(selectedAccount?.volDiscount || 0);
    const minVolWtDisc = Number(selectedAccount?.volDiscountWeight || 0);

    console.log("accounts: ", accounts);
    console.log("volDiscount", volDisc);
    console.log("volDiscount", minVolWtDisc);
    console.log("selectedAccount: ", selectedAccount);

    const timestamp = Date.now() + index;

    // ==================== PARSE COMMA-SEPARATED VALUES ====================
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

    // ==================== CREATE BOXES ARRAY ====================
    const boxes = [];
    const maxBoxes = Math.max(
      lengths.length,
      breadths.length,
      heights.length,
      weights.length,
      totalPcs
    );

    if (maxBoxes === 1 && totalPcs > 1) {
      const length = Number(lengths[0] || 0);
      const breadth = Number(breadths[0] || 0);
      const height = Number(heights[0] || 0);
      const weight = Number(weights[0] || 0);
      const volumeWeight = calculateVolumeWeight(length, breadth, height);

      for (let i = 0; i < totalPcs; i++) {
        boxes.push({
          length: length.toString(),
          width: breadth.toString(),
          height: height.toString(),
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
        const volumeWeight = calculateVolumeWeight(length, breadth, height);

        boxes.push({
          length: length.toString(),
          width: breadth.toString(),
          height: height.toString(),
          pcs: 1,
          actualWt: weight,
          volumeWeight: volumeWeight,
          boxNo: i + 1,
        });
      }
    }

    // ==================== CREATE SHIPMENT AND PACKAGE DETAILS ====================
    // Map items to boxes based on count
    const shipmentAndPackageDetails = {};

    const maxItems = Math.max(
      contents.length,
      hsnCodes.length,
      quantities.length,
      rates.length,
      1
    );

    // Determine mapping strategy
    if (maxItems === boxes.length && maxItems > 1) {
      // ✅ One-to-one mapping: each item to its corresponding box
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
      // ✅ More items than boxes: distribute items across boxes
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
      // ✅ Default: all items in box 1 (single box or fewer items than boxes)
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

    // ==================== CALCULATE TOTALS ====================
    // Calculate total invoice value from ALL boxes
    let totalInvoiceValue = 0;
    Object.values(shipmentAndPackageDetails).forEach((boxItems) => {
      boxItems.forEach((item) => {
        totalInvoiceValue += parseFloat(item.amount);
      });
    });

    const totalActualWt = boxes.reduce((sum, box) => sum + box.actualWt, 0);
    const totalVolWt = boxes.reduce((sum, box) => sum + box.volumeWeight, 0);
    const initalChargeableWt = Math.max(totalActualWt, totalVolWt);
    let chargeableWt = Math.ceil(initalChargeableWt);
    // Apply volume discount if applicable
    if (
      volDisc > 0 &&
      minVolWtDisc > 0 &&
      totalVolWt > totalActualWt &&
      totalVolWt >= minVolWtDisc
    ) {
      const diff = totalVolWt - totalActualWt;
      const discountWeight = diff * (volDisc / 100);
      chargeableWt = totalVolWt - discountWeight;
    }

    // Get first content for display
    const firstBoxItems =
      shipmentAndPackageDetails[1] ||
      Object.values(shipmentAndPackageDetails)[0] ||
      [];
    const contentArray =
      firstBoxItems.length > 0 ? [firstBoxItems[0].context] : [];

    // ==================== CREATE SHIPMENT OBJECT ====================
    const shipment = {
      awbNo: excelRow.AwbNo?.toString().trim() || `TEMP_${timestamp}`,
      accountCode: excelRow.AccountCode?.toString().trim() || "DEFAULT",
      status: "Shipment Created!",
      date: new Date(),
      sector: (excelRow.Sector?.toString().trim() || "").toUpperCase(),
      origin: excelRow.Origin?.toString().trim() || "",
      destination: excelRow.Destination?.toString().trim() || "",
      reference: excelRow.ReferenceNo?.toString().trim() || "",
      forwardingNo: "",
      forwarder: "",
      goodstype: excelRow.GoodsType?.toString().trim() || "",
      payment: "Credit",

      boxes: boxes,

      chargeableWt: chargeableWt,
      volDisc: volDisc,
      totalActualWt: totalActualWt,
      totalVolWt: totalVolWt,
      pcs: totalPcs,

      totalInvoiceValue: totalInvoiceValue,
      currency: excelRow.InvoiceCurrency?.toString().trim() || "INR",
      currencys: excelRow.InvoiceCurrency?.toString().trim() || "INR",
      content: contentArray,

      shipmentAndPackageDetails: shipmentAndPackageDetails, // ✅ Now properly mapped!

      operationRemark: excelRow.OperationRemark?.toString().trim() || "",
      automation: false,
      handling: false,
      csb: isChecked,
      commercialShipment: false,
      isHold: false,
      holdReason: "",
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
      service: excelRow.ServiceName?.toString().trim() || "",
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
      receiverCountry: "",
      receiverPincode: excelRow.ConsigneeZipcode?.toString().trim() || "",

      shipperFullName: excelRow.ConsignorName?.toString().trim() || "",
      shipperPhoneNumber: excelRow.ConsignorTelephone?.toString().trim() || "",
      shipperEmail: "",
      shipperAddressLine1:
        excelRow.ConsignorAddressLine1?.toString().trim() || "",
      shipperAddressLine2:
        excelRow.ConsignorAddressLine2?.toString().trim() || "",
      shipperCity: excelRow.ConsignorCity?.toString().trim() || "",
      shipperState: excelRow.ConsignorState?.toString().trim() || "",
      shipperCountry: "",
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
      shipmentType: "Non-Document",

      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    };

    // ==================== TABLE DISPLAY FIELDS ====================
    shipment.contentDisplay = contentArray.length > 0 ? contentArray[0] : "";
    shipment.boxesDisplay = `${boxes.length} box${
      boxes.length !== 1 ? "es" : ""
    }`;
    shipment.packageDisplay = `${
      Object.keys(shipmentAndPackageDetails).length
    } box${
      Object.keys(shipmentAndPackageDetails).length !== 1 ? "es" : ""
    } with items`;

    return shipment;
  };

  // Helper function to calculate volume weight
  const calculateVolumeWeight = (length, breadth, height) => {
    const volume = (length || 0) * (breadth || 0) * (height || 0);
    return Math.round((volume / 5000) * 100) / 100;
  };

  // Handle file browse
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const selectedFileName = file.name;
      setFileName(selectedFileName);
      setValue("weight", selectedFileName, { shouldValidate: true });

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          setExcelData(jsonData);
          console.log("Excel data loaded:", jsonData.length, "rows");
          console.log("Sample Excel row:", jsonData[0]);
        } catch (error) {
          console.error("Error reading Excel file:", error);
          showNotification(
            "error",
            "Error reading Excel file. Please make sure it's a valid Excel file."
          );
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Handle Show button click
  const handleShow = () => {
    if (!flightDate) {
      showNotification("error", "Please enter Flight Date");
      return;
    }

    if (excelData.length === 0) {
      showNotification("error", "Please select an Excel file first");
      return;
    }

    // Transform Excel data to Shipment JSON structure
    const transformedData = excelData.map((row, index) => {
      return transformExcelToShipment(row, index);
    });

    console.log("Transformed data sample:", transformedData[0]);
    console.log("Total rows transformed:", transformedData.length);

    setRowData(transformedData);
    showNotification(
      "success",
      `Data prepared successfully! ${transformedData.length} shipments ready to upload.`
    );
  };

  // Handle Upload button click
  const handleUpload = async () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to upload. Please click Show first.");
      return;
    }

    try {
      setLoading(true);

      // Prepare data for backend
      const uploadData = {
        shipments: rowData,
        flightDate: flightDate,
        csbChecked: isChecked,
      };

      console.log("Uploading shipments:", {
        totalShipments: rowData.length,
        sampleData: rowData[0],
      });

      const response = await axios.post(
        `${server}/bulk-upload/manual-awb`,
        uploadData
      );

      if (response.data.success) {
        const { newRecords, duplicates } = response.data;

        // Store upload data for retry
        setLastUploadData(uploadData);

        // Show appropriate notification
        if (duplicates > 0 && newRecords > 0) {
          showNotification(
            "success",
            `Upload completed! ${newRecords} new records added, ${duplicates} duplicates already existed.`
          );
        } else if (duplicates > 0 && newRecords === 0) {
          showNotification(
            "error",
            `All ${duplicates} records already exist in the database. No new records added.`
          );
        } else {
          showNotification(
            "success",
            `Upload successful! ${newRecords} new records added.`
          );
        }

        // Reset form only if there were new records
        if (newRecords > 0) {
          setRowData([]);
          setExcelData([]);
          setFileName("");
          setValue("weight", "");
          setValue("flightDate", "");
          setChecked(false);

          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      showNotification(
        "error",
        error.response?.data?.message ||
          "Error uploading data. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle retry upload
  const handleRetry = async () => {
    if (!lastUploadData) return;

    try {
      setLoading(true);
      setNotification({ ...notification, visible: false });

      const response = await axios.post(
        `${server}/bulk-upload/manual-awb`,
        lastUploadData
      );

      if (response.data.success) {
        const { newRecords, duplicates } = response.data;

        if (duplicates > 0 && newRecords > 0) {
          showNotification(
            "success",
            `Retry successful! ${newRecords} new records added, ${duplicates} duplicates skipped.`
          );
        } else if (duplicates > 0 && newRecords === 0) {
          showNotification(
            "error",
            `All ${duplicates} records still exist in the database.`
          );
        } else {
          showNotification(
            "success",
            `Retry successful! ${newRecords} new records added.`
          );
        }
      }
    } catch (error) {
      console.error("Retry error:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Retry failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Close button
  const handleClose = () => {
    setRowData([]);
    setExcelData([]);
    setFileName("");
    setValue("weight", "");
    setValue("flightDate", "");
    setChecked(false);
    setLastUploadData(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit(handleShow)}>
        <div className="flex gap-3">
          <div className="w-full relative">
            {/* <InputBox
              placeholder="Flight Date"
              register={register}
              setValue={setValue}
              value="flightDate"
            /> */}
            <DateInputBox
              placeholder="Flight Date"
              register={register}
              setValue={setValue}
              value="flightDate"
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
              label={"Show"}
              // onClick={handleShow}
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
              disabled={loading}
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

        <div className="flex justify-between">
          {/* <div>
            <OutlinedButtonRed
              type="button"
              label={"Close"}
              onClick={handleClose}
            />
          </div> */}
        </div>
      </form>

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
