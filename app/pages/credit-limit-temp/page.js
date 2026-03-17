"use client";
import React, { useContext, useEffect, useState } from "react";
import InputBox from "@/app/components/InputBox";
import axios from "axios";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { useForm, useWatch } from "react-hook-form";
import Heading from "@/app/components/Heading";
import {
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelTransparent,
} from "@/app/components/DummyInputBox";
import { RedLabelHeading } from "@/app/components/Heading";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { SearchInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import CreditLimitReport from "@/app/components/credit-limit-report/CreditLimitReport";

function CreditLimitTemp({ }) {
  const getTodayDDMMYYYY = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
  };

  const { register, handleSubmit, setValue, watch, control, getValues, reset } =
    useForm({
      defaultValues: {
        date: getTodayDDMMYYYY(),
      },
    });
  const { accounts, braches, server, refetch, setRefetch } =
    useContext(GlobalContext);
  const { toggleCodeList, setToggleCodeList } = useContext(GlobalContext);
  const [customerName, setCustomerName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [leftOverBalance, setLeftOverBalance] = useState(0);
  const [PaymentReset, setPaymentReset] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fetchedCustomer, setFetchedCustomer] = useState(null);
  const [totals, setTotals] = useState({
    totalSales: 0,
    totalReceipt: 0,
    totalDebit: 0,
    totalCredit: 0,
    totalBalance: 0,
  });

  const customerCodeValue = useWatch({ control, name: "customerCode" });

  const receiptType = watch("receiptType");

  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const amountValue = useWatch({ control, name: "amount" });
  const bankNameValue = useWatch({ control, name: "bankName" });
  const debitAmountValue = useWatch({ control, name: "debitAmount" });
  const creditAmountValue = useWatch({ control, name: "creditAmount" });
  const debitNoValue = useWatch({ control, name: "debitNo" });
  const creditNoValue = useWatch({ control, name: "creditNo" });
  const receiptNoValue = useWatch({ control, name: "receiptNo" });
  const remarksValue = useWatch({ control, name: "remarks" });
  const verifyRemarksValue = useWatch({ control, name: "verifyRemarks" });
  const dateValue = watch("date");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const fetchCustomerTotals = async (code) => {
    if (!code) return;
    try {
      const res = await axios.get(
        `${server}/credit-limit-temp?customerCode=${code}`
      );
      const summary = res.data.summary || {};
      setTotals({
        totalSales: summary.totalSales?.toFixed(2) || 0,
        totalReceipt: summary.totalReceipt?.toFixed(2) || 0,
        totalDebit: summary.totalDebit?.toFixed(2) || 0,
        totalCredit: summary.totalCredit?.toFixed(2) || 0,
        totalBalance: summary.totalBalance?.toFixed(2) || 0,
      });
      setLeftOverBalance(summary.totalBalance || 0);
    } catch (err) {
      console.error("Error fetching totals:", err);
      setTotals({
        totalSales: 0,
        totalReceipt: 0,
        totalDebit: 0,
        totalCredit: 0,
        totalBalance: 0,
      });
    }
  };

  useEffect(() => {
    const customerCode = customerCodeValue?.toUpperCase()?.trim();

    if (!customerCode || customerCode.length < 2) {
      setFetchedCustomer(null);
      setCustomerName("");
      setBranchCode("");
      setBranchName("");
      setOpeningBalance("");
      setLeftOverBalance(0);
      setTotals({
        totalSales: 0,
        totalReceipt: 0,
        totalDebit: 0,
        totalCredit: 0,
        totalBalance: 0,
      });
      return;
    }

    const fetchCustomer = async () => {
      try {
        const res = await axios.get(
          `${server}/customer-account?accountCode=${customerCode.toUpperCase()}`
        );
        const customer = res.data;

        if (customer && customer.accountCode) {
          if ((customer.modeType || "").trim().toLowerCase() !== "temp") {
            showNotification(
              "error",
              "Only TEMP customers can have Credit Limit Temp entries."
            );
            return;
          }

          setFetchedCustomer(customer);
          setCustomerName(customer.name);
          setBranchCode(customer.branch);
          setBranchName(customer.companyName);
          setValue("branchName", customer.companyName);
          setOpeningBalance(customer.openingBalance);
          setLeftOverBalance(customer.leftOverBalance);

          fetchCustomerTotals(customerCode);
        }
      } catch (error) {
        console.error("Error fetching customer:", error);
        setFetchedCustomer(null);
        setCustomerName("");
        setBranchCode("");
        setBranchName("");
        setOpeningBalance("");
        setLeftOverBalance(0);
        setTotals({
          totalSales: 0,
          totalReceipt: 0,
          totalDebit: 0,
          totalCredit: 0,
          totalBalance: 0,
        });
      }
    };

    const timer = setTimeout(fetchCustomer, 300);
    return () => clearTimeout(timer);
  }, [customerCodeValue, server, setValue]);

  const handleModify = async () => {
    const data = getValues();
    if (!data.receiptNo) {
      showNotification("error", "No receipt selected to modify!");
      return;
    }

    if (!data.customerCode || !data.amount || !data.mode) {
      showNotification(
        "error",
        "Customer Code, Amount, and Mode are required!"
      );
      return;
    }

    try {
      const res = await axios.put(`${server}/credit-limit-temp`, {
        ...data,
      });

      console.log("Modify response:", res.data);
      showNotification("success", "Record updated successfully");

      setRefetch(!refetch);
    } catch (error) {
      console.error(
        "Error modifying record:",
        error.response?.data || error.message
      );
      showNotification("error", "Failed to modify record");
    }
  };

  const handleVerify = async () => {
    const data = getValues();

    if (!data.verifyRemarks?.trim()) {
      showNotification("error", "Enter verify remarks first!");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user"));
    const verifiedByUser = user?.userId || user?.username || "Unknown";

    console.log("🔍 Verifying with user:", verifiedByUser); // Debug log

    try {
      // ✅ CRITICAL: Only send necessary fields, DO NOT spread ...data
      const payload = {
        receiptNo: data.receiptNo,
        isVerified: true,
        verifyRemarks: data.verifyRemarks,
        verifierUser: verifiedByUser, // ✅ Changed from entryUser to verifierUser
      };

      console.log("🔍 Sending payload:", payload); // Debug log

      const response = await axios.put(`${server}/credit-limit-temp`, payload);

      console.log("✅ Response:", response.data); // Debug log

      showNotification("success", "Record verified successfully ✅");
      setRefetch(!refetch);
    } catch (err) {
      console.error("Verify error:", err);
      showNotification("error", "Failed to verify");
    } finally {
      handleRefresh();
    }
  };

  const onSubmit = async (data) => {
    const requiredFields = {
      amount: "Amount",
      mode: "Mode",
      receiptType: "Receipt Type",
      remarks: "Remarks",
    };

    const missingFields = Object.keys(requiredFields).filter(
      (field) => !data[field] || data[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      showNotification(
        "error",
        `Please fill the following fields: ${missingFields
          .map((f) => requiredFields[f])
          .join(", ")}`
      );
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const entryUser = user?.userId || user?.username || "Unknown";

      // ✅ Find matched account to get correct branchName
      const matchedAccount = accounts.find(
        (account) =>
          account.accountCode.toUpperCase() === data.customerCode?.toUpperCase()
      );

      const payload = {
        ...data,
        customerName: matchedAccount?.name || customerName, // ✅ Ensure customerName
        branchName: matchedAccount?.companyName || branchName, // ✅ Explicitly send branchName from matched account
        branchCode: matchedAccount?.branch || branchCode, // ✅ Ensure branchCode
        entryUser,
        mode: "temp",
      };

      console.log("Final payload:", payload);

      const res = await axios.post(`${server}/credit-limit-temp`, payload);
      console.log("Payment API response:", res.data);
      showNotification("success", "New Record saved successfully");
    } catch (error) {
      console.error(
        "Error saving record:",
        error.response?.data || error.message
      );
      showNotification("error", "Failed to save record");
    } finally {
      handleRefresh();
    }
  };

  const handleUpdateBalance = async (customerCode, amount) => {
    try {
      const url = `${server}/credit-limit-temp?customerCode=${encodeURIComponent(
        customerCode
      )}`;

      const response = await axios.put(url, { amount });

      console.log("Balance updated successfully:", response.data);

      return response.data;
    } catch (error) {
      console.error(
        "Error updating balance:",
        error.response?.data || error.message
      );
      throw error;
    } finally {
      setRefetch(!refetch);
    }
  };

  const updateBalance = async (customerCode, amount) => {
    try {
      const updatedCustomer = await handleUpdateBalance(
        customerCode,
        Number(amount)
      );
      console.log("Updated Customer:", updatedCustomer);
    } catch (error) {
      console.error("Failed to update balance:", error);
    }
  };

  const handleReceiptSearch = async (receiptNo) => {
    if (!receiptNo) return;

    try {
      const res = await axios.get(
        `${server}/credit-limit-temp?receiptNo=${receiptNo}`
      );

      // Set summary
      const summary = res.data.summary;
      if (summary) {
        setTotals({
          totalSales: (summary.totalSales || 0).toFixed(2),
          totalReceipt: (summary.totalReceipt || 0).toFixed(2),
          totalDebit: (summary.totalDebit || 0).toFixed(2),
          totalCredit: (summary.totalCredit || 0).toFixed(2),
          totalBalance: (summary.totalBalance || 0).toFixed(2),
        });
        setLeftOverBalance(summary.totalBalance || 0);
      }

      const record = res.data.record;
      if (record) {
        setValue("customerCode", record.customerCode);
        setValue("customerName", record.customerName);
        setValue("branchCode", record.branchCode);
        setValue("branchName", record.branchName);
        setValue("amount", record.amount);
        setValue("mode", record.mode);
        setValue("bankName", record.bankName);
        setValue("receiptType", record.receiptType);
        setValue("debitAmount", record.debitAmount);
        setValue("creditAmount", record.creditAmount);
        setValue("debitNo", record.debitNo);
        setValue("creditNo", record.creditNo);
        setValue("receiptNo", record.receiptNo);
        setValue("date", record.date);
        setValue("remarks", record.remarks);
        setValue("verifyRemarks", record.verifyRemarks ?? "");

        setCustomerName(record.customerName);
        setBranchCode(record.branchCode);
        setBranchName(record.branchName);
        setOpeningBalance(record.openingBalance);
        setLeftOverBalance(record.closingBalance);

        setIsEditing(true);
      }
    } catch (error) {
      console.error("Record not found:", error.response?.data || error.message);
      showNotification("error", "No record found!");
      setIsEditing(false);
    }
  };


  const handleRefresh = async () => {
    reset({
      customerCode: "",
      customerName: "",
      branchCode: "",
      branchName: "",
      amount: "",
      mode: "temp",
      chequeNo: "",
      bankName: "",
      receiptType: "",
      debitAmount: "",
      creditAmount: "",
      debitNo: "",
      creditNo: "",
      remarks: "",
      verifyRemarks: "",
      date: getTodayDDMMYYYY(),
      receiptNo: "",
    });

    setCustomerName("");
    setBranchName("");
    setBranchCode("");
    setOpeningBalance("");
    setLeftOverBalance(0);
    setTotals({
      totalSales: 0,
      totalReceipt: 0,
      totalDebit: 0,
      totalCredit: 0,
      totalBalance: 0,
    });
    try {
      const res = await axios.get(`${server}/credit-limit-temp/next-receipt`);
      setValue("receiptNo", res.data.nextReceipt);
      setValue("date", getTodayDDMMYYYY());
      setIsEditing(false); // 🔑 new mode
    } catch (error) {
      console.error(
        "Error fetching next receipt on refresh:",
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    if (receiptType === "Debit Note") {
      setValue("creditAmount", "");
      setValue("creditNo", "");
    } else if (receiptType === "Credit Note") {
      setValue("debitAmount", "");
      setValue("debitNo", "");
    } else {
      setValue("debitAmount", "");
      setValue("debitNo", "");
      setValue("creditAmount", "");
      setValue("creditNo", "");
    }
  }, [receiptType, setValue]);

  useEffect(() => {
    const fetchNextReceipt = async () => {
      try {
        const res = await axios.get(`${server}/credit-limit-temp/next-receipt`);
        setValue("receiptNo", res.data.nextReceipt);
        setValue("date", getTodayDDMMYYYY);
      } catch (error) {
        console.error(
          "Error fetching next receipt:",
          error.response?.data || error.message
        );
      }
    };

    fetchNextReceipt();
  }, [server, setValue]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F1") {
        e.preventDefault(); // prevent browser help from opening
        setToggleCodeList(true); // open PaymentReport modal
      } else if (e.key === "Escape") {
        setToggleCodeList(false); // close PaymentReport modal
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setToggleCodeList]);

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <Heading
          title={`Credit Limit (Temp)`}
          bulkUploadBtn="hidden"
          // codeListBtn="hidden"
          onRefresh={handleRefresh}
        />
        {/* Fullscreen Modal for Code List */}
        <CreditLimitReport
          isOpen={toggleCodeList}
          onClose={() => setToggleCodeList(false)}
          customerCode={watch("customerCode")}
          showNotification={showNotification}
          leftOverBalance={leftOverBalance} // ← ADD THIS
        />

        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-3 mb-4">
              <RedLabelHeading label={"Customer Details"} />
              <div className="flex flex-row gap-3">
                <div className="max-w-[150px]">
                  <InputBox
                    placeholder="Code"
                    register={register}
                    setValue={setValue}
                    resetFactor={PaymentReset}
                    value="customerCode"
                    initialValue={watch("customerCode")}
                  />
                </div>
                <DummyInputBoxWithLabelTransparent
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="customerName"
                  watch={watch}
                  label={`Customer Name`}
                  inputValue={customerName}
                />
              </div>

              <div className="flex flex-row gap-3">
                <div className="max-w-[150px]">
                  <DummyInputBoxWithLabelTransparent
                    label="Branch Code"
                    register={register}
                    setValue={setValue}
                    resetFactor={PaymentReset}
                    value="branchCode"
                    watch={watch}
                    inputValue={branchCode}
                  />
                </div>
                <DummyInputBoxWithLabelTransparent
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="branchName"
                  watch={watch}
                  label={`Branch Name`}
                  inputValue={branchName}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              <RedLabelHeading label={"Receipt Amount"} />
              <div className="flex flex-row gap-3">
                <InputBox
                  placeholder="Amount"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="amount"
                  initialValue={amountValue}
                />
                <LabeledDropdown
                  options={["temp"]}
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  title={`Mode`}
                  value={`modeDisplay`}
                  defaultValue="temp"
                  disabled
                />

                {/* hidden input for actual value */}
                <input type="hidden" {...register("mode")} value="temp" />
              </div>

              <div className="flex flex-col gap-3">
                <InputBox
                  placeholder="Bank Name"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="bankName"
                  initialValue={bankNameValue}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <RedLabelHeading label={"Debit/Credit Details"} />
              <div className="flex flex-row gap-3">
                <LabeledDropdown
                  options={[
                    "General Entry",
                    "Debit Note",
                    "Credit Note",
                    "TDS",
                    "Return",
                    "Bad Debts",
                    "Other",
                  ]}
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  title={`Receipt Type`}
                  value={`receiptType`}
                  defaultValue={watch("receiptType")}
                />
              </div>

              <div className="flex flex-row gap-3">
                <InputBox
                  placeholder="Debit Amount"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="debitAmount"
                  disabled={receiptType !== "Debit Note"}
                  initialValue={debitAmountValue}
                />
                <InputBox
                  placeholder="Credit Amount"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="creditAmount"
                  disabled={receiptType !== "Credit Note"}
                  initialValue={creditAmountValue}
                />
              </div>

              <div className="flex flex-row gap-3">
                <InputBox
                  placeholder="Debit No."
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="debitNo"
                  disabled={receiptType !== "Debit Note"}
                  initialValue={debitNoValue}
                />
                <InputBox
                  placeholder="Credit No."
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="creditNo"
                  disabled={receiptType !== "Credit Note"}
                  initialValue={creditNoValue}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3">
              <RedLabelHeading label={"Reciept Details"} />
              <div className="flex flex-row gap-3">
                <InputBox
                  placeholder="Receipt No."
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="receiptNo"
                  disabled
                  initialValue={receiptNoValue}
                />
                <InputBox
                  placeholder="Date"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="date"
                  disabled
                  initialValue={dateValue}
                />
              </div>

              <SearchInputBox
                placeholder="Search Receipt No."
                onBlur={(e) => handleReceiptSearch(e.target.value.trim())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleReceiptSearch(e.target.value.trim());
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <RedLabelHeading label={"Summary"} />
              <div className="flex flex-col gap-2.5 mt-3">
                <DummyInputBoxWithLabelDarkGray
                  label="Opening Balance"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="openingBalance"
                  inputValue={openingBalance}
                  watch={watch}
                />
                <DummyInputBoxWithLabelDarkGray
                  watch={watch}
                  label="Total Sales"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="totalSales"
                  inputValue={totals.totalSales}
                />
                <DummyInputBoxWithLabelDarkGray
                  watch={watch}
                  label="Total Receipt"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="totalReceipt"
                  inputValue={totals.totalReceipt}
                />
                <DummyInputBoxWithLabelDarkGray
                  watch={watch}
                  label="Total Debit"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="totalDebit"
                  inputValue={totals.totalDebit}
                />
                <DummyInputBoxWithLabelDarkGray
                  watch={watch}
                  label="Total Credit"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="totalCredit"
                  inputValue={totals.totalCredit}
                />
                <DummyInputBoxWithLabelDarkGray
                  watch={watch}
                  label="Total Balance"
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="totalBalance"
                  inputValue={totals.totalBalance}
                />
                <div className="flex justify-center items-center w-full">
                  <div className="text-sm tracking-wide text-[#14532d] bg-[#dcfce7]  text-center py-1 px-6 rounded w-full">
                    <h2>
                      {" "}
                      * Press{" "}
                      <span className="text-center font-bold mx-1">F1</span>
                      for Credit Limit Report{" "}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <InputBox
            placeholder="Remarks"
            register={register}
            setValue={setValue}
            resetFactor={PaymentReset}
            value="remarks"
            initialValue={remarksValue}
          />

          <div className="flex flex-row gap-3">
            <InputBox
              placeholder="Verify Remarks"
              register={register}
              setValue={setValue}
              resetFactor={PaymentReset}
              value="verifyRemarks"
              initialValue={verifyRemarksValue}
            />
            <div className="w-[145px]">
              <SimpleButton name="Verify" onClick={handleVerify} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-between items-center">
          <div className="w-[145px] ">
            {/* <OutlinedButtonRed label={`Close`} /> */}
          </div>

          <div className="flex gap-3">
            <div className="w-[145px]">
              <OutlinedButtonRed label={`New`} onClick={handleRefresh} />
            </div>
            <div className="inline-block">
              <SimpleButton
                name="Save"
                onClick={handleSubmit(onSubmit)}
                disabled={isEditing}
              />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export default CreditLimitTemp;
