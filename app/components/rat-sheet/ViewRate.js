"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { DeleteButton, EditButton } from "../AddUpdateDeleteButton";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import { DateInputBox, SearchInputBox } from "../InputBox";
import { DropdownRedLabel, LabeledDropdown } from "../Dropdown";
import Table from "../Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "../Notificationflag";
import { useDebounce } from "@/app/hooks/useDebounce";

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

const ViewRate = ({ register, setValue, reset, watch }) => {
  const [rateData, setRateData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [selectedShipper, setSelectedShipper] = useState("");
  const [filteredRateData, setFilteredRateData] = useState([]);
  const [isViewing, setIsViewing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { sectors, server } = useContext(GlobalContext);

  const selectedType = watch("type");
  const selectedNetwork = watch("network");
  const effectiveFrom = watch("effectiveFrom");
  const effectiveTo = watch("to");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const normalizeDate = (val) => {
    if (!val) return null;

    // yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    return null;
  };

  const fetchRateData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${server}/rate-sheet`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setRateData(data);
      
      if (data.length === 0) {
        showNotification("info", "No rate sheets found in database");
      }
    } catch (err) {
      console.error("error", err);
      showNotification("error", "Failed to fetch rate sheet data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRateData();
  }, []);

  const columns = useMemo(
    () => [
      { key: "shipper", label: "SHIPPER" },
      { key: "network", label: "NETWORK" },
      { key: "service", label: "SERVICE" },
      { key: "type", label: "TYPE" },
      { key: "minWeight", label: "MIN WEIGHT" },
      { key: "maxWeight", label: "MAX WEIGHT" },
      ...Array.from({ length: 35 }, (_, i) => ({
        key: `${i + 1}`,
        label: `Zone ${i + 1}`,
      })),
    ],
    []
  );

  // Get unique shipper names from rate data
  const uniqueShippers = useMemo(() => {
    if (!Array.isArray(rateData) || rateData.length === 0) return [];
    
    const unique = [...new Set(rateData.map(item => item.shipper))].filter(Boolean);
    return unique.sort();
  }, [rateData]);

  // Handle View button click with filters
  const handleView = () => {
    if (!Array.isArray(rateData)) {
      showNotification("error", "No rate data available");
      return;
    }

    let data = [...rateData];

    // Filter by type
    if (selectedType) {
      const typeCode = selectedType === "Bulk" ? "B" : "S";
      data = data.filter(item => item.type === typeCode);
    }

    // Filter by network
    if (selectedNetwork) {
      data = data.filter(item => item.network === selectedNetwork);
    }

    // Filter by shipper
    if (selectedShipper) {
      data = data.filter(item => item.shipper === selectedShipper);
    }

    // Filter by date range
    const from = normalizeDate(effectiveFrom);
    const to = normalizeDate(effectiveTo);

    if (from || to) {
      data = data.filter((item) => {
        if (!item.effectiveFrom && !item.to) return true;

        const itemFromDate = item.effectiveFrom ? normalizeDate(item.effectiveFrom.toString().split('T')[0]) : null;
        const itemToDate = item.to ? normalizeDate(item.to.toString().split('T')[0]) : null;

        if (from && itemFromDate && itemFromDate < from) return false;
        if (to && itemToDate && itemToDate > to) return false;

        return true;
      });
    }

    // Filter by search query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      data = data.filter(item => {
        return Object.values(item).some(value =>
          String(value).toLowerCase().includes(query)
        );
      });
    }

    setFilteredRateData(data);
    setSelectedRows([]);

    if (data.length === 0) {
      showNotification("error", "No rate sheets found matching the selected filters");
      setIsViewing(false);
    } else {
      showNotification("success", `Loaded ${data.length} rate sheet(s)`);
      setIsViewing(true);
    }
  };

  const handleEdit = () => {
    if (selectedRows.length === 0) {
      showNotification("error", "Please select at least one rate sheet to edit");
      return;
    }

    setIsEditMode(true);
    showNotification("info", `Editing ${selectedRows.length} rate sheet(s)`);
  };

  const handleUpdateClick = () => {
    if (selectedRows.length === 0) {
      showNotification("error", "Please select at least one rate sheet to update");
      return;
    }
    setShowEditModal(true);
  };

  const confirmUpdate = async () => {
    setShowEditModal(false);
    
    try {
      setLoading(true);
      
      const updatePromises = selectedRows.map(rateId => {
        const updatedRate = editedData[rateId] || filteredRateData.find(r => r.id === rateId);
        
        return fetch(`${server}/rate-sheet/${rateId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedRate),
        });
      });

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        showNotification("success", `Successfully updated ${selectedRows.length} rate sheet(s)`);
        
        await fetchRateData();
        
        if (isViewing) {
          handleView();
        }
        
        setSelectedRows([]);
        setIsEditMode(false);
        setEditedData({});
      } else {
        showNotification("error", "Some rate sheets could not be updated");
      }
    } catch (error) {
      console.error("Error updating rate sheets:", error);
      showNotification("error", "Failed to update rate sheets");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    if (selectedRows.length === 0) {
      showNotification("error", "Please select at least one rate sheet to delete");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);

    try {
      setLoading(true);
      
      // Use batch delete if multiple, single delete if one
      if (selectedRows.length === 1) {
        const response = await fetch(`${server}/rate-sheet?id=${selectedRows[0]}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete rate sheet');
        }
      } else {
        // Batch delete
        const response = await fetch(`${server}/rate-sheet`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'batchDelete',
            ids: selectedRows
          })
        });

        if (!response.ok) {
          throw new Error('Failed to delete rate sheets');
        }
      }

      showNotification("success", `Successfully deleted ${selectedRows.length} rate sheet(s)`);
      
      await fetchRateData();
      
      if (isViewing) {
        handleView();
      }
      
      setSelectedRows([]);
    } catch (error) {
      console.error("Error deleting rate sheets:", error);
      showNotification("error", "Failed to delete rate sheets");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!filteredRateData || filteredRateData.length === 0) {
      showNotification("error", "No data to download. Please click View first.");
      return;
    }

    exportToCSV(filteredRateData, "rate-sheet.csv");
    showNotification("success", "File downloaded successfully");
  };

  return (
    <div className="flex flex-col gap-3">
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
        message={`Are you sure you want to update ${selectedRows.length} rate sheet(s)?`}
        confirmText="Yes"
        cancelText="No"
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${selectedRows.length} rate sheet(s)? This action cannot be undone.`}
        confirmText="Yes"
        cancelText="No"
      />
      
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <h2 className="text-[16px] text-red font-semibold">Rate Sheet</h2>
          <div className="font-semibold text-sm flex gap-1 items-center">
            <span className="text-eerie-black">Branch: </span>
            <span className="text-red bg-misty-rose py-0.5 px-2.5 rounded">
              New Delhi
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex justify-between gap-3">
          <div className="flex flex-col gap-3 w-full">
            <LabeledDropdown
              options={["Bulk", "Slab"]}
              register={register}
              setValue={setValue}
              value="type"
              title="Type"
            />
            <LabeledDropdown
              options={sectors.map((sector) => sector.name)}
              register={register}
              setValue={setValue}
              value="sector"
              title="Sector"
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
            />
            <DummyInputBoxWithLabelDarkGray
              reset={reset}
              label="Zone Tariff"
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

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-3">
          {isEditMode ? (
            <button
              onClick={handleUpdateClick}
              disabled={selectedRows.length === 0 || loading}
              className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 transition-colors ${
                (selectedRows.length === 0 || loading) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Update
            </button>
          ) : (
            <EditButton 
              perm="Accounts Edit" 
              onClick={handleEdit}
              disabled={selectedRows.length === 0 || loading}
            />
          )}
          <DeleteButton 
            perm="Accounts Deletion" 
            onClick={handleDeleteClick}
            disabled={selectedRows.length === 0 || loading}
          />
        </div>
        <div className="flex gap-3">
          <div className="w-36">
            <SimpleButton 
              name={isViewing ? "Viewing" : "View"} 
              onClick={handleView}
              disabled={loading}
            />
          </div>
          <div className="w-36">
            <OutlinedButtonRed 
              label="Download" 
              onClick={handleDownload}
              disabled={!filteredRateData?.length}
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      {rateData.length > 0 && (
        <div className="text-xs text-gray-500">
          Total rate sheets in database: {rateData.length}
          {filteredRateData.length > 0 && ` | Showing: ${filteredRateData.length}`}
          {selectedRows.length > 0 && ` | Selected: ${selectedRows.length}`}
        </div>
      )}

      {/* Table Section */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-6">
          <DropdownRedLabel
            options={uniqueShippers}
            register={register}
            setValue={(name, value) => {
              setValue(name, value);
              setSelectedShipper(value);
            }}
            title="*RateSheet Name*"
            value="rateSheetName"
          />
          <SearchInputBox
            placeholder="Search Rate Sheet"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center h-[300px] border border-gray-200 rounded">
            <p className="text-gray-500">Loading rate sheets...</p>
          </div>
        ) : (
          <Table
            columns={columns}
            rowData={filteredRateData}
            register={register}
            setValue={setValue}
            name="zones"
            selectable={true}
            selectedRows={selectedRows}
            onSelectionChange={setSelectedRows}
            editable={isEditMode}
            onDataChange={setEditedData}
            onEditComplete={() => {
              setIsEditMode(false);
              setEditedData({});
              fetchRateData();
              if (isViewing) handleView();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ViewRate;

// Export to CSV function
function exportToCSV(data, filename = "rate-sheet.csv") {
  if (!data || data.length === 0) return;

  // Generate headers dynamically based on columns
  const headers = [
    "shipper",
    "network",
    "service",
    "type",
    "minWeight",
    "maxWeight",
    ...Array.from({ length: 35 }, (_, i) => `${i + 1}`)
  ];

  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((key) => {
          const value = row[key];

          if (value === null || value === undefined) return `""`;
          if (typeof value === "object") return `"${JSON.stringify(value)}"`;

          return `"${value.toString().replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}