"use client";
import React, { useEffect } from "react";

export function DummyInputBoxWithLabelLightGray({
  label,
  register,
  setValue,
  value,
  inputValue = null,
  reset = () => {},
  resetFactor = false,
  placeholder,
  className,
  disabled = true,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue, value]);

  useEffect(() => {
    setValue(value, "");
  }, [resetFactor]);

  return (
    <div className="relative ">
      <input
        {...register(value)}
        className={`border border-[#979797] ${
          className ? className : "bg-white-smoke"
        } outline-none bg-transparent rounded-md h-8 px-4 py-2 text-sm  w-full`}
        placeholder={placeholder}
        disabled={disabled}
      />
      <span
        className={`absolute transition-all px-2 left-4 first-line text-battleship-gray bg-white -top-2 text-xs z-10 font-semibold rounded "
         
          }`}
      >
        {label}
      </span>
    </div>
  );
}
export function DummyInputBoxWithLabelTransparent({
  label,
  register,
  setValue,
  value,
  inputValue = null,
  reset = () => {},
  resetFactor = false,
  placeholder,
  error,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue]);

  useEffect(() => {
    setValue(value, "");
  }, [resetFactor]);

  return (
    <div className="relative w-full ">
      <div>
        <input
          {...register(value)}
          className="border border-platinum-input bg-transparent outline-none  rounded-md h-8 px-4 py-2 text-sm  w-full "
          placeholder={placeholder}
          disabled
        />
        <span
          className={`absolute transition-all px-2 left-4 first-line text-battleship-gray bg-white -top-2 text-xs z-10 font-semibold rounded "
       
        }`}
        >
          {label}
        </span>
      </div>
      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  );
}
export function DummyInputBoxWithLabelDarkerGray({
  label,
  register,
  setValue,
  value,
  inputValue = null,
  reset = () => {},
  resetFactor = false,
  placeholder,
  watch,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue, value]);

  useEffect(() => {
    setValue(value, "");
  }, [resetFactor]);

  return (
    <div className="relative w-full ">
      <input
        {...register(value)}
        className="border border-[#979797] bg-[#D9D9D9]  outline-none  rounded-md h-8 px-4 py-2 text-sm  w-full "
        placeholder={placeholder}
        disabled
      />
      <span
        className={`absolute transition-all px-2 left-4 text-battleship-gray ${
          watch(value)
            ? "-top-2 text-xs z-10 font-semibold bg-white"
            : "top-1/2 -translate-y-1/2 z-10 text-sm"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
export function DummyInputBoxWithLabelDarkGray({
  label,
  register,
  setValue,
  value,
  inputValue = null,
  reset = () => {},
  resetFactor = false,
  placeholder,
  error,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue]);

  useEffect(() => {
    setValue(value, "");
  }, [resetFactor]);

  return (
    <div className="relative w-full ">
      <div>
        <input
          {...register(value)}
          className="border border-platinum-input bg-anti-flash-white outline-none  rounded-md h-8 px-4 py-2 text-sm  w-full "
          placeholder={placeholder}
          disabled
        />
        <span
          className={`absolute transition-all px-2 left-4 first-line text-battleship-gray bg-white -top-2 text-xs z-10 font-semibold rounded "
       
        }`}
        >
          {label}
        </span>
      </div>
      {error && <span className="text-red text-xs">{error.message}</span>}
    </div>
  );
}
export function DummyInputBoxWithLabelDarkGrayAndRedText({
  label,
  register,
  setValue,
  value,
  inputValue = null,
  reset = () => {},
  resetFactor = false,
  placeholder,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue]);

  useEffect(() => {
    setValue(value, "");
  }, [resetFactor]);

  return (
    <div className="relative w-full ">
      <input
        {...register(value)}
        className="border border-platinum-input bg-anti-flash-white text-red font-semibold outline-none  rounded-md h-8 px-4 py-2 text-sm  w-full "
        placeholder={placeholder}
        disabled
      />
      <span
        className={`absolute transition-all px-2 left-4 first-line text-battleship-gray bg-white -top-2 text-xs z-10 font-semibold rounded "
       
        }`}
      >
        {label}
      </span>
    </div>
  );
}
export function DummyInputBoxWithLabelYellow({
  label,
  register,
  setValue,
  inputValue = null,
  value,
  reset = () => {},
  resetFactor = false,
  placeholder,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue]);

  useEffect(() => {
    setValue(value, "");
  }, [resetFactor]);

  return (
    <div className="relative ">
      <input
        {...register(value)}
        className={`border border-[#CFB400] bg-[#FFFF80] outline-none rounded-md h-8 px-4 py-2 text-eerie-black text-sm w-full ${
          value == "grandTotal" ? "font-bold" : ""
        } `}
        placeholder={placeholder}
        disabled
      />
      <span
        className={`absolute transition-all px-2 left-4 first-line  bg-white -top-2 text-xs z-10 font-semibold rounded ${
          value == "grandTotal"
            ? "font-semibold text-eerie-black"
            : "text-battleship-gray"
        } `}
      >
        {label}
      </span>
    </div>
  );
}

export function DummyInputBoxDarkGray({
  label,
  register,
  setValue,
  inputValue = null,
  value,
  reset = () => {},
  resetFactor = false,
  placeholder,
  disabled = true,
  className,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue]);

  useEffect(() => {
    reset();
  }, [resetFactor]);
  return (
    <div className="relative w-full ">
      <input
        {...register(value)}
        className={`border border-[#979797] ${className ? className : "bg-[#D9D9D9]"} outline-none  rounded-md h-8 px-4 py-2 text-sm text-eerie-black placeholder:text-eerie-black w-full `}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
export function DummyInputBoxLightGray({
  register,
  setValue,
  inputValue = null,
  value,
  reset = () => {},
  resetFactor = false,
  placeholder,
  className,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue]);

  useEffect(() => {
    reset();
  }, [resetFactor]);
  return (
    <input
      {...register(value)}
      className={`border border-[#979797] outline-none rounded-md h-8 px-4 py-2 text-sm text-eerie-black placeholder:text-eerie-black w-full ${className ? className : ""}`}
      placeholder={placeholder}
      disabled
    />
  );
}

export function DummyInputBoxTransparent({
  register,
  setValue,
  inputValue = null,
  value,
  reset = () => {},
  resetFactor = false,
  placeholder,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue]);

  useEffect(() => {
    reset();
  }, [resetFactor]);
  return (
    <input
      {...register(value)}
      className="border  border-[#979797] bg-transparent outline-none  rounded-md h-8 px-4 py-2 text-sm text-eerie-black placeholder:text-eerie-black  w-full"
      placeholder={placeholder}
      disabled
    />
  );
}
export function DummyInputBoxYellow({
  label,
  register,
  setValue,
  value,
  inputValue = null,
  reset = () => {},
  resetFactor = false,
  placeholder,
}) {
  useEffect(() => {
    setValue(value, inputValue);
  }, [inputValue]);

  useEffect(() => {}, [resetFactor]);
  return (
    <div className="relative ">
      <input
        {...register(value)}
        className="border border-[#CFB400] bg-transparent outline-none  rounded-md h-8 px-4 py-2 text-sm text-eerie-black placeholder:text-eerie-black  w-full"
        placeholder={placeholder}
        disabled
      />
    </div>
  );
}
