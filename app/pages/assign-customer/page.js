"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import {
  LabeledDropdown,
  MultiSelectDropdown,
} from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { SearchInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import BulkUploadModal from "@/app/components/BulkUploadModal";

const AssignCustomer = () => {
  const { register, setValue, watch } = useForm();
  const [demoRadio, setDemoRadio] = useState("Assign Target");
  const [employee, setEmployee] = useState({});
  const [citiesAssigned, setCitiesAssigned] = useState([]);
  const [customersAssigned, setCustomersAssigned] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCities, setSelectedCities] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allCities, setAllCities] = useState({}); // { Maharashtra: ['Mumbai', 'Pune'], ... }
  const [states, setStates] = useState([]); // list of all states

  const [userIdState, setUserIdState] = useState("");
  const [filteredCities, setFilteredCities] = useState([]);
  const [salePersons, setSalePersons] = useState([]);
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "success", // "success" or "error"
    onRetry: null,
  });
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toLocaleString("default", { month: "long", year: "numeric" })
  );
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const [removedCustomers, setRemovedCustomers] = useState([]); // track deleted customers
  const { server } = useContext(GlobalContext);
  const userId = watch("userId");

  const showNotification = (message, type = "success", onRetry = null) => {
    setNotification({
      visible: true,
      message,
      type,
      onRetry,
    });
  };

  const getMonthString = (offset = 0) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };

  const handleRadioChange = (value) => {
    setDemoRadio(value);
    let converted = "";
    if (value === "Assign Customer") converted = "Assign Customer";
    else if (value === "Assign Target") converted = "Assign Target";
  };

  const handleRefresh = () => {
    // Clear RHF fields
    setValue("stateAssigned", "");
    setValue("cityAssigned", "");
    setValue("customerAccountCode", "");
    setValue("customersAssigned", "[]");
    setValue("citiesAssigned", "");

    // Reset dependent UI state
    setEmployee({});
    setCitiesAssigned([]);
    setCustomersAssigned([]);
    setSelectedCities([]);
    setFilteredCities([]);
    setSearchQuery("");

    setRefreshKey((prev) => prev + 1); // For controlled InputBox components if needed
    fetchAllSalePersons();
  };

  const Chip = ({ label, onDelete, disabled = false }) => (
    <div
      className={`flex items-center bg-misty-rose text-sm px-2 rounded-md shadow-sm mr-2 mb-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <span className="mr-1 text-eerie-black text-md tracking-wide">
        {label}
      </span>
      {!disabled && (
        <button
          type="button"
          onClick={onDelete}
          className="text-rose-600 hover:text-rose-500 font-medium text-lg"
        >
          ×
        </button>
      )}
    </div>
  );

  // Fetch customer details by account code
  const fetchCustomerDetails = async (accountCode) => {
    try {
      const response = await axios.get(
        `${server}/assign-customer/sales-target`,
        {
          params: { accountCode, month: selectedMonth },
        }
      );

      // Ensure we get a valid object with a name
      const customer = response.data;
      const name =
        customer.name?.trim() ||
        customer.customerName?.trim() ||
        customer.userName?.trim() ||
        accountCode; // fallback

      return { accountCode, name };
    } catch (err) {
      console.error("Failed to fetch customer details:", err);
      return { accountCode, name: accountCode }; // fallback
    }
  };

  // just add to local state
  const handleAddCity = async () => {
    const state = (watch("stateAssigned") || "").trim();
    if (!state || !selectedCities.length) {
      showNotification(
        "Please select a state and at least 1 city first",
        "error"
      );
      return;
    }

    try {
      const updatedCities = Array.from(
        new Set([...citiesAssigned, ...selectedCities])
      );
      setCitiesAssigned(updatedCities);
      setValue("citiesAssigned", updatedCities.join(", "));

      let newCustomers = [...customersAssigned];
      for (const city of selectedCities) {
        const res = await axios.get(`${server}/assign-customer`, {
          params: { state, city },
        });
        const customers = res.data || [];
        customers.forEach((cust) => {
          if (!newCustomers.some((c) => c.accountCode === cust.accountCode)) {
            newCustomers.push({
              accountCode: cust.accountCode,
              name:
                cust.name ||
                cust.customerName ||
                cust.userName ||
                cust.accountCode,
            });
          }
        });
      }

      setCustomersAssigned(newCustomers);
      setValue("customersAssigned", JSON.stringify(newCustomers));
      setSelectedCities([]);
      showNotification(
        "Cities and their customers added successfully",
        "success"
      );
    } catch (err) {
      console.error("Failed to add cities/customers:", err);
      showNotification("Failed to add cities/customers", "error");
    }
  };

  const handleDeleteCustomer = (accountCode) => {
    setCustomersAssigned((prev) => {
      const updated = prev.filter((c) => c.accountCode !== accountCode);
      setValue("customersAssigned", JSON.stringify(updated));
      return updated;
    });

    setRemovedCustomers((prev) => [...prev, accountCode]);
    showNotification("Customer removed successfully", "success");
  };

  const handleDeleteCity = (city) => {
    setCitiesAssigned((prev) => prev.filter((c) => c !== city));
    showNotification("City removed successfully", "success");
  };

  const handleAddCustomer = async () => {
    const accountCode = watch("customerAccountCode")?.trim();
    if (!accountCode) {
      showNotification("Please enter a Customer Account Code", "error");
      return;
    }

    if (customersAssigned.some((c) => c.accountCode === accountCode)) {
      setValue("customerAccountCode", "");
      showNotification("Customer already added", "error");
      return;
    }

    try {
      const res = await axios.get(`${server}/assign-customer`, {
        params: { accountCode },
      });
      const customer = res.data;
      const name =
        customer.name ||
        customer.customerName ||
        customer.userName ||
        accountCode;

      const updatedCustomers = [...customersAssigned, { accountCode, name }];
      setCustomersAssigned(updatedCustomers);
      setValue("customersAssigned", JSON.stringify(updatedCustomers));
      setValue("customerAccountCode", "");

      showNotification(`Customer "${name}" added successfully`, "success");
    } catch (err) {
      console.error("Failed to fetch customer details:", err);
      showNotification("Customer not found", "error");
    }
  };

  const handleFinalAssign = async (e) => {
    e.preventDefault();

    if (!userId || !employee?.userName) {
      showNotification("Please select a valid User ID", "error");
      return;
    }

    try {
      // Prepare payload
      const payload = {
        userId: employee.userId,
        userName: employee.userName,
        stateAssigned: watch("stateAssigned") || "",
        cities: citiesAssigned,
        addCustomers: customersAssigned.map((c) => c.accountCode) || [],
        removeCustomers: removedCustomers, // <--- send removed customers
        month: selectedMonth.replace(" ", "-"),
      };

      await axios.put(`${server}/assign-customer`, payload);

      showNotification("Assignment Successful!", "success");

      // Reset removedCustomers tracker after successful save
      setRemovedCustomers([]);

      // Refresh local assigned data
      await fetchAssignedData();
    } catch (err) {
      console.error("Assignment failed:", err);
      showNotification("Assignment failed. Check console.", "error");
    }
  };

  const fetchSalePersons = async (query) => {
    if (!query) return setSalePersons([]);
    console.log("🔍 calling API:", `${server}/assign-customer?q=${query}`);
    try {
      const res = await axios.get(`${server}/assign-customer`, {
        params: { q: query },
      });
      console.log("SalePersons API response:", res.data);
      setSalePersons(res.data || []);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  const fetchAllSalePersons = async () => {
    try {
      // ✅ FIX: Pass the selectedMonth in the query params
      const formattedMonth = selectedMonth.replace(" ", "-");

      const res = await axios.get(`${server}/assign-customer`, {
        params: { q: "", month: formattedMonth }, // Include month here
      });

      const persons = res.data || [];
      setSalePersons(persons); // API now returns customerCount for this month
    } catch (err) {
      console.error("Failed to fetch salespersons:", err);
    }
  };

  const handleStateChange = (state) => {
    setValue("stateAssigned", state);
    setFilteredCities(
      (allCities[state] || []).filter((city) => city && city.trim() !== "")
    );
    setValue("cityAssigned", ""); // reset city selection
    setSelectedCities([]); // reset temp selection
  };

  const fetchAssignedData = async () => {
    if (!userId || userId.length !== 8) {
      // Clear all local state if userId is invalid
      setEmployee({});
      setCitiesAssigned([]);
      setCustomersAssigned([]);
      setValue("citiesAssigned", "");
      setValue("customersAssigned", "[]");
      setRemovedCustomers([]);
      return;
    }

    // Clear old data immediately to show loading state
    setEmployee({});
    setCitiesAssigned([]);
    setCustomersAssigned([]);
    setValue("citiesAssigned", "");
    setValue("customersAssigned", "[]");
    setRemovedCustomers([]);

    try {
      const formattedMonth = selectedMonth.replace(/\s+/g, "-").trim(); // Ensure exact match
      const response = await axios.get(`${server}/assign-customer`, {
        params: { userId, month: formattedMonth },
      });

      const data = response.data;

      if (!data || Object.keys(data).length === 0) {
        // No data for selected month
        setEmployee({});
        setCitiesAssigned([]);
        setCustomersAssigned([]);
        setValue("citiesAssigned", "");
        setValue("customersAssigned", "[]");
        return;
      }

      // Use salesTarget data if it exists
      const targetData = data.salesTarget || {};

      setEmployee({
        userId: data.userId || "",
        userName: data.userName || "",
        stateAssigned: targetData.stateAssigned || "",
      });

      const cities = targetData.citiesAssigned || [];
      setCitiesAssigned(cities);
      setValue("citiesAssigned", cities.join(", "));

      const customers = targetData.customersAssigned || [];
      setCustomersAssigned(customers);
      setValue("customersAssigned", JSON.stringify(customers));
    } catch (err) {
      console.error("Failed to fetch assigned data:", err);
      setEmployee({});
      setCitiesAssigned([]);
      setCustomersAssigned([]);
      setValue("citiesAssigned", "");
      setValue("customersAssigned", "[]");
    }
  };

  const resetAssignedState = () => {
    setEmployee({});
    setCitiesAssigned([]);
    setCustomersAssigned([]);
    setValue("citiesAssigned", "");
    setValue("customersAssigned", "[]");
    setRemovedCustomers([]);
    setFilteredCities([]);
  };

  const handleSaveTarget = async () => {
    if (!userId || !employee?.userName) {
      showNotification("Please select a valid User ID first", "error");
      return;
    }

    const targetTonnage = (watch("targetTonnage") ?? "").toString().trim();
    const targetAmount = (watch("targetAmount") ?? "").toString().trim();
    const remarks = (watch("remarks") ?? "").toString().trim();

    if (!targetTonnage || !targetAmount) {
      showNotification("Please enter both Tonnage and Amount", "error");
      return;
    }

    try {
      // 🔑 Ensure month format is "September-2025"
      const monthFormatted = selectedMonth.replace(" ", "-");

      const res = await axios.post(`${server}/assign-customer/sales-target`, {
        userId,
        userName: employee.userName,
        month: monthFormatted, // backend will now match correctly
        targetTonnage,
        targetAmount,
        remarks,
        stateAssigned: employee.stateAssigned || "",
        citiesAssigned: employee.cityAssigned || [],
        customersAssigned: customersAssigned || [],
      });

      showNotification("Sales Target Assigned Successfully!", "success");
      console.log("Sales target saved:", res.data);
    } catch (err) {
      console.error("Failed to save target:", err);
      showNotification("Failed to save target", "error");
    }
  };

  const fetchTargetForUser = async () => {
    if (!userId || !selectedMonth) return;

    try {
      // 🔑 Ensure month format is "September-2025"
      const monthFormatted = selectedMonth.replace(" ", "-");

      // Fetch target for current month
      const resCurrent = await axios.get(
        `${server}/assign-customer/sales-target`,
        { params: { userId, month: monthFormatted } }
      );

      const currentTarget = resCurrent.data || {};
      setValue("targetTonnage", currentTarget.targetTonnage || "");
      setValue("targetAmount", currentTarget.targetAmount || "");
      setValue("remarks", currentTarget.remarks || "");

      // Optional: set assigned cities/customers
      if (currentTarget.citiesAssigned)
        setCitiesAssigned(currentTarget.citiesAssigned);
      if (currentTarget.customersAssigned)
        setCustomersAssigned(currentTarget.customersAssigned);

      // Previous month (for last month comparison)
      const [monthName, year] = selectedMonth.split(" ");
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
      const prevDate = new Date(year, monthIndex - 1);
      const prevMonth = `${prevDate.toLocaleString("default", {
        month: "long",
      })}-${prevDate.getFullYear()}`;

      const resPrev = await axios.get(
        `${server}/assign-customer/sales-target`,
        { params: { userId, month: prevMonth } }
      );

      const prevTarget = resPrev.data || {};
      setValue("tonnageLastMonth", prevTarget.targetTonnage || "0");
      setValue("amountLastMonth", prevTarget.targetAmount || "0");
    } catch (err) {
      console.error("Failed to fetch target:", err);
      setValue("targetTonnage", "");
      setValue("targetAmount", "");
      setValue("remarks", "");
      setValue("tonnageLastMonth", "0");
      setValue("amountLastMonth", "0");
    }
  };

  const fetchStatesAndCities = async () => {
    try {
      const res = await axios.get(`${server}/assign-customer`, {
        params: { fetchStates: "true" },
      });
      setAllCities(res.data);
      setStates(
        Object.keys(res.data).filter((state) => state && state.trim() !== "")
      );
    } catch (err) {
      console.error("Failed to fetch states/cities:", err);
    }
  };

  const currentMonthStr = new Date()
    .toLocaleString("default", {
      month: "long",
      year: "numeric",
    })
    .trim();

  const isCurrentMonth = selectedMonth.trim() === currentMonthStr;

  useEffect(() => {
    fetchStatesAndCities();
  }, [server]);

  useEffect(() => {
    fetchAssignedData();
  }, [userId]);

  useEffect(() => {
    // Fetch all salespersons on mount
    const fetchSalePersons = async (query = "") => {
      try {
        const res = await axios.get(`${server}/assign-customer`, {
          params: { q: query },
        });
        setSalePersons(res.data || []);
      } catch (err) {
        console.error("Failed to fetch salespersons:", err);
      }
    };

    // Initial fetch (all salespersons)
    fetchSalePersons();

    // Watch for search value changes
    const subscription = watch((value, { name }) => {
      if (name === "searchSalePerson") {
        fetchSalePersons(value.searchSalePerson || "");
      }
    });

    return () => subscription.unsubscribe(); // cleanup
  }, [server, watch]);

  useEffect(() => {
    // initialize and keep local mirror in sync with RHF's userId
    setUserIdState(watch("userId") || "");
    const subscription = watch((value, { name }) => {
      if (name === "userId") setUserIdState(value.userId ?? "");
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  useEffect(() => {
    if (!userId) return;

    // Reset removed customers whenever user or month changes
    setRemovedCustomers([]);

    if (demoRadio === "Assign Customer") {
      fetchAssignedData();
    } else if (demoRadio === "Assign Target") {
      fetchTargetForUser();
    }
  }, [userId, demoRadio, selectedMonth]);

  const downloadExcel = (data, filename = "data.xlsx") => {
    if (!data || !data.length) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, filename);
  };

  const handleDownloadExcel = async () => {
    try {
      // 1️⃣ Fetch all salespersons
      const resPersons = await axios.get(`${server}/assign-customer`, {
        params: { q: "" }, // fetch all
      });
      const salespersons = resPersons.data || [];

      if (!salespersons.length) return;

      // 2️⃣ For each salesperson, fetch assigned data & target for each month
      const allData = [];

      for (const person of salespersons) {
        const monthsToFetch = 12; // last 12 months
        for (let i = 0; i < monthsToFetch; i++) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStr = date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          });
          const monthFormatted = monthStr.replace(" ", "-");

          // fetch assignment & target
          const resAssign = await axios.get(
            `${server}/assign-customer/sales-target`,
            {
              params: { userId: person.userId, month: monthFormatted },
            }
          );

          const data = resAssign.data || {};
          allData.push({
            "User ID": person.userId,
            "Sales Person Name": person.userName,
            Month: monthStr,
            "State Assigned": data.stateAssigned || "",
            "Cities Assigned": (data.citiesAssigned || []).join(", "),
            "Customers Assigned": (data.customersAssigned || [])
              .map((c) => c.name || c.accountCode)
              .join(", "),
            "Target Tonnage": data.targetTonnage || 0,
            "Target Amount": data.targetAmount || 0,
          });
        }
      }

      // 3️⃣ Generate Excel
      downloadExcel(allData, `all_salespersons_data.xlsx`);
    } catch (err) {
      console.error("Failed to fetch all months data:", err);
      showNotification("Failed to download Excel", "error");
    }
  };

  const handleDownloadSample = () => {
    const link = document.createElement("a");
    link.href = "/assign-customer-target-bulk.xlsx"; // file from /public
    link.download = "assign-customer-target-bulk.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const bulkUpload = async (file) => {
    try {
      if (!file) return;

      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      const res = await fetch(`${server}/assign-customer/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream", // raw binary
        },
        body: arrayBuffer,
      });

      const data = await res.json();

      if (!res.ok) {
        // if validation fails, show row errors
        if (data.failedRows) {
          const errorText = data.failedRows
            .map((r) => `Row ${r.row}: ${r.error}`)
            .join("\n");
          showNotification(
            `Upload failed: please check data and try again!`,
            "error"
          );
          console.log(errorText);
        } else {
          showNotification(data?.error || "Upload failed", "error");
          console.log(data?.error);
        }
        return;
      }

      showNotification(data.message || "Bulk upload successful!", "success");

      // Refresh salespersons list to update UI
      await fetchAllSalePersons();

      // If a user is currently selected, refresh their data
      const currentUserId = watch("userId");
      if (currentUserId) {
        await fetchAssignedData();
        if (demoRadio === "Assign Target") {
          await fetchTargetForUser();
        }
      }
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Bulk upload failed", "error");
    }
  };

  useEffect(() => {
    fetchAllSalePersons();
  }, [selectedMonth, server]);

  return (
    <>
      <NotificationFlag
        visible={notification.visible}
        setVisible={(v) => setNotification((prev) => ({ ...prev, visible: v }))}
        type={notification.type}
        message={notification.message}
        onRetry={notification.onRetry}
      />

      <form className="flex flex-col gap-3 mt-3">
        <Heading
          title={`Assign Customer`}
          onRefresh={handleRefresh}
          bulkUploadBtn="hover:bg-gray-100 p-2 rounded"
          onClickBulkUploadBtn={() => setIsUploadModalOpen(true)}
          codeListBtn="hidden"
          downloadBtn
          onClickDownloadBtn={handleDownloadExcel}
        />

        <div className="flex w-full gap-3">
          {["Assign Target", "Assign Customer"].map((type) => (
            <RadioButtonLarge
              key={type}
              id={type}
              label={type}
              name="accountType"
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={handleRadioChange}
            />
          ))}
        </div>

        {["Assign Customer", "Assign Target"].includes(demoRadio) && (
          <div className="flex gap-4">
            <div className="flex ">
              <div className="w-[200px]  bg-white border-2 rounded-lg">
                {/* Header Section */}
                <div className="p-3 border-b border-gray-200">
                  <div className="">
                    <SearchInputBox
                      key="search-sale-person"
                      placeholder="Search Sale Person"
                      name="searchSalePerson"
                      register={register}
                    />
                  </div>
                </div>

                {/* Sale Person Items */}
                <div className=" rounded">
                  <div className="p-2 space-y-1 h-[55vh] table-scrollbar overflow-y-auto">
                    {salePersons.map((person, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group"
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {person?.userId}
                        </span>
                        <span className="bg-red-200 text-red-800 px-2 py-1 bg-[#EA1B4033] rounded text-xs font-medium min-w-[24px] text-center">
                          <span className="text-[#EA1B40] cursor-default">
                            {person.customerCount ?? 0}
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <Image
                            src={"/link.svg"}
                            alt="Edit"
                            width={12}
                            height={12}
                            className="cursor-pointer"
                            onClick={() => {
                              setValue("userId", person.userId);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="flex justify-between items-center">
                <RedLabelHeading label={"Sale Person Details"} />

                <div className="flex gap-1 text-center roubnded">
                  <h2 className="text-[16px] font-semibold">Month :</h2>
                  <select
                    className="text-[16px] rounded bg-[#FFE5E9] text-red px-[10px] py-[2px] font-semibold"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }).map((_, i) => {
                      const d = new Date();
                      d.setMonth(d.getMonth() - i);
                      const monthStr = d.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      });
                      return (
                        <option
                          key={monthStr}
                          value={monthStr}
                          className="bg-gray-100 rounded-md text-eerie-black"
                        >
                          {monthStr}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <InputBox
                  placeholder="User ID (Sale Person)"
                  register={register}
                  setValue={setValue}
                  value="userId"
                  initialValue={watch("userId")}
                  resetFactor={refreshKey}
                  disabled={!isCurrentMonth}
                />

                {demoRadio === "Assign Target" && (
                  <DummyInputBoxWithLabelDarkGray
                    label="User Name (Sale Person)"
                    register={register}
                    setValue={setValue}
                    value="userNameSalePerson"
                    inputValue={employee?.userName || ""}
                    disabled={!isCurrentMonth}
                  />
                )}
                {demoRadio === "Assign Customer" && (
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={`Sale Person`}
                    setValue={setValue}
                    value={`salePerson`}
                    inputValue={employee?.userName || ""}
                    disabled={!isCurrentMonth}
                  />
                )}
              </div>

              {/* Conditional rendering based on demoRadio */}
              {demoRadio === "Assign Target" && (
                <>
                  <div className="flex gap-3">
                    <InputBox
                      placeholder="Target Tonnage"
                      register={register}
                      setValue={setValue}
                      value="targetTonnage"
                      initialValue={watch("targetTonnage")}
                      disabled={!isCurrentMonth}
                    />
                    <InputBox
                      placeholder="Target Amount (₹)"
                      register={register}
                      setValue={setValue}
                      value="targetAmount"
                      initialValue={watch("targetAmount")}
                      disabled={!isCurrentMonth}
                    />
                  </div>

                  <div className="flex gap-3">
                    <DummyInputBoxWithLabelDarkGray
                      label="Tonnage (Last Month)"
                      register={register}
                      setValue={setValue}
                      value="tonnageLastMonth"
                      disabled={!isCurrentMonth}
                    />
                    <DummyInputBoxWithLabelDarkGray
                      label="Amount (₹) (Last Month)"
                      register={register}
                      setValue={setValue}
                      value="amountLastMonth"
                      disabled={!isCurrentMonth}
                    />
                  </div>

                  <div className="flex gap-3">
                    <InputBox
                      placeholder="Remarks"
                      register={register}
                      setValue={setValue}
                      value="remarks"
                      initialValue={watch("remarks")}
                      disabled={!isCurrentMonth}
                    />
                  </div>
                </>
              )}

              {/* Show these only for Assign Customer */}
              {demoRadio === "Assign Customer" && (
                <>
                  <div className="flex gap-3">
                    <div className="flex gap-3 w-full">
                      <LabeledDropdown
                        options={states}
                        register={register}
                        setValue={setValue}
                        title={`Select State`}
                        value={`stateAssigned`}
                        inputValue={watch("stateAssigned") || ""}
                        onChange={handleStateChange}
                        key={`stateAssigned-${refreshKey}`}
                        disabled={!isCurrentMonth}
                      />
                      <MultiSelectDropdown
                        options={filteredCities.filter(
                          (c) => c && c.trim() !== ""
                        )}
                        selected={selectedCities}
                        onChange={setSelectedCities}
                        placeholder="Select cities"
                        disabled={!isCurrentMonth}
                      />
                    </div>

                    <div className="w-[300px]">
                      <OutlinedButtonRed
                        onClick={handleAddCity}
                        label={"Add City"}
                        disabled={!isCurrentMonth}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <InputBox
                      placeholder="Customer Account Code"
                      register={register}
                      setValue={setValue}
                      value="customerAccountCode"
                      key={`customerAccountCode-${refreshKey}`}
                      disabled={!isCurrentMonth}
                    />

                    <div className="w-[300px]">
                      <OutlinedButtonRed
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddCustomer();
                        }}
                        label={"Add Customer"}
                        disabled={!isCurrentMonth}
                      />
                    </div>
                  </div>

                  {/* Customers Assigned */}
                  <div className="flex flex-col gap-2 justify-center">
                    <RedLabelHeading label="Customers Assigned" />
                    <div
                      className={`flex min-h-8 flex-wrap border-[1px] rounded-md border-[#0000006c] items-center pt-2 pl-2 ${
                        !isCurrentMonth ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      {customersAssigned.map((c) => (
                        <Chip
                          key={c.accountCode}
                          label={c.name}
                          onDelete={() =>
                            isCurrentMonth &&
                            handleDeleteCustomer(c.accountCode)
                          }
                          disabled={!isCurrentMonth}
                        />
                      ))}
                    </div>

                    <input
                      type="hidden"
                      {...register("customersAssigned")}
                      value={JSON.stringify(customersAssigned)}
                    />
                  </div>

                  {/* Cities Assigned */}
                  <div className="flex flex-col gap-2">
                    <RedLabelHeading label="Cities Assigned" />
                    <div
                      className={`flex flex-wrap min-h-8 border-[1px] rounded-md border-[#0000006c] items-center pt-2 pl-2 ${
                        !isCurrentMonth ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      {citiesAssigned.map((city, i) => (
                        <Chip
                          key={i}
                          label={city}
                          onDelete={() =>
                            isCurrentMonth && handleDeleteCity(city)
                          }
                          disabled={!isCurrentMonth}
                        />
                      ))}
                    </div>

                    <input
                      type="hidden"
                      {...register("citiesAssigned")}
                      value={citiesAssigned.join(", ")}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 flex-row-reverse">
                {demoRadio === "Assign Target" ? (
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-[200px]">
                      <SimpleButton
                        name={"Save Target"}
                        onClick={handleSaveTarget}
                        disabled={!isCurrentMonth}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 flex-row-reverse">
                    <div>
                      <SimpleButton
                        name={"Assign"}
                        onClick={handleFinalAssign}
                        disabled={!isCurrentMonth}
                      />
                    </div>
                  </div>
                )}
                <div className="flex flex-row-reverse  w-full justify-between">
                  <div className="flex justify-between gap-4 flex-row-reverse">
                    {/* <div className="flex justify-end mb-3">
                      <DownloadDropdown
                        handleDownloadExcel={handleDownloadExcel}
                      />
                    </div> */}

                    <div>
                      {/* <OutlinedButtonRed label={"Close"} /> */}
                    </div>
                  </div>
                  {demoRadio === "Assign Customer" ? (
                    <div>
                      <DummyInputBoxWithLabelDarkGray
                        label="State Assigned"
                        register={register}
                        setValue={setValue}
                        value="stateAssignedDummy"
                        inputValue={employee?.stateAssigned || ""}
                        disabled={!isCurrentMonth}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
        {isUploadModalOpen && (
          <BulkUploadModal
            onClose={() => setIsUploadModalOpen(false)}
            onFileUpload={bulkUpload}
            sampleFileLink="/assign-customer-target-bulk.xlsx"
            title="Bulk Upload Assignments"
          />
        )}
      </form>
    </>
  );
};

export default AssignCustomer;
