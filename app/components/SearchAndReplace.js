"use client";
import React, { useState, useEffect, useCallback } from "react";
import { FiSearch, FiEdit } from "react-icons/fi";

const SearchAndReplace = ({
  data,
  columns,
  onReplace,
  onDataUpdate,
  isActive = true,
  tableId = "data-table",
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [isCaseSensitive, setIsCaseSensitive] = useState(false);
  const [searchStats, setSearchStats] = useState({
    total: 0,
    current: 0,
  });

  // Keyboard shortcut handler for Ctrl+F
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      // Check for Ctrl+F or Cmd+F
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowModal(true);
      }
      // Escape key to close modal
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal, isActive]);

  // Add CSS for highlighting search results
  useEffect(() => {
    if (!showModal) return;

    const style = document.createElement("style");
    style.textContent = `
      .search-highlight {
        background-color: #fff3cd !important;
        border: 2px solid #ffc107 !important;
      }
      .current-search-highlight {
        background-color: #d1ecf1 !important;
        border: 2px solid #0dcaf0 !important;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% { background-color: #d1ecf1; }
        50% { background-color: #b8e7f0; }
        100% { background-color: #d1ecf1; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, [showModal]);

  // Function to perform search
  const performSearch = useCallback(() => {
    if (!searchTerm.trim() || !data || !columns) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setSearchStats({ total: 0, current: 0 });
      return;
    }

    const results = [];

    data.forEach((row, rowIndex) => {
      columns.forEach((column) => {
        const cellValue = String(row[column.key] || "");
        const searchValue = isCaseSensitive
          ? searchTerm
          : searchTerm.toLowerCase();
        const cellValueToCompare = isCaseSensitive
          ? cellValue
          : cellValue.toLowerCase();

        if (cellValueToCompare.includes(searchValue)) {
          results.push({
            rowIndex,
            columnKey: column.key,
            columnLabel: column.label,
            value: row[column.key] || "",
            fullMatch: cellValueToCompare === searchValue,
          });
        }
      });
    });

    setSearchResults(results);
    setCurrentResultIndex(0);
    setSearchStats({
      total: results.length,
      current: results.length > 0 ? 1 : 0,
    });

    // Highlight first result if exists
    if (results.length > 0) {
      highlightResult(results[0]);
    }
  }, [data, columns, searchTerm, isCaseSensitive]);

  // Function to highlight a search result
  const highlightResult = (result) => {
    if (!result) return;

    // Remove previous highlights
    const previousHighlights = document.querySelectorAll(".search-highlight");
    previousHighlights.forEach((el) => {
      el.classList.remove("search-highlight");
      el.classList.remove("current-search-highlight");
    });

    // Find the cell to highlight
    const table = document.querySelector(`#${tableId}`) || document.querySelector("table");
    if (!table) return;

    const rows = table.querySelectorAll("tbody tr");
    if (rows.length > result.rowIndex) {
      const targetRow = rows[result.rowIndex];
      const cells = targetRow.querySelectorAll("td");

      // Find the correct cell based on column order
      const columnIndex = columns.findIndex(
        (col) => col.key === result.columnKey
      );

      if (columnIndex >= 0 && cells[columnIndex]) {
        const cell = cells[columnIndex];
        cell.classList.add("search-highlight");
        cell.classList.add("current-search-highlight");

        // Scroll into view
        cell.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Function to navigate to next/previous result
  const navigateResult = (direction) => {
    if (searchResults.length === 0) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentResultIndex + 1) % searchResults.length;
    } else {
      newIndex =
        (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    }

    setCurrentResultIndex(newIndex);
    setSearchStats({
      total: searchResults.length,
      current: newIndex + 1,
    });
    highlightResult(searchResults[newIndex]);
  };

  // Function to replace current result
  const replaceCurrentResult = () => {
    if (searchResults.length === 0 || !replaceTerm) return;

    const currentResult = searchResults[currentResultIndex];
    const rowsToUpdate = [...data];

    // Update the cell value
    rowsToUpdate[currentResult.rowIndex][currentResult.columnKey] = replaceTerm;

    // Call onDataUpdate callback if provided
    if (onDataUpdate) {
      onDataUpdate(rowsToUpdate);
    }

    // Call onReplace callback if provided
    if (onReplace) {
      onReplace(currentResult.value, replaceTerm, currentResult);
    }

    // Update search results
    const updatedResults = [...searchResults];
    updatedResults[currentResultIndex] = {
      ...currentResult,
      value: replaceTerm,
    };
    setSearchResults(updatedResults);

    // Navigate to next result automatically
    if (currentResultIndex < searchResults.length - 1) {
      navigateResult("next");
    }
  };

  // Function to replace all occurrences
  const replaceAll = () => {
    if (searchResults.length === 0 || !replaceTerm) return;

    const rowsToUpdate = [...data];
    let replaceCount = 0;
    const replacedValues = [];

    // Replace all occurrences
    searchResults.forEach((result) => {
      if (rowsToUpdate[result.rowIndex][result.columnKey] !== replaceTerm) {
        const oldValue = rowsToUpdate[result.rowIndex][result.columnKey];
        rowsToUpdate[result.rowIndex][result.columnKey] = replaceTerm;
        replaceCount++;
        replacedValues.push({
          oldValue,
          newValue: replaceTerm,
          location: result,
        });
      }
    });

    // Call onDataUpdate callback if provided
    if (onDataUpdate) {
      onDataUpdate(rowsToUpdate);
    }

    // Call onReplace callback for each replacement if provided
    if (onReplace) {
      replacedValues.forEach(({ oldValue, newValue, location }) => {
        onReplace(oldValue, newValue, location);
      });
    }

    // Clear search results
    setSearchResults([]);
    setSearchTerm("");
    setCurrentResultIndex(0);
    setSearchStats({ total: 0, current: 0 });

    // Remove highlights
    document.querySelectorAll(".search-highlight").forEach((el) => {
      el.classList.remove("search-highlight");
      el.classList.remove("current-search-highlight");
    });
  };

  // Initialize search when modal opens or search term changes
  useEffect(() => {
    if (showModal && searchTerm) {
      const timer = setTimeout(() => {
        performSearch();
      }, 300);
      return () => clearTimeout(timer);
    } else if (showModal && !searchTerm) {
      setSearchResults([]);
      setSearchStats({ total: 0, current: 0 });
      // Remove highlights
      document.querySelectorAll(".search-highlight").forEach((el) => {
        el.classList.remove("search-highlight");
        el.classList.remove("current-search-highlight");
      });
    }
  }, [searchTerm, isCaseSensitive, showModal, performSearch]);

  // Clean up on modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setSearchTerm("");
    setReplaceTerm("");
    setSearchResults([]);
    setCurrentResultIndex(0);
    setSearchStats({ total: 0, current: 0 });
    
    // Remove highlights
    document.querySelectorAll(".search-highlight").forEach((el) => {
      el.classList.remove("search-highlight");
      el.classList.remove("current-search-highlight");
    });
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <FiSearch className="w-5 h-5" />
            Search and Replace
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {searchStats.total > 0
                ? `${searchStats.current} of ${searchStats.total} results`
                : "No results"}
            </span>
            <button
              onClick={handleCloseModal}
              className="text-gray-500 hover:text-gray-700 text-2xl p-1 ml-4"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search for
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter text to search..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replace with
              </label>
              <input
                type="text"
                value={replaceTerm}
                onChange={(e) => setReplaceTerm(e.target.value)}
                placeholder="Enter replacement text..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isCaseSensitive}
                  onChange={(e) => setIsCaseSensitive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Case sensitive</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Searching in: <strong>{data?.length || 0} rows</strong>
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigateResult("prev")}
                disabled={searchResults.length === 0}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => navigateResult("next")}
                disabled={searchResults.length === 0}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {searchResults.length > 0 && (
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">
              Found {searchResults.length} result(s):
            </div>
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.rowIndex}-${result.columnKey}`}
                  className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                    index === currentResultIndex
                      ? "bg-blue-50 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                  onClick={() => {
                    setCurrentResultIndex(index);
                    setSearchStats({
                      total: searchResults.length,
                      current: index + 1,
                    });
                    highlightResult(result);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-medium text-gray-800">
                        Row {result.rowIndex + 1}, {result.columnLabel}:
                      </span>
                      <span className="ml-2 text-gray-600">
                        {result.value}
                      </span>
                    </div>
                    {index === currentResultIndex && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="text-sm text-gray-500">
            Press{" "}
            <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
              Ctrl+F
            </kbd>{" "}
            to open,{" "}
            <kbd className="px-2 py-1 bg-gray-100 rounded border text-xs">
              Esc
            </kbd>{" "}
            to close
          </div>
          <div className="flex gap-3">
            {searchResults.length > 0 && replaceTerm && (
              <>
                <button
                  onClick={replaceCurrentResult}
                  className="px-5 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center gap-2"
                >
                  <FiEdit className="w-4 h-4" />
                  Replace This
                </button>
                <button
                  onClick={replaceAll}
                  className="px-5 py-2.5 bg-red text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                >
                  Replace All
                </button>
              </>
            )}
            <button
              onClick={handleCloseModal}
              className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchAndReplace;