"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import DownloadCsvExcel from "../DownloadCsvExcel";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxLightGray,
  DummyInputBoxTransparent,
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelDarkGrayAndRedText,
  DummyInputBoxWithLabelTransparent,
} from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting, TableWithCheckbox } from "@/app/components/Table";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { LabeledDropdown } from "../Dropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function DateRangeWise() {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notification, setNotification] = useState({
    visible: false,
    type: "",
    message: "",
  });

  const customerCode = watch("Customer");
  const selectedBranch = watch("branch");
  const fromDate = watch("from");
  const toDate = watch("to");

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const columns = useMemo(
    () => [
      { key: "srNo", label: "Sr No." },
      { key: "invoiceNo", label: "Invoice No" },
      { key: "invoiceDate", label: "Invoice Date" },
      { key: "accountCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "gstNo", label: "GST No" },
      { key: "branch", label: "Branch" },
      { key: "salesPersonName", label: "Sales Person" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
      { key: "freightAmount", label: "Freight Amount" },
      { key: "clearanceAmount", label: "Clearance Amount" },
      { key: "grandTotal", label: "Grand Total" },
      { key: "exchangeRate", label: "Exchange Rate" },
      { key: "exchangeAmount", label: "Exchange Amount" },
    ],
    []
  );

  const showNotification = (type, message) => {
    setNotification({ visible: true, type, message });
  };

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Fetch customer name when customer code changes
  useEffect(() => {
    if (customerCode && customerCode.length > 0) {
      fetchCustomerName(customerCode);
    } else {
      setCustomerName("");
      setValue("name", "");
    }
  }, [customerCode]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${server}/branch-master`);
      if (response.data && Array.isArray(response.data)) {
        // Create array of strings in format "CODE - Company Name"
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
      showNotification("error", "Please select both From and To dates");
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
        dateFrom: fromParsed.toISOString(),
        dateTo: toParsed.toISOString(),
      });

      if (selectedBranch) {
        // Extract branch code from "CODE - Name" format
        const branchCode = selectedBranch.split(" - ")[0];
        params.append("branch", branchCode);
      }

      if (customerCode) {
        params.append("accountCode", customerCode);
      }

      const response = await axios.get(
        `${server}/invoice-ptp-summary?${params.toString()}`
      );

      if (response.data.success && Array.isArray(response.data.data)) {
        const formattedData = response.data.data.map((item, index) => ({
          srNo: index + 1,
          invoiceNo: item.clientDetails?.invoiceSrNo || "-",
          invoiceDate: item.clientDetails?.invoiceDate
            ? new Date(item.clientDetails.invoiceDate).toLocaleDateString()
            : "-",
          accountCode: item.clientDetails?.accountCode || "-",
          customerName: item.clientDetails?.customerName || "-",
          gstNo: item.clientDetails?.gstNo || "-",
          branch: item.clientDetails?.branch || "-",
          salesPersonName: item.salesPersonName || "-",
          fromDate: item.clientDetails?.dateFrom
            ? new Date(item.clientDetails.dateFrom).toLocaleDateString()
            : "-",
          toDate: item.clientDetails?.dateTo
            ? new Date(item.clientDetails.dateTo).toLocaleDateString()
            : "-",
          freightAmount:
            item.amountDetails?.freightAmount?.toFixed(2) || "0.00",
          clearanceAmount:
            item.amountDetails?.clearanceCharge?.toFixed(2) || "0.00",
          grandTotal: item.amountDetails?.grandTotal?.toFixed(2) || "0.00",
          exchangeRate: item.amountDetails?.currency || "INR",
          exchangeAmount:
            item.amountDetails?.exchangeAmount?.toFixed(2) || "0.00",
        }));

        setRowData(formattedData);
        showNotification(
          "success",
          `Found ${formattedData.length} invoice(s) for the selected criteria`
        );
      } else {
        setRowData([]);
        showNotification("info", "No invoices found for the selected criteria");
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch invoice data"
      );
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to print");
      return;
    }

    const doc = new jsPDF("landscape");

    // Add title
    doc.setFontSize(16);
    doc.text("Invoice PTP Summary Report", 14, 15);

    // Add filters info
    doc.setFontSize(10);
    let yPos = 25;
    if (selectedBranch) {
      doc.text(`Branch: ${selectedBranch}`, 14, yPos);
      yPos += 5;
    }
    if (customerCode) {
      doc.text(`Customer Code: ${customerCode}`, 14, yPos);
      yPos += 5;
    }
    doc.text(`Date Range: ${fromDate || ""} to ${toDate || ""}`, 14, yPos);

    // Prepare table data
    const tableData = rowData.map((row) => [
      row.srNo,
      row.invoiceNo,
      row.invoiceDate,
      row.accountCode,
      row.customerName,
      row.gstNo,
      row.branch,
      row.salesPersonName,
      row.fromDate,
      row.toDate,
      row.freightAmount,
      row.clearanceAmount,
      row.grandTotal,
      row.exchangeRate,
      row.exchangeAmount,
    ]);

    // Add table
    autoTable(doc, {
      startY: yPos + 10,
      head: [
        [
          "Sr No.",
          "Invoice No",
          "Invoice Date",
          "Customer Code",
          "Customer Name",
          "GST No",
          "Branch",
          "Sales Person",
          "From Date",
          "To Date",
          "Freight Amount",
          "Clearance Amount",
          "Grand Total",
          "Currency",
          "Exchange Amount",
        ],
      ],
      body: tableData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
    });

    doc.save(`invoice-ptp-summary-${Date.now()}.pdf`);
    showNotification("success", "PDF downloaded successfully");
  };

  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice Summary");

    // Set column widths
    const columnWidths = [
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
    ];
    worksheet["!cols"] = columnWidths;

    XLSX.writeFile(workbook, `invoice-ptp-summary-${Date.now()}.xlsx`);
    showNotification("success", "Excel file downloaded successfully");
  };

  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rowData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `invoice-ptp-summary-${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("success", "CSV file downloaded successfully");
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
                  label={loading ? `Loading...` : `Show`}
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
        <div className="flex justify-end"></div>
      </form>
    </>
  );
}

export default DateRangeWise;
