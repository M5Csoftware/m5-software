import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react"; // Optional, if you want a better arrow icon

export default function DownloadCsvExcel({
  handleDownloadExcel,
  handleDownloadCSV,
  buttonClassname
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
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

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-start px-4 pl-6 min-w-[130px] relative py-1.5 font-semibold text-sm bg-red text-white rounded-md shadow-md hover:bg-red transition-all duration-200 focus:outline-none ${buttonClassname}`}
      >
        Download
        <ChevronDown
          size={18}
          className={`ml-2 transition-transform  duration-200 absolute right-4 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute mt-2 w-32 bg-white rounded-md shadow-lg ring-1 ring-black/10 z-50">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleDownloadExcel();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition"
          >
            Excel
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleDownloadCSV();
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition"
          >
            CSV
          </button>
        </div>
      )}
    </div>
  );
}
