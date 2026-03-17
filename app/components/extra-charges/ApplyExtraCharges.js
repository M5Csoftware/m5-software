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
import InputBox, { InputBoxYellowWithPrefix } from "@/app/components/InputBox";
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
import pushAWBLog from "@/app/lib/pushAWBLog";
import pushHoldLog from "@/app/lib/pushHoldLog";
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

  // Watching input values
  const awbNo = watch("awbNo");
  const actualWt = watch("actualWt");
  const volWt = watch("volWt");
  const volDisc = watch("volDisc");
  const chargeableWt = watch("chargeableWt");

  // Effect 2: Calculate chargeableWt dynamically on user changes
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

  //handle awbEntry all Operations
  const handleAWBEntry = async (data) => {
    const { code, ...fillterData } = data;
    const accountCode = code;
    const payload = { accountCode, ...fillterData };
    // console.log("payload: ", payload, newShipment);

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
        showNotification("error", "Failed to fetch customer name");
        return "";
      }
    };

    if (newShipment == "new" && btnAction == "save") {
      try {
        const response = await axios.post(`${server}/extraCharges`, payload);
        // console.log("awb-entry:", response.data);
        // console.log("payload: ", payload);

        if (response.data?.status == 201) {
          const customer = await getCustomerName(accountCode);

          const pushAWBLogPayload = {
            awbNo: response.data?.awbNo || payload?.awbNo,
            accountCode,
            customer,
            action: "Shipment Created",
            actionUser: user?.userId,
          };

          const responseLog = await pushAWBLog(pushAWBLogPayload);
          // console.log("AWB log response:", responseLog);

          if (response.data?.holdReason != "") {
            const pushHoldLogPayload = {
              awbNo: response.data?.awbNo || payload?.awbNo,
              accountCode,
              customer,
              action: "Hold",
              actionUser: user?.userId,
              departmentName: user?.department || "Operations",
              holdReason: payload?.holdReason || "Initial Creation",
            };

            const holdLogResponse = await pushHoldLog(pushHoldLogPayload);
            // console.log("Hold log response:", holdLogResponse);
          }
        }
        setBtnAction(null);
        setResponseMsg("data updated successfully!");
        setVisibleFlag(true);
        showNotification("success", "data updated successfully!");
      } catch (error) {
        console.error("Error submitting AWB entry:", error);
        setBtnAction(null);
        setResponseMsg("Error submitting AWB entry!");
        showNotification("error", "Error submitting AWB entry!");
        setVisibleFlag(true);
      }
    } else if (newShipment == "old" && btnAction == "save" && isEdit == false) {
      try {
        // console.log("Updating AWB entry with data:", payload);
        const response = await axios.put(
          `${server}/extraCharges?awbNo=${awbNo}`,
          payload
        );
        // console.log("awb modified:", response.data);

        if (response?.status == 200) {
          const customer = await getCustomerName(accountCode);
          const pushAWBLogPayload = {
            awbNo,
            accountCode,
            customer,
            action: "Shipment Modified",
            actionUser: user?.userId,
          };

          const responseLog = await pushAWBLog(pushAWBLogPayload);
          // console.log("AWB log response:", responseLog);

          if (response.data?.holdReason != "") {
            const pushHoldLogPayload = {
              awbNo: response.data?.awbNo || payload?.awbNo,
              accountCode,
              customer,
              action: "Hold",
              actionUser: user?.userId,
              departmentName: user?.department || "Operations",
              holdReason: payload?.holdReason || "Initial Creation",
            };

            const holdLogResponse = await pushHoldLog(pushHoldLogPayload);
            // console.log("Hold log response:", holdLogResponse);
          }
        }
        setBtnAction(null);
        setResponseMsg("AWB entry updated successfully!");
        showNotification("success", "AWB entry updated successfully!");
        setVisibleFlag(true);
      } catch (error) {
        console.error("Error updating AWB entry:", error);
        setBtnAction(null);
        setResponseMsg("Error updating AWB entry!");
        showNotification("error", "Error updating AWB entry!");
        setVisibleFlag(true);
      }
    } else if (newShipment == "old" && btnAction == "delete") {
      try {
        const response = await axios.delete(
          `${server}/extraCharges?awbNo=${awbNo}`
        );
        // console.log("awb deleted:", response.data);

        if (response?.status == 200) {
          const customer = await getCustomerName(accountCode);

          const pushAWBLogPayload = {
            awbNo,
            accountCode,
            customer,
            action: "Shipment Deleted",
            actionUser: user?.userId,
          };

          const responseLog = await pushAWBLog(pushAWBLogPayload);
          // console.log("AWB log response:", responseLog);
        }
        setBtnAction(null);
        setResponseMsg("AWB entry deleted successfully!");
        showNotification("success", "AWB entry deleted successfully!");
        setVisibleFlag(true);
      } catch (error) {
        console.error("Error deleting AWB:", error);
        setBtnAction(null);
        setResponseMsg("Error deleting AWB entry!");
        showNotification("error", "Error deleting AWB entry!");
        setVisibleFlag(true);
      }
    }
  };

  //handle VolumeWt Window
  const openVolumeWtWindow = () => {
    setHoldHistoryWindow(false);
    setInvoiceDetailsWindow(false);
    setVolumeWtWindow(true);
  };

  //handle Invoice Window
  const openInvoiceDetailsWindow = () => {
    setHoldHistoryWindow(false);
    setVolumeWtWindow(false);
    setInvoiceDetailsWindow(true);
  };

  //handle HoldHistory Window
  const openHoldHistoryWindow = () => {
    setHoldHistoryWindow(true);
    setVolumeWtWindow(false);
    setInvoiceDetailsWindow(false);
  };

  //handle Windows in Shortcut Key used
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

    // Attach the event listener
    window.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  //handle Windows in Styling
  useEffect(() => {
    if (holdHistoryWindow || invoiceDetailsWindow || volumeWtWindow) {
      // Disable body scrolling
      document.body.style.overflow = "hidden";
    } else {
      // Enable body scrolling
      document.body.style.overflow = "";
    }

    // Cleanup effect on unmount or when holdHistoryWindow changes
    return () => {
      document.body.style.overflow = "";
    };
  }, [holdHistoryWindow, invoiceDetailsWindow, volumeWtWindow]);

  // customer account details fetching
  useEffect(() => {
    const code = watch("code");
    if (!code) return;

    const handler = setTimeout(async () => {
      try {
        const response = await axios.get(
          `${server}/customer-account?accountCode=${code}`
        );
        setAccount(response.data);
        // console.log("customer-account", response.data);

        if (response.data) {
          setValue("customer", response.data?.name);
          setValue("accountBalance", response.data?.leftOverBalance);
        } else {
          setValue("customer", null);
          setValue("accountBalance", null);
        }
      } catch (error) {
        console.error("Failed to fetch account:", error);
        // optional: show error state with setError(error.message);
        setValue("customer", null);
        setValue("accountBalance", null);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [watch("code")]);

  //getting amount sections data
  const [airwayBills, setAirwayBills] = useState([]);

  useEffect(() => {
    const fetchAirwayBills = async () => {
      try {
        const response = await axios.get(`${server}/rate-sheet`);
        // console.log("awb billing data", response.data);
        setAirwayBills(response.data);
      } catch (err) {
        console.error("Error fetching airway bills:", err);
        // console.log("Failed to fetch data.");
      }
    };
    fetchAirwayBills();
  }, []);

  useEffect(() => {
    const enteredAwbNo = watch("awbNo")?.trim();
    if (!enteredAwbNo) return;

    const matchedAwb = airwayBills.find(
      (bill) => bill.awbNo?.toLowerCase() === enteredAwbNo.toLowerCase()
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
      // Optional: Reset fields if no match
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

  //Find sector
  useEffect(() => {
    const selectedSectorName = watch("sector"); // Get selected sector name
    // console.log("Watched sector:", selectedSectorName);

    if (!sectors || !Array.isArray(sectors)) {
      console.error("Sectors data is missing or not an array");
      setDestinations([]);
      setResetServiceAndDestination((prev) => !prev);
      return;
    }

    // Find the corresponding sector code from the sectors array
    const selectedSector = sectors.find(
      (sec) => sec.name === selectedSectorName
    );
    const selectedSectorCode = selectedSector ? selectedSector.code : null;

    // console.log("Selected sector code:", selectedSectorCode);
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
        // console.log("Zones fetched:", zoneData);

        if (!Array.isArray(zoneData)) {
          console.error("Zones data is missing or not an array");
          setDestinations([]);
          setResetServiceAndDestination((prev) => !prev);
          return;
        }

        // ✅ Filter and set destinations here, after fetching
        const filteredDestinations = zoneData
          .filter((zone) => zone.sector === selectedSectorCode)
          .map((zone) => zone.destination);

        // console.log("Filtered Destinations:", filteredDestinations);
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

  //filtering services based on sector and destination
  useEffect(() => {
    // console.log("Selected Destination:", selectedDestination);
    // console.log("Selected Sector:", selectedSector);

    if (!zones || !Array.isArray(zones)) {
      console.error("Zones data is missing or not an array");
      return;
    }

    if (!selectedSector || !selectedDestination) {
      console.warn("Selected sector or destination is missing.");
      return;
    }

    // Filter zones where sector matches `selectedSector` and destination matches `selectedDestination`
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
    // console.log("Filtered Results:", filteredResults);
  }, [watch("destination"), selectedSector, selectedDestination, zones]);

  // getting applicable rates
  useEffect(() => {
    const getApplicableRates = async () => {
      try {
        const response = await axios.get(
          `${server}/shipper-tariff?accountCode=${account.accountCode}`
        );
        // console.log("ApplicableRates", response.data);
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

  //filtering final services based on applicable rates and filtered services
  useEffect(() => {
    // Extract services from applicableRates
    // console.log("Filtered Services:", filteredServices);

    if (filteredServices.length > 0 && applicableRates) {
      // ✅ STEP 0: Ensure it's always an array
      const applicableList = Array.isArray(applicableRates)
        ? applicableRates
        : applicableRates?.ApplicableRates || applicableRates?.data || [];

      // ✅ STEP 1: Normalize text
      function normalizeService(str) {
        return (
          str
            ?.toLowerCase()
            .replace(/[-\s]+/g, "")
            .trim() || ""
        );
      }

      // ✅ STEP 2: Build lookup set
      const applicableSet = new Set(
        applicableList.map((a) => normalizeService(a.service))
      );

      // ✅ STEP 3: Filter matching services
      const commonServices = filteredServices.filter((f) =>
        Array.from(applicableSet).some(
          (service) =>
            normalizeService(f.service).includes(service) ||
            service.includes(normalizeService(f.service))
        )
      );

      // ✅ STEP 4: Remove duplicates
      const availableServices = Array.from(
        new Map(
          commonServices.map((item) => [
            `${normalizeService(item.service)}-${item.zone}`,
            item,
          ])
        ).values()
      );

      setFinalServices(availableServices);
      // console.log("availableServices", availableServices);
    }
  }, [filteredServices, applicableRates]);

  //fetching amount details
  useEffect(() => {
    if (!selectedService || !applicableRates || !finalServices) return;

    // Check if ratesApplicable exists and is an array
    if (!applicableRates || !Array.isArray(applicableRates)) {
      // console.log(
//         "ratesApplicable is not available or not an array",
//         applicableRates
//       );
      return;
    }

    // 1. Find zone from finalServices
    const finalService = finalServices.find(
      (s) => s.service === selectedService
    );
    const zone = finalService?.zone;

    // console.log("finalService", finalService);

    // 2. Find first applicable rateTariff for selectedService safely
    const ratesArray = applicableRates || [];
    const matchingRate = ratesArray.find((r) => r.service === selectedService);
    const rateTariff = matchingRate?.rateTariff || "";

    // console.log("Determined zone:", zone);
    // console.log("Determined rateTariff:", rateTariff);
    // console.log("Chargable Weight:", chargeableWt);

    // Only fetch if all required values are present
    if (!zone || !rateTariff || !chargeableWt) return;

    const fetchAmountDetails = async () => {
      try {
        // console.log(
//           "Fetching amount details with:",
//           selectedService,
//           zone,
//           rateTariff,
//           chargeableWt
//         );
        const response = await axios.get(
          `${server}/portal/create-shipment/get-rates?service=${selectedService}&zone=${zone}&rateTariff=${rateTariff}&chargeableWt=${chargeableWt}`
        );
        // console.log("Amount Details Response:", response.data);
        setAmountDetails(response.data);
      } catch (error) {
        console.error("Error fetching amount details:", error);
        setAmountDetails(null);
      }
    };

    fetchAmountDetails();
  }, [selectedService, applicableRates, finalServices, chargeableWt]);

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
        // console.log("Fetched Branch:", branchRes.data);
        // console.log("Fetched Tax Settings:", taxRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [account]);

  // Calculate base amount and GST once (on amountDetails change)
  useEffect(() => {
    if (amountDetails && account && branch && taxSettings) {
      // console.log(
//         "Updating form with amount details:",
//         amountDetails,
//         taxSettings
//       );

      const rate = amountDetails.rate || 0;
      let basicAmount = 0;

      if (amountDetails.type === "S") {
        basicAmount = rate;
      } else if (amountDetails.type === "B") {
        basicAmount = rate * (Number(chargeableWt) || 0);
      }

      // Determine GST applicability
      const gstApplicable = account.gst === "GST-Additional";

      // Determine same-state or inter-state
      const sameState =
        account.gstNo?.substring(0, 2).toUpperCase() ===
        branch.serviceTax?.substring(0, 2).toUpperCase();

      // ✅ Extract tax rates from array
      const sgstObj = taxSettings.find((t) => t.tax === "SGST");
      const cgstObj = taxSettings.find((t) => t.tax === "CGST");
      const igstObj = taxSettings.find((t) => t.tax === "IGST");

      const sgstRate = sameState ? sgstObj?.taxAmount || 0 : 0;
      const cgstRate = sameState ? cgstObj?.taxAmount || 0 : 0;
      const igstRate = !sameState ? igstObj?.taxAmount || 0 : 0;

      // console.log("GST Applicability:", gstApplicable);
      // console.log(
//         "Tax Rates - SGST:",
//         sgstRate,
//         "CGST:",
//         cgstRate,
//         "IGST:",
//         igstRate
//       );

      // Compute GST amounts
      const sgstAmt = gstApplicable ? basicAmount * sgstRate : 0;
      const cgstAmt = gstApplicable ? basicAmount * cgstRate : 0;
      const igstAmt = gstApplicable ? basicAmount * igstRate : 0;

      // ✅ baseGrandTotal should include GST only once
      const baseGrandTotal = basicAmount + sgstAmt + cgstAmt + igstAmt;

      // Update form
      setValue("basicAmount", basicAmount);
      setValue("sgst", sgstAmt);
      setValue("cgst", cgstAmt);
      setValue("igst", igstAmt);
      setValue("baseGrandTotal", baseGrandTotal); // <-- contains GST once
      setValue("grandTotal", baseGrandTotal); // initialize grand total

      // console.log("Calculated baseGrandTotal:", baseGrandTotal);
    }
  }, [amountDetails, account, branch, taxSettings, chargeableWt]);

  // Calculate GRAND TOTAL with adjustments (without re-adding GST)
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!account || !branch || !taxSettings) return;

    const subscription = watch((values) => {
      if (isUpdatingRef.current) return;

      const baseGrandTotal = Number(values.baseGrandTotal) || 0;

      // Skip if no base amount calculated yet
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
  }, [setValue, account, branch, taxSettings]);

  //extracting zone from filtered services
  useEffect(() => {
    const selectedServiceLocal = watch("service");
    // console.log("Selected Service:", selectedServiceLocal);
    setSelectedService(selectedServiceLocal);

    if (!filteredServices || !Array.isArray(filteredServices)) {
      console.error("filteredServices data is missing or not an array");
      return;
    }

    // Find the object where service matches selectedServiceLocal
    const matchedZone = filteredServices.find(
      (item) => item.service === selectedServiceLocal
    );

    // Extract the zone if found
    const zoneNumber = matchedZone ? matchedZone.zone : null;
    // console.log("Extracted Zone:", zoneNumber);
  }, [watch("service"), filteredServices]);

  //handle date formatting
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

  //handle refresh btn
  const [awbreset, setAwbreset] = useState(false);
  const handleRefresh = () => {
    setAwbreset(!awbreset);
    setValue("accountBalance", "");
    setValue("customer", "");
    setValue("volWt", "");
    setValue("invoiceValue", "");
    setIsHold(false);
    setIsEdit(false);
  };

  //handle codelist
  const columns = useMemo(() => {
    const columnMapping = {
      "Airway Bill Entry": [
        { key: "code", label: "Code" },
        { key: "customer", label: "Customer" },
      ],
    };
    return columnMapping["Airway Bill Entry"] || [];
  }, []);

  //fetching data in shipments
  useEffect(() => {
    const fetchExtraChargesData = async () => {
      if (awbNo) {
        try {
          const response = await axios.get(
            `${server}/extraCharges?awbNo=${awbNo}`
          );

          if (!response.data || response.data.notFound) {
            setNewShipment("new");
            // console.log("hello");
          } else {
            clearErrors("awbNo");
            setIsEdit(true);

            // 👇 Normalize key names here
            const data = response.data;
            const normalizedData = {
              ...data,
              reference: data.referenceNo,
              origin: data.origin,
              sector: data.sector,
              destination: data.destination,
              service: data.service,
              accountCode: data.accountCode,
              name: data.customer,
              shipperFullName: data.consignor,
              shipperAddressLine1: data["consignor-addressLine1"],
              shipperAddressLine2: data["consignor-addressLine2"],
              shipperPincode: data["consignor-pincode"],
              shipperCity: data["consignor-city"],
              shipperState: data["consignor-state"],
              shipperPhoneNumber: data["consignor-telephone"],
              shipperKycType: data["consignor-idType"],
              shipperKycNumber: data["consignor-idNumber"],
              receiverFullName: data.consignee,
              receiverAddressLine1: data["consignee-addressLine1"],
              receiverAddressLine2: data["consignee-addressLine2"],
              receiverPincode: data["consignee-zipcode"],
              receiverCity: data["consignee-city"],
              receiverState: data["consignee-state"],
              receiverPhoneNumber: data["consignee-telephone"],
              receiverEmail: data["consignee-emailID"],
              shipmentType: data.shipmentType,
              pcs: data.pcs,
              totalActualWt: data.actualWt,
              totalVolWt: data.volWt,
              volDiscount: data.discount ?? data.volDisc ?? 0,
              payment: data.payment,
              totalInvoiceValue: data.invoiceValue,
              basicAmt: data.basicAmount,
              sgst: data.sgst,
              cgst: data.cgst,
              igst: data.igst,
              totalAmt: data.grandTotal,
              boxes: data.volumeContent,
              shipmentAndPackageDetails: data.invoiceContent
                ? Object.values(data.invoiceContent).flat()
                : [],
            };

            // 🧠 Admin check before setting
            if (user.role.toLowerCase() === "admin") {
              setNewShipment("old");
              setFetchedAwbData(normalizedData);
            }

            // console.log("Normalized ExtraCharges:", normalizedData);
          }
        } catch (error) {
          console.error("Error fetching airway bill data:", error);
          setNewShipment("new");
        }
      } else {
        clearErrors("awbNo");
        setNewShipment(null);
      }
    };

    fetchExtraChargesData();
  }, [awbNo]);

  useEffect(() => {
    const fetchAwbData = async () => {
      if (awbNo) {
        try {
          // Extract possible prefix (like EX-, RF-, RT-, AD-, etc.)
          const prefixMatch = awbNo.match(/^(EX|RF|RT|AD|RB|WD)-/i);
          const prefix = prefixMatch ? prefixMatch[1].toUpperCase() : null;

          // Remove prefix before sending request to server
          const cleanAwbNo = prefixMatch
            ? awbNo.replace(/^(EX|RF|RT|AD|RB|WD)-/i, "")
            : awbNo;

          const response = await axios.get(
            `${server}/portal/create-shipment?awbNo=${cleanAwbNo}`
          );
          if (!response.data || response.data.notFound) {
            setFetchedAwbData({});
          } else {
            clearErrors("awbNo");
            if (newShipment == "new") {
              setFetchedAwbData(response.data);
              setIsEdit(true);
              // console.log(response.data);
            }
          }
        } catch (error) {
          console.error("Error fetching airway bill data:", error);
          setFetchedAwbData({});
        }
      } else {
        clearErrors("awbNo");
        setFetchedAwbData({});
      }
    };

    fetchAwbData();
  }, [awbNo]);

  //fetching data in bagging
  const [fetchedBaggingData, setFetchedBaggingData] = useState({});

  useEffect(() => {
    const fetchBaggingData = async () => {
      const regex = /^[A-Z]{3}\d{7,}$/i;
      if (regex.test(awbNo)) {
        try {
          const response = await axios.get(`${server}/bagging`);
          // console.log("Bagging API response:", response.data);

          if (!response.data || response.data.length === 0) {
            // console.log("No bagging data found");
            setFetchedBaggingData({});
            return;
          }

          let foundAwbData = null;

          // Search through all bagging records to find the matching AWB
          for (const baggingRecord of response.data) {
            if (baggingRecord.rowData && Array.isArray(baggingRecord.rowData)) {
              const awbRecord = baggingRecord.rowData.find(
                (row) =>
                  row.awbNo && row.awbNo.toLowerCase() === awbNo.toLowerCase()
              );

              if (awbRecord) {
                // Found the AWB in this bagging record
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
                break; // Exit loop once found
              }
            }
          }

          if (foundAwbData) {
            // console.log("Found AWB in bagging data:", foundAwbData);
            setFetchedBaggingData(foundAwbData);
          } else {
            // console.log(`AWB ${awbNo} not found in any bagging record`);
            setFetchedBaggingData({});
          }
        } catch (error) {
          console.error("Error fetching bagging data:", error);
          setFetchedBaggingData({});
        }
      } else {
        // Invalid AWB format - clear bagging data
        setFetchedBaggingData({});
      }
    };

    fetchBaggingData();
  }, [awbNo]);

  // Add this useEffect to update the Run Details fields when bagging data is fetched
  // useEffect(() => {
  //   if (fetchedBaggingData && Object.keys(fetchedBaggingData).length > 0) {
  //     // Update Run Details fields with bagging data
  //     setValue("runNo", fetchedBaggingData.runNo || "");
  //     setValue("bag", fetchedBaggingData.bagNo || "");
  //     setValue("clubNo", fetchedBaggingData.totalClubNo || "");
  //     setValue("flight", fetchedBaggingData.flight || "");
  //     setValue("obc", fetchedBaggingData.obc || "");
  //     setValue("alMawb", fetchedBaggingData.alMawb || "");
  //   } else {
  //     // Clear Run Details fields when no bagging data is found
  //     setValue("runNo", "");
  //     setValue("bag", "");
  //     setValue("clubNo", "");
  //     setValue("flight", "");
  //     setValue("obc", "");
  //     setValue("alMawb", "");
  //   }
  // }, [fetchedBaggingData, setValue]);

  // Add handler for content changes
  const handleSetInvoiceContent = useCallback((data) => {
    setInvoiceContent(data);
    // console.log(invoiceContent);
  }, []);

  // Sync invoiceContent with form state
  useEffect(() => {
    setValue("invoiceContent", invoiceContent);
    // console.log("Invoice Content Updated:", invoiceContent);
  }, [invoiceContent]);

  // Add handler for volume content changes
  const handleSetVolumeContent = useCallback((data) => {
    // Remove any nested self-reference before storing
    const cleanedData = data.map(({ volumeWeightTable, ...rest }) => rest);
    setVolumeContent(cleanedData);
    // console.log("Clean Volume Content Updated:", cleanedData);
  }, []);

  // Sync volumeContent with form state
  useEffect(() => {
    setValue("volumeContent", volumeContent);
    // console.log("Volume Content Updated:", volumeContent);
  }, [volumeContent]);

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
      setValue("shipmentType", fetchedAwbData.shipmentType || "NDox");
      setValue("pcs", fetchedAwbData.boxes?.length || 0);
      setValue("actualWt", fetchedAwbData.totalActualWt || 0);
      setValue("chargeableWt", fetchedAwbData.chargeableWt || 0);
      setValue("volWt", fetchedAwbData.totalVolWt || 0);
      setValue("volDisc", fetchedAwbData.volDiscount || 0);
      setValue("payment", fetchedAwbData.payment || "Credit");

      // Invoice details
      setValue("currencys", fetchedAwbData.currencys || "INR");
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

      //invoice content
      setValue("content", fetchedAwbData.content || []);

      //hold details
      setIsHold(fetchedAwbData.isHold || false);
      setValue("holdReason", fetchedAwbData.holdReason || "");
      setValue("otherHoldReason", fetchedAwbData.otherHoldReason || "");
      setValue("operationRemark", fetchedAwbData.operationRemark || "");

      // If you have invoice content and volume content in the fetched data
      if (fetchedAwbData.shipmentAndPackageDetails) {
        setInvoiceContent(fetchedAwbData.shipmentAndPackageDetails);
      }
      if (fetchedAwbData.boxes) {
        setVolumeContent(fetchedAwbData.boxes);
      }
    } else {
      // Clear form when no data is found (new shipment)
      // You can add form reset logic here if needed
      setValue("customer", "");
      setValue("accountBalance", "");
      setIsHold(false);
      setInvContent([]);
      // console.log("No AWB data found - new shipment");
    }
  }, [fetchedAwbData, setValue]);

  //holdreason dynamic rendering
  const [holdReason, setHoldReason] = useState("");
  useEffect(() => {
    const grandTotal = watch("grandTotal");
    const availableBalance = account?.leftOverBalance
      ? -account.leftOverBalance // convert negative to positive “available” amount
      : 0;
    // console.log("availableBalance", availableBalance, "grandTotal", grandTotal);
    if (availableBalance < grandTotal) {
      setHoldReason("Insufficient balance");
      setIsHold(true);
      // console.log(
//         "holdreason dynamic rendering",
//         account?.leftOverBalance,
//         grandTotal
//       );
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
        className=" flex flex-col gap-3"
        onSubmit={handleSubmit(handleAWBEntry)}
      >
        <div className="flex flex-col relative">
          <div>
            <Heading
              title={`Extra Charges`}
              bulkUploadBtn="hidden"
              onRefresh={handleRefresh}
            />
          </div>
          <div className="absolute left-[170px] mt-1">
            <span className=" text-[#0A7DC1] text-xs select-none bg-[#0A7DC11F] border-2 border-[#0A7DC1] rounded-xl px-2 py-1">
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
                  <InputBoxYellowWithPrefix
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
                    prefix={extraCharges}
                  />
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
                      disabled={isEdit}
                    />
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
                  error={errors["consignee-addressLine2"]}
                  disabled={isEdit}
                  validation={{ required: "Address Line 2 is required" }}
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
                    // resetFactor={resetServiceAndDestination}
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
                    <div className="relative ">
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

            {/* Invoice Content  */}
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

          {/* Run details  */}
          <div className=" flex flex-col gap-2.5">
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
              <div className="flex flex-col gap-2.5 ">
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
                    disabled={isEdit}
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
                    disabled={isEdit}
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
                    disabled={isEdit}
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
                    disabled={isEdit}
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
                    disabled={isEdit}
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
                  disabled={isEdit}
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
                  disabled={isEdit}
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
                    disabled={isEdit}
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
                    disabled={isEdit}
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
                  onClick={(data) => {
                    setBtnAction("modify");
                    setIsEdit(false);
                    // console.log(data);
                  }}
                  disabled={isEdit == false || newShipment == null}
                  type="submit"
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
              {/* <OutlinedButtonRed label={`Close`} onClick={() => onClose()} /> */}
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
