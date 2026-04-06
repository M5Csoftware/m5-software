"use client";
import React, { useState, useMemo, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import { Dropdown } from "../Dropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import DownloadCsvExcel from "../DownloadCsvExcel";
import { X } from "lucide-react";
import { useRef } from "react";
import NotificationFlag from "../Notificationflag";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function SaleDetails({ isFullscreen, setIsFullscreen }) {
  const { register, setValue, watch, getValues } = useForm();
  const [rowData, setRowData] = useState([]);
  const [withBooking, setWithBooking] = useState(false);
  const [dropdowns, setDropdowns] = useState({
    companies: [],
    refPersons: [],
    salesPersons: [], // NEW
  });
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const isSyncingRef = useRef(false);

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "date", label: "Booking Date" },
      { key: "flight", label: "Flight Date" }, // using flight currently
      { key: "runNo", label: "Run No" },
      { key: "clubNo", label: "Club No" }, // clubNo
      { key: "company", label: "Branch" }, // no exact match, using company
      { key: "salesPersonName", label: "Sale Person" }, // no exact match, using insertUser
      { key: "reference", label: "Reference By" },
      { key: "network", label: "Network" },
      { key: "origin", label: "Origin Name" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination Code" },
      { key: "accountCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "receiverAddressLine1", label: "Consignee Address" },
      { key: "receiverCity", label: "Consignee City" },
      { key: "receiverState", label: "Consignee State" },
      { key: "receiverPincode", label: "Consignee Zip Code" },
      { key: "receiverPhoneNumber", label: "Consignee Phone No" },
      { key: "service", label: "Service Type" },
      { key: "pcs", label: "Pcs" },
      { key: "goodstype", label: "Goods Description" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "totalVolWt", label: "Volumetric Weight" },
      { key: "volDisc", label: "Vol Discount" },
      { key: "chgwt", label: "Chargeable Weight" },
      { key: "payment", label: "Payment Type" },
      { key: "basicAmt", label: "Basic Amount" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "miscChg", label: "Misc Charges" },
      { key: "miscChgReason", label: "Misc Remark" }, // miscChgReason
      { key: "fuelAmt", label: "Fuel" }, // fuelAmt
      { key: "totalAmt", label: "Grand Total" },
      { key: "currency", label: "Currency" },
      { key: "billNo", label: "Bill No" },
      { key: "AwbCheck", label: "AWB Check" }, // No matching field in schema
      { key: "operationRemark", label: "Shipment Remark" }, // operationRemark
    ],
    []
  );

  const [isLoading, setIsLoading] = useState(false);
  const { server } = useContext(GlobalContext);
  const [customerName, setCustomerName] = useState(""); // for inputValue

  const fromDate = watch("from");
  const toDate = watch("to");

  // Function to fetch data with pagination
  const fetchDataWithPagination = async (filters, page = 1) => {
    setIsLoading(true);

    const mandatoryPresence = !!(
      filters.payment ||
      filters.branch ||
      filters.sector ||
      filters.destination ||
      filters.network ||
      filters.counterPart ||
      filters.salePerson ||
      filters.saleRefPerson ||
      filters.company ||
      filters.accountCode ||
      filters.state
    );
    const optionalPresence = !!(filters.runNumber || filters.origin);

    if (mandatoryPresence) {
      if (!filters.from || !filters.to) {
        showNotification(
          "error",
          "From and To dates are required for specific filter searches."
        );
        setIsLoading(false);
        return;
      }
    } else if (optionalPresence) {
      // Dates are optional
    } else if (!filters.from || !filters.to) {
      showNotification("error", "Please select from and to dates");
      setIsLoading(false);
      return;
    }

    // Convert to Date objects
    const fromObj = filters.from ? parseDateDDMMYYYY(filters.from) : null;
    const toObj = filters.to ? parseDateDDMMYYYY(filters.to) : null;

    if (
      (filters.from && (!fromObj || isNaN(fromObj.getTime()))) ||
      (filters.to && (!toObj || isNaN(toObj.getTime())))
    ) {
      showNotification("error", "Invalid date format");
      setIsLoading(false);
      return;
    }

    if (fromObj) fromObj.setHours(0, 0, 0, 0);
    if (toObj) toObj.setHours(23, 59, 59, 999);

    const queryParams = new URLSearchParams({
      runNo: filters.runNumber || "",
      payment: filters.payment !== "All" ? filters.payment : "", // 👈 skip if All
      branch: filters.branch || "",
      origin: filters.origin || "",
      sector: filters.sector || "",
      destination: filters.destination || "",
      network: filters.network || "",
      counterPart: filters.counterPart || "",
      salePerson: filters.salePerson !== "All" ? filters.salePerson : "", // 👈 skip if All
      saleRefPerson: filters.saleRefPerson !== "All" ? filters.saleRefPerson : "", // 👈 skip if All
      company: filters.company !== "All" ? filters.company : "", // 👈 skip if All
      accountCode: filters.accountCode || "",
      state: filters.state || "",
      withBooking: withBooking ? "1" : "0",
      // Add pagination parameters
      page: page.toString(),
      limit: pageLimit.toString(),
    });

    if (fromObj) queryParams.append("from", fromObj.toISOString());
    if (toObj) queryParams.append("to", toObj.toISOString());

    console.log("Fetching with pagination:", { page, limit: pageLimit });

    try {
      const res = await fetch(`${server}/sale-report-with-hold?${queryParams}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fetch failed");
      }

      const responseData = await res.json();

      // Handle response with pagination
      const shipmentsData = responseData.data || [];
      const pagination = responseData.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: shipmentsData.length,
        limit: pageLimit,
      };

      setRowData(shipmentsData);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);

      showNotification(
        "success",
        `Fetched ${shipmentsData.length} records (Page ${pagination.currentPage} of ${pagination.totalPages})`
      );
    } catch (err) {
      console.error(err);
      showNotification("error", `Failed to fetch data: ${err.message} `);
      setRowData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;

    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fetch new page
    fetchDataWithPagination(currentFilters, newPage);
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);

    // If we have current filters, refetch with new limit (reset to page 1)
    if (currentFilters) {
      setCurrentPage(1);
      fetchDataWithPagination(currentFilters, 1);
    }
  };

  const handleShow = async () => {
    const values = getValues();

    // Store filters for pagination
    setCurrentFilters(values);

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    await fetchDataWithPagination(values, 1);
  };

  const accountCode = watch("accountCode");

  // 🔹 Effect to fetch customer name by accountCode
  useEffect(() => {
    const code = accountCode?.trim();
    if (!code) {
      if (customerName !== "") {
        setCustomerName("");
        setValue("customerName", "");
      }
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `${server}/sale-report-with-hold/customer?accountCode=${encodeURIComponent(
            code
          )}`
        );
        const data = await res.json();
        if (cancelled) return;

        if (data?.data?.name && data.data.name !== customerName) {
          setCustomerName(data.data.name);
          setValue("customerName", data.data.name);
        }
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [accountCode, server, setValue]);

  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const res = await fetch(
          `${server}/sale-report-with-hold?dropdowns=true`
        );
        const data = await res.json();

        setDropdowns({
          companies: data.dropdowns?.companies || [],
          refPersons: data.dropdowns?.refPersons || [],
          salesPersons: data.dropdowns?.salesPersons || [], // contains userId + userName
        });
      } catch (err) {
        console.error("Failed to fetch dropdown values", err);
      }
    };

    fetchDropdowns();
  }, [server]);

  const salesPersonOptions = [
    "All",
    ...dropdowns.salesPersons.map((sp) => sp.userName),
  ];
  const companyOptions = ["All", ...dropdowns.companies];
  const refPersonOptions = ["All", ...dropdowns.refPersons];
  const salePersonValue = watch("salePerson");
  const salePersonCodeValue = watch("salePersonCode");

  // Dropdown → Input
  useEffect(() => {
    const match = dropdowns.salesPersons.find(
      (sp) => sp.userName === salePersonValue
    );
    if (match && salePersonCodeValue !== match.userId) {
      setValue("salePersonCode", match.userId);
    }
  }, [salePersonValue]);

  // Input → Dropdown
  useEffect(() => {
    const match = dropdowns.salesPersons.find(
      (sp) => sp.userId === salePersonCodeValue
    );
    if (match && salePersonValue !== match.userName) {
      setValue("salePerson", match.userName);
    }
  }, [salePersonCodeValue]);

  const handleDownloadExcel = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to export");
      return;
    }

    // map main data
    const filteredData = rowData.map((row) =>
      Object.fromEntries(columns.map((col) => [col.label, row[col.key] ?? ""]))
    );

    // calculate totals
    const totalWeight = rowData.reduce(
      (sum, row) => sum + (parseFloat(row.totalActualWt) || 0),
      0
    );
    const grandTotal = rowData.reduce(
      (sum, row) => sum + (parseFloat(row.totalAmt) || 0),
      0
    );

    // add totals row
    const totalsRow = {};
    columns.forEach((col, idx) => {
      if (idx === columns.length - 4) totalsRow[col.label] = "Total Weight";
      else if (idx === columns.length - 3)
        totalsRow[col.label] = totalWeight.toFixed(2);
      else if (idx === columns.length - 2) totalsRow[col.label] = "Grand Total";
      else if (idx === columns.length - 1)
        totalsRow[col.label] = grandTotal.toFixed(2);
      else totalsRow[col.label] = "";
    });

    filteredData.push(totalsRow);

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "SaleDetails");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "SaleDetails.xlsx");
    showNotification("success", "Excel downloaded successfully");
  };

  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to export");
      return;
    }

    const filteredData = rowData.map((row) =>
      Object.fromEntries(columns.map((col) => [col.label, row[col.key] ?? ""]))
    );

    const totalWeight = rowData.reduce(
      (sum, row) => sum + (parseFloat(row.totalActualWt) || 0),
      0
    );
    const grandTotal = rowData.reduce(
      (sum, row) => sum + (parseFloat(row.totalAmt) || 0),
      0
    );

    const totalsRow = {};
    columns.forEach((col, idx) => {
      if (idx === columns.length - 4) totalsRow[col.label] = "Total Weight";
      else if (idx === columns.length - 3)
        totalsRow[col.label] = totalWeight.toFixed(2);
      else if (idx === columns.length - 2) totalsRow[col.label] = "Grand Total";
      else if (idx === columns.length - 1)
        totalsRow[col.label] = grandTotal.toFixed(2);
      else totalsRow[col.label] = "";
    });

    filteredData.push(totalsRow);

    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "SaleDetails.csv");
    showNotification("success", "CSV downloaded successfully");
  };

  const totals = useMemo(() => {
    const totalWeight = rowData.reduce(
      (sum, row) => sum + (parseFloat(row.totalActualWt) || 0),
      0
    );
    const grandTotal = rowData.reduce(
      (sum, row) => sum + (parseFloat(row.totalAmt) || 0),
      0
    );

    return { totalWeight, grandTotal };
  }, [rowData]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Enter" && !isFullscreen) {
        handleShow();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  });

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
              disabled={isLoading}
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
            disabled={currentPage === 1 || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <form
      className="flex flex-col gap-3"
      onKeyDown={(e) => {
        if (e.key === "Enter" && !isFullscreen) {
          e.preventDefault();
          handleShow();
        }
      }}
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      {/* 🔹 Filters Section */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-3">
          <InputBox
            placeholder="Run Number"
            register={register}
            setValue={setValue}
            value="runNumber"
          />
          <Dropdown
            title="Payment"
            options={[
              "Cash",
              "Credit",
              "FOC",
              "Cash On Delivery",
              "Other",
              "All",
            ]}
            value="payment"
            register={register}
            setValue={setValue}
            defaultValue=""
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
        <div className="flex gap-3">
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
        <div className="flex items-center gap-3">
          {/* Wrap inputs in fixed-width divs */}

          <Dropdown
            title="Sale Person"
            options={salesPersonOptions}
            value="salePerson"
            register={register}
            setValue={setValue}
            defaultValue={salePersonValue}
          />

          <InputBox
            placeholder="Sale Person code"
            register={register}
            setValue={setValue}
            value="salePersonCode"
            initialValue={salePersonCodeValue}
          />

          <Dropdown
            title="Company"
            options={companyOptions}
            value="company"
            register={register}
            setValue={setValue}
          />

          <Dropdown
            title="Sale Ref. Person"
            options={refPersonOptions}
            value="saleRefPerson"
            register={register}
            setValue={setValue}
          />

          {/* Bigger checkbox so label stays in one line */}
        </div>
        <div className="flex gap-3">
          <div className="w-full">
            <InputBox
              placeholder={`Customer Code`}
              register={register}
              setValue={setValue}
              value={`accountCode`}
            />
          </div>

          <DummyInputBoxWithLabelDarkGray
            placeholder={"Customer Name"}
            register={register}
            setValue={setValue}
            value={"customerName"}
          />

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
      </div>

      {/* 🔹 Table Section */}
      <div>
        <div className="flex justify-end gap-3 items-center  mb-3">
          <div>
            <OutlinedButtonRed
              label={isLoading ? "Loading..." : "Show"}
              onClick={handleShow}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            {/* <OutlinedButtonRed label="Print" className=" px-10 py-1" /> */}
            <DownloadCsvExcel
              type="button"
              name={"Download"}
              handleDownloadExcel={handleDownloadExcel}
              handleDownloadCSV={handleDownloadCSV}
            />
          </div>
        </div>

        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className="border-b-0 rounded-b-none h-[40vh]"
        />

        {/* Pagination Controls */}
        <PaginationControls />

        {/* Totals Row */}
        <div className="flex justify-end gap-6 text-sm font-semibold border border-t-0 border-battleship-gray bg-[#D0D5DDB8] text-gray-900 rounded rounded-t-none font-sans px-4 py-2">
          <div>
            <span>Total Weight: </span>
            <span className="text-red">{totals.totalWeight.toFixed(2)} kg</span>
          </div>
          <div>
            Grand Total:{" "}
            <span className="text-red">{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Total Records Display */}
        <div className="flex justify-between mt-2">
          <div className="text-sm text-gray-600">
            {totalRecords > 0 && (
              <span>Total Records: {totalRecords}</span>
            )}
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-10 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Sale Details</h2>
            <button onClick={() => setIsFullscreen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name=""
              columns={columns}
              rowData={rowData}
              className="h-full w-full"
            />
          </div>
        </div>
      )}
    </form>
  );
}

export default SaleDetails;