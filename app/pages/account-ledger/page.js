"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import {
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelTransparent,
} from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithSorting } from "@/app/components/Table";
import { exportAccountLedgerData } from "@/app/lib/exportData";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { X } from "lucide-react";
import NotificationFlag from "@/app/components/Notificationflag";

function AccountLedger() {
  const { handleSubmit, register, setValue, reset, getValues, watch } =
    useForm();
  const [isChecked, setIsChecked] = useState(true);
  const [rowData, setRowData] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [accountLedger, setAccountLedger] = useState([]);
  const { server } = useContext(GlobalContext);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [AccountReset, setAccountReset] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("en-GB"); // DD/MM/YYYY
  };

  const columns = useMemo(
    () => [
      { key: "SrNo", label: "Sr No" },
      { key: "AwbNo", label: "AWB No" },
      { key: "SaleType", label: "Type" },
      { key: "Date", label: "Date" },
      { key: "code", label: "Customer Code" },
      { key: "Consignee", label: "Consignee" },
      { key: "Forwarder", label: "Forwarder" },
      { key: "ForwarderNo", label: "Forwarder No" },
      { key: "RunNo", label: "Run No" },
      { key: "Sector", label: "Sector" },
      { key: "Destination", label: "Destination" },
      { key: "City", label: "City" },
      { key: "ZipCode", label: "Zip Code" },
      { key: "Service", label: "Service" },
      { key: "Pcs", label: "Pcs" },
      { key: "ActualWeight", label: "Actual Weight" },
      { key: "VolWeight", label: "Vol Weight" },
      { key: "ChgWeight", label: "Chg Weight" },
      { key: "SaleAmount", label: "Basic Amount" },
      { key: "DiscountPerKg", label: "Discount Per Kg" },
      { key: "DiscountAmount", label: "Discount Amount" },
      { key: "DiscountTotal", label: "Discount Total" },
      { key: "RateHike", label: "Rate Hike" },
      { key: "SGST", label: "SGST" },
      { key: "CGST", label: "CGST" },
      { key: "IGST", label: "IGST" },
      { key: "Mischg", label: "Misc Charges" },
      { key: "Fuel", label: "Fuel" },
      { key: "NonTaxable", label: "Non-Taxable" },
      { key: "GrandTotal", label: "Grand Total" },
      { key: "RcvAmount", label: "Received Amount" },
      { key: "DebitAmount", label: "Debit Amount" },
      { key: "CreditAmount", label: "Credit Amount" },
      { key: "Balance", label: "Balance" },
      { key: "Remark", label: "Remark" },
      { key: "ReferenceNo", label: "ReferenceNo." },
      { key: "RemainingBalance", label: "RemainingBalance." },
    ],
    []
  );

  // New function to apply filters
  const applyFilters = async () => {
    const fromDate = getValues("from");
    const toDate = getValues("to");

    try {
      const res = await axios.get(`${server}/ledger`, {
        params: {
          accountCode: getValues("code"),
          openingBalance,
          from: fromDate,
          to: toDate,
          includeHold: isChecked,
        },
      });

      const { entries, totalBalance } = res.data;
      setRowData(entries);
      setTotalBalance(totalBalance);
    } catch (error) {
      console.error("Error applying filters:", error);
      showNotification("error", "Failed to apply filters");
    }
  };

  const handleFilterData = () => {
    applyFilters();
    showNotification("success", "Filter applied successfully");
  };

  // Format data for display (with formatted dates)
  const formattedRowData = useMemo(
    () =>
      rowData.map((item) => ({
        ...item,
        Date: item.originalDate ? formatDate(item.originalDate) : "",
      })),
    [rowData]
  );

  const handleRefresh = () => {
    reset(); // clears all fields
    setAccountReset(!AccountReset);
    setCustomerName(""); // reset dependent fields
    setOpeningBalance("");
    setRowData([]);
    setTotalBalance(0);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const fetchCustomerInfo = async (code) => {
    // Don't fetch if code is empty
    if (!code || code.trim() === "") {
      setCustomerName("");
      setOpeningBalance("");
      setValue("email", "");
      return;
    }

    console.log("🔍 Fetching customer info for code:", code);
    console.log("🌐 Server URL:", server);

    try {
      const url = `${server}/customer-account?accountCode=${code}`;
      console.log("📡 Making request to:", url);

      const response = await axios.get(url);

      console.log("✅ API Response:", response);
      console.log("📦 Response data:", response.data);
      console.log("👤 Customer Name:", response.data.customerName);
      console.log("📧 Email:", response.data.email);
      console.log("💰 Opening Balance:", response.data.openingBalance);

      // Set the values based on the API response
      const name = response.data.name || "";
      const email = response.data.email || "";
      const balance = response.data.openingBalance || "";

      console.log("🎯 Setting customerName to:", name);
      console.log("🎯 Setting email to:", email);
      console.log("🎯 Setting openingBalance to:", balance);

      setCustomerName(name);
      setValue("email", email);
      setOpeningBalance(balance);

      if (!name) {
        showNotification("warning", "Customer found but name is empty");
      }
    } catch (error) {
      console.error("❌ Error fetching customer:", error);
      console.error("❌ Error response:", error.response);
      console.error("❌ Error message:", error.message);

      setCustomerName("");
      setOpeningBalance("");
      setValue("email", "");
      showNotification(
        "error",
        `Customer not found: ${error.response?.data?.error || error.message}`
      );
    }
  };

  // Watch the form value directly instead of relying on onChange
  const watchedCode = watch("code");

  // --- Debounced fetchCustomerInfo ---
  useEffect(() => {
    console.log("🔄 Debounce effect triggered. watchedCode:", watchedCode);

    // Only run if code has a value
    if (!watchedCode || watchedCode.trim() === "") {
      console.log("⏭️ Skipping fetch - empty code");
      // Clear fields when code is empty
      setCustomerName("");
      setOpeningBalance("");
      setValue("email", "");
      return;
    }

    console.log("⏰ Setting up debounce timer for code:", watchedCode);
    const delayDebounce = setTimeout(() => {
      console.log("⏱️ Debounce timer expired - fetching now");
      fetchCustomerInfo(watchedCode);
    }, 500); // wait 0.5s after typing stops

    return () => {
      console.log("🧹 Cleaning up debounce timer");
      clearTimeout(delayDebounce);
    };
  }, [watchedCode, server]); // Watch the form value directly

  useEffect(() => {
    const totalOutstanding = () => {
      const OutstandingData = { ...rowData, totalBalance };
      console.log("Altaf:", OutstandingData);
    };
    if (rowData) {
      totalOutstanding();
    }
  }, [totalBalance, rowData]);

  useEffect(() => {
    if (!getValues("code")) return;
    applyFilters();
  }, [isChecked]);

  return (
    <form
      onSubmit={handleSubmit((data) => console.log(data))}
      className="flex flex-col gap-3"
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`Account Ledger`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => setIsFullscreen(true)}
      />
      <div className="flex flex-col gap-3 mt-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <InputBox
              placeholder="Code"
              register={register}
              setValue={setValue}
              resetFactor={AccountReset}
              name="code"
              value="code"
            />
            <DummyInputBoxWithLabelTransparent
              register={register}
              setValue={setValue}
              value={"name"}
              label={"Customer Name"}
              watch={watch}
              inputValue={customerName}
              resetFactor={AccountReset}
            />
            <InputBox
              placeholder={"Opening Balance"}
              register={register}
              setValue={setValue}
              disabled
              value={"openingBalance"}
              initialValue={openingBalance}
              resetFactor={AccountReset}
            />
            <DummyInputBoxWithLabelDarkGray
              placeholder={""}
              label={`Email ID`}
              register={register}
              setValue={setValue}
              value={"email"}
              inputValue={watch("email")}
            />
          </div>

          <div className="flex gap-3">
            <DateInputBox
              register={register}
              setValue={setValue}
              value={`from`}
              placeholder="From"
              resetFactor={AccountReset}
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value={`to`}
              placeholder="To"
              resetFactor={AccountReset}
            />
            <div>
              <SimpleButton onClick={handleFilterData} name={`Show`} />
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <RedCheckbox
            register={register}
            setValue={setValue}
            label={`With Hold AWB Number`}
            id={`withHoldAWBNo`}
            isChecked={isChecked}
            setChecked={(val) => {
              console.log("Checkbox changed to:", val);
              setIsChecked(val);
              setValue("withHoldAWBNo", val);
            }}
          />
        </div>
      </div>
      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          name={`accountLedger`}
          columns={columns}
          rowData={formattedRowData}
          className={`rounded-b-none h-[35vh] border-b-0`}
        />
        <div className=" flex items-center justify-end px-10 text-sm font-medium rounded rounded-t-none h-8 bg-gray-200 border-[1px] border-battleship-gray border-t-0">
          <span className="font-semibold text-sm">
            Balance : {totalBalance}{" "}
          </span>
        </div>
        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Account Ledger</h2>
              <button onClick={() => setIsFullscreen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <TableWithSorting
                register={register}
                setValue={setValue}
                name="accountLedgerFullscreen"
                columns={columns}
                rowData={formattedRowData}
                className="h-full w-full"
              />
              <div>
                <span>Balance: {totalBalance} </span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex  justify-between">
        <div className="w-36">
          {/* <OutlinedButtonRed label={`Close`} /> */}
        </div>
        <div>
          <SimpleButton
            onClick={() => {
              // Create clean data without internal properties
              const cleanRowData = rowData.map((row) => {
                const { isHold, originalDate, type, ...cleanRow } = row;
                return cleanRow;
              });

              exportAccountLedgerData(
                cleanRowData,
                getValues("code"),
                openingBalance,
                totalBalance
              );
            }}
            name={`Download`}
          />
        </div>
      </div>
    </form>
  );
}

export default AccountLedger;
