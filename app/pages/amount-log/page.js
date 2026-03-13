"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { X } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import CodeList from "@/app/components/CodeList";

const AmountLog = () => {
  const { register, setValue, watch, reset } = useForm();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [filterValue, setFilterValue] = useState("All");
  const { server } = useContext(GlobalContext);
  const [codeList, setCodeList] = useState([]);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const [customerList, setCustomerList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // watch accountCode
  const accountCode = watch("accountCode");

  const ddmmyyyyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleRefresh = () => {
    reset({
      accountCode: "",
      customerName: "",
      from: null,
      to: null,
    });
    setRowData([]);
    setCustomerName("");
    setFilterValue("All");
    showNotification("success", "Form and table cleared");
  };

  // fetch customerName whenever accountCode changes
  useEffect(() => {
    if (!accountCode) {
      setCustomerName("");
      setValue("customerName", "");
      return;
    }

    const fetchCustomer = async () => {
      try {
        const res = await fetch(
          `${server}/amount-log?onlyCustomer=true&accountCode=${accountCode.trim().toUpperCase()}`
        );
        const data = await res.json();
        setCustomerName(data.customerName || "");
        setValue("customerName", data.customerName || "");
      } catch (error) {
        console.error("Error fetching customer name:", error);
        setCustomerName("");
        setValue("customerName", "");
      }
    };

    fetchCustomer();
  }, [accountCode, setValue, server]);

  // fetch all customers for CodeList
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${server}/amount-log/customer`);
        const data = await res.json();
        setCustomerList(data);
        setFilteredCustomers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomers();
  }, [server]);

  // filter customers by searchTerm
  useEffect(() => {
    const filtered = customerList.filter(
      (c) =>
        c.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customerList]);

  const fetchData = async () => {
    const accountCode = watch("accountCode")?.trim();
    if (!accountCode) {
      showNotification("error", "Customer code is required");
      return;
    }

    try {
      const params = new URLSearchParams({
        accountCode,
        filter: watch("filter") || "All",
      });

      const from = watch("from");
      const to = watch("to");

      if (from) params.append("from", ddmmyyyyToYmd(from));
      if (to) params.append("to", ddmmyyyyToYmd(to));

      const res = await fetch(`${server}/amount-log?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json();
        showNotification("error", errorData.error || "Failed to fetch data");
        setRowData([]);
        return;
      }

      const data = await res.json();
      if (!data || data.length === 0) {
        showNotification("error", "No data found for this customer");
        setRowData([]);
        return;
      }

      setRowData(data);
      showNotification("success", "Data fetched successfully");
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to fetch data");
      setRowData([]);
    }
  };

  const downloadTable = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const dataToExport = rowData.map((row) =>
      columns.reduce((acc, col) => {
        acc[col.label] = row[col.key];
        return acc;
      }, {})
    );

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AmountLog");

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    showNotification("success", "Table downloaded successfully");
    saveAs(blob, "AmountLog.xlsx");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "accountCode", label: "Customer Code" },
    { key: "customerName", label: "Customer Name" },
    { key: "basicamt", label: "Basic Amount" },
    { key: "sgst", label: "SGST" },
    { key: "cgst", label: "CGST" },
    { key: "igst", label: "IGST" },
    { key: "mischg", label: "Misc Charge" },
    { key: "miscRemark", label: "Misc Remark" },
    { key: "fuel", label: "Fuel" },
    { key: "fuelPercent", label: "Fuel Percentage" },
    { key: "handling", label: "Handling" },
    { key: "OVWT", label: "OVWT" },
    { key: "rateHike", label: "Rate Hike" },
    { key: "grandTotal", label: "Grand Total" },
    { key: "hikeAmount", label: "Hike Amount" },
    { key: "lessAmount", label: "Less Amount" },
    { key: "diffAmount", label: "Diff Amount" },
    { key: "insertDate", label: "Insert Date" },
    { key: "lastUpdateDate", label: "Last Update Date" },
    { key: "insertUser", label: "Insert User" },
    { key: "updateUser", label: "Update User" },
  ];

  useEffect(() => {
    const fetchCodeList = async () => {
      try {
        const res = await fetch(`${server}/amount-log/customer`); // your new route
        const data = await res.json();
        setCodeList(data); // assign to state
      } catch (err) {
        console.error("Failed to fetch customers", err);
        setCodeList([]);
      }
    };

    fetchCodeList();
  }, [server]);

  return (
    <div className="">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="space-y-4">
        <div className="mb-8">
          <Heading
            title={`Amount Log`}
            bulkUploadBtn="hidden"
            fullscreenBtn
            onRefresh={handleRefresh}
            onClickFullscreenBtn={() => setIsFullscreen(true)}
          />
        </div>

        {/* Customer search & filter */}
        <div className="flex gap-2">
          <div className="w-1/2">
            <InputBox
              placeholder={`Customer Code`}
              value="accountCode"
              register={register}
              setValue={setValue}
              initialValue={accountCode}
            />
          </div>
          <CodeList
            data={codeList} // use customer code & name
            handleAction={(item) => {
              setValue("accountCode", item.accountCode);
              setValue("customerName", item.name);
              setCustomerName(item.name);
            }}
            columns={[
              { key: "accountCode", label: "Customer Code" },
              { key: "name", label: "Customer Name" },
            ]}
            name={`Customer Code List`}
          />

          <div className="w-1/2">
            <InputBox
              placeholder={`Customer Name`}
              value="customerName"
              register={register}
              setValue={setValue}
              disabled
              initialValue={customerName}
            />
          </div>

          <div className="w-1/2">
            <LabeledDropdown
              placeholder={`Filter`}
              options={["All", "Hike Amount", "Less Amount"]}
              value="filter"
              register={register}
              setValue={setValue}
              defaultValue={filterValue}
              onChange={(val) => setFilterValue(val)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-1/2">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
              maxToday
            />
          </div>
          <div className="w-1/2">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
            />
          </div>

          <div className="w-[200px]">
            <OutlinedButtonRed label={`Show`} onClick={fetchData} />
          </div>
          <div>
            <SimpleButton name={`Download`} onClick={downloadTable} />
          </div>
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            className="h-[45vh]"
            columns={columns}
            rowData={rowData}
          />
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-10 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Amount Log</h2>
            <button onClick={() => setIsFullscreen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="Forwarding Number Report"
              columns={columns}
              rowData={rowData}
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-3">
        <div className="w-[200px]">
          {/* <OutlinedButtonRed label={`Close`} /> */}
        </div>
      </div>
    </div>
  );
};

export default AmountLog;
