"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { ExternalLink, Link } from "lucide-react";
import { DateInputBox } from "@/app/components/InputBox";
import { Dropdown } from "@/app/components/Dropdown";
import { useForm } from "react-hook-form";
import { TableRowSimple, TableWithTotal } from "@/app/components/Table";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { SimpleButton } from "@/app/components/Buttons";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import dayjs from "dayjs";
import { MonthInput } from "@/app/components/MonthInput";
import ExcelJS from "exceljs";

function RangeDropdown({ selected, setSelected }) {
  const options = [
    "Today",
    "Last 7 Days",
    "Last 30 Days",
    "This Month",
    "All Time",
  ];

  return (
    <div className="relative inline-block">
      <select
        className="text-[10px] border border-gray-300  rounded text-gray-600 appearance-none cursor-pointer bg-white"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            &nbsp;{opt}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-gray-500">
        ▼
      </span>
    </div>
  );
}

//Client Card
export function ClientsCard() {
  const { server } = useContext(GlobalContext);

  const [selectedRange, setSelectedRange] = useState("All Time");
  const [sales, setSales] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `${server}/dashboard/collection-hod-dashboard/status-card?range=${encodeURIComponent(
            selectedRange
          )}`,
          { cache: "no-store" }
        );

        const data = await res.json();
        setSales(data.sales || 0);
        setOutstanding(data.outstanding || 0);
      } catch {
        setSales(0);
        setOutstanding(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [server, selectedRange]);

  return (
    <div className="flex flex-col gap-2.5 border p-4 rounded-md border-french-gray w-full bg-white shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center text-xs text-dim-gray font-semibold">
        <span>SALES</span>
        <RangeDropdown
          selected={selectedRange}
          setSelected={setSelectedRange}
        />
      </div>

      {/* Body */}
      <div className="flex justify-between items-end">
        {/* Sales & Outstanding */}
        <div className="flex gap-8 mt-2">
          <div className="text-left tracking-wide">
            <div className="text-green-600 font-semibold text-2xl">
              {loading ? "-" : sales.toLocaleString()}
            </div>
            <div className="text-green-600 text-sm">Sales</div>
          </div>

          <div className="text-left">
            <div className="text-red font-semibold text-2xl">
              {loading ? "-" : outstanding.toLocaleString()}
            </div>
            <div className="text-red text-sm">Outstanding</div>
          </div>
        </div>

        {/* External Link */}
        <ExternalLink className="text-red" />
      </div>
    </div>
  );
}

// Sales Progress Card
export function SalesProgressCard() {
  const currentMonth = dayjs();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [target, setTarget] = useState(0);
  const [progress, setProgress] = useState(0);
  const [weight, setWeight] = useState(0);

  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [animatedNumber, setAnimatedNumber] = useState(0);
  const { server } = useContext(GlobalContext);
  const percentage = (progress / target) * 100;

  useEffect(() => {
    const load = async () => {
      const res = await fetch(
        `${server}/dashboard/sales-hod-dashboard/sales-progress?month=${selectedMonth.format(
          "MMMM-YYYY"
        )}`,
        { cache: "no-store" }
      );

      const data = await res.json();
      setTarget(data.target || 0);
      setProgress(data.progress || 0);
      setWeight(data.weight || 0);
    };

    load();
  }, [selectedMonth]);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedWidth(percentage), 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  useEffect(() => {
    setAnimatedWidth(0);
    setAnimatedNumber(0);
  }, [selectedMonth]);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    const increment = progress / steps;

    const interval = setInterval(() => {
      start += increment;
      if (start >= progress) {
        start = progress;
        clearInterval(interval);
      }
      setAnimatedNumber(Math.floor(start));
    }, stepTime);

    return () => clearInterval(interval);
  }, [progress]);

  const handlePrevMonth = () =>
    setSelectedMonth((prev) => prev.subtract(1, "month"));
  const handleNextMonth = () => {
    const next = selectedMonth.add(1, "month");
    if (next.isAfter(currentMonth)) return;
    setSelectedMonth(next);
  };

  return (
    <div className="rounded-lg border p-6 py-8 bg-white shadow">
      <div className="flex justify-between items-center text-xs text-gray-500 font-semibold">
        <span>SALES PROGRESS</span>

        <div className="text-gray-600 font-medium flex items-center gap-3">
          <button onClick={handlePrevMonth}>
            <img
              src="arrow-right-gray.svg"
              width={14}
              height={14}
              className="rotate-180"
            />
          </button>

          <span>{selectedMonth.format("MMMM, YYYY")}</span>

          <button
            onClick={handleNextMonth}
            disabled={selectedMonth.isSame(currentMonth, "month")}
          >
            <img src="arrow-right-gray.svg" width={14} height={14} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-2 text-sm font-medium">
        <span>
          {animatedNumber.toLocaleString()}{" "}
          <span className="text-gray-600">
            ({(weight / 1000).toFixed(2)} Tonn)
          </span>
        </span>
        <span>{target.toLocaleString()}</span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded mt-2">
        <div
          className="h-2 bg-red rounded transition-all duration-1000 ease-out"
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
    </div>
  );
}

