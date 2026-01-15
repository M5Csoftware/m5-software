"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { DropdownRedLabel, LabeledDropdown } from "../Dropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import {
  DateInputBox,
  SearchInputBox,
} from "../InputBox";
import { DeleteButton, EditButton } from "../AddUpdateDeleteButton";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import Table from "../Table";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import NotificationFlag from "../Notificationflag";

const ViewZones = ({ register, setValue, watch, zones, tabChange }) => {
  const { sectors, server } = useContext(GlobalContext);
  const [remoteZones, setRemoteZones] = useState([]);
  const [unserviceableZones, setUnserviceableZones] = useState([]);
  const [allZonesData, setAllZonesData] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [searchFilteredZones, setSearchFilteredZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedZoneMatrix, setSelectedZoneMatrix] = useState("");
  const [isViewing, setIsViewing] = useState(false);

  const effectiveFrom = watch("effectiveDateFrom");
  const effectiveTo = watch("effectiveDateTo");

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

  // Watch sector selection
  const selectedSector = watch("sector");

  // Get unique zone matrices from filtered zones
  const uniqueZoneMatrices = useMemo(() => {
    if (!filteredZones || filteredZones.length === 0) return [];
    
    const unique = [...new Set(filteredZones.map(zone => zone.zoneMatrix))].filter(Boolean);
    return unique.sort();
  }, [filteredZones]);

  // Fetch zones data from API
  const fetchZonesData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${server}/zones`);
      const data = await response.json();
      
      console.log("API Response:", data);
      
      // Fix: Extract zones array from response
      const zonesArray = data.zones || data || [];
      
      console.log("Zones Array:", zonesArray);
      setAllZonesData(zonesArray);
      
      if (zonesArray.length === 0) {
        showNotification("info", "No zones found in database");
      }
    } catch (error) {
      console.error("Error fetching zones:", error);
      showNotification("error", "Failed to fetch zones data");
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchZonesData();
  }, []);

  // Handle sector selection change
  useEffect(() => {
    console.log("Selected Sector:", selectedSector);
    console.log("All Zones Data:", allZonesData);

    if (selectedSector && allZonesData.length > 0) {
      // Debug: Check what sectors are available in data
      const availableSectors = [
        ...new Set(allZonesData.map((zone) => zone.sector)),
      ];
      console.log("Available sectors in data:", availableSectors);

      // Try different matching strategies
      let sectorZones = [];

      // 1. Exact match
      sectorZones = allZonesData.filter(
        (zone) => zone.sector === selectedSector
      );

      // 2. Case insensitive match
      if (sectorZones.length === 0) {
        sectorZones = allZonesData.filter(
          (zone) =>
            zone.sector &&
            zone.sector.toLowerCase() === selectedSector.toLowerCase()
        );
      }

      // 3. Partial match (for cases like "United Kingdom" vs "UK")
      if (sectorZones.length === 0) {
        sectorZones = allZonesData.filter(
          (zone) =>
            zone.sector &&
            (zone.sector.toLowerCase().includes(selectedSector.toLowerCase()) ||
              selectedSector.toLowerCase().includes(zone.sector.toLowerCase()))
        );
      }

      // 4. Check common abbreviations
      if (sectorZones.length === 0) {
        const sectorMappings = {
          "united kingdom": "uk",
          uk: "united kingdom",
          usa: "united states",
          "united states": "usa",
          uae: "united arab emirates",
          "united arab emirates": "uae",
        };

        const mappedSector = sectorMappings[selectedSector.toLowerCase()];
        if (mappedSector) {
          sectorZones = allZonesData.filter(
            (zone) => zone.sector && zone.sector.toLowerCase() === mappedSector
          );
        }
      }

      console.log("Filtered zones for sector:", sectorZones);

      if (sectorZones.length > 0) {
        const firstZone = sectorZones[0];
        console.log("First zone data:", firstZone);

        // Force update with timeout to ensure form is ready
        setTimeout(() => {
          // Set Zone Matrix
          console.log("Setting zoneTariff:", firstZone.zoneMatrix);
          setValue("zoneTariff", firstZone.zoneMatrix || "", {
            shouldDirty: true,
            shouldTouch: true,
          });

          // Set Remote Zones
          if (firstZone.remoteZones && firstZone.remoteZones.length > 0) {
            const remoteZonesStr = firstZone.remoteZones.join(", ");
            console.log("Setting remoteZones:", remoteZonesStr);
            setValue("remoteZones", remoteZonesStr, {
              shouldDirty: true,
              shouldTouch: true,
            });
            setRemoteZones(firstZone.remoteZones);
          } else {
            console.log("Setting remoteZones to empty");
            setValue("remoteZones", "", {
              shouldDirty: true,
              shouldTouch: true,
            });
            setRemoteZones([]);
          }

          // Set Unserviceable Zones
          if (
            firstZone.unserviceableZones &&
            firstZone.unserviceableZones.length > 0
          ) {
            const unserviceableZonesStr =
              firstZone.unserviceableZones.join(", ");
            console.log("Setting unserviceableZones:", unserviceableZonesStr);
            setValue("unserviceableZones", unserviceableZonesStr, {
              shouldDirty: true,
              shouldTouch: true,
            });
            setUnserviceableZones(firstZone.unserviceableZones);
          } else {
            console.log("Setting unserviceableZones to empty");
            setValue("unserviceableZones", "", {
              shouldDirty: true,
              shouldTouch: true,
            });
            setUnserviceableZones([]);
          }
        }, 100);
      } else {
        console.log("No zones found for selected sector");
        // Clear fields if no data found
        setValue("zoneTariff", "");
        setValue("remoteZones", "");
        setValue("unserviceableZones", "");
        setRemoteZones([]);
        setUnserviceableZones([]);
      }
    } else {
      // Clear data if no sector selected
      setTimeout(() => {
        setValue("zoneTariff", "", { shouldDirty: true, shouldTouch: true });
        setValue("remoteZones", "", { shouldDirty: true, shouldTouch: true });
        setValue("unserviceableZones", "", {
          shouldDirty: true,
          shouldTouch: true,
        });
        setRemoteZones([]);
        setUnserviceableZones([]);
      }, 100);
    }
  }, [selectedSector, allZonesData, setValue]);

  // Handle View button click
  const handleView = () => {
    if (!selectedSector) {
      showNotification("error", "Please select a sector first");
      return;
    }

    if (allZonesData.length === 0) {
      showNotification("error", "No zones data available. Please upload zones first.");
      return;
    }

    let data = [...allZonesData];

    console.log("Filtering data for sector:", selectedSector);
    console.log("Total zones before filter:", data.length);

    // sector filter (case insensitive)
    data = data.filter(
      (z) => z.sector && z.sector.toLowerCase() === selectedSector.toLowerCase()
    );

    console.log("Zones after sector filter:", data.length);

    // date filter
    const from = normalizeDate(effectiveFrom);
    const to = normalizeDate(effectiveTo);

    if (from || to) {
      console.log("Applying date filter - From:", from, "To:", to);
      
      data = data.filter((z) => {
        // If no effective dates in zone, include it
        if (!z.effectiveDateFrom && !z.effectiveDateTo) return true;

        const zoneFromDate = z.effectiveDateFrom ? normalizeDate(z.effectiveDateFrom.toString().split('T')[0]) : null;
        const zoneToDate = z.effectiveDateTo ? normalizeDate(z.effectiveDateTo.toString().split('T')[0]) : null;

        console.log("Zone dates - From:", zoneFromDate, "To:", zoneToDate);

        // If user selected from date, zone must start on or after that date
        if (from && zoneFromDate && zoneFromDate < from) return false;
        
        // If user selected to date, zone must end on or before that date
        if (to && zoneToDate && zoneToDate > to) return false;

        return true;
      });

      console.log("Zones after date filter:", data.length);
    }

    setFilteredZones(data);
    setSearchFilteredZones(data);
    setSearchQuery("");
    setSelectedZoneMatrix("");

    if (data.length === 0) {
      showNotification("error", `No zones found for sector "${selectedSector}"${from || to ? ' in the selected date range' : ''}`);
      setIsViewing(false);
    } else {
      showNotification("success", `Loaded ${data.length} zone(s) for ${selectedSector}`);
      setIsViewing(true);
    }
  };

  // Handle search across all table headers
  useEffect(() => {
    if (!filteredZones || filteredZones.length === 0) {
      setSearchFilteredZones([]);
      return;
    }

    let result = [...filteredZones];

    // Filter by zone matrix dropdown
    if (selectedZoneMatrix) {
      result = result.filter(zone => zone.zoneMatrix === selectedZoneMatrix);
    }

    // Filter by search query across all columns
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

    setSearchFilteredZones(result);
  }, [searchQuery, selectedZoneMatrix, filteredZones, columns]);

  const handleDownload = () => {
    if (!searchFilteredZones || searchFilteredZones.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    exportToCSV(searchFilteredZones, "zone-matrix.csv");
    showNotification("success", "File downloaded successfully");
  };

  // Reset on tab change
  useEffect(() => {
    fetchZonesData();
    setFilteredZones([]);
    setSearchFilteredZones([]);
    setRemoteZones([]);
    setUnserviceableZones([]);
    setSearchQuery("");
    setSelectedZoneMatrix("");
    setIsViewing(false);

    setValue("sector", "");
    setValue("zoneTariff", "");
    setValue("remoteZones", "");
    setValue("unserviceableZones", "");
    setValue("effectiveDateFrom", "");
    setValue("effectiveDateTo", "");
  }, [tabChange]);

  return (
    <div className="flex-col flex gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="font-semibold text-sm flex gap-1 items-center justify-end">
            <span className="text-eerie-black">Branch: </span>
            <span className="text-red bg-misty-rose py-0.5 px-2.5 rounded ">
              New Delhi
            </span>
          </div>
          <div className="flex w-full gap-6">
            <div className="flex flex-col gap-3 w-full">
              <LabeledDropdown
                options={sectors.map((sector) => sector.name)}
                register={register}
                setValue={setValue}
                title={`Sector`}
                value={`sector`}
                resetFactor={tabChange}
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value={`effectiveDateFrom`}
                placeholder="From (Effective)"
                resetFactor={tabChange}
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value={`effectiveDateTo`}
                placeholder="To (Effective)"
                resetFactor={tabChange}
              />
            </div>
            <div className="flex flex-col gap-3 w-full">
              <DummyInputBoxWithLabelDarkGray
                label="Zone Matrix"
                register={register}
                setValue={setValue}
                value="zoneTariff"
                disabled={true}
                initialValue={watch("zoneTariff") || ""}
              />

              <DummyInputBoxWithLabelDarkGray
                label="Remote Zones"
                register={register}
                setValue={setValue}
                value="remoteZones"
                watch={watch}
                setInput={setRemoteZones}
                initialValue={watch("remoteZones") || ""}
              />

              <DummyInputBoxWithLabelDarkGray
                label="Unserviceable Zones"
                register={register}
                setValue={setValue}
                value="unserviceableZones"
                watch={watch}
                setInput={setUnserviceableZones}
                initialValue={watch("unserviceableZones") || ""}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2">
            <EditButton perm="Accounts Edit" />
            <DeleteButton perm="Accounts Deleteion" />
          </div>
          <div className="flex gap-2 ">
            <div className="w-36 ">
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
                disabled={!searchFilteredZones?.length}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug info */}
      {allZonesData.length > 0 && (
        <div className="text-xs text-gray-500">
          Total zones in database: {allZonesData.length}
          {searchFilteredZones.length !== filteredZones.length && 
            ` | Showing: ${searchFilteredZones.length} of ${filteredZones.length}`
          }
        </div>
      )}
      
      <div className="flex flex-col gap-3">
        <div className="flex gap-9">
          <DropdownRedLabel
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
        
        {loading ? (
          <div className="flex justify-center items-center h-[300px] border border-gray-200 rounded">
            <p className="text-gray-500">Loading zones...</p>
          </div>
        ) : (
          <Table
            columns={columns}
            rowData={searchFilteredZones}
            register={register}
            setValue={setValue}
            name={"zones"}
          />
        )}
      </div>
    </div>
  );
};

export default ViewZones;

// exportToCSV Table Data
function exportToCSV(data, filename = "zone-matrix.csv") {
  if (!data || data.length === 0) return;

  const headers = [
    "zoneMatrix",
    "service",
    "sector",
    "zone",
    "destination",
    "zipcode",
  ];

  const csvRows = [
    headers.join(","), // header row
    ...data.map((row) =>
      headers
        .map((key) => {
          const value = row[key];

          // handle objects / null safely
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