"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
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
import {
  DeleteButton,
  EditButton,
} from "@/app/components/AddUpdateDeleteButton";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useEffect, useContext, useCallback } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";
import { show } from "@tauri-apps/api/app";
import DataLockModal from "@/app/components/DataLockModal";

const Clubbing = () => {
  // Form setup
  const {
    handleSubmit,
    register,
    setValue,
    reset,
    watch,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
    trigger,
  } = useForm();

  // State management
  const [rowData, setRowData] = useState([]);
  const [isDisabled, setIsDisabled] = useState(false);
  const [newData, setNewData] = useState(true);
  const [date, setDate] = useState("");
  const [clubbingReset, setClubbingReset] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentClubData, setCurrentClubData] = useState(null);
  const [airwayBills, setAirwayBills] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [originalRunNo, setOriginalRunNo] = useState("");
  const [originalClubNo, setOriginalClubNo] = useState("");
  const [isValidatingRunNo, setIsValidatingRunNo] = useState(false);
  const [isValidatingAwb, setIsValidatingAwb] = useState(false);
  const [showActionConfirmModal, setShowActionConfirmModal] = useState(false);
  const [actionType, setActionType] = useState(""); // "delete" | "lock" | "createUpdate"
  const [showDataLockModal, setShowDataLockModal] = useState(false);
  const [lockedAwbInfo, setLockedAwbInfo] = useState({
    awbNo: "",
    message: "",
  });

  // Notification state
  const [responseMsg, setResponseMsg] = useState("");
  const [visibleFlag, setVisibleFlag] = useState(false);

  const { server } = useContext(GlobalContext);

  // Watch form values
  const awbNo = watch("awbNo");
  const clubNo = watch("clubNo");
  const runNo = watch("runNo");

  // Table columns
  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "weight", label: "Weight" },
    // { key: "bagweight", label: "Bag weight" },
    { key: "clubNo", label: "Club No." },
  ];

  // Utility functions
  const formatDateForInput = useCallback((dateStr) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const formatDateForDisplay = useCallback((date) => {
    return (
      date.getDate().toString().padStart(2, "0") +
      "/" +
      (date.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      date.getFullYear().toString()
    );
  }, []);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // Notification helper
  const showNotification = useCallback((type, message) => {
    setNotification({ type, message, visible: true });
  }, []);

  // ENHANCED GLOBAL AWB VALIDATION - with completeDataLock check
  const checkIfAwbAlreadyCubbed = useCallback(
    async (awbNo) => {
      if (!awbNo?.trim()) {
        return {
          isValid: true,
          isCubbed: false,
          clubNo: null,
          isLocked: false,
        };
      }

      try {
        const response = await axios.get(
          `${server}/clubbing/validate-awb?awbNo=${awbNo.trim()}`
        );

        const data = response.data;
        console.log(`Validate AWB response:`, data);

        return {
          isValid: data.isValid,
          isCubbed: !data.isValid && data.clubNo !== null,
          clubNo: data.clubNo || null,
          isLocked: data.completeDataLock === true,
          message: data.message,
        };
      } catch (error) {
        console.log("Error validating AWB:", error.message);
        return {
          isValid: false,
          isCubbed: false,
          clubNo: null,
          isLocked: false,
          message: "Error validating AWB",
        };
      }
    },
    [server]
  );

  // Updated validateAwbGlobally function
  const validateAwbGlobally = useCallback(
    async (awbNo) => {
      if (!awbNo?.trim()) {
        return { isValid: false, message: "AWB Number is required" };
      }

      const trimmedAwb = awbNo.trim();
      console.log(`Starting global AWB validation for: ${trimmedAwb}`);

      try {
        setIsValidatingAwb(true);

        // Step 1: Check in current rowData (local validation)
        const localExists = rowData.some(
          (row, index) =>
            row.awbNo &&
            row.awbNo.toLowerCase() === trimmedAwb.toLowerCase() &&
            index !== editingIndex
        );

        if (localExists) {
          console.log(`AWB ${trimmedAwb} found in current club rowData`);
          setIsValidatingAwb(false);
          return {
            isValid: false,
            message: `AWB ${trimmedAwb} already exists in current club`,
          };
        }

        // Step 2: Check if AWB exists in shipments AND validate lock status
        const validationCheck = await checkIfAwbAlreadyCubbed(trimmedAwb);

        if (validationCheck.payment === "RTO") {
          setIsValidatingAwb(false);
          return {
            isValid: false,
            message: "This shipment is RTO and cannot be clubbed",
          };
        }

        // Check if locked
        if (validationCheck.isLocked) {
          console.log(`AWB ${trimmedAwb} is locked (completeDataLock=true)`);
          setIsValidatingAwb(false);
          return {
            isValid: false,
            message: `AWB ${trimmedAwb} is locked and cannot be clubbed`,
          };
        }

        // Check if already clubbed
        if (validationCheck.isCubbed) {
          console.log(
            `AWB ${trimmedAwb} is already clubbed in Club ${validationCheck.clubNo}`
          );
          setIsValidatingAwb(false);
          return {
            isValid: false,
            message: validationCheck.message,
          };
        }

        // Check if AWB doesn't exist in shipments at all
        if (
          !validationCheck.isValid &&
          !validationCheck.isCubbed &&
          !validationCheck.isLocked
        ) {
          console.log(`AWB ${trimmedAwb} not found in shipments`);
          setIsValidatingAwb(false);
          return {
            isValid: false,
            message:
              validationCheck.message ||
              `AWB ${trimmedAwb} not found in shipments`,
          };
        }

        // Step 3: Check in all bagging data
        let allBagging = [];
        try {
          console.log(`Fetching all bagging data from: ${server}/bagging`);
          const baggingResponse = await axios.get(`${server}/bagging`);

          if (baggingResponse.data) {
            allBagging = Array.isArray(baggingResponse.data)
              ? baggingResponse.data
              : [baggingResponse.data];
          }

          console.log(`Found ${allBagging.length} bagging entries to check`);
        } catch (baggingError) {
          console.log("No bagging data found or error:", baggingError.message);
        }

        for (const bag of allBagging) {
          if (bag.rowData && Array.isArray(bag.rowData)) {
            const awbExists = bag.rowData.some(
              (row) =>
                row.awbNo &&
                row.awbNo.toLowerCase() === trimmedAwb.toLowerCase()
            );

            if (awbExists) {
              console.log(
                `AWB ${trimmedAwb} found in Run ${bag.runNo} (Bagging)`
              );
              setIsValidatingAwb(false);
              return {
                isValid: false,
                message: `AWB ${trimmedAwb} already exists in Run ${bag.runNo} (Bagging)`,
              };
            }
          }
        }

        console.log(`AWB ${trimmedAwb} is available for use`);
        setIsValidatingAwb(false);
        return { isValid: true, message: "AWB is available" };
      } catch (error) {
        console.error("Unexpected error in AWB validation:", error);
        setIsValidatingAwb(false);
        return {
          isValid: false,
          message: "Error validating AWB. Please try again.",
        };
      }
    },
    [
      server,
      isEditMode,
      editingIndex,
      currentClubData,
      rowData,
      checkIfAwbAlreadyCubbed,
    ]
  );

  // API functions - FIXED RunNo Validation
  const validateRunNo = useCallback(
    async (runNumber) => {
      if (!runNumber?.trim()) {
        return { isValid: false, message: "Run Number is required" };
      }

      setIsValidatingRunNo(true);

      try {
        console.log(`Validating run no: ${runNumber}`);
        const response = await axios.get(
          `${server}/run-entry?runNo=${runNumber.trim().toUpperCase()}`
        );
        console.log("Run No validation response:", response);

        // Check if response has data and is successful
        if (response.status === 200 && response.data) {
          setIsValidatingRunNo(false);
          return { isValid: true, message: "Run Number is valid" };
        } else {
          setIsValidatingRunNo(false);
          return { isValid: false, message: "Run Number is not valid" };
        }
      } catch (error) {
        setIsValidatingRunNo(false);
        console.error("Error validating runNo:", error);

        // Handle 404 specifically - Run number not found
        if (error.response?.status === 404) {
          return { isValid: false, message: "Run Number not found in system" };
        }

        return {
          isValid: false,
          message: "Error validating Run Number. Please try again.",
        };
      }
    },
    [server]
  );

  const fetchClubData = useCallback(
    async (clubNumber) => {
      try {
        const response = await axios.get(
          `${server}/clubbing?clubNo=${clubNumber}`
        );

        if (response.status === 200 && response.data) {
          const clubData = response.data;
          setCurrentClubData(clubData);

          const billsArray = Array.isArray(clubData.airwayBills)
            ? clubData.airwayBills
            : clubData.rowData || [];

          setAirwayBills(billsArray);
          setRowData(clubData.rowData || []);

          // Format date
          let formattedDate = "";
          if (clubData.date) {
            const dateObj = new Date(clubData.date);
            const day = String(dateObj.getDate()).padStart(2, "0");
            const month = String(dateObj.getMonth() + 1).padStart(2, "0");
            const year = dateObj.getFullYear();
            formattedDate = `${day}/${month}/${year}`;
          }

          // Populate form fields
          setValue("runNo", clubData.runNo || "");
          setValue("date", formattedDate);
          setValue("service", clubData.service || "");
          setValue("remarks", clubData.remarks || "");

          setOriginalRunNo(clubData.runNo || "");
          setOriginalClubNo(clubData.clubNo || "");
          setIsEditMode(true);

          clearErrors(["clubNo", "runNo"]);
          showNotification("success", "Club data loaded successfully");
        }
      } catch (error) {
        if (error.response?.status === 404) {
          resetClubData();
        } else {
          console.error("Error fetching club data:", error);
          showNotification("error", "Error loading club data");
        }
      }
    },
    [setValue, clearErrors, server, showNotification]
  );

  const clearAwbFormFields = useCallback(() => {
    setValue("forwardingNo", "");
    setValue("weight", "");
    setValue("service", "");
  }, [setValue]);

  const fetchAwbDetails = useCallback(
    async (enteredAwbNo) => {
      try {
        const response = await axios.get(
          `${server}/portal/create-shipment?awbNo=${enteredAwbNo}`
        );
        const result = response.data;

        if (result && typeof result === "object") {
          // Use totalActualWt or fallback to weight
          const totalWeight = result.totalActualWt ?? result.weight ?? "";

          setValue("forwardingNo", result.forwardingNo ?? "");
          setValue("weight", totalWeight);
          setValue("service", result.service ?? "");
          showNotification("success", "AWB data loaded successfully");
        } else {
          // AWB not found
          clearAwbFormFields();
          showNotification(
            "error",
            `AWB ${enteredAwbNo} not found in shipments`
          );
        }
      } catch (error) {
        console.error("Error fetching AWB data:", error);
        clearAwbFormFields();
        showNotification("error", `AWB ${enteredAwbNo} not found in shipments`);
      }
    },
    [setValue, server, clearAwbFormFields, showNotification]
  );

  // Helper functions
  const resetClubData = useCallback(() => {
    setCurrentClubData(null);
    setRowData([]);
    setAirwayBills([]);
    setIsEditMode(false);
    setOriginalRunNo("");
    setOriginalClubNo("");
    setValue("runNo", "");
    setValue("service", "");
    setValue("remarks", "");
  }, [setValue]);

  const completeReset = useCallback(() => {
    setClubbingReset(!clubbingReset);
    setCurrentClubData(null);
    setRowData([]);
    setAirwayBills([]);
    setIsEditMode(false);
    setEditingIndex(null);
    setNewData(true);

    reset({
      clubNo: "",
      runNo: "",
      service: "",
      remarks: "",
      awbNo: "",
      weight: "",
      bagWeight: "",
      forwardingNo: "",
    });

    clearErrors();
  }, [clubbingReset, reset, clearErrors]);

  // Event handlers with ENHANCED GLOBAL AWB VALIDATION
  const handleAdd = useCallback(async () => {
    const currentAwbNo = getValues("awbNo")?.trim();
    const currentClubNo = getValues("clubNo");
    const weight = getValues("weight");

    if (!currentAwbNo) {
      setError("awbNo", { type: "manual", message: "AWB Number is required" });
      showNotification("error", "AWB Number is required");
      return;
    }

    if (!currentClubNo) {
      setError("clubNo", {
        type: "manual",
        message: "Club Number is required",
      });
      showNotification("error", "Club Number is required");
      return;
    }

    // ✅ ENHANCED VALIDATION with lock check
    const validation = await validateAwbGlobally(currentAwbNo);

    if (!validation.isValid) {
      setError("awbNo", {
        type: "manual",
        message: validation.message,
      });

      // 🔒 CHECK IF AWB IS LOCKED - Show modal
      if (validation.message.toLowerCase().includes("locked")) {
        setLockedAwbInfo({
          awbNo: currentAwbNo,
          message: validation.message,
        });
        setShowDataLockModal(true);
      } else {
        showNotification("error", validation.message);
      }
      return;
    }

    // ✅ ADD to table
    setRowData((prev) => [
      ...prev,
      {
        awbNo: currentAwbNo,
        weight,
        clubNo: currentClubNo,
        remark: getValues("operationRemark") || "",
        sector: getValues("sector") || "",
      },
    ]);

    // ✅ clear fields
    setValue("awbNo", "");
    setValue("weight", "");
    setValue("operationRemark", "");
    setValue("sector", "");
    clearErrors("awbNo");
    showNotification("success", "AWB added to club");
  }, [
    getValues,
    setError,
    showNotification,
    validateAwbGlobally,
    setValue,
    clearErrors,
  ]);

  const handleEditRow = useCallback(
    (index) => {
      const rowToEdit = rowData[index];
      if (rowToEdit) {
        setValue("awbNo", rowToEdit.awbNo || "");
        setValue("weight", rowToEdit.weight || "");
        setValue("bagWeight", rowToEdit.bagWeight || "");
        setEditingIndex(index);
        showNotification("success", "Row loaded for editing");
      }
    },
    [rowData, setValue, showNotification]
  );

  const handleDeleteRow = useCallback(
    (index) => {
      if (Array.isArray(index)) {
        setRowData((prev) => prev.filter((_, i) => !index.includes(i)));
        showNotification("success", `${index.length} AWB(s) deleted from club`);
      } else {
        setRowData((prev) => prev.filter((_, i) => i !== index));
        showNotification("success", "AWB deleted from club");
      }

      // Reset editing state if we're deleting the row being edited
      if (
        editingIndex === index ||
        (Array.isArray(index) && index.includes(editingIndex))
      ) {
        setEditingIndex(null);
        setValue("awbNo", "");
        setValue("weight", "");
        setValue("bagWeight", "");
      }
    },
    [editingIndex, setValue, showNotification]
  );

  const handleTopEditButton = useCallback(() => {
    if (currentClubData) {
      setIsEditMode(true);
      showNotification("success", "Edit mode enabled");
    } else {
      showNotification("error", "Please select a club to edit");
    }
  }, [currentClubData, showNotification]);

  const handleTopDeleteButton = useCallback(() => {
    if (currentClubData?.clubNo) {
      setDeleteTarget(currentClubData.clubNo);
      setActionType("delete");
      setShowActionConfirmModal(true);
    } else {
      showNotification("error", "Please select a club to delete");
    }
  }, [currentClubData, showNotification]);

  const handleLockClubClick = useCallback(() => {
    const clubNumber = getValues("clubNo");
    if (!clubNumber) {
      showNotification("error", "Club Number is required to lock");
      return;
    }

    setActionType("lock");
    setShowActionConfirmModal(true);
  }, [getValues, showNotification]);

  const handleSubmitClick = useCallback((e) => {
    e.preventDefault(); // prevent immediate submit
    setActionType("createUpdate");
    setShowActionConfirmModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (deleteTarget) {
      try {
        const response = await axios.delete(
          `${server}/clubbing?clubNo=${deleteTarget}`
        );
        if (response.status === 200) {
          showNotification("success", "Club deleted successfully");
          completeReset();
        }
      } catch (error) {
        console.error("Error deleting club:", error);
        showNotification("Error deleting club. Please try again.");
      }
    }
    setShowConfirmModal(false);
    setDeleteTarget(null);
  }, [deleteTarget, completeReset, server, showNotification]);

  const cancelDelete = useCallback(() => {
    setShowConfirmModal(false);
    setDeleteTarget(null);
  }, []);

  const handleRefresh = useCallback(() => {
    completeReset();
    showNotification("success", "Form refreshed");
  }, [completeReset, showNotification]);

  const onSubmit = useCallback(
    async (data) => {
      try {
        // Validate ONLY if runNo has a value
        if (data.runNo && data.runNo.trim() !== "") {
          const runNoValidation = await validateRunNo(data.runNo);
          if (!runNoValidation.isValid) {
            setError("runNo", {
              type: "manual",
              message: runNoValidation.message,
            });
            showNotification(
              "error",
              "Please fix validation errors before submitting"
            );
            return;
          }
        }

        // Check if we have AWB data
        if (!rowData?.length) {
          showNotification(
            "error",
            "Please add at least one AWB to the club before submitting."
          );
          return;
        }

        const payload = {
          runNo: data.runNo,
          clubNo: data.clubNo,
          date: data.date,
          service: data.service,
          remarks: data.remarks,
          rowData: rowData,
        };

        let response;
        if (isEditMode && currentClubData) {
          response = await axios.put(
            `${server}/clubbing?clubNo=${data.clubNo}`,
            payload
          );
        } else {
          response = await axios.post(`${server}/clubbing`, payload);
        }

        if (response.status === 200 || response.status === 201) {
          const successMessage = isEditMode
            ? "Club updated successfully!"
            : "Club created successfully!";
          showNotification("success", successMessage);
          completeReset();
        }
      } catch (error) {
        console.error(
          "Error saving data:",
          error.response?.data || error.message
        );
        showNotification(
          "error",
          "Error saving data. Please check console for details."
        );
      }
    },
    [
      validateRunNo,
      setError,
      rowData,
      isEditMode,
      currentClubData,
      completeReset,
      server,
      showNotification,
    ]
  );

  // Effects
  useEffect(() => {
    if (clubNo?.trim()) {
      fetchClubData(clubNo.trim());
    } else {
      resetClubData();
    }
  }, [clubNo, fetchClubData, resetClubData]);

  useEffect(() => {
    const currentDate = new Date();
    if (newData) {
      const formattedDate = formatDateForDisplay(currentDate);
      setDate(formattedDate);
      setValue("date", formatDateForInput(currentDate));
    } else {
      setDate("--/--/----");
    }
  }, [newData, setValue, formatDateForDisplay, formatDateForInput]);

  useEffect(() => {
    const enteredAwbNo = awbNo?.trim();
    if (!enteredAwbNo || enteredAwbNo.length < 4) return;

    fetchAwbDetails(enteredAwbNo);
  }, [awbNo, fetchAwbDetails]);

  useEffect(() => {
    const enteredAwbNo = awbNo?.trim();
    if (!enteredAwbNo) return;

    const handler = setTimeout(() => {
      const billsArray = Array.isArray(airwayBills) ? airwayBills : [];

      const matchedAwb = billsArray.find(
        (bill) => bill.awbNo?.toLowerCase() === enteredAwbNo.toLowerCase()
      );

      if (matchedAwb) {
        const weight = matchedAwb.boxes?.[0]?.weight ?? "";
        setValue("forwardingNo", matchedAwb.forwardingNo ?? "");
        setValue("service", matchedAwb.service ?? "");
        setValue("weight", weight);
      }
    }, 1000);

    return () => clearTimeout(handler);
  }, [awbNo, airwayBills, setValue]);

  // FIXED: Real-time runNo validation with proper debouncing
  useEffect(() => {
    if (!runNo || runNo.trim() === "") {
      clearErrors("runNo");
      return;
    }

    // Don't validate during edit mode with original run number
    if (isEditMode && runNo.trim() === originalRunNo) {
      clearErrors("runNo");
      return;
    }

    const timeoutId = setTimeout(async () => {
      const v = await validateRunNo(runNo.trim());
      if (!v.isValid) {
        setError("runNo", { type: "manual", message: v.message });
      } else {
        clearErrors("runNo");
      }
    }, 600);
    return () => clearTimeout(timeoutId);
  }, [runNo, setError, clearErrors, validateRunNo, isEditMode, originalRunNo]);

  // ENHANCED GLOBAL AWB REAL-TIME VALIDATION
  useEffect(() => {
    if (!awbNo?.trim() || awbNo.trim().length < 4) {
      clearErrors("awbNo");
      return;
    }

    const validateAwbAsync = async () => {
      console.log(`Real-time validating AWB: ${awbNo.trim()}`);
      const validation = await validateAwbGlobally(awbNo.trim());

      if (!validation.isValid) {
        setError("awbNo", {
          type: "manual",
          message: validation.message,
        });
      } else {
        clearErrors("awbNo");
      }
    };

    // Debounce validation to avoid too many API calls
    const timeoutId = setTimeout(validateAwbAsync, 1500);
    return () => clearTimeout(timeoutId);
  }, [awbNo, validateAwbGlobally, setError, clearErrors]);

  const handleKeyDown = (e) => {
    // Prevent form submission when Enter is pressed in input fields
    if (e.key === "Enter") {
      e.preventDefault();
      return false;
    }
  };

  const handleLockClub = useCallback(async () => {
    const clubNumber = getValues("clubNo");
    if (!clubNumber) {
      showNotification("error", "Club Number is required to lock");
      return;
    }

    try {
      const response = await axios.put(
        `${server}/clubbing/lock-club?clubNo=${clubNumber}`
      );
      if (response.status === 200) {
        showNotification("success", "Club locked successfully");
        setIsDisabled(true); // disable form inputs and buttons
      }
    } catch (error) {
      console.error("Error locking club:", error);
      showNotification("error", "Failed to lock club");
    }
  }, [getValues, server, showNotification]);

  const handleActionConfirm = useCallback(async () => {
    setShowActionConfirmModal(false);

    if (actionType === "delete") {
      await confirmDelete(); // await deletion
    } else if (actionType === "lock") {
      await handleLockClub(); // await lock
    } else if (actionType === "createUpdate") {
      await onSubmit(getValues()); // directly call onSubmit with form values
    }
  }, [actionType, confirmDelete, handleLockClub, onSubmit, getValues]);

  const handleCloseDataLockModal = useCallback(() => {
    setShowDataLockModal(false);
    setLockedAwbInfo({ awbNo: "", message: "" });

    // Clear the AWB field to allow user to enter a different AWB
    handleRefresh();
  }, [setValue, clearErrors]);

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form
        className="flex flex-col gap-9"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={handleKeyDown}
      >
        <Heading
          title="Clubbing"
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          onRefresh={handleRefresh}
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <RedLabelHeading label="Club details" />
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <InputBoxYellow
                register={register}
                placeholder="Club Number"
                setValue={setValue}
                value="clubNo"
                disabled={false}
                resetFactor={clubbingReset}
                error={errors.clubNo}
                trigger={trigger}
                validation={{ required: "Club Number is required" }}
                setError={setError}
              />

              <DummyInputBoxWithLabelTransparent
                key={`date-${clubbingReset}-${date}`}
                watch={watch}
                label="Date"
                inputValue={date}
                register={register}
                setValue={setValue}
                defaultValue={formatDateForInput(new Date())}
                value="date"
              />

              <div className="relative">
                <InputBox
                  placeholder="AWB Number"
                  register={register}
                  setValue={setValue}
                  value="awbNo"
                  watch={watch}
                  resetFactor={clubbingReset}
                  error={errors.awbNo}
                  trigger={trigger}
                  initialValue={watch("awbNo") || ""}
                />
                {isValidatingAwb && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  </div>
                )}
                {/* {errors.awbNo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.awbNo.message}
                  </p>
                )} */}
              </div>

              <div className="relative">
                <InputBox
                  placeholder="Run Number"
                  register={register}
                  setValue={setValue}
                  value="runNo"
                  resetFactor={clubbingReset}
                  error={errors.runNo}
                  trigger={trigger}
                  setError={setError}
                  // validation={{ required: "Run Number is required" }}
                  initialValue={currentClubData?.runNo || ""}
                />
                {isValidatingRunNo && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
                {/* {errors.runNo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.runNo.message}
                  </p>
                )} */}
              </div>

              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="Forwarding Number"
                setValue={setValue}
                value="forwardingNo"
                disabled={isDisabled}
              />

              <DummyInputBoxWithLabelDarkGray
                register={register}
                setValue={setValue}
                value="service"
                label="Service"
                inputValue={airwayBills?.service || ""}
              />

              <div className="flex w-full">
                <DummyInputBoxWithLabelTransparent
                  label="Weight"
                  register={register}
                  setValue={setValue}
                  value="weight"
                  initialValue={airwayBills?.weight || ""}
                  watch={watch}
                  resetFactor={clubbingReset}
                />
              </div>

              <OutlinedButtonRed
                label={editingIndex !== null ? "Update AWB" : "Add AWB to Club"}
                onClick={handleAdd}
              />
            </div>
          </div>

          <SearchInputBox placeholder="Search AWB No." />

          <TableWithCheckboxEditDelete
            register={register}
            setValue={setValue}
            name="bagging"
            columns={columns}
            rowData={rowData}
            handleEdit={handleEditRow}
            handleDelete={handleDeleteRow}
          />

          <DummyInputBoxWithLabelDarkGray
            register={register}
            label="Remarks"
            setValue={setValue}
            value="remarks"
          />

          <div className="flex justify-between">
            <div className="flex gap-2">
              <div>
                <EditButton onClick={handleTopEditButton} />
              </div>
              <div>
                <DeleteButton
                  onClick={handleTopDeleteButton}
                  perm="Operation Deletion"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div>
                <SimpleButton
                  name={isEditMode ? "Update Club" : "Create Club"}
                  type="button"
                  onClick={handleSubmitClick}
                />
              </div>
              <div>
                {/* <OutlinedButtonRed label="Close" /> */}
                <OutlinedButtonRed
                  label="Lock Clubbing"
                  onClick={handleLockClubClick}
                />
              </div>
            </div>
          </div>
        </div>
      </form>
      {/* Confirmation Modal */}
      {showActionConfirmModal && (
        <ConfirmationModal
          onConfirm={handleActionConfirm}
          onCancel={() => setShowActionConfirmModal(false)}
          message={
            actionType === "delete"
              ? `Are you sure you want to delete club ${deleteTarget}?`
              : actionType === "lock"
              ? "Are you sure you want to lock this club?"
              : "Are you sure you want to create/update this club?"
          }
        />
      )}
      {/* Action Confirmation Modal */}
      {showActionConfirmModal && (
        <ConfirmationModal
          onConfirm={handleActionConfirm}
          onCancel={() => setShowActionConfirmModal(false)}
          message={
            actionType === "delete"
              ? `Are you sure you want to delete club ${deleteTarget}?`
              : actionType === "lock"
              ? "Are you sure you want to lock this club?"
              : "Are you sure you want to create/update this club?"
          }
        />
      )}

      {/* 🔒 Data Lock Modal */}
      <DataLockModal
        isOpen={showDataLockModal}
        onClose={handleCloseDataLockModal}
        awbNo={lockedAwbInfo.awbNo}
        message={lockedAwbInfo.message}
      />
    </>
  );
};

// Confirmation Modal Component
const ConfirmationModal = ({ onConfirm, onCancel, message }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
        <h3 className="text-lg font-semibold mb-4">
          {message || "Are you sure you want to proceed?"}
        </h3>
        <p className="mb-6">{message ? "" : "This action cannot be undone."}</p>
        <div className="flex justify-end gap-3">
          <OutlinedButtonRed label="Cancel" onClick={onCancel} />
          <SimpleButton name="Confirm" onClick={onConfirm} />
        </div>
      </div>
    </div>
  );
};

export default Clubbing;
