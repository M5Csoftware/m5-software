"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import CodeList from "@/app/components/CodeList";
import React, { useState, useContext, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { CloseButton } from "@/app/components/CloseButton";
import NotificationFlag from "@/app/components/Notificationflag";

// 🔒 FALLBACK MOCK DATA - Only used if API completely fails
const FALLBACK_MOCK_DATA = [
  { accountCode: "CUST001", name: "John Doe Industries" },
  { accountCode: "CUST002", name: "Smith & Associates" },
  { accountCode: "CUST003", name: "ABC Corporation" },
  { accountCode: "CUST004", name: "XYZ Limited" },
  { accountCode: "CUST005", name: "Global Solutions Inc" },
  { accountCode: "CUST006", name: "Tech Innovations LLC" },
  { accountCode: "CUST007", name: "Modern Enterprises" },
  { accountCode: "CUST008", name: "Future Systems Inc" },
];

const PortalBalance = () => {
  const { register, setValue, reset, getValues, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiDataLoaded, setApiDataLoaded] = useState(false);
  const [apiError, setApiError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Start with empty array, force API fetch
  const [customerData, setCustomerData] = useState([]);

  const { setToggleCodeList, toggleCodeList } = useContext(GlobalContext);

  // watch values so InputBox shows updated data
  const code = watch("code");
  const client = watch("client");
  const portalBalance = watch("portalBalance");
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Fetch customer name immediately when code changes
  useEffect(() => {
    const fetchCustomerName = async (codeValue) => {
      if (!codeValue || codeValue.trim() === "") {
        setValue("client", "");
        return;
      }

      try {
        let response;
        try {
          response = await axios.get(
            `https://m5c-server.vercel.app/api/customer-account?accountCode=${codeValue.trim()}`,
            { timeout: 5000 }
          );
        } catch (axiosErr) {
          const fetchResponse = await fetch(
            `https://m5c-server.vercel.app/api/customer-account?accountCode=${codeValue.trim()}`
          );
          if (!fetchResponse.ok) {
            throw new Error(`HTTP error! status: ${fetchResponse.status}`);
          }
          response = { data: await fetchResponse.json() };
        }

        if (response.data) {
          const name = response.data.name || response.data.customer_name || "";
          setValue("client", name);
          showNotification("success", "Customer name fetched");
        } else {
          setValue("client", "");
        }
      } catch (err) {
        console.error("Error fetching customer name:", err);
        showNotification("error", "Failed to fetch customer name");
        setValue("client", "");
      }
    };

    // Debounce the API call to avoid too many requests
    const timeoutId = setTimeout(() => {
      if (code) {
        fetchCustomerName(code);
      }
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timeoutId);
  }, [code, setValue]);

  // Enhanced API fetch with multiple retry strategies
  const fetchCustomerAccounts = async (retryAttempt = 0) => {
    try {
      console.log(`🌐 API Fetch Attempt ${retryAttempt + 1}...`);
      setLoading(true);
      setApiError("");

      // Multiple API call strategies
      const apiStrategies = [
        // Strategy 1: Standard axios call with longer timeout
        async () => {
          const response = await axios.get(
            "https://m5c-server.vercel.app/api/customer-account",
            {
              timeout: 10000,
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            }
          );
          return response.data;
        },

        // Strategy 2: Fetch API as fallback
        async () => {
          const response = await fetch(
            "https://m5c-server.vercel.app/api/customer-account",
            {
              method: "GET",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          return await response.json();
        },

        // Strategy 3: Try with different endpoint format (just in case)
        async () => {
          const response = await axios.get(
            "https://m5c-server.vercel.app/api/customer-account/",
            {
              timeout: 15000,
              headers: {
                Accept: "application/json",
              },
            }
          );
          return response.data;
        },
      ];

      let apiData = null;
      let strategyUsed = 0;

      // Try each strategy until one works
      for (let i = 0; i < apiStrategies.length; i++) {
        try {
          console.log(`📡 Trying API strategy ${i + 1}...`);
          apiData = await apiStrategies[i]();
          strategyUsed = i + 1;
          break;
        } catch (strategyError) {
          console.log(`❌ Strategy ${i + 1} failed:`, strategyError.message);
          if (i === apiStrategies.length - 1) {
            throw strategyError;
          }
        }
      }

      console.log(`✅ API Strategy ${strategyUsed} succeeded!`);
      console.log("📡 Raw API response:", apiData);

      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        // Ensure data structure matches exactly what we need
        const mappedData = apiData.map((item) => {
          // Handle different possible field names from your DB
          const accountCode =
            item.accountCode ||
            item.account_code ||
            item.code ||
            item.id ||
            `UNKNOWN_${Math.random().toString(36).substr(2, 9)}`;
          const name =
            item.name ||
            item.customer_name ||
            item.customerName ||
            item.title ||
            item.companyName ||
            "Unknown Customer";

          return {
            accountCode: String(accountCode),
            name: String(name),
          };
        });

        console.log("✅ Successfully mapped API data:", mappedData);
        setCustomerData(mappedData);
        showNotification("success", "Customer accounts loaded");
        setApiDataLoaded(true);
        setRetryCount(0);
        setApiError("");
      } else {
        throw new Error("API returned empty or invalid data structure");
      }
    } catch (err) {
      console.error(`❌ API call failed (attempt ${retryAttempt + 1}):`, err);
      setApiError(err.message);
      showNotification("error", "API failed. Using fallback data");

      // Retry logic - up to 3 attempts
      if (retryAttempt < 2) {
        console.log(`🔄 Retrying in 2 seconds... (${retryAttempt + 1}/3)`);
        setRetryCount(retryAttempt + 1);
        setTimeout(() => {
          fetchCustomerAccounts(retryAttempt + 1);
        }, 2000);
        return;
      }

      // All retries failed, use fallback data
      console.log("🚨 All API attempts failed, using fallback mock data");
      setCustomerData([...FALLBACK_MOCK_DATA]);
      setApiDataLoaded(false);
      setRetryCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Initial API call on mount
  useEffect(() => {
    fetchCustomerAccounts();
  }, []);

  // Ensure we always have some data
  useEffect(() => {
    if (customerData.length === 0 && !loading) {
      console.log("🚨 No data available, loading fallback");
      setCustomerData([...FALLBACK_MOCK_DATA]);
    }
  }, [customerData, loading]);

  const handleShowBalance = async (e) => {
    e.preventDefault();
    const codeValue = getValues("code")?.trim();
    const clientName = getValues("client")?.trim();

    if (!codeValue) {
      setError("Please enter a customer code");
      showNotification("error", "Enter a customer code");

      return;
    }

    if (!clientName) {
      setError("Customer name not found. Please check the customer code.");
      showNotification("error", "Customer name not found");

      return;
    }

    try {
      setLoading(true);
      setError("");

      // Try both axios and fetch for balance API - only fetch balance, name is already set
      let response;
      try {
        response = await axios.get(
          `https://m5c-server.vercel.app/api/customer-account?accountCode=${codeValue}`,
          { timeout: 8000 }
        );
      } catch (axiosErr) {
        console.log("Axios failed, trying fetch...");
        const fetchResponse = await fetch(
          `https://m5c-server.vercel.app/api/customer-account?accountCode=${codeValue}`
        );
        if (!fetchResponse.ok) {
          throw new Error(`HTTP error! status: ${fetchResponse.status}`);
        }
        response = { data: await fetchResponse.json() };
      }

      if (!response.data) {
        setError("No balance data found");
        setValue("portalBalance", "");
        return;
      }

      const balance =
        response.data.portalBalance ||
        response.data.left_over_balance ||
        response.data.balance ||
        "0";

      // Only set portal balance - customer name is already fetched
      setValue("portalBalance", balance);
      showNotification("success", "Balance fetched");
    } catch (err) {
      console.error("Error fetching balance:", err);
      if (err.response?.status === 404) {
        setError(`Balance not found for code: ${codeValue}`);
        showNotification("error", "Failed to fetch balance");
      } else {
        setError(
          `Failed to fetch balance: ${err.response?.statusText || err.message}`
        );
      }
      setValue("portalBalance", "");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log("🔄 Refresh clicked - Force refetch from API");
    reset();
    setError("");
    setApiError("");
    setRefreshKey((prev) => prev + 1);
    setToggleCodeList(false);

    // Force new API call
    setApiDataLoaded(false);
    setCustomerData([]);
    showNotification("success", "Refreshed");

    fetchCustomerAccounts();
  };

  const handleClear = (e) => {
    e.preventDefault();
    reset();
    setError("");
  };

  const handleAction = async (action, rowData) => {
    console.log("🎯 Handle action:", action, rowData);

    if (action === "edit") {
      const accountCode = rowData.accountCode || rowData.code;
      setValue("code", accountCode);
      setValue("client", rowData.name);
      setToggleCodeList(false);

      // Auto-fetch balance when editing
      if (accountCode) {
        try {
          setLoading(true);
          let response;
          try {
            response = await axios.get(
              `https://m5c-server.vercel.app/api/customer-account?accountCode=${accountCode}`
            );
          } catch (axiosErr) {
            const fetchResponse = await fetch(
              `https://m5c-server.vercel.app/api/customer-account?accountCode=${accountCode}`
            );
            response = { data: await fetchResponse.json() };
          }

          if (response.data) {
            // Set both name and balance from API response
            setValue(
              "client",
              response.data.name || response.data.customer_name || rowData.name
            );
            setValue(
              "portalBalance",
              response.data.leftOverBalance || response.data.balance || "0"
            );
          }
          showNotification("success", "Customer loaded");
        } catch (err) {
          console.error("Error fetching balance:", err);
          setError("Failed to fetch balance for selected customer");
          showNotification("error", "Failed to load customer data");
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const columns = useMemo(
    () => [
      { key: "accountCode", label: "Account Code" },
      { key: "name", label: "Customer Name" },
    ],
    []
  );

  const handleCodeListClick = () => {
    console.log("🎯 CodeList button clicked!");

    // If no real data loaded, try to fetch again
    if (!apiDataLoaded && customerData.length <= FALLBACK_MOCK_DATA.length) {
      console.log("🔄 No API data loaded, attempting fresh fetch...");
      fetchCustomerAccounts();
    }

    setToggleCodeList(true);
  };

  // Manual API refresh function
  const handleForceApiRefresh = () => {
    console.log("🔄 Force API refresh requested");
    setApiDataLoaded(false);
    setCustomerData([]);
    setApiError("");
    fetchCustomerAccounts();
  };

  return (
    <div className="flex flex-col gap-9" key={refreshKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      {/* CSS for green portal balance input */}
      <style jsx>{`
        .green-portal-input {
          background-color: #bbf7d0 !important;
          border-color: #4ade80 !important;
          color: inherit !important;
        }
        .green-portal-label {
          color: #979797 !important;
        }
      `}</style>

      <Heading
        title={`Portal Balance`}
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
        onClickCodeListBtn={handleCodeListClick}
      />

      <div className="flex flex-col gap-6">
        {/* API Error Display */}
        {apiError && (
          <div className="text-orange-600 text-sm bg-orange-50 p-3 rounded-md border border-orange-200">
            <strong>API Connection Issue:</strong> {apiError}
            {retryCount > 0 && (
              <span className="ml-2">Retrying... ({retryCount}/3)</span>
            )}
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <div>
            <InputBox
              placeholder="Code"
              register={register}
              setValue={setValue}
              value="code"
              disabled={loading}
              initialValue={code}
            />
          </div>

          {/* Fixed Customer Name field - read-only */}
          <InputBox
            placeholder="Customer Name"
            register={register}
            setValue={setValue}
            value="client"
            disabled={true} // Fixed/read-only
            className="bg-gray-100 cursor-not-allowed" // Visual indication it's read-only
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

        <div className="flex gap-3">
          <div className="relative w-full">
            <input
              {...register("portalBalance")}
              value={portalBalance || ""}
              id="portalBalance"
              onChange={(e) => setValue("portalBalance", e.target.value)}
              disabled
              autoComplete="off"
              className="border outline-none rounded-md h-8 px-4 py-2 w-full green-portal-input"
            />
            <label
              htmlFor="portalBalance"
              className={`absolute transition-all px-2 left-4 green-portal-label ${
                portalBalance
                  ? "-top-2 text-xs z-10 pb-0 font-semibold bg-white h-4"
                  : "top-1/2 -translate-y-1/2 text-sm"
              }`}
            >
              Portal Balance
            </label>
          </div>
          <div>
            <SimpleButton
              type="button"
              name={"Clear"}
              onClick={handleClear}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-between">
          {/* <CloseButton tabKey="PortalBalance" /> */}
        </div>
      </div>

      {/* CodeList Component */}
      <CodeList
        handleAction={handleAction}
        data={customerData}
        columns={columns}
        name={
          apiDataLoaded ? "Customer Accounts" : "Customer Accounts (Fallback)"
        }
      />
    </div>
  );
};

export default PortalBalance;
