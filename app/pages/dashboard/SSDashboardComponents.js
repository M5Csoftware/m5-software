import { SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DateInputBox } from "@/app/components/InputBox";
import dayjs from "dayjs";
import { ExternalLink } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export function StatusCard({
  title = "TITLE",
  greenCount = 0,
  redCount = 0,
  grayCount = 0,
  greenColor = "text-green-600",
  redColor = "text-red",
  grayColor = "text-gray-600",
  redText = "",
  greenText = "",
  grayText = "",
  greenUnit = "",
  redUnit = "",
  grayUnit = "",
  enableGrayText = false,
  onLinkClick = () => {},
  onDateChange = () => {},
  range = "today",
}) {
  return (
    <div className="rounded-lg border p-4 bg-white shadow flex justify-between items-center">
      {/* Left side */}
      <div className="ml-2 p-1 cursor-default">
        <div className="text-sm font-medium text-gray-600 tracking-wider">
          {title}
        </div>

        <div className="flex gap-8 mt-2">
          <div className="text-left tracking-wide mr-4">
            <div className={`${greenColor} font-bold  text-2xl`}>
              {greenCount}
            </div>
            <div className={`${greenColor} flex`}>
              {greenText} <span className="text-xs">{greenUnit}</span>
            </div>
          </div>
          <div className="text-left">
            <div
              className={`${redColor} font-semibold flex flex-col justify-start text-2xl`}
            >
              {redCount}
              <span className="text-xs">{redUnit}</span>
            </div>
            <div className={`${redColor}`}>{redText}</div>
          </div>
          {enableGrayText && (
            <div className="text-left">
              <div
                className={`${grayColor} font-semibold flex flex-col justify-start text-2xl`}
              >
                {grayCount}
                <span className="text-xs">{grayUnit}</span>
              </div>
              <div className={`${grayColor}`}>{grayText}</div>
            </div>
          )}
        </div>
      </div>

      {/* Right side icon */}
      <div className="flex flex-col items-end gap-8 cursor-pointer mr-3">
        <div className="relative mb-2">
          {/* Date filter */}
          <select
            value={range}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-[10px] border border-gray-300 px-2 py-[2px] pr-5 rounded text-dim-gray appearance-none cursor-pointer bg-white"
          >
            <option value="today">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
          <span className="pointer-events-none absolute top-2 right-3 text-[8px] text-gray-500">
            ▼
          </span>
        </div>

        <div>
          <ExternalLink onClick={onLinkClick} className="text-red w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export function HoldReport() {
  const { register, setValue } = useForm();

  return (
    <div className="bg-seasalt  border-french-gray border-opacity-50 shadow rounded-md pt-4 pb-3 px-4 flex flex-col gap-4">
      <h2 className="font-bold">Hold Report</h2>
      <form className="flex flex-col">
        <div className="flex gap-2 justify-between pb-2 flex-row">
          <div className="flex flex-row gap-2">
            <div className="">
              <LabeledDropdown
                setValue={setValue}
                register={register}
                value={`dateRange`}
                options={["1", "2"]}
                title={`Date Range`}
              />
            </div>
            <div className="">
              <DateInputBox
                register={register}
                setValue={setValue}
                value="from"
                placeholder="From"
              />
            </div>
            <div className="">
              <DateInputBox
                register={register}
                setValue={setValue}
                value="to"
                placeholder="To"
              />
            </div>
          </div>
          <div>
            <SimpleButton name="Download CSV" type="submit" />
          </div>
        </div>
      </form>
    </div>
  );
}

export function DataCardWithTable({
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
  onMonthChange,
}) {
  useEffect(() => {
    if (setValue && name) setValue(`${name}Table`, rowData);
  }, [rowData]);

  return (
    <div
      className={`rounded-lg border bg-[#F6F8F9] shadow-sm p-4 ${
        disabled ? "bg-gray-50" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold ml-1 text-gray-800">{title}</h2>
        <MonthYearPicker
          selectedDate={selectedMonth}
          onChange={onMonthChange}
          disabledFuture={true}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg ">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-[#71717A] tracking-wide text-xs">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-center">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rowData.map((row, i) => (
              <tr key={i} className="border-t bg-white hover:bg-gray-50">
                {/* Customer */}
                <td className="px-4 py-2 flex items-center gap-2 justify-center">
                  <div className="flex flex-col text-center">
                    <span className="font-semibold text-gray-700">
                      {row?.customerName || row.reason}
                    </span>
                    <span className="text-sm text-gray-400 tracking-wide">{row.id && "#"}{row.id}</span>
                  </div>
                </td>

                {/* AWB */}
                <td className="px-4 py-2 text-center text-gray-800">
                  {row.awb}
                </td>

                {/* Weight */}
                <td className="px-4 py-2 text-center">
                  {row.weightIsView ? (
                    <span className="text-red cursor-pointer">View</span>
                  ) : (
                    <span className="text-red">{row.weight}</span>
                  )}
                </td>
              </tr>
            ))}

            {totalRow && (
              <tr className="border-t bg-[#FAFAFA] font-semibold text-gray-700">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 text-center">
                    {totalRow[col.key] || ""}
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

export default function MonthYearPicker({
  selectedDate,
  onChange,
  disabledFuture = true,
  width = 255,
  className = "",
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(selectedDate || dayjs());
  const calendarRef = useRef(null);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Hide popover when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeYear = (offset) => {
    setSelectedMonth(selectedMonth.add(offset, "year"));
  };

  const handleMonthClick = (monthIndex) => {
    const newDate = selectedMonth.month(monthIndex);
    setSelectedMonth(newDate);
    onChange(newDate);
    setShowCalendar(false);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      ref={calendarRef}
      style={{ width }}
    >
      {/* Trigger */}
      <div
        className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-1 px-4 border-opacity-50 border-battleship-gray bg-white cursor-pointer"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <div className="flex items-center gap-1">
          <span>
            {selectedMonth.format("MMMM")}, {selectedMonth.format("YYYY")}
          </span>
        </div>
        <img src="calender.svg" height={18} width={18} alt="calendar" />
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-full">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => changeYear(-1)}>&lt;</button>
            <span className="font-semibold">{selectedMonth.year()}</span>
            <button
              onClick={() => changeYear(1)}
              disabled={
                disabledFuture && selectedMonth.year() >= dayjs().year()
              }
            >
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {months.map((month, i) => {
              const isFuture =
                disabledFuture &&
                dayjs()
                  .year(selectedMonth.year())
                  .month(i)
                  .isAfter(dayjs(), "month");

              const isActive = selectedMonth.month() === i && !isFuture;

              return (
                <button
                  key={month}
                  onClick={() => !isFuture && handleMonthClick(i)}
                  disabled={isFuture}
                  className={`py-1 px-2 rounded text-xs transition-colors duration-200 ${
                    isActive
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
  );
}
