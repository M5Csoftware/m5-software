"use client";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import * as XLSX from "xlsx";
import { X } from "lucide-react";

function MonthSale() {
  const { register, setValue, getValues } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fullscreen, setFullScreen] = useState(false);

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

  // Helper function to format data for export
  const formatDataForExport = () => {
    return rowData.map((row) => {
      const formattedRow = {};
      columns.forEach((column) => {
        formattedRow[column.label] = row[column.key] || "";
      });
      return formattedRow;
    });
  };

  // CSV Download Handler
  const handleDownloadCSV = () => {
    try {
      if (!rowData || rowData.length === 0) {
        alert("No data available to download");
        return;
      }

      const formattedData = formatDataForExport();

      // Convert data to CSV string
      const headers = columns.map((col) => col.label);
      const csvContent = [
        headers.join(","),
        ...formattedData.map((row) =>
          headers
            .map((header) => {
              const value = row[header];
              // Handle values with commas, quotes, or line breaks
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

      // Create and download CSV file
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
    } catch (error) {
      console.error("Error downloading CSV:", error);
      alert("Failed to download CSV file");
    }
  };

  // Excel Download Handler
  const handleDownloadExcel = () => {
    try {
      if (!rowData || rowData.length === 0) {
        alert("No data available to download");
        return;
      }

      const formattedData = formatDataForExport();

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Set column widths
      const colWidths = columns.map((col) => {
        const maxLength = Math.max(
          col.label.length,
          ...formattedData.map((row) => String(row[col.label] || "").length)
        );
        return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
      });
      ws["!cols"] = colWidths;

      // Style headers
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

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Month Sale Report");

      // Add metadata
      wb.Props = {
        Title: "Month Sale Report",
        Subject: `Sales data for ${getValues("year") || "N/A"}`,
        Author: "Sales Management System",
        CreatedDate: new Date(),
      };

      // Download file
      XLSX.writeFile(wb, `month-sale-${getValues("year") || "data"}.xlsx`);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Failed to download Excel file");
    }
  };

  const handleShow = async () => {
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

    try {
      let url = `${server}/month-sale?salePerson=${encodeURIComponent(
        salePerson
      )}&year=${encodeURIComponent(year)}`;

      if (company && company.trim() !== "") {
        url += `&company=${encodeURIComponent(company.trim())}`;
      }

      const response = await axios.get(url);

      if (response.data.success) {
        setRowData(response.data.data || []);
        if (
          response.data.data.length === 0 ||
          (response.data.data.length === 1 &&
            response.data.data[0].accountCode === "TOTAL")
        ) {
          setError("No customer data found for the specified criteria");
        }
      } else {
        setError(response.data.message || "Failed to fetch data");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message ||
        "Failed to fetch data";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setValue("salePerson", "");
    setValue("company", "");
    setValue("year", "");
    setRowData([]);
    setError("");
  };

  return (
    <form className="flex flex-col gap-3">
      <Heading
        title={`Month Sale`}
        bulkUploadBtn="hidden"
        codeListBtn={true}
        onRefresh={handleReset}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => {
          setFullScreen(true);
        }}
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
                onClick={handleShow}
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
            <div className="text-red text-sm bg-red-50 rounded">
              {error}
            </div>
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
          className={`h-[55vh]`}
        />
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
                className={`w-full h-[80vh]`}
              />
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-between">
        <div>
          {/* <OutlinedButtonRed 
            type="button" 
            label={"Close"} 
            onClick={() => window.history.back()}
          /> */}
        </div>
      </div>
    </form>
  );
}

export default MonthSale;
