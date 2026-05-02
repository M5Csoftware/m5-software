"use client";
import React, { useState, useEffect, useContext, useMemo } from "react";
import { SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import NotificationFlag from "@/app/components/Notificationflag";
import RedCheckbox from "@/app/components/RedCheckBox";
import { MultiSelectDropdown } from "@/app/components/Dropdown";
import { DateInputBox } from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useForm } from "react-hook-form";
import { saveAs } from "file-saver";
import axios from "axios";

// ── Constants ─────────────────────────────────────────────────────────────────
const MAIN_SHEET_LABELS = {
  "SALE PERSON WISE  SUMMARY": "Sale Person Summary Wise",
  "SECTOR WISE ( SUMMARY )": "Sector Wise",
  "MASTER ": "Master",
};

// Services that map to sectors in the data (matching example report)
const SERVICES = ["AUS", "BRANDED", "CA", "EU", "LHR FEDEX IE", "UK"];

// Mapping from backend sectors to our columns
const SECTOR_MAP = {
  "AUSTRALIA": "AUS",
  "AUS": "AUS",
  "BRANDED": "BRANDED",
  "CANADA": "CA",
  "CA": "CA",
  "EUROPE": "EU",
  "EU": "EU",
  "FEDEX IE": "LHR FEDEX IE",
  "LHR FEDEX IE": "LHR FEDEX IE",
  "UK": "UK"
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseDDMMYYYY = (str) => {
  if (!str) return null;
  const [d, m, y] = str.split("/");
  const dt = new Date(y, m - 1, d);
  return isNaN(dt) ? null : dt;
};

const toISO = (d, endOfDay = false) => {
  if (!d) return null;
  const dt = new Date(d);
  endOfDay ? dt.setHours(23, 59, 59, 999) : dt.setHours(0, 0, 0, 0);
  return dt.toISOString();
};

const fmt = (v) => (typeof v === "number" ? Math.round(v * 100) / 100 : 0);

// ── Component ─────────────────────────────────────────────────────────────────
const MonitoringReport = () => {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();

  // Filters
  const [selectedMainSheets, setSelectedMainSheets] = useState([]);
  const [selectedSalePersons, setSelectedSalePersons] = useState([]);
  const [includeNotAllocated, setIncludeNotAllocated] = useState(false);

  // Sale persons list from backend
  const [salePersonOptions, setSalePersonOptions] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(true);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Notification
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

  // Watch selected month (YYYY-MM)
  const selectedMonthRaw = watch("month");
  const selectedMonth = useMemo(() => {
    if (!selectedMonthRaw) return "";
    const [d, m, y] = selectedMonthRaw.split("/");
    return `${y}-${m}`;
  }, [selectedMonthRaw]);

  // ── Fetch sale persons ────────────────────────────────────────────────────
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get(`${server}/sale-report/dropdown-options`);
        if (res.data.success) {
          const names = (res.data.data.salePersons || []).filter(n => n && n.trim() !== "");
          setSalePersonOptions(names);
        }
      } catch (err) {
        console.error("Error fetching sale persons:", err);
      } finally {
        setLoadingPersons(false);
      }
    };
    fetchOptions();
  }, [server]);

  // ── Get full-month date ranges for current and previous month ─────────────
  const getMonthPeriods = (yyyyMM) => {
    if (!yyyyMM) return null;
    const [y, m] = yyyyMM.split("-").map(Number);

    const currFrom = new Date(y, m - 1, 1);
    const currTo   = new Date(y, m, 0);

    const prevM    = m === 1 ? 12 : m - 1;
    const prevY    = m === 1 ? y - 1 : y;
    const prevFrom = new Date(prevY, prevM - 1, 1);
    const prevTo   = new Date(prevY, prevM, 0);

    const label = (d) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

    return {
      curr: { from: currFrom, to: currTo, label: label(currTo).substring(3) },
      prev: { from: prevFrom, to: prevTo, label: label(prevTo).substring(3) },
    };
  };

  // ── Fetch data for a period and sale person ───────────────────────────────
  const fetchPeriodData = async (from, to, salePerson) => {
    const params = new URLSearchParams({ from, to });
    if (salePerson && salePerson !== "NOT ALLOCATED")
      params.append("salePerson", salePerson);
    if (salePerson === "NOT ALLOCATED")
      params.append("salePerson", "");

    const res = await axios.get(`${server}/sale-report-sector-wise?${params.toString()}`);
    return res.data.success ? res.data.data : [];
  };

  // ── Build comparison rows for a single sale person ────────────────────────
  const buildPersonRows = (p1Rows, p2Rows) => {
    const map = new Map();

    const addRows = (rows, period) => {
      rows.forEach((row) => {
        const key = row.CustomerCode;
        if (!map.has(key)) {
          map.set(key, {
            code: row.CustomerCode,
            name: row.CustomerName,
            type: row.BranchCode ? "Agent" : "Customer",
            city: row.City || "",
            state: row.State || "",
            region: row.BranchName || row.Zone || row.Branch || "",
            salePerson: row.SalePerson || "",
            account: row.CustomerCode || "",
            p1Total: 0,
            p2Total: 0,
            ...SERVICES.reduce((acc, s) => ({ ...acc, [`p1_${s}`]: 0, [`p2_${s}`]: 0 }), {}),
          });
        }
        const entry = map.get(key);
        const gt = fmt(row.GrandTotal || 0);
        if (period === 1) entry.p1Total += gt;
        else entry.p2Total += gt;

        const svc = (row.Sector || "").toUpperCase();
        let matched = null;
        for (const [skey, sval] of Object.entries(SECTOR_MAP)) {
          if (svc.includes(skey)) {
            matched = sval;
            break;
          }
        }
        if (matched) {
          if (period === 1) entry[`p1_${matched}`] += gt;
          else entry[`p2_${matched}`] += gt;
        }
      });
    };

    addRows(p1Rows, 1);
    addRows(p2Rows, 2);

    return Array.from(map.values()).map((entry) => {
      const totalDiff = fmt(entry.p2Total - entry.p1Total);
      let status = "WORKING";
      if (entry.p1Total === 0 && entry.p2Total > 0) status = "CONVERT NOT-WORKING INTO WORKING";
      else if (entry.p1Total > 0 && entry.p2Total === 0) status = "NOT WORKING";
      else if (totalDiff > 0) status = "INCREASE";
      else if (totalDiff < 0) status = "DECREASE";
      else status = "STABLE";

      return {
        ...entry,
        totalDiff,
        status,
        ...SERVICES.reduce((acc, s) => ({
          ...acc,
          [`diff_${s}`]: fmt((entry[`p2_${s}`] || 0) - (entry[`p1_${s}`] || 0))
        }), {}),
        grandDiff: totalDiff,
      };
    });
  };

  const getTargetPersons = () => {
    const list = [...selectedSalePersons];
    if (includeNotAllocated) list.push("NOT ALLOCATED");
    return list;
  };

  // ── Download: Fetch data then generate ExcelJS report ───────────────────
  const handleDownload = async () => {
    if (!selectedMonth) {
      showNotification("error", "Please select a month.");
      return;
    }
    const persons = getTargetPersons();
    if (persons.length === 0) {
      showNotification("error", "Please select at least one sale person.");
      return;
    }

    const periods = getMonthPeriods(selectedMonth);
    if (!periods) return;

    try {
      setIsLoading(true);

      const fromP1 = toISO(periods.prev.from, false);
      const toP1   = toISO(periods.prev.to,   true);
      const fromP2 = toISO(periods.curr.from,  false);
      const toP2   = toISO(periods.curr.to,    true);

      const byPerson = {};
      for (const sp of persons) {
        const [p1, p2] = await Promise.all([
          fetchPeriodData(fromP1, toP1, sp),
          fetchPeriodData(fromP2, toP2, sp),
        ]);
        byPerson[sp] = buildPersonRows(p1, p2);
      }

      // ── Step 2: Generate ExcelJS workbook ───────────────────────────────
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      const p1Label = periods.prev.label;
      const p2Label = periods.curr.label;

      // ── Styles ────────────────────────────────────────────────────────────
      const RED = "FFEA1B40";
      const HEADER_BG = "FF2D2D2D";
      const SUB_HEADER_BG = "FF4A4A4A";
      const INCREASE_COLOR = "FF006400";
      const DECREASE_COLOR = "FFCC0000";
      const WORKING_COLOR = "FF0044CC";
      const NOT_WORKING_COLOR = "FFFF0000";
      const CONVERTED_COLOR = "FF008000";
      const STABLE_COLOR = "FF000000";

      const headerFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      const subHeaderFont = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
      const cellFont = { size: 10 };
      const boldFont = { bold: true, size: 10 };
      const thinBorder = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } },
      };
      const numFmt = "#,##0.00";

      const identityCols = [
        { width: 8 }, { width: 14 }, { width: 45 }, { width: 12 }, { width: 18 }, { width: 18 }, 
        { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 22 }
      ];
      const dataCols = [];
      for (let i = 0; i < 7; i++) dataCols.push({ width: 16 }, { width: 16 }, { width: 14 }, { width: 14 }, { width: 3 });

      // ── Function to style a standard person/master sheet ──────────────────
      const fillDataSheet = (ws, rows) => {
        ws.columns = [...identityCols, ...dataCols];

        const groupHeaders = Array(12).fill("");
        const groups = ["GRAND TOTAL", ...SERVICES];
        groups.forEach(g => groupHeaders.push(g, "", "", "", ""));
        const r1 = ws.addRow(groupHeaders);
        r1.height = 22;
        let colStart = 13;
        groups.forEach(g => {
          ws.mergeCells(r1.number, colStart, r1.number, colStart + 3);
          const cell = ws.getCell(r1.number, colStart);
          cell.value = g;
          cell.font = headerFont; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } };
          cell.alignment = { horizontal: "center", vertical: "middle" }; cell.border = thinBorder;
          colStart += 5;
        });
        for (let c = 1; c <= 12; c++) {
          const cell = ws.getCell(r1.number, c);
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } }; cell.border = thinBorder;
        }

        const subHeaders = ["S NO.", "Code", "Name", "Type", "City", "State", "TaxOpt", "Account", "Group", "Region", "SP", "STATUS"];
        groups.forEach(() => subHeaders.push(p1Label, p2Label, "DIFF", "TOTAL DIFF", ""));
        const r2 = ws.addRow(subHeaders);
        r2.height = 18;
        r2.eachCell(cell => {
          cell.font = subHeaderFont; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUB_HEADER_BG } };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }; cell.border = thinBorder;
        });

        rows.forEach((row, idx) => {
          let statusColor = STABLE_COLOR;
          if (row.status === "INCREASE") statusColor = INCREASE_COLOR;
          else if (row.status === "DECREASE") statusColor = DECREASE_COLOR;
          else if (row.status === "NOT WORKING") statusColor = NOT_WORKING_COLOR;
          else if (row.status.includes("CONVERT")) statusColor = CONVERTED_COLOR;
          else if (row.status === "WORKING") statusColor = WORKING_COLOR;

          const values = [idx + 1, row.code, row.name, row.type, row.city, row.state, "", row.account, "", row.region, row.salePerson, row.status, fmt(row.p1Total), fmt(row.p2Total), fmt(row.grandDiff), fmt(row.totalDiff), ""];
          SERVICES.forEach(s => values.push(fmt(row[`p1_${s}`] || 0), fmt(row[`p2_${s}`] || 0), fmt(row[`diff_${s}`] || 0), fmt(row[`diff_${s}`] || 0), ""));
          const dr = ws.addRow(values);
          dr.eachCell((cell, colNum) => {
            cell.font = colNum === 12 ? { ...boldFont, color: { argb: statusColor } } : cellFont;
            cell.border = thinBorder;
            if (colNum <= 12) cell.alignment = { horizontal: colNum === 3 ? "left" : "center" };
            if (colNum > 12) {
              const isSpacer = (colNum - 13) % 5 === 4;
              if (!isSpacer) {
                cell.numFmt = numFmt;
                cell.alignment = { horizontal: "right" };
                const v = cell.value;
                if (typeof v === "number" && v !== 0) {
                  const isDiff = (colNum - 13) % 5 >= 2;
                  if (isDiff) cell.font = { ...cellFont, color: { argb: v < 0 ? DECREASE_COLOR : INCREASE_COLOR } };
                }
              }
            }
          });
        });

        if (rows.length > 0) {
          const totalRow = Array(11).fill(""); totalRow.push("TOTAL");
          const sumGroups = ["grand", ...SERVICES];
          sumGroups.forEach(g => {
            const p1 = rows.reduce((s, r) => s + (g === "grand" ? r.p1Total : r[`p1_${g}`] || 0), 0);
            const p2 = rows.reduce((s, r) => s + (g === "grand" ? r.p2Total : r[`p2_${g}`] || 0), 0);
            totalRow.push(fmt(p1), fmt(p2), fmt(p2 - p1), fmt(p2 - p1), "");
          });
          const tr = ws.addRow(totalRow);
          tr.height = 18;
          tr.eachCell((cell, colNum) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: RED } };
            cell.border = thinBorder;
            if (colNum > 12 && (colNum - 13) % 5 !== 4) {
              cell.numFmt = numFmt; cell.alignment = { horizontal: "right" };
              const v = cell.value;
              if (typeof v === "number" && v !== 0 && (colNum - 13) % 5 >= 2) {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              }
            }
          });
        }
      };

      // ── INDIVIDUAL SHEETS ─────────────────────────────────────────────────
      for (const sp of Object.keys(byPerson)) {
        const ws = wb.addWorksheet(sp.substring(0, 31), { views: [{ state: "frozen", xSplit: 4, ySplit: 2 }] });
        fillDataSheet(ws, byPerson[sp]);
      }

      // ── MASTER SHEET ──────────────────────────────────────────────────────
      if (selectedMainSheets.includes("Master")) {
        const ws = wb.addWorksheet("MASTER", { views: [{ state: "frozen", xSplit: 4, ySplit: 2 }] });
        fillDataSheet(ws, Object.values(byPerson).flat());
      }

      // ── SALE PERSON WISE SUMMARY (Count of Agents) ────────────────────────
      if (selectedMainSheets.includes("Sale Person Summary Wise")) {
        const ws = wb.addWorksheet("SALE PERSON WISE SUMMARY");
        ws.columns = [{ width: 6 }, { width: 15 }, { width: 30 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];

        ws.addRow(["", "CRM AND SALE REPORT CARD AGENT WISE"]).getCell(2).font = { bold: true, size: 14 };
        ws.addRow(["", "COUNT OF AGENTS REPORT"]).getCell(2).font = { bold: true, size: 12 };

        const headers = ["S NO.", "REGION", "SP NAME", "TOTAL AGENTS", "WORKING AGENTS", "NOT WORKING", "INCREASE", "DECREASE", "NEW AGENTS", "CONVERT NOT-WORKING INTO WORKING"];
        ws.addRow(headers).eachCell(cell => {
          cell.font = subHeaderFont;
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUB_HEADER_BG } };
          cell.border = thinBorder;
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        });

        Object.entries(byPerson).forEach(([sp, rows], idx) => {
          const total = rows.length;
          const working = rows.filter(r => r.p2Total > 0).length;
          const notWorking = rows.filter(r => r.p1Total > 0 && r.p2Total === 0).length;
          const increase = rows.filter(r => r.status === "INCREASE").length;
          const decrease = rows.filter(r => r.status === "DECREASE").length;
          const converted = rows.filter(r => r.status.includes("CONVERT")).length;

          const region = rows[0]?.region || "";
          const dr = ws.addRow([idx + 1, region, sp, total, working, notWorking, increase, decrease, 0, converted]);
          dr.eachCell((cell, col) => {
            cell.border = thinBorder;
            cell.font = cellFont;
            cell.alignment = { horizontal: col === 3 ? "left" : "center" };
            if (col > 3) {
              const v = cell.value;
              if (typeof v === "number" && v > 0) cell.font = { ...cellFont, color: { argb: INCREASE_COLOR } };
              if (col === 6 && v > 0) cell.font = { ...cellFont, color: { argb: NOT_WORKING_COLOR } };
              if (col === 10 && v > 0) cell.font = { ...cellFont, color: { argb: CONVERTED_COLOR } };
            }
          });
        });
      }

      // ── SECTOR WISE SUMMARY (Revenue + Count) ──────────────────────────────
      if (selectedMainSheets.includes("Sector Wise")) {
        const ws = wb.addWorksheet("SECTOR WISE SUMMARY");
        const cols = [{ width: 6 }, { width: 15 }, { width: 25 }, { width: 14 }, { width: 18 }, { width: 18 }, { width: 14 }];
        SERVICES.forEach(() => cols.push({ width: 14 }, { width: 18 }, { width: 14 }));
        ws.columns = cols;

        ws.addRow(["", "", "", "SECTOR WISE PERFORMANCE REVENUE WISE"]).getCell(4).font = { bold: true, size: 14 };

        const row1 = ["", "", "", "AMOUNT WISE", "", "", ""];
        SERVICES.forEach(s => row1.push(s, "", ""));
        const r1 = ws.addRow(row1);
        ws.mergeCells(r1.number, 4, r1.number, 7);
        let sCol = 8;
        SERVICES.forEach(() => { ws.mergeCells(r1.number, sCol, r1.number, sCol + 2); sCol += 3; });

        r1.eachCell((cell, col) => {
          if (col >= 4) {
            cell.font = headerFont; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } };
            cell.alignment = { horizontal: "center", vertical: "middle" }; cell.border = thinBorder;
          }
        });

        const row2 = ["S NO.", "REGION", "SP NAME", "TOTAL AGENTS", p1Label, p2Label, "DIFF"];
        SERVICES.forEach(s => row2.push("APR AGNT", "APR REVENUE", "DIFF"));
        const r2 = ws.addRow(row2);
        r2.eachCell(cell => {
          cell.font = subHeaderFont; cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUB_HEADER_BG } };
          cell.border = thinBorder; cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        });

        Object.entries(byPerson).forEach(([sp, rows], idx) => {
          const p1T = rows.reduce((s, r) => s + r.p1Total, 0);
          const p2T = rows.reduce((s, r) => s + r.p2Total, 0);
          const region = rows[0]?.region || "";
          const values = [idx + 1, region, sp, rows.length, fmt(p1T), fmt(p2T), fmt(p2T - p1T)];
          SERVICES.forEach(s => {
            const agnts = rows.filter(r => (r[`p2_${s}`] || 0) > 0).length;
            const rev = rows.reduce((sum, r) => sum + (r[`p2_${s}`] || 0), 0);
            const p1s = rows.reduce((sum, r) => sum + (r[`p1_${s}`] || 0), 0);
            values.push(agnts, fmt(rev), fmt(rev - p1s));
          });
          const dr = ws.addRow(values);
          dr.eachCell((cell, col) => {
            cell.border = thinBorder;
            cell.font = cellFont;
            if (col >= 5) {
              cell.numFmt = numFmt;
              cell.alignment = { horizontal: "right" };
              const v = cell.value;
              if (typeof v === "number" && v !== 0) {
                if (col === 7 || (col > 7 && (col - 8) % 3 === 2)) {
                  cell.font = { ...cellFont, color: { argb: v < 0 ? DECREASE_COLOR : INCREASE_COLOR } };
                }
              }
            } else {
              cell.alignment = { horizontal: col === 3 ? "left" : "center" };
            }
          });
        });
      }

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `Monitoring_Report_${selectedMonth}.xlsx`);
      showNotification("success", "Monitoring report downloaded successfully.");
    } catch (err) {
      console.error(err);
      showNotification("error", `Download failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setSelectedMainSheets([]);
    setSelectedSalePersons([]);
    setIncludeNotAllocated(false);
    setNotification({ type: "success", message: "", visible: false });
  };

  const totalSelected = getTargetPersons().length + selectedMainSheets.length;

  return (
    <div className="flex flex-col gap-9">
      <NotificationFlag type={notification.type} message={notification.message} visible={notification.visible} setVisible={(v) => setNotification({ ...notification, visible: v })} />
      <Heading title="Monitoring Report" bulkUploadBtn="hidden" codeListBtn="hidden" onRefresh={handleRefresh} />
      <div className="flex gap-3 items-center">
        <MultiSelectDropdown options={Object.values(MAIN_SHEET_LABELS)} selected={selectedMainSheets} onChange={setSelectedMainSheets} placeholder="Main Sheets" />
        <MultiSelectDropdown options={salePersonOptions} selected={selectedSalePersons} onChange={setSelectedSalePersons} placeholder={loadingPersons ? "Loading..." : "Sale Person"} disabled={loadingPersons} />
        <DateInputBox
          register={register}
          setValue={setValue}
          value="month"
          placeholder="Select Month"
          trigger={trigger}
          resetFactor={isLoading}
        />
        <div className="flex items-center">
          <RedCheckbox id="includeNotAllocated" register={register} setValue={setValue} isChecked={includeNotAllocated} setChecked={setIncludeNotAllocated} label="Include Not Allocated" />
        </div>
        <div className="shrink-0">
          <SimpleButton name={isLoading ? "Downloading..." : "Download"} onClick={handleDownload} disabled={isLoading} />
        </div>
      </div>
      <div>
        <div className="grid grid-cols-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-[#F8F8F8] border border-[#D0D5DD] border-opacity-75 rounded-t-md px-4 py-2">
          <span>Selection</span><span>Type</span>
        </div>
        <div className="border border-[#D0D5DD] border-opacity-75 border-t-0 rounded-b-md divide-y divide-[#D0D5DD] divide-opacity-50 min-h-[80px]">
          {totalSelected === 0 ? (
            <div className="flex justify-center items-center py-10 text-gray-400 text-sm">No sheets selected. Use the filters above to select.</div>
          ) : (
            <>
              {selectedMainSheets.map((sheet, i) => (
                <div key={`main-${i}`} className="grid grid-cols-2 items-center px-4 py-3 hover:bg-[#FFF5F7] transition-colors">
                  <span className="text-sm font-medium text-eerie-black">{sheet}</span><span className="text-xs text-gray-400">Main Sheet</span>
                </div>
              ))}
              {getTargetPersons().map((sp, i) => (
                <div key={`sp-${i}`} className="grid grid-cols-2 items-center px-4 py-3 hover:bg-[#FFF5F7] transition-colors">
                  <span className="text-sm font-medium text-eerie-black">{sp}</span><span className="text-xs text-gray-400">Sale Person Sheet</span>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2">
          <div><span className="font-sans text-sm">Total Selected: </span><span className="text-red">{totalSelected}</span></div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringReport;
