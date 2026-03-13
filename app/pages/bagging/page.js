"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, {
  InputBoxYellow,
  SearchInputBox,
} from "@/app/components/InputBox";
import { TableWithCheckboxEditDelete } from "@/app/components/Table";
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

// Custom Input Component for Bag Number that properly updates
const BagNumberInput = ({ value, onChange, disabled, placeholder }) => {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-1 border text-sm border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red disabled:bg-gray-100 disabled:cursor-not-allowed"
    />
  );
};

// Custom Input Component for AWB Number that properly updates
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

const HoldReasonModal = ({ isOpen, onClose, awbNo, holdReason }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-red-600">AWB On Hold</h3>
        <div className="mb-6">
          <p className="text-gray-700 mb-3">
            AWB <span className="font-semibold">{awbNo}</span> is not available
            for bagging.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Hold Reason:
            </p>
            <p className="text-gray-800">
              {holdReason || "No reason specified"}
            </p>
          </div>
        </div>
        <div className="flex justify-center">
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
    if (error.type === "rto") return "RTO Shipment - Cannot Be Bagged"; // ✅ NEW
    if (error.type === "not_found") return "AWB Not Found";
    return "Validation Error";
  };

  const getErrorIcon = () => {
    if (error.type === "on_hold" || error.type === "rto") {
      // ✅ UPDATED
      return (
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      );
    }
    return (
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
        <svg
          className="h-6 w-6 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {getErrorIcon()}

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

            {error.type === "on_hold" && error.holdReason && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-3">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Hold Reason:
                </p>
                <p className="text-sm text-gray-800">{error.holdReason}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-red text-white rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Bagging = () => {
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
      weight: "",
      remarks: "",
    },
  });

  const [rowData, setRowData] = useState([]);
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
  const [holdReasonModalOpen, setHoldReasonModalOpen] = useState(false);
  const [holdReasonData, setHoldReasonData] = useState({
    awbNo: "",
    reason: "",
  });
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editRowData, setEditRowData] = useState(null);
  const [searchAwbNo, setSearchAwbNo] = useState("");
  const [awbFetchInProgress, setAwbFetchInProgress] = useState(false);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // State to force re-render of custom inputs
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

  // const fetchExistingBaggingData = useCallback(
  //   async (runNo) => {
  //     if (!runNo || typeof runNo !== "string") {
  //       setExistingBaggingData(null);
  //       setRowData([]);
  //       setValue("bagNo", "1");
  //       setBagNumberValue("1");
  //       return null;
  //     }

  //     try {
  //       const response = await axios.get(`${server}/bagging?runNo=${runNo}`);
  //       const data = Array.isArray(response.data)
  //         ? response.data[0]
  //         : response.data;

  //       if (data && data.rowData) {
  //         setExistingBaggingData(data);
  //         setRowData(data.rowData || []);

  //         const uniqueBagNumbers = [
  //           ...new Set(data.rowData.map((row) => parseInt(row.bagNo) || 0)),
  //         ];
  //         const maxBagNo = Math.max(...uniqueBagNumbers);
  //         const nextBagNo = (maxBagNo + 1).toString();
  //         setValue("bagNo", nextBagNo);
  //         setBagNumberValue(nextBagNo);

  //         return data;
  //       } else {
  //         setValue("bagNo", "1");
  //         setBagNumberValue("1");
  //       }

  //       return null;
  //     } catch (error) {
  //       if (error.response?.status !== 404) {
  //         console.error("Error fetching bagging data:", error.message);
  //       }
  //       setExistingBaggingData(null);
  //       setRowData([]);
  //       setValue("bagNo", "1");
  //       setBagNumberValue("1");
  //       return null;
  //     }
  //   },
  //   [server, setValue]
  // );
  const fetchExistingBaggingData = useCallback(
    async (runNo) => {
      if (!runNo || typeof runNo !== "string") {
        setExistingBaggingData(null);
        setRowData([]);
        setValue("bagNo", "1");
        setBagNumberValue("1");
        setIsFinalised(false);
        return null;
      }

      try {
        const response = await axios.get(`${server}/bagging?runNo=${runNo.toUpperCase()}`);
        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        if (data && data.rowData) {
          setExistingBaggingData(data);
          setRowData(data.rowData || []);

          // Set finalized state from database
          setIsFinalised(data.isFinal === true);

          const uniqueBagNumbers = [
            ...new Set(data.rowData.map((row) => parseInt(row.bagNo) || 0)),
          ];
          const maxBagNo = Math.max(...uniqueBagNumbers);
          const nextBagNo = (maxBagNo + 1).toString();
          setValue("bagNo", nextBagNo);
          setBagNumberValue(nextBagNo);

          // Show notification if finalized
          if (data.isFinal === true) {
            showNotification("info", "This bagging is finalized and locked");
          }

          return data;
        } else {
          setValue("bagNo", "1");
          setBagNumberValue("1");
          setIsFinalised(false);
        }

        return null;
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error fetching bagging data:", error.message);
        }
        setExistingBaggingData(null);
        setRowData([]);
        setValue("bagNo", "1");
        setBagNumberValue("1");
        setIsFinalised(false);
        return null;
      }
    },
    [server, setValue, showNotification]
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

        console.log("Run entry response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching run entry:", error);

        if (error.response?.status === 404) {
          console.log(`Run ${runNo} not found in database`);
        } else if (error.code === "ECONNABORTED") {
          console.error("Request timeout for run entry");
          showNotification("error", "Request timeout. Please try again.");
        } else {
          console.error("Network or server error:", error.message);
        }

        return null;
      }
    },
    [server, showNotification]
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
          console.log(
            `No clubbing data found for run ${runNo} - this is normal`
          );
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

  // NEW: Fetch AWB details with child AWB support
  const fetchAwbDetails = useCallback(
    async (awbNo) => {
      if (!awbNo || typeof awbNo !== "string") {
        setValue("forwardingNo", "");
        setValue("weight", "");
        setValue("remarks", "");
        return;
      }

      try {
        setAwbFetchInProgress(true);

        // Use new endpoint that checks both master and child AWBs
        const response = await axios.get(`${server}/bagging?awbNo=${awbNo}`);

        const awbDetails = response.data;

        if (!awbDetails) {
          showNotification("error", `AWB ${awbNo} not found`);
          setValue("forwardingNo", "");
          setValue("weight", "");
          setValue("remarks", "");
          setAwbFetchInProgress(false);
          return;
        }

        // Check if master AWB is on hold
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
          setAwbFetchInProgress(false);
          return;
        }

        // For child AWBs, use master AWB's weight and sector
        const weight = awbDetails.weight ? String(awbDetails.weight) : "";
        const forwardingNo =
          awbDetails.type === "child"
            ? awbDetails.masterAwbNo
            : awbDetails.shipment?.forwardingNo || "";
        const remarks =
          awbDetails.type === "child"
            ? `Child AWB of ${awbDetails.masterAwbNo}`
            : awbDetails.shipment?.operationRemark || "";

        setValue("forwardingNo", forwardingNo, {
          shouldValidate: false,
          shouldDirty: true,
        });
        setValue("weight", weight, {
          shouldValidate: false,
          shouldDirty: true,
        });
        setValue("remarks", remarks, {
          shouldValidate: false,
          shouldDirty: true,
        });

        const awbType = awbDetails.type === "child" ? "Child AWB" : "AWB";
        showNotification(
          "success",
          `${awbType} ${awbNo} details loaded successfully`
        );

        setAwbFetchInProgress(false);
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
        setAwbFetchInProgress(false);
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
      hubHub: {
        counterPart: runData.counterpart || runData.counterPart || "",
        flight:
          runData.flight || runData.flightnumber || runData.flightNumber || "",
        alMawb: runData.almawb || runData.alMawb || "",
        Mawb: runData.mawb || runData.Mawb || "",
        cdNumber: runData.cdNumber || "",
        destination: runData.destination || "",
        transportType: runData.transportType || "",
      },
      branchHub: {
        counterPart: runData.counterpart || runData.counterPart || "",
        cdNumber: runData.cdNumber || "",
        transportType: runData.transportType || "",
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

  // Normalize row data helper - MOVED BEFORE validateAwbGlobally
  const normalizeRowDataForDisplay = useCallback((rows) => {
    return rows.map((row) => ({
      ...row,
      awbNo: row.awbNo || row.childShipment || "",
      _originalAwbNo: row.awbNo,
      _originalChildShipment: row.childShipment,
    }));
  }, []);

  // validateAwbGlobally - now after normalizeRowDataForDisplay

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

        // Check if AWB exists in current run's rowData (check both fields)
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
            details: `AWB ${trimmedAwb} has already been added to this run. Each AWB can only be added once per run.`,
          });
          setValidationErrorModalOpen(true);
          return {
            isValid: false,
            message: `AWB ${trimmedAwb} already exists in this run`,
          };
        }

        // Check AWB details using new endpoint (supports both master and child)
        try {
          const awbResponse = await axios.get(
            `${server}/bagging?awbNo=${trimmedAwb}`
          );
          const awbData = awbResponse.data;

          if (awbData) {
            // ✅ NEW: Check if payment is RTO
            if (
              awbData.isRTO === true ||
              awbData.payment?.toUpperCase() === "RTO"
            ) {
              setIsValidatingAwb(false);
              const awbType = awbData.type === "child" ? "Child AWB" : "AWB";
              const masterInfo =
                awbData.type === "child"
                  ? ` (Master AWB: ${awbData.masterAwbNo})`
                  : "";

              setValidationError({
                type: "rto",
                awbNo: trimmedAwb,
                message: `${awbType} ${trimmedAwb}${masterInfo} is marked as RTO (Return to Origin).`,
                details: `This shipment has payment type "RTO" and cannot be bagged. RTO shipments are handled separately and should not be included in regular bagging operations.`,
              });
              setValidationErrorModalOpen(true);
              return {
                isValid: false,
                message: `AWB ${trimmedAwb} is RTO and cannot be bagged`,
              };
            }

            // Check if master AWB is on hold
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
                message: `${awbType} ${trimmedAwb}${masterInfo} is on hold and cannot be processed.`,
                holdReason: awbData.holdReason || "No reason specified",
                details: `Please resolve the hold status before attempting to add this AWB to bagging.`,
              });
              setValidationErrorModalOpen(true);
              return {
                isValid: false,
                message: `AWB ${trimmedAwb} is on hold`,
              };
            }

            // Validate sector match
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
                  details: `${awbType} sector is ${awbSector}, but the current run sector is ${runSector}. AWB must match the run sector.`,
                });
                setValidationErrorModalOpen(true);
                return {
                  isValid: false,
                  message: `AWB sector (${awbSector}) does not match run sector (${runSector})`,
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
              details: `AWB ${trimmedAwb} does not exist as a master AWB or child AWB in the system.`,
            });
            setValidationErrorModalOpen(true);
            return {
              isValid: false,
              message: `AWB ${trimmedAwb} not found`,
            };
          }
          console.log("AWB validation error:", awbError.message);
        }

        // Check if AWB exists in clubbing data for current run (check both fields)
        try {
          const clubbingResponse = await axios.get(
            `${server}/clubbing?runNo=${currentRunNo}`
          );
          let allClubs = Array.isArray(clubbingResponse.data)
            ? clubbingResponse.data
            : [clubbingResponse.data];

          allClubs = allClubs.filter((club) => club && club.clubNo);

          for (const club of allClubs) {
            if (club.rowData && Array.isArray(club.rowData)) {
              const awbExists = club.rowData.some((row) => {
                const rowIdentifier = row.childShipment || row.awbNo;
                return (
                  rowIdentifier &&
                  rowIdentifier.trim().toUpperCase() === trimmedAwb
                );
              });

              if (awbExists) {
                setIsValidatingAwb(false);
                setValidationError({
                  type: "duplicate_club",
                  awbNo: trimmedAwb,
                  message: `This AWB already exists in Club ${club.clubNo}.`,
                  details: `AWB ${trimmedAwb} has been clubbed in Club ${club.clubNo} of this run. It cannot be added to bagging separately.`,
                });
                setValidationErrorModalOpen(true);
                return {
                  isValid: false,
                  message: `AWB ${trimmedAwb} already exists in Club ${club.clubNo}`,
                };
              }
            }
          }
        } catch (clubbingError) {
          if (clubbingError.response?.status !== 404) {
            console.log("Clubbing check error:", clubbingError.message);
          }
        }

        // Check if AWB exists in OTHER runs (check both fields)
        try {
          const baggingResponse = await axios.get(`${server}/bagging`);
          let allBagging = Array.isArray(baggingResponse.data)
            ? baggingResponse.data
            : [baggingResponse.data];

          allBagging = allBagging.filter(
            (bag) => bag && bag.runNo && bag.runNo !== currentRunNo
          );

          for (const bag of allBagging) {
            if (bag.rowData && Array.isArray(bag.rowData)) {
              const awbExists = bag.rowData.some((row) => {
                const rowIdentifier = row.childShipment || row.awbNo;
                return (
                  rowIdentifier &&
                  rowIdentifier.trim().toUpperCase() === trimmedAwb
                );
              });

              if (awbExists) {
                setIsValidatingAwb(false);
                setValidationError({
                  type: "duplicate_other_run",
                  awbNo: trimmedAwb,
                  message: `This AWB already exists in another run.`,
                  details: `AWB ${trimmedAwb} is already present in Run ${bag.runNo}. An AWB cannot be added to multiple runs.`,
                });
                setValidationErrorModalOpen(true);
                return {
                  isValid: false,
                  message: `AWB ${trimmedAwb} already exists in Run ${bag.runNo}`,
                };
              }
            }
          }
        } catch (baggingError) {
          if (baggingError.response?.status !== 404) {
            console.log("Bagging check error:", baggingError.message);
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
        setValidationError({
          type: "error",
          awbNo: trimmedAwb,
          message: `An error occurred while validating the AWB.`,
          details:
            error.message ||
            "Please try again or contact support if the issue persists.",
        });
        setValidationErrorModalOpen(true);
        return {
          isValid: false,
          message: "Error validating AWB. Please try again.",
        };
      }
    },
    [server, rowData, watch]
  );

  // getFilteredRowData - now after normalizeRowDataForDisplay
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

      if (!data.runNo) {
        showNotification("error", "Run Number is required");
        return;
      }

      const trimmedAwb = data.awbNo.trim().toUpperCase();

      const awbValidation = await validateAwbGlobally(data.awbNo, editingIndex);
      if (!awbValidation.isValid) {
        if (!awbValidation.message.includes("on hold")) {
          showNotification("error", awbValidation.message);
        }
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

          // Get the actual AWB number - handle both master AWB and child AWB
          const oldAwbNo = oldRow.childShipment || oldRow.awbNo;

          console.log("Editing mode - removing old AWB:", oldAwbNo);

          // Remove old AWB (works for both master and child AWBs)
          await axios.put(
            `${server}/bagging`,
            {
              runNo: data.runNo.toString(),
              action: "remove",
              item: { awbNo: oldAwbNo }, // Use the actual AWB identifier
            },
            axiosConfig
          );

          console.log("Adding updated AWB:", trimmedAwb);

          // Add updated AWB
          const response = await axios.put(
            `${server}/bagging`,
            {
              runNo: data.runNo.toString(),
              action: "add",
              item: newRow,
            },
            axiosConfig
          );

          console.log("Update response:", response.data);

          setRowData(response.data.rowData || rowData);
          setExistingBaggingData(response.data);

          showNotification(
            "success",
            `AWB ${trimmedAwb} updated successfully in Bag ${data.bagNo}!`
          );

          setEditingIndex(null);
          setEditRowData(null);

          setValue("awbNo", "");
          setAwbNumberValue("");
          setValue("weight", "");
          setValue("forwardingNo", "");
          setValue("remarks", "");
          clearErrors("awbNo");
        } else {
          if (rowData.length === 0 && !existingBaggingData) {
            const formData = getValues();

            console.log("Creating new bagging record for first item");

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

            console.log("Creating bagging with data:", baggingData);

            const response = await axios.post(
              `${server}/bagging`,
              baggingData,
              axiosConfig
            );

            console.log("Bagging created successfully:", response.data);

            setExistingBaggingData(response.data);
            setRowData(response.data.rowData || [newRow]);

            showNotification(
              "success",
              `AWB ${trimmedAwb} added to Bag ${data.bagNo} successfully!`
            );
          } else {
            console.log("Adding item to existing bagging");

            const saveData = {
              runNo: data.runNo.toString(),
              action: "add",
              item: newRow,
            };

            console.log("Adding item with data:", saveData);

            const response = await axios.put(
              `${server}/bagging`,
              saveData,
              axiosConfig
            );

            console.log("Item added successfully:", response.data);

            setRowData(response.data.rowData || [...rowData, newRow]);
            setExistingBaggingData(response.data);

            showNotification(
              "success",
              `AWB ${trimmedAwb} added to Bag ${data.bagNo} successfully!`
            );
          }

          setSelectedBag("");
          setValue("bagDetails", "");
          setValue("awbNo", "");
          setAwbNumberValue("");
          setValue("weight", "");
          setValue("forwardingNo", "");
          setValue("remarks", "");
          clearErrors("awbNo");
        }
      } catch (error) {
        console.error("Error processing bag item:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);

        let errorMsg = "Unknown error";

        if (
          error.code === "ECONNABORTED" ||
          error.message.includes("timeout")
        ) {
          errorMsg =
            "Request timeout. The server took too long to respond. Please try again.";
        } else if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        } else if (error.response?.data?.details) {
          errorMsg = error.response.data.details;
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

      // Set editing state FIRST
      setEditingIndex(actualRowIndex);
      setEditRowData(rowToEdit);

      const actualAwb = rowToEdit.childShipment || rowToEdit.awbNo || "";

      // Use setTimeout to ensure state updates before form values
      setTimeout(() => {
        setValue("awbNo", actualAwb);
        setAwbNumberValue(actualAwb);
        setValue("bagNo", rowToEdit.bagNo || "");
        setBagNumberValue(rowToEdit.bagNo || "");
        setValue("weight", String(rowToEdit.bagWeight || ""));
        setValue("forwardingNo", rowToEdit.forwardingNo || "");
        setValue("remarks", rowToEdit.remarks || "");
        clearErrors("awbNo");

        showNotification(
          "success",
          "Row loaded for editing. Weight shown is from bagging record."
        );
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
        `${server}/bagging`,
        {
          runNo: runNo.toString(),
          action: "remove",
          item: { awbNo: actualAwb },
        },
        axiosConfig
      );

      if (response.data && response.data.rowData) {
        setRowData(response.data.rowData);
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
      { key: "bagWeight", label: "Bag weight" },
      { key: "runNo", label: "Run No." },
    ],
    []
  );

  const handleBagSelection = useCallback(
    (bagNo) => {
      if (selectedBag === bagNo) return;

      if (!bagNo || bagNo === "" || bagNo === "All") {
        setSelectedBag("");
        setValue("bagDetails", "", {
          shouldValidate: false,
          shouldDirty: false,
        });
      } else {
        setSelectedBag(bagNo);
        setValue("bagDetails", bagNo, {
          shouldValidate: false,
          shouldDirty: false,
        });
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

  // const handleFinalSubmit = useCallback(async () => {
  //   try {
  //     const formData = getValues();

  //     if (!formData.runNo) {
  //       showNotification("error", "Please enter a run number");
  //       return;
  //     }

  //     if (!rowData?.length) {
  //       showNotification(
  //         "error",
  //         "Please add at least one item to bag before finalizing"
  //       );
  //       return;
  //     }

  //     const updateData = {
  //       runNo: formData.runNo,
  //       date: formData.date,
  //       sector: formData.sector,
  //       flight: formData.flight,
  //       alMawb: formData.alMawb,
  //       counterPart: formData.counterPart,
  //       obc: formData.obc,
  //       Mawb: formData.Mawb,
  //       mhbsNo: formData.mhbsNo,
  //       noOfBags: parseInt(formData.noOfBags),
  //       noOfAwb: parseInt(formData.noOfAwb),
  //       runWeight: parseFloat(formData.runWeight),
  //       totalClubNo: parseInt(formData.totalClubNo) || 0,
  //       totalAwb: parseInt(formData.totalAwb) || 0,
  //       totalWeight: parseFloat(formData.totalWeight) || 0,
  //       uniqueId: formData.uniqueId,
  //       remarks: formData.remarks,
  //     };

  //     const response = await axios.put(`${server}/bagging`, updateData);

  //     if (response.status === 200 || response.status === 201) {
  //       setIsFinalised(true);
  //       showNotification(
  //         "success",
  //         "Bagging finalized successfully! All fields are now locked."
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error finalizing bagging data:", error);
  //     const errorMessage =
  //       error.response?.data?.error || "Failed to finalize bagging data";
  //     showNotification("error", `Error: ${errorMessage}`);
  //   }
  // }, [getValues, rowData, server, showNotification]);
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
          "Please add at least one item to bag before finalizing"
        );
        return;
      }

      // Send finalize flag to backend
      const response = await axios.put(`${server}/bagging`, {
        runNo: formData.runNo,
        finalize: true,
      });

      if (response.status === 200) {
        setIsFinalised(true);
        showNotification(
          "success",
          "Bagging finalized successfully! All fields are now locked."
        );

        // Refresh the data to get the finalized timestamp
        await fetchExistingBaggingData(formData.runNo);
      }
    } catch (error) {
      console.error("Error finalizing bagging data:", error);

      if (
        error.response?.status === 400 &&
        error.response?.data?.error?.includes("already finalized")
      ) {
        showNotification("warning", "This bagging has already been finalized");
        setIsFinalised(true);
      } else if (
        error.response?.status === 400 &&
        error.response?.data?.error?.includes("no items")
      ) {
        showNotification("error", "Cannot finalize bagging with no items");
      } else if (error.response?.status === 403) {
        showNotification("error", "Cannot modify finalized bagging data");
        setIsFinalised(true);
      } else {
        const errorMessage =
          error.response?.data?.error || "Failed to finalize bagging data";
        showNotification("error", `Error: ${errorMessage}`);
      }
    }
  }, [getValues, rowData, server, showNotification, fetchExistingBaggingData]);

  // const handleNewRun = useCallback(() => {
  //   setRowData([]);
  //   reset();
  //   setValue("bagNo", "1");
  //   setBagNumberValue("1");
  //   setValue("bagDetails", "");
  //   setAwbNumberValue("");
  //   setSelectedBag("");
  //   setIsDisabled(true);
  //   setIsFinalised(false);
  //   setClubbingData([]);
  //   resetClubDetails();
  //   setExistingBaggingData(null);
  //   setEditingIndex(null);
  //   setEditRowData(null);
  //   setSearchAwbNo("");
  //   clearErrors();
  //   showNotification("success", "New run started");
  // }, [reset, setValue, resetClubDetails, clearErrors, showNotification]);
  const handleNewRun = useCallback(() => {
    setRowData([]);
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
        showNotification("error", "No bags to print. Please add items first.");
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
        // Handle both master AWB and child AWB
        const awbNo = row.childShipment || row.awbNo || "N/A";
        const mhbsNumber = `${uniqueId}-${bagNo}`;

        const canvas = document.createElement("canvas");

        try {
          // Generate barcode
          JsBarcode(canvas, mhbsNumber, {
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

          // Add barcode image
          pdf.addImage(barcodeImage, "PNG", x, y, imgWidth, imgHeight);
          y += imgHeight + 8;

          // Add identification details below barcode
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");

          // Run Number
          pdf.text(`Run No: ${runNo}`, x + 2, y);
          y += 7;

          // Bag Number
          pdf.text(`Bag No: ${bagNo}`, x + 2, y);
          y += 7;

          // AWB Number (works for both master and child)
          pdf.text(`AWB No: ${awbNo}`, x + 2, y);

          // Optional: Add weight information
          if (row.bagWeight) {
            y += 7;
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.text(`Weight: ${row.bagWeight} kg`, x + 2, y);
          }

          // Add new page for next item
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
        `Barcode PDF generated successfully for ${rowData.length} entries!`
      );
    } catch (error) {
      console.error("Error generating barcode PDF:", error);
      showNotification(
        "error",
        `Error generating barcode PDF: ${error.message}`
      );
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
            `This is not a Hub Airport run. Account type: ${accountType}`
          );
          setIsDisabled(true);
          return;
        }

        const mappedData = mapRunDataToForm(runData);

        Object.keys(mappedData).forEach((key) => {
          if (key !== "runNo" && mappedData[key] !== undefined) {
            setValue(key, mappedData[key], { shouldValidate: false });
          }
        });

        const uniqueId =
          runData.uniqueID ||
          runData.uniqueId ||
          runData.unique_id ||
          runData.uniqueid ||
          runData.UNIQUEID ||
          runData.id ||
          runData._id ||
          "";

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
        setValue("bagDetails", "");
        setValue("mhbsNo", "");
        setValue("noOfBags", "0");
        setValue("noOfAwb", "0");
        setValue("bagWeight", "0.00");
        setValue("runWeight", "0");
        setValue("totalClubNo", "0");
        setValue("totalAwb", "0");
        setValue("totalWeight", "0");
        setValue("remarks", "");

        showNotification("error", `Run number ${runNo} not found`);
      }
    } catch (error) {
      console.error("Error processing run data:", error);
      showNotification("error", "Error loading run data. Please try again.");
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
    setIsDisabled,
    setClubbingData,
    setRowData,
    setExistingBaggingData,
    setSelectedBag,
  ]);

  // Sync custom input states with form values
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
    if (!watch("awbNo")?.trim() || watch("awbNo").trim().length < 4) {
      clearErrors("awbNo");
      return;
    }

    const validateAwbAsync = async () => {
      const validation = await validateAwbGlobally(
        watch("awbNo").trim(),
        editingIndex
      );

      if (!validation.isValid) {
        setError("awbNo", {
          type: "manual",
          message: validation.message,
        });
      } else {
        clearErrors("awbNo");
      }
    };

    const timeoutId = setTimeout(validateAwbAsync, 1500);
    return () => clearTimeout(timeoutId);
  }, [watch, validateAwbGlobally, setError, clearErrors, editingIndex]);

  // useEffect(() => {
  //   const subscription = watch((formData, { name }) => {
  //     if (name !== "runNo") return;

  //     const runNo = formData.runNo;

  //     if (!runNo || runNo.trim().length === 0) {
  //       if (!isDisabled || rowData.length > 0) {
  //         reset();
  //         setValue("bagNo", "");
  //         setBagNumberValue("");
  //         setValue("bagDetails", "");
  //         setSelectedBag("");
  //         setIsDisabled(true);
  //         setClubbingData([]);
  //         resetClubDetails();
  //         setRowData([]);
  //         setExistingBaggingData(null);
  //       }
  //     }
  //   });

  //   return () => subscription.unsubscribe();
  // }, [
  //   watch,
  //   reset,
  //   setValue,
  //   resetClubDetails,
  //   isDisabled,
  //   rowData.length,
  //   setIsDisabled,
  //   setClubbingData,
  //   setRowData,
  //   setExistingBaggingData,
  //   setSelectedBag,
  // ]);

  useEffect(() => {
    const subscription = watch((formData, { name }) => {
      if (name !== "runNo") return;

      const runNo = formData.runNo;

      if (!runNo || runNo.trim().length === 0) {
        if (!isDisabled || rowData.length > 0) {
          reset();
          setValue("bagNo", "");
          setBagNumberValue("");
          setValue("bagDetails", "");
          setSelectedBag("");
          setIsDisabled(true);
          setIsFinalised(false);
          setClubbingData([]);
          resetClubDetails();
          setRowData([]);
          setExistingBaggingData(null);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [
    watch,
    reset,
    setValue,
    resetClubDetails,
    isDisabled,
    rowData.length,
    setIsDisabled,
    setClubbingData,
    setRowData,
    setExistingBaggingData,
    setSelectedBag,
  ]);
  useEffect(() => {
    const bagNo = watch("bagNo");
    const uniqueId = watch("uniqueId");

    if (uniqueId && bagNo && editingIndex === null) {
      generateMhbsNumber(uniqueId, bagNo);
    }
  }, [watch, generateMhbsNumber, editingIndex]);

  useEffect(() => {
    // ✅ Early return if editing - prevents any fetch
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
        setValue("forwardingNo", "", {
          shouldValidate: false,
          shouldDirty: false,
        });
        setValue("weight", "", { shouldValidate: false, shouldDirty: false });
        setValue("remarks", "", { shouldValidate: false, shouldDirty: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, fetchAwbDetails, setValue, editingIndex]);
  // useEffect(() => {
  //   if (editingIndex !== null && editRowData?.awbNo) {
  //     fetchAwbDetails(editRowData.awbNo);
  //   }
  // }, [editingIndex, editRowData, fetchAwbDetails]);

  useEffect(() => {
    const runSummary = calculateRunSummary();
    setValue("noOfBags", runSummary.numberOfBags.toString(), {
      shouldValidate: false,
      shouldDirty: false,
    });
    setValue("noOfAwb", runSummary.numberOfAwb.toString(), {
      shouldValidate: false,
      shouldDirty: false,
    });
    setValue("runWeight", runSummary.totalWeight, {
      shouldValidate: false,
      shouldDirty: false,
    });
  }, [rowData, setValue, calculateRunSummary]);

  useEffect(() => {
    if (editingIndex === null && rowData.length > 0) {
      const bagNo = getValues("bagNo");
      if (bagNo) {
        const weight = calculateBagWeight(bagNo);
        const currentWeight = getValues("bagWeight");
        if (currentWeight !== weight) {
          setValue("bagWeight", weight, {
            shouldValidate: false,
            shouldDirty: false,
          });
        }
      }
    } else if (editingIndex === null) {
      const currentWeight = getValues("bagWeight");
      if (currentWeight !== "0.00") {
        setValue("bagWeight", "0.00", {
          shouldValidate: false,
          shouldDirty: false,
        });
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
      <form className="flex flex-col gap-9" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex flex-row gap-6 items-center">
          <Heading
            title="Bagging"
            bulkUploadBtn="hidden"
            codeListBtn="hidden"
            onRefresh={handleRefresh}
          />

          <div>
            <Image src="/print.svg" alt="" width={24} height={24} />
          </div>
        </div>
        {isFinalised && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong className="font-bold">Finalized:</strong> This bagging
                  has been finalized and cannot be modified.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <RedLabelHeading label="Run details" />
            <div className="grid grid-cols-4 gap-x-3 gap-y-3">
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

            <div className="flex gap-9">
              <div className="flex flex-col gap-3 w-full">
                <RedLabelHeading label="Bag Details" />
                <div className="flex gap-2 w-full">
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
                  <div className="flex">
                    <div className="w-56">
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
                </div>
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
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="MHBS Number"
                  setValue={setValue}
                  value="mhbsNo"
                  disabled={true}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="FWD Number"
                  setValue={setValue}
                  value="forwardingNo"
                  disabled={true}
                />
                <div className="flex flex-col gap-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Weight"
                      {...register("weight")}
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red"
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
                      className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${
                        isFinalised
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-red text-white hover:bg-red-700"
                      }`}
                    >
                      Edit
                    </button>
                    <div className="flex gap-2">
                      <OutlinedButtonRed
                        label={
                          editingIndex !== null ? "Update AWB" : "Add to Bag"
                        }
                        type="submit"
                        disabled={isDisabled || isValidatingAwb || isFinalised}
                      />
                      {editingIndex !== null && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingIndex(null);
                            setEditRowData(null);
                            setValue("awbNo", "");
                            setAwbNumberValue("");
                            setValue("weight", "");
                            setValue("forwardingNo", "");
                            setValue("remarks", "");
                            clearErrors("awbNo");
                            handleNewBag();
                          }}
                          disabled={isFinalised}
                          className={`px-4 py-2 border rounded-md ${
                            isFinalised
                              ? "border-gray-300 text-gray-400 cursor-not-allowed"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4 w-full">
                <div className="flex gap-3 w-full">
                  <div className="flex flex-col gap-3 w-1/2">
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

                  <div className="flex flex-col gap-3 w-1/2">
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

                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Remarks"
                  setValue={setValue}
                  value="remarks"
                  disabled={true}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-row gap-9">
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

          <div>
            <TableWithCheckboxEditDelete
              register={register}
              setValue={setValue}
              name="bagging"
              columns={columns}
              rowData={getFilteredRowData()}
              handleEdit={handleEditRow}
              handleDelete={handleDeleteRow}
              disableActions={isFinalised}
            />
          </div>

          <div className="flex justify-between">
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
                name={isFinalised ? "Finalized ✓" : "Final"}
                disabled={isDisabled || isFinalised}
                onClick={handleFinalSubmit}
                type="button"
              />
            </div>
            {/* <div>
              <OutlinedButtonRed label="Close" />
            </div> */}
          </div>
        </div>

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={confirmDelete}
          awbNo={itemToDelete?.awbNo}
        />

        <HoldReasonModal
          isOpen={holdReasonModalOpen}
          onClose={() => {
            setHoldReasonModalOpen(false);
            setHoldReasonData({ awbNo: "", reason: "" });
            setValue("awbNo", "");
            clearErrors("awbNo");
          }}
          awbNo={holdReasonData.awbNo}
          holdReason={holdReasonData.reason}
        />
        <EditWeightModal
          isOpen={editWeightModalOpen}
          onClose={() => setEditWeightModalOpen(false)}
          onConfirm={(newWeight) => {
            setValue("weight", newWeight, {
              shouldValidate: false,
              shouldDirty: true,
            });
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

export default Bagging;
