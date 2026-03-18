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
import { downloadStateHSSB } from "./HssbStates";
import LoaderAnimation from "@/app/components/Loader";

//Client Card
export function ClientsCard() {
  const [stats, setStats] = useState({ working: 0, nonWorking: 0 });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { server } = useContext(GlobalContext);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await fetch(
          `${server}/dashboard/sales-hod-dashboard/total-clients`,
          { cache: "no-store" }
        );
        const data = await res.json();

        setStats({
          working: data.working || 0,
          nonWorking: data.nonWorking || 0,
        });
      } catch (err) {
        // console.log(err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [server]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(
        `${server}/dashboard/sales-hod-dashboard/customer-details`
      );

      const data = await res.json();

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Clients Report");

      const year = new Date().getFullYear();

      const months = [
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

      const baseCols = [
        { header: "Customer Name", key: "name", width: 28 },
        { header: "Code", key: "accountCode", width: 14 },
        { header: "Sales Person", key: "salesPersonName", width: 20 },
        { header: "Email", key: "email", width: 28 },
        { header: "Telephone", key: "telNo", width: 18 },
        { header: "Account Type", key: "accountType", width: 16 },
        { header: "Pincode", key: "pinCode", width: 12 },
        { header: "State", key: "state", width: 14 },
        { header: "City", key: "city", width: 14 },
        { header: "Credit Limit", key: "creditLimit", width: 14 },
        { header: "GST", key: "gstNo", width: 20 },
        { header: "Total Sale", key: "totalSale", width: 16 },
      ];

      const monthCols = months.map((m, i) => ({
        header: `${m} ${year}`,
        key: `m${i + 1}`,
        width: 16,
      }));

      ws.columns = [...baseCols, ...monthCols];

      ws.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFCC0000" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      data.forEach((row) => {
        const rowData = { ...row };

        monthCols.forEach((col, index) => {
          const mm = String(index + 1).padStart(2, "0");
          const key = `${year}-${mm}`;
          rowData[`m${index + 1}`] = row.monthWise[key] || 0;
        });

        ws.addRow(rowData);
      });

      ws.eachRow((r, rowNumber) => {
        if (rowNumber === 1) return;

        r.height = 22;
        r.eachCell((cell) => {
          cell.alignment = { vertical: "middle", horizontal: "left" };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      const buffer = await wb.xlsx.writeBuffer();

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clients_report_${year}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      // console.log(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <LoaderAnimation show={loading || downloading} />
      <div className="rounded-lg border p-4 bg-white shadow flex justify-between items-center">
        <div className="ml-2 p-1 cursor-default">
          <div className="text-sm font-medium text-gray-600 tracking-widest">
            CLIENTS
          </div>

          <div className="flex gap-8 mt-2">
            <div className="text-left tracking-wide mr-4">
              <div className="text-green-600 font-semibold text-2xl">
                {loading ? "-" : stats.working}
              </div>
              <div className="text-green-600 text-md">Working</div>
            </div>

            <div className="text-left">
              <div className="text-red font-semibold text-2xl">
                {loading ? "-" : stats.nonWorking}
              </div>
              <div className="text-red text-md">Non-Working</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <ExternalLink
            className="text-red w-5 h-5 absolute -bottom-8 right-1 cursor-pointer"
            onClick={handleDownload}
          />
        </div>
      </div>
    </>
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

// Sales Person Card
function SalesPersonRow({ item }) {
  const percentage = Math.min((item.progress / item.target) * 100, 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setWidth(percentage), 100);
    return () => clearTimeout(timeout);
  }, [percentage]);

  return (
    <div>
      <div className="flex justify-between items-center text-sm space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-gray-800">{item.name}</span>
          <span className="text-xs border bg-[#EA1B4033] border-red text-red rounded-full px-2 py-[1px] tracking-wide">
            {item.code}
          </span>
        </div>
        <span className="text-gray-600 text-sm pb-1">
          {item.progress.toLocaleString()}/{item.target.toLocaleString()}
        </span>
      </div>

      <div className="relative w-full h-2 bg-gray-200 rounded overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-2 rounded transition-all duration-1000 ease-out ${
            item.progress >= item.target ? "bg-green-500" : "bg-red"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function SalesPersonCard({ rows }) {
  const { register, setValue, watch } = useForm();
  const [hubs, setHubs] = useState([]);
  const [selectedHub, setSelectedHub] = useState("Hub");
  const { server } = useContext(GlobalContext);
  const month = watch("month");

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const response = await axios.get(`${server}/entity-manager`, {
          params: { entityType: "Hub" },
        });
        setHubs(response.status === 200 ? response.data : []);
      } catch (error) {
        setHubs([]);
      }
    };
    fetchHubs();
  }, [server]);

  const [rowsState, setRows] = useState(Array.isArray(rows) ? rows : []);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(
        `${server}/dashboard/sales-hod-dashboard/target?hub=${selectedHub}&month=${
          month || ""
        }`
      );

      let data = await res.json();
      if (!Array.isArray(data)) data = [];
      setRows(data);
    };

    load();
  }, [selectedHub, month]);

  return (
    <div className="rounded-lg border bg-[#F6F8F9] shadow-sm p-6 flex flex-col min-h-[60vh]">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="font-bold text-black text-md">Sale Person</h2>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="w-[175px]">
          <MonthInput register={register} setValue={setValue} value="month" />
        </div>

        <div className="w-[120px]">
          <Dropdown
            defaultValue="Delhi"
            register={register}
            value="hub"
            setValue={(f, v) => {
              setValue(f, v);
              setSelectedHub(v);
            }}
            options={hubs.map((hub) => hub.name || hub.code)}
          />
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto pr-2 flex-1 table-scrollbar">
        {rowsState.map((item, idx) => (
          <SalesPersonRow key={idx} item={item} />
        ))}
      </div>
    </div>
  );
}

