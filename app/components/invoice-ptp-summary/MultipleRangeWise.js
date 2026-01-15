"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import DownloadCsvExcel from "../DownloadCsvExcel";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import * as XLSX from "xlsx";
import { X } from "lucide-react";

function MultipleRangeWise() {
  const { register, setValue } = useForm();
  const { server } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [invoiceList, setInvoiceList] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invoiceInput, setInvoiceInput] = useState("");
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const columns = useMemo(
    () => [
      { key: "srNo", label: "SR No" },
      { key: "invoiceNo", label: "Invoice No" },
      { key: "invoiceDate", label: "Invoice Date" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "gstNo", label: "GST No" },
      { key: "state", label: "State" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
      { key: "airFreight", label: "Air Freight" },
      { key: "clearanceCharge", label: "Clearance Charge" },
      { key: "exchangeRate", label: "Exchange Rate" },
      { key: "exchangeRateAmount", label: "Exchange Rate Amount" },
    ],
    []
  );

  // Handle paste event
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const invoiceNumbers = pastedText
      .split(/[\n,\s]+/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0);

    if (invoiceNumbers.length > 0) {
      // Remove duplicates and add to existing list
      const newInvoices = [...new Set([...invoiceList, ...invoiceNumbers])];
      setInvoiceList(newInvoices);
      setInvoiceInput("");

      setNotification({
        type: "success",
        message: `Added ${invoiceNumbers.length} invoice(s)`,
        visible: true,
      });
    }
  };

  // Handle manual input
  const handleInputKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const invoiceNum = invoiceInput.trim();

      if (invoiceNum && !invoiceList.includes(invoiceNum)) {
        setInvoiceList([...invoiceList, invoiceNum]);
        setInvoiceInput("");

        setNotification({
          type: "success",
          message: "Invoice added",
          visible: true,
        });
      } else if (invoiceList.includes(invoiceNum)) {
        setNotification({
          type: "error",
          message: "Invoice already added",
          visible: true,
        });
      }
    }
  };

  // Remove invoice from list
  const removeInvoice = (invoiceToRemove) => {
    setInvoiceList(invoiceList.filter((inv) => inv !== invoiceToRemove));
    if (selectedInvoice === invoiceToRemove) {
      setSelectedInvoice(null);
    }
  };

  // Fetch invoice data
  const handleShow = async () => {
    if (invoiceList.length === 0) {
      setNotification({
        type: "error",
        message: "Please add at least one invoice number",
        visible: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${server}/invoice-ptp-summary/multiple-invoice`,
        {
          invoiceNumbers: invoiceList,
        }
      );

      if (response.data.success) {
        setRowData(response.data.data);
        setNotification({
          type: "success",
          message: `Found ${response.data.count} invoice(s)`,
          visible: true,
        });
      } else {
        setRowData([]);
        setNotification({
          type: "error",
          message: response.data.message || "No data found",
          visible: true,
        });
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      setRowData([]);
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to fetch data",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to download",
        visible: true,
      });
      return;
    }

    const headers = columns.map((col) => col.label).join(",");
    const rows = rowData.map((row) => {
      return columns
        .map((col) => {
          const value = row[col.key] || "";
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

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `ptp_invoice_summary_${new Date().getTime()}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      type: "success",
      message: "CSV downloaded successfully",
      visible: true,
    });
  };

  const handleDownloadExcel = () => {
    if (!rowData || rowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to download",
        visible: true,
      });
      return;
    }

    const wsData = [
      columns.map((col) => col.label),
      ...rowData.map((row) => columns.map((col) => row[col.key] || "")),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const colWidths = columns.map((col) => ({
      wch: Math.max(col.label.length, 15),
    }));
    ws["!cols"] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PTP Invoice Summary");

    XLSX.writeFile(wb, `ptp_invoice_summary_${new Date().getTime()}.xlsx`);

    setNotification({
      type: "success",
      message: "Excel downloaded successfully",
      visible: true,
    });
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

      <form className="flex flex-col gap-4">
        {/* Split View: Invoice List (Left) + Table (Right) */}
        <div className="flex gap-4 h-[450px]">
          {/* Left Side: Invoice List */}
          <div className="w-64 flex flex-col border border-gray-300 rounded h-full">
            <div className="p-3 border-b border-gray-300 bg-gray-100 font-semibold">
              Invoice Numbers
            </div>

            {/* Input for pasting/typing invoice numbers */}
            <div className="p-3 border-b border-gray-300">
              <input
                type="text"
                value={invoiceInput}
                onChange={(e) => setInvoiceInput(e.target.value)}
                onPaste={handlePaste}
                onKeyPress={handleInputKeyPress}
                placeholder="Paste or type invoice..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste multiple or press Enter
              </p>
            </div>

            {/* Invoice List */}
            <div className="flex-1 overflow-y-auto">
              {invoiceList.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No invoices added yet
                </div>
              ) : (
                invoiceList.map((invoice) => (
                  <div
                    key={invoice}
                    onClick={() => setSelectedInvoice(invoice)}
                    className={`px-3 py-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition flex items-center justify-between ${
                      selectedInvoice === invoice
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : ""
                    }`}
                  >
                    <span className="flex-1 truncate">{invoice}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeInvoice(invoice);
                      }}
                      className="ml-2 p-1 hover:bg-red-100 rounded transition"
                    >
                      <X size={16} className="text-red-600" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Show Button */}
            <div className="p-3 border-t border-gray-300">
              <OutlinedButtonRed
                label={loading ? "Loading..." : "Show"}
                onClick={handleShow}
                disabled={loading || invoiceList.length === 0}
              />
            </div>
          </div>

          {/* Right Side: Main Table */}
          <div className="flex-1 overflow-x-auto">
            <div>
              <TableWithSorting
                register={register}
                setValue={setValue}
                columns={columns}
                rowData={rowData}
                className="h-[450px]"
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between">
          <div></div>
          <div className="flex gap-2">
            <DownloadCsvExcel
              handleDownloadExcel={handleDownloadExcel}
              handleDownloadCSV={handleDownloadCSV}
            />
          </div>
        </div>
      </form>
    </>
  );
}

export default MultipleRangeWise;