"use client";
import React, { useState, useEffect } from "react";

export function MonthInput({
  placeholder = "Month",
  value,
  register,
  setValue,
  initialValue = "",
  resetFactor = false,
  maxToday = false,
  minToday = false,
  error,
  trigger,
  validation = {},
  disabled = false,
}) {
  const todayMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue || "");

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setValue(value, newValue);
    if (trigger) trigger(value);
  };

  const isPlaceholderFloating = isFocused || inputValue !== "";

  // Update when initialValue changes
  useEffect(() => {
    setInputValue(initialValue || "");
  }, [initialValue]);

  // Reset on resetFactor
  useEffect(() => {
    setInputValue("");
    setValue(value, null);
  }, [resetFactor]);

  return (
    <div className="relative w-full shadow-sm">
      <input
        type="month"
        {...register(value, validation)}
        value={inputValue}
        min={minToday ? todayMonth : ""}
        max={maxToday ? todayMonth : ""}
        id={value}
        disabled={disabled}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`border outline-none rounded-md h-8 px-2.5 py-1 w-full bg-transparent
          ${error ? "border-red" : "border-[#979797]"}
          ${disabled ? "bg-white-smoke" : ""}
          ${isPlaceholderFloating ? "" : "text-transparent"}`}
      />

      {placeholder && (
        <label
          htmlFor={value}
          className={`absolute transition-all px-2 left-4
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

      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  );
}
