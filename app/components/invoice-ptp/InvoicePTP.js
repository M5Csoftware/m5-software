"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import React, { useState, useMemo, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import InvoicePTPPDFDownloader from "./InvoicePTPPDFDownloader ";

const InvoicePTP = ({ fYear, onClose }) => {
  const { register, setValue, watch, reset } = useForm();
  const { server } = useContext(GlobalContext);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState("");
  const [formKey, setFormKey] = useState(0);

  const [rowData, setRowData] = useState([]);
  const [fYearOptions, setFYearOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [forwardingOptions, setForwardingOptions] = useState([]);
  const [invoiceOptions, setInvoiceOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Watch form values
  const selectedBranch = watch("branch");
  const customerCode = watch("customerCode");
  const fromDate = watch("from");
  const toDate = watch("to");
  const exchangeValue = watch("exchangeAmount");
  const selectedCurrency = watch("currency");
  const selectedFYear = watch("fYear");
  const searchBranch = watch("searchBranch");
  const searchInvoiceNo = watch("searchInvoiceNo");

  const DeleteConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    invoiceNo,
  }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Confirm Deletion
            </h2>
            <p className="text-gray-600">
              Are you sure you want to delete invoice{" "}
              <span className="font-semibold text-red-600">{invoiceNo}</span>?
            </p>
            <p className="text-gray-500 text-sm mt-2">
              This will revert all shipment billing statuses. This action cannot
              be undone.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Invoice
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Handle Remove Bill - Opens confirmation modal
  const handleRemoveBill = () => {
    const searchedInvoice = watch("searchInvoiceNo");

    if (!searchedInvoice) {
      showNotification("error", "Please search and select an invoice first");
      return;
    }

    setInvoiceToDelete(searchedInvoice);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      setShowDeleteModal(false);
      setIsLoading(true);

      const response = await axios.delete(
        `${server}/invoice-ptp?invoiceNo=${encodeURIComponent(invoiceToDelete)}`
      );

      if (response.status === 200) {
        showNotification("success", "Invoice deleted successfully!");
        setValue("searchInvoiceNo", "");

        setTimeout(() => {
          handleNew();
        }, 1500);
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      showNotification(
        "error",
        error.response?.data?.error || "Failed to delete invoice"
      );
    } finally {
      setIsLoading(false);
      setInvoiceToDelete("");
    }
  };

  const handleModalClose = () => {
    setShowDeleteModal(false);
    setInvoiceToDelete("");
  };

  const handleRefresh = () => {
    setFormKey((prev) => prev + 1);
    setRowData([]);
    setForwardingOptions([]);
    setInvoiceOptions([]);
    setQrCodeData(null);
    setPdfData(null);
    setShowDeleteModal(false);
    setInvoiceToDelete("");

    const currentFYear = watch("fYear");
    reset();
    if (fYear) {
      setValue("fYear", fYear);
    } else if (currentFYear) {
      setValue("fYear", currentFYear);
    }

    showNotification("success", "Form refreshed successfully");
  };

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let i = 0; i < 5; i++) {
      const year = currentYear + i;
      years.push(`${year}-${year + 1}`);
    }

    setFYearOptions(years);

    if (fYear) {
      setValue("fYear", fYear);
    }
  }, [fYear, setValue]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${server}/branch-master`);
        const branches = response.data.map((branch) => ({
          label: branch.code,
          value: branch.code,
        }));
        setBranchOptions(branches);
      } catch (error) {
        console.error("Error fetching branches:", error);
        showNotification("error", "Failed to fetch branches");
      }
    };

    fetchBranches();
  }, [server]);

  useEffect(() => {
    const fetchInvoiceNumbers = async () => {
      if (!searchBranch || !selectedFYear) {
        setInvoiceOptions([]);
        return;
      }

      try {
        const response = await axios.get(
          `${server}/invoice-ptp?fYear=${selectedFYear}`
        );

        if (response.data && response.data.length > 0) {
          const branchInvoices = response.data.filter(
            (invoice) => invoice.clientDetails.branch === searchBranch
          );

          const invoiceSrNos = branchInvoices.map(
            (invoice) => invoice.clientDetails.invoiceSrNo
          );

          setInvoiceOptions(invoiceSrNos);
        } else {
          setInvoiceOptions([]);
        }
      } catch (error) {
        console.error("Error fetching invoice numbers:", error);
        setInvoiceOptions([]);
      }
    };

    fetchInvoiceNumbers();
  }, [searchBranch, selectedFYear, server]);

  useEffect(() => {
    const fetchCustomerName = async () => {
      if (!customerCode) return;

      try {
        const response = await axios.get(
          `${server}/customer-account?accountCode=${customerCode}`
        );

        if (response.data) {
          setValue("name", response.data.name);
          setValue("gst", response.data.gstNo);
          setValue("state", response.data.state);
        }
      } catch (error) {
        console.error("Error fetching customer details:", error);
        showNotification("error", "Customer not found");
      }
    };

    fetchCustomerName();
  }, [customerCode, server, setValue]);

  useEffect(() => {
    const fetchForwardingNumbers = async () => {
      if (!customerCode) {
        setForwardingOptions([]);
        return;
      }

      try {
        const response = await axios.get(
          `${server}/portal/get-shipments?accountCode=${customerCode}`
        );

        const shipmentsData = response.data.shipments || [];

        const uniqueForwarding = [
          ...new Set(
            shipmentsData
              .map((shipment) => shipment.forwardingNo)
              .filter(Boolean)
          ),
        ];

        setForwardingOptions(uniqueForwarding);
      } catch (error) {
        console.error("Error fetching forwarding numbers:", error);
        setForwardingOptions([]);
      }
    };

    fetchForwardingNumbers();
  }, [customerCode, server]);

  useEffect(() => {
    const generateInvoiceNumbers = async () => {
      if (!selectedBranch || !selectedFYear) return;

      try {
        const [year1, year2] = selectedFYear.split("-");
        const shortYear = year1.slice(2) + year2.slice(2);

        const response = await axios.get(
          `${server}/invoice-ptp?fYear=${selectedFYear}`
        );

        let invoiceNumber = 1;
        if (response.data && response.data.length > 0) {
          invoiceNumber = response.data.length + 1;
        }

        const paddedSrNo = String(invoiceNumber).padStart(4, "0");
        const invoiceSrNo = `EXP${selectedBranch}/${shortYear}/${paddedSrNo}`;
        const invoiceNo = String(invoiceNumber).padStart(2, "0");

        setValue("invoiceSrNo", invoiceSrNo);
        setValue("invoiceNo", invoiceNo);
      } catch (error) {
        console.error("Error generating invoice numbers:", error);
        const [year1, year2] = selectedFYear.split("-");
        const shortYear = year1.slice(2) + year2.slice(2);
        setValue("invoiceSrNo", `EXP${selectedBranch}/${shortYear}/0001`);
        setValue("invoiceNo", "01");
      }
    };

    generateInvoiceNumbers();
  }, [selectedBranch, selectedFYear, server, setValue]);

  useEffect(() => {
    const grandTotal = parseFloat(watch("GrandTotal")) || 0;

    if (exchangeValue && selectedCurrency && grandTotal > 0) {
      const exAmount = grandTotal / parseFloat(exchangeValue);
      setValue("exAmount", exAmount.toFixed(2));
    } else {
      setValue("exAmount", "0.00");
    }
  }, [exchangeValue, selectedCurrency, watch("GrandTotal"), setValue, watch]);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB" },
      { key: "shipmentDate", label: "Date" },
      { key: "receiverFullName", label: "Consignor Name" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "receiverCity", label: "Consignee City" },
      { key: "service", label: "Service" },
      { key: "pcs", label: "Pcs" },
      { key: "totalActualWt", label: "Total Actual Weight" },
      { key: "totalVolWt", label: "Total Volume Weight" },
      { key: "basicAmt", label: "Basic Amount" },
      { key: "discount", label: "Discount" },
      { key: "discountAmount", label: "Discount Amount" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "miscChg", label: "Misc Charge" },
      { key: "fuelAmt", label: "Fuel Amount" },
      { key: "nonTaxable", label: "Non Taxable" },
      { key: "totalAmt", label: "Total Amount" },
      { key: "payment", label: "Payment Type" },
      { key: "goodDesc", label: "Good Description" },
    ],
    []
  );

  const generatePDF = () => {
    if (!customerCode || rowData.length === 0) {
      showNotification("error", "Please load shipments before generating PDF");
      return;
    }

    const invoiceData = {
      fYear: selectedFYear,
      clientDetails: {
        branch: selectedBranch,
        accountCode: customerCode,
        customerName: watch("name"),
        forwarding: watch("forwarding") || "",
        dateFrom: fromDate,
        dateTo: toDate,
        invoiceDate: watch("invoiceDate"),
        invoiceSrNo: watch("invoiceSrNo"),
        invoiceNo: watch("invoiceNo"),
        gstNo: watch("gst"),
        state: watch("state"),
        addressLine1: watch("addressLine1") || "",
      },
      amountDetails: {
        freightAmount: parseFloat(watch("freightAmount")) || 0,
        clearanceCharge: parseFloat(watch("clearanceCharge")) || 0,
        grandTotal: parseFloat(watch("GrandTotal")) || 0,
        exchangeAmount: parseFloat(exchangeValue) || 0,
        currency: selectedCurrency || "GBP",
        exAmount: parseFloat(watch("exAmount")) || 0,
      },
      billItems: rowData,
      qrCodeData: qrCodeData,
    };

    console.log("Generating PDF with data:", invoiceData);

    setPdfData(invoiceData);
  };

  const handlePDFDownloadComplete = () => {
    showNotification("success", "PDF downloaded successfully!");
    setPdfData(null);
  };
  const parseDDMMYYYY = (dateString) => {
    if (!dateString) return null;
    const [day, month, year] = dateString.split("/");
    return new Date(year, month - 1, day);
  };
  const handleShow = async () => {
    if (!customerCode || !fromDate || !toDate) {
      showNotification("error", "Please fill Customer Code and Date range");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.get(
        `${server}/portal/get-shipments?accountCode=${customerCode}`
      );

      const shipmentsData = response.data.shipments || [];

      if (shipmentsData.length === 0) {
        showNotification("error", "No shipments found for this account");
        setRowData([]);
        setValue("freightAmount", "0.00");
        setValue("clearanceCharge", "0.00");
        setValue("GrandTotal", "0.00");
        setValue("exAmount", "0.00");
        setIsLoading(false);
        return;
      }

      // Parse the from and to dates as DD/MM/YYYY
      const from = parseDDMMYYYY(fromDate);
      const to = parseDDMMYYYY(toDate);

      if (!from || !to) {
        showNotification("error", "Invalid date format. Please use DD/MM/YYYY");
        setIsLoading(false);
        return;
      }

      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);

      const filteredShipments = shipmentsData.filter((shipment) => {
        const shipmentDate = new Date(shipment.date);
        const isInDateRange = shipmentDate >= from && shipmentDate <= to;
        const isBillingLocked = shipment.billingLocked === true;
        return isInDateRange && isBillingLocked;
      });

      if (filteredShipments.length === 0) {
        showNotification(
          "error",
          "No shipments with billing locked found in the selected date range"
        );
        setRowData([]);
        setValue("freightAmount", "0.00");
        setValue("clearanceCharge", "0.00");
        setValue("GrandTotal", "0.00");
        setValue("exAmount", "0.00");
        setIsLoading(false);
        return;
      }

      // Check for RTO or FOC payment types
      const rtoOrFocShipments = filteredShipments.filter(
        (shipment) =>
          shipment.payment &&
          (shipment.payment.toUpperCase() === "RTO" ||
            shipment.payment.toUpperCase() === "FOC")
      );

      if (rtoOrFocShipments.length > 0) {
        const awbNumbers = rtoOrFocShipments.map((s) => s.awbNo).join(", ");
        showNotification(
          "error",
          `Cannot create bill. Shipments with RTO/FOC payment found: ${awbNumbers}`
        );
        setRowData([]);
        setValue("freightAmount", "0.00");
        setValue("clearanceCharge", "0.00");
        setValue("GrandTotal", "0.00");
        setValue("exAmount", "0.00");
        setIsLoading(false);
        return;
      }

      let totalBasicAmt = 0;
      let totalMiscChg = 0;

      const formattedData = filteredShipments.map((shipment) => {
        totalBasicAmt += shipment.basicAmt || 0;
        totalMiscChg += shipment.miscChg || 0;

        return {
          accountCode: shipment.accountCode,
          customer: shipment.customer,
          openingBalance: 0,
          email: shipment.receiverEmail,
          isHold: shipment.isHold ? "Yes" : "No",
          awbNo: shipment.awbNo,
          payment: shipment.payment,
          date: new Date(shipment.date).toLocaleDateString("en-GB"), // DD/MM/YYYY format
          shipmentDate: new Date(shipment.date).toLocaleDateString("en-GB"), // DD/MM/YYYY format
          receiverFullName: shipment.receiverFullName,
          forwarder: shipment.forwarder,
          forwardingNo: shipment.forwardingNo,
          runNo: shipment.runNo,
          sector: shipment.sector,
          destination: shipment.destination,
          receiverCity: shipment.receiverCity,
          receiverPincode: shipment.receiverPincode,
          service: shipment.service,
          pcs: shipment.pcs,
          totalActualWt: shipment.totalActualWt,
          totalVolWt: shipment.totalVolWt,
          basicAmt: shipment.basicAmt,
          discount: shipment.discount,
          discountAmount: shipment.discountAmt,
          hikeAmt: shipment.hikeAmt,
          sgst: shipment.sgst,
          cgst: shipment.cgst,
          igst: shipment.igst,
          miscChg: shipment.miscChg,
          fuelAmt: shipment.fuelAmt,
          nonTaxable: 0,
          totalAmt: shipment.totalAmt,
          receivedAmount: 0,
          debitAmount: 0,
          creditAmount: 0,
          operationRemark: shipment.operationRemark,
          reference: shipment.reference,
          leftOverBalance: 0,
        };
      });

      setRowData(formattedData);

      const freightAmount = totalBasicAmt.toFixed(2);
      const clearanceCharge = totalMiscChg.toFixed(2);
      const grandTotal = (totalBasicAmt + totalMiscChg).toFixed(2);

      setValue("freightAmount", freightAmount);
      setValue("clearanceCharge", clearanceCharge);
      setValue("GrandTotal", grandTotal);

      if (exchangeValue && selectedCurrency) {
        const exAmount = (
          (totalBasicAmt + totalMiscChg) /
          parseFloat(exchangeValue)
        ).toFixed(2);
        setValue("exAmount", exAmount);
      } else {
        setValue("exAmount", "0.00");
      }

      showNotification(
        "success",
        `${filteredShipments.length} shipments loaded`
      );
    } catch (error) {
      console.error("Error fetching shipments:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to fetch shipments"
      );
      setRowData([]);
      setValue("freightAmount", "0.00");
      setValue("clearanceCharge", "0.00");
      setValue("GrandTotal", "0.00");
      setValue("exAmount", "0.00");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSearch = async () => {
    if (!searchInvoiceNo) {
      showNotification("error", "Please select an invoice number");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.get(
        `${server}/invoice-ptp?fYear=${selectedFYear}`
      );

      if (response.data && response.data.length > 0) {
        const invoice = response.data.find(
          (inv) => inv.clientDetails.invoiceSrNo === searchInvoiceNo
        );

        if (!invoice) {
          showNotification("error", "Invoice not found");
          setIsLoading(false);
          return;
        }

        console.log("Loaded invoice:", invoice);

        setValue("branch", invoice.clientDetails.branch);
        setValue("customerCode", invoice.clientDetails.accountCode);
        setValue("name", invoice.clientDetails.customerName);
        setValue("forwarding", invoice.clientDetails.forwarding);
        setValue(
          "from",
          new Date(invoice.clientDetails.dateFrom).toISOString().split("T")[0]
        );
        setValue(
          "to",
          new Date(invoice.clientDetails.dateTo).toISOString().split("T")[0]
        );
        setValue(
          "invoiceDate",
          new Date(invoice.clientDetails.invoiceDate)
            .toISOString()
            .split("T")[0]
        );
        setValue("invoiceSrNo", invoice.clientDetails.invoiceSrNo);
        setValue("invoiceNo", invoice.clientDetails.invoiceNo);
        setValue("gst", invoice.clientDetails.gstNo);
        setValue("state", invoice.clientDetails.state);

        setValue(
          "freightAmount",
          invoice.amountDetails.freightAmount.toFixed(2)
        );
        setValue(
          "clearanceCharge",
          invoice.amountDetails.clearanceCharge.toFixed(2)
        );
        setValue("GrandTotal", invoice.amountDetails.grandTotal.toFixed(2));
        setValue(
          "exchangeAmount",
          invoice.amountDetails.exchangeAmount.toFixed(2)
        );
        setValue("currency", invoice.amountDetails.currency);
        setValue("exAmount", invoice.amountDetails.exAmount.toFixed(2));

        setRowData(invoice.billItems);

        if (invoice.qrCodeData && invoice.qrCodeData.length > 0) {
          console.log("QR Code data found:", invoice.qrCodeData);
          setQrCodeData(invoice.qrCodeData);
        } else {
          console.log("No QR Code data in invoice");
          setQrCodeData(null);
        }

        showNotification("success", "Invoice data loaded successfully");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      showNotification("error", "Failed to fetch invoice data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBill = async () => {
    try {
      if (!customerCode || rowData.length === 0) {
        showNotification("error", "Please load shipments before creating bill");
        return;
      }

      if (!watch("invoiceDate")) {
        showNotification("error", "Please select invoice date");
        return;
      }

      // Check if any shipment has RTO or FOC payment
      const rtoOrFocShipments = rowData.filter(
        (shipment) =>
          shipment.payment &&
          (shipment.payment.toUpperCase() === "RTO" ||
            shipment.payment.toUpperCase() === "FOC")
      );

      if (rtoOrFocShipments.length > 0) {
        const awbNumbers = rtoOrFocShipments.map((s) => s.awbNo).join(", ");
        showNotification(
          "error",
          `Cannot create bill. Shipments with RTO/FOC payment found: ${awbNumbers}`
        );
        return;
      }

      setIsLoading(true);

      const invoiceData = {
        fYear: selectedFYear,
        clientDetails: {
          branch: selectedBranch,
          accountCode: customerCode,
          customerName: watch("name"),
          forwarding: watch("forwarding") || "",
          dateFrom: new Date(fromDate),
          dateTo: new Date(toDate),
          invoiceDate: new Date(watch("invoiceDate")),
          invoiceSrNo: watch("invoiceSrNo"),
          invoiceNo: watch("invoiceNo"),
          gstNo: watch("gst"),
          state: watch("state"),
        },
        amountDetails: {
          freightAmount: parseFloat(watch("freightAmount")) || 0,
          clearanceCharge: parseFloat(watch("clearanceCharge")) || 0,
          grandTotal: parseFloat(watch("GrandTotal")) || 0,
          exchangeAmount: parseFloat(exchangeValue) || 0,
          currency: selectedCurrency || "INR",
          exAmount: parseFloat(watch("exAmount")) || 0,
        },
        billItems: rowData,
      };

      const response = await axios.post(`${server}/invoice-ptp`, invoiceData);

      if (response.status === 201) {
        showNotification("success", "Invoice created successfully!");
        setTimeout(() => {
          handleNew();
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      showNotification(
        "error",
        error.response?.data?.error || "Failed to create invoice"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    const currentFYear = watch("fYear");
    const currentBranch = watch("branch");
    reset();
    setValue("fYear", currentFYear);
    setValue("branch", currentBranch);
    setRowData([]);
    setForwardingOptions([]);
    setInvoiceOptions([]);
    setQrCodeData(null);
    showNotification("success", "Form cleared");
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="" key={formKey}>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleModalClose}
        onConfirm={confirmDelete}
        invoiceNo={invoiceToDelete}
      />

      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      {/* Hidden PDF Generator */}
      {pdfData && (
        <InvoicePTPPDFDownloader
          invoiceData={pdfData}
          onDownloadComplete={handlePDFDownloadComplete}
          setIsLoading={setIsLoading}
        />
      )}

      <div className="space-y-4">
        <Heading
          fullscreenBtn={false}
          bulkUploadBtn="hidden"
          title={`Invoice PTP`}
          onRefresh={handleRefresh} // Add refresh button to heading
        />
        <div>
          <LabeledDropdown
            options={fYearOptions}
            value="fYear"
            title={`F Year`}
            register={register}
            setValue={setValue}
            defaultValue={fYear}
          />
        </div>
        <div className="flex gap-10">
          <div className="w-1/2 space-y-2">
            <div>
              <RedLabelHeading label={"Client Details"} />
            </div>
            <div className="flex gap-2">
              <LabeledDropdown
                options={branchOptions.map((b) => b.value)}
                value="branch"
                title={`Branch`}
                register={register}
                setValue={setValue}
              />

              <InputBox
                placeholder="Customer Code"
                value="customerCode"
                register={register}
                setValue={setValue}
              />

              <DummyInputBoxWithLabelDarkGray
                placeholder={"Customer Name"}
                register={register}
                setValue={setValue}
                value={"name"}
              />
            </div>

            <div className="flex gap-2">
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
            </div>

            <div className="flex gap-2">
              <DateInputBox
                placeholder={`Invoice Date`}
                register={register}
                setValue={setValue}
                value={`invoiceDate`}
              />
              <DummyInputBoxWithLabelDarkGray
                placeholder={"Invoice Sr No."}
                register={register}
                setValue={setValue}
                value={"invoiceSrNo"}
              />
              <DummyInputBoxWithLabelDarkGray
                placeholder={"Invoice No"}
                register={register}
                setValue={setValue}
                value={"invoiceNo"}
              />
            </div>
            <div className="flex gap-2">
              <DummyInputBoxWithLabelDarkGray
                placeholder={"GST No"}
                register={register}
                setValue={setValue}
                value={"gst"}
              />
              <DummyInputBoxWithLabelDarkGray
                placeholder={"State"}
                register={register}
                setValue={setValue}
                value={"state"}
              />
              <div className="w-full">
                <OutlinedButtonRed
                  label={isLoading ? "Loading..." : "Show"}
                  onClick={handleShow}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <div className="w-1/2">
            <RedLabelHeading label={`Amount Details`} />

            <div className="space-y-2 mt-2">
              <DummyInputBoxWithLabelDarkGray
                placeholder={"Freight Amount"}
                register={register}
                setValue={setValue}
                value={"freightAmount"}
              />
              <DummyInputBoxWithLabelDarkGray
                placeholder={"Clearance Charge"}
                register={register}
                setValue={setValue}
                value={"clearanceCharge"}
              />
              <div className="bg-[#FFFF80]">
                <DummyInputBoxWithLabelDarkGray
                  placeholder={"Grand Total"}
                  register={register}
                  setValue={setValue}
                  value={"GrandTotal"}
                />
              </div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <InputBox
                    placeholder="Exchange Rate"
                    value="exchangeAmount"
                    register={register}
                    setValue={setValue}
                  />
                </div>
                <div className="w-1/2">
                  <LabeledDropdown
                    options={["AUD", "CAD", "EU", "EUR", "GBP", "INR", "USD"]}
                    value="currency"
                    title={`Currency`}
                    register={register}
                    setValue={setValue}
                  />
                </div>
              </div>
              <div className="bg-[#FFC0FF]">
                <DummyInputBoxWithLabelDarkGray
                  placeholder={"Exchange Amount"}
                  register={register}
                  setValue={setValue}
                  value={"exAmount"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-10 mt-4">
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className="h-[275px]"
        />
      </div>
      <div className="flex gap-2 mt-4">
        <div className="w-1/2">
          <LabeledDropdown
            options={branchOptions.map((b) => b.value)}
            value="searchBranch"
            title={`Branch`}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className="w-1/2">
          <LabeledDropdown
            options={invoiceOptions}
            value="searchInvoiceNo"
            title={`Search Invoice No`}
            register={register}
            setValue={setValue}
          />
        </div>
        <div className="w-[190px]">
          <OutlinedButtonRed
            label={isLoading ? "Loading..." : "Search"}
            onClick={handleSearch}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <div>
          <OutlinedButtonRed label={`Back`} onClick={handleClose} />
        </div>

        <div className="flex gap-2">
          <div>
            <OutlinedButtonRed label={`New`} onClick={handleNew} />
          </div>
          <div>
            <OutlinedButtonRed
              label="Remove Bill"
              onClick={handleRemoveBill}
              disabled={isLoading}
              perm="Billing Deletion"
            />
          </div>
          <div>
            <SimpleButton name="Print Invoice" onClick={generatePDF} />
          </div>
          <div>
            <SimpleButton
              name={isLoading ? "Loading..." : "Create Bill"}
              onClick={handleCreateBill}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePTP;
