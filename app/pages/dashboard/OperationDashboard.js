
import React, { useState, useRef, useEffect, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import DashboardProgressBar from "./DashboardProgressBar";
import localeData from "dayjs/plugin/localeData";
import { Dropdown, DropdownOptionOnly } from "@/app/components/Dropdown";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";

dayjs.extend(localeData);

function OperationDashboard() {
  const { server } = useContext(GlobalContext);
  const [selectedDateForRunHandover, setSelectedDateForRunHandover] = useState(
    dayjs()
  );
  const [selectedDateForOldShipment, setSelectedDateForOldShipment] = useState(
    dayjs()
  );
  const [showCalendarForRunHandover, setShowCalendarForRunHandover] =
    useState(false);
  const [showCalendarForOldShipment, setShowCalendarForOldShipment] =
    useState(false);
  const [runHandOverData, setRunHandOverData] = useState([]);
  const [oldShipmentData, setOldShipmentData] = useState([]);
  const [loadingRunHandover, setLoadingRunHandover] = useState(false);
  const [loadingOldShipment, setLoadingOldShipment] = useState(false);
  const [selectedHubForRunHandover, setSelectedHubForRunHandover] =
    useState("Delhi");
  const [selectedOriginForOldShipment, setSelectedOriginForOldShipment] =
    useState("Delhi");

  const calendarRefRunHandover = useRef(null);
  const calendarRefOldShipment = useRef(null);

  // Fetch run handover data
  const fetchRunHandoverData = async (date, hub) => {
    try {
      setLoadingRunHandover(true);
      const response = await axios.get(
        `${server}/operations-dashboard/run-hand?date=${date.format(
          "YYYY-MM-DD"
        )}&hub=${hub}`
      );
      if (response.data.success) {
        setRunHandOverData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching run handover data:", error);
      setRunHandOverData([]);
    } finally {
      setLoadingRunHandover(false);
    }
  };

  // Fetch old shipment data
  const fetchOldShipmentData = async (date, origin) => {
    try {
      setLoadingOldShipment(true);
      const response = await axios.get(
        `${server}/operations-dashboard/old-shipment?date=${date.format(
          "YYYY-MM-DD"
        )}&origin=${origin}`
      );
      if (response.data.success) {
        setOldShipmentData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching old shipment data:", error);
      setOldShipmentData([]);
    } finally {
      setLoadingOldShipment(false);
    }
  };

  // Download Excel for old shipment
  const downloadOldShipmentExcel = async () => {
    try {
      const response = await axios.get(
        `${server}/operations-dashboard/old-shipment?date=${selectedDateForOldShipment.format(
          "YYYY-MM-DD"
        )}&origin=${selectedOriginForOldShipment}&download=true`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const filename = response.headers["content-disposition"]
        ? response.headers["content-disposition"]
            .split("filename=")[1]
            .replace(/"/g, "")
        : `old-shipment-${selectedDateForOldShipment.format(
            "YYYY-MM-DD"
          )}-${selectedOriginForOldShipment}.xlsx`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Excel file:", error);
      alert("Failed to download Excel file");
    }
  };

  // Fetch run handover data when its specific dependencies change
  useEffect(() => {
    fetchRunHandoverData(selectedDateForRunHandover, selectedHubForRunHandover);
  }, [selectedDateForRunHandover, selectedHubForRunHandover]);

  // Fetch old shipment data when its specific dependencies change
  useEffect(() => {
    fetchOldShipmentData(
      selectedDateForOldShipment,
      selectedOriginForOldShipment
    );
  }, [selectedDateForOldShipment, selectedOriginForOldShipment]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRefRunHandover.current &&
        !calendarRefRunHandover.current.contains(event.target)
      ) {
        setShowCalendarForRunHandover(false);
      }
      if (
        calendarRefOldShipment.current &&
        !calendarRefOldShipment.current.contains(event.target)
      ) {
        setShowCalendarForOldShipment(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (date, type) => {
    if (type === "runHandover") {
      setSelectedDateForRunHandover(date);
      setShowCalendarForRunHandover(false);
    } else {
      setSelectedDateForOldShipment(date);
      setShowCalendarForOldShipment(false);
    }
  };

  const changeMonth = (delta, type) => {
    if (type === "runHandover") {
      setSelectedDateForRunHandover((prev) => prev.add(delta, "month"));
    } else {
      setSelectedDateForOldShipment((prev) => prev.add(delta, "month"));
    }
  };

  const changeYear = (delta, type) => {
    if (type === "runHandover") {
      setSelectedDateForRunHandover((prev) => prev.add(delta, "year"));
    } else {
      setSelectedDateForOldShipment((prev) => prev.add(delta, "year"));
    }
  };

  const handleHubChangeForRunHandover = (hub) => {
    setSelectedHubForRunHandover(hub);
  };

  const handleOriginChangeForOldShipment = (origin) => {
    setSelectedOriginForOldShipment(origin);
  };

  const summaries = [
    {
      title: "LOAD (IN WAREHOUSE)",
      Component: <LoadInWarehouse remaining={152} today={300} />,
    },
    {
      title: "LOAD (ON HOLD)",
      Component: <LoadToday value={100} textColor="text-red" />,
    },
    {
      title: "RUN OVERVIEW",
      Component: (
        <DataComparison
          data1={64}
          data2={102}
          label1="Delayed Runs"
          label2="Active Runs"
        />
      ),
    },
    {
      title: "PRE-ALERT SUMMARY",
      Component: (
        <DataComparison data1={64} data2={102} label1="Pending" label2="Sent" />
      ),
    },
    {
      title: "LOAD FIELD",
      Component: <LoadToday value={300} textColor="text-green-3" />,
    },
  ];

  const shipmentRunData = {
    "Last 7 Days": [
      { label: "Active Runs", value: 4 },
      { label: "Delays Notified", value: 3 },
      { label: "Total Bags", value: 2 },
      { label: "Pending Pre-Alerts", value: 2 },
      { label: "Total Weight", value: "15,779 kg" },
    ],
    "Last 30 Days": [
      { label: "Active Runs", value: 12 },
      { label: "Delays Notified", value: 8 },
      { label: "Total Bags", value: 10 },
      { label: "Pending Pre-Alerts", value: 5 },
      { label: "Total Weight", value: "62,340 kg" },
    ],
    "Last Year": [
      { label: "Active Runs", value: 48 },
      { label: "Delays Notified", value: 32 },
      { label: "Total Bags", value: 40 },
      { label: "Pending Pre-Alerts", value: 15 },
      { label: "Total Weight", value: "250,000 kg" },
    ],
  };

  const tableHeadersForRunHandover = [
    "Flight Date",
    "Run Number",
    "Sector",
    "BAG",
    "Weight",
    "Pre-Alert",
  ];
  const tableHeardersForOldShipment = [
    "Booking Date",
    "AWB No",
    "Weight",
    "Account Code",
    "Unhold Date",
  ];

  // Calculate totals for run handover
  const totalBags = runHandOverData.reduce(
    (acc, row) => acc + Number(row.bag || 0),
    0
  );
  const totalWeight = runHandOverData.reduce(
    (acc, row) => acc + Number(row.weight || 0),
    0
  );

  return (
    <div className="flex gap-6">
      <div className="flex flex-col gap-5 flex-shrink-0">
        {summaries.map(({ title, Component }, index) => (
          <CSSummary
            key={index}
            title={title}
            link="#"
            DataComponent={Component}
          />
        ))}
        <DashboardProgressBar
          data={shipmentRunData}
          title={`Shipment Run Overview`}
          rupee={false}
        />
      </div>
      <div className="flex flex-col gap-6 flex-grow">
        {/* Table for Run handover - INCREASED HEIGHT */}
        <div className="p-5 border-battleship-gray border bg-seasalt rounded-md flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <span className="font-bold">Run Hand Over</span>
            <div className="flex gap-4 text-xs">
              <div
                className="relative inline-block"
                ref={calendarRefRunHandover}
              >
                <div
                  className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-2 px-6 border-battleship-gray bg-white w-[255px] h-[40px] cursor-pointer"
                  onClick={() =>
                    setShowCalendarForRunHandover(!showCalendarForRunHandover)
                  }
                >
                  <div className="flex items-center gap-1">
                    <span>
                      {selectedDateForRunHandover.format("DD MMM, YYYY")}
                    </span>
                  </div>
                  <img
                    src="calender.svg"
                    height={18}
                    width={18}
                    alt="calendar"
                  />
                </div>

                {showCalendarForRunHandover && (
                  <div className="absolute z-20 top-full mt-1 p-4 bg-white shadow-lg border rounded-md w-[255px]">
                    <DateCalendar
                      selectedDate={selectedDateForRunHandover}
                      onDateSelect={(date) =>
                        handleDateSelect(date, "runHandover")
                      }
                      onMonthChange={(delta) =>
                        changeMonth(delta, "runHandover")
                      }
                      onYearChange={(delta) => changeYear(delta, "runHandover")}
                    />
                  </div>
                )}
              </div>
              <div className="w-[255px] h-[40px] bg-white">
                <DropdownOptionOnly
                  defaultValue="Delhi"
                  options={["Delhi", "Mumbai", "Ahemdabad"]}
                  onChange={handleHubChangeForRunHandover}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-l border-r border-alice-blue border-collapse rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              {/* Wrapper with relative positioning */}
              <div className="relative h-[37vh]">
                {/* Scrollable content area */}
                <div className="h-full overflow-y-auto hidden-scrollbar pb-[60px]">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-seasalt text-xs font-medium sticky top-0 z-10">
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
                    <tbody>
                      {loadingRunHandover ? (
                        <tr>
                          <td
                            colSpan={tableHeadersForRunHandover.length + 1}
                            className="px-4 py-8 text-center"
                          >
                            Loading run handover data...
                          </td>
                        </tr>
                      ) : runHandOverData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={tableHeadersForRunHandover.length + 1}
                            className="px-4 py-8 text-center"
                          >
                            No run handover data found for selected date
                          </td>
                        </tr>
                      ) : (
                        runHandOverData.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className="bg-white border-b border-alice-blue"
                          >
                            <td className="px-4 py-3 text-center text-dim-gray">
                              {row.flightDate}
                            </td>
                            <td className="px-4 py-3 text-center text-dim-gray">
                              {row.runNumber}
                            </td>
                            <td className="px-4 py-3 text-center text-dim-gray">
                              {row.sector}
                            </td>
                            <td className="px-4 py-3 text-center text-dim-gray">
                              {row.bag}
                            </td>
                            <td className="px-4 py-3 text-center text-dim-gray">
                              {row.weight}
                            </td>
                            <td className="px-4 py-3 text-center text-dim-gray">
                              <span
                                className={`text-xs py-0.5 px-2 rounded-full border ${
                                  row.preAlert === "Pending"
                                    ? "bg-old-gold/10 text-old-gold border-old-gold"
                                    : "bg-green-3/10 text-green-3 border-green-3"
                                }`}
                              >
                                {row.preAlert}
                              </span>
                            </td>
                            <td className="w-14 text-center">
                              <span className="text-xl font-bold text-gray-400">
                                :
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Sticky footer total - positioned absolutely at bottom */}
                {runHandOverData.length > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-alice-blue border-t border-alice-blue">
                    <table className="w-full text-sm border-collapse">
                      <tbody>
                        <tr className="text-center font-medium">
                          <td
                            className="px-4 py-3 text-center"
                            style={{ width: "calc((100% - 56px) / 6 * 3)" }}
                          >
                            Total
                          </td>
                          <td
                            className="px-4 py-3 text-center"
                            style={{ width: "calc((100% - 56px) / 6)" }}
                          >
                            <div className="flex flex-col items-center">
                              <span className="font-semibold">{totalBags}</span>
                              <span className="text-xs text-dim-gray">
                                Bags
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 text-center"
                            style={{ width: "calc((100% - 56px) / 6)" }}
                          >
                            <div className="flex flex-col items-center">
                              <span className="font-semibold">
                                {totalWeight}
                              </span>
                              <span className="text-xs text-dim-gray">
                                Weight
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 text-center"
                            style={{ width: "calc((100% - 56px) / 6)" }}
                          ></td>
                          <td className="px-4 py-3 text-center w-14"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table for Old shipment */}
        <div className="p-5 border-battleship-gray border bg-seasalt rounded-md flex flex-col gap-5">
          <div className="flex justify-between items-center">
             <span className="font-bold">Old Shipment</span>
            <div className="flex gap-4 text-xs items-center">
              <button
                onClick={downloadOldShipmentExcel}
                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-300 text-white rounded-md transition-colors duration-200 w-[40px] h-[40px] border border-battleship-gray"
                disabled={loadingOldShipment || oldShipmentData.length === 0}
              >
                <img
                  src="/Download-gray.svg"
                  alt="Download"
                  className="w-5 h-5"
                />
              </button>

              <div className="flex gap-4">
                <div
                  className="relative inline-block"
                  ref={calendarRefOldShipment}
                >
                  <div
                    className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-2 px-6 border-battleship-gray bg-white w-[255px] h-[40px] cursor-pointer"
                    onClick={() =>
                      setShowCalendarForOldShipment(!showCalendarForOldShipment)
                    }
                  >
                    <div className="flex items-center gap-1">
                      <span>
                        {selectedDateForOldShipment.format("DD MMM, YYYY")}
                      </span>
                    </div>
                    <img
                      src="calender.svg"
                      height={18}
                      width={18}
                      alt="calendar"
                    />
                  </div>

                  {showCalendarForOldShipment && (
                    <div className="absolute z-20 top-full mt-1 p-4 bg-white shadow-lg border rounded-md w-[255px]">
                      <DateCalendar
                        selectedDate={selectedDateForOldShipment}
                        onDateSelect={(date) =>
                          handleDateSelect(date, "oldShipment")
                        }
                        onMonthChange={(delta) =>
                          changeMonth(delta, "oldShipment")
                        }
                        onYearChange={(delta) =>
                          changeYear(delta, "oldShipment")
                        }
                      />
                    </div>
                  )}
                </div>
                <div className="w-[255px] h-[40px] bg-white">
                  <DropdownOptionOnly
                    defaultValue="Delhi"
                    options={["Delhi", "Mumbai", "Ahemdabad"]}
                    onChange={handleOriginChangeForOldShipment}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-l border-r border-alice-blue border-collapse rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <div className="h-[31vh] overflow-y-auto hidden-scrollbar">
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-seasalt text-xs font-medium sticky top-0 z-10">
                    <tr className="border-b border-alice-blue">
                      {tableHeardersForOldShipment.map((header, index) => (
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
                  <tbody>
                    {loadingOldShipment ? (
                      <tr>
                        <td
                          colSpan={tableHeardersForOldShipment.length + 1}
                          className="px-4 py-8 text-center"
                        >
                          Loading old shipment data...
                        </td>
                      </tr>
                    ) : oldShipmentData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={tableHeardersForOldShipment.length + 1}
                          className="px-4 py-8 text-center"
                        >
                          No old shipment data found for selected date
                        </td>
                      </tr>
                    ) : (
                      oldShipmentData.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className="bg-white border-b border-alice-blue"
                        >
                          <td className="px-4 py-3 text-center text-dim-gray">
                            {row.bookingDate}
                          </td>
                          <td className="px-4 py-3 text-center text-dim-gray">
                            {row.awbNo}
                          </td>
                          <td className="px-4 py-3 text-center text-dim-gray">
                            {row.weight}
                          </td>
                          <td className="px-4 py-3 text-center text-dim-gray">
                            {row.accountCode}
                          </td>
                          <td className="px-4 py-3 text-center text-dim-gray">
                            {row.unholdDate}
                          </td>
                          <td className="w-14 text-center">
                            <span className="text-xl font-bold text-gray-400">
                              :
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Date Calendar Component (unchanged)
function DateCalendar({
  selectedDate,
  onDateSelect,
  onMonthChange,
  onYearChange,
}) {
  const currentDate = dayjs();
  const daysInMonth = selectedDate.daysInMonth();
  const firstDayOfMonth = selectedDate.startOf("month").day();

  const days = [];

  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const date = selectedDate.date(i);
    days.push(date);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={() => onYearChange(-1)}
          className="px-2 py-1 hover:bg-gray-100 rounded"
        >
          &lt;&lt;
        </button>
        <button
          onClick={() => onMonthChange(-1)}
          className="px-2 py-1 hover:bg-gray-100 rounded"
        >
          &lt;
        </button>
        <span className="font-semibold text-sm">
          {selectedDate.format("MMMM YYYY")}
        </span>
        <button
          onClick={() => onMonthChange(1)}
          disabled={selectedDate.isAfter(currentDate, "month")}
          className={`px-2 py-1 rounded ${
            selectedDate.isAfter(currentDate, "month")
              ? "text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-100"
          }`}
        >
          &gt;
        </button>
        <button
          onClick={() => onYearChange(1)}
          disabled={selectedDate.isAfter(currentDate, "year")}
          className={`px-2 py-1 rounded ${
            selectedDate.isAfter(currentDate, "year")
              ? "text-gray-400 cursor-not-allowed"
              : "hover:bg-gray-100"
          }`}
        >
          &gt;&gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-dim-gray"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-6"></div>;
          }

          const isFuture = date.isAfter(currentDate, "day");
          const isSelected = date.isSame(selectedDate, "day");

          return (
            <button
              key={index}
              onClick={() => !isFuture && onDateSelect(date)}
              disabled={isFuture}
              className={`h-6 text-xs rounded transition-colors duration-200 ${
                isSelected && !isFuture
                  ? "bg-red text-white"
                  : isFuture
                  ? "text-gray-400 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
            >
              {date.date()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Other components (unchanged)
function CSSummary({ title, link, DataComponent }) {
  const currentDate = dayjs();
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const dateInputRef = useRef(null);

  const handlePrevDay = () => {
    setSelectedDate((prev) => prev.subtract(1, "day"));
  };

  const handleNextDay = () => {
    const nextDate = selectedDate.add(1, "day");
    if (nextDate.isAfter(currentDate)) return;
    setSelectedDate(nextDate);
  };

  const handleDateChange = (e) => {
    setSelectedDate(dayjs(e.target.value));
  };

  const openCalendar = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  return (
    <div className="flex flex-col gap-2.5 border p-4 rounded-md border-french-gray bg-white">
      <div className="flex justify-between text-xs">
        <span className="text-dim-gray font-semibold">{title}</span>
        <div className="text-dim-gray text-xs flex items-center gap-1">
          <button
            onClick={handlePrevDay}
            className="hover:bg-gray-100 rounded p-1"
          >
            <img
              src="arrow-right-gray.svg"
              alt="Left"
              className="rotate-180 w-3 h-3"
            />
          </button>

          <span
            onClick={openCalendar}
            className="cursor-pointer px-1 hover:bg-gray-100 rounded"
          >
            {selectedDate.format("DD MMM, YYYY")}
          </span>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate.format("YYYY-MM-DD")}
            onChange={handleDateChange}
            className="hidden"
            max={currentDate.format("YYYY-MM-DD")}
          />

          <button
            onClick={handleNextDay}
            disabled={selectedDate.isSame(currentDate, "day")}
            className={`hover:bg-gray-100 rounded p-1 ${
              selectedDate.isSame(currentDate, "day")
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <img src="arrow-right-gray.svg" alt="Right" className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>{DataComponent}</div>
        <Link href={link}>
          <Image
            src="/external-link.svg"
            alt="external link"
            width={18}
            height={18}
            className="hover:opacity-70"
          />
        </Link>
      </div>
    </div>
  );
}

function LoadInWarehouse({ remaining, today }) {
  return (
    <div className="flex gap-6">
      <LoadValue value={remaining} label="Remaining" color="text-red" />
      <LoadValue value={today} label="Today" />
    </div>
  );
}

function LoadToday({ value, textColor }) {
  return <LoadValue value={value} label="Today" color={textColor} />;
}

function LoadValue({ value, label, color = "" }) {
  return (
    <div className="flex flex-col">
      <span className={`font-bold text-lg ${color}`}>{value} Tonn</span>
      <span className="text-xs text-dim-gray">{label}</span>
    </div>
  );
}

function DataComparison({ data1, data2, label1, label2 }) {
  return (
    <div className="flex gap-6">
      <LoadValue value={data1} label={label1} color="text-red" />
      <LoadValue value={data2} label={label2} color="text-green-3" />
    </div>
  );
}

export default OperationDashboard;
