"use client";
import { SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import CodeList from "@/app/components/CodeList";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { AutoCalcModal } from "@/app/components/AutoCalcModal";

const AutoCalculation = () => {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [resetFactor, setResetFactor] = useState(false);
  const [codeList, setCodeList] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [allShipments, setAllShipments] = useState([]);
  const [displayedShipments, setDisplayedShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [zoneMaster, setZoneMaster] = useState({});
  // Tax and calculation states
  const [branch, setBranch] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);
  const [applicableRates, setApplicableRates] = useState([]);
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

  // ── Modal state ──────────────────────────────────────────────────────────
  const [modal, setModal] = useState({ open: false, variant: "confirm" });
  const modalConfirmRef = useRef(null); // stores resolve fn for confirm flow

  const closeModal = () => setModal({ open: false, variant: "confirm" });

  /** Show a themed confirm dialog; returns a Promise<boolean> */
  const showConfirmModal = ({ title, message, meta, confirmLabel }) =>
    new Promise((resolve) => {
      modalConfirmRef.current = resolve;
      setModal({ open: true, variant: "confirm", title, message, meta, confirmLabel });
    });

  /** Show a themed info/error modal (test result rows) */
  const showInfoModal = ({ variant = "info", title, message, rows, meta }) =>
    setModal({ open: true, variant, title, message, rows, meta });

  /** Show a themed warning modal (failed shipments list) */
  const showWarningModal = ({ title, message, failedItems, okItems, meta }) =>
    setModal({ open: true, variant: "warning", title, message, failedItems, okItems, meta });

  /** Show a themed success modal (processed shipments list) */
  const showSuccessModal = ({ title, message, okItems, meta }) =>
    setModal({ open: true, variant: "success", title, message, okItems, meta });

  const handleModalConfirm = () => {
    closeModal();
    if (modalConfirmRef.current) {
      modalConfirmRef.current(true);
      modalConfirmRef.current = null;
    }
  };

  const handleModalClose = () => {
    closeModal();
    if (modalConfirmRef.current) {
      modalConfirmRef.current(false);
      modalConfirmRef.current = null;
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

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
      setAvailableServices(["All"]);
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
        `${server}/customer-account?accountCode=${accountCode.toUpperCase()}`,
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

      console.log("Fetched All Shipments:", shipments.length);
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

      // Fetch account data (branch, tax, rates)
      await fetchAccountData(account);
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
      setApplicableRates(ratesRes.data || []);

      // Extract unique services from applicable rates
      if (Array.isArray(ratesRes.data)) {
        const services = [
          ...new Set(ratesRes.data.map((r) => r.service).filter(Boolean)),
        ];
        console.log("Available services from rates:", services);
        setAvailableServices(["All", ...services]);
      } else {
        console.log("Rates is not an array:", ratesRes.data);
        setAvailableServices(["All"]);
      }

      console.log("Fetched Branch:", branchRes.data);
      console.log("Fetched Tax Settings:", taxRes.data);
      console.log("Fetched Applicable Rates:", ratesRes.data?.length);
    } catch (error) {
      console.error("Error fetching account data:", error);
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

  // REUSING BULK UPLOAD ROUTE FOR RATE CALCULATION
  const calculateRatesUsingBulkUploadRoute = async (shipments, newService) => {
    try {
      console.log("🔍 Using bulk upload route for rate calculation");
      console.log("Shipments to calculate:", shipments.length);
      console.log("Selected service:", newService);
      console.log("Account:", selectedAccount?.accountCode);

      // Prepare shipments in the format expected by bulk upload route
      const shipmentPayloads = shipments.map((shipment) => {
        // Determine service to use
        const serviceToUse =
          newService === "All" ? shipment.service : newService;

        // Prepare shipment data similar to bulk upload
        return {
          awbNo:
            shipment.awbNo ||
            `CALC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sector: (shipment.sector || "").toUpperCase().trim(),
          destination: (shipment.destination || "").toUpperCase().trim(),
          service: serviceToUse.toUpperCase().trim(),
          origin: (shipment.origin || "").toUpperCase().trim(),
          goodstype: shipment.goodstype || "",
          chargeableWt: Math.ceil(
            Number(shipment.chargeableWt) ||
            Number(shipment.totalActualWt) ||
            0,
          ),
          pcs: Number(shipment.pcs) || 1,
          totalInvoiceValue: Number(shipment.totalInvoiceValue) || 0,
          currency: shipment.currency || "INR",
          receiverPincode: shipment.receiverPincode || "",
          receiverCountry: shipment.receiverCountry || "",
          receiverState: shipment.receiverState || "",
          accountCode: selectedAccount.accountCode,
          // Add other required fields if needed by bulk upload route
          totalActualWt: Number(shipment.totalActualWt) || 0,
          totalVolWt: Number(shipment.totalVolWt) || 0,
        };
      });

      const payload = {
        shipments: shipmentPayloads,
        accountCode: selectedAccount.accountCode,
        timestamp: new Date().toISOString(),
        isCalculationOnly: true, // Flag to indicate this is just calculation, not upload
      };

      console.log("📦 Sending to bulk upload route:", {
        payloadSize: JSON.stringify(payload).length,
        shipmentCount: payload.shipments.length,
        sampleShipment: payload.shipments[0],
      });

      // Call the bulk upload calculate-rates endpoint
      const response = await fetch(`${server}/bulk-upload/calculate-rates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Bulk upload route error:", errorText);
        throw new Error(
          `Bulk upload route returned ${response.status}: ${errorText}`,
        );
      }

      const data = await response.json();
      console.log("✅ Bulk upload route response:", {
        success: data.success,
        resultsCount: data.results?.length,
        summary: data.summary,
      });

      if (data.success && data.results && Array.isArray(data.results)) {
        // Map results back to shipments
        return shipments.map((shipment) => {
          const calculated = data.results.find(
            (r) => r.awbNo === shipment.awbNo,
          );

          if (calculated && calculated.success) {
            console.log(`✅ Rate calculated for ${shipment.awbNo}:`, {
              basicAmt: calculated.basicAmt,
              totalAmt: calculated.totalAmt,
              service: calculated.service,
            });

            return {
              awbNo: shipment.awbNo,
              basicAmount: calculated.basicAmt || 0,
              sgst: calculated.sgst || 0,
              cgst: calculated.cgst || 0,
              igst: calculated.igst || 0,
              grandTotal: calculated.totalAmt || 0,
              newService:
                calculated.service ||
                (newService === "All" ? shipment.service : newService),
              zone: calculated.zone || "",
              rateUsed: calculated.rateUsed || 0,
              success: true,
            };
          } else {
            // If calculation failed for this shipment
            console.warn(
              `❌ Calculation failed for ${shipment.awbNo}:`,
              calculated?.error,
            );
            return {
              awbNo: shipment.awbNo,
              error: calculated?.error || "No rate returned from server",
              success: false,
            };
          }
        });
      } else {
        throw new Error(data.message || "Bulk upload calculation failed");
      }
    } catch (error) {
      console.error("❌ Bulk upload route calculation failed:", error.message);
      throw error;
    }
  };

  // Update shipment in database
  const updateShipmentInDB = async (shipment, calculated) => {
    const formatDateForBackend = (date) => {
      if (!date) return new Date().toISOString().split("T")[0];
      if (typeof date === "string" && date.includes("/")) {
        const [day, month, year] = date.split("/");
        return `${year}-${month}-${day}`;
      }
      return new Date(date).toISOString().split("T")[0];
    };

    const payload = {
      accountCode: selectedAccount.accountCode,
      customer: selectedAccount.name,
      service: calculated.newService,
      basicAmount: calculated.basicAmount,
      sgst: calculated.sgst,
      cgst: calculated.cgst,
      igst: calculated.igst,
      grandTotal: calculated.grandTotal,
      date: formatDateForBackend(shipment.date),
      updateUser: "Auto Calculation (Bulk Upload Route)",
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

    console.log("\n=== START AUTO CALCULATION USING BULK UPLOAD ROUTE ===");
    console.log("New service selected:", newService);
    console.log("Displayed shipments count:", displayedShipments.length);
    console.log("Selected account:", selectedAccount?.accountCode);

    if (!displayedShipments.length) {
      console.log("No shipments to calculate. Please select a customer first.");
      showNotification(
        "error",
        "No shipments to calculate, Please select a customer first",
      );
      return;
    }

    if (!selectedAccount) {
      console.log("No customer selected. Please select a customer first.");
      showNotification("error", "Please select a customer first");
      return;
    }

    const confirmUpdate = await showConfirmModal({
      title: "Confirm Recalculation",
      message: "This will recalculate and update all displayed shipments. The action cannot be undone.",
      meta: [
        `${displayedShipments.length} shipment${displayedShipments.length !== 1 ? "s" : ""}`,
        `Service: ${newService === "All" ? "Keep existing" : newService}`,
      ],
      confirmLabel: "Proceed",
    });

    if (!confirmUpdate) return;

    setIsLoading(true);
    try {
      console.log(
        "Starting auto calculation using bulk upload route for",
        displayedShipments.length,
        "shipments",
      );

      // STEP 1: Calculate rates using bulk upload route
      const calculatedResults = await calculateRatesUsingBulkUploadRoute(
        displayedShipments,
        newService,
      );

      // Separate successful and failed calculations
      const successfulCalculations = calculatedResults.filter((r) => r.success);
      const failedCalculations = calculatedResults.filter((r) => !r.success);

      console.log("Calculation results:", {
        total: calculatedResults.length,
        successful: successfulCalculations.length,
        failed: failedCalculations.length,
        failedAWBs: failedCalculations.map((f) => f.awbNo),
      });

      // If all failed, show error
      if (successfulCalculations.length === 0) {
        const errorMessage =
          failedCalculations[0]?.error || "All calculations failed";
        showNotification("error", `Calculation failed: ${errorMessage}`);
        setIsLoading(false);
        return;
      }

      // Show warning if some failed
      if (failedCalculations.length > 0) {
        showWarningModal({
          title: "Partial Calculation Result",
          message: `${successfulCalculations.length} of ${calculatedResults.length} shipments calculated successfully.`,
          failedItems: failedCalculations.map((f) => ({ awbNo: f.awbNo, error: f.error })),
          okItems: successfulCalculations.map((s) => ({
            awbNo: s.awbNo,
            service: s.newService,
            grandTotal: s.grandTotal,
          })),
          meta: [`${failedCalculations.length} failed`, `${successfulCalculations.length} OK`],
        });
      }

      // STEP 2: Update successful shipments in database
      let updatedCount = 0;
      let errorCount = 0;
      let totalNewBasic = 0;
      let totalNewGrandTotal = 0;

      for (const calculated of successfulCalculations) {
        try {
          // Find the original shipment
          const shipment = displayedShipments.find(
            (s) => s.awbNo === calculated.awbNo,
          );
          if (!shipment) {
            console.error(
              `Shipment ${calculated.awbNo} not found in displayed shipments`,
            );
            continue;
          }

          // Update shipment in database
          await updateShipmentInDB(shipment, calculated);
          console.log(`✓ Successfully updated shipment ${calculated.awbNo}`);
          updatedCount++;

          // Track totals
          totalNewBasic += calculated.basicAmount;
          totalNewGrandTotal += calculated.grandTotal;
        } catch (updateError) {
          console.error(
            `✗ Failed to update shipment ${calculated.awbNo}:`,
            updateError.message,
          );
          console.error("Error response:", updateError.response?.data);
          errorCount++;

          // Optionally: stop on first error or continue
          // break; // Uncomment to stop on first error
        }
      }

      console.log("=== Auto Calculation Results ===");
      console.log("Total processed:", calculatedResults.length);
      console.log("Successfully calculated:", successfulCalculations.length);
      console.log("Successfully updated in DB:", updatedCount);
      console.log("Failed updates:", errorCount);
      console.log("Total NEW Basic Amount:", totalNewBasic.toFixed(2));
      console.log("Total NEW Grand Total:", totalNewGrandTotal.toFixed(2));

      // Update form with new totals
      setValue("basicAmount", totalNewBasic.toFixed(2));
      setCalBasicAmount(totalNewBasic.toFixed(2));

      // Refresh shipments to show updated data
      if (selectedAccount && updatedCount > 0) {
        console.log("Refreshing shipments...");
        await fetchAllShipments(selectedAccount);
      }

      // Show appropriate notification / modal
      if (updatedCount > 0) {
        if (failedCalculations.length === 0) {
          showSuccessModal({
            title: "Calculation Completed",
            message: `Successfully calculated and updated ${updatedCount} shipments.`,
            okItems: successfulCalculations.map((s) => ({
              awbNo: s.awbNo,
              service: s.newService,
              grandTotal: s.grandTotal,
            })),
            meta: [`${updatedCount} Updated`, `Total: ₹${totalNewGrandTotal.toFixed(2)}`],
          });
        } else {
          showNotification(
            "success",
            `Successfully updated ${updatedCount} shipments using bulk upload route. New total: ₹${totalNewGrandTotal.toFixed(2)}`,
          );
        }
      } else {
        showNotification(
          "warning",
          "No shipments were updated. Check console for errors.",
        );
      }
    } catch (error) {
      console.error("Error during auto calculation:", error);
      showNotification("error", "Auto calculation failed: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Test calculation using bulk upload route
  const testCalculation = async () => {
    if (!displayedShipments.length || !watch("service")) {
      console.log("Cannot test: No shipments or service selected");
      return;
    }

    const testShipment = displayedShipments[0];
    const newService = watch("service");

    console.log("\n=== TESTING CALCULATION USING BULK UPLOAD ROUTE ===");
    console.log("Test shipment:", testShipment.awbNo);
    console.log("Selected service:", newService);

    try {
      // Use the bulk upload route for testing
      const [calculated] = await calculateRatesUsingBulkUploadRoute(
        [testShipment],
        newService,
      );

      if (calculated.error || !calculated.success) {
        showInfoModal({
          variant: "error",
          title: "Test Failed",
          message: calculated.error || "Unknown error",
          meta: [testShipment.awbNo],
        });
      } else {
        showInfoModal({
          title: "Test Successful",
          message: "Rate calculated via bulk upload route.",
          meta: [testShipment.awbNo, calculated.newService],
          rows: [
            { label: "Zone", value: calculated.zone || "—" },
            { label: "Chargeable Wt", value: testShipment.chargeableWt },
            { label: "New Basic", value: `₹${calculated.basicAmount}` },
            { label: "New GST", value: `₹${(calculated.sgst + calculated.cgst + calculated.igst).toFixed(2)}` },
            { label: "New Grand Total", value: `₹${calculated.grandTotal}` },
            { label: "Original Basic", value: `₹${testShipment.basicAmt || 0}` },
            { label: "Original Total", value: `₹${testShipment.totalAmt || 0}` },
          ],
        });
      }
    } catch (error) {
      showInfoModal({
        title: "Test Failed",
        message: error.message,
        meta: [testShipment.awbNo],
      });
    }
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
    setAvailableServices(["All"]);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Themed modal (replaces browser alert/confirm) ── */}
      <AutoCalcModal
        isOpen={modal.open}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        variant={modal.variant || "confirm"}
        title={modal.title}
        message={modal.message}
        rows={modal.rows}
        failedItems={modal.failedItems}
        okItems={modal.okItems}
        meta={modal.meta}
      />
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
          {/* <div className="text-gray-600 text-xs mt-1">
            Using bulk upload route for rate calculation
          </div> */}
        </div>
      )}

      <div className="flex justify-end gap-3">
        {/* To test one entry */}
        {/* <div>
          <button
            onClick={testCalculation}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
            disabled={
              !displayedShipments.length ||
              !watch("service") ||
              watch("service") === "All"
            }
          >
            Test Calculation (Bulk Route)
          </button>
        </div> */}

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
