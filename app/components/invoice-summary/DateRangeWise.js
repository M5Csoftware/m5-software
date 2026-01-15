"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import DownloadCsvExcel from "../DownloadCsvExcel";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { LabeledDropdown } from "../Dropdown";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";
import * as XLSX from "xlsx";
import { GlobalContext } from "@/app/lib/GlobalContext";

function DateRangeWise() {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  // Watch customer input for auto-population
  const customerCode = watch("Customer");
  const selectedBranch = watch("branch");
  const fromDate = watch("from");
  const toDate = watch("to");

  const columns = useMemo(
    () => [
      { key: "srNo", label: "SR No" },
      { key: "invoiceNo", label: "Invoice No" },
      { key: "invoiceDate", label: "Invoice Date" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "gstNo", label: "GST No" },
      { key: "branch", label: "Branch" },
      { key: "salePerson", label: "Sale Person Name" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
      { key: "nonTaxable", label: "Non Taxable" },
      { key: "basicAmount", label: "Basic Amount" },
      { key: "miscAmount", label: "Misc Amount" },
      { key: "fuel", label: "Fuel" },
      { key: "taxable", label: "Taxable" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "grandTotal", label: "Grand Total" },
      { key: "irn", label: "IRN" },
    ],
    []
  );

  const showNotification = (type, message) => {
    setNotification({ visible: true, type, message });
  };

  // Fetch branches on mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch customer name when account code changes
  useEffect(() => {
    if (customerCode && customerCode.trim().length > 0) {
      fetchCustomerName(customerCode.trim());
    } else {
      setCustomerName("");
      setValue("name", "");
    }
  }, [customerCode]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${server}/branch-master`);
      if (response.data && Array.isArray(response.data)) {
        // Create array of branch codes
        const branchOptions = response.data.map((branch) => `${branch.code}`);
        setBranches(branchOptions);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      showNotification("error", "Failed to fetch branches");
    }
  };

  const fetchCustomerName = async (code) => {
    try {
      const response = await axios.get(
        `${server}/customer-account?accountCode=${code}`
      );
      if (response.data && response.data.name) {
        const name = response.data.name;
        setCustomerName(name);
        setValue("name", name);
      }
    } catch (error) {
      console.error("Error fetching customer name:", error);
      setCustomerName("");
      setValue("name", "");
      if (error.response?.status !== 404) {
        showNotification("error", "Failed to fetch customer details");
      }
    }
  };

  const handleShow = async (e) => {
    e.preventDefault();

    if (!fromDate || !toDate) {
      showNotification("error", "Please select from and to dates");
      return;
    }

    setLoading(true);
    try {
      const fromParsed = parseDateDDMMYYYY(fromDate);
      const toParsed = parseDateDDMMYYYY(toDate);

      if (
        !fromParsed ||
        !toParsed ||
        isNaN(fromParsed.getTime()) ||
        isNaN(toParsed.getTime())
      ) {
        showNotification("error", "Invalid date format");
        setLoading(false);
        return;
      }

      fromParsed.setHours(0, 0, 0, 0);
      toParsed.setHours(23, 59, 59, 999);

      const params = new URLSearchParams({
        fromDate: fromParsed.toISOString(),
        toDate: toParsed.toISOString(),
      });

      if (selectedBranch) {
        // Extract branch code if format is "CODE - Name", otherwise use as is
        const branchCode = selectedBranch.split(" - ")[0];
        params.append("branch", branchCode);
      }

      if (customerCode && customerCode.trim()) {
        params.append("accountCode", customerCode.trim());
      }

      const response = await axios.get(
        `${server}/invoice-summary?${params.toString()}`
      );

      if (response.data.success) {
        setRowData(response.data.data);
        showNotification(
          "success",
          `Found ${response.data.count} invoice(s)`
        );
      } else {
        setRowData([]);
        showNotification(
          "error",
          response.data.message || "No data found"
        );
      }
    } catch (error) {
      console.error("Error fetching invoice summary:", error);
      setRowData([]);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    // Create CSV header
    const headers = columns.map((col) => col.label).join(",");

    // Create CSV rows
    const rows = rowData.map((row) => {
      return columns
        .map((col) => {
          const value = row[col.key] || "";
          // Escape values containing commas or quotes
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",");
    });

    // Combine header and rows
    const csvContent = [headers, ...rows].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `invoice_summary_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("success", "CSV downloaded successfully");
  };

  const handleDownloadExcel = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    // Create worksheet data with headers
    const wsData = [
      columns.map((col) => col.label),
      ...rowData.map((row) => columns.map((col) => row[col.key] || "")),
    ];

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.label.length, 15),
    }));
    ws["!cols"] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice Summary");

    // Download
    XLSX.writeFile(wb, `invoice_summary_${new Date().getTime()}.xlsx`);

    showNotification("success", "Excel downloaded successfully");
  };

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <form className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <LabeledDropdown
                options={branches}
                value="branch"
                title={`Branch`}
                register={register}
                setValue={setValue}
              />
            </div>
            <div className="flex gap-3">
              <div className="w-full">
                <InputBox
                  placeholder={`Customer Code`}
                  register={register}
                  setValue={setValue}
                  value={`Customer`}
                />
              </div>

              <DummyInputBoxWithLabelDarkGray
                placeholder={"Customer Name"}
                register={register}
                setValue={setValue}
                value={"name"}
                disabled={true}
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value={`from`}
                placeholder="From"
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value={`to`}
                placeholder="To"
              />
              <div>
                <OutlinedButtonRed
                  label={loading ? "Loading..." : "Show"}
                  onClick={handleShow}
                  disabled={loading}
                />
              </div>
              <div className="">
                <DownloadCsvExcel
                  handleDownloadExcel={handleDownloadExcel}
                  handleDownloadCSV={handleDownloadCSV}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={rowData}
            className="h-[450px]"
          />
        </div>

        <div className="flex justify-between">
          <div></div>
        </div>
      </form>
    </>
  );
}

export default DateRangeWise;