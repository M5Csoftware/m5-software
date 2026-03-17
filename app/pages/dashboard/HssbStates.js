"use client";
import React, { useContext, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Dropdown } from "@/app/components/Dropdown";
import { useForm } from "react-hook-form";
import { TableRowSimple, TableWithTotal } from "@/app/components/Table";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { DateInputBox } from "@/app/components/InputBox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { SimpleButton } from "@/app/components/Buttons";
import { GlobalContext } from "@/app/lib/GlobalContext";
4;
import ExcelJS from "exceljs";
import saveAs from "file-saver";
import axios from "axios";
import dayjs from "dayjs";
import { MonthInput } from "@/app/components/MonthInput";

const parentHeaderStyle = {
  font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEA1B40" }, // Dark Red
  },
  alignment: { vertical: "middle", horizontal: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
};

const subHeaderStyle = {
  font: { bold: true, size: 10, color: { argb: "FF000000" } },
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFD966" }, // Yellow
  },
  alignment: { vertical: "middle", horizontal: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
};

const cellStyle = {
  font: { size: 10 },
  alignment: { vertical: "middle", horizontal: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
};

const totalStyle = {
  font: { bold: true, size: 10 },
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" }, // Light Gray
  },
  alignment: { vertical: "middle", horizontal: "center" },
  border: {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  },
};

// -----------------------------
// REGION ORDER (Correct Order from your file)
// -----------------------------

const REGION_ORDER = [
  "GRAND TOTAL",
  "AUSTRALIA",
  "BRANDED",
  "CANADA",
  "EUROPE",
  "FEDEX IE",
  "UK",
  "USA",
];

// ----------------------------
// Helper Functions
// ----------------------------

