"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import Image from "next/image";

export const Dropdown = ({
  options,
  value,
  register,
  setValue,
  title,
  defaultValue,
  selectedValue,
  resetFactor = false,
  handleRefresh = () => {},
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(defaultValue || "");
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (selectedValue !== undefined) {
      setSelectedOption(selectedValue);
    }
  }, [selectedValue]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setValue(value, option);
    setIsOpen(false);
    handleRefresh();
  };

  useEffect(() => {
    setSelectedOption(defaultValue || "");
  }, [defaultValue]);

  useEffect(() => {
    if (resetFactor) {
      setSelectedOption("");
      setValue(value, "");
    }
  }, [resetFactor, setValue, value]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Floating Label */}
      <span
        className={`absolute left-4 px-1 transition-all ${
          selectedOption || isOpen
            ? "-top-2 bg-white text-xs font-semibold text-[#979797]"
            : "top-1/2 -translate-y-1/2 text-sm text-[#979797]"
        }`}
      >
        {title}
      </span>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between border border-[#979797] text-battleship-gray rounded-md items-center h-8 px-4 py-2 cursor-pointer"
      >
        <span className="text-sm">{selectedOption || ""}</span>

        <Image
          className={`transition-all ${isOpen ? "rotate-180" : ""}`}
          src="/dropdown-arrow.svg"
          height={18}
          width={18}
          alt="arrow"
        />
      </div>

      {isOpen && (
        <div className="absolute z-20 w-full shadow-md bg-white text-dim-gray rounded-md mt-1 overflow-auto max-h-80">
          {options.map((option, idx) => (
            <div
              key={idx}
              onClick={() => handleSelect(option)}
              className="px-6 py-4 hover:bg-gray-100 cursor-pointer"
            >
              <span className="text-sm">{option}</span>
            </div>
          ))}
        </div>
      )}

      <input type="hidden" {...register(value)} value={selectedOption} />
    </div>
  );
};

