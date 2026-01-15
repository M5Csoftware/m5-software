import React, { useState } from 'react';
import Image from 'next/image';

function Checkbox({ id, register, setValue, isChecked, setChecked, label }) {

  const toggleChecked = () => {
    setChecked((prev) => !prev); // Toggle the state
    setValue(id, isChecked)
  };

  return (
    <label
      onClick={toggleChecked}
      className='flex gap-2.5 cursor-pointer select-none'
      htmlFor={id}
    >
      <div className={`rounded w-4 h-4 border cursor-pointer select-none hover:opacity-80 flex items-center justify-center ${isChecked ? 'border-red bg-misty-rose' : 'border-french-gray'
        }`}>
        <Image className={`${isChecked ? '' : 'hidden'}`} src={`/check.svg`} alt='check' width={12} height={12} />
        <input
          id={id}
          type="checkbox"
          {...register(id)}
          checked={isChecked}
          onChange={toggleChecked} // Ensure state is updated correctly
          className="hidden"
        />
      </div>
      <span className='text-eerie-black text-xs'>{label}</span>

    </label>
  );
}

export default Checkbox;

export function RedCheckbox({
  id,
  label,
  isChecked,
  setChecked,
  register,
  setValue,
  disabled = false,
}) {
  const toggleChecked = () => {
    if (disabled) return;
    setChecked(!isChecked);
    if (setValue) setValue(id, !isChecked); // update form value if using react-hook-form
  };

  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        className={`w-4 h-4 flex items-center justify-center border rounded ${
          isChecked ? "bg-red border-red" : "border-gray-300 bg-white"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={toggleChecked}
      >
        {isChecked && (
          <svg
            className="w-3 !h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={`text-xs tracking-wide
       text-black ${disabled ? "opacity-50" : ""}`} onClick={toggleChecked}>
        {label}
      </span>

      {/* Hidden input for react-hook-form */}
      {register && <input type="hidden" {...register(id)} value={isChecked} />}
    </label>
  );
}

