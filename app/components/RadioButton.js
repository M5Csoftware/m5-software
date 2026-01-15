import React from "react";
import Image from "next/image";

function RadioButton({
  id,
  name,
  register,
  setValue,
  selectedValue,
  setSelectedValue,
  label,
}) {
  const toggleSelected = () => {
    setSelectedValue(id); // Set the selected radio button value
    setValue(name, id); // Update form value
  };

  return (
    <label
      onClick={toggleSelected}
      className="flex gap-3 items-center cursor-pointer font-medium text-sm"
      htmlFor={id}
    >
      <div
        className={`rounded-full w-5 h-5 border cursor-pointer select-none hover:opacity-80 flex items-center justify-center ${selectedValue === id ? "border-red bg-red" : "border-french-gray"
          }`}
      >
        {selectedValue === id && (
          <div className="w-2 h-2 bg-white rounded-full"></div>
        )}

        <input
          id={id}
          name={name}
          type="radio"
          {...register(name)}
          checked={selectedValue === id}
          onChange={toggleSelected} // Ensure state is updated correctly
          className="hidden"
        />
      </div>
      <span>{label}</span>
    </label>
  );
}

export default RadioButton;

export function RadioButtonLarge({
  id,
  name,
  register,
  setValue,
  selectedValue,
  setSelectedValue,
  label,
}) {
  const toggleSelected = () => {
    setSelectedValue(id); // Set the selected radio button value
    setValue(name, id); // Update form value
  };

  return (
    <label
      onClick={toggleSelected}
      className={`flex w-full gap-2 items-center justify-center cursor-pointer font-medium text-sm py-2 px-10 rounded-md ${selectedValue === id ? "bg-misty-rose" : "bg-[#f8f8f8]"
        }`}
      htmlFor={id}
    >
      <div
        className={`rounded-full w-5 h-5 border cursor-pointer select-none hover:opacity-80 flex items-center justify-center text-center ${selectedValue === id ? "border-red bg-white" : "border-french-gray"
          }`}
      >
        {selectedValue === id && (
          <div className="w-2 h-2 bg-red rounded-full"></div>
        )}

        <input
          id={id}
          name={name}
          type="radio"
          {...register(name)}
          checked={selectedValue === id}
          onChange={toggleSelected} // Ensure state is updated correctly
          className="hidden"
        />
      </div>
      <span className={`font-semibold ${selectedValue === id ? "text-red" : "text-battleship-gray"} `}>{label}</span>
    </label>
  );
}


export function RadioMidRedButton({ id,
  name,
  register,
  setValue,
  selectedValue,
  setSelectedValue,
  label, }) {
  const toggleSelected = () => {
    setSelectedValue(id); // Set the selected radio button value
    setValue(name, id); // Update form value
  };

  return (
    <label
      onClick={toggleSelected}
      className="flex gap-3 items-center cursor-pointer font-medium text-sm"
      htmlFor={id}
    >
      <div
        className={`rounded-full w-5 h-5 border cursor-pointer select-none hover:opacity-80 flex items-center justify-center ${selectedValue === id ? "border-red " : "border-french-gray"
          }`}
      >
        {selectedValue === id && (
          <div className="w-2 h-2 bg-red rounded-full"></div>
        )}

        <input
          id={id}
          name={name}
          type="radio"
          {...register(name)}
          checked={selectedValue === id}
          onChange={toggleSelected} // Ensure state is updated correctly
          className="hidden"
        />
      </div>
      <span>{label}</span>
    </label>
  )
}


export function RadioButtonDemo({
  id,
  name,
  register,
  setValue,
  selectedValue,
  setSelectedValue,
  label,
}) {
  const toggleSelected = () => {
    setSelectedValue(id); // Set the selected radio button value
    setValue(name, id); // Update form value
  };

  return (
    <label
      onClick={toggleSelected}
      className={`flex gap-3 items-center text-center justify-center cursor-pointer font-medium text-base px-16 py-3 rounded-md w-full ${selectedValue === id
          ? "bg-[#FFE5E9] text-red"
          : "bg-[#F8F8F8] text-[#979797]"
        }`}
      htmlFor={id}
    >
      <div
        className={`rounded-full w-5 h-5 border cursor-pointer select-none hover:opacity-80 flex items-center justify-center ${selectedValue === id ? "border-red " : "border-french-gray"
          }`}
      >
        {selectedValue === id && (
          <div className="w-2 h-2 bg-red rounded-full"></div>
        )}

        <input
          id={id}
          name={name}
          type="radio"
          {...register(name)}
          checked={selectedValue === id}
          onChange={toggleSelected} // Ensure state is updated correctly
          className="hidden"
        />
      </div>
      <span>{label}</span>
    </label>
  );
}