async function downloadExcelStyled({ rows, columns, fileName }) {
  if (!rows || rows.length === 0) {
    alert("No data to export");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Outstanding");

  // Title Row
  sheet.addRow([fileName]);
  sheet.mergeCells(1, 1, 1, columns.length);
  const titleRow = sheet.getRow(1);
  titleRow.font = { bold: true, size: 16, color: { argb: "FF800000" } };
  titleRow.alignment = { horizontal: "center" };
  sheet.addRow([]);

  // Header Row
  const headerRow = sheet.addRow(columns.map((c) => c.label));

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF990000" }, // dark red
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });

  // Data Rows
  rows.forEach((r) => {
    const data = columns.map((c) => r[c.key] ?? "");
    sheet.addRow(data);
  });

  // Styling data rows
  sheet.eachRow((row, rowNum) => {
    if (rowNum <= 2) return; // skip title + header

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { horizontal: "left", vertical: "middle" };
    });
  });

  // Auto column width
  sheet.columns.forEach((col) => {
    let maxLength = 12;
    col.eachCell({ includeEmpty: true }, (cell) => {
      const len = cell.value ? cell.value.toString().length : 0;
      if (len > maxLength) maxLength = len;
    });
    col.width = maxLength + 5;
  });

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

//Outstanding Card
export function OutstandingCard() {
  const { register, setValue, watch } = useForm();

  const month = watch("month"); // "2025-11"
  const [selectedValue, setSelectedValue] = useState("state");
  const { server } = useContext(GlobalContext);
  const [hubs, setHubs] = useState([]);

  const stateRef = useRef([]);
  const customerRef = useRef([]);
  const hubRef = useRef([]);
  const salesRef = useRef([]);

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const response = await axios.get(`${server}/entity-manager`, {
          params: { entityType: "Hub" },
        });

        console.log("Fetched hubs:", response.data);

        setHubs(response.status === 200 ? response.data : []);
      } catch (error) {
        console.error("Error fetching hubs:", error);
        setHubs([]);
      }
    };

    fetchHubs();
  }, [server]);

  const handleDownload = () => {
    if (!month) return alert("Select month first");

    let activeData = [];
    let activeColumns = [];
    let fileName = "";

    if (selectedValue === "state") {
      activeData = stateRef.current;
      activeColumns = [
        { key: "state", label: "State" },
        { key: "shipments", label: "Shipments" },
        { key: "saleAmt", label: "Sale Amount" },
        { key: "shipmentsOnHold", label: "On Hold" },
        { key: "outstanding", label: "Outstanding" },
      ];
      fileName = `StateWise_${month}`;
    }

    if (selectedValue === "customer") {
      activeData = customerRef.current;
      activeColumns = [
        { key: "customer", label: "Customer" },
        { key: "accountCode", label: "Account Code" },
        { key: "shipments", label: "Shipments" },
        { key: "saleAmt", label: "Sale Amount" },
        { key: "shipmentsOnHold", label: "On Hold" },
        { key: "outstanding", label: "Outstanding" },
      ];
      fileName = `CustomerWise_${month}`;
    }

    if (selectedValue === "hub") {
      activeData = hubRef.current;
      activeColumns = [
        { key: "hub", label: "Hub" },
        { key: "shipments", label: "Shipments" },
        { key: "saleAmt", label: "Sale Amount" },
        { key: "shipmentsOnHold", label: "On Hold" },
        { key: "outstanding", label: "Outstanding" },
      ];
      fileName = `HubWise_${month}`;
    }

    if (selectedValue === "salesperson") {
      activeData = salesRef.current;
      activeColumns = [
        { key: "salePerson", label: "Sales Person" },
        { key: "shipments", label: "Shipments" },
        { key: "saleAmt", label: "Sale Amount" },
        { key: "shipmentsOnHold", label: "On Hold" },
        { key: "outstanding", label: "Outstanding" },
      ];
      fileName = `SalesPersonWise_${month}`;
    }

    downloadExcelStyled({
      rows: activeData,
      columns: activeColumns,
      fileName,
    });
  };

  return (
    <div className="rounded-lg border bg-[#F6F8F9] shadow-sm p-4 flex flex-col h-[810px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800 text-lg">Outstanding</h2>
        <div className="flex flex-row gap-2">
          <div className="w-[175px]">
            <MonthInput
              register={register}
              setValue={setValue}
              value="month"
              placeholder="Select Month"
              maxToday={true}
            />
          </div>
          <div
            className="border p-1 px-2 rounded border-[#979797] cursor-pointer"
            onClick={handleDownload}
          >
            <img
              src="Download-gray.svg"
              height={25}
              width={25}
              alt="Download"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 my-4">
        <RadioButtonLarge
          id="state"
          name="hodCollection"
          label="State Wise"
          register={register}
          setValue={setValue}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
        />
        <RadioButtonLarge
          id="customer"
          name="hodCollection"
          label="Customer Wise"
          register={register}
          setValue={setValue}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
        />
        <RadioButtonLarge
          id="hub"
          name="hodCollection"
          label="Hub Wise"
          register={register}
          setValue={setValue}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
        />
        <RadioButtonLarge
          id="salesperson"
          name="hodCollection"
          label="Sales Person Wise"
          register={register}
          setValue={setValue}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
        />
      </div>

      {/* Conditional Tables */}
      <div className="overflow-y-auto table-scrollbar">
        {selectedValue === "customer" ? (
          <CustomerWiseTable
            register={register}
            setValue={setValue}
            month={month}
            setRef={customerRef}
          />
        ) : selectedValue === "hub" ? (
          <HubWiseTable
            register={register}
            setValue={setValue}
            month={month}
            setRef={hubRef}
          />
        ) : selectedValue === "salesperson" ? (
          <SalesPersonWiseTable
            register={register}
            setValue={setValue}
            month={month}
            setRef={salesRef}
          />
        ) : (
          <StatePersonTable
            register={register}
            setValue={setValue}
            month={month}
            setRef={stateRef}
          />
        )}
      </div>
    </div>
  );
}

