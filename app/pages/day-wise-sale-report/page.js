"use client";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { LabeledDropdown } from "@/app/components/Dropdown";
import InputBox from "@/app/components/InputBox";
import { SimpleButton } from "@/app/components/Buttons";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import NotificationFlag from "@/app/components/Notificationflag";

function DayWiseSale() {
  const { register, setValue, getValues, reset, watch } = useForm();
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState([]);
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
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

  const month = watch("month");
  const year = watch("year");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
    setRows([]);
    setLoading(false); // ✅ reset loader
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    showNotification("success", "Refreshed");
  };

  const columns = [
    { key: "clientCode", label: "ClientCode" },
    { key: "clientName", label: "ClientName" },
    { key: "company", label: "Company" },
    { key: "branch", label: "Branch" },
    { key: "salesPersonName", label: "SalePerson" },
    { key: "referenceBy", label: "RefrenceBy" },
    { key: "collectionBy", label: "CollectionBy" },
    { key: "openingBalance", label: "OpeningBalance" },
    { key: "creditLimit", label: "CreditLimit" },
    { key: "currency", label: "Currency" },

    ...Array.from({ length: 31 }, (_, i) => ({
      key: `day${i + 1}`,
      label: `Day ${i + 1}`,
    })),

    { key: "total", label: "Total" },
  ];

  const handleShow = async (page = 1) => {
    const m = getValues("month");
    const y = getValues("year");

    if (!m || !y) {
      showNotification("error", "Select month and enter year");
      return;
    }

    setLoading(true);
    setCurrentFilters({ month: m, year: y });

    try {
      const res = await fetch(`${server}/daywise-sale?month=${m}&year=${y}&page=${page}&limit=${pageLimit}`);
      const data = await res.json();
      
      const records = data.records || data.data || [];
      const pagination = data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: records.length,
      };

      setRows(records);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);

      if (!records || records.length === 0) {
        showNotification("error", "No records found");
      } else {
        showNotification("success", `Found ${pagination.totalRecords} records (Page ${pagination.currentPage} of ${pagination.totalPages})`);
      }
    } catch (err) {
      showNotification("error", "Server not reachable");
    }

    setLoading(false);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
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
    if (totalPages <= 1 && rows.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{rows.length}</span> of{" "}
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

  const downloadExcel = async () => {
    setLoading(true);

    try {
      if (rows.length === 0) {
        showNotification("error", "No data found to export");
        return;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`DayWiseSale`);

      // Add header row
      const headers = ["SrNo", ...Object.keys(rows[0])];
      ws.addRow(headers);

      // Add data rows
      rows.forEach((row, idx) => {
        ws.addRow([idx + 1, ...Object.values(row)]);
      });

      // Style everything
      ws.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Header style
        if (rowNumber === 1) {
          row.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "EA1B40" },
            };
          });
        }
      });

      // Auto width
      ws.columns.forEach((col) => {
        let max = 10;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const len = cell.value ? cell.value.toString().length : 0;
          if (len > max) max = len;
        });
        col.width = max + 3;
      });

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `DayWiseSale  ${month}-${year}.xlsx`);
      showNotification("success", "File downloaded successfully");
    } finally {
      setLoading(false);
    }
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
        title="Day Wise Sale"
        bulkUploadBtn="hidden"
        downloadBtn={false}
        codeListBtn="hidden"
        fullscreenBtn={false}
        onRefresh={handleRefresh}
      />

      <div className="flex flex-col gap-4 mt-6">
        <div className="flex gap-3 items-end">
          <LabeledDropdown
            options={[
              "January",
              "Feburary",
              "March",
              "April",
              "May",
              "June",
              "July",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ]}
            register={register}
            setValue={setValue}
            title="Month"
            value="month"
            resetFactor={refreshKey}
          />

          <InputBox
            placeholder="Year"
            register={register}
            setValue={setValue}
            value="year"
            resetFactor={refreshKey}
          />
          <div>
            <SimpleButton
              name={loading ? "Loading..." : "Show"}
              onClick={() => handleShow(1)}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <RedLabelHeading label="Report" />
        <div className="relative h-[50vh]">
          {loading && (
            <div className="absolute inset-0 flex justify-center items-center bg-white/70 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red"></div>
            </div>
          )}

          <TableWithSorting
            columns={columns}
            rowData={rows}
            register={register}
            setValue={setValue}
            className={`h-[50vh]`}
          />
          <PaginationControls />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="flex gap-2">
          <SimpleButton
            type="button"
            name={loading ? "Loading..." : "Download Excel"}
            onClick={downloadExcel}
          />{" "}
        </div>
      </div>
    </form>
  );
}

export default DayWiseSale;
