import React from "react";

export const InvoiceCsbV = React.forwardRef(({ invoiceData }, ref) => {
  const billTo = invoiceData?.billTo || {};
  const shipTo = invoiceData?.shipTo || {};

  return (
    <div
      ref={ref}
      className="p-4 bg-white border border-black max-w-4xl mx-auto text-xs"
    >
      {/* TOPMOST SECTION */}
      <div className="h-[10vh] border border-black">
        <h1 className="text-center text-lg font-semibold uppercase">
          Reet Shree
        </h1>
        <h2 className="text-center text-sm font-semibold uppercase">Address</h2>
        <div className="flex flex-col items-center justify-center mt-2">
          <span className="text-center block">
            2, NEW FLORA COMPLEX , NEAR UDAI TOWER , FATEHPURA{" "}
          </span>
          <span>UDAIPUR , RAJASTHAN , 313001 , INDIA</span>
        </div>
      </div>

      {/* EXPORT INVOICE SECTION */}
      <div className="border h-[5vh] border-t-0 border-black px-6 pb-2">
        <div className="flex justify-between">
          <div className="flex gap-2">
            <h2 className="font-semibold">IEC :</h2>
            <span>HCPPS2506R</span>
          </div>
          <div className="flex gap-2">
            <h2 className="font-semibold">GST IN :</h2>
            <span>08ARMPJ2595E1ZJ</span>
          </div>
          <div className="flex gap-2">
            <h2 className="font-semibold">AD CODE :</h2>
            <span>6910468</span>
          </div>
        </div>
        <div className="flex justify-center items-center pb-2">
          <h2 className="text-lg font-semibold uppercase text-center">
            Export Invoice
          </h2>
        </div>
      </div>

      {/* INVOICE DETAILS */}
      <div>
        <div className="border border-black border-t-0 flex w-full">
          <div className="p-2 pt-0 flex gap-3 border-r border-black w-1/2">
            <h2 className="font-semibold">Invoice No :</h2>
            <span>{invoiceData?.invoiceNo || "-"}</span>
          </div>

          <div className="p-2 pt-0 flex gap-3 w-1/2">
            <h2 className="font-semibold">Transport Mode :</h2>
            <span className="font-semibold">BY AIR</span>
          </div>
        </div>

        <div className="border border-black border-t-0 flex w-full">
          <div className="p-2 pt-0 flex gap-3 border-r border-black w-1/2">
            <h2 className="font-semibold">Invoice Date :</h2>
            <span>{invoiceData?.invoiceDate || "-"}</span>
          </div>

          <div className="p-2 pt-0 flex gap-3 w-1/2">
            <h2 className="font-semibold">AWB Number :</h2>
            <span>{invoiceData?.airwayBillNumber || "-"}</span>
          </div>
        </div>

        <div className="border border-black border-t-0 flex w-full">
          <div className="p-2 pt-0 flex gap-3 border-r border-black w-1/2"></div>
          <div className="p-2 pt-0 flex gap-3 w-1/2">
            <h2 className="font-semibold">Date of Supply :</h2>
            <span>{invoiceData?.dateOfSupply || "-"}</span>
          </div>
        </div>

        <div className="border border-black border-t-0 flex w-full">
          <div className="flex gap-3 border-r border-black w-1/2">
            <div className="w-2/3 flex">
              <h2 className="font-semibold p-2 pt-0">State :</h2>
              <span>{invoiceData?.placeOfSupply || "-"}</span>
            </div>

            <div className="flex gap-2 w-1/3 border-l border-black p-2 pt-0">
              <h2 className="font-semibold">Code :</h2>
              <span>{invoiceData?.stateCode || "-"}</span>
            </div>
          </div>

          <div className="p-2 pt-0 flex gap-3 w-1/2">
            <h2 className="font-semibold">Place of Supply :</h2>
            <span>{invoiceData?.placeOfSupply || "-"}</span>
          </div>
        </div>

        <div className="border border-black border-t-0 flex w-full">
          <div className="w-1/2 p-2 pt-0">
            <h2 className="text-xs font-semibold">IGST Payment Status:</h2>
          </div>
          <div className="w-1/2 p-2 pt-0">
            <span>{invoiceData?.igstStatus || "-"}</span>
          </div>
        </div>
      </div>

      {/* BILL TO / SHIP TO */}
      <div>
        <div className="flex border border-black border-t-0">
          <div className="p-2 pt-0 flex gap-3 border-r justify-center items-start border-black w-1/2">
            <h2 className="font-semibold">Bill to Party</h2>
          </div>
          <div className="p-2 pt-0 flex gap-3 w-1/2 justify-center items-start">
            <h2 className="font-semibold">Ship to Party</h2>
          </div>
        </div>

        <div className="border border-black border-t-0 flex w-full">
          <div className="p-2 pt-0 flex gap-3 border-r border-black w-1/2">
            <h2 className="font-semibold">Name :</h2>
            <span>{billTo?.name || "-"}</span>
          </div>
          <div className="p-2 pt-0 flex gap-3 w-1/2">
            <h2 className="font-semibold">Name :</h2>
            <span>{shipTo?.name || "-"}</span>
          </div>
        </div>

        <div className="border border-black border-t-0 flex w-full h-[8vh]">
          <div className="p-2 pt-0 flex-col flex border-r border-black w-1/2 uppercase">
            <span>
              {billTo?.address1} {billTo?.address2}
            </span>
            <span>
              {billTo?.city}, {billTo?.pincode}, {billTo?.country}
            </span>
            <span>Email - {billTo?.email || "-"}</span>
          </div>

          <div className="p-2 pt-0 flex flex-col w-1/2 uppercase">
            <span>
              {shipTo?.address1} {shipTo?.address2}
            </span>
            <span>
              {shipTo?.city}, {shipTo?.pincode}, {shipTo?.country}
            </span>
            <span>Email - {shipTo?.email || "-"}</span>
          </div>
        </div>
      </div>

      {/* TABLE OF ITEMS */}
      <div>
        <div className="border border-t-0 border-black h-[2.5vh]"></div>

        <div className="border border-black h-[50vh] overflow-hidden">
          <table className="w-full h-full border-collapse table-fixed">
            <thead>
              <tr className="text-center font-semibold">
                <th className="border border-t-0 pb-3 border-black w-[5%]">
                  SL No.
                </th>
                <th className="border border-t-0 pb-3 border-black w-[30%]">
                  Description
                </th>
                <th className="border border-t-0 pb-3 border-black w-[12%]">
                  HSN Code
                </th>
                <th className="border border-t-0 pb-3 border-black w-[8%]">
                  Qty
                </th>
                <th className="border border-t-0 pb-3 border-black w-[8%]">
                  Rates
                </th>
                <th className="border border-t-0 pb-3 border-black w-[10%]">
                  Amount
                </th>
                <th className="border border-t-0 pb-3 border-black w-[10%]">
                  Taxable Value
                </th>
                <th className="border border-t-0 pb-3 border-black w-[7%]">
                  IGST
                </th>
                <th className="border-black border border-t-0 pb-3 w-[10%]">
                  Total
                </th>
              </tr>
            </thead>

            <tbody className="border border-black align-top">
              {invoiceData?.items?.map((item, index) => (
                <tr key={index} className="text-center">
                  <td className="border pb-3 border-black">{index + 1}</td>
                  <td className="border pb-3 border-black text-left pl-1 uppercase">
                    {item.description}
                  </td>
                  <td className="border pb-3 border-black">{item.hsn}</td>
                  <td className="border pb-3 border-black">{item.qty}</td>
                  <td className="border pb-3 border-black">{item.rate}</td>
                  <td className="border pb-3 border-black">{item.amount}</td>
                  <td className="border pb-3 border-black">
                    {item.taxableValue}
                  </td>
                  <td className="border pb-3 border-black">{item.igst}</td>
                  <td className="border pb-3 border-black">
                    {Number(item.total).toFixed(2)}
                  </td>
                </tr>
              ))}
              <tr className="h-full">
                <td colSpan="9"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SUMMARY */}
        <div className="border border-t-0 border-black w-full flex">
          <div className="flex gap-10 border-r border-black w-2/3 p-3 pt-0">
            <h2 className="text-xs font-semibold">
              {invoiceData?.currency || "USD"}
            </h2>
            <span>
              TOTAL VALUE: {invoiceData?.totalAmount?.toFixed(2) || "0.00"}
            </span>
          </div>
          <div className="flex flex-col w-1/3">
            <div className="flex justify-between border-b border-black p-3 pt-0">
              <h2 className="text-xs font-semibold">Add IGST :</h2>
              <span>{invoiceData?.igstAmount?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="flex justify-between p-3 pt-0">
              <h2 className="text-xs font-semibold">Total After Amount :</h2>
              <span>
                {(
                  (invoiceData?.totalAmount || 0) +
                  (invoiceData?.igstAmount || 0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="border flex border-black border-t-0 h-[19vh]">
        {/* Bank Details */}
        <div className="w-[35%] flex flex-col">
          <div className="border-b border-black p-3 pt-0">
            <h2 className="font-semibold text-center">Bank Details</h2>
          </div>
          <div className="border-b border-black p-3 pt-0">
            <h2 className="font-semibold text-left">Bank :</h2>
          </div>
          <div className="border-b border-black p-3 pt-0">
            <h2 className="font-semibold text-left">Bank A/C :</h2>
          </div>
          <div className="border-b border-black p-3 pt-0">
            <h2 className="font-semibold text-left">Bank IFSC :</h2>
          </div>
          <div className="p-3 pt-0">
            <h2 className="font-semibold text-left">Payment Terms :-</h2>
          </div>
        </div>

        {/* Seal */}
        <div className="border-l border-black w-[25%]">
          <div className="flex flex-col justify-between items-center w-full">
            <div className="h-[15.5vh]">&nbsp;</div>
            <div className="w-full flex justify-center items-start border-t border-black">
              <h2 className="font-semibold">Common Seal</h2>
            </div>
          </div>
        </div>

        {/* Signatory */}
        <div className="border-l flex flex-col justify-between border-black w-[40%]">
          <div className="flex justify-center items-center flex-col p-2 text-center">
            <span>
              Certified that the particulars given above are true and correct
            </span>
            <h2 className="font-semibold uppercase mt-1">REET SHREE</h2>
          </div>
          <div className="text-center">
            <h2 className="font-semibold text-xs pb-4">Authorised Signatory</h2>
          </div>
        </div>
      </div>
    </div>
  );
});
