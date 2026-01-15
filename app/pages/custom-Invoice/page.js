"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { InvoiceContent } from "@/app/components/custom-invoice/CustomInvoicePDF";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import ReactDOM from "react-dom/client";
import {
  TableWithCheckboxEditDelete,
  TableWithSorting,
} from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import ChildContent from "./ChildContent";
import MagicCustom from "./MagicCustom";
import CsbV from "./CsbV";

const CustomInvoice = () => {
  const previewRef = useRef();
  const downloadRef = useRef();
  const { register, setValue, watch } = useForm();
  const [demoRadio, setDemoRadio] = useState("AWB Wise");
  const [commInv, setCommInv] = useState(true);
  const [rowData, setRowData] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [resetFactor, setResetFactor] = useState(false);
  const handleRadioChange = (value) => {
    setDemoRadio(value);
  };
  const [isDataEditable, setIsDataEditable] = useState(true);
  const { server } = useContext(GlobalContext);
  const [notification, setNotification] = useState({
    visible: false,
    type: "success",
    message: "",
    onRetry: null,
  });
  const showNotification = (type, message, onRetry = null) => {
    setNotification({ visible: true, type, message, onRetry });
  };
  const [runWiseRowData, setRunWiseRowData] = useState([]);
  const [runWiseInvoices, setRunWiseInvoices] = useState([]);

  const quantity = watch("quantity");
  const rate = watch("rate");

  const invoiceData = {
    // --- Shipper ---
    shipperFullName: watch("shipperFullName"),
    shipperAddress: `${watch("shipperAddressLine1") || ""} ${
      watch("shipperAddressLine2") || ""
    }`.trim(),
    shipperCity: watch("shipperCity"),
    shipperAadhar: watch("shipperAadhar"),
    shipperKycType: watch("shipperKycType"),

    // --- Consignee ---
    consigneeName: watch("consigneeName"),
    consigneeAddress: `${watch("consigneeAddress1") || ""} ${
      watch("consigneeAddress2") || ""
    }`.trim(),
    consigneeCity: watch("consigneeCity"),
    consigneeState: watch("consigneeState"),
    consigneePin: watch("consigneePin"),
    consigneePhone: watch("consigneePhone"),

    // --- Shipment ---
    preCarriageBy: watch("preCarriageBy"),
    flightNo: watch("flightNo"),
    placeOfReceipt: watch("placeOfReceipt"),
    portOfLoading: watch("portOfLoading"),
    awbNo: watch("awbNo"),
    date: watch("date"),
    buyerOrderNo: watch("buyerOrderNo"),
    otherReference: watch("otherReference"),
    buyerIfOther: watch("buyerIfOther"),
    countryOfOrigin: watch("countryOfOrigin"),
    destination: watch("destination") || "",
    terms: watch("terms"),
    weight: demoRadio === "Magic Custom" ? watch("senderRef") : watch("weight"),
    boxes: watch("boxes"),

    // --- Items ---
    items: rowData.map((row) => ({
      boxNo: row.boxNo, // <- include it
      description: row.itemName,
      hsn: row.hsn,
      quantity: row.quantity,
      rate: row.rate,
      amount: row.amount,
    })),

    // --- Totals ---
    currency: watch("currency"),
    total: rowData.reduce((sum, row) => sum + Number(row.amount || 0), 0),

    // --- Declaration ---
    declaration: watch("declaration"),
  };

  const modifyShipmentData = () => {
    if (isDataEditable) {
      // When user clicks "Update" — just re-trigger a re-render
      // This ensures react-hook-form updates all watches
      setValue("shipperFullName", watch("shipperFullName"));
      setValue("shipperAddressLine1", watch("shipperAddressLine1"));
      setValue("shipperAddressLine2", watch("shipperAddressLine2"));
      setValue("telephone", watch("telephone"));
      setValue("city", watch("city"));
      setValue("state", watch("state"));
      setValue("zipcode", watch("zipcode"));
      setValue("consignee", watch("consignee"));
      setValue("destination", watch("destination"));
    }

    setIsDataEditable(!isDataEditable);

    if (isDataEditable) {
      showNotification("success", "You can now modify the data");
    } else {
      showNotification("success", "Data modified Succusesfully");
    }
  };

  useEffect(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    setValue("amount", (q * r).toFixed(2));
  }, [quantity, rate, setValue]);

  const columns = [
    { key: "itemName", label: "Description" },
    { key: "quantity", label: "QTY" },
    { key: "hsn", label: "HSN" },
    { key: "rate", label: "Rate" },
    { key: "amount", label: "Amount" },
  ];

  const handleDownloadPdf = async (ref) => {
    if (!ref.current) return;

    const element = ref.current;

    const canvas = await html2canvas(element, {
      scale: 2, // quality
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png"); // always PNG
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("invoice.pdf");

    showNotification("success", "PDF Downloaded successfully");
  };

  const invoiceTypes = [
    "AWB Wise",
    "Run No. Wise",
    "Child Content",
    "Magic Custom",
    "CSB V",
  ];

  const handleRefresh = () => {
    setRowData([]);
    setEditIndex(null);
    setCommInv(true);

    // toggle resetFactor to clear all InputBoxes
    setResetFactor((prev) => !prev);

    showNotification("success", "Refreshed successfully");
  };

  const handleSelectRowForEdit = (index) => {
    const row = rowData[index];
    setEditIndex(index);

    setValue("descriptionOfGoods", row.itemName);
    setValue("quantity", row.quantity);
    setValue("rate", row.rate);
    setValue("amount", row.amount);
  };

  const handleDeleteRow = (index) => {
    setRowData((prev) => prev.filter((_, i) => i !== index));

    // if you delete the row that’s being edited, reset form state
    if (editIndex === index) {
      setEditIndex(null);
      setValue("descriptionOfGoods", "");
      setValue("quantity", "");
      setValue("rate", "");
      setValue("amount", "");
    }
    showNotification("success", "Row deleted successfully");
  };

  const handleModifyRow = () => {
    if (editIndex === null) {
      showNotification("error", "Please select a row to modify.");
      return;
    }

    const updatedRow = {
      itemName: watch("descriptionOfGoods"),
      quantity: Number(watch("quantity")),
      rate: Number(watch("rate")),
      amount: Number(watch("amount")),
      hsn: watch("hsn"),
    };

    setRowData((prev) =>
      prev.map((row, i) => (i === editIndex ? updatedRow : row))
    );
    showNotification("success", "Row modified successfully");

    // reset
    setEditIndex(null);
    setValue("descriptionOfGoods", "");
    setValue("quantity", "");
    setValue("rate", "");
    setValue("amount", "");
    setValue("hsn", "");
  };

  const handleSearchAwb = async () => {
    const awbNo = watch("awbNo"); // directly watch the input
    if (!awbNo) {
      showNotification("error", "Please enter AWB Number");
      return;
    }

    try {
      const res = await fetch(
        `${server}/custom-invoice?awbNo=${encodeURIComponent(awbNo)}`
      );
      if (!res.ok) throw new Error("Shipment not found");

      const data = await res.json();

      // --- Shipper ---
      setValue("shipperFullName", data.shipperFullName || "");
      setValue("shipperAddressLine1", data.shipperAddressLine1 || "");
      setValue("shipperAddressLine2", data.shipperAddressLine2 || "");
      setValue("telephone", data.shipperPhoneNumber || "");
      setValue("city", data.shipperCity || "");
      setValue("state", data.shipperState || "");
      setValue("zipcode", data.shipperPincode || "");
      // setValue("iecCode", data.shipperKycNumber || "");

      // --- Extra for InvoiceContent ---
      setValue(
        "shipperAddress",
        `${data.shipperAddressLine1 || ""} ${
          data.shipperAddressLine2 || ""
        }`.trim()
      );
      setValue("shipperCity", data.shipperCity || "");
      setValue("shipperAadhar", data.shipperKycNumber || "");

      // --- Consignee (old ones kept) ---
      setValue("consignee", data.receiverFullName || "");
      setValue("consigneeAddress1", data.receiverAddressLine1 || "");
      setValue("consigneeAddress2", data.receiverAddressLine2 || "");
      setValue("destination", data.destination || "");
      setValue("boxes", data.boxes || "");
      setValue("consigneeCity", data.receiverCity || "");
      setValue("consigneeState", data.receiverState || "");
      setValue("consigneeZipcode", data.receiverPincode || "");
      setValue("consigneeTelephone", data.receiverPhoneNumber || "");
      setValue("shipperKycType", data.shipperKycType || "");
      // --- Extra for InvoiceContent ---
      setValue("consigneeName", data.receiverFullName || "");
      setValue(
        "consigneeAddress",
        `${data.receiverAddressLine1 || ""} ${
          data.receiverAddressLine2 || ""
        }`.trim()
      );
      setValue("consigneePin", data.receiverPincode || "");
      setValue("consigneePhone", data.receiverPhoneNumber || "");

      // --- Shipment (old ones kept) ---
      setValue(
        "date",
        data.bookingDate
          ? new Date(data.bookingDate).toISOString().slice(0, 10)
          : ""
      );
      setValue("currency", data.currency || "");
      // setValue("termsOfDelivery", data.goodstype || "");
      setValue("payment", data.payment || "");
      setValue("totalInvoiceValue", data.totalInvoiceValue || 0);

      // --- Extra for InvoiceContent ---
      setValue("awbNo", data.awbNo || "");
      setValue("flightNo", data.flightNo || "");
      setValue("preCarriageBy", data.preCarriageBy || "");
      setValue("placeOfReceipt", data.placeOfReceipt || "");
      setValue("portOfLoading", data.portOfLoading || "");
      setValue("buyerOrderNo", data.buyerOrderNo || "");
      setValue("otherReference", data.otherReference || "");
      setValue("buyerIfOther", data.buyerIfOther || "");
      setValue("countryOfOrigin", data.countryOfOrigin || "");
      setValue("terms", data.termsOfDelivery || "");
      setValue("weight", data.weight || "");

      // --- Boxes/Table ---
      let tableData = [];

      if (data.shipmentAndPackageDetails) {
        Object.keys(data.shipmentAndPackageDetails).forEach((key) => {
          const boxNo = Number(key); // <- box number from the object key
          data.shipmentAndPackageDetails[key].forEach((item) => {
            const name =
              item.itemName || item.context || item.description || "";
            const hsn = item.hsn || item.hsnNo || "";
            const quantity = Number(item.quantity || item.qty || 0);
            const rate = Number(item.rate || 0);
            const amount = Number(item.amount || 0);

            if (name && quantity > 0 && rate > 0) {
              tableData.push({
                boxNo, // <- keep box number on each row
                itemName: name,
                hsn,
                quantity,
                rate,
                amount,
              });
            }
          });
        });
      }

      // Optional: Include boxes if present and valid
      if (Array.isArray(data.boxes) && data.boxes.length > 0) {
        data.boxes.forEach((box) => {
          if (box.itemName && box.quantity && box.rate && box.amount) {
            tableData.push({
              itemName: box.itemName,
              quantity: Number(box.quantity),
              rate: Number(box.rate),
              amount: Number(box.amount),
            });
          }
        });
      }

      setRowData(tableData); // only valid rows, no duplicates
    } catch (error) {
      console.error("Error fetching shipment:", error);
      showNotification("error", "Shipment not found or server error.");
    }
  };

  const handleAddRow = () => {
    const newRow = {
      itemName: watch("descriptionOfGoods") || "",
      quantity: Number(watch("quantity")) || 0,
      rate: Number(watch("rate")) || 0,
      amount: Number(watch("amount")) || 0,
    };

    // Prevent adding empty rows
    if (!newRow.itemName || newRow.quantity <= 0 || newRow.rate <= 0) {
      showNotification("error", "Please fill all product details correctly.");
      return;
    }

    setRowData((prev) => [...prev, newRow]);

    showNotification("success", "Row added successfully");

    // clear input fields
    setValue("descriptionOfGoods", "");
    setValue("quantity", "");
    setValue("rate", "");
    setValue("amount", "");
  };

  const runWiseColumns = [
    { key: "awbNo", label: "AWB No." },
    { key: "bagNo", label: "Bag No." },
    { key: "bagWeight", label: "Bag Weight" },
  ];

  const handleSearchRunNo = async () => {
    const runNumber = watch("runNumber");
    if (!runNumber) {
      showNotification("error", "Please enter Run Number");
      return;
    }

    try {
      const res = await fetch(
        `${server}/custom-invoice/runwise?runNo=${encodeURIComponent(
          runNumber
        )}`
      );
      if (!res.ok) throw new Error("Not found");

      const data = await res.json();

      setRunWiseRowData(data.invoices || []);
      setRunWiseInvoices(data.invoices || []); // 👈 store full for invoices
      showNotification(
        "success",
        `${(data.invoices || []).length} invoices loaded`
      );
    } catch (err) {
      console.error(err);
      setRunWiseRowData([]);
      setRunWiseInvoices([]);
      showNotification("error", "No data for this run");
    }
  };

  const handleDownloadAllInvoices = async (invoices) => {
    if (!invoices?.length) {
      showNotification("error", "No invoices to download");
      return;
    }

    const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const formatDate = (d) => {
      if (!d) return "";
      const dt = new Date(d);
      if (isNaN(dt)) return "";
      return `${String(dt.getDate()).padStart(2, "0")}/${String(
        dt.getMonth() + 1
      ).padStart(2, "0")}/${dt.getFullYear()}`;
    };
    const sumItems = (arr) =>
      arr.reduce(
        (s, x) => s + (toNum(x.amount) || toNum(x.quantity) * toNum(x.rate)),
        0
      );

    // Initialize one PDF
    const pdf = new jsPDF("p", "mm", "a4");
    let firstPage = true;

    for (let i = 0; i < invoices.length; i++) {
      const inv = invoices[i];

      const items = (() => {
        const details = inv.shipmentAndPackageDetails;
        let out = [];

        if (details && typeof details === "object" && !Array.isArray(details)) {
          Object.keys(details).forEach((boxKey) => {
            (details[boxKey] || []).forEach((item) => {
              out.push({
                boxNo: boxKey,
                description: item.itemName || item.context || "",
                hsn: item.hsnNo || item.hsn || "",
                quantity: toNum(item.qty ?? item.quantity),
                rate: toNum(item.rate),
                amount: toNum(item.amount),
              });
            });
          });
        } else if (Array.isArray(details)) {
          out = details.map((item, idx) => ({
            boxNo: idx + 1,
            description: item.itemName || item.context || "",
            hsn: item.hsnNo || item.hsn || "",
            quantity: toNum(item.qty ?? item.quantity),
            rate: toNum(item.rate),
            amount: toNum(item.amount),
          }));
        } else if (Array.isArray(inv.boxes)) {
          out = inv.boxes.map((box, idx) => ({
            boxNo: idx + 1,
            description: box.itemName || "",
            hsn: box.hsn || "",
            quantity: toNum(box.quantity),
            rate: toNum(box.rate),
            amount: toNum(box.amount),
          }));
        }

        return out;
      })();

      const invoiceData = {
        shipperFullName: inv.shipperFullName || "",
        shipperAddress: inv.shipperAddressLine1
          ? `${inv.shipperAddressLine1} ${inv.shipperAddressLine2 || ""}`
          : "",
        shipperCity: inv.shipperCity || "",
        shipperAadhar: inv.shipperKycNumber || "",
        consigneeName: inv.receiverFullName || "",
        shipperKycType: inv.shipperKycType || "",
        consigneeAddress: `${inv.receiverAddressLine1 || ""} ${
          inv.receiverAddressLine2 || ""
        }`.trim(),
        consigneeCity: inv.receiverCity || "",
        consigneeState: inv.receiverState || "",
        consigneePin: inv.receiverPincode || "",
        consigneePhone: inv.receiverPhoneNumber || "",
        awbNo: inv.awbNo,
        date: formatDate(inv.bookingDate),
        destination: inv.destination || "",
        items,
        total: Number(sumItems(items).toFixed(2)),
        currency: inv.currency || "INR",
        declaration:
          "The above mentioned items are not for commercial use and value declared only for custom purpose.",
      };

      console.log("📦 Invoice Ready:", {
        awbNo: invoiceData.awbNo,
        itemsCount: invoiceData.items.length,
        total: invoiceData.total,
        date: invoiceData.date,
      });

      // Render invoice in hidden container
      const tempDiv = document.createElement("div");
      tempDiv.style.width = "794px"; // ~A4 width in px
      tempDiv.style.margin = "0";
      tempDiv.style.padding = "0";
      tempDiv.style.background = "#fff";
      document.body.appendChild(tempDiv);

      const root = ReactDOM.createRoot(tempDiv);
      root.render(<InvoiceContent invoiceData={invoiceData} />);

      await new Promise((r) => setTimeout(r, 250));

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add to existing PDF
      if (!firstPage) pdf.addPage();
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        "FAST"
      );
      firstPage = false;

      root.unmount();
      tempDiv.remove();
    }

    pdf.save("All_Invoices.pdf");
    showNotification("success", "All invoices combined into one PDF");
  };

  return (
    <form className="flex flex-col gap-6">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
        onRetry={notification.onRetry}
      />
      <Heading
        title="Custom Invoice"
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
        codeListBtn="hidden"
      />

      {/* Radio Button Section */}
      <div className="flex w-full gap-3">
        {invoiceTypes.map((type) => (
          <RadioButtonLarge
            key={type}
            id={type}
            label={type}
            name="invoiceType"
            register={register}
            setValue={setValue}
            selectedValue={demoRadio}
            setSelectedValue={handleRadioChange}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-4">
        {/* Dynamic Input Fields based on selected radio */}
        <div className="flex gap-3">
          {/* AWB Wise - Only AirwayBill Number */}
          {demoRadio === "AWB Wise" && (
            <div className="flex-1 flex gap-3">
              <InputBox
                placeholder="AirwayBill Number"
                register={register}
                setValue={setValue}
                value="awbNo"
                initialValue={watch("awbNo")}
                onChange={(e) => setAwbNo(e.target.value)}
                resetFactor={resetFactor}
              />
              <div className="w-32">
                <OutlinedButtonRed
                  label="Show"
                  onClick={handleSearchAwb}
                  type="button"
                />
              </div>
            </div>
          )}

          {/* Run No. Wise - Only Run Number */}
          {demoRadio === "Run No. Wise" && (
            <div className="w-full flex flex-col gap-4">
              <div className="w-full flex gap-3">
                <InputBox
                  placeholder="Run Number"
                  register={register}
                  setValue={setValue}
                  value="runNumber"
                  resetFactor={resetFactor}
                />
                <div className="w-32">
                  <OutlinedButtonRed
                    label="Show"
                    onClick={handleSearchRunNo}
                    type="button"
                  />
                </div>
              </div>

              <div>
                <TableWithSorting
                  register={register}
                  setValue={setValue}
                  columns={runWiseColumns}
                  rowData={runWiseRowData}
                />
              </div>
              <div className="flex justify-end gap-3">
                <div>
                  {" "}
                  <div>
                    <OutlinedButtonRed label="Print" />
                  </div>
                </div>
                <div>
                  <SimpleButton
                    name="Download All Invoices"
                    onClick={() => handleDownloadAllInvoices(runWiseInvoices)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Child Content - Only AirwayBill Number */}
          {demoRadio === "Child Content" && <ChildContent />}

          {/* Magic Custom - AirwayBill Number + Sender Ref */}
          {demoRadio === "Magic Custom" && <MagicCustom />}

          {/* CSB V - AirwayBill Number + Run No */}
          {demoRadio === "CSB V" && <CsbV />}
        </div>

        {/* Show full form only for AWB Wise */}
        {demoRadio === "AWB Wise" && (
          <>
            {/* Shipper and Consignee Section */}
            <div className="flex gap-6">
              {/* Shipper Details */}
              <div className="flex flex-col gap-4 flex-1">
                <InputBox
                  placeholder="Shipper Name"
                  register={register}
                  setValue={setValue}
                  value="shipperFullName"
                  initialValue={watch("shipperFullName")}
                  resetFactor={resetFactor}
                  disabled={isDataEditable}
                />
                <InputBox
                  placeholder="Address Line 1"
                  register={register}
                  setValue={setValue}
                  value="shipperAddressLine1"
                  initialValue={watch("shipperAddressLine1")}
                  resetFactor={resetFactor}
                  disabled={isDataEditable}
                />
                <InputBox
                  placeholder="Address Line 2"
                  register={register}
                  setValue={setValue}
                  value="shipperAddressLine2"
                  initialValue={watch("shipperAddressLine2")}
                  resetFactor={resetFactor}
                  disabled={isDataEditable}
                />
                <div className="flex gap-3">
                  <DateInputBox
                    placeholder="Date"
                    register={register}
                    setValue={setValue}
                    value="date"
                    resetFactor={resetFactor}
                    disabled={isDataEditable}
                    initialValue={watch("date")}
                  />
                  <LabeledDropdown
                    options={["USD", "INR", "EUR"]}
                    register={register}
                    setValue={setValue}
                    title="Currency"
                    value="currency"
                    defaultValue={watch("currency")}
                    resetFactor={resetFactor}
                    disabled={isDataEditable}
                  />
                  <InputBox
                    placeholder="IEC Code"
                    register={register}
                    setValue={setValue}
                    value="iecCode"
                    initialValue={watch("iecCode")}
                    resetFactor={resetFactor}
                    disabled={isDataEditable}
                  />
                </div>
                <InputBox
                  placeholder="Terms of DLV/PYMNT"
                  register={register}
                  setValue={setValue}
                  value="termsOfDelivery"
                  initialValue={watch("termsOfDelivery")}
                  resetFactor={resetFactor}
                  disabled={isDataEditable}
                />
              </div>

              {/* Consignee Details */}
              <div className="flex flex-col gap-4 flex-1">
                <InputBox
                  placeholder="Consignee"
                  register={register}
                  setValue={setValue}
                  value="consignee"
                  initialValue={watch("consignee")}
                  resetFactor={resetFactor}
                  disabled={isDataEditable}
                />
                <InputBox
                  placeholder="Address Line 1"
                  register={register}
                  setValue={setValue}
                  value="consigneeAddress1"
                  initialValue={watch("consigneeAddress1")}
                  resetFactor={resetFactor}
                  disabled={isDataEditable}
                />
                <InputBox
                  placeholder="Address Line 2"
                  register={register}
                  setValue={setValue}
                  value="consigneeAddress2"
                  initialValue={watch("consigneeAddress2")}
                  resetFactor={resetFactor}
                  disabled={isDataEditable}
                />
                <div className="flex gap-3">
                  <InputBox
                    placeholder="Zipcode"
                    register={register}
                    setValue={setValue}
                    value="zipcode"
                    initialValue={watch("zipcode")}
                    resetFactor={resetFactor}
                    disabled={isDataEditable}
                  />
                  <InputBox
                    placeholder="City"
                    register={register}
                    setValue={setValue}
                    value="city"
                    initialValue={watch("city")}
                    resetFactor={resetFactor}
                    disabled={isDataEditable}
                  />
                  <InputBox
                    placeholder="State"
                    register={register}
                    setValue={setValue}
                    value="state"
                    initialValue={watch("state")}
                    resetFactor={resetFactor}
                    disabled={isDataEditable}
                  />
                  <InputBox
                    placeholder="Destination"
                    register={register}
                    setValue={setValue}
                    value="destination"
                    initialValue={watch("destination")}
                    resetFactor={resetFactor}
                    disabled={isDataEditable}
                  />
                </div>
                <div className="flex gap-3">
                  <InputBox
                    placeholder="Telephone"
                    register={register}
                    setValue={setValue}
                    value="telephone"
                    initialValue={watch("telephone")}
                    resetFactor={resetFactor}
                    disabled={isDataEditable}
                  />
                  <div className="w-[32%]">
                    <SimpleButton
                      name={isDataEditable ? "Modify" : "Update"}
                      onClick={modifyShipmentData}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="flex gap-3 ">
              <div className="flex gap-3 w-full">
                <InputBox
                  placeholder="Description of Goods"
                  register={register}
                  setValue={setValue}
                  value="descriptionOfGoods"
                  resetFactor={resetFactor}
                  initialValue={watch("descriptionOfGoods")}
                />
                <InputBox
                  placeholder="Quantity"
                  register={register}
                  setValue={setValue}
                  value="quantity"
                  resetFactor={resetFactor}
                  initialValue={watch("quantity")}
                />
                <LabeledDropdown
                  options={["HSN", "HSN2"]}
                  register={register}
                  setValue={setValue}
                  title="HSN"
                  value="hsn"
                  defaultValue={watch("hsn")}
                  resetFactor={resetFactor}
                />
                <InputBox
                  placeholder="Rate"
                  register={register}
                  setValue={setValue}
                  value="rate"
                  resetFactor={resetFactor}
                  initialValue={watch("rate")}
                />
                <InputBox
                  placeholder="Amount"
                  register={register}
                  setValue={setValue}
                  value="amount"
                  resetFactor={resetFactor}
                  initialValue={watch("amount")}
                  disabled
                />
              </div>
              <div className="flex gap-3 w-[25%]">
                <div className="w-[61%]">
                  <OutlinedButtonRed
                    label="Add"
                    type="button"
                    onClick={handleAddRow}
                    disabled={editIndex !== null}
                    className={`${editIndex ? "cursor-not-allowed" : ""}`}
                  />
                </div>
                <div className="w-[61%]">
                  <OutlinedButtonRed label="Update" onClick={handleModifyRow} />
                </div>
              </div>
            </div>
            <div>
              <TableWithCheckboxEditDelete
                register={register}
                setValue={setValue}
                name="bagging"
                columns={columns}
                rowData={rowData}
                totalColumn="amount" // sum up the "amount" column
                totalLabel=" Invoice Total Amount" // label changes dynamically
                handleEdit={handleSelectRowForEdit} // 👈 enable edit
                handleDelete={handleDeleteRow}
              />
              <div className="flex justify-end">
                <div className="flex gap-3 mt-3">
                  <div>
                    <OutlinedButtonRed label="Print" />
                  </div>
                  <div>
                    <SimpleButton
                      name="Download"
                      onClick={() => handleDownloadPdf(downloadRef)}
                      //button to download invoice
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Preview Section */}
            <div className="border border-gray-400 rounded p-4">
              <h2 className="text-lg font-semibold mb-4">Invoice Preview</h2>
              <InvoiceContent ref={previewRef} invoiceData={invoiceData} />
            </div>
          </>
        )}
        {/* Action Buttons - Always visible */}
      </div>
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <InvoiceContent ref={downloadRef} invoiceData={invoiceData} />
      </div>
    </form>
  );
};

export default CustomInvoice;
