import React, { useState } from 'react';
import Image from 'next/image';

function RedCheckbox({ id, register, setValue, isChecked, setChecked, label, disabled = false }) {

  const toggleChecked = () => {
    setChecked((prev) => !prev); // Toggle the state
    setValue(id, isChecked)
  };

  return (
    <label
      onClick={toggleChecked}
      className='flex gap-2.5 items-center cursor-pointer select-none'
      htmlFor={id}
    >
      <div className={`rounded w-4 h-4 border cursor-pointer select-none hover:opacity-80 flex items-center justify-center ${isChecked ? 'border-red bg-red' : 'border-french-gray'
        }`}>
        <Image className={`${isChecked ? '' : 'hidden'}`} src={`/redCheck.svg`} alt='check' width={12} height={12} />
        <input
          id={id}
          type="checkbox"
          {...register(id)}
          checked={isChecked}
          onChange={toggleChecked} // Ensure state is updated correctly
          className="hidden"
          disabled={disabled}
        />
      </div>
      <span className='text-eerie-black font-sans font-normal tracking-wide text-xs'>{label}</span>

    </label>
  );
}

export default RedCheckbox;

export function RedCheckboxBase({ id, register, setValue, isChecked, setChecked, label, flip = false, disabled = false, }) {

  const toggleChecked = () => {
    if (disabled) return;
    setChecked((prev) => !prev); // Toggle the state
    setValue(id, isChecked)
  };

  return (
    <label
      onClick={toggleChecked}
      className={`flex gap-2.5 items-center cursor-pointer select-none text-xs  ${flip ? "flex-row-reverse" : "flex-row"}`}
      htmlFor={id}
    >
      <div className={`rounded w-3.5 h-3.5 border cursor-pointer select-none hover:opacity-80 flex items-center justify-center ${isChecked ? 'border-red bg-red' : 'border-french-gray'
        }`}>
        <Image className={`${isChecked ? '' : 'hidden'}`} src={`/redCheck.svg`} alt='check' width={12} height={12} />
        <input
          id={id}
          type="checkbox"
          {...register(id)}
          checked={isChecked}
          onChange={toggleChecked} // Ensure state is updated correctly
          className="hidden"
          disabled={disabled}
        />
      </div>
      <span className='text-eerie-black'>{label}</span>

    </label>
  );
}


export function RedCheckboxRedLabel({ id, register, setValue, isChecked, setChecked, label, flip = false }) {

  const toggleChecked = () => {
    setChecked((prev) => !prev); // Toggle the state
    setValue(id, isChecked)
  };

  return (
    <label
      onClick={toggleChecked}
      className={`flex gap-2.5 items-center cursor-pointer select-none  ${flip ? "flex-row-reverse" : "flex-row"}`}
      htmlFor={id}
    >
      <div className={`rounded w-4 h-4 border cursor-pointer select-none hover:opacity-80 flex items-center justify-center ${isChecked ? 'border-red bg-red' : 'border-french-gray'
        }`}>
        <Image className={`${isChecked ? '' : 'hidden'}`} src={`/redCheck.svg`} alt='check' width={12} height={12} />
        <input
          id={id}
          type="checkbox"
          {...register(id)}
          checked={isChecked}
          onChange={toggleChecked} // Ensure state is updated correctly
          className="hidden"
        />
      </div>
      <span className='text-red font-semibold text-sm'>{label}</span>

    </label>
  );
}