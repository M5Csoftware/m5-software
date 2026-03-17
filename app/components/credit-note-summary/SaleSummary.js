"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { LabeledDropdown } from "@/app/components/Dropdown";
import axios from "axios";
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
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import DownloadCsvExcel from "../DownloadCsvExcel";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import NotificationFlag from "@/app/components/Notificationflag";

function SaleSummary() {
  const { register, setValue, handleSubmit, watch, getValues } = useForm();
  const [rowData, setRowData] = useState([]);
  const [withBookingDate, setBookingDate] = useState(false);
  const [withUnbilled, setUnbilled] = useState(false);
  const [withDHL, setDHL] = useState(false);
  const [withDate, setDate] = useState(false);
  const [withBranchWise, setBrnachWise] = useState(false);
  const [withConsignor, setConsignor] = useState(false);
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    grandTotal: 0,
    totalOutstanding: 0,
    totalDebit: 0,
    totalCredit: 0,
  });
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

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Function to fetch sale summary with pagination
  const fetchSaleSummaryWithPagination = async (filters, page = 1) => {
    try {
      setLoading(true);

      // Validate required dates
      if (!filters.from || !filters.to) {
        showNotification("error", "Please select both From and To dates");
        setLoading(false);
        return;
      }

      // Prepare all filter parameters
      const params = {
        from: toISODate(filters.from),
        to: toISODate(filters.to),
        ...(filters.branch && { branch: filters.branch }),
        ...(filters.state && { state: filters.state }),
        ...(filters.salePerson && { salePerson: filters.salePerson }),
        ...(filters.accountManager && { accountManager: filters.accountManager }),
        ...(filters.customerCode && { customerCode: filters.customerCode }),
        ...(withUnbilled && { withUnbilled: true }),
        // Add pagination parameters
        page: page,
        limit: pageLimit,
      };

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const res = await axios.get(
        `${server}/credit-note-awb-wise/sale-summary`,
        {
          params: params,
        }
      );

      const rows = res.data.data || [];
      setRowData(rows);

      // Set pagination info
      if (res.data.pagination) {
        setCurrentPage(res.data.pagination.currentPage);
        setTotalPages(res.data.pagination.totalPages);
        setTotalRecords(res.data.pagination.totalRecords);
      }

      // Calculate footer totals from the response
      if (res.data.totals) {
        setTotals(res.data.totals);
      }

      if (rows.length === 0) {
        showNotification("info", "No records found");
      } else {
        showNotification(
          "success",
          `Found ${rows.length} records (Page ${res.data.pagination?.currentPage || page} of ${res.data.pagination?.totalPages || 1})`
        );
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to fetch data");
      setRowData([]);
      setTotals({
        grandTotal: 0,
        totalOutstanding: 0,
        totalDebit: 0,
        totalCredit: 0,
      });
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;

    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch new page
    fetchSaleSummaryWithPagination(currentFilters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have current filters, refetch with new limit (reset to page 1)
    if (currentFilters) {
      setCurrentPage(1);
      fetchSaleSummaryWithPagination(currentFilters, 1);
    }
  };

  const handleShow = async (values) => {
    // Store filters for pagination
    setCurrentFilters(values);

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    await fetchSaleSummaryWithPagination(values, 1);
  };

  const toISODate = (value) => {
    if (!value) return null;

    // If already ISO format, return as is
    if (value.includes("-")) return value;

    // Convert from DD/MM/YYYY to YYYY-MM-DD
    const [dd, mm, yyyy] = value.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Optional: Add a reset function to clear all filters
  const handleReset = () => {
    // Reset form values
    const resetValues = {
      runNumber: "",
      payment: "",
      branch: "",
      origin: "",
      sector: "",
      destination: "",
      network: "",
      counterPart: "",
      salePerson: "",
      saleRefPerson: "",
      company: "",
      state: "",
      accountManager: "",
      type: "",
      customerCode: "",
      name: "",
      from: "",
      to: "",
    };

    Object.keys(resetValues).forEach((key) => {
      setValue(key, resetValues[key]);
    });

    // Reset checkboxes
    setBookingDate(false);
    setUnbilled(false);
    setDHL(false);
    setDate(false);
    setBrnachWise(false);
    setConsignor(false);

    // Clear table data
    setRowData([]);
    setTotals({
      grandTotal: 0,
      totalOutstanding: 0,
      totalDebit: 0,
      totalCredit: 0,
    });

    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);

    showNotification("success", "Filters reset successfully");
  };

  const columns = useMemo(
    () => [
      { key: "CustomerCode", label: "Customer Code" },
      { key: "CustomerName", label: "Customer Name" },
      { key: "Type", label: "Type" },
      { key: "BranchCode", label: "Branch" },
      { key: "State", label: "State" },
      { key: "City", label: "City" },
      { key: "SalePerson", label: "Sale Person" },
      { key: "RefrenceBy", label: "Reference By" },
      { key: "ManagedBy", label: "Managed By" },
      { key: "CollectionBy", label: "Collection By" },
      { key: "AccountManager", label: "Account Manager" },
      { key: "GM", label: "GM" },
      { key: "RM", label: "RM" },
      { key: "SM", label: "SM" },
      { key: "RateType", label: "Rate Type" },
      { key: "Currency", label: "Currency" },
      { key: "BasicAmount", label: "Basic Amount" },
      { key: "DiscountAmt", label: "Discount Amount" },
      { key: "BasicAmtAfterDiscount", label: "Basic After Discount" },
      { key: "RateHike", label: "Rate Hike" },
      { key: "SGST", label: "SGST" },
      { key: "CGST", label: "CGST" },
      { key: "IGST", label: "IGST" },
      { key: "Handling", label: "Handling" },
      { key: "OVWT", label: "OVWT" },
      { key: "Mischg", label: "Misc Charge" },
      { key: "Fuel", label: "Fuel" },
      { key: "NonTaxable", label: "Non Taxable" },
      { key: "GrandTotal", label: "Grand Total" },
      { key: "OpeningBalance", label: "Opening Balance" },
      { key: "TotalRcpt", label: "Total Receipt" },
      { key: "TotalDebit", label: "Total Debit" },
      { key: "TotalCredit", label: "Total Credit" },
      { key: "TotalOutStanding", label: "Outstanding" },
    ],
    []
  );

  const handleDownloadExcel = async () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sale Summary");

    /* ===== HEADER ===== */
    worksheet.columns = columns.map((col) => ({
      header: col.label,
      key: col.key,
      width: Math.max(col.label.length + 6, 18),
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDC3545" }, // red
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    /* ===== DATA ===== */
    rowData.forEach((row) => {
      const r = worksheet.addRow(row);
      r.height = 22;

      r.eachCell((cell) => {
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    /* ===== TOTAL ROW ===== */
    const totalRow = worksheet.addRow({
      CustomerName: "TOTAL",
      GrandTotal: totals.grandTotal,
      TotalDebit: totals.totalDebit,
      TotalCredit: totals.totalCredit,
      TotalOutStanding: totals.totalOutstanding,
    });

    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = {
        top: { style: "double" },
        bottom: { style: "double" },
      };
    });

    /* ===== NUMBER FORMAT ===== */
    [
      "BasicAmount",
      "DiscountAmt",
      "BasicAmtAfterDiscount",
      "RateHike",
      "Fuel",
      "Handling",
      "GrandTotal",
      "TotalDebit",
      "TotalCredit",
      "TotalOutStanding",
    ].forEach((key) => {
      worksheet.getColumn(key).numFmt = "#,##0.00";
    });

    /* ===== FREEZE HEADER ONLY ===== */
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    /* ===== DOWNLOAD ===== */
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "credit-note-sale-summary.xlsx"
    );

    showNotification("success", "Excel downloaded successfully");
  };

  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to export");
      return;
    }

    // Build CSV header from columns
    const headers = columns.map((c) => `"${c.label}"`).join(",");

    // Build CSV rows
    const rows = rowData.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key] ?? "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    // Totals row
    const totalRow = columns
      .map((c) => {
        if (c.key === "CustomerName") return `"TOTAL"`;
        if (c.key === "GrandTotal") return `"${totals.grandTotal.toFixed(2)}"`;
        if (c.key === "TotalDebit") return `"${totals.totalDebit.toFixed(2)}"`;
        if (c.key === "TotalCredit")
          return `"${totals.totalCredit.toFixed(2)}"`;
        if (c.key === "TotalOutStanding")
          return `"${totals.totalOutstanding.toFixed(2)}"`;
        return `""`;
      })
      .join(",");

    const csvContent = [headers, ...rows, totalRow].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "credit-note-sale-summary.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("success", "CSV downloaded successfully");
  };

  // Pagination component
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
              className="border rounded px-2 py-1 text-sm"
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
            disabled={currentPage === 1 || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <form className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      
      <Heading
        title="Sale Summary"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleReset}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => {
          // Fullscreen functionality can be added here
        }}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          {/* Row 1 - 4 columns */}
          <div className="grid grid-cols-4 gap-3">
            <InputBox
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              value="runNumber"
            />
            <LabeledDropdown
              options={["ABC", "XYZ", "LMN"]}
              title="Payment"
              register={register}
              setValue={setValue}
              value="payment"
            />
            <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              value="branch"
            />
            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              value="origin"
            />
          </div>

          {/* Row 2 - 4 columns */}
          <div className="grid grid-cols-4 gap-3">
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              value="sector"
            />
            <InputBox
              placeholder="Destination"
              register={register}
              setValue={setValue}
              value="destination"
            />
            <InputBox
              placeholder="Network"
              register={register}
              setValue={setValue}
              value="network"
            />
            <InputBox
              placeholder="Counter Part"
              register={register}
              setValue={setValue}
              value="counterPart"
            />
          </div>

          {/* Row 3 - 4 columns */}
          <div className="grid grid-cols-4 gap-3">
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
            <InputBox
              placeholder="Company"
              register={register}
              setValue={setValue}
              value="company"
            />
            <InputBox
              placeholder="State"
              register={register}
              setValue={setValue}
              value="state"
            />
          </div>

          {/* Row 4 - 4 columns */}
          <div className="grid grid-cols-4 gap-3">
            <LabeledDropdown
              options={["ABC", "XYZ", "LMN"]}
              title="Account Manager"
              register={register}
              setValue={setValue}
              value="accountManager"
            />
            <LabeledDropdown
              options={["ABC", "XYZ", "LMN"]}
              title="Type"
              register={register}
              setValue={setValue}
              value="type"
            />
            <InputBox
              placeholder="Customer Code"
              register={register}
              setValue={setValue}
              value="customerCode"
            />
            <DummyInputBoxWithLabelDarkGray
              placeholder="Customer Name"
              register={register}
              setValue={setValue}
              value="name"
            />
          </div>

          {/* Row 5 - Date range and buttons */}
          <div className="grid grid-cols-4 gap-3">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
              required
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
              required
            />
            <div className="flex gap-2">
              <OutlinedButtonRed
                type="button"
                label={loading ? "Loading..." : "Show"}
                onClick={handleSubmit(handleShow)}
                disabled={loading}
              />
            </div>
            <div className="w-full">
              <DownloadCsvExcel
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
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
          setChecked={setBrnachWise}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Consignor Wise"
          id="consignorWise"
          isChecked={withConsignor}
          setChecked={setConsignor}
        />
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className="border-b-0 rounded-b-none h-[35vh]"
          loading={loading}
        />

        {/* Pagination Controls */}
        <PaginationControls />

        <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2">
          <div className="text-sm text-gray-600">
            {totalRecords > 0 && (
              <span>Total Records: {totalRecords}</span>
            )}
          </div>
          <div className="flex gap-16">
            <div>
              Total Debit :
              <span className="text-red ml-1">
                {totals.totalDebit.toFixed(2)}
              </span>
            </div>
            <div>
              Total Credit :
              <span className="text-red ml-1">
                {totals.totalCredit.toFixed(2)}
              </span>
            </div>
            <div>
              Outstanding :
              <span className="text-red ml-1">
                {totals.totalOutstanding.toFixed(2)}
              </span>
            </div>
            <div>
              Grand Total :
              <span className="text-red ml-1">
                {totals.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-2">{/* Add other buttons if needed */}</div>
      </div>
    </form>
  );
}

export default SaleSummary;