"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import jsPDF from "jspdf";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import {
  DummyInputBoxTransparent,
  DummyInputBoxWithLabelDarkGray,
} from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  InputBoxYellow,
} from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { RedCheckbox } from "@/app/components/Checkbox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import InvoicePDFDownloader from "./InvoicePdf";
import InvoiceTemplate from "./InvoicePdf";
import NotificationFlag from "@/app/components/Notificationflag";
import { sendNotification } from "@/app/lib/sendNotifications";
import { useAuth } from "@/app/Context/AuthContext";
import pushAWBLog from "@/app/lib/pushAWBLog";

const InvoiceMain = ({ fYear }) => {
  const { register, setValue, watch } = useForm();
  const [rowData, setRowData] = useState([]);
  const { server } = useContext(GlobalContext);
  const { user } = useAuth(); // Get current user
  const branch = watch("branch");
  const code = watch("code");
  const [shipments, setShipments] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [branchFilterOptions, setBranchFilterOptions] = useState([]);
  const [invoiceNumberOptions, setInvoiceNumberOptions] = useState([]);
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [branchOptions, setBranchOptions] = useState([]);
  const [invoiceReset, setInvoiceReset] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const watchAll = watch();
  const [isExistingInvoice, setIsExistingInvoice] = useState(false);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const dmyToYmd = (d) => {
    if (!d) return null;
    const [dd, mm, yyyy] = d.split("/");
    if (!dd || !mm || !yyyy) return null;
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (!server) return; // wait until context ready

    const fetchBranches = async () => {
      try {
        const res = await fetch(`${server}/branch-master`);
        if (!res.ok) throw new Error("Failed to fetch branches");
        const data = await res.json();
        setBranchOptions(data); // keep full data
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    fetchBranches();
  }, [server]);

  useEffect(() => {
    if (!server) return;

    const fetchAllInvoices = async () => {
      try {
        const res = await fetch(`${server}/billing-invoice/invoice`);
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const result = await res.json();

        console.log("📦 Raw invoices response:", result);

        // ✅ Handle both response formats
        const invoicesData = result.invoices || result.data || result || [];
        const branchesData = result.branches || [];

        setAllInvoices(invoicesData);

        // ✅ Use unique branches from backend, or extract from invoices
        const uniqueBranches =
          branchesData.length > 0
            ? branchesData
            : [...new Set(invoicesData.map((inv) => inv.branch))].filter(
              Boolean
            );

        console.log("✅ Branches detected:", uniqueBranches);
        setBranchFilterOptions(uniqueBranches);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setAllInvoices([]);
        setBranchFilterOptions([]);
      }
    };

    fetchAllInvoices();
  }, [server]);

  useEffect(() => {
    const selectedBranch = watch("branchFilter");

    if (!selectedBranch) {
      setInvoiceNumberOptions([]);
      setValue("invoiceNumberFilter", ""); // Clear invoice number
      return;
    }

    console.log("🔍 Selected branch:", selectedBranch);
    console.log("📜 All invoices:", allInvoices);

    // ✅ Filter invoices by selected branch
    const filtered = allInvoices.filter(
      (inv) => String(inv.branch).trim() === String(selectedBranch).trim()
    );

    // ✅ Extract invoice numbers
    const invoiceNos = filtered.map((inv) => inv.invoiceNumber).filter(Boolean); // Remove null/undefined values

    console.log("✅ Filtered invoice numbers:", invoiceNos);

    setInvoiceNumberOptions(invoiceNos);
  }, [watch("branchFilter"), allInvoices, setValue]);

  const fetchNextInvoiceSrNo = () => {
    fetch(`${server}/billing-invoice`)
      .then((res) => res.json())
      .then((data) => setValue("invoiceSrNo", data.nextSrNo));
  };

  useEffect(() => {
    fetchNextInvoiceSrNo();
  }, []);

  useEffect(() => {
    if (fYear) setValue("fYear", fYear);
    setValue("grandTotal", "0.00");
  }, [fYear, setValue]);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No." },
      { key: "createdAt", label: "Shipment Date" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "receiverCity", label: "Consignee City" },
      { key: "receiverPincode", label: "Zip Code" },
      { key: "service", label: "Service Type" },
      { key: "goodstype", label: "Good Type" },
      { key: "pcs", label: "No. of Items" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "totalVolWt", label: "Volume Weight" },
      { key: "chargeableWt", label: "Chargeable Weight" }, //need to confirm
      { key: "payment", label: "Payment Type" },
      { key: "basicAmt", label: "Basic Amount" },
      { key: "discountAmt", label: "Discount" },
      {
        key: "basicAmountafterDiscount",
        label: "Basic Amount After Discount",
      },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "miscChg", label: "Misc. Charges" },
      { key: "fuelAmt", label: "Fuel Charges" },
      { key: "nonTaxableAmt", label: "Non-Taxable Amount" },
      { key: "totalAmt", label: "Grand Total" },
    ],
    []
  );

  useEffect(() => {
    if (branch && branchOptions.length > 0) {
      const selected = branchOptions.find((b) => b.code === branch);
      if (selected) {
        setValue("gstNumber", selected.serviceTax || "");
        setValue("state", selected.state || "");
      }
    }
  }, [branch, branchOptions, setValue]);

  // Auto-fetch customer details by code from customer-account
  useEffect(() => {
    if (!code || !server) return;

    const fetchCustomerDetails = async () => {
      try {
        const res = await fetch(
          `${server}/customer-account?accountCode=${code}`
        );
        if (!res.ok) throw new Error("Failed to fetch customer");
        const data = await res.json();

        // assuming your API returns { name, gstNumber, state }
        setValue("codeName", data.name || "");
        setValue("address1", data.addressLine1 || "");
        setValue("address2", data.addressLine2 || "");
        setValue("city", data.city || "");
        setValue("gst", data.gst || "");
        setValue("state", data.state || "");
        setValue("pincode", data.pinCode || "");
        setValue("phone", data.telNo || "");
        setValue("panNo", data.panNo || "");
        setValue("country", data.country || "");
        setValue("gstNo", data.gstNo || "");
      } catch (err) {
        console.error("Error fetching customer:", err);
        setValue("codeName", "");
        setValue("address1", "");
        setValue("address2", "");
        setValue("city", "");
        setValue("pincode", "");
        setValue("country", "");
        setValue("panNo", "");
        setValue("gst", "");
        setValue("gstNo", "");
        setValue("state", "");
        setValue("phone", "");
      }
    };

    fetchCustomerDetails();
  }, [code, server, setValue]);

  useEffect(() => {
    const branchCode = watch("branch");
    const invoiceDate = watch("invoiceDate");
    let invoiceSrNo = watch("invoiceSrNo");

    if (branchCode && invoiceDate && invoiceSrNo) {
      invoiceSrNo = String(invoiceSrNo).padStart(3, "0");

      const [dd, mm, yyyy] = invoiceDate.split("/");
      const dateObj = new Date(`${yyyy}-${mm}-${dd}`);

      if (isNaN(dateObj)) {
        setValue("invoiceNumber", "");
        return;
      }

      const formattedDate = `${yyyy}${mm}${dd}`;
      const generatedInvoiceNo = `${branchCode}/${formattedDate}/${invoiceSrNo}`;

      setValue("invoiceNumber", generatedInvoiceNo);
    } else {
      setValue("invoiceNumber", "");
    }
  }, [watch("branch"), watch("invoiceDate"), watch("invoiceSrNo"), setValue]);

  const handleRefresh = () => {
    setInvoiceReset(!invoiceReset);
    setValue("grandTotal", "0.00");
    setValue("codeName", "");
    setValue("gst", "");
    setRowData([]);
    fetchNextInvoiceSrNo();
  };

  // inside component: you already have `shipments` state holding raw API shipments
  const handleSaveInvoice = async () => {
    const formData = watch();

    const invoiceSummary = {
      nonTaxableAmount: Number(formData.nonTaxableAmount) || 0,
      basicAmount: Number(formData.basicAmount) || 0,
      discountAmount: Number(formData.discountAmount) || 0,
      miscChg: Number(formData.miscChg) || 0,
      fuelChg: Number(formData.fuelChg) || 0,
      cgst: Number(formData.cgst) || 0,
      sgst: Number(formData.sgst) || 0,
      igst: Number(formData.igst) || 0,
      grandTotal: Number(formData.grandTotal) || 0,
    };

    const shipmentsPayload = rowData.map((item) => {
      const original = shipments.find((s) => s.awbNo === item.awbNo) || {};
      const rawDate = original.shipmentDate || original.createdAt || null;
      const parsedDate = rawDate ? new Date(rawDate) : null;

      return {
        awbNo: item.awbNo,
        date: parsedDate,

        // Receiver details
        receiverFullName:
          original.receiverFullName || item.receiverFullName || "",
        receiverCity: original.receiverCity || item.receiverCity || "",
        receiverState: original.receiverState || item.receiverState || "",
        receiverPincode: original.receiverPincode || item.receiverPincode || "",
        receiverAddressLine1: original.receiverAddressLine1 || "",

        // Shipment details
        destination: item.destination || original.destination || "",
        state:
          item.receiverState || original.receiverState || original.state || "",
        sector: original.sector || "",
        product: item.goodstype || original.goodstype || "",
        goodstype: item.goodstype || original.goodstype || "",
        shipmentType: original.shipmentType || "",
        payment: original.payment || "",
        pcs: original.pcs || 0,

        // Weight
        totalActualWt:
          Number(item.totalActualWt) || Number(original.totalActualWt) || 0,
        totalVolWt: Number(original.totalVolWt) || 0,
        weight:
          Number(item.totalActualWt) || Number(original.totalActualWt) || 0,

        // Financial
        basicAmt: Number(item.basicAmt) || Number(original.basicAmt) || 0,
        amount: Number(item.basicAmt) || Number(original.basicAmt) || 0,
        discount: Number(item.discountAmt) || Number(original.discountAmt) || 0,
        discountAmt:
          Number(item.discountAmt) || Number(original.discountAmt) || 0,
        miscCharge: Number(item.miscChg) || Number(original.miscChg) || 0,
        miscChg: Number(item.miscChg) || Number(original.miscChg) || 0,
        taxableAmount:
          Number(item.basicAmountafterDiscount) ||
          Number(original.basicAmt || 0) - Number(original.discountAmt || 0) ||
          0,
      };
    });

    const fromISO = dmyToYmd(formData.from);
    const toISO = dmyToYmd(formData.to);

    const payload = {
      invoiceSrNo: Number(formData.invoiceSrNo),
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate
        ? new Date(dmyToYmd(formData.invoiceDate))
        : new Date(),

      // <-- use the form field names you actually have: `from` and `to`

      fromDate: fromISO ? new Date(fromISO) : null,
      toDate: toISO ? new Date(toISO) : null,
      branch: formData.branch || "",
      createdBy: "Admin",

      customer: {
        accountCode: formData.code || "",
        name: formData.codeName || "",
        address1: formData.address1 || "",
        address2: formData.address2 || "",
        city: formData.city || "",
        pincode: formData.pincode || "",
        country: formData.country || "",
        panNo: formData.panNo || "",
        gst: formData.gst || "",
        state: formData.state || "",
        phone: formData.phone || "",
      },

      shipments: shipmentsPayload,
      invoiceSummary,
      placeOfSupply: formData.state || "",
      financialYear: formData.fYear || "",
      totalAwb: rowData?.length || 0,
    };

    console.log("DEBUG payload before save:", payload); // quick sanity check

    try {
      const res = await fetch(`${server}/billing-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json(); // ✅ move here

      if (!res.ok) {
        if (data?.reasons?.length) {
          showNotification("error", data.reasons.join(" | "));
        } else {
          showNotification("error", data.message || "Invoice creation failed");
        }
        return;
      }

      console.log("✅ Saved Invoice:", data);
      
      // ✅ Log "Invoice Generated" for each AWB in the invoice
      if (user?.userId) {
        for (const shipment of shipmentsPayload) {
          await pushAWBLog({
            awbNo: shipment.awbNo,
            accountCode: formData.code,
            customer: formData.codeName,
            action: "Invoice Generated",
            actionUser: user?.userId,
            department: "Billing",
            details: {
              invoiceNumber: formData.invoiceNumber,
              invoiceDate: formData.invoiceDate,
              billedAmount: invoiceSummary.grandTotal,
              fromDate: formData.from,
              toDate: formData.to,
              branch: formData.branch,
            }
          });
        }
      }
      
      showNotification("success", "Invoice saved successfully!");

      // Send notification to customer
      await sendNotification({
        accountCode: payload.customer.accountCode,
        name: payload.customer.name,
        invoiceNo: payload.invoiceNumber,
        event: "Invoice Generated",
        description: `Invoice ${payload.invoiceNumber} generated`,
        message: `An invoice ${payload.invoiceNumber} for ${payload.invoiceSummary.grandTotal.toFixed(2)} has been generated.`,
        priority: "medium",
      });
    } catch (err) {
      console.error("❌ Error saving invoice:", err);
      showNotification("error", "Error saving invoice");
    }
  };

  const fetchSummary = async (accountCode) => {
    const fromDate = watch("from");
    const toDate = watch("to");
    console.log("📅 Dates:", { fromDate, toDate, accountCode });

    if (!fromDate || !toDate) {
      showNotification("error", "Please select both From and To dates.");
      return;
    }

    try {
      const fromISO = dmyToYmd(fromDate);
      const toISO = dmyToYmd(toDate);

      if (!fromISO || !toISO) {
        showNotification("error", "Invalid date format. Use DD/MM/YYYY");
        return;
      }

      const res = await fetch(`${server}/billing-invoice/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          accountCode,
          from: fromISO,
          to: toISO,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShipments(data.shipments);
        setInvoiceSummary(data.summary);

        const keyMap = {
          basicAmount: "basicAmount",
          discountAmount: "discountAmount",
          miscAmount: "miscChg",
          taxableAmount: "basicAmountafterDiscount",
          sgstAmount: "sgst",
          cgstAmount: "cgst",
          igstAmount: "igst",
          fuelAmount: "fuelChg",
          grandTotal: "grandTotal",
        };

        Object.entries(data.summary).forEach(([key, value]) => {
          const mapped = keyMap[key];
          if (mapped) {
            setValue(mapped, value.toFixed(2));
          }
        });

        const rows = data.shipments.map((item) => {
          const basic = Number(item.basicAmt) || 0;
          const discount = Number(item.discountAmt) || 0;

          // ✅ Format shipment date
          let shipmentDate = item.shipmentDate || item.createdAt;
          if (shipmentDate) {
            const dateObj = new Date(shipmentDate);
            const dd = String(dateObj.getDate()).padStart(2, "0");
            const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
            const yyyy = dateObj.getFullYear();
            shipmentDate = `${dd}/${mm}/${yyyy}`; // Format: DD-MM-YYYY
          } else {
            shipmentDate = "-";
          }

          return {
            ...item,
            createdAt: shipmentDate, // ✅ update for table display
            basicAmt: basic,
            discountAmt: discount,
            basicAmountafterDiscount: (basic - discount).toFixed(2),
          };
        });

        setRowData(rows);
        setIsExistingInvoice(false); // Reset flag for new invoice
      } else {
        showNotification(
          "error",
          "No shipments found for selected date range."
        );
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
      showNotification("error", "Error fetching summary");
    }
  };

  const ymdToDmy = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (isNaN(dateObj)) return "";
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleSearchInvoice = async () => {
    const selectedInvoice = watch("invoiceNumberFilter");

    if (!selectedInvoice) {
      showNotification("error", "Please select an invoice number first");
      return;
    }

    console.log("🔍 Searching for invoice:", selectedInvoice);

    try {
      const url = `${server}/billing-invoice/invoice?invoiceNumber=${encodeURIComponent(
        selectedInvoice
      )}`;
      console.log("📡 Fetching from:", url);

      const res = await fetch(url);
      if (!res.ok) throw new Error("Invoice not found");
      const data = await res.json();

      console.log("🔍 Invoice data:", data);

      // inside handleSearchInvoice after fetching `data`
      const cust = data.customer || {};
      setValue("codeName", cust.name || "");
      setValue("address1", cust.address1 || "");
      setValue("address2", cust.address2 || "");
      setValue("city", cust.city || "");
      setValue("pincode", cust.pincode || "");
      setValue("country", cust.country || "India");
      setValue("panNo", cust.panNo || "");
      setValue("gst", cust.gst || "");
      setValue("gstNo", cust.gstNo || "");
      setValue("state", cust.state || data.placeOfSupply || "");
      setValue("phone", cust.phone || "");
      setValue(
        "address",
        cust.address ||
        [cust.address1, cust.address2].filter(Boolean).join(", ")
      );

      if (data) {
        // Fill client details
        setValue("branch", data.branch || "");
        setValue("code", data.customer?.accountCode || "");
        setValue("codeName", data.customer?.name || "");
        setValue("fwd", data.customer?.fwd || "");
        setValue("gst", data.customer?.gst || "");
        setValue("gstNo", data.customer?.gstNo || "");
        setValue("state", data.customer?.state || data.placeOfSupply || "");
        setValue("address", data.customer?.address || "");

        // Fill dates
        if (data.fromDate) setValue("from", ymdToDmy(data.fromDate));
        if (data.toDate) setValue("to", ymdToDmy(data.toDate));
        if (data.invoiceDate)
          setValue("invoiceDate", ymdToDmy(data.invoiceDate));

        // Fill invoice details
        setValue("invoiceSrNo", data.invoiceSrNo || "");
        setValue("invoiceNumber", data.invoiceNumber || "");
        setValue("fYear", data.financialYear || "");

        // Summary
        if (data.invoiceSummary) {
          setValue(
            "nonTaxableAmount",
            data.invoiceSummary.nonTaxableAmount?.toFixed(2) || "0.00"
          );
          setValue(
            "basicAmount",
            data.invoiceSummary.basicAmount?.toFixed(2) || "0.00"
          );
          setValue(
            "discountAmount",
            data.invoiceSummary.discountAmount?.toFixed(2) || "0.00"
          );
          setValue(
            "miscChg",
            data.invoiceSummary.miscChg?.toFixed(2) || "0.00"
          );
          setValue(
            "fuelAmt",
            data.invoiceSummary.fuelChg?.toFixed(2) || "0.00"
          );
          setValue(
            "grandTotal",
            data.invoiceSummary.grandTotal?.toFixed(2) || "0.00"
          );
          setValue("sgst", data.invoiceSummary.sgst?.toFixed(2) || "0.00");
          setValue("cgst", data.invoiceSummary.cgst?.toFixed(2) || "0.00");
          setValue("igst", data.invoiceSummary.igst?.toFixed(2) || "0.00");

          const basicAfterDiscount =
            (data.invoiceSummary.basicAmount || 0) -
            (data.invoiceSummary.discountAmount || 0);

          setValue("basicAmountafterDiscount", basicAfterDiscount.toFixed(2));
        }

        // ✅ Formatting helper
        const formatDate = (d) => {
          if (!d) return "-";
          const dateObj = new Date(d);
          if (isNaN(dateObj)) return "-";
          const dd = String(dateObj.getDate()).padStart(2, "0");
          const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
          const yyyy = dateObj.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        };

        // ✅ Fill table with merged shipment details
        if (data.shipments && data.shipments.length > 0) {
          const formattedRows = data.shipments.map((item) => {
            const shipmentDate =
              item.date || item.shipmentDate || item.createdAt || null;

            const amount = Number(
              item.amount ?? item.basicAmt ?? item.totalAmt ?? 0
            );
            const discount = Number(item.discount ?? item.discountAmt ?? 0);
            const taxable = Number(item.taxableAmount ?? amount - discount);

            return {
              awbNo: item.awbNo || "",
              createdAt: formatDate(shipmentDate),
              destination: item.destination || item.receiverCity || "-",
              receiverFullName: item.receiverFullName || "",
              receiverCity: item.receiverCity || "",
              receiverPincode: item.receiverPincode || "",
              service: item.service || "",
              goodstype: item.goodstype || item.product || "",
              pcs: item.pcs || 0,
              totalActualWt: item.totalActualWt || item.weight || 0,
              totalVolWt: item.totalVolWt || 0,
              basicAmt: amount.toFixed(2),
              discountAmt: discount.toFixed(2),
              basicAmountafterDiscount: taxable.toFixed(2),
              miscChg: (item.miscChg ?? item.miscCharge ?? 0).toFixed(2),
              sector: item.sector || "",
              goodstype: item.goodstype || "",
              payment: item.payment || "",
              fuelAmt: data.invoiceSummary.fuelChg?.toFixed(2) || "0.00",
              sgst: data.invoiceSummary.sgst?.toFixed(2) || "0.00",
              cgst: data.invoiceSummary.cgst?.toFixed(2) || "0.00",
              igst: data.invoiceSummary.igst?.toFixed(2) || "0.00",
              totalAmt: item.totalAmt?.toFixed(2) || 0,
              state: item.receiverState || "",
              product: item.goodstype || item.product || "",
            };
          });

          setRowData(formattedRows);
          setInvoiceData(data);
          setIsExistingInvoice(true);
          console.log("✅ Table populated with", formattedRows.length, "rows");
        } else {
          setRowData([]);
        }

        showNotification("success", "Invoice loaded successfully!");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      showNotification(
        "error",
        "Error fetching invoice details: " + err.message
      );
    }
  };

  const handleRemoveInvoice = async () => {
    const invoiceNumber = watch("invoiceNumber");

    if (!invoiceNumber) {
      showNotification("error", "No invoice selected.");
      return;
    }

    try {
      const res = await fetch(
        `${server}/billing-invoice?invoiceNumber=${encodeURIComponent(
          invoiceNumber
        )}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Delete failed");

      // ✅ Log invoice removal for each AWB in the invoice
      if (user?.userId && rowData.length > 0) {
        for (const row of rowData) {
          await pushAWBLog({
            awbNo: row.awbNo,
            accountCode: watch("code"),
            customer: watch("codeName"),
            action: "Invoice Removed",
            actionUser: user?.userId,
            department: "Billing",
            details: {
              invoiceNumber: invoiceNumber,
              removedAt: new Date().toISOString(),
            }
          });
        }
      }

      showNotification("success", "Invoice removed.");

      // Clear UI
      handleRefresh();
      setRowData([]);
      setInvoiceData(null);
      setIsExistingInvoice(false);
    } catch (err) {
      console.error("Remove error:", err);
      showNotification("error", "Error removing invoice.");
    }
  };

  return (
    <form className="flex flex-col gap-4">
      <Heading
        title={`Invoice`}
        onRefresh={handleRefresh}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      {/* Top Section: Client + Summary */}
      <div className="flex gap-10 w-full">
        {/* Client Details */}
        <div className="w-full flex flex-col gap-3">
          <h2 className="text-[16px] text-red font-semibold">Client Details</h2>
          <div className="flex flex-col gap-3">
            <LabeledDropdown
              options={branchOptions
                .map((b) => b.code)
                .filter((code) => ["DEL", "MHM", "AHM"].includes(code))}
              register={register}
              setValue={setValue}
              resetFactor={invoiceReset}
              value="branch"
              title="Branch"
            />

            <div className="flex gap-3">
              <InputBox
                placeholder="Code"
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="code"
              />
              <DummyInputBoxTransparent
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="codeName"
                inputValue={watch("codeName")}
              />
            </div>
            <div className="flex gap-3">
              <DummyInputBoxWithLabelDarkGray
                label="Fwd"
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="fwd"
              />
              <DummyInputBoxWithLabelDarkGray
                label="GST"
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="gst"
              />
            </div>
            <div className="flex gap-3">
              <DateInputBox
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="from"
                placeholder="From"
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="to"
                placeholder="To"
              />
            </div>
            <div className="flex gap-3">
              <DateInputBox
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="invoiceDate"
                placeholder="Invoice Date"
              />
              <InputBox
                placeholder="Invoice SrNo."
                register={register}
                setValue={setValue}
                value="invoiceSrNo"
                initialValue={watch("invoiceSrNo")}
                disabled
              />
            </div>
            <div className="flex gap-3">
              <InputBox
                placeholder="Invoice Number"
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="invoiceNumber"
                initialValue={watch("invoiceNumber")}
                disabled
              />
              <InputBox
                placeholder="FYear"
                register={register}
                setValue={setValue}
                value="fYear"
                disabled
                initialValue={watch("fYear")}
              />
            </div>
            <div className="flex gap-3">
              <InputBox
                placeholder="GST Number"
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="gstNumber"
                initialValue={watch("gstNumber")}
                disabled
              />
              <InputBox
                placeholder="State"
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value="state"
                initialValue={watch("state")}
                disabled
              />
            </div>
            <div>
              <OutlinedButtonRed
                label="View"
                onClick={() => {
                  const accountCode = watch("code");

                  if (!accountCode || accountCode.trim() === "") {
                    showNotification("error", "Enter customer code first");
                    return;
                  }

                  fetchSummary(accountCode);
                }}
              />
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="w-full flex flex-col gap-3">
          <h2 className="text-[16px] text-red font-semibold">Summary</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["nonTaxableAmount", "Non-Taxable Amount"],
              ["basicAmount", "Basic Amount"],
              ["discountAmount", "Discount Amount"],
              ["basicAmountafterDiscount", "Basic Amount after Discount"],
              ["miscChg", "Misc. Charges"],
              ["fuelChg", "Fuel"],
              ["sgst", "SGST"],
              ["cgst", "CGST"],
              ["igst", "IGST"],
            ].map(([value, label]) => (
              <DummyInputBoxWithLabelDarkGray
                key={`${value}-${invoiceReset}`}
                placeholder="0.00"
                label={label}
                register={register}
                setValue={setValue}
                resetFactor={invoiceReset}
                value={value}
              />
            ))}
            <InputBoxYellow
              register={register}
              placeholder="Grand Total"
              setValue={setValue}
              value="grandTotal"
              initialValue={watch("grandTotal")}
              className="bg-yellow-100"
              disabled
            />
          </div>
          {/* <div className="flex justify-end">
            <RedCheckbox
              register={register}
              setValue={setValue}
              isChecked={true}
              id={`uploadOnPortal`}
              label={`Upload on portal`}
            />
          </div> */}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <RedLabelHeading label="Search Invoice Number" />
        <div className="flex gap-3">
          <LabeledDropdown
            register={register}
            setValue={setValue}
            options={branchFilterOptions}
            resetFactor={invoiceReset}
            value="branchFilter"
            title="Branch"
          />
          <LabeledDropdown
            register={register}
            setValue={setValue}
            options={invoiceNumberOptions}
            resetFactor={invoiceReset}
            value="invoiceNumberFilter"
            title="Invoice Number"
          />
          <div>
            <OutlinedButtonRed label="Search" onClick={handleSearchInvoice} />
          </div>
        </div>
        {/* Table Section */}
        <TableWithSorting
          register={register}
          setValue={setValue}
          resetFactor={invoiceReset}
          name="refShipper"
          columns={columns}
          rowData={rowData}
        />
      </div>
      {/* Footer Buttons */}
      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed label="Close" /> */}</div>
        <div className="flex gap-3">
          <div>
            <OutlinedButtonRed label="New" onClick={handleRefresh} />
          </div>
          <div>
            <OutlinedButtonRed
              label="Remove Bill"
              perm="Billing Deletion"
              onClick={handleRemoveInvoice}
            />
          </div>
          <div>
            <InvoicePDFDownloader
              server={server}
              invoiceNumber={watch("invoiceNumber")}
            />
          </div>
          <div>
            <SimpleButton
              name="Create Bill"
              onClick={handleSaveInvoice}
              disabled={isExistingInvoice}
            />
          </div>
        </div>
      </div>

      {/* Always show preview once rows are fetched */}
      <div className="w-full">
        {invoiceData && (
          <InvoiceTemplate
            invoiceData={invoiceData}
            customer={invoiceData.customer}
          />
        )}
      </div>
    </form>
  );
};

export default InvoiceMain;