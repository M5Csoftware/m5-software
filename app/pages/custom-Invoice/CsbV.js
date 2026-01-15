"use client";
import React, { useContext, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { InvoiceCsbV } from "@/app/components/custom-invoice/CsbVPDF";
import { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import ReactDOM from "react-dom/client";
import { GlobalContext } from "@/app/lib/GlobalContext";

const CsbV = () => {
  const { register, getValues, setValue } = useForm();
  const [resetFactor, setResetFactor] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const downloadRef = useRef();
  const { server } = useContext(GlobalContext);

  // ✅ Fetch invoice from backend by AirwayBill Number
  const handleLoadInvoice = async () => {
    try {
      const { awb } = getValues();
      if (!awb) return alert("Enter an AirwayBill Number first.");

      setLoading(true);

      const res = await fetch(`${server}/custom-invoice/csb-v?awb=${awb}`);

      if (!res.ok) throw new Error("Invoice not found");

      const data = await res.json();
      setInvoiceData(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Failed to load invoice");
      setLoading(false);
    }
  };

  // ✅ Download PDF
  const handleDownloadPDF = async () => {
    if (!invoiceData) return alert("Load invoice first!");

    const element = downloadRef.current;
    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 1);
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", 0, 0, pageWidth, imgHeight);
    pdf.save(`${invoiceData?.invoiceNo || "Invoice"}.pdf`);
  };

  const handleLoadRunWiseInvoices = async () => {
    const { runNo } = getValues();
    if (!runNo) return alert("Enter Run Number first.");

    setLoading(true);
    const res = await fetch(
      `${server}/custom-invoice/csb-v/runwise?runNo=${runNo}`
    );
    if (!res.ok) return alert("Run not found");

    const data = await res.json();
    setInvoiceData(data.invoices || []);
    setLoading(false);
  };

  const handleDownloadAllCSBVInvoices = async () => {
    if (!Array.isArray(invoiceData) || !invoiceData.length)
      return alert("No invoices loaded.");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let firstPage = true;

    for (const inv of invoiceData) {
      // Temporary render container
      const temp = document.createElement("div");
      temp.style.width = "864px"; // ~A4 width in px
      temp.style.background = "#fff";
      temp.style.margin = "0 auto";
      temp.style.padding = "0";
      document.body.appendChild(temp);

      const root = ReactDOM.createRoot(temp);
      root.render(<InvoiceCsbV invoiceData={inv} />);

      // Wait for render and layout
      await new Promise((r) => setTimeout(r, 300));

      // html2canvas same settings as single invoice
      const canvas = await html2canvas(temp, {
        scale: 1.5, // ✅ match single invoice
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 1);
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // ✅ Same logic as single invoice — top aligned, no centering or scaling
      if (!firstPage) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

      root.unmount();
      temp.remove();
      firstPage = false;
    }

    pdf.save(`CSBV_Run_${invoiceData[0]?.runNo || "Invoices"}.pdf`);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="mt-3">
        {" "}
        <RedLabelHeading label="Single Invoice AWB Wise" />
      </div>
      <div className="flex gap-3 w-full mb-2">
        <div className="flex w-full">
          <InputBox
            placeholder="AirwayBill Number"
            register={register}
            setValue={setValue}
            value="awb"
            resetFactor={resetFactor}
          />
        </div>
        <div className="flex gap-3">
          <div className="w-[200px]">
            <OutlinedButtonRed
              label={loading ? "Loading..." : "Load Invoice"}
              onClick={handleLoadInvoice}
            />{" "}
          </div>
          <div className="w-[155px]">
            <OutlinedButtonRed label="Print" />
          </div>
          <div className="w-[165px]">
            <SimpleButton name="Download" onClick={handleDownloadPDF} />
          </div>
        </div>
      </div>

      <RedLabelHeading label="Multiple Invoices Run Wise" />
      <div className="flex gap-3 w-full">
        <div className="flex-1">
          <InputBox
            placeholder="Run No"
            register={register}
            setValue={setValue}
            value="runNo"
            resetFactor={resetFactor}
          />
        </div>
        <div className="flex gap-3">
          <div className="w-[200px]">
            <OutlinedButtonRed
              label={`Load Invoice`}
              onClick={handleLoadRunWiseInvoices}
            />
          </div>
          <div className="w-[155px]">
            <OutlinedButtonRed label="Print All" />
          </div>
          <div className="w-[165px]">
            <SimpleButton
              name="Download All"
              onClick={handleDownloadAllCSBVInvoices}
            />
          </div>
        </div>
      </div>

      <div>
        <InvoiceCsbV ref={downloadRef} invoiceData={invoiceData} />
      </div>
    </div>
  );
};

export default CsbV;
