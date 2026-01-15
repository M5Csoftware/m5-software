"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import Image from "next/image";
import { show } from "@tauri-apps/api/app";
import { LabeledDropdown } from "@/app/components/Dropdown";

const PaymentReceiptSummary = () => {
  const { register, setValue, handleSubmit, getValues, reset } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [branchOptions, setBranchOptions] = useState([]);

  const values = getValues();
  const columns = [
    { key: "type", label: "Mode" },
    { key: "value", label: values.branch || "Branch Code" },
  ];

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const handleShow = async () => {
    const values = getValues();

    if (!values.branch) {
      showNotification("error", "Please enter Branch Code");
      return;
    }

    // Require both From and To dates
    if (!values.from || !values.to) {
      showNotification("error", "Please enter both From and To dates");
      return;
    }

    // Validate date range - from date should not be greater than to date
    const fromDate = parseDateDDMMYYYY(values.from);
    const toDate = parseDateDDMMYYYY(values.to);

    if (
      !fromDate ||
      !toDate ||
      isNaN(fromDate.getTime()) ||
      isNaN(toDate.getTime())
    ) {
      showNotification("error", "Invalid date format");
      return;
    }

    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    if (fromDate > toDate) {
      showNotification("error", "From date cannot be greater than To date");
      return;
    }

    setLoading(true);

    try {
      let url = `${server}/payment-receipt?branch=${encodeURIComponent(
        values.branch
      )}`;

      if (values.from) {
        url += `&from=${encodeURIComponent(fromDate.toISOString())}`;
      }

      if (values.to) {
        url += `&to=${encodeURIComponent(toDate.toISOString())}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        // Define bank mode types (removed overseas)
        const bankModeTypes = ["rtgs", "cheque", "neft", "imps"];

        // Process data to create table rows
        let cashAmount = 0;
        let bankAmount = 0;
        let debitCount = 0;
        let creditCount = 0;
        let returnAmount = 0;

        // Calculate totals from raw data
        data.rawData.forEach((item) => {
          const mode = (item.mode || "").toLowerCase();
          const amount = item.amount || 0;

          if (mode === "cash") {
            cashAmount += amount;
            returnAmount += amount; // Return shows cash amount
          } else if (bankModeTypes.includes(mode)) {
            bankAmount += amount;
          }

          // Count debit and credit entries based on branch
          if (item.branchCode === values.branch) {
            if (item.debitAmount && item.debitAmount > 0) {
              debitCount++;
            }
            if (item.creditAmount && item.creditAmount > 0) {
              creditCount++;
            }
          }
        });

        // Create table data in the required format
        const formattedData = [
          {
            id: 1,
            type: "Cash",
            value: cashAmount.toFixed(0), // Remove decimal for whole numbers
          },
          {
            id: 2,
            type: "Bank",
            value: bankAmount.toFixed(0),
          },
          {
            id: 3,
            type: "DebitNote",
            value: debitCount.toString(),
          },
          {
            id: 4,
            type: "CreditNote",
            value: creditCount.toString(),
          },
          {
            id: 5,
            type: "Return",
            value: returnAmount.toFixed(0),
          },
        ];

        setRowData(formattedData);
        console.log(`Processed ${data.rawData.length} payment entries`);
      } else {
        console.error("API Error:", data.error);
        showNotification("error", data.error);
        setRowData([]);
      }
    } catch (error) {
      console.error("Error fetching payment data:", error);
      showNotification("error", `Failed to fetch data: ${error.message}`);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    reset();
    setRowData([]);
  };

  const handleDownload = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const values = getValues();

    // Convert data to CSV format
    const headers = "Mode," + (values.branch || "Branch Code");
    const csvData = rowData
      .map((row) => `"${row.type}","${row.value}"`)
      .join("\n");

    const csvContent = headers + "\n" + csvData;

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "payment_receipt_summary.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to print");
      return;
    }

    const printWindow = window.open("", "_blank");
    const values = getValues();

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt Summary</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              font-size: 12px;
              line-height: 1.4;
            }
            h1 { 
              color: #333; 
              text-align: center; 
              font-size: 18px;
              margin-bottom: 20px;
            }
            .info { 
              margin: 15px 0; 
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
            }
            .info p {
              margin: 5px 0;
              font-size: 11px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0; 
              font-size: 10px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 6px; 
              text-align: left; 
              word-wrap: break-word;
            }
            th { 
              background-color: #f2f2f2; 
              font-weight: bold;
              font-size: 11px;
            }
            @media print {
              body { font-size: 10px; }
              table { font-size: 9px; }
              th, td { padding: 4px; }
            }
          </style>
        </head>
        <body>
          <h1>Payment Receipt Summary</h1>
          <div class="info">
            <div>
              <p><strong>Branch:</strong> ${values.branch || "All"}</p>
              <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <div>
              <p><strong>From Date:</strong> ${values.from || "N/A"}</p>
              <p><strong>To Date:</strong> ${values.to || "N/A"}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Mode</th>
                <th>${values.branch || "Branch Code"}</th>
              </tr>
            </thead>
            <tbody>
              ${rowData
                .map(
                  (row) => `
                <tr>
                  <td>${row.type}</td>
                  <td>${row.value}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const onSubmit = (data) => {
    console.log("data :", data);
    handleShow();
  };

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await fetch(`${server}/payment-receipt/branches`);
        const data = await res.json();

        if (data.success) {
          setBranchOptions(data.data.map((b) => b.code));
        }
      } catch (err) {
        console.error("Failed to load branches", err);
      }
    };

    fetchBranches();
  }, [server]);

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-row gap-6 items-center">
        <Heading
          title="Payment Receipt Summary"
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          onRefresh={handleRefresh}
        />
      </div>

      <div className="flex flex-row gap-3">
        {/* <InputBox
          placeholder="Branch"
          register={register}
          setValue={setValue}
          value="branch"
        /> */}

        <LabeledDropdown
          title="Branch"
          value="branch"
          register={register}
          setValue={setValue}
          options={branchOptions}
        />
        <DateInputBox
          placeholder="From"
          register={register}
          setValue={setValue}
          value="from"
        />
        <DateInputBox
          placeholder="To"
          register={register}
          setValue={setValue}
          value="to"
        />

        <div>
          <OutlinedButtonRed
            label={loading ? "Loading..." : "Show"}
            onClick={handleShow}
            disabled={loading}
          />
        </div>
      </div>

      <TableWithSorting
        register={register}
        setValue={setValue}
        name="bagging"
        columns={columns}
        rowData={rowData}
        className="h-[450px]"
      />

      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed label="Close" /> */}</div>
        <div className="flex gap-3">
          <OutlinedButtonRed
            label="A4 Print"
            onClick={handlePrint}
            disabled={rowData.length === 0}
          />
          <SimpleButton
            name="Download"
            onClick={handleDownload}
            disabled={rowData.length === 0}
          />
        </div>
      </div>
    </form>
  );
};

export default PaymentReceiptSummary;
