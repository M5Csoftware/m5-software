"use client";
import InvoiceDetails from "@/app/components/awb-entry/InvoiceDetails";
import VolumeWeight from "@/app/components/awb-entry/VolumeWeight";
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
import InputBox from "@/app/components/InputBox";
import { RedCheckboxBase } from "@/app/components/RedCheckBox";
import Image from "next/image";
import React, {
  useEffect,
  useContext,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import BgBlack from "@/app/components/BgBlack";
import axios from "axios";
import CodeList from "@/app/components/CodeList";
import { useAuth } from "@/app/Context/AuthContext";
import NotificationFlag from "@/app/components/Notificationflag";

function ApplyExtraCharges({ extraCharges, onClose }) {
  const {
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
    trigger,
    clearErrors,
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
  const [isModifying, setIsModifying] = useState(false);

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

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // ✅ Extract clean prefix code once — used everywhere
  const prefixCode = (extraCharges || "EX")
    .split(/[-\s]/)[0]
    .trim()
    .toUpperCase();

  // Watching input values
  const awbNo = watch("awbNo");
  const actualWt = watch("actualWt");
  const volWt = watch("volWt");
  const volDisc = watch("volDisc");
  const chargeableWt = watch("chargeableWt");

  // Guard chargeableWt recalculation — skip when modifying
  useEffect(() => {
    if (isModifying) return;
    const actual = Number(actualWt) || 0;
    const vol = Number(volWt) || 0;
    const disc = Number(volDisc) || 0;

    if (actual > 0 && vol > 0 && disc >= 0) {
      const diff = vol - actual;
      const discount = (diff * disc) / 100;
      const discountedVol = vol - discount;
      const chargable = Math.max(actual, discountedVol);
      if (chargable < 1) {
        setValue("chargeableWt", chargable.toFixed(2));
      } else {
        setValue("chargeableWt", Math.ceil(chargable));
      }
    } else {
      setValue("chargeableWt", "0.00");
    }
  }, [actualWt, volWt, volDisc, setValue, isModifying]);

  useEffect(() => {
    setActualWtt(watch("actualWt"));
  }, [watch("actualWt")]);

  useEffect(() => {
    setGlobalTotalPcs(watch("pcs"));
  }, [watch("pcs")]);

  const handleAWBEntry = async (data) => {
    const { code, ...filterData } = data;
    const accountCode = code;

    // ✅ Clean prefix from dropdown value e.g. "EX- Extra Charges" → "EX"
    const extraChargeType = prefixCode;

    // ✅ The user types the full AWB number directly e.g. "MPL03032026"
    // Backend will prepend the prefix → "EXMPL03032026"
    const enteredAwbNo = awbNo ? awbNo.trim() : "";

    const payload = {
      ...filterData,
      accountCode,
      extraChargeType,
      grandTotal: filterData.grandTotal || filterData.totalAmt,
      awbNo: enteredAwbNo, // ✅ send full entered AWB — backend prepends prefix
    };

    console.log("Payload being sent:", {
      accountCode: payload.accountCode,
      awbNo: payload.awbNo,
      grandTotal: payload.grandTotal,
      extraChargeType: payload.extraChargeType,
    });

    // ✅ When modifying or new — always POST to create new shipment
    if (btnAction == "save" && (newShipment == "new" || isModifying)) {
      try {
        const response = await axios.post(
          `${server}/portal/create-shipment/extra-charges`,
          payload,
        );

        if (response.data?.status == 201 || response.status == 201) {
          showNotification(
            "success",
            isModifying
              ? "Extra charges modified and saved as new entry!"
              : "Extra charges applied successfully!",
          );
          if (response.data.awbNo) {
            setValue("awbNo", response.data.awbNo);
          }
          setTimeout(() => {
            handleRefresh();
            onClose();
          }, 2000);
        }
        setBtnAction(null);
      } catch (error) {
        console.error("Error applying extra charges:", error);
        showNotification(
          "error",
          error.response?.data?.error || "Error applying extra charges!",
        );
        setBtnAction(null);
      }
    } else if (
      newShipment == "old" &&
      btnAction == "save" &&
      isEdit == false &&
      !isModifying
    ) {
      // ✅ Normal update — send full entered AWB to backend for lookup
      try {
        const response = await axios.put(
          `${server}/portal/create-shipment/extra-charges?awbNo=${enteredAwbNo}`,
          payload,
        );

        if (response?.status == 200) {
          showNotification("success", "Extra charges updated successfully!");
          setTimeout(() => {
            handleRefresh();
            onClose();
          }, 2000);
        }
        setBtnAction(null);
      } catch (error) {
        console.error("Error updating extra charges:", error);
        showNotification("error", "Error updating extra charges!");
        setBtnAction(null);
      }
    } else if (newShipment == "old" && btnAction == "delete") {
      try {
        const response = await axios.delete(
          `${server}/portal/create-shipment/extra-charges?awbNo=${enteredAwbNo}`,
        );

        if (response?.status == 200) {
          showNotification("success", "Extra charges deleted successfully!");
          setTimeout(() => {
            handleRefresh();
            onClose();
          }, 2000);
        }
        setBtnAction(null);
      } catch (error) {
        console.error("Error deleting extra charges:", error);
        showNotification("error", "Error deleting extra charges!");
        setBtnAction(null);
      }
    }
  };

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

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "F8" && !isEdit) {
        openVolumeWtWindow();
      } else if (event.key === "Escape") {
        setHoldHistoryWindow(false);
        setVolumeWtWindow(false);
        setInvoiceDetailsWindow(false);
      } else if (event.key === "F9" && !isEdit) {
        openInvoiceDetailsWindow();
      } else if (event.key === "F11" && !isEdit) {
        openHoldHistoryWindow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  // Customer account details fetching
  useEffect(() => {
    const code = watch("code");
    if (!code) return;

    const handler = setTimeout(async () => {
      try {
        const response = await axios.get(
          `${server}/customer-account?accountCode=${code}`,
        );
        setAccount(response.data);

        if (response.data) {
          setValue("customer", response.data?.name);
          setValue("accountBalance", response.data?.leftOverBalance);
        } else {
          setValue("customer", null);
          setValue("accountBalance", null);
        }
      } catch (error) {
        console.error("Failed to fetch account:", error);
        setValue("customer", null);
        setValue("accountBalance", null);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [watch("code")]);

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
  }, []);

  useEffect(() => {
    const enteredAwbNo = watch("awbNo")?.trim();
    if (!enteredAwbNo) return;

    const matchedAwb = airwayBills.find(
      (bill) => bill.awbNo?.toLowerCase() === enteredAwbNo.toLowerCase(),
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
      setValue("manualAmount", "");
      setValue("cashRecvAmount", "");
      setValue("balanceAmount", "");
      setValue("handlingAmount", "");
      setValue("miscChg", "");
      setValue("miscChgReason", "");
      setValue("duty", "");
      setValue("overWtHandling", "");
      setValue("hikeAmt", "");
      setValue("fuelPercentage", "");
      setValue("fuelAmt", "");
      setValue("discount", "");
      setValue("sgst", "");
      setValue("cgst", "");
      setValue("igst", "");
      setValue("currency", "");
    }
  }, [watch("awbNo"), airwayBills, setValue]);

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
  }, [watch("sector")]);

  useEffect(() => {
    setResetServiceAndDestination((prev) => !prev);
  }, [selectedSector, watch("sector")]);

  useEffect(() => {
    setSelectedDestinations(watch("destination"));
  }, [watch("destination")]);

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
  }, [account]);

  useEffect(() => {
    if (filteredServices.length > 0 && applicableRates) {
      const applicableList = Array.isArray(applicableRates)
        ? applicableRates
        : applicableRates?.ApplicableRates || applicableRates?.data || [];

      function normalizeService(str) {
        return (
          str
            ?.toLowerCase()
            .replace(/[-\s]+/g, "")
            .trim() || ""
        );
      }

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

      const availableServices = Array.from(
        new Map(
          commonServices.map((item) => [
            `${normalizeService(item.service)}-${item.zone}`,
            item,
          ]),
        ).values(),
      );

      setFinalServices(availableServices);
    }
  }, [filteredServices, applicableRates]);

  // Guard amount details fetch — skip when modifying
  useEffect(() => {
    if (isModifying) return;
    if (!selectedService || !applicableRates || !finalServices) return;
    if (!applicableRates || !Array.isArray(applicableRates)) return;

    const finalService = finalServices.find(
      (s) => s.service === selectedService,
    );
    const zone = finalService?.zone;

    const ratesArray = applicableRates || [];
    const matchingRate = ratesArray.find((r) => r.service === selectedService);
    const rateTariff = matchingRate?.rateTariff || "";

    if (!zone || !rateTariff || !chargeableWt) return;

    const fetchAmountDetails = async () => {
      try {
        const response = await axios.get(
          `${server}/portal/create-shipment/get-rates?service=${selectedService}&zone=${zone}&rateTariff=${rateTariff}&chargeableWt=${chargeableWt}`,
        );
        setAmountDetails(response.data);
      } catch (error) {
        console.error("Error fetching amount details:", error);
        setAmountDetails(null);
      }
    };

    fetchAmountDetails();
  }, [
    selectedService,
    applicableRates,
    finalServices,
    chargeableWt,
    isModifying,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchRes, taxRes] = await Promise.all([
          axios.get(
            `${server}/branch-master/get-branch?code=${account?.branch}`,
          ),
          axios.get(`${server}/tax-settings`),
        ]);
        setBranch(branchRes.data);
        setTaxSettings(taxRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [account]);

  // Guard base amount calculation — skip when modifying
  useEffect(() => {
    if (isModifying) return;
    if (amountDetails && account && branch && taxSettings) {
      const rate = amountDetails.rate || 0;
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

      const baseGrandTotal = basicAmount + sgstAmt + cgstAmt + igstAmt;

      setValue("basicAmount", basicAmount);
      setValue("sgst", sgstAmt);
      setValue("cgst", cgstAmt);
      setValue("igst", igstAmt);
      setValue("baseGrandTotal", baseGrandTotal);
      setValue("grandTotal", baseGrandTotal);
    }
  }, [amountDetails, account, branch, taxSettings, chargeableWt, isModifying]);

  // Grand total watcher — handles both normal mode and modify mode
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!account || !branch || !taxSettings) return;

    const subscription = watch((values) => {
      if (isUpdatingRef.current) return;

      // MODIFY MODE: recalculate GST on manualAmount as base
      if (isModifying) {
        const manualAmt = Number(values.manualAmount) || 0;
        if (manualAmt === 0) return;

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

        const sgstAmt = gstApplicable ? manualAmt * sgstRate : 0;
        const cgstAmt = gstApplicable ? manualAmt * cgstRate : 0;
        const igstAmt = gstApplicable ? manualAmt * igstRate : 0;

        const grandTotal =
          manualAmt +
          sgstAmt +
          cgstAmt +
          igstAmt +
          Number(values.handlingAmount || 0) +
          Number(values.miscChg || 0) +
          Number(values.overWtHandling || 0) +
          Number(values.cashRecvAmount || 0) -
          Number(values.discount || 0);

        isUpdatingRef.current = true;
        setValue("basicAmount", manualAmt);
        setValue("sgst", sgstAmt);
        setValue("cgst", cgstAmt);
        setValue("igst", igstAmt);
        setValue("grandTotal", grandTotal);
        isUpdatingRef.current = false;
        return;
      }

      // NORMAL MODE: use baseGrandTotal
      const baseGrandTotal = Number(values.baseGrandTotal) || 0;
      if (baseGrandTotal === 0) return;

      const {
        manualAmount = 0,
        handlingAmount = 0,
        miscChg = 0,
        cashRecvAmount = 0,
        overWtHandling = 0,
        discount = 0,
      } = values;

      const hasAdjustments =
        Number(manualAmount) !== 0 ||
        Number(handlingAmount) !== 0 ||
        Number(miscChg) !== 0 ||
        Number(overWtHandling) !== 0 ||
        Number(cashRecvAmount) !== 0 ||
        Number(discount) !== 0;

      let updatedGrandTotal = hasAdjustments
        ? baseGrandTotal +
          Number(manualAmount) +
          Number(handlingAmount) +
          Number(miscChg) +
          Number(overWtHandling) +
          Number(cashRecvAmount) -
          Number(discount)
        : baseGrandTotal;

      const needUpdate = Number(values.grandTotal) !== updatedGrandTotal;

      if (needUpdate) {
        isUpdatingRef.current = true;
        setValue("grandTotal", updatedGrandTotal, { shouldValidate: true });
        isUpdatingRef.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [setValue, account, branch, taxSettings, isModifying]);

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
    const zoneNumber = matchedZone ? matchedZone.zone : null;
  }, [watch("service"), filteredServices]);

  useEffect(() => {
    const formatDate = (date) => {
      const formattedDate =
        date.getDate().toString().padStart(2, "0") +
        "/" +
        (date.getMonth() + 1).toString().padStart(2, "0") +
        "/" +
        date.getFullYear().toString();
      return formattedDate;
    };

    if (fetchedAwbData?.createdAt) {
      const dateObj = new Date(fetchedAwbData.createdAt);
      setDate(formatDate(dateObj));
    } else {
      const today = new Date();
      setDate(formatDate(today));
    }
  }, [fetchedAwbData]);

  const [awbreset, setAwbreset] = useState(false);
  const handleRefresh = () => {
    setAwbreset(!awbreset);
    setValue("accountBalance", "");
    setValue("customer", "");
    setValue("volWt", "");
    setValue("invoiceValue", "");
    setIsHold(false);
    setIsEdit(false);
    setIsModifying(false);
    setFetchedAwbData({});
    setNewShipment(null);
  };

  const columns = useMemo(() => {
    const columnMapping = {
      "Airway Bill Entry": [
        { key: "code", label: "Code" },
        { key: "customer", label: "Customer" },
      ],
    };
    return columnMapping["Airway Bill Entry"] || [];
  }, []);

  // ✅ Fetch existing extra charges record using the full AWB as entered
  useEffect(() => {
    const fetchExtraChargesData = async () => {
      if (!awbNo) {
        clearErrors("awbNo");
        setNewShipment(null);
        setFetchedAwbData({});
        return;
      }

      try {
        const cleanAwbNo = awbNo.trim();
        if (!cleanAwbNo) return;

        const response = await axios.get(
          `${server}/portal/create-shipment/extra-charges?awbNo=${cleanAwbNo}`,
        );

        if (!response.data || response.data.notFound) {
          // No existing extra charges record — treat as new
          setNewShipment("new");
          setIsEdit(false);
          console.log("No existing extra charges record - new shipment");
        } else {
          clearErrors("awbNo");
          setIsEdit(true);
          setNewShipment("old");

          const data = response.data;
          const normalizedData = {
            ...data,
            reference: data.reference,
            origin: data.origin,
            sector: data.sector,
            destination: data.destination,
            service: data.service,
            accountCode: data.accountCode,
            name: data.customer,
            shipperFullName: data.shipperFullName,
            shipperAddressLine1: data.shipperAddressLine1,
            shipperAddressLine2: data.shipperAddressLine2,
            shipperPincode: data.shipperPincode,
            shipperCity: data.shipperCity,
            shipperState: data.shipperState,
            shipperPhoneNumber: data.shipperPhoneNumber,
            shipperKycType: data.shipperKycType,
            shipperKycNumber: data.shipperKycNumber,
            receiverFullName: data.receiverFullName,
            receiverAddressLine1: data.receiverAddressLine1,
            receiverAddressLine2: data.receiverAddressLine2,
            receiverPincode: data.receiverPincode,
            receiverCity: data.receiverCity,
            receiverState: data.receiverState,
            receiverPhoneNumber: data.receiverPhoneNumber,
            receiverEmail: data.receiverEmail,
            shipmentType: data.shipmentType,
            pcs: data.pcs,
            totalActualWt: data.totalActualWt,
            totalVolWt: data.totalVolWt,
            volDiscount: data.volDisc ?? 0,
            payment: data.payment,
            totalInvoiceValue: data.totalInvoiceValue,
            basicAmt: data.basicAmt,
            sgst: data.sgst,
            cgst: data.cgst,
            igst: data.igst,
            totalAmt: data.totalAmt,
            boxes: data.boxes,
            shipmentAndPackageDetails: data.shipmentAndPackageDetails
              ? Object.values(data.shipmentAndPackageDetails).flat()
              : [],
            manualAmount: data.manualAmount,
            handlingAmount: data.handlingAmount,
            miscChg: data.miscChg,
            miscChgReason: data.miscChgReason,
            overWtHandling: data.overWtHandling,
            cashRecvAmount: data.cashRecvAmount,
            balanceAmt: data.balanceAmt,
            hikeAmt: data.hikeAmt,
            fuelAmt: data.fuelAmt,
            fuelPercentage: data.fuelPercentage,
            duty: data.duty,
            currency: data.currency,
            currencys: data.currencys,
            runNo: data.runNo,
            bag: data.bag,
            alMawb: data.alMawb,
            flight: data.flight,
            obc: data.obc,
            runDate: data.runDate,
            network: data.network,
            holdReason: data.holdReason,
            otherHoldReason: data.otherHoldReason,
            operationRemark: data.operationRemark,
            isHold: data.isHold,
            // ✅ Keep original awbNo for mawbNo display
            awbNo: data.awbNo,
          };

          setFetchedAwbData(normalizedData);
        }
      } catch (error) {
        console.error("Error fetching extra charges data:", error);
        setNewShipment("new");
        setIsEdit(false);
      }
    };

    fetchExtraChargesData();
  }, [awbNo, server]);

  // ✅ If no extra charges record found, try fetching original shipment data to pre-fill form
  useEffect(() => {
    const fetchAwbData = async () => {
      if (!awbNo || newShipment !== "new") return;

      try {
        const cleanAwbNo = awbNo.trim();
        if (!cleanAwbNo) return;

        const response = await axios.get(
          `${server}/portal/create-shipment?awbNo=${cleanAwbNo}`,
        );

        if (!response.data || response.data.notFound) {
          setFetchedAwbData({});
        } else {
          clearErrors("awbNo");
          // Pre-fill form with original shipment data
          // Keep awbNo for mawbNo display only — do NOT set isEdit(true)
          const { awbNo: _originalAwbNo, ...originalDataWithoutAwb } =
            response.data;
          setFetchedAwbData({
            ...originalDataWithoutAwb,
            awbNo: _originalAwbNo,
          });
        }
      } catch (error) {
        console.error("Error fetching airway bill data:", error);
        setFetchedAwbData({});
      }
    };

    fetchAwbData();
  }, [awbNo, newShipment]);

  const [fetchedBaggingData, setFetchedBaggingData] = useState({});

  useEffect(() => {
    const fetchBaggingData = async () => {
      const regex = /^[A-Z]{3}\d{7,}$/i;
      if (regex.test(awbNo)) {
        try {
          const response = await axios.get(`${server}/bagging`);

          if (!response.data || response.data.length === 0) {
            setFetchedBaggingData({});
            return;
          }

          let foundAwbData = null;

          for (const baggingRecord of response.data) {
            if (baggingRecord.rowData && Array.isArray(baggingRecord.rowData)) {
              const awbRecord = baggingRecord.rowData.find(
                (row) =>
                  row.awbNo && row.awbNo.toLowerCase() === awbNo.toLowerCase(),
              );

              if (awbRecord) {
                foundAwbData = {
                  runNo: baggingRecord.runNo || "",
                  flight: baggingRecord.flight || "",
                  alMawb: baggingRecord.alMawb || "",
                  obc: baggingRecord.obc || "",
                  Mawb: baggingRecord.Mawb || "",
                  bagNo: awbRecord.bagNo || "",
                  bagWeight: awbRecord.bagWeight || "",
                  totalClubNo: baggingRecord.totalClubNo || "",
                  sector: baggingRecord.sector || "",
                  date: baggingRecord.date || "",
                };
                break;
              }
            }
          }

          if (foundAwbData) {
            setFetchedBaggingData(foundAwbData);
          } else {
            setFetchedBaggingData({});
          }
        } catch (error) {
          console.error("Error fetching bagging data:", error);
          setFetchedBaggingData({});
        }
      } else {
        setFetchedBaggingData({});
      }
    };

    fetchBaggingData();
  }, [awbNo]);

  const handleSetInvoiceContent = useCallback((data) => {
    setInvoiceContent(data);
  }, []);

  useEffect(() => {
    setValue("invoiceContent", invoiceContent);
  }, [invoiceContent]);

  const handleSetVolumeContent = useCallback((data) => {
    const cleanedData = data.map(({ volumeWeightTable, ...rest }) => rest);
    setVolumeContent(cleanedData);
  }, []);

  useEffect(() => {
    setValue("volumeContent", volumeContent);
  }, [volumeContent]);

  useEffect(() => {
    if (fetchedAwbData && Object.keys(fetchedAwbData).length > 0) {
      setValue("referenceNo", fetchedAwbData.reference || "");
      setValue("origin", fetchedAwbData.origin || "");
      setValue("sector", fetchedAwbData.sector || "");
      setValue("destination", fetchedAwbData.destination || "");
      setValue("service", fetchedAwbData.service || "");
      setValue("code", fetchedAwbData.accountCode || "");
      setValue("customer", fetchedAwbData.name || "");
      setValue("accountBalance", fetchedAwbData.accountBalance || "");
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
      setValue("shipmentType", fetchedAwbData.shipmentType || "NDox");
      setValue("pcs", fetchedAwbData.boxes?.length || 0);
      setValue("actualWt", fetchedAwbData.totalActualWt || 0);
      setValue("chargeableWt", fetchedAwbData.chargeableWt || 0);
      setValue("volWt", fetchedAwbData.totalVolWt || 0);
      setValue("volDisc", fetchedAwbData.volDiscount || 0);
      setValue("payment", fetchedAwbData.payment || "Credit");
      setValue("currencys", fetchedAwbData.currencys || "INR");
      setValue("invoiceValue", fetchedAwbData.totalInvoiceValue || 0);
      // ✅ mawbNo shows the original shipment AWB
      setValue("mawbNo", fetchedAwbData.awbNo || "");
      setValue("bag", fetchedAwbData.bag || "");
      setValue("billNo", fetchedAwbData.billNo || "");
      setValue("manifestNo", fetchedAwbData.manifestNo || "");
      setValue("runNo", fetchedAwbData.runNo || "");
      setValue("flight", fetchedAwbData.flight || "");
      setValue("obc", fetchedAwbData.obc || "");
      setValue("alMawb", fetchedAwbData.alMawb || "");
      setValue("runDate", fetchedAwbData.runDate || "");
      setValue("basicAmount", fetchedAwbData.basicAmt || 0);
      setValue("discount", fetchedAwbData.volDiscount || 0);
      setValue("sgst", fetchedAwbData.sgst || 0);
      setValue("cgst", fetchedAwbData.cgst || 0);
      setValue("igst", fetchedAwbData.igst || 0);
      setValue("grandTotal", fetchedAwbData.totalAmt || 0);
      setValue("currency", fetchedAwbData.currency || "INR");
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
      setValue("baseGrandTotal", fetchedAwbData.totalAmt || 0);
      setValue("content", fetchedAwbData.content || []);
      setIsHold(fetchedAwbData.isHold || false);
      setValue("holdReason", fetchedAwbData.holdReason || "");
      setValue("otherHoldReason", fetchedAwbData.otherHoldReason || "");
      setValue("operationRemark", fetchedAwbData.operationRemark || "");

      if (fetchedAwbData.shipmentAndPackageDetails) {
        setInvoiceContent(fetchedAwbData.shipmentAndPackageDetails);
      }
      if (fetchedAwbData.boxes) {
        setVolumeContent(fetchedAwbData.boxes);
      }
    } else {
      setValue("customer", "");
      setValue("accountBalance", "");
      setIsHold(false);
      setInvContent([]);
    }
  }, [fetchedAwbData, setValue]);

  const [holdReason, setHoldReason] = useState("");
  useEffect(() => {
    const grandTotal = watch("grandTotal");
    const availableBalance = account?.leftOverBalance
      ? -account.leftOverBalance
      : 0;
    if (availableBalance < grandTotal) {
      setHoldReason("Insufficient balance");
      setIsHold(true);
    } else {
      setIsHold(false);
      setHoldReason("");
    }
  }, [watch("grandTotal"), account]);

  return (
    <div>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form
        className="flex flex-col gap-3"
        onSubmit={handleSubmit(handleAWBEntry)}
      >
        {/* Header */}
        <div className="flex flex-col relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-600"
              >
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
            </button>
            <Heading
              title={`Extra Charges`}
              bulkUploadBtn="hidden"
              onRefresh={handleRefresh}
            />
          </div>
          <div className="absolute left-[210px] mt-1">
            <span className="text-[#0A7DC1] text-xs select-none bg-[#0A7DC11F] border-2 border-[#0A7DC1] rounded-xl px-2 py-1">
              Billing
            </span>
          </div>
        </div>

        <div className="flex gap-6 mt-2">
          <div className="w-full flex flex-col gap-4">
            {/* Airway Bill Number and Shipment Origin / Destination */}
            <div className="flex flex-col gap-5">
              <div className="flex gap-3 justify-between">
                <div className="flex flex-col gap-3 w-1/2">
                  <RedLabelHeading label={`Airway Bill Number`} />
                  {/* ✅ Show selected charge type as read-only badge + plain AWB input */}
                  <div className="flex gap-2 items-center">
                    <span className="text-xs font-semibold bg-yellow-100 border border-yellow-400 text-yellow-700 rounded px-2 py-2 whitespace-nowrap select-none">
                      {prefixCode}
                    </span>
                    <InputBox
                      placeholder={""}
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
                      value="awbNo"
                      error={errors.awbNo}
                      trigger={trigger}
                      validation={{ required: "AWB Number is required" }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <RedLabelHeading label={`Shipment Origin / Destination`} />
                  <div className="flex gap-3 justify-between">
                    <DummyInputBoxWithLabelTransparent
                      watch={watch}
                      label={`Date`}
                      inputValue={date}
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
                      value={`date`}
                    />
                    <LabeledDropdown
                      options={["Mumbai", "Delhi", "Ahemadabad"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
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
                      resetFactor={awbreset}
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
                      resetFactor={awbreset}
                      defaultValue={fetchedAwbData?.destination || null}
                      title={`Destination`}
                      value={`destination`}
                      trigger={trigger}
                      error={errors.destination}
                      validation={{ required: "Destination is required" }}
                      disabled={isEdit}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="flex flex-col gap-3">
              <RedLabelHeading label={`Customer Details`} />
              <div className="flex gap-3">
                <div>
                  <InputBox
                    placeholder="Code"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
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
                    resetFactor={awbreset}
                    inputValue={fetchedAwbData?.name || ""}
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
                      resetFactor={awbreset}
                      value={`accountBalance`}
                      inputValue={fetchedAwbData?.accountBalance || ""}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      label={`Company`}
                      setValue={setValue}
                      resetFactor={awbreset}
                      value={`company`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consignor/Consignee Details */}
            <div className="flex gap-6">
              <div className="w-full flex flex-col gap-3">
                <RedLabelHeading label={`Consignor Details`} />
                <InputBox
                  placeholder="Consignor"
                  register={register}
                  setValue={setValue}
                  resetFactor={awbreset}
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
                  resetFactor={awbreset}
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
                  resetFactor={awbreset}
                  value="consignor-addressLine2"
                  error={errors["consignor-addressLine2"]}
                  trigger={trigger}
                  disabled={isEdit}
                  initialValue={fetchedAwbData?.shipperAddressLine2 || ""}
                />
                <div className="flex gap-2">
                  <InputBox
                    placeholder="Pincode"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value="consignor-pincode"
                    error={errors["consignor-pincode"]}
                    trigger={trigger}
                    disabled={isEdit}
                    initialValue={fetchedAwbData?.shipperPincode || ""}
                    validation={{
                      required: "Pincode is required",
                      pattern: { value: /^\d{6}$/, message: "Invalid pincode" },
                    }}
                  />
                  <InputBox
                    placeholder="City"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
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
                    resetFactor={awbreset}
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
                  resetFactor={awbreset}
                  value="consignor-telephone"
                  error={errors["consignor-telephone"]}
                  disabled={isEdit}
                  initialValue={fetchedAwbData?.shipperPhoneNumber || ""}
                  validation={{
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Invalid telephone number",
                    },
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
                    resetFactor={awbreset}
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
                    resetFactor={awbreset}
                    value="consignor-idNumber"
                    error={errors["consignor-idNumber"]}
                    disabled={isEdit}
                    trigger={trigger}
                    initialValue={fetchedAwbData?.shipperKycNumber || ""}
                  />
                </div>
              </div>

              <div className="w-full flex flex-col gap-3">
                <RedLabelHeading label={`Consignee Details`} />
                <InputBox
                  placeholder="Consignee"
                  register={register}
                  setValue={setValue}
                  resetFactor={awbreset}
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
                  resetFactor={awbreset}
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
                  resetFactor={awbreset}
                  value="consignee-addressLine2"
                  error={errors["consignee-addressLine2"]}
                  disabled={isEdit}
                  trigger={trigger}
                  initialValue={fetchedAwbData?.receiverAddressLine2 || ""}
                />
                <div className="flex gap-2">
                  <InputBox
                    placeholder="Zipcode"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value="consignee-zipcode"
                    error={errors["consignee-zipcode"]}
                    disabled={isEdit}
                    validation={{ required: "Zipcode is required" }}
                    trigger={trigger}
                    initialValue={fetchedAwbData?.receiverPincode || ""}
                  />
                  <InputBox
                    placeholder="City"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
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
                    resetFactor={awbreset}
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
                  resetFactor={awbreset}
                  value="consignee-telephone"
                  error={errors["consignee-telephone"]}
                  disabled={isEdit}
                  validation={{
                    pattern: {
                      value: /^\d{10}$/,
                      message: "Invalid telephone number",
                    },
                  }}
                  trigger={trigger}
                  initialValue={fetchedAwbData?.receiverPhoneNumber || ""}
                />
                <div className="flex gap-2">
                  <InputBox
                    placeholder="Email ID"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value="consignee-emailID"
                    error={errors["consignee-emailID"]}
                    disabled={isEdit}
                    validation={{
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email format",
                      },
                    }}
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
                      <InputBox
                        placeholder="Network"
                        register={register}
                        setValue={setValue}
                        resetFactor={awbreset}
                        value="network"
                        disabled={isEdit}
                        initialValue={fetchedAwbData?.network || ""}
                      />
                    </div>
                    <DummyInputBoxDarkGray
                      register={register}
                      placeholder={`DEL`}
                      setValue={setValue}
                      resetFactor={awbreset}
                      value={`networkName`}
                    />
                  </div>
                  <LabeledDropdown
                    options={finalServices.map((service) => service.service)}
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
                    title={`Service`}
                    value={`service`}
                    defaultValue={fetchedAwbData.service || ""}
                    disabled={isEdit}
                  />
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        placeholder={`0.00 Kg`}
                        label={`Vol. Wt.`}
                        setValue={setValue}
                        resetFactor={awbreset}
                        value={`volWt`}
                        inputValue={totalKg || fetchedAwbData?.totalVolWt}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (isEdit == false) {
                            openVolumeWtWindow();
                          }
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
                      resetFactor={awbreset}
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
                    resetFactor={awbreset}
                    value={`fwdNumber`}
                  />
                  <div className="flex gap-2">
                    <LabeledDropdown
                      options={["Dox", "NDox"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
                      title={`Goods Type`}
                      value={`shipmentType`}
                      defaultValue={
                        fetchedAwbData?.shipmentType || "NDox" || ""
                      }
                      disabled={isEdit}
                    />
                    <InputBox
                      placeholder="Pcs"
                      register={register}
                      setValue={setValue}
                      disabled={isEdit}
                      initialValue={fetchedAwbData?.boxes?.length || ""}
                      resetFactor={awbreset}
                      value="pcs"
                    />
                    <InputBox
                      placeholder="Actual Wt. (Kg)"
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
                      disabled={isEdit}
                      value="actualWt"
                      initialValue={fetchedAwbData?.totalActualWt || 0.0}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <DummyInputBoxWithLabelTransparent
                        label="Chargable Wt."
                        register={register}
                        setValue={setValue}
                        resetFactor={awbreset}
                        value="chargeableWt"
                        watch={watch}
                      />
                      <div className="bg-misty-rose absolute left-0 right-0 top-0 bottom-0 -z-20 rounded-md"></div>
                    </div>
                    <LabeledDropdown
                      options={["AIR CARGO", "COD", "Credit", "FOC", "RTO"]}
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
                      title={`Payment`}
                      value={`payment`}
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
                      resetFactor={awbreset}
                      title={`Currency`}
                      value={`currencys`}
                      defaultValue={fetchedAwbData?.currencys || "INR"}
                      disabled={isEdit}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      register={register}
                      label={`Inv Value`}
                      placeholder={`0`}
                      setValue={setValue}
                      resetFactor={awbreset}
                      value={`invoiceValue`}
                      inputValue={
                        invTotalValue || fetchedAwbData?.totalInvoiceValue
                      }
                    />
                  </div>
                  <div className="w-full flex gap-2">
                    <DummyInputBoxWithLabelDarkGray
                      label={`Content`}
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
                      value={`content`}
                      inputValue={invContent || fetchedAwbData.content}
                    />
                    <div className="relative">
                      <DummyInputBoxDarkGray
                        register={register}
                        placeholder={`Invoice`}
                        setValue={setValue}
                        resetFactor={awbreset}
                        value={`invoice`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (isEdit == false) {
                            openInvoiceDetailsWindow();
                          }
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
                <div className="flex gap-3">
                  <InputBox
                    placeholder="Operation Remark"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
                    disabled={isEdit}
                    value="operationRemark"
                    initialValue={fetchedAwbData?.operationRemark || ""}
                  />
                  <div className="flex flex-col gap-3 w-1/2">
                    <InputBox
                      register={register}
                      initialValue={fetchedAwbData?.reference || ""}
                      setValue={setValue}
                      resetFactor={awbreset}
                      value={`referenceNo`}
                      placeholder={"Reference No."}
                      disabled={isEdit}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <RedCheckboxBase
                    label={"Hold"}
                    isChecked={isHold}
                    setChecked={setIsHold}
                    id={"isHold"}
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
                    flip={true}
                  />
                  <LabeledDropdown
                    options={[
                      "Insufficient balance",
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
                    resetFactor={awbreset}
                    title={`Hold Reason`}
                    value={`holdReason`}
                    defaultValue={
                      holdReason || fetchedAwbData?.holdReason || ""
                    }
                    disabled={isEdit}
                  />
                  <InputBox
                    placeholder="Other Reason"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
                    disabled={isEdit}
                    value="otherHoldReason"
                    initialValue={fetchedAwbData?.otherHoldReason || ""}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Run details */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-3">
              <RedLabelHeading label={`Run Details`} />
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={"Mawb No"}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={"mawbNo"}
                    inputValue={fetchedAwbData?.awbNo || ""}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={"Run No"}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={"runNo"}
                    inputValue={fetchedAwbData?.runNo || ""}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={"Bag No"}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={"bag"}
                    inputValue={fetchedAwbData?.bag || ""}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={"Run Date"}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={"runDate"}
                    inputValue={fetchedAwbData?.runDate || ""}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={"Club No"}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={"clubNo"}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={"AL/Mawb"}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={"alMawb"}
                    inputValue={fetchedAwbData?.alMawb || ""}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={"Flight"}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={"flight"}
                    inputValue={fetchedAwbData?.flight || ""}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={"OBC"}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={"obc"}
                    inputValue={fetchedAwbData?.obc || ""}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <RedLabelHeading label={`Amount Details`} />
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    inputValue={fetchedAwbData?.basicAmt || 0.0}
                    register={register}
                    placeholder={`0.00`}
                    label={`Basic Amt`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`basicAmount`}
                  />
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Manual Amt`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`manualAmount`}
                    disabled={isEdit && !isModifying}
                    className={"bg-white"}
                    inputValue={fetchedAwbData?.manualAmount || "0.00"}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Cash Recv. Amt`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`cashRecvAmount`}
                    disabled={isEdit && !isModifying}
                    className={"bg-white"}
                    inputValue={fetchedAwbData?.cashRecvAmount || "0.00"}
                  />
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Balance Amt`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`balanceAmount`}
                    disabled={isEdit && !isModifying}
                    className={"bg-white"}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Handling Amt`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`handlingAmount`}
                    disabled={isEdit && !isModifying}
                    className={"bg-white"}
                    inputValue={fetchedAwbData?.handlingAmount || "0.00"}
                  />
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Misc. Chg`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`miscChg`}
                    disabled={isEdit && !isModifying}
                    className={"bg-white"}
                    inputValue={fetchedAwbData?.miscChg || "0.00"}
                  />
                </div>
                <DummyInputBoxDarkGray
                  register={register}
                  placeholder={`Reason`}
                  setValue={setValue}
                  resetFactor={awbreset}
                  value={`miscChgReason`}
                  disabled={isEdit && !isModifying}
                  className={"bg-white"}
                  inputValue={fetchedAwbData?.miscChgReason || " "}
                />
                <DummyInputBoxWithLabelLightGray
                  register={register}
                  placeholder={`0.00`}
                  label={`Duty`}
                  setValue={setValue}
                  resetFactor={awbreset}
                  value={`duty`}
                  disabled={isEdit && !isModifying}
                  className={"bg-white"}
                />
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Over Wt. Handling`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`overWtHandling`}
                    disabled={isEdit && !isModifying}
                    className={"bg-white"}
                    inputValue={fetchedAwbData?.overWtHandling || "0.00"}
                  />
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Hike Amt`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`hikeAmt`}
                    disabled={isEdit && !isModifying}
                    className={"bg-white"}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Fuel(%)`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`fuelPercentage`}
                  />
                  <DummyInputBoxLightGray
                    register={register}
                    placeholder={`0.00`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`fuelAmt`}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Discount`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`discount`}
                    inputValue={fetchedAwbData?.volDiscount || 0.0}
                  />
                  <DummyInputBoxLightGray
                    register={register}
                    placeholder={`0.00`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`discountAmt`}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelYellow
                    register={register}
                    placeholder={`0.00`}
                    label={`SGST`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`sgst`}
                    inputValue={fetchedAwbData?.sgst || 0.0}
                  />
                  <DummyInputBoxWithLabelYellow
                    register={register}
                    placeholder={`0.00`}
                    label={`CGST`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`cgst`}
                    inputValue={fetchedAwbData?.cgst || 0.0}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelYellow
                    register={register}
                    placeholder={`0.00`}
                    label={`IGST`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`igst`}
                    inputValue={fetchedAwbData?.igst || 0.0}
                  />
                  <DummyInputBoxWithLabelYellow
                    register={register}
                    placeholder={`0.00`}
                    label={`Grand Total`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`grandTotal`}
                    inputValue={fetchedAwbData?.totalAmt || 0.0}
                  />
                </div>
                <DummyInputBoxDarkGray
                  register={register}
                  placeholder={`INR`}
                  setValue={setValue}
                  resetFactor={awbreset}
                  value={`currency`}
                  inputValue={fetchedAwbData?.currency || "INR"}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-1">
              <div className="flex gap-2">
                <OutlinedButtonRed
                  onClick={() => {
                    setIsEdit(false);
                    setIsModifying(true);
                    setBtnAction("save");
                    setValue("basicAmount", 0);
                    setValue("sgst", 0);
                    setValue("cgst", 0);
                    setValue("igst", 0);
                    setValue("grandTotal", 0);
                    setValue("baseGrandTotal", 0);
                    setValue("manualAmount", "");
                  }}
                  disabled={isEdit == false || newShipment == null}
                  type="button"
                  label={`Modify`}
                  perm="Billing Edit"
                />
                <OutlinedButtonRed
                  onClick={() => {
                    setBtnAction("save");
                  }}
                  disabled={isEdit == true || newShipment == null}
                  type="submit"
                  label={`Save`}
                />
              </div>
              <div className="flex gap-2">
                <OutlinedButtonRed
                  onClick={() => {
                    setBtnAction("delete");
                  }}
                  type="submit"
                  disabled={newShipment == "new" || newShipment == null}
                  label={`Delete`}
                  perm="Billing Deletion"
                />
                <OutlinedButtonRed label={`Refresh`} onClick={handleRefresh} />
              </div>
            </div>
          </div>
        </div>

        <CodeList
          handleAction={() => console.log("hello world")}
          data={[]}
          columns={columns}
          name={"Airway Bill Entry"}
        />
      </form>

      <BgBlack
        expression={holdHistoryWindow || volumeWtWindow || invoiceDetailsWindow}
      />
      <VolumeWeight
        window={volumeWtWindow}
        awbNo={awbNo}
        setTotalKg={setTotalKg}
        totalKg={totalKg}
        setVolumeContent={handleSetVolumeContent}
        volumeContent={volumeContent}
      />
      <InvoiceDetails
        window={invoiceDetailsWindow}
        awbNo={awbNo}
        setInvContent={setInvContent}
        setInvoiceTotalValue={setInvoiceTotalValue}
        setInvoiceContent={handleSetInvoiceContent}
        invoiceContent={invoiceContent}
      />
      <NotificationFlag
        message={"AWB Entry"}
        subMessage={responseMsg}
        visible={visibleFlag}
        setVisible={setVisibleFlag}
      />
    </div>
  );
}

export default ApplyExtraCharges;