//Outstanding Card Tab 1 - Sales person wise
function StatePersonTable({ register, setValue, month, setRef }) {
  const { server } = useContext(GlobalContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!month) return;
    const [year, selectedMonth] = month.split("-");

    const load = async () => {
      try {
        const res = await fetch(
          `${server}/dashboard/collection-hod-dashboard/state-wise?month=${selectedMonth}&year=${year}`,
          { cache: "no-store" }
        );

        const data = await res.json();
        const finalData = Array.isArray(data) ? data : [];

        setRows(finalData);
        setRef.current = finalData; // ✅ save rows to ref
      } catch {
        setRows([]);
        setRef.current = [];
      }
    };

    load();
  }, [server, month]);

  const columns = [
    { key: "state", label: "State" },
    { key: "shipments", label: "Shipments" },
    { key: "saleAmt", label: "Sale Amt" },
    { key: "shipmentsOnHold", label: "On Hold" },
    { key: "outstanding", label: "Outstanding" },
  ];

  const totalRow = {
    state: "Total",
    shipments: rows.reduce((s, r) => s + (r.shipments || 0), 0),
    saleAmt: rows.reduce((s, r) => s + (r.saleAmt || 0), 0),
    shipmentsOnHold: rows.reduce((s, r) => s + (r.shipmentsOnHold || 0), 0),
    outstanding: rows.reduce((s, r) => s + (r.outstanding || 0), 0),
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="stateWise"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
      className="overflow-y-auto overflow-x-auto table-scrollbar"
    />
  );
}

