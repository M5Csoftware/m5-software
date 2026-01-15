"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
import { Dropdown } from "@/app/components/Dropdown";
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
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";

// Import packages for CSV and Excel download
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { X } from "lucide-react";
import NotificationFlag from "@/app/components/Notificationflag";

function SaleWithTotalReceiving() {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      Code: "",
      State: "",
      Email: "",
      balance: "",
      from: "",
      to: "",
    },
  });
  const { server } = useContext(GlobalContext);
  const [allRowData, setAllRowData] = useState([]); // Store all data
  const [currentPageData, setCurrentPageData] = useState([]); // Store current page data
  const [withHoldAWB, setWithHoldAWB] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingAccount, setFetchingAccount] = useState(false);
  const [formKey, setFormKey] = useState(0); // Key for resetting form
  const [totals, setTotals] = useState({
    totalReceiving: 0,
    totalSale: 0,
    totalDebit: 0,
    totalCredit: 0,
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [fullscreen, setFullScreen] = useState(false);

  // Watch for form field changes
  const accountCode = watch("Code");
  const fromDate = watch("from");
  const toDate = watch("to");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // ✅ NEW: Helper function to convert DD/MM/YYYY to YYYY-MM-DD
  const convertToISODate = (dateString) => {
    if (!dateString) return null;

    // Check if date is already in YYYY-MM-DD format
    if (dateString.includes("-") && dateString.split("-")[0].length === 4) {
      return dateString;
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = dateString.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return dateString;
  };

  // ✅ NEW: Helper function to convert YYYY-MM-DD to DD/MM/YYYY
  const convertToDDMMYYYY = (dateString) => {
    if (!dateString) return "";

    // Check if date is already in DD/MM/YYYY format
    if (dateString.includes("/")) {
      return dateString;
    }

    // Convert YYYY-MM-DD to DD/MM/YYYY
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }

    return dateString;
  };

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "accountCode", label: "Account Code" },
      { key: "shipmentType", label: "Service Type" },
      { key: "shipmentDate", label: "Shipment Date" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "forwarder", label: "Forwarder" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "receiverCity", label: "Consignee City" },
      { key: "receiverPincode", label: "Consignee Zip Code" },
      { key: "service", label: "Service Type" },
      { key: "pcs", label: "Pcs" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "totalVolWt", label: "Volume Weight" },
      { key: "basicAmt", label: "Basic Amount" },
      { key: "saleAmount", label: "Sale Amount" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "miscChg", label: "Misc Charges" },
      { key: "fuelAmt", label: "Fuel" },
      { key: "totalAmt", label: "Grand Total" },
      { key: "operationRemark", label: "Remark" },
    ],
    []
  );

  const parseDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  };

  const getISODateRange = (from, to) => {
    const f = parseDDMMYYYY(from);
    const t = parseDDMMYYYY(to);

    if (!f || !t) return null;

    f.setHours(0, 0, 0, 0);
    t.setHours(23, 59, 59, 999);

    return {
      from: f.toISOString(),
      to: t.toISOString(),
    };
  };

  // Download utility functions
  const prepareTableData = (data, columns) => {
    return data.map((row) => {
      const formattedRow = {};
      columns.forEach((col) => {
        let value = row[col.key];

        // Format currency fields
        if (
          [
            "basicAmt",
            "saleAmount",
            "sgst",
            "cgst",
            "igst",
            "miscChg",
            "fuelAmt",
            "totalAmt",
          ].includes(col.key)
        ) {
          value = value ? parseFloat(value).toFixed(2) : "0.00";
        }

        // Format date fields
        if (col.key === "shipmentDate") {
          value = value || "";
        }

        // Format numeric fields
        if (["pcs", "totalActualWt", "totalVolWt"].includes(col.key)) {
          value = value ? parseFloat(value).toFixed(2) : "0.00";
        }

        // Format boolean fields
        if (col.key === "isHold") {
          value = value ? "Yes" : "No";
        }

        formattedRow[col.label] = value || "";
      });
      return formattedRow;
    });
  };

  // Handle CSV download
  const handleDownloadCSV = () => {
    try {
      if (!allRowData || allRowData.length === 0) {
        showNotification("error", "No data available to download");
        return;
      }

      const formattedData = prepareTableData(allRowData, columns);

      // Convert to CSV using Papa Parse
      const csv = Papa.unparse(formattedData, {
        header: true,
        delimiter: ",",
        newline: "\r\n",
      });

      // Create filename
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `sale-with-total-receiving-${accountCode || "all"
        }-${currentDate}.csv`;

      // Create and download file
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, filename);

      console.log(`CSV file downloaded: ${filename}`);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification(
        "error",
        "Error downloading CSV file. Please try again."
      );
    }
  };

  // Handle Excel download
  const handleDownloadExcel = () => {
    try {
      if (!allRowData || allRowData.length === 0) {
        showNotification("error", "No data available to download");
        return;
      }

      const formattedData = prepareTableData(allRowData, columns);

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Set column widths for better readability
      const columnWidths = columns.map((col) => {
        switch (col.key) {
          case "awbNo":
            return { wch: 15 };
          case "accountCode":
            return { wch: 15 };
          case "receiverFullName":
            return { wch: 25 };
          case "forwarder":
            return { wch: 20 };
          case "destination":
            return { wch: 15 };
          case "receiverCity":
            return { wch: 15 };
          case "operationRemark":
            return { wch: 30 };
          case "shipmentType":
          case "service":
            return { wch: 18 };
          case "saleAmount":
          case "totalAmt":
          case "basicAmt":
            return { wch: 12 };
          case "receiverPincode":
            return { wch: 12 };
          case "isHold":
            return { wch: 8 };
          default:
            return { wch: 10 };
        }
      });

      worksheet["!cols"] = columnWidths;

      // Add some styling to headers
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } },
          alignment: { horizontal: "center" },
        };
      }

      // Add the worksheet to workbook
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Sales with Total Receiving"
      );

      // Create filename
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `sale-with-total-receiving-${accountCode || "all"
        }-${currentDate}.xlsx`;

      // Write and save the file
      XLSX.writeFile(workbook, filename);

      console.log(`Excel file downloaded: ${filename}`);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification(
        "error",
        "Error downloading Excel file. Please try again."
      );
    }
  };

  // Update pagination when data changes
  useEffect(() => {
    const pages = Math.ceil(allRowData.length / itemsPerPage);
    setTotalPages(pages);

    // Reset to first page if current page is beyond available pages
    if (currentPage > pages && pages > 0) {
      setCurrentPage(1);
    }
  }, [allRowData.length, itemsPerPage, currentPage]);

  // Update current page data when page changes or data changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCurrentPageData(allRowData.slice(startIndex, endIndex));
  }, [currentPage, allRowData, itemsPerPage]);

  // Pagination handlers
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const showPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Fetch account details when accountCode changes (GET request)
  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (accountCode && accountCode.trim()) {
        setFetchingAccount(true);
        try {
          const response = await axios.get(
            `${server}/sale-with-total-receiving`,
            {
              params: { accountCode: accountCode.trim() },
            }
          );

          if (response.data.success) {
            const { name, email, openingBalance } = response.data.data;

            // Set the fetched values in the form
            setValue("State", name);
            setValue("Email", email);
            setValue("balance", openingBalance);
          }
        } catch (error) {
          console.error("Error fetching account details:", error);
          // Clear fields if account not found
          setValue("State", "");
          setValue("Email", "");
          setValue("balance", "");

          if (error.response?.status !== 404) {
            console.error(
              "Unexpected error:",
              error.response?.data?.error || error.message
            );
          }
        } finally {
          setFetchingAccount(false);
        }
      } else {
        // Clear fields when account code is empty
        setValue("State", "");
        setValue("Email", "");
        setValue("balance", "");
      }
    };

    // Add debouncing to avoid too many API calls while typing
    const timeoutId = setTimeout(fetchAccountDetails, 500);
    return () => clearTimeout(timeoutId);
  }, [accountCode, server, setValue]);

  // ✅ UPDATED: Handle show button click with date conversion
  const handleShow = async () => {
    if (!fromDate || !toDate) {
      showNotification("error", "Please select both From Date and To Date");
      return;
    }

    const toYMD = (d) => {
      const [dd, mm, yyyy] = d.split("/");
      return `${yyyy}-${mm}-${dd}`;
    };

    setLoading(true);
    setCurrentPage(1);

    try {
      const payload = {
        fromDate: toYMD(fromDate),
        toDate: toYMD(toDate),
      };

      if (accountCode?.trim()) {
        payload.accountCode = accountCode.trim();
      }

      if (withHoldAWB) {
        payload.withHoldAWB = true;
      }

      console.log("POST PAYLOAD:", payload);

      const response = await axios.post(
        `${server}/sale-with-total-receiving`,
        payload
      );

      const { shipments, totals, summary } = response.data.data;

      setAllRowData(shipments);
      setTotals(totals);

      showNotification("success", `Loaded ${summary.totalRecords} shipments`);
    } catch (err) {
      console.error(err);
      showNotification("error", "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked) => {
    setWithHoldAWB(checked);

    // If data is already loaded and we have date range, refresh with new filter
    if (allRowData.length > 0 && fromDate && toDate) {
      // Small delay to ensure state is updated before API call
      setTimeout(() => {
        handleShow();
      }, 100);
    }
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN").format(amount || 0);
  };

  // Handle form refresh
  const handleRefresh = () => {
    // Clear all form data
    setAllRowData([]);
    setCurrentPageData([]);
    setCurrentPage(1);
    setWithHoldAWB(false);
    setLoading(false);
    setFetchingAccount(false);
    setTotals({
      totalReceiving: 0,
      totalSale: 0,
      totalDebit: 0,
      totalCredit: 0,
    });

    // Increment form key to force re-render of inputs
    setFormKey((prev) => prev + 1);

    // Reset form with default values
    reset({
      Code: "",
      State: "",
      Email: "",
      balance: "",
      from: "",
      to: "",
    });

    showNotification("success", "Page refreshed successfully");
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => e.preventDefault()}
      key={formKey}
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`Sale with Total Receiving`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn
        onClickFullscreenBtn={() => {
          setFullScreen(true);
        }}
      />

      <div className="flex flex-col gap-3 mt-6">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="w-full relative">
              <InputBox
                key={`Code-${formKey}`}
                placeholder="Account Code"
                register={register}
                setValue={setValue}
                value="Code"
              />
              {fetchingAccount && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                </div>
              )}
            </div>
            <DummyInputBoxWithLabelDarkGray
              key={`State-${formKey}`}
              placeholder={"Customer Name"}
              register={register}
              setValue={setValue}
              value={"State"}
            />
            <DummyInputBoxWithLabelDarkGray
              key={`balance-${formKey}`}
              placeholder={"Opening Balance"}
              register={register}
              setValue={setValue}
              value={"balance"}
            />
            <DummyInputBoxWithLabelDarkGray
              key={`Email-${formKey}`}
              placeholder={"Email"}
              register={register}
              setValue={setValue}
              value={"Email"}
            />
          </div>
          <div className="flex gap-3">
            {/* ✅ Date inputs now support DD/MM/YYYY format */}
            <DateInputBox
              key={`from-${formKey}`}
              register={register}
              setValue={setValue}
              value={`from`}
              placeholder="From Date (DD/MM/YYYY)"
            />
            <DateInputBox
              key={`to-${formKey}`}
              register={register}
              setValue={setValue}
              value={`to`}
              placeholder="To Date (DD/MM/YYYY)"
            />
            <div className="flex items-end">
              <OutlinedButtonRed
                label={loading ? `Loading...` : `Show`}
                onClick={handleShow}
                disabled={loading || fetchingAccount}
                type="button"
              />
            </div>
            <div className="flex gap-2">
              <DownloadCsvExcel
                handleDownloadCSV={handleDownloadCSV}
                handleDownloadExcel={handleDownloadExcel}
                buttonClassname="px-10 py-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div className="flex gap-6">
          <RedCheckbox
            key={`withHoldAWBNo-${formKey}`}
            register={register}
            setValue={setValue}
            label={`With Hold AWB`}
            id={`withHoldAWBNo`}
            isChecked={withHoldAWB}
            setChecked={handleCheckboxChange}
          />
        </div>
        <div>
          <span className="text-red text-sm">*Enter Date Range to Show Data</span>
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={currentPageData}
          className={`border-b-0 rounded-b-none h-[45vh]`}
        />

        {fullscreen && (
          <div className="fixed inset-0 z-50 bg-white p-10 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Sale With Total Receiving
              </h2>
              <button onClick={() => setFullScreen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1">
              <TableWithSorting
                register={register}
                setValue={setValue}
                columns={columns}
                rowData={currentPageData}
                className={`border-b-0 rounded-b-none w-full h-[75vh]`}
              />
              <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0  text-gray-900  bg-[#D0D5DDB8] rounded rounded-t-none  font-sans px-4 py-2 gap-16">
                <div>
                  <span className="font-sans ">Total Receiving :</span>
                  <span className="text-red">
                    {" "}
                    ₹ {formatCurrency(totals.totalReceiving)}{" "}
                  </span>
                </div>
                <div>
                  <span className="font-sans ">Total Sale :</span>
                  <span className="text-red">
                    {" "}
                    ₹ {formatCurrency(totals.totalSale)}{" "}
                  </span>
                </div>
                <div>
                  <span className="font-sans ">Total Debit :</span>
                  <span className="text-red">
                    {" "}
                    ₹ {formatCurrency(totals.totalDebit)}{" "}
                  </span>
                </div>
                <div>
                  <span className="font-sans ">Total Credit :</span>
                  <span className="text-red">
                    {" "}
                    ₹ {formatCurrency(totals.totalCredit)}{" "}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 border-b-0 bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-700">
              Showing{" "}
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                allRowData.length
              )}{" "}
              to {Math.min(currentPage * itemsPerPage, allRowData.length)} of{" "}
              {allRowData.length} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>

              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => goToPage(pageNumber)}
                  className={`px-3 py-1 border rounded text-sm ${currentPage === pageNumber
                      ? "bg-red-500 text-white border-red-500"
                      : "border-gray-300 hover:bg-gray-100"
                    }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0  text-gray-900  bg-[#D0D5DDB8] rounded rounded-t-none  font-sans px-4 py-2 gap-16">
          <div>
            <span className="font-sans ">Total Receiving :</span>
            <span className="text-red">
              {" "}
              ₹ {formatCurrency(totals.totalReceiving)}{" "}
            </span>
          </div>
          <div>
            <span className="font-sans ">Total Sale :</span>
            <span className="text-red">
              {" "}
              ₹ {formatCurrency(totals.totalSale)}{" "}
            </span>
          </div>
          <div>
            <span className="font-sans ">Total Debit :</span>
            <span className="text-red">
              {" "}
              ₹ {formatCurrency(totals.totalDebit)}{" "}
            </span>
          </div>
          <div>
            <span className="font-sans ">Total Credit :</span>
            <span className="text-red">
              {" "}
              ₹ {formatCurrency(totals.totalCredit)}{" "}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed type="button" label={"Close"} /> */}</div>
      </div>
    </form>
  );
}

export default SaleWithTotalReceiving;
