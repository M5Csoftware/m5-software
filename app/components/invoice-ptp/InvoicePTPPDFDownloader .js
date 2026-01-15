import React, { useRef, useEffect, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";

// Invoice PTP Template
const InvoicePTPTemplate = ({ invoiceData, qrCodeImageUrl }) => {
  const {
    clientDetails = {},
    amountDetails = {},
    billItems = [],
  } = invoiceData || {};

  const totals = {
    awbCount: billItems?.length || 0,
    weight: billItems?.reduce((sum, s) => sum + (Number(s.totalActualWt) || 0), 0) || 0,
    freightAmount: amountDetails?.freightAmount || 0,
    clearanceCharge: amountDetails?.clearanceCharge || 0,
    grandTotal: amountDetails?.grandTotal || 0,
    exchangeRate: amountDetails?.exchangeAmount || 0,
    currency: amountDetails?.currency || "GBP",
    exAmount: amountDetails?.exAmount || 0,
  };

  const numberToWords = (num) => {
    if (num === 0) return "zero";
    const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
    const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];

    function convertLessThanThousand(n) {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
      return ones[Math.floor(n / 100)] + " hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
    }

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = Math.floor(num % 1000);

    let result = "";
    if (crore > 0) result += convertLessThanThousand(crore) + " crore ";
    if (lakh > 0) result += convertLessThanThousand(lakh) + " lakh ";
    if (thousand > 0) result += convertLessThanThousand(thousand) + " thousand ";
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return (result.trim() || "zero") + " only";
  };

  const getIrnDetails = () => {
    if (invoiceData?.qrCodeData && Array.isArray(invoiceData.qrCodeData) && invoiceData.qrCodeData.length > 0) {
      const qrData = invoiceData.qrCodeData[0];
      return {
        irn: qrData.irnNumber || '',
        ackNo: qrData.ackNo || '',
        ackDate: qrData.ackDate || '',
        hasData: true
      };
    }
    
    return null;
  };

  const irnDetails = getIrnDetails();
  const hasQrData = irnDetails && qrCodeImageUrl;

  return (
    <div
      className="bg-gray-50 mt-10 p-6 border-1 border-black w-full"
      style={{ width: "210mm", minHeight: "297mm", fontFamily: "Arial" }}
    >
      {/* Header */}
      <div className="mb-2">
        <div className="flex items-start justify-between">
          <div className="w-1/4">
            <img src="logo.svg" alt="Logo" style={{ width: "50px", height: "50px" }} />
          </div>
          <div className="w-1/2 text-center">
            <h1 className="text-2xl font-bold">TAX INVOICE</h1>
          </div>
          <div className="w-1/4">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px" }} className="text-[10px] font-sans">
              <tbody>
                <tr>
                  <th style={{ textAlign: "left", border: "1px solid #000", padding: "4px", paddingTop: "2px", paddingBottom: "8px", background: "#f2f2f2", width: "40%" }}>
                    Invoice No.:
                  </th>
                  <td style={{ border: "1px solid #000", paddingBottom: "8px", paddingTop: "2px", padding: "4px" }}>
                    {clientDetails?.invoiceSrNo || ""}
                  </td>
                </tr>
                <tr>
                  <th style={{ textAlign: "left", border: "1px solid #000", paddingBottom: "10px", paddingTop: "2px", padding: "4px", background: "#f2f2f2" }}>
                    Invoice Date:
                  </th>
                  <td style={{ border: "1px solid #000", paddingBottom: "10px", paddingTop: "2px", padding: "4px" }}>
                    {clientDetails?.invoiceDate ? new Date(clientDetails.invoiceDate).toLocaleDateString('en-GB') : ""}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="text-center mt-2">
          <p className="text-[8px] leading-tight font-semibold">
            SUPPLY MEANT FOR EXPORT /SUPPLY TO SEZ UNIT OR SEZ DEVELOPER FOR AUTHORISED OPERATIONS UNDER BOND OF<br/>
            LETTER OF UNDERTAKING WITHOUT PAYMENT OF IGST<br/>
            LUT No.:AD070424002665A
          </p>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-2 gap-4 mb-1">
        <div className="border border-black rounded-md" style={{ minHeight: "120px" }}>
          <div className="font-sans font-semibold text-[10px] text-gray-900 p-2 pb-3 tracking-wide bg-gray-300">
            Bill To: {clientDetails?.customerName || "Customer Name"}
          </div>
          <div className="text-[10px] ml-2 pb-3 font-sans leading-tight">
            <div><strong>Address:</strong> {clientDetails?.addressLine1 || ""}</div>
            <div><strong>A/C Code:</strong> {clientDetails?.accountCode || ""}</div>
            <div><strong>GST:</strong> {clientDetails?.gstNo || ""}</div>
            <div><strong>Pan No:</strong> -</div>
            <div><strong>State:</strong> {clientDetails?.state || ""}</div>
            <div><strong>Place of Supply:</strong> -</div>
          </div>
        </div>

        <div className="border border-black tracking-wide rounded-md">
          <div className="text-[10px]">
            <div className="font-bold bg-gray-300 p-2 pb-3">M 5 CONTINENT LOGISTICS SOLUTION PVT. LTD.</div>
            <div className="ml-2 pb-3 leading-tight">
              <div>Ground Floor, Khasra No 91, Plot No. NJF PC 40 <br />Bamnoli Village, NEW DELHI-110077<br />Email: Info@m5clogs.com <br />Website: www.m5clogs.com</div>
              <div className="leading-tight mt-2">
                <div><strong>GST:</strong> 07AAQCM6359K1ZP</div>
                <div>CIN No: U51201DL2023PTC410991</div>
                <div>PAN No: AAQCM6359K</div>
                <div>STATE: 07 DELHI</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="mb-2">
        <h2 className="text-center font-bold mb-3 text-sm">Invoice Summary</h2>
        <table className="w-full border-collapse text-[9px]">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-1 pb-2">SERVICE</th>
              <th className="border border-black p-1 pb-2">COUNT<br />AWBNO</th>
              <th className="border border-black p-1 pb-2">WEIGHT</th>
              <th className="border border-black p-1 pb-2">AIR FREIGHT</th>
              <th className="border border-black p-1 pb-2">CLEARANCE<br />CHG.</th>
              <th className="border border-black p-1 pb-2">TOTAL<br />AMOUNT</th>
              <th className="border border-black p-1 pb-2">EXCHANGE<br />RATE</th>
              <th className="border border-black p-1 pb-2">AMOUNT<br />{totals.currency}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              <td className="border border-black p-1 pb-2">SAC: 996531</td>
              <td className="border border-black p-1 pb-2">{totals.awbCount}</td>
              <td className="border border-black p-1 pb-2">{totals.weight.toFixed(2)}</td>
              <td className="border border-black p-1 pb-2">{totals.freightAmount.toFixed(2)}</td>
              <td className="border border-black p-1 pb-2"></td>
              <td className="border border-black p-1 pb-2">{totals.freightAmount.toFixed(2)}</td>
              <td className="border border-black p-1 pb-2">{totals.exchangeRate.toFixed(2)}</td>
              <td className="border border-black p-1 pb-2">{totals.exchangeRate > 0 ? (totals.grandTotal / totals.exchangeRate).toFixed(2) : '0.00'}</td>
            </tr>
            <tr className="text-center">
              <td className="border border-black p-1 pb-2">SAC: 996713</td>
              <td className="border border-black p-1 pb-2"></td>
              <td className="border border-black p-1 pb-2"></td>
              <td className="border border-black p-1 pb-2"></td>
              <td className="border border-black p-1 pb-2">{totals.clearanceCharge.toFixed(2)}</td>
              <td className="border border-black p-1 pb-2"></td>
              <td className="border border-black p-1 pb-2"></td>
              <td className="border border-black p-1 pb-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in Words */}
      <div className="text-[9px] font-bold flex justify-between mb-2 pt-1 border-y-[1px] p-2 pb-3 border-gray-500">
        <div>Amount in Words :  <span className="uppercase font-medium"><span className="px-1">{totals.currency}</span> {numberToWords(totals.exchangeRate > 0 ? (totals.grandTotal / totals.exchangeRate).toFixed(2) : '0.00')} </span></div>
        <div>Round Off:<span className="uppercase font-medium">&nbsp; 0.00</span></div>
      </div>

      {/* IRN and QR Code Section */}
      {hasQrData ? (
        <div className="flex gap-4 p-2 py-2 border-b border-gray-300">
          <div className="flex-1">
            <div className="text-[9px] leading-relaxed">
              <div><strong>IRN:</strong> {irnDetails.irn}</div>
              <div><strong>Ack No:</strong> {irnDetails.ackNo || '-'}</div>
              <div><strong>Ack Date:</strong> {irnDetails.ackDate}</div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img 
              src={qrCodeImageUrl} 
              alt="QR Code" 
              style={{ width: "100px", height: "100px" }}
            />
          </div>
        </div>
      ) : (
        <div className="flex p-2 gap-4 py-2 border-b border-gray-300">
          <strong className="text-[10px] font-sans p-2">IRN :</strong>
          <div className="h-[12vh]"></div>
        </div>
      )}

      {/* Bank Details */}
      <div className="flex gap-4 justify-between">
        <div className="leading-normal p-3 pt-0 w-full">
          <div className="font-bold text-[10px]">Our Bank Details</div>
          <div className="text-[9px]">
            <div>Bank Name: INDUSIND BANK</div>
            <div>A/C No: 258826097173</div>
            <div>IFSC/RTGS: INDB0000005</div>
          </div>
        </div>
      </div>
      
      <div className="border border-b border-black my-2"></div>

      <div className="flex py-2 gap-6">
        <div className="w-1/2">
          <strong className="text-[10px]">E.&O.E</strong>
          <ul className="text-[9px] mt-2 space-y-1">
            <li><strong>1.</strong> On receipt of the invoice the payment should be remitted within 24 hours, Otherwise interest @18% p.a. shall be applicable.</li>
            <li><strong>2.</strong> Company liability is restricted as per the stipulations specified in airway bill.</li>
            <li><strong>3.</strong> Cheque/DD should be in Favour of M 5 CONTINENT LOGISTICS SOLUTION PVT. LTD.</li>
            <li><strong>4.</strong> All disputes are subject to Delhi Court only.</li>
            <li><strong>5.</strong> This is a computer generated invoice and it does not require signature.</li>
          </ul>
        </div>

        <div className="bg-white border-[1px] pt-0 p-4 rounded-md border-black w-1/2 flex flex-col items-center justify-between">
          <strong className="text-[10px] font-semibold pb-3 leading-tight tracking-wide text-center">For M 5 CONTINENT LOGISTICS SOLUTION PVT. LTD</strong>
          <img src="invoice-stamp.png" className="w-32 h-32" alt="stampNsignature" />
          <strong className="text-sm">Stamp & Signature</strong>
        </div>
      </div>
      <hr />
    </div>
  );
};

