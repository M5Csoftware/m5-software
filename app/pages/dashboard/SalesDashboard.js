"use client";

import React, { useContext, useEffect, useState } from "react";
import { TargetCard } from "./SalesDashboardTargetCard";
import UserCountCard from "./SalesDashboardUserCountCard";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { useForm } from "react-hook-form";
import { SimpleButton } from "@/app/components/Buttons";
import DashboardTopListCard from "./DashboardTopListCard";
import DashboardProgressBar from "./DashboardProgressBar";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { MonthInput } from "@/app/components/MonthInput";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useAuth } from "@/app/Context/AuthContext";
import LoaderAnimation from "@/app/components/Loader";
import DashboardSummaryCard from "./DashboardSummaryCard";
import DashboardHoldReport from "./DashboardHoldReport";

function SalesDashboard() {
  const defaultSectorWiseData = {
    "Last 7 Days": [
      { label: "UK", value: 0 },
      { label: "USA", value: 0 },
      { label: "AUSTRALIA", value: 0 },
      { label: "EUROPE", value: 0 },
      { label: "CANADA", value: 0 },
      { label: "New Zealand", value: 0 },
    ],
    "Last 30 Days": [
      { label: "UK", value: 0 },
      { label: "USA", value: 0 },
      { label: "AUSTRALIA", value: 0 },
      { label: "EUROPE", value: 0 },
      { label: "CANADA", value: 0 },
      { label: "New Zealand", value: 0 },
    ],
    "Last Year": [
      { label: "UK", value: 0 },
      { label: "USA", value: 0 },
      { label: "AUSTRALIA", value: 0 },
      { label: "EUROPE", value: 0 },
      { label: "CANADA", value: 0 },
      { label: "New Zealand", value: 0 },
    ],
  };
  const defaultServiceWiseData = {
    "Last 7 Days": [],
    "Last 30 Days": [],
    "Last Year": [],
  };

  const { server } = useContext(GlobalContext);
  const [topCustomersData, setTopCustomersData] = useState({});
  const [accountStatusData, setAccountStatusData] = useState([]);
  const [sectorWiseData, setSectorWiseData] = useState(defaultSectorWiseData);
  const [serviceWiseData, setServiceWiseData] = useState(
    defaultServiceWiseData
  );
  const [loading, setLoading] = useState(true);
  const { register, setValue, handleSubmit } = useForm();

  // Fetch service-wise data
  const fetchServiceWiseData = async () => {
    try {
      // Get user object from localStorage
      const userStr = localStorage.getItem("user");

      if (!userStr) {
        console.error("No user found in localStorage");
        setLoading(false);
        return;
      }

      // Parse the user object
      const user = JSON.parse(userStr);
      const userId = user.userId;

      console.log("🔍 Retrieved userId:", userId);

      if (!userId) {
        console.error("No userId found in user object");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${server}/dashboard/sales-dashboard/service-wise`,
        {
          userId,
        }
      );

      console.log("📦 Response from API:", response.data);

      if (response.data) {
        setServiceWiseData(response.data);
      }
    } catch (error) {
      console.error("Error fetching service-wise data:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchSectorWiseData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user) return;

      const response = await axios.post(
        `${server}/dashboard/sales-dashboard/sector-wise`,
        { userId: user.userId }
      );

      setSectorWiseData(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAccountStatus = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const res = await axios.post(
        `${server}/dashboard/sales-dashboard/account-status`,
        { userId: user.userId }
      );

      setAccountStatusData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchServiceWiseData();
    fetchSectorWiseData();
    fetchAccountStatus();
  }, []);

  const { user } = useAuth();

  async function getLatestState(userId, from, to, server) {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Convert "2025-09" to correct "September-2025"
    function toTargetMonthFormat(ym) {
      const [y, m] = ym.split("-").map(Number);
      return `${monthNames[m - 1]}-${y}`;
    }

    // Build list of months inside selected range
    function monthList(from, to) {
      let [fy, fm] = from.split("-").map(Number);
      let [ty, tm] = to.split("-").map(Number);

      const out = [];
      while (fy < ty || (fy === ty && fm <= tm)) {
        out.push(`${fy}-${String(fm).padStart(2, "0")}`);
        fm++;
        if (fm === 13) {
          fm = 1;
          fy++;
        }
      }
      return out;
    }

    const months = monthList(from, to);

    // Start from latest → backwards
    for (let i = months.length - 1; i >= 0; i--) {
      const ym = months[i];
      const targetMonth = toTargetMonthFormat(ym);

      const res = await fetch(
        `${server}/hssb-report/get-sales?user=${userId}&month=${targetMonth}`
      );

      if (!res.ok) continue;

      const data = await res.json();
      if (data && data.stateAssigned) {
        return data.stateAssigned; // FOUND
      }
    }

    // fallback
    return "State Report";
  }

  const downloadHSSB = async (from, to, userId) => {
    setLoading(true);

    try {
      // 1) Get first-sheet summary data
      const res = await fetch(
        `${server}/hssb-report?from=${from}&to=${to}&user=${userId}`
      );
      const summary = await res.json();

      const { salesperson, monthly } = summary;
      const months = Object.keys(monthly).sort();

      if (months.length === 0) {
        alert("No sales data found for selected period.");
        return;
      }

      // 2) Get dynamic state name
      const stateName = await getLatestState(userId, from, to, server);

      // 3) Get full customer-region report
      const res2 = await fetch(
        `${server}/hssb-report/full?from=${from}&to=${to}&user=${userId}`
      );
      const full = await res2.json();

      if (!full || !full.months || !Array.isArray(full.months)) {
        alert("Missing detailed data for second sheet.");
        return;
      }

      const months2 = full.months;
      const customers = full.customers;

      // Group customers by groupCode
      const groupedCustomers = {};
      customers.forEach((cust) => {
        const groupCode = cust.groupCode; // Use customer code if no groupCode
        if (!groupedCustomers[groupCode]) {
          groupedCustomers[groupCode] = [];
        }
        groupedCustomers[groupCode].push(cust);
      });

      // Sort groups and create flat array with blank rows
      const sortedGroupCodes = Object.keys(groupedCustomers).sort();
      const customersWithBlanks = [];

      sortedGroupCodes.forEach((groupCode, index) => {
        // Add all customers in this group
        groupedCustomers[groupCode].forEach((cust) => {
          customersWithBlanks.push(cust);
        });

        // Add blank row after each group (except the last one)
        if (index < sortedGroupCodes.length - 1) {
          customersWithBlanks.push(null); // null represents a blank row
        }
      });

      // ---------------------------
      // Workbook + Styles
      // ---------------------------
      const workbook = new ExcelJS.Workbook();
      const sheet1 = workbook.addWorksheet("HSSB Report");
      const sheet2 = workbook.addWorksheet(stateName);

      // Updated styles with left alignment for headers
      const parentHeaderStyle = {
        font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEA1B40" },
        },
        alignment: { vertical: "middle", horizontal: "left", indent: 1 },
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
          fgColor: { argb: "FFFFD966" },
        },
        alignment: { vertical: "middle", horizontal: "left", indent: 1 },
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
          fgColor: { argb: "FFF2F2F2" },
        },
        alignment: { vertical: "middle", horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      // ---------------------------
      // Helpers
      // ---------------------------
      const monthLabel = (ym) => {
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
      };

      const getYear = (ym) => ym.split("-")[0];

      function setUniformWidth(sheet, width = 18) {
        sheet.columns.forEach((col) => (col.width = width));
      }

      // =====================================================
      // ============= SHEET 1 — MONTHLY + QUARTERS ==========
      // =====================================================

      const headerStyle = {
        font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEA1B40" },
        },
        alignment: { vertical: "middle", horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };

      sheet1.mergeCells("A1", "H1");
      sheet1.getCell("A1").value = "HSSB SALES REPORT";
      sheet1.getCell("A1").style = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: "center" },
      };

      sheet1.mergeCells("A2", "H2");
      sheet1.getCell("A2").value = `Report Period: ${from} to ${to}`;
      sheet1.getCell("A2").style = {
        font: { size: 10 },
        alignment: { horizontal: "center" },
      };

      sheet1.addRow([]);
      sheet1.addRow([]);

      // Monthly
      sheet1.addRow(["SALES PERSON", ...months.map(monthLabel)]);
      sheet1
        .getRow(sheet1.lastRow.number)
        .eachCell((c) => (c.style = headerStyle));

      sheet1
        .addRow([salesperson, ...months.map((m) => monthly[m] || 0)])
        .eachCell((c) => Object.assign(c.style, cellStyle));

      sheet1
        .addRow(["TOTAL", ...months.map((m) => monthly[m] || 0)])
        .eachCell((c) => Object.assign(c.style, totalStyle));

      sheet1.addRow([]);
      sheet1.addRow([]);

      // Quarters
      const QUARTERS = [
        ["07", "08", "09"],
        ["10", "11", "12"],
        ["01", "02", "03"],
        ["04", "05", "06"],
      ];

      const quarterLabels = [];
      const quarterValues = [];
      const selectedYear = getYear(months[0]);

      for (const block of QUARTERS) {
        const blockMonths = block.map((m) => `${selectedYear}-${m}`);
        const intersects = blockMonths.some((m) => months.includes(m));

        if (!intersects) continue;

        const total = blockMonths.reduce(
          (sum, m) => sum + (monthly[m] || 0),
          0
        );

        quarterLabels.push(
          `${monthLabel(blockMonths[0])} – ${monthLabel(blockMonths[2])}`
        );
        quarterValues.push(total);
      }

      sheet1
        .addRow(["SALES PERSON", ...quarterLabels])
        .eachCell((c) => (c.style = headerStyle));

      sheet1
        .addRow([salesperson, ...quarterValues])
        .eachCell((c) => (c.style = cellStyle));

      sheet1
        .addRow(["TOTAL", ...quarterValues])
        .eachCell((c) => (c.style = totalStyle));

      setUniformWidth(sheet1, 18);

      // =====================================================
      // ============= SHEET 2 — CUSTOMER REGION =============
      // =====================================================

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

      const customerHeaderLabels = [
        "S.No",
        "Customer Code",
        "Customer Name",
        "Group Code",
        "Type",
        "City",
        "State",
        "ServiceTax",
        "Account",
        "SalesPerson",
      ];

      // Calculate starting column for each region
      let currentCol = customerHeaderLabels.length + 1;
      const regionColumns = {};

      REGION_ORDER.forEach((region) => {
        regionColumns[region] = {
          start: currentCol,
          end: currentCol + months2.length - 1,
        };
        currentCol = currentCol + months2.length + 1;
      });

      // -----------------------------
      // FIRST ROW: PARENT REGION HEADERS
      // -----------------------------
      sheet2.addRow([]);

      REGION_ORDER.forEach((region) => {
        const { start, end } = regionColumns[region];
        sheet2.getCell(1, start).value = region;

        if (start !== end) {
          sheet2.mergeCells(1, start, 1, end);
        }

        sheet2.getCell(1, start).style = parentHeaderStyle;
      });

      // -----------------------------
      // SECOND ROW: SUBHEADERS
      // -----------------------------
      const row2 = [...customerHeaderLabels];

      REGION_ORDER.forEach((region) => {
        months2.forEach((m) => row2.push(monthLabel(m)));
        row2.push("");
      });

      sheet2.addRow(row2);

      sheet2.getRow(2).eachCell((cell, colNumber) => {
        if (cell.value) {
          cell.style = subHeaderStyle;
        }
      });

      // -----------------------------
      // CUSTOMER ROWS (WITH GROUPING)
      // -----------------------------
      let sn = 1;

      customersWithBlanks.forEach((cust) => {
        if (cust === null) {
          // Add blank row for group separation
          sheet2.addRow([]);
          return;
        }

        const row = [
          sn++,
          cust.code,
          cust.name,
          cust.groupCode || cust.code,
          cust.type,
          cust.city,
          cust.state,
          cust.serviceTax,
          cust.accountStatus,
          cust.salesman,
        ];

        REGION_ORDER.forEach((region) => {
          months2.forEach((m) => row.push(cust.regions[region][m] || 0));
          row.push("");
        });

        sheet2.addRow(row).eachCell((c) => (c.style = cellStyle));
      });

      // -----------------------------
      // TOTAL ROW
      // -----------------------------
      const totalRow = ["", "", "", "", "", "", "", "", "", "TOTAL"];

      REGION_ORDER.forEach((region) => {
        months2.forEach((m) => {
          const sum = customers.reduce(
            (acc, c) => acc + (c.regions[region][m] || 0),
            0
          );
          totalRow.push(sum);
        });
        totalRow.push("");
      });

      sheet2.addRow(totalRow).eachCell((c) => (c.style = totalStyle));

      // -----------------------------
      // CUSTOMERS WITH NO SALES SECTION
      // -----------------------------
      sheet2.addRow([]);
      sheet2.addRow([]);

      const noSalesHeaderRow = sheet2.addRow([
        "CUSTOMERS WITH NO SALES/SHIPMENT IN SELECTED PERIOD",
      ]);
      sheet2.mergeCells(
        noSalesHeaderRow.number,
        1,
        noSalesHeaderRow.number,
        10
      );
      sheet2.getCell(noSalesHeaderRow.number, 1).style = {
        font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
        fill: {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEA1B40" },
        },
        alignment: { vertical: "middle", horizontal: "center" },
      };

      const noSalesSubHeaderRow = sheet2.addRow(customerHeaderLabels);
      sheet2.getRow(noSalesSubHeaderRow.number).eachCell((cell) => {
        if (cell.value) {
          cell.style = subHeaderStyle;
        }
      });

      const customersWithNoSales = customers.filter((cust) => {
        let totalSales = 0;
        REGION_ORDER.forEach((region) => {
          months2.forEach((m) => {
            totalSales += cust.regions[region][m] || 0;
          });
        });
        return totalSales === 0;
      });

      // Group no-sales customers and add with blank rows
      const groupedNoSales = {};
      customersWithNoSales.forEach((cust) => {
        const groupCode = cust.groupCode || cust.code;
        if (!groupedNoSales[groupCode]) {
          groupedNoSales[groupCode] = [];
        }
        groupedNoSales[groupCode].push(cust);
      });

      const sortedNoSalesGroups = Object.keys(groupedNoSales).sort();
      let noSalesSn = 1;

      sortedNoSalesGroups.forEach((groupCode, index) => {
        groupedNoSales[groupCode].forEach((cust) => {
          const row = [
            noSalesSn++,
            cust.code,
            cust.name,
            cust.groupCode || cust.code,
            cust.type,
            cust.city,
            cust.state,
            cust.serviceTax,
            cust.accountStatus,
            cust.salesman,
          ];

          sheet2.addRow(row).eachCell((c) => (c.style = cellStyle));
        });

        // Add blank row after each group (except the last one)
        if (index < sortedNoSalesGroups.length - 1) {
          sheet2.addRow([]);
        }
      });

      setUniformWidth(sheet2, 18);

      // Export
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `HSSB_Report_${salesperson}.xlsx`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (data) => {
    try {
      await downloadHSSB(data.from, data.to, user.userId, setLoading);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <LoaderAnimation show={loading} />
      <div className="flex gap-9">
        <div className="flex flex-col gap-9">
          <div className="flex gap-9">
            <div className="border w-56 h-48 border-french-gray rounded-md p-3">
              <TargetCard />
            </div>

            <div className="border w-56 h-48 border-french-gray rounded-md p-3">
              <UserCountCard data={accountStatusData} />
            </div>
          </div>
          <DashboardProgressBar data={sectorWiseData} title={`Sector Wise`} />
          <DashboardProgressBar
            data={serviceWiseData}
            title={`Service Wise`}
            loading={loading}
          />
        </div>
        <div className="flex flex-col gap-9 flex-grow">
          {/* HSSB REPORT */}
          <div className="bg-seasalt border border-french-gray rounded-md h-48 p-5 flex flex-col gap-4">
            <h2 className="font-bold">HSSB Report</h2>
            <form onSubmit={handleSubmit(handleDownload)}>
              <div className="flex gap-2 mt-4">
                <MonthInput
                  register={register}
                  setValue={setValue}
                  value={"from"}
                  placeholder="From"
                />
                <MonthInput
                  register={register}
                  setValue={setValue}
                  value={"to"}
                  placeholder="To"
                />
                <SimpleButton name={`Download Report`} type="submit" />
              </div>
            </form>
          </div>
            <DashboardHoldReport />
        </div>
      </div>
      <DashboardTopListCard
        city={`New Delhi`}
        title={`Top Customers`}
        data={topCustomersData}
      />
    </>
  );
}

export default SalesDashboard;
