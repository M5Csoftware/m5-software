"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
import { LabeledDropdown } from "@/app/components/Dropdown";
import {
  DummyInputBoxWithLabelDarkGray,
} from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import * as XLSX from 'xlsx';

const PaginationControls = ({
  totalPages,
  allRowData,
  totalRecords,
  pageLimit,
  handleLimitChange,
  loading,
  handlePageChange,
  currentPage,
}) => {
  if (totalPages <= 1 && allRowData.length === 0) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{allRowData.length}</span> of{" "}
          <span className="font-medium">{totalRecords}</span> records
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="limit" className="text-sm text-gray-600">
            Rows per page:
          </label>
          <select
            id="limit"
            value={pageLimit}
            onChange={handleLimitChange}
            className="border rounded px-2 py-1 text-sm bg-white"
            disabled={loading}
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || loading}
          className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          type="button"
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          type="button"
        >
          Previous
        </button>

        <span className="px-3 py-1 text-sm">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          type="button"
        >
          Next
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          type="button"
        >
          Last
        </button>
      </div>
    </div>
  );
};

function SaleReportWithDummyNumber() {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch } = useForm();
  const [allRowData, setAllRowData] = useState([]);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Pagination state
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  // Dropdown options
  const [paymentOptions] = useState(["COD", "Prepaid", "To Pay", "Credit"]);
  const [salePersonOptions, setSalePersonOptions] = useState([]);
  const [accountManagerOptions, setAccountManagerOptions] = useState([]);
  const [counterPartOptions, setCounterPartOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  const customerCode = watch("customerCode");

  const [currentPage, setCurrentPage] = useState(1);
  const [totals, setTotals] = useState({
    totalBagWeight: 0,
    totalWeight: 0,
    grandTotal: 0,
  });
  const [withBookingDate, setBookingDate] = useState(false);
  const [withUnbilled, setUnbilled] = useState(false);
  const [withDHL, setDHL] = useState(false);
  const [withDate, setDate] = useState(false);
  const [withBranchWise, setBranchWise] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch dropdown options on mount
  useEffect(() => {
    fetchDropdownOptions();
  }, []);

  // Fetch customer name when account code changes
  useEffect(() => {
    if (customerCode && customerCode.length > 0) {
      fetchCustomerName(customerCode);
    } else {
      setValue("name", "");
    }
  }, [customerCode, setValue]);

  const fetchDropdownOptions = async () => {
    try {
      // Fetch unique sales persons, account managers, and companies
      const customerRes = await axios.get(`${server}/customer-account`);
      if (customerRes.data.success) {
        const customers = customerRes.data.data;
        
        const uniqueSalesPersons = [...new Set(customers.map(c => c.salesPersonName).filter(Boolean))];
        const uniqueAccountManagers = [...new Set(customers.map(c => c.accountManager).filter(Boolean))];
        const uniqueCompanies = [...new Set(customers.map(c => c.companyName).filter(Boolean))];
        
        setSalePersonOptions(uniqueSalesPersons);
        setAccountManagerOptions(uniqueAccountManagers);
        setCompanyOptions(uniqueCompanies);
      }

      // Fetch unique counterparts from runs
      const runRes = await axios.get(`${server}/run-entry`);
      if (runRes.data.success) {
        const runs = runRes.data.data;
        const uniqueCounterParts = [...new Set(runs.map(r => r.counterpart).filter(Boolean))];
        setCounterPartOptions(uniqueCounterParts);
      }
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  };

  const fetchCustomerName = async (accountCode) => {
    try {
      const response = await axios.post(`${server}/sale-report-with-dummy-number`, {
        accountCode,
      });

      if (response.data.success) {
        setValue("name", response.data.customerName);
      } else {
        setValue("name", "");
        setNotification({
          type: "error",
          message: "Customer not found",
          visible: true,
        });
      }
    } catch (error) {
      console.error("Error fetching customer name:", error);
      setValue("name", "");
    }
  };

  const handleShow = async (page = 1) => {
    const mandatoryPresence = !!(
      formData.payment ||
      formData.branch ||
      formData.sector ||
      formData.destination ||
      formData.network ||
      formData.counterPart ||
      formData.salePerson ||
      formData.saleRefPerson ||
      formData.company ||
      formData.accountManager ||
      formData.customerCode
    );
    const optionalPresence = !!(formData.runNumber || formData.origin);

    if (optionalPresence) {
      // Dates are optional
    } else if (mandatoryPresence) {
      if (!formData.from  || !formData.to) {

        setNotification({
          type: "error",
          message: "From and To dates are required for specific filter searches.",
          visible: true,
        });
        return;
      }
    } else if (!formData.from || !formData.to) {
      setNotification({
        type: "error",
        message: "Please select From and To dates",
        visible: true,
      });
      return;
    }

    setLoading(true);
    setCurrentFilters(formData);

    try {
      const queryParams = new URLSearchParams({
        withBookingDate: withBookingDate.toString(),
        withUnbilled: withUnbilled.toString(),
        withDHL: withDHL.toString(),
        page: page,
        limit: pageLimit,
      });

      if (formData.from) queryParams.append("fromDate", formData.from);
      if (formData.to) queryParams.append("toDate", formData.to);

      // Add optional filters
      if (formData.runNumber) queryParams.append("runNumber", formData.runNumber);
      if (formData.payment) queryParams.append("payment", formData.payment);
      if (formData.branch) queryParams.append("branch", formData.branch);
      if (formData.origin) queryParams.append("origin", formData.origin);
      if (formData.sector) queryParams.append("sector", formData.sector);
      if (formData.destination) queryParams.append("destination", formData.destination);
      if (formData.network) queryParams.append("network", formData.network);
      if (formData.counterPart) queryParams.append("counterPart", formData.counterPart);
      if (formData.salePerson) queryParams.append("salePerson", formData.salePerson);
      if (formData.saleRefPerson) queryParams.append("saleRefPerson", formData.saleRefPerson);
      if (formData.company) queryParams.append("company", formData.company);
      if (formData.accountManager) queryParams.append("accountManager", formData.accountManager);
      if (formData.customerCode) queryParams.append("customerCode", formData.customerCode);

      const response = await axios.get(
        `${server}/sale-report-with-dummy-number?${queryParams.toString()}`
      );

      if (response.data.success) {
        setAllRowData(response.data.data || []);
        const pagination = response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: (response.data.data || []).length,
        };
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);
        setTotals(response.data.totals || { totalBagWeight: 0, totalWeight: 0, grandTotal: 0 });
        setNotification({
          type: "success",
          message: `Found ${pagination.totalRecords} records (Page ${pagination.currentPage} of ${pagination.totalPages})`,
          visible: true,
        });
      } else {
        setNotification({
          type: "error",
          message: response.data.message || "Failed to fetch data",
          visible: true,
        });
      }
    } catch (error) {
      console.error("Error fetching sale report:", error);
      setNotification({
        type: "error",
        message: "Failed to fetch sale report data",
        visible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleShow(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      setCurrentPage(1);
      handleShow(1);
    }
  };


  // Print functionality
  const handlePrint = () => {
    if (allRowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to print",
        visible: true,
      });
      return;
    }

    const printWindow = window.open('', '', 'width=1200,height=800');
    
    const tableRows = allRowData.map(row => `
      <tr>
        <td>${row.AwbNo || ''}</td>
        <td>${row.Mawbno || ''}</td>
        <td>${row.ClubNo || ''}</td>
        <td>${row.ForwardingNo || ''}</td>
        <td>${row.BookingDate || ''}</td>
        <td>${row.FlightDate || ''}</td>
        <td>${row.RunNo || ''}</td>
        <td>${row.HUB || ''}</td>
        <td>${row.Branch || ''}</td>
        <td>${row.State || ''}</td>
        <td>${row.City || ''}</td>
        <td>${row.Type || ''}</td>
        <td>${row.SalePerson || ''}</td>
        <td>${row.RefrenceBy || ''}</td>
        <td>${row.CollectionBy || ''}</td>
        <td>${row.AccountManager || ''}</td>
        <td>${row.RateType || ''}</td>
        <td>${row.OpeningAccount || ''}</td>
        <td>${row.Currency || ''}</td>
        <td>${row.OriginName || ''}</td>
        <td>${row.Sector || ''}</td>
        <td>${row.DestinationCode || ''}</td>
        <td>${row.CustomerCode || ''}</td>
        <td>${row.CustomerName || ''}</td>
        <td>${row.ConsignorName || ''}</td>
        <td>${row.ConsigneeName || ''}</td>
        <td>${row.ConsigneeAddressLine1 || ''}</td>
        <td>${row.ConsigneeCity || ''}</td>
        <td>${row.ConsigneeState || ''}</td>
        <td>${row.ConsigneeZipCode || ''}</td>
        <td>${row.ConsigneePhoneNo || ''}</td>
        <td>${row.ShipmentForwarderTo || ''}</td>
        <td>${row.ServiceType || ''}</td>
        <td>${row.Pcs || ''}</td>
        <td>${row.GoodsDesc || ''}</td>
        <td>${row.ActWeight || ''}</td>
        <td>${row.VolWeight || ''}</td>
        <td>${row.VolDiscount || ''}</td>
        <td>${row.ChgWeight || ''}</td>
        <td>${row.BagWeight || ''}</td>
        <td>${row.PaymentType || ''}</td>
        <td>${row.BillingTag || ''}</td>
        <td>${row.BasicAmount || ''}</td>
        <td>${row.RateHike || ''}</td>
        <td>${row.SGST || ''}</td>
        <td>${row.CGST || ''}</td>
        <td>${row.IGST || ''}</td>
        <td>${row.Handling || ''}</td>
        <td>${row.OVWT || ''}</td>
        <td>${row.Mischg || ''}</td>
        <td>${row.MiscRemark || ''}</td>
        <td>${row.Fuel || ''}</td>
        <td>${row.NonTaxable || ''}</td>
        <td>${row.GrandTotal || ''}</td>
        <td>${row.Currency1 || ''}</td>
        <td>${row.BillNo || ''}</td>
        <td>${row.AwbCheck || ''}</td>
        <td>${row.ShipmentRemark || ''}</td>
        <td>${row.CSB || ''}</td>
        <td>${row.HandlingTag || ''}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale Report With Dummy Number</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #dc2626; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .totals { margin-top: 20px; font-weight: bold; text-align: right; }
            .totals span { color: #dc2626; }
            @media print {
              body { margin: 10px; }
              table { font-size: 8px; }
              th, td { padding: 4px; }
            }
          </style>
        </head>
        <body>
          <h1>Sale Report With Dummy Number</h1>
          <table>
            <thead>
              <tr>
                <th>AWB No</th>
                <th>MAWB No</th>
                <th>Club No</th>
                <th>Shipment Forwarding No</th>
                <th>Booking Date</th>
                <th>Flight Date</th>
                <th>Run No</th>
                <th>HUB</th>
                <th>Branch</th>
                <th>State</th>
                <th>City</th>
                <th>Type</th>
                <th>Sale Person</th>
                <th>Reference By</th>
                <th>Collection By</th>
                <th>Account Manager</th>
                <th>Rate Type</th>
                <th>Opening Account</th>
                <th>Currency</th>
                <th>Origin Name</th>
                <th>Sector</th>
                <th>Destination Code</th>
                <th>Customer Code</th>
                <th>Customer Name</th>
                <th>Consignor Name</th>
                <th>Consignee Name</th>
                <th>Consignee Address</th>
                <th>Consignee City</th>
                <th>Consignee State</th>
                <th>Consignee Zip Code</th>
                <th>Consignee Phone No</th>
                <th>Shipment Forwarder To</th>
                <th>Service Type</th>
                <th>Pcs</th>
                <th>Goods Description</th>
                <th>Actual Weight</th>
                <th>Volumetric Weight</th>
                <th>Vol Discount</th>
                <th>Chargeable Weight</th>
                <th>Bag Weight</th>
                <th>Payment Type</th>
                <th>Billing Tag</th>
                <th>Basic Amount</th>
                <th>Rate Hike</th>
                <th>SGST</th>
                <th>CGST</th>
                <th>IGST</th>
                <th>Handling</th>
                <th>OVWT</th>
                <th>Misc Charges</th>
                <th>Misc Remark</th>
                <th>Fuel</th>
                <th>Non-Taxable</th>
                <th>Grand Total</th>
                <th>Currency 1</th>
                <th>Bill No</th>
                <th>AWB Check</th>
                <th>Shipment Remark</th>
                <th>CSB</th>
                <th>Handling Tag</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="totals">
            <p>Total Bag Weight: <span>${totals.totalBagWeight.toFixed(2)}</span></p>
            <p>Total Weight: <span>${totals.totalWeight.toFixed(2)}</span></p>
            <p>Grand Total: <span>${totals.grandTotal.toFixed(2)}</span></p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Excel download functionality - Creates actual XLSX file
  const handleDownloadExcel = () => {
    if (allRowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to download",
        visible: true,
      });
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = allRowData.map(row => ({
        "AWB No": row.AwbNo || '',
        "MAWB No": row.Mawbno || '',
        "Club No": row.ClubNo || '',
        "Shipment Forwarding No": row.ForwardingNo || '',
        "Booking Date": row.BookingDate || '',
        "Flight Date": row.FlightDate || '',
        "Run No": row.RunNo || '',
        "HUB": row.HUB || '',
        "Branch": row.Branch || '',
        "State": row.State || '',
        "City": row.City || '',
        "Type": row.Type || '',
        "Sale Person": row.SalePerson || '',
        "Reference By": row.RefrenceBy || '',
        "Collection By": row.CollectionBy || '',
        "Account Manager": row.AccountManager || '',
        "Rate Type": row.RateType || '',
        "Opening Account": row.OpeningAccount || '',
        "Currency": row.Currency || '',
        "Origin Name": row.OriginName || '',
        "Sector": row.Sector || '',
        "Destination Code": row.DestinationCode || '',
        "Customer Code": row.CustomerCode || '',
        "Customer Name": row.CustomerName || '',
        "Consignor Name": row.ConsignorName || '',
        "Consignee Name": row.ConsigneeName || '',
        "Consignee Address": row.ConsigneeAddressLine1 || '',
        "Consignee City": row.ConsigneeCity || '',
        "Consignee State": row.ConsigneeState || '',
        "Consignee Zip Code": row.ConsigneeZipCode || '',
        "Consignee Phone No": row.ConsigneePhoneNo || '',
        "Shipment Forwarder To": row.ShipmentForwarderTo || '',
        "Service Type": row.ServiceType || '',
        "Pcs": row.Pcs || 0,
        "Goods Description": row.GoodsDesc || '',
        "Actual Weight": row.ActWeight || 0,
        "Volumetric Weight": row.VolWeight || 0,
        "Vol Discount": row.VolDiscount || 0,
        "Chargeable Weight": row.ChgWeight || 0,
        "Bag Weight": row.BagWeight || 0,
        "Payment Type": row.PaymentType || '',
        "Billing Tag": row.BillingTag || '',
        "Basic Amount": row.BasicAmount || 0,
        "Rate Hike": row.RateHike || 0,
        "SGST": row.SGST || 0,
        "CGST": row.CGST || 0,
        "IGST": row.IGST || 0,
        "Handling": row.Handling || 0,
        "OVWT": row.OVWT || 0,
        "Misc Charges": row.Mischg || 0,
        "Misc Remark": row.MiscRemark || '',
        "Fuel": row.Fuel || 0,
        "Non-Taxable": row.NonTaxable || 0,
        "Grand Total": row.GrandTotal || 0,
        "Currency 1": row.Currency1 || '',
        "Bill No": row.BillNo || '',
        "AWB Check": row.AwbCheck || '',
        "Shipment Remark": row.ShipmentRemark || '',
        "CSB": row.CSB || '',
        "Handling Tag": row.HandlingTag || '',
      }));

      // Add totals row
      excelData.push({
        "AWB No": '',
        "MAWB No": '',
        "Club No": '',
        "Shipment Forwarding No": '',
        "Booking Date": '',
        "Flight Date": '',
        "Run No": '',
        "HUB": '',
        "Branch": '',
        "State": '',
        "City": '',
        "Type": '',
        "Sale Person": '',
        "Reference By": '',
        "Collection By": '',
        "Account Manager": '',
        "Rate Type": '',
        "Opening Account": '',
        "Currency": '',
        "Origin Name": '',
        "Sector": '',
        "Destination Code": '',
        "Customer Code": '',
        "Customer Name": '',
        "Consignor Name": '',
        "Consignee Name": '',
        "Consignee Address": '',
        "Consignee City": '',
        "Consignee State": '',
        "Consignee Zip Code": '',
        "Consignee Phone No": '',
        "Shipment Forwarder To": '',
        "Service Type": '',
        "Pcs": '',
        "Goods Description": '',
        "Actual Weight": '',
        "Volumetric Weight": '',
        "Vol Discount": '',
        "Chargeable Weight": `Total: ${totals.totalWeight.toFixed(2)}`,
        "Bag Weight": `Total: ${totals.totalBagWeight.toFixed(2)}`,
        "Payment Type": '',
        "Billing Tag": '',
        "Basic Amount": '',
        "Rate Hike": '',
        "SGST": '',
        "CGST": '',
        "IGST": '',
        "Handling": '',
        "OVWT": '',
        "Misc Charges": '',
        "Misc Remark": '',
        "Fuel": '',
        "Non-Taxable": '',
        "Grand Total": `Total: ${totals.grandTotal.toFixed(2)}`,
        "Currency 1": '',
        "Bill No": '',
        "AWB Check": '',
        "Shipment Remark": '',
        "CSB": '',
        "Handling Tag": '',
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Report");

      // Generate file
      XLSX.writeFile(workbook, `Sale_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

      setNotification({
        type: "success",
        message: "Excel file downloaded successfully",
        visible: true,
      });
    } catch (error) {
      console.error("Error downloading Excel:", error);
      setNotification({
        type: "error",
        message: "Failed to download Excel file",
        visible: true,
      });
    }
  };

  // CSV download functionality
  const handleDownloadCSV = () => {
    if (allRowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to download",
        visible: true,
      });
      return;
    }

    const headers = [
      "AWB No", "MAWB No", "Club No", "Shipment Forwarding No", "Booking Date", 
      "Flight Date", "Run No", "HUB", "Branch", "State", "City", "Type", 
      "Sale Person", "Reference By", "Collection By", "Account Manager", 
      "Rate Type", "Opening Account", "Currency", "Origin Name", "Sector", 
      "Destination Code", "Customer Code", "Customer Name", "Consignor Name", 
      "Consignee Name", "Consignee Address", "Consignee City", "Consignee State", 
      "Consignee Zip Code", "Consignee Phone No", "Shipment Forwarder To", 
      "Service Type", "Pcs", "Goods Description", "Actual Weight", 
      "Volumetric Weight", "Vol Discount", "Chargeable Weight", "Bag Weight", 
      "Payment Type", "Billing Tag", "Basic Amount", "Rate Hike", "SGST", 
      "CGST", "IGST", "Handling", "OVWT", "Misc Charges", "Misc Remark", 
      "Fuel", "Non-Taxable", "Grand Total", "Currency 1", "Bill No", 
      "AWB Check", "Shipment Remark", "CSB", "Handling Tag"
    ];

    const rows = allRowData.map(row => [
      row.AwbNo || '', row.Mawbno || '', row.ClubNo || '', row.ForwardingNo || '',
      row.BookingDate || '', row.FlightDate || '', row.RunNo || '', row.HUB || '',
      row.Branch || '', row.State || '', row.City || '', row.Type || '',
      row.SalePerson || '', row.RefrenceBy || '', row.CollectionBy || '',
      row.AccountManager || '', row.RateType || '', row.OpeningAccount || '',
      row.Currency || '', row.OriginName || '', row.Sector || '',
      row.DestinationCode || '', row.CustomerCode || '', row.CustomerName || '',
      row.ConsignorName || '', row.ConsigneeName || '', row.ConsigneeAddressLine1 || '',
      row.ConsigneeCity || '', row.ConsigneeState || '', row.ConsigneeZipCode || '',
      row.ConsigneePhoneNo || '', row.ShipmentForwarderTo || '', row.ServiceType || '',
      row.Pcs || '', row.GoodsDesc || '', row.ActWeight || '', row.VolWeight || '',
      row.VolDiscount || '', row.ChgWeight || '', row.BagWeight || '',
      row.PaymentType || '', row.BillingTag || '', row.BasicAmount || '',
      row.RateHike || '', row.SGST || '', row.CGST || '', row.IGST || '',
      row.Handling || '', row.OVWT || '', row.Mischg || '', row.MiscRemark || '',
      row.Fuel || '', row.NonTaxable || '', row.GrandTotal || '', row.Currency1 || '',
      row.BillNo || '', row.AwbCheck || '', row.ShipmentRemark || '', row.CSB || '',
      row.HandlingTag || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Sale_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification({
      type: "success",
      message: "CSV file downloaded successfully",
      visible: true,
    });
  };

  const columns = useMemo(
    () => [
      { key: "AwbNo", label: "AWB No" },
      { key: "Mawbno", label: "MAWB No" },
      { key: "ClubNo", label: "Club No" },
      { key: "ForwardingNo", label: "Shipment Forwarding No" },
      { key: "BookingDate", label: "Booking Date" },
      { key: "FlightDate", label: "Flight Date" },
      { key: "RunNo", label: "Run No" },
      { key: "HUB", label: "HUB" },
      { key: "Branch", label: "Branch" },
      { key: "State", label: "State" },
      { key: "City", label: "City" },
      { key: "Type", label: "Type" },
      { key: "SalePerson", label: "Sale Person" },
      { key: "RefrenceBy", label: "Reference By" },
      { key: "CollectionBy", label: "Collection By" },
      { key: "AccountManager", label: "Account Manager" },
      { key: "RateType", label: "Rate Type" },
      { key: "OpeningAccount", label: "Opening Account" },
      { key: "Currency", label: "Currency" },
      { key: "OriginName", label: "Origin Name" },
      { key: "Sector", label: "Sector" },
      { key: "DestinationCode", label: "Destination Code" },
      { key: "CustomerCode", label: "Customer Code" },
      { key: "CustomerName", label: "Customer Name" },
      { key: "ConsignorName", label: "Consignor Name" },
      { key: "ConsigneeName", label: "Consignee Name" },
      { key: "ConsigneeAddressLine1", label: "Consignee Address" },
      { key: "ConsigneeCity", label: "Consignee City" },
      { key: "ConsigneeState", label: "Consignee State" },
      { key: "ConsigneeZipCode", label: "Consignee Zip Code" },
      { key: "ConsigneePhoneNo", label: "Consignee Phone No" },
      { key: "ShipmentForwarderTo", label: "Shipment Forwarder To" },
      { key: "ServiceType", label: "Service Type" },
      { key: "Pcs", label: "Pcs" },
      { key: "GoodsDesc", label: "Goods Description" },
      { key: "ActWeight", label: "Actual Weight" },
      { key: "VolWeight", label: "Volumetric Weight" },
      { key: "VolDiscount", label: "Vol Discount" },
      { key: "ChgWeight", label: "Chargeable Weight" },
      { key: "BagWeight", label: "Bag Weight" },
      { key: "PaymentType", label: "Payment Type" },
      { key: "BillingTag", label: "Billing Tag" },
      { key: "BasicAmount", label: "Basic Amount" },
      { key: "RateHike", label: "Rate Hike" },
      { key: "SGST", label: "SGST" },
      { key: "CGST", label: "CGST" },
      { key: "IGST", label: "IGST" },
      { key: "Handling", label: "Handling" },
      { key: "OVWT", label: "OVWT" },
      { key: "Mischg", label: "Misc Charges" },
      { key: "MiscRemark", label: "Misc Remark" },
      { key: "Fuel", label: "Fuel" },
      { key: "NonTaxable", label: "Non-Taxable" },
      { key: "GrandTotal", label: "Grand Total" },
      { key: "Currency1", label: "Currency 1" },
      { key: "BillNo", label: "Bill No" },
      { key: "AwbCheck", label: "AWB Check" },
      { key: "ShipmentRemark", label: "Shipment Remark" },
      { key: "CSB", label: "CSB" },
      { key: "HandlingTag", label: "Handling Tag" },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-9">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />
      
      <Heading
        title={`Sale Report With Child Number`}
        bulkUploadBtn
        codeListBtn
          onRefresh={() => {
            setAllRowData([]);
            setCurrentPage(1);
            setTotalPages(1);
            setTotalRecords(0);
            setCurrentFilters(null);
            setTotals({ totalBagWeight: 0, totalWeight: 0, grandTotal: 0 });
          }}
        fullscreenBtn={false}
      />
      
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <InputBox
              placeholder={`Run Number`}
              register={register}
              setValue={setValue}
              value={`runNumber`}
            />
            <LabeledDropdown
              options={paymentOptions}
              title="Payment"
              register={register}
              setValue={setValue}
              value="payment"
            />
            <InputBox
              placeholder={`Branch`}
              register={register}
              setValue={setValue}
              value={`branch`}
            />
            <InputBox
              placeholder={`Origin`}
              register={register}
              setValue={setValue}
              value={`origin`}
            />
            <InputBox
              placeholder={`Sector`}
              register={register}
              setValue={setValue}
              value={`sector`}
            />
          </div>
          <div className="flex gap-3">
            <InputBox
              placeholder={`Destination`}
              register={register}
              setValue={setValue}
              value={`destination`}
            />
            <InputBox
              placeholder={`Network`}
              register={register}
              setValue={setValue}
              value={`network`}
            />
            <LabeledDropdown
              options={counterPartOptions}
              title="Counter Part"
              register={register}
              setValue={setValue}
              value="counterPart"
            />
            <LabeledDropdown
              options={salePersonOptions}
              title="Sale Person"
              register={register}
              setValue={setValue}
              value="salePerson"
            />
            <LabeledDropdown
              options={salePersonOptions}
              title="Sale Ref. Person"
              register={register}
              setValue={setValue}
              value="saleRefPerson"
            />
          </div>
          <div className="flex gap-3">
            <LabeledDropdown
              options={companyOptions}
              title="Company"
              register={register}
              setValue={setValue}
              value="company"
            />
            <LabeledDropdown
              options={accountManagerOptions}
              title="Account Manager"
              register={register}
              setValue={setValue}
              value="accountManager"
            />
            <InputBox
              placeholder={`Customer Code`}
              register={register}
              setValue={setValue}
              value={`customerCode`}
            />
            <DummyInputBoxWithLabelDarkGray
              placeholder={"Customer Name"}
              register={register}
              setValue={setValue}
              value={"name"}
            />
          </div>
          <div className="flex gap-3">
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
                type="button" 
                label={loading ? "Loading..." : "Show"} 
                onClick={(e) => {
                  e.preventDefault();
                  handleShow(1);
                }}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center w-full">
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Booking Date"
          id="bookingDate"
          isChecked={withBookingDate}
          setChecked={setBookingDate}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Unbilled Shipment"
          id="unbilledShipment"
          isChecked={withUnbilled}
          setChecked={setUnbilled}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Skip DHL"
          id="skipDHL"
          isChecked={withDHL}
          setChecked={setDHL}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="YYYYMMDD"
          id="date"
          isChecked={withDate}
          setChecked={setDate}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Special Report Branch Wise"
          id="branchWise"
          isChecked={withBranchWise}
          setChecked={setBranchWise}
        />
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={allRowData}
          className={`border-b-0 rounded-b-none h-[45vh]`}
        />
        
        <PaginationControls 
          totalPages={totalPages}
          allRowData={allRowData}
          totalRecords={totalRecords}
          pageLimit={pageLimit}
          handleLimitChange={handleLimitChange}
          loading={loading}
          handlePageChange={handlePageChange}
          currentPage={currentPage}
        />
        
        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16">
          <div>
            <span className="font-sans">Total Bag Weight: </span>
            <span className="text-red">{totals.totalBagWeight.toFixed(2)}</span>
          </div>
          <div>
            <span className="font-sans">Total Weight: </span>
            <span className="text-red">{totals.totalWeight.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-16">
              <div>
                Grand Total: <span className="text-red">{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <div>
          <OutlinedButtonRed type="button" label={"Close"} />
        </div>
        <div className="flex gap-2">
          <OutlinedButtonRed 
            type="button" 
            label={"Print"} 
            onClick={(e) => {
              e.preventDefault();
              handlePrint();
            }}
          />
          <DownloadCsvExcel 
            handleDownloadExcel={handleDownloadExcel}
            handleDownloadCSV={handleDownloadCSV}
          />
        </div>
      </div>
    </div>
  );
}

export default SaleReportWithDummyNumber;