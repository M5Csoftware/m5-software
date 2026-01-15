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
  const itemsPerPage = 20;

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

  // Pagination calculations
  const totalPages = Math.ceil(allRowData.length / itemsPerPage);
  
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setRowData(allRowData.slice(startIndex, endIndex));
  }, [currentPage, allRowData]);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

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

  const handleShow = async (e) => {
    e.preventDefault();
    
    const from = watch("from");
    const to = watch("to");

    if (!from || !to) {
      setNotification({
        type: "error",
        message: "Please select From and To dates",
        visible: true,
      });
      return;
    }

    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append("from", from);
      params.append("to", to);
      
      const runNumber = watch("runNumber");
      const payment = watch("payment");
      const branch = watch("branch");
      const origin = watch("origin");
      const sector = watch("sector");
      const destination = watch("destination");
      const network = watch("network");
      const counterPart = watch("counterPart");
      const salePerson = watch("salePerson");
      const saleRefPerson = watch("saleRefPerson");
      const company = watch("company");
      const customerCodeValue = watch("customerCode");

      if (runNumber) params.append("runNumber", runNumber);
      if (payment) params.append("payment", payment);
      if (branch) params.append("branch", branch);
      if (origin) params.append("origin", origin);
      if (sector) params.append("sector", sector);
      if (destination) params.append("destination", destination);
      if (network) params.append("network", network);
      if (counterPart) params.append("counterPart", counterPart);
      if (salePerson) params.append("salePerson", salePerson);
      if (saleRefPerson) params.append("saleRefPerson", saleRefPerson);
      if (company) params.append("company", company);
      if (customerCodeValue) params.append("customerCode", customerCodeValue);
      params.append("withBookingDate", withBookingDate);

      const response = await axios.get(
        `${server}/sale-report-sector-wise?${params.toString()}`
      );

      if (response.data.success) {
        setAllRowData(response.data.data);
        setTotals(response.data.totals);
        setCurrentPage(1);
        setNotification({
          type: "success",
          message: `Found ${response.data.data.length} records`,
          visible: true,
        });
      } else {
        setNotification({
          type: "error",
          message: response.data.message || "No data found",
          visible: true,
        });
        setAllRowData([]);
        setTotals({ totalWeight: 0, grandTotal: 0 });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setNotification({
        type: "error",
        message: error.response?.data?.message || "Failed to fetch data",
        visible: true,
      });
      setAllRowData([]);
      setTotals({ totalWeight: 0, grandTotal: 0 });
    } finally {
      setLoading(false);
    }
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
    doc.text(`Total Weight: ${totals.totalWeight}`, 14, finalY);
    doc.text(`Grand Total: ${totals.grandTotal.toFixed(2)}`, 14, finalY + 7);

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
            setTotals({ totalWeight: 0, grandTotal: 0 });
            setCurrentPage(1);
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
                  onClick={handleShow}
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
          
          {totalPages > 1 && (
            <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 border-b-0 bg-gray-50 px-4 py-3">
              <div className="text-sm text-gray-700">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, allRowData.length)} to {Math.min(currentPage * itemsPerPage, allRowData.length)} of {allRowData.length} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevious}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                
                {getPageNumbers().map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    onClick={(e) => {
                      e.preventDefault();
                      goToPage(pageNumber);
                    }}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === pageNumber
                        ? 'bg-red-500 text-white border-red-500'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                
                <button
                  type="button"
                  onClick={goToNext}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Next
                </button>
              </div>
            </div>
          )}
          
          <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16">
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
      </form>
    </>
  );
}

export default SaleSummarySectorWise;