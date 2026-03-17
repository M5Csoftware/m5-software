"use client";
import React, { useEffect, useContext, useMemo, useState } from "react";
import { OutlinedButtonRed } from "../Buttons";
import { DeleteButton, EditButton } from "../AddUpdateDeleteButton";
import InputBox, { DateInputBox, SearchInputBox } from "../InputBox";
import { DropdownRedLabel, LabeledDropdown } from "../Dropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import Table from "../Table";
import NotificationFlag from "../Notificationflag";
import { useDebounce } from "@/app/hooks/useDebounce";

const UploadRate = ({ register, setValue, reset, onSubmit }) => {
  const [tabChange, setTabChange] = useState(false);
  const { sectors } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [searchFilteredData, setSearchFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedShipper, setSelectedShipper] = useState("");
  const [selectedRows, setSelectedRows] = useState([]); // Track selected rows
  const [isEditMode, setIsEditMode] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const columns = useMemo(() => {
    const baseColumns = [
      { key: "shipper", label: "SHIPPER" },
      { key: "network", label: "NETWORK" },
      { key: "service", label: "SERVICE" },
      { key: "type", label: "TYPE" },
      { key: "minWeight", label: "MIN WEIGHT" },
      { key: "maxWeight", label: "MAX WEIGHT" },
    ];

    const zoneColumns = Array.from({ length: 35 }, (_, i) => ({
      key: `${i + 1}`,
      label: `Zone ${i + 1}`,
    }));

    return [...baseColumns, ...zoneColumns];
  }, []);

  // Get unique shipper names from uploaded data
  const uniqueShippers = useMemo(() => {
    if (!rowData || rowData.length === 0) return [];
    
    const unique = [...new Set(rowData.map(item => item.shipper))].filter(Boolean);
    return unique.sort();
  }, [rowData]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const Papa = await import("papaparse");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        console.log("Raw parsed data:", result.data[0]); // Debug log
        console.log("CSV headers:", result.meta.fields); // Debug log
        
        const parsedData = result.data.map((row, index) => {
          // Build the JSON object with the correct column mapping
          const jsonData = {
            _tempId: `temp_${Date.now()}_${index}`, // Temporary ID for local editing
            shipper: row.shipper?.trim() || "",
            network: row.network?.trim() || "",
            service: row.service?.trim() || "",
            type: row.type?.trim() || "",
            minWeight: parseFloat(row.minWeight?.trim()) || 0,
            maxWeight: parseFloat(row.maxWeight?.trim()) || 0,
          };

          // Extract zone rates (columns 1-35)
          for (let i = 1; i <= 35; i++) {
            const columnName = i.toString();
            const value = row[columnName]?.trim();
            
            // Parse the value - handle empty strings and zeros
            if (value === '' || value === '0') {
              jsonData[i] = 0;
            } else {
              const number = parseFloat(value);
              jsonData[i] = !isNaN(number) ? number : 0;
            }
          }

          return jsonData;
        });

        console.log("Processed CSV Data:", parsedData);
        setRowData(parsedData);
        setSearchFilteredData(parsedData);
        setSelectedRows([]); // Clear selection
        showNotification("success", `Loaded ${parsedData.length} records from CSV`);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        showNotification("error", "Failed to parse CSV file");
      },
    });
  };

  // Handle search and shipper filter
  useEffect(() => {
    if (!rowData || rowData.length === 0) {
      setSearchFilteredData([]);
      return;
    }

    let result = [...rowData];

    // Filter by shipper dropdown
    if (selectedShipper) {
      result = result.filter(item => item.shipper === selectedShipper);
    }

    // Filter by search query across all columns
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      result = result.filter(item => {
        return columns.some(column => {
          const value = item[column.key];
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(query);
        });
      });
    }

    setSearchFilteredData(result);
  }, [debouncedSearchQuery, selectedShipper, rowData, columns]);

  useEffect(() => {
    console.log("Current rowData:", rowData);
  }, [rowData]);

  // Handle Edit button click
  const handleEdit = () => {
    if (selectedRows.length === 0) {
      showNotification("error", "Please select at least one record to edit");
      return;
    }

    setIsEditMode(true);
    showNotification("info", `Editing ${selectedRows.length} record(s)`);
  };

  // Handle Delete button click
  const handleDelete = () => {
    if (selectedRows.length === 0) {
      showNotification("error", "Please select at least one record to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} record(s)?`)) {
      return;
    }

    try {
      // Remove selected rows from rowData
      const updatedData = rowData.filter(
        item => !selectedRows.includes(item._tempId)
      );

      setRowData(updatedData);
      setSearchFilteredData(updatedData);
      setSelectedRows([]);
      
      showNotification("success", `Successfully deleted ${selectedRows.length} record(s)`);
    } catch (error) {
      console.error("Error deleting records:", error);
      showNotification("error", "Failed to delete records");
    }
  };

  // Handle edit completion
  const handleEditComplete = (updatedData) => {
    setRowData(updatedData);
    setSearchFilteredData(updatedData);
    setIsEditMode(false);
    setSelectedRows([]);
    showNotification("success", "Records updated successfully");
  };

  const handleSave = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to upload. Please upload a valid CSV file.");
      return;
    }

    // Remove temporary IDs before sending to backend
    const dataToSave = rowData.map(({ _tempId, ...rest }) => rest);

    console.log("Saving data:", dataToSave);
    onSubmit(dataToSave); // Call the handleUploadData function passed as a prop
  };

  const handleClear = () => {
    if (rowData.length > 0) {
      if (!window.confirm("Are you sure you want to clear all data?")) {
        return;
      }
    }

    setRowData([]);
    setSearchFilteredData([]);
    setSearchQuery("");
    setSelectedShipper("");
    setSelectedRows([]);
    setIsEditMode(false);
    
    // Reset file input
    const fileInput = document.getElementById("rate-upload");
    if (fileInput) {
      fileInput.value = null;
    }

    showNotification("info", "All data cleared");
  };

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <div>
            <h2 className="text-[16px] text-red font-semibold">Run Details</h2>
          </div>
          <div className="font-semibold text-sm flex gap-1 items-center">
            <span className="text-eerie-black">Branch: </span>
            <span className="text-red bg-misty-rose py-0.5 px-2.5 rounded">
              New Delhi
            </span>
          </div>
        </div>

        <div className="flex justify-between gap-3">
          <div className="flex flex-col gap-3 w-full">
            <LabeledDropdown
              options={["Bulk", "Slab"]}
              register={register}
              setValue={setValue}
              value="type"
              title="Type"
              resetFactor={tabChange}
            />
            <LabeledDropdown
              options={sectors.map((sector) => sector.name)}
              register={register}
              setValue={setValue}
              value="sector"
              title="Sector"
              resetFactor={tabChange}
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="effectiveFrom"
              placeholder="Effective From"
            />
          </div>
          <div className="flex flex-col gap-3 w-full">
            <LabeledDropdown
              options={["MPL", "M5C"]}
              register={register}
              setValue={setValue}
              value="network"
              title="Network"
              resetFactor={tabChange}
            />
            <InputBox
              resetFactor={tabChange}
              reset={reset}
              placeholder="Zone Tariff"
              register={register}
              setValue={setValue}
              value="zoneTariff"
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex gap-3">
          <EditButton 
            perm="Accounts Edit" 
            onClick={handleEdit}
            disabled={selectedRows.length === 0}
          />
          <DeleteButton 
            perm="Accounts Deletion" 
            onClick={handleDelete}
            disabled={selectedRows.length === 0}
          />
        </div>
        <div className="flex gap-3">
          {/* File Upload Button */}
          <label
            className="cursor-pointer bg-red text-white font-semibold rounded-md text-sm text-center py-2.5 w-36"
            htmlFor="rate-upload"
          >
            <span>Upload CSV</span>
          </label>

          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            id="rate-upload"
          />
          <div className="w-36">
            <OutlinedButtonRed label="Save" onClick={handleSave} />
          </div>
          <div className="w-36">
            <OutlinedButtonRed label="Clear" onClick={handleClear} />
          </div>
        </div>
      </div>

      {/* File Info */}
      {rowData.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-gray-700 flex items-center gap-2">
            <span className="font-semibold">Loaded:</span>
            <span className="text-green-600 font-semibold">{rowData.length} records</span>
            {searchFilteredData.length !== rowData.length && (
              <span className="text-blue-600 font-semibold">
                | Showing: {searchFilteredData.length}
              </span>
            )}
            {selectedRows.length > 0 && (
              <span className="text-red font-semibold">
                | Selected: {selectedRows.length}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex gap-6">
          <DropdownRedLabel
            options={uniqueShippers}
            register={register}
            setValue={(name, value) => {
              setValue(name, value);
              setSelectedShipper(value);
            }}
            title="RateSheet Name"
            value="rateSheetName"
          />
          <SearchInputBox 
            placeholder="Search Rate Sheet" 
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
        </div>

        {/* Preview Label */}
        {rowData.length > 0 && (
          <div className="text-sm font-semibold text-gray-700">
            Preview: {searchFilteredData.length} of {rowData.length} records
          </div>
        )}

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            rowData={searchFilteredData}
            register={register}
            setValue={setValue}
            name={"zones"}
            selectable={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            editable={isEditMode}
            onEditComplete={() => {
              setIsEditMode(false);
              showNotification("success", "Changes applied successfully");
            }}
            useLocalEdit={true} // Flag to indicate local editing without API
            onLocalEditComplete={handleEditComplete}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadRate;