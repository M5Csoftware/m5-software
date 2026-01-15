"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  InputBoxYellow,
} from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import * as XLSX from "xlsx";

const RtoShipmentReport = () => {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);

  // Data states
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Watch accountCode for auto-population
  const accountCode = watch("code");

  // Show notification helper
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Fetch customer name when account code changes
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (!accountCode || accountCode.length < 3) {
        setCustomerName("");
        setValue("name", "");
        return;
      }

      try {
        const res = await axios.post(`${server}/rto-shipment-report`, {
          accountCode: accountCode.trim(),
        });

        if (res.data.success) {
          setCustomerName(res.data.data.name);
          setValue("name", res.data.data.name);
        } else {
          setCustomerName("");
          setValue("name", "");
        }
      } catch (err) {
        console.error("Error fetching customer:", err);
        setCustomerName("");
        setValue("name", "");
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(fetchCustomerName, 500);
    return () => clearTimeout(timeoutId);
  }, [accountCode, server, setValue]);

  // Table columns
  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "date", label: "Shipment Date" },
      { key: "branch", label: "Branch" },
      { key: "origin", label: "Origin" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "accountCode", label: "Customer Code" },
      { key: "name", label: "Customer Name" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "receiverAddressLine1", label: "Consignee Address" },
      { key: "pcs", label: "PCS" },
      { key: "goodstype", label: "Goods Description" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "content", label: "Shipment Content" },
      { key: "shipmentRemark", label: "Shipment Remark" },
    ],
    []
  );

  const fetchShipments = async () => {
    setLoading(true);

    try {
      // Get form values
      const branch = watch("branch") || "";
      const origin = watch("origin") || "";
      const sector = watch("sector") || "";
      const destination = watch("destination") || "";
      const code = watch("code") || "";
      const from = watch("from") || "";
      const to = watch("to") || "";

      // Validate date range
      if (from && to && new Date(from) > new Date(to)) {
        showNotification("error", "'From' date cannot be later than 'To' date");
        setLoading(false);
        return;
      }

      // Build query string
      const params = new URLSearchParams();

      if (branch) params.append("branch", branch);
      if (origin) params.append("origin", origin);
      if (sector) params.append("sector", sector);
      if (destination) params.append("destination", destination);
      if (code) params.append("accountCode", code);
      if (from) params.append("from", dmyToYmd(from));
      if (to) params.append("to", dmyToYmd(to));

      const res = await axios.get(
        `${server}/rto-shipment-report?${params.toString()}`
      );

      if (res.data.success) {
        setTableData(res.data.data || []);
        setCurrentPage(1); // Reset to first page when new data is fetched

        if (res.data.data.length === 0) {
          showNotification("info", "No shipments found for the given criteria");
        } else if (res.data.limited) {
          showNotification(
            "info",
            `Results limited to ${res.data.count} records. Please use more specific filters for better results.`
          );
        } else {
          showNotification(
            "success",
            `Successfully loaded ${res.data.data.length} shipment(s)`
          );
        }
      } else {
        showNotification("error", res.data.message || "Failed to fetch data");
        setTableData([]);
      }
    } catch (err) {
      console.error("Error fetching shipments:", err);
      showNotification(
        "error",
        err.response?.data?.message || "Failed to fetch data"
      );
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Download Excel
  const handleDownload = () => {
    if (tableData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      // Prepare data for Excel
      const excelData = tableData.map((row) => ({
        "AWB No": row.awbNo,
        "Shipment Date": row.date,
        Branch: row.branch,
        Origin: row.origin,
        Sector: row.sector,
        Destination: row.destination,
        "Customer Code": row.accountCode,
        "Customer Name": row.name,
        "Consignee Name": row.receiverFullName,
        "Consignee Address": row.receiverAddressLine1,
        PCS: row.pcs,
        "Goods Description": row.goodstype,
        "Actual Weight": row.totalActualWt,
        "Shipment Content": row.content,
        "Shipment Remark": row.shipmentRemark,
      }));

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "RTO Shipment Report");

      // Set column widths
      const colWidths = [
        { wch: 15 }, // AWB No
        { wch: 15 }, // Shipment Date
        { wch: 15 }, // Branch
        { wch: 12 }, // Origin
        { wch: 12 }, // Sector
        { wch: 15 }, // Destination
        { wch: 15 }, // Customer Code
        { wch: 25 }, // Customer Name
        { wch: 25 }, // Consignee Name
        { wch: 35 }, // Consignee Address
        { wch: 8 }, // PCS
        { wch: 20 }, // Goods Description
        { wch: 15 }, // Actual Weight
        { wch: 25 }, // Shipment Content
        { wch: 25 }, // Shipment Remark
      ];
      ws["!cols"] = colWidths;

      // Generate filename with current date
      const filename = `RTO_Shipment_Report_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;

      // Download
      XLSX.writeFile(wb, filename);
      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      showNotification("error", "Failed to download the report");
    }
  };

  // Close/Reset
  const handleClose = () => {
    setValue("branch", "");
    setValue("origin", "");
    setValue("sector", "");
    setValue("destination", "");
    setValue("code", "");
    setValue("name", "");
    setValue("from", "");
    setValue("to", "");
    setTableData([]);
    setCustomerName("");
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTableData = tableData.slice(startIndex, endIndex);

  // Pagination functions
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading title="RTO Shipment Report" bulkUploadBtn="hidden" codeListBtn />

      <div className="flex flex-col gap-3">
        {/* First Row - Branch, Origin, Sector, Destination */}
        <div className="flex gap-3 w-full">
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
        </div>

        {/* Second Row - Code, Customer Name, From Date, To Date, Buttons */}
        <div className="flex gap-3 w-full justify-between items-center">
          <div className="flex gap-3 flex-1">
            <div className="w-[27%]">
            <InputBox
              placeholder="Code"
              register={register}
              setValue={setValue}
              value="code"
            />
            </div>
            <div className="w-[69%]">
            <DummyInputBoxWithLabelDarkGray
              register={register}
              label="Customer Name"
              setValue={setValue}
              value="name"
            />
            </div>
            <DateInputBox
              placeholder="From"
              register={register}
              setValue={setValue}
              value="from"
              type="date"
            />
            <DateInputBox
              placeholder="To"
              register={register}
              setValue={setValue}
              value="to"
              type="date"
            />
          </div>
          
          <div className="flex gap-3 w-[24%]">
            <OutlinedButtonRed
              label={loading ? "Loading..." : "Show"}
              onClick={fetchShipments}
              type="button"
              disabled={loading}
            />
            <SimpleButton
              name="Download"
              onClick={handleDownload}
              type="button"
              disabled={tableData.length === 0}
            />
          </div>
        </div>

        {/* Data Table */}
        <TableWithSorting
          columns={columns}
          rowData={currentTableData}
          register={register}
          setValue={setValue}
          name="rtoShipmentReport"
          className="h-[45vh]"
        />

        {/* Pagination Controls - Commented out but preserved */}
        {/* {totalPages > 1 && (
          <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 border-b-0 bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-700">
              Showing {Math.min((currentPage - 1) * itemsPerPage + 1, tableData.length)} to{" "}
              {Math.min(currentPage * itemsPerPage, tableData.length)} of {tableData.length} results
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

              {getPageNumbers().map((pageNumber, index) => (
                pageNumber === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-gray-500">...</span>
                ) : (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => goToPage(pageNumber)}
                    className={`px-3 py-1 border rounded text-sm ${
                      currentPage === pageNumber
                        ? "bg-red-500 text-white border-red-500"
                        : "border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
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
        )} */}
      </div>
    </div>
  );
};

export default RtoShipmentReport;