//Outstanding Card
export function OutstandingCard() {
  const [selectedValue, setSelectedValue] = useState("sales");
  const { server } = useContext(GlobalContext);
  const [hubs, setHubs] = useState([]);
  const { register, setValue, watch } = useForm();
  const month = watch("from");
  const hub = watch("hub");

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const response = await axios.get(`${server}/entity-manager`, {
          params: { entityType: "Hub" },
        });

        // console.log("Fetched hubs:", response.data);

        setHubs(response.status === 200 ? response.data : []);
      } catch (error) {
        console.error("Error fetching hubs:", error);
        setHubs([]);
      }
    };

    fetchHubs();
  }, [server]);

  return (
    <div className="rounded-lg border bg-[#F6F8F9] shadow-sm p-4 flex flex-col min-h-[49vh]">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-gray-800 text-lg">Outstanding</h2>
        <div className="flex flex-row gap-2">
          <div className="w-[175px]">
            <MonthInput
              register={register}
              setValue={setValue}
              value="from"
              placeholder="Select Month"
            />
          </div>
          <div className="w-[175px]">
            <Dropdown
              defaultValue="Hub"
              register={register}
              value="hub"
              setValue={setValue}
              options={hubs.map((hub) => hub.name || hub.code)}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 my-4">
        <RadioButtonLarge
          id="sales"
          name="accountType"
          label="Sales Person Wise"
          register={register}
          setValue={setValue}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
        />
        <RadioButtonLarge
          id="agent"
          name="accountType"
          label="Agent Wise"
          register={register}
          setValue={setValue}
          selectedValue={selectedValue}
          setSelectedValue={setSelectedValue}
        />
      </div>

      {/* Conditional Tables */}
      <div className="overflow-y-auto table-scrollbar">
        {selectedValue === "sales" ? (
          <SalesPersonTable
            register={register}
            setValue={setValue}
            month={month}
            hub={hub}
          />
        ) : (
          <AgentWiseTable
            register={register}
            setValue={setValue}
            month={month}
            hub={hub}
          />
        )}
      </div>
    </div>
  );
}

