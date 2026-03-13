"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { InputBoxYellow, SearchInputBox } from "@/app/components/InputBox";
import {
  TableWithCheckbox,
  TableWithCheckboxEditDelete,
} from "@/app/components/Table";
import Image from "next/image";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";
import JsBarcode from "jsbarcode";
import { jsPDF } from "jspdf";
import { useAlertCheck } from "@/app/hooks/useAlertCheck";
import { AlertModal } from "@/app/components/AlertModal";

// Barcode Scanner Modal Component
const BarcodeScannerModal = ({ isOpen, onClose, onConfirm, awbNo }) => {
  const [barcodeValue, setBarcodeValue] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setBarcodeValue("");
      setIsScanning(true);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (barcodeValue.trim()) {
      onConfirm(barcodeValue.trim());
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleConfirm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Scan Barcode</h3>
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            AWB: <span className="font-semibold">{awbNo}</span>
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Please scan the barcode or enter manually
          </p>
          <div className="relative">
            <input
              type="text"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Scan barcode here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              autoFocus
            />
            {isScanning && !barcodeValue && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-pulse text-red-500">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!barcodeValue.trim()}
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Custom Input Components
const BagNumberInput = ({ value, onChange, disabled, placeholder }) => {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  );
};

const AwbNumberInput = ({
  value,
  onChange,
  disabled,
  placeholder,
  isValidating,
}) => {
  return (
    <div className="relative">
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      {isValidating && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
        </div>
      )}
    </div>
  );
};

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, awbNo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete AWB{" "}
          <span className="font-semibold">{awbNo}</span>?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red transition-colors"
          >
            Yes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

const EditWeightModal = ({ isOpen, onClose, onConfirm, currentWeight }) => {
  const [weight, setWeight] = useState(currentWeight || "");

  useEffect(() => {
    if (isOpen) {
      setWeight(currentWeight || "");
    }
  }, [currentWeight, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (weight && parseFloat(weight) > 0) {
      onConfirm(weight);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Edit Weight</h3>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red"
            placeholder="Enter weight"
            autoFocus
          />
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!weight || parseFloat(weight) <= 0}
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

const AwbValidationErrorModal = ({ isOpen, onClose, error }) => {
  if (!isOpen || !error) return null;

  const getErrorTitle = () => {
    if (error.type === "duplicate_run") return "Duplicate AWB in Current Run";
    if (error.type === "duplicate_club") return "Duplicate AWB in Club";
    if (error.type === "duplicate_other_run")
      return "Already bagged in Another Run";
    if (error.type === "sector_mismatch") return "Sector Mismatch";
    if (error.type === "on_hold") return "AWB On Hold";
    if (error.type === "not_found") return "AWB Not Found";
    return "Validation Error";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <h3 className="text-lg font-semibold mt-4 text-gray-900">
            {getErrorTitle()}
          </h3>
          <div className="mt-4">
            <p className="text-sm text-gray-700 mb-2">
              AWB:{" "}
              <span className="font-semibold text-gray-900">{error.awbNo}</span>
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-3">
              <p className="text-sm text-gray-800">{error.message}</p>
              {error.details && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">{error.details}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const BaggingWithBarcode = () => {
  const {
    handleSubmit,
    register,
    setValue,
    reset,
    watch,
    getValues,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      bagNo: "1",
      bagDetails: "",
      awbNo: "",
      barcodeNo: "",
      weight: "",
      remarks: "",
    },
  });

  const [rowData, setRowData] = useState([]);
  const [shipmentDetailsData, setShipmentDetailsData] = useState([]);
  const [isDisabled, setIsDisabled] = useState(true);
  const [isFinalised, setIsFinalised] = useState(false);
  const [selectedBag, setSelectedBag] = useState("");
  const [clubbingData, setClubbingData] = useState([]);
  const [baggingReset, setBaggingReset] = useState(false);
  const [isValidatingAwb, setIsValidatingAwb] = useState(false);
  const [existingBaggingData, setExistingBaggingData] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editWeightModalOpen, setEditWeightModalOpen] = useState(false);
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editRowData, setEditRowData] = useState(null);
  const [searchAwbNo, setSearchAwbNo] = useState("");
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const [bagNumberValue, setBagNumberValue] = useState("1");
  const [awbNumberValue, setAwbNumberValue] = useState("");

  const { server } = useContext(GlobalContext);
  const { checkAlert } = useAlertCheck();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", awbNo: "" });
  const [validationErrorModalOpen, setValidationErrorModalOpen] =
    useState(false);
  const [validationError, setValidationError] = useState(null);

  const awbNo = watch("awbNo");
  const formatDateToDDMMYYYY = (dateValue) => {
  if (!dateValue) return "";
  
  try {
    const date = new Date(dateValue);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return "";
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
};

  useEffect(() => {
    const checkForAlerts = async () => {
      if (awbNo && awbNo.trim().length >= 4) {
        const alertResult = await checkAlert(awbNo.trim());
        if (alertResult.hasAlert) {
          setAlertData({
            message: alertResult.message,
            awbNo: alertResult.awbNo,
          });
          setAlertModalOpen(true);
        }
      }
    };

    const timeoutId = setTimeout(checkForAlerts, 800);
    return () => clearTimeout(timeoutId);
  }, [awbNo, checkAlert]);

  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const resetClubDetails = useCallback(() => {
    setValue("totalClubNo", "0");
    setValue("totalAwb", "0");
    setValue("totalWeight", "0");
    setValue("uniqueId", "");
  }, [setValue]);

  const fetchExistingBaggingData = useCallback(
    async (runNo) => {
      if (!runNo || typeof runNo !== "string") {
        setExistingBaggingData(null);
        setRowData([]);
        setShipmentDetailsData([]);
        setValue("bagNo", "1");
        setBagNumberValue("1");
        return null;
      }

      try {
        const response = await axios.get(
          `${server}/bagging-with-barcode?runNo=${runNo.toUpperCase()}`
        );
        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        if (data && data.rowData) {
          setExistingBaggingData(data);
          setRowData(data.rowData || []);

          // Fetch shipment details for all AWBs
          const detailsPromises = data.rowData.map(async (row) => {
            const awb = row.childShipment || row.awbNo;
            if (awb) {
              try {
                const detailsResponse = await axios.get(
                  `${server}/bagging-with-barcode?awbNo=${awb}&fullDetails=true`
                );
                return detailsResponse.data;
              } catch (error) {
                console.error(`Error fetching details for ${awb}:`, error);
                return null;
              }
            }
            return null;
          });

          const details = await Promise.all(detailsPromises);
          setShipmentDetailsData(details.filter(Boolean));

          const uniqueBagNumbers = [
            ...new Set(data.rowData.map((row) => parseInt(row.bagNo) || 0)),
          ];
          const maxBagNo = Math.max(...uniqueBagNumbers);
          const nextBagNo = (maxBagNo + 1).toString();
          setValue("bagNo", nextBagNo);
          setBagNumberValue(nextBagNo);

          return data;
        } else {
          setValue("bagNo", "1");
          setBagNumberValue("1");
        }

        return null;
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error fetching bagging data:", error.message);
        }
        setExistingBaggingData(null);
        setRowData([]);
        setShipmentDetailsData([]);
        setValue("bagNo", "1");
        setBagNumberValue("1");
        return null;
      }
    },
    [server, setValue]
  );

  const fetchRunEntry = useCallback(
    async (runNo) => {
      if (!runNo || typeof runNo !== "string") return null;

      try {
        const encodedRunNo = encodeURIComponent(runNo.trim());
        await new Promise((resolve) => setTimeout(resolve, 100));

        const response = await axios.get(
          `${server}/run-entry?runNo=${encodedRunNo}`,
          {
            timeout: 10000,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        return response.data;
      } catch (error) {
        console.error("Error fetching run entry:", error);
        return null;
      }
    },
    [server]
  );

  const calculateAndSetClubDetails = useCallback(
    (clubbingDataArray) => {
      if (!clubbingDataArray?.length) {
        resetClubDetails();
        return;
      }

      const uniqueClubNos = new Set();
      let totalAwb = 0;
      let totalWeight = 0;

      clubbingDataArray.forEach((club) => {
        if (club.clubNo) uniqueClubNos.add(club.clubNo);
        if (club.rowData?.length) {
          totalAwb += club.rowData.length;
          club.rowData.forEach((row) => {
            totalWeight += parseFloat(row.weight) || 0;
          });
        }
      });

      setValue("totalClubNo", uniqueClubNos.size.toString());
      setValue("totalAwb", totalAwb.toString());
      setValue("totalWeight", totalWeight.toFixed(2));
    },
    [setValue, resetClubDetails]
  );

  const fetchClubbingData = useCallback(
    async (runNo) => {
      if (!runNo || typeof runNo !== "string") {
        setClubbingData([]);
        resetClubDetails();
        return;
      }

      try {
        const response = await axios.get(`${server}/clubbing?runNo=${runNo.toUpperCase()}`);
        const data = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setClubbingData(data);
        calculateAndSetClubDetails(data);
      } catch (error) {
        if (error.response?.status === 404) {
          setClubbingData([]);
          resetClubDetails();
        } else {
          console.error("Error fetching clubbing data:", error);
          setClubbingData([]);
          resetClubDetails();
        }
      }
    },
    [server, calculateAndSetClubDetails, resetClubDetails]
  );

  const fetchAwbDetails = useCallback(
    async (awbNo) => {
      if (!awbNo || typeof awbNo !== "string") {
        setValue("forwardingNo", "");
        setValue("weight", "");
        setValue("remarks", "");
        return;
      }

      try {
        setIsValidatingAwb(true);

        const response = await axios.get(
          `${server}/bagging-with-barcode?awbNo=${awbNo}`
        );
        const awbDetails = response.data;

        if (!awbDetails) {
          showNotification("error", `AWB ${awbNo} not found`);
          setValue("forwardingNo", "");
          setValue("weight", "");
          setValue("remarks", "");
          setIsValidatingAwb(false);
          return;
        }

        if (awbDetails.isHold === true) {
          const awbType = awbDetails.type === "child" ? "Child AWB" : "AWB";
          const masterInfo =
            awbDetails.type === "child"
              ? ` (Master AWB: ${awbDetails.masterAwbNo})`
              : "";

          setValidationError({
            type: "on_hold",
            awbNo: awbNo,
            message: `${awbType} ${awbNo}${masterInfo} is on hold and cannot be processed.`,
            holdReason: awbDetails.holdReason || "No reason specified",
            details: `Please resolve the hold status before attempting to add this AWB to bagging.`,
          });
          setValidationErrorModalOpen(true);

          setValue("awbNo", "");
          setAwbNumberValue("");
          setValue("forwardingNo", "");
          setValue("weight", "");
          setValue("remarks", "");
          setIsValidatingAwb(false);
          return;
        }

        const weight = awbDetails.weight ? String(awbDetails.weight) : "";
        const forwardingNo =
          awbDetails.type === "child"
            ? awbDetails.masterAwbNo
            : awbDetails.shipment?.forwardingNo || "";
        const remarks =
          awbDetails.type === "child"
            ? `Child AWB of ${awbDetails.masterAwbNo}`
            : awbDetails.shipment?.operationRemark || "";

        setValue("forwardingNo", forwardingNo);
        setValue("weight", weight);
        setValue("remarks", remarks);

        // Fetch full shipment details for columnsData
        const detailsResponse = await axios.get(
          `${server}/bagging-with-barcode?awbNo=${awbNo}&fullDetails=true`
        );

        if (detailsResponse.data) {
          setShipmentDetailsData((prev) => {
            const existing = prev.find(
              (item) => item.mawbNo === awbNo || item.childAwbNo === awbNo
            );
            if (existing) return prev;
            return [...prev, detailsResponse.data];
          });
        }

        // Open barcode scanner modal after AWB details are loaded
        setBarcodeScannerOpen(true);

        const awbType = awbDetails.type === "child" ? "Child AWB" : "AWB";
        showNotification(
          "success",
          `${awbType} ${awbNo} details loaded successfully`
        );

        setIsValidatingAwb(false);
      } catch (error) {
        console.error("Error fetching AWB data:", error);

        if (error.response?.status === 404) {
          showNotification("error", `AWB ${awbNo} not found in system`);
        } else {
          showNotification("error", `AWB not found or error: ${error.message}`);
        }

        setValue("forwardingNo", "");
        setValue("weight", "");
        setValue("remarks", "");
        setIsValidatingAwb(false);
      }
    },
    [setValue, server, showNotification]
  );

  const generateMhbsNumber = useCallback(
    (uniqueId, bagNo) => {
      if (uniqueId && bagNo) {
        setValue("mhbsNo", `${uniqueId}${bagNo}`);
      } else {
        setValue("mhbsNo", "");
      }
    },
    [setValue]
  );

  const mapRunDataToForm = useCallback((runData) => {
    if (!runData) return {};

    const baseMapping = {
      runNo: runData.runNo || runData.runNumber || "",
      date: runData.date
        ? new Date(runData.date).toLocaleDateString("en-GB")
        : "",
      sector: runData.sector || "",
      obc: runData.obc || "",
    };

    const accountTypeMapping = {
      hubAirport: {
        counterPart: runData.counterpart || runData.counterPart || "",
        flight:
          runData.flight || runData.flightnumber || runData.flightNumber || "",
        alMawb: runData.almawb || runData.alMawb || "",
        Mawb: runData.mawb || runData.Mawb || "",
      },
    };

    const accountType = runData.accountType || "hubAirport";
    return {
      ...baseMapping,
      ...(accountTypeMapping[accountType] || accountTypeMapping.hubAirport),
    };
  }, []);

  const calculateRunSummary = useCallback(() => {
    const numberOfBags = new Set(rowData.map((row) => row.bagNo)).size;
    const numberOfAwb = rowData.length;
    const totalWeight = rowData.reduce(
      (sum, row) => sum + (parseFloat(row.bagWeight) || 0),
      0
    );

    return {
      numberOfBags,
      numberOfAwb,
      totalWeight: totalWeight.toFixed(2),
    };
  }, [rowData]);

  const getNextBagNumber = useCallback(() => {
    if (rowData.length === 0) return "1";
    const uniqueBagNumbers = [
      ...new Set(rowData.map((row) => parseInt(row.bagNo) || 0)),
    ];
    const maxBagNo = Math.max(...uniqueBagNumbers);
    return (maxBagNo + 1).toString();
  }, [rowData]);

  const getBagOptions = useCallback(() => {
    const bags = [...new Set(rowData.map((row) => row.bagNo))];
    return bags.sort((a, b) => parseInt(a) - parseInt(b));
  }, [rowData]);

  const calculateBagWeight = useCallback(
    (bagNo) => {
      const bagItems = rowData.filter((row) => row.bagNo === bagNo);
      const weight = bagItems.reduce(
        (sum, row) => sum + (parseFloat(row.bagWeight) || 0),
        0
      );
      return weight.toFixed(2);
    },
    [rowData]
  );

  const handleNewBag = useCallback(() => {
    const existingBags = [
      ...new Set(rowData.map((row) => parseInt(row.bagNo) || 0)),
    ];
    const maxBagNo = existingBags.length > 0 ? Math.max(...existingBags) : 0;
    const nextBagNo = (maxBagNo + 1).toString();

    setValue("bagNo", nextBagNo);
    setBagNumberValue(nextBagNo);

    const uniqueId = watch("uniqueId");
    if (uniqueId && nextBagNo) {
      generateMhbsNumber(uniqueId, nextBagNo);
    }

    setValue("awbNo", "");
    setAwbNumberValue("");
    setValue("barcodeNo", "");
    setValue("weight", "");
    setValue("forwardingNo", "");
    setValue("remarks", "");

    setEditingIndex(null);
    setEditRowData(null);
    clearErrors("awbNo");

    showNotification("success", `Switched to Bag ${nextBagNo}`);
  }, [
    setValue,
    watch,
    generateMhbsNumber,
    clearErrors,
    rowData,
    showNotification,
  ]);

  const normalizeRowDataForDisplay = useCallback((rows) => {
    return rows.map((row) => ({
      ...row,
      awbNo: row.awbNo || row.childShipment || "",
      _originalAwbNo: row.awbNo,
      _originalChildShipment: row.childShipment,
    }));
  }, []);

  const validateAwbGlobally = useCallback(
    async (awbNo, excludeIndex = null) => {
      if (!awbNo?.trim()) {
        return { isValid: false, message: "AWB Number is required" };
      }

      const trimmedAwb = awbNo.trim().toUpperCase();
      const currentRunNo = watch("runNo");
      const currentSector = watch("sector");

      try {
        setIsValidatingAwb(true);

        const localExists = rowData.some((row, index) => {
          const rowIdentifier = row.childShipment || row.awbNo;
          return (
            rowIdentifier &&
            rowIdentifier.trim().toUpperCase() === trimmedAwb &&
            index !== excludeIndex
          );
        });

        if (localExists) {
          setIsValidatingAwb(false);
          setValidationError({
            type: "duplicate_run",
            awbNo: trimmedAwb,
            message: `This AWB already exists in the current run.`,
            details: `AWB ${trimmedAwb} has already been added to this run.`,
          });
          setValidationErrorModalOpen(true);
          return {
            isValid: false,
            message: `AWB ${trimmedAwb} already exists in this run`,
          };
        }

        try {
          const awbResponse = await axios.get(
            `${server}/bagging-with-barcode?awbNo=${trimmedAwb}`
          );
          const awbData = awbResponse.data;

          if (awbData) {
            if (awbData.isHold === true) {
              setIsValidatingAwb(false);
              const awbType = awbData.type === "child" ? "Child AWB" : "AWB";
              const masterInfo =
                awbData.type === "child"
                  ? ` (Master AWB: ${awbData.masterAwbNo})`
                  : "";

              setValidationError({
                type: "on_hold",
                awbNo: trimmedAwb,
                message: `${awbType} ${trimmedAwb}${masterInfo} is on hold.`,
                holdReason: awbData.holdReason || "No reason specified",
                details: `Please resolve the hold status before processing.`,
              });
              setValidationErrorModalOpen(true);
              return {
                isValid: false,
                message: `AWB ${trimmedAwb} is on hold`,
              };
            }

            if (awbData.sector) {
              const awbSector = awbData.sector.trim().toUpperCase();
              const runSector = currentSector?.trim().toUpperCase();

              if (awbSector !== runSector) {
                setIsValidatingAwb(false);
                const awbType = awbData.type === "child" ? "Child AWB" : "AWB";
                setValidationError({
                  type: "sector_mismatch",
                  awbNo: trimmedAwb,
                  message: `Sector mismatch detected.`,
                  details: `${awbType} sector is ${awbSector}, but run sector is ${runSector}.`,
                });
                setValidationErrorModalOpen(true);
                return {
                  isValid: false,
                  message: `Sector mismatch`,
                };
              }
            }
          }
        } catch (awbError) {
          if (awbError.response?.status === 404) {
            setIsValidatingAwb(false);
            setValidationError({
              type: "not_found",
              awbNo: trimmedAwb,
              message: `AWB not found in system.`,
              details: `AWB ${trimmedAwb} does not exist.`,
            });
            setValidationErrorModalOpen(true);
            return {
              isValid: false,
              message: `AWB ${trimmedAwb} not found`,
            };
          }
        }

        setIsValidatingAwb(false);
        return {
          isValid: true,
          message: `AWB ${trimmedAwb} is available`,
        };
      } catch (error) {
        setIsValidatingAwb(false);
        console.error("Global AWB validation error:", error);
        return {
          isValid: false,
          message: "Error validating AWB",
        };
      }
    },
    [server, rowData, watch]
  );

  const getFilteredRowData = useCallback(() => {
    let filtered = rowData;

    if (selectedBag && selectedBag.trim() !== "") {
      filtered = filtered.filter((row) => row.bagNo === selectedBag);
    }

    if (searchAwbNo.trim()) {
      filtered = filtered.filter((row) => {
        const actualAwb = row.childShipment || row.awbNo || "";
        return actualAwb.toUpperCase().includes(searchAwbNo.trim());
      });
    }

    return normalizeRowDataForDisplay(filtered);
  }, [rowData, selectedBag, searchAwbNo, normalizeRowDataForDisplay]);

  const getFilteredShipmentDetails = useCallback(() => {
  if (!shipmentDetailsData.length) return [];

  let filtered = shipmentDetailsData;

  if (selectedBag && selectedBag.trim() !== "") {
    const bagAwbs = rowData
      .filter((row) => row.bagNo === selectedBag)
      .map((row) => row.childShipment || row.awbNo);

    filtered = filtered.filter((detail) =>
      bagAwbs.includes(detail.childAwbNo || detail.mawbNo)
    );
  }

  if (searchAwbNo.trim()) {
    filtered = filtered.filter((detail) => {
      const awb = detail.childAwbNo || detail.mawbNo || "";
      return awb.toUpperCase().includes(searchAwbNo.trim());
    });
  }

  // Format dates in the filtered data
  return filtered.map(detail => ({
    ...detail,
    date: formatDateToDDMMYYYY(detail.date)
  }));
}, [shipmentDetailsData, selectedBag, searchAwbNo, rowData]);

  const handleBarcodeConfirm = useCallback(
    (barcodeValue) => {
      setValue("barcodeNo", barcodeValue);
      showNotification(
        "success",
        `Barcode ${barcodeValue} scanned successfully`
      );
    },
    [setValue, showNotification]
  );

  const onSubmit = useCallback(
    async (data) => {
      if (isFinalised) return;

      if (!data.awbNo?.trim()) {
        showNotification("error", "AWB Number is required");
        return;
      }

      if (!data.bagNo) {
        showNotification("error", "Bag Number is required");
        return;
      }

      if (!data.weight || parseFloat(data.weight) <= 0) {
        showNotification("error", "Valid weight is required");
        return;
      }

      if (!data.barcodeNo?.trim()) {
        showNotification("error", "Barcode is required");
        return;
      }

      if (!data.runNo) {
        showNotification("error", "Run Number is required");
        return;
      }

      const trimmedAwb = data.awbNo.trim().toUpperCase();

      const awbValidation = await validateAwbGlobally(data.awbNo, editingIndex);
      if (!awbValidation.isValid) {
        return;
      }

      try {
        const newRow = {
          awbNo: trimmedAwb,
          bagNo: data.bagNo.toString(),
          bagWeight: parseFloat(data.weight),
          runNo: data.runNo.toString(),
          forwardingNo: data.forwardingNo || "",
          remarks: data.remarks || "",
          barcodeNo: data.barcodeNo.trim(),
          addedAt: new Date().toISOString(),
        };

        const axiosConfig = {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (editingIndex !== null) {
          const oldRow = rowData[editingIndex];
          const oldAwbNo = oldRow.childShipment || oldRow.awbNo;

          await axios.put(
            `${server}/bagging-with-barcode`,
            {
              runNo: data.runNo.toString(),
              action: "remove",
              item: { awbNo: oldAwbNo },
            },
            axiosConfig
          );

          const response = await axios.put(
            `${server}/bagging-with-barcode`,
            {
              runNo: data.runNo.toString(),
              action: "add",
              item: newRow,
            },
            axiosConfig
          );

          setRowData(response.data.rowData || rowData);
          setExistingBaggingData(response.data);

          showNotification(
            "success",
            `AWB ${trimmedAwb} updated successfully!`
          );

          setEditingIndex(null);
          setEditRowData(null);

          setValue("awbNo", "");
          setAwbNumberValue("");
          setValue("barcodeNo", "");
          setValue("weight", "");
          setValue("forwardingNo", "");
          setValue("remarks", "");
          clearErrors("awbNo");
        } else {
          if (rowData.length === 0 && !existingBaggingData) {
            const formData = getValues();

            let parsedDate = new Date();
            if (formData.date) {
              const dateParts = formData.date.split("/");
              if (dateParts.length === 3) {
                const [day, month, year] = dateParts;
                parsedDate = new Date(
                  `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
                );
              }
            }

            const baggingData = {
              runNo: data.runNo.toString(),
              date: parsedDate.toISOString(),
              sector: formData.sector || "",
              flight: formData.flight || "",
              alMawb: formData.alMawb || "",
              counterPart: formData.counterPart || "",
              obc: formData.obc || "",
              Mawb: formData.Mawb || "",
              mhbsNo: formData.mhbsNo || "",
              noOfBags: 1,
              noOfAwb: 1,
              runWeight: parseFloat(data.weight),
              totalClubNo: parseInt(formData.totalClubNo) || 0,
              totalAwb: parseInt(formData.totalAwb) || 0,
              totalWeight: parseFloat(formData.totalWeight) || 0,
              uniqueId: formData.uniqueId || "",
              remarks: data.remarks || "",
              rowData: [newRow],
            };

            const response = await axios.post(
              `${server}/bagging-with-barcode`,
              baggingData,
              axiosConfig
            );

            setExistingBaggingData(response.data);
            setRowData(response.data.rowData || [newRow]);

            showNotification(
              "success",
              `AWB ${trimmedAwb} added successfully!`
            );
          } else {
            const saveData = {
              runNo: data.runNo.toString(),
              action: "add",
              item: newRow,
            };

            const response = await axios.put(
              `${server}/bagging-with-barcode`,
              saveData,
              axiosConfig
            );

            setRowData(response.data.rowData || [...rowData, newRow]);
            setExistingBaggingData(response.data);

            showNotification(
              "success",
              `AWB ${trimmedAwb} added successfully!`
            );
          }

          setSelectedBag("");
          setValue("bagDetails", "");
          setValue("awbNo", "");
          setAwbNumberValue("");
          setValue("barcodeNo", "");
          setValue("weight", "");
          setValue("forwardingNo", "");
          setValue("remarks", "");
          clearErrors("awbNo");
        }
      } catch (error) {
        console.error("Error processing bag item:", error);

        let errorMsg = "Unknown error";

        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          errorMsg = "Request timeout. Please try again.";
        } else if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        } else if (error.message) {
          errorMsg = error.message;
        }

        showNotification("error", `Error: ${errorMsg}`);
      }
    },
    [
      setValue,
      validateAwbGlobally,
      rowData,
      existingBaggingData,
      getValues,
      server,
      editingIndex,
      isFinalised,
      showNotification,
      clearErrors,
    ]
  );

  const handleEditRow = useCallback(
    (index) => {
      if (isFinalised) return;

      const displayRow = getFilteredRowData()[index];
      if (!displayRow) return;

      const actualRowIndex = rowData.findIndex((row) => {
        const rowAwb = row.childShipment || row.awbNo;
        const displayAwb =
          displayRow._originalChildShipment || displayRow._originalAwbNo;
        return rowAwb === displayAwb && row.bagNo === displayRow.bagNo;
      });

      if (actualRowIndex === -1) return;

      const rowToEdit = rowData[actualRowIndex];

      setEditingIndex(actualRowIndex);
      setEditRowData(rowToEdit);

      const actualAwb = rowToEdit.childShipment || rowToEdit.awbNo || "";

      setTimeout(() => {
        setValue("awbNo", actualAwb);
        setAwbNumberValue(actualAwb);
        setValue("bagNo", rowToEdit.bagNo || "");
        setBagNumberValue(rowToEdit.bagNo || "");
        setValue("barcodeNo", rowToEdit.barcodeNo || "");
        setValue("weight", String(rowToEdit.bagWeight || ""));
        setValue("forwardingNo", rowToEdit.forwardingNo || "");
        setValue("remarks", rowToEdit.remarks || "");
        clearErrors("awbNo");

        showNotification("success", "Row loaded for editing");
      }, 0);
    },
    [
      rowData,
      getFilteredRowData,
      setValue,
      isFinalised,
      clearErrors,
      showNotification,
    ]
  );

  const handleDeleteRow = useCallback(
    (index) => {
      if (isFinalised) return;

      const rowToDelete = Array.isArray(index)
        ? rowData[index[0]]
        : rowData[index];
      const actualAwb = rowToDelete?.childShipment || rowToDelete?.awbNo || "";

      setItemToDelete({ index, awbNo: actualAwb });
      setDeleteModalOpen(true);
    },
    [rowData, isFinalised]
  );

  const confirmDelete = useCallback(async () => {
    try {
      const runNo = watch("runNo");

      if (!runNo) {
        showNotification("error", "Run number is required");
        setDeleteModalOpen(false);
        return;
      }

      const indexToDelete = Array.isArray(itemToDelete.index)
        ? itemToDelete.index[0]
        : itemToDelete.index;
      const rowToDelete = rowData[indexToDelete];

      if (!rowToDelete) {
        showNotification("error", "Row not found");
        setDeleteModalOpen(false);
        return;
      }

      const actualAwb = rowToDelete.childShipment || rowToDelete.awbNo;

      const axiosConfig = {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      };

      const response = await axios.put(
        `${server}/bagging-with-barcode`,
        {
          runNo: runNo.toString(),
          action: "remove",
          item: { awbNo: actualAwb },
        },
        axiosConfig
      );

      if (response.data && response.data.rowData) {
        setRowData(response.data.rowData);

        // Remove from shipment details
        setShipmentDetailsData((prev) =>
          prev.filter((detail) => {
            const detailAwb = detail.childAwbNo || detail.mawbNo;
            return detailAwb !== actualAwb;
          })
        );
      }

      showNotification("success", `AWB ${actualAwb} deleted successfully`);
      setDeleteModalOpen(false);
      setItemToDelete(null);

      await fetchExistingBaggingData(runNo);

      setSelectedBag("");
      setValue("bagDetails", "");
    } catch (error) {
      console.error("Error deleting row:", error);

      let errorMsg = "Failed to delete";

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMsg = "Request timeout. Please try again.";
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      showNotification("error", `Error: ${errorMsg}`);
      setDeleteModalOpen(false);
    }
  }, [
    rowData,
    server,
    watch,
    fetchExistingBaggingData,
    itemToDelete,
    setValue,
    showNotification,
  ]);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No." },
      { key: "bagNo", label: "Bag No." },
      { key: "barcodeNo", label: "Barcode No." },
      { key: "bagWeight", label: "Weight" },
      { key: "runNo", label: "Run No." },
    ],
    []
  );

  const columnsData = useMemo(
    () => [
      { key: "mawbNo", label: "Master AWB" },
      { key: "totalActualWeight", label: "Actual Weight" },
      { key: "date", label: "Date" },
      { key: "service", label: "Service" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "name", label: "Customer Name" },
      { key: "shippeFullName", label: "Consignor Name" },
      { key: "recieverFullName", label: "Consignee Name" },
      { key: "recieverAddress", label: "Consignee Address" },
      { key: "recieverCity", label: "Consignee City" },
      { key: "recieverPincode", label: "Consignee Pincode" },
      { key: "origin", label: "Origin" },
      { key: "content", label: "Content" },
      { key: "operationRemarks", label: "Operation Remarks" },
      { key: "isHold", label: "Hold" },
      { key: "holdReason", label: "Hold Reason" },
      { key: "paymentType", label: "Payment Type" },
      { key: "billNo", label: "Bill No" },
      { key: "awbStatus", label: "AWB Status" },
      { key: "shipmentForwardingNo", label: "Shipment Forwarding No" },
    ],
    []
  );

  const handleBagSelection = useCallback(
    (bagNo) => {
      if (selectedBag === bagNo) return;

      if (!bagNo || bagNo === "" || bagNo === "All") {
        setSelectedBag("");
        setValue("bagDetails", "");
      } else {
        setSelectedBag(bagNo);
        setValue("bagDetails", bagNo);
      }
      setSearchAwbNo("");
    },
    [setValue, selectedBag]
  );

  const handleSearchAwb = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
    setSearchAwbNo(e.target.value.toUpperCase());
  }, []);

  const handleFinalSubmit = useCallback(async () => {
    try {
      const formData = getValues();

      if (!formData.runNo) {
        showNotification("error", "Please enter a run number");
        return;
      }

      if (!rowData?.length) {
        showNotification(
          "error",
          "Please add at least one item before finalizing"
        );
        return;
      }

      const updateData = {
        runNo: formData.runNo,
        date: formData.date,
        sector: formData.sector,
        flight: formData.flight,
        alMawb: formData.alMawb,
        counterPart: formData.counterPart,
        obc: formData.obc,
        Mawb: formData.Mawb,
        mhbsNo: formData.mhbsNo,
        noOfBags: parseInt(formData.noOfBags),
        noOfAwb: parseInt(formData.noOfAwb),
        runWeight: parseFloat(formData.runWeight),
        totalClubNo: parseInt(formData.totalClubNo) || 0,
        totalAwb: parseInt(formData.totalAwb) || 0,
        totalWeight: parseFloat(formData.totalWeight) || 0,
        uniqueId: formData.uniqueId,
        remarks: formData.remarks,
      };

      const response = await axios.put(
        `${server}/bagging-with-barcode`,
        updateData
      );

      if (response.status === 200 || response.status === 201) {
        setIsFinalised(true);
        showNotification("success", "Bagging finalized successfully!");
      }
    } catch (error) {
      console.error("Error finalizing bagging data:", error);
      const errorMessage = error.response?.data?.error || "Failed to finalize";
      showNotification("error", `Error: ${errorMessage}`);
    }
  }, [getValues, rowData, server, showNotification]);

  const handleNewRun = useCallback(() => {
    setRowData([]);
    setShipmentDetailsData([]);
    reset();
    setValue("bagNo", "1");
    setBagNumberValue("1");
    setValue("bagDetails", "");
    setAwbNumberValue("");
    setSelectedBag("");
    setIsDisabled(true);
    setIsFinalised(false);
    setClubbingData([]);
    resetClubDetails();
    setExistingBaggingData(null);
    setEditingIndex(null);
    setEditRowData(null);
    setSearchAwbNo("");
    clearErrors();
    showNotification("success", "New run started");
  }, [reset, setValue, resetClubDetails, clearErrors, showNotification]);

  const handleRefresh = useCallback(() => {
    setBaggingReset(!baggingReset);
    const currentRunNo = watch("runNo");
    if (currentRunNo && typeof currentRunNo === "string") {
      fetchClubbingData(currentRunNo);
      fetchExistingBaggingData(currentRunNo);
    }
    showNotification("success", "Form refreshed");
  }, [
    baggingReset,
    fetchClubbingData,
    fetchExistingBaggingData,
    watch,
    showNotification,
  ]);

  const handlePrintAwbBarcode = useCallback(async () => {
    try {
      const formData = getValues();

      if (!rowData || rowData.length === 0) {
        showNotification("error", "No bags to print");
        return;
      }

      const uniqueId = formData.uniqueId || formData.runNo || "BAG";
      const runNo = formData.runNo || "N/A";

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [101.6, 152.4],
      });

      for (let i = 0; i < rowData.length; i++) {
        const row = rowData[i];
        const bagNo = row.bagNo;
        const awbNo = row.childShipment || row.awbNo || "N/A";
        const barcodeNo = row.barcodeNo || `${uniqueId}-${bagNo}`;

        const canvas = document.createElement("canvas");

        try {
          JsBarcode(canvas, barcodeNo, {
            format: "CODE128",
            width: 2,
            height: 80,
            displayValue: true,
            fontSize: 12,
            margin: 10,
          });

          const barcodeImage = canvas.toDataURL("image/png");
          const pageWidth = pdf.internal.pageSize.getWidth();
          const imgWidth = pageWidth - 10;
          const imgHeight = 60;
          const x = 5;
          let y = 15;

          pdf.addImage(barcodeImage, "PNG", x, y, imgWidth, imgHeight);
          y += imgHeight + 8;

          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");

          pdf.text(`Run No: ${runNo}`, x + 2, y);
          y += 7;
          pdf.text(`Bag No: ${bagNo}`, x + 2, y);
          y += 7;
          pdf.text(`AWB No: ${awbNo}`, x + 2, y);

          if (row.bagWeight) {
            y += 7;
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.text(`Weight: ${row.bagWeight} kg`, x + 2, y);
          }

          if (i < rowData.length - 1) {
            pdf.addPage([101.6, 152.4]);
          }
        } catch (barcodeError) {
          console.error(
            `Error generating barcode for bag ${bagNo}:`,
            barcodeError
          );
        }
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const filename = `Bagging_Barcodes_${
        formData.runNo || "Run"
      }_${timestamp}.pdf`;

      pdf.save(filename);

      showNotification(
        "success",
        `Barcode PDF generated for ${rowData.length} entries!`
      );
    } catch (error) {
      console.error("Error generating barcode PDF:", error);
      showNotification("error", `Error: ${error.message}`);
    }
  }, [getValues, rowData, showNotification]);

  const handleRunNoBlur = useCallback(async () => {
    const runNo = watch("runNo");

    if (!runNo || typeof runNo !== "string" || runNo.trim().length === 0) {
      return;
    }

    try {
      const runData = await fetchRunEntry(runNo.trim());

      if (runData) {
        const accountType = runData.accountType;
        if (accountType && accountType !== "hubAirport") {
          showNotification(
            "error",
            `This is not a Hub Airport run. Type: ${accountType}`
          );
          setIsDisabled(true);
          return;
        }

        const mappedData = mapRunDataToForm(runData);

        Object.keys(mappedData).forEach((key) => {
          if (key !== "runNo" && mappedData[key] !== undefined) {
            setValue(key, mappedData[key]);
          }
        });

        const uniqueId =
          runData.uniqueID || runData.uniqueId || runData.unique_id || "";

        setValue("uniqueId", uniqueId);
        setIsDisabled(false);

        await Promise.allSettled([
          fetchExistingBaggingData(runNo.trim()),
          fetchClubbingData(runNo.trim()),
        ]);

        const currentBagNo = getValues("bagNo") || "";
        generateMhbsNumber(uniqueId, currentBagNo);

        showNotification("success", `Run ${runNo} loaded successfully`);
      } else {
        setIsDisabled(true);
        setClubbingData([]);
        resetClubDetails();
        setRowData([]);
        setShipmentDetailsData([]);
        setExistingBaggingData(null);
        setSelectedBag("");

        setValue("sector", "");
        setValue("flight", "");
        setValue("alMawb", "");
        setValue("date", "");
        setValue("counterPart", "");
        setValue("obc", "");
        setValue("Mawb", "");
        setValue("uniqueId", "");
        setValue("bagNo", "");
        setBagNumberValue("");

        showNotification("error", `Run number ${runNo} not found`);
      }
    } catch (error) {
      console.error("Error processing run data:", error);
      showNotification("error", "Error loading run data");
    }
  }, [
    watch,
    fetchRunEntry,
    fetchExistingBaggingData,
    fetchClubbingData,
    mapRunDataToForm,
    setValue,
    getValues,
    generateMhbsNumber,
    resetClubDetails,
    showNotification,
  ]);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "bagNo" && value.bagNo !== bagNumberValue) {
        setBagNumberValue(value.bagNo || "");
      }
      if (name === "awbNo" && value.awbNo !== awbNumberValue) {
        setAwbNumberValue(value.awbNo || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, bagNumberValue, awbNumberValue]);

  useEffect(() => {
    const bagNo = watch("bagNo");
    const uniqueId = watch("uniqueId");

    if (uniqueId && bagNo && editingIndex === null) {
      generateMhbsNumber(uniqueId, bagNo);
    }
  }, [watch, generateMhbsNumber, editingIndex]);

  useEffect(() => {
    if (editingIndex !== null) return;

    const subscription = watch((formData, { name }) => {
      if (name !== "awbNo") return;

      const awbNo = formData.awbNo;

      if (awbNo?.trim().length >= 4) {
        const timer = setTimeout(() => {
          fetchAwbDetails(awbNo.trim());
        }, 500);

        return () => clearTimeout(timer);
      } else if (!awbNo || awbNo.trim().length < 4) {
        setValue("forwardingNo", "");
        setValue("weight", "");
        setValue("remarks", "");
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, fetchAwbDetails, setValue, editingIndex]);

  useEffect(() => {
    const runSummary = calculateRunSummary();
    setValue("noOfBags", runSummary.numberOfBags.toString());
    setValue("noOfAwb", runSummary.numberOfAwb.toString());
    setValue("runWeight", runSummary.totalWeight);
  }, [rowData, setValue, calculateRunSummary]);

  useEffect(() => {
    if (editingIndex === null && rowData.length > 0) {
      const bagNo = getValues("bagNo");
      if (bagNo) {
        const weight = calculateBagWeight(bagNo);
        const currentWeight = getValues("bagWeight");
        if (currentWeight !== weight) {
          setValue("bagWeight", weight);
        }
      }
    } else if (editingIndex === null) {
      const currentWeight = getValues("bagWeight");
      if (currentWeight !== "0.00") {
        setValue("bagWeight", "0.00");
      }
    }
  }, [rowData, calculateBagWeight, setValue, editingIndex, getValues]);

  const bagCount = getBagOptions().length;

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Header */}
        <div className="flex flex-row gap-6 items-center">
          <Heading
            title="Bagging with Barcode"
            bulkUploadBtn="hidden"
            codeListBtn="hidden"
            onRefresh={handleRefresh}
          />
          <div>
            <Image src="/print.svg" alt="" width={24} height={24} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-5">
          {/* Run Details Section */}
          <div className="flex flex-col gap-3">
            <RedLabelHeading label="Run details" />

            <div className="flex flex-col gap-4">
              {/* Row 1: Run No and Sector, Flight and A/L MAWB */}
              <div className="grid grid-cols-4 gap-3">
                <div onBlur={handleRunNoBlur}>
                  <InputBoxYellow
                    register={register}
                    placeholder="Enter Run Number"
                    setValue={setValue}
                    resetFactor={baggingReset}
                    value="runNo"
                    disabled={isFinalised}
                  />
                </div>
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Sector"
                  setValue={setValue}
                  value="sector"
                  disabled={true}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Flight"
                  setValue={setValue}
                  value="flight"
                  disabled={true}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="A/L MAWB"
                  setValue={setValue}
                  value="alMawb"
                  disabled={true}
                />
              </div>

              {/* Row 2: Date, Counter Part, OBC, MAWB */}
              <div className="grid grid-cols-4 gap-3">
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  placeholder="--/--/----"
                  label="Date"
                  setValue={setValue}
                  value="date"
                  disabled={true}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Counter Part"
                  setValue={setValue}
                  value="counterPart"
                  disabled={true}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="OBC"
                  setValue={setValue}
                  value="obc"
                  disabled={true}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="MAWB"
                  setValue={setValue}
                  value="Mawb"
                  disabled={true}
                />
              </div>
            </div>
          </div>

          {/* Main Content Area - Two Columns */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left Column - Bag Details */}
            <div className="flex flex-col gap-3">
              <RedLabelHeading label="Bag Details" />

              {/* Bag Number with New Bag Button */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <BagNumberInput
                    value={bagNumberValue}
                    onChange={(val) => {
                      setBagNumberValue(val);
                      setValue("bagNo", val);
                      const uniqueId = watch("uniqueId");
                      if (uniqueId && val) {
                        generateMhbsNumber(uniqueId, val);
                      }
                    }}
                    disabled={isFinalised}
                    placeholder="Bag Number"
                  />
                </div>
                <div className="w-35">
                  <OutlinedButtonRed
                    label="New bag"
                    type="button"
                    onClick={handleNewBag}
                    disabled={
                      isDisabled || isFinalised || editingIndex !== null
                    }
                  />
                </div>
              </div>

              {/* AWB Number Input */}
              <AwbNumberInput
                value={awbNumberValue}
                onChange={(val) => {
                  setAwbNumberValue(val);
                  setValue("awbNo", val);
                }}
                disabled={isFinalised}
                placeholder="AWB Number (Master or Child)"
                isValidating={isValidatingAwb}
              />

              {/* Barcode Number Input */}
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="Barcode No."
                setValue={setValue}
                value="barcodeNo"
                disabled={true}
              />

              {/* MHBS Number */}
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="MHBS Number"
                setValue={setValue}
                value="mhbsNo"
                disabled={true}
              />

              {/* FWD Number */}
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="FWD Number"
                setValue={setValue}
                value="forwardingNo"
                disabled={true}
              />

              {/* Weight with Edit and Add to Bag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Weight"
                  {...register("weight")}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red"
                  readOnly={true}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (isFinalised) return;
                    setEditWeightModalOpen(true);
                  }}
                  disabled={isFinalised}
                  className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors whitespace-nowrap ${
                    isFinalised
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-red text-white hover:bg-red-700"
                  }`}
                >
                  Edit
                </button>
                <div className="">
                  <OutlinedButtonRed
                    label={editingIndex !== null ? "Update AWB" : "Add to Bag"}
                    type="submit"
                    disabled={isDisabled || isValidatingAwb || isFinalised}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                
                {editingIndex !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(null);
                      setEditRowData(null);
                      setValue("awbNo", "");
                      setAwbNumberValue("");
                      setValue("barcodeNo", "");
                      setValue("weight", "");
                      setValue("forwardingNo", "");
                      setValue("remarks", "");
                      clearErrors("awbNo");
                      handleNewBag();
                    }}
                    disabled={isFinalised}
                    className={`px-4 py-2 border rounded-md whitespace-nowrap ${
                      isFinalised
                        ? "border-gray-300 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Bag Dropdown and Search */}
              <div className="flex flex-col gap-3 ">
                <div className="flex flex-row gap-2">
                  <LabeledDropdown
                    options={getBagOptions()}
                    register={register}
                    setValue={setValue}
                    title={`Bag (${bagCount}) Details`}
                    value="bagDetails"
                    onChange={handleBagSelection}
                    defaultValue={selectedBag}
                    disabled={isFinalised}
                  />
                  <SearchInputBox
                    placeholder="Search by AWB No."
                    value={searchAwbNo}
                    onChange={handleSearchAwb}
                    onKeyDown={handleSearchAwb}
                    disabled={isFinalised}
                  />
                </div>

                {/* Bagging Table */}
                <div className="w-full">
                  <TableWithCheckboxEditDelete
                    register={register}
                    setValue={setValue}
                    name="bagging"
                    columns={columns}
                    rowData={getFilteredRowData()}
                    handleEdit={handleEditRow}
                    handleDelete={handleDeleteRow}
                    disableActions={isFinalised}
                    className="h-[37vh]"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Run Summary and Club Details */}
            <div className="flex flex-col gap-3">
              {/* Run Summary and Club Details in a Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Run Summary */}
                <div className="flex flex-col gap-3">
                  <RedLabelHeading label="Run Summary" />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label="Number of Bags"
                    setValue={setValue}
                    value="noOfBags"
                    disabled={true}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label="Number of AWB"
                    setValue={setValue}
                    value="noOfAwb"
                    disabled={true}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label="Bag Weight"
                    setValue={setValue}
                    value="bagWeight"
                    disabled={true}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label="Run Weight"
                    setValue={setValue}
                    value="runWeight"
                    disabled={true}
                  />
                </div>

                {/* Club Details */}
                <div className="flex flex-col gap-3">
                  <RedLabelHeading label="Club Details" />
                  <DummyInputBoxWithLabelDarkGray
                    label="Total Club No."
                    register={register}
                    setValue={setValue}
                    value="totalClubNo"
                    disabled={true}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="Total AWB"
                    register={register}
                    setValue={setValue}
                    value="totalAwb"
                    disabled={true}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="Total Weight"
                    register={register}
                    setValue={setValue}
                    value="totalWeight"
                    disabled={true}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="Unique ID"
                    register={register}
                    setValue={setValue}
                    value="uniqueId"
                    disabled={true}
                  />
                </div>
              </div>

              {/* Remarks */}
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="Remarks"
                setValue={setValue}
                value="remarks"
                disabled={true}
              />

              {/* Shipment Details Table */}
              <div className="w-full">
                <TableWithCheckbox
                  register={register}
                  setValue={setValue}
                  name="shipmentDetails"
                  columns={columnsData}
                  rowData={getFilteredShipmentDetails()}
                  handleEdit={() => {}}
                  handleDelete={() => {}}
                  disableActions={true}
                  className="h-[46.5vh]"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex justify-between mt-4">
            <div>
              <SimpleButton
                name="New Run"
                disabled={isDisabled}
                onClick={handleNewRun}
                type="button"
              />
            </div>

            <div>
              <SimpleButton
                name="Print AWB Barcode"
                disabled={isDisabled}
                onClick={handlePrintAwbBarcode}
                type="button"
              />
            </div>

            <div>
              <SimpleButton
                name="Final"
                disabled={isDisabled || isFinalised}
                onClick={handleFinalSubmit}
                type="button"
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <BarcodeScannerModal
          isOpen={barcodeScannerOpen}
          onClose={() => setBarcodeScannerOpen(false)}
          onConfirm={handleBarcodeConfirm}
          awbNo={awbNumberValue}
        />

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete}
          awbNo={itemToDelete?.awbNo}
        />

        <EditWeightModal
          isOpen={editWeightModalOpen}
          onClose={() => setEditWeightModalOpen(false)}
          onConfirm={(newWeight) => {
            setValue("weight", newWeight);
          }}
          currentWeight={watch("weight")}
        />

        <AlertModal
          isOpen={alertModalOpen}
          onClose={() => setAlertModalOpen(false)}
          awbNo={alertData.awbNo}
          message={alertData.message}
          title="Bagging Alert"
        />

        <AwbValidationErrorModal
          isOpen={validationErrorModalOpen}
          onClose={() => {
            setValidationErrorModalOpen(false);
            setValidationError(null);
            setValue("awbNo", "");
            setAwbNumberValue("");
            clearErrors("awbNo");
          }}
          error={validationError}
        />
      </form>
    </>
  );
};

export default BaggingWithBarcode;
