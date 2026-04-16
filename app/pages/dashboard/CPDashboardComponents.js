import React, { useEffect, useRef, useState } from "react";
import MonthYearPicker from "./SSDashboardComponents";
import { ChevronDown, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Image from "next/image";

export function DataCardWithTableTotal({
  register,
  setValue,
  name,
  columns = [],
  rowData = [],
  totalRow = null,
  title = "",
  className = "",
  disabled = false,
  selectedMonth,
  onMonthChange = () => {},
}) {
  useEffect(() => {
    if (setValue && name) setValue(`${name}Table`, rowData);
  }, [rowData]);

  return (
    <div
      className={`rounded-lg border bg-[#F6F8F9] shadow-sm px-6 p-4 ${
        disabled ? "bg-gray-50" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3 py-2 ">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <MonthYearPicker
          selectedDate={selectedMonth}
          onChange={onMonthChange}
          disabledFuture={true}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-battleship-gray border-opacity-35 rounded-lg mb-2">
        <table className="w-full text-sm ">
          <thead className="bg-[#F9FAFB] text-[#71717A] tracking-wide text-xs">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-4 text-center font-medium text-sm"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rowData.map((row, i) => (
              <tr key={i} className="border-t bg-white hover:bg-white">
                {columns.map((col, j) => (
                  <td
                    key={col.key}
                    className={`p-4 ${
                      j === 0 ? "text-center" : "text-center"
                    } text-[#71717A] text-sm`}
                  >
                    {row[col.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))}

            {/* Total Row */}
            {totalRow && (
              <tr className="border-t bg-[#EAECF0] font-semibold text-gray-700">
                {columns.map((col, i) => (
                  <td key={col.key} className={`px-4 py-3 text-center`}>
                    {totalRow[col.key] ?? ""}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {register && name && (
        <input type="hidden" {...register(`${name}Table`)} />
      )}
    </div>
  );
}

export function SummaryCardWithSeeAll({
  title = "",
  month,
  locationOptions = [],
  selectedLocation = "",
  onLocationChange,
  data = [],
  onSeeAll,
  maxRows,
  selectedMonth,
  onMonthChange = () => {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(selectedLocation || "");
  const currentMonth = dayjs();
  const dropdownRef = useRef(null);

  const handlePrevMonth = () => {
    onMonthChange(selectedMonth.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    const nextMonth = selectedMonth.add(1, "month");
    if (nextMonth.isAfter(currentMonth)) return;
    onMonthChange(nextMonth);
  };

  // Close arrow if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (value) => {
    setSelectedOption(value);
    onLocationChange?.(value);
    setIsOpen(false);
  };

  return (
    <div className="w-full flex flex-col justify-between rounded-lg bg-white h-full">
      <div>
        <div className="flex justify-between items-center p-4">
          <div className="ml-2 w-1/2">
            <h2 className="font-bold">{title}</h2>
            <div className="relative w-[125px] mt-1" ref={dropdownRef}>
              <div
                onClick={() => setIsOpen(!isOpen)}
                className="appearance-none w-full bg-misty-rose text-red text-xs px-2 font-semibold py-1 rounded focus:outline-none cursor-pointer pr-2 relative flex justify-between items-center"
              >
                {selectedOption || "Select location"}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ease-in-out ${
                    isOpen ? "rotate-180" : "rotate-0"
                  }`}
                />
              </div>

              <div
                className={`absolute z-20 w-full shadow-md bg-white rounded-[4px] mt-1 overflow-auto table-scrollbar transition-all ${
                  isOpen ? "max-h-60" : "max-h-0"
                }`}
              >
                {locationOptions.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedOption(option);
                      onLocationChange?.(option);
                      setIsOpen(false);
                    }}
                    className="px-3 py-1 hover:bg-gray-100 cursor-pointer text-xs"
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start flex-col mb-3">
            <div className="text-gray-600 font-medium text-sm flex items-center justify-between gap-3">
              <button onClick={handlePrevMonth}>
                <img
                  src="arrow-right-gray.svg"
                  alt="Left"
                  width={14}
                  height={14}
                  className="rotate-180"
                />
              </button>
              <span className="text-center">
                {selectedMonth.format("MMMM, YYYY")}
              </span>
              <button
                onClick={handleNextMonth}
                disabled={selectedMonth.isSame(currentMonth, "month")}
              >
                <img
                  src="arrow-right-gray.svg"
                  alt="Right"
                  width={14}
                  height={14}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="border-t">
          {data.length > 0 ? (
            (maxRows ? data.slice(0, maxRows) : data).map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center py-2 px-6 text-sm leading-loose">
                  <div>
                    <div className="font-semibold tracking-wide text-[15px]">
                      {item.id}
                    </div>
                    <div className="text-[#71717A] tracking-wide text-sm">
                      {item.date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-red font-semibold">{item.status}</div>
                    <div className="text-gray-500 text-sm">{item.carrier}</div>
                  </div>
                </div>
                <hr className="mx-6 py-2" />
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-4 text-sm">
              No records found
            </div>
          )}
        </div>
      </div>

      <div>
        <button
          onClick={onSeeAll}
          className="w-full flex justify-center  items-center text-sm text-gray-500 tracking-wider mb-4 py-2"
        >
          SEE ALL <ChevronRight size={14} className="ml-1" />
        </button>
      </div>
    </div>
  );
}

export function CounterPartChart() {
  const data = [
    { name: "Jan", delhi: 4000, mumbai: 2400, Ahmedabad: 2400 },
    { name: "Feb", delhi: 3000, mumbai: 1398, Ahmedabad: 3400 },
    { name: "Mar", delhi: 2000, mumbai: 9800, Ahmedabad: 3908 },
    { name: "Apr", delhi: 2780, mumbai: 3908, Ahmedabad: 3908 },
    { name: "May", delhi: 1890, mumbai: 4800, Ahmedabad: 1908 },
    { name: "Jun", delhi: 2390, mumbai: 3800, Ahmedabad: 1908 },
    { name: "Jul", delhi: 3490, mumbai: 4300, Ahmedabad: 1908 },
    { name: "Aug", delhi: 2000, mumbai: 9800, Ahmedabad: 3908 },
    { name: "Sep", delhi: 2780, mumbai: 3908, Ahmedabad: 3908 },
    { name: "Oct", delhi: 3490, mumbai: 4300, Ahmedabad: 1908 },
    { name: "Nov", delhi: 2780, mumbai: 3908, Ahmedabad: 3908 },
    { name: "Dec", delhi: 3490, mumbai: 4300, Ahmedabad: 1908 },
  ];

  // tiny custom shape to add padding between stacked bars
  const CustomBar = ({ x, y, width, height, fill }) => (
    <rect
      x={x + 1.5}
      y={y + 1.5}
      width={width - 3}
      height={height - 1}
      fill={fill}
      rx={3}
      ry={3}
    />
  );

  return (
    <div className="bg-white p-4 rounded-lg w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          barCategoryGap="20%"
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="name" tick={{ fill: "#555", fontSize: 12 }} />
          <YAxis tick={{ fill: "#555", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              border: "1px solid #ddd",
            }}
          />
          <Bar
            dataKey="mumbai"
            stackId="a"
            fill="#9A182F"
            shape={<CustomBar />}
            radius={[3, 3, 3, 3]}
          />
          <Bar
            dataKey="delhi"
            stackId="a"
            fill="#EA1B40"
            shape={<CustomBar />}
            radius={[3, 3, 3, 3]}
          />
          <Bar
            dataKey="Ahmedabad"
            stackId="a"
            fill="#FF617E"
            shape={<CustomBar />}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function YearRangePicker({
  selectedYear,
  onChange = () => {},
  disabledFuture = true,
  width = 200,
  className = "",
}) {
  const calendarRef = useRef(null);

  const currentYear = dayjs().year();
  // Max allowed year for selection when disabledFuture=true:
  const maxAllowedYear = disabledFuture ? currentYear - 1 : Infinity;

  // Default academic year = previous calendar year (so in 2025 default is 2024)
  const getDefaultYear = () =>
    selectedYear !== undefined && selectedYear !== null
      ? selectedYear
      : currentYear - 1;

  const [showCalendar, setShowCalendar] = useState(false);
  const [year, setYear] = useState(getDefaultYear());

  // Keep internal year in sync if parent changes selectedYear
  useEffect(() => {
    if (selectedYear !== undefined && selectedYear !== null) {
      setYear(selectedYear);
    }
  }, [selectedYear]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setAndNotify = (y) => {
    setYear(y);
    onChange(y);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setAndNotify(year - 1);
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (disabledFuture && year + 1 > maxAllowedYear) return;
    setAndNotify(year + 1);
  };

  const handleYearClick = (y) => {
    if (disabledFuture && y > maxAllowedYear) return;
    setAndNotify(y);
    setShowCalendar(false);
  };

  const startYear = year - 5; // shows 11 years: year-5 ... year+5
  const years = Array.from({ length: 11 }, (_, i) => startYear + i);

  return (
    <div
      className={`relative inline-block ${className}`}
      ref={calendarRef}
      style={{ width }}
    >
      {/* Trigger with arrows + label + calendar icon */}
      <div
        className="flex items-center gap-3 text-dim-gray border rounded-md justify-between py-1 px-3 border-opacity-50 border-battleship-gray bg-white"
        // don't toggle on arrow clicks, only on center label / icon
      >
        <div className="flex">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Previous year"
          >
            {/* left chevron */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 18l-6-6 6-6"
              />
            </svg>
          </button>

          <div
            className="flex-1 flex items-center justify-center gap-2 px-4 cursor-pointer select-none"
            onClick={() => setShowCalendar(!showCalendar)}
          >
            <span className="font-medium">
              {year}-{(year + 1).toString().slice(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className={`p-1 rounded hover:bg-gray-100 ${
              disabledFuture && year + 1 > maxAllowedYear
                ? "opacity-40 cursor-not-allowed"
                : ""
            }`}
            aria-label="Next year"
            disabled={disabledFuture && year + 1 > maxAllowedYear}
          >
            {/* right chevron */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6l6 6-6 6"
              />
            </svg>
          </button>
        </div>

        {/* calendar icon (also toggles popup) */}
        <button
          type="button"
          onClick={() => setShowCalendar((s) => !s)}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Open year picker"
        >
          <img src="calender.svg" height={18} width={18} alt="calendar" />
        </button>
      </div>

      {/* Popup */}
      {showCalendar && (
        <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-full">
          <div className="grid grid-cols-3 gap-2">
            {years.map((y) => {
              const isFuture = disabledFuture && y > maxAllowedYear;
              const isActive = y === year;

              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearClick(y)}
                  disabled={isFuture}
                  className={`py-1 px-2 rounded text-xs transition-colors duration-200 ${
                    isActive
                      ? "bg-red text-white"
                      : isFuture
                      ? "text-gray-400 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {y}-{(y + 1).toString().slice(2)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
