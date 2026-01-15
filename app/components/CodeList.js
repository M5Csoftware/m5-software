"use client";

import { useState, useMemo, useContext, useRef, useEffect } from "react";
import Image from "next/image";
import { exportCodeList } from "../lib/exportData";
import { GlobalContext } from "../lib/GlobalContext";

function TableHeader({ columns, sortKey, sortOrder, handleSort }) {
  return (
    <thead className="bg-white sticky top-0 z-10">
      <tr className="h-12 border-b border-alice-blue font-medium">
        {columns.map((column) => (
          <th
            key={column.key}
            onClick={() => handleSort(column.key)}
            className="text-left text-dim-gray pl-6 cursor-pointer select-none"
          >
            <div className="flex items-center gap-2 text-nowrap">
              {column.label}
              <span className="text-xs text-gray-500 hover:text-black">
                {sortKey === column.key && (sortOrder === "asc" ? "▲" : "▼")}
              </span>
            </div>
          </th>
        ))}
        <th className="text-left table-column">Actions</th>
      </tr>
    </thead>
  );
}

function TableRow({ rowData, columns, handleAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const renderCellValue = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
    }
    return String(value);
  };

  const handleCopy = (key, value) => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 700);
  };

  return (
    <tr className="border-b border-alice-blue h-11 hover:bg-[#f1f1f1]">
      {columns.map((column, index) => {
        const isCopyable =
          column.key === "code" || column.key === "accountCode";
        return (
          <td
            key={index}
            onClick={() =>
              isCopyable && handleCopy(column.key, rowData[column.key])
            }
            className={`${
              isCopyable ? "text-red cursor-pointer" : "text-gray-600"
            } pl-6`}
          >
            <span
              className={`${
                isCopyable
                  ? `${copied ? "text-white bg-red" : "bg-white-smoke"} 
                     transition-all px-3 py-1 rounded-full`
                  : ""
              }`}
            >
              {copied && isCopyable
                ? "Copied!"
                : renderCellValue(rowData[column.key])}
            </span>
          </td>
        );
      })}
      <td className="relative text-right pr-6" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="text-gray-500 w-4 flex justify-end text-sm hover:text-red-500"
        >
          <Image src={`/three-dot.svg`} height={1.75} width={4} alt="..." />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg border border-gray-200 rounded-md z-10">
            <button
              onClick={() => {
                handleAction("edit", rowData);
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Edit
            </button>
            <button
              onClick={() => {
                handleAction("delete", rowData);
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Delete
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-red border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading data...</p>
      </div>
    </div>
  );
}

export default function CodeList({ data, columns, name, handleAction }) {
  const [filterInput, setFilterInput] = useState("");
  const [showFilterOptions, setShowFilterOptions] = useState(true);
  const [sortKey, setSortKey] = useState("code");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isLoading, setIsLoading] = useState(true);

  const { setToggleCodeList, toggleCodeList } = useContext(GlobalContext);
  const containerRef = useRef(null);

  // Detect data loading
  useEffect(() => {
    if (data && data.length >= 0) {
      setIsLoading(false);
    }
  }, [data]);

  // Close on outside click
  useEffect(() => {
    if (!toggleCodeList) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setToggleCodeList(false);
      }
    };

    // Small delay to prevent immediate closure on open
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [toggleCodeList, setToggleCodeList]);

  // Close on Escape key, Open on F1
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setToggleCodeList(false);
      } else if (e.key === "F1") {
        e.preventDefault(); // Prevent browser's default F1 help
        setToggleCodeList(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setToggleCodeList]);

  // Toggle filter on Enter key
  useEffect(() => {
    const handlePressEnter = (e) => {
      if (e.key === "Enter") {
        setShowFilterOptions((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handlePressEnter);
    return () => document.removeEventListener("keydown", handlePressEnter);
  }, []);

  // Memoized filtered and sorted data
  const filteredData = useMemo(() => {
    if (!data) return [];

    const processedData = data.map((item) => {
      const processedItem = { ...item };
      columns.forEach((column) => {
        if (typeof processedItem[column.key] === "boolean") {
          processedItem[column.key] = processedItem[column.key]
            ? "Enabled"
            : "Disabled";
        }
      });
      return processedItem;
    });

    let filtered = processedData.filter((item) =>
      filterInput
        ? columns.some((column) =>
            String(item[column.key])
              .toLowerCase()
              .startsWith(filterInput.toLowerCase())
          )
        : true
    );

    if (sortKey) {
      filtered = [...filtered].sort((a, b) =>
        sortOrder === "asc"
          ? String(a[sortKey]).localeCompare(String(b[sortKey]))
          : String(b[sortKey]).localeCompare(String(a[sortKey]))
      );
    }

    return filtered;
  }, [data, filterInput, sortKey, sortOrder, columns]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div
      ref={containerRef}
      className={`border fixed bg-white top-2 bottom-2 z-50 border-alice-blue rounded-lg w-[428px] overflow-auto hidden-scrollbar transition-all ${
        toggleCodeList ? "right-2" : "-right-[450px]"
      }`}
    >
      <div className="flex sticky top-0 bg-white text-eerie-black justify-between items-center h-[40] px-6 py-5 border-b border-alice-blue">
        <div>
          <div className="font-bold">Code List</div>
          <span className="text-[10px] border text-red border-red font-medium rounded-full px-2 py-1">
            {name}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            {showFilterOptions ? (
              <div
                onClick={() => setShowFilterOptions(false)}
                className="flex gap-1 cursor-pointer select-none"
              >
                <Image
                  src={`/search.svg`}
                  height={20}
                  width={20}
                  alt="filter"
                />
                <div className="text-sm cursor-pointer relative">Search</div>
              </div>
            ) : (
              <input
                type="text"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value || "")}
                className="text-sm border border-gray-400 rounded-md z-20 h-[42px] w-28 focus:outline-none text-center"
                placeholder="Search"
                autoFocus
              />
            )}
          </div>
          <div
            onClick={() => exportCodeList(data, name)}
            className="flex gap-2 items-center cursor-pointer border border-battleship-gray rounded-md px-4 py-2.5"
          >
            <Image src={`/export.svg`} height={20} width={20} alt="export" />
            <div className="text-sm">Export</div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="pb-3 overflow-auto h-[calc(90vh-40px)]">
          <table className="w-[428px] overflow-auto text-xs">
            <TableHeader
              columns={columns}
              sortKey={sortKey}
              sortOrder={sortOrder}
              handleSort={handleSort}
            />
            <tbody>
              {filteredData.map((item, index) => (
                <TableRow
                  key={index}
                  rowData={item}
                  columns={columns}
                  handleAction={handleAction}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
