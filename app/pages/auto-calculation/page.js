"use client";
import { SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import CodeList from "@/app/components/CodeList";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

const AutoCalculation = () => {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [resetFactor, setResetFactor] = useState(false);
  const [codeList, setCodeList] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [allShipments, setAllShipments] = useState([]);
  const [displayedShipments, setDisplayedShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Tax and calculation states
  const [branch, setBranch] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);
  const [applicableRates, setApplicableRates] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [availableServices, setAvailableServices] = useState([]);
  const [calbasicAmount, setCalBasicAmount] = useState([]);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Fetch customer list for CodeList
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await axios.get(`${server}/amount-log/customer`);
        setCodeList(res.data);
      } catch (err) {
        console.error("Failed to fetch customers", err);
        setCodeList([]);
      }
    };
    fetchCustomers();
  }, [server]);

  // Auto-fill customerName when accountCode changes and fetch full customer details
  const accountCode = watch("accountCode");
  useEffect(() => {
    if (!accountCode) {
      setCustomerName("");
      setValue("customer", "");
      setSelectedAccount(null);
      setAllShipments([]);
      setDisplayedShipments([]);
      setValue("basicAmount", "");
      return;
    }

    // Find selected from code list
    const selected = codeList.find((c) => c.accountCode === accountCode);
    if (selected) {
      setCustomerName(selected.name);
      setValue("customer", selected.name);
      // Fetch full customer details and then shipments
      fetchCustomerDetailsAndShipments(accountCode);
    }
  }, [accountCode, codeList, setValue]);

  // Fetch full customer details from separate route
  const fetchCustomerDetailsAndShipments = async (accountCode) => {
    setIsLoading(true);
    try {
      // Fetch full customer details
      const customerResponse = await axios.get(
        `${server}/customer-account?accountCode=${accountCode}`,
      );
      const customerDetails = customerResponse.data;

      console.log("Fetched Customer Details:", customerDetails);
      setSelectedAccount(customerDetails);

      // Now fetch shipments with full customer details
      await fetchAllShipments(customerDetails);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      console.log(
        "Failed to fetch customer details: " +
          (error.response?.data?.message || error.message),
      );
      setSelectedAccount(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all shipments when account code is entered
  const fetchAllShipments = async (account) => {
    if (!account) return;

    setIsLoading(true);
    try {
      // Fetch shipments
      const response = await axios.get(
        `${server}/portal/get-shipments?accountCode=${account.accountCode}`,
      );
      const shipments = response.data.shipments;

      console.log("Fetched All Shipments:", shipments);
      setAllShipments(shipments);
      setDisplayedShipments(shipments);

      // Calculate total basic amount from all shipments
      const totalBasic = shipments.reduce((sum, shipment) => {
        return sum + (Number(shipment.basicAmt) || 0);
      }, 0);

      setValue("basicAmount", totalBasic.toFixed(2));
      setCalBasicAmount(totalBasic.toFixed(2));
      console.log(
        `Loaded ${shipments.length} shipments with Total Basic Amount:`,
        totalBasic,
      );
      showNotification(
        "success",
        `Loaded ${shipments.length} shipments with Total Basic Amount:`,
        totalBasic,
      );

      // Fetch account data (branch, tax, rates)
      await fetchAccountData(account);

      // Extract unique services from applicable rates
      await fetchApplicableServices(account.accountCode);
    } catch (error) {
      console.error("Error fetching shipments:", error);
      console.log(
        "Failed to fetch shipment data: " +
          (error.response?.data?.message || error.message),
      );
      showNotification("error", "Error fetching shipments");
      setAllShipments([]);
      setDisplayedShipments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch branch, tax settings, and applicable rates
  const fetchAccountData = async (account) => {
    try {
      const [branchRes, taxRes, ratesRes] = await Promise.all([
        axios.get(`${server}/branch-master/get-branch?code=${account.branch}`),
        axios.get(`${server}/tax-settings`),
        axios.get(
          `${server}/shipper-tariff?accountCode=${account.accountCode}`,
        ),
      ]);

      setBranch(branchRes.data);
      setTaxSettings(taxRes.data);
      setApplicableRates(ratesRes.data);

      console.log("Fetched Branch:", branchRes.data);
      console.log("Fetched Tax Settings:", taxRes.data);
      console.log("Fetched Applicable Rates:", ratesRes.data);
      console.log("Applicable Rates count:", ratesRes.data?.length);
    } catch (error) {
      console.error("Error fetching account data:", error);
    }
  };

  // Get available services from applicable rates
  const fetchApplicableServices = async (accountCode) => {
    try {
      const response = await axios.get(
        `${server}/shipper-tariff?accountCode=${accountCode}`,
      );
      const rates = response.data;

      if (Array.isArray(rates)) {
        const services = rates.map((r) => r.service).filter(Boolean);
        console.log("Available services from rates:", services);
        setAvailableServices(["All", ...services]);
      } else {
        console.log("Rates is not an array:", rates);
        setAvailableServices(["All"]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setAvailableServices(["All"]);
    }
  };

  const parseDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
  };

  // Update the filtering useEffect
  useEffect(() => {
    if (!allShipments.length) return;

    const fromDateStr = watch("from");
    const toDateStr = watch("to");

    let filtered = [...allShipments];

    // Filter by date range using DD/MM/YYYY format
    if (fromDateStr) {
      const fromDate = parseDateDDMMYYYY(fromDateStr);
      if (fromDate) {
        filtered = filtered.filter((s) => {
          const shipmentDate = new Date(s.date);
          // Set time to beginning of day for accurate comparison
          fromDate.setHours(0, 0, 0, 0);
          return shipmentDate >= fromDate;
        });
      }
    }

    if (toDateStr) {
      const toDate = parseDateDDMMYYYY(toDateStr);
      if (toDate) {
        filtered = filtered.filter((s) => {
          const shipmentDate = new Date(s.date);
          // Set time to end of day for accurate comparison
          toDate.setHours(23, 59, 59, 999);
          return shipmentDate <= toDate;
        });
      }
    }

    setDisplayedShipments(filtered);

    // Update basic amount for filtered shipments
    const totalBasic = filtered.reduce((sum, shipment) => {
      return sum + (Number(shipment.basicAmt) || 0);
    }, 0);

    setValue("basicAmount", totalBasic.toFixed(2));
    setCalBasicAmount(totalBasic.toFixed(2));

    console.log(
      `Filtered to ${filtered.length} shipments with Total Basic Amount:`,
      totalBasic,
    );
  }, [watch("from"), watch("to"), allShipments]);

  // Find zone for a shipment based on sector, destination, and NEW service
  const findZoneForShipment = async (shipment, newService) => {
    try {
      // First, try to get zone from rate card (applicableRates)
      const cleanService = newService.trim().toUpperCase();
      const matchingRate = applicableRates?.find(
        (r) => r.service && r.service.trim().toUpperCase() === cleanService,
      );

      if (matchingRate?.zone) {
        console.log(
          `Using zone from rate card for ${shipment.awbNo}:`,
          matchingRate.zone,
        );
        return Number(matchingRate.zone);
      }

      // If no zone in rate card, try zones API
      console.log("\n=== Finding zone from zones API ===");

      // Build params for zones API
      const params = {
        sector: shipment.sector,
        service: newService,
      };

      if (shipment.pincode) {
        params.pincode = shipment.pincode;
      } else if (shipment.destination) {
        params.destination = shipment.destination;
      }

      console.log("Zone API params:", params);

      const response = await axios.get(`${server}/zones`, { params });
      const data = response.data;

      console.log("Zone API response:", data);

      const zoneList = Array.isArray(data?.zones) ? data.zones : [];

      if (zoneList.length > 0) {
        const zoneObj = zoneList[0];
        const zone =
          zoneObj.zone ?? zoneObj.zoneNo ?? zoneObj.zone_number ?? null;

        if (zone) {
          console.log(`Zone resolved for ${shipment.awbNo}:`, zone);
          return Number(zone);
        }
      }

      // If still no zone found
      console.warn(`No zone found for ${shipment.awbNo}`);
      return null;
    } catch (error) {
      console.error(`Error fetching zone for ${shipment.awbNo}:`, error);
      return null;
    }
  };

  const calculateNewShipmentAmountDebug = async (shipment, newService) => {
    console.log("\n=== DEBUG calculateNewShipmentAmount ===");
    console.log("Shipment details:", {
      awbNo: shipment.awbNo,
      chargeableWt: shipment.chargeableWt,
      actualWt: shipment.actualWt,
      pcs: shipment.pcs,
      sector: shipment.sector,
      destination: shipment.destination,
      pincode: shipment.pincode,
      service: shipment.service,
      newService: newService,
    });

    try {
      // 1. Get zone for THIS shipment
      console.log("\n[Step 1] Getting zone for shipment...");
      const zone = await findZoneForShipment(shipment, newService);

      if (!zone) {
        console.error("ERROR: Zone not found for this shipment");
        // Show alert to user
        if (typeof window !== "undefined") {
          alert(
            `Zone not found for AWB: ${shipment.awbNo}\nSector: ${shipment.sector}\nDestination: ${shipment.destination}\nService: ${newService}`,
          );
        }
        return {
          awbNo: shipment.awbNo,
          error: `Zone not found for shipment ${shipment.awbNo}`,
          details: {
            sector: shipment.sector,
            destination: shipment.destination,
            service: newService,
          },
        };
      }

      // 2. Get applicable rates for THIS shipment
      console.log("\n[Step 2] Getting applicable rates...");

      // Check if we have rate tariff in applicableRates
      const cleanService = newService.trim().toUpperCase();
      const matchingRate = applicableRates.find(
        (r) => r.service && r.service.trim().toUpperCase() === cleanService,
      );

      if (!matchingRate) {
        console.error("ERROR: No matching rate found for service:", newService);
        // Show alert to user
        if (typeof window !== "undefined") {
          alert(
            `No matching rate found for service: ${newService}\nAWB: ${shipment.awbNo}`,
          );
        }
        return {
          awbNo: shipment.awbNo,
          error: `No matching rate found for service: ${newService}`,
        };
      }

      console.log("Matching rate found:", matchingRate);

      // 3. Get weight-based rate for THIS shipment
      console.log("\n[Step 3] Getting weight-based rate...");
      const chargeableWt = parseFloat(shipment.chargeableWt) || 0;
      const actualWt =
        parseFloat(shipment.actualWt) ||
        parseFloat(shipment.actualWeight) ||
        chargeableWt;
      const pcs = parseFloat(shipment.pcs) || parseFloat(shipment.noOfPcs) || 1;

      // Check if rateTariff exists and has valid data
      let rateTariff =
        matchingRate.rateTariff ||
        matchingRate.rate ||
        matchingRate.tariff ||
        matchingRate.rateStructure ||
        "";

      console.log("Rate calculation parameters:", {
        awbNo: shipment.awbNo,
        service: newService,
        zone: zone,
        chargeableWt: chargeableWt,
        actualWt: actualWt,
        pcs: pcs,
        rateTariffLength: rateTariff.length,
        rateTariff: rateTariff || "(EMPTY)",
      });

      // If rateTariff is empty, show alert and stop
      if (!rateTariff || rateTariff.trim() === "") {
        console.error("❌ No rate tariff found");
        // Show alert to user
        if (typeof window !== "undefined") {
          alert(
            `No rate tariff found for service: ${newService}\nAWB: ${shipment.awbNo}\nPlease check rate configuration.`,
          );
        }
        return {
          awbNo: shipment.awbNo,
          error: `No rate tariff found for service: ${newService}`,
          matchingRate: matchingRate,
        };
      }

      // Clean rateTariff
      rateTariff = rateTariff.replace(/\s+/g, " ").trim();

      // Call rate calculation API
      const params = new URLSearchParams({
        service: newService,
        zone: zone.toString(),
        rateTariff: rateTariff,
        chargeableWt: chargeableWt.toString(),
        actualWt: actualWt.toString(),
        pcs: pcs.toString(),
      });

      const apiUrl = `${server}/portal/create-shipment/get-rates?${params.toString()}`;
      console.log("API URL (decoded):", decodeURIComponent(apiUrl));

      let rateResponse;
      try {
        rateResponse = await axios.get(apiUrl);
        console.log("Rate API response:", rateResponse.data);
      } catch (rateError) {
        console.error("Rate API error:", rateError.message);
        console.error("Rate API error response:", rateError.response?.data);

        // Show alert to user
        if (typeof window !== "undefined") {
          alert(
            `Rate calculation API failed for AWB: ${shipment.awbNo}\nError: ${rateError.message}\nPlease check rate configuration.`,
          );
        }

        return {
          awbNo: shipment.awbNo,
          error: `Rate calculation API failed: ${rateError.message}`,
          apiResponse: rateError.response?.data,
        };
      }

      if (!rateResponse.data || !rateResponse.data.rate) {
        console.error("ERROR: Rate API returned no rate");
        // Show alert to user
        if (typeof window !== "undefined") {
          alert(
            `Rate API returned no rate for AWB: ${shipment.awbNo}\nService: ${newService}\nZone: ${zone}`,
          );
        }
        return {
          awbNo: shipment.awbNo,
          error: "No rate returned from API",
          apiResponse: rateResponse.data,
        };
      }

      // 4. Calculate basic amount for THIS shipment
      console.log("\n[Step 4] Calculating basic amount...");
      const rate = parseFloat(rateResponse.data.rate);
      const rateType = rateResponse.data.type || "B";
      let basicAmount = 0;

      if (rateType === "S") {
        basicAmount = rate;
      } else if (rateType === "B") {
        basicAmount = rate * chargeableWt;
      }

      console.log("Rate calculation:", {
        rate: rate,
        type: rateType,
        chargeableWt: chargeableWt,
        calculatedBasic: basicAmount,
      });

      // 5. Calculate GST for THIS shipment
      console.log("\n[Step 5] Calculating GST...");
      let sgst = 0,
        cgst = 0,
        igst = 0;

      if (branch && taxSettings) {
        // Determine if IGST or CGST+SGST applies
        const isInterstate = shipment.sector !== branch.code; // Example logic

        if (isInterstate) {
          // IGST applies for interstate
          const igstRate =
            taxSettings.find((t) => t.taxName === "IGST")?.rate || 0.18;
          igst = basicAmount * igstRate;
        } else {
          // CGST + SGST for intrastate
          const cgstRate =
            taxSettings.find((t) => t.taxName === "CGST")?.rate || 0.09;
          const sgstRate =
            taxSettings.find((t) => t.taxName === "SGST")?.rate || 0.09;
          cgst = basicAmount * cgstRate;
          sgst = basicAmount * sgstRate;
        }
      } else {
        // Fallback simple GST
        const gstRate = 0.18;
        igst = basicAmount * gstRate;
      }

      const grandTotal = basicAmount + sgst + cgst + igst;

      const result = {
        awbNo: shipment.awbNo,
        basicAmount: parseFloat(basicAmount.toFixed(2)),
        sgst: parseFloat(sgst.toFixed(2)),
        cgst: parseFloat(cgst.toFixed(2)),
        igst: parseFloat(igst.toFixed(2)),
        grandTotal: parseFloat(grandTotal.toFixed(2)),
        newService: newService,
        zone: zone,
        rateType: rateType,
        chargeableWt: chargeableWt,
        rateUsed: rate,
      };

      console.log("\n[Step 6] Final result for shipment:", result);
      console.log("VS Original shipment:", {
        originalBasic: shipment.basicAmt,
        originalTotal: shipment.totalAmt,
        originalService: shipment.service,
      });

      return result;
    } catch (error) {
      console.error("\n[ERROR] Exception:", error.message);
      console.error("Error response:", error.response?.data);

      // Show alert to user
      if (typeof window !== "undefined") {
        alert(
          `Error calculating for AWB: ${shipment.awbNo}\nError: ${error.message}`,
        );
      }

      return {
        awbNo: shipment.awbNo,
        error: error.response?.data?.error || error.message,
        details: error.response?.data,
      };
    }
  };

  // Update shipment in database
  const updateShipmentInDB = async (shipment, calculated) => {
    const formatDateForBackend = (date) => {
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const payload = {
      accountCode: selectedAccount.accountCode, // needed for balance
      customer: selectedAccount.name, // needed for ledger
      service: calculated.newService,

      // 🔥 PER SHIPMENT VALUES ONLY
      basicAmount: calculated.basicAmount,
      sgst: calculated.sgst,
      cgst: calculated.cgst,
      igst: calculated.igst,
      grandTotal: calculated.grandTotal,

      date: formatDateForBackend(shipment.date),
      updateUser: "Auto Calculation",
    };

    console.log("Payload for shipment update:", {
      awbNo: shipment.awbNo,
      payload: payload,
    });

    return axios.put(
      `${server}/portal/create-shipment/auto-calculation?awbNo=${shipment.awbNo}`,
      payload,
      { headers: { "Content-Type": "application/json" } },
    );
  };

  // Handle Auto Calculate button click
  const handleAutoCalculate = async () => {
    const newService = watch("service");

    console.log("\n=== START AUTO CALCULATION ===");
    console.log("New service selected:", newService);
    console.log("Displayed shipments count:", displayedShipments.length);
    console.log("All shipments count:", allShipments.length);
    console.log("Selected account:", selectedAccount?.accountCode);
    console.log("Applicable rates loaded:", applicableRates?.length);
    console.log("Available services:", availableServices);
    console.log("Branch loaded:", !!branch);
    console.log("Tax settings loaded:", taxSettings?.length);

    if (!displayedShipments.length) {
      console.log("No shipments to calculate. Please select a customer first.");
      showNotification(
        "error",
        "No shipments to calculate, Please select a customer first",
      );
      return;
    }

    if (!applicableRates || !branch || !taxSettings) {
      console.log(
        "Required data not loaded. Please ensure customer has valid rates and tax settings.",
      );
      showNotification(
        "error",
        "Required data not loaded. Please ensure customer has valid rates and tax settings.",
      );
      return;
    }

    const confirmUpdate = confirm(
      `Are you sure you want to recalculate ${displayedShipments.length} shipment(s) with service "${newService}"?\n\n` +
        `Calculation will stop if any shipment fails. Check alerts for details.`,
    );

    if (!confirmUpdate) return;

    setIsLoading(true);
    try {
      console.log(
        "Starting auto calculation for",
        displayedShipments.length,
        "shipments with NEW service:",
        newService,
      );

      const recalculatedShipments = [];
      let totalNewBasic = 0;
      let totalNewSGST = 0;
      let totalNewCGST = 0;
      let totalNewIGST = 0;
      let totalNewGrandTotal = 0;
      let successCount = 0;
      let errorCount = 0;
      let updatedCount = 0;

      for (const shipment of displayedShipments) {
        console.log("\n--- Processing shipment:", shipment.awbNo, "---");

        const serviceToUse =
          newService === "All" ? shipment.service : newService;

        const calculated = await calculateNewShipmentAmountDebug(
          shipment,
          serviceToUse,
        );

        console.log("Calculation result:", calculated);

        if (calculated.error) {
          console.error(
            `✗ Error calculating for ${shipment.awbNo}:`,
            calculated.error,
          );
          errorCount++;

          // Stop processing after first error
          showNotification(
            "error",
            `Calculation stopped due to error for AWB: ${shipment.awbNo}. Check alert for details.`,
          );
          break; // Stop the loop
        }

        // Debug logs
        console.log("\n=== Shipment Update Debug ===");
        console.log("Shipment AWB:", shipment.awbNo);
        console.log("Original values:", {
          basicAmt: shipment.basicAmt,
          totalAmt: shipment.totalAmt,
          date: shipment.date,
          dateType: typeof shipment.date,
          isHold: shipment.isHold,
          holdReason: shipment.holdReason,
        });
        console.log("Calculated values:", {
          basicAmount: calculated.basicAmount,
          grandTotal: calculated.grandTotal,
          newService: calculated.newService,
        });

        // Track totals
        recalculatedShipments.push(calculated);
        totalNewBasic += calculated.basicAmount;
        totalNewSGST += calculated.sgst;
        totalNewCGST += calculated.cgst;
        totalNewIGST += calculated.igst;
        totalNewGrandTotal += calculated.grandTotal;
        successCount++;

        try {
          // Update shipment in database
          await updateShipmentInDB(shipment, calculated);
          console.log(`✓ Successfully updated shipment ${shipment.awbNo}`);
          updatedCount++;

          // Verify the update
          setTimeout(async () => {
            try {
              const verify = await axios.get(
                `${server}/portal/get-shipment?awbNo=${shipment.awbNo}`,
              );
              console.log("Verification - Updated shipment:", {
                basicAmt: verify.data.basicAmt,
                totalAmt: verify.data.totalAmt,
                service: verify.data.service,
                isHold: verify.data.isHold,
                holdReason: verify.data.holdReason,
              });
            } catch (verifyError) {
              console.error("Verification failed:", verifyError.message);
            }
          }, 500);
        } catch (updateError) {
          console.error(
            `✗ Failed to update shipment ${shipment.awbNo}:`,
            updateError.message,
          );
          console.error("Error response:", updateError.response?.data);
          errorCount++;

          // Stop processing after update error
          showNotification(
            "error",
            `Update failed for AWB: ${shipment.awbNo}. Check console for details.`,
          );
          break; // Stop the loop
        }
      }

      console.log("=== Auto Calculation Results ===");
      console.log("Recalculated Shipments:", recalculatedShipments);
      console.log(
        "Success:",
        successCount,
        "| Errors:",
        errorCount,
        "| Updated in DB:",
        updatedCount,
      );
      console.log("Total NEW Basic Amount:", totalNewBasic.toFixed(2));
      console.log("Total NEW SGST:", totalNewSGST.toFixed(2));
      console.log("Total NEW CGST:", totalNewCGST.toFixed(2));
      console.log("Total NEW IGST:", totalNewIGST.toFixed(2));
      console.log("Total NEW Grand Total:", totalNewGrandTotal.toFixed(2));

      // Update form with new totals
      setValue("basicAmount", totalNewBasic.toFixed(2));
      setCalBasicAmount(totalNewBasic.toFixed(2));

      // Refresh shipments to show updated data only if we had successes
      if (selectedAccount && updatedCount > 0) {
        console.log("Refreshing shipments...");
        await fetchAllShipments(selectedAccount);
      }

      // Show appropriate notification
      if (updatedCount > 0) {
        showNotification(
          "success",
          `Successfully updated ${updatedCount} shipments. New total: ₹${totalNewGrandTotal.toFixed(2)}`,
        );
      } else if (errorCount > 0) {
        // Error notification already shown in the loop
      } else {
        showNotification(
          "warning",
          "No shipments were updated. Check console for errors.",
        );
      }
    } catch (error) {
      console.error("Error during auto calculation:", error);
      console.log("Auto calculation failed: " + error.message);
      showNotification("error", "Auto calculation failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Also, update the testCalculation function to not refresh
  const testCalculation = async () => {
    if (!displayedShipments.length || !watch("service")) {
      console.log("Cannot test: No shipments or service selected");
      return;
    }

    const testShipment = displayedShipments[0];
    const newService = watch("service");

    console.log("\n=== TESTING CALCULATION FOR FIRST SHIPMENT ===");
    console.log("Test shipment:", testShipment.awbNo);
    console.log("Selected service:", newService);
    console.log("Chargeable weight:", testShipment.chargeableWt);
    console.log("Sector:", testShipment.sector);
    console.log("Destination:", testShipment.destination);
    console.log("Current basicAmt:", testShipment.basicAmt);
    console.log("Current totalAmt:", testShipment.totalAmt);

    const result = await calculateNewShipmentAmountDebug(
      testShipment,
      newService,
    );
    console.log("Test calculation result:", result);

    if (result.error) {
      alert(`Test failed: ${result.error}`);
    } else {
      alert(
        `Test successful!\nNew Basic: ₹${result.basicAmount}\nNew Grand Total: ₹${result.grandTotal}`,
      );
    }
    // Don't refresh after test
  };

  const handleRefresh = () => {
    setResetFactor(!resetFactor);
    setAllShipments([]);
    setDisplayedShipments([]);
    setValue("basicAmount", "");
    setValue("accountCode", "");
    setValue("customer", "");
    setValue("service", "");
    setValue("from", "");
    setValue("to", "");
    setSelectedAccount(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <CodeList
        data={codeList}
        handleAction={(item) => {
          setValue("accountCode", item.accountCode);
        }}
        columns={[
          { key: "accountCode", label: "Customer Code" },
          { key: "name", label: "Customer Name" },
        ]}
        name={`Customer Code List`}
      />
      <Heading
        title={`Auto Calculation`}
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex gap-3 mt-6">
        <div>
          <InputBox
            resetFactor={resetFactor}
            register={register}
            setValue={setValue}
            value="accountCode"
            placeholder={`Customer Code`}
          />
        </div>
        <div className="w-full">
          <InputBox
            resetFactor={resetFactor}
            register={register}
            setValue={setValue}
            value="customer"
            placeholder={`Customer Name`}
            initialValue={selectedAccount?.name || ""}
            disabled
          />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex gap-3 w-full">
          <LabeledDropdown
            register={register}
            setValue={setValue}
            options={availableServices}
            value="service"
            title={`Service (Select to Recalculate)`}
            resetFactor={resetFactor}
          />
          <DateInputBox
            register={register}
            setValue={setValue}
            value={`from`}
            placeholder="From"
            resetFactor={resetFactor}
          />
          <DateInputBox
            register={register}
            setValue={setValue}
            value={`to`}
            placeholder="To"
            resetFactor={resetFactor}
          />
        </div>
      </div>

      <div>
        <RedCheckbox
          id={`withBookingDate`}
          register={register}
          setValue={setValue}
          value="withBookingDate"
          label={`With Booking Date`}
        />
      </div>

      <div>
        <InputBox
          resetFactor={resetFactor}
          register={register}
          setValue={setValue}
          value="basicAmount"
          placeholder={`Basic Amount (Current)`}
          initialValue={calbasicAmount || ""}
          disabled
        />
      </div>

      {displayedShipments.length > 0 && (
        <div className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
          <div className="font-semibold text-blue-800 mb-1">
            Showing {displayedShipments.length} of {allShipments.length}{" "}
            shipment(s)
          </div>
          <div className="text-blue-600">
            Customer: {customerName} ({accountCode})
          </div>
          {watch("service") && watch("service") !== "All" && (
            <div className="text-orange-600 font-medium mt-1">
              Service "{watch("service")}" selected for recalculation
            </div>
          )}
          <div className="text-gray-600 text-xs mt-1">
            Available services: {availableServices.slice(1).join(", ")}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <div>
          <button
            onClick={testCalculation}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
            disabled={
              !displayedShipments.length ||
              !watch("service") ||
              watch("service") === "All"
            }
          >
            Test Calculation
          </button>
        </div>
        <div>
          <SimpleButton
            name={isLoading ? "Calculating..." : `Auto Calculate & Update`}
            onClick={handleAutoCalculate}
            disabled={
              isLoading || !displayedShipments.length || !selectedAccount
            }
          />
        </div>
      </div>
    </div>
  );
};

export default AutoCalculation;
