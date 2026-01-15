"use client";
import HoldHistory from "@/app/components/awb-entry/HoldHistory";
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

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Watching input values
  const awbNo = watch("awbNo");
  const pcs = useWatch({ control, name: "pcs" });
  const actualWt = useWatch({ control, name: "actualWt" });
  const volWt = useWatch({ control, name: "volWt" });
  const chargeableWt = useWatch({ control, name: "chargeableWt" });
  const invoiceValue = useWatch({ control, name: "invoiceValue" });

  // holdreason dynamic rendering
  const [holdReason, setHoldReason] = useState(" ");
  const grandTotal = watch("grandTotal");
  const actualWtValue = watch("actualWt");
  const [holdEdit, setHoldEdit] = useState(false);
  const volDisc = watch("volDisc");

  //payment type
  const [showFOCPasswordModal, setShowFOCPasswordModal] = useState(false);
  const [prevPayment, setPrevPayment] = useState(
    fetchedAwbData?.payment || "Credit"
  );
  const [focUnlocked, setFocUnlocked] = useState(false);
  const selectedPayment = watch("payment");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkType, setNetworkType] = useState("");
  const [awbLoading, setAwbLoading] = useState(false);
  const consigneeZipcode = useWatch({ control, name: "consignee-zipcode" });

  // FETCH ALL SERVICE MASTER DATA
  const [serviceMasterList, setServiceMasterList] = useState([]);

  useEffect(() => {
    if (!server) return;

    const fetchServices = async () => {
      try {
        const res = await axios.get(`${server}/service-master`);
        setServiceMasterList(res.data || []);
        console.log("Service Master List:", res.data);
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
        payload
      );
      setServiceValidation(response.data);

      // Show warnings as notifications
      if (response.data.warnings?.length > 0) {
        response.data.warnings.forEach((warning) => {
          showNotification("warning", warning);
        });
      }

      // Set errors on form fields
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

  // Validation rules function
  const validateServiceRules = (
    serviceData,
    { pcs, actualWt, volWt, chargeableWt, invoiceValue }
  ) => {
    if (!serviceData) return { ok: true, errors: [] };

    const errors = [];

    // Multiple PCS validation (AWB-level)
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

    // Max PCS per AWB
    if (serviceData.maxPcsPerAWB && pcs > serviceData.maxPcsPerAWB) {
      errors.push({
        field: "pcs",
        msg: `Maximum ${serviceData.maxPcsPerAWB} pieces per AWB`,
      });
    }

    // Average weight validation (AWB-level)
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

    // Max shipment value (AWB-level)
    if (
      serviceData.maxShipmentValue &&
      invoiceValue > serviceData.maxShipmentValue
    ) {
      errors.push({
        field: "invoiceValue",
        msg: `Maximum shipment value per AWB: ${serviceData.maxShipmentValue}`,
      });
    }

    // Per AWB validation
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
          zone.sector === selectedSector
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

  // Zone alert handlers
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
      } area confirmed. Remark updated.`
    );
  };

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
      } area not selected.`
    );
  };

  // handle AWB Billing Operations
  const handleAWBBilling = async (data) => {
    // Check service validation before submission
    if (selectedService && serviceValidation && !serviceValidation.valid) {
      showNotification(
        "error",
        "Service validation failed. Please check errors."
      );
      return;
    }

    // Check for warnings and ask for confirmation
    if (serviceValidation.warnings?.length > 0) {
      const shouldProceed = window.confirm(
        `Service has ${serviceValidation.warnings.length} warnings:\n` +
          serviceValidation.warnings.join("\n") +
          "\n\nDo you want to proceed?"
      );

      if (!shouldProceed) {
        return;
      }
    }

    const { code, ...fillterData } = data;
    const accountCode = code;
    const updateUser = user?.userId;
    const payload = { accountCode, ...fillterData };
    console.log("Billing payload: ", payload, newShipment);

    // small helper to safely fetch customer name
    const getCustomerName = async (accountCode) => {
      try {
        if (!accountCode) return "";
        const customerResponse = await axios.get(
          `${server}/customer-account?accountCode=${accountCode}`
        );
        return customerResponse.data?.name || "";
      } catch (err) {
        console.warn("Failed to fetch customer name:", err);
        return "";
      }
    };

    if (newShipment == "old" && btnAction == "save" && isEdit == false) {
      try {
        setIsSubmitting(true);

        const response = await axios.put(
          `${server}/portal/create-shipment/awb-billing?awbNo=${awbNo}`,
          { ...payload, updateUser }
        );

        if (response?.status === 200) {
          const customer = await getCustomerName(accountCode);
          await pushAWBLog({
            awbNo,
            accountCode,
            customer,
            action: "Billing Updated",
            actionUser: user?.userId,
            department: "Billing",
          });
        }

        if (response.data?.holdReason != "") {
          const customer = await getCustomerName(accountCode);
          const pushHoldLogPayload = {
            awbNo: response.data?.awbNo || payload?.awbNo,
            accountCode,
            customer,
            action: "Hold",
            actionUser: user?.userId,
            departmentName: user?.department || "Billing",
            holdReason: payload?.holdReason || "Billing Update",
          };
          const holdLogResponse = await pushHoldLog(pushHoldLogPayload);
          console.log("Hold log response:", holdLogResponse);
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

  // Shortcut keys
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

  // Customer account details fetching
  useEffect(() => {
    const code = watch("code");
    if (!code) return;

    const handler = setTimeout(async () => {
      try {
        const response = await axios.get(
          `${server}/customer-account?accountCode=${code}`
        );
        setAccount(response.data);
        console.log("customer-account", response.data);

        if (response.data) {
          setValue("customer", response.data?.name);
          setValue("accountBalance", response.data?.leftOverBalance.toFixed(2));
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

  // Find sector
  useEffect(() => {
    const selectedSectorName = watch("sector");
    console.log("Watched sector:", selectedSectorName);

    if (!sectors || !Array.isArray(sectors)) {
      console.error("Sectors data is missing or not an array");
      setDestinations([]);
      setResetServiceAndDestination((prev) => !prev);
      return;
    }

    const selectedSector = sectors.find(
      (sec) => sec.name === selectedSectorName
    );
    const selectedSectorCode = selectedSector ? selectedSector.code : null;

    console.log("Selected sector code:", selectedSectorCode);
    setSelectedSector(selectedSectorCode);

    if (!selectedSectorCode) {
      console.warn("No matching sector code found.");
      return;
    }

    const fetchZoneData = async () => {
      try {
        const response = await axios.get(
          `${server}/portal/create-shipment/get-zones?sector=${selectedSectorCode}`
        );

        const zoneData = response.data || [];
        setZones(zoneData);
        console.log("Zones fetched:", zoneData);

        if (!Array.isArray(zoneData)) {
          console.error("Zones data is missing or not an array");
          setDestinations([]);
          setResetServiceAndDestination((prev) => !prev);
          return;
        }

        const filteredDestinations = zoneData
          .filter((zone) => zone.sector === selectedSectorCode)
          .map((zone) => zone.destination);

        console.log("Filtered Destinations:", filteredDestinations);
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

  // Filtering services based on sector and destination
  useEffect(() => {
    console.log("Selected Destination:", selectedDestination);
    console.log("Selected Sector:", selectedSector);

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
          zone.destination === selectedDestination
      )
      .map((zone) => ({
        service: zone.service,
        zone: zone.zone,
      }));

    setFilteredServices(filteredResults);
    console.log("Filtered Results:", filteredResults);
  }, [watch("destination"), selectedSector, selectedDestination, zones]);

  // Getting applicable rates
  useEffect(() => {
    const getApplicableRates = async () => {
      try {
        const response = await axios.get(
          `${server}/shipper-tariff?accountCode=${account.accountCode}`
        );
        console.log("ApplicableRates", response.data);
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

  // Filtering final services based on applicable rates AND removing In-Active services
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
        applicableList.map((a) => normalizeService(a.service))
      );

      const commonServices = filteredServices.filter((f) =>
        Array.from(applicableSet).some(
          (service) =>
            normalizeService(f.service).includes(service) ||
            service.includes(normalizeService(f.service))
        )
      );

      const availableServices = Array.from(
        new Map(
          commonServices.map((item) => [
            `${normalizeService(item.service)}-${item.zone}`,
            item,
          ])
        ).values()
      );

      const activeServiceSet = new Set(
        serviceMasterList
          .filter((s) => s.softwareStatus?.toLowerCase() === "active")
          .map((s) => s.serviceName.toLowerCase().trim())
      );

      const onlyActiveServices = availableServices.filter((s) =>
        activeServiceSet.has(s.service.toLowerCase().trim())
      );

      setFinalServices(onlyActiveServices);
      console.log("Active Final Services:", onlyActiveServices);
    }
  }, [filteredServices, applicableRates, serviceMasterList]);

  // Fetching amount details with Australia/Canada logic
  useEffect(() => {
    if (!selectedService || !applicableRates || !finalServices) return;

    if (!applicableRates || !Array.isArray(applicableRates)) {
      return;
    }

    const finalService = finalServices.find(
      (s) => s.service === selectedService
    );
    const zone = finalService?.zone;

    const ratesArray = applicableRates || [];
    const matchingRate = ratesArray.find((r) => r.service === selectedService);
    const rateTariff = matchingRate?.rateTariff || "";

    if (!rateTariff || !chargeableWt || !actualWt || !pcs) return;

    const fetchAmountDetails = async () => {
      try {
        // Check if this is a Canada shipment
        const isCanadaSector = selectedSector?.toLowerCase().includes("canada");
        const isCanadaDestination = selectedDestination
          ?.toLowerCase()
          .includes("canada");
        const isCanadaShipment = isCanadaSector && isCanadaDestination;

        // Check if this is an Australia shipment
        const isAustraliaSector = selectedSector
          ?.toLowerCase()
          .includes("australia");
        const isAustraliaDestination = selectedDestination
          ?.toLowerCase()
          .includes("australia");
        const isAustraliaShipment = isAustraliaSector && isAustraliaDestination;

        // For Canada shipments, we need proper postal code format
        if (isCanadaShipment) {
          if (!consigneeZipcode || consigneeZipcode.trim().length < 3) {
            console.log("Waiting for valid Canadian postal code...");
            return;
          }
        }

        // For Australia shipments, we need proper postcode format
        if (isAustraliaShipment) {
          if (!consigneeZipcode || consigneeZipcode.trim().length < 1) {
            console.log("Waiting for valid Australian postcode...");
            return;
          }
        }

        // Build query parameters
        const params = new URLSearchParams({
          service: selectedService,
          rateTariff: rateTariff,
          chargeableWt: chargeableWt,
          actualWt: actualWt,
          pcs: pcs,
          destination: selectedDestination,
          sector: selectedSector,
        });

        // Add zone parameter
        if (zone) {
          params.append("zone", zone);
        }

        // Add zipcode for Canada or Australia shipments
        if ((isCanadaShipment || isAustraliaShipment) && consigneeZipcode) {
          const cleanedZip = consigneeZipcode.replace(/\s+/g, "").toUpperCase();
          params.append("zipcode", cleanedZip);
        }

        console.log("Fetching amount details...");

        const response = await axios.get(
          `${server}/portal/create-shipment/get-rates?${params.toString()}`
        );

        setAmountDetails(response.data);

        // Show appropriate notification based on shipment type
        if (response.data.isCanadaShipment) {
          showNotification(
            "info",
            `Canada: Zone ${response.data.zoneUsed} applied`
          );
        } else if (response.data.isAustraliaShipment) {
          showNotification(
            "info",
            `Australia: Zone ${response.data.zoneUsed} applied`
          );
        }

        // Show zone details if available
        if (response.data.zoneDetails) {
          const { matchType, isRemote, isUnserviceable } =
            response.data.zoneDetails;

          if (matchType && matchType !== "general") {
            showNotification("info", `Zone matched using ${matchType} pattern`);
          }

          if (isRemote) {
            showNotification(
              "warning",
              "Remote zone detected - additional charges may apply"
            );
          }

          if (isUnserviceable) {
            showNotification(
              "error",
              "Unserviceable zone - please check destination"
            );
          }
        }
      } catch (error) {
        console.log("Error fetching amount details:", error);
        setAmountDetails(null);

        if (error.response?.data?.error) {
          showNotification("error", error.response.data.error);

          // Provide more specific guidance for Australia/Canada
          if (
            error.response.data.details?.sector
              ?.toLowerCase()
              .includes("australia")
          ) {
            showNotification(
              "info",
              "For Australia: Please ensure postcode is valid (e.g., 2000, 3000, etc.)"
            );
          } else if (
            error.response.data.details?.sector
              ?.toLowerCase()
              .includes("canada")
          ) {
            showNotification(
              "info",
              "For Canada: Please ensure postal code format is correct (e.g., M5V 2T6)"
            );
          }
        }
      }
    };

    // Use debounce to prevent too many API calls
    const timeoutId = setTimeout(fetchAmountDetails, 800);

    return () => clearTimeout(timeoutId);
  }, [
    selectedService,
    applicableRates,
    finalServices,
    chargeableWt,
    pcs,
    actualWt,
    selectedSector,
    selectedDestination,
    server,
    consigneeZipcode,
  ]);

  // Fetch Customer, Branch, and Tax Settings from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [branchRes, taxRes] = await Promise.all([
          axios.get(
            `${server}/branch-master/get-branch?code=${account?.branch}`
          ),
          axios.get(`${server}/tax-settings`),
        ]);

        setBranch(branchRes.data);
        setTaxSettings(taxRes.data);
        console.log("Fetched Branch:", branchRes.data);
        console.log("Fetched Tax Settings:", taxRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [account]);

  // Calculate base amount and GST once
  useEffect(() => {
    if (amountDetails && account && branch && taxSettings) {
      console.log(
        "Updating form with amount details:",
        amountDetails,
        taxSettings
      );

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

      console.log("GST Applicability:", gstApplicable);
      console.log(
        "Tax Rates - SGST:",
        sgstRate,
        "CGST:",
        cgstRate,
        "IGST:",
        igstRate
      );

      const sgstAmt = gstApplicable ? basicAmount * sgstRate : 0;
      const cgstAmt = gstApplicable ? basicAmount * cgstRate : 0;
      const igstAmt = gstApplicable ? basicAmount * igstRate : 0;

      const baseGrandTotal = basicAmount + sgstAmt + cgstAmt + igstAmt;

      if (rate === 0) {
        setValue("basicAmount", 0);
        setValue("sgst", 0);
        setValue("cgst", 0);
        setValue("igst", 0);
        setValue("baseGrandTotal", 0);
        setValue("grandTotal", 0);
        return;
      }

      setValue("basicAmount", basicAmount);
      setValue("sgst", sgstAmt);
      setValue("cgst", cgstAmt);
      setValue("igst", igstAmt);
      setValue("baseGrandTotal", baseGrandTotal);
      setValue("grandTotal", baseGrandTotal);

      console.log("Calculated baseGrandTotal:", baseGrandTotal);
    }
  }, [
    amountDetails,
    account,
    branch,
    taxSettings,
    chargeableWt,
    selectedPayment,
  ]);

  // Calculate GRAND TOTAL with adjustments
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!account || !branch || !taxSettings) return;

    const subscription = watch((values) => {
      if (isUpdatingRef.current) return;

      const baseGrandTotal = Number(values.baseGrandTotal) || 0;
      if (baseGrandTotal <= 0) return;

      const {
        manualAmount = 0,
        handlingAmount = 0,
        miscChg = 0,
        overWtHandling = 0,
        cashRecvAmount = 0,
        discount = 0,
        basicAmount = 0,
      } = values;

      const gstApplicable = account.gst === "GST-Additional";

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

      const taxableAdjustment =
        Number(manualAmount) +
        Number(handlingAmount) +
        Number(miscChg) +
        Number(overWtHandling);

      const adjSgst = gstApplicable ? taxableAdjustment * sgstRate : 0;
      const adjCgst = gstApplicable ? taxableAdjustment * cgstRate : 0;
      const adjIgst = gstApplicable ? taxableAdjustment * igstRate : 0;

      const baseSgst = gstApplicable ? basicAmount * sgstRate : 0;
      const baseCgst = gstApplicable ? basicAmount * cgstRate : 0;
      const baseIgst = gstApplicable ? basicAmount * igstRate : 0;

      const finalSgst = round(baseSgst + adjSgst);
      const finalCgst = round(baseCgst + adjCgst);
      const finalIgst = round(baseIgst + adjIgst);

      const updatedGrandTotal = round(
        baseGrandTotal +
          taxableAdjustment +
          adjSgst +
          adjCgst +
          adjIgst -
          Number(cashRecvAmount) -
          Number(discount)
      );

      isUpdatingRef.current = true;

      setValue("sgst", finalSgst);
      setValue("cgst", finalCgst);
      setValue("igst", finalIgst);
      setValue("grandTotal", updatedGrandTotal);

      isUpdatingRef.current = false;
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue, account, branch, taxSettings]);

  const round = (num) => Math.round((Number(num) + Number.EPSILON) * 100) / 100;

  // Extracting zone from filtered services
  useEffect(() => {
    const selectedServiceLocal = watch("service");
    console.log("Selected Service:", selectedServiceLocal);
    setSelectedService(selectedServiceLocal);

    if (!filteredServices || !Array.isArray(filteredServices)) {
      console.error("filteredServices data is missing or not an array");
      return;
    }

    const matchedZone = filteredServices.find(
      (item) => item.service === selectedServiceLocal
    );

    const zoneNumber = matchedZone ? matchedZone.zone : null;
    console.log("Extracted Zone:", zoneNumber);
  }, [watch("service"), filteredServices]);

  // Handle date formatting
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

  // Handle refresh btn
  const [awbreset, setAwbreset] = useState(false);
  const handleRefresh = () => {
    setAwbreset(!awbreset);
    setValue("accountBalance", "");
    setValue("customer", "");
    setValue("volWt", "");
    setValue("invoiceValue", "");
    setValue("network", "");
    setIsHold(false);
    setIsEdit(false);
    setIsRemoteOrUnserviceable(false);
    setPendingZoneUpdate(false);
    setZoneAlertData({
      isOpen: false,
      message: "",
      zoneType: "",
      destination: "",
      zone: "",
    });
    setServiceValidation({
      valid: true,
      errors: [],
      warnings: [],
      serviceDetails: null,
    });
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
          { signal: controller.signal }
        );

        if (!response.data || response.data.notFound) {
          setNewShipment("new");
          setFetchedAwbData({});
        } else {
          clearErrors("awbNo");
          setFetchedAwbData(response.data.shipments[0]);
          setIsEdit(true);
          setNewShipment("old");
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
  }, [awbNo]);

  // Populate form when fetchedAwbData changes
  useEffect(() => {
    if (fetchedAwbData && Object.keys(fetchedAwbData).length > 0) {
      // Basic shipment details
      setValue("referenceNo", fetchedAwbData.reference || "");
      setValue("origin", fetchedAwbData.origin || "");
      setValue("sector", fetchedAwbData.sector || "");
      setValue("destination", fetchedAwbData.destination || "");
      setValue("service", fetchedAwbData.service || "");

      // Customer details
      setValue("code", fetchedAwbData.accountCode || "");
      setValue("customer", fetchedAwbData.name || "");
      setValue("accountBalance", fetchedAwbData.accountBalance || "");

      // Consignor details
      setValue("consignor", fetchedAwbData.shipperFullName || "");
      setValue(
        "consignor-addressLine1",
        fetchedAwbData.shipperAddressLine1 || ""
      );
      setValue(
        "consignor-addressLine2",
        fetchedAwbData.shipperAddressLine2 || ""
      );
      setValue("consignor-pincode", fetchedAwbData.shipperPincode || "");
      setValue("consignor-city", fetchedAwbData.shipperCity || "");
      setValue("consignor-state", fetchedAwbData.shipperState || "");
      setValue("consignor-telephone", fetchedAwbData.shipperPhoneNumber || "");
      setValue("consignor-idType", fetchedAwbData.shipperKycType || "");
      setValue("consignor-idNumber", fetchedAwbData.shipperKycNumber || "");

      // Consignee details
      setValue("consignee", fetchedAwbData.receiverFullName || "");
      setValue(
        "consignee-addressLine1",
        fetchedAwbData.receiverAddressLine1 || ""
      );
      setValue(
        "consignee-addressLine2",
        fetchedAwbData.receiverAddressLine2 || ""
      );
      setValue("consignee-zipcode", fetchedAwbData.receiverPincode || "");
      setValue("consignee-city", fetchedAwbData.receiverCity || "");
      setValue("consignee-state", fetchedAwbData.receiverState || "");
      setValue("consignee-telephone", fetchedAwbData.receiverPhoneNumber || "");
      setValue("consignee-emailID", fetchedAwbData.receiverEmail || "");

      // Weight details
      setValue("goodstype", fetchedAwbData.goodstype || "");
      setValue("pcs", fetchedAwbData.boxes?.length || 0);
      setValue("actualWt", fetchedAwbData.totalActualWt || 0);
      setValue("chargeableWt", fetchedAwbData.chargeableWt || 0);
      setValue("volWt", fetchedAwbData.totalVolWt || 0);
      setValue("volDisc", fetchedAwbData.volDiscount || 0);
      setValue("payment", fetchedAwbData.payment || "Credit");

      // Invoice details
      setValue("currencys", fetchedAwbData.currencys || "INR");
      setValue("currency", fetchedAwbData.currency || "INR");

      setValue("invoiceValue", fetchedAwbData.totalInvoiceValue || 0);

      // Run details
      setValue("mawbNo", fetchedAwbData.awbNo || "");
      setValue("bag", fetchedAwbData.bag || "");
      setValue("billNo", fetchedAwbData.billNo || "");
      setValue("manifestNo", fetchedAwbData.manifestNo || "");

      setValue("runNo", fetchedAwbData.runNo || "");
      setValue("flight", fetchedAwbData.flight || "");
      setValue("obc", fetchedAwbData.obc || "");
      setValue("alMawb", fetchedAwbData.alMawb || "");
      setValue("runDate", fetchedAwbData.runDate || "");

      // Amount details
      setValue("basicAmount", fetchedAwbData.basicAmt || 0);
      setValue("discount", fetchedAwbData.volDiscount || 0);
      setValue("sgst", fetchedAwbData.sgst || 0);
      setValue("cgst", fetchedAwbData.cgst || 0);
      setValue("igst", fetchedAwbData.igst || 0);
      setValue("grandTotal", fetchedAwbData.totalAmt || 0);
      setValue(
        "currency",
        fetchedAwbData.currency || fetchedAwbData.currencys || "INR"
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

      //invoice content
      setValue("content", fetchedAwbData.content || []);

      //hold details
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
      setValue("customer", "");
      setValue("accountBalance", "");
      setIsHold(false);
      setInvContent([]);
      console.log("No AWB data found");
    }
  }, [fetchedAwbData, setValue]);

// Hold logic - REMOVED credit limit check
useEffect(() => {
  // If no grand total, no hold needed
  if (!grandTotal || Number(grandTotal) === 0) {
    setHoldEdit(false);
    setIsHold(false);
    setHoldReason("");
    setValue("isHold", false);
    return;
  }

  // NO CREDIT LIMIT CHECK - Shipment never goes on hold for credit limit
  setHoldEdit(false);
  setIsHold(false);
  setValue("isHold", false);
  setHoldReason(" ");
  console.log("Credit limit check disabled - No hold for credit limit");
}, [grandTotal, setValue]);
  // For alerts
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

        console.log("ServiceMaster data:", res.data);

        if (!res.data || !res.data._id) {
          setServiceData(null);
          return;
        }

        const s = res.data;
        setServiceData(s);

        // Validate against service master
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

        // Also run server-side validation
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
  }, [selectedService, server, awbNo]);

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

    // Clear previous errors first
    clearErrors(["pcs", "actualWt", "volWt", "chargeableWt", "invoiceValue"]);

    // Local validation - ONLY perAWB rules
    const localValidation = validateServiceRules(serviceData, {
      pcs: p,
      actualWt: a,
      volWt: v,
      chargeableWt: c,
      invoiceValue: inv,
    });

    // Set errors if any (these are perAWB errors)
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
  ]);

  useEffect(() => {
    if (selectedService && selectedPayment !== "FOC") {
      setPrevPayment(selectedPayment);
    }

    if (selectedPayment === "FOC" && !focUnlocked) {
      setShowFOCPasswordModal(true);
    }
  }, [selectedPayment, focUnlocked]);

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
      (rate) => rate.service === selectedService
    );

    if (matchedRate?.network) {
      setValue("network", matchedRate.network);
      setNetworkType(matchedRate.network);
    } else {
      setValue("network", "");
    }

    console.log("Selected service:", selectedService);
    console.log("Matched rate:", matchedRate);
  }, [selectedService, applicableRates, setValue]);

  // Zone status checking effect - when destination or service changes
  useEffect(() => {
    const checkAndAlertZoneStatus = async () => {
      const destinationValue = watch("destination");
      const serviceValue = watch("service");

      if (!destinationValue || !serviceValue || isEdit) {
        setIsRemoteOrUnserviceable(false);
        setPendingZoneUpdate(false);
        return;
      }

      // Skip if we already have a pending update
      if (pendingZoneUpdate) {
        return;
      }

      const zoneStatus = await checkZoneStatus(destinationValue, serviceValue);

      if (zoneStatus) {
        const { zoneNumber, isRemote, isUnserviceable } = zoneStatus;

        if (isRemote || isUnserviceable) {
          // Check if this zone has already been confirmed
          const currentRemark = watch("operationRemark") || "";
          const alreadyConfirmed = currentRemark.includes(
            isRemote ? "Remote area confirmed" : "Unserviceable area confirmed"
          );

          if (!alreadyConfirmed) {
            // Set pending update flag
            setPendingZoneUpdate(true);

            // Show alert modal
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

    // Add a small delay to avoid checking on every keystroke
    const timeoutId = setTimeout(checkAndAlertZoneStatus, 500);

    return () => clearTimeout(timeoutId);
  }, [watch("destination"), watch("service"), isEdit, pendingZoneUpdate]);

  // Content handlers
  const handleSetInvoiceContent = useCallback((data) => {
    setInvoiceContent(data);
    console.log(invoiceContent);
  }, []);

  const handleSetVolumeContent = useCallback((data) => {
    const cleanedData = data.map(({ volumeWeightTable, ...rest }) => rest);
    setVolumeContent(cleanedData);
    console.log("Clean Volume Content Updated:", cleanedData);
  }, []);

  // Sync content with form state
  useEffect(() => {
    setValue("invoiceContent", invoiceContent);
    console.log("Invoice Content Updated:", invoiceContent);
  }, [invoiceContent]);

  useEffect(() => {
    setValue("volumeContent", volumeContent);
    console.log("Volume Content Updated:", volumeContent);
  }, [volumeContent]);

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
    <div>
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
                      resetFactor={awbreset}
                      value={`awbNo`}
                      error={errors.awbNo}
                      trigger={trigger}
                      validation={{
                        required: "AWB Number is required",
                      }}
                    />

                    {/* Loader - positioned inside the input field */}
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
              <div className="w-full flex flex-col gap-3 ">
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

              <div className="w-full flex flex-col gap-3 ">
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
                    resetFactor={awbreset}
                    value="consignee-emailID"
                    error={errors["consignee-emailID"]}
                    disabled={isEdit}
                    validation={{
                      required: "Email is required",
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
                      <DummyInputBoxDarkGray
                        placeholder="Network"
                        register={register}
                        setValue={setValue}
                        resetFactor={awbreset}
                        value={`network`}
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
                        resetFactor={awbreset}
                        value={`volWt`}
                        inputValue={totalKg || fetchedAwbData?.totalVolWt}
                        error={errors.volWt}
                        trigger={trigger}
                        validation={{ required: "VolumeWt is required" }}
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
                      resetFactor={awbreset}
                      value="pcs"
                      error={errors.pcs}
                      trigger={trigger}
                      validation={{ required: "PCS is required" }}
                    />
                    <InputBox
                      placeholder="Actual Wt. (Kg)"
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
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
                        resetFactor={awbreset}
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
                      resetFactor={awbreset}
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
                      resetFactor={awbreset}
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
                      resetFactor={awbreset}
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
                <InputBox
                  placeholder="Operation Remark"
                  register={register}
                  setValue={setValue}
                  resetFactor={awbreset}
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
                    resetFactor={awbreset}
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
                    resetFactor={awbreset}
                    title={`Hold Reason`}
                    value={`holdReason`}
                    defaultValue={
                      holdReason || fetchedAwbData.holdReason || " "
                    }
                    disabled={isEdit || holdEdit}
                  />
                  <InputBox
                    placeholder="Other Reason"
                    register={register}
                    setValue={setValue}
                    resetFactor={awbreset}
                    disabled={isEdit || holdEdit}
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
                resetFactor={awbreset}
              />

              <RedCheckboxRedLabel
                label={"Handling"}
                isChecked={isHandling}
                setChecked={setIsHandling}
                id={"handling"}
                register={register}
                setValue={setValue}
                resetFactor={awbreset}
              />
              <RedCheckboxRedLabel
                label={"CSB"}
                isChecked={isCSB}
                setChecked={setIsCSB}
                id={"csb"}
                register={register}
                setValue={setValue}
                resetFactor={awbreset}
              />
              <RedCheckboxRedLabel
                label={"Commercial Shipment"}
                isChecked={isCommercialShipment}
                setChecked={setIsCommercialShipment}
                id={"commercialShipment"}
                register={register}
                setValue={setValue}
                resetFactor={awbreset}
              />
            </div>
            <div className="flex gap-2 justify-between ">
              <div className="flex gap-2 w-full">
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label={"Bill No."}
                  setValue={setValue}
                  resetFactor={awbreset}
                  value={"billNo"}
                  inputValue={fetchedAwbData?.billNo || ""}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label={"Manifest No."}
                  setValue={setValue}
                  resetFactor={awbreset}
                  value={"manifestNo"}
                  inputValue={fetchedAwbData?.manifestNo || ""}
                />
                <div className="flex flex-col gap-2 w-full">
                  <InputBox
                    register={register}
                    initialValue={fetchedAwbData?.reference || ""}
                    setValue={setValue}
                    resetFactor={awbreset}
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
                        label={"Bag"}
                        setValue={setValue}
                        resetFactor={awbreset}
                        value={"bag"}
                        inputValue={fetchedAwbData?.bag || ""}
                      />
                      <DummyInputBoxWithLabelDarkGray
                        register={register}
                        label={"Date"}
                        setValue={setValue}
                        resetFactor={awbreset}
                        value={"date"}
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
                <RedLabelHeading label={`Amount Details`} />

                <div className="flex gap-2">
                  <div className="w-1/2">
                    <DummyInputBoxWithLabelLightGray
                      inputValue={fetchedAwbData?.basicAmt || 0.0}
                      register={register}
                      placeholder={`0.00`}
                      label={`Basic Amt`}
                      setValue={setValue}
                      resetFactor={awbreset}
                      value={`basicAmount`}
                      className={"bg-white"}
                    />
                  </div>
                  <div className="w-1/2">
                    <InputBox
                      placeholder="Manual Amt"
                      register={register}
                      setValue={setValue}
                      resetFactor={awbreset}
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
                      resetFactor={awbreset}
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
                      resetFactor={awbreset}
                      value={`balanceAmount`}
                      className={"bg-white"}
                    />
                  </div>
                </div>

                <InputBox
                  placeholder="Handling Amt"
                  register={register}
                  setValue={setValue}
                  resetFactor={awbreset}
                  disabled={isEdit}
                  value="handlingAmount"
                  className="bg-white"
                  initialValue={fetchedAwbData?.handlingAmount || "0.00"}
                />
                <InputBox
                  placeholder="Misc. Chg"
                  register={register}
                  setValue={setValue}
                  resetFactor={awbreset}
                  disabled={isEdit}
                  value="miscChg"
                  className="bg-white"
                  initialValue={fetchedAwbData?.miscChg || "0.00"}
                />
                <InputBox
                  register={register}
                  placeholder="Misc. Chg. Reason"
                  setValue={setValue}
                  resetFactor={awbreset}
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
                  resetFactor={awbreset}
                  value={`duty`}
                  className={"bg-white"}
                />
                <InputBox
                  placeholder="Over Wt. Handling"
                  register={register}
                  setValue={setValue}
                  resetFactor={awbreset}
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
                  resetFactor={awbreset}
                  value={`hikeAmt`}
                  className={"bg-white"}
                />
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`0.00`}
                    label={`Fuel(%)`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`fuelPercentage`}
                    className={"bg-white"}
                  />
                  <DummyInputBoxLightGray
                    register={register}
                    placeholder={`0.00`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`fuelAmt`}
                    className={"bg-white"}
                  />
                </div>
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelLightGray
                    register={register}
                    placeholder={`DEL`}
                    label={`Discount`}
                    setValue={setValue}
                    resetFactor={awbreset}
                    value={`discount`}
                    inputValue={fetchedAwbData?.volDiscount || 0.0}
                    className={"bg-white"}
                  />
                  <DummyInputBoxLightGray
                    register={register}
                    placeholder={`DEL`}
                    setValue={setValue}
                    resetFactor={awbreset}
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
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <OutlinedButtonRed
                  onClick={(data) => {
                    setBtnAction("modify");
                    setIsEdit(false);
                    console.log(data);
                  }}
                  disabled={
                    newShipment == "new" ||
                    newShipment == null ||
                    fetchedAwbData?.billingLocked
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
                    fetchedAwbData?.billingLocked ||
                    !serviceValidation.valid ||
                    pendingZoneUpdate
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
