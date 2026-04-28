"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import CodeList from "@/app/components/CodeList";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";
import { Wallet, Search, RotateCcw, Trash2, IndianRupee } from "lucide-react";

const PortalBalance = () => {
  const { register, setValue, reset, getValues, watch } = useForm();
  const { server, setToggleCodeList, toggleCodeList } =
    useContext(GlobalContext);

  const [loading, setLoading] = useState(false); // only for Show button
  const [fetchingName, setFetchingName] = useState(false); // silent background fetch
  const [customerData, setCustomerData] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const code = watch("code");
  const client = watch("client");
  const portalBalance = watch("portalBalance");

  // ─── Fetch all customer accounts for CodeList ───────────────────────────────
  const fetchCustomerAccounts = async () => {
    try {
      const res = await axios.get(`${server}/customer-account`, {
        params: { page: 1, limit: 1000 },
      });

      console.log("📦 Raw customer-account API response:", res.data);

      // Handle all possible response shapes
      let raw = [];
      if (Array.isArray(res.data)) {
        // Shape: []
        raw = res.data;
      } else if (Array.isArray(res.data?.data)) {
        // Shape: { data: [], pagination: {} }
        raw = res.data.data;
      } else if (res.data && typeof res.data === "object") {
        // Shape: single object — wrap it
        raw = [res.data];
      }

      console.log(`✅ Extracted ${raw.length} records`);

      const mapped = raw.map((item) => ({
        accountCode: item.accountCode || "",
        name: item.name || item.companyName || "",
      }));

      setCustomerData(mapped);
    } catch (err) {
      console.error("Failed to fetch customer accounts:", err.message);
      showNotification("error", "Failed to load customer accounts");
    }
  };

  useEffect(() => {
    if (server) fetchCustomerAccounts();
  }, [server]);

  // ─── Auto-fetch customer name when code changes ──────────────────────────────
  useEffect(() => {
    if (!code || code.trim().length < 2) {
      setValue("client", "");
      setValue("portalBalance", "");
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setFetchingName(true);
        const res = await axios.get(
          `${server}/customer-account?accountCode=${code.trim().toUpperCase()}`,
        );
        if (res.data) {
          setValue("client", res.data.name || res.data.companyName || "");
        } else {
          setValue("client", "");
        }
      } catch {
        setValue("client", "");
      } finally {
        setFetchingName(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [code, server]);

  // ─── Show Balance button ─────────────────────────────────────────────────────
  const handleShowBalance = async (e) => {
    e.preventDefault();
    const codeValue = getValues("code")?.trim().toUpperCase();

    if (!codeValue) return showNotification("error", "Enter a customer code");

    try {
      setLoading(true);
      const res = await axios.get(
        `${server}/customer-account?accountCode=${codeValue}`,
      );

      if (!res.data) {
        showNotification("error", "Customer not found");
        return;
      }

      const name = res.data.name || res.data.companyName || "";
      // ✅ FIX: leftOverBalance is the actual field from the API
      const balance =
        res.data.leftOverBalance ??
        res.data.portalBalance ??
        res.data.balance ??
        "0";

      console.log("💰 Full API Response:", res.data);
      console.log(
        `👤 Customer: ${name} | 💳 leftOverBalance raw: ${res.data.leftOverBalance} | Showing: ${balance}`,
      );

      setValue("client", name);
      setValue("portalBalance", String(balance));
      showNotification("success", "Balance fetched");
    } catch (err) {
      console.error("Error fetching balance:", err.message);
      showNotification("error", "Failed to fetch balance");
      setValue("portalBalance", "");
    } finally {
      setLoading(false);
    }
  };

  // ─── CodeList row click ──────────────────────────────────────────────────────
  const handleAction = async (action, rowData) => {
    if (action !== "edit") return;

    const accountCode = rowData.accountCode || rowData.code;
    setValue("code", accountCode);
    setValue("client", rowData.name || "");
    setToggleCodeList(false);

    try {
      setFetchingName(true);
      const res = await axios.get(
        `${server}/customer-account?accountCode=${accountCode}`,
      );
      if (res.data) {
        const name = res.data.name || res.data.companyName || rowData.name;
        const balance =
          res.data.leftOverBalance ??
          res.data.portalBalance ??
          res.data.balance ??
          "0";

        console.log("💰 Full API Response (CodeList):", res.data);
        console.log(
          `👤 Customer: ${name} | 💳 leftOverBalance raw: ${res.data.leftOverBalance} | Showing: ${balance}`,
        );

        setValue("client", name);
        setValue("portalBalance", String(balance));
        showNotification("success", "Customer loaded");
      }
    } catch (err) {
      console.error("Error loading customer:", err.message);
      showNotification("error", "Failed to load customer data");
    } finally {
      setFetchingName(false);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();

    if (e.target.tagName === "BUTTON") {
      e.target.click();
      return;
    }

    const container = e.currentTarget;
    const inputs = Array.from(
      container.querySelectorAll(
        'input:not([disabled]):not([readonly]):not([type="checkbox"])',
      ),
    );
    const currentIndex = inputs.indexOf(e.target);

    if (currentIndex !== -1 && currentIndex < inputs.length - 1) {
      inputs[currentIndex + 1].focus();
    } else {
      // Last input → trigger Show Balance
      handleShowBalance(e);
    }
  };

  // ─── Refresh ─────────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    reset();
    setCustomerData([]);
    setRefreshKey((prev) => prev + 1);
    setToggleCodeList(false);
    fetchCustomerAccounts();
    showNotification("success", "Refreshed");
  };

  const handleClear = (e) => {
    e.preventDefault();
    reset();
  };

  const columns = useMemo(
    () => [
      { key: "accountCode", label: "Account Code" },
      { key: "name", label: "Customer Name" },
    ],
    [],
  );

  return (
    <div
      className="flex flex-col gap-9"
      key={refreshKey}
      onKeyDown={handleKeyDown}
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading
        title="Portal Balance"
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
        onClickCodeList={() => setToggleCodeList(true)}
      />

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Section: Inputs & Actions */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <InputBox
                    placeholder="Customer Code"
                    register={register}
                    setValue={setValue}
                    value="code"
                    initialValue={code}
                  />
                </div>
                <div className="w-32">
                  <OutlinedButtonRed
                    type="button"
                    label={loading ? "Loading..." : "Search"}
                    onClick={handleShowBalance}
                    disabled={loading}
                    className="h-8 !px-4"
                  />
                </div>
              </div>

              <div className="w-full">
                <InputBox
                  placeholder={fetchingName ? "Fetching Name..." : "Customer Name"}
                  register={register}
                  setValue={setValue}
                  value="client"
                  disabled={true}
                  initialValue={client}
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-2 text-gray-500 hover:text-red transition-colors text-sm font-medium"
              >
                <Trash2 size={16} />
                Clear Form
              </button>
            </div>
          </div>

          {/* Right Section: Balance Display */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 flex flex-col justify-center gap-2 min-h-[120px] shadow-md text-white">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Wallet size={80} />
            </div>
            
            <div className="flex flex-col">
              <span className="text-emerald-50 text-xs font-medium tracking-wide uppercase opacity-80">Current Portal Balance</span>
              <div className="flex items-center gap-1.5 mt-1">
                <IndianRupee size={20} className="text-emerald-100" />
                <span className="text-3xl font-bold tracking-tight">
                  {portalBalance ? parseFloat(portalBalance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CodeList */}
      <CodeList
        handleAction={handleAction}
        data={customerData}
        columns={columns}
        name="Customer Accounts"
      />
    </div>
  );
};

export default PortalBalance;
