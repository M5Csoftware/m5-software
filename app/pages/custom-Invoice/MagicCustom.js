"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { InvoiceContent } from "@/app/components/custom-invoice/CustomInvoicePDF";
import { TableWithCheckboxEditDelete } from "@/app/components/Table";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import React, { useRef, useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";

const MagicCustom = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();
  const downloadRef = useRef();
  const [rowData, setRowData] = useState([]);
  const [notification, setNotification] = useState("");
  const [resetFactor, setResetFactor] = useState(false);

  // --- Fetch shipment data same as AWB Wise ---
  const handleSearchAwb = async () => {
    const awbNo = watch("awbNo");
    if (!awbNo) return alert("Enter AirwayBill Number");

    try {
      const res = await fetch(`${server}/custom-invoice?awbNo=${awbNo.toUpperCase()}`);
      if (!res.ok) throw new Error("Shipment not found");
      const data = await res.json();

      // fill shipper / consignee
      setValue("shipperFullName", data.shipperFullName || "");
      setValue("shipperAddressLine1", data.shipperAddressLine1 || "");
      setValue("shipperAddressLine2", data.shipperAddressLine2 || "");
      setValue("shipperCity", data.shipperCity || "");
      setValue("shipperAadhar", data.shipperKycNumber || "");
      setValue("shipperKycType", data.shipperKycType || "");
      setValue("consigneeName", data.receiverFullName || "");
      setValue("consigneeAddress1", data.receiverAddressLine1 || "");
      setValue("consigneeAddress2", data.receiverAddressLine2 || "");
      setValue("consigneeCity", data.receiverCity || "");
      setValue("consigneeState", data.receiverState || "");
      setValue("consigneePin", data.receiverPincode || "");
      setValue("consigneePhone", data.receiverPhoneNumber || "");
      setValue("awbNo", data.awbNo || "");
      setValue(
        "date",
        data.bookingDate
          ? new Date(data.bookingDate).toISOString().slice(0, 10)
          : ""
      );
      setValue("destination", data.destination || "");
      setValue("currency", data.currency || "");
      setValue("terms", data.termsOfDelivery || "");
      setValue("countryOfOrigin", data.countryOfOrigin || "");
      setValue("flightNo", data.flightNo || "");
      setValue("preCarriageBy", data.preCarriageBy || "");
      setValue("placeOfReceipt", data.placeOfReceipt || "");
      setValue("portOfLoading", data.portOfLoading || "");
      setValue("buyerOrderNo", data.buyerOrderNo || "");
      setValue("otherReference", data.otherReference || "");
      setValue("buyerIfOther", data.buyerIfOther || "");

      // --- Table Data (same logic as AWB Wise) ---
      let tableData = [];

      if (data.shipmentAndPackageDetails) {
        Object.keys(data.shipmentAndPackageDetails).forEach((key) => {
          const boxNo = Number(key);
          data.shipmentAndPackageDetails[key].forEach((item) => {
            const name =
              item.itemName || item.context || item.description || "";
            const hsn = item.hsn || item.hsnNo || "";
            const quantity = Number(item.quantity || item.qty || 0);
            const rate = Number(item.rate || 0);
            const amount = Number(item.amount || 0);

            if (name && quantity > 0 && rate > 0) {
              tableData.push({
                boxNo,
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

      setRowData(tableData);
      setNotification("AWB Data Loaded");
    } catch (err) {
      console.error(err);
      alert("Shipment not found or server error");
    }
  };

  // --- Download PDF ---
  const handleDownloadPdf = async () => {
    const element = downloadRef.current;
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("MagicCustomInvoice.pdf");
    setNotification("Invoice Downloaded");
  };

  // --- Build invoice data ---
  const invoiceData = {
    shipperFullName: watch("shipperFullName"),
    shipperAddress: `${watch("shipperAddressLine1") || ""} ${
      watch("shipperAddressLine2") || ""
    }`.trim(),
    shipperCity: watch("shipperCity"),
    shipperAadhar: watch("shipperAadhar"),
    shipperKycType: watch("shipperKycType"),
    consigneeName: watch("consigneeName"),
    consigneeAddress: `${watch("consigneeAddress1") || ""} ${
      watch("consigneeAddress2") || ""
    }`.trim(),
    consigneeCity: watch("consigneeCity"),
    consigneeState: watch("consigneeState"),
    consigneePin: watch("consigneePin"),
    consigneePhone: watch("consigneePhone"),
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
    destination: watch("destination"),
    terms: watch("terms"),
    currency: watch("currency"),
    weight: watch("senderRef"),
    items: rowData.map((r) => ({
      boxNo: r.boxNo,
      description: r.itemName, // 👈 fixes blank Description column
      hsn: r.hsn,
      quantity: r.quantity,
      rate: r.rate,
      amount: r.amount,
    })),
    total: rowData.reduce((sum, r) => sum + Number(r.amount || 0), 0),
    declaration:
      "The above mentioned items are not for commercial use and value declared only for custom purpose.",
  };

  const columns = [
    { key: "itemName", label: "Description" },
    { key: "quantity", label: "QTY" },
    { key: "hsn", label: "HSN" },
    { key: "rate", label: "Rate" },
    { key: "amount", label: "Amount" },
  ];

  return (
    <form className="flex flex-col gap-5 w-full">
      <div className="flex gap-3">
        <div className="w-1/3">
          <InputBox
            placeholder="AirwayBill Number"
            register={register}
            setValue={setValue}
            value="awbNo"
            resetFactor={resetFactor}
          />
        </div>
        <div className="w-1/3">
          <InputBox
            placeholder="Sender Ref."
            register={register}
            setValue={setValue}
            value="senderRef"
            resetFactor={resetFactor}
          />
        </div>

        <div className="w-1/5">
          <OutlinedButtonRed
            label="Load Invoice"
            onClick={handleSearchAwb}
            type="button"
          />
        </div>
        <div>
          <OutlinedButtonRed label="Print" />
        </div>
        <div>
          <SimpleButton name="Download" onClick={handleDownloadPdf} />
        </div>
      </div>

      <div className="mt-4 hidden">
        <TableWithCheckboxEditDelete
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          totalColumn="amount"
          totalLabel="Invoice Total Amount"
        />
      </div>

      {notification && (
        <div className="text-green-700 text-sm">{notification}</div>
      )}

      {/* hidden invoice for PDF */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
        <InvoiceContent ref={downloadRef} invoiceData={invoiceData} />
      </div>
    </form>
  );
};

export default MagicCustom;
