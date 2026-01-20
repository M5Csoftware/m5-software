"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { SearchInputBox } from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";

const RateHike = () => {
  const { register, setValue, watch, reset } = useForm({
    shouldUnregister: false,
  });
  const customerCode = watch("customerName");
  const [demoRadio, setDemoRadio] = useState("percentageInput");
  const { server, accounts } = useContext(GlobalContext);
  const [rateTariffs, setRateTariffs] = useState([]);
  const [services, setServices] = useState([]);
  const [rateTariffRaw, setRateTariffRaw] = useState([]);
  const selectedService = watch("service");
  const selectedRateTariff = watch("rateTariff");
  const [tableData, setTableData] = useState([]);
  const [hikedTableData, setHikedTableData] = useState([]);
  const [zoneTariffValue, setZoneTariffValue] = useState("");
  const [zoneListData, setZoneListData] = useState([]);
  const searchZone = watch("searchZoneList");
  const percentageRateHike = watch("percentageRateHike");
  const flatRateHike = watch("flatRateHike");
  const [branchValue, setBranchValue] = useState("");
  const [countryValue, setCountryValue] = useState("");
  const [showHikedRates, setShowHikedRates] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState(null);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const zoneRef = useRef("");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Refresh function
  const handleRefresh = () => {
    reset();
    setRateTariffs([]);
    setRateTariffRaw([]);
    setServices([]);
    setTableData([]);
    setHikedTableData([]);
    setZoneListData([]);
    setShowHikedRates(false);
    setDemoRadio("percentageInput");
    setBranchValue("");
    setCountryValue("");
    setZoneTariffValue("");
    zoneRef.current = "";

    showNotification("info", "All fields have been refreshed");
  };

  // Find branch for selected customer
  useEffect(() => {
    if (customerCode && accounts && accounts.length > 0) {
      const selectedAccount = accounts.find(
        (account) => account.accountCode === customerCode
      );

      if (selectedAccount) {
        const branch = selectedAccount.branch || "";
        setBranchValue(branch);
        setValue("branch", branch);
      } else {
        setBranchValue("");
        setValue("branch", "");
      }
    } else {
      setBranchValue("");
      setValue("branch", "");
    }
  }, [customerCode, accounts, setValue]);

  // Fetch country when both rate tariff and service are selected
  useEffect(() => {
    if (selectedRateTariff && selectedService) {
      console.log("Both selected, fetching country...");
      fetchCountryFromShipperTariff(selectedRateTariff, selectedService);
    } else {
      setCountryValue("");
      setValue("country", "");
    }
  }, [selectedRateTariff, selectedService]);

  // Fetch zone list when zone tariff is available
  useEffect(() => {
    const currentZone = zoneRef.current;
    if (currentZone && currentZone.trim()) {
      console.log("Zone tariff available, fetching zone list:", currentZone);
      fetchZoneList();
    }
  }, [zoneRef.current]);

  // Watch for zoneTariffValue changes
  useEffect(() => {
    if (zoneTariffValue && zoneTariffValue.trim()) {
      console.log(
        "zoneTariffValue changed, fetching zone list:",
        zoneTariffValue
      );
      zoneRef.current = zoneTariffValue;
      fetchZoneList();
    }
  }, [zoneTariffValue]);

  const fetchCountryFromShipperTariff = async (rateTariff, service) => {
    if (!customerCode || !rateTariff || !service) return;

    try {
      const cleanRateTariff = rateTariff.trim();
      const cleanService = service.trim();

      console.log("Fetching country for:", {
        customerCode,
        rateTariff: cleanRateTariff,
        service: cleanService,
      });

      const res = await axios.get(`${server}/rate-hike/country`, {
        params: {
          customerCode,
          rateTariff: cleanRateTariff,
          service: cleanService,
        },
      });

      const country = res.data || "";
      console.log("Country API Response:", country);

      setCountryValue(country);
      setValue("country", country);
    } catch (error) {
      console.error("Error fetching country:", error);
      setCountryValue("");
      setValue("country", "");
    }
  };

  const fetchRateTariffs = async (customerCode) => {
    if (!customerCode) return;

    try {
      setIsLoading(true);
      const res = await axios.get(`${server}/rate-hike/customer`, {
        params: { customerCode },
      });

      setRateTariffRaw(res.data || []);
      setRateTariffs((res.data || []).map((t) => t.label));
    } catch (error) {
      console.error("Error fetching rate tariffs:", error);
      showNotification("error", "Failed to fetch rate tariffs");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZone = async (rateTariff) => {
    if (!customerCode || !rateTariff) return;

    try {
      setIsLoading(true);
      const res = await axios.get(`${server}/rate-hike/zones`, {
        params: { customerCode, rateTariff },
      });

      const zone = res.data || "";
      console.log("Zone from ShipperTariff:", zone);

      zoneRef.current = zone;
      setZoneTariffValue(zone);
      setValue("zoneTariff", zone);
    } catch (error) {
      console.error("Error fetching zone:", error);
      showNotification("error", "Failed to fetch zone");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchZoneList = async () => {
    const currentZone = zoneRef.current;

    if (!currentZone || !currentZone.trim()) {
      console.log("No zone tariff available for zone list fetch");
      setZoneListData([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log("=== FETCHING ZONE LIST ===");
      console.log("Zone Tariff to search:", `"${currentZone}"`);

      const res = await axios.get(`${server}/rate-hike/zone-list`, {
        params: {
          zoneTariff: currentZone.trim(),
        },
      });

      console.log("Zone list API response:", {
        status: res.status,
        dataLength: res.data?.length || 0,
        sample: res.data?.[0],
      });

      setZoneListData(res.data || []);

      if (res.data && res.data.length > 0) {
        console.log(
          `✅ Loaded ${res.data.length} zone entries for zoneMatrix: "${currentZone}"`
        );
        console.log("Sample zone entry:", res.data[0]);
      } else {
        console.log(`❌ No zone data found for zoneMatrix: "${currentZone}"`);
      }
    } catch (error) {
      console.error("Error fetching zone list:", error);
      console.error("Error details:", error.response?.data);
      setZoneListData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableServices = async (rateTariff) => {
    if (!rateTariff) return;

    try {
      setIsLoading(true);
      const res = await axios.get(`${server}/rate-sheet`, {
        params: { shipper: rateTariff },
      });

      const allData = res.data || [];
      const uniqueServices = [
        ...new Set(allData.map((item) => item.service)),
      ].filter(Boolean);

      console.log("Available services:", uniqueServices);
      setServices(uniqueServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableNetworks = async (shipper, service) => {
    try {
      setIsLoading(true);
      const params = { shipper };
      if (service) {
        params.service = service;
      }

      const res = await axios.get(`${server}/rate-sheet`, { params });
      const allData = res.data || [];
      const uniqueNetworks = [
        ...new Set(allData.map((item) => item.network)),
      ].filter(Boolean);

      console.log("Available networks:", uniqueNetworks);
      return uniqueNetworks;
    } catch (error) {
      console.error("Error fetching networks:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const rateColumns = useMemo(
    () => [
      { key: "minWeight", label: "MIN WEIGHT" },
      { key: "maxWeight", label: "MAX WEIGHT" },
      ...Array.from({ length: 35 }, (_, i) => ({
        key: `${i + 1}`,
        label: `Zone ${i + 1}`,
      })),
    ],
    []
  );

  const zoneListColumns = useMemo(
    () => [
      { key: "service", label: "Service" },
      { key: "sector", label: "Sector" },
      { key: "zone", label: "Zone" },
      { key: "destination", label: "Destination" },
    ],
    []
  );

  // Enhanced search filter for zone list
  const filteredZoneList = useMemo(() => {
    if (!searchZone || !searchZone.trim()) return zoneListData;

    const searchLower = searchZone.toLowerCase().trim();

    return zoneListData.filter((zone) => {
      // Check all 4 columns for match
      const serviceMatch =
        zone.service?.toLowerCase().includes(searchLower) || false;
      const sectorMatch =
        zone.sector?.toLowerCase().includes(searchLower) || false;
      const zoneMatch = zone.zone?.toString().includes(searchLower) || false;
      const destinationMatch =
        zone.destination?.toLowerCase().includes(searchLower) || false;

      // Return true if ANY column matches
      return serviceMatch || sectorMatch || zoneMatch || destinationMatch;
    });
  }, [zoneListData, searchZone]);

  // Search stats for display
  const searchStats = useMemo(() => {
    const total = zoneListData.length;
    const filtered = filteredZoneList.length;
    const searchTerm = searchZone?.trim();

    return {
      total,
      filtered,
      isFiltered: searchTerm && filtered !== total,
      searchTerm,
    };
  }, [zoneListData.length, filteredZoneList.length, searchZone]);

  const handleShow = async () => {
    console.log("=== handleShow clicked ===");
    console.log("Current values:", {
      customerCode,
      selectedRateTariff,
      selectedService,
      zoneTariffFromShipper: zoneRef.current,
      branch: branchValue,
      country: countryValue,
    });

    if (!selectedRateTariff) {
      showNotification("error", "Please select rate tariff");
      return;
    }

    if (!selectedService) {
      showNotification("error", "Please select service");
      return;
    }

    try {
      setIsLoading(true);
      const params = {
        shipper: selectedRateTariff,
      };

      if (selectedService) {
        params.service = selectedService;
      }

      console.log("Fetching rate sheet:", params);

      const res = await axios.get(`${server}/rate-sheet`, {
        params,
        timeout: 10000,
      });

      console.log("Rate sheet response:", {
        status: res.status,
        dataLength: res.data?.length || 0,
      });

      const ratesData = res.data || [];

      if (ratesData.length > 0) {
        console.log("Sample row:", {
          shipper: ratesData[0].shipper,
          service: ratesData[0].service,
          network: ratesData[0].network,
        });
      }

      const sortedData = [...ratesData].sort(
        (a, b) => a.minWeight - b.minWeight
      );
      setTableData(sortedData);
      setHikedTableData([]);
      setShowHikedRates(false);

      // Fetch zone list when showing rates
      fetchZoneList();

      showNotification(
        "success",
        `Rates loaded successfully - ${sortedData.length} rows`
      );
    } catch (error) {
      console.error("Error fetching rates:", error);
      showNotification(
        "error",
        `Failed to fetch rates: ${error.response?.data?.error || error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleHike = async () => {
    if (!tableData.length) {
      showNotification("error", "Please load rates first by clicking Show");
      return;
    }

    const hikeValue =
      demoRadio === "percentageInput" ? percentageRateHike : flatRateHike;

    if (!hikeValue || parseFloat(hikeValue) <= 0) {
      showNotification(
        "error",
        `Please enter a valid ${
          demoRadio === "percentageInput" ? "percentage" : "flat"
        } hike value`
      );
      return;
    }

    try {
      setIsLoading(true);
      const hikedData = tableData.map((row) => {
        const newRow = { ...row };

        for (let i = 1; i <= 35; i++) {
          const zoneKey = `${i}`;
          if (newRow[zoneKey] !== null && newRow[zoneKey] !== undefined) {
            if (demoRadio === "percentageInput") {
              newRow[zoneKey] = parseFloat(
                (newRow[zoneKey] * (1 + parseFloat(hikeValue) / 100)).toFixed(2)
              );
            } else {
              newRow[zoneKey] = parseFloat(
                (newRow[zoneKey] + parseFloat(hikeValue)).toFixed(2)
              );
            }
          }
        }

        return newRow;
      });

      setHikedTableData(hikedData);
      setShowHikedRates(true);

      showNotification(
        "success",
        `Rate hike of ${hikeValue}${
          demoRadio === "percentageInput" ? "%" : ""
        } calculated successfully. Toggle between Original/Hiked rates above.`
      );
    } catch (error) {
      console.error("Error calculating hike:", error);
      showNotification("error", "Failed to calculate rate hike");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowOriginal = () => {
    setShowHikedRates(false);
  };

  const handleShowHiked = () => {
    if (hikedTableData.length > 0) {
      setShowHikedRates(true);
    } else {
      showNotification(
        "error",
        "No hiked rates calculated yet. Click 'Hike' first."
      );
    }
  };

  // Updated handleSaveTariff to show confirmation modal
  const handleSaveTariff = async () => {
    if (!hikedTableData.length) {
      showNotification(
        "error",
        "No hiked rates to save. Please calculate hike first."
      );
      return;
    }

    // Prepare the data for confirmation
    const saveData = {
      hikeType: demoRadio === "percentageInput" ? "Percentage" : "Flat",
      hikeValue:
        demoRadio === "percentageInput" ? percentageRateHike : flatRateHike,
      affectedRows: hikedTableData.length,
      customer: customerCode || "N/A",
      service: selectedService || "N/A",
      rateTariff: selectedRateTariff || "N/A",
    };

    setPendingSaveData(saveData);
    setShowConfirmationModal(true);
  };

  // Actual save function after confirmation
  const confirmSaveTariff = async () => {
    try {
      setIsLoading(true);
      console.log(
        "Bulk saving hiked tariff updates for",
        hikedTableData.length,
        "rows"
      );

      showNotification(
        "info",
        `Saving ${hikedTableData.length} rate sheets to database...`
      );

      const updates = hikedTableData.map((row) => {
        const update = { ...row };

        if (!update._id) {
          throw new Error(
            `Missing _id for row with shipper: ${row.shipper}, service: ${row.service}`
          );
        }

        return update;
      });

      console.log("Sending bulk update with data structure:", updates[0]);

      const res = await axios.put(`${server}/rate-hike`, updates);

      console.log("Bulk save response:", res.data);

      if (res.data.modifiedCount > 0) {
        setTableData(hikedTableData);
        setShowHikedRates(false);

        // Reset hike values after successful save
        setValue("percentageRateHike", "");
        setValue("flatRateHike", "");

        showNotification(
          "success",
          `Successfully saved ${res.data.modifiedCount} rate sheets to database`
        );
      } else {
        showNotification(
          "warning",
          `No rates were modified. They may already have the same values.`
        );
      }
    } catch (error) {
      console.error("Error saving tariff:", error);

      let errorMessage = "Failed to save tariff";
      if (error.response?.data?.error) {
        errorMessage += `: ${error.response.data.error}`;
      } else if (error.message) {
        errorMessage += `: ${error.message}`;
      }

      showNotification("error", errorMessage);
    } finally {
      setIsLoading(false);
      setShowConfirmationModal(false);
      setPendingSaveData(null);
    }
  };

  // Cancel save operation
  const cancelSaveTariff = () => {
    setShowConfirmationModal(false);
    setPendingSaveData(null);
    showNotification("info", "Save operation cancelled");
  };

  // Clear search when zone list data changes
  useEffect(() => {
    if (zoneListData.length > 0) {
      setValue("searchZoneList", "");
    }
  }, [zoneListData]);

  // customer → rate tariffs
  useEffect(() => {
    if (customerCode) {
      fetchRateTariffs(customerCode);
    } else {
      setRateTariffs([]);
      setRateTariffRaw([]);
      setServices([]);
      setCountryValue("");
      setZoneTariffValue("");
      setTableData([]);
      setHikedTableData([]);
      setShowHikedRates(false);
      setZoneListData([]);
      setValue("rateTariff", "");
      setValue("service", "");
      setValue("country", "");
      setValue("zoneTariff", "");
      setValue("searchZoneList", "");
    }
  }, [customerCode]);

  // rate tariff → fetch services and zone
  useEffect(() => {
    if (selectedRateTariff) {
      console.log("Rate tariff selected:", selectedRateTariff);
      fetchAvailableServices(selectedRateTariff);
      fetchZone(selectedRateTariff);

      setCountryValue("");
      setValue("country", "");
      setValue("service", "");

      setTableData([]);
      setHikedTableData([]);
      setShowHikedRates(false);
      setZoneListData([]);
      setValue("searchZoneList", "");
    } else {
      setServices([]);
      setZoneTariffValue("");
      setValue("zoneTariff", "");
      setCountryValue("");
      setValue("country", "");
      setTableData([]);
      setHikedTableData([]);
      setShowHikedRates(false);
      setZoneListData([]);
      setValue("searchZoneList", "");
    }
  }, [selectedRateTariff]);

  return (
    <div className="flex flex-col gap-4">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={cancelSaveTariff}
        onConfirm={confirmSaveTariff}
        title="Confirm Save Tariff"
        message={
          pendingSaveData
            ? `Are you sure you want to save the tariff with ${pendingSaveData.hikeType.toLowerCase()} hike of ${
                pendingSaveData.hikeValue
              }${pendingSaveData.hikeType === "Percentage" ? "%" : ""}?
          
          This will update ${pendingSaveData.affectedRows} rate sheets for:
          • Customer: ${pendingSaveData.customer}
          • Service: ${pendingSaveData.service}
          • Rate Tariff: ${pendingSaveData.rateTariff}
          
          This action cannot be undone.`
            : ""
        }
        confirmText="Save Tariff"
        cancelText="Cancel"
        isLoading={isLoading}
      />

      <Heading
        title={`Rate Hike`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex gap-4">
        <div className="flex w-2/3 flex-col gap-3">
          <div className="flex gap-4">
            <InputBox
              value="customerName"
              placeholder="Customer"
              setValue={setValue}
              register={register}
            />

            <InputBox
              value={`branch`}
              placeholder={`Branch`}
              setValue={setValue}
              register={register}
              disabled
              initialValue={branchValue}
            />
          </div>
          <div className="flex gap-4">
            <LabeledDropdown
              title="Rate Tariff"
              value="rateTariff"
              options={rateTariffs}
              register={register}
              setValue={setValue}
            />

            <InputBox
              value="zoneTariff"
              placeholder="Zone Tariff"
              setValue={setValue}
              register={register}
              disabled
              initialValue={zoneTariffValue}
            />
          </div>
          <div className="flex gap-4">
            <LabeledDropdown
              title="Service"
              value="service"
              options={services}
              register={register}
              setValue={setValue}
            />

            <InputBox
              value="country"
              placeholder="Country"
              setValue={setValue}
              register={register}
              disabled
              initialValue={countryValue}
            />

            <div>
              <OutlinedButtonRed
                label="Show"
                type="button"
                onClick={handleShow}
              />
            </div>
          </div>

          {/* Rate Display Toggle */}
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded border">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Rate Display:</span>
              <div className="flex gap-2">
                <button
                  onClick={handleShowOriginal}
                  className={`px-3 py-1 rounded text-sm ${
                    !showHikedRates
                      ? "bg-white text-red border-[1px] rounded-md font-semibold tracking-wide text-xs border-red"
                      : "bg-white text-red border-[1px] rounded-md font-semibold tracking-wide text-xs border-red opacity-70"
                  }`}
                  type="button"
                >
                  Original Rates
                </button>
                <button
                  onClick={handleShowHiked}
                  className={`px-3 py-1 rounded text-sm ${
                    showHikedRates
                      ? "bg-red text-white font-semibold text-xs rounded-md tracking-wide"
                      : "bg-red text-white font-semibold text-xs rounded-md tracking-wide opacity-70"
                  }`}
                  type="button"
                >
                  Hiked Rates
                </button>
              </div>
            </div>
            <div className="text-sm">
              {showHikedRates ? (
                <span className="text-green-600 font-semibold">
                  ✓ Showing Calculated Hike
                </span>
              ) : (
                <span className="text-red font-semibold">
                  Showing Original Rates
                </span>
              )}
            </div>
          </div>

          <div className="">
            <TableWithSorting
              name="rateHike"
              register={register}
              setValue={setValue}
              columns={rateColumns}
              rowData={
                showHikedRates && hikedTableData.length > 0
                  ? hikedTableData
                  : tableData
              }
              className="bg-white border rounded h-[35vh]"
            />
          </div>
          <div className="flex gap-4 items-center">
            <RadioButtonLarge
              id={"percentageInput"}
              label={`Rate Hike Percentage (%)`}
              name={`percentageInput`}
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={setDemoRadio}
            />
            <RadioButtonLarge
              id={`flatInput`}
              label={`Flat Hike`}
              name={`flatInput`}
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={setDemoRadio}
            />
          </div>
        </div>

        <div className="w-1/3 flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            <div className="w-5/6">
              <InputBox
                value={`searchZoneList`}
                placeholder={`Search in Service, Sector, Zone, Destination...`}
                setValue={setValue}
                register={register}
              />
            </div>
            <div className="flex items-center w-1/6 justify-center text-xs font-semibold tracking-wide bg-red text-white px-2 py-1 rounded">
              {searchStats.isFiltered ? (
                <span className="">
                  {searchStats.filtered}/{searchStats.total}
                </span>
              ) : (
                <span> ~ </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="">
              <TableWithSorting
                name="zoneList"
                register={register}
                setValue={setValue}
                columns={zoneListColumns}
                rowData={filteredZoneList}
                className={`bg-white border rounded h-[50.2vh]`}
              />
            </div>

            {/* Search result summary */}
            {searchStats.isFiltered && (
              <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded border">
                Showing {searchStats.filtered} of {searchStats.total} zones
                matching "
                <span className="font-semibold">{searchStats.searchTerm}</span>"
              </div>
            )}

            <div>
              {demoRadio === "percentageInput" ? (
                <InputBox
                  value={`percentageRateHike`}
                  placeholder={`Hike Rate%`}
                  setValue={setValue}
                  register={register}
                />
              ) : (
                <InputBox
                  value={`flatRateHike`}
                  placeholder={`Flat Hike`}
                  setValue={setValue}
                  register={register}
                />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="flex w-full items-center">
              <div className="flex gap-4 w-full">
                <OutlinedButtonRed
                  label={`Hike`}
                  type="button"
                  onClick={handleHike}
                />
                <SimpleButton
                  name={`Save Tariff`}
                  type="button"
                  onClick={handleSaveTariff}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateHike;

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        <div className="mb-6">
          <p className="text-gray-700 whitespace-pre-line">{message}</p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red hover:bg-red-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red disabled:opacity-50 flex items-center"
          >
            {isLoading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
