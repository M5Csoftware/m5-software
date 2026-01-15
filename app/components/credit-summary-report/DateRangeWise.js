"use client";
import React, { useState, useEffect, useContext } from "react";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { LabeledDropdown } from "../Dropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { X } from "lucide-react";
import axios from "axios";
import * as XLSX from "xlsx";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";

const DateRangeWise = ({
  register,
  setValue,
  isFullscreen,
  setIsFullscreen,
}) => {
  const { server } = useContext(GlobalContext);

  const [branches, setBranches] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Form state
  const [formData, setFormData] = useState({
    branch: "",
    customer: "",
    startDate: "",
    endDate: "",
  });

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const columns = [
    { key: "SrNo", label: "Sr No." },
    { key: "InvoiceNo", label: "Invoice No." },
    { key: "InvoiceDate", label: "Invoice Date" },
    { key: "CustomerCode", label: "Customer Code" },
    { key: "CustomerName", label: "Customer Name" },
    { key: "GSTNo", label: "GST No." },
    { key: "Branch", label: "Branch" },
    { key: "SalePerson", label: "Sale Person" },
    { key: "FromDate", label: "From Date" },
    { key: "ToDate", label: "To Date" },
    { key: "NonTaxable", label: "Non-Taxable" },
    { key: "BasicAmount", label: "Basic Amount" },
    { key: "MiscAmount", label: "Misc Amount" },
    { key: "Fuel", label: "Fuel" },
    { key: "Taxable", label: "Taxable" },
    { key: "SGST", label: "SGST" },
    { key: "CGST", label: "CGST" },
    { key: "IGST", label: "IGST" },
    { key: "GrandTotal", label: "Grand Total" },
    { key: "IRN", label: "IRN" },
  ];

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Fetch branches on component mount
  useEffect(() => {
    fetchBranches();
  }, []);

  // Sync form data with register/setValue
  useEffect(() => {
    if (setValue) {
      setValue("branch", formData.branch);
      setValue("customer", formData.customer);
      setValue("startDate", formData.startDate);
      setValue("endDate", formData.endDate);
    }
  }, [formData, setValue]);

  const fetchBranches = async () => {
    try {
      const response = await axios.get(
        `${server}/credit-summary-report?action=branches`
      );
      if (response.data && Array.isArray(response.data)) {
        const branchOptions = [...response.data.map((branch) => branch.code)];
        setBranches(branchOptions);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      showNotification("error", "Failed to fetch branches");
    }
  };

  // Fetch customer name when account code changes
  const handleAccountCodeChange = async (value) => {
    setFormData((prev) => ({ ...prev, customer: value }));

    if (!value || value.length < 3) {
      setCustomerName("");
      return;
    }

    try {
      const response = await axios.get(
        `${server}/credit-summary-report?action=customer&accountCode=${value}`
      );
      if (response.data && response.data.customerName) {
        setCustomerName(response.data.customerName);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      setCustomerName("");
    }
  };

  // Fetch credit notes based on filters
  const handleShow = async () => {
    console.log("Form data:", formData);

    if (!formData.startDate || !formData.endDate) {
      showNotification("error", "Please select both start and end dates");
      return;
    }

    setLoading(true);
    try {
      const fromParsed = parseDateDDMMYYYY(formData.startDate);
      const toParsed = parseDateDDMMYYYY(formData.endDate);

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

      const payload = {
        startDate: fromParsed.toISOString(),
        endDate: toParsed.toISOString(),
      };

      // Add customer/account code if provided
      if (formData.customer) {
        payload.accountCode = formData.customer;
      }

      // Only add branch to payload if it's not "All" or empty
      if (formData.branch && formData.branch !== "All") {
        payload.branch = formData.branch;
      }

      console.log("Sending payload:", payload);

      const response = await axios.post(
        `${server}/credit-summary-report`,
        payload
      );

      if (response.data.success) {
        // ✅ No need to format dates anymore - backend already returns formatted dates
        setRowData(response.data.data);
        showNotification(
          "success",
          `Found ${response.data.summary.totalRecords} records`
        );
      }
    } catch (error) {
      console.error("Error fetching credit notes:", error);
      showNotification(
        "error",
        error.response?.data?.error || "Failed to fetch credit summary data"
      );
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  // Download Excel
  const handleDownload = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Prepare data for Excel with proper column names
      const excelData = rowData.map((row) => ({
        "Sr No.": row.SrNo,
        "Invoice No.": row.InvoiceNo,
        "Invoice Date": row.InvoiceDate,
        "Customer Code": row.CustomerCode,
        "Customer Name": row.CustomerName,
        "GST No.": row.GSTNo,
        "Branch": row.Branch,
        "Sale Person": row.SalePerson,
        "From Date": row.FromDate,
        "To Date": row.ToDate,
        "Non-Taxable": row.NonTaxable,
        "Basic Amount": row.BasicAmount,
        "Misc Amount": row.MiscAmount,
        "Fuel": row.Fuel,
        "Taxable": row.Taxable,
        "SGST": row.SGST,
        "CGST": row.CGST,
        "IGST": row.IGST,
        "Grand Total": row.GrandTotal,
        "IRN": row.IRN,
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      ws["!cols"] = [
        { wch: 10 }, // Sr No.
        { wch: 15 }, // Invoice No.
        { wch: 15 }, // Invoice Date
        { wch: 15 }, // Customer Code
        { wch: 25 }, // Customer Name
        { wch: 20 }, // GST No.
        { wch: 10 }, // Branch
        { wch: 20 }, // Sale Person
        { wch: 12 }, // From Date
        { wch: 12 }, // To Date
        { wch: 12 }, // Non-Taxable
        { wch: 15 }, // Basic Amount
        { wch: 12 }, // Misc Amount
        { wch: 12 }, // Fuel
        { wch: 12 }, // Taxable
        { wch: 12 }, // SGST
        { wch: 12 }, // CGST
        { wch: 12 }, // IGST
        { wch: 15 }, // Grand Total
        { wch: 25 }, // IRN
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Credit Summary");

      // Generate filename with current date
      const fileName = `Credit_Summary_Report_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);

      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Failed to download Excel file");
    }
  };

  useEffect(() => {
    if (customerName) {
      setValue("customerName", customerName);
    } else {
      setValue("customerName", "");
    }
  }, [customerName, setValue]);

  return (
    <div>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <div>
        {/* Filters */}
        <div className="space-y-3">
          <div className="mt-6">
            <LabeledDropdown
              options={branches}
              value="branch"
              title="Branch"
              register={register}
              setValue={(name, value) => {
                setFormData((prev) => ({ ...prev, branch: value }));
                if (setValue) setValue(name, value);
              }}
            />
          </div>
          <div className="flex gap-2">
            <div className="w-full">
              <InputBox
                placeholder="Customer"
                value="customer"
                register={register}
                setValue={(name, value) => {
                  handleAccountCodeChange(value);
                  if (setValue) setValue(name, value);
                }}
              />
            </div>
            <DummyInputBoxWithLabelDarkGray
              placeholder="Customer Name"
              register={register}
              setValue={setValue}
              value="customerName"
              disabled={true}
            />

            <DateInputBox
              placeholder="From"
              value="startDate"
              register={register}
              setValue={(name, value) => {
                setFormData((prev) => ({ ...prev, startDate: value }));
                if (setValue) setValue(name, value);
              }}
            />

            <DateInputBox
              placeholder="To"
              value="endDate"
              register={register}
              setValue={(name, value) => {
                setFormData((prev) => ({ ...prev, endDate: value }));
                if (setValue) setValue(name, value);
              }}
            />
            <div className="w-[50%]">
              <OutlinedButtonRed
                label={loading ? "Loading..." : "Show"}
                onClick={handleShow}
                disabled={loading}
              />
            </div>
            <div>
              <SimpleButton name="Download" onClick={handleDownload} />
            </div>
          </div>

          {/* Table */}
          {!isFullscreen && (
            <TableWithSorting
              register={register}
              setValue={setValue}
              rowData={rowData}
              columns={columns}
              className="h-[45vh]"
            />
          )}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col p-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Credit Summary Report Date Range Wise
            </h2>
            <button
              onClick={() => setIsFullscreen(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <TableWithSorting
              register={register}
              setValue={setValue}
              rowData={rowData}
              columns={columns}
              className="h-full w-full"
            />
          </div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <div>{/* <OutlinedButtonRed label="Close" /> */}</div>
      </div>
    </div>
  );
};

export default DateRangeWise;