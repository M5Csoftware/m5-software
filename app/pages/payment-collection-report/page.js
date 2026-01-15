"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { Dropdown, LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { X } from "lucide-react";

function PaymentCollectionReport() {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      modeFilter: "",
      receiptFilter: "",
      Branch: "",
      Customer: "",
      customerName: "",
      from: "",
      to: "",
    },
  });
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [withHoldAWB, setWithHoldAWB] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerNameLoading, setCustomerNameLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [totals, setTotals] = useState({
    receiptAmount: 0,
    debitAmount: 0,
    creditAmount: 0,
  });
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const [branchList, setBranchList] = useState([]);

  // Watch form values
  const formData = watch();
  const customerCode = watch("Customer");

  // State to maintain selected filter values
  const [selectedFilters, setSelectedFilters] = useState({
    modeFilter: "",
    receiptFilter: "",
    Branch: "",
    Customer: "",
    State: "",
  });

  const ddmmyyyyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(`${server}/branch-master/get-branch`);
        const branches = res.data || [];

        // map for dropdown
        const options = branches.map((b) => `${b.code}`);
        setBranchList(options);
      } catch (err) {
        console.error("Error fetching branches", err);
      }
    };

    fetchBranches();
  }, [server]);

  // Fetch customer name when customer code changes
  useEffect(() => {
    const fetchCustomerName = async (code) => {
      if (!code || code.trim() === "") {
        setCustomerName("");
        setValue("customerName", "");
        return;
      }

      setCustomerNameLoading(true);
      try {
        const response = await axios.get(
          `${server}/customer-account?accountCode=${code}`
        );

        if (response.data && response.data.name) {
          const name = response.data.name;
          setCustomerName(name);
          setValue("customerName", name);
        } else {
          setCustomerName("");
          setValue("customerName", "");
        }
      } catch (error) {
        console.error("Error fetching customer name:", error);
        setCustomerName("");
        setValue("customerName", "");

        if (error.response?.status === 404) {
          setCustomerName("Customer not found");
          setValue("customerName", "Customer not found");
        }
      } finally {
        setCustomerNameLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchCustomerName(customerCode);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [customerCode, server, setValue]);

  // Escape key handler for fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const columns = useMemo(
    () => [
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "receiptNo", label: "Receipt Number" },
      {
        key: "date",
        label: "Receipt Date",
        render: (value) => {
          return value ? new Date(value).toLocaleDateString() : "";
        },
      },
      {
        key: "amount",
        label: "Amount",
        render: (value) => `₹${value?.toFixed(2) || 0}`,
      },
      {
        key: "debitAmount",
        label: "Debit Amount",
        render: (value) => `₹${value?.toFixed(2) || 0}`,
      },
      {
        key: "creditAmount",
        label: "Credit Amount",
        render: (value) => `₹${value?.toFixed(2) || 0}`,
      },
      { key: "debitNo", label: "Debit Number" },
      { key: "creditNo", label: "Credit Number" },
      { key: "mode", label: "Payment Mode" },
      { key: "receiptType", label: "Receipt Type" },
      { key: "remarks", label: "Remark" },
      { key: "chequeNo", label: "Cheque Number" },
      { key: "bankName", label: "Bank Name" },
      { key: "entryType", label: "Entry Type" },
      { key: "entryUser", label: "Entry User" },
      { key: "branchCode", label: "Branch" },
      { key: "verified", label: "Payment Verification" },
      { key: "verifiedBy", label: "Payment Verification User" },
      { key: "verifyRemarks", label: "Payment Verification Remarks" },
      { key: "salesPersonName", label: "Sale Person" },
    ],
    []
  );

  // Calculate totals from rowData
  const calculateTotals = (data) => {
    const totals = data.reduce(
      (acc, item) => {
        acc.receiptAmount += Number(item.amount) || 0;
        acc.debitAmount += Number(item.debitAmount) || 0;
        acc.creditAmount += Number(item.creditAmount) || 0;
        return acc;
      },
      { receiptAmount: 0, debitAmount: 0, creditAmount: 0 }
    );

    setTotals(totals);
  };

  // Fetch payment collection data
  const fetchPaymentData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      // Update selected filters state
      const currentFilters = {
        modeFilter: formData.modeFilter || "",
        receiptFilter: formData.receiptFilter || "",
        Branch: formData.Branch || "",
        Customer: formData.Customer || "",
        State: formData.State || "",
      };
      setSelectedFilters(currentFilters);

      // Add filters to params
      if (formData.from)
        params.append("fromDate", ddmmyyyyToYmd(formData.from));

      if (formData.to) params.append("toDate", ddmmyyyyToYmd(formData.to));

      if (formData.modeFilter) params.append("mode", formData.modeFilter);
      if (formData.receiptFilter)
        params.append("receiptType", formData.receiptFilter);
      if (formData.Branch) params.append("branchCode", formData.Branch);
      if (formData.Customer) params.append("customerCode", formData.Customer);
      if (formData.State) params.append("state", formData.State);

      const response = await axios.get(
        `${server}/payment-collection-report?${params.toString()}`
      );

      if (response.data && response.data.payments) {
        const enhancedData = response.data.payments.map((payment) => ({
          ...payment,
          date: payment.date
            ? new Date(payment.date).toISOString().split("T")[0]
            : "",
          entryType: "RTPC",
          entryUser:
            payment.entryUser && payment.entryUser !== ""
              ? payment.entryUser
              : "Unknown",
          verifiedBy:
            payment.verifiedBy && payment.verifiedBy !== ""
              ? payment.verifiedBy
              : "N/A",
        }));

        setRowData(enhancedData);
        calculateTotals(enhancedData);
        showNotification("success", `Found ${enhancedData.length} records`);
      } else {
        setRowData([]);
        setTotals({ receiptAmount: 0, debitAmount: 0, creditAmount: 0 });
        showNotification("info", "No records found");
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
      showNotification("error", "Failed to fetch report data");
      setRowData([]);
      setTotals({ receiptAmount: 0, debitAmount: 0, creditAmount: 0 });
    } finally {
      setLoading(false);
    }
  };

  // Print functionality
  const handlePrint = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to print");
      return;
    }

    const printWindow = window.open("", "_blank");
    const currentDate = new Date().toLocaleDateString();
    const appliedFilters = getAppliedFiltersText();

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Collection Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .filters {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
          }
          th {
            background-color: #dc2626;
            color: white;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .totals {
            margin-top: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            text-align: right;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-weight: bold;
          }
          @media print {
            body { margin: 10px; }
            .header { page-break-after: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Payment Collection Report</h2>
          <p>Generated on: ${currentDate}</p>
        </div>
        
        <div class="filters">
          <strong>Applied Filters:</strong><br/>
          ${appliedFilters}
        </div>

        <table>
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
                    .map((col) => {
                      let cellValue = row[col.key] || "";

                      if (col.key === "date" && cellValue) {
                        cellValue = new Date(cellValue).toLocaleDateString();
                      } else if (
                        col.key === "amount" ||
                        col.key === "debitAmount" ||
                        col.key === "creditAmount"
                      ) {
                        cellValue = `₹${Number(cellValue || 0).toFixed(2)}`;
                      }

                      return `<td>${cellValue}</td>`;
                    })
                    .join("")}
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">
            <span>Receipt Amount:</span>
            <span>₹${totals.receiptAmount.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Debit Amount:</span>
            <span>₹${totals.debitAmount.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>Credit Amount:</span>
            <span>₹${totals.creditAmount.toFixed(2)}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    showNotification("success", "Print dialog opened");
  };

  // Get applied filters text for print header
  const getAppliedFiltersText = () => {
    const filters = [];
    if (formData.from) filters.push(`From Date: ${formData.from}`);
    if (formData.to) filters.push(`To Date: ${formData.to}`);
    if (formData.modeFilter) filters.push(`Mode: ${formData.modeFilter}`);
    if (formData.receiptFilter)
      filters.push(`Receipt Type: ${formData.receiptFilter}`);
    if (formData.Branch) filters.push(`Branch: ${formData.Branch}`);
    if (formData.Customer) filters.push(`Customer: ${formData.Customer}`);
    if (formData.State) filters.push(`State: ${formData.State}`);
    if (withHoldAWB) filters.push(`With Hold AWB: Yes`);

    return filters.length > 0 ? filters.join(", ") : "No filters applied";
  };

  // Download as CSV
  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const headers = columns.map((col) => col.label);
      const csvData = [
        headers.join(","),
        ...rowData.map((row) =>
          columns
            .map((col) => {
              let cellValue = row[col.key] || "";

              if (col.key === "date" && cellValue) {
                cellValue = new Date(cellValue).toLocaleDateString();
              } else if (
                col.key === "amount" ||
                col.key === "debitAmount" ||
                col.key === "creditAmount"
              ) {
                cellValue = Number(cellValue || 0).toFixed(2);
              }

              return `"${String(cellValue).replace(/"/g, '""')}"`;
            })
            .join(",")
        ),
        `"","","","","Receipt Amount: ${totals.receiptAmount.toFixed(
          2
        )}","Debit Amount: ${totals.debitAmount.toFixed(
          2
        )}","Credit Amount: ${totals.creditAmount.toFixed(2)}"` +
          ",".repeat(columns.length - 7),
      ].join("\n");

      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `payment_collection_report_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "CSV file downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Failed to download CSV file");
    }
  };

  // Download as Excel
  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const excelData = `
        <html>
        <head>
          <meta charset="utf-8">
          <title>Payment Collection Report</title>
        </head>
        <body>
          <h2>Payment Collection Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p><strong>Applied Filters:</strong> ${getAppliedFiltersText()}</p>
          
          <table border="1">
            <thead>
              <tr style="background-color: #f2f2f2;">
                ${columns.map((col) => `<th>${col.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rowData
                .map(
                  (row) => `
                <tr>
                  ${columns
                    .map((col) => {
                      let cellValue = row[col.key] || "";

                      if (col.key === "date" && cellValue) {
                        cellValue = new Date(cellValue).toLocaleDateString();
                      } else if (
                        col.key === "amount" ||
                        col.key === "debitAmount" ||
                        col.key === "creditAmount"
                      ) {
                        cellValue = Number(cellValue || 0).toFixed(2);
                      }

                      return `<td>${cellValue}</td>`;
                    })
                    .join("")}
                </tr>
              `
                )
                .join("")}
              <tr style="background-color: #f9f9f9; font-weight: bold;">
                <td colspan="${columns.length - 3}">Totals:</td>
                <td>₹${totals.receiptAmount.toFixed(2)}</td>
                <td>₹${totals.debitAmount.toFixed(2)}</td>
                <td>₹${totals.creditAmount.toFixed(2)}</td>
                <td colspan="${Math.max(
                  0,
                  columns.length - (columns.length - 3) - 3
                )}"></td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelData], {
        type: "application/vnd.ms-excel;charset=utf-8;",
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `payment_collection_report_${
          new Date().toISOString().split("T")[0]
        }.xls`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Failed to download Excel file");
    }
  };

  // Download as PDF
  const handleDownloadPDF = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const printWindow = window.open("", "_blank");
    const currentDate = new Date().toLocaleDateString();
    const appliedFilters = getAppliedFiltersText();

    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Collection Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 15px;
            font-size: 10px;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .filters {
            margin-bottom: 15px;
            padding: 8px;
            background-color: #f5f5f5;
            border-radius: 3px;
            font-size: 9px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 8px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 3px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .totals {
            margin-top: 10px;
            padding: 8px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            text-align: right;
            font-size: 9px;
          }
          .totals-row {
            margin: 3px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>Payment Collection Report</h2>
          <p>Generated on: ${currentDate}</p>
        </div>
        
        <div class="filters">
          <strong>Applied Filters:</strong><br/>
          ${appliedFilters}
        </div>

        <table>
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
                  .map((col) => {
                    let cellValue = row[col.key] || "";

                    if (col.key === "date" && cellValue) {
                      cellValue = new Date(cellValue).toLocaleDateString();
                    } else if (
                      col.key === "amount" ||
                      col.key === "debitAmount" ||
                      col.key === "creditAmount"
                    ) {
                      cellValue = `₹${Number(cellValue || 0).toFixed(2)}`;
                    }

                    return `<td>${cellValue}</td>`;
                  })
                  .join("")}
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-row">Receipt Amount: ₹${totals.receiptAmount.toFixed(
            2
          )}</div>
          <div class="totals-row">Debit Amount: ₹${totals.debitAmount.toFixed(
            2
          )}</div>
          <div class="totals-row">Credit Amount: ₹${totals.creditAmount.toFixed(
            2
          )}</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 1000);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(pdfContent);
    printWindow.document.close();

    showNotification("success", "PDF print dialog opened");
  };

  const handleShowData = (e) => {
    e.preventDefault();
    fetchPaymentData();
  };

  // Complete refresh handler
  const handleRefresh = () => {
    // Clear all states first
    setRowData([]);
    setTotals({ receiptAmount: 0, debitAmount: 0, creditAmount: 0 });
    setCustomerName("");
    setWithHoldAWB(false);

    // Clear selected filters
    setSelectedFilters({
      modeFilter: "",
      receiptFilter: "",
      Branch: "",
      Customer: "",
      State: "",
    });

    // Increment form key to force complete remount
    setFormKey((prev) => prev + 1);

    // Reset form
    reset({
      modeFilter: "",
      receiptFilter: "",
      Branch: "",
      Customer: "",
      customerName: "",
      from: "",
      to: "",
    });

    // Show refresh notification
    showNotification("success", "Page refreshed successfully");
  };

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
        title={`Payment Collection Report`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => setIsFullscreen(true)}
      />

      <div className="flex flex-col gap-3 mt-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="w-full">
              <Dropdown
                key={`modeFilter-${formKey}`}
                title="Mode"
                options={[
                  "Cash",
                  "Cheque",
                  "DD",
                  "RTGS",
                  "NEFT",
                  "IMPS",
                  "Bank",
                  "Demand Draft",
                  "Overseas (COD)",
                  "Others",
                ]}
                value="modeFilter"
                register={register}
                setValue={setValue}
              />
            </div>

            <div className="w-full">
              <Dropdown
                key={`receiptFilter-${formKey}`}
                title="Receipt Type"
                options={[
                  "General Entry",
                  "Debit Note",
                  "Credit Note",
                  "TDS",
                  "Return",
                  "Bad Debts",
                  "Other",
                ]}
                value="receiptFilter"
                register={register}
                setValue={setValue}
              />
            </div>

            {/* <InputBox
              key={`Branch-${formKey}`}
              placeholder={`Branch`}
              register={register}
              setValue={setValue}
              value={`Branch`}
            /> */}
            <LabeledDropdown
              key={`Branch-${formKey}`}
              placeholder={`Branch`}
              register={register}
              setValue={setValue}
              value={`Branch`}
              options={branchList}
            />
          </div>
          <div className="flex gap-3">
            <DateInputBox
              key={`from-${formKey}`}
              register={register}
              setValue={setValue}
              value={`from`}
              placeholder="From"
            />
            <DateInputBox
              key={`to-${formKey}`}
              register={register}
              setValue={setValue}
              value={`to`}
              placeholder="To"
            />
            <div className="w-full">
              <InputBox
                key={`Customer-${formKey}`}
                placeholder={`Customer Code`}
                register={register}
                setValue={setValue}
                value={`Customer`}
              />
            </div>

            <div className="w-full relative">
              <DummyInputBoxWithLabelDarkGray
                key={`customerName-${formKey}`}
                placeholder={
                  customerNameLoading ? "Loading..." : "Customer Name"
                }
                register={register}
                setValue={setValue}
                value={"customerName"}
                disabled={true}
                style={{
                  backgroundColor: customerNameLoading ? "#f9f9f9" : "#f5f5f5",
                  color:
                    customerName === "Customer not found"
                      ? "#ef4444"
                      : "#374151",
                }}
              />
              {customerNameLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              )}
            </div>

            <div className="min-w-fit">
              <OutlinedButtonRed
                label={loading ? `Loading...` : `Show`}
                onClick={handleShowData}
                disabled={loading}
                type="button"
              />
            </div>
            <div>
              <DownloadDropdown
                handleDownloadPDF={handleDownloadPDF}
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
                buttonClassname="px-10 py-1"
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
          className={`border-b-0 rounded-b-none h-[45vh]`}
        />
        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16">
          <div>
            <span className="font-sans">Receipt Amount:</span>
            <span className="text-red">
              {" "}
              ₹ {totals.receiptAmount.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-16">
              <div>
                Debit Amount:{" "}
                <span className="text-red">
                  ₹{totals.debitAmount.toFixed(2)}
                </span>
              </div>
              <div>
                Credit Amount:{" "}
                <span className="text-red">
                  ₹{totals.creditAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Payment Collection Report - Fullscreen View
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
          <div className="flex justify-end border-t border-gray-300 pt-4 mt-4 gap-16">
            <div>
              <span className="font-sans font-semibold">Receipt Amount:</span>
              <span className="text-red font-semibold">
                {" "}
                ₹ {totals.receiptAmount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-semibold">Debit Amount: </span>
              <span className="text-red font-semibold">
                ₹{totals.debitAmount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-semibold">Credit Amount: </span>
              <span className="text-red font-semibold">
                ₹{totals.creditAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed type="button" label={"Close"} /> */}</div>
        <div className="flex gap-2">
          {/* <OutlinedButtonRed 
            label="Print" 
            className="px-10 py-1" 
            onClick={handlePrint}
            type="button"
          /> */}
        </div>
      </div>
    </form>
  );
}

export default PaymentCollectionReport;
