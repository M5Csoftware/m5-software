"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import Table, { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

const EdiReport = () => {
  const { register, setValue, watch, handleSubmit } = useForm();
  const [rowData, setRowData] = useState([]);
  const [csbFile, setCsbFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const { server } = useContext(GlobalContext);
  const [resetFactor, setResetFactor] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50);
  const [currentFilters, setCurrentFilters] = useState(null);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const runNumber = watch("runNumber");

  const columns = [
    { key: "HAWBNumber", label: "HAWB Number" },
    { key: "ConsignorName", label: "Consignor Name" },
    { key: "ConsignorAddress1", label: "Consignor Address 1" },
    { key: "ConsignorAddress2", label: "Consignor Address 2" },
    { key: "ConsignorCity", label: "Consignor City" },
    { key: "ConsignorState", label: "Consignor State" },
    { key: "ConsignorPostalCode", label: "Consignor Postal Code" },
    { key: "ConsignorCountry", label: "Consignor Country" },
    { key: "ConsigneeName", label: "Consignee Name" },
    { key: "ConsigneeAddress1", label: "Consignee Address 1" },
    { key: "ConsigneeAddress2", label: "Consignee Address 2" },
    { key: "ConsigneeCity", label: "Consignee City" },
    { key: "ConsigneeState", label: "Consignee State" },
    { key: "ConsigneePostalCode", label: "Consignee Postal Code" },
    { key: "ConsigneeCountry", label: "Consignee Country" },
    { key: "PKG", label: "PKG" },
    { key: "Weight", label: "Weight" },
    { key: "DescriptionofGoods", label: "Description of Goods" },
    { key: "Value", label: "Value" },
    { key: "ExportInvoiceNo", label: "Export Invoice No" },
    { key: "GSTInvoiceNo", label: "GST Invoice No" },
    { key: "InvoiceValue", label: "Invoice Value" },
    { key: "CurrencyType", label: "Currency Type" },
    { key: "PayType", label: "Pay Type" },
    { key: "IGSTPaid", label: "IGST Paid" },
    { key: "Bond", label: "Bond" },
    { key: "MHBSNo", label: "MHBS No" },
    { key: "GSTINType", label: "GSTIN Type" },
    { key: "GSTINNumber", label: "GSTIN Number" },
    { key: "GSTDate", label: "GST Date" },
    { key: "ExportDate", label: "Export Date" },
    { key: "ADCode", label: "AD Code" },
    { key: "CRN_NO", label: "CRN NO" },
    { key: "CRN_MHBS_NO", label: "CRN MHBS NO" },
  ];

  const [loadingShipments, setLoadingShipments] = useState(false);

  const fetchDataByRunNo = async (page = 1) => {
    if (!runNumber || runNumber.trim() === "") {
      showNotification("error", "Please enter a Run Number");
      return;
    }

    setLoading(true);
    setCurrentFilters({ runNumber, csbFile });

    try {
      const queryParams = new URLSearchParams({
        runNo: runNumber,
        page: page,
        limit: pageLimit,
      });

      if (csbFile) {
        queryParams.append("csb", "true");
      }

      const response = await axios.get(
        `${server}/portal/get-shipments?${queryParams.toString()}`
      );

      const allData = response.data.shipments || [];
      const pagination = response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: allData.length,
      };

      if (!allData || allData.length === 0) {
        showNotification("error", "No data found for the entered Run Number");
        setRowData([]);
        setTotalRecords(0);
        setTotalPages(1);
        return;
      }

      const transformedData = allData.map((item) => ({
        HAWBNumber: item.awbNo || "",
        ConsignorName: item.shipperFullName || "",
        ConsignorAddress1: item.shipperAddressLine1 || "",
        ConsignorAddress2: item.shipperAddressLine2 || "",
        ConsignorCity: item.shipperCity || "",
        ConsignorState: item.shipperState || "",
        ConsignorPostalCode: item.shipperPincode || "",
        ConsignorCountry: item.shipperCountry || "India",
        ConsigneeName: item.receiverFullName || "",
        ConsigneeAddress1: item.receiverAddressLine1 || "",
        ConsigneeAddress2: item.receiverAddressLine2 || "",
        ConsigneeCity: item.receiverCity || "",
        ConsigneeState: item.receiverState || "",
        ConsigneePostalCode: item.receiverPincode || "",
        ConsigneeCountry: item.receiverCountry || "India",
        PKG: item.pcs || "",
        Weight: item.totalActualWt || "",
        DescriptionofGoods: item.content || "",
        Value: item.totalInvoiceValue || "",
        ExportInvoiceNo: item.awbNo || "",
        GSTInvoiceNo: item.awbNo || "",
        InvoiceValue: item.totalInvoiceValue || "",
        CurrencyType: item.currency || item.currencys || "",
        PayType: "N",
        IGSTPaid: item.igst || "0",
        Bond: "NA",
        MHBSNo: item.alMawb || "",
        GSTINType: item.shipperKycType || "",
        GSTINNumber: item.shipperKycNumber || "",
        GSTDate: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : "",
        ExportDate: item.date ? new Date(item.date).toLocaleDateString() : "",
        ADCode: "",
        CRN_NO: item.awbNo || "",
        CRN_MHBS_NO: "",
        csb: item.csb || false,
      }));

      setRowData(transformedData);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);
      showNotification(
        "success",
        `Found ${pagination.totalRecords} shipments (Page ${pagination.currentPage} of ${pagination.totalPages})`
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("error", "Error fetching data. Please try again.");
      setRowData([]);
      setTotalRecords(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchDataByRunNo(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      setCurrentPage(1);
      fetchDataByRunNo(1);
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

  // Fix: was referencing undefined `filteredData` — now uses `rowData`
  const downloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data available to download");
      return;
    }

    // Create CSV headers
    const headers = columns.map((col) => col.label).join(",");

    // Create CSV rows from rowData
    const csvRows = rowData.map((row) =>
      columns
        .map((col) => {
          const value = row[col.key] ?? "";
          const str = String(value);
          // Wrap in quotes if the value contains commas, quotes, or newlines
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    );

    const csvContent = [headers, ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `EDI_Report_${runNumber || "data"}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification("success", "Downloaded successfully");
  };

  const handleRefresh = () => {
    setResetFactor((prev) => prev + 1);
    setRowData([]);
    setCsbFile(false);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    showNotification("success", "Refreshed successfully");
  };

  const onSubmit = () => {
    fetchDataByRunNo(1);
  };

  const handleCsbChange = (checked) => {
    setCsbFile(checked);
    setCurrentPage(1);
  };

  return (
    <form
      className="flex flex-col gap-[34px]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`EDI Report`}
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <InputBox
            placeholder="Run Number"
            register={register}
            setValue={setValue}
            value="runNumber"
            resetFactor={resetFactor}
          />

          <div>
            <OutlinedButtonRed
              label={loading ? "Loading..." : "Show"}
              onClick={() => fetchDataByRunNo(1)}
              disabled={loading}
              type="button"
            />
          </div>
          <div>
            <SimpleButton
              name={"Download CSV"}
              onClick={downloadCSV}
              disabled={rowData.length === 0 || loading}
              type="button"
            />
          </div>
        </div>

        <div>
          <RedCheckbox
            isChecked={csbFile}
            setChecked={handleCsbChange}
            id="csbfile"
            register={register}
            setValue={setValue}
            label={"CSB File"}
          />
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            name="ediReportTable"
            columns={columns}
            rowData={rowData}
            className={`h-[50vh]`}
          />

          <PaginationControls />

          <div className="flex justify-between mt-2">
            <div className="text-sm text-gray-600">
              {totalRecords > 0 && (
                <span>Total Records: {totalRecords}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <div></div>
          <div>
            <div className="flex gap-3">
              <div></div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EdiReport;