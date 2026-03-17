"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { X } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import CodeList from "@/app/components/CodeList";

const AmountLog = () => {
  const { register, setValue, watch, reset, getValues } = useForm();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [filterValue, setFilterValue] = useState("All");
  const { server } = useContext(GlobalContext);
  const [codeList, setCodeList] = useState([]);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const [customerList, setCustomerList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customerName, setCustomerName] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination
  const [loading, setLoading] = useState(false);

  // Add Sr No column to columns
  const columns = [
    { key: "srNo", label: "Sr No." },
    { key: "awbNo", label: "AWB No." },
    { key: "accountCode", label: "Customer Code" },
    { key: "customerName", label: "Customer Name" },
    { key: "basicamt", label: "Basic Amount" },
    { key: "sgst", label: "SGST" },
    { key: "cgst", label: "CGST" },
    { key: "igst", label: "IGST" },
    { key: "mischg", label: "Misc Charge" },
    { key: "miscRemark", label: "Misc Remark" },
    { key: "fuel", label: "Fuel" },
    { key: "fuelPercent", label: "Fuel Percentage" },
    { key: "handling", label: "Handling" },
    { key: "OVWT", label: "OVWT" },
    { key: "rateHike", label: "Rate Hike" },
    { key: "grandTotal", label: "Grand Total" },
    { key: "hikeAmount", label: "Hike Amount" },
    { key: "lessAmount", label: "Less Amount" },
    { key: "diffAmount", label: "Diff Amount" },
    { key: "insertDate", label: "Insert Date" },
    { key: "lastUpdateDate", label: "Last Update Date" },
    { key: "insertUser", label: "Insert User" },
    { key: "updateUser", label: "Update User" },
  ];

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // watch accountCode
  const accountCode = watch("accountCode");
  const filterType = watch("filter");

  const ddmmyyyyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleRefresh = () => {
    reset({
      accountCode: "",
      customerName: "",
      from: null,
      to: null,
    });
    setRowData([]);
    setCustomerName("");
    setFilterValue("All");
    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    showNotification("success", "Form and table cleared");
  };

  // fetch customerName whenever accountCode changes
  useEffect(() => {
    if (!accountCode) {
      setCustomerName("");
      setValue("customerName", "");
      return;
    }

    const fetchCustomer = async () => {
      try {
        const res = await fetch(
          `${server}/amount-log?onlyCustomer=true&accountCode=${accountCode.trim().toUpperCase()}`
        );
        const data = await res.json();
        setCustomerName(data.customerName || "");
        setValue("customerName", data.customerName || "");
      } catch (error) {
        console.error("Error fetching customer name:", error);
        setCustomerName("");
        setValue("customerName", "");
      }
    };

    fetchCustomer();
  }, [accountCode, setValue, server]);

  // fetch all customers for CodeList
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`${server}/amount-log/customer`);
        const data = await res.json();
        setCustomerList(data);
        setFilteredCustomers(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCustomers();
  }, [server]);

  // filter customers by searchTerm
  useEffect(() => {
    const filtered = customerList.filter(
      (c) =>
        c.accountCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customerList]);

  // Function to fetch data with pagination
  const fetchDataWithPagination = async (filters, page = 1) => {
    const accountCode = filters.accountCode?.trim();
    if (!accountCode) {
      showNotification("error", "Customer code is required");
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        accountCode,
        filter: filters.filter || "All",
        page: page.toString(),
        limit: pageLimit.toString(),
      });

      const from = filters.from;
      const to = filters.to;

      if (from) params.append("from", ddmmyyyyToYmd(from));
      if (to) params.append("to", ddmmyyyyToYmd(to));

      console.log("Fetching with pagination:", { page, limit: pageLimit });

      const res = await fetch(`${server}/amount-log?${params.toString()}`);

      if (!res.ok) {
        const errorData = await res.json();
        showNotification("error", errorData.error || "Failed to fetch data");
        setRowData([]);
        return;
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

      if (!shipmentsData || shipmentsData.length === 0) {
        showNotification("error", "No data found for this customer");
        setRowData([]);
      } else {
        setRowData(shipmentsData);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);
        showNotification(
          "success", 
          `Found ${shipmentsData.length} records (Page ${pagination.currentPage} of ${pagination.totalPages})`
        );
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to fetch data");
      setRowData([]);
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

  const fetchData = async () => {
    const filters = {
      accountCode: watch("accountCode")?.trim(),
      filter: watch("filter") || "All",
      from: watch("from"),
      to: watch("to"),
    };

    // Store filters for pagination
    setCurrentFilters(filters);

    // Reset to page 1 for new search
    setCurrentPage(1);

    // Fetch first page
    await fetchDataWithPagination(filters, 1);
  };

  const downloadTable = () => {
    if (!rowData || rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const dataToExport = rowData.map((row) =>
      columns.reduce((acc, col) => {
        acc[col.label] = row[col.key];
        return acc;
      }, {})
    );

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AmountLog");

    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    showNotification("success", "Table downloaded successfully");
    saveAs(blob, "AmountLog.xlsx");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    const fetchCodeList = async () => {
      try {
        const res = await fetch(`${server}/amount-log/customer`);
        const data = await res.json();
        setCodeList(data);
      } catch (err) {
        console.error("Failed to fetch customers", err);
        setCodeList([]);
      }
    };

    fetchCodeList();
  }, [server]);

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
    <div className="">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="space-y-4">
        <div className="mb-8">
          <Heading
            title={`Amount Log`}
            bulkUploadBtn="hidden"
            fullscreenBtn
            onRefresh={handleRefresh}
            onClickFullscreenBtn={() => setIsFullscreen(true)}
          />
        </div>

        {/* Customer search & filter */}
        <div className="flex gap-2">
          <div className="w-1/2">
            <InputBox
              placeholder={`Customer Code`}
              value="accountCode"
              register={register}
              setValue={setValue}
              initialValue={accountCode}
            />
          </div>
          <CodeList
            data={codeList}
            handleAction={(item) => {
              setValue("accountCode", item.accountCode);
              setValue("customerName", item.name);
              setCustomerName(item.name);
            }}
            columns={[
              { key: "accountCode", label: "Customer Code" },
              { key: "name", label: "Customer Name" },
            ]}
            name={`Customer Code List`}
          />

          <div className="w-1/2">
            <InputBox
              placeholder={`Customer Name`}
              value="customerName"
              register={register}
              setValue={setValue}
              disabled
              initialValue={customerName}
            />
          </div>

          <div className="w-1/2">
            <LabeledDropdown
              placeholder={`Filter`}
              options={["All", "Hike Amount", "Less Amount"]}
              value="filter"
              register={register}
              setValue={setValue}
              defaultValue={filterValue}
              onChange={(val) => setFilterValue(val)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <div className="w-1/2">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
              maxToday
            />
          </div>
          <div className="w-1/2">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
            />
          </div>

          <div className="w-[200px]">
            <OutlinedButtonRed 
              label={loading ? "Loading..." : "Show"} 
              onClick={fetchData}
              disabled={loading}
            />
          </div>
          <div>
            <SimpleButton 
              name={"Download"} 
              onClick={downloadTable}
              disabled={rowData.length === 0}
            />
          </div>
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            className="h-[45vh]"
            columns={columns}
            rowData={rowData}
          />

          {/* Pagination Controls */}
          <PaginationControls />

          {/* Total Records Display */}
          <div className="flex justify-between mt-2">
            <div className="text-sm text-gray-600">
              {totalRecords > 0 && (
                <span>Total Records: {totalRecords}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white p-10 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Amount Log</h2>
            <button onClick={() => setIsFullscreen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="Forwarding Number Report"
              columns={columns}
              rowData={rowData}
              className="h-full w-full"
            />
          </div>
          <div className="flex justify-end mt-4">
            <div className="text-sm text-gray-600">
              {totalRecords > 0 && (
                <span>Total Records: {totalRecords}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-3">
        <div className="w-[200px]">
          {/* <OutlinedButtonRed label={`Close`} /> */}
        </div>
      </div>
    </div>
  );
};

export default AmountLog;