function monthLabel(ym) {
  const [year, month] = ym.split("-");
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[Number(month) - 1]} ${year}`;
}

function safeSheetName(name) {
  // Replace invalid characters
  let safeName = name.replace(/[\\/*?:[\]]/g, "");

  // Trim to 31 characters (Excel limit is 31)
  safeName = safeName.substring(0, 31);

  // Remove leading/trailing single quotes and spaces
  safeName = safeName.replace(/^['\s]+|['\s]+$/g, "");

  // Ensure name is not empty
  if (!safeName.trim()) {
    safeName = "Sheet1";
  }

  return safeName;
}

function setUniformWidth(sheet, width = 12) {
  sheet.columns.forEach((col) => (col.width = width));
}

// ----------------------------
// Build Master Sheet Headers (Matching your file)
// ----------------------------

// ----------------------------
// Build Master Sheet Headers (Matching your file)
// ----------------------------

function buildMasterHeaders(sheet, months) {
  // Clear any existing content in rows 2 and 3
  const row2 = sheet.getRow(2);
  const row3 = sheet.getRow(3);

  row2.values = [];
  row3.values = [];

  // Row 2: Main headers
  const fixedHeaders = [
    "S.NO",
    "Customer Code",
    "CUSTOMER NAME",
    "Type",
    "City",
    "State",
    "ServiceTaxOption",
    "Account",
    "GROUPING",
    "ALLOTED SALE PERSON",
  ];

  // Set fixed headers in row 2
  fixedHeaders.forEach((header, index) => {
    const cell = row2.getCell(index + 1);
    cell.value = header;
    Object.assign(cell.style, parentHeaderStyle);
  });

  // Set region headers and merge
  let colIndex = 11; // Start at column K

  REGION_ORDER.forEach((region) => {
    const regionCell = row2.getCell(colIndex);
    regionCell.value = region;
    Object.assign(regionCell.style, parentHeaderStyle);

    // Merge across months for this region
    const mergeEndCol = colIndex + months.length - 1;
    if (mergeEndCol >= colIndex) {
      sheet.mergeCells(2, colIndex, 2, mergeEndCol);
    }

    // Move to next region position
    colIndex += months.length + 1; // +1 for separator column
  });

  // Row 3: Sub-headers (Month names)
  // First 10 empty cells
  for (let i = 1; i <= 10; i++) {
    const cell = row3.getCell(i);
    cell.value = "";
    Object.assign(cell.style, subHeaderStyle);
  }

  // Month subheaders for each region
  colIndex = 11;

  REGION_ORDER.forEach((region) => {
    months.forEach((month, monthIndex) => {
      const cell = row3.getCell(colIndex + monthIndex);
      cell.value = monthLabel(month);
      Object.assign(cell.style, subHeaderStyle);
    });

    // Empty separator column
    const separatorCell = row3.getCell(colIndex + months.length);
    separatorCell.value = "";
    Object.assign(separatorCell.style, subHeaderStyle);

    colIndex += months.length + 1;
  });
}

// ----------------------------
// Insert Customer Rows
// ----------------------------

// ----------------------------
// Insert Customer Rows (Fixed)
// ----------------------------

function insertMasterCustomerRows(sheet, customers, months, startRow = 4) {
  let rowIndex = startRow;
  let serialNumber = 1;

  // Group customers by GROUPING
  const groupedCustomers = {};
  customers.forEach((customer) => {
    const group = customer.groupCode || customer.GROUPING || customer.grouping;
    if (!groupedCustomers[group]) {
      groupedCustomers[group] = [];
    }
    groupedCustomers[group].push(customer);
  });

  // Sort groups
  const sortedGroups = Object.keys(groupedCustomers).sort();

  sortedGroups.forEach((group, groupIndex) => {
    const groupCustomers = groupedCustomers[group];

    groupCustomers.forEach((customer, customerIndex) => {
      const row = sheet.getRow(rowIndex);

      // Basic customer info (use fallback fields)
      row.getCell(1).value = serialNumber++; // S.NO
      row.getCell(2).value =
        customer.code || customer.customerCode || customer.accountCode;
      row.getCell(3).value =
        customer.name || customer.CUSTOMER_NAME || customer.customerName;
      row.getCell(4).value =
        customer.type || customer.Type || customer.accountType;
      row.getCell(5).value = customer.city || customer.City;
      row.getCell(6).value = customer.state || customer.State;
      row.getCell(7).value =
        customer.serviceTaxOption ||
        customer.ServiceTaxOption ||
        customer.serviceTax ||
        customer.gst;
      row.getCell(8).value =
        customer.account || customer.Account || customer.accountStatus;
      row.getCell(9).value =
        customer.groupCode || customer.GROUPING || customer.grouping;
      row.getCell(10).value =
        customer.salesman ||
        customer.ALLOTED_SALE_PERSON ||
        customer.salesPersonName;

      // Apply cell style to basic info
      for (let col = 1; col <= 10; col++) {
        Object.assign(row.getCell(col).style, cellStyle);
      }

      // Fill monthly data for each region
      let colIndex = 11; // Start at column K

      REGION_ORDER.forEach((region) => {
        months.forEach((month) => {
          let value = 0;

          if (region === "GRAND TOTAL") {
            // Sum all regions for this month
            REGION_ORDER.slice(1).forEach((r) => {
              // Try multiple possible data structures
              if (
                customer.regions &&
                customer.regions[r] &&
                customer.regions[r][month]
              ) {
                value += customer.regions[r][month];
              } else if (customer[r] && customer[r][month]) {
                value += customer[r][month];
              }
            });
          } else {
            // Try multiple possible data structures
            if (
              customer.regions &&
              customer.regions[region] &&
              customer.regions[region][month]
            ) {
              value = customer.regions[region][month];
            } else if (customer[region] && customer[region][month]) {
              value = customer[region][month];
            } else if (customer.months && customer.months[month]) {
              // If no region breakdown, only use for GRAND TOTAL
              value = 0;
            }
          }

          const cell = row.getCell(colIndex);
          cell.value = value === 0 ? "" : Number(value.toFixed(3));
          Object.assign(cell.style, cellStyle);
          colIndex++;
        });

        // Empty separator column
        const separatorCell = row.getCell(colIndex);
        separatorCell.value = "";
        Object.assign(separatorCell.style, cellStyle);
        colIndex++;
      });

      rowIndex++;
    });

    // Add empty row after each group (except last)
    if (groupIndex < sortedGroups.length - 1) {
      rowIndex++;
    }
  });

  return rowIndex;
}

// ----------------------------
// Insert Total Row (Fixed to return next row)
// ----------------------------

function insertMasterTotalRow(sheet, rowIndex, customers, months) {
  const row = sheet.getRow(rowIndex);

  // Label
  row.getCell(1).value = "TOTAL";
  Object.assign(row.getCell(1).style, totalStyle);

  // Empty cells for basic info
  for (let col = 2; col <= 10; col++) {
    row.getCell(col).value = "";
    Object.assign(row.getCell(col).style, totalStyle);
  }

  // Calculate totals
  let colIndex = 11;

  REGION_ORDER.forEach((region) => {
    months.forEach((month) => {
      let total = 0;

      customers.forEach((customer) => {
        if (region === "GRAND TOTAL") {
          // Sum all regions for this month
          REGION_ORDER.slice(1).forEach((r) => {
            total += customer.regions?.[r]?.[month] || 0;
          });
        } else {
          total += customer.regions?.[region]?.[month] || 0;
        }
      });

      const cell = row.getCell(colIndex);
      cell.value = total === 0 ? "" : total;
      Object.assign(cell.style, totalStyle);
      colIndex++;
    });

    // Empty separator column
    const separatorCell = row.getCell(colIndex);
    separatorCell.value = "";
    Object.assign(separatorCell.style, totalStyle);
    colIndex++;
  });

  // Return the next row index (row after TOTAL)
  return rowIndex + 1;
}
// ----------------------------
// Build Master Sheet
// ----------------------------
// ----------------------------
// Build Master Sheet (With Inactive Customers)
// ----------------------------

// ----------------------------
// Build Master Sheet (With Inactive Customers After 3 Blank Rows)
// ----------------------------

export function buildMasterSheet(
  wb,
  masterCustomers,
  months,
  employees,
  employeeData
) {
  const sheet = wb.addWorksheet("MASTER", {
    views: [{ state: "frozen", ySplit: 3 }], // Freeze first 3 rows
  });

  // Build headers
  buildMasterHeaders(sheet, months);

  // First, separate active and inactive customers
  const { activeCustomers, inactiveCustomers } =
    separateActiveInactiveCustomers(
      masterCustomers,
      employees,
      employeeData,
      months
    );

  // console.log(
//     `DEBUG: Active customers: ${activeCustomers.length}, Inactive: ${inactiveCustomers.length}`
//   );

  // Insert active customer rows first
  let nextRow = insertMasterCustomerRows(sheet, activeCustomers, months, 4);

  // Insert total row (for active customers only)
  nextRow = insertMasterTotalRow(sheet, nextRow, activeCustomers, months);

  // Add inactive customers section after 3 blank rows (only if there are inactive customers)
  if (inactiveCustomers.length > 0) {
    addInactiveCustomersSection(sheet, inactiveCustomers, months, nextRow);
  }

  // Adjust column widths
  sheet.columns = [
    { width: 8 }, // A: S.NO
    { width: 10 }, // B: Customer Code
    { width: 35 }, // C: CUSTOMER NAME
    { width: 12 }, // D: Type
    { width: 15 }, // E: City
    { width: 12 }, // F: State
    { width: 15 }, // G: ServiceTaxOption
    { width: 10 }, // H: Account
    { width: 12 }, // I: GROUPING
    { width: 20 }, // J: ALLOTED SALE PERSON
    // Monthly columns will have default width
  ];

  return sheet;
}

// ----------------------------
// Helper: Separate Active and Inactive Customers
// ----------------------------

function separateActiveInactiveCustomers(
  masterCustomers,
  employees,
  employeeData,
  months
) {
  const activeCustomers = [];
  const inactiveCustomers = [];

  // Get all assigned customer codes
  const assignedCustomerCodes = new Set();

  employees.forEach((emp) => {
    const eid = emp.userId;
    const empCustomers = employeeData[eid] || [];
    empCustomers.forEach((customer) => {
      assignedCustomerCodes.add(
        customer.code || customer.customerCode || customer.accountCode
      );
    });
  });

  // Categorize each customer
  masterCustomers.forEach((customer) => {
    const customerCode =
      customer.code || customer.customerCode || customer.accountCode;

    // Check if customer is assigned to any employee
    const isAssigned = assignedCustomerCodes.has(customerCode);

    if (!isAssigned) {
      // Not assigned to any employee - include in active but mark somehow
      activeCustomers.push(customer);
      return;
    }

    // Check if customer had any sales
    let hadSales = false;

    months.forEach((month) => {
      REGION_ORDER.slice(1).forEach((region) => {
        if (customer.regions?.[region]?.[month] > 0) {
          hadSales = true;
        }
      });
    });

    if (hadSales) {
      activeCustomers.push(customer);
    } else {
      inactiveCustomers.push(customer);
    }
  });

  return { activeCustomers, inactiveCustomers };
}

// ----------------------------
// Helper: Add Inactive Customers Section
// ----------------------------

// ----------------------------
// Helper: Add Inactive Customers Section (After 3 Blank Rows)
// ----------------------------

function addInactiveCustomersSection(
  sheet,
  inactiveCustomers,
  months,
  startRow
) {
  let rowIndex = startRow;

  // Add 3 blank rows after TOTAL
  for (let i = 0; i < 3; i++) {
    const blankRow = sheet.getRow(rowIndex++);
    for (let col = 1; col <= 10; col++) {
      blankRow.getCell(col).value = "";
    }
  }

  // Add "INACTIVE CUSTOMERS" header (merged across first 10 columns)
  sheet.mergeCells(rowIndex, 1, rowIndex, 10);
  const headerRow = sheet.getRow(rowIndex++);
  headerRow.getCell(1).value =
    "INACTIVE CUSTOMERS (No shipments in date range)";
  headerRow.getCell(1).font = {
    bold: true,
    color: { argb: "FFFF0000" },
    size: 11,
  }; // Red text
  headerRow.getCell(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFCCCC" }, // Light red background
  };
  headerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

  // Add inactive customers table header (only first 10 columns)
  const tableHeaderRow = sheet.getRow(rowIndex++);
  tableHeaderRow.values = [
    "S.NO",
    "Customer Code",
    "CUSTOMER NAME",
    "Type",
    "City",
    "State",
    "ServiceTaxOption",
    "Account",
    "GROUPING",
    "ALLOTED SALE PERSON",
  ];

  // Style the table header
  tableHeaderRow.eachCell((c, colNumber) => {
    if (colNumber <= 10) {
      c.font = { bold: true };
      c.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD9D9D9" }, // Light gray header
      };
      c.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      c.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  // Insert inactive customer rows (only first 10 columns)
  let serialNumber = 1;

  // Group inactive customers
  const groupedInactive = {};
  inactiveCustomers.forEach((customer) => {
    const group =
      customer.groupCode ||
      customer.GROUPING ||
      customer.grouping ||
      "UNGROUPED";
    if (!groupedInactive[group]) {
      groupedInactive[group] = [];
    }
    groupedInactive[group].push(customer);
  });

  const sortedGroups = Object.keys(groupedInactive).sort();

  sortedGroups.forEach((group, groupIndex) => {
    const groupCustomers = groupedInactive[group];

    groupCustomers.forEach((customer) => {
      const row = sheet.getRow(rowIndex);

      // Only fill first 10 columns
      row.getCell(1).value = serialNumber++;
      row.getCell(2).value =
        customer.code || customer.customerCode || customer.accountCode || "";
      row.getCell(3).value =
        customer.name || customer.CUSTOMER_NAME || customer.customerName || "";
      row.getCell(4).value =
        customer.type || customer.Type || customer.accountType || "";
      row.getCell(5).value = customer.city || customer.City || "";
      row.getCell(6).value = customer.state || customer.State || "";
      row.getCell(7).value =
        customer.serviceTaxOption ||
        customer.ServiceTaxOption ||
        customer.serviceTax ||
        customer.gst ||
        "";
      row.getCell(8).value =
        customer.account || customer.Account || customer.accountStatus || "";
      row.getCell(9).value =
        customer.groupCode || customer.GROUPING || customer.grouping || "";
      row.getCell(10).value =
        customer.salesman ||
        customer.ALLOTED_SALE_PERSON ||
        customer.salesPersonName ||
        "";

      // Apply style to first 10 columns
      for (let col = 1; col <= 10; col++) {
        Object.assign(row.getCell(col).style, {
          border: {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          },
          alignment: { horizontal: "left", vertical: "middle" },
          fill: {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" }, // Light gray for inactive
          },
          font: {
            size: 10,
            color: { argb: "FF666666" }, // Gray text
            italic: true,
          },
        });
      }

      // Leave columns 11+ empty (no monthly data for inactive)

      rowIndex++;
    });

    // Add empty row after each group (except last)
    if (groupIndex < sortedGroups.length - 1) {
      rowIndex++;
    }
  });

  return rowIndex;
}

// ----------------------------
// Build Employee Sheets (With Inactive Customers After 3 Blank Rows)
// ----------------------------

export function buildEmployeeSheets(wb, employees, employeeData, months) {
  const usedSheetNames = new Set(["MASTER", "SUMMARY"]);

  employees.forEach((emp, index) => {
    const eid = emp.userId;
    let sheetName;

    // Create unique sheet name
    const namingStrategies = [
      () => safeSheetName(`${emp.userName || emp.empName} (${eid})`),
      () => safeSheetName(`Emp_${eid}`),
      () => safeSheetName(`Employee_${index + 1}_${eid}`),
    ];

    for (const strategy of namingStrategies) {
      sheetName = strategy();
      if (!usedSheetNames.has(sheetName)) break;
    }

    if (usedSheetNames.has(sheetName)) {
      sheetName = safeSheetName(
        `Emp_${eid}_${Date.now().toString().slice(-4)}`
      );
    }

    usedSheetNames.add(sheetName);
    const allEmpCustomers = employeeData[eid] || [];

    // Separate active and inactive customers for this employee
    const { activeCustomers, inactiveCustomers } =
      separateEmployeeActiveInactiveCustomers(allEmpCustomers, months);

    // console.log(
//       `DEBUG: Employee ${emp.userName} - Active: ${activeCustomers.length}, Inactive: ${inactiveCustomers.length}`
//     );

    const sheet = wb.addWorksheet(sheetName, {
      views: [{ state: "frozen", ySplit: 3 }],
    });

    // Build headers
    buildMasterHeaders(sheet, months);

    // Insert active customer rows first
    let nextRow = insertMasterCustomerRows(sheet, activeCustomers, months, 4);

    // Insert total row (for active customers only)
    nextRow = insertMasterTotalRow(sheet, nextRow, activeCustomers, months);

    // Add inactive customers section after 3 blank rows (only if there are inactive customers)
    if (inactiveCustomers.length > 0) {
      addInactiveCustomersSection(sheet, inactiveCustomers, months, nextRow);
    }

    // Adjust column widths
    sheet.columns = [
      { width: 8 },
      { width: 10 },
      { width: 35 },
      { width: 12 },
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 10 },
      { width: 12 },
      { width: 20 },
    ];
  });
}

// ----------------------------
// Helper: Separate Employee's Active and Inactive Customers
// ----------------------------

function separateEmployeeActiveInactiveCustomers(employeeCustomers, months) {
  const activeCustomers = [];
  const inactiveCustomers = [];

  employeeCustomers.forEach((customer) => {
    let hadSales = false;

    months.forEach((month) => {
      REGION_ORDER.slice(1).forEach((region) => {
        if (customer.regions?.[region]?.[month] > 0) {
          hadSales = true;
        }
      });
    });

    if (hadSales) {
      activeCustomers.push(customer);
    } else {
      inactiveCustomers.push(customer);
    }
  });

  return { activeCustomers, inactiveCustomers };
}
// ----------------------------
// Build State Summary Sheet
// ----------------------------

// ----------------------------
// Build State Summary Sheet (Fixed with real data)
// ----------------------------

// ----------------------------
// Build State Summary Sheet (With Inactive Customers Section)
// ----------------------------

// ----------------------------
// Build State Summary Sheet (Sales Performance Only)
// ----------------------------

function buildStateSummarySheet(
  wb,
  state,
  months,
  stateTotals,
  employees,
  employeeData
) {
  const sheet = wb.addWorksheet("SUMMARY");

  // Title
  sheet.mergeCells("A1", "H1");
  const h = sheet.getCell("A1");
  h.value = `STATE SUMMARY — ${state}`;
  h.font = { bold: true, size: 14 };
  h.alignment = { horizontal: "center", vertical: "middle" };

  // Header row - Show months
  const header = sheet.getRow(3);
  header.values = ["MONTH", ...months.map(monthLabel)];
  header.font = { bold: true };
  header.eachCell((c) => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFD966" }, // Yellow
    };
    c.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    c.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Calculate employee totals
  const employeeTotals = {};

  // Initialize structure
  employees.forEach((emp) => {
    const eid = emp.userId;
    employeeTotals[eid] = {
      name: emp.userName || emp.empName || emp.userId,
      monthlyTotals: {},
    };

    // Initialize all months to 0
    months.forEach((month) => {
      employeeTotals[eid].monthlyTotals[month] = 0;
    });
  });

  // Sum up each employee's sales from their customers
  employees.forEach((emp) => {
    const eid = emp.userId;
    const empCustomers = employeeData[eid] || [];

    empCustomers.forEach((customer) => {
      months.forEach((month) => {
        // Sum all regions for this month
        let monthTotal = 0;
        REGION_ORDER.slice(1).forEach((region) => {
          // Skip GRAND TOTAL
          monthTotal += customer.regions?.[region]?.[month] || 0;
        });
        employeeTotals[eid].monthlyTotals[month] += monthTotal;
      });
    });
  });

  // Add employee rows
  let row = 4;

  employees.forEach((emp) => {
    const eid = emp.userId;
    const empData = employeeTotals[eid];

    if (!empData) return;

    const empRow = sheet.getRow(row++);
    empRow.values = [empData.name];

    months.forEach((month, idx) => {
      const value = empData.monthlyTotals[month] || 0;
      empRow.getCell(idx + 2).value = value === 0 ? "" : value;
    });

    empRow.eachCell((c) => {
      c.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      c.alignment = { horizontal: "center", vertical: "middle" };
    });
  });

  // Add TOTAL row (Sum of all employees)
  const totalRow = sheet.getRow(row);
  totalRow.values = ["TOTAL"];

  months.forEach((month, idx) => {
    let monthTotal = 0;

    // Sum all employees for this month
    employees.forEach((emp) => {
      const eid = emp.userId;
      monthTotal += employeeTotals[eid]?.monthlyTotals[month] || 0;
    });

    totalRow.getCell(idx + 2).value = monthTotal === 0 ? "" : monthTotal;
  });

  totalRow.eachCell((c) => {
    c.font = { bold: true };
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF2F2F2" }, // Light Gray
    };
    c.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
    c.alignment = { horizontal: "center", vertical: "middle" };
  });

  // Adjust column widths
  sheet.columns = [
    { width: 25 }, // Employee names
    ...months.map(() => ({ width: 15 })), // Month columns
  ];
}

export async function downloadStateHSSB(data) {
  // console.log("=== DEBUG: START downloadStateHSSB ===");

  const {
    state,
    months,
    masterCustomers,
    employeeCustomers,
    employees,
    stateTotals,
  } = data;

  // Validate data
  if (!months || months.length === 0) {
    alert("No months data available. Please check your date range.");
    return;
  }

  if (!masterCustomers || masterCustomers.length === 0) {
    alert("No customer data available for the selected state and date range.");
    return;
  }

  if (!employees || employees.length === 0) {
    alert("No employees found for this state.");
    return;
  }

  const wb = new ExcelJS.Workbook();

  try {
    // 1) SUMMARY sheet (Sales performance only)
    // console.log("Creating SUMMARY sheet...");
    buildStateSummarySheet(
      wb,
      state,
      months,
      stateTotals,
      employees,
      employeeCustomers
    );

    // 2) MASTER sheet (With inactive customers section)
    // console.log("Creating MASTER sheet with inactive customers...");
    buildMasterSheet(wb, masterCustomers, months, employees, employeeCustomers);

    // 3) EMPLOYEE sheets (With inactive customers section)
    // console.log("Creating EMPLOYEE sheets with inactive customers...");
    buildEmployeeSheets(wb, employees, employeeCustomers, months);

    // 4) Prepare download
    // console.log("Generating Excel file...");
    const buffer = await wb.xlsx.writeBuffer();

    const fileName = `HSSB-${state}-${months[0]}-to-${
      months[months.length - 1]
    }.xlsx`;

    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      fileName
    );

    // console.log(`File "${fileName}" downloaded successfully!`);
  } catch (error) {
    console.error("Error generating Excel:", error);
    alert(`Error generating Excel file: ${error.message}`);
  }
}
