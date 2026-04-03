"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function SaleSummarySectorWise() {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);
  
  const [allRowData, setAllRowData] = useState([]);
  const [rowData, setRowData] = useState([]);
  const [withBookingDate, setBookingDate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({ totalWeight: 0, grandTotal: 0 });
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

  // Watch customer code for auto-fill
  const customerCode = watch("customerCode");

  // Fetch customer name when code changes
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

  useEffect(() => {
    if (customerCode && customerCode.length > 0) {
      fetchCustomerName(customerCode);
    } else {
      setValue("name", "");
    }
  }, [customerCode]);

  const [overallTotals, setOverallTotals] = useState({
    totalWeight: 0,
    grandTotal: 0
  });

  const columns = useMemo(
    () => [
      { key: "CustomerCode", label: "Customer Code" },
      { key: "CustomerName", label: "Customer Name" },
      { key: "BranchCode", label: "Branch Code" },
      { key: "City", label: "City" },
      { key: "SalePerson", label: "Sale Person" },
      { key: "RefrenceBy", label: "Reference By" },
      { key: "CollectionBy", label: "Collection By" },
      { key: "Sector", label: "Sector" },
      { key: "CountAwbNo", label: "AWB Count" },
      { key: "Pcs", label: "Pcs" },
      { key: "ActWeight", label: "Actual Weight" },
      { key: "VolWeight", label: "Volumetric Weight" },
      { key: "ChgWeight", label: "Chargeable Weight" },
      { key: "BasicAmount", label: "Basic Amount" },
      { key: "SGST", label: "SGST" },
      { key: "CGST", label: "CGST" },
      { key: "IGST", label: "IGST" },
      { key: "Mischg", label: "Misc Charges" },
      { key: "Fuel", label: "Fuel" },
      { key: "GrandTotal", label: "Grand Total" },
      { key: "OpeningBalance", label: "Opening Balance" },
      { key: "TotalRcpt", label: "Total Receipt" },
      { key: "TotalDebit", label: "Total Debit" },
      { key: "TotalCredit", label: "Total Credit" },
      { key: "TotalOutStanding", label: "Total Outstanding" },
    ],
    []
  );

  const handleShow = async (page = 1) => {
    const values = {
      from: watch("from"),
      to: watch("to"),
      runNumber: watch("runNumber"),
      payment: watch("payment"),
      branch: watch("branch"),
      origin: watch("origin"),
      sector: watch("sector"),
      destination: watch("destination"),
      network: watch("network"),
      counterPart: watch("counterPart"),
      salePerson: watch("salePerson"),
      saleRefPerson: watch("saleRefPerson"),
      company: watch("company"),
      customerCode: watch("customerCode")
    };

    // Check if dates are mandatory based on specific filters
    const mandatoryPresence = !!(
      values.payment ||
      values.branch ||
      values.sector ||
      values.customerCode ||
      values.destination ||
      values.network ||
      values.counterPart ||
      values.salePerson ||
      values.saleRefPerson ||
      values.company
    );
    const optionalPresence = !!(values.runNumber || values.origin);

    if (mandatoryPresence) {
      if (!values.from || !values.to) {
        setNotification({
          type: "error",
          message: "From and To dates are required for specific filter searches.",
          visible: true,
        });
        return;
      }
    } else if (optionalPresence) {
      // Dates are optional
    } else if (!values.from || !values.to) {
      // General behavior: require dates
      setNotification({
        type: "error",
        message: "Please select From and To dates",
        visible: true,
      });
      return;
    }

    setLoading(true);
    setCurrentFilters(values);
    
    try {
      const params = new URLSearchParams();
      if (values.from) params.append("from", values.from);
      if (values.to) params.append("to", values.to);
      params.append("page", page);
      params.append("limit", pageLimit);
      
      if (values.runNumber) params.append("runNumber", values.runNumber.toUpperCase());
      if (values.payment) params.append("payment", values.payment);
      if (values.branch) params.append("branch", values.branch);
      if (values.origin) params.append("origin", values.origin);
      if (values.sector) params.append("sector", values.sector);
      if (values.destination) params.append("destination", values.destination);
      if (values.network) params.append("network", values.network);
      if (values.counterPart) params.append("counterPart", values.counterPart);
      if (values.salePerson) params.append("salePerson", values.salePerson);
      if (values.saleRefPerson) params.append("saleRefPerson", values.saleRefPerson);
      if (values.company) params.append("company", values.company);
      if (values.customerCode) params.append("customerCode", values.customerCode.toUpperCase());
      params.append("withBookingDate", withBookingDate);

      const response = await axios.get(
        `${server}/sale-report-sector-wise?${params.toString()}`
      );

      if (response.data.success) {
        const records = response.data.data || [];
        const pagination = response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: records.length,
        };
        
        setAllRowData(records);
        setRowData(records);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);
        setOverallTotals(response.data.totals || { totalWeight: 0, grandTotal: 0 });

        setNotification({
          type: "success",
          message: `Found ${pagination.totalRecords} records (Page ${pagination.currentPage} of ${pagination.totalPages})`,
          visible: true,
        });
      } else {
        setNotification({
          type: "error",
          message: response.data.message || "No data found",
          visible: true,
        });
        setAllRowData([]);
        setRowData([]);
        setOverallTotals({ totalWeight: 0, grandTotal: 0 });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to fetch data",
        visible: true,
      });
      setAllRowData([]);
      setRowData([]);
      setOverallTotals({ totalWeight: 0, grandTotal: 0 });
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

  const handlePrint = () => {
    const doc = new jsPDF("landscape");
    
    doc.setFontSize(18);
    doc.text("Sale Summary Sector Wise", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Date Range: ${watch("from")} to ${watch("to")}`, 14, 28);
    
    const tableColumn = columns.map(col => col.label);
    const tableRows = allRowData.map(row => 
      columns.map(col => row[col.key] || '')
    );

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [220, 38, 38] },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total Weight: ${overallTotals.totalWeight}`, 14, finalY);
    doc.text(`Grand Total: ${overallTotals.grandTotal.toFixed(2)}`, 14, finalY + 7);

    doc.save("sale-summary-sector-wise.pdf");
    
    setNotification({
      type: "success",
      message: "PDF generated successfully",
      visible: true,
    });
  };

  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      allRowData.map(row => {
        const obj = {};
        columns.forEach(col => {
          obj[col.label] = row[col.key] || '';
        });
        return obj;
      })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sale Summary");

    XLSX.writeFile(workbook, "sale-summary-sector-wise.xlsx");
    
    setNotification({
      type: "success",
      message: "Excel file downloaded successfully",
      visible: true,
    });
  };

  const handleDownloadCSV = () => {
    const headers = columns.map(col => col.label).join(",");
    const rows = allRowData.map(row =>
      columns.map(col => {
        const value = row[col.key] || '';
        return `"${value}"`;
      }).join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sale-summary-sector-wise.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    
    setNotification({
      type: "success",
      message: "CSV file downloaded successfully",
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
      
      <form className="flex flex-col gap-9">
        <Heading
          title={`Sale Summary Sector Wise`}
          bulkUploadBtn="hidden"
          codeListBtn
          onRefresh={() => {
            setAllRowData([]);
            setRowData([]);
            setOverallTotals({ totalWeight: 0, grandTotal: 0 });
            setCurrentPage(1);
            setTotalPages(1);
            setTotalRecords(0);
            setCurrentFilters(null);
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
                options={["ABC", "XYZ", "LMN"]}
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
              <InputBox
                placeholder={`Counter Part`}
                register={register}
                setValue={setValue}
                value={`counterPart`}
              />
              <LabeledDropdown
                options={["ABC", "XYZ", "LMN"]}
                title="Sale Person"
                register={register}
                setValue={setValue}
                value="salePerson"
              />
              <LabeledDropdown
                options={["ABC", "XYZ", "LMN"]}
                title="Sale Ref. Person"
                register={register}
                setValue={setValue}
                value="saleRefPerson"
              />
            </div>
            
            <div className="flex gap-3">
              <div className="w-full">
                <InputBox
                  placeholder={`Company`}
                  register={register}
                  setValue={setValue}
                  value={`company`}
                />
              </div>
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
                  onClick={() => handleShow(1)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <div className="flex gap-6">
            <RedCheckbox
              register={register}
              setValue={setValue}
              label={`Booking Date`}
              id={`bookingDate`}
              isChecked={withBookingDate}
              setChecked={setBookingDate}
            />
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
          
          <PaginationControls />
          
          <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16 mb-2">
            <div>
              <span className="font-sans">Total Weight: </span>
              <span className="text-red">{overallTotals.totalWeight.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex gap-16">
                <div>
                  Grand Total: <span className="text-red">{overallTotals.grandTotal.toFixed(2)}</span>
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
      </form>
    </>
  );
}

export default SaleSummarySectorWise;