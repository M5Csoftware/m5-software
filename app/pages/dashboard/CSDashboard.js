"use client";
import React, { useRef, useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { SimpleButton } from "@/app/components/Buttons";
import { useForm } from "react-hook-form";
import DashboardProgressBar from "./DashboardProgressBar";
import { DropdownOptionOnly } from "@/app/components/Dropdown";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { EllipsisIcon, EllipsisVertical } from "lucide-react";
import NotificationFlag from "@/app/components/Notificationflag";
import axios from "axios";

dayjs.extend(localeData);

function parseNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = Number(String(value).replace(/[, ]+/g, ""));
    return Number.isFinite(num) ? num : NaN;
  }
  return NaN;
}

function CSDashboard() {
  const { server } = useContext(GlobalContext);
  const [selectedRanges, setSelectedRanges] = useState({
    complaints: "Today",
    shipments: "Today",
    pods: "Today",
    claims: "Today",
    bags: "Today",
  });

  const [complaintCounts, setComplaintCounts] = useState({
    portalTickets: { open: 0, resolved: 0 },
    manualTickets: { open: 0, resolved: 0 },
    totals: { open: 0, resolved: 0 },
  });
  const [holdSummary, setHoldSummary] = useState({
    shipmentCount: 0,
    totalWeight: 0,
  });
  const [podSummary, setPodSummary] = useState({ podPendingCount: 0 });
  const [complaintSummaryTable, setComplaintSummaryTable] = useState([]);
  const [podUpdates, setPodUpdates] = useState([]);
  const [ShipmentRunOverviewData, setShipmentRunOverviewData] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("Delhi");
  const [holdReports, setHoldReports] = useState([]);
  const [runHandOver, setRunHandOver] = useState([]);
  const [selectedHubForRunHandover, setSelectedHubForRunHandover] =
    useState("Delhi");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };
  const trackingReportColumns = [
    { key: "runNo", label: "Run No" },
    { key: "awbNo", label: "Awb No" },
    { key: "mawbNo", label: "Mawb No" },
    { key: "clubNo", label: "Club No" },
    { key: "customerCode", label: "Customer Code" },
    { key: "destination", label: "Destination" },
    { key: "pcs", label: "Pcs" },
    { key: "actWeight", label: "Actual Weight" },
    { key: "bagWeight", label: "Bag Weight" },
    { key: "serviceType", label: "Service Type" },
    { key: "bagNo", label: "Bag No" },
    { key: "forwarder", label: "Forwarder" },
    { key: "forwardingNo", label: "Forwarding No" },
    { key: "status", label: "Status" },
    { key: "bookingDate", label: "Booking Date" },
    { key: "unholdDate", label: "Unhold Date" },
    { key: "flightDate", label: "Flight Date" },
    { key: "landingDate", label: "Landing Date" },
    { key: "dateOfConnections", label: "Date of Connections" },
    { key: "deliveryDate", label: "Delivery Date" },
    { key: "deliveryRemarks", label: "Delivery Remarks" },
  ];

  // Function to fetch and download tracking report CSV
  const handleTrackingReportDownload = async (data) => {
    const { runNo, from, to } = data;

    // Validation
    if (!runNo && !from && !to) {
      showNotification("error", "Please enter Run Number or Date Range");
      return;
    }

    // Date range validation
    if ((from && !to) || (!from && to)) {
      showNotification("error", "Please enter both From and To dates");
      return;
    }

    setTrackingLoading(true);

    try {
      // Build query parameters
      const params = {};
      if (runNo && runNo.trim() !== "") params.runNumber = runNo.trim();
      if (from) params.fromDate = from;
      if (to) params.toDate = to;

      // Fetch tracking data
      const response = await axios.get(`${server}/tracking-report`, { params });

      if (!response.data || !Array.isArray(response.data)) {
        showNotification("error", "No data found for the given criteria");
        return;
      }

      const trackingData = response.data;

      if (trackingData.length === 0) {
        showNotification("error", "No records found");
        return;
      }

      // Generate CSV
      const headers = trackingReportColumns.map((col) => col.label).join(",");
      const csvContent = trackingData
        .map((row) =>
          trackingReportColumns
            .map((col) => {
              const value = row[col.key] || "";
              // Escape quotes and wrap in quotes if contains comma
              return `"${value.toString().replace(/"/g, '""')}"`;
            })
            .join(",")
        )
        .join("\n");

      const fullCsvContent = headers + "\n" + csvContent;

      // Create and download CSV file
      const blob = new Blob([fullCsvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Create filename with date/run number
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = runNo
        ? `tracking_report_${runNo}_${timestamp}.csv`
        : `tracking_report_${timestamp}.csv`;

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showNotification(
        "success",
        `CSV downloaded successfully! (${trackingData.length} records)`
      );
    } catch (error) {
      console.error("Error downloading tracking report:", error);
      showNotification(
        "error",
        "Failed to download tracking report. Please try again."
      );
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    const fetchShipmentRunOverview = async () => {
      try {
        const res = await fetch(`${server}/cs-dashboard/shipment-run-overview`);
        const data = await res.json();
        setShipmentRunOverviewData({ "Last 7 Days": data });
      } catch (err) {
        console.error("Error fetching shipment run overview:", err);
      }
    };
    fetchShipmentRunOverview();
  }, [server]);

  useEffect(() => {
    const fetchRunSummary = async () => {
      try {
        const res = await fetch(`${server}/cs-dashboard/run-summary`);
        const data = await res.json();
        setPodUpdates(data);
      } catch (err) {
        console.error("Error fetching Run Summary:", err);
      }
    };

    fetchRunSummary();
  }, [server]);

  useEffect(() => {
    const fetchComplaintSummary = async () => {
      try {
        const res = await fetch(`${server}/cs-dashboard/complaint-summary`);
        const data = await res.json();
        setComplaintSummaryTable(data);
      } catch (err) {
        console.error("Error fetching complaint summary table:", err);
      }
    };

    fetchComplaintSummary();
  }, []);

  useEffect(() => {
    const fetchPodSummary = async () => {
      const res = await fetch(`${server}/cs-dashboard/pod`);
      const data = await res.json();
      setPodSummary(data);
    };
    fetchPodSummary();
  }, []);

  useEffect(() => {
    setHoldSummary({ shipmentCount: 14, totalWeight: 1250 });
  }, []);

  useEffect(() => {
    const fetchHoldSummary = async () => {
      const res = await fetch(`${server}/cs-dashboard/hold-summary`);
      const data = await res.json();
      setHoldSummary(data);
    };
    fetchHoldSummary();
  }, []);

  useEffect(() => {
    const fetchComplaintCounts = async () => {
      try {
        const res = await fetch(`${server}/cs-dashboard/tickets`);
        const data = await res.json();
        setComplaintCounts(data);
      } catch (err) {
        console.error("Error fetching complaints summary:", err);
      }
    };

    fetchComplaintCounts();
  }, []);

  const summaries = [
    {
      key: "complaints",
      title: "COMPLAINTS",
      Component: (
        <Complaints
          data1={complaintCounts?.totals?.open ?? 0}
          data2={complaintCounts?.totals?.resolved ?? 0}
          label1="Open"
          label2="Resolved"
        />
      ),
      link: "/ticket-dashboard",
    },
    {
      key: "shipments",
      title: "SHIPMENTS ON HOLD",
      Component: (
        <Value
          value={holdSummary.shipmentCount || 0}
          label="Shipments"
          subValue={`${holdSummary.totalWeight || 0} kg`}
          subLabel="Total Weight"
        />
      ),
    },
    {
      key: "pods",
      title: "PODS PENDING",
      Component: (
        <Value value={podSummary.podPendingCount || 0} label="Pending" />
      ),
    },
    {
      key: "claims",
      title: "CLAIMS PENDING",
      Component: <Value value={4} />,
    },
    {
      key: "bags",
      title: "TOTAL BAGS",
      Component: <Value value={555} />,
    },
  ];

  const defaultShipmentRunOverviewData = {
    "Last 7 Days": [
      { label: "Active Runs", value: 18 },
      { label: "Delays Notified", value: 5 },
      { label: "Total Bags", value: 420 },
      { label: "Pending Pre-Alerts", value: 7 },
      { label: "Total Weight", value: "12,350 kg" },
    ],
    "Last 30 Days": [
      { label: "Active Runs", value: 72 },
      { label: "Delays Notified", value: 19 },
      { label: "Total Bags", value: 1_750 },
      { label: "Pending Pre-Alerts", value: 15 },
      { label: "Total Weight", value: "51,480 kg" },
    ],
    "Last Year": [
      { label: "Active Runs", value: 860 },
      { label: "Delays Notified", value: 210 },
      { label: "Total Bags", value: 21_600 },
      { label: "Pending Pre-Alerts", value: 65 },
      { label: "Total Weight", value: "645,320 kg" },
    ],
  };

  // aggregated summary numbers (kept for the small chart box)
  const defaultComplaintSummaryData = {
    "Last 7 Days": [
      { label: "Complaints Received", value: 18 },
      { label: "Resolved", value: 13 },
      { label: "Unresolved", value: 5 },
    ],
    "Last 30 Days": [
      { label: "Complaints Received", value: 72 },
      { label: "Resolved", value: 60 },
      { label: "Unresolved", value: 12 },
    ],
    "Last Year": [
      { label: "Complaints Received", value: 860 },
      { label: "Resolved", value: 800 },
      { label: "Unresolved", value: 60 },
    ],
  };

  const options = Object.keys(defaultComplaintSummaryData); // use complaint ranges for select

  const [complaintSummaryData, setComplaintSummaryData] = useState(
    defaultComplaintSummaryData
  );
  const [complaintSummarySelectedRange, setComplaintSummarySelectedRange] =
    useState("Last 7 Days");

  // --- POD calendar state
  const calendarRefPODUpdate = useRef(null);
  const [selectedMonthForPODUpdate, setSelectedMonthForPODUpdate] = useState(
    dayjs()
  );
  const [showCalendarForPODUpdate, setShowCalendarForPODUpdate] =
    useState(false);

  // Run Handover calendar state (mirrors OperationDashboard)
  const calendarRefRunHandover = useRef(null);
  const [selectedMonthForRunHandover, setSelectedMonthForRunHandover] =
    useState(dayjs());
  const [showCalendarForRunHandover, setShowCalendarForRunHandover] =
    useState(false);

  // Hold Report Calendar state
  const calendarRefHoldReport = useRef(null);
  const [selectedMonthForHoldReport, setSelectedMonthForHoldReport] = useState(
    dayjs()
  );
  const [showCalendarForHoldReport, setShowCalendarForHoldReport] =
    useState(false);

  const tableHeadersForPODUpdate = ["Date", "Run Number", "Sector", "Status"];

  // Run Hand Over table (array-of-objects)
  const tableHeadersForRunHandover = [
    "Flight Date",
    "Sector",
    "Run Number",
    "BAG",
    "Weight",
    "Pre-Alert",
  ];

  const tableHeadersForHoldReport = [
    "Service",
    "Reason Wise",
    "Without Reason",
    "Adv. Bagging",
    "AMD/MUM-DEL",
    "Total W/O Hold",
    "Total with Hold",
  ];

  const tableHeadersForComplaintSummary = [
    "Customer",
    "Resolved",
    "UnResolved",
  ];

  // complaint rows per range - you can replace numbers with real data later
  const complaintSummariesByRange = {
    "Last 7 Days": [
      {
        Customer: {
          id: "RJ061",
          name: "Rajat Jain",
          profile: "/customer_logo.png",
        },
        Resolved: 12,
        UnResolved: 5,
      },
      {
        Customer: {
          id: "AN102",
          name: "Anita Nair",
          profile: "/customer_logo.png",
        },
        Resolved: 8,
        UnResolved: 2,
      },
      {
        Customer: {
          id: "MK220",
          name: "Mohit Kumar",
          profile: "/customer_logo.png",
        },
        Resolved: 10,
        UnResolved: 1,
      },
    ],
    "Last 30 Days": [
      {
        Customer: {
          id: "RJ061",
          name: "Rajat Jain",
          profile: "/customer_logo.png",
        },
        Resolved: 30,
        UnResolved: 10,
      },
      {
        Customer: {
          id: "AN102",
          name: "Anita Nair",
          profile: "/customer_logo.png",
        },
        Resolved: 22,
        UnResolved: 5,
      },
      {
        Customer: {
          id: "MK220",
          name: "Mohit Kumar",
          profile: "/customer_logo.png",
        },
        Resolved: 28,
        UnResolved: 3,
      },
    ],
    "Last Year": [
      {
        Customer: {
          id: "RJ061",
          name: "Rajat Jain",
          profile: "/customer_logo.png",
        },
        Resolved: 320,
        UnResolved: 40,
      },
      {
        Customer: {
          id: "AN102",
          name: "Anita Nair",
          profile: "/customer_logo.png",
        },
        Resolved: 250,
        UnResolved: 30,
      },
      {
        Customer: {
          id: "MK220",
          name: "Mohit Kumar",
          profile: "/customer_logo.png",
        },
        Resolved: 290,
        UnResolved: 20,
      },
    ],
  };

  // displayed rows based on selected range
  const displayedComplaintSummaries = complaintSummaryTable.map((item) => ({
    Customer: {
      id: item.accountCode,
      name: item.name,
      profile: "/customer_logo.png",
    },
    Resolved: item.resolved,
    UnResolved: item.unresolved,
  }));

  const { register, setValue, handleSubmit } = useForm();

  const months = dayjs.months();

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRefPODUpdate.current &&
        !calendarRefPODUpdate.current.contains(event.target)
      ) {
        setShowCalendarForPODUpdate(false);
      }
      if (
        calendarRefRunHandover.current &&
        !calendarRefRunHandover.current.contains(event.target)
      ) {
        setShowCalendarForRunHandover(false);
      }
      if (
        calendarRefHoldReport.current &&
        !calendarRefHoldReport.current.contains(event.target)
      ) {
        setShowCalendarForHoldReport(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // unified handler for month click
  const handleMonthClick = (monthIndex, type) => {
    const now = dayjs();
    if (type === "podUpdates") {
      const selectedMonth = selectedMonthForPODUpdate;
      const newDate = dayjs().year(selectedMonth.year()).month(monthIndex);
      if (newDate.isAfter(now, "month")) return;
      setSelectedMonthForPODUpdate(newDate);
      setShowCalendarForPODUpdate(false);
      return;
    }

    if (type === "runHandover") {
      const selectedMonth = selectedMonthForRunHandover;
      const newDate = dayjs().year(selectedMonth.year()).month(monthIndex);
      if (newDate.isAfter(now, "month")) return;
      setSelectedMonthForRunHandover(newDate);
      setShowCalendarForRunHandover(false);
      return;
    }
    if (type === "holdReport") {
      const selectedMonth = selectedMonthForHoldReport;
      const newDate = dayjs().year(selectedMonth.year()).month(monthIndex);
      if (newDate.isAfter(now, "month")) return;
      setSelectedMonthForHoldReport(newDate);
      setShowCalendarForHoldReport(false);
      return;
    }
  };

  // unified changeYear
  const changeYear = (delta, type) => {
    const currentYear = dayjs().year();
    if (type === "podUpdates") {
      setSelectedMonthForPODUpdate((prev) => {
        const newYear = prev.year() + delta;
        if (newYear > currentYear) return prev;
        return prev.year(newYear);
      });
      return;
    }
    if (type === "runHandover") {
      setSelectedMonthForRunHandover((prev) => {
        const newYear = prev.year() + delta;
        if (newYear > currentYear) return prev;
        return prev.year(newYear);
      });
      return;
    }
    if (type === "holdReport") {
      setSelectedMonthForHoldReport((prev) => {
        const newYear = prev.year() + delta;
        if (newYear > currentYear) return prev;
        return prev.year(newYear);
      });
      return;
    }
  };

  // totals for runHandOver
  const totalBags = runHandOver.reduce(
    (acc, row) => acc + (parseNumber(row["BAG"]) || 0),
    0
  );
  const totalWeight = runHandOver.reduce(
    (acc, row) => acc + (parseNumber(row["Weight"]) || 0),
    0
  );

  // Helper to compute hold totals (numbers only)
  const computeHoldTotalForHeader = (header) => {
    return holdReports.reduce((acc, row) => {
      const v = parseNumber(row[header]);
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
  };

  const fetchHoldReport = async () => {
    if (!selectedBranch) return;

    const month = selectedMonthForHoldReport.month();
    const year = selectedMonthForHoldReport.year();

    console.log("Fetching Hold Report →", {
      month,
      year,
      selectedBranch,
      url: `${server}/cs-dashboard/hold-report?month=${month}&year=${year}&origin=${selectedBranch}`,
    });

    const res = await fetch(
      `${server}/cs-dashboard/hold-report?month=${month}&year=${year}&origin=${selectedBranch}`
    );

    const data = await res.json();
    setHoldReports(data);
  };

  useEffect(() => {
    fetchHoldReport();
  }, [selectedMonthForHoldReport, selectedBranch]);

  const fetchRunHandover = async () => {
    const month = selectedMonthForRunHandover.month();
    const year = selectedMonthForRunHandover.year();

    const res = await fetch(
      `${server}/cs-dashboard/run-report?month=${month}&year=${year}&hub=${selectedHubForRunHandover}`
    );

    const data = await res.json();

    // DO NOT TOUCH THE KEYS – use as-is from backend
    setRunHandOver(data);
  };

  useEffect(() => {
    fetchRunHandover();
  }, [selectedMonthForRunHandover, selectedHubForRunHandover]);

  const formatDateDDMMYYYY = (d) => {
    if (!d) return "";
    const date = dayjs(d);
    return date.isValid() ? date.format("DD/MM/YYYY") : d;
  };

  return (
    <div className="flex flex-col gap-7">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />
      <div className="flex justify-between gap-3">
        {summaries.map(({ key, title, Component, link }, index) => (
          <CSValue
            key={index}
            title={title}
            link={link}
            DataComponent={Component}
            rangeKey={key}
            selectedRanges={selectedRanges}
            setSelectedRanges={setSelectedRanges}
          />
        ))}
      </div>

      <div className="flex gap-9">
        <div className="flex flex-col gap-6 w-full">
          <div className=" bg-seasalt  border border-french-gray rounded-md h-48 p-5 flex flex-col gap-4">
            <h2 className="font-bold">Tracking Report</h2>
            <form
              onSubmit={handleSubmit(handleTrackingReportDownload)}
              className="flex flex-col gap-3 text-sm"
            >
              <InputBox
                placeholder={`Run Number`}
                register={register}
                setValue={setValue}
                value={`runNo`}
              />
              <div className="flex gap-2 ">
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value={"from"}
                  placeholder="From"
                />
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value={"to"}
                  placeholder="To"
                />
                <SimpleButton
                  name={trackingLoading ? "Downloading..." : "Download CSV"}
                  type="submit"
                  disabled={trackingLoading}
                />
              </div>
            </form>
          </div>

          {/* POD Update (object rows) */}
          <div className="p-5 border-battleship-gray border h-[52vh] bg-seasalt rounded-md flex flex-col gap-5">
            <div className="flex justify-between items-start flex-col gap-4">
              <span className="font-bold">Run Summary</span>

              <div className="flex gap-8 text-xs">
                <div
                  className="relative inline-block"
                  ref={calendarRefPODUpdate}
                >
                  {/* Calendar Trigger */}
                  <div
                    className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-2 px-6 border-battleship-gray bg-white w-[255px] cursor-pointer"
                    onClick={() =>
                      setShowCalendarForPODUpdate(!showCalendarForPODUpdate)
                    }
                  >
                    <div className="flex items-center gap-1">
                      <span>
                        {selectedMonthForPODUpdate.format("MMMM")},{" "}
                        {selectedMonthForPODUpdate.format("YYYY")}
                      </span>
                    </div>
                    <img
                      src="calender.svg"
                      height={18}
                      width={18}
                      alt="calendar"
                    />
                  </div>

                  {/* Calendar Popover */}
                  {showCalendarForPODUpdate && (
                    <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-[255px]">
                      <div className="flex justify-between items-center mb-3">
                        <button onClick={() => changeYear(-1, "podUpdates")}>
                          &lt;
                        </button>
                        <span className="font-semibold">
                          {selectedMonthForPODUpdate.year()}
                        </span>
                        <button
                          onClick={() => changeYear(1, "podUpdates")}
                          disabled={
                            selectedMonthForPODUpdate.year() >= dayjs().year()
                          }
                        >
                          &gt;
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {months.map((month, index) => {
                          const isFuture = dayjs()
                            .year(selectedMonthForPODUpdate.year())
                            .month(index)
                            .isAfter(dayjs(), "month");

                          return (
                            <button
                              key={month}
                              onClick={() =>
                                !isFuture &&
                                handleMonthClick(index, "podUpdates")
                              }
                              disabled={isFuture}
                              className={`py-1 px-2 rounded text-xs transition-colors duration-200 ${
                                selectedMonthForPODUpdate.month() === index &&
                                !isFuture
                                  ? "bg-red text-white"
                                  : isFuture
                                  ? "text-gray-400 cursor-not-allowed"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              {month}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-[255px] bg-white">
                  <DropdownOptionOnly
                    defaultValue="Delhi"
                    options={["Delhi", "Mumbai", "Ahemdabad"]}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-l border-r border-alice-blue border-collapse rounded-md overflow-hidden">
              <div className="bg-white h-[40vh] shadow border-b overflow-x-auto">
                <table className="w-full text-dim-gray border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "28%" }} />
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "6%" }} />
                  </colgroup>
                  <thead className="bg-seasalt text-xs font-medium">
                    <tr className="border-b border-alice-blue">
                      {tableHeadersForPODUpdate.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-2 text-center whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                      <th className="w-14"></th>
                    </tr>
                  </thead>
                </table>

                <div className="max-h-[370px] table-scrollbar overflow-y-auto hidden-scrollbar">
                  <table className="w-full text-sm border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: "28%" }} />
                      <col style={{ width: "28%" }} />
                      <col style={{ width: "28%" }} />
                      <col style={{ width: "16%" }} />
                      <col style={{ width: "6%" }} />
                    </colgroup>
                    <tbody>
                      {podUpdates.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="bg-white border-b border-alice-blue"
                        >
                          {tableHeadersForPODUpdate.map((header, cellIndex) => {
                            const key =
                              header === "Run Number" ? "RunNumber" : header;
                            const cell = row[key];
                            const isStatusColumn = header === "Status";

                            return (
                              <td
                                key={cellIndex}
                                className="px-4 py-3 text-center text-dim-gray "
                              >
                                {isStatusColumn ? (
                                  <span
                                    className={`text-xs py-0.5 px-2 rounded-full border ${
                                      cell === "Pending"
                                        ? "bg-old-gold/10 text-old-gold border-old-gold"
                                        : cell === "Delivered"
                                        ? "bg-green-3/10 text-green-3 border-green-3"
                                        : "bg-vista-blue/10 text-vista-blue border-vista-blue"
                                    }`}
                                  >
                                    {cell}
                                  </span>
                                ) : header === "Date" ? (
                                  formatDateDDMMYYYY(cell)
                                ) : (
                                  cell
                                )}
                              </td>
                            );
                          })}
                          <td className="w-14 text-center">
                            <span className="text-xl font-bold text-gray-400">
                              <EllipsisVertical className="w-5 h-5 cursor-pointer" />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 w-full">
          {/* Complaint Summary */}
          <div className="p-5 border-battleship-gray border h-full bg-seasalt rounded-md flex flex-col gap-5">
            <div className="flex justify-between items-center gap-4">
              <span className="font-bold">Complaint Summary</span>
              <select
                className="text-dim-gray text-xs border border-gray-300 px-2 py-1 rounded"
                value={complaintSummarySelectedRange}
                onChange={(e) =>
                  setComplaintSummarySelectedRange(e.target.value)
                }
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-l border-r border-alice-blue border-collapse rounded-md overflow-hidden">
              <div className="overflow-x-auto bg-white h-[32vh]">
                <table className="w-full text-dim-gray border-collapse table-fixed">
                  <colgroup>
                    <col style={{ width: "58%" }} />
                    <col style={{ width: "21%" }} />
                    <col style={{ width: "21%" }} />
                    <col style={{ width: "6%" }} />
                  </colgroup>
                  <thead className="bg-seasalt text-xs font-medium">
                    <tr className="border-b border-alice-blue">
                      {tableHeadersForComplaintSummary.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-2 text-left whitespace-nowrap"
                        >
                          {header}
                        </th>
                      ))}
                      <th className="w-14"></th>
                    </tr>
                  </thead>
                </table>

                <div className=" table-scrollbar overflow-y-auto hidden-scrollbar">
                  <table className="w-full text-sm border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: "58%" }} />
                      <col style={{ width: "21%" }} />
                      <col style={{ width: "21%" }} />
                      <col style={{ width: "6%" }} />
                    </colgroup>
                    <tbody>
                      {displayedComplaintSummaries.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="bg-white border-b border-alice-blue"
                        >
                          {tableHeadersForComplaintSummary.map(
                            (header, cellIndex) => {
                              // Map header to object key
                              const key = header; // headers match object keys: 'Customer', 'Resolved', 'UnResolved'
                              const cell = row[key];

                              // Customer cell: render avatar + name + id
                              if (key === "Customer") {
                                const customer = cell || {};
                                return (
                                  <td
                                    key={cellIndex}
                                    className="px-4 py-3 text-dim-gray"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 relative rounded-full overflow-hidden">
                                        {/* plain <img> is fine here; if you prefer next/image you can swap */}
                                        <img
                                          src={
                                            customer.profile ||
                                            "/customer_logo.png"
                                          }
                                          alt={customer.name || "Customer"}
                                          width={36}
                                          height={36}
                                        />
                                      </div>
                                      <div className="text-left">
                                        <div className="text-sm font-medium">
                                          {customer.name || customer.id || "-"}
                                        </div>
                                        <div className="text-xs text-dim-gray">
                                          # {customer.id || ""}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                );
                              }

                              // Numeric cells (Resolved / UnResolved) — render inside a square
                              return (
                                <td
                                  key={cellIndex}
                                  className="px-4 py-3 text-center text-dim-gray"
                                >
                                  <span
                                    className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-sm font-medium border ${
                                      cellIndex === 1
                                        ? "text-green-3 border-green-3 bg-green-3/10"
                                        : cellIndex === 2
                                        ? "text-red border-red bg-red/10"
                                        : ""
                                    }`}
                                  >
                                    {typeof cell === "number"
                                      ? cell
                                      : cell ?? ""}
                                  </span>
                                </td>
                              );
                            }
                          )}
                          <td className="w-14 text-center">
                            <span className="text-xl font-bold text-gray-400">
                              <EllipsisVertical className="w-5 h-5 cursor-pointer" />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <DashboardProgressBar
            data={ShipmentRunOverviewData}
            title={`Shipment Run Overview`}
            rupee={false}
          />
        </div>
      </div>

      {/* Hold Report */}
      <div className="p-5 border-battleship-gray border bg-seasalt rounded-md flex flex-col gap-5 ">
        <div className="flex justify-between items-start">
          <span className="font-bold ">Hold Report</span>
          <div className="flex gap-8 text-xs">
            <div className="relative inline-block" ref={calendarRefHoldReport}>
              {/* Calendar Trigger */}
              <div
                className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-2 px-6 border-battleship-gray bg-white w-[255px] cursor-pointer"
                onClick={() =>
                  setShowCalendarForHoldReport(!showCalendarForHoldReport)
                }
              >
                <div className="flex items-center gap-1">
                  <span>
                    {selectedMonthForHoldReport.format("MMMM")},{" "}
                    {selectedMonthForHoldReport.format("YYYY")}
                  </span>
                </div>
                <img src="calender.svg" height={18} width={18} alt="calendar" />
              </div>

              {/* Calendar Popover */}
              {showCalendarForHoldReport && (
                <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-[255px]">
                  <div className="flex justify-between items-center mb-3">
                    <button onClick={() => changeYear(-1, "holdReport")}>
                      &lt;
                    </button>
                    <span className="font-semibold">
                      {selectedMonthForHoldReport.year()}
                    </span>
                    <button
                      onClick={() => changeYear(1, "holdReport")}
                      disabled={
                        selectedMonthForHoldReport.year() >= dayjs().year()
                      }
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => {
                      const isFuture = dayjs()
                        .year(selectedMonthForHoldReport.year())
                        .month(index)
                        .isAfter(dayjs(), "month");

                      return (
                        <button
                          key={month}
                          onClick={() =>
                            !isFuture && handleMonthClick(index, "holdReport")
                          }
                          disabled={isFuture}
                          className={`py-1 px-2 rounded text-xs transition-colors duration-200 ${
                            selectedMonthForHoldReport.month() === index &&
                            !isFuture
                              ? "bg-red text-white"
                              : isFuture
                              ? "text-gray-400 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="w-[255px] bg-white">
              <DropdownOptionOnly
                value={selectedBranch}
                onChange={setSelectedBranch}
                options={["Delhi", "Mumbai", "Ahemdabad"]}
              />
            </div>
          </div>
        </div>
        {/* Hold Report (object rows + totals) */}
        <div className="border-t border-l border-r border-alice-blue border-collapse rounded-md overflow-hidden ">
          <div className="overflow-x-auto">
            <table className="w-full text-dim-gray border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "18%" }} /> {/* Service */}
                <col style={{ width: "12%" }} /> {/* Reason Wise */}
                <col style={{ width: "12%" }} /> {/* Without Reason */}
                <col style={{ width: "12%" }} /> {/* Adv. Baggiing */}
                <col style={{ width: "12%" }} /> {/* AMD/MUM-DEL */}
                <col style={{ width: "18%" }} /> {/* Total W/O Hold */}
                <col style={{ width: "12%" }} /> {/* Total with Hold */}
                <col style={{ width: "6%" }} /> {/* action column */}
              </colgroup>
              <thead className="bg-seasalt text-xs font-medium">
                <tr className="border-b border-alice-blue">
                  {tableHeadersForHoldReport.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 text-center whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="w-14"></th>
                </tr>
              </thead>
            </table>

            <div className="max-h-[370px] table-scrollbar overflow-y-auto hidden-scrollbar">
              <table className="w-full text-sm border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: "18%" }} /> {/* Service */}
                  <col style={{ width: "12%" }} /> {/* Reason Wise */}
                  <col style={{ width: "12%" }} /> {/* Without Reason */}
                  <col style={{ width: "12%" }} /> {/* Adv. Baggiing */}
                  <col style={{ width: "12%" }} /> {/* AMD/MUM-DEL */}
                  <col style={{ width: "18%" }} /> {/* Total W/O Hold */}
                  <col style={{ width: "12%" }} /> {/* Total with Hold */}
                  <col style={{ width: "6%" }} /> {/* action column */}
                </colgroup>
                <tbody>
                  {holdReports.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="bg-white border-b border-alice-blue"
                    >
                      {tableHeadersForHoldReport.map((header, cellIndex) => {
                        const key = header === "Service" ? "Service" : header;
                        const cell = row[key];

                        return (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 text-center text-dim-gray "
                          >
                            {cell}
                          </td>
                        );
                      })}

                      {/* single action column to match header */}
                      <td className="w-14 text-center">
                        <div className="flex  items-center gap-3">
                          <span className="text-red text-sm cursor-pointer">
                            View
                          </span>
                          <span className="text-xl font-bold text-gray-400 cursor-pointer">
                            :
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fixed Total Row for Hold Report */}
            <table className="w-full text-sm border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>
              <tfoot>
                <tr className="bg-alice-blue text-center font-medium">
                  {tableHeadersForHoldReport.map((header, index) => {
                    if (index === 0) {
                      return (
                        <td className="px-4 py-3 text-center" key={index}>
                          Grand Total
                        </td>
                      );
                    }

                    const anyNumeric = holdReports.some((r) => {
                      const v = r[header];
                      return (
                        typeof v === "number" ||
                        (typeof v === "string" &&
                          !isNaN(Number(String(v).replace(/[, ]+/g, ""))))
                      );
                    });

                    const total = anyNumeric
                      ? computeHoldTotalForHeader(header)
                      : "";

                    return (
                      <td className="px-4 py-3 text-center" key={index}>
                        {anyNumeric ? total : ""}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-center"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Run Hand Over */}
      <div className="p-5 border-battleship-gray border bg-seasalt rounded-md flex flex-col gap-5 ">
        <div className="flex justify-between items-start">
          <span className="font-bold ">Run Hand Over</span>
          <div className="flex gap-8 text-xs">
            <div className="relative inline-block" ref={calendarRefRunHandover}>
              {/* Calendar Trigger */}
              <div
                className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-2 px-6 border-battleship-gray bg-white w-[255px] cursor-pointer"
                onClick={() =>
                  setShowCalendarForRunHandover(!showCalendarForRunHandover)
                }
              >
                <div className="flex items-center gap-1">
                  <span>
                    {selectedMonthForRunHandover.format("MMMM")},{" "}
                    {selectedMonthForRunHandover.format("YYYY")}
                  </span>
                </div>
                <img src="calender.svg" height={18} width={18} alt="calendar" />
              </div>

              {/* Calendar Popover */}
              {showCalendarForRunHandover && (
                <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-[255px]">
                  <div className="flex justify-between items-center mb-3">
                    <button onClick={() => changeYear(-1, "runHandover")}>
                      &lt;
                    </button>
                    <span className="font-semibold">
                      {selectedMonthForRunHandover.year()}
                    </span>
                    <button
                      onClick={() => changeYear(1, "runHandover")}
                      disabled={
                        selectedMonthForRunHandover.year() >= dayjs().year()
                      }
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => {
                      const isFuture = dayjs()
                        .year(selectedMonthForRunHandover.year())
                        .month(index)
                        .isAfter(dayjs(), "month");

                      return (
                        <button
                          key={month}
                          onClick={() =>
                            !isFuture && handleMonthClick(index, "runHandover")
                          }
                          disabled={isFuture}
                          className={`py-1 px-2 rounded text-xs transition-colors duration-200 ${
                            selectedMonthForRunHandover.month() === index &&
                            !isFuture
                              ? "bg-red text-white"
                              : isFuture
                              ? "text-gray-400 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="w-[255px] bg-white">
              <DropdownOptionOnly
                value={selectedHubForRunHandover}
                onChange={setSelectedHubForRunHandover}
                options={["Delhi", "Mumbai", "Ahemdabad"]}
              />
            </div>
          </div>
        </div>
        {/* Run Hand Over (array-of-objects rows + totals) */}
        <div className="border-t border-l border-r border-alice-blue border-collapse rounded-md overflow-hidden ">
          <div className="overflow-x-auto">
            <table className="w-full text-dim-gray border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>

              <thead className="bg-seasalt text-xs font-medium">
                <tr className="border-b border-alice-blue">
                  {tableHeadersForRunHandover.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 text-center whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="w-14"></th>
                </tr>
              </thead>
            </table>

            <div className="max-h-[370px] table-scrollbar overflow-y-auto hidden-scrollbar">
              <table className="w-full text-sm border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "22%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "6%" }} />
                </colgroup>
                <tbody>
                  {runHandOver.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className="bg-white border-b border-alice-blue"
                    >
                      {tableHeadersForRunHandover.map((header, cellIndex) => {
                        const cell = row[header];
                        const isPreAlertColumn = header === "Pre-Alert";
                        return (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 text-center text-dim-gray "
                          >
                            {isPreAlertColumn ? (
                              <span
                                className={`text-xs py-0.5 px-2 rounded-full border ${
                                  cell === "Pending"
                                    ? "bg-old-gold/10 text-old-gold border-old-gold"
                                    : "bg-green-3/10 text-green-3 border-green-3"
                                }`}
                              >
                                {cell}
                              </span>
                            ) : (
                              cell
                            )}
                          </td>
                        );
                      })}
                      <td className="w-14 text-center">
                        <span className="text-xl font-bold text-gray-400">
                          :
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Fixed Total Row (same as OperationDashboard) */}
            <table className="w-full text-sm border-collapse table-fixed">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "6%" }} />
              </colgroup>
              <tfoot>
                <tr className="bg-alice-blue text-center font-medium">
                  {tableHeadersForRunHandover.map((header, index) => {
                    if (index === 0)
                      return (
                        <td className="px-4 py-3 text-center" key={index}>
                          Total
                        </td>
                      );
                    if (header === "BAG")
                      return (
                        <td className="px-4 py-3 text-center" key={index}>
                          {totalBags}
                        </td>
                      );
                    if (header === "Weight")
                      return (
                        <td className="px-4 py-3 text-center" key={index}>
                          {totalWeight.toFixed(2)}
                        </td>
                      );
                    return (
                      <td className="px-4 py-3 text-center" key={index}></td>
                    );
                  })}
                  <td className="px-4 py-3 text-center"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic Value box
function CSValue({
  title,
  link,
  DataComponent,
  rangeKey,
  selectedRanges,
  setSelectedRanges,
}) {
  return (
    <div className="flex flex-col gap-2.5 border p-4 rounded-md border-french-gray w-full">
      <div className="flex justify-between items-center text-xs text-dim-gray font-semibold">
        <span>{title}</span>
        <RangeDropdown
          selected={selectedRanges[rangeKey]}
          setSelected={(v) =>
            setSelectedRanges((prev) => ({ ...prev, [rangeKey]: v }))
          }
        />
      </div>

      <div className="flex justify-between items-end">
        <div>{DataComponent}</div>
        <Link href={link || "#"} className="hover:opacity-80">
          <Image
            src="/external-link.svg"
            alt="external link"
            width={18}
            height={18}
          />
        </Link>
      </div>
    </div>
  );
}

function Value({ value, label, subValue, subLabel, color = "text-red" }) {
  return (
    <div className="flex gap-6">
      <div className="flex flex-col">
        <span className={`font-bold text-lg ${color}`}>{value}</span>
        <span className="text-xs text-dim-gray">{label}</span>
      </div>

      {/* show second value below if provided */}
      {subValue !== undefined && (
        <div className="flex-col flex">
          <span className="font-semibold text-lg text-green-3">{subValue}</span>
          <span className="text-xs text-dim-gray ml-1">{subLabel}</span>
        </div>
      )}
    </div>
  );
}

function Complaints({ data1, data2, label1, label2 }) {
  return (
    <div className="flex gap-6">
      <Value value={data1} label={label1} color="text-red" />
      <Value value={data2} label={label2} color="text-green-3" />
    </div>
  );
}

function RangeDropdown({ selected, setSelected }) {
  const options = ["Today", "Last 7 Days", "Last 30 Days"];
  return (
    <div className="relative inline-block">
      <select
        className="text-[10px] border border-gray-300 px-2 py-[2px] pr-5 rounded text-dim-gray appearance-none cursor-pointer bg-white"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            &nbsp;{opt}
          </option>
        ))}
      </select>

      {/* custom small arrow */}
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[8px] text-gray-500">
        ▼
      </span>
    </div>
  );
}

export default CSDashboard;
