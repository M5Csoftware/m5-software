"use client";
import React, { forwardRef, useImperativeHandle, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Barcode from "react-barcode";

function AwbBarcode({ awbNo }) {
  return (
    <div style={{ marginTop: 10 }}>
      <Barcode
        value={awbNo}
        format="CODE128" // standard for shipping
        width={1.2} // thickness of bars
        height={35} // height of barcode
        displayValue={false} // shows the number below the bars
      />
    </div>
  );
}

const Invoice = forwardRef(({ data, size = "A4" }, ref) => {
  const targetRef = useRef(null);

  // Define sizes in points (1 inch = 72 points)
  // const normalized = (size || "").toLowerCase();

  // const sizeMap = {
  //   a4: { w: 595.28, h: 841.89 }, // A4
  //   "4x6": { w: 288, h: 432 }, // 4x6 inches
  //   "4'x6'": { w: 288, h: 432 }, // 4'x6' variant
  //   "2x2": { w: 144, h: 144 }, // 2x2 inches
  // };

  // const selected = sizeMap[normalized] || sizeMap.a4;

  const downloadPdf = async () => {
    const invoice = targetRef.current;
    if (!invoice) return;

    const normalized = (size || "").toLowerCase();

    const sizeMap = {
      a4: { w: 595.28, h: 841.89 },
      "4x6": { w: 432, h: 288 },
      "4'x6'": { w: 432, h: 288 },
      "2x2": { w: 144, h: 144 },
    };

    const selected = sizeMap[normalized] || sizeMap.a4;

    const canvas = await html2canvas(invoice, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    // Detect landscape
    const isLandscape = normalized.includes("4x6");

    // Swap width and height for landscape
    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "pt",
      format: isLandscape ? [selected.h, selected.w] : [selected.w, selected.h],
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const ratio = Math.min(
      pageWidth / canvas.width,
      pageHeight / canvas.height
    );
    const finalW = canvas.width * ratio;
    const finalH = canvas.height * ratio;
    const x = (pageWidth - finalW) / 2;
    const y = (pageHeight - finalH) / 2;

    pdf.addImage(imgData, "PNG", x, y, finalW, finalH);
    pdf.save(`Invoice-${data.awbNo}.pdf`);
  };

  useImperativeHandle(ref, () => ({ downloadPdf }));

  return (
    <div className="p-4 bg-gray-50 flex justify-center border-[1px] border-black">
      <div
        ref={targetRef}
        style={{
          width: "800px", // fixed invoice layout
          background: "white",
          padding: "16px",
        }}
      >
        {/* HEADER */}
        <div className="flex justify-between items-start border-b pb-2 mb-2">
          <div>
            <h1 className="font-bold text-base">
              {data.company || "M 5 CONTINENT LOGISTICS SOLUTION (P) LTD."}{" "}
            </h1>
            <p className="text-[10px] mt-1 leading-tight">
              Ground Floor, Khasra No 91, Plot No. NJF PC 40 Bamroli Village
              <br />
              NEW DELHI-110077
            </p>
            <p className="text-[10px] mt-1">Tel :</p>
          </div>
          <div className="flex">
            <div className="text-right border p-2 w-32 h-26 text-[9px]">
              <p className="font-semibold">DESTINATION</p>
              <p className="font-bold text-xs mb-4">
                {data.destination || "CANADA"}
              </p>

              <p className="font-semibold mt-1">DATE</p>
              <p>{data.date || ""}</p>
            </div>
            <div className="border flex flex-col items-center w-50 h-26 p-2 text-[9px]">
              <p className="font-semibold ">AIRWAY BILL NO.</p>
              <AwbBarcode awbNo={data.awbNo} />
              <p className="font-bold tracking-widest font-sans">
                {data.awbNo || ""}
              </p>
            </div>
          </div>
        </div>

        {/* SHIPPER / CONSIGNEE */}
        <div className="grid grid-cols-2 border text-[9px]">
          <div className="p-2 border-r leading-tight pb-4">
            <p className="font-semibold">SHIPPER</p>
            <p>{data.shipperName}</p>
            <p>{data.shipperAddress}</p>
            <p>{data.shipperPhone}</p>
          </div>
          <div className="p-2 leading-tight pb-4">
            <p className="font-semibold">CONSIGNEE</p>
            <p>{data.consigneeName}</p>
            <p>{data.consigneeAddress}</p>
            <p>{data.consigneePhone}</p>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="flex gap-2 h-[15vh]">
          <table className="w-full border text-center mt-2 text-[8px] table-fixed">
            <thead className="bg-gray-100">
              <tr>
                <th className="border pb-4">
                  CONTENT DEST <br /> (SAID TO CONTAIN)
                </th>
                <th className="border p-1">NO OF PRICES</th>
                <th className="border p-1">ACTUAL WEIGHT</th>
                <th className="border p-1">VOLUME WEIGHT</th>
                <th className="border p-1">CHARGED WEIGHT</th>
                <th className="border p-1">PAYMENT MODE</th>
              </tr>
            </thead>
            <tbody className="font-normal tracking-wide text-[10px] font-sans">
              {/* {data.boxes && data.boxes.length > 0 ? (
                data.boxes.map((box, index) => (
                  <tr key={index} >
                    <td className="border p-1 pb-4">{data.content}</td>
                    <td className="border p-1 pb-4">{box.pcs || 1}</td>
                    <td className="border p-1 pb-4">{box.weight}</td>
                    <td className="border p-1 pb-4">{data.totalVolWt}</td>
                    <td className="border p-1 pb-4">{data.totalActualWt}</td>
                    <td className="border p-1 pb-4">{data.payment}</td>
                  </tr>
                ))
              ) : ( */}
              <tr>
                <td className="border p-1 pb-4">{data.content}</td>
                <td className="border p-1 pb-4">{data.pcs || "-"}</td>
                <td className="border p-1 pb-4">{data.totalActualWt || "-"}</td>
                <td className="border p-1 pb-4">{data.totalVolWt || "-"}</td>
                <td className="border p-1 pb-4">{data.totalActualWt || "-"}</td>
                {/* <td className="border p-1 pb-4">{data.payment || "-"}</td> */}
              </tr>
              {/* )} */}
            </tbody>
          </table>

          <table className="border mt-2 text-[8px] table-fixed w-2/3 ">
            <thead className="bg-gray-100 ">
              <tr>
                <th className="border p-1 pb-3">CHARGES</th>
                <th className="border p-1 pb-3">AMOUNT ₹</th>
                <th className="border p-1 pb-3 w-[40%]">
                  SPECIAL INSTRUCTIONS
                </th>
              </tr>
            </thead>
            <td className="border p-1 leading-tight space-y-2">
              <div>S. CHARGES: </div>
              <div>TOTAL: </div>
              <div>COD AMT: </div>
              <div>S TAX: </div>
              <div>TOTAL: </div>
            </td>
            <td className="border p-1 text-center leading-tight space-y-2">
              <div>{data.basicAmt || ""}</div>
              <div>{data.totalAmt || ""}</div>
              <div>{data.codAmt || ""}</div>
              <div>{data.sgst + data.cgst + data.igst || ""}</div>
              <div>{data.totalAmt || ""}</div>
            </td>
            <td className="border p-1 leading-tight space-y-2">
              <div>{/* add INSTRUCTIONS */}</div>
            </td>
          </table>
        </div>
        <div className="bg-gray-100 border p-1 font-semibold text-[9px] mt-1 pb-4">
          VALUE FOR CUSTOM PURPOSE
        </div>
        {/* FOOTER */}
        <div className="flex">
          <div className="flex flex-col flex-1">
            <div className="border p-1 mt-1 text-[8px] leading-tight pb-4">
              I HEREBY DECLARE THAT THE CONSIGNMENT DOES NOT CONTAIN PERSONAL
              MAIL, CURRENCY NOTES, VALUABLE OR CONTRABAND ITEM ETC.
            </div>
            <div className="border p-1 mt-1 text-[8px] leading-tight pb-4">
              CONDITION OF CARRIAGE:
              <br />
              1 - THIS IS NON NEGOTIABLE CONSIGNMENT NOTE
              <br />2 - STANDARD CONDITIONS OF CARRIAGE ARE GIVEN ON REVERSE OF
              THE SHIPPER COPY
            </div>
          </div>

          <div className="flex flex-col gap-2 p-2 border mt-1 ml-2 w-1/3 text-[8px]">
            <h2 className="font-semibold">Receive By</h2>
            <h2>Name</h2>
            <h2>Time</h2>
            <h2>Date</h2>
          </div>

          <div className="flex flex-col gap-2 p-2 border mt-1 ml-2 w-1/3 text-[8px]">
            <h2 className="font-semibold">Received Goods Condition</h2>
            <h2>Name</h2>
            <h2>Stamp</h2>
            <div className="flex justify-between">
              <h2>Date</h2>
              <h2>Signature</h2>
            </div>
          </div>
        </div>
        <div className="bg-orange-500 text-white text-center py-1 mt-2 text-[9px] font-semibold pb-4">
          TERMS & CONDITIONS PLEASE SEE OUR WEBSITE
        </div>
      </div>
    </div>
  );
});

export default Invoice;
