"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { SearchableDropDrown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import { DateInputBox, SearchInputBox } from "@/app/components/InputBox";
import axios from "axios";
import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

function RedCheckbox({ id, isChecked, onChange, label }) {
  return (
    <label
      htmlFor={id}
      className="flex gap-2 items-center cursor-pointer select-none"
    >
      <div
        className={`rounded w-4 h-4 p-[2px] border cursor-pointer select-none hover:opacity-80 flex items-center justify-center ${
          isChecked ? "border-red bg-red" : "border-french-gray bg-white"
        }`}
      >
        <Image
          className={`${isChecked ? "" : "hidden"}`}
          src={`/redCheck.svg`}
          alt="check"
          width={12}
          height={12}
        />
        <input
          id={id}
          type="checkbox"
          checked={isChecked}
          onChange={onChange}
          className="hidden"
        />
      </div>
      {label && (
        <span className="tracking-wide text-eerie-black text-xs">{label}</span>
      )}
    </label>
  );
}

// Helper function to parse DD/MM/YYYY format from DateInputBox
const parseDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
  const year = parseInt(parts[2], 10);

  return new Date(year, month, day);
};

const BulkInvoice = () => {
  const { register, setValue, watch } = useForm();
  const [step, setStep] = useState(1);
  const [customerList, setCustomerList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const { server } = useContext(GlobalContext);
  const [search, setSearch] = useState("");
  const [allCustomers, setAllCustomers] = useState([]);

  const handleNext = () => {
    if (!watch("fYear")) {
      showNotification("error", "Financial year is required");
      return;
    }

    showNotification("success", "Financial year selected");
    setStep(2);
  };

  const selectedBranch = watch("branch");
  const fromDate = watch("from");
  const toDate = watch("to");
  const [branches, setBranches] = useState([]);
  const [resetFactor, setResetFactor] = useState(false);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Updated toISO function that handles DD/MM/YYYY format
  const toISODate = (dateStr) => {
    if (!dateStr) return null;

    // Parse DD/MM/YYYY format
    const parsedDate = parseDateDDMMYYYY(dateStr);
    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return null;
    }

    // Return ISO string without timezone adjustment
    return parsedDate.toISOString();
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(`${server}/branch-master/get-branch`);
        const allowed = ["DEL", "AHM", "MHM"];
        setBranches(
          res.data.map((b) => b.code).filter((code) => allowed.includes(code)),
        );
      } catch (err) {
        console.log("Error fetching branches", err);
      }
    };

    fetchBranches();
  }, []);

  const fetchCustomerByBranch = async () => {
    if (!selectedBranch) {
      showNotification("error", "Select a branch first");
      setCustomerList([]);
      return;
    }

    if (!fromDate || !toDate) {
      showNotification("error", "Select FROM and TO date");
      return;
    }

    try {
      // Parse dates from DD/MM/YYYY format
      const fromParsed = parseDateDDMMYYYY(fromDate);
      const toParsed = parseDateDDMMYYYY(toDate);

      if (
        !fromParsed ||
        !toParsed ||
        isNaN(fromParsed.getTime()) ||
        isNaN(toParsed.getTime())
      ) {
        showNotification("error", "Invalid date format. Please use DD/MM/YYYY");
        return;
      }

      // Format to ISO strings like BookingReport does
      const fromISO = fromParsed.toISOString();
      const toISO = toParsed.toISOString();

      const response = await axios.get(
        `${server}/billing-bulk-invoice?branch=${selectedBranch}&search=${search}&from=${fromISO}&to=${toISO}`,
      );

      if (!response.data.length) {
        showNotification("error", "No customers found in this date range");
      } else {
        showNotification("success", "Customers loaded");
      }

      const formatted = response.data.map((c) => ({
        ...c,
        selected: false,
      }));

      setAllCustomers(formatted);
      setCustomerList(formatted);
    } catch (err) {
      // console.log(err);
      showNotification("error", "Failed to fetch customers");
      setCustomerList([]);
    }
  };

  useEffect(() => {
    if (!search) {
      setCustomerList(allCustomers);
      return;
    }

    const filtered = allCustomers.filter((c) =>
      `${c.accountCode} ${c.name}`.toLowerCase().includes(search.toLowerCase()),
    );

    setCustomerList(filtered);
  }, [search, allCustomers]);

  const handleRefresh = () => {
    setCustomerList([]);
    setResetFactor(!resetFactor);
    showNotification("success", "Refreshed");
  };

  const handleExcludeSelected = () => {
    const removed = customerList.filter((c) => c.selected).length;

    if (removed === 0) {
      showNotification("error", "Pick a customer to remove");
      return;
    }

    setCustomerList((prev) => prev.filter((c) => !c.selected));
    showNotification("success", `${removed} removed from the list`);
  };

  const handleBulkCreate = async () => {
    const selectedCustomers = customerList.filter((c) => c.selected);

    if (selectedCustomers.length === 0) {
      showNotification("error", "Pick at least one customer");
      return;
    }

    if (!fromDate || !toDate) {
      showNotification("error", "Select date range");
      return;
    }

    if (!watch("invoiceDate")) {
      showNotification("error", "Select invoice date");
      return;
    }

    // Parse dates from DD/MM/YYYY format
    const fromParsed = parseDateDDMMYYYY(fromDate);
    const toParsed = parseDateDDMMYYYY(toDate);
    const invoiceParsed = parseDateDDMMYYYY(watch("invoiceDate"));

    if (
      !fromParsed ||
      !toParsed ||
      !invoiceParsed ||
      isNaN(fromParsed.getTime()) ||
      isNaN(toParsed.getTime()) ||
      isNaN(invoiceParsed.getTime())
    ) {
      showNotification("error", "Invalid date format. Please use DD/MM/YYYY");
      return;
    }

    // Format to ISO strings
    const fromISO = fromParsed.toISOString();
    const toISO = toParsed.toISOString();
    const invoiceISO = invoiceParsed.toISOString();

    const invoicesData = [];
    showNotification("success", "Fetching shipment data...");

    for (const cus of selectedCustomers) {
      try {
        const summaryRes = await axios.post(
          `${server}/billing-invoice/summary`,
          {
            accountCode: cus.accountCode,
            from: fromISO, // Send ISO string
            to: toISO, // Send ISO string
          },
        );

        const { shipments, summary } = summaryRes.data;
        if (!shipments || shipments.length === 0) continue;

        invoicesData.push({ customer: cus, shipments, summary });
      } catch (error) {
        console.error(`Error fetching summary for ${cus.accountCode}:`, error);
        showNotification(
          "error",
          `Failed to fetch data for ${cus.accountCode}`,
        );
      }
    }

    if (invoicesData.length === 0) {
      showNotification("error", "No shipment found for these customers");
      return;
    }

    try {
      const res = await axios.post(`${server}/billing-bulk-invoice`, {
        invoices: invoicesData,
        branch: selectedBranch,
        createdBy: "bulk",
        invoiceDate: invoiceISO,
        fromDate: fromISO,
        toDate: toISO,
        financialYear: watch("fYear"),
      });

      showNotification("success", res.data.message);
    } catch (error) {
      console.error("Error creating bulk invoice:", error);
      showNotification("error", "Failed to create invoices");
    }
  };

  return (
    <form className="flex flex-col gap-8">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Bulk Invoice"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />
      {step === 1 && (
        <div className="flex gap-3">
          <SearchableDropDrown
            options={["2025-26", "2024-25", "2023-24"]}
            register={register}
            setValue={setValue}
            value="fYear"
            title="F Year"
          />
          <div>
            <OutlinedButtonRed label="Next" onClick={handleNext} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="flex w-full gap-10">
          <div className="w-1/2 flex flex-col gap-3">
            <SearchInputBox
              placeholder="Search Client with Name or Code"
              onChange={(e) => setSearch(e.target.value)}
            />
            <ClientTableUI
              customerList={customerList}
              setCustomerList={setCustomerList}
            />
            <OutlinedButtonRed
              label="Remove Selected Customers"
              onClick={handleExcludeSelected}
            />
          </div>
          <div className="w-1/2">
            <div className="flex flex-col gap-6 w-full">
              <div className="flex flex-col gap-3">
                <SearchableDropDrown
                  options={branches}
                  register={register}
                  setValue={setValue}
                  value="branch"
                  title="Branch"
                  resetFactor={resetFactor}
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Month File"
                  register={register}
                  setValue={setValue}
                  inputValue={watch("fYear")}
                  value="monthFile"
                />
                <DateInputBox
                  register={register}
                  setValue={(name, val) => {
                    setSelectedDate(val);
                    setValue(name, val);
                  }}
                  value="invoiceDate"
                  placeholder="Select Invoice Date"
                  resetFactor={resetFactor}
                />
                <div className="flex gap-3 w-fulls">
                  <div className="w-1/3">
                    <DateInputBox
                      register={register}
                      setValue={setValue}
                      value="from"
                      placeholder="From"
                      resetFactor={resetFactor}
                    />
                  </div>

                  <div className="w-1/3">
                    <DateInputBox
                      register={register}
                      setValue={setValue}
                      value="to"
                      placeholder="To"
                      resetFactor={resetFactor}
                    />
                  </div>

                  <div className="w-1/3">
                    {" "}
                    <OutlinedButtonRed
                      label="Show"
                      onClick={(e) => {
                        e.preventDefault();
                        fetchCustomerByBranch();
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex w-full justify-end">
                <div className="w-[32%]">
                  <SimpleButton
                    name="Create Bill"
                    onClick={(e) => {
                      e.preventDefault();
                      handleBulkCreate();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default BulkInvoice;

const ClientTableUI = ({ customerList, setCustomerList }) => {
  const toggleCheckbox = (id) => {
    setCustomerList((prev) =>
      prev.map((client) =>
        client._id === id ? { ...client, selected: !client.selected } : client,
      ),
    );
  };

  const toggleAll = () => {
    const allSelected = customerList.every((client) => client.selected);
    setCustomerList((prev) =>
      prev.map((client) => ({ ...client, selected: !allSelected })),
    );
  };

  const allSelected =
    customerList.length > 0 && customerList.every((client) => client.selected);

  return (
    <div className="w-full bg-white rounded border shadow h-[55vh] p-4 text-sm overflow-y-scroll table-scrollbar">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="p-2 w-10">
              <RedCheckbox
                id="selectAll"
                isChecked={allSelected}
                onChange={toggleAll}
              />
            </th>
            <th className="p-2">Clients</th>
          </tr>
        </thead>
        <tbody>
          {customerList.map((client) => (
            <tr
              key={client._id}
              className="border-b hover:bg-gray-50 transition"
            >
              <td className="p-2">
                <RedCheckbox
                  id={`client-${client._id}`}
                  isChecked={client.selected || false}
                  onChange={() => toggleCheckbox(client._id)}
                />
              </td>
              <td className="p-2 font-sans font-normal text-base">
                {client.accountCode} {client.name || "No Name"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