//Outstanding Card Tab 1 - Sales person wise
function SalesPersonTable({ register, setValue, month, hub }) {
  const { server } = useContext(GlobalContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `${server}/dashboard/sales-hod-dashboard/outstanding?month=${
            month || ""
          }&hub=${hub || ""}`
        );
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch {
        setRows([]);
      }
    };

    load();
  }, [server, month, hub]);

  const columns = [
    { key: "salePerson", label: "Sale Person" },
    { key: "saleAmt", label: "Sale Amt" },
    { key: "outstanding", label: "Outstanding" },
  ];

  const totalRow = {
    salePerson: "Total",
    saleAmt: rows
      .reduce((sum, r) => sum + Number(r.saleAmt || 0), 0)
      .toLocaleString(),
    outstanding: "-",
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="sales"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

//Outstanding Card Tab 2 - Agent wise
function AgentWiseTable({ register, setValue, month, hub }) {
  const { server } = useContext(GlobalContext);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch(
        `${server}/dashboard/sales-hod-dashboard/outstanding/agent?month=${
          month || ""
        }&hub=${hub || ""}`
      );
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    };
    load();
  }, [server, month, hub]);

  const columns = [
    { key: "agent", label: "Agent" },
    { key: "shipments", label: "Shipments" },
    { key: "outstanding", label: "Outstanding" },
  ];

  const totalRow = {
    agent: "Total",
    shipments: rows.reduce((sum, r) => sum + (r.shipments || 0), 0),
    outstanding: "-",
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="agent"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

//Summary
export function SummaryCard() {
  const { register, setValue, watch } = useForm();
  const [selectedValue, setSelectedValue] = useState("hub"); // default hub
  const month = watch("month");

  return (
    <div className="rounded-lg border bg-[#F6F8F9] shadow-sm p-4 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg text-gray-800">Summary</h2>
        {/* <div className="w-[350px]">
          <DateInputBox register={register} setValue={setValue} value="from" />
        </div> */}
        <div className="w-[200px]">
          <MonthInput
            register={register}
            setValue={setValue}
            value="month"
            placeholder="Select Month"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 my-4">
        <div className="w-1/3 shadow-sm">
          <RadioButtonLarge
            id="hub"
            name="summaryType"
            label="Hub Wise"
            register={register}
            setValue={setValue}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
          />
        </div>
        <div className="w-1/3 shadow-sm">
          <RadioButtonLarge
            id="service"
            name="summaryType"
            label="Service Wise"
            register={register}
            setValue={setValue}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
          />
        </div>
        <div className="w-1/3 shadow-sm">
          <RadioButtonLarge
            id="sales"
            name="summaryType"
            label="Sales Person Wise"
            register={register}
            setValue={setValue}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
          />
        </div>
      </div>

      {/* Conditional Tables */}
      <div className="overflow-x-auto">
        {selectedValue === "hub" && (
          <HubTable month={month} register={register} setValue={setValue} />
        )}
        {selectedValue === "service" && (
          <ServiceTable month={month} register={register} setValue={setValue} />
        )}
        {selectedValue === "sales" && (
          <SummarySalesPersonTable
            month={month}
            register={register}
            setValue={setValue}
          />
        )}
      </div>
    </div>
  );
}

//Summary Tab 1 - Hub
function HubTable({ register, setValue, month }) {
  const [rows, setRows] = useState([]);
  const { server } = useContext(GlobalContext);

  useEffect(() => {
    if (!month) return;

    const load = async () => {
      const res = await fetch(
        `${server}/dashboard/sales-hod-dashboard/summary/hub?month=${month}`
      );
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    };

    load();
  }, [server, month]);

  const columns = [
    { key: "hub", label: "HUB" },
    { key: "awb", label: "AWB" },
    { key: "chgWt", label: "Chg Wt" },
    { key: "total", label: "Grand Total" },
  ];

  const totalRow = {
    hub: "Total",
    awb: rows.reduce((sum, r) => sum + (r.awb || 0), 0),
    chgWt: rows.reduce((sum, r) => sum + (r.chgWt || 0), 0),
    total: rows.reduce((sum, r) => sum + (r.total || 0), 0),
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="hubSummary"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

//Summary Tab 2 - Service
function ServiceTable({ register, setValue, month }) {
  const [rows, setRows] = useState([]);
  const { server } = useContext(GlobalContext);

  useEffect(() => {
    if (!month) return;

    const load = async () => {
      const res = await fetch(
        `${server}/dashboard/sales-hod-dashboard/summary/service?month=${month}`
      );
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    };

    load();
  }, [server, month]);

  const columns = [
    { key: "service", label: "Service" },
    { key: "awb", label: "AWB Count" },
    { key: "chgWt", label: "Chg Wt" },
    { key: "total", label: "Grand Total" },
  ];

  const totalRow = {
    service: "Total",
    awb: rows.reduce((s, r) => s + (r.awb || 0), 0),
    chgWt: rows.reduce((s, r) => s + (r.chgWt || 0), 0),
    total: rows.reduce((s, r) => s + (r.total || 0), 0),
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="serviceSummary"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

//Summary Tab 3 - Sales Person Wise
function SummarySalesPersonTable({ register, setValue, month }) {
  const [rows, setRows] = useState([]);
  const { server } = useContext(GlobalContext);

  useEffect(() => {
    if (!month) return;

    const load = async () => {
      const res = await fetch(
        `${server}/dashboard/sales-hod-dashboard/summary/salesperson?month=${month}`
      );
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    };

    load();
  }, [server, month]);

  const columns = [
    { key: "salePerson", label: "Sales Person" },
    { key: "awb", label: "AWB Count" },
    { key: "chgWt", label: "Chg Wt" },
    { key: "total", label: "Grand Total" },
  ];

  const totalRow = {
    salePerson: "Total",
    awb: rows.reduce((s, r) => s + (r.awb || 0), 0),
    chgWt: rows.reduce((s, r) => s + (r.chgWt || 0), 0),
    total: rows.reduce((s, r) => s + (r.total || 0), 0),
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="salesSummary"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

//HSSB Report component
export function HSSBReport({ setNotification }) {
  const { register, setValue, handleSubmit } = useForm();
  const { states, server } = useContext(GlobalContext);
  const [isLoading, setIsLoading] = useState(false);

  const onDownload = async (form) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${server}/hssb-report/state?state=${form.state}&from=${form.from}&to=${form.to}`
      );
      const data = await res.json();

      // DEBUG: Log the structure
      // console.log("API Response:", {
//         months: data.months,
//         firstCustomer: data.masterCustomers?.[0],
//         firstCustomerRegions: data.masterCustomers?.[0]?.regions,
//       });

      downloadStateHSSB(data);
    } catch (error) {
      console.error("Download failed:", error);
      setNotification?.({
        visible: true,
        type: "error",
        message: "Failed to download report",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    <LoaderAnimation show={isLoading} />
      <div className="bg-seasalt border border-french-gray rounded-md p-5 flex flex-col gap-4">
        <h2 className="font-bold">HSSB State-wise Report</h2>

        <form onSubmit={handleSubmit(onDownload)} className="flex flex-col">
          <div className="flex w-full gap-3 pb-2">
            <div className="flex w-full gap-3">
              {/* State Dropdown (same source as Account form) */}
              <div className="w-1/4">
                <LabeledDropdown
                  register={register}
                  setValue={setValue}
                  value="state"
                  title="Select State"
                  options={["All States", ...states.map((s) => s.name)]}
                />
              </div>

              {/* From Date */}
              <div className="w-1/4">
                <MonthInput
                  register={register}
                  setValue={setValue}
                  value="from"
                  placeholder="From"
                />
              </div>

              {/* To Date */}
              <div className="w-1/4">
                <MonthInput
                  register={register}
                  setValue={setValue}
                  value="to"
                  placeholder="To"
                />
              </div>
              <div className="w-1/4">
                <SimpleButton name="Download Report" type="submit" />
              </div>
            </div>
          </div>
        </form>
      </div>{" "}
    </>
  );
}