// Main PDF Downloader Component with Compression
export default function InvoicePTPPDFDownloader({ invoiceData, onDownloadComplete, setIsLoading }) {
  const page1Ref = useRef();
  const page2Ref = useRef();
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState(null);
  const [qrCodeReady, setQrCodeReady] = useState(false);

  // Generate QR Code from database using qrcode library
  useEffect(() => {
    const generateQRCode = async () => {
      if (invoiceData?.qrCodeData && Array.isArray(invoiceData.qrCodeData) && invoiceData.qrCodeData.length > 0) {
        const dbQrCode = invoiceData.qrCodeData[0].qrCode;
        
        if (dbQrCode) {
          try {
            // Generate QR code using qrcode library
            const qrDataUrl = await QRCode.toDataURL(dbQrCode, {
              width: 200,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#ffffff'
              },
              errorCorrectionLevel: 'H'
            });
            setQrCodeImageUrl(qrDataUrl);
            console.log("✅ QR Code generated successfully");
          } catch (error) {
            console.error("❌ Error generating QR code from database:", error);
          }
        }
      }
      setQrCodeReady(true);
    };

    if (invoiceData) {
      generateQRCode();
    }
  }, [invoiceData]);

  // Trigger PDF download when ready
  useEffect(() => {
    if (invoiceData && invoiceData.billItems && invoiceData.billItems.length > 0 && qrCodeReady) {
      downloadPDF();
    }
  }, [invoiceData, qrCodeReady]);

  const downloadPDF = async () => {
    if (!invoiceData || !invoiceData.billItems || invoiceData.billItems.length === 0) {
      console.error("No invoice data available");
      return;
    }

    setIsLoading(true);

    try {
      setTimeout(async () => {
        // Initialize PDF with compression enabled
        const pdf = new jsPDF({
          orientation: "p",
          unit: "mm",
          format: "a4",
          compress: true // Enable PDF compression
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // Optimized html2canvas settings for better quality and smaller size
        const canvasOptions = {
          scale: 2, // Good balance between quality and file size
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 0,
          removeContainer: true
        };

        // Render page 1
        const canvas1 = await html2canvas(page1Ref.current, canvasOptions);
        const img1 = canvas1.toDataURL("image/jpeg", 0.92); // JPEG with 92% quality for compression
        const img1Height = (canvas1.height * pdfWidth) / canvas1.width;
        pdf.addImage(img1, "JPEG", 0, 0, pdfWidth, img1Height, undefined, 'FAST');

        // Render page 2
        if (page2Ref.current && invoiceData.billItems.length > 0) {
          pdf.addPage();
          const canvas2 = await html2canvas(page2Ref.current, canvasOptions);
          const img2 = canvas2.toDataURL("image/jpeg", 0.92); // JPEG with 92% quality
          const img2Height = (canvas2.height * pdfWidth) / canvas2.width;
          pdf.addImage(img2, "JPEG", 0, 0, pdfWidth, img2Height, undefined, 'FAST');
        }

        const fileName = `Invoice_${invoiceData.clientDetails?.invoiceNo || 'PTP'}_${invoiceData.clientDetails?.invoiceSrNo?.replace(/\//g, '_') || ''}.pdf`;
        pdf.save(fileName);
        
        setIsLoading(false);
        if (onDownloadComplete) {
          onDownloadComplete();
        }
      }, 500);
    } catch (err) {
      console.error("PDF generation error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
      <div ref={page1Ref} style={{ width: "210mm", minHeight: "297mm", padding: 0, margin: 0, boxSizing: "border-box" }} className="bg-white">
        <InvoicePTPTemplate invoiceData={invoiceData} qrCodeImageUrl={qrCodeImageUrl} />
      </div>

      {invoiceData?.billItems?.length > 0 && (
        <div ref={page2Ref} style={{ width: "210mm", minHeight: "297mm", boxSizing: "border-box", pageBreakBefore: "always", padding: "10px" }} className="bg-gray-50">
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-black p-1 pb-2">SR NO</th>
                <th className="border border-black p-1 pb-2">AWB</th>
                <th className="border border-black p-1 pb-2">Date</th>
                <th className="border border-black p-1 pb-2">Destination</th>
                <th className="border border-black p-1 pb-2">State</th>
                <th className="border border-black p-1 pb-2">Product</th>
                <th className="border border-black p-1 pb-2">City</th>
                <th className="border border-black p-1 pb-2">Weight</th>
                <th className="border border-black p-1 pb-2">Air Freight</th>
                <th className="border border-black p-1 pb-2">Clearance Chg</th>
                <th className="border border-black p-1 pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.billItems.map((item, i) => (
                <tr key={i} className="text-center">
                  <td className="border border-black p-1 pb-2">{i + 1}</td>
                  <td className="border border-black p-1 pb-2">{item.awbNo}</td>
                  <td className="border border-black p-1 pb-2">{item.date}</td>
                  <td className="border border-black p-1 pb-2">{item.destination}</td>
                  <td className="border border-black p-1 pb-2">{item.sector}</td>
                  <td className="border border-black p-1 pb-2">{item.service}</td>
                  <td className="border border-black p-1 pb-2">{item.receiverCity}</td>
                  <td className="border border-black p-1 pb-2">{(item.totalActualWt || 0).toFixed(3)}</td>
                  <td className="border border-black p-1 pb-2">{(item.basicAmt || 0).toFixed(2)}</td>
                  <td className="border border-black p-1 pb-2">{(item.miscChg || 0).toFixed(2)}</td>
                  <td className="border border-black p-1 pb-2">{((item.basicAmt || 0) + (item.miscChg || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}