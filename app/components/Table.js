import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import formatDate from "../lib/formatDate";

export default function Table({
  register,
  setValue,
  name,
  columns = [],
  rowData = [],
  // New props for edit/delete functionality
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  editable = false,
  onEditComplete,
}) {
  const [editedData, setEditedData] = useState({});
  const [localSelectedRows, setLocalSelectedRows] = useState(selectedRows);

  useEffect(() => {
    setValue(`${name}Table`, rowData);
  }, [rowData]);

  useEffect(() => {
    setLocalSelectedRows(selectedRows);
  }, [selectedRows]);

  useEffect(() => {
    if (editable && rowData) {
      const initialEditData = {};
      rowData.forEach(row => {
        initialEditData[row.id || row._id] = { ...row };
      });
      setEditedData(initialEditData);
    }
  }, [editable, rowData]);

  // Handle checkbox selection
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = rowData.map(row => row.id || row._id);
      setLocalSelectedRows(allIds);
      if (onSelectionChange) {
        onSelectionChange(allIds);
      }
    } else {
      setLocalSelectedRows([]);
      if (onSelectionChange) {
        onSelectionChange([]);
      }
    }
  };

  const handleSelectRow = (rowId) => {
    const newSelection = localSelectedRows.includes(rowId)
      ? localSelectedRows.filter(id => id !== rowId)
      : [...localSelectedRows, rowId];
    
    setLocalSelectedRows(newSelection);
    if (onSelectionChange) {
      onSelectionChange(newSelection);
    }
  };

  // Handle cell editing
  const handleCellEdit = (rowId, columnKey, value) => {
    setEditedData(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [columnKey]: value
      }
    }));
  };

  // Save edits
  const handleSaveEdits = () => {
    if (onEditComplete) {
      const updatedRows = Object.values(editedData);
      onEditComplete(updatedRows);
    }
  };

  if (!rowData || rowData.length === 0) {
    return (
      <div className="h-64 w-full overflow-auto rounded-lg border border-battleship-gray text-xs">
        <table className="w-full">
          <thead className="sticky top-0 bg-white border-b">
            <tr className="h-12">
              {selectable && (
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              {columns.map((col, index) => (
                <th
                  key={col.key}
                  className={`${index !== columns.length - 1 ? "border-r" : ""} px-4 py-2 text-left cursor-pointer select-none`}
                >
                  <div className="flex items-center gap-2 text-nowrap">
                    {col.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-8 text-center text-gray-500"
              >
                No data available
              </td>
            </tr>
          </tbody>
        </table>
        <input type="hidden" {...register(`${name}Table`)} />
      </div>
    );
  }

  const allSelected = localSelectedRows.length === rowData.length && rowData.length > 0;
  const someSelected = localSelectedRows.length > 0 && localSelectedRows.length < rowData.length;

  return (
    <div className="h-64 w-full overflow-auto rounded-lg border border-battleship-gray text-xs">
      <table className="w-full">
        <thead className="sticky top-0 bg-white border-b">
          <tr className="h-12">
            {selectable && (
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </th>
            )}
            {columns.map((column, index) => (
              <th
                key={column.key}
                className={`${index !== columns.length - 1 ? "border-r" : ""} px-4 py-2 text-left cursor-pointer select-none`}
              >
                <div className="flex items-center gap-2 text-nowrap">
                  {column.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowData.map((item, index) => {
            const rowId = item.id || item._id || index;
            const isSelected = localSelectedRows.includes(rowId);
            const currentRowData = editable ? (editedData[rowId] || item) : item;

            return (
              <tr
                key={rowId}
                className={`border-b h-11 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
              >
                {selectable && (
                  <td className="px-4 py-2 w-12">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectRow(rowId)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                )}
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-2 text-gray-600 ${colIndex !== columns.length - 1 ? "border-r" : ""}`}
                  >
                    {editable ? (
                      <input
                        type="text"
                        value={currentRowData[column.key] || ''}
                        onChange={(e) => handleCellEdit(rowId, column.key, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    ) : (
                      <span>
                        {currentRowData[column.key] !== null ? currentRowData[column.key] : "-"}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      {editable && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={handleSaveEdits}
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-600 font-semibold text-sm transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}

      {selectable && (
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-600">
          Showing {rowData.length} {rowData.length === 1 ? 'row' : 'rows'}
          {localSelectedRows.length > 0 && (
            <span className="ml-2 font-semibold">
              ({localSelectedRows.length} selected)
            </span>
          )}
        </div>
      )}

      <input type="hidden" {...register(`${name}Table`)} />
    </div>
  );
}

function TableHeader({ columns }) {
  return (
    <thead className="sticky top-0 bg-white border-b">
      <tr className="h-12">
        {columns.map((column, index) => (
          <th
            key={column.key}
            className={` ${index !== columns.length - 1 ? "border-r" : ""
              } px-4 py-2  text-left cursor-pointer select-none`}
          >
            <div className="flex items-center gap-2 text-nowrap">
              {column.label}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableRow({ rowData, columns }) {
  return (
    <tr className="border-b h-11">
      {columns.map((column, index) => (
        <td
          key={index}
          className={`px-4 py-2 text-gray-600 ${index !== columns.length - 1 ? "border-r" : ""
            }`}
        >
          <span>
            {rowData[column.key] !== null ? rowData[column.key] : "-"}
          </span>
        </td>
      ))}
    </tr>
  );
}

export function TableWithSorting({
  register,
  setValue,
  name,
  disabled = false,
  columns = [],
  rowData = [],
  className,
  isTicketDashboard = false,
}) {
  const [sortKey, setSortKey] = useState("awbNo");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    setValue(`${name}Table`, rowData);
  }, [rowData]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedData = [...rowData].sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    } else if (typeof valueA === "number" && typeof valueB === "number") {
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    }
    return 0;
  });

  return (
    <div
      className={`${className} ${className ? "" : "h-64"
        } overflow-x-auto  table-scrollbar rounded-lg border border-battleship-gray text-xs ${disabled ? "bg-white-smoke" : ""
        }`}
    >
      <table className="w-full">
        <TableHeaderWithSorting
          columns={columns}
          handleSort={handleSort}
          sortKey={sortKey}
          sortOrder={sortOrder}
          disabled={disabled}
        />
        <tbody>
          {sortedData.map((item, index) => (
            <TableRowWithSorting
              isTicketDashboard={isTicketDashboard}
              key={index}
              rowData={item}
              columns={columns}
            />
          ))}
        </tbody>
      </table>
      <input type="hidden" {...register(`${name}Table`)} />
    </div>
  );
}

function TableHeaderWithSorting({
  columns,
  sortKey,
  sortOrder,
  handleSort,
  disabled,
}) {
  return (
    <thead className="sticky top-0 bg-white border-b text-dim-gray">
      <tr className="h-12">
        {columns.map((column, index) => (
          <th
            key={column.key}
            onClick={() => handleSort(column.key)}
            className={`${index !== columns.length - 1 ? "border-r" : "border-r"
              } px-4 py-2 text-center cursor-pointer select-none ${disabled ? "bg-white-smoke" : ""
              }`}
          >
            <div className="flex items-center gap-2 text-nowrap">
              {column.label}
              <span className="text-xs text-gray-500 hover:text-black">
                {sortKey === column.key && (
                  <div
                    className={`${sortOrder === "asc" ? "rotate-180" : ""
                      } w-4 h-4`}
                  >
                    <Image
                      src={`/arrow-sort-table.svg`}
                      alt="arrow"
                      width={16}
                      height={16}
                    />
                  </div>
                )}
              </span>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableRowWithSorting({ rowData, columns, isTicketDashboard }) {
  return (
    <tr className="border-b h-11">
      {columns.map((column, index) => (
        <td
          key={index}
          className={`px-4 py-2 text-eerie-black text-center whitespace-nowrap ${index !== columns.length - 1 ? "border-r" : "border-r"
            }`}
        >
          <span>
            {column.key === "date"
              ? formatDate(rowData[column.key])
              : isTicketDashboard && column.key === "ticketNo"
                ? rowData[column.key].ticketNo
                : rowData[column.key]}
          </span>{" "}
          <br />
          {isTicketDashboard && column.key === "ticketNo" && (
            <span
              className={`${rowData[column.key].source == "Portal"
                ? "bg-misty-rose border-red border text-red"
                : "border bg-[#1BC0BA33] border-[#1BC0BA] text-[#1BC0BA]"
                } px-2 py-0.5 rounded-2xl inline-block mt-1`}
            >
              {rowData[column.key].source}
            </span>
          )}
        </td>
      ))}
    </tr>
  );
}

export function TableWithCTA({
  register,
  setValue,
  name,
  columns = [],
  rowData = [],
  handleDelete,
  handleEdit,
}) {
  useEffect(() => {
    setValue(`${name}Table`, rowData);
  }, [rowData]);

  return (
    <div className="h-64 w-full overflow-auto rounded-lg border border-[#EDEDED] text-xs bg-white">
      <table className="w-full">
        <TableHeaderWithCTA columns={columns} />
        <tbody>
          {rowData.map((item, index) => (
            <TableRowWithCTA
              key={index}
              index={index}
              rowData={item}
              columns={columns}
              handleDelete={handleDelete}
              handleEdit={handleEdit}
            />
          ))}
        </tbody>
      </table>
      <input type="hidden" {...register(`${name}Table`)} />
    </div>
  );
}

function TableHeaderWithCTA({ columns }) {
  return (
    <thead className="sticky top-0 bg-white">
      <tr className="h-12 border-b border-alice-blue font-medium">
        {columns.map((column) => (
          <th
            key={column.key}
            className="text-left pl-6 cursor-pointer select-none border-r"
          >
            <div className="flex items-center gap-2 text-nowrap">
              {column.label}
            </div>
          </th>
        ))}
        <th className="text-left  text-transparent w-24"></th>
      </tr>
    </thead>
  );
}

function TableRowWithCTA({
  rowData,
  columns,
  handleDelete,
  handleEdit,
  index,
}) {
  return (
    <tr className="border-b border-alice-blue h-11">
      {columns.map((column, colIndex) => (
        <td key={colIndex} className="text-gray-600 pl-6 border-r">
          <span>{rowData[column.key]}</span>
        </td>
      ))}
      <td className="flex gap-3 items-center justify-center mt-2">
        <button type="button" onClick={() => handleDelete(index)}>
          <Image src={`/delete.svg`} alt="Delete" width={18} height={18} />
        </button>
        <button type="button" onClick={() => handleEdit(index)}>
          <Image src={`/edit.svg`} alt="Edit" width={20} height={20} />
        </button>
      </td>
    </tr>
  );
}

export function TableWithCheckboxEditDelete({
  register,
  setValue,
  name,
  totalColumn = "",
  totalLabel = "",
  columns = [],
  rowData = [],
  handleDelete,
  handleEdit,
  originalIndex = 0,
  className
}) {
  const [sortKey, setSortKey] = useState("awbNo");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [data, setData] = useState(rowData);

  useEffect(() => {
    setData(rowData);
  }, [rowData]);

  useEffect(() => {
    setValue(`${name}Table`, data);
  }, [data, setValue, name]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    } else if (typeof valueA === "number" && typeof valueB === "number") {
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    }
    return 0;
  });

  const handleSelectRow = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, index) => index)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedRows.size > 0 && handleDelete) {
      const selectedIndices = Array.from(selectedRows);
      handleDelete(selectedIndices);
      setSelectedRows(new Set());
    }
  };

  const handleEditRow = (index) => {
    if (handleEdit) {
      handleEdit(index);
    }
  };

  const handleDeleteRow = (index) => {
    if (handleDelete) {
      handleDelete(index);
    }
  };

  const calculateTotalWeight = () => {
    return data.reduce((sum, item) => {
      const weight = parseFloat(item.weight) || 0;
      return sum + weight;
    }, 0);
  };

  const calculateTotal = () => {
    return data.reduce((sum, item) => {
      const value = parseFloat(item[totalColumn]) || 0;
      return sum + value;
    }, 0);
  };

  const formatDate = (dateString) => {
    return dateString;
  };

  return (
    <div className={`${className ? className : "h-64"} flex flex-col`}>
      <div
        className={`flex-1 overflow-x-auto table-scrollbar rounded-lg border border-b-0 rounded-b-none border-battleship-gray text-xs`}
      >
        <table className={`w-full`}>
          <TableHeaderWithSortingCheckbox
            columns={columns}
            handleSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            selectedAll={selectedRows.size === data.length && data.length > 0}
            onSelectAll={handleSelectAll}
            onDelete={() => handleDeleteRow(originalIndex)}
          />
          <tbody>
            {sortedData.map((item, index) => {
              const originalIndex = data.findIndex(
                (dataItem) => dataItem === item
              );
              return (
                <TableRowWithSortingCheckbox
                  key={originalIndex}
                  rowData={item}
                  columns={columns}
                  isSelected={selectedRows.has(originalIndex)}
                  onSelect={() => handleSelectRow(originalIndex)}
                  onEdit={() => handleEditRow(originalIndex)}
                  onDelete={() => handleDeleteRow(originalIndex)}
                  index={originalIndex}
                  formatDate={formatDate}
                />
              );
            })}
          </tbody>
        </table>
        <input type="hidden" {...register(`${name}Table`)} />
      </div>

      <div className="px-4 py-1 rounded-t-none border-t-0 border-battleship-gray border-[1px] bg-[#D0D5DDB8] text-right rounded-md">
        <span className="text-xs text-gray-600">
          {totalColumn === "weight" && (
            <>Total Weight: {calculateTotalWeight().toFixed(2)} Kg</>
          )}
          {totalColumn && totalColumn !== "weight" && totalLabel && (
            <>
              {totalLabel}: {calculateTotal().toFixed(2)}
              {totalColumn === "amount" ? "" : ""}
            </>
          )}
        </span>
      </div>
    </div>
  );
}

function TableHeaderWithSortingCheckbox({
  columns,
  sortKey,
  sortOrder,
  handleSort,
  selectedAll,
  onSelectAll,
  onDelete,
}) {
  return (
    <thead className="sticky top-0 bg-white border-b text-dim-gray">
      <tr className="h-12">
        <th className="border-r text-center">
          <div className="flex items-center justify-center gap-2 text-nowrap">
            <input
              type="checkbox"
              checked={selectedAll}
              onChange={onSelectAll}
              className="text-red accent-[#EA1B40] rounded border-gray-300 focus:ring-red"
            />
          </div>
        </th>

        {columns.map((column, index) => (
          <th
            key={column.key}
            onClick={() => handleSort(column.key)}
            className={`${index !== columns.length - 1 ? "border-r" : "border-r"
              } px-4 py-2 text-center cursor-pointer select-none`}
          >
            <div className="flex items-center justify-center gap-2 text-nowrap">
              {column.label}
              <span className="text-xs text-gray-500 hover:text-black">
                {sortKey === column.key && (
                  <div
                    className={`${sortOrder === "asc" ? "rotate-180" : ""
                      } w-4 h-4 `}
                  >
                    <Image
                      src={`/arrow-sort-table.svg`}
                      alt="arrow"
                      width={16}
                      height={16}
                    />
                  </div>
                )}
              </span>
            </div>
          </th>
        ))}

        <th className="border-r px-4 py-2 text-center">
          <div className="flex items-center gap-2 text-nowrap justify-center">
            <button
              onClick={onDelete}
              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
              title="Delete selected"
            >
              <Image
                src={"/delete-red.svg"}
                width={15}
                height={15}
                alt="Delete"
              />
            </button>
          </div>
        </th>
      </tr>
    </thead>
  );
}

function TableRowWithSortingCheckbox({
  rowData,
  columns,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  index,
  formatDate,
}) {
  return (
    <tr className="border-b h-11">
      <td className="border-r text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="text-blue-600 accent-[#EA1B40] rounded border-gray-300 focus:ring-blue-500"
        />
      </td>

      {columns.map((column, colIndex) => (
        <td
          key={colIndex}
          className={`px-4 py-2 text-eerie-black text-center whitespace-nowrap ${colIndex !== columns.length - 1 ? "border-r" : "border-r"
            }`}
        >
          <span>
            {column.key === "date"
              ? formatDate(rowData[column.key])
              : rowData[column.key]}
          </span>
        </td>
      ))}

      <td className="border-r px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
            title="Delete"
          >
            <Image
              src={"/delete-red.svg"}
              width={15}
              height={15}
              alt="Delete"
            />
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
            title="Edit"
          >
            <Image src={"/edit.svg"} width={15} height={15} alt="Edit" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export function TableWithSortingAndCopy({
  register,
  setValue,
  name,
  columns = [],
  rowData = [],
  className,
}) {
  const [sortKey, setSortKey] = useState("awbNo");
  const [sortOrder, setSortOrder] = useState("asc");

  // Selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState(null);
  const [endCell, setEndCell] = useState(null);

  useEffect(() => {
    setValue(`${name}Table`, rowData);
  }, [rowData]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedData = [...rowData].sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    } else if (typeof valueA === "number" && typeof valueB === "number") {
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    }
    return 0;
  });

  // --- Selection Helpers ---
  const isCellSelected = (rowIndex, colIndex) => {
    if (!startCell || !endCell) return false;
    const rowMin = Math.min(startCell.row, endCell.row);
    const rowMax = Math.max(startCell.row, endCell.row);
    const colMin = Math.min(startCell.col, endCell.col);
    const colMax = Math.max(startCell.col, endCell.col);
    return (
      rowIndex >= rowMin &&
      rowIndex <= rowMax &&
      colIndex >= colMin &&
      colIndex <= colMax
    );
  };

  const getSelectedText = () => {
    if (!startCell || !endCell) return "";
    const rowMin = Math.min(startCell.row, endCell.row);
    const rowMax = Math.max(startCell.row, endCell.row);
    const colMin = Math.min(startCell.col, endCell.col);
    const colMax = Math.max(startCell.col, endCell.col);

    let text = "";
    for (let r = rowMin; r <= rowMax; r++) {
      const row = [];
      for (let c = colMin; c <= colMax; c++) {
        row.push(sortedData[r][columns[c].key]);
      }
      text += row.join("\t") + "\n";
    }
    return text;
  };

  const copySelection = useCallback(() => {
    const text = getSelectedText();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        console.log("Copied to clipboard!");
      });
    }
  }, [startCell, endCell, sortedData, columns]);

  // --- Keyboard Shortcut: Ctrl+C / Cmd+C ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        copySelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copySelection]);

  return (
    <div
      className={`${className} ${className ? "" : "h-64"
        } overflow-x-auto table-scrollbar rounded-lg border border-battleship-gray text-xs`}
    >
      <table className="w-full select-none">
        {/* Header */}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 cursor-pointer border items-center text-nowrap h-12 text-dim-gray"
                onClick={() => handleSort(col.key)}
              >
                <span className="flex items-center gap-1 justify-center">
                  {col.label}
                  {sortKey === col.key && (
                    <span
                      className={`inline-flex w-4 h-4 transition-transform ${sortOrder === "asc" ? "rotate-180" : ""
                        }`}
                    >
                      <Image
                        src="/arrow-sort-table.svg"
                        alt="arrow"
                        width={16}
                        height={16}
                      />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {sortedData.map((item, rowIndex) => (
            <tr key={rowIndex} className="text-center text-nowrap h-12">
              {columns.map((col, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-2 py-1 border ${isCellSelected(rowIndex, colIndex)
                    ? "bg-blue-200"
                    : "bg-white"
                    }`}
                  onMouseDown={() => {
                    setIsSelecting(true);
                    setStartCell({ row: rowIndex, col: colIndex });
                    setEndCell({ row: rowIndex, col: colIndex });
                  }}
                  onMouseEnter={() => {
                    if (isSelecting) {
                      setEndCell({ row: rowIndex, col: colIndex });
                    }
                  }}
                  onMouseUp={() => setIsSelecting(false)}
                >
                  {item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <input type="hidden" {...register(`${name}Table`)} />
    </div>
  );
}

export function TableWithCheckbox({
  register,
  setValue,
  name,
  columns = [],
  rowData = [],
  originalIndex = 0,
  selectedItems = [],
  setSelectedItems = () => { },
  className,
}) {
  const [sortKey, setSortKey] = useState("awbNo");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [data, setData] = useState(rowData);

  useEffect(() => {
    setData(rowData);
    // Reset selected rows when data changes
    setSelectedRows(new Set());
  }, [rowData]);

  useEffect(() => {
    setValue(`${name}Table`, data);
  }, [data, setValue, name]);

  useEffect(() => {
    const selectedData = data.filter((row, index) => selectedRows.has(index));
    setSelectedItems(selectedData);
  }, [selectedRows, data, setSelectedItems]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];
    if (typeof valueA === "string" && typeof valueB === "string") {
      return sortOrder === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    } else if (typeof valueA === "number" && typeof valueB === "number") {
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    }
    return 0;
  });

  const handleSelectRow = (index) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map((_, index) => index)));
    }
  };

  const formatDate = (dateString) => {
    // Add your date formatting logic here
    return dateString;
  };

  return (
    <div className={`${className ? className : "h-64"} flex flex-col`}>
      {/* Table Container */}
      < div className="flex-1 overflow-x-auto table-scrollbar rounded-lg border border-battleship-gray text-xs" >
        <table className="w-full">
          <TableHeaderWithCheckbox
            columns={columns}
            handleSort={handleSort}
            sortKey={sortKey}
            sortOrder={sortOrder}
            selectedAll={selectedRows.size === data.length && data.length > 0}
            onSelectAll={handleSelectAll}
          />
          <tbody>
            {sortedData.map((item, index) => {
              const originalIndex = data.findIndex(
                (dataItem) => dataItem === item
              );
              return (
                <TableRowWithCheckbox
                  key={originalIndex}
                  rowData={item}
                  columns={columns}
                  isSelected={selectedRows.has(originalIndex)}
                  onSelect={() => handleSelectRow(originalIndex)}
                  index={originalIndex}
                  formatDate={formatDate}
                />
              );
            })}
          </tbody>
        </table>
        <input type="hidden" {...register(`${name}Table`)} />
      </div >
    </div >
  );
}

function TableHeaderWithCheckbox({
  columns,
  sortKey,
  sortOrder,
  handleSort,
  selectedAll,
  onSelectAll,
}) {
  return (
    <thead className="sticky top-0 bg-white border-b text-dim-gray">
      <tr className="h-12">
        {/* Checkbox column */}
        <th className="border-r text-center">
          <div className="flex items-center justify-center gap-2 text-nowrap">
            <input
              type="checkbox"
              checked={selectedAll}
              onChange={onSelectAll}
              className="text-red rounded border-gray-300 focus:ring-red-500"
            />
          </div>
        </th>

        {columns.map((column, index) => (
          <th
            key={column.key}
            onClick={() => handleSort(column.key)}
            className={`${index !== columns.length - 1 ? "border-r" : ""
              } px-4 py-2 text-center cursor-pointer select-none`}
          >
            <div className="flex items-center justify-center gap-2 text-nowrap">
              {column.label}
              <span className="text-xs text-gray-500 hover:text-black">
                {sortKey === column.key && (
                  <div
                    className={`${sortOrder === "asc" ? "rotate-180" : ""
                      } w-4 h-4`}
                  >
                    <Image
                      src={`/arrow-sort-table.svg`}
                      alt="arrow"
                      width={16}
                      height={16}
                    />
                  </div>
                )}
              </span>
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableRowWithCheckbox({
  rowData,
  columns,
  isSelected,
  onSelect,
  index,
  formatDate,
}) {
  return (
    <tr className="border-b h-11">
      {/* Checkbox column */}
      <td className="border-r text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className="text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
      </td>

      {columns.map((column, colIndex) => (
        <td
          key={colIndex}
          className={`px-4 py-2 text-eerie-black text-center whitespace-nowrap ${colIndex !== columns.length - 1 ? "border-r" : ""
            }`}
        >
          <span>
            {column.key === "date"
              ? formatDate(rowData[column.key])
              : rowData[column.key]}
          </span>
        </td>
      ))}
    </tr>
  );
}

export function TableWithTotal({
  register,
  setValue,
  name,
  columns = [],
  rowData = [],
  totalRow = {},
  className = "",
}) {
  useEffect(() => {
    setValue(`${name}Table`, rowData);
  }, [rowData, setValue, name]);

  return (
    <div
      className={`${className} rounded-lg border-[1px] overflow-y-auto overflow-x-auto table-scrollbar h-full border-[#97979780] text-xs bg-white`}
    >
      <table className="w-full">
        <TableHeaderWithTotal columns={columns} />
        <tbody className="h-full">
          {rowData.map((item, index) => (
            <TableRowWithTotal key={index} rowData={item} columns={columns} />
          ))}
          {/* Total row */}
          {Object.keys(totalRow).length > 0 && (
            <tr className="bg-[#E2E8F0] h-11 font-semibold text-[14px] tracking-wider text-gray-700">
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`px-4 py-2 text-center border-t ${colIndex !== columns.length - 1 ? "border-r" : ""
                    }`}
                >
                  {totalRow[column.key] || ""}
                </td>
              ))}
            </tr>
          )}
        </tbody>
      </table>
      <input type="hidden" {...register(`${name}Table`)} />
    </div>
  );
}

function TableHeaderWithTotal({ columns }) {
  return (
    <thead className="sticky top-0 bg-gray-100 border-b text-dim-gray">
      <tr className="h-12">
        {columns.map((column, index) => (
          <th
            key={column.key}
            className={`px-4 py-2 text-center text-[14px] tracking-wide text-gray-600 font-medium ${index !== columns.length - 1 ? "border-b" : ""
              }`}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function TableRowWithTotal({ rowData, columns }) {
  return (
    <tr className="border-b h-11 ">
      {columns.map((column, index) => (
        <td
          key={index}
          className={`px-4 py-3 text-gray-500 text-[15px] tracking-wider leading-relaxed font-sans text-center whitespace-nowrap ${index !== columns.length - 1 ? "border-b" : ""
            }`}
        >
          {column.key === "date"
            ? formatDate(rowData[column.key])
            : rowData[column.key] || "-"}
        </td>
      ))}
    </tr>
  );
}


export function TableWithCTD({
  register,
  setValue,
  name,
  columns = [],
  rowData = [],
  handleDelete,
  handleEdit,
}) {
  useEffect(() => {
    setValue(`${name}Table`, rowData);
  }, [rowData]);

  return (
    <div className="h-64 w-full overflow-auto rounded-lg border border-[#EDEDED] text-xs bg-white table-scrollbar">
      <table className="w-full">
        <TableHeaderWithCTA columns={columns} />
        <tbody>
          {rowData.map((item, index) => (
            <TableRowWithCTD
              key={index}
              index={index}
              rowData={item}
              columns={columns}
              handleDelete={handleDelete}
              handleEdit={handleEdit}
            />
          ))}
        </tbody>
      </table>
      <input type="hidden" {...register(`${name}Table`)} />
    </div>
  );
}

function TableRowWithCTD({ rowData, columns, handleDelete, index }) {
  return (
    <tr className="border-b border-alice-blue h-11">
      {columns.map((column, colIndex) => (
        <td key={colIndex} className="text-gray-600 pl-6 border-r">
          <span>{rowData[column.key]}</span>
        </td>
      ))}

      {/* Only Delete Icon */}
      <td className="flex gap-3 items-center justify-center mt-2">
        <button type="button" onClick={() => handleDelete(index)}>
          <Image src="/delete.svg" alt="Delete" width={15} height={15} />
        </button>
      </td>
    </tr>
  );
}
