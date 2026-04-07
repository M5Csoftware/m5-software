"use client";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { SimpleButton } from "./Buttons";
import Image from "next/image";
import DatePicker from "react-date-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Calendar from "react-calendar";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/airbnb.css";

const UPPERCASE_FIELDS = [
  "code",
  "panNo",
  "gstNo",
  "cinNo",
  "awbNo",
  "eventCode",
  "accountCode",
  "customerCode",
  "runNumber",
  "runNo",
  "airwaybillNumber",
  "clubbingNumber",
];

export default function InputBox({
  placeholder,
  register,
  setValue,
  value,
  initialValue = "",
  reset = () => {},
  resetFactor = false,
  isTextArea = false,
  className = "",
  validation = {},
  error,
  trigger,
  type = "input",
  disabled = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    let newValue = e.target.value;

    if (UPPERCASE_FIELDS.includes(value)) {
      newValue = newValue.toUpperCase();
      setInputValue(newValue);
      setValue(value, newValue);
    } else {
      setInputValue(newValue); // display as typed
      setValue(value, newValue.toLowerCase()); // store normalized for search
    }

    if (trigger) {
      trigger(value);
    }
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setInputValue("");
    setValue(value, null);
  }, [resetFactor]);

  return isTextArea ? (
    <div className="relative w-full">
      <textarea
        {...register(value)}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`border border-[#979797] outline-none bg-transparent rounded-md h-8 px-4 py-2 w-full ${
          disabled ? "bg-white-smoke" : ""
        }  ${className}`}
      />
      {placeholder && (
        <label
          htmlFor={value}
          className={`absolute transition-all px-2 left-4 ${
            isPlaceholderFloating
              ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
              : `${
                  error ? "top-1/3" : "top-1/2"
                } -translate-y-1/4 -bottom-6  text-sm text-[#979797]`
          }`}
        >
          {placeholder}
        </label>
      )}

      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  ) : (
    <div className="relative w-full">
      <input
        type={type}
        {...register(value, validation)}
        value={inputValue}
        id={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
        className={` border outline-none bg-transparent rounded-md text-sm h-8 px-4 py-2 w-full ${
          value == "code" ? "" : ""
        } ${error ? "border-red" : "border-[#979797]"} ${
          disabled ? "bg-white-smoke" : ""
        }  ${className}`}
      />

      {placeholder && (
        <label
          htmlFor={value}
          className={`absolute transition-all px-2  left-4 ${
            isPlaceholderFloating
              ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
              : `${
                  error ? "top-1/3" : "top-1/2"
                } -translate-y-1/2  text-sm text-[#979797]`
          }`}
        >
          {placeholder}
        </label>
      )}

      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  );
}

export function InputBoxMultipleEntry({
  placeholder = "",
  register,
  label = "",
  watch,
  value,
  setValue,
  setInput,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [entries, setEntries] = useState([]);
  const [currentInput, setCurrentInput] = useState("");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleInputChange = (e) => {
    setCurrentInput(e.target.value);
  };

  useEffect(() => {
    setInput(entries);
  }, [entries]);

  const handleKeyDown = (e) => {
    if (e.key === " " && currentInput.trim() !== "") {
      setEntries((prevEntries) => [
        ...prevEntries,
        currentInput.trim().toLowerCase(),
      ]);
      setCurrentInput("");
      e.preventDefault();
    } else if (e.key === "Backspace" && currentInput === "") {
      setEntries((prevEntries) => prevEntries.slice(0, -1));
    }
  };

  const removeEntry = (index) => {
    setEntries((prevEntries) => prevEntries.filter((_, i) => i !== index));
  };

  return (
    <label htmlFor={value} className="relative block">
      <div
        className={`
          w-full 
          h-8
          overflow-x-auto 
          hidden-scrollbar 
          border 
          border-[#979797] 
          bg-white 
          rounded-md 
          px-4
          py-1.5
          text-sm
          transition-all
          ${isFocused ? "ring-1 ring-red-200 border-red-400" : ""}
        `}
      >
        <div className="flex flex-nowrap gap-1.5 items-center">
          {entries.map((entry, index) => (
            <div
              key={index}
              className="flex items-center gap-1 border border-[#979797] rounded px-1.5 py-0.5 bg-[#F5F5F5] text-xs whitespace-nowrap flex-shrink-0"
            >
              <span className="text-gray-700">{entry}</span>
              <button
                type="button"
                onClick={() => removeEntry(index)}
                className="text-gray-500 hover:text-red-600 font-bold text-sm leading-none transition-colors"
                aria-label={`Remove ${entry}`}
              >
                ×
              </button>
            </div>
          ))}

          <input
            id={value}
            {...register(value)}
            value={currentInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="outline-none flex-1 min-w-[60px] bg-transparent text-sm h-full"
            placeholder={entries.length === 0 ? placeholder : ""}
          />
        </div>
      </div>

      <span
        className={`
          absolute 
          transition-all 
          duration-200
          px-2 
          left-4
          pointer-events-none
          ${
            currentInput || watch(value) || isFocused || entries.length !== 0
              ? "-top-2 text-xs font-semibold text-[#979797] bg-white h-4"
              : "top-1/2 -translate-y-1/2 text-sm text-[#979797]"
          }
        `}
      >
        {label}
      </span>
    </label>
  );
}

export function InputBoxRed({
  placeholder,
  register,
  setValue,
  value,
  initialValue = "",
  reset = () => {},
  resetFactor = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    const newValue = e.target.value;

    if (UPPERCASE_FIELDS.includes(value)) {
      const upper = newValue.toUpperCase();
      setInputValue(upper);
      setValue(value, upper);
    } else {
      setInputValue(newValue);
      setValue(value, newValue.toLowerCase());
    }
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setInputValue("");
  }, [resetFactor]);

  return (
    <div className="relative w-full">
      <input
        {...register(value)}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="border border-[#979797] outline-none bg-transparent rounded-md h-8 px-4 py-2 w-full"
      />
      <span
        className={`absolute transition-all px-2 left-4 ${
          isPlaceholderFloating
            ? "-top-2 text-xs z-10 font-semibold text-red bg-white"
            : "top-1/2 -translate-y-1/2 -z-10 text-sm text-[#979797] "
        }`}
      >
        {placeholder}
      </span>
    </div>
  );
}

export function InputBoxYellow({
  placeholder,
  register,
  setValue,
  value,
  initialValue = "",
  reset = () => {},
  resetFactor = false,
  error,
  trigger,
  className = "",
  validation = {},
  disabled = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    let newValue = e.target.value;

    if (UPPERCASE_FIELDS.includes(value)) {
      newValue = newValue.toUpperCase();
      setInputValue(newValue);
      setValue(value, newValue);
    } else {
      setInputValue(newValue);
      setValue(value, newValue.toLowerCase());
    }

    if (trigger) {
      trigger(value);
    }
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setInputValue("");
    setValue(value, null);
  }, [resetFactor]);

  return (
    <div className="relative w-full">
      <input
        {...register(value, validation)}
        value={inputValue}
        id={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`border outline-none bg-transparent rounded-md h-8 px-4 py-2 text-sm text-eerie-black placeholder:text-eerie-black w-full 
          ${error ? "border-red" : "border-[#CFB400]"} ${className} ${
            disabled ? "cursor-default select-none" : ""
          }`}
      />
      <span
        className={`absolute transition-all px-2 left-4 ${
          isPlaceholderFloating
            ? "-top-2 text-xs z-10 font-semibold text-[#979797] bg-white"
            : "top-1/2 -translate-y-1/2 -z-10 text-sm text-[#979797]"
        }`}
      >
        {placeholder}
      </span>

      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  );
}

export function InputBoxYellowWithPrefix({
  placeholder,
  register,
  setValue,
  value,
  initialValue = "",
  reset = () => {},
  resetFactor = false,
  error,
  trigger,
  className = "",
  validation = {},
  disabled = false,
  prefix = "",
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const getCleanPrefix = () => {
    if (!prefix) return "";
    const match = prefix.match(/^([A-Z]{2,3})\s*-/i);
    if (match && match[1]) {
      return match[1].trim().toUpperCase();
    }
    return prefix.split(" ")[0].trim().toUpperCase();
  };

  const handleChange = (e) => {
    let newValue = e.target.value.toUpperCase().trim();
    const cleanPrefix = getCleanPrefix();

    if (value === "awbNo") {
      newValue = newValue
        .replace(/^[A-Z]{2}[-\s]*/, "")
        .replace(/[^A-Z0-9]/g, "");
      newValue = newValue.substring(0, 10);
      newValue = `${cleanPrefix}-${newValue}`;
    }

    setInputValue(newValue);
    // awbNo is always uppercase; store as-is
    setValue(value, newValue);
    if (trigger) trigger(value);
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  useEffect(() => {
    const cleanPrefix = getCleanPrefix();

    if (value === "awbNo") {
      let formattedValue = initialValue?.toUpperCase().trim() || "";

      formattedValue = formattedValue
        .replace(/^([A-Z]{2})[-\s]*/i, "")
        .replace(/[^A-Z0-9]/g, "")
        .substring(0, 10);

      formattedValue = formattedValue ? `${cleanPrefix}-${formattedValue}` : "";
      setInputValue(formattedValue);
      setValue(value, formattedValue);
    } else {
      setInputValue(initialValue || "");
    }
  }, [initialValue, prefix]);

  useEffect(() => {
    setInputValue("");
    setValue(value, null);
  }, [resetFactor]);

  return (
    <div className="relative w-full">
      <input
        {...register(value, validation)}
        value={inputValue}
        id={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        className={`border outline-none bg-transparent rounded-md h-8 px-4 py-2 text-sm text-eerie-black placeholder:text-eerie-black w-full 
          ${error ? "border-red" : "border-[#CFB400]"} ${className} ${
            disabled ? "cursor-default select-none" : ""
          }`}
      />
      <span
        className={`absolute transition-all px-2 left-4 ${
          isPlaceholderFloating
            ? "-top-2 text-xs z-10 font-semibold text-[#979797] bg-white"
            : "top-1/2 -translate-y-1/2 -z-10 text-sm text-[#979797]"
        }`}
      >
        {placeholder}
      </span>
      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  );
}

export function NumberInputBox({
  placeholder,
  value,
  register,
  setValue,
  initialValue = "",
  resetFactor = false,
  validation = {},
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    setInputValue(e.target.value);
    setValue(value, e.target.value);
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setInputValue("");
  }, [resetFactor]);

  return (
    <div className="relative w-full">
      <input
        type="number"
        {...register(value, validation)}
        value={inputValue}
        min="1"
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="border border-[#979797] outline-none bg-transparent rounded-md h-8 px-4 py-2 w-full"
      />
      <span
        className={`absolute transition-all px-2 pointer-events-none left-4 bg-white ${
          isPlaceholderFloating
            ? "-top-2 z-10 text-xs font-semibold text-[#979797]"
            : "top-1/2 z-0 -translate-y-1/2 text-sm text-[#979797]"
        }`}
      >
        {placeholder}
      </span>
    </div>
  );
}

export function FractionNumberInputBox({
  placeholder,
  value,
  register,
  setValue,
  initialValue = "",
  resetFactor = false,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setValue(value, newValue);
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  useEffect(() => {
    setInputValue("");
    setValue(value, "");
  }, [resetFactor, setValue, value]);

  return (
    <div className="relative w-full">
      <input
        type="number"
        {...register(value)}
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        min="0.00"
        max="100.00"
        step="0.01"
        className="border border-[#979797] outline-none rounded-md h-8 px-4 py-2 w-full"
      />
      <span
        className={`absolute transition-all px-2 left-4 bg-white ${
          isPlaceholderFloating
            ? "-top-2 text-xs font-semibold text-[#979797]"
            : "top-1/2 -translate-y-1/2 text-sm text-[#979797]"
        }`}
      >
        {placeholder}
      </span>
    </div>
  );
}

export function DateInputBox({
  placeholder = "Date",
  value,
  register,
  setValue,
  initialValue = "",
  resetFactor = false,
  minToday = false,
  maxToday = false,
  todayDate = false,
  error,
  trigger,
  validation = {},
  disabled = false,
}) {
  const [date, setDate] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const themeRed = "#EA1B40";
  const themeRedHover = "#D01738";
  const themeLightRed = "#FEF0F3";

  function parseDate(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split("/");
    return new Date(year, month - 1, day);
  }

  function formatDate(dateObj) {
    if (!dateObj || isNaN(dateObj.getTime())) return "";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (todayDate) {
      setDate(today);
      const formatted = formatDate(today);
      setDisplayValue(formatted);
      if (setValue) {
        setValue(value, formatted);
      }
    } else if (initialValue) {
      const convertedValue = initialValue.replace(/-/g, "/");
      const parsedDate = parseDate(convertedValue);
      setDate(parsedDate);
      setDisplayValue(convertedValue);
    }
  }, []);

  useEffect(() => {
    setDate(null);
    setDisplayValue("");
    if (setValue) {
      setValue(value, null);
    }
  }, [resetFactor]);

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate);
    const formatted = formatDate(selectedDate);
    setDisplayValue(formatted);

    if (setValue) {
      setValue(value, formatted);
    }
    if (trigger) trigger(value);

    setShowCalendar(false);
    setIsFocused(true);
  };

  const setTodayDate = () => {
    handleDateSelect(today);
  };

  const handleManualInput = (e) => {
    let valueInput = e.target.value;
    let numbers = valueInput.replace(/\D/g, "");

    if (numbers.length > 0) {
      if (numbers.length <= 2) {
        valueInput = numbers;
      } else if (numbers.length <= 4) {
        valueInput = numbers.slice(0, 2) + "/" + numbers.slice(2);
      } else if (numbers.length <= 8) {
        valueInput =
          numbers.slice(0, 2) +
          "/" +
          numbers.slice(2, 4) +
          "/" +
          numbers.slice(4, 8);
      } else {
        valueInput =
          numbers.slice(0, 2) +
          "/" +
          numbers.slice(2, 4) +
          "/" +
          numbers.slice(4, 8);
      }
    }

    setDisplayValue(valueInput);

    if (valueInput.length === 10) {
      const parsedDate = parseDate(valueInput);
      if (parsedDate && !isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
        if (setValue) {
          setValue(value, valueInput);
        }
        if (trigger) trigger(value);
      }
    } else if (!valueInput) {
      setDate(null);
      if (setValue) {
        setValue(value, null);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      (!displayValue ||
        displayValue === "  /  /    " ||
        displayValue.length < 10)
    ) {
      e.preventDefault();
      setTodayDate();
    }
    if (e.key === "Tab" && (!displayValue || displayValue === "  /  /    ")) {
      setTodayDate();
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (!displayValue) {
      setDisplayValue("  /  /    ");
    }
  };

  const handleBlur = (e) => {
    if (displayValue === "  /  /    ") {
      setDisplayValue("");
    }

    setTimeout(() => {
      if (!displayValue) {
        setIsFocused(false);
      }
    }, 100);
  };

  const formatMonthYear = (locale, date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const formatShortWeekday = (locale, date) => {
    return date.toLocaleDateString("en-US", { weekday: "narrow" });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowCalendar(false);
        if (!displayValue || displayValue === "  /  /    ") {
          setIsFocused(false);
          if (displayValue === "  /  /    ") {
            setDisplayValue("");
          }
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [displayValue]);

  const isPlaceholderFloating =
    isFocused || (displayValue && displayValue !== "  /  /    ");

  return (
    <div className="relative w-full min-w-0" ref={wrapperRef}>
      <input
        type="hidden"
        {...(register ? register(value, validation) : {})}
        value={date ? formatDate(date) : ""}
      />

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleManualInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder=""
          className={`w-full h-8 px-4 pr-10 border rounded-md bg-transparent outline-none
            ${error ? "border-red" : "border-[#979797]"}
            ${disabled ? "bg-white-smoke cursor-not-allowed" : ""}
            ${isPlaceholderFloating ? "" : "text-transparent"}
            font-mono tracking-[2px]`}
          style={{
            fontSize: "16px",
            letterSpacing: "0.15em",
          }}
          onClick={() => {
            if (!disabled) {
              setShowCalendar(true);
            }
          }}
        />

        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 cursor-pointer pointer-events-auto hover:text-gray-700"
          onClick={() => {
            if (!disabled) {
              setShowCalendar(!showCalendar);
              setIsFocused(true);
              inputRef.current?.focus();
            }
          }}
        >
          <CalendarIcon className="h-5 w-5" />
        </div>

        {placeholder && (
          <label
            htmlFor={value}
            className={`absolute transition-all px-2 left-4 pointer-events-none z-10 rounded
              ${
                isPlaceholderFloating
                  ? "-top-2 text-xs z-10 pb-0 font-semibold text-[#979797] bg-white h-4"
                  : `${
                      error ? "top-1/3" : "top-1/2"
                    } -translate-y-1/2 text-sm text-[#979797]`
              }`}
          >
            {placeholder}
          </label>
        )}
      </div>

      {showCalendar && !disabled && (
        <div className="absolute z-50 mt-0.5 shadow-sm bg-white border border-gray-200 rounded-sm p-0.5 min-w-[200px]">
          <Calendar
            onChange={handleDateSelect}
            value={date}
            minDate={minToday ? today : undefined}
            maxDate={maxToday ? today : undefined}
            formatMonthYear={(locale, date) =>
              date.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
              })
            }
            formatShortWeekday={() => ""}
            prevLabel={<ChevronLeft className="h-2 w-2" />}
            nextLabel={<ChevronRight className="h-2 w-2" />}
            prev2Label={null}
            next2Label={null}
            showNeighboringMonth={false}
            className="border-0 font-sans"
          />

          <div className="mt-0.5 pt-0.5 border-t border-gray-100 flex justify-end">
            <button
              className="text-xs text-white px-1 py-0.5 rounded-sm font-medium text-[10px]"
              style={{ backgroundColor: themeRed }}
              onClick={() => setShowCalendar(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {error && (
        <span className="text-red text-xs mt-1 block">{error.message}</span>
      )}

      <style jsx global>{`
        .react-calendar {
          border: none !important;
          font-family: inherit !important;
          width: 100% !important;
          max-width: 200px !important;
          min-width: 200px !important;
          background: white !important;
          padding: 0 !important;
        }

        .react-calendar__navigation {
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          margin-bottom: 0.125rem !important;
          height: 24px !important;
          padding: 0 0.125rem !important;
        }

        .react-calendar__navigation__label {
          background: none !important;
          border: none !important;
          font-size: 0.7rem !important;
          font-weight: 600 !important;
          color: #1f2937 !important;
          padding: 0 !important;
          margin: 0 !important;
          text-transform: none !important;
          pointer-events: none !important;
        }

        .react-calendar__navigation__arrow {
          background: none !important;
          border: none !important;
          color: #6b7280 !important;
          padding: 0.125rem !important;
          min-width: 20px !important;
          height: 20px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 0.125rem !important;
          font-size: 0.6rem !important;
        }

        .react-calendar__month-view__weekdays {
          display: none !important;
        }

        .react-calendar__tile {
          max-width: 100% !important;
          text-align: center !important;
          padding: 0.125rem !important;
          margin: 0.0625rem !important;
          background: none !important;
          border: none !important;
          border-radius: 0.125rem !important;
          font-size: 0.65rem !important;
          height: 24px !important;
          min-height: 24px !important;
          width: 24px !important;
          line-height: 1 !important;
        }

        .react-calendar__tile:enabled:hover {
          background-color: #f3f4f6 !important;
        }

        .react-calendar__month-view__days {
          gap: 0.0625rem !important;
        }

        .react-calendar__tile--now {
          background: ${themeLightRed} !important;
          color: ${themeRed} !important;
          font-weight: 600 !important;
        }

        .react-calendar__tile--active {
          background: ${themeRed} !important;
          color: white !important;
          font-weight: 600 !important;
        }

        .react-calendar__tile--disabled {
          background-color: transparent !important;
          color: #d1d5db !important;
          cursor: not-allowed !important;
        }

        .react-calendar__tile:focus,
        .react-calendar__navigation button:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        .react-calendar__month-view__days__day {
          padding: 0 !important;
        }
      `}</style>
    </div>
  );
}

export function ImageInputBox({
  placeholder,
  register,
  setValue,
  value,
  resetFactor = false,
  setUrl,
}) {
  const [isPlaceholderFloating, setIsPlaceholderFloating] = useState(false);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsPlaceholderFloating(true);
      setFileName(file.name);
      setFile(file);
    } else {
      setIsPlaceholderFloating(false);
      setFileName("");
      setFile(null);
    }
  };

  const handleClearFile = () => {
    setFileName("");
    setValue(value, null);
    setIsPlaceholderFloating(false);
    setFile(null);
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      const base64String = reader.result;
      setValue(value, base64String);
      setUrl(base64String);
    };

    if (file) {
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    handleClearFile();
  }, [resetFactor]);

  return (
    <div className="flex gap-3 items-center w-full">
      <div className="relative w-full ">
        <input
          id={value}
          {...register(value)}
          onChange={handleFileChange}
          type="file"
          className="border border-[#979797] outline-none bg-transparent rounded-md h-8 px-4 py-2 w-full opacity-0 absolute z-10 cursor-pointer"
          accept=".png, .jpg, .jpeg"
        />
        <div
          className={`border border-[#979797] rounded-md h-8 px-4 py-2 w-full flex items-center justify-between cursor-pointer`}
        >
          <span className="text-sm text-[#979797] truncate">{fileName}</span>
        </div>
        <span
          className={`absolute transition-all px-2 left-4 bg-white ${
            isPlaceholderFloating
              ? "-top-2 text-xs z-10 font-semibold text-[#979797]"
              : "top-1/2 -translate-y-1/2 -z-10 text-sm text-[#979797]"
          }`}
        >
          {placeholder}
        </span>
        {fileName && (
          <button
            type="button"
            onClick={handleClearFile}
            className="text-xl text-[#979797] hover:text-red absolute z-10 top-2 right-4"
          >
            &times;
          </button>
        )}
      </div>
      <div className="flex gap-3">
        <label
          htmlFor={value}
          className="bg-red text-white font-semibold rounded-md text-sm py-1.5 px-4 cursor-pointer items-center flex"
        >
          Browse
        </label>
        <SimpleButton
          onClick={() => {
            handleImageUpload(file);
          }}
          name={"Upload"}
          disabled={file === null}
        />
      </div>
    </div>
  );
}

export function SearchInputBox({
  placeholder = "",
  name,
  value,
  register,
  onBlur,
  onKeyDown,
  onChange,
}) {
  const handleChange = (e) => {
    if (onChange) {
      // Normalize search query to lowercase so it matches regardless of case
      const normalized = {
        ...e,
        target: {
          ...e.target,
          value: e.target.value.toLowerCase(),
        },
      };
      onChange(normalized);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden border-french-gray flex items-center gap-2 w-full pl-6 text-sm">
      <Image
        className=""
        alt="search"
        src={`/search.svg`}
        width={16}
        height={16}
      />
      <input
        className="outline-none h-8 text-sm pr-4 placeholder:font-semibold w-full"
        type="search"
        placeholder={placeholder}
        id={name}
        {...(register ? register(name) : {})}
        value={value}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onChange={handleChange}
      />
    </div>
  );
}

export function DisplayInput({
  label,
  valueArray = [],
  setValue,
  disabled = false,
}) {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (Array.isArray(valueArray)) setEntries(valueArray);
  }, [valueArray]);

  const removeEntry = (index) => {
    if (disabled) return;
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    setValue?.(newEntries);
  };

  return (
    <div className="relative w-full">
      {label && (
        <span
          className={`absolute px-2 left-4 transition-all ${
            entries.length > 0
              ? "-top-2 text-xs z-10 font-semibold text-[#979797] bg-white"
              : "top-1/2 -translate-y-1/2 text-sm text-[#979797]"
          }`}
        >
          {label}
        </span>
      )}
      <div
        className={`flex flex-wrap gap-2 h-8 border rounded-md px-2 py-1 ${
          disabled
            ? "bg-white-smoke border-[#979797] cursor-not-allowed"
            : "bg-white border-[#979797]"
        }`}
      >
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className={`flex items-center px-2 py-[1px] rounded text-xs tracking-wide font-semibold ${
              disabled
                ? "bg-white text-gray-500 border-[#979797] border-[1px] border-opacity-50"
                : "bg-white-smoke text-gray-600 border-[#979797] border-[1px] border-opacity-50"
            }`}
          >
            {entry}
            {!disabled && (
              <button
                type="button"
                className="ml-1 text-gray-600 hover:text-gray-900"
                onClick={() => removeEntry(idx)}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const MultipleEntryInputBox = forwardRef(
  (
    {
      value,
      setValue,
      register,
      placeholder = "",
      initialValue = [],
      resetFactor = false,
      error,
      className = "",
    },
    ref,
  ) => {
    const [entries, setEntries] = useState(initialValue);
    const [currentInput, setCurrentInput] = useState("");
    const containerRef = useRef(null);

    useImperativeHandle(ref, () => ({
      clearAll: () => {
        setEntries([]);
        setCurrentInput("");
        setValue(value, []);
      },
      getValues: () => entries,
    }));

    useEffect(() => {
      setValue(value, [...entries], {
        shouldValidate: false,
        shouldDirty: false,
      });
    }, [entries.length]);

    useEffect(() => {
      if (resetFactor) {
        setEntries([]);
        setCurrentInput("");
      }
    }, [resetFactor]);

    const handleKeyDown = (e) => {
      if ((e.key === " " || e.key === "Enter") && currentInput.trim() !== "") {
        e.preventDefault();
        const normalized = currentInput.trim().toUpperCase(); // AWB entries stay uppercase
        if (!entries.includes(normalized)) {
          setEntries((prev) => [...prev, normalized]);
        }
        setCurrentInput("");
      } else if (e.key === "Backspace" && currentInput === "") {
        setEntries((prev) => prev.slice(0, -1));
      }
    };

    const handlePaste = (e) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData("text");
      const newEntries = pastedText
        .split(/[\s,]+/)
        .map((t) => t.trim().toUpperCase()) // normalize pasted entries
        .filter((t) => t !== "");
      setEntries((prev) => [...new Set([...prev, ...newEntries])]);
    };

    const removeEntry = (index) =>
      setEntries((prev) => prev.filter((_, i) => i !== index));

    return (
      <div className={`relative w-full ${className}`}>
        <div
          ref={containerRef}
          className="flex flex-wrap gap-x-2 border rounded-md px-4 py-5 h-[125px] overflow-y-auto items-start leading-none"
        >
          {entries.map((entry, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-misty-rose px-2 py-1 rounded-md"
            >
              <span className="text-xs font-sans font-semibold tracking-wide">
                {entry}
              </span>
              <button
                type="button"
                onClick={() => removeEntry(i)}
                className="text-red hover:text-gray-700"
              >
                &times;
              </button>
            </div>
          ))}

          <input
            name={value}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            className="flex-1 outline-none border-none text-sm bg-transparent min-w-[100px]"
          />
        </div>

        {error && <span className="text-red text-xs">{error.message}</span>}
      </div>
    );
  },
);
