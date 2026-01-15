import React from "react";

export const InvoiceContent = React.forwardRef(({ invoiceData }, ref) => {
  return (
    <div
      ref={ref}
      className="p-6 bg-white border border-black max-w-4xl mx-auto text-xs"
    >
      {/* Header */}
      <div className="text-center text-xl font-bold mb-2 border-black pb-2">
        INVOICE
      </div>

      {/* Top Section with 3 equal columns */}
      <div className="flex border border-black border-b-0">
        {/* Exporter Column */}
        <div className="flex-1 border-r border-black tracking-wide">
          <div className="p-2 h-[100px]">
            <div className="font-semibold mb-1 text-sm">Exporter</div>
            <div className="text-xs">
              <div>{invoiceData?.shipperName || ""}</div>
              <div>{invoiceData?.shipperAddress || ""}</div>
              <div>{invoiceData?.shipperCity || ""}</div>
              <div className="mt-2 mb-1">
                <span className="font-semibold">
                  {invoiceData?.shipperKycType || ""}&nbsp;&nbsp;
                </span>
                {invoiceData?.shipperAadhar || ""}
              </div>
            </div>
          </div>
          <div className="flex-1 border-black border-t mt-4">
            <div className="p-2">
              <div className="font-semibold mb-1">Consignee</div>
              <div className="text-xs h-[100px]">
                <div>{invoiceData?.consigneeName || ""}</div>
                <div>{invoiceData?.consigneeAddress || ""}</div>
                <div>{invoiceData?.consigneeCity || ""}</div>
                <div>{invoiceData?.consigneeState || ""}</div>
                <div>{invoiceData?.consigneePin || ""}</div>
                <div>{invoiceData?.consigneePhone || ""}</div>
              </div>
            </div>

            <div className="flex text-xs">
              <div className="w-full">
                <div className="flex-1 border border-l-0 border-black h-[60px] p-1">
                  <span className="font-semibold">Pre-Carriage by</span>
                  <div>{invoiceData?.preCarriageBy || ""}</div>
                </div>
                <div className="flex-1 border-r border-black h-[60px] p-1">
                  <span className="font-semibold">Vessel / Flight No.</span>
                  <div>{invoiceData?.flightNo || ""}</div>
                </div>
              </div>
              <div className="w-full">
                <div className="flex-1 border-b border-t border-black h-[60px] p-1">
                  <span className="font-semibold">
                    Place of Receipt by pre-carrier
                  </span>
                  <div>{invoiceData?.placeOfReceipt || ""}</div>
                </div>
                <div className="flex-1 border-black h-[60px] p-1">
                  <div className="font-semibold">Port of Loading</div>
                  <div>{invoiceData?.portOfLoading || ""}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AWB and Buyer's Order Column */}
        <div className="flex-1 border-black">
          <div className="flex text-xs">
            <div className="border-r border-b border-black p-2 w-1/2 h-[50px]">
              <span className="font-semibold">Awb No. and Date</span>
              <div>
                {invoiceData?.awbNo || ""}&nbsp;&nbsp;&nbsp;&nbsp;
                {invoiceData?.date || ""}
              </div>
            </div>
            <div className="flex-1 border-b border-black mt-2 ">
              <div className="font-semibold ml-4">
                <h2>Exporter Ref / Weight</h2>
                <p className="font-normal">{invoiceData?.weight || ""}</p>
              </div>
            </div>
          </div>
          <div className="mb-2 border-b border-black text-xs h-[40px] mt-2">
            <span className="font-semibold ml-2">
              Buyer’s order no. and date
            </span>
            <div>{invoiceData?.buyerOrderNo || ""}</div>
          </div>
          <div className="mb-2 border-b border-black text-xs h-[30px]">
            <span className="font-semibold ml-2">Other Reference (s)</span>
            <div>{invoiceData?.otherReference || ""}</div>
          </div>
          <div className="border-b border-black text-xs h-[70px]">
            <span className="font-semibold ml-2">
              Buyer (if other has consignee)
            </span>
            <div>{invoiceData?.buyerIfOther || ""}</div>
          </div>
          <div className="flex text-xs border-b border-black h-[80px]">
            <div className="flex-1 border-r p-2 border-black">
              <span className="font-semibold">Country of origin of goods</span>
              <div>{invoiceData?.countryOfOrigin || ""}</div>
            </div>
            <div className="flex-1 p-2">
              <span className="font-semibold">
                Country of final destination
              </span>
              <div>{invoiceData?.destination || ""}</div>
            </div>
          </div>
          <div className="flex-1 text-xs">
            <div className="font-semibold text-center p-2">
              Terms of delivery & Payment
              <span className="font-normal mt-2 block">
                {invoiceData?.terms || ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="h-[525px] border border-black">
        <style jsx>{`
          table {
            width: 100%;
            border-collapse: collapse;
          }
          td,
          th {
            vertical-align: middle; /* centers vertically */
            text-align: center;
            padding: 4px 6px; /* space around text */
            font-size: 0.65rem; /* smaller font (~10px) */
            line-height: 1.2;
          }
        `}</style>

        <table className="w-full text-xs text-center">
          <thead>
            <tr className="bg-gray-100">
              <th className=" text-left font-semibold border-black w-[98px]">
                Box No
              </th>
              <th className="border-l border-black text-left font-semibold">
                Description
              </th>
              <th className="border-l border-black text-center font-semibold">
                HSN
              </th>
              <th className="border-l border-black text-center font-semibold">
                Quantity
              </th>
              <th className="border-l border-black text-center font-semibold">
                Rates
              </th>
              <th className="border-l border-black text-center font-semibold">
                Amount
              </th>
            </tr>
          </thead>

          {/* ---------- modified section begins ---------- */}
          <tbody className="border-b border-black text-xs">
            {(() => {
              let prevBox = null;
              return (invoiceData?.items || []).map((item, idx) => {
                const rows = [];

                // add “Box – n” row when box changes
                if (item.boxNo !== prevBox) {
                  rows.push(
                    <tr key={`box-${item.boxNo}`} className="">
                      <td
                        colSpan={6}
                        className="text-center border-y border-black font-semibold"
                      >
                        Box – {item.boxNo} <br />
                        &nbsp;
                      </td>
                    </tr>
                  );
                  prevBox = item.boxNo;
                }

                // normal item row (unchanged layout)
                rows.push(
                  <tr key={idx} className="">
                    <td className="border-black text-center align-top leading-none">
                      {item.boxNo}
                    </td>
                    <td className=" border-black  text-left align-top leading-none">
                      {item.description}
                    </td>
                    <td className=" border-black text-center align-top leading-none">
                      {item.hsn}
                    </td>
                    <td className=" border-black text-center align-top leading-none">
                      {item.quantity}
                    </td>
                    <td className=" border-black  text-center align-top leading-none">
                      {item.rate}
                    </td>
                    <td className=" border-black text-center align-top leading-none">
                      {item.amount}
                    </td>
                    <br />
                    &nbsp;
                    <hr />
                  </tr>
                );

                return rows;
              });
            })()}
          </tbody>
          {/* ---------- modified section ends ---------- */}
        </table>
      </div>

      {/* Value Declaration and Total */}
      <div className="flex justify-between items-end border-t-0 border-black border p-1">
        <div className="text-xs">Value declared for custom purpose only.</div>
        <div className="text-right">
          <div className="flex justify-end w-32">
            <span className="mr-2 font-semibold">Total :</span>
            <span className="mr-1">{invoiceData?.currency || ""}</span>
            <span className="font-semibold">{invoiceData?.total || ""}</span>
          </div>
        </div>
      </div>
      <div className="h-[40px] border border-black border-y-0"></div>

      {/* Declaration */}
      <div className="border border-black">
        <div className="flex justify-between ">
          <div className="border-r border-black p-2">
            <div className="font-semibold mb-1">Declaration:</div>
            <div className="text-xs">
              {invoiceData?.declaration ||
                "The above mentioned items are not for commercial use and value declared only for custom purpose."}
            </div>
          </div>
          <div className="text-right font-semibold mt-10 text-xs p-2">
            <div>Signature / Date / Co stamp.</div>
          </div>
        </div>
      </div>
    </div>
  );
});
