"use client";
import { OutlinedButtonWithLeftImage } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import { FractionNumberInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import UploadModal from "@/app/components/UploadModal";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import React, { useContext, useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Converts "DD/MM/YYYY" -> "YYYY-MM-DD" for the API
function toISODate(dateStr) {
  if (!dateStr) return dateStr;
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}

/**
 * Local date input used only on the Tax Settings page.
 * Same design/behavior as the shared DateInputBox, but properly re-syncs
 * whenever `initialValue` changes after mount (e.g. after a fetch),
 * instead of only reading it once.
 */
function TaxEffectiveDateBox({
  placeholder = "Date",
  value,
  register,
  setValue,
  initialValue = "",
  resetFactor = false,
  minToday = false,
  maxToday = false,
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

  // Sync whenever initialValue changes (fixes: previously only ran on mount)
  useEffect(() => {
    if (initialValue) {
      const convertedValue = initialValue.replace(/-/g, "/");
      const parsedDate = parseDate(convertedValue);
      setDate(parsedDate);
      setDisplayValue(convertedValue);
    } else {
      setDate(null);
      setDisplayValue("");
    }
  }, [initialValue]);

  // Reset on external reset trigger
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

  const handleFocus = () => {
    setIsFocused(true);
    if (!displayValue) {
      setDisplayValue("  /  /    ");
    }
  };

  const handleBlur = () => {
    if (displayValue === "  /  /    ") {
      setDisplayValue("");
    }
    setTimeout(() => {
      if (!displayValue) {
        setIsFocused(false);
      }
    }, 100);
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
          style={{ fontSize: "16px", letterSpacing: "0.15em" }}
          onClick={() => {
            if (!disabled) setShowCalendar(true);
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

function TaxSettings() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const { server } = useContext(GlobalContext);
  const [awbreset, setAwbreset] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const taxValue = watch("tax");
  const effectiveDateValue = watch("effectiveDate");

  // Fetch existing tax setting when tax type is selected
  useEffect(() => {
    const fetchTaxSetting = async () => {
      if (!taxValue) return;

      try {
        const res = await axios.get(`${server}/tax-settings`, {
          params: { tax: taxValue },
        });

        const existingSetting = Array.isArray(res.data) ? res.data[0] : null;

        if (existingSetting) {
          setValue("taxAmount", (existingSetting.taxAmount * 100).toFixed(2));

          // Format as DD-MM-YYYY to match what TaxEffectiveDateBox expects
          const date = new Date(existingSetting.effectiveDate);
          const dd = String(date.getDate()).padStart(2, "0");
          const mm = String(date.getMonth() + 1).padStart(2, "0");
          const yyyy = date.getFullYear();
          setValue("effectiveDate", `${dd}-${mm}-${yyyy}`);
        } else {
          setValue("taxAmount", "");
          setValue("effectiveDate", "");
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setValue("taxAmount", "");
          setValue("effectiveDate", "");
        } else {
          console.error("Error fetching tax settings:", error);
          showNotification("error", "Failed to fetch tax settings!");
        }
      }
    };

    fetchTaxSetting();
  }, [taxValue, server, setValue]);

  const onSubmit = async (data) => {
    const formattedData = {
      ...data,
      taxAmount: parseFloat(data.taxAmount) / 100,
      effectiveDate: toISODate(data.effectiveDate),
    };

    try {
      const res = await axios.post(`${server}/tax-settings`, formattedData);
      showNotification("success", "Tax settings data saved successfully!");
    } catch (error) {
      console.error(
        "Error saving tax settings:",
        error.response?.data || error.message,
      );
      showNotification("error", "Tax settings data save failed!");
    }
  };

  const handleRefresh = () => {
    setAwbreset(!awbreset);
    setValue("tax", "");
    setValue("taxAmount", "");
    setValue("effectiveDate", "");
  };

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Heading
          title={`Tax Settings`}
          onClickBulkUploadBtn={() => setShowUploadModal(true)}
          onRefresh={handleRefresh}
          codeListBtn="hidden"
        />

        <div>
          <LabeledDropdown
            options={["CGST", "SGST", "IGST"]}
            setValue={setValue}
            title={`Name`}
            register={register}
            value="tax"
            resetFactor={awbreset}
          />
        </div>

        <div className="flex justify-between gap-3">
          <FractionNumberInputBox
            key={`amount-${taxValue}`}
            placeholder={`Tax Amount %`}
            value={`taxAmount`}
            register={register}
            setValue={setValue}
            resetFactor={awbreset}
            initialValue={watch("taxAmount")}
          />
          <input type="hidden" {...register("tax", { required: true })} />

          <TaxEffectiveDateBox
            placeholder={`Effective Date`}
            value="effectiveDate"
            register={register}
            setValue={setValue}
            initialValue={effectiveDateValue}
            resetFactor={awbreset}
            validation={{ required: true }}
            error={errors.effectiveDate}
          />
        </div>

        <div className="flex justify-end">
          <OutlinedButtonWithLeftImage
            label={`Update Tax Setting`}
            icon={`/update.svg`}
            type="submit"
          />
        </div>
      </form>

      {showUploadModal && (
        <UploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </>
  );
}

export default TaxSettings;