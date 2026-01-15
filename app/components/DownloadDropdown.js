import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react"; // Optional, if you want a better arrow icon

export default function DownloadDropdown({
  handleDownloadPDF,
  handleDownloadExcel,
  handleDownloadCSV,
  buttonClassname,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((p) => !p)}
        className={`relative inline-flex items-center text-sm w-full mr-4 px-4 pl-6 min-w-[130px] py-1.5 font-semibold rounded-md shadow-md
          ${disabled ? "opacity-70 cursor-not-allowed bg-red" : "bg-red"}
          text-white transition-all duration-200 focus:outline-none ${buttonClassname}`}
      >
        Download
        <ChevronDown
          size={18}
          className={`absolute right-4 transition-transform duration-200 ${
            isOpen && !disabled ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div className="absolute mt-2 w-32 bg-white rounded-md shadow-lg ring-1 ring-black/10 z-50">
          <button
            type="button"
            onClick={() => {
              handleDownloadPDF();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            PDF
          </button>
          <button
            type="button"
            onClick={() => {
              handleDownloadExcel();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Excel
          </button>
          <button
            type="button"
            onClick={() => {
              handleDownloadCSV();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            CSV
          </button>
        </div>
      )}
    </div>
  );
}
