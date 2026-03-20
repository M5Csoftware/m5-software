"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import * as XLSX from "xlsx";
import { X } from "lucide-react";

const PaginationControls = ({
  totalPages,
  rowData,
  totalRecords,
  pageLimit,
  handleLimitChange,
  loading,
  handlePageChange,
  currentPage,
}) => {
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

function MonthSale() {
  const { register, setValue, getValues } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [fullscreen, setFullScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  const columns = useMemo(
    () => [
      { key: "accountCode", label: "Customer Code" },
      { key: "name", label: "Customer Name" },
      { key: "branch", label: "Branch" },
      { key: "salesPersonName", label: "Sale Person" },
      { key: "referenceBy", label: "Reference By" },
      { key: "collectionBy", label: "Collection By" },
      { key: "accountManager", label: "Account Manager" },
      { key: "openingBalance", label: "Opening Balance" },
      { key: "creditLimit", label: "Credit Limit" },
      { key: "month1", label: "Jan" },
      { key: "month2", label: "Feb" },
      { key: "month3", label: "Mar" },
      { key: "month4", label: "Apr" },
      { key: "month5", label: "May" },
      { key: "month6", label: "Jun" },
      { key: "month7", label: "Jul" },
      { key: "month8", label: "Aug" },
      { key: "month9", label: "Sep" },
      { key: "month10", label: "Oct" },
      { key: "month11", label: "Nov" },
      { key: "month12", label: "Dec" },
      { key: "yearTotal", label: "Year Total" },
    ],
    []
  );

  const formatDataForExport = () => {
    return rowData.map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        formattedRow[column.label] = row[column.key] || "";
      });
      return formattedRow;
    });
  };

  const handleDownloadCSV = () => {
    try {
      if (!rowData || rowData.length === 0) {
        alert("No data available to download");
        return;
      }

      const formattedData = formatDataForExport();
      const headers = columns.map((col) => col.label);
      const csvContent = [
        headers.join(","),
        ...formattedData.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              if (
                typeof value === "string" &&
                (value.includes(",") ||
                  value.includes('"') ||
                  value.includes("\n"))
              ) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `month-sale-${getValues("year") || "data"}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading CSV:", err);
      alert("Failed to download CSV file");
    }
  };

  const handleDownloadExcel = () => {
    try {
      if (!rowData || rowData.length === 0) {
        alert("No data available to download");
        return;
      }

      const formattedData = formatDataForExport();
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(formattedData);

      const colWidths = columns.map((col) => {
        const maxLength = Math.max(
          col.label.length,
          ...formattedData.map((row) => String(row[col.label] || "").length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      ws["!cols"] = colWidths;

      const headerRange = XLSX.utils.decode_range(ws["!ref"]);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "366092" } },
          alignment: { horizontal: "center" },
        };
      }

      XLSX.utils.book_append_sheet(wb, ws, "Month Sale Report");
      wb.Props = {
        Title: "Month Sale Report",
        Subject: `Sales data for ${getValues("year") || "N/A"}`,
        Author: "Sales Management System",
        CreatedDate: new Date(),
      };

      XLSX.writeFile(wb, `month-sale-${getValues("year") || "data"}.xlsx`);
    } catch (err) {
      console.error("Error downloading Excel:", err);
      alert("Failed to download Excel file");
    }
  };

  const handleShow = async (page = 1) => {
    const formData = getValues();
    const { salePerson, company, year } = formData;

    if (!salePerson || !year) {
      setError("Sale Person and Year are mandatory fields");
      return;
    }

    if (isNaN(year) || year.length !== 4) {
      setError("Please enter a valid 4-digit year");
      return;
    }

    setLoading(true);
    setError("");
    setCurrentFilters(formData);

    try {
      const queryParams = new URLSearchParams({
        salePerson: salePerson,
        year: year,
        page: page,
        limit: pageLimit,
      });

      if (company && company.trim() !== "") {
        queryParams.append("company", company.trim());
      }

      const response = await axios.get(
        `${server}/month-sale?${queryParams.toString()}`
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

        if (
          records.length === 0 ||
          (records.length === 1 && records[0].accountCode === "TOTAL")
        ) {
          setError("No customer data found for the specified criteria");
        }
      } else {
        setError(response.data.message || "Failed to fetch data");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        "Failed to fetch data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
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


  const handleReset = () => {
    setValue("salePerson", "");
    setValue("company", "");
    setValue("year", "");
    setRowData([]);
    setError("");
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
  };

  const paginationProps = {
    totalPages,
    rowData,
    totalRecords,
    pageLimit,
    handleLimitChange,
    loading,
    handlePageChange,
    currentPage,
  };

  return (
    <form className="flex flex-col gap-3">
      <Heading
        title={`Month Sale`}
        bulkUploadBtn="hidden"
        codeListBtn={true}
        onRefresh={handleReset}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => setFullScreen(true)}
      />
      <div className="flex flex-col gap-3 mt-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <InputBox
              placeholder={`Sale Person`}
              register={register}
              setValue={setValue}
              value={`salePerson`}
              required
            />
            <InputBox
              placeholder={`Company Code`}
              register={register}
              setValue={setValue}
              value={`company`}
            />
            <InputBox
              placeholder={`Year (e.g., 2024)`}
              register={register}
              setValue={setValue}
              value={`year`}
              required
              type="number"
              min="2000"
              max="2099"
            />
            <div>
              <OutlinedButtonRed
                label={loading ? `Loading...` : `Show`}
                onClick={() => handleShow(1)}
                disabled={loading}
                type="button"
              />
            </div>
            <div>
              <DownloadCsvExcel
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
                buttonClassname={
                  rowData.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                }
              />
            </div>
          </div>
          {error && (
            <div className="text-red text-sm bg-red-50 rounded">{error}</div>
          )}
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          loading={loading}
          className={`h-[55vh] border-b-0 rounded-b-none`}
        />
        <PaginationControls {...paginationProps} />
        {fullscreen && (
          <div className="fixed inset-0 z-50 bg-white p-10 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Month Sale</h2>
              <button onClick={() => setFullScreen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1">
              <TableWithSorting
                register={register}
                setValue={setValue}
                columns={columns}
                rowData={rowData}
                loading={loading}
                className={`w-full h-[75vh] border-b-0 rounded-b-none`}
              />
              <PaginationControls {...paginationProps} />
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <div></div>
      </div>
    </form>
  );
}

export default MonthSale;