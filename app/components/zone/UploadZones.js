import React, { useContext, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { DropdownRedLabel, LabeledDropdown } from "../Dropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import InputBox, {
  DateInputBox,
  InputBoxMultipleEntry,
  SearchInputBox,
} from "../InputBox";
import { DeleteButton, EditButton } from "../AddUpdateDeleteButton";
import { OutlinedButtonRed } from "../Buttons";
import Table from "../Table";
import NotificationFlag from "../Notificationflag";

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Yes", cancelText = "No" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-eerie-black mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-black bg-red-600 rounded hover:bg-red-700 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const UploadZones = ({ register, setValue, watch, onSubmit, tabChange, reset }) => {
  const { sectors, server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [searchFilteredData, setSearchFilteredData] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [remoteZones, setRemoteZones] = useState([]);
  const [unserviceableZones, setUnserviceableZones] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZoneMatrix, setSelectedZoneMatrix] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const columns = useMemo(
    () => [
      { key: "zoneMatrix", label: "Zone Matrix" },
      { key: "service", label: "Service" },
      { key: "sector", label: "Sector" },
      { key: "zone", label: "Zone" },
      { key: "destination", label: "Destination" },
      { key: "zipcode", label: "Zipcode" },
    ],
    []
  );

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const effectiveFrom = watch("effectiveDateFrom");
  const effectiveTo = watch("effectiveDateTo");
  const zoneTariff = watch("zoneTariff");
  const selectedSector = watch("sector");

  const uniqueZoneMatrices = useMemo(() => {
    if (!rowData || rowData.length === 0) return [];
    
    const unique = [...new Set(rowData.map(zone => zone.zoneMatrix))].filter(Boolean);
    return unique.sort();
  }, [rowData]);

  const normalizeDate = (val) => {
    if (!val) return null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    try {
      const date = new Date(val);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      console.error("Date parsing error:", e);
    }

    return null;
  };

  const validateCSVData = (data) => {
    const errors = [];
    
    data.forEach((row, index) => {
      const rowNum = index + 2;
      
      if (!row.zoneMatrix || row.zoneMatrix.trim() === '') {
        errors.push(`Row ${rowNum}: Zone Matrix is required`);
      }
      if (!row.service || row.service.trim() === '') {
        errors.push(`Row ${rowNum}: Service is required`);
      }
      if (!row.sector || row.sector.trim() === '') {
        errors.push(`Row ${rowNum}: Sector is required`);
      }
      if (!row.zone || row.zone.toString().trim() === '') {
        errors.push(`Row ${rowNum}: Zone is required`);
      }
      if (!row.destination || row.destination.trim() === '') {
        errors.push(`Row ${rowNum}: Destination is required`);
      }
    });

    return errors;
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      setErrorMessage("No file selected.");
      showNotification("error", "No file selected");
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setErrorMessage("Please upload a valid CSV file.");
      showNotification("error", "Invalid file type. Please upload a CSV file");
      event.target.value = null;
      return;
    }

    if (!effectiveFrom || !effectiveTo) {
      setErrorMessage("Please select Effective From and To dates first.");
      showNotification("error", "Please select effective dates before uploading CSV");
      event.target.value = null;
      return;
    }

    const fromDate = new Date(effectiveFrom);
    const toDate = new Date(effectiveTo);
    
    if (fromDate > toDate) {
      setErrorMessage("'From' date cannot be after 'To' date.");
      showNotification("error", "Invalid date range");
      event.target.value = null;
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setIsUploading(false);

        if (!result.data || result.data.length === 0) {
          setErrorMessage("Uploaded file is empty or invalid.");
          showNotification("error", "No data found in CSV file");
          event.target.value = null;
          return;
        }

        const headers = result.meta.fields || [];
        // console.log("CSV Headers:", headers);

        const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
        
        const requiredColumns = [
          { key: 'zoneMatrix', variations: ['zonematrix', 'zone matrix', 'zone_matrix'] },
          { key: 'service', variations: ['service'] },
          { key: 'sector', variations: ['sector'] },
          { key: 'zone', variations: ['zone'] },
          { key: 'destination', variations: ['destination'] },
          { key: 'zipcode', variations: ['zipcode', 'zip code', 'zip_code', 'pincode', 'pin_code'] }
        ];

        const columnMapping = {};
        requiredColumns.forEach(col => {
          const matchedHeader = headers.find((h, idx) => {
            const normalized = h.trim().toLowerCase().replace(/\s+/g, '');
            return col.variations.includes(normalized);
          });
          
          if (matchedHeader) {
            columnMapping[col.key] = matchedHeader;
          }
        });

        const missingColumns = requiredColumns
          .filter(col => !columnMapping[col.key])
          .map(col => col.key);

        if (missingColumns.length > 0) {
          setErrorMessage(`Missing required columns: ${missingColumns.join(', ')}. Found columns: ${headers.join(', ')}`);
          showNotification("error", `Missing columns: ${missingColumns.join(', ')}`);
          event.target.value = null;
          return;
        }

        const from = normalizeDate(effectiveFrom);
        const to = normalizeDate(effectiveTo);

        const parsedData = result.data
          .filter(row => {
            return Object.values(row).some(val => val && val.toString().trim() !== '');
          })
          .map((row, index) => {
            const safeValue = (val) => {
              if (val === null || val === undefined || val === '') return '';
              const str = val.toString().trim();
              if (/^\d+\.0+$/.test(str)) {
                return str.split('.')[0];
              }
              return str;
            };

            return {
              id: `zone-${Date.now()}-${index}`,
              zoneMatrix: safeValue(row[columnMapping.zoneMatrix]),
              service: safeValue(row[columnMapping.service]),
              sector: safeValue(row[columnMapping.sector]),
              zone: safeValue(row[columnMapping.zone]),
              destination: safeValue(row[columnMapping.destination]),
              zipcode: safeValue(row[columnMapping.zipcode]),
              effectiveDateFrom: from,
              effectiveDateTo: to,
            };
          });

        const validationErrors = validateCSVData(parsedData);
        
        if (validationErrors.length > 0) {
          setErrorMessage(`Validation errors found:\n${validationErrors.slice(0, 5).join('\n')}`);
          showNotification("error", `Found ${validationErrors.length} validation error(s)`);
          console.error("Validation Errors:", validationErrors);
          event.target.value = null;
          return;
        }

        // console.log("Processed CSV Data:", parsedData);
        setRowData(parsedData);
        setSearchFilteredData(parsedData);
        setErrorMessage("");
        showNotification("success", `Successfully loaded ${parsedData.length} zones from ${file.name}`);
        
        event.target.value = null;
      },
      error: (error) => {
        setIsUploading(false);
        const errorMsg = "Error parsing CSV file: " + error.message;
        setErrorMessage(errorMsg);
        showNotification("error", "Failed to parse CSV file");
        console.error("CSV Parse Error:", error);
        event.target.value = null;
      }
    });
  };

  useEffect(() => {
    if (!rowData || rowData.length === 0) {
      setSearchFilteredData([]);
      return;
    }

    let result = [...rowData];

    if (selectedZoneMatrix) {
      result = result.filter(zone => zone.zoneMatrix === selectedZoneMatrix);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(zone => {
        return columns.some(column => {
          const value = zone[column.key];
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(query);
        });
      });
    }

    setSearchFilteredData(result);
  }, [searchQuery, selectedZoneMatrix, rowData, columns]);

  const handleEdit = () => {
    if (selectedRows.length === 0) {
      showNotification("error", "Please select at least one zone to edit");
      return;
    }

    setIsEditMode(true);
    showNotification("info", `Editing ${selectedRows.length} zone(s)`);
  };

  const handleUpdateClick = () => {
    if (selectedRows.length === 0) {
      showNotification("error", "Please select at least one zone to update");
      return;
    }
    setShowEditModal(true);
  };

  const confirmUpdate = () => {
    setShowEditModal(false);
    
    // Update the rowData with edited values
    const updatedRowData = rowData.map(row => {
      const updated = editedData[row.id];
      return updated || row;
    });
    
    setRowData(updatedRowData);
    setSearchFilteredData(updatedRowData);
    setIsEditMode(false);
    setEditedData({});
    setSelectedRows([]);
    
    showNotification("success", `Successfully updated ${selectedRows.length} zone(s) in preview`);
  };

  const handleDeleteClick = () => {
    if (selectedRows.length === 0) {
      showNotification("error", "Please select at least one zone to delete");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    
    // Filter out selected rows
    const updatedData = rowData.filter(zone => !selectedRows.includes(zone.id));
    
    setRowData(updatedData);
    setSearchFilteredData(updatedData);
    setSelectedRows([]);
    
    showNotification("success", `Removed ${selectedRows.length} zone(s) from preview`);
  };

  const handleSave = async () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to upload. Please upload a CSV file first");
      return;
    }

    if (!effectiveFrom || !effectiveTo) {
      showNotification("error", "Please select effective From and To dates");
      return;
    }

    if (!zoneTariff?.trim()) {
      showNotification("error", "Please enter Zone Matrix/Tariff name");
      return;
    }

    if (!selectedSector) {
      showNotification("error", "Please select a sector");
      return;
    }

    try {
      setIsUploading(true);

      const dataToSubmit = {
        zones: rowData,
        zoneTariff: zoneTariff.trim(),
        sector: selectedSector,
        effectiveDateFrom: normalizeDate(effectiveFrom),
        effectiveDateTo: normalizeDate(effectiveTo),
        remoteZones: Array.isArray(remoteZones) ? remoteZones : [],
        unserviceableZones: Array.isArray(unserviceableZones) ? unserviceableZones : [],
        uploadDate: new Date().toISOString(),
        totalRecords: rowData.length
      };

      // console.log("Submitting Zone Data:", dataToSubmit);

      const response = await fetch(`${server}/zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSubmit)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload zones');
      }

      // console.log("Upload successful:", result);

      showNotification(
        "success", 
        `Successfully uploaded ${result.count || rowData.length} zones` +
        (remoteZones.length > 0 ? ` with ${remoteZones.length} remote zones` : '') +
        (unserviceableZones.length > 0 ? ` and ${unserviceableZones.length} unserviceable zones` : '')
      );
      
      handleClear();

      if (onSubmit) {
        await onSubmit(dataToSubmit);
      }

    } catch (error) {
      console.error("Error uploading zones:", error);
      showNotification("error", `Upload failed: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setRowData([]);
    setSearchFilteredData([]);
    setFileName("");
    setErrorMessage("");
    setRemoteZones([]);
    setUnserviceableZones([]);
    setSearchQuery("");
    setSelectedZoneMatrix("");
    setSelectedRows([]);
    setIsEditMode(false);
    setEditedData({});
    
    setValue("zoneTariff", "");
    setValue("sector", "");
    setValue("effectiveDateFrom", "");
    setValue("effectiveDateTo", "");
    setValue("remoteZones", []);
    setValue("unserviceableZones", []);
    
    const fileInput = document.getElementById("zone-upload");
    if (fileInput) {
      fileInput.value = null;
    }

    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    if (rowData.length > 0) {
      const from = normalizeDate(effectiveFrom);
      const to = normalizeDate(effectiveTo);
      
      const updatedData = rowData.map(row => ({
        ...row,
        effectiveDateFrom: from,
        effectiveDateTo: to,
        remoteZones: Array.isArray(remoteZones) ? remoteZones : [],
        unserviceableZones: Array.isArray(unserviceableZones) ? unserviceableZones : []
      }));
      
      setRowData(updatedData);
    }
  }, [effectiveFrom, effectiveTo, remoteZones, unserviceableZones]);

  return (
    <div className="flex-col flex gap-3" key={refreshKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      
      <ConfirmationModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onConfirm={confirmUpdate}
        title="Confirm Update"
        message={`Are you sure you want to update ${selectedRows.length} zone(s) in the preview?`}
        confirmText="Yes"
        cancelText="No"
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to remove ${selectedRows.length} zone(s) from the preview?`}
        confirmText="Yes"
        cancelText="No"
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="font-semibold text-sm flex gap-1 items-center justify-end">
            <span className="text-eerie-black">Branch: </span>
            <span className="text-red bg-misty-rose py-0.5 px-2.5 rounded">
              New Delhi
            </span>
          </div>
          <div className="flex w-full gap-6">
            <div className="flex flex-col gap-3 w-full">
              <LabeledDropdown
                key={`sector-${refreshKey}`}
                options={sectors.map((sector) => sector.name)}
                register={register}
                setValue={setValue}
                title={`Sector`}
                value={`sector`}
              />
              <DateInputBox
                key={`effectiveDateFrom-${refreshKey}`}
                register={register}
                setValue={setValue}
                value={`effectiveDateFrom`}
                minToday
                placeholder="From"
                resetFactor={refreshKey}
              />
              <DateInputBox
                key={`effectiveDateTo-${refreshKey}`}
                register={register}
                setValue={setValue}
                value={`effectiveDateTo`}
                minToday
                placeholder="To"
                resetFactor={refreshKey}
              />
            </div>
            <div className="flex flex-col gap-3 w-full">
              <InputBox
                key={`zoneTariff-${refreshKey}`}
                placeholder="Zone Matrix"
                register={register}
                setValue={setValue}
                value="zoneTariff"
                resetFactor={refreshKey}
              />

              <InputBoxMultipleEntry
                key={`remoteZones-${refreshKey}`}
                label="Remote Zones"
                register={register}
                setValue={setValue}
                value="remoteZones"
                watch={watch}
                setInput={setRemoteZones}
              />

              <InputBoxMultipleEntry
                key={`unserviceableZones-${refreshKey}`}
                label="Unserviceable Zones"
                register={register}
                setValue={setValue}
                value="unserviceableZones"
                watch={watch}
                setInput={setUnserviceableZones}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2">
            {isEditMode ? (
              <button
                onClick={handleUpdateClick}
                disabled={selectedRows.length === 0 || isUploading}
                className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors ${
                  (selectedRows.length === 0 || isUploading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Update
              </button>
            ) : (
              <EditButton 
                perm="Accounts Edit" 
                onClick={handleEdit}
                disabled={selectedRows.length === 0 || isUploading}
              />
            )}
            <DeleteButton 
              perm="Accounts Deletion" 
              onClick={handleDeleteClick}
              disabled={selectedRows.length === 0 || isUploading}
            />
          </div>
          <div className="flex gap-2">
            <label
              className={`cursor-pointer bg-red text-white font-semibold rounded-md text-sm text-center py-1.5 w-36 transition-opacity ${
                isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
              }`}
              htmlFor="zone-upload"
            >
              <span>{isUploading ? 'Loading...' : 'Browse CSV'}</span>
            </label>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
              id="zone-upload"
              disabled={isUploading}
              key={`file-${refreshKey}`}
            />
            <div className="w-36">
              <OutlinedButtonRed 
                label={isUploading ? 'Saving...' : 'Save'} 
                onClick={handleSave}
                disabled={isUploading || rowData.length === 0}
              />
            </div>
            <div className="w-36">
              <OutlinedButtonRed 
                label="Clear" 
                onClick={handleClear}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>
        
        {(fileName || remoteZones.length > 0 || unserviceableZones.length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
            {fileName && (
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <span className="font-semibold">Loaded:</span>
                <span>{fileName}</span>
                <span className="text-green-600 font-semibold">({rowData.length} records)</span>
                {searchFilteredData.length !== rowData.length && (
                  <span className="text-blue-600 font-semibold">
                    | Showing: {searchFilteredData.length}
                  </span>
                )}
                {selectedRows.length > 0 && (
                  <span className="text-purple-600 font-semibold">
                    | Selected: {selectedRows.length}
                  </span>
                )}
              </div>
            )}
            {remoteZones.length > 0 && (
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <span className="font-semibold">Remote Zones:</span>
                <span className="text-orange-600">{remoteZones.join(', ')}</span>
              </div>
            )}
            {unserviceableZones.length > 0 && (
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <span className="font-semibold">Unserviceable Zones:</span>
                <span className="text-red-600">{unserviceableZones.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-9">
          <DropdownRedLabel
            key={`zones-dropdown-${refreshKey}`}
            options={uniqueZoneMatrices}
            register={register}
            setValue={(name, value) => {
              setValue(name, value);
              setSelectedZoneMatrix(value);
            }}
            title={`Zones`}
            value={`zones`}
          />
          <SearchInputBox 
            placeholder="Search Zones" 
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
        </div>
        
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        
        <div>
          {rowData.length > 0 && (
            <div className="mb-2 text-sm font-semibold text-gray-700">
              Preview: {searchFilteredData.length} of {rowData.length} zones
              {selectedRows.length > 0 && ` | Selected: ${selectedRows.length}`}
            </div>
          )}
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
            onDataChange={setEditedData}
            onEditComplete={() => {
              setIsEditMode(false);
              setEditedData({});
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default UploadZones;