export const DropdownOptionOnly = ({
  options,
  value,
  defaultValue,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(defaultValue || "");
  const dropdownRef = useRef(null); // Ref for the dropdown container

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
    if (onChange) onChange(option);
  };

  useEffect(() => {
    setSelectedOption(defaultValue || "");
  }, [defaultValue]);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedOption(value);
    }
  }, [value]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between border border-battleship-gray text-battleship-gray rounded-md items-center px-6 py-1.5 text-xs cursor-pointer"
      >
        {selectedOption}
        <Image
          className={`transition-all ${isOpen ? "rotate-180" : ""}`}
          src={`/dropdown-arrow.svg`}
          height={18}
          width={18}
          alt="arrow"
        />
      </div>

      <div
        className={`absolute z-20 w-full shadow-md bg-white text-dim-gray rounded-[4px] mt-1 transition-all overflow-auto ${
          isOpen ? "max-h-80" : "max-h-0"
        }`}
      >
        {options.map((option, idx) => (
          <div
            key={idx}
            onClick={() => handleSelect(option)}
            className="px-6 py-4 hover:bg-gray-100 cursor-pointer"
          >
            <span className="text-xs">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DropdownRedLabel = ({
  options,
  value,
  register,
  setValue,
  title,
  defaultValue,
  resetFactor = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(defaultValue || "");
  const dropdownRef = useRef(null); // Ref for the dropdown container

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    setValue(value, option); // Update form value in react-hook-form
    setIsOpen(false);
  };

  useEffect(() => {
    setSelectedOption(defaultValue || "");
  }, [defaultValue]);

  useEffect(() => {
    if (resetFactor) {
      setSelectedOption(""); // Reset selected option when resetFactor changes
    }
  }, [resetFactor]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between border border-battleship-gray text-red font-semibold rounded-md items-center h-8 px-4 py-2 text-sm cursor-pointer"
      >
        {selectedOption || title}
        <Image
          className={`transition-all ${isOpen ? "rotate-180" : ""}`}
          src={`/dropdown-arrow.svg`}
          height={18}
          width={18}
          alt="arrow"
        />
      </div>

      <div
        className={`absolute z-20 w-full shadow-md bg-white text-red  rounded-[4px] mt-1 transition-all overflow-auto ${
          isOpen ? "max-h-80" : "max-h-0"
        }`}
      >
        {options.map((option, idx) => (
          <div
            key={idx}
            onClick={() => handleSelect(option)}
            className="px-6 py-4 hover:bg-gray-100 cursor-pointer"
          >
            <span className="text-sm">{option}</span>
          </div>
        ))}
      </div>
      {/* Hidden input for form integration */}
      <input type="hidden" {...register(value)} value={selectedOption} />
    </div>
  );
};

// export const SearchableDropDrown = ({
//   options,
//   value,
//   register,
//   setValue,
//   title,
//   defaultValue,
//   placeholder,
//   resetFactor = false,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [filteredOptions, setFilteredOptions] = useState(options);
//   const [selectedOption, setSelectedOption] = useState(defaultValue || "");
//   const dropdownRef = useRef(null);

//   // Filter options based on search term
//   useEffect(() => {
//     setFilteredOptions(
//       options.filter((option) =>
//         option.toLowerCase().startsWith(searchTerm.toLowerCase())
//       )
//     );
//   }, [searchTerm, options]);

//   // Handle selection of an option
//   const handleSelect = (option) => {
//     setSelectedOption(option);
//     setSearchTerm(option);
//     setValue(value, option);
//     setIsOpen(false);
//   };

//   // Reset selection when defaultValue changes
//   useEffect(() => {
//     setSelectedOption(defaultValue || "");
//     setSearchTerm(defaultValue || "");
//   }, [defaultValue]);

//   // Reset dropdown when resetFactor is triggered
//   useEffect(() => {
//     if (resetFactor) {
//       setSelectedOption("");
//       setSearchTerm("");
//       setValue(value, null);
//     }
//   }, [resetFactor, setValue, value]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   return (
//     <div className="relative w-full" ref={dropdownRef}>
//       {/* Floating label */}
//       <span
//         className={`absolute transition-all px-2 left-4 bg-white ${
//           isOpen || selectedOption
//             ? "-top-2 text-xs font-semibold text-[#979797] z-10"
//             : "top-1/2 -translate-y-1/2 text-sm text-[#979797]"
//         }`}
//       >
//         {title}
//       </span>

//       {/* Input field */}
//       <div
//         onClick={() => setIsOpen(!isOpen)}
//         className="flex w-full justify-between border border-[#979797] text-dim-gray rounded-md items-center h-10 px-4 py-2 cursor-pointer relative"
//       >
//         <input
//           type="text"
//           value={searchTerm}
//           onChange={(e) => {
//             const inputValue = e.target.value;
//             setSearchTerm(inputValue);
//             setIsOpen(true);

//             if (inputValue === "") {
//               setSelectedOption(""); // Reset selected option when input is cleared
//               setValue(value, ""); // Ensure the form value is updated properly
//             }
//           }}
//           className="w-full outline-none bg-transparent"
//           placeholder={!searchTerm ? placeholder : ""}
//         />
//         <Image
//           className={`transition-all ${isOpen ? "rotate-180" : ""}`}
//           src={`/dropdown-arrow.svg`}
//           height={18}
//           width={18}
//           alt="arrow"
//         />
//       </div>

//       {/* Dropdown menu */}
//       {isOpen && (
//         <div className="absolute z-20 w-full shadow-md bg-white text-dim-gray rounded-[4px] mt-1 transition-all overflow-auto max-h-80">
//           {filteredOptions.length > 0 ? (
//             filteredOptions.map((option, idx) => (
//               <div
//                 key={idx}
//                 onClick={() => handleSelect(option)}
//                 className="px-6 py-4 hover:bg-gray-100 cursor-pointer"
//               >
//                 <span className="text-xs">{option}</span>
//               </div>
//             ))
//           ) : (
//             <div className="px-6 py-4 text-xs text-gray-400">
//               No options found
//             </div>
//           )}
//         </div>
//       )}
//       <input type="hidden" {...register(value)} value={selectedOption || ""} />
//     </div>
//   );
// };

export const SearchableDropDrown = ({
  options,
  value,
  register,
  setValue,
  title,
  defaultValue,
  placeholder,
  resetFactor = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(defaultValue || "");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option.toLowerCase().startsWith(searchTerm.toLowerCase())
    );
  }, [searchTerm, options]);

  // Handle selection of an option
  const handleSelect = useCallback((option) => {
    setSelectedOption(option);
    setSearchTerm(option);
    setValue(value, option);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [value, setValue]);

  // Reset selection when defaultValue changes
  useEffect(() => {
    setSelectedOption(defaultValue || "");
    setSearchTerm(defaultValue || "");
  }, [defaultValue]);

  // Reset dropdown when resetFactor is triggered
  useEffect(() => {
    if (resetFactor) {
      setSelectedOption("");
      setSearchTerm("");
      setValue(value, null);
      setHighlightedIndex(-1);
    }
  }, [resetFactor, setValue, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      // Open dropdown on Arrow Down or Arrow Up when closed
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;

      case "Tab":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;

      default:
        // Reset highlighted index when typing
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle mouse hover over options
  const handleMouseEnter = (index) => {
    setHighlightedIndex(index);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Floating label */}
      <span
        className={`absolute transition-all px-2 left-4 bg-white ${
          isOpen || selectedOption
            ? "-top-2 text-xs font-semibold text-[#979797] z-10"
            : `top-1/2 -translate-y-1/2 text-sm text-[#979797] ${
                disabled ? "z-10" : ""
              }`
        }`}
      >
        {title}
      </span>

      {/* Input field */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={`flex w-full justify-between border border-[#979797] text-dim-gray rounded-md items-center h-8 px-4 py-2 cursor-pointer relative ${
          disabled ? "bg-white-smoke" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const inputValue = e.target.value;
            setSearchTerm(inputValue);
            setIsOpen(true);

            if (inputValue === "") {
              setSelectedOption(""); // Reset selected option when input is cleared
              setValue(value, ""); // Ensure the form value is updated properly
            }
          }}
          className="w-full outline-none bg-transparent"
          placeholder={!searchTerm ? placeholder : ""}
          disabled={disabled}
        />
        <Image
          className={`transition-all ${
            isOpen && !disabled ? "rotate-180" : ""
          }`}
          src={`/dropdown-arrow.svg`}
          height={18}
          width={18}
          alt="arrow"
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-20 w-full shadow-md bg-white text-dim-gray rounded-[4px] mt-1 transition-all overflow-auto max-h-80 table-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <div
                key={idx}
                ref={(el) => (optionRefs.current[idx] = el)}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => handleMouseEnter(idx)}
                className={`px-6 py-4 cursor-pointer transition-colors ${
                  highlightedIndex === idx
                    ? "bg-blue-50 text-gray-600"
                    : "hover:bg-gray-100"
                }`}
              >
                <span className="text-xs">{option}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-xs text-gray-400">
              No options found
            </div>
          )}
        </div>
      )}
      <input type="hidden" {...register(value)} value={selectedOption || ""} />
    </div>
  );
};

export const LabeledDropdown = ({
  options,
  value,
  register,
  setValue,
  title,
  defaultValue,
  validation = {},
  error,
  onChange,
  trigger,
  selectedValue,
  placeholder,
  resetFactor = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOption, setSelectedOption] = useState(defaultValue || "");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const optionRefs = useRef([]);

  useEffect(() => {
    if (selectedValue !== undefined) {
      setSelectedOption(selectedValue);
      setSearchTerm(selectedValue);
    }
  }, [selectedValue]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    return options.filter((option) =>
      option?.toLowerCase().includes((searchTerm || "").toLowerCase())
    );
  }, [searchTerm, options]);

  // Handle selection of an option
  const handleSelect = useCallback((option) => {
    setSelectedOption(option);
    setSearchTerm(option);
    setValue(value, option);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (trigger) {
      trigger(value);
    }
    if (onChange) {
      onChange(option);
    }
  }, [value, setValue, trigger, onChange]);

  // Reset selection when defaultValue changes
  useEffect(() => {
    if (defaultValue && !selectedValue) {
      setSelectedOption(defaultValue);
      setSearchTerm(defaultValue);
    }
  }, [defaultValue]);

  // Reset dropdown when resetFactor is triggered
  useEffect(() => {
    if (resetFactor) {
      setSelectedOption("");
      setSearchTerm("");
      setValue(value, "");
      setHighlightedIndex(-1);
    }
  }, [resetFactor, setValue, value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // setIsOpen(false);
        // setHighlightedIndex(-1);
        if (isOpen) {
          setIsOpen(false);
          setHighlightedIndex(-1);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      // Open dropdown on Arrow Down or Arrow Up when closed
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;

      case "Tab":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;

      default:
        // Reset highlighted index when typing
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle mouse hover over options
  const handleMouseEnter = (index) => {
    setHighlightedIndex(index);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Floating label */}
      <span
        className={`absolute transition-all px-2 left-4  ${
          isOpen || selectedOption
            ? "-top-2 bg-white  text-xs font-semibold text-[#979797] z-10"
            : `${
                error ? "top-1/3" : "top-1/2"
              } -translate-y-1/2 text-sm text-[#979797] ${
                disabled ? "z-10" : ""
              }`
        }`}
      >
        {title}
      </span>

      {/* Input field */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        className={`flex w-full justify-between border border-[#979797] text-dim-gray rounded-md items-center text-sm h-8 px-4 py-2 cursor-pointer relative ${
          disabled ? "bg-white-smoke" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          disabled={disabled}
          autoComplete="off"
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const inputValue = e.target.value;
            setSearchTerm(inputValue);
            setIsOpen(true);

            if (inputValue === "") {
              setSelectedOption(""); // Reset selected option when input is cleared
              setValue(value, ""); // Ensure the form value is updated properly
            }
          }}
          className="w-full outline-none bg-transparent text-sm"
          placeholder={!searchTerm ? placeholder : ""}
        />
        <Image
          className={`transition-all ${
            isOpen && !disabled ? "rotate-180" : ""
          }`}
          src={`/dropdown-arrow.svg`}
          height={18}
          width={18}
          alt="arrow"
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-20 w-full shadow-md bg-white text-dim-gray rounded-[4px] mt-1 transition-all overflow-auto max-h-80">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, idx) => (
              <div
                key={idx}
                ref={(el) => (optionRefs.current[idx] = el)}
                onClick={() => handleSelect(option)}
                onMouseEnter={() => handleMouseEnter(idx)}
                className={`px-6 py-4 cursor-pointer transition-colors ${
                  highlightedIndex === idx
                    ? "bg-blue-50 text-gray-600"
                    : "hover:bg-gray-100"
                }`}
              >
                <span className="text-xs">{option}</span>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-xs text-gray-400">
              No options found
            </div>
          )}
        </div>
      )}
      {/* <input
        type="hidden"
        {...register(value, validation)}
        value={selectedOption || ""}
      /> */}
      <input type="hidden" {...register(value, validation)} />

      {error && <span className="text-red text-xs z-50">{error.message}</span>}
    </div>
  );
};