//Outstanding Card Tab 2 - Agent wise
function HubWiseTable({ register, setValue, month, setRef }) {
  const { server } = useContext(GlobalContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!month) return;
    const [year, selectedMonth] = month.split("-");

    const load = async () => {
      try {
        const res = await fetch(
          `${server}/dashboard/collection-hod-dashboard/hub-wise?month=${selectedMonth}&year=${year}`,
          { cache: "no-store" }
        );

        const data = await res.json();
        const finalData = Array.isArray(data) ? data : [];

        setRows(finalData);
        setRef.current = finalData; // ✅ important
      } catch {
        setRows([]);
        setRef.current = [];
      }
    };

    load();
  }, [server, month]);

  const columns = [
    { key: "hub", label: "Hub" },
    { key: "shipments", label: "Shipments" },
    { key: "saleAmt", label: "Sale Amount" },
    { key: "shipmentsOnHold", label: "On Hold" },
    { key: "outstanding", label: "Outstanding" },
  ];

  const totalRow = {
    hub: "Total",
    shipments: rows.reduce((s, r) => s + (r.shipments || 0), 0),
    saleAmt: rows.reduce((s, r) => s + (r.saleAmt || 0), 0),
    shipmentsOnHold: rows.reduce((s, r) => s + (r.shipmentsOnHold || 0), 0),
    outstanding: rows.reduce((s, r) => s + (r.outstanding || 0), 0),
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="hubWise"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

function CustomerWiseTable({ register, setValue, month, setRef }) {
  const { server } = useContext(GlobalContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!month) return;
    const [year, selectedMonth] = month.split("-");

    const load = async () => {
      try {
        const res = await fetch(
          `${server}/dashboard/collection-hod-dashboard/customer-wise?month=${selectedMonth}&year=${year}`,
          { cache: "no-store" }
        );

        const data = await res.json();
        const finalData = Array.isArray(data) ? data : [];

        setRows(finalData);
        setRef.current = finalData; // ✅ important
      } catch {
        setRows([]);
        setRef.current = [];
      }
    };

    load();
  }, [server, month]);

  const columns = [
    { key: "customer", label: "Customer" },
    { key: "accountCode", label: "Account Code" },
    { key: "shipments", label: "Shipments" },
    { key: "saleAmt", label: "Sale Amount" },
    { key: "shipmentsOnHold", label: "On Hold" },
    { key: "outstanding", label: "Outstanding" },
  ];

  const totalRow = {
    customer: "Total",
    accountCode: "-",
    shipments: rows.reduce((s, r) => s + (r.shipments || 0), 0),
    saleAmt: rows.reduce((s, r) => s + (r.saleAmt || 0), 0),
    shipmentsOnHold: rows.reduce((s, r) => s + (r.shipmentsOnHold || 0), 0),
    outstanding: rows.reduce((s, r) => s + (r.outstanding || 0), 0),
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="customerWise"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

function SalesPersonWiseTable({ register, setValue, month, setRef }) {
  const { server } = useContext(GlobalContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!month) return;
    const [year, selectedMonth] = month.split("-");

    const load = async () => {
      try {
        const res = await fetch(
          `${server}/dashboard/collection-hod-dashboard/saleperson-wise?month=${selectedMonth}&year=${year}`,
          { cache: "no-store" }
        );

        const data = await res.json();
        const finalData = Array.isArray(data) ? data : [];

        setRows(finalData);
        setRef.current = finalData; // ✅ important
      } catch {
        setRows([]);
        setRef.current = [];
      }
    };

    load();
  }, [server, month]);

  const columns = [
    { key: "salePerson", label: "Sales Person" },
    { key: "shipments", label: "Shipments" },
    { key: "saleAmt", label: "Sale Amount" },
    { key: "shipmentsOnHold", label: "On Hold" },
    { key: "outstanding", label: "Outstanding" },
  ];

  const totalRow = {
    salePerson: "Total",
    shipments: rows.reduce((s, r) => s + (r.shipments || 0), 0),
    saleAmt: rows.reduce((s, r) => s + (r.saleAmt || 0), 0),
    shipmentsOnHold: rows.reduce((s, r) => s + (r.shipmentsOnHold || 0), 0),
    outstanding: rows.reduce((s, r) => s + (r.outstanding || 0), 0),
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="salesPersonWise"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}
