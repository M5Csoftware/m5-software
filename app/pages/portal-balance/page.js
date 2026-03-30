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

const PortalBalance = () => {
  const { register, setValue, reset, getValues, watch } = useForm();
  const { server, setToggleCodeList, toggleCodeList } = useContext(GlobalContext);

  const [loading, setLoading] = useState(false);       // only for Show button
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
          `${server}/customer-account?accountCode=${code.trim().toUpperCase()}`
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
        `${server}/customer-account?accountCode=${codeValue}`
      );

      if (!res.data) {
        showNotification("error", "Customer not found");
        return;
      }

      const name = res.data.name || res.data.companyName || "";
      // ✅ FIX: leftOverBalance is the actual field from the API
      const balance = res.data.leftOverBalance ?? res.data.portalBalance ?? res.data.balance ?? "0";

      console.log("💰 Full API Response:", res.data);
      console.log(`👤 Customer: ${name} | 💳 leftOverBalance raw: ${res.data.leftOverBalance} | Showing: ${balance}`);

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
        `${server}/customer-account?accountCode=${accountCode}`
      );
      if (res.data) {
          const name = res.data.name || res.data.companyName || rowData.name;
          const balance = res.data.leftOverBalance ?? res.data.portalBalance ?? res.data.balance ?? "0";

          console.log("💰 Full API Response (CodeList):", res.data);
          console.log(`👤 Customer: ${name} | 💳 leftOverBalance raw: ${res.data.leftOverBalance} | Showing: ${balance}`);

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
    []
  );

  return (
    <div className="flex flex-col gap-9" key={refreshKey}>
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
        onClickCodeListBtn={() => setToggleCodeList(true)}
      />

      <div className="flex flex-col gap-6">
        {/* Code + Name + Show */}
        <div className="flex gap-3">
          <div>
            <InputBox
              placeholder="Code"
              register={register}
              setValue={setValue}
              value="code"
              initialValue={code}
            />
          </div>

          <InputBox
            placeholder={fetchingName ? "Fetching..." : "Customer Name"}
            register={register}
            setValue={setValue}
            value="client"
            disabled={true}
            initialValue={client}
          />

          <div>
            <OutlinedButtonRed
              type="button"
              label={loading ? "Loading..." : "Show"}
              onClick={handleShowBalance}
              disabled={loading}
            />
          </div>
        </div>

        {/* Portal Balance + Clear */}
        <div className="flex gap-3">
          <div className="relative w-full">
            <input
              id="portalBalance"
              value={portalBalance || ""}
              readOnly
              autoComplete="off"
              className="border outline-none rounded-md h-8 px-4 py-2 w-full bg-green-100 border-green-400"
            />
            <label
              htmlFor="portalBalance"
              className={`absolute transition-all px-2 left-4 text-gray-400 ${
                portalBalance
                  ? "-top-2 text-xs z-10 font-semibold bg-white h-4"
                  : "top-1/2 -translate-y-1/2 text-sm"
              }`}
            >
              Portal Balance
            </label>
          </div>

          <div>
            <SimpleButton
              type="button"
              name="Clear"
              onClick={handleClear}
            />
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