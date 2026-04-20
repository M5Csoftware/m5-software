"use client";
import dynamic from "next/dynamic";
const HoldHistory = dynamic(
  () => import("@/app/components/awb-entry/HoldHistory"),
  { ssr: false }
);
const InvoiceDetails = dynamic(
  () => import("@/app/components/awb-entry/InvoiceDetails"),
  { ssr: false }
);
const VolumeWeight = dynamic(
  () => import("@/app/components/awb-entry/VolumeWeight"),
  { ssr: false }
);

import { OutlinedButtonRed } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelTransparent,
  DummyInputBoxWithLabelYellow,
  DummyInputBoxLightGray,
} from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { InputBoxYellow } from "@/app/components/InputBox";
import { RedCheckboxBase } from "@/app/components/RedCheckBox";
import Image from "next/image";
import React, {
  useEffect,
  useContext,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import BgBlack from "@/app/components/BgBlack";
import axios from "axios";
import CodeList from "@/app/components/CodeList";
import { useAuth } from "@/app/Context/AuthContext";
import NotificationFlag from "@/app/components/Notificationflag";
import { useAlertCheck } from "@/app/hooks/useAlertCheck";
import { AlertModal } from "@/app/components/AlertModal";
import PasswordModal from "@/app/components/passwordModal";
import { useDebounce } from "@/app/hooks/useDebounce";

function AwbEntryImport() {
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

  const { setActualWtt, server, setGlobalTotalPcs } = useContext(GlobalContext);
  const { user } = useAuth();

  const [fetchedAwbData, setFetchedAwbData] = useState({});
  const [account, setAccount] = useState(null);

  const [isEdit, setIsEdit] = useState(false);
  const [isHold, setIsHold] = useState(false);
  const [newShipment, setNewShipment] = useState(null);
  const [btnAction, setBtnAction] = useState(null);
  const [holdEdit, setHoldEdit] = useState(false);
  const [holdReason, setHoldReason] = useState("");

  const [holdHistoryWindow, setHoldHistoryWindow] = useState(false);
  const [volumeWtWindow, setVolumeWtWindow] = useState(false);
  const [invoiceDetailsWindow, setInvoiceDetailsWindow] = useState(false);

  const [date, setDate] = useState("");

  const [volumeContent, setVolumeContent] = useState({});
  const [invoiceContent, setInvoiceContent] = useState([]);
  const [totalKg, setTotalKg] = useState(0.0);
  const [invTotalValue, setInvoiceTotalValue] = useState(0.0);
  const [invContent, setInvContent] = useState([]);

  const [refreshKey, setRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awbLoading, setAwbLoading] = useState(false);

  // Manual account entry tracking
  const [isManualAccountEntry, setIsManualAccountEntry] = useState(false);
  const [lastEnteredCode, setLastEnteredCode] = useState("");

  // FOC password
  const [showFOCPasswordModal, setShowFOCPasswordModal] = useState(false);
  const [prevPayment, setPrevPayment] = useState("Credit");
  const [focUnlocked, setFocUnlocked] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", awbNo: "" });
  const { checkAlert } = useAlertCheck();

  // ── Watched values ──────────────────────────────────────────────────────
  const awbNo = watch("awbNo");
  const pcs = useWatch({ control, name: "pcs" });
  const actualWt = useWatch({ control, name: "actualWt" });
  const volWt = useWatch({ control, name: "volWt" });
  const chargeableWt = useWatch({ control, name: "chargeableWt" });
  const grandTotal = watch("grandTotal");
  const volDisc = watch("volDisc");
  const selectedPayment = watch("payment");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    return (
      dt.getDate().toString().padStart(2, "0") +
      "/" +
      (dt.getMonth() + 1).toString().padStart(2, "0") +
      "/" +
      dt.getFullYear()
    );
  };

  // ── Clear hold fields when unchecked ───────────────────────────────────
  useEffect(() => {
    if (!isHold) {
      setHoldReason("");
      setValue("holdReason", "");
      setValue("otherHoldReason", "");
    }
  }, [isHold, setValue]);

  // ── Init hold state from fetched data ───────────────────────────────────
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

  // ── Credit check ────────────────────────────────────────────────────────
  useEffect(() => {
    if (newShipment === "old") return;
    if (!account || !grandTotal || Number(grandTotal) === 0) return;

    const leftOverBalance = account.leftOverBalance || 0;
    const creditLimit = account.creditLimit || 0;
    const walletFunds = leftOverBalance < 0 ? Math.abs(leftOverBalance) : 0;
    const totalAvailable = walletFunds + creditLimit;
    const effectiveDebt = leftOverBalance > 0 ? leftOverBalance : 0;
    const netAvailable = totalAvailable - effectiveDebt;

    if (Number(grandTotal) > netAvailable) {
      setHoldReason("Credit Limit Exceeded");
      setIsHold(true);
      setHoldEdit(true);
      setValue("isHold", true);
      setValue("holdReason", "Credit Limit Exceeded");
      showNotification("error", "Credit Limit Exceeded");
    } else {
      if (holdEdit) setHoldEdit(false);
    }
  }, [grandTotal, account, newShipment]);

  // ── chargeableWt auto-calculation ──────────────────────────────────────
  useEffect(() => {
    const actual = Number(actualWt) || 0;
    const vol = Number(volWt) || 0;
    const disc = Number(volDisc) || 0;

    if (actual > 0 && vol > 0) {
      const discountedVol = vol - (vol - actual) * (disc / 100);
      const chargable = Math.max(actual, discountedVol);
      setValue(
        "chargeableWt",
        chargable < 1 ? chargable.toFixed(2) : Math.ceil(chargable)
      );
    } else if (actual > 0) {
      setValue(
        "chargeableWt",
        actual < 1 ? actual.toFixed(2) : Math.ceil(actual)
      );
    } else {
      setValue("chargeableWt", "0.00");
    }
  }, [actualWt, volWt, volDisc, setValue]);

  // ── Sync global context ─────────────────────────────────────────────────
  useEffect(() => { setActualWtt(watch("actualWt")); }, [watch("actualWt")]);
  useEffect(() => { setGlobalTotalPcs(watch("pcs")); }, [watch("pcs")]);

  // ── Account lookup ──────────────────────────────────────────────────────
  const debouncedCode = useDebounce(watch("code"), 500);

  useEffect(() => {
    if (!debouncedCode || !server) return;

    const fetchAccount = async () => {
      try {
        setIsManualAccountEntry(true);
        setLastEnteredCode(debouncedCode.toUpperCase());

        const response = await axios.get(
          `${server}/customer-account?accountCode=${debouncedCode.toUpperCase()}`
        );

        if (response.data) {
          setAccount(response.data);
          setValue("customer", response.data?.name || "");
          setValue(
            "accountBalance",
            response.data?.leftOverBalance?.toFixed(2) || "0.00"
          );
          setValue("code", debouncedCode.toUpperCase());
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

  useEffect(() => {
    if (!watch("code")) {
      setIsManualAccountEntry(false);
      setLastEnteredCode("");
    }
  }, [watch("code")]);

  // ── Date ────────────────────────────────────────────────────────────────
  useEffect(() => {
    setDate(
      fetchedAwbData?.createdAt
        ? formatDate(fetchedAwbData.createdAt)
        : formatDate(new Date())
    );
  }, [fetchedAwbData]);

  // ── Fetch AWB (import only) - FIXED ─────────────────────────────────────
  useEffect(() => {
    if (!awbNo) {
      clearErrors("awbNo");
      setFetchedAwbData({});
      setNewShipment(null);
      setAwbLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setAwbLoading(true);
        // Use the correct endpoint for import shipments
        const response = await axios.get(
          `${server}/awb-import-entry?awbNo=${awbNo}`,
          { signal: controller.signal }
        );

        if (!response.data || response.data.notFound) {
          setNewShipment("new");
          setFetchedAwbData({});
          setIsEdit(false);
        } else {
          clearErrors("awbNo");
          setFetchedAwbData(response.data);
          setIsEdit(true);
          setNewShipment("old");
        }
      } catch (error) {
        if (axios.isCancel(error)) return;
        console.error("Error fetching import AWB:", error);
        setFetchedAwbData({});
        setNewShipment("new");
        setIsEdit(false);
      } finally {
        setAwbLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [awbNo, server, clearErrors]);

  // ── Populate form from fetched data - FIXED with all fields ─────────────────────────────────────
  useEffect(() => {
    if (!fetchedAwbData || Object.keys(fetchedAwbData).length === 0) {
      if (!isManualAccountEntry) {
        setValue("customer", "");
        setValue("accountBalance", "");
      }
      setValue("volDisc", "");
      setIsHold(false);
      setInvContent([]);
      setVolumeContent({});
      setInvoiceContent([]);
      return;
    }

    const d = fetchedAwbData;

    // Basic Info
    setValue("awbNo", d.awbNo || "");
    setValue("referenceNo", d.reference || "");
    setValue("origin", d.origin || "");
    setValue("sector", d.sector || "");
    setValue("destination", d.destination || "");
    setValue("service", d.service || "");
    setValue("code", d.accountCode || "");
    setValue("forwarder", d.forwarder || "");
    setValue("billNo", d.billNo || "");

    // Customer info
    if (!isManualAccountEntry || lastEnteredCode !== d.accountCode) {
      setValue("customer", d.name || "");
      setValue("accountBalance", d.leftOverBalance || 0);
    }

    // Consignor (Shipper)
    setValue("consignor", d.shipperFullName || "");
    setValue("consignor-addressLine1", d.shipperAddressLine1 || "");
    setValue("consignor-addressLine2", d.shipperAddressLine2 || "");
    setValue("consignor-pincode", d.shipperPincode || "");
    setValue("consignor-city", d.shipperCity || "");
    setValue("consignor-state", d.shipperState || "");
    setValue("consignor-telephone", d.shipperPhoneNumber || "");
    setValue("consignor-idType", d.shipperKycType || "");
    setValue("consignor-idNumber", d.shipperKycNumber || "");

    // Consignee (Receiver)
    setValue("consignee", d.receiverFullName || "");
    setValue("consignee-addressLine1", d.receiverAddressLine1 || "");
    setValue("consignee-addressLine2", d.receiverAddressLine2 || "");
    setValue("consignee-zipcode", d.receiverPincode || "");
    setValue("consignee-city", d.receiverCity || "");
    setValue("consignee-state", d.receiverState || "");
    setValue("consignee-telephone", d.receiverPhoneNumber || "");
    setValue("consignee-emailID", d.receiverEmail || "");

    // Weights and measurements
    setValue("goodstype", d.goodstype || "");
    // Handle boxes array length for pcs
    const boxCount = Array.isArray(d.boxes) ? d.boxes.length : (d.pcs || 0);
    setValue("pcs", boxCount);
    setValue("actualWt", d.totalActualWt || 0);
    setValue("chargeableWt", d.chargeableWt || 0);
    setValue("volWt", d.totalVolWt || 0);
    setValue("volDisc", d.volDisc ?? d.volDiscount ?? "");

    // Payment & invoice
    setValue("payment", d.payment || "Credit");
    setValue("currency", d.currency || "INR");
    setValue("currencys", d.currencys || "INR");
    setValue("invoiceValue", d.totalInvoiceValue || 0);
    setValue("content", d.content || []);

    // References
    setValue("manifestNo", d.manifestNo || "");
    setValue("alMawb", d.alMawb || "");
    setValue("bag", d.bag || "");
    setValue("runNo", d.runNo || "");
    setValue("flight", d.flight || "");
    setValue("obc", d.obc || "");
    setValue("network", d.network || "");
    setValue("runDate", d.runDate ? formatDate(d.runDate) : "");

    // Amounts
    setValue("basicAmount", d.basicAmt || 0);
    setValue("sgst", d.sgst || 0);
    setValue("cgst", d.cgst || 0);
    setValue("igst", d.igst || 0);
    setValue("grandTotal", d.totalAmt || 0);
    setValue("manualAmount", d.manualAmount || 0);
    setValue("handlingAmount", d.handlingAmount || 0);
    setValue("miscChg", d.miscChg || 0);
    setValue("miscChgReason", d.miscChgReason || "");
    setValue("duty", d.duty || 0);
    setValue("overWtHandling", d.overWtHandling || 0);
    setValue("fuelPercentage", d.fuelPercentage || 0);
    setValue("fuelAmt", d.fuelAmt || 0);
    setValue("cashRecvAmount", d.cashRecvAmount || 0);

    // Hold
    setIsHold(d.isHold || false);
    setValue("holdReason", d.holdReason || "");
    setValue("otherHoldReason", d.otherHoldReason || "");
    setValue("operationRemark", d.operationRemark || "");

    // Invoice and volume content
    if (d.shipmentAndPackageDetails) {
      setInvoiceContent(d.shipmentAndPackageDetails);
    }
    if (d.boxes && Array.isArray(d.boxes)) {
      setVolumeContent(d.boxes);
      // Calculate total kg from boxes if needed
      const totalKgFromBoxes = d.boxes.reduce((sum, box) => sum + (Number(box.weight) || 0), 0);
      if (totalKgFromBoxes > 0) {
        setTotalKg(totalKgFromBoxes);
      }
    }
    
    // Set invoice total value
    if (d.totalInvoiceValue) {
      setInvoiceTotalValue(d.totalInvoiceValue);
    }
  }, [fetchedAwbData, setValue, isManualAccountEntry, lastEnteredCode]);

  // ── Alert check ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!awbNo || awbNo.trim().length < 4) return;
    const timer = setTimeout(async () => {
      const result = await checkAlert(awbNo.trim());
      if (result.hasAlert) {
        setAlertData({ message: result.message, awbNo: result.awbNo });
        setAlertModalOpen(true);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [awbNo, checkAlert]);

  // ── FOC payment guard ───────────────────────────────────────────────────
  useEffect(() => {
    if (selectedPayment && selectedPayment !== "FOC") {
      setPrevPayment(selectedPayment);
    }
    if (selectedPayment === "FOC" && !focUnlocked) {
      setShowFOCPasswordModal(true);
    }
  }, [selectedPayment, focUnlocked]);

  useEffect(() => {
    if (fetchedAwbData?.payment === "FOC" || fetchedAwbData?.payment === "RTO") {
      setFocUnlocked(true);
      setPrevPayment(fetchedAwbData.payment);
      setValue("payment", fetchedAwbData.payment);
    }
  }, [fetchedAwbData, setValue]);

  // ── Window keyboard shortcuts ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F8") {
        setHoldHistoryWindow(false);
        setInvoiceDetailsWindow(false);
        setVolumeWtWindow(true);
      } else if (e.key === "F9") {
        setHoldHistoryWindow(false);
        setVolumeWtWindow(false);
        setInvoiceDetailsWindow(true);
      } else if (e.key === "F11" && !isEdit) {
        setHoldHistoryWindow(true);
        setVolumeWtWindow(false);
        setInvoiceDetailsWindow(false);
      } else if (e.key === "Escape") {
        setHoldHistoryWindow(false);
        setVolumeWtWindow(false);
        setInvoiceDetailsWindow(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEdit]);

  useEffect(() => {
    document.body.style.overflow =
      holdHistoryWindow || invoiceDetailsWindow || volumeWtWindow
        ? "hidden"
        : "";
    return () => { document.body.style.overflow = ""; };
  }, [holdHistoryWindow, invoiceDetailsWindow, volumeWtWindow]);

  // ── Sync sub-form content ───────────────────────────────────────────────
  const handleSetInvoiceContent = useCallback((data) => {
    setInvoiceContent(data);
  }, []);

  useEffect(() => { setValue("invoiceContent", invoiceContent); }, [invoiceContent, setValue]);

  const handleSetVolumeContent = useCallback((data) => {
    setVolumeContent(data.map(({ volumeWeightTable, ...rest }) => rest));
  }, []);

  useEffect(() => { setValue("volumeContent", volumeContent); }, [volumeContent, setValue]);

  // ── Refresh ─────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    reset({
      awbNo: "", code: "", customer: "", accountBalance: "",
      origin: "", sector: "", destination: "", service: "",
      consignor: "", "consignor-addressLine1": "", "consignor-addressLine2": "",
      "consignor-pincode": "", "consignor-city": "", "consignor-state": "",
      "consignor-telephone": "", "consignor-idType": "", "consignor-idNumber": "",
      consignee: "", "consignee-addressLine1": "", "consignee-addressLine2": "",
      "consignee-zipcode": "", "consignee-city": "", "consignee-state": "",
      "consignee-telephone": "", "consignee-emailID": "",
      goodstype: "", pcs: "", actualWt: "", chargeableWt: "", volWt: "",
      volDisc: "", payment: "Credit", currency: "INR", invoiceValue: "",
      content: "", operationRemark: "", holdReason: "", otherHoldReason: "",
      isHold: false, basicAmount: "", manualAmount: "", cashRecvAmount: "",
      balanceAmount: "", handlingAmount: "", miscChg: "", miscChgReason: "",
      duty: "", overWtHandling: "", hikeAmt: "", fuelPercentage: "",
      fuelAmt: "", discount: "", sgst: "", cgst: "", igst: "", grandTotal: "",
      referenceNo: "", manifestNo: "", alMawb: "", bag: "", runNo: "",
      flight: "", obc: "", forwarder: "", billNo: "",
    });

    setFetchedAwbData({});
    setAccount(null);
    setIsEdit(false);
    setIsHold(false);
    setNewShipment(null);
    setBtnAction(null);
    setVolumeContent({});
    setInvoiceContent([]);
    setTotalKg(0.0);
    setInvoiceTotalValue(0.0);
    setInvContent([]);
    setHoldReason("");
    setHoldEdit(false);
    setFocUnlocked(false);
    setPrevPayment("Credit");
    setIsManualAccountEntry(false);
    setLastEnteredCode("");
    setHoldHistoryWindow(false);
    setVolumeWtWindow(false);
    setInvoiceDetailsWindow(false);
    setDate(formatDate(new Date()));
    setRefreshKey((prev) => prev + 1);
    showNotification("success", "Page refreshed successfully");
  };

  // ── Submit handler ──────────────────────────────────────────────────────
  const handleAWBEntry = async (data) => {
    if (fetchedAwbData?.runNo) {
      showNotification(
        "error",
        `Shipment is already assigned to Run No: ${fetchedAwbData.runNo}. Modification not allowed.`
      );
      return;
    }

    const { code, ...rest } = data;
    const accountCode = code;
    const insertUser = user?.userId;
    const updateUser = user?.userId;

    const payload = {
      accountCode,
      ...rest,
      isHold,
      holdReason: isHold ? holdReason || rest.holdReason || "" : "",
      otherHoldReason: isHold ? rest.otherHoldReason || "" : "",
      boxes: Array.isArray(volumeContent) ? volumeContent : Object.values(volumeContent),
      shipmentAndPackageDetails: invoiceContent || {},
      totalActualWt: Number(rest.actualWt) || 0,
      totalVolWt: Number(rest.volWt) || 0,
      totalInvoiceValue: Number(rest.invoiceValue) || 0,
      chargeableWt: Number(rest.chargeableWt) || 0,
      pcs: Number(rest.pcs) || 0,
      basicAmt: Number(rest.basicAmount) || 0,
      totalAmt: Number(rest.grandTotal) || 0,
    };

    // ── CREATE ──
    if (newShipment === "new" && btnAction === "save") {
      try {
        setIsSubmitting(true);
        const response = await axios.post(`${server}/awb-import-entry`, {
          ...payload,
          insertUser,
        });

        if (response.data?.status === 201) {
          showNotification("success", "Import AWB saved successfully");
          handleRefresh();
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Error saving import AWB";
        showNotification("error", msg);
      } finally {
        setIsSubmitting(false);
        setBtnAction(null);
      }
    }

    // ── UPDATE ──
    else if (newShipment === "old" && btnAction === "save" && !isEdit) {
      try {
        setIsSubmitting(true);
        const response = await axios.put(
          `${server}/awb-import-entry?awbNo=${data.awbNo}`,
          { ...payload, updateUser }
        );

        if (response?.status === 200) {
          showNotification("success", "Import AWB updated successfully");
          handleRefresh();
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Error updating import AWB";
        showNotification("error", msg);
      } finally {
        setIsSubmitting(false);
        setBtnAction(null);
      }
    }

    // ── DELETE ──
    else if (newShipment === "old" && btnAction === "delete") {
      if (!user?.permissions?.includes("Booking Deletion")) {
        showNotification("error", "You don't have permission to delete shipments");
        setBtnAction(null);
        return;
      }

      const confirmDelete = window.confirm(
        `Are you sure you want to delete AWB: ${data.awbNo}?`
      );
      if (!confirmDelete) {
        setBtnAction(null);
        return;
      }

      try {
        const response = await axios.delete(
          `${server}/awb-import-entry?awbNo=${data.awbNo}`
        );

        if (response?.status === 200) {
          showNotification("success", "Import AWB deleted successfully");
          handleRefresh();
        }
      } catch (error) {
        const msg =
          error.response?.data?.message || "Error deleting import AWB";
        showNotification("error", msg);
      } finally {
        setBtnAction(null);
      }
    }
  };

  // ── CodeList columns ────────────────────────────────────────────────────
  const columns = useMemo(() => [
    { key: "code", label: "Code" },
    { key: "customer", label: "Customer" },
  ], []);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div key={refreshKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <PasswordModal
        isOpen={showFOCPasswordModal}
        onClose={() => {
          setValue("payment", prevPayment);
          setShowFOCPasswordModal(false);
        }}
        onSuccess={() => {
          setFocUnlocked(true);
          setPrevPayment("FOC");
          setShowFOCPasswordModal(false);
        }}
        title="FOC Authorization"
        description="Enter password to allow Free of Charge shipment"
      />

      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(handleAWBEntry)}
      >
        <div className="flex flex-col relative">
          <Heading
            title="Airway Bill Import Entry"
            bulkUploadBtn="hidden"
            onRefresh={handleRefresh}
          />
        </div>

        <div className="flex gap-3 mt-1">
          <div className="w-full flex flex-col gap-3">

            {/* ── AWB Number & Shipment Origin/Destination ── */}
            <div className="flex gap-3 justify-between">
              {/* AWB Number */}
              <div className="flex flex-col gap-3 w-1/2">
                <RedLabelHeading label="Airway Bill Number" />
                <div className="relative">
                  <InputBoxYellow
                    register={register}
                    placeholder=""
                    inputValue={awbNo}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="awbNo"
                    error={errors.awbNo}
                    trigger={trigger}
                    validation={{ required: "AWB Number is required" }}
                  />
                  {awbLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
                      <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Origin / Destination */}
              <div className="flex flex-col gap-3 w-full">
                <RedLabelHeading label="Shipment Origin / Destination" />
                <div className="flex gap-3">
                  <DummyInputBoxWithLabelTransparent
                    watch={watch}
                    label="Date"
                    inputValue={date}
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="date"
                  />
                  <LabeledDropdown
                    options={["Mumbai", "Delhi", "Ahmedabad"]}
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    defaultValue={fetchedAwbData?.origin || ""}
                    title="Origin"
                    value="origin"
                    error={errors.origin}
                    trigger={trigger}
                    validation={{ required: "Origin is required" }}
                    disabled={isEdit}
                  />
                  <InputBox
                    placeholder="Sector"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="sector"
                    initialValue={fetchedAwbData?.sector || ""}
                    disabled={isEdit}
                  />
                  <InputBox
                    placeholder="Destination"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="destination"
                    initialValue={fetchedAwbData?.destination || ""}
                    disabled={isEdit}
                  />
                </div>
              </div>
            </div>

            {/* ── Customer Details ── */}
            <div className="flex flex-col gap-3">
              <RedLabelHeading label="Customer Details" />
              <div className="flex gap-3">
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
                <div className="flex w-full gap-3">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label="Customer"
                    setValue={setValue}
                    resetFactor={refreshKey}
                    inputValue={watch("customer")}
                    value="customer"
                    error={errors.customer}
                    trigger={trigger}
                    validation={{ required: "Customer name is required" }}
                  />
                  <div className="flex gap-3 w-full">
                    <InputBox
                      register={register}
                      placeholder="Forwarder"
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="forwarder"
                      initialValue={fetchedAwbData?.forwarder || ""}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      label="Bill No."
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="billNo"
                      inputValue={fetchedAwbData?.billNo || ""}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Consignor / Consignee ── */}
            <div className="flex gap-6">
              {/* Consignor */}
              <div className="w-full flex flex-col gap-3">
                <RedLabelHeading label="Consignor Details" />
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
                    disabled={isEdit}
                    initialValue={fetchedAwbData?.shipperPincode || ""}
                    trigger={trigger}
                    validation={{ required: "Pincode is required" }}
                  />
                  <InputBox
                    placeholder="City"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignor-city"
                    error={errors["consignor-city"]}
                    disabled={isEdit}
                    initialValue={fetchedAwbData?.shipperCity || ""}
                    trigger={trigger}
                    validation={{ required: "City is required" }}
                  />
                  <InputBox
                    placeholder="State"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignor-state"
                    disabled={isEdit}
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
                  trigger={trigger}
                  validation={{ required: "Telephone is required" }}
                />
                <div className="flex gap-2">
                  <LabeledDropdown
                    options={[
                      "GSTIN (Normal)", "GSTIN (Govt Entities)", "GSTIN (Diplomats)",
                      "PAN Number", "TAN Number", "Passport Number",
                      "Aadhaar Number", "Voter Id",
                    ]}
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    title="ID Type"
                    value="consignor-idType"
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
                    disabled={isEdit}
                    initialValue={fetchedAwbData?.shipperKycNumber || ""}
                  />
                </div>
              </div>

              {/* Consignee */}
              <div className="w-full flex flex-col gap-3">
                <RedLabelHeading label="Consignee Details" />
                <InputBox
                  placeholder="Consignee"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignee"
                  error={errors.consignee}
                  disabled={isEdit}
                  trigger={trigger}
                  validation={{ required: "Consignee is required" }}
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
                  trigger={trigger}
                  validation={{ required: "Address Line 1 is required" }}
                  initialValue={fetchedAwbData?.receiverAddressLine1 || ""}
                />
                <InputBox
                  placeholder="Address Line 2"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignee-addressLine2"
                  disabled={isEdit}
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
                    trigger={trigger}
                    validation={{ required: "Zipcode is required" }}
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
                    trigger={trigger}
                    validation={{ required: "City is required" }}
                    initialValue={fetchedAwbData?.receiverCity || ""}
                  />
                  <InputBox
                    placeholder="State"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="consignee-state"
                    disabled={isEdit}
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
                  trigger={trigger}
                  validation={{ required: "Telephone is required" }}
                  initialValue={fetchedAwbData?.receiverPhoneNumber || ""}
                />
                <InputBox
                  placeholder="Email ID"
                  register={register}
                  setValue={setValue}
                  resetFactor={refreshKey}
                  value="consignee-emailID"
                  disabled={isEdit}
                  initialValue={fetchedAwbData?.receiverEmail || ""}
                />
              </div>
            </div>

            {/* ── Shipment Weight Details ── */}
            <div className="w-full flex flex-col gap-3">
              <RedLabelHeading label="Shipment Weight Details (F8)" />
              <div className="flex gap-6">
                <div className="flex flex-col gap-3 w-full">
                  <div className="flex gap-2">
                    <DummyInputBoxDarkGray
                      placeholder="Network"
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="network"
                    />
                    <DummyInputBoxDarkGray
                      register={register}
                      placeholder="DEL"
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="networkName"
                    />
                  </div>

                  <InputBox
                    placeholder="Service"
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="service"
                    initialValue={fetchedAwbData?.service || ""}
                    disabled={isEdit}
                  />

                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        placeholder="0.00 Kg"
                        label="Vol. Wt."
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value="volWt"
                        inputValue={totalKg || fetchedAwbData?.totalVolWt}
                        error={errors.volWt}
                        trigger={trigger}
                        validation={{ required: "Volume Wt is required" }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setHoldHistoryWindow(false);
                          setInvoiceDetailsWindow(false);
                          setVolumeWtWindow(true);
                        }}
                        className="absolute top-1/4 right-4"
                      >
                        <Image alt="" src="/edit-input.svg" height={16} width={16} />
                      </button>
                    </div>
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      placeholder="0.00 %"
                      label="Vol Disc (%)"
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="volDisc"
                      inputValue={fetchedAwbData?.volDisc ?? 0}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label="Forwarding No."
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="forwardingNo"
                    inputValue={fetchedAwbData?.forwardingNo || ""}
                  />
                  <div className="flex gap-2">
                    <LabeledDropdown
                      options={["Dox", "NDox"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      title="Goods Type"
                      value="goodstype"
                      defaultValue={fetchedAwbData?.goodstype || ""}
                      disabled={isEdit}
                    />
                    <InputBox
                      placeholder="Pcs"
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="pcs"
                      disabled={isEdit}
                      initialValue={fetchedAwbData?.pcs || fetchedAwbData?.boxes?.length || ""}
                      error={errors.pcs}
                      trigger={trigger}
                      validation={{ required: "PCS is required" }}
                    />
                    <InputBox
                      placeholder="Actual Wt. (Kg)"
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="actualWt"
                      disabled={isEdit}
                      initialValue={fetchedAwbData?.totalActualWt || 0}
                      error={errors.actualWt}
                      trigger={trigger}
                      validation={{ required: "Actual weight is required" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <DummyInputBoxWithLabelTransparent
                      label="Chargeable Wt."
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="chargeableWt"
                      watch={watch}
                    />
                    <LabeledDropdown
                      options={["AIR CARGO", "COD", "Credit", "FOC", "RTO"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      title="Payment"
                      value="payment"
                      selectedValue={selectedPayment}
                      defaultValue={fetchedAwbData?.payment || "Credit"}
                      disabled={isEdit}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Invoice Content ── */}
            <div className="w-full flex flex-col gap-3">
              <RedLabelHeading label="Invoice Content (F9)" />
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="w-1/2 flex gap-2">
                    <LabeledDropdown
                      options={["AUD", "CAD", "EU", "EUR", "GBP", "INR", "USD"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      title="Currency"
                      value="currency"
                      defaultValue={fetchedAwbData?.currency || "INR"}
                      disabled={isEdit}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      label="Inv Value"
                      placeholder="0"
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="invoiceValue"
                      inputValue={invTotalValue || fetchedAwbData?.totalInvoiceValue}
                      error={errors.invoiceValue}
                      trigger={trigger}
                      validation={{ required: "Invoice Value is required" }}
                    />
                  </div>
                  <div className="w-full flex gap-2">
                    <DummyInputBoxWithLabelDarkGray
                      label="Content"
                      register={register}
                      setValue={setValue}
                      resetFactor={refreshKey}
                      value="content"
                      inputValue={invContent || fetchedAwbData?.content}
                    />
                    <div className="relative">
                      <DummyInputBoxDarkGray
                        register={register}
                        placeholder="Invoice"
                        setValue={setValue}
                        resetFactor={refreshKey}
                        value="invoice"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setHoldHistoryWindow(false);
                          setVolumeWtWindow(false);
                          setInvoiceDetailsWindow(true);
                        }}
                        className="absolute top-1/4 right-4"
                      >
                        <Image alt="" src="/invoice.svg" height={20} width={20} />
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
                    label="Hold"
                    isChecked={isHold}
                    setChecked={setIsHold}
                    id="isHold"
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
                      "Custom Hold - CSTM",
                      "KYC Not Verified - KYC",
                      "Invoice Missing - INV",
                      "Payment Pending - PAY",
                      "Duplicate Shipment - DUP",
                    ]}
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    title="Hold Reason"
                    value="holdReason"
                    defaultValue={holdReason || fetchedAwbData?.holdReason || ""}
                    disabled={isEdit || holdEdit}
                  />
                  <InputBox
                    placeholder="Manifest No."
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="manifestNo"
                    initialValue={fetchedAwbData?.manifestNo || ""}
                  />
                  <InputBox
                    placeholder="Al Mawb No."
                    register={register}
                    setValue={setValue}
                    resetFactor={refreshKey}
                    value="alMawb"
                    initialValue={fetchedAwbData?.alMawb || ""}
                  />
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex gap-3">
              <OutlinedButtonRed
                onClick={() => { setBtnAction("modify"); setIsEdit(false); }}
                disabled={
                  newShipment === "new" ||
                  newShipment === null ||
                  fetchedAwbData?.billingLocked ||
                  !!fetchedAwbData?.runNo
                }
                type="submit"
                label="Modify"
                tooltip={
                  fetchedAwbData?.runNo
                    ? `Modification not allowed — assigned to Run No: ${fetchedAwbData.runNo}`
                    : ""
                }
              />
              <OutlinedButtonRed
                onClick={() => setBtnAction("save")}
                type="submit"
                disabled={
                  isEdit === true ||
                  newShipment === null ||
                  isSubmitting ||
                  fetchedAwbData?.billingLocked ||
                  !!fetchedAwbData?.runNo
                }
                label={
                  isSubmitting
                    ? newShipment === "old" ? "Updating..." : "Saving..."
                    : "Save"
                }
                tooltip={
                  fetchedAwbData?.runNo
                    ? `Saving not allowed — assigned to Run No: ${fetchedAwbData.runNo}`
                    : ""
                }
              />
              <OutlinedButtonRed
                onClick={() => setBtnAction("delete")}
                type="submit"
                disabled={
                  newShipment === "new" ||
                  newShipment === null ||
                  !!fetchedAwbData?.runNo
                }
                label="Delete"
                perm="Booking Deletion"
                tooltip={
                  fetchedAwbData?.runNo
                    ? `Deletion not allowed — assigned to Run No: ${fetchedAwbData.runNo}`
                    : ""
                }
              />
              <OutlinedButtonRed label="Refresh" onClick={handleRefresh} />
            </div>

          </div>
        </div>

        <CodeList
          handleAction={() => {}}
          data={[]}
          columns={columns}
          name="Airway Bill Import Entry"
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
        serviceData={null}
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

export default AwbEntryImport;