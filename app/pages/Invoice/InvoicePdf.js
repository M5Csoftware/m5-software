import React, { useRef, useState, useEffect } from "react";

// Simple Invoice Template
const InvoiceTemplate = ({ invoiceData, qrImage }) => {
  const {
    customer = {},
    invoiceSummary = {},
    shipments = [],
    invoiceNumber = "",
    invoiceDate = "",
    placeOfSupply = "",
  } = invoiceData || {};

  const qr = invoiceData?.qrCodeData?.[0];

  const totals = {
    awbCount: shipments?.length || 0,
    weight:
      shipments?.reduce((sum, s) => {
        const w = s.totalActualWt || s.weight || s._doc?.weight || 0;
        return sum + Number(w);
      }, 0) || 0,
    amount: invoiceSummary?.basicAmount || 0,
    discount: invoiceSummary?.discountAmount || 0,
    nonTaxable: invoiceSummary?.nonTaxableAmount || 0,
    sgst: invoiceSummary?.sgst || 0,
    cgst: invoiceSummary?.cgst || 0,
    igst: invoiceSummary?.igst || 0,
    miscChg: invoiceSummary?.miscChg || 0,
    fuelChg: invoiceSummary?.fuelChg || 0,
    grandTotal: invoiceSummary?.grandTotal || 0,
  };

  const numberToWords = (num) => {
    if (num === 0) return "zero";
    const ones = [
      "",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
    ];
    const tens = [
      "",
      "",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
    ];
    const teens = [
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
    ];

    function convertLessThanThousand(n) {
      if (n === 0) return "";
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "")
        );
      return (
        ones[Math.floor(n / 100)] +
        " hundred" +
        (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
      );
    }

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = Math.floor(num % 1000);

    let result = "";
    if (crore > 0) result += convertLessThanThousand(crore) + " crore ";
    if (lakh > 0) result += convertLessThanThousand(lakh) + " lakh ";
    if (thousand > 0)
      result += convertLessThanThousand(thousand) + " thousand ";
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return "rupees " + (result.trim() || "zero") + " only";
  };

  return (
    <div
      className="bg-gray-50 mt-10 p-6 border-1 border-black w-full"
      style={{ width: "210mm", minHeight: "297mm", fontFamily: "Arial" }}
    >
      {/* Header */}
      <div className="text-center mb-2 flex items-center justify-between">
        <div className="w-1/3">
          <img
            src="logo.svg"
            alt="Logo"
            style={{ width: "50px", height: "50px" }}
          />
        </div>
        <h1 className="text-2xl font-bold w-1/3">TAX INVOICE</h1>
        <div className="w-1/3">
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
            className="text-xs font-sans"
          >
            <tbody>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    border: "1px solid #000",
                    padding: "6px",
                    paddingTop: "0px",
                    paddingBottom: "12px",
                    background: "#f2f2f2",
                    width: "35%",
                  }}
                >
                  Invoice No:
                </th>
                <td
                  style={{
                    border: "1px solid #000",
                    paddingBottom: "12px",
                    paddingTop: "0px",
                    padding: "6px",
                  }}
                >
                  {invoiceNumber || "N/A"}
                </td>
              </tr>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    border: "1px solid #000",
                    paddingBottom: "16px",
                    paddingTop: "0px",
                    padding: "6px",
                    background: "#f2f2f2",
                  }}
                >
                  Date:
                </th>
                <td
                  style={{
                    border: "1px solid #000",
                    paddingBottom: "16px",
                    paddingTop: "0px",
                    padding: "6px",
                  }}
                >
                  {invoiceDate
                    ? new Date(invoiceDate).toLocaleDateString("en-IN")
                    : "DD/MM/YYYY"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Section */}
      <div className="grid grid-cols-2 gap-4 mb-1">
        <div
          className="border border-black rounded-md"
          style={{ minHeight: "140px" }}
        >
          <div className="font-sans font-semibold text-xs text-gray-900 p-2 pb-4 tracking-wide bg-gray-300">
            Bill To: {customer?.name || "Customer Name"}
          </div>
          <div className="text-xs ml-2 pb-4 font-sans leading-tight">
            {customer?.address1 && (
              <div className="uppercase">{customer.address1}</div>
            )}
            {customer?.address2 && (
              <div className="uppercase">{customer.address2}</div>
            )}
            {(customer?.city || customer?.pincode) && (
              <div className="uppercase">
                {customer?.city || ""}{" "}
                {customer?.pincode ? `- ${customer.pincode}` : ""}
              </div>
            )}
            {customer?.country && (
              <div className="uppercase mb-2">{customer.country}</div>
            )}
            {customer?.gstNo && (
              <div>
                <strong>GST:</strong> {customer.gstNo}
              </div>
            )}
            {customer?.panNo && (
              <div>
                <strong>PAN No:</strong> {customer.panNo}
              </div>
            )}
            {customer?.state && (
              <div>
                <strong>State:</strong> {customer.state}
              </div>
            )}
            {placeOfSupply && (
              <div>
                <strong>Place of Supply:</strong> {placeOfSupply}
              </div>
            )}
            {customer?.phone && (
              <div>
                <strong>Phone:</strong> {customer.phone}
              </div>
            )}
          </div>
        </div>

        <div className="border border-black tracking-wide rounded-md">
          <div className="text-xs">
            <div className="font-bold bg-gray-300 p-2 pb-4">
              M 5 CONTINENT LOGISTICS SOLUTION PVT. LTD.
            </div>
            <div className="ml-2 pb-4 leading-tight">
              <div>
                Ground Floor, Khasra No 91, Plot No. NJF PC 40 <br />
                Bamnoli Village, NEW DELHI-110077
                <br />
                Email: Info@m5clogs.com <br />
                Website: www.m5clogs.com
              </div>
              <div className="leading-tight mt-2">
                <div>
                  <strong>GST:</strong> 07AAQCA2659K1ZP
                </div>
                <div>CIN No: U51201DL2023PTC410991</div>
                <div>PAN No.: AAQCM6359K</div>
                <div>STATE: 07 DELHI</div>
                <div>
                  <strong>SAC:</strong> 996812
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Table */}
      <div className="mb-2">
        <h2 className="text-center font-bold mb-4">Invoice Summary</h2>
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-2 pb-4">Service</th>
              <th className="border border-black p-2 pb-4">Total AWBs</th>
              <th className="border border-black p-2 pb-4">Weight</th>
              <th className="border border-black p-2 pb-4">Amount</th>
              <th className="border border-black p-2 pb-4">Discount</th>
              <th className="border border-black p-2 pb-4">Taxable Amt</th>
              <th className="border border-black p-2 pb-4">SGST 9%</th>
              <th className="border border-black p-2 pb-4">CGST 9%</th>
              <th className="border border-black p-2 pb-4">IGST 18%</th>
              <th className="border border-black p-2 pb-4">G. Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              <td className="border border-black border-b-0 p-2 pb-4">
                Courier Service
              </td>
              <td className="border border-black p-2 pb-4">
                {totals.awbCount}
              </td>
              <td className="border border-black p-2 pb-4">
                {totals.weight.toFixed(2)}
              </td>
              <td className="border border-black p-2 pb-4">
                {totals.amount.toFixed(2)}
              </td>
              <td className="border border-black p-2 pb-4">
                {totals.discount.toFixed(2)}
              </td>
              <td className="border border-black p-2 pb-4">
                {(totals.amount - totals.discount).toFixed(2)}
              </td>
              <td className="border border-black p-2 pb-4">
                {totals.sgst.toFixed(2)}
              </td>
              <td className="border border-black p-2 pb-4">
                {totals.cgst.toFixed(2)}
              </td>
              <td className="border border-black p-2 pb-4">
                {totals.igst.toFixed(2)}
              </td>
              <td className="border border-black p-2 pb-4">
                {totals.grandTotal.toFixed(2)}
              </td>
            </tr>
            <tr className="text-center">
              <td className="border border-t-0 border-black p-2 pb-4">
                <strong>SAC:</strong> 996812
              </td>
              <td className="border border-black p-2 pb-4"></td>
              <td className="border border-black p-2 pb-4"></td>
              <td className="border border-black p-2 pb-4"></td>
              <td className="border border-black p-2 pb-4"></td>
              <td className="border border-black p-2 pb-4"></td>
              <td className="border border-black p-2 pb-4"></td>
              <td className="border border-black p-2 pb-4"></td>
              <td className="border border-black p-2 pb-4"></td>
              <td className="border border-black p-2 pb-4"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Amount in Words */}
      <div className="text-xs font-bold flex justify-between mb-1 pt-1 border-y-[1px] p-2 pb-4 border-gray-500">
        <div>
          Amount in Words:{" "}
          <span className="uppercase font-medium">
            &nbsp;{numberToWords(totals.grandTotal)}
          </span>
        </div>
        <div>
          Round Off:
          <span className="uppercase font-medium">
            &nbsp; {totals.roundOff || "0.00"}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-0 p-2 gap-4 py-3 w-full">
        <div className="flex flex-col gap-4 text-xs leading-loose w-full">
          <div className="">
            <strong className="text-xs font-sans p-2"> IRN :</strong>{" "}
            {qr?.irnNumber || "N/A"}
          </div>
          <div>
            <strong className="text-xs font-sans p-2">ACK NO :</strong>{" "}
            {qr?.ackNo || "N/A"}
          </div>
          <div>
            <strong className="text-xs font-sans p-2">ACK DATE :</strong>{" "}
            {qr?.ackDate || "N/A"}
          </div>
        </div>

        <div className="border-[1px] border-gray-700 p-[1px] rounded-sm flex items-center justify-end">
          {qrImage && <img src={qrImage} width={140} height={140} alt="QR Code" />}
        </div>

        <div className="h-[15vh]"></div>
      </div>

      {/* Bank Details */}
      <div className="flex gap-4 justify-between">
        <div className="border border-black rounded-md leading-loose p-3 pt-0 w-full">
          <div className="font-bold">Our Bank Details</div>
          <div className="text-xs">
            <div>Bank Name: INDUSIND BANK</div>
            <div>A/C No: 258826097173</div>
            <div>IFSC/RTGS: INDB0000005</div>
          </div>
        </div>

        <div className="border border-black p-3 pb-4 pt-1 rounded-md font-semibold text-xs leading-tight w-[50%]">
          <div className="flex justify-between">
            <span>Non Taxable Amount:</span>
            <span>{totals.nonTaxable.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxable:</span>
            <span>{(totals.amount - totals.discount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>SGST @9%:</span>
            <span>{totals.sgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>CGST @9%:</span>
            <span>{totals.cgst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>IGST @18%:</span>
            <span>{totals.igst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Misc Charges:</span>
            <span>{totals.miscChg.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Fuel Charges:</span>
            <span>{totals.fuelChg.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Rounded Off:</span>
            <span>{totals.roundOff || "0.00"}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 justify-between py-2 pt-1 pb-4 my-2 border-y-[1px] border-gray-500">
        <div className="flex text-xs gap-2 font-bold w-full">
          <span>Amount in Words:</span>
          <span className="uppercase text-xs">
            {numberToWords(totals.grandTotal)}
          </span>
        </div>

        <div className="flex text-xs justify-between w-[50%] font-bold px-3">
          <span className="pl-1">Grand Total:</span>
          <span>{totals.grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex py-2 gap-6">
        <div className="w-1/2">
          <strong>E.&O.E</strong>
          <ul className="text-xs mt-2 space-y-1">
            <li>
              <strong>1.</strong> On receipt of the invoice the payment should
              be remitted within 24 hours, Otherwise interest @18% p.a. shall be
              applicable.
            </li>
            <li>
              <strong>2.</strong> Company liability is restricted as per the
              stipulations specified in airway bill.
            </li>
            <li>
              <strong>3.</strong> Cheque/DD should be in Favour of M 5 CONTINENT
              LOGISTICS SOLUTION PVT. LTD.
            </li>
            <li>
              <strong>4.</strong> All disputes are subject to Delhi Court only.
            </li>
            <li>
              <strong>5.</strong> This is a computer generated invoice and it
              does not require signature.
            </li>
          </ul>
        </div>

        <div className="bg-white border-[1px] pt-0 p-4 rounded-md border-black w-1/2 flex flex-col items-center justify-between">
          <strong className="text-xs font-semibold pb-3 leading-tight tracking-wide text-center">
            For M 5 CONTINENT LOGISTICS SOLUTION PVT. LTD
          </strong>
          <img
            src="invoice-stamp.png"
            className="w-32 h-32"
            alt="stampNsignature"
          />
          <strong className="text-sm">Stamp & Signature</strong>
        </div>
      </div>
      <hr />
    </div>
  );
};

// Main Component
export default function InvoicePDFDownloader({ server, invoiceNumber }) {
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const page1Ref = useRef();
  const page2Ref = useRef();

  // Generate QR Code when invoice data is loaded
  useEffect(() => {
    const generateQR = async () => {
      if (invoiceData?.qrCodeData?.[0]?.qrCode) {
        try {
          const QRCode = (await import("qrcode")).default;
          // Generate QR code using qrcode library
          const qrDataUrl = await QRCode.toDataURL(
            invoiceData.qrCodeData[0].qrCode,
            {
              width: 200,
              margin: 1,
              color: {
                dark: '#000000',
                light: '#ffffff'
              },
              errorCorrectionLevel: 'H'
            }
          );
          setQrImage(qrDataUrl);
          console.log("✅ QR Code generated successfully");
        } catch (err) {
          console.error("❌ QR Code generation error:", err);
        }
      }
    };

    if (invoiceData) {
      generateQR();
    }
  }, [invoiceData]);

  const downloadPDF = async () => {
    if (!invoiceNumber) {
      alert("No invoice selected");
      return;
    }

    setLoading(true);

    try {
      // Fetch invoice from DB
      const res = await fetch(
        `${server}/billing-invoice/invoice?invoiceNumber=${encodeURIComponent(
          invoiceNumber.toUpperCase()
        )}`
      );
      if (!res.ok) throw new Error("Invoice not found");
      const data = await res.json();

      console.log("📄 Full invoice data:", JSON.stringify(data, null, 2));

      setInvoiceData(data);

      // Wait for render and QR code generation
      setTimeout(async () => {
        const jsPDF = (await import("jspdf")).default;
        const html2canvas = (await import("html2canvas")).default;

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

        // Render page 2 if shipments exist
        if (page2Ref.current && data.shipments?.length > 0) {
          pdf.addPage();
          const canvas2 = await html2canvas(page2Ref.current, canvasOptions);
          const img2 = canvas2.toDataURL("image/jpeg", 0.92); // JPEG with 92% quality
          const img2Height = (canvas2.height * pdfWidth) / canvas2.width;
          pdf.addImage(img2, "JPEG", 0, 0, pdfWidth, img2Height, undefined, 'FAST');
        }

        pdf.save(`Invoice_${invoiceNumber.replace(/\//g, "_")}.pdf`);
        setLoading(false);
      }, 1000); // Increased timeout to allow QR code generation
    } catch (err) {
      console.error("❌ PDF Download Error:", err);
      alert("Failed to download PDF: " + err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={downloadPDF}
        disabled={loading || !invoiceNumber}
        className="bg-red text-white px-10 py-1.5  rounded-md text-sm font-semibold disabled:bg-gray-500"
      >
        {loading ? "Downloading..." : "Print Invoice"}
      </button>

      {/* Hidden render area */}
      {invoiceData && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div
            ref={page1Ref}
            style={{
              width: "210mm",
              minHeight: "297mm",
              padding: 0,
              margin: 0,
              boxSizing: "border-box",
            }}
            className="bg-white"
          >
            <InvoiceTemplate invoiceData={invoiceData} qrImage={qrImage} />
          </div>

          {invoiceData?.shipments?.length > 0 && (
            <div
              ref={page2Ref}
              style={{
                width: "210mm",
                minHeight: "297mm",
                boxSizing: "border-box",
                padding: "10px",
              }}
              className="bg-gray-50"
            >
              <h2 className="text-center font-bold mb-4 text-sm">
                Shipment Details
              </h2>
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-black p-1 pb-3">AWB</th>
                    <th className="border border-black p-1 pb-3">Date</th>
                    <th className="border border-black p-1 pb-3">Consignee</th>
                    <th className="border border-black p-1 pb-3">City</th>
                    <th className="border border-black p-1 pb-3">State</th>
                    <th className="border border-black p-1 pb-3">Pincode</th>
                    <th className="border border-black p-1 pb-3">Product</th>
                    <th className="border border-black p-1 pb-3">Weight</th>
                    <th className="border border-black p-1 pb-3">Basic</th>
                    <th className="border border-black p-1 pb-3">Discount</th>
                    <th className="border border-black p-1 pb-3">Taxable</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.shipments.map((s, i) => {
                    const shipment = s._doc || s;
                    const awbNo = s.awbNo || shipment.awbNo;
                    const date = s.date || s.createdAt;
                    const consignee = s.receiverFullName;
                    const city = s.receiverCity;
                    const state = s.receiverState || shipment.state;
                    const pincode = s.receiverPincode;
                    const product = s.service || "";
                    const weight = s.totalActualWt || s.weight || 0;
                    const basicAmt = s.basicAmt || s.amount || 0;
                    const discount = s.discountAmt || s.discount || 0;
                    const taxable = s.taxableAmount || basicAmt - discount;

                    return (
                      <tr key={i} className="text-center">
                        <td className="border border-black p-1 pb-3">
                          {awbNo || "-"}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {date
                            ? new Date(date).toLocaleDateString("en-IN")
                            : "-"}
                        </td>
                        <td className="border border-black p-1 text-left px-2 pb-3">
                          {consignee || "-"}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {city || "-"}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {state || "-"}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {pincode || "-"}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {product || "-"}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {Number(weight).toFixed(2)}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {Number(basicAmt).toFixed(2)}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {Number(discount).toFixed(2)}
                        </td>
                        <td className="border border-black p-1 pb-3">
                          {Number(taxable).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-4 text-xs">
                <strong>Total Shipments: {invoiceData.shipments.length}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}