import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export const exportCodeList = (data, name) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const dataBlob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, "0")}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${now.getFullYear()}`;

  saveAs(dataBlob, `${name}_Checklist_${timestamp}.xlsx`);
};

export const exportAccountLedgerData = async (
  rowData,
  customerCode,
  openingBalance,
  totalBalance
) => {
  if (!rowData || rowData.length === 0) {
    alert("No data to export!");
    return;
  }

  const headers = Object.keys(rowData[0]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Account Ledger");

  // ============================
  // HEADER ROW (Row 1)
  // ============================
  const headerRow = sheet.addRow(headers);

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCC0000" }, // red
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // white bold text
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // ============================
  // OPENING BALANCE ROW (Row 2)
  // ============================
  const openingRow = sheet.addRow([`Opening Balance: ${openingBalance}`]);

  // merge full row
  sheet.mergeCells(2, 1, 2, headers.length);

  openingRow.getCell(1).alignment = { horizontal: "right" };
  openingRow.getCell(1).font = { bold: true };

  // BORDER for merged row
  openingRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // ============================
  // BODY ROWS
  // ============================
  rowData.forEach((item) => {
    const row = sheet.addRow(headers.map((h) => item[h] ?? ""));

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // ============================
  // TOTAL ROW
  // ============================
  const totalRow = sheet.addRow(
    headers.map((key) => {
      if (key === "ReferenceNo") return "Total";
      if (key === "RemainingBalance") return totalBalance;
      return "";
    })
  );

  totalRow.font = { bold: true };

  totalRow.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { horizontal: "center" };
  });

  // ============================
  // AUTO-FIT COLUMN WIDTHS
  // ============================
  sheet.columns.forEach((col) => {
    let maxLength = 0;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const v = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, v.length);
    });
    col.width = maxLength < 15 ? 15 : maxLength + 2;
  });

  // ============================
  // EXPORT FILE
  // ============================
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    `AccountLedger_${customerCode || "unknown"}.xlsx`
  );
};
