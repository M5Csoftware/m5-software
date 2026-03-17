"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import {
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelTransparent,
} from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, {
  InputBoxYellow,
  SearchInputBox,
} from "@/app/components/InputBox";
import { TableWithCheckboxEditDelete } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, {
  useCallback,
  useState,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";

// Custom Input Component for Bag Number that properly updates
const BagNumberInput = ({ value, onChange, disabled, placeholder }) => {
  return (
    <input
      type="text"
      value={value || ""}
      onChange={(e) => {
        // Only allow numbers
        const newValue = e.target.value.replace(/[^0-9]/g, "");
        onChange(newValue);
      }}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red transition-colors"
          >
            Yes
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

export default function BranchBagging() {
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    reset,
    getValues,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      bagNumber: "1",
      bagDetails: "",
      awbNumber: "",
      weight: "",
    },
  });

  const [rowData, setRowData] = useState([]);
  const [isDisabled, setIsDisabled] = useState(true);
  const [selectedBag, setSelectedBag] = useState("");
  const [clubbingData, setClubbingData] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editRowData, setEditRowData] = useState(null);
  const [baggingReset, setBaggingReset] = useState(false);
  const [existingBaggingData, setExistingBaggingData] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editWeightModalOpen, setEditWeightModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [searchAwbNo, setSearchAwbNo] = useState("");
  const [isValidatingAwb, setIsValidatingAwb] = useState(false);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // State to force re-render of custom inputs
  const [bagNumberValue, setBagNumberValue] = useState("1");
  const [awbNumberValue, setAwbNumberValue] = useState("");

  const { server } = useContext(GlobalContext);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No." },
      { key: "bagNo", label: "Bag No." },
      { key: "bagWeight", label: "Bag weight" },
      { key: "runNo", label: "Run No." },
    ],
    []
  );

  // Notification helper
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
        setValue("bagNumber", "1");
        setBagNumberValue("1");
        return null;
      }

      try {
        const response = await axios.get(
          `${server}/branch-bagging?runNo=${runNo.toUpperCase()}`
        );
        const data = Array.isArray(response.data)
          ? response.data[0]
          : response.data;

        if (data && data.rowData) {
          setExistingBaggingData(data);
          setRowData(data.rowData || []);

          const uniqueBagNumbers = [
            ...new Set(data.rowData.map((row) => parseInt(row.bagNo) || 0)),
          ];
          const maxBagNo = Math.max(...uniqueBagNumbers);
          const nextBagNo = (maxBagNo + 1).toString();
          setValue("bagNumber", nextBagNo);
          setBagNumberValue(nextBagNo);

          return data;
        } else {
          setValue("bagNumber", "1");
          setBagNumberValue("1");
        }

        return null;
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Error fetching branch bagging data:", error.message);
        }
        setExistingBaggingData(null);
        setRowData([]);
        setValue("bagNumber", "1");
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

        // console.log("Branch bagging run entry response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching run entry:", error);

        if (error.response?.status === 404) {
          // console.log(`Run ${runNo} not found in database`);
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
          // console.log(
//             `No clubbing data found for run ${runNo} - this is normal`
//           );
          setClubbingData([]);
          resetClubDetails();
        } else {
          console.error("Error fetching clubbing data:", error);
          setClubbingData([]);
          resetClubDetails();
        }
      }
    },
    [server, resetClubDetails]
  );

  const fetchAwbDetails = useCallback(
    async (awbNo) => {
      if (!awbNo || typeof awbNo !== "string") {
        setValue("forwardingNo", "");
        setValue("weight", "");
        return;
      }

      try {
        // Use new endpoint that checks both master and child AWBs
        const response = await axios.get(
          `${server}/branch-bagging?awbNo=${awbNo}`
        );

        const awbDetails = response.data;

        if (!awbDetails) {
          showNotification("error", `AWB ${awbNo} not found`);
          setValue("forwardingNo", "");
          setValue("weight", "");
          return;
        }

        // Check if master AWB is on hold
        if (awbDetails.isHold === true) {
          const awbType = awbDetails.type === "child" ? "Child AWB" : "AWB";
          const masterInfo =
            awbDetails.type === "child"
              ? ` (Master AWB: ${awbDetails.masterAwbNo})`
              : "";

          showNotification(
            "error",
            `${awbType} ${awbNo}${masterInfo} is on hold and cannot be processed.`
          );

          setValue("awbNumber", "");
          setAwbNumberValue("");
          setValue("forwardingNo", "");
          setValue("weight", "");
          return;
        }

        // For child AWBs, use master AWB's weight
        const weight = awbDetails.weight ? String(awbDetails.weight) : "";
        const forwardingNo =
          awbDetails.type === "child"
            ? awbDetails.masterAwbNo
            : awbDetails.shipment?.forwardingNo || "";

        setValue("forwardingNo", forwardingNo, {
          shouldValidate: false,
          shouldDirty: true,
        });
        setValue("weight", weight, {
          shouldValidate: false,
          shouldDirty: true,
        });

        const awbType = awbDetails.type === "child" ? "Child AWB" : "AWB";
        showNotification(
          "success",
          `${awbType} ${awbNo} details loaded successfully`
        );
      } catch (error) {
        console.error("Error fetching AWB data:", error);

        if (error.response?.status === 404) {
          showNotification("error", `AWB ${awbNo} not found in system`);
        } else {
          showNotification("error", `AWB not found or error: ${error.message}`);
        }

        setValue("forwardingNo", "");
        setValue("weight", "");
      }
    },
    [setValue, server, showNotification]
  );

  const mapRunDataToForm = useCallback((runData) => {
    if (!runData) return {};

    return {
      runNumber: runData.runNo || runData.runNumber || "",
      date: runData.date
        ? new Date(runData.date).toLocaleDateString("en-GB")
        : "",
      sector: runData.sector || "",
      counterpart: runData.counterpart || runData.counterPart || "",
      cdNo: runData.cdNumber || "",
      flight:
        runData.flight || runData.flightnumber || runData.flightNumber || "",
      obc: runData.obc || "",
      mawb:
        runData.almawb || runData.alMawb || runData.mawb || runData.Mawb || "",
      transportType: runData.transportType || "",
      origin: runData.origin || "",
      destination: runData.destination || "",
      hub: runData.hub || "",
    };
  }, []);

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

    setValue("bagNumber", nextBagNo);
    setBagNumberValue(nextBagNo);

    const uniqueId = watch("uniqueId");
    if (uniqueId && nextBagNo) {
      generateMhbsNumber(uniqueId, nextBagNo);
    }

    setValue("awbNumber", "");
    setAwbNumberValue("");
    setValue("weight", "");
    setValue("forwardingNo", "");
    setEditingIndex(null);
    setEditRowData(null);
    clearErrors("awbNumber");

    showNotification("success", `Switched to Bag ${nextBagNo}`);
  }, [
    setValue,
    watch,
    generateMhbsNumber,
    clearErrors,
    rowData,
    showNotification,
  ]);

  const validateAwbGlobally = useCallback(
    async (awbNo, excludeIndex = null) => {
      if (!awbNo?.trim()) {
        return { isValid: false, message: "AWB Number is required" };
      }

      const trimmedAwb = awbNo.trim().toUpperCase();
      const currentRunNo = watch("runNumber");

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
          return {
            isValid: false,
            message: `AWB ${trimmedAwb} already exists in this run`,
          };
        }

        // Check clubbing data
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
                return {
                  isValid: false,
                  message: `AWB ${trimmedAwb} already exists in Club ${club.clubNo}`,
                };
              }
            }
          }
        } catch (clubbingError) {
          console.log("Clubbing check error:", clubbingError.message);
        }

        // Check other runs
        try {
          const baggingResponse = await axios.get(`${server}/branch-bagging`);
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
                return {
                  isValid: false,
                  message: `AWB ${trimmedAwb} already exists in Run ${bag.runNo}`,
                };
              }
            }
          }
        } catch (baggingError) {
          console.log("Branch bagging check error:", baggingError.message);
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
          message: "Error validating AWB. Please try again.",
        };
      }
    },
    [server, rowData, watch]
  );

  // Normalize row data helper - MOVED BEFORE getFilteredRowData
  const normalizeRowDataForDisplay = useCallback((rows) => {
    return rows.map((row) => ({
      ...row,
      awbNo: row.awbNo || row.childShipment || "",
      _originalAwbNo: row.awbNo,
      _originalChildShipment: row.childShipment,
    }));
  }, []);

  // NOW getFilteredRowData can use normalizeRowDataForDisplay
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
      if (!data.awbNumber?.trim()) {
        showNotification("error", "AWB Number is required");
        return;
      }

      if (!data.bagNumber) {
        showNotification("error", "Bag Number is required");
        return;
      }

      if (!data.weight || parseFloat(data.weight) <= 0) {
        showNotification("error", "Valid weight is required");
        return;
      }

      if (!data.runNumber) {
        showNotification("error", "Run Number is required");
        return;
      }

      const trimmedAwb = data.awbNumber.trim().toUpperCase();

      const awbValidation = await validateAwbGlobally(
        data.awbNumber,
        editingIndex
      );
      if (!awbValidation.isValid) {
        showNotification("error", awbValidation.message);
        return;
      }

      try {
        const newRow = {
          awbNo: trimmedAwb,
          bagNo: data.bagNumber.toString(),
          bagWeight: parseFloat(data.weight),
          runNo: data.runNumber.toString(),
          forwardingNo: data.forwardingNo || "",
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

          // FIXED: Get the actual AWB number - handle both master AWB and child AWB
          const oldAwbNo = oldRow.childShipment || oldRow.awbNo;

          // console.log("Editing mode - removing old AWB:", oldAwbNo);

          // Remove old AWB (works for both master and child AWBs)
          await axios.put(
            `${server}/branch-bagging`,
            {
              runNo: data.runNumber.toString(),
              action: "remove",
              item: { awbNo: oldAwbNo }, // Use the actual AWB identifier
            },
            axiosConfig
          );

          // console.log("Adding updated AWB:", trimmedAwb);

          // Add updated AWB
          const response = await axios.put(
            `${server}/branch-bagging`,
            {
              runNo: data.runNumber.toString(),
              action: "add",
              item: newRow,
            },
            axiosConfig
          );

          setRowData(response.data.rowData || rowData);
          setExistingBaggingData(response.data);

          showNotification(
            "success",
            `AWB ${trimmedAwb} updated successfully in Bag ${data.bagNumber}!`
          );

          setEditingIndex(null);
          setEditRowData(null);

          setValue("awbNumber", "");
          setAwbNumberValue("");
          setValue("weight", "");
          setValue("forwardingNo", "");
          clearErrors("awbNumber");
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
              runNo: data.runNumber.toString(),
              date: parsedDate.toISOString(),
              transportType: formData.transportType || "",
              obc: formData.obc || "",
              cdNo: formData.cdNo || "",
              origin: formData.origin || "",
              mawb: formData.mawb || "",
              destination: formData.destination || "",
              hub: formData.hub || "",
              noOfBags: 1,
              noOfAwb: 1,
              bagWeight: parseFloat(data.weight),
              runWeight: parseFloat(data.weight),
              totalClubNo: parseInt(formData.totalClubNo) || 0,
              totalAwb: parseInt(formData.totalAwb) || 0,
              totalWeight: parseFloat(formData.totalWeight) || 0,
              uniqueId: formData.uniqueId || "",
              rowData: [newRow],
            };

            const response = await axios.post(
              `${server}/branch-bagging`,
              baggingData,
              axiosConfig
            );

            setExistingBaggingData(response.data);
            setRowData(response.data.rowData || [newRow]);

            showNotification(
              "success",
              `AWB ${trimmedAwb} added to Bag ${data.bagNumber} successfully!`
            );
          } else {
            const saveData = {
              runNo: data.runNumber.toString(),
              action: "add",
              item: newRow,
            };

            const response = await axios.put(
              `${server}/branch-bagging`,
              saveData,
              axiosConfig
            );

            setRowData(response.data.rowData || [...rowData, newRow]);
            setExistingBaggingData(response.data);

            showNotification(
              "success",
              `AWB ${trimmedAwb} added to Bag ${data.bagNumber} successfully!`
            );
          }

          setSelectedBag("");
          setValue("bagDetails", "");
          setValue("awbNumber", "");
          setAwbNumberValue("");
          setValue("weight", "");
          setValue("forwardingNo", "");
          clearErrors("awbNumber");
        }
      } catch (error) {
        console.error("Error processing bag item:", error);

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
      showNotification,
      clearErrors,
    ]
  );

  const handleEditRow = useCallback(
    (index) => {
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

      // ✅ Set editing state FIRST
      setEditingIndex(actualRowIndex);
      setEditRowData(rowToEdit);

      const actualAwb = rowToEdit.childShipment || rowToEdit.awbNo || "";

      // ✅ Use setTimeout to ensure state updates before form values
      setTimeout(() => {
        setValue("awbNumber", actualAwb);
        setAwbNumberValue(actualAwb);
        setValue("bagNumber", rowToEdit.bagNo || "");
        setBagNumberValue(rowToEdit.bagNo || "");

        // ✅ Use bagWeight from rowData directly instead of fetching
        setValue("weight", String(rowToEdit.bagWeight || ""));

        setValue("forwardingNo", rowToEdit.forwardingNo || "");
        clearErrors("awbNumber");

        showNotification(
          "success",
          "Row loaded for editing. Weight shown is from bagging record."
        );
      }, 0);
    },
    [rowData, getFilteredRowData, setValue, clearErrors, showNotification]
  );

  const handleDeleteRow = useCallback(
    (index) => {
      const rowToDelete = Array.isArray(index)
        ? rowData[index[0]]
        : rowData[index];

      const actualAwb = rowToDelete?.childShipment || rowToDelete?.awbNo || "";

      setItemToDelete({ index, awbNo: actualAwb });
      setDeleteModalOpen(true);
    },
    [rowData]
  );

  // Update confirmDelete to handle child AWBs
  const confirmDelete = useCallback(async () => {
    try {
      const runNo = watch("runNumber");

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
        `${server}/branch-bagging`,
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

  const handleRefresh = useCallback(() => {
    setBaggingReset(!baggingReset);
    const currentRunNo = watch("runNumber");
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
  // Add this function in your BranchBagging component, after other handlers:

  const handleFinal = useCallback(async () => {
    const runNo = watch("runNumber");

    if (!runNo) {
      showNotification("error", "Run number is required to finalize");
      return;
    }

    if (rowData.length === 0) {
      showNotification(
        "error",
        "Cannot finalize empty branch bagging. Add AWBs first."
      );
      return;
    }

    try {
      const axiosConfig = {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
        },
      };

      const response = await axios.put(
        `${server}/branch-bagging`,
        {
          runNo: runNo.toString(),
          action: "final",
        },
        axiosConfig
      );

      if (response.status === 200) {
        showNotification(
          "success",
          `Branch bagging finalized successfully for Run ${runNo}`
        );

        // Optionally disable the form or redirect
        setIsDisabled(true);

        // Refresh the data
        await fetchExistingBaggingData(runNo);
      }
    } catch (error) {
      console.error("Error finalizing branch bagging:", error);

      let errorMsg = "Failed to finalize";

      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        errorMsg = "Request timeout. Please try again.";
      } else if (error.response?.status === 409) {
        errorMsg = "Branch bagging is already finalized for this run.";
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      showNotification("error", `Error: ${errorMsg}`);
    }
  }, [watch, rowData, server, showNotification, fetchExistingBaggingData]);
  const handleRunNoBlur = useCallback(async () => {
    const runNo = watch("runNumber");

    if (!runNo || typeof runNo !== "string" || runNo.trim().length === 0) {
      return;
    }

    try {
      const runData = await fetchRunEntry(runNo.trim());

      if (runData) {
        // Check if accountType is hubHub or branchHub
        const accountType = runData.accountType;
        if (
          accountType &&
          accountType !== "hubHub" &&
          accountType !== "branchHub"
        ) {
          showNotification(
            "error",
            `This run is not for branch bagging. Account type: ${accountType}`
          );
          setIsDisabled(true);
          return;
        }

        const mappedData = mapRunDataToForm(runData);

        Object.keys(mappedData).forEach((key) => {
          if (key !== "runNumber" && mappedData[key] !== undefined) {
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

        const currentBagNo = getValues("bagNumber") || "";
        generateMhbsNumber(uniqueId, currentBagNo);

        showNotification("success", `Run ${runNo} loaded successfully`);
      } else {
        setIsDisabled(true);
        setClubbingData([]);
        resetClubDetails();
        setRowData([]);
        setExistingBaggingData(null);
        setSelectedBag("");

        setValue("date", "");
        setValue("sector", "");
        setValue("counterpart", "");
        setValue("cdNo", "");
        setValue("flight", "");
        setValue("obc", "");
        setValue("mawb", "");
        setValue("transportType", "");
        setValue("origin", "");
        setValue("destination", "");
        setValue("hub", "");
        setValue("uniqueId", "");
        setValue("bagNumber", "");
        setBagNumberValue("");
        setValue("bagDetails", "");
        setValue("mhbsNo", "");
        setValue("noofBags", "0");
        setValue("noofAWB", "0");
        setValue("bagWeight", "0.00");
        setValue("runWeight", "0");
        setValue("totalClubNo", "0");
        setValue("totalAwb", "0");
        setValue("totalWeight", "0");

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
      if (name === "bagNumber" && value.bagNumber !== bagNumberValue) {
        setBagNumberValue(value.bagNumber || "");
      }
      if (name === "awbNumber" && value.awbNumber !== awbNumberValue) {
        setAwbNumberValue(value.awbNumber || "");
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, bagNumberValue, awbNumberValue]);

  useEffect(() => {
    if (!watch("awbNumber")?.trim() || watch("awbNumber").trim().length < 4) {
      clearErrors("awbNumber");
      return;
    }

    const validateAwbAsync = async () => {
      const validation = await validateAwbGlobally(
        watch("awbNumber").trim(),
        editingIndex
      );

      if (!validation.isValid) {
        setError("awbNumber", {
          type: "manual",
          message: validation.message,
        });
      } else {
        clearErrors("awbNumber");
      }
    };

    const timeoutId = setTimeout(validateAwbAsync, 1500);
    return () => clearTimeout(timeoutId);
  }, [
    watch("awbNumber"),
    validateAwbGlobally,
    setError,
    clearErrors,
    editingIndex,
  ]);

  useEffect(() => {
    const subscription = watch((formData, { name }) => {
      if (name !== "runNumber") return;

      const runNo = formData.runNumber;

      if (!runNo || runNo.trim().length === 0) {
        if (!isDisabled || rowData.length > 0) {
          reset();
          setValue("bagNumber", "");
          setBagNumberValue("");
          setValue("bagDetails", "");
          setSelectedBag("");
          setIsDisabled(true);
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
    const bagNo = watch("bagNumber");
    const uniqueId = watch("uniqueId");

    if (uniqueId && bagNo && editingIndex === null) {
      generateMhbsNumber(uniqueId, bagNo);
    }
  }, [watch("bagNumber"), watch("uniqueId"), generateMhbsNumber, editingIndex]);

  useEffect(() => {
    // ✅ Early return if editing - prevents any fetch
    if (editingIndex !== null) return;

    const subscription = watch((formData, { name }) => {
      if (name !== "awbNumber") return;

      const awbNo = formData.awbNumber;

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
    setValue("noofBags", runSummary.numberOfBags.toString(), {
      shouldValidate: false,
      shouldDirty: false,
    });
    setValue("noofAWB", runSummary.numberOfAwb.toString(), {
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
      const bagNo = getValues("bagNumber");
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
  const filteredRowData = getFilteredRowData();

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
        <Heading
          title="Branch Bagging"
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          onRefresh={handleRefresh}
        />
        {existingBaggingData?.isFinal && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">
              Branch Bagging Finalized for Run {watch("runNumber")}
            </span>
          </div>
        )}

        <div className="flex flex-col gap-6">
          <RedLabelHeading label="Run Details" />

          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div onBlur={handleRunNoBlur} className="w-full">
                <InputBoxYellow
                  placeholder="Run Number"
                  register={register}
                  setValue={setValue}
                  value="runNumber"
                  resetFactor={baggingReset}
                />
              </div>
              <DummyInputBoxWithLabelDarkGray
                label="Date"
                register={register}
                setValue={setValue}
                value="date"
                disabled={true}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Transport"
                register={register}
                setValue={setValue}
                value="transportType"
                disabled={true}
              />
              <DummyInputBoxWithLabelDarkGray
                label="OBC"
                register={register}
                setValue={setValue}
                value="obc"
                disabled={true}
              />
            </div>

            <div className="flex gap-3">
              <DummyInputBoxWithLabelDarkGray
                label="CD No"
                register={register}
                setValue={setValue}
                value="cdNo"
                disabled={true}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Origin"
                register={register}
                setValue={setValue}
                value="origin"
                disabled={true}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Hub"
                register={register}
                setValue={setValue}
                value="hub"
                disabled={true}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Mawb"
                register={register}
                setValue={setValue}
                value="mawb"
                disabled={true}
              />
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <div className="flex flex-col gap-4 w-1/2">
              <RedLabelHeading label="Bag Details" />
              <div className="flex gap-2">
                <BagNumberInput
                  value={bagNumberValue}
                  onChange={(val) => {
                    setBagNumberValue(val);
                    setValue("bagNumber", val);

                    // Update MHBS number when bag number changes during editing
                    const uniqueId = watch("uniqueId");
                    if (uniqueId && val) {
                      generateMhbsNumber(uniqueId, val);
                    }
                  }}
                  disabled={false}
                  placeholder="Bag Number"
                />
                <div className="w-56">
                  <OutlinedButtonRed
                    label="New Bag"
                    type="button"
                    onClick={handleNewBag}
                    disabled={isDisabled || editingIndex !== null}
                  />
                </div>
              </div>

              <AwbNumberInput
                value={awbNumberValue}
                onChange={(val) => {
                  setAwbNumberValue(val);
                  setValue("awbNumber", val);
                }}
                disabled={false}
                placeholder="AWB Number"
                isValidating={isValidatingAwb}
              />

              <div className="flex gap-2">
                <DummyInputBoxWithLabelDarkGray
                  label="MHBS No."
                  register={register}
                  setValue={setValue}
                  value="mhbsNo"
                  disabled={true}
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Forwarding No."
                  register={register}
                  setValue={setValue}
                  value="forwardingNo"
                  disabled={true}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Weight"
                    {...register("weight")}
                    className="flex-1 px-3 py-1 text-sm font-semibold border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-red"
                    readOnly={true}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditWeightModalOpen(true);
                    }}
                    className="px-4 py-1 text-sm font-semibold bg-red text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Edit
                  </button>
                  <div className="w-[30%]">
                    <OutlinedButtonRed
                      label={
                        editingIndex !== null ? "Update AWB" : "Add to Bag"
                      }
                      type="submit"
                      disabled={isDisabled || isValidatingAwb}
                    />
                  </div>
                </div>
              </div>

              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingIndex(null);
                    setEditRowData(null);
                    setValue("awbNumber", "");
                    setAwbNumberValue("");
                    setValue("weight", "");
                    setValue("forwardingNo", "");
                    clearErrors("awbNumber");
                    handleNewBag();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="w-1/2">
              <div className="w-full flex flex-col gap-4">
                <RedLabelHeading label="Run Summary" />
                <div className="flex gap-3">
                  <DummyInputBoxWithLabelDarkGray
                    label="Bag Weight (Kg)"
                    register={register}
                    setValue={setValue}
                    value="bagWeight"
                    disabled={true}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="Run Weight (Kg)"
                    register={register}
                    setValue={setValue}
                    value="runWeight"
                    disabled={true}
                  />
                </div>
                <div className="flex gap-3">
                  <DummyInputBoxWithLabelDarkGray
                    label="No. of Bags"
                    register={register}
                    setValue={setValue}
                    value="noofBags"
                    disabled={true}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="No. of AWB"
                    register={register}
                    setValue={setValue}
                    value="noofAWB"
                    disabled={true}
                  />
                </div>

                <div className="flex flex-col gap-5 border border-[#14A166] bg-[#14A1663D] rounded-lg p-2">
                  <RedLabelHeading label="Club Details" />
                  <div className="flex gap-3">
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
                  </div>
                </div>
              </div>
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
          />
          <SearchInputBox
            placeholder="Search AWB No."
            value={searchAwbNo}
            onChange={handleSearchAwb}
            onKeyDown={handleSearchAwb}
          />
        </div>

        <div>
          <TableWithCheckboxEditDelete
            register={register}
            setValue={setValue}
            name="branchBagging"
            columns={columns}
            rowData={filteredRowData}
            handleEdit={handleEditRow}
            handleDelete={handleDeleteRow}
          />
        </div>
        <div className="flex justify-end w-full">
          <div className="w-[15%]">
            <SimpleButton
              name="Final"
              type="button"
              onClick={handleFinal}
              disabled={
                isDisabled ||
                rowData.length === 0 ||
                existingBaggingData?.isFinal
              }
            />
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
      </form>
    </>
  );
}
