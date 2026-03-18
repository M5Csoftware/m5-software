"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
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
import { X } from "lucide-react";

function SaleWithCollectionReport() {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      Customer: "",
      Name: "",
      from: "",
      to: "",
    }
  });
  const [rowData, setRowData] = useState([]);
  const [withHoldAWB, setWithHoldAWB] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  const accountCode = watch("Customer");
  const fromDate = watch("from");
  const toDate = watch("to");

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Fetch customer name when account code changes
  useEffect(() => {
    if (accountCode && accountCode.length > 0) {
      fetchCustomerName(accountCode);
    } else {
      setValue("Name", "");
    }
  }, [accountCode, setValue]);

  const fetchCustomerName = async (code) => {
    try {
      const response = await axios.post(`${server}/sale-with-collection-report`, {
        accountCode: code,
      });

      if (response.data.success) {
        setValue("Name", response.data.customer.name|| "");
        setCustomerInfo(response.data.customer);
      } else {
        setValue("Name", "");
        setCustomerInfo(null);
      }
    } catch (error) {
      console.error("Error fetching customer name:", error);
      setValue("Name", "");
      setCustomerInfo(null);
    }
  };

  const handleShow = async (page = 1) => {
    const formData = watch();

    // Validate: Either account code OR date range must be provided (or both)
    if (!formData.Customer && (!formData.from || !formData.to)) {
      showNotification("error", "Please provide either Customer Code or Date Range");
      return;
    }

    // Validate: If only dates are provided without account code
    if (!formData.Customer && (formData.from || formData.to)) {
      showNotification("error", "Date range can only be used with Customer Code");
      return;
    }

    setLoading(true);
    setCurrentFilters(formData);

    try {
      const queryParams = new URLSearchParams({
        withHold: withHoldAWB.toString(),
        page: page,
        limit: pageLimit,
      });

      // Add account code (required if dates are present)
      if (formData.Customer) {
        queryParams.append("accountCode", formData.Customer);
        
        // Add date range if both dates are provided
        if (formData.from && formData.to) {
          queryParams.append("fromDate", formData.from);
          queryParams.append("toDate", formData.to);
        }
      }

      const response = await axios.get(
        `${server}/sale-with-collection-report?${queryParams.toString()}`
      );

      if (response.data.success) {
        const records = response.data.data || [];
        const pagination = response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: records.length,
        };

        setRowData(records);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);
        setOpeningBalance(Number(response.data.openingBalance) || 0);
        setClosingBalance(Number(response.data.closingBalance) || 0);
        setCustomerInfo(response.data.customerInfo);
        showNotification("success", `Found ${pagination.totalRecords} records (Page ${pagination.currentPage} of ${pagination.totalPages})`);
      } else {
        showNotification("error", response.data.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching sale with collection report:", error);
      showNotification("error", "Failed to fetch report data");
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

  const PaginationControls = () => {
    if (totalPages <= 1 && rowData.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{rowData.length}</span> of{" "}
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
              <option value={25}>25</option>
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

  // Handle refresh with complete reset
  const handleRefresh = () => {
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);

    // Increment form key to force complete remount
    setFormKey(prev => prev + 1);
    
    // Reset form
    reset({
      Customer: "",
      Name: "",
      from: "",
      to: "",
    });
    
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

  // Print functionality
  const handlePrint = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to print");
      return;
    }

    const printWindow = window.open('', '', 'width=1200,height=800');
    
    const tableRows = rowData.map(row => `
      <tr>
        <td>${row.AwbNo || ''}</td>
        <td>${row.SaleType || ''}</td>
        <td>${row.Date || ''}</td>
        <td>${row.CustomerCode || ''}</td>
        <td>${row.ConsigneeName || ''}</td>
        <td>${row.ShipmentForwarderBy || ''}</td>
        <td>${row.Sector || ''}</td>
        <td>${row.DestinationCode || ''}</td>
        <td>${row.ConsigneeCity || ''}</td>
        <td>${row.ConsigneeZipCode || ''}</td>
        <td>${row.ServiceType || ''}</td>
        <td>${row.NumofItems || ''}</td>
        <td>${row.ActWeight || ''}</td>
        <td>${row.VolWeight || ''}</td>
        <td>${row.ChgWeight || ''}</td>
        <td>${row.BasicAmount || ''}</td>
        <td>${row.RateHike || ''}</td>
        <td>${row.SGST || ''}</td>
        <td>${row.CSGT || ''}</td>
        <td>${row.IGST || ''}</td>
        <td>${row.Mischg || ''}</td>
        <td>${row.Fuel || ''}</td>
        <td>${row.NonTaxable || ''}</td>
        <td>${row.GrandTotal || ''}</td>
        <td>${row.RcvAmount || ''}</td>
        <td>${row.DebitAmount || ''}</td>
        <td>${row.CreditAmount || ''}</td>
        <td>${row.Remark || ''}</td>
        <td>${row.Balance || ''}</td>
      </tr>
    `).join('');

    const customerDetails = customerInfo ? `
      <div style="margin-bottom: 20px;">
        <p><strong>Customer:</strong> ${customerInfo.name || ''} (${customerInfo.accountCode || ''})</p>
        <p><strong>Branch:</strong> ${customerInfo.branch || ''}, <strong>State:</strong> ${customerInfo.state || ''}</p>
      </div>
    ` : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale With Collection Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #dc2626; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { margin-top: 20px; font-weight: bold; text-align: right; }
            .summary span { color: #dc2626; }
            @media print {
              body { margin: 10px; }
              table { font-size: 8px; }
              th, td { padding: 4px; }
            }
          </style>
        </head>
        <body>
          <h1>Sale With Collection Report</h1>
          ${customerDetails}
          <table>
            <thead>
              <tr>
                <th>AWB No</th>
                <th>Sale Type</th>
                <th>Date</th>
                <th>Customer Code</th>
                <th>Consignee Name</th>
                <th>Shipment Forwarder By</th>
                <th>Sector</th>
                <th>Destination Code</th>
                <th>Consignee City</th>
                <th>Consignee Zip Code</th>
                <th>Service Type</th>
                <th>No. of Items</th>
                <th>Actual Weight</th>
                <th>Volumetric Weight</th>
                <th>Chargeable Weight</th>
                <th>Basic Amount</th>
                <th>Rate Hike</th>
                <th>SGST</th>
                <th>CSGT</th>
                <th>IGST</th>
                <th>Misc Charges</th>
                <th>Fuel</th>
                <th>Non-Taxable</th>
                <th>Grand Total</th>
                <th>Received Amount</th>
                <th>Debit Amount</th>
                <th>Credit Amount</th>
                <th>Remark</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="summary">
            <p>Opening Balance: <span>₹ ${(Number(openingBalance) || 0).toFixed(2)}</span></p>
            <p>Closing Balance: <span>₹ ${(Number(closingBalance) || 0).toFixed(2)}</span></p>
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

    showNotification("success", "Print dialog opened");
  };

  // Excel download functionality
  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const excelData = rowData.map(row => ({
        "AWB No": row.AwbNo || '',
        "Sale Type": row.SaleType || '',
        "Date": row.Date || '',
        "Customer Code": row.CustomerCode || '',
        "Consignee Name": row.ConsigneeName || '',
        "Shipment Forwarder By": row.ShipmentForwarderBy || '',
        "Sector": row.Sector || '',
        "Destination Code": row.DestinationCode || '',
        "Consignee City": row.ConsigneeCity || '',
        "Consignee Zip Code": row.ConsigneeZipCode || '',
        "Service Type": row.ServiceType || '',
        "No. of Items": row.NumofItems || 0,
        "Actual Weight": row.ActWeight || 0,
        "Volumetric Weight": row.VolWeight || 0,
        "Chargeable Weight": row.ChgWeight || 0,
        "Basic Amount": row.BasicAmount || 0,
        "Rate Hike": row.RateHike || 0,
        "SGST": row.SGST || 0,
        "CSGT": row.CSGT || 0,
        "IGST": row.IGST || 0,
        "Misc Charges": row.Mischg || 0,
        "Fuel": row.Fuel || 0,
        "Non-Taxable": row.NonTaxable || 0,
        "Grand Total": row.GrandTotal || 0,
        "Received Amount": row.RcvAmount || 0,
        "Debit Amount": row.DebitAmount || 0,
        "Credit Amount": row.CreditAmount || 0,
        "Remark": row.Remark || '',
        "Balance": row.Balance || 0,
      }));

      excelData.push({
        "AWB No": '',
        "Sale Type": '',
        "Date": '',
        "Customer Code": '',
        "Consignee Name": '',
        "Shipment Forwarder By": '',
        "Sector": '',
        "Destination Code": '',
        "Consignee City": '',
        "Consignee Zip Code": '',
        "Service Type": '',
        "No. of Items": '',
        "Actual Weight": '',
        "Volumetric Weight": '',
        "Chargeable Weight": '',
        "Basic Amount": '',
        "Rate Hike": '',
        "SGST": '',
        "CSGT": '',
        "IGST": '',
        "Misc Charges": '',
        "Fuel": '',
        "Non-Taxable": '',
        "Grand Total": '',
        "Received Amount": '',
        "Debit Amount": '',
        "Credit Amount": '',
        "Remark": `Opening Balance: ${(Number(openingBalance) || 0).toFixed(2)}`,
        "Balance": `Closing Balance: ${(Number(closingBalance) || 0).toFixed(2)}`,
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Collection Report");

      XLSX.writeFile(workbook, `Sale_Collection_Report_${new Date().toISOString().split('T')[0]}.xlsx`);

      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Failed to download Excel file");
    }
  };

  // CSV download functionality
  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const headers = [
        "AWB No", "Sale Type", "Date", "Customer Code", "Consignee Name",
        "Shipment Forwarder By", "Sector", "Destination Code", "Consignee City",
        "Consignee Zip Code", "Service Type", "No. of Items", "Actual Weight",
        "Volumetric Weight", "Chargeable Weight", "Basic Amount", "Rate Hike",
        "SGST", "CSGT", "IGST", "Misc Charges", "Fuel", "Non-Taxable",
        "Grand Total", "Received Amount", "Debit Amount", "Credit Amount",
        "Remark", "Balance"
      ];

      const rows = rowData.map(row => [
        row.AwbNo || '', row.SaleType || '', row.Date || '', row.CustomerCode || '',
        row.ConsigneeName || '', row.ShipmentForwarderBy || '', row.Sector || '',
        row.DestinationCode || '', row.ConsigneeCity || '', row.ConsigneeZipCode || '',
        row.ServiceType || '', row.NumofItems || '', row.ActWeight || '',
        row.VolWeight || '', row.ChgWeight || '', row.BasicAmount || '',
        row.RateHike || '', row.SGST || '', row.CSGT || '', row.IGST || '',
        row.Mischg || '', row.Fuel || '', row.NonTaxable || '', row.GrandTotal || '',
        row.RcvAmount || '', row.DebitAmount || '', row.CreditAmount || '',
        row.Remark || '', row.Balance || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Sale_Collection_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "CSV file downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Failed to download CSV file");
    }
  };

  const columns = useMemo(
    () => [
      { key: "AwbNo", label: "AWB No" },
      { key: "SaleType", label: "Sale Type" },
      { key: "Date", label: "Date" },
      { key: "CustomerCode", label: "Customer Code" },
      { key: "ConsigneeName", label: "Consignee Name" },
      { key: "ShipmentForwarderBy", label: "Shipment Forwarder By" },
      { key: "Sector", label: "Sector" },
      { key: "DestinationCode", label: "Destination Code" },
      { key: "ConsigneeCity", label: "Consignee City" },
      { key: "ConsigneeZipCode", label: "Consignee Zip Code" },
      { key: "ServiceType", label: "Service Type" },
      { key: "NumofItems", label: "No. of Items" },
      { key: "ActWeight", label: "Actual Weight" },
      { key: "VolWeight", label: "Volumetric Weight" },
      { key: "ChgWeight", label: "Chargeable Weight" },
      { key: "BasicAmount", label: "Basic Amount" },
      { key: "RateHike", label: "Rate Hike" },
      { key: "SGST", label: "SGST" },
      { key: "CSGT", label: "CSGT" },
      { key: "IGST", label: "IGST" },
      { key: "Mischg", label: "Misc Charges" },
      { key: "Fuel", label: "Fuel" },
      { key: "NonTaxable", label: "Non-Taxable" },
      { key: "GrandTotal", label: "Grand Total" },
      { key: "RcvAmount", label: "Received Amount" },
      { key: "DebitAmount", label: "Debit Amount" },
      { key: "CreditAmount", label: "Credit Amount" },
      { key: "Remark", label: "Remark" },
      { key: "Balance", label: "Balance" },
    ],
    []
  );

  return (
    <form className="flex flex-col gap-9" key={formKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title={`Sale With Collection Report`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => setIsFullscreen(true)}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="w-full">
              <InputBox
                key={`Customer-${formKey}`}
                placeholder={`Customer Code`}
                register={register}
                setValue={setValue}
                value={`Customer`}
              />
            </div>

            <DummyInputBoxWithLabelDarkGray
              key={`Name-${formKey}`}
              placeholder={"Customer Name"}
              register={register}
              setValue={setValue}
              value={"Name"}
            />
            <DateInputBox
              key={`from-${formKey}`}
              register={register}
              setValue={setValue}
              value={`from`}
              placeholder="From"
              disabled={!accountCode}
            />
            <DateInputBox
              key={`to-${formKey}`}
              register={register}
              setValue={setValue}
              value={`to`}
              placeholder="To"
              disabled={!accountCode}
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

      <div className="flex justify-between">
        <div className="flex gap-6">
          <RedCheckbox
            key={`withHoldAWB-${formKey}`}
            register={register}
            setValue={setValue}
            label={`With Hold AWB`}
            id={`withHoldAWBNo`}
            isChecked={withHoldAWB}
            setChecked={setWithHoldAWB}
          />
        </div>
        <div>
          <span className="text-red">*Full Ledger Leave Blank Date Range</span>
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
            <span className="font-sans">Opening Balance:</span>
            <span className="text-red"> ₹ {(Number(openingBalance) || 0).toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-16">
              <div>
                Balance: <span className="text-red">₹ {(Number(closingBalance) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <PaginationControls />
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sale With Collection Report - Fullscreen View</h2>
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
              <span className="font-sans font-semibold">Opening Balance:</span>
              <span className="text-red font-semibold"> ₹ {(Number(openingBalance) || 0).toFixed(2)}</span>
            </div>
            <div>
              <span className="font-semibold">Balance: </span>
              <span className="text-red font-semibold">₹ {(Number(closingBalance) || 0).toFixed(2)}</span>
            </div>
          </div>
          <PaginationControls />
        </div>
      )}

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
    </form>
  );
}

export default SaleWithCollectionReport;