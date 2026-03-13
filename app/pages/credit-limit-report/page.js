"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
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
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import * as XLSX from "xlsx";
import { X } from "lucide-react";
import NotificationFlag from "@/app/components/Notificationflag";

function CreditLimitReport() {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      Customer: "",
      name: "",
    },
  });
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [grandTotal, setGrandTotal] = useState("0.00");
  const [totalCreditBalance, setTotalCreditBalance] = useState("0.00");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const printRef = useRef(null);

  // Watch form values for filtering
  const customerCode = watch("Customer");
  const customerName = watch("name");

  const columns = useMemo(
    () => [
      { key: "accountCode", label: "Code" },
      { key: "name", label: "Name" },
      { key: "companyCode", label: "Company Code" },
      { key: "branch", label: "Branch Code" },
      { key: "salesPersonName", label: "Sale Person" },
      { key: "referenceBy", label: "Reference By" },
      { key: "collectionBy", label: "Collection By" },
      { key: "accountManager", label: "Account Manager" },
      { key: "reportPerson", label: "Report Person" },
      { key: "paymentTerms", label: "Pay Type" },
      { key: "billingCycle", label: "Billing Cycle" },
      { key: "openingBalance", label: "Opening Balance" },
      { key: "creditLimit", label: "Credit Limit" },
      { key: "totalAmt", label: "Total Sale" },
      { key: "amount", label: "Total Receipt" },
      { key: "debitAmount", label: "Total Debit" },
      { key: "creditAmount", label: "Total Credit" },
      { key: "leftOverBalance", label: "Total Outstanding" },
      { key: "creditBalance", label: "Credit Balance" },
      { key: "groupCode", label: "Group Code" },
      { key: "currency", label: "Currency" },
    ],
    []
  );

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Fetch data function
  const fetchCreditLimitReport = async (
    accountCode = "",
    customerName = ""
  ) => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (accountCode && accountCode.trim()) {
        params.append("accountCode", accountCode.trim());
      }
      if (customerName && customerName.trim()) {
        params.append("customerName", customerName.trim());
      }

      const response = await axios.get(
        `${server}/credit-limit-report?${params.toString()}`
      );

      if (response.data.success) {
        setRowData(response.data.data);
        setTotalRecords(response.data.totalRecords);
        setGrandTotal(response.data.grandTotal);

        // Calculate total credit balance
        const creditBalanceSum = response.data.data.reduce((sum, record) => {
          return sum + (parseFloat(record.creditBalance) || 0);
        }, 0);
        setTotalCreditBalance(creditBalanceSum.toFixed(2));

        if (response.data.data.length === 0) {
          showNotification("info", "No records found");
        }
      } else {
        console.error("Failed to fetch report:", response.data.error);
        setRowData([]);
        setTotalRecords(0);
        setGrandTotal("0.00");
        setTotalCreditBalance("0.00");
        showNotification("error", "Failed to fetch report");
      }
    } catch (error) {
      console.error("Error fetching credit limit report:", error);
      setRowData([]);
      setTotalRecords(0);
      setGrandTotal("0.00");
      setTotalCreditBalance("0.00");
      showNotification("error", `Error fetching report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load all data on component mount
  useEffect(() => {
    fetchCreditLimitReport();
  }, []);

  // Handle show button click with filters
  const handleShow = () => {
    const code = customerCode || "";
    const name = customerName || "";
    fetchCreditLimitReport(code, name);
  };

  // Handle refresh with complete reset
  const handleRefresh = () => {
    // Clear all states first
    setRowData([]);
    setTotalRecords(0);
    setGrandTotal("0.00");
    setTotalCreditBalance("0.00");

    // Increment form key to force complete remount
    setFormKey((prev) => prev + 1);

    // Reset form
    reset({
      Customer: "",
      name: "",
    });

    // Fetch all data again
    fetchCreditLimitReport();

    // Show refresh notification
    showNotification("success", "Page refreshed successfully");
  };

  // Escape key handler for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Handle print functionality
  const handlePrint = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to print");
      return;
    }

    const printStyles = `
      <style>
        @media print {
          * { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; }
          .print-container { width: 100%; }
          .print-title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 20px; }
          .print-table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .print-table th, .print-table td { border: 1px solid #000; padding: 4px; text-align: left; }
          .print-table th { background-color: #f0f0f0; font-weight: bold; }
          .print-footer { margin-top: 20px; display: flex; justify-content: space-between; font-weight: bold; }
          .no-print { display: none; }
        }
      </style>
    `;

    const printHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Credit Limit Report</title>
          ${printStyles}
        </head>
        <body>
          <div class="print-container">
            <h1 class="print-title">Credit Limit Report</h1>
            <table class="print-table">
              <thead>
                <tr>
                  ${columns.map((col) => `<th>${col.label}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${rowData
                  .map(
                    (row) => `
                  <tr>
                    ${columns
                      .map((col) => `<td>${row[col.key] || ""}</td>`)
                      .join("")}
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="print-footer">
              <div>Total Records: ${totalRecords}</div>
              <div>Total Credit: ${totalCreditBalance}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.print();
    showNotification("success", "Print dialog opened");
  };

  // Handle Excel download
  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = rowData.map((row) => {
        const formattedRow = {};
        columns.forEach((col) => {
          formattedRow[col.label] = row[col.key] || "";
        });
        return formattedRow;
      });

      // Add summary row
      const summaryRow = {};
      columns.forEach((col, index) => {
        if (index === 0) {
          summaryRow[col.label] = `Total Records: ${totalRecords}`;
        } else if (index === columns.length - 1) {
          summaryRow[col.label] = `Total Credit: ${totalCreditBalance}`;
        } else {
          summaryRow[col.label] = "";
        }
      });
      excelData.push(summaryRow);

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Credit Limit Report");

      // Save file
      XLSX.writeFile(
        wb,
        `credit-limit-report-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Error downloading Excel file");
    }
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Prepare CSV content
      const headers = columns.map((col) => col.label).join(",");
      const csvContent = rowData
        .map((row) => {
          return columns
            .map((col) => {
              const value = row[col.key] || "";
              // Escape quotes and wrap in quotes if contains comma
              return typeof value === "string" && value.includes(",")
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            })
            .join(",");
        })
        .join("\n");

      // Add summary
      const summaryLine = `Total Records: ${totalRecords},,,,,,,,,,,,,,,,,,,Total Credit: ${totalCreditBalance}`;

      const fullCSV = `${headers}\n${csvContent}\n${summaryLine}`;

      // Create and download file
      const blob = new Blob([fullCSV], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `credit-limit-report-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification("success", "CSV file downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Error downloading CSV file");
    }
  };

  useEffect(() => {
    const code = watch("Customer");

    if (!code || code.length < 3) {
      setValue("name", "");
      return;
    }

    const fetchName = async () => {
      try {
        const res = await axios.get(
          `${server}/credit-summary-report?action=customer&accountCode=${code.toUpperCase()}`
        );

        if (res.data?.customerName) {
          setValue("name", res.data.customerName); // auto-fill
        } else {
          setValue("name", "");
        }
      } catch (err) {
        console.error("Error fetching customer name:", err);
        setValue("name", "");
      }
    };

    fetchName();
  }, [watch("Customer")]);

  return (
    <form className="flex flex-col gap-3" key={formKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title={`Credit Limit Report`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => setIsFullscreen(true)}
      />
      <div className="flex flex-col gap-3 mt-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="w-full">
              <InputBox
                key={`Customer-${formKey}`}
                placeholder={`Customer Code`}
                register={register}
                setValue={setValue}
                value={`Customer`}
                name="Customer"
              />
            </div>

            <div className="w-full">
              <InputBox
                key={`name-${formKey}`}
                placeholder={`Customer Name`}
                register={register}
                setValue={setValue}
                value={`name`}
                name="name"
                initialValue={watch("name") || ""}
              />
            </div>
            <div className="">
              <OutlinedButtonRed
                label={loading ? `Loading...` : `Show`}
                onClick={handleShow}
                disabled={loading}
                type="button"
              />
            </div>
            <div>
              <DownloadCsvExcel
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
              />
            </div>
          </div>
        </div>
      </div>
      <div ref={printRef}>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className={`border-b-0 rounded-b-none h-[45vh]`}
          loading={loading}
        />
        <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2">
          {/* Left side: Total Records */}
          <div>
            <span className="font-sans">Total Records: </span>
            <span className="text-red">{totalRecords}</span>
          </div>

          {/* Right side: Total Credit Balance */}
          <div>
            Total Credit: <span className="text-red">{totalCreditBalance}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Credit Limit Report - Fullscreen View
            </h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <TableWithSorting
              register={register}
              setValue={setValue}
              columns={columns}
              rowData={rowData}
              className="h-full w-full"
            />
          </div>
          <div className="flex justify-between items-center border-t border-gray-300 pt-4 mt-4">
            <div>
              <span className="font-sans font-semibold">Total Records: </span>
              <span className="text-red font-semibold">{totalRecords}</span>
            </div>
            <div>
              <span className="font-semibold">Total Credit: </span>
              <span className="text-red font-semibold">
                {totalCreditBalance}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed type="button" label={"Close"} /> */}</div>
        <div className="flex gap-2">
          {/* <OutlinedButtonRed 
            type="button" 
            label={"Print"} 
            onClick={handlePrint}
          /> */}
        </div>
      </div>
    </form>
  );
}

export default CreditLimitReport;
