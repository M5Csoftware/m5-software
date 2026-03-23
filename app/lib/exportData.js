import { saveAs } from "file-saver";

const formatExcelDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr; // Return original if invalid
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const exportCodeList = async (data, name, columns) => {
  if (!data || data.length === 0) {
    alert("No data to export!");
    return;
  }

  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(name || "Data");

  // If columns are not provided (fallback), use keys from the first data object
  const exportColumns = columns || Object.keys(data[0]).map(key => ({ key, label: key }));

  // ============================
  // HEADER ROW
  // ============================
  const headerRow = sheet.addRow(exportColumns.map(col => col.label));

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" }, // Light gray
    };
    cell.font = { bold: true, color: { argb: "FF000000" } }; // black bold text
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // ============================
  // BODY ROWS
  // ============================
  data.forEach((item) => {
    const row = sheet.addRow(
      exportColumns.map((col) => {
        const val = item[col.key] ?? "";
        if (typeof val === "boolean") return val ? "Yes" : "No";
        if (typeof val === "object") return JSON.stringify(val);
        return val;
      })
    );

    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
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
    col.width = maxLength < 10 ? 12 : Math.min(maxLength + 2, 50);
  });

  // ============================
  // EXPORT FILE
  // ============================
  const buffer = await workbook.xlsx.writeBuffer();
  const now = new Date();
  const timestamp = `${String(now.getDate()).padStart(2, "0")}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}-${now.getFullYear()}`;

  saveAs(
    new Blob([buffer], { type: "application/octet-stream" }),
    `${name}_${timestamp}.xlsx`,
  );
};

export const exportAccountLedgerData = async (
  rowData,
  customerCode,
  openingBalance,
  totalBalance,
) => {
  if (!rowData || rowData.length === 0) {
    alert("No data to export!");
    return;
  }

  const headers = Object.keys(rowData[0]);

  const ExcelJS = (await import("exceljs")).default;
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
    const row = sheet.addRow(
      headers.map((h) => {
        const val = item[h] ?? "";
        if ((h === "Date" || h === "date") && val) {
          return formatExcelDate(val);
        }
        return val;
      }),
    );

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
    }),
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
    `AccountLedger_${customerCode || "unknown"}.xlsx`,
  );
};
