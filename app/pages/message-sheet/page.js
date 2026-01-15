"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { InputBoxYellow } from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithCTA, TableWithSorting } from "@/app/components/Table";
import React, { useMemo, useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

const MessageSheet = () => {
  const { register, setValue, watch } = useForm();
  const [resetFactor, setResetFactor] = useState(false);

  // Checkbox states
  const [enableWithoutClub, setEnableWithoutClub] = useState(false);
  const [orderbyBagNo, setOrderbyBagNo] = useState(false);
  const [orderBagFRA, setOrderBagFRA] = useState(false);

  // Data states
  const [tableData, setTableData] = useState([]);
  const [allShipmentData, setAllShipmentData] = useState([]);
  const [runData, setRunData] = useState(null);
  const [loading, setLoading] = useState(false);
  const { server } = useContext(GlobalContext);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Watch run number input
  const runNumber = watch("runNumber");

  // Table columns - updated to match the API response
  const columns = useMemo(
    () => [
      { key: "sno", label: "S.No." },
      // { key: "clubNo", label: "Club No" },
      { key: "awbNo", label: "AWB No" },
      { key: "consignee", label: "CONSIGNEE" },
      { key: "pcs", label: "PCS" },
      { key: "runNo", label: "Run No" },
      { key: "dummy", label: "DUMMY" },
      { key: "bagNo", label: "Bag No" },
      { key: "bagWeight", label: "Bag Weight" },
      { key: "forwardingNo", label: "Forwarding No" },
      { key: "service", label: "Service" },
    ],
    []
  );

  // API Functions
  const fetchRunData = async (runNo) => {
    const response = await axios.get(`${server}/run-entry?runNo=${runNo}`);
    return response.data;
  };

  const fetchShipmentDataByRunNo = async (runNo) => {
    try {
      const response = await axios.get(
        `${server}/portal/create-shipment?runNo=${runNo}`
      );
      console.log("API Response:", response.data);
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      console.error("Error fetching shipment data:", error);
      showNotification("error", "Failed to fetch shipment data");
      return [];
    }
  };

  const fetchBaggingDataByRunNo = async (runNo) => {
    try {
      const response = await axios.get(`${server}/bagging?runNo=${runNo}`);
      console.log("Bagging API Response:", response.data);
      return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
      console.error("Error fetching bagging data:", error);
      showNotification("error", "Failed to fetch bagging data");
      return [];
    }
  };

  // Data Processing Functions
  const processShipmentData = (shipmentData, baggingData = []) => {
    console.log("Processing shipment data:", shipmentData);
    const processedData = [];

    if (!Array.isArray(shipmentData)) {
      console.log("Shipment data is not array, converting...");
      shipmentData = [shipmentData];
    }

    shipmentData.forEach((shipment, index) => {
      if (!shipment) return;

      console.log("Processing shipment:", shipment);

      // Find corresponding bagging data for this shipment
      const baggingInfo = baggingData.find(
        (bag) => bag.awbNo === shipment.awbNo || bag.runNo === shipment.runNo
      );

      // Extract consignee address - handle different field structures
      const consigneeFields = [
        shipment.receiverFullName ||
          shipment.consignee ||
          shipment.receiver?.name,
        shipment.receiverAddressLine1 ||
          shipment.receiverAddress ||
          shipment.receiver?.address1,
        shipment.receiverAddressLine2 || shipment.receiver?.address2,
        shipment.receiverCity || shipment.receiver?.city,
        shipment.receiverState || shipment.receiver?.state,
        shipment.receiverPincode || shipment.receiver?.pincode,
      ].filter(Boolean);

      const consigneeAddress =
        consigneeFields.length > 0
          ? consigneeFields.join(", ")
          : "Address not available";

      // Extract PCS - try different possible fields
      let pcsValue = shipment.pcs || 0;
      if (!pcsValue && shipment.boxes && Array.isArray(shipment.boxes)) {
        pcsValue = shipment.boxes.length;
      }
      if (!pcsValue && shipment.totalPcs) {
        pcsValue = shipment.totalPcs;
      }

      // Create table row with proper mapping
      const tableRow = {
        sno: index + 1,
        clubNo: baggingInfo?.totalClubNo || "",
        awbNo: shipment.awbNo || shipment.awb || "",
        consignee: consigneeAddress,
        pcs: pcsValue,
        runNo: shipment.runNo || "",
        dummy: "",
        bagNo: baggingInfo?.rowData?.[0]?.bagNo || baggingInfo?.bagNo || "",
        bagWeight:
          baggingInfo?.rowData?.[0]?.bagWeight || baggingInfo?.bagWeight || "",
        forwardingNo: shipment.forwardingNo || "",
        service: shipment.service || "",
      };

      console.log("Created table row:", tableRow);
      processedData.push(tableRow);
      showNotification("success", "Data loaded successfully");
    });

    console.log("Final processed data:", processedData);
    return processedData;
  };

  const applyFiltersAndSorting = (data) => {
    let filteredData = [...data];

    // Filter: Without Clubbing - show only items without club number
    if (enableWithoutClub) {
      filteredData = filteredData.filter(
        (item) => !item.clubNo || item.clubNo === ""
      );
    }

    // Sort: Order by Bag Number
    if (orderbyBagNo) {
      filteredData.sort((a, b) => {
        const bagA = a.bagNo || "";
        const bagB = b.bagNo || "";
        return bagA.localeCompare(bagB, undefined, { numeric: true });
      });
    }

    // Sort: Order Bag [FRA] - FRA bags first
    if (orderBagFRA) {
      filteredData.sort((a, b) => {
        const aHasFRA = (a.bagNo || "").toLowerCase().includes("fra");
        const bHasFRA = (b.bagNo || "").toLowerCase().includes("fra");

        if (aHasFRA && !bHasFRA) return -1;
        if (!aHasFRA && bHasFRA) return 1;
        return 0;
      });
    }

    return filteredData;
  };

  // Main function - Show button click
  const handleShowData = async () => {
    const runNo = runNumber?.trim();

    if (!runNo) {
      showNotification("error", "Please enter a run number");
      return;
    }

    try {
      setLoading(true);
      console.log("=== Starting data fetch for run number:", runNo, "===");

      // Fetch shipment data from create-shipment API
      console.log("Fetching shipment data...");
      const shipmentData = await fetchShipmentDataByRunNo(runNo);
      console.log("✓ Shipment data fetched:", shipmentData);

      // Fetch bagging data from bagging API
      console.log("Fetching bagging data...");
      const baggingData = await fetchBaggingDataByRunNo(runNo);
      console.log("✓ Bagging data fetched:", baggingData);

      // Check if we have shipment data
      if (
        !shipmentData ||
        (Array.isArray(shipmentData) && shipmentData.length === 0)
      ) {
        console.log("❌ No shipment data found");
        showNotification("error", "No shipment data found");
        setTableData([]);
        return;
      }

      // Process the data to create table rows
      console.log("Processing data...");
      const processedData = processShipmentData(shipmentData, baggingData);
      console.log("✓ Data processed:", processedData);

      if (processedData.length === 0) {
        console.log("❌ No processed data available");
        showNotification("error", "No valid data found to display");
        return;
      }

      // Apply filters and sorting
      console.log("Applying filters and sorting...");
      const finalData = applyFiltersAndSorting(processedData);
      console.log("✓ Final data ready:", finalData);

      // Update table
      setTableData(finalData);
      setAllShipmentData(processedData); // Store unfiltered data for re-filtering

      console.log("✅ Table updated successfully!");
      showNotification("success", "Data loaded successfully");
    } catch (error) {
      console.error("❌ Error in handleShowData:", error);
      showNotification("error", "Error loading data");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Form auto-fill from run data (following BagReport pattern)
  const fillFormFromRunData = (runData) => {
    if (!runData || typeof runData !== "object") {
      console.log("Invalid run data for auto-fill:", runData);
      showNotification("error", "Invalid run data for auto-fill");
      return;
    }

    console.log("Auto-filling form with data:", runData);

    const fields = {
      sector: runData.sector || "",
      date: runData.date
        ? new Date(runData.date).toLocaleDateString("en-GB")
        : "",
      counterpart: runData.counterpart || "",
      flight:
        runData.flight || runData.flightnumber || runData.flightNumber || "",
      obc: runData.obc || "",
      almawb: runData.almawb || runData.alMawb || "",
    };

    Object.entries(fields).forEach(([key, value]) => setValue(key, value));
  };

  const clearForm = () => {
    const fields = ["sector", "date", "counterpart", "flight", "obc", "almawb"];
    fields.forEach((field) => setValue(field, ""));
    setTableData([]);
    setAllShipmentData([]);
  };

  const handleDownload = () => {
    if (tableData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    // Create CSV content
    const headers = columns.map((col) => col.label).join(",");
    const rows = tableData
      .map((row) => columns.map((col) => `"${row[col.key] || ""}"`).join(","))
      .join("\n");

    const csvContent = `${headers}\n${rows}`;

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `message_sheet_${runNumber || "data"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Fetch run data when runNumber changes (following BagReport pattern)
  useEffect(() => {
    const fetchAndFillRunData = async () => {
      if (runNumber?.trim()) {
        try {
          console.log("Fetching run data for:", runNumber);
          const fetchedRunData = await fetchRunData(runNumber);
          console.log("Run data fetched:", fetchedRunData);
          setRunData(fetchedRunData);
          fillFormFromRunData(fetchedRunData);
        } catch (error) {
          console.error("Error fetching run data:", error);
          // Clear form if run not found
          setRunData(null);
          clearForm();
        }
      } else {
        // Clear form when run number is empty
        setRunData(null);
        clearForm();
      }
    };

    const timeoutId = setTimeout(() => {
      fetchAndFillRunData();
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [runNumber, setValue]);

  // Re-apply filters when checkbox states change
  useEffect(() => {
    if (allShipmentData.length > 0) {
      const reprocessedData = applyFiltersAndSorting(allShipmentData);
      setTableData(reprocessedData);
    }
  }, [enableWithoutClub, orderbyBagNo, orderBagFRA, allShipmentData]);

  const handleRefresh = () => {
    setTableData([]);
    setAllShipmentData([]);
    clearForm();
    setValue("runNumber", "");
    setResetFactor((prev) => !prev);
  };

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      
      <Heading
        title="Message Sheet"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex flex-col gap-3">
        <RedLabelHeading label="Run Details" />

        <div className="flex flex-col gap-3">
          {/* First Row - Run Number, Sector, Date, Counterpart */}
          <div className="flex gap-3 w-full">
            <InputBoxYellow
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              value="runNumber"
              resetFactor={resetFactor}
            />
            <DummyInputBoxWithLabelDarkGray
              label="Sector"
              register={register}
              setValue={setValue}
              value="sector"
            />
            <DummyInputBoxWithLabelDarkGray
              register={register}
              label="Date"
              setValue={setValue}
              value="date"
            />
            <DummyInputBoxWithLabelDarkGray
              register={register}
              label="Counterpart"
              setValue={setValue}
              value="counterpart"
            />
          </div>

          {/* Second Row - Flight, OBC, A/L Mawb, Buttons */}
          <div className="flex gap-3 w-full justify-between items-center">
            <div className="flex gap-3 flex-1">
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="Flight"
                setValue={setValue}
                value="flight"
              />
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="OBC"
                setValue={setValue}
                value="obc"
              />
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="A/L Mawb"
                setValue={setValue}
                value="almawb"
              />
            </div>
            
            <div className="flex gap-3 w-[24%]">
              <OutlinedButtonRed
                label={loading ? "Loading..." : "Show"}
                onClick={handleShowData}
                type="button"
                disabled={loading}
              />
              <SimpleButton
                name="Download"
                onClick={handleDownload}
                type="button"
              />
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex gap-3">
          <RedCheckbox
            isChecked={enableWithoutClub}
            setChecked={setEnableWithoutClub}
            id="enableWithoutClub"
            register={register}
            setValue={setValue}
            label="Without Clubbing"
          />
          <RedCheckbox
            isChecked={orderbyBagNo}
            setChecked={setOrderbyBagNo}
            id="orderbyBagNo"
            register={register}
            setValue={setValue}
            label="Order by Bag No."
          />
          <RedCheckbox
            isChecked={orderBagFRA}
            setChecked={setOrderBagFRA}
            id="orderBagFRA"
            register={register}
            setValue={setValue}
            label="Order Bag [FRA]"
          />
        </div>

        {/* Data Table */}
        <TableWithSorting
          columns={columns}
          rowData={tableData}
          register={register}
          setValue={setValue}
          name="messageSheet"
        />
      </div>
    </div>
  );
};

export default MessageSheet;