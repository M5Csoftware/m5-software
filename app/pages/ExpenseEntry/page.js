"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { SimpleButton, OutlinedButtonRed } from "@/app/components/Buttons";
import { TableWithSorting } from "@/app/components/Table";
import { LabeledDropdown } from "@/app/components/Dropdown";
import axios from "axios";
import Modal from "@/app/components/Modal";
import * as XLSX from "xlsx";
import { subDays, startOfMonth, endOfMonth } from "date-fns";
import NotificationFlag from "@/app/components/Notificationflag";
import { show } from "@tauri-apps/api/app";

function ExpenseEntry() {
  const { register, setValue, getValues, handleSubmit, watch } = useForm();
  const [rowData, setRowData] = useState([]);
  const [totalBalance, setBalance] = useState(0);
  const [currDate, setCurrDate] = useState([]);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [downloadFrom, setDownloadFrom] = useState("");
  const [downloadTo, setDownloadTo] = useState("");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const toISODate = (val) => {
    if (!val) return null;

    // already yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // dd/mm/yyyy or mm/dd/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [a, b, c] = val.split("/");
      const iso = `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
      return isNaN(new Date(iso)) ? null : iso;
    }

    return null;
  };

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const dateFilters = [
    { label: "This Month", value: "this_month" },
    { label: "Date Wise", value: "date_wise" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "Month Name", value: "month_name" }, // can be implemented later
    { label: "Last Financial Year", value: "last_fy" },
    { label: "Custom", value: "custom" },
  ];

  const columns = [
    { key: "date", label: "Date" },
    { key: "expenseType", label: "Type of Expense" },
    { key: "amount", label: "Amount" },
    { key: "description", label: "Description" },
    { key: "balance", label: "Available Amount" },
  ];

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/expense-entry");
      const data = res.data || [];
      setRowData(data);
      setBalance(data[0]?.balance || 0);
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const onSave = async (data) => {
    const isoDate = toISODate(data.date);
    if (!isoDate) {
      showNotification("error", "Invalid date");
      return;
    }

    const newEntry = {
      date: isoDate,

      expenseType: data.expenseType,
      amount: parseFloat(data.amount),
      description: data.description,
    };

    try {
      const res = await axios.post(
        "http://localhost:3001/api/expense-entry",
        newEntry
      );
      fetchExpenses();
      setBalance(res.data.balance);
      showNotification("success", "Expense saved successfully");
    } catch (err) {
      console.error("Failed to save expense", err);
      showNotification("error", "Failed to save expense");
    }
  };

  const expensesType = [
    "Assets Purchase",
    "Bank Charges & Interest on loan",
    "Brokerage charges",
    "Business Promotion Expense",
    "Commission Expense",
    "Conveyance Expense",
    "Courier Expense",
    "Duty & Other taxes",
    "Electricity Expense",
    "Flat Rent",
    "Flat Expense",
    "Fuel Expense",
    "Furnishings/Appliances",
    "Hotel Expenses",
    "Internet Expense",
    "Misc. Charges",
    "Office Expenses",
    "Office Rent",
    "Office Rent (Bank)",
    "Overtime Expenses",
    "Pickup & Delivery Expenses",
    "Stationery expenses",
    "Repairs & Maintenance Exp.",
    "Salary & Wages",
    "Security Deposits",
    "Software & Website Expense",
    "Staff Welfare Expenses",
    "Telephone Expenses",
    "Tour & Travelling Expense",
    "Admin Expenses",
    "Water Expenses",
    "Receipt",
  ];

  const selectedRange = watch("dateRange");
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");

  // Callback when range changes
  useEffect(() => {
    if (selectedRange) {
      handleRangeChange(selectedRange);
    }
  }, [selectedRange]);

  useEffect(() => {
    setDownloadFrom(fromDate);
    setDownloadTo(toDate);
  }, [fromDate, toDate]);

  const handleRangeChange = (range) => {
    const today = new Date();
    switch (range) {
      case "this_month":
        setDownloadFrom(startOfMonth(today).toISOString().split("T")[0]);
        setDownloadTo(endOfMonth(today).toISOString().split("T")[0]);
        break;
      case "last_7_days":
        setDownloadFrom(subDays(today, 6).toISOString().split("T")[0]);
        setDownloadTo(today.toISOString().split("T")[0]);
        break;
      case "last_fy":
        const lastFYStart = new Date(today.getFullYear() - 1, 3, 1); // April 1 last year
        const lastFYEnd = new Date(today.getFullYear(), 2, 31); // March 31 this year
        setDownloadFrom(lastFYStart.toISOString().split("T")[0]);
        setDownloadTo(lastFYEnd.toISOString().split("T")[0]);
        break;
      default:
        setDownloadFrom("");
        setDownloadTo("");
    }
  };

  const handleDownload = () => {
    const filteredData = rowData.filter((item) => {
      const fromISO = toISODate(downloadFrom);
      const toISO = toISODate(downloadTo);

      if (!fromISO || !toISO) {
        showNotification("error", "Invalid download date range");
        return;
      }

      const from = new Date(fromISO);
      const to = new Date(toISO);

      const filteredData = rowData.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= from && itemDate <= to;
      });

      return itemDate >= from && itemDate <= to;
    });

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expense Report");
    XLSX.writeFile(workbook, "Expense_Report.csv");

    setShowDownloadModal(false);
  };

  const getDate = () => {
    const today = new Date().toISOString().split("T")[0];
    const date = getValues("date");
    setCurrDate([date]);
    if (!date) setValue("date", today);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Tab" || event.key === "Enter") getDate();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Expense Entry"
        bulkUploadBtn="hidden"
        downloadBtn
        refreshBtn={false}
        onClickDownloadBtn={() => setShowDownloadModal(true)}
      />

      {/* Expense Form */}
      <div className="flex flex-col gap-3">
        <RedLabelHeading label={`Expense Details`} />
        <div className="flex gap-3">
          <DateInputBox
            placeholder="Date"
            register={register}
            setValue={setValue}
            value="date"
            initialValue={currDate[0] || ""}
          />
          <LabeledDropdown
            options={expensesType}
            register={register}
            setValue={setValue}
            title="Type of Expense"
            value="expenseType"
          />
          <InputBox
            placeholder="Amount"
            register={register}
            setValue={setValue}
            value="amount"
          />
        </div>
        <div className="flex gap-3">
          <InputBox
            placeholder="Description"
            register={register}
            setValue={setValue}
            value="description"
            full
          />
          <div className="">
            <SimpleButton name="Save" type="submit" />
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div>
        <TableWithSorting
          name="expenseTable"
          columns={columns}
          rowData={rowData}
          register={register}
          setValue={setValue}
          className="h-[45vh] rounded-b-none border-b-0"
        />
        <div className="flex justify-end text-red border-t-0 rounded-t-none bg-gray-300 rounded font-sans px-4 py-1">
          <span className="text-gray-500 mr-2 font-sans">Balance:</span> ₹{" "}
          {totalBalance}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="">{/* <OutlinedButtonRed label="Close" /> */}</div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <Modal
          title="Expense Report"
          onClose={() => setShowDownloadModal(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-end">
              {/* <select
                onChange={(e) => handleRangeChange(e.target.value)}
                className="border rounded px-3 py-2"
              >
                {dateFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select> */}

              <LabeledDropdown
                options={dateFilters.map((option) => option.label)}
                register={register}
                setValue={setValue}
                title="Date Range"
                value="dateRange"
              />

              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                value="fromDate"
              />

              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                value="toDate"
              />
              <div>
                <SimpleButton
                  name="Download"
                  type="button"
                  onClick={handleDownload}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}

export default ExpenseEntry;
