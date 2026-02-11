"use client";
import Heading from "@/app/components/Heading";
import InputBox, { NumberInputBox } from "@/app/components/InputBox";
import { useContext, useEffect, useMemo, useState } from "react";
import Checkbox from "../Checkbox";
import { LabeledDropdown } from "../Dropdown";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import RedCheckbox from "../RedCheckBox";
import Table from "../Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import axios from "axios";

// Add the missing RedLabelHeading component
const RedLabelHeading = ({ label }) => (
  <h3 className="text-red font-semibold text-[14px]">{label}</h3>
);

// Password Modal Component
const PasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (password === "12345678") {
      onSuccess();
      setPassword("");
      setError("");
      onClose();
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-semibold mb-4">Enter Password</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter password to modify credit limit"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#EA1B40] text-white rounded-md hover:bg-[#d01636] transition-colors"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

const CreditLimit = ({
  register,
  setValue,
  setStep,
  getValues,
  customerData,
  resetFactor,
  watch = () => {},
}) => {
  const [enableOS, setEnableOS] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [creditLimitUnlocked, setCreditLimitUnlocked] = useState(false);
  const [uniqueServices, setUniqueServices] = useState([]);
  const { sectors, server } = useContext(GlobalContext);

  // Add state for summary totals
  const [totals, setTotals] = useState({
    totalSales: 0,
    totalReceipt: 0,
    totalDebit: 0,
    totalCredit: 0,
  });

  // Watch fields for calculations - IMPORTANT: Watch accountCode properly
  const creditLimit = watch("creditLimit");
  const outstanding = watch("outstanding");
  const selectedSector = watch("volumeMetricWtSector");
  const watchedAccountCode = watch("accountCode"); // Watch accountCode from form

  const columns = useMemo(
    () => [
      { key: "sector", label: "Sector" },
      { key: "service", label: "Service" },
      { key: "divisible", label: "Divisible" },
    ],
    []
  );

  const [rowData, setRowData] = useState([]);

  // Initialize accountCode from customerData if available
  useEffect(() => {
    if (customerData?.accountCode) {
      console.log("=== Setting initial accountCode from customerData:", customerData.accountCode);
      setValue("accountCode", customerData.accountCode);
    }
  }, [customerData?.accountCode, setValue]);

  // Fetch customer summary totals when accountCode changes
  useEffect(() => {
    const fetchCustomerSummary = async () => {
      // Get accountCode - check both watched value and customerData
      const accountCode = watchedAccountCode || customerData?.accountCode;
      
      if (!accountCode) {
        console.log("=== No accountCode available, skipping payment entry fetch");
        return;
      }

      try {
        console.log("=== Fetching Customer Summary for accountCode:", accountCode);
        console.log("Server URL:", server);
        console.log("Full URL:", `${server}/payment-entry?accountCode=${accountCode}`);
        
        const response = await axios.get(
          `${server}/payment-entry?accountCode=${accountCode}`
        );

        console.log("=== Payment Entry API Response:", response.data);
        const summary = response.data.summary || {};
        console.log("Customer Summary extracted:", summary);

        // Update totals state with raw numbers
        setTotals({
          totalSales: summary.totalSales || 0,
          totalReceipt: summary.totalReceipt || 0,
          totalDebit: summary.totalDebit || 0,
          totalCredit: summary.totalCredit || 0,
        });

        // Calculate outstanding: (Sales + Debit) - (Receipt + Credit)
        // This matches the formula in PaymentEntry.jsx
        const totalSales = parseFloat(summary.totalSales || 0);
        const totalReceipt = parseFloat(summary.totalReceipt || 0);
        const totalDebit = parseFloat(summary.totalDebit || 0);
        const totalCredit = parseFloat(summary.totalCredit || 0);
        
        const calculatedOutstanding = (totalSales + totalDebit) - (totalReceipt + totalCredit);
        
        console.log("=== Outstanding Calculation ===");
        console.log("Total Sales:", totalSales);
        console.log("Total Debit:", totalDebit);
        console.log("Total Receipt:", totalReceipt);
        console.log("Total Credit:", totalCredit);
        console.log("Formula: (Sales + Debit) - (Receipt + Credit)");
        console.log(`(${totalSales} + ${totalDebit}) - (${totalReceipt} + ${totalCredit}) = ${calculatedOutstanding}`);
        
        setValue("outstanding", calculatedOutstanding.toFixed(2));
      } catch (error) {
        console.error("=== ERROR fetching customer summary ===");
        console.error("Error details:", error);
        console.error("Error response:", error.response?.data);
        console.error("Error status:", error.response?.status);
        
        // Reset totals on error
        setTotals({
          totalSales: 0,
          totalReceipt: 0,
          totalDebit: 0,
          totalCredit: 0,
        });
        setValue("outstanding", "0.00");
      }
    };

    fetchCustomerSummary();
  }, [watchedAccountCode, customerData?.accountCode, server, setValue]);

  // Fetch all unique services from rate sheets on mount
  useEffect(() => {
    const fetchRateSheets = async () => {
      try {
        console.log("=== Fetching Rate Sheets ===");
        console.log("Server URL:", server);
        console.log("Full URL:", `${server}/rate-sheet`);
        
        const response = await axios.get(`${server}/rate-sheet`);
        console.log("Rate sheets fetched:", response.data);

        // Extract unique services from all rate sheets
        const services = [
          ...new Set(
            response.data.map((sheet) => sheet.service).filter(Boolean)
          ),
        ];
        console.log("Unique services:", services);

        setUniqueServices(services);
      } catch (error) {
        console.error("=== ERROR fetching rate sheets ===");
        console.error("Error details:", error);
        console.error("Error response:", error.response?.data);
      }
    };

    fetchRateSheets();
  }, [server]);

  // Calculate left over balance
  useEffect(() => {
    if (creditLimit && outstanding) {
      const leftOver = parseFloat(creditLimit) - parseFloat(outstanding);
      setValue("leftOverBalance", leftOver.toFixed(2));
      console.log("=== Left Over Balance calculated:", leftOver.toFixed(2));
    }
  }, [creditLimit, outstanding, setValue]);

  const handleAdd = () => {
    const sector = getValues("volumeMetricWtSector");
    const service = getValues("volumeMetricWtService");
    const divisible = getValues("divisible");

    if (!sector || !service || !divisible) {
      alert("Please fill all fields before adding");
      return;
    }

    const newRow = {
      sector: sector,
      service: service,
      divisible: divisible,
    };

    console.log("Adding row:", newRow);
    setRowData((prevRowData) => [...prevRowData, newRow]);

    // Clear the input fields
    setValue("volumeMetricWtSector", "");
    setValue("volumeMetricWtService", "");
    setValue("divisible", "");
  };

  const handleCreditLimitFocus = () => {
    if (!creditLimitUnlocked) {
      setShowPasswordModal(true);
    }
  };

  const handlePasswordSuccess = () => {
    setCreditLimitUnlocked(true);
    console.log("Credit limit unlocked");
  };

  useEffect(() => {
    if (customerData) {
      setEnableOS(customerData?.enableOS || false);
      if (customerData?.volWtDivisibleTable) {
        setRowData(customerData.volWtDivisibleTable);
      }
    }
  }, [customerData]);

  return (
    <div>
      <div className="flex flex-col gap-5 h-[55vh]">
        <PasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
        />

        <div className="flex gap-5">
          {/* Left Column - Credit Limit Details */}
          <div className="flex flex-col gap-3 w-full">
            <div className="flex justify-between">
              <div>
                <h2 className="text-red font-semibold text-[16px]">
                  Credit Limit Details
                </h2>
              </div>
              <RedCheckbox
                isChecked={enableOS}
                setChecked={setEnableOS}
                id="enableOS"
                register={register}
                setValue={setValue}
                label={"Enable O/S"}
              />
            </div>

            <div className="flex flex-col gap-3">
              <InputBox
                placeholder="Opening Balance"
                register={register}
                setValue={setValue}
                value="openingBalance"
                initialValue={customerData?.openingBalance || ""}
              />
              <div onClick={handleCreditLimitFocus} className="cursor-pointer">
                <InputBox
                  placeholder="Credit Limit"
                  register={register}
                  setValue={setValue}
                  value="creditLimit"
                  initialValue={customerData?.creditLimit || ""}
                  disabled={!creditLimitUnlocked}
                />
              </div>
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="Left Over Balance"
                setValue={setValue}
                value="leftOverBalance"
                disabled={true}
                initialValue={customerData?.leftOverBalance || ""}
              />
              <InputBox
                placeholder="No. of Days Credit"
                register={register}
                setValue={setValue}
                value="noOfDaysCredit"
                initialValue={customerData?.noOfDaysCredit || ""}
              />
            </div>

            <div className="flex gap-3 items-center">
              <div>
                <span className="text-sm font-semibold text-black">
                  Portal Balance
                </span>
              </div>
              <div className="w-[85%]">
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label=""
                  setValue={setValue}
                  value="leftOverBalance"
                  disabled={true}
                  initialValue={customerData?.leftOverBalance || ""}
                />
              </div>
            </div>

            {/* Total Outstanding Section - Updated with calculated values */}
            <div className="flex flex-col gap-3 w-full">
              <RedLabelHeading label="Total Outstanding" />
              <div className="grid grid-cols-2 grid-rows gap-x-4 gap-y-4">
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Total Sales"
                  setValue={setValue}
                  value="totalSales"
                  disabled={true}
                  inputValue={(totals.totalSales || 0).toFixed(2)}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Total Payment"
                  setValue={setValue}
                  value="totalPayment"
                  disabled={true}
                  inputValue={(totals.totalReceipt || 0).toFixed(2)}
                />
              </div>
              <div className="grid grid-cols-2 grid-rows gap-x-4 gap-y-4">
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Total Debit Note"
                  setValue={setValue}
                  value="totalDebitNote"
                  disabled={true}
                  inputValue={(totals.totalDebit || 0).toFixed(2)}
                />
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label="Total Credit Note"
                  setValue={setValue}
                  value="totalCreditNote"
                  disabled={true}
                  inputValue={(totals.totalCredit || 0).toFixed(2)}
                />
              </div>
              <DummyInputBoxWithLabelDarkGray
                register={register}
                label="Outstanding"
                setValue={setValue}
                value="outstanding"
                disabled={true}
                initialValue={customerData?.outstanding || ""}
              />
            </div>
          </div>

          {/* Right Column - Volume Metric Weight */}
          <div className="flex flex-col gap-3 w-full">
            <h2 className="text-red font-semibold text-[16px]">
              Volume Metric Weight (Divisible)
            </h2>

            <div className="flex flex-col gap-3">
              <LabeledDropdown
                options={sectors.map((sector) => sector.name)}
                register={register}
                setValue={setValue}
                value="volumeMetricWtSector"
                title="Sector"
                defaultValue={customerData?.volumeMetricWtSector || ""}
              />
              <LabeledDropdown
                options={uniqueServices}
                register={register}
                setValue={setValue}
                value="volumeMetricWtService"
                title="Service"
                defaultValue={customerData?.volumeMetricWtService || ""}
              />
            </div>

            <div className="flex flex-col gap-3 w-full">
              <div className="flex gap-3 items-center text-red w-full">
                <div className="w-full">
                  <InputBox
                    placeholder="Divisible"
                    register={register}
                    setValue={setValue}
                    value="divisible"
                    initialValue={customerData?.divisible || ""}
                  />
                </div>
                <div className="w-40">
                  <SimpleButton onClick={handleAdd} name={"Add"} />
                </div>
              </div>

              <div className="w-full py-6">
                <Table
                  columns={columns}
                  rowData={rowData}
                  register={register}
                  setValue={setValue}
                  name={"volWtDivisible"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <div>
          <OutlinedButtonRed
            label={"Back"}
            onClick={() => setStep((prevStep) => prevStep - 1)}
          />
        </div>
        <div>
          <SimpleButton
            onClick={() => setStep((prevStep) => prevStep + 1)}
            name={"Next"}
          />
        </div>
      </div>
    </div>
  );
};

export default CreditLimit;