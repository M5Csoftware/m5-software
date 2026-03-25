"use client";
import dynamic from "next/dynamic";
const HoldHistory = dynamic(
  () => import("@/app/components/awb-entry/HoldHistory"),
  { ssr: false },
);
const InvoiceDetails = dynamic(
  () => import("@/app/components/awb-entry/InvoiceDetails"),
  { ssr: false },
);
const VolumeWeight = dynamic(
  () => import("@/app/components/awb-entry/VolumeWeight"),
  { ssr: false },
);
import { OutlinedButtonRed } from "@/app/components/Buttons";
import {
  LabeledDropdown,
  SearchableDropDrown,
} from "@/app/components/Dropdown";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxLightGray,
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelLightGray,
  DummyInputBoxWithLabelTransparent,
  DummyInputBoxWithLabelYellow,
} from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { InputBoxYellow } from "@/app/components/InputBox";
import {
  RedCheckboxBase,
  RedCheckboxRedLabel,
} from "@/app/components/RedCheckBox";
import Image from "next/image";
import React, {
  useEffect,
  useContext,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import BgBlack from "@/app/components/BgBlack";
import axios from "axios";
import CodeList from "@/app/components/CodeList";
import { useAuth } from "@/app/Context/AuthContext";
import pushAWBLog from "@/app/lib/pushAWBLog";
import pushHoldLog from "@/app/lib/pushHoldLog";
import NotificationFlag from "@/app/components/Notificationflag";
import { useAlertCheck } from "@/app/hooks/useAlertCheck";
import { AlertModal } from "@/app/components/AlertModal";
import PasswordModal from "@/app/components/passwordModal";
import { useDebounce } from "@/app/hooks/useDebounce";

function AwbBilling() {
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    setError,
    clearErrors,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm();

  const { sectors, setActualWtt, server, setGlobalTotalPcs } =
    useContext(GlobalContext);
  const { user } = useAuth();

  const [fetchedAwbData, setFetchedAwbData] = useState({});
  const [account, setAccount] = useState(null);
  const [amountDetails, setAmountDetails] = useState(null);

  const [isEdit, setIsEdit] = useState(false);
  const [isHold, setIsHold] = useState(false);
  const [newShipment, setNewShipment] = useState(null);
  const [btnAction, setBtnAction] = useState(null);

  const [isAutomation, setIsAutomation] = useState(false);
  const [isHandling, setIsHandling] = useState(false);
  const [isCSB, setIsCSB] = useState(false);
  const [isCommercialShipment, setIsCommercialShipment] = useState(false);

  const [holdHistoryWindow, setHoldHistoryWindow] = useState(false);
  const [volumeWtWindow, setVolumeWtWindow] = useState(false);
  const [invoiceDetailsWindow, setInvoiceDetailsWindow] = useState(false);

  const [date, setDate] = useState("");
  const [selectedSector, setSelectedSector] = useState("");
  const [destinations, setDestinations] = useState([]);
  const [selectedDestination, setSelectedDestinations] = useState("");
  const [zones, setZones] = useState([]);
  const [selectedService, setSelectedService] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);
  const [resetServiceAndDestination, setResetServiceAndDestination] =
    useState(false);

  const [applicableRates, setApplicableRates] = useState({});
  const [finalServices, setFinalServices] = useState([]);

  const [volumeContent, setVolumeContent] = useState({});
  const [invoiceContent, setInvoiceContent] = useState([]);
  const [totalKg, setTotalKg] = useState(0.0);
  const [invTotalValue, setInvoiceTotalValue] = useState(0.0);
  const [invContent, setInvContent] = useState([]);

  const [branch, setBranch] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);

  const [responseMsg, setResponseMsg] = useState("");
  const [visibleFlag, setVisibleFlag] = useState(false);

  const { checkAlert } = useAlertCheck();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", awbNo: "" });
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // Service validation state
  const [serviceValidation, setServiceValidation] = useState({
    valid: true,
    errors: [],
    warnings: [],
    serviceDetails: null,
  });

  // Zone status checking state
  const [isRemoteOrUnserviceable, setIsRemoteOrUnserviceable] = useState(false);
  const [zoneAlertData, setZoneAlertData] = useState({
    isOpen: false,
    message: "",
    zoneType: "",
    destination: "",
    zone: "",
  });
  const [pendingZoneUpdate, setPendingZoneUpdate] = useState(false);

  // Refresh functionality state
  const [refreshKey, setRefreshKey] = useState(0);

  // Manual account entry tracking
  const [isManualAccountEntry, setIsManualAccountEntry] = useState(false);
  const [lastEnteredCode, setLastEnteredCode] = useState("");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const formatDate = (date) => {
    if (!date) return "";
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "";
    return (
      dateObj.getDate().toString().padStart(2, "0") +
      "/" +
      (dateObj.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      dateObj.getFullYear()
    );
  };

  // Watching input values
  const awbNo = watch("awbNo");
  const pcs = useWatch({ control, name: "pcs" });
  const actualWt = useWatch({ control, name: "actualWt" });
  const volWt = useWatch({ control, name: "volWt" });
  const chargeableWt = useWatch({ control, name: "chargeableWt" });
  const invoiceValue = useWatch({ control, name: "invoiceValue" });

  // holdreason dynamic rendering
  const [holdReason, setHoldReason] = useState("");
  const grandTotal = watch("grandTotal");
  const [holdEdit, setHoldEdit] = useState(false);
  const volDisc = watch("volDisc");
  const holdReasonValue = watch("holdReason");

  // Automatically clear hold reasons when isHold is false
  useEffect(() => {
    if (!isHold) {
      setHoldReason("");
      setValue("holdReason", "");
      setValue("otherHoldReason", "");
    }
  }, [isHold, setValue]);

  //payment type
  const [showFOCPasswordModal, setShowFOCPasswordModal] = useState(false);
  const [prevPayment, setPrevPayment] = useState(
    fetchedAwbData?.payment || "Credit",
  );
  const [focUnlocked, setFocUnlocked] = useState(false);
  const selectedPayment = watch("payment");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkType, setNetworkType] = useState("");
  const [awbLoading, setAwbLoading] = useState(false);
  const consigneeZipcode = useWatch({ control, name: "consignee-zipcode" });

  // Initialize hold state from fetched data
  useEffect(() => {
    if (fetchedAwbData && Object.keys(fetchedAwbData).length > 0) {
      setIsHold(fetchedAwbData.isHold || false);
      setHoldReason(fetchedAwbData.holdReason || "");
      setValue("isHold", fetchedAwbData.isHold || false);
      setValue("holdReason", fetchedAwbData.holdReason || "");
      setValue("otherHoldReason", fetchedAwbData.otherHoldReason || "");
      setHoldEdit(false);
    }
  }, [fetchedAwbData, setValue]);

  // FETCH ALL SERVICE MASTER DATA
  const [serviceMasterList, setServiceMasterList] = useState([]);

  useEffect(() => {
    if (!server) return;

    const fetchServices = async () => {
      try {
        const res = await axios.get(`${server}/service-master`);
        setServiceMasterList(res.data || []);
      } catch (err) {
        console.error("Error fetching service list:", err);
        setServiceMasterList([]);
      }
    };

    fetchServices();
  }, [server]);

  // Calculate chargeableWt dynamically
  useEffect(() => {
    const actual = Number(actualWt) || 0;
    const vol = Number(volWt) || 0;
    const disc = Number(volDisc) || 0;

    if (actual > 0 && vol > 0) {
      const diff = vol - actual;
      const discount = (diff * disc) / 100;
      const discountedVol = vol - discount;
      const chargable = Math.max(actual, discountedVol);
      if (chargable < 1) {
        setValue("chargeableWt", chargable.toFixed(2));
      } else {
        setValue("chargeableWt", Math.ceil(chargable));
      }
    } else if (actual > 0) {
      setValue(
        "chargeableWt",
        actual < 1 ? actual.toFixed(2) : Math.ceil(actual),
      );
    } else {
      setValue("chargeableWt", "0.00");
    }
  }, [actualWt, volWt, volDisc, setValue]);

  // set values in globalContext
  useEffect(() => {
    setActualWtt(watch("actualWt"));
  }, [watch("actualWt")]);

  useEffect(() => {
    setGlobalTotalPcs(watch("pcs"));
  }, [watch("pcs")]);

  // Service validation function
  const validateServiceAgainstMaster = async (serviceName, formData) => {
    if (!serviceName || !server) {
      return { valid: true, errors: [], warnings: [] };
    }

    try {
      const payload = {
        serviceName,
        pcs: Number(formData.pcs) || 0,
        dimensions: {
          length: 0,
          width: 0,
          height: 0,
        },
        weights: {
          actualWt: Number(formData.actualWt) || 0,
          volWt: Number(formData.volWt) || 0,
          chargeableWt: Number(formData.chargeableWt) || 0,
          invoiceValue: Number(formData.invoiceValue) || 0,
        },
      };

      const response = await axios.post(
        `${server}/service-master/validate`,
        payload,
      );
      setServiceValidation(response.data);

      if (response.data.warnings?.length > 0) {
        response.data.warnings.forEach((warning) => {
          showNotification("warning", warning);
        });
      }

      if (response.data.errors?.length > 0) {
        response.data.errors.forEach((error) => {
          if (error.includes("PCS") || error.includes("pieces")) {
            setError("pcs", { type: "manual", message: error });
          } else if (error.includes("actual weight")) {
            setError("actualWt", { type: "manual", message: error });
          } else if (error.includes("volume weight")) {
            setError("volWt", { type: "manual", message: error });
          } else if (error.includes("chargeable weight")) {
            setError("chargeableWt", { type: "manual", message: error });
          } else if (error.includes("shipment value")) {
            setError("invoiceValue", { type: "manual", message: error });
          }
        });
      }

      return response.data;
    } catch (error) {
      console.error("Service validation error:", error);
      return { valid: true, errors: [], warnings: [] };
    }
  };

  // Enhanced validation rules function
  const validateServiceRules = (
    serviceData,
    { pcs, actualWt, volWt, chargeableWt, invoiceValue },
  ) => {
    if (!serviceData) return { ok: true, errors: [] };

    const errors = [];

    if (!serviceData.multiplePcsAllow && pcs > 1) {
      errors.push({
        field: "pcs",
        msg: "Multiple pieces not allowed for this service",
      });
    }

    if (
      serviceData.multiplePcsAllow &&
      serviceData.noOfPcs > 0 &&
      pcs > serviceData.noOfPcs
    ) {
      errors.push({
        field: "pcs",
        msg: `Maximum ${serviceData.noOfPcs} pieces allowed per AWB`,
      });
    }

    if (serviceData.maxPcsPerAWB && pcs > serviceData.maxPcsPerAWB) {
      errors.push({
        field: "pcs",
        msg: `Maximum ${serviceData.maxPcsPerAWB} pieces per AWB`,
      });
    }

    if (serviceData.averageWeightAllow && serviceData.averageLimit > 0) {
      if (actualWt > serviceData.averageLimit) {
        errors.push({
          field: "actualWt",
          msg: `Average weight limit: ${serviceData.averageLimit}kg per AWB`,
        });
      }

      if (serviceData.boxLimit > 0 && pcs > 0) {
        const avgPerBox = actualWt / pcs;
        if (avgPerBox > serviceData.boxLimit) {
          errors.push({
            field: "actualWt",
            msg: `Average per box: ${avgPerBox.toFixed(2)}kg exceeds limit of ${
              serviceData.boxLimit
            }kg per AWB`,
          });
        }
      }
    }

    if (
      serviceData.maxShipmentValue &&
      invoiceValue > serviceData.maxShipmentValue
    ) {
      errors.push({
        field: "invoiceValue",
        msg: `Maximum shipment value per AWB: ${serviceData.maxShipmentValue}`,
      });
    }

    const perAWB = serviceData.perAWB || {};
    if (perAWB.minActualWeight && actualWt < perAWB.minActualWeight) {
      errors.push({
        field: "actualWt",
        msg: `Minimum per AWB actual weight: ${perAWB.minActualWeight}kg`,
      });
    }
    if (perAWB.maxActualWeight && actualWt > perAWB.maxActualWeight) {
      errors.push({
        field: "actualWt",
        msg: `Maximum per AWB actual weight: ${perAWB.maxActualWeight}kg`,
      });
    }
    if (perAWB.minVolumeWeight && volWt < perAWB.minVolumeWeight) {
      errors.push({
        field: "volWt",
        msg: `Minimum per AWB volume weight: ${perAWB.minVolumeWeight}kg`,
      });
    }
    if (perAWB.maxVolumeWeight && volWt > perAWB.maxVolumeWeight) {
      errors.push({
        field: "volWt",
        msg: `Maximum per AWB volume weight: ${perAWB.maxVolumeWeight}kg`,
      });
    }
    if (
      perAWB.minChargeableWeight &&
      chargeableWt < perAWB.minChargeableWeight
    ) {
      errors.push({
        field: "chargeableWt",
        msg: `Minimum per AWB chargeable weight: ${perAWB.minChargeableWeight}kg`,
      });
    }
    if (
      perAWB.maxChargeableWeight &&
      chargeableWt > perAWB.maxChargeableWeight
    ) {
      errors.push({
        field: "chargeableWt",
        msg: `Maximum per AWB chargeable weight: ${perAWB.maxChargeableWeight}kg`,
      });
    }

    return { ok: errors.length === 0, errors };
  };

  // Function to check zone status
  const checkZoneStatus = async (destination, service) => {
    if (!destination || !selectedSector || !service) {
      return null;
    }

    try {
      const zoneData = zones.find(
        (zone) =>
          zone.destination === destination &&
          zone.service === service &&
          zone.sector === selectedSector,
      );

      if (!zoneData) {
        return null;
      }

      const zoneNumber = zoneData.zone;
      const isRemote = zoneData.remoteZones?.includes(zoneNumber) || false;
      const isUnserviceable =
        zoneData.unserviceableZones?.includes(zoneNumber) || false;

      return {
        zoneNumber,
        isRemote,
        isUnserviceable,
        zoneData,
      };
    } catch (error) {
      console.error("Error checking zone status:", error);
      return null;
    }
  };

  // Function to handle zone alert confirmation
  const handleZoneAlertConfirm = () => {
    const currentRemark = watch("operationRemark") || "";
    const newRemark = currentRemark
      ? `${currentRemark}. ${
          zoneAlertData.zoneType === "remote" ? "Remote" : "Unserviceable"
        } area confirmed (Zone ${zoneAlertData.zone})`
      : `${
          zoneAlertData.zoneType === "remote" ? "Remote" : "Unserviceable"
        } area confirmed (Zone ${zoneAlertData.zone})`;

    setValue("operationRemark", newRemark);
    setZoneAlertData({ ...zoneAlertData, isOpen: false });
    setPendingZoneUpdate(false);

    showNotification(
      "warning",
      `${
        zoneAlertData.zoneType === "remote" ? "Remote" : "Unserviceable"
      } area confirmed. Remark updated.`,
    );
  };

  // Function to handle zone alert cancellation
  const handleZoneAlertCancel = () => {
    setValue("destination", "");
    setSelectedDestinations("");
    setZoneAlertData({ ...zoneAlertData, isOpen: false });
    setPendingZoneUpdate(false);
    setIsRemoteOrUnserviceable(false);

    showNotification(
      "info",
      `Destination cleared. ${
        zoneAlertData.zoneType === "remote" ? "Remote" : "Unserviceable"
      } area not selected.`,
    );
  };

  // handle AWB Billing Operations
  const handleAWBBilling = async (data) => {
    if (!fetchedAwbData?.runNo || !fetchedAwbData?.bag) {
      showNotification(
        "error",
        "Cannot bill this AWB - Run No and Bag No are missing. Please bag the shipment first.",
      );
      return;
    }

    if (selectedService && serviceValidation && !serviceValidation.valid) {
      showNotification(
        "error",
        "Service validation failed. Please check errors.",
      );
      return;
    }

    if (serviceValidation.warnings?.length > 0) {
      const shouldProceed = window.confirm(
        `Service has ${serviceValidation.warnings.length} warnings:\n` +
          serviceValidation.warnings.join("\n") +
          "\n\nDo you want to proceed?",
      );

      if (!shouldProceed) {
        return;
      }
    }

    const { code, ...fillterData } = data;
    const accountCode = code;
    const updateUser = user?.userId;
    const payload = { accountCode, ...fillterData };

    const getCustomerName = async (accountCode) => {
      try {
        if (!accountCode) return "";
        const customerResponse = await axios.get(
          `${server}/customer-account?accountCode=${accountCode.toUpperCase()}`,
        );
        return customerResponse.data?.name || "";
      } catch (err) {
        console.warn("Failed to fetch customer name:", err);
        return "";
      }
    };

    const logHoldAction = async (action, reason, additionalData = {}) => {
      try {
        const customer = await getCustomerName(accountCode);
        const holdLogPayload = {
          awbNo: payload.awbNo || awbNo,
          accountCode,
          customer,
          action: action,
          actionUser: user?.userId || "System",
          departmentName: user?.department || "Billing",
          holdReason: reason,
          actionSystemName: "AwbBilling",
          ...additionalData,
        };

        const response = await axios.post(
          `${server}/hold-log/action`,
          holdLogPayload,
        );
        return response.data;
      } catch (error) {
        console.error(`Error logging hold action (${action}):`, error);
        return null;
      }
    };

    const logAwbAction = async (action, department = "Billing") => {
      try {
        const customer = await getCustomerName(accountCode);
        await pushAWBLog({
          awbNo: payload.awbNo || awbNo,
          accountCode,
          customer,
          action: action,
          actionUser: user?.userId,
          department: department,
        });
      } catch (error) {
        console.error("Error logging AWB action:", error);
      }
    };

    if (newShipment == "old" && btnAction == "save" && isEdit == false) {
      try {
        setIsSubmitting(true);

        const response = await axios.put(
          `${server}/portal/create-shipment/awb-billing?awbNo=${awbNo}`,
          { ...payload, updateUser },
        );

        if (response?.status === 200) {
          if (isHold && !fetchedAwbData?.isHold) {
            await logHoldAction("Hold", payload.holdReason || "Billing Update");
            await logAwbAction("Shipment put on hold during billing");
          } else if (!isHold && fetchedAwbData?.isHold) {
            await logHoldAction("Unhold", "Hold Removed during billing");
            await logAwbAction("Shipment unhold during billing");
          } else {
            await logAwbAction("Billing Updated");
          }
        }

        showNotification("success", "Billing Updated Successfully");
        handleRefresh();
      } catch (error) {
        console.error(error);
        showNotification("error", "Error updating AWB Billing");
      } finally {
        setIsSubmitting(false);
        setBtnAction(null);
      }
    }
  };

  // Window handlers
  const openVolumeWtWindow = () => {
    setHoldHistoryWindow(false);
    setInvoiceDetailsWindow(false);
    setVolumeWtWindow(true);
  };

  const openInvoiceDetailsWindow = () => {
    setHoldHistoryWindow(false);
    setVolumeWtWindow(false);
    setInvoiceDetailsWindow(true);
  };

  const openHoldHistoryWindow = () => {
    setHoldHistoryWindow(true);
    setVolumeWtWindow(false);
    setInvoiceDetailsWindow(false);
  };

  // Window shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F8") {
        openVolumeWtWindow();
      } else if (event.key === "Escape") {
        setHoldHistoryWindow(false);
        setVolumeWtWindow(false);
        setInvoiceDetailsWindow(false);
      } else if (event.key === "F9") {
        openInvoiceDetailsWindow();
      } else if (event.key === "F11" && !isEdit) {
        openHoldHistoryWindow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEdit]);

  // Window styling
  useEffect(() => {
    if (holdHistoryWindow || invoiceDetailsWindow || volumeWtWindow) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [holdHistoryWindow, invoiceDetailsWindow, volumeWtWindow]);

  // Customer account details fetching - with manual entry tracking
  const debouncedCode = useDebounce(watch("code"), 500);

  useEffect(() => {
    if (!debouncedCode || !server) return;

    const fetchAccount = async () => {
      try {
        setIsManualAccountEntry(true);
        setLastEnteredCode(debouncedCode.toUpperCase());

        const response = await axios.get(
          `${server}/customer-account?accountCode=${debouncedCode.toUpperCase()}`,
        );

        if (response.data) {
          setAccount(response.data);
          setValue("customer", response.data?.name || "");
          setValue(
            "accountBalance",
            response.data?.leftOverBalance?.toFixed(2) || "0.00",
          );
          setValue("code", debouncedCode.toUpperCase());

          localStorage.setItem(
            `customer_${debouncedCode.toUpperCase()}`,
            JSON.stringify({
              name: response.data?.name || "",
              balance: response.data?.leftOverBalance?.toFixed(2) || "0.00",
              timestamp: Date.now(),
            }),
          );
        } else {
          setAccount(null);
          setValue("customer", "");
          setValue("accountBalance", "");
          setError("code", {
            type: "manual",
            message: "Customer account not found",
          });
        }
      } catch (error) {
        console.error("Failed to fetch account:", error);
        setAccount(null);
        setValue("customer", "");
        setValue("accountBalance", "");
      }
    };

    fetchAccount();
  }, [debouncedCode, server, setValue, setError]);

  // Reset manual entry flag when code field is cleared
  useEffect(() => {
    const currentCode = watch("code");
    if (!currentCode) {
      setIsManualAccountEntry(false);
      setLastEnteredCode("");
    }
  }, [watch("code")]);

  // getting amount sections data
  const [airwayBills, setAirwayBills] = useState([]);

  useEffect(() => {
    const fetchAirwayBills = async () => {
      try {
        const response = await axios.get(`${server}/rate-sheet`);
        setAirwayBills(response.data);
      } catch (err) {
        console.error("Error fetching airway bills:", err);
      }
    };
    fetchAirwayBills();
  }, [server]);

  const debouncedAwbNo = useDebounce(watch("awbNo"), 800);

  useEffect(() => {
    const enteredAwbNo = debouncedAwbNo?.trim();
    if (!enteredAwbNo) return;

    const matchedAwb = airwayBills.find(
      (bill) => bill.awbNo?.toUpperCase() === enteredAwbNo.toUpperCase(),
    );

    if (matchedAwb) {
      const keys = [
        "manualAmount",
        "cashRecvAmount",
        "balanceAmount",
        "handlingAmount",
        "miscChg",
        "miscChgReason",
        "duty",
        "overWtHandling",
        "hikeAmt",
        "fuelPercentage",
        "fuelAmt",
        "discount",
        "sgst",
        "cgst",
        "igst",
        "currency",
      ];

      keys.forEach((key) => {
        setValue(key, matchedAwb[key] ?? "");
      });
    } else {
      const keys = [
        "manualAmount",
        "cashRecvAmount",
        "balanceAmount",
        "handlingAmount",
        "miscChg",
        "miscChgReason",
        "duty",
        "overWtHandling",
        "hikeAmt",
        "fuelPercentage",
        "fuelAmt",
        "discount",
        "sgst",
        "cgst",
        "igst",
        "currency",
      ];
      keys.forEach((key) => {
        setValue(key, "");
      });
    }
  }, [watch("awbNo"), airwayBills, setValue]);

  // Find sector
  useEffect(() => {
    const selectedSectorName = watch("sector");

    if (!sectors || !Array.isArray(sectors)) {
      console.error("Sectors data is missing or not an array");
      setDestinations([]);
      setResetServiceAndDestination((prev) => !prev);
      return;
    }

    const selectedSector = sectors.find(
      (sec) => sec.name === selectedSectorName,
    );
    const selectedSectorCode = selectedSector ? selectedSector.code : null;

    setSelectedSector(selectedSectorCode);

    if (!selectedSectorCode) {
      console.warn("No matching sector code found.");
      return;
    }

    const fetchZoneData = async () => {
      try {
        const response = await axios.get(
          `${server}/portal/create-shipment/get-zones?sector=${selectedSectorCode}`,
        );

        const zoneData = response.data || [];
        setZones(zoneData);

        if (!Array.isArray(zoneData)) {
          console.error("Zones data is missing or not an array");
          setDestinations([]);
          setResetServiceAndDestination((prev) => !prev);
          return;
        }

        const filteredDestinations = zoneData
          .filter((zone) => zone.sector === selectedSectorCode)
          .map((zone) => zone.destination);

        setDestinations(filteredDestinations);
      } catch (error) {
        console.error("Error fetching zones:", error);
        setDestinations([]);
      }
    };

    fetchZoneData();
  }, [watch("sector"), sectors, server]);

  useEffect(() => {
    setResetServiceAndDestination((prev) => !prev);
  }, [selectedSector, watch("sector")]);

  useEffect(() => {
    setSelectedDestinations(watch("destination"));
  }, [watch("destination")]);

  // Filtering services based on sector and destination
  useEffect(() => {
    if (!zones || !Array.isArray(zones)) {
      console.error("Zones data is missing or not an array");
      return;
    }

    if (!selectedSector || !selectedDestination) {
      console.warn("Selected sector or destination is missing.");
      return;
    }

    const filteredResults = zones
      .filter(
        (zone) =>
          zone.sector === selectedSector &&
          zone.destination === selectedDestination,
      )
      .map((zone) => ({
        service: zone.service,
        zone: zone.zone,
      }));

    setFilteredServices(filteredResults);
  }, [watch("destination"), selectedSector, selectedDestination, zones]);

  // Getting applicable rates
  useEffect(() => {
    const getApplicableRates = async () => {
      try {
        const response = await axios.get(
          `${server}/shipper-tariff?accountCode=${account.accountCode}`,
        );
        setApplicableRates(response.data);
      } catch (error) {
        setApplicableRates(null);
        console.error("Error fetching applicable rates:", error);
      }
    };

    if (account) {
      getApplicableRates();
    }
  }, [account, server]);

  // Filtering final services
  useEffect(() => {
    if (filteredServices.length > 0 && applicableRates) {
      const applicableList = Array.isArray(applicableRates)
        ? applicableRates
        : applicableRates?.ApplicableRates || [];

      const normalizeService = (str) =>
        str
          ?.toLowerCase()
          .replace(/[-\s]+/g, "")
          .trim() || "";

      const applicableSet = new Set(
        applicableList.map((a) => normalizeService(a.service)),
      );

      const commonServices = filteredServices.filter((f) =>
        Array.from(applicableSet).some(
          (service) =>
            normalizeService(f.service).includes(service) ||
            service.includes(normalizeService(f.service)),
        ),
      );

      const uniqueServiceNames = new Map();
      commonServices.forEach((item) => {
        const normalizedName = normalizeService(item.service);
        if (!uniqueServiceNames.has(normalizedName)) {
          uniqueServiceNames.set(normalizedName, item);
        }
      });

      const availableServices = Array.from(uniqueServiceNames.values());

      const activeServiceSet = new Set(
        serviceMasterList
          .filter((s) => s.softwareStatus?.toLowerCase() === "active")
          .map((s) => s.serviceName.toLowerCase().trim()),
      );

      const onlyActiveServices = availableServices.filter((s) =>
        activeServiceSet.has(s.service.toLowerCase().trim()),
      );

      setFinalServices(onlyActiveServices);
    }
  }, [filteredServices, applicableRates, serviceMasterList]);

  // Fetching amount details
  const ratesInputs = useMemo(
    () => ({
      selectedService,
      chargeableWt,
      pcs,
      actualWt,
      selectedSector,
      selectedDestination,
      consigneeZipcode,
    }),
    [
      selectedService,
      chargeableWt,
      pcs,
      actualWt,
      selectedSector,
      selectedDestination,
      consigneeZipcode,
    ],
  );

  const debouncedRatesInputs = useDebounce(ratesInputs, 800);

  // Fetching amount details with Australia/Canada logic
  useEffect(() => {
    if (!selectedService || !applicableRates || !finalServices) return;

    if (!applicableRates || !Array.isArray(applicableRates)) {
      return;
    }

    const finalService = finalServices.find(
      (s) => s.service === selectedService,
    );
    const zone = finalService?.zone;

    const ratesArray = applicableRates || [];
    const matchingRate = ratesArray.find((r) => r.service === selectedService);
    const rateTariff = matchingRate?.rateTariff || "";

    if (!rateTariff || !chargeableWt || !actualWt || !pcs) return;

    const fetchAmountDetails = async () => {
      try {
        const isCanadaSector = selectedSector?.toLowerCase().includes("canada");
        const isCanadaDestination = selectedDestination
          ?.toLowerCase()
          .includes("canada");
        const isCanadaShipment = isCanadaSector && isCanadaDestination;

        const isAustraliaSector = selectedSector
          ?.toLowerCase()
          .includes("australia");
        const isAustraliaDestination = selectedDestination
          ?.toLowerCase()
          .includes("australia");
        const isAustraliaShipment = isAustraliaSector && isAustraliaDestination;

        if (isCanadaShipment) {
          if (!consigneeZipcode || consigneeZipcode.trim().length < 3) {
            return;
          }
        }

        if (isAustraliaShipment) {
          if (!consigneeZipcode || consigneeZipcode.trim().length < 1) {
            return;
          }
        }

        const params = new URLSearchParams({
          service: selectedService,
          rateTariff: rateTariff,
          chargeableWt: chargeableWt,
          actualWt: actualWt,
          pcs: pcs,
          destination: selectedDestination,
          sector: selectedSector,
        });

        if (zone) {
          params.append("zone", zone);
        }

        if ((isCanadaShipment || isAustraliaShipment) && consigneeZipcode) {
          const cleanedZip = consigneeZipcode.replace(/\s+/g, "").toUpperCase();
          params.append("zipcode", cleanedZip);
        }

        const response = await axios.get(
          `${server}/portal/create-shipment/get-rates?${params.toString()}`,
        );

        setAmountDetails(response.data);

        if (isEdit && response.data) {
          setValue("chargeableWt", chargeableWt);
        }

        if (response.data.isCanadaShipment) {
          showNotification(
            "info",
            `Canada: Zone ${response.data.zoneUsed} applied`,
          );
        } else if (response.data.isAustraliaShipment) {
          showNotification(
            "info",
            `Australia: Zone ${response.data.zoneUsed} applied`,
          );
        }

        if (response.data.zoneDetails) {
          const { matchType, isRemote, isUnserviceable } =
            response.data.zoneDetails;

          if (matchType && matchType !== "general") {
            showNotification("info", `Zone matched using ${matchType} pattern`);
          }

          if (isRemote) {
            showNotification(
              "warning",
              "Remote zone detected - additional charges may apply",
            );
          }

          if (isUnserviceable) {
            showNotification(
              "error",
              "Unserviceable zone - please check destination",
            );
          }
        }
      } catch (error) {
        console.log("Error fetching amount details:", error);
        if (error.response?.data?.error) {
          showNotification("error", error.response.data.error);

          if (
            error.response.data.details?.sector
              ?.toLowerCase()
              .includes("australia")
          ) {
            showNotification(
              "info",
              "For Australia: Please ensure postcode is valid (e.g., 2000, 3000, etc.)",
            );
          } else if (
            error.response.data.details?.sector
              ?.toLowerCase()
              .includes("canada")
          ) {
            showNotification(
              "info",
              "For Canada: Please ensure postal code format is correct (e.g., M5V 2T6)",
            );
          }
        }
      }
    };

    fetchAmountDetails();
  }, [debouncedRatesInputs, applicableRates, finalServices, server, isEdit]);

  // Fetch Customer, Branch, and Tax Settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!account || !account.branch) {
          console.log("No branch data available yet");
          return;
        }

        const [branchRes, taxRes] = await Promise.all([
          axios.get(
            `${server}/branch-master/get-branch?code=${account.branch}`,
          ),
          axios.get(`${server}/tax-settings`),
        ]);

        setBranch(branchRes.data);
        setTaxSettings(taxRes.data);
      } catch (error) {
        console.error("Error fetching branch/tax data:", error);
      }
    };

    fetchData();
  }, [account, server]);

  // Calculate base amount and GST
  // Calculate base amount and GST - FIXED
  useEffect(() => {
    if (amountDetails && account && branch && taxSettings) {
      if (
        !amountDetails.rate ||
        Number(amountDetails.rate) <= 0 ||
        selectedPayment == "FOC" ||
        selectedPayment == "RTO"
      ) {
        setValue("basicAmount", 0);
        setValue("sgst", 0);
        setValue("cgst", 0);
        setValue("igst", 0);
        setValue("baseGrandTotal", 0);
        setValue("grandTotal", 0);
        return;
      }

      const rate =
        amountDetails.rate !== undefined &&
        amountDetails.rate !== null &&
        Number(amountDetails.rate) > 0
          ? Number(amountDetails.rate)
          : 0;

      let basicAmount = 0;

      if (amountDetails.type === "S") {
        basicAmount = rate;
      } else if (amountDetails.type === "B") {
        basicAmount = rate * (Number(chargeableWt) || 0);
      }

      const gstApplicable = account.gst === "GST-Additional";

      const sameState =
        account.gstNo?.substring(0, 2).toUpperCase() ===
        branch.serviceTax?.substring(0, 2).toUpperCase();

      const sgstObj = taxSettings.find((t) => t.tax === "SGST");
      const cgstObj = taxSettings.find((t) => t.tax === "CGST");
      const igstObj = taxSettings.find((t) => t.tax === "IGST");

      const sgstRate = sameState ? sgstObj?.taxAmount || 0 : 0;
      const cgstRate = sameState ? cgstObj?.taxAmount || 0 : 0;
      const igstRate = !sameState ? igstObj?.taxAmount || 0 : 0;

      const sgstAmt = gstApplicable ? basicAmount * sgstRate : 0;
      const cgstAmt = gstApplicable ? basicAmount * cgstRate : 0;
      const igstAmt = gstApplicable ? basicAmount * igstRate : 0;

      // FIX: Store basicAmount in baseGrandTotal (without GST)
      // GST will be added separately in the grand total calculation
      setValue("basicAmount", basicAmount);
      setValue("sgst", sgstAmt);
      setValue("cgst", cgstAmt);
      setValue("igst", igstAmt);
      setValue("baseGrandTotal", basicAmount); // Store only basic amount, not including GST
      setValue("grandTotal", basicAmount + sgstAmt + cgstAmt + igstAmt);
    }
  }, [
    amountDetails,
    account,
    branch,
    taxSettings,
    chargeableWt,
    selectedPayment,
    setValue,
  ]);

  const round = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;
  const isUpdatingRef = useRef(false);

  // SINGLE CONSOLIDATED GRAND TOTAL CALCULATION
  // This useEffect handles all adjustments and recalculates grand total and balance
  useEffect(() => {
    if (!account || !branch || !taxSettings) return;

    const subscription = watch((values) => {
      if (isUpdatingRef.current) return;

      // Get all values
      const basicAmount = Number(values.basicAmount) || 0;
      const manualAmount = Number(values.manualAmount) || 0;
      const handlingAmount = Number(values.handlingAmount) || 0;
      const miscChg = Number(values.miscChg) || 0;
      const overWtHandling = Number(values.overWtHandling) || 0;
      const hikeAmt = Number(values.hikeAmt) || 0;
      const fuelPercentage = Number(values.fuelPercentage) || 0;
      const duty = Number(values.duty) || 0;
      const cashRecvAmount = Number(values.cashRecvAmount) || 0;
      const discount = Number(values.discount) || 0;

      const gstApplicable = account.gst === "GST-Additional";

      // Calculate taxable amount before fuel
      const baseTaxable =
        basicAmount +
        manualAmount +
        handlingAmount +
        miscChg +
        overWtHandling +
        hikeAmt;

      // Calculate fuel amount (taxable)
      const fuelAmtValue = round(baseTaxable * (fuelPercentage / 100));

      // Total taxable amount
      const totalTaxable = baseTaxable + fuelAmtValue;

      // GST Rates
      const sameState =
        account.gstNo?.substring(0, 2) === branch.serviceTax?.substring(0, 2);

      const sgstRate = sameState
        ? taxSettings.find((t) => t.tax === "SGST")?.taxAmount || 0
        : 0;

      const cgstRate = sameState
        ? taxSettings.find((t) => t.tax === "CGST")?.taxAmount || 0
        : 0;

      const igstRate = !sameState
        ? taxSettings.find((t) => t.tax === "IGST")?.taxAmount || 0
        : 0;

      if (!gstApplicable) {
        // If GST not applicable
        const grandTotalValue = round(totalTaxable + duty - discount);
        const balanceAmountValue = round(grandTotalValue - cashRecvAmount);

        isUpdatingRef.current = true;
        setValue("sgst", 0);
        setValue("cgst", 0);
        setValue("igst", 0);
        setValue("fuelAmt", fuelAmtValue);
        setValue("baseGrandTotal", basicAmount);
        setValue("grandTotal", grandTotalValue > 0 ? grandTotalValue : 0);
        setValue(
          "balanceAmount",
          round(balanceAmountValue > 0 ? balanceAmountValue : 0),
        );
        isUpdatingRef.current = false;
        return;
      }

      // GST Applicable - Calculate GST on base and adjustments
      const finalSgst = round(totalTaxable * sgstRate);
      const finalCgst = round(totalTaxable * cgstRate);
      const finalIgst = round(totalTaxable * igstRate);
      const totalGST = finalSgst + finalCgst + finalIgst;

      // Grand Total = Total Taxable + Total GST + Duty - Discount
      const grandTotalValue = round(totalTaxable + totalGST + duty - discount);

      // Balance = Grand Total - Cash received
      const balanceAmountValue = round(grandTotalValue - cashRecvAmount);

      isUpdatingRef.current = true;
      setValue("sgst", finalSgst);
      setValue("cgst", finalCgst);
      setValue("igst", finalIgst);
      setValue("fuelAmt", fuelAmtValue);
      setValue("baseGrandTotal", basicAmount);
      setValue("grandTotal", grandTotalValue > 0 ? grandTotalValue : 0);
      setValue(
        "balanceAmount",
        round(balanceAmountValue > 0 ? balanceAmountValue : 0),
      );
      isUpdatingRef.current = false;
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue, account, branch, taxSettings]);

  // Extracting zone from filtered services
  useEffect(() => {
    const selectedServiceLocal = watch("service");
    setSelectedService(selectedServiceLocal);

    if (!filteredServices || !Array.isArray(filteredServices)) {
      console.error("filteredServices data is missing or not an array");
      return;
    }

    const matchedZone = filteredServices.find(
      (item) => item.service === selectedServiceLocal,
    );
  }, [watch("service"), filteredServices]);

  // Handle date formatting
  useEffect(() => {
    if (fetchedAwbData?.createdAt) {
      setDate(formatDate(fetchedAwbData.createdAt));
    } else {
      setDate(formatDate(new Date()));
    }
  }, [fetchedAwbData]);

  // Enhanced handle refresh function
  const handleRefresh = () => {
    reset({
      awbNo: "",
      code: "",
      customer: "",
      accountBalance: "",
      origin: "",
      sector: "",
      destination: "",
      service: "",
      consignor: "",
      "consignor-addressLine1": "",
      "consignor-addressLine2": "",
      "consignor-pincode": "",
      "consignor-city": "",
      "consignor-state": "",
      "consignor-telephone": "",
      "consignor-idType": "",
      "consignor-idNumber": "",
      consignee: "",
      "consignee-addressLine1": "",
      "consignee-addressLine2": "",
      "consignee-zipcode": "",
      "consignee-city": "",
      "consignee-state": "",
      "consignee-telephone": "",
      "consignee-emailID": "",
      goodstype: "",
      pcs: "",
      actualWt: "",
      chargeableWt: "",
      volWt: "",
      volDisc: "",
      payment: "Credit",
      currency: "INR",
      invoiceValue: "",
      content: "",
      operationRemark: "",
      holdReason: "",
      otherHoldReason: "",
      isHold: false,
      basicAmount: "",
      manualAmount: "",
      cashRecvAmount: "",
      balanceAmount: "",
      handlingAmount: "",
      miscChg: "",
      miscChgReason: "",
      duty: "",
      overWtHandling: "",
      hikeAmt: "",
      fuelPercentage: "",
      fuelAmt: "",
      discount: "",
      sgst: "",
      cgst: "",
      igst: "",
      grandTotal: "",
      referenceNo: "",
      mawbNo: "",
      runNo: "",
      bag: "",
      runDate: "",
      clubNo: "",
      alMawb: "",
      flight: "",
      obc: "",
    });

    setFetchedAwbData({});
    setAccount(null);
    setAmountDetails(null);
    setIsEdit(false);
    setIsHold(false);
    setNewShipment(null);
    setBtnAction(null);
    setSelectedSector("");
    setSelectedDestinations("");
    setSelectedService("");
    setFilteredServices([]);
    setFinalServices([]);
    setVolumeContent({});
    setInvoiceContent([]);
    setTotalKg(0.0);
    setInvoiceTotalValue(0.0);
    setInvContent([]);
    setHoldReason("");
    setHoldEdit(false);
    setFocUnlocked(false);
    setPrevPayment("Credit");
    setIsRemoteOrUnserviceable(false);
    setPendingZoneUpdate(false);
    setServiceValidation({
      valid: true,
      errors: [],
      warnings: [],
      serviceDetails: null,
    });
    setIsManualAccountEntry(false);
    setLastEnteredCode("");

    setHoldHistoryWindow(false);
    setVolumeWtWindow(false);
    setInvoiceDetailsWindow(false);

    const today = new Date();
    const formattedDate =
      today.getDate().toString().padStart(2, "0") +
      "/" +
      (today.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      today.getFullYear().toString();
    setDate(formattedDate);

    setRefreshKey((prev) => prev + 1);
    showNotification("success", "Page refreshed successfully");
  };

  // Fetching data in shipments
  useEffect(() => {
    if (!awbNo) {
      clearErrors("awbNo");
      setFetchedAwbData({});
      setNewShipment(null);
      setAwbLoading(false);
      return;
    }

    const controller = new AbortController();
    const debounceTimer = setTimeout(async () => {
      try {
        setAwbLoading(true);

        const response = await axios.get(
          `${server}/portal/universal-get-shipments?query=${awbNo}`,
          { signal: controller.signal },
        );

        if (!response.data || response.data.notFound) {
          setNewShipment("new");
          setFetchedAwbData({});
        } else {
          clearErrors("awbNo");
          setFetchedAwbData(response.data.shipments[0]);
          setIsEdit(true);

          if (user?.role?.toLowerCase() === "admin") {
            setNewShipment("old");
          }
        }
      } catch (error) {
        if (axios.isCancel(error)) return;

        console.error("Error fetching airway bill data:", error);
        setFetchedAwbData({});
        setNewShipment("new");
        setIsEdit(false);
        setValue("volWt", "");
      } finally {
        setAwbLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [awbNo, server, user, clearErrors, setValue]);

  // Add effect to preserve customer data when loading AWB
  useEffect(() => {
    if (fetchedAwbData && Object.keys(fetchedAwbData).length > 0) {
      if (
        !isManualAccountEntry ||
        lastEnteredCode !== fetchedAwbData.accountCode
      ) {
        setValue("customer", fetchedAwbData.name || "");
        setValue(
          "accountBalance",
          fetchedAwbData.accountBalance || fetchedAwbData.leftOverBalance || 0,
        );
      }
    }
  }, [fetchedAwbData, setValue, isManualAccountEntry, lastEnteredCode]);

  // Add handler for content changes
  const handleSetInvoiceContent = useCallback((data) => {
    setInvoiceContent(data);
  }, []);

  // Sync invoiceContent with form state
  useEffect(() => {
    setValue("invoiceContent", invoiceContent);
  }, [invoiceContent, setValue]);

  // Add handler for volume content changes
  const handleSetVolumeContent = useCallback((data) => {
    const cleanedData = data.map(({ volumeWeightTable, ...rest }) => rest);
    setVolumeContent(cleanedData);
  }, []);

  // Sync volumeContent with form state
  useEffect(() => {
    setValue("volumeContent", volumeContent);
  }, [volumeContent, setValue]);

  // Populate form when fetchedAwbData changes - with rate preservation
  useEffect(() => {
    if (fetchedAwbData && Object.keys(fetchedAwbData).length > 0) {
      const currentAmountDetails = amountDetails;

      setValue("referenceNo", fetchedAwbData.reference || "");
      setValue("origin", fetchedAwbData.origin || "");
      setValue("sector", fetchedAwbData.sector || "");
      setValue("destination", fetchedAwbData.destination || "");
      setValue("service", fetchedAwbData.service || "");

      setValue("code", fetchedAwbData.accountCode || "");

      if (
        !isManualAccountEntry ||
        lastEnteredCode !== fetchedAwbData.accountCode
      ) {
        setValue("customer", fetchedAwbData.name || "");
        setValue(
          "accountBalance",
          fetchedAwbData.accountBalance || fetchedAwbData.leftOverBalance || 0,
        );
      }

      setValue("consignor", fetchedAwbData.shipperFullName || "");
      setValue(
        "consignor-addressLine1",
        fetchedAwbData.shipperAddressLine1 || "",
      );
      setValue(
        "consignor-addressLine2",
        fetchedAwbData.shipperAddressLine2 || "",
      );
      setValue("consignor-pincode", fetchedAwbData.shipperPincode || "");
      setValue("consignor-city", fetchedAwbData.shipperCity || "");
      setValue("consignor-state", fetchedAwbData.shipperState || "");
      setValue("consignor-telephone", fetchedAwbData.shipperPhoneNumber || "");
      setValue("consignor-idType", fetchedAwbData.shipperKycType || "");
      setValue("consignor-idNumber", fetchedAwbData.shipperKycNumber || "");

      setValue("consignee", fetchedAwbData.receiverFullName || "");
      setValue(
        "consignee-addressLine1",
        fetchedAwbData.receiverAddressLine1 || "",
      );
      setValue(
        "consignee-addressLine2",
        fetchedAwbData.receiverAddressLine2 || "",
      );
      setValue("consignee-zipcode", fetchedAwbData.receiverPincode || "");
      setValue("consignee-city", fetchedAwbData.receiverCity || "");
      setValue("consignee-state", fetchedAwbData.receiverState || "");
      setValue("consignee-telephone", fetchedAwbData.receiverPhoneNumber || "");
      setValue("consignee-emailID", fetchedAwbData.receiverEmail || "");

      setValue("goodstype", fetchedAwbData.goodstype || "");
      setValue("pcs", fetchedAwbData.boxes?.length || 0);
      setValue("actualWt", fetchedAwbData.totalActualWt || 0);
      setValue("chargeableWt", fetchedAwbData.chargeableWt || 0);
      setValue("volWt", fetchedAwbData.totalVolWt || 0);

      if (
        fetchedAwbData.volDiscount !== undefined &&
        fetchedAwbData.volDiscount !== null
      ) {
        setValue("volDisc", fetchedAwbData.volDiscount);
      } else if (
        fetchedAwbData.volDisc !== undefined &&
        fetchedAwbData.volDisc !== null
      ) {
        setValue("volDisc", fetchedAwbData.volDisc);
      }

      setValue("payment", fetchedAwbData.payment || "Credit");
      setValue("currencys", fetchedAwbData.currencys || "INR");
      setValue("currency", fetchedAwbData.currency || "INR");
      setValue("invoiceValue", fetchedAwbData.totalInvoiceValue || 0);

      setValue("mawbNo", fetchedAwbData.awbNo || "");
      setValue("bag", fetchedAwbData.bag || "");
      setValue("billNo", fetchedAwbData.billNo || "");
      setValue("manifestNo", fetchedAwbData.manifestNo || "");
      setValue("runNo", fetchedAwbData.runNo || "");
      setValue("flight", fetchedAwbData.flight || "");
      setValue("obc", fetchedAwbData.obc || "");
      setValue("alMawb", fetchedAwbData.alMawb || "");
      setValue(
        "runDate",
        fetchedAwbData.runDate ? formatDate(fetchedAwbData.runDate) : "",
      );

      if (
        currentAmountDetails &&
        Object.keys(currentAmountDetails).length > 0
      ) {
        setValue(
          "basicAmount",
          currentAmountDetails.basicAmount || fetchedAwbData.basicAmt || 0,
        );
        setValue(
          "discount",
          currentAmountDetails.discount || fetchedAwbData.volDiscount || 0,
        );
        setValue("sgst", currentAmountDetails.sgst || fetchedAwbData.sgst || 0);
        setValue("cgst", currentAmountDetails.cgst || fetchedAwbData.cgst || 0);
        setValue("igst", currentAmountDetails.igst || fetchedAwbData.igst || 0);
        setValue(
          "grandTotal",
          currentAmountDetails.grandTotal || fetchedAwbData.totalAmt || 0,
        );
      } else {
        setValue("basicAmount", fetchedAwbData.basicAmt || 0);
        setValue("discount", fetchedAwbData.volDiscount || 0);
        setValue("sgst", fetchedAwbData.sgst || 0);
        setValue("cgst", fetchedAwbData.cgst || 0);
        setValue("igst", fetchedAwbData.igst || 0);
        setValue("grandTotal", fetchedAwbData.totalAmt || 0);
      }

      setValue(
        "currency",
        fetchedAwbData.currency || fetchedAwbData.currencys || "INR",
      );
      setValue("network", fetchedAwbData.network || "");
      setValue("manualAmount", fetchedAwbData.manualAmount || 0);
      setValue("handlingAmount", fetchedAwbData.handlingAmount || 0);
      setValue("miscChg", fetchedAwbData.miscChg || 0);
      setValue("miscChgReason", fetchedAwbData.miscChgReason || "");
      setValue("duty", fetchedAwbData.duty || 0);
      setValue("overWtHandling", fetchedAwbData.overWtHandling || 0);
      setValue("fuelPercentage", fetchedAwbData.fuelPercentage || 0);
      setValue("fuelAmt", fetchedAwbData.fuelAmt || 0);
      setValue("cashRecvAmount", fetchedAwbData.cashRecvAmount || 0);
      setValue("balanceAmount", fetchedAwbData?.balanceAmt || 0);

      setValue("content", fetchedAwbData.content || []);

      setIsHold(fetchedAwbData.isHold || false);
      setValue("holdReason", fetchedAwbData.holdReason || " ");
      setValue("otherHoldReason", fetchedAwbData.otherHoldReason || "");
      setValue("operationRemark", fetchedAwbData.operationRemark || "");

      if (fetchedAwbData.shipmentAndPackageDetails) {
        setInvoiceContent(fetchedAwbData.shipmentAndPackageDetails);
      }
      if (fetchedAwbData.boxes) {
        setVolumeContent(fetchedAwbData.boxes);
      }
    } else {
      if (!isManualAccountEntry) {
        setValue("customer", "");
        setValue("accountBalance", "");
      }
      setValue("volDisc", "");
      setIsHold(false);
      setInvContent([]);
    }
  }, [
    fetchedAwbData,
    setValue,
    amountDetails,
    isManualAccountEntry,
    lastEnteredCode,
  ]);

  // Enhanced hold logic - credit limit check only for billing
  useEffect(() => {
    if (newShipment === "old" && !isEdit) return;

    if (!account || !grandTotal || Number(grandTotal) === 0) {
      if (holdEdit) {
        setHoldEdit(false);
      }
      return;
    }

    const leftOverBalance = account.leftOverBalance || 0;
    const creditLimit = account.creditLimit || 0;

    const walletFunds = leftOverBalance < 0 ? Math.abs(leftOverBalance) : 0;
    const totalAvailable = walletFunds + creditLimit;
    const effectiveDebt = leftOverBalance > 0 ? leftOverBalance : 0;
    const netAvailable = totalAvailable - effectiveDebt;
    const creditExceeded = Number(grandTotal) > netAvailable;

    if (creditExceeded) {
      setHoldReason("Credit Limit Exceeded");
      setIsHold(true);
      setHoldEdit(true);
      setValue("isHold", true);
      setValue("holdReason", "Credit Limit Exceeded");

      if (account?.accountCode && awbNo) {
        pushHoldLog({
          awbNo: awbNo,
          accountCode: account.accountCode,
          customer: account.name || "",
          action: "Auto Hold",
          actionUser: "System",
          departmentName: "Billing",
          holdReason: "Credit Limit Exceeded",
          actionSystemName: "CreditCheck",
        }).catch((err) => console.error("Failed to log auto-hold:", err));
      }

      showNotification("error", "Credit Limit Exceeded");
    } else {
      if (holdEdit) {
        setHoldEdit(false);
      }
    }
  }, [grandTotal, account, newShipment, awbNo, isEdit, holdEdit]);

  // for alerts
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

          if (setResponseMsg && setVisibleFlag) {
            setResponseMsg(alertResult.message);
            setVisibleFlag(true);
          }
        }
      }
    };

    const timeoutId = setTimeout(checkForAlerts, 800);
    return () => clearTimeout(timeoutId);
  }, [awbNo, checkAlert]);

  // FETCH SERVICE MASTER
  const [serviceData, setServiceData] = useState(null);

  useEffect(() => {
    if (!selectedService || !server) return;

    const fetchServiceMaster = async () => {
      try {
        const res = await axios.get(`${server}/service-master/getService`, {
          params: { serviceName: selectedService },
        });

        if (!res.data || !res.data._id) {
          setServiceData(null);
          return;
        }

        const s = res.data;
        setServiceData(s);

        const validationResult = validateServiceRules(s, {
          pcs: Number(pcs) || 0,
          actualWt: Number(actualWt) || 0,
          volWt: Number(volWt) || 0,
          chargeableWt: Number(chargeableWt) || 0,
          invoiceValue: Number(invoiceValue) || 0,
        });

        if (!validationResult.ok) {
          validationResult.errors.forEach((err) => {
            setError(err.field, {
              type: "manual",
              message: err.msg,
            });
          });
        }

        await validateServiceAgainstMaster(selectedService, {
          pcs: Number(pcs) || 0,
          actualWt: Number(actualWt) || 0,
          volWt: Number(volWt) || 0,
          chargeableWt: Number(chargeableWt) || 0,
          invoiceValue: Number(invoiceValue) || 0,
        });
      } catch (error) {
        console.error("Error fetching service-master:", error);
        setServiceData(null);
      }
    };

    fetchServiceMaster();
  }, [
    selectedService,
    server,
    pcs,
    actualWt,
    volWt,
    chargeableWt,
    invoiceValue,
    setError,
  ]);

  // Fetch volume discount from service master
  useEffect(() => {
    const fetchServiceVolumeDiscount = async () => {
      if (!selectedService || !server) {
        if (!isEdit) {
          setValue("volDisc", "0");
        }
        return;
      }

      if (isEdit && fetchedAwbData && Object.keys(fetchedAwbData).length > 0) {
        return;
      }

      try {
        const res = await axios.get(`${server}/service-master/getService`, {
          params: { serviceName: selectedService },
        });

        if (res.data && res.data.found !== false && res.data._id) {
          const serviceData = res.data;

          if (
            serviceData.volDiscountPercent !== undefined &&
            serviceData.volDiscountPercent !== null
          ) {
            setValue("volDisc", serviceData.volDiscountPercent.toString());

            const currentActual = watch("actualWt");
            const currentVol = watch("volWt");
            if (currentActual || currentVol) {
              setValue("actualWt", currentActual);
              setValue("volWt", currentVol);
            }
          } else {
            setValue("volDisc", "0");
          }
        }
      } catch (error) {
        console.error("Error fetching service volume discount:", error);
        setValue("volDisc", "0");
      }
    };

    fetchServiceVolumeDiscount();
  }, [selectedService, server, isEdit, fetchedAwbData, setValue, watch]);

  // Enhanced validation effect
  useEffect(() => {
    if (!selectedService) {
      clearErrors(["pcs", "actualWt", "volWt", "chargeableWt", "invoiceValue"]);
      return;
    }

    const p = Number(pcs || 0);
    const a = Number(actualWt || 0);
    const v = Number(volWt || 0);
    const c = Number(chargeableWt || 0);
    const inv = Number(invoiceValue || 0);

    if (!p && !a && !v && !c && !inv) return;

    clearErrors(["pcs", "actualWt", "volWt", "chargeableWt", "invoiceValue"]);

    const localValidation = validateServiceRules(serviceData, {
      pcs: p,
      actualWt: a,
      volWt: v,
      chargeableWt: c,
      invoiceValue: inv,
    });

    if (!localValidation.ok) {
      localValidation.errors.forEach((err) => {
        setError(err.field, {
          type: "manual",
          message: err.msg + " (per AWB limit)",
        });
      });
    }
  }, [
    pcs,
    actualWt,
    volWt,
    chargeableWt,
    invoiceValue,
    selectedService,
    serviceData,
    clearErrors,
    setError,
  ]);

  useEffect(() => {
    if (selectedService && selectedPayment !== "FOC") {
      setPrevPayment(selectedPayment);
    }

    if (selectedPayment === "FOC" && !focUnlocked) {
      setShowFOCPasswordModal(true);
    }
  }, [selectedPayment, focUnlocked, selectedService]);

  const handleFOCPasswordSuccess = () => {
    setFocUnlocked(true);
    setPrevPayment("FOC");
    setShowFOCPasswordModal(false);
  };

  const handleFOCPasswordCancel = () => {
    setValue("payment", prevPayment);
    setShowFOCPasswordModal(false);
  };

  useEffect(() => {
    if (
      fetchedAwbData?.payment === "FOC" ||
      fetchedAwbData?.payment === "RTO"
    ) {
      setFocUnlocked(true);
      setPrevPayment(fetchedAwbData.payment);
      setValue("payment", fetchedAwbData.payment);
    }
  }, [fetchedAwbData, setValue]);

  useEffect(() => {
    if (!selectedService || !applicableRates?.length) return;

    const matchedRate = applicableRates.find(
      (rate) => rate.service === selectedService,
    );

    if (matchedRate?.network) {
      setValue("network", matchedRate.network);
      setNetworkType(matchedRate.network);
    } else {
      setValue("network", "");
    }
  }, [selectedService, applicableRates, setValue]);

  // Zone status checking effect
  useEffect(() => {
    const checkAndAlertZoneStatus = async () => {
      const destinationValue = watch("destination");
      const serviceValue = watch("service");

      if (!destinationValue || !serviceValue || isEdit) {
        setIsRemoteOrUnserviceable(false);
        setPendingZoneUpdate(false);
        return;
      }

      if (pendingZoneUpdate) {
        return;
      }

      const zoneStatus = await checkZoneStatus(destinationValue, serviceValue);

      if (zoneStatus) {
        const { zoneNumber, isRemote, isUnserviceable } = zoneStatus;

        if (isRemote || isUnserviceable) {
          const currentRemark = watch("operationRemark") || "";
          const alreadyConfirmed = currentRemark.includes(
            isRemote ? "Remote area confirmed" : "Unserviceable area confirmed",
          );

          if (!alreadyConfirmed) {
            setPendingZoneUpdate(true);

            setZoneAlertData({
              isOpen: true,
              message: `The selected destination "${destinationValue}" is in a ${
                isRemote ? "remote" : "unserviceable"
              } zone (Zone ${zoneNumber}). Are you sure you want to continue?`,
              zoneType: isRemote ? "remote" : "unserviceable",
              destination: destinationValue,
              zone: zoneNumber,
            });

            setIsRemoteOrUnserviceable(true);
          } else {
            setIsRemoteOrUnserviceable(true);
          }
        } else {
          setIsRemoteOrUnserviceable(false);
          setPendingZoneUpdate(false);
        }
      } else {
        setIsRemoteOrUnserviceable(false);
        setPendingZoneUpdate(false);
      }
    };

    const timeoutId = setTimeout(checkAndAlertZoneStatus, 500);
    return () => clearTimeout(timeoutId);
  }, [
    watch("destination"),
    watch("service"),
    isEdit,
    pendingZoneUpdate,
    checkZoneStatus,
    watch,
  ]);

  // Code list columns
  const columns = useMemo(() => {
    const columnMapping = {
      "Airway Billing": [
        { key: "code", label: "Code" },
        { key: "customer", label: "Customer" },
      ],
    };
    return columnMapping["Airway Billing"] || [];
  }, []);

  return (
    <div key={refreshKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      {/* Service Validation Status Display */}
      {serviceValidation &&
        !serviceValidation.valid &&
        serviceValidation.errors?.length > 0 && (
          <div className="fixed top-24 right-4 z-50 max-w-md animate-slide-in-right">
            <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-red text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-semibold text-sm">
                    Service Validation Errors
                  </span>
                </div>
                <button
                  onClick={() =>
                    setServiceValidation({
                      valid: true,
                      errors: [],
                      warnings: [],
                    })
                  }
                  className="text-white hover:text-red transition-colors"
                  aria-label="Close"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="px-4 py-3 max-h-64 overflow-y-auto">
                <ul className="space-y-2">
                  {serviceValidation.errors.map((error, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-red-800"
                    >
                      <span className="text-red-500 font-bold mt-0.5">•</span>
                      <span className="flex-1">{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

      {/* Zone Alert Modal */}
      {zoneAlertData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {zoneAlertData.zoneType === "remote"
                    ? "Remote Zone Alert"
                    : "Unserviceable Zone Alert"}
                </h3>
                <button
                  onClick={handleZoneAlertCancel}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <div
                  className={`p-3 rounded-lg mb-3 ${
                    zoneAlertData.zoneType === "remote"
                      ? "bg-yellow-50 border border-yellow-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    <svg
                      className={`w-5 h-5 mr-2 ${
                        zoneAlertData.zoneType === "remote"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={`font-medium ${
                        zoneAlertData.zoneType === "remote"
                          ? "text-yellow-800"
                          : "text-red-800"
                      }`}
                    >
                      {zoneAlertData.zoneType === "remote"
                        ? "Remote Zone Detected"
                        : "Unserviceable Zone Detected"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-700">
                    {zoneAlertData.message}
                  </p>
                </div>

                <p className="text-sm text-gray-600">
                  If you continue, "
                  {zoneAlertData.zoneType === "remote"
                    ? "Remote"
                    : "Unserviceable"}{" "}
                  area confirmed" will be automatically added to the operation
                  remarks.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleZoneAlertCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleZoneAlertConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white ${
                    zoneAlertData.zoneType === "remote"
                      ? "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500"
                      : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                  } border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PasswordModal
        isOpen={showFOCPasswordModal}
        onClose={handleFOCPasswordCancel}
        onSuccess={handleFOCPasswordSuccess}
        title="FOC Authorization"
        description="Enter password to allow Free of Charge shipment"
      />

      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(handleAWBBilling)}
      >
        <div className="flex flex-col relative">
          <div>
            <Heading
              title={`Airway Billing`}
              bulkUploadBtn="hidden"
              onRefresh={handleRefresh}
            />
          </div>
          <div className="absolute left-[170px] mt-1">
            <span className="text-[#0A7DC1] text-xs select-none bg-[#0A7DC11F] border-2 border-[#0A7DC1] rounded-xl px-2 py-1">
              Billing Stage
            </span>
          </div>
        </div>
        <div className="flex gap-3 mt-1">
          <div className="w-full flex flex-col gap-5">
            {/* Airway Bill Number and Shipment Origin / Destination */}
            <div className="flex flex-col gap-">
              <div className="flex gap-3 justify-between">
                <div className="flex flex-col gap-3 w-1/2">
                  <RedLabelHeading label={`Airway Bill Number`} />
                  <div className="relative">
                    <InputBoxYellow
                      register={register}
                      placeholder={""}
                      inputValue={awbNo}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`awbNo`}
                      error={errors.awbNo}
                      trigger={trigger}
                      validation={{
                        required: "AWB Number is required",
                      }}
                    />

                    {awbLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                        <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <RedLabelHeading label={`Shipment Origin / Destination`} />
                  <div className="flex gap-3 justify-between ">
                    <DummyInputBoxWithLabelTransparent
                      watch={watch}
                      label={`Date`}
                      inputValue={date}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`date`}
                    />
                    <LabeledDropdown
                      options={["Mumbai", "Delhi", "Ahemadabad"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      defaultValue={fetchedAwbData?.origin || ""}
                      title={`Origin`}
                      value={`origin`}
                      error={errors.origin}
                      trigger={trigger}
                      validation={{ required: "Origin is required" }}
                      disabled={isEdit}
                    />
                    <LabeledDropdown
                      options={sectors.map((sector) => sector.name)}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      defaultValue={fetchedAwbData?.sector || null}
                      title={`Sector`}
                      value={`sector`}
                      error={errors.sector}
                      trigger={trigger}
                      validation={{ required: "Sector is required" }}
                      disabled={isEdit}
                    />
                    <SearchableDropDrown
                      options={destinations}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      defaultValue={fetchedAwbData?.destination || null}
                      title={`Destination`}
                      value={`destination`}
                      trigger={trigger}
                      error={errors.destination}
                      validation={{ required: "Destination is required" }}
                      disabled={isEdit || pendingZoneUpdate}
                    />
                    {isRemoteOrUnserviceable && (
                      <div
                        className={`flex items-center px-3 py-2 rounded ${
                          zoneAlertData.zoneType === "remote"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {zoneAlertData.zoneType === "remote"
                            ? "Remote Zone"
                            : "Unserviceable Zone"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="flex flex-col gap-3">
              <RedLabelHeading label={`Customer Details`} />
              <div className="flex gap-3 ">
                <div>
                  <InputBox
                    placeholder="Code"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    trigger={trigger}
                    value="code"
                    error={errors.code}
                    disabled={isEdit}
                    initialValue={fetchedAwbData?.accountCode || ""}
                    validation={{ required: "Customer Code is required" }}
                  />
                </div>
                <div className="flex w-full gap-3">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={`Customer`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    inputValue={watch("customer")}
                    value={`customer`}
                    error={errors.customer}
                    trigger={trigger}
                    validation={{ required: "Customer name is required" }}
                  />
                  <div className="flex gap-3 w-full">
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      placeholder={`0.00`}
                      label={`Account Balance`}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`accountBalance`}
                      inputValue={watch("accountBalance")}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      label={`Company`}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`company`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consignor/Consignee Details */}
            <div className="flex gap-6">
              <div className="w-full flex flex-col gap-3 ">
                <RedLabelHeading label={`Consignor Details`} />
                <InputBox
                  placeholder="Consignor"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignor"
                  error={errors.consignor}
                  disabled={isEdit}
                  initialValue={fetchedAwbData?.shipperFullName || ""}
                  trigger={trigger}
                  validation={{ required: "Consignor is required" }}
                />

                <InputBox
                  placeholder="Address Line 1"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignor-addressLine1"
                  error={errors["consignor-addressLine1"]}
                  disabled={isEdit}
                  initialValue={fetchedAwbData?.shipperAddressLine1 || ""}
                  trigger={trigger}
                  validation={{ required: "Address Line 1 is required" }}
                />
                <InputBox
                  placeholder="Address Line 2"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignor-addressLine2"
                  trigger={trigger}
                  disabled={isEdit}
                  initialValue={fetchedAwbData?.shipperAddressLine2 || ""}
                />
                <div className="flex gap-2">
                  <InputBox
                    placeholder="Pincode"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignor-pincode"
                    error={errors["consignor-pincode"]}
                    trigger={trigger}
                    disabled={isEdit}
                    initialValue={fetchedAwbData?.shipperPincode || ""}
                    validation={{
                      required: "Pincode is required",
                      pattern: {
                        value: /^\d{6}$/,
                        message: "Invalid pincode",
                      },
                    }}
                  />
                  <InputBox
                    placeholder="City"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignor-city"
                    error={errors["consignor-city"]}
                    trigger={trigger}
                    disabled={isEdit}
                    validation={{ required: "City is required" }}
                    initialValue={fetchedAwbData?.shipperCity || ""}
                  />
                  <InputBox
                    placeholder="State"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignor-state"
                    trigger={trigger}
                    disabled={isEdit}
                    error={errors["consignor-state"]}
                    validation={{ required: "State is required" }}
                    initialValue={fetchedAwbData?.shipperState || ""}
                  />
                </div>
                <InputBox
                  placeholder="Telephone"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignor-telephone"
                  error={errors["consignor-telephone"]}
                  disabled={isEdit}
                  initialValue={fetchedAwbData?.shipperPhoneNumber || ""}
                  validation={{
                    required: "Telephone is required",
                  }}
                  trigger={trigger}
                />
                <div className="flex gap-2">
                  <LabeledDropdown
                    options={[
                      "GSTIN (Normal)",
                      "GSTIN (Govt Entities)",
                      "GSTIN (Diplomats)",
                      "PAN Number",
                      "TAN Number",
                      "Passport Number",
                      "Aadhaar Number",
                      "Voter Id",
                    ]}
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    title={`ID Type`}
                    value={`consignor-idType`}
                    error={errors["consignor-idType"]}
                    trigger={trigger}
                    validation={{ required: "ID Type is required" }}
                    defaultValue={fetchedAwbData?.shipperKycType || ""}
                    disabled={isEdit}
                  />
                  <InputBox
                    placeholder="ID Number"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignor-idNumber"
                    error={errors["consignor-idNumber"]}
                    disabled={isEdit}
                    trigger={trigger}
                    initialValue={fetchedAwbData?.shipperKycNumber || ""}
                  />
                </div>
              </div>

              <div className="w-full flex flex-col gap-3 ">
                <RedLabelHeading label={`Consignee Details`} />
                <InputBox
                  placeholder="Consignee"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignee"
                  error={errors.consignee}
                  disabled={isEdit}
                  validation={{ required: "Consignee is required" }}
                  trigger={trigger}
                  initialValue={fetchedAwbData?.receiverFullName || ""}
                />

                <InputBox
                  placeholder="Address Line 1"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignee-addressLine1"
                  error={errors["consignee-addressLine1"]}
                  disabled={isEdit}
                  validation={{ required: "Address Line 1 is required" }}
                  trigger={trigger}
                  initialValue={fetchedAwbData?.receiverAddressLine1 || ""}
                />
                <InputBox
                  placeholder="Address Line 2"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignee-addressLine2"
                  disabled={isEdit}
                  trigger={trigger}
                  initialValue={fetchedAwbData?.receiverAddressLine2 || ""}
                />
                <div className="flex gap-2">
                  <InputBox
                    placeholder="Zipcode"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignee-zipcode"
                    error={errors["consignee-zipcode"]}
                    disabled={isEdit}
                    validation={{
                      required: "Zipcode is required",
                      validate: (value) => {
                        const isAustralia = selectedSector
                          ?.toLowerCase()
                          .includes("australia");
                        const isCanada = selectedSector
                          ?.toLowerCase()
                          .includes("canada");

                        if (isAustralia && value) {
                          const auPattern = /^\d{4}$/;
                          if (!auPattern.test(value.replace(/\s/g, ""))) {
                            return "Australian postcode must be 4 digits (e.g., 2000)";
                          }
                        }

                        if (isCanada && value) {
                          const caPattern =
                            /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
                          if (!caPattern.test(value)) {
                            return "Canadian postal code format: A1A 1A1";
                          }
                        }

                        return true;
                      },
                    }}
                    trigger={trigger}
                    initialValue={fetchedAwbData?.receiverPincode || ""}
                  />
                  <InputBox
                    placeholder="City"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignee-city"
                    error={errors["consignee-city"]}
                    disabled={isEdit}
                    validation={{ required: "City is required" }}
                    trigger={trigger}
                    initialValue={fetchedAwbData?.receiverCity || ""}
                  />
                  <InputBox
                    placeholder="State"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignee-state"
                    error={errors["consignee-state"]}
                    disabled={isEdit}
                    validation={{ required: "State is required" }}
                    trigger={trigger}
                    initialValue={fetchedAwbData?.receiverState || ""}
                  />
                </div>
                <InputBox
                  placeholder="Telephone"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignee-telephone"
                  error={errors["consignee-telephone"]}
                  disabled={isEdit}
                  validation={{
                    required: "Telephone is required",
                  }}
                  trigger={trigger}
                  initialValue={fetchedAwbData?.receiverPhoneNumber || ""}
                />
                <div className="flex gap-2">
                  <InputBox
                    placeholder="Email ID"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignee-emailID"
                    error={errors["consignee-emailID"]}
                    disabled={isEdit}
                    trigger={trigger}
                    initialValue={fetchedAwbData?.receiverEmail || ""}
                  />
                </div>
              </div>
            </div>

            {/* Shipment Weight Details */}
            <div className="w-full flex flex-col gap-3">
              <RedLabelHeading label={`Shipment Weight Details (F8)`} />
              <div className="flex gap-6">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex gap-2">
                    <div className="">
                      <DummyInputBoxDarkGray
                        placeholder="Network"
                        register={register}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={`network`}
                      />
                    </div>

                    <DummyInputBoxDarkGray
                      register={register}
                      placeholder={`DEL`}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`networkName`}
                    />
                  </div>
                  <LabeledDropdown
                    options={finalServices.map((service) => service.service)}
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    title={`Service ${
                      serviceValidation?.serviceDetails?.softwareStatus ===
                      "In-Active"
                        ? "⚠️"
                        : ""
                    }`}
                    value={`service`}
                    defaultValue={fetchedAwbData.service || ""}
                    disabled={isEdit || pendingZoneUpdate}
                    className={
                      serviceValidation?.serviceDetails?.softwareStatus ===
                      "In-Active"
                        ? "border-yellow-500"
                        : ""
                    }
                  />
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        placeholder={`0.00 Kg`}
                        label={`Vol. Wt.`}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={`volWt`}
                        inputValue={totalKg || fetchedAwbData?.totalVolWt}
                        error={errors.volWt}
                        trigger={trigger}
                        validation={{ required: "VolumeWt is required" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                            openVolumeWtWindow();
                        }}
                        className="absolute top-1/4 right-4"
                      >
                        <Image
                          alt=""
                          src={`/edit-input.svg`}
                          height={16}
                          width={16}
                        />
                      </button>
                    </div>

                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      placeholder={`0.00 %`}
                      label={`Vol Disc (%)`}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`volDisc`}
                      inputValue={fetchedAwbData?.volDiscount || 0.0}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={`Forwarding No.`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`fwdNumber`}
                    inputValue={fetchedAwbData?.forwardingNo || 0.0}
                  />
                  <div className="flex gap-2">
                    <LabeledDropdown
                      options={["Dox", "NDox"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      title={`Goods Type`}
                      value={`goodstype`}
                      defaultValue={fetchedAwbData?.goodstype || ""}
                      disabled={isEdit}
                    />
                    <InputBox
                      placeholder="Pcs"
                      register={register}
                      setValue={setValue}
                      disabled={isEdit}
                      initialValue={fetchedAwbData?.boxes?.length || ""}
                      resetFactor={refreshKey}
                      value="pcs"
                      error={errors.pcs}
                      trigger={trigger}
                      validation={{ required: "PCS is required" }}
                    />
                    <InputBox
                      placeholder="Actual Wt. (Kg)"
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      disabled={isEdit}
                      value="actualWt"
                      initialValue={fetchedAwbData?.totalActualWt || 0.0}
                      error={errors.actualWt}
                      trigger={trigger}
                      validation={{ required: "Actual weight is required" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative ">
                      <DummyInputBoxWithLabelTransparent
                        label="Chargable Wt."
                        register={register}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value="chargeableWt"
                        watch={watch}
                        error={errors.chargeableWt}
                        trigger={trigger}
                        validation={{
                          required: "Chargeable weight is required",
                        }}
                      />
                    </div>
                    <LabeledDropdown
                      options={["AIR CARGO", "COD", "Credit", "FOC", "RTO"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      title={`Payment`}
                      value={`payment`}
                      selectedValue={selectedPayment}
                      defaultValue={fetchedAwbData?.payment || "Credit"}
                      disabled={isEdit}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="w-full flex flex-col gap-3">
              <RedLabelHeading label={`Invoice Content (F9)`} />
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="w-1/2 flex gap-2">
                    <LabeledDropdown
                      options={["AUD", "CAD", "EU", "EUR", "GBP", "INR", "USD"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      title={`Currency`}
                      value={`currency`}
                      defaultValue={
                        fetchedAwbData?.currency ||
                        fetchedAwbData?.currencys ||
                        ""
                      }
                      disabled={isEdit}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      label={`Inv Value`}
                      placeholder={`0`}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`invoiceValue`}
                      inputValue={
                        invTotalValue || fetchedAwbData?.totalInvoiceValue
                      }
                      error={errors.invoiceValue}
                      trigger={trigger}
                      validation={{ required: "Inv Value is required" }}
                    />
                  </div>
                  <div className="w-full flex gap-2">
                    <DummyInputBoxWithLabelDarkGray
                      label={`Content`}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`content`}
                      inputValue={invContent || fetchedAwbData.content}
                    />
                    <div className="relative">
                      <DummyInputBoxDarkGray
                        register={register}
                        placeholder={`Invoice`}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={`invoice`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                            openInvoiceDetailsWindow();
                        }}
                        className="absolute top-1/4 right-4"
                      >
                        <Image
                          alt=""
                          src={`/invoice.svg`}
                          height={20}
                          width={20}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                <InputBox
                  placeholder="Operation Remark"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  disabled={isEdit}
                  value="operationRemark"
                  initialValue={fetchedAwbData?.operationRemark || ""}
                />
                <div className="flex gap-2">
                  <RedCheckboxBase
                    label={"Hold"}
                    isChecked={isHold}
                    setChecked={setIsHold}
                    id={"isHold"}
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    flip={true}
                    disabled={isEdit || holdEdit}
                  />
                  <LabeledDropdown
                    options={[
                      "Credit Limit Exceeded",
                      "Actual Weight Mismatch",
                      "Vol. Weight Mismatch",
                      "Shipment & Packaging Issues",
                      "Overweight Item - OW",
                      "Damaged Packaging - DPKG",
                      "Leaking Content - LEAK",
                      "Prohibited Item - PROH",
                      "Broken Content - BROK",
                      "Packaging Not Secure - PNS",
                      "Item Missing - MISI",
                      "Address Issues",
                      "Incomplete Address - INA",
                      "Incorrect Address - ICA",
                      "Address Change Requested - ADD",
                      "Address Not Found - ANF",
                      "Wrong Pincode - WPIN",
                      "Transit & Hub Issues",
                      "Routing Error - RERR",
                      "Custom Hold - CSTM",
                      "Verification & Compliance",
                      "KYC Not Verified - KYC",
                      "Invoice Missing - INV",
                      "Content Declaration Needed - CDN",
                      "Customs Docs Missing - CDM",
                      "Prohibited Country - PRCN",
                      "Policy & Restrictions",
                      "Lithium Battery Hold - LITH",
                      "Liquids Not Allowed - LIQ",
                      "Jewellery Not Allowed - JEWL",
                      "Jewellery Bill Required - JEWB",
                      "Perishables Not Allowed - PERI",
                      "Restricted Electronics - RELE",
                      "Leather Item Restriction - LTHR",
                      "Internal & Operational",
                      "Account Deactivated - AC",
                      "Payment Pending - PAY",
                      "Duplicate Shipment - DUP",
                      "Manual Inspection Required - MANI",
                      "System Flagged Hold - SYSF",
                      "Delivery Attempt & Customer Related",
                      "No One Available - NOA",
                      "Delivery Rescheduled - DRS",
                      "Customer Requested Hold - CRH",
                      "Wrong Contact Number - WCN",
                    ]}
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    title={`Hold Reason`}
                    value={`holdReason`}
                    defaultValue={holdReason || fetchedAwbData.holdReason || ""}
                    disabled={isEdit || holdEdit}
                  />
                  <InputBox
                    placeholder="Other Reason"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    disabled={
                      isEdit ||
                      (holdEdit && holdReasonValue === "Credit Limit Exceeded")
                    }
                    value="otherHoldReason"
                    initialValue={fetchedAwbData?.otherHoldReason || ""}
                  />
                </div>
              </div>
            </div>

            {/* CheckBoxes */}
            <div className="flex w-full justify-between">
              <RedCheckboxRedLabel
                label={"DHL/UPS/FEDEX/SKYNET/DPEX Automation"}
                isChecked={isAutomation}
                setChecked={setIsAutomation}
                id={"automation"}
                register={register}
                setValue={setValue}
                resetFactor={refreshKey}
              />

              <RedCheckboxRedLabel
                label={"Handling"}
                isChecked={isHandling}
                setChecked={setIsHandling}
                id={"handling"}
                register={register}
                setValue={setValue}
                resetFactor={refreshKey}
              />
              <RedCheckboxRedLabel
                label={"CSB"}
                isChecked={isCSB}
                setChecked={setIsCSB}
                id={"csb"}
                register={register}
                setValue={setValue}
                resetFactor={refreshKey}
              />
              <RedCheckboxRedLabel
                label={"Commercial Shipment"}
                isChecked={isCommercialShipment}
                setChecked={setIsCommercialShipment}
                id={"commercialShipment"}
                register={register}
                setValue={setValue}
                resetFactor={refreshKey}
              />
            </div>
            <div className="flex gap-2 justify-between ">
              <div className="flex gap-2 w-full">
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label={"Bill No."}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value={"billNo"}
                  inputValue={fetchedAwbData?.billNo || ""}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label={"Manifest No."}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value={"manifestNo"}
                  inputValue={fetchedAwbData?.manifestNo || ""}
                />
                <div className="flex flex-col gap-2 w-full">
                  <InputBox
                    register={register}
                    initialValue={fetchedAwbData?.reference || ""}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`referenceNo`}
                    placeholder={`Reference No.`}
                    disabled={isEdit}
                  />
                </div>
              </div>
              <div className="w-[300px]">
                <OutlinedButtonRed
                  onClick={() => {
                    if (isEdit == false) {
                      openHoldHistoryWindow();
                    }
                  }}
                  label={`Hold History (F11)`}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between">
            {/* Run details */}
            <div className="flex flex-col gap-3 bg-[#0A7DC133] border-[#0A7DC1] px-3 py-3 border-2 rounded-xl">
              <div className="flex flex-col gap-2.5 ">
                {/* Run details */}
                <div className="flex flex-col gap-3">
                  <RedLabelHeading label={`Run Details`} />

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"Mawb No"}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={"mawbNo"}
                        inputValue={fetchedAwbData?.awbNo || ""}
                      />
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"Run No"}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={"runNo"}
                        inputValue={fetchedAwbData?.runNo || ""}
                      />
                    </div>
                    <div className="flex gap-2">
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"Bag"}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={"bag"}
                        inputValue={fetchedAwbData?.bag || ""}
                      />
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"Date"}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={"date"}
                      />
                    </div>

                    <div className="flex gap-2">
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"Club No"}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={"clubNo"}
                      />
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"AL/Mawb"}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={"alMawb"}
                        inputValue={fetchedAwbData?.alMawb || ""}
                      />
                    </div>
                    <div className="flex gap-2">
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"Flight"}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={"flight"}
                        inputValue={fetchedAwbData?.flight || ""}
                      />
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"OBC"}
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value={"obc"}
                        inputValue={fetchedAwbData?.obc || ""}
                      />
                    </div>
                  </div>
                </div>
                <RedLabelHeading label={`Amount Details`} />

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <DummyInputBoxWithLabelLightGray
                      register={register}
                      placeholder={`0.00`}
                      label={`Basic Amt`}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`basicAmount`}
                      className={"bg-white"}
                    />
                  </div>
                  <div className="w-1/2">
                    <InputBox
                      placeholder="Manual Amt"
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      disabled={isEdit}
                      value="manualAmount"
                      className="bg-white"
                      initialValue={fetchedAwbData?.manualAmount || "0.00"}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <InputBox
                      placeholder="Cash Recv. Amt"
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      disabled={isEdit}
                      value="cashRecvAmount"
                      className="bg-white"
                      initialValue={fetchedAwbData?.cashRecvAmount || "0.00"}
                    />
                  </div>

                  <div className="w-1/2">
                    <DummyInputBoxWithLabelLightGray
                      register={register}
                      placeholder={`0.00`}
                      label={`Balance Amt`}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value={`balanceAmount`}
                      className={"bg-white"}
                    />
                  </div>
                </div>

                <InputBox
                  placeholder="Handling Amt"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  disabled={isEdit}
                  value="handlingAmount"
                  className="bg-white"
                  initialValue={fetchedAwbData?.handlingAmount || "0.00"}
                />
                <InputBox
                  placeholder="Misc. Chg"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  disabled={isEdit}
                  value="miscChg"
                  className="bg-white"
                  initialValue={fetchedAwbData?.miscChg || "0.00"}
                />
                <InputBox
                  register={register}
                  placeholder="Misc. Chg. Reason"
                  setValue={setValue}
                  resetFactor={refreshKey}
                  disabled={isEdit}
                  value={`miscChgReason`}
                  className="bg-white"
                  initialValue={fetchedAwbData?.miscChgReason || " "}
                />
                <DummyInputBoxWithLabelLightGray
                  register={register}
                  placeholder={`0.00`}
                  label={`Duty`}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value={`duty`}
                  className={"bg-white"}
                />
                <InputBox
                  placeholder="Over Wt. Handling"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  disabled={isEdit}
                  value="overWtHandling"
                  className="bg-white"
                  initialValue={fetchedAwbData?.overWtHandling || "0.00"}
                />
                <DummyInputBoxWithLabelLightGray
                  register={register}
                  placeholder={`0.00`}
                  label={`Hike Amt`}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value={`hikeAmt`}
                  className={"bg-white"}
                />
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Fuel(%)`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`fuelPercentage`}
                    className={"bg-white"}
                  />
                  <DummyInputBoxLightGray
                    register={register}
                    placeholder={`0.00`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`fuelAmt`}
                    className={"bg-white"}
                  />
                </div>
                <div className="flex gap-2">
                  <InputBox
                    placeholder="Discount"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    disabled={isEdit}
                    value="discount"
                    className="bg-white"
                    initialValue={fetchedAwbData?.volDiscount || "0.00"}
                  />
                  <DummyInputBoxLightGray
                    register={register}
                    placeholder={`DEL`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`discountAmt`}
                    className={"bg-white"}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelYellow
                    register={register}
                    placeholder={`0.00`}
                    label={`SGST`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`sgst`}
                  />
                  <DummyInputBoxWithLabelYellow
                    register={register}
                    placeholder={`0.00`}
                    label={`CGST`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`cgst`}
                  />
                </div>

                <div className="flex gap-2">
                  <DummyInputBoxWithLabelYellow
                    register={register}
                    placeholder={`0.00`}
                    label={`IGST`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`igst`}
                  />
                  <DummyInputBoxWithLabelYellow
                    register={register}
                    placeholder={`0.00`}
                    label={`Grand Total`}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value={`grandTotal`}
                  />
                </div>

                <DummyInputBoxDarkGray
                  register={register}
                  placeholder={`INR`}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value={`currency`}
                  inputValue={fetchedAwbData?.currency || "INR"}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <OutlinedButtonRed
                  onClick={(data) => {
                    setBtnAction("modify");
                    setIsEdit(false);
                  }}
                  disabled={
                    newShipment == "new" ||
                    newShipment == null ||
                    fetchedAwbData?.isBilled
                  }
                  tooltip={
                    fetchedAwbData?.isBilled
                      ? "Invoice has been already made"
                      : ""
                  }
                  type="submit"
                  label={`Modify`}
                />
                <OutlinedButtonRed
                  onClick={() => setBtnAction("save")}
                  type="submit"
                  disabled={
                    isEdit === true ||
                    newShipment === null ||
                    isSubmitting ||
                    fetchedAwbData?.isBilled ||
                    !serviceValidation.valid ||
                    pendingZoneUpdate
                  }
                  tooltip={
                    fetchedAwbData?.isBilled
                      ? "Invoice has been already made"
                      : ""
                  }
                  label={
                    isSubmitting
                      ? newShipment === "old"
                        ? "Updating"
                        : "Saving"
                      : "Save"
                  }
                />
              </div>

              <div className="flex gap-3">
                <OutlinedButtonRed label={`Refresh`} onClick={handleRefresh} />
              </div>
            </div>
          </div>
        </div>

        <CodeList
          handleAction={() => console.log("hello world")}
          data={[]}
          columns={columns}
          name={"Airway Billing"}
        />
      </form>

      <BgBlack
        expression={holdHistoryWindow || volumeWtWindow || invoiceDetailsWindow}
      />
      <HoldHistory window={holdHistoryWindow} awbNo={awbNo} />
      <VolumeWeight
        window={volumeWtWindow}
        awbNo={awbNo}
        setTotalKg={setTotalKg}
        totalKg={totalKg}
        setVolumeContent={handleSetVolumeContent}
        volumeContent={volumeContent}
        serviceData={serviceData}
      />
      <InvoiceDetails
        window={invoiceDetailsWindow}
        awbNo={awbNo}
        setInvContent={setInvContent}
        setInvoiceTotalValue={setInvoiceTotalValue}
        setInvoiceContent={handleSetInvoiceContent}
        invoiceContent={invoiceContent}
      />
      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        awbNo={alertData.awbNo}
        message={alertData.message}
        title="AWB Alert"
      />
    </div>
  );
}

export default AwbBilling;
