"use client";
import React, { useContext, useEffect, useState } from "react";
import { DropdownOptionOnly, LabeledDropdown } from "../Dropdown";
import { useForm } from "react-hook-form";
import { DateInputBox } from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { RedCheckbox } from "../Checkbox";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { TableWithSorting } from "../Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
function PaymentReport({
  isOpen,
  onClose,
  customerCode,
  showNotification,
  leftOverBalance,
}) {
  const { register, setValue, handleSubmit, watch } = useForm({
    defaultValues: {
      mode: "",
      receiptType: "",
    },
  });

  const [allData, setAllData] = useState([]); // store all fetched data
  const [mode, setMode] = useState("");
  const [receiptType, setReceiptType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [useDateFilter, setUseDateFilter] = useState(true);
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const columns = [
    { key: "receiptNo", label: "Receipt No." },
    { key: "customerCode", label: "Customer Code" },
    { key: "customerName", label: "Customer Name" },
    { key: "branchCode", label: "Branch Code" },
    { key: "branchName", label: "Branch Name" },
    { key: "amount", label: "Amount" },
    { key: "mode", label: "Mode" },
    { key: "chequeNo", label: "Cheque No." },
    { key: "bankName", label: "Bank Name" },
    { key: "receiptType", label: "Receipt Type" },
    { key: "debitNo", label: "Debit No." },
    { key: "debitAmount", label: "Debit Amount" },
    { key: "creditNo", label: "Credit No." },
    { key: "creditAmount", label: "Credit Amount" },
    { key: "date", label: "Date" },
    { key: "remarks", label: "Remarks" },
    { key: "verifyRemarks", label: "Verifying Remarks" },
    { key: "verified", label: "Verified Status" },
  ];

  const totalReceipt = rowData.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );
  const totalDebit = rowData.reduce(
    (sum, item) => sum + (parseFloat(item.debitAmount) || 0),
    0
  );
  const totalCredit = rowData.reduce(
    (sum, item) => sum + (parseFloat(item.creditAmount) || 0),
    0
  );

  // Example: fetch balance when fetching payment data
  useEffect(() => {
    if (!isOpen || !customerCode) return;

    const fetchData = async () => {
      try {
        const res = await axios.get(
          `${server}/payment-entry/customer?customerCode=${encodeURIComponent(
            customerCode
          )}`
        );
        setRowData(res.data);
        setAllData(res.data);

        // fetch leftover balance from customer account
        const balanceRes = await axios.get(
          `${server}/customer/balance?customerCode=${encodeURIComponent(
            customerCode
          )}`
        );
      } catch (err) {
        console.error("Failed to fetch payment data", err);
        setRowData([]);
        setAllData([]);
      }
    };

    fetchData();
  }, [isOpen, customerCode, server]);

  useEffect(() => {
    if (!isOpen || !customerCode) return;

    const fetchData = async () => {
      try {
        // Always fetch all payments for the given customerCode
        const res = await axios.get(
          `${server}/payment-entry/customer?customerCode=${encodeURIComponent(
            customerCode
          )}`
        );
        // Update the table data
        setRowData(res.data);
        setAllData(res.data);
        // console.log("Auto-fetched payment entries:", res.data);
      } catch (err) {
        console.error("Failed to fetch payment data", err);
        setRowData([]);
        setAllData([]);
      }
    };

    fetchData();
  }, [isOpen, customerCode, server]);

  if (!isOpen) return null;

  const handleShow = () => {
    if (!customerCode) {
      showNotification("error", "Please Enter the Customer Code first");
      return;
    }
    const formValues = {
      mode: watch("mode") || "",
      receiptType: watch("receiptType") || "",
      fromDate: watch("fromDate") || "",
      toDate: watch("toDate") || "",
    };

    let filtered = [...allData];

    if (formValues.mode) {
      filtered = filtered.filter(
        (item) =>
          item.mode?.trim().toLowerCase() ===
          formValues.mode.trim().toLowerCase()
      );
    }

    if (formValues.receiptType) {
      filtered = filtered.filter(
        (item) =>
          item.receiptType?.trim().toLowerCase() ===
          formValues.receiptType.trim().toLowerCase()
      );
    }

    if (useDateFilter) {
      if (formValues.fromDate)
        filtered = filtered.filter(
          (item) => new Date(item.date) >= new Date(formValues.fromDate)
        );
      if (formValues.toDate)
        filtered = filtered.filter(
          (item) => new Date(item.date) <= new Date(formValues.toDate)
        );
    }

    setRowData(filtered);
  };

  const handleDownloadExcel = async () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data available to download");
      return;
    }

    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Payment Report", {
        views: [{ state: "frozen", ySplit: 1 }],
      });

      // build header from your columns array
      const headerRow = columns.map((c) => ({
        header: c.label,
        key: c.key,
        width:
          c.label.length < 12
            ? 16
            : c.label.length < 20
            ? 24
            : Math.min(c.label.length + 8, 40),
      }));
      ws.columns = headerRow;

      // style header: red background, white bold text, centered
      const header = ws.getRow(1);
      header.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDC2626" }, // red
        };
        cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 12 };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      ws.properties.defaultRowHeight = 18;

      // push rows (map to ensure order matches columns)
      rowData.forEach((r) => {
        const rowObj = {};
        columns.forEach((c) => {
          // convert undefined to empty string, preserve numbers
          const val =
            r[c.key] === undefined || r[c.key] === null ? "" : r[c.key];
          // Convert Date strings to Date objects where appropriate
          if (c.key === "date" && val) {
            const d = new Date(val);
            rowObj[c.key] = isNaN(d.getTime()) ? val : d;
          } else {
            rowObj[c.key] = val;
          }
        });
        ws.addRow(rowObj);
      });

      // style data rows: small padding, number format for amount fields
      const numberKeys = ["amount", "debitAmount", "creditAmount"];
      ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        row.alignment = {
          vertical: "middle",
          horizontal: "left",
          wrapText: true,
        };
        row.eachCell((cell, colNumber) => {
          const key = ws.getColumn(colNumber).key;
          if (numberKeys.includes(key)) {
            // try numeric conversion
            if (cell.value !== "" && !isNaN(Number(cell.value))) {
              cell.value = Number(cell.value);
              cell.numFmt = "#,##0.00";
              cell.alignment = { horizontal: "right", vertical: "middle" };
            }
          }
        });
      });

      // add border around the table for neatness
      const lastRow = ws.lastRow.number;
      const lastCol = ws.columns.length;
      for (let r = 1; r <= lastRow; r++) {
        for (let c = 1; c <= lastCol; c++) {
          const cell = ws.getCell(r, c);
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        }
      }

      // auto-width improvement: ensure min widths for readability
      ws.columns.forEach((col) => {
        if (!col.width || col.width < 12) col.width = 12;
      });

      // write file and trigger download
      const buf = await wb.xlsx.writeBuffer();
      const fileName = `Payment_Report_${customerCode || "All"}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      saveAs(new Blob([buf]), fileName);

      showNotification("success", "Excel downloaded");
    } catch (err) {
      console.error("Excel export failed", err);
      showNotification("error", "Failed to export Excel");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-start overflow-auto p-2">
        <div className="bg-white w-full h-full p-20 rounded-lg relative flex flex-col">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-2xl font-bold text-gray-600 hover:text-black"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold mb-6">Payment Report</h2>

          {/* Filters */}
          <div className="flex gap-4 mb-4">
              <LabeledDropdown
                options={[
                  "Cash",
                  "Cheque",
                  "DD",
                  "RTGS",
                  "NEFT",
                  "IMPS",
                  "Demand Draft",
                  "Overseas (COD)",
                ]}
                title="Mode"
                value="mode" // string key for react-hook-form
                register={register} // ✅ provide the actual register function
                setValue={setValue} // ✅ provide the setValue function
                onChange={(val) => setMode(val)}
              />

              <LabeledDropdown
                options={[
                  "General Entry",
                  "Debit Note",
                  "Credit Note",
                  "TDS",
                  "Return",
                  "Bad Debts",
                  "Other",
                ]}
                title="Receipt Type"
                value="receiptType"
                register={register}
                setValue={setValue}
                onChange={(val) => setReceiptType(val)}
              />

                <DateInputBox
                  placeholder="From"
                  value="fromDate"
                  register={register}
                  setValue={setValue}
                  initialValue={fromDate}
                  onChange={(val) => setFromDate(val)}
                />

                <DateInputBox
                  placeholder="To"
                  value="toDate"
                  register={register}
                  setValue={setValue}
                  initialValue={toDate}
                  onChange={(val) => setToDate(val)}
                />
            <div className="w-[200px]">
              <OutlinedButtonRed label={`Show`} onClick={handleShow} />{" "}
            </div>
            <div className="w-[175px]">
              <SimpleButton name={`Download`} onClick={handleDownloadExcel} />
            </div>
          </div>

          <div className="flex justify-between">
            <div className="mb-4 ml-1 w-[500px]">
              <RedCheckbox
                id="useDateFilter"
                label="(YYYYMMDD) Date"
                isChecked={useDateFilter} // current value
                setChecked={setUseDateFilter} // setter
                register={register} // for react-hook-form
                setValue={setValue} // for react-hook-form
              />
            </div>
          </div>

          {/* Table */}

          <div className="mb-10">
            <div className="bg-white relative">
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <h2 className="text-sm text-[#000] tracking-wider mr-2 bg-[#D0D5DD] py-[1px] px-2 rounded">
                  {!customerCode
                    ? "Enter Customer Code first to view the report!"
                    : rowData.length === 0
                    ? "No payment records found for this customer"
                    : ""}
                </h2>
              </div>
              <TableWithSorting
                name="paymentReportTable"
                columns={columns}
                rowData={rowData}
                register={register}
                setValue={setValue}
                className="h-[55vh] rounded-b-none border-[#D0D5DD] border-opacity-75 border-[1.5] border-b-0"
              />
              <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16">
                <div>
                  <span className="font-sans">Balance :</span>
                  <span className="text-red">
                    {" "}
                    ₹ {leftOverBalance?.toFixed(2)}{" "}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex gap-16">
                    <div>
                      Receipt Amt :{" "}
                      <span className="text-red">
                        {totalReceipt.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      Debit Amt :{" "}
                      <span className="text-red">{totalDebit.toFixed(2)}</span>
                    </div>
                    <div>
                      Credit Amt :{" "}
                      <span className="text-red">{totalCredit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default PaymentReport;
