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
import PaymentReport from "@/app/components/payment-report/PaymentReport";
import NotificationFlag from "@/app/components/Notificationflag";

function PaymentEntry({}) {
  const getTodayDDMMYYYY = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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
  const [isVerified, setIsVerified] = useState(false);
  const [PaymentReset, setPaymentReset] = useState(false);
  const [fetchedData, setFetchedData] = useState([]);
  const [totals, setTotals] = useState({
    totalSales: 0,
    totalReceipt: 0,
    totalDebit: 0,
    totalCredit: 0,
  });

  const verifyRemarkValue = watch("verifyRemarks");
  const receiptType = watch("receiptType");

  const amountValue = useWatch({ control, name: "amount" });
  const chequeNoValue = useWatch({ control, name: "chequeNo" });
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

  const handleVerifyUpdate = async () => {
    const data = getValues(); // current form values

    if (!data.verifyRemarks?.trim()) {
      showNotification(
        "error",
        "Please enter verify remarks before verifying!"
      );
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user")); // get logged-in user
      const entryUser = user?.userId || user?.username || "Unknown";

      const res = await axios.put(`${server}/payment-entry`, {
        ...data,
        isVerified: true,
        entryUser, // ✅ send user in body instead of header
      });

      showNotification("success", "Record verified successfully ✅");
      setIsVerified(true);
      setRefetch(!refetch);
    } catch (error) {
      console.error(
        "Error verifying payment:",
        error.response?.data || error.message
      );
      showNotification("error", "Failed to verify payment");
    }
  };

  const handleModify = async () => {
    const data = getValues();
    if (!data.receiptNo) {
      showNotification("error", "No receipt selected to modify!");
      return;
    }

    if (!data.accountCode || !data.amount || !data.mode) {
      showNotification("error", "Account Code, Amount, and Mode are required!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const entryUser = user?.userId || user?.username || "Unknown";

      // ✅ Include branchName in modify request too
      const res = await axios.put(`${server}/payment-entry`, {
        ...data,
        branchName: branchName, // ✅ Use the state value
        entryUser,
      });

      console.log("Modify response:", res.data);
      showNotification("success", "Record updated successfully ✏️");
      setRefetch(!refetch);
    } catch (error) {
      console.error(
        "Error modifying payment:",
        error.response?.data || error.message
      );
      showNotification("error", "Failed to modify record");
    }
  };

  const onSubmit = async (data) => {
    const matchedAccount = accounts.find(
      (account) =>
        account.accountCode.toUpperCase() === data.accountCode?.toUpperCase()
    );

    if (!matchedAccount || matchedAccount.modeType !== "normal") {
      showNotification(
        "error",
        "Payment entry allowed only for normal customers."
      );
      return;
    }

    const requiredFields = ["amount", "mode", "receiptType", "remarks"];
    const missingFields = requiredFields.filter(
      (field) => !data[field] || data[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      showNotification(
        "error",
        `Please fill the following fields: ${missingFields.join(", ")}`
      );
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const entryUser = user?.userId || user?.username || "Unknown";

      // ✅ Include branchName from the matched account
      const res = await axios.post(`${server}/payment-entry`, {
        ...data,
        customerName: matchedAccount.name, // ✅ Ensure customerName is sent
        branchName: matchedAccount.companyName, // ✅ Explicitly send branchName
        branchCode: matchedAccount.branch, // ✅ Ensure branchCode is sent
        entryUser,
      });

      const updatedLeftOverBalance =
        (leftOverBalance || 0) - Number(data.amount);
      const ledgerPayload = {
        accountCode: data.accountCode,
        customer: matchedAccount.name, // ✅ Use matched account name
        openingBalance,
        date: data.date,
        payment: data.mode,
        receivedAmount: Number(data.amount),
        debitAmount: Number(data.debitAmount) || 0,
        creditAmount: Number(data.creditAmount) || 0,
        operationRemark: data.remarks,
        awbNo: data.receiptNo,
        leftOverBalance: updatedLeftOverBalance,
        entryUser,
      };

      await axios.post(`${server}/ledger`, ledgerPayload);

      console.log("Payment API response:", res.data);
      showNotification("success", "Payment saved successfully ✅");
      setRefetch(!refetch);
    } catch (error) {
      console.error(
        "Error saving payment:",
        error.response?.data || error.message
      );
      showNotification("error", "Failed to save payment");
    } finally {
      handleRefresh();
    }
  };

  const fetchCustomerTotals = async (accountCode) => {
    if (!accountCode) return;

    try {
      const res = await axios.get(
        `${server}/payment-entry?accountCode=${accountCode}`
      );

      const summary = res.data.summary;

      setTotals({
        totalSales: summary?.totalSales?.toFixed(2) || 0,
        totalReceipt: summary?.totalReceipt?.toFixed(2) || 0,
        totalDebit: summary?.totalDebit?.toFixed(2) || 0,
        totalCredit: summary?.totalCredit?.toFixed(2) || 0,
      });
    } catch (error) {
      console.error("Error fetching customer totals:", error);
      setTotals({
        totalSales: 0,
        totalReceipt: 0,
        totalDebit: 0,
        totalCredit: 0,
      });
    }
  };

  const handleReceiptSearch = async (receiptNo) => {
    if (!receiptNo) return;

    console.log("🔍 Frontend: Searching for receipt:", receiptNo);

    try {
      const res = await axios.get(
        `${server}/payment-entry?receiptNo=${receiptNo}`
      );

      console.log("✅ API Response:", res.data);

      const payment = res.data.payment;
      const summary = res.data.summary;

      console.log("📊 Summary data:", summary);

      // ✅ Update totals state correctly
      setTotals({
        totalSales: summary?.totalSales || 0,
        totalReceipt: summary?.totalReceipt || 0,
        totalDebit: summary?.totalDebit || 0,
        totalCredit: summary?.totalCredit || 0,
      });

      setFetchedData(payment);

      if (payment) {
        const formattedDate = payment.date.includes("-")
          ? payment.date.split("-").reverse().join("/")
          : payment.date;

        setValue("date", formattedDate);
        setValue("accountCode", payment.accountCode);
        setValue("customerName", payment.customerName);
        setValue("branchCode", payment.branchCode);
        setValue("branchName", payment.branchName);
        setValue("amount", payment.amount);
        setValue("mode", payment.mode);
        setValue("chequeNo", payment.chequeNo);
        setValue("bankName", payment.bankName);
        setValue("receiptType", payment.receiptType);
        setValue("debitAmount", payment.debitAmount);
        setValue("creditAmount", payment.creditAmount);
        setValue("debitNo", payment.debitNo);
        setValue("creditNo", payment.creditNo);
        setValue("receiptNo", payment.receiptNo);
        setValue("remarks", payment.remarks);
        setValue("verifyRemarks", payment.verifyRemarks);

        setCustomerName(payment.customerName);
        setBranchCode(payment.branchCode);
        setBranchName(payment.branchName);
        setOpeningBalance(payment.openingBalance);
        setLeftOverBalance(payment.closingBalance);
      }
    } catch (error) {
      console.error(
        "❌ Payment not found:",
        error.response?.data || error.message
      );
      showNotification("error", "No payment record found!");
    }
  };

  // Update your existing useEffect to call fetchCustomerTotals
  useEffect(() => {
    const accountCode = watch("accountCode")?.toUpperCase();
    const matchedAccount = accounts.find(
      (account) => account.accountCode.toUpperCase() === accountCode
    );

    if (matchedAccount) {
      if ((matchedAccount.modeType || "").trim().toLowerCase() !== "normal") {
        showNotification(
          "error",
          "Payment entry is only allowed for normal customers."
        );
        setCustomerName("");
        setBranchCode("");
        setBranchName("");
        setOpeningBalance("");
        setLeftOverBalance("");
        setValue("accountCode", "");
        return;
      }

      setCustomerName(matchedAccount.name);
      setBranchCode(matchedAccount.branch);
      setBranchName(matchedAccount.companyName);
      setValue("branchName", matchedAccount.companyName);
      setOpeningBalance(matchedAccount.openingBalance);
      setLeftOverBalance(matchedAccount.leftOverBalance);

      // ✅ Fetch totals when account code is entered
      fetchCustomerTotals(accountCode);
    } else {
      setCustomerName(null);
      setBranchCode(null);
      setBranchName(null);
      setOpeningBalance(null);
      setLeftOverBalance(null);
      setTotals({
        totalSales: "",
        totalReceipt: "",
        totalDebit: "",
        totalCredit: "",
      });
    }
  }, [watch("accountCode"), accounts, setValue]);

  const handleRefresh = async () => {
    // reset form fields using react-hook-form reset()
    reset({
      accountCode: "",
      customerName: "",
      branchCode: "",
      branchName: "",
      amount: "",
      mode: "",
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
      receiptNo: "", // will set below
    });

    // reset local states
    setCustomerName("");
    setBranchName("");
    setBranchCode("");
    setOpeningBalance("");
    setLeftOverBalance("");
    setIsVerified(false);

    try {
      const res = await axios.get(`${server}/payment-entry/next-receipt`);
      setValue("receiptNo", res.data.nextReceipt); // assign next autogenerated receipt
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
        const res = await axios.get(`${server}/payment-entry/next-receipt`);
        setValue("receiptNo", res.data.nextReceipt);
        setValue("date", getTodayDDMMYYYY());
      } catch (error) {
        console.error(
          "Error fetching next receipt:",
          error.response?.data || error.message
        );
      }
    };

    fetchNextReceipt();
  }, [server, setValue]);

  const formatDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

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

  useEffect(() => {
    const code = watch("accountCode");
    if (code) {
      setValue("accountCode", code.toUpperCase(), { shouldValidate: true });
    }
  }, [watch("accountCode"), setValue]);

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
          title={`Payment Entry`}
          bulkUploadBtn="hidden"
          // codeListBtn="hidden"
          onRefresh={handleRefresh}
        />
        {/* Fullscreen Modal for Code List */}
        <PaymentReport
          isOpen={toggleCodeList}
          onClose={() => setToggleCodeList(false)}
          customerCode={watch("accountCode")} // Make sure this matches the prop name
          showNotification={showNotification}
          leftOverBalance={leftOverBalance || 0}
        />

        <div className="flex flex-row gap-6">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-3">
              <RedLabelHeading label={"Customer Details"} />
              <div className="flex flex-row gap-3">
                <div className="max-w-[150px]">
                  <InputBox
                    placeholder="Account Code"
                    register={register}
                    setValue={setValue}
                    resetFactor={PaymentReset}
                    value="accountCode"
                    initialValue={watch("accountCode")}
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

            <div className="flex flex-col gap-3">
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
                  options={[
                    "Cash",
                    "Cheque",
                    "DD",
                    "RTGS",
                    "NEFT",
                    "IMPS",
                    "Bank",
                    "Demand Draft",
                    "Overseas (COD)",
                    "Others",
                  ]}
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  title={`Mode`}
                  value={`mode`}
                  defaultValue={watch("mode")}
                  onChange={(val) => setValue("mode", val)}
                />
              </div>

              <div className="flex flex-col gap-3">
                <InputBox
                  placeholder="Cheque No."
                  register={register}
                  setValue={setValue}
                  resetFactor={PaymentReset}
                  value="chequeNo"
                  initialValue={chequeNoValue}
                />
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
                  value="date"
                  disabled
                  initialValue={watch("date")}
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
            <div className="flex flex-col gap-3">
              <RedLabelHeading label={"Summary"} />
              <div className="flex flex-col gap-3">
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
                  inputValue={leftOverBalance}
                />
                <div className="flex justify-center items-center w-full">
                  <div className="text-sm tracking-wide text-[#14532d] bg-[#dcfce7] text-center py-1 px-6 rounded w-full">
                    <h2>
                      {" "}
                      * Press{" "}
                      <span className="text-center font-bold mx-1">F1</span>
                      for Payment Report{" "}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <InputBox
              placeholder="Remarks"
              register={register}
              setValue={setValue}
              resetFactor={PaymentReset}
              value="remarks"
              initialValue={remarksValue}
            />
            <div className="w-[145px]">
              <SimpleButton name="Save" onClick={handleSubmit(onSubmit)} />
            </div>
          </div>

          <div className="flex flex-row gap-3">
            <InputBox
              placeholder="Verify Remarks"
              register={register}
              setValue={setValue}
              resetFactor={PaymentReset}
              value="verifyRemarks"
              initialValue={verifyRemarksValue}
            />
            <div className="className=w-[145px]">
              <SimpleButton name={`Verify`} onClick={handleVerifyUpdate} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-between items-center">
          <div className="w-[145px] ">
            {/* <OutlinedButtonRed label={`Close`} /> */}
          </div>

          <div className="flex gap-3">
            {/* <div
              className={
                !receiptNoValue || !customerName || !amountValue
                  ? "opacity-50 pointer-events-none"
                  : ""
              }
            >
              <OutlinedButtonRed label={`Modify`} onClick={handleModify} />
            </div> */}
            <div className="w-[145px]">
              <OutlinedButtonRed label={`New`} onClick={handleRefresh} />
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export default PaymentEntry;