// export const LabeledDropdown = ({
//   options,
//   value,
//   register,
//   setValue,
//   title,
//   defaultValue,
//   placeholder,
//   resetFactor = false,
//   validation,
//   error,
//   trigger,
// }) => {
//   const [isOpen, setIsOpen] = useState(false);
//   const [selectedOption, setSelectedOption] = useState(defaultValue || "");
//   const dropdownRef = useRef(null);

//   // Handle selection of an option
//   const handleSelect = (option) => {
//     setSelectedOption(option);
//     setValue(value, option);
//     setIsOpen(false);
//     if (trigger) {
//     trigger(value);
//   }

//   };

//   // Reset selection when defaultValue changes
//   useEffect(() => {
//     setSelectedOption(defaultValue || "");
//   }, [defaultValue]);

//   // Reset dropdown when resetFactor is triggered
//   useEffect(() => {
//     if (resetFactor) {
//       setSelectedOption("");
//       setValue(value, null);
//     }
//   }, [resetFactor, setValue, value]);

//   // Close dropdown when clicking outside
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   return (
//     <>
//       <div className="relative w-full" ref={dropdownRef}>
//         {/* Floating label */}
//         <span
//           className={`absolute transition-all px-2  left-4 bg-white ${isOpen || selectedOption
//             ? "-top-2 text-xs font-semibold text-[#979797] z-10 h-4"
//             : `${error ? "top-1/3" : "top-1/2"} -translate-y-1/2 text-sm text-[#979797]`
//             }`}
//         >
//           {title}
//         </span>

//         {/* Display selected option */}
//         <div
//           onClick={() => setIsOpen(!isOpen)}
//           className="flex w-full justify-between border border-[#979797] text-dim-gray rounded-md items-center h-10 px-4 py-2 cursor-pointer relative"
//         >
//           <span className="truncate">{selectedOption || placeholder}</span>
//           <Image
//             className={`transition-all ${isOpen ? "rotate-180" : ""}`}
//             src={`/dropdown-arrow.svg`}
//             height={18}
//             width={18}
//             alt="arrow"
//           />
//         </div>

//         {/* Dropdown menu */}
//         {isOpen && (
//           <div className="absolute z-20 w-full shadow-md bg-white text-dim-gray rounded-[4px] mt-1 transition-all overflow-auto max-h-80">
//             {options.length > 0 ? (
//               options.map((option, idx) => (
//                 <div
//                   key={idx}
//                   onClick={() => handleSelect(option)}
//                   className="px-6 py-4 hover:bg-gray-100 cursor-pointer"
//                 >
//                   <span className="text-xs">{option}</span>
//                 </div>
//               ))
//             ) : (
//               <div className="px-6 py-4 text-xs text-gray-400">
//                 No options available
//               </div>
//             )}
//           </div>
//         )}
//         <div>
//           <input
//             type="hidden"
//             {...register(value, validation)}
//             value={selectedOption || ""}
//           />
//         </div>
//         {error && (
//           <span className="text-red text-xs z-50">{error.message}</span>
//         )}
//       </div>
//     </>
//   );
// };

export const MultiSelectDropdown = ({
  options,
  selected = [],
  onChange,
  placeholder,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSelected, setInternalSelected] = useState([]);

  // Sync instantly when RHF loads data
  useEffect(() => {
    if (Array.isArray(selected)) {
      setInternalSelected(selected);
    }
  }, [selected]);

  const toggleOption = (option) => {
    if (disabled) return;
    const updated = internalSelected.includes(option)
      ? internalSelected.filter((o) => o !== option)
      : [...internalSelected, option];

    setInternalSelected(updated);
    onChange(updated);
  };

  const allSelected = internalSelected.length === options.length;
  const showFloating = isOpen || internalSelected.length > 0;

  return (
    <div className="relative w-full">
      <label
        className={`absolute left-3 pointer-events-none transition-all px-1
        ${
          showFloating
            ? "-top-2 text-xs font-medium bg-white text-gray-500"
            : "top-1/2 -translate-y-1/2 text-sm text-gray-400"
        }`}
      >
        {placeholder}
      </label>

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          border border-[#979797] rounded-md h-8 px-3 py-2
          flex items-center justify-between cursor-pointer
          ${disabled ? "bg-gray-100 text-gray-400" : "text-gray-700"}
        `}
      >
        <div className="flex-1 text-sm overflow-hidden whitespace-nowrap text-ellipsis">
          {internalSelected.length === 0
            ? ""
            : internalSelected.length <= 2
            ? internalSelected.join(", ")
            : `${internalSelected.slice(0, 2).join(", ")} +${
                internalSelected.length - 2
              }`}
        </div>

        <Image
          className={`transition-all ml-2 ${isOpen ? "rotate-180" : ""}`}
          src="/dropdown-arrow.svg"
          height={18}
          width={18}
          alt="arrow"
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute w-full bg-white border rounded-md mt-1 text-sm max-h-60 overflow-auto table-scrollbar shadow-md z-20">
          <div
            onClick={() => {
              const updated = allSelected ? [] : [...options];
              setInternalSelected(updated);
              onChange(updated);
            }}
            className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100"
          >
            <input
              type="checkbox"
              checked={allSelected}
              readOnly
              className="accent-[#EA1B40]"
            />
            Select All
          </div>

          {options.map((option, idx) => {
            const isChecked = internalSelected.includes(option);
            return (
              <div
                key={idx}
                onClick={() => toggleOption(option)}
                className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="accent-[#EA1B40]"
                />
                {option}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
