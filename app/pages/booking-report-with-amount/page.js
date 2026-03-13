"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { LabeledDropdown } from "@/app/components/Dropdown";
import axios from "axios";

// Import packages for CSV and Excel download (make sure to install these)
// npm install papaparse xlsx file-saver
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { X } from "lucide-react";
import NotificationFlag from "@/app/components/Notificationflag";

function BookingReportWithAmount() {
  const { register, setValue, getValues, watch } = useForm();
  const [allRowData, setAllRowData] = useState([]); // Store all data
  const [currentPageData, setCurrentPageData] = useState([]); // Store current page data
  const [withBalance, setWithBalance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingAccount, setFetchingAccount] = useState(false);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const { server } = useContext(GlobalContext);
  const [branchList, setBranchList] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [fullscreen, setFullScreen] = useState(false);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const parseDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    if (!d || !m || !y) return null;
    return new Date(y, m - 1, d);
  };

  const toISOStartEnd = (from, to) => {
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

  // Watch for form field changes
  const customerValue = watch("Customer");
  const fromDate = watch("from");
  const toDate = watch("to");

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "shipmentDate", label: "Shipment Date" },
      { key: "runNo", label: "Run Number" },
      { key: "flightDate", label: "Flight Date" },
      { key: "manifestNumber", label: "Manifest Number" },
      { key: "branch", label: "Branch" },
      { key: "origin", label: "Origin Name" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "accountCode", label: "Customer Code" },
      { key: "customer", label: "Customer Name" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "receiverAddressLine1", label: "Consignee Address" },
      { key: "receiverCity", label: "Consignee City" },
      { key: "receiverState", label: "Consignee State" },
      { key: "receiverPincode", label: "Consignee Zip Code" },
      { key: "receiverPhoneNumber", label: "Consignee Phone Number" },
      { key: "service", label: "Service Type" },
      { key: "upsService", label: "UPS Service" },
      { key: "pcs", label: "Pcs" },
      { key: "goodsDesc", label: "Goods Desc" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "basicAmt", label: "Basic Amount" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "miscChg", label: "Misc Charges" },
      { key: "miscChgReason", label: "Misc Remarks" },
      { key: "fuelAmt", label: "Fuel" },
      { key: "totalAmt", label: "Grand Total" },
      { key: "currency", label: "Currency" },
      { key: "billNo", label: "Bill Number" },
      { key: "awbCheck", label: "Awb Check" },
      { key: "shipmentContent", label: "Shipment Content" },
      { key: "holdReason", label: "Hold Reason" },
    ],
    []
  );

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

        // Format date fields (already formatted from backend)
        if (["shipmentDate", "flightDate"].includes(col.key)) {
          value = value || "";
        }

        // Format numeric fields
        if (["pcs", "totalActualWt"].includes(col.key)) {
          value = value ? parseFloat(value).toFixed(2) : "0.00";
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
      const filename = `booking-report-with-amount-${currentDate}.csv`;

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
          case "customer":
            return { wch: 25 };
          case "receiverAddressLine1":
            return { wch: 30 };
          case "receiverPhoneNumber":
            return { wch: 18 };
          case "manifestNumber":
            return { wch: 18 };
          case "goodsDesc":
          case "shipmentContent":
            return { wch: 25 };
          case "miscChgReason":
          case "holdReason":
            return { wch: 20 };
          case "service":
          case "upsService":
            return { wch: 18 };
          case "basicAmt":
          case "totalAmt":
          case "sgst":
          case "cgst":
          case "igst":
          case "miscChg":
          case "fuelAmt":
            return { wch: 12 };
          case "receiverPincode":
            return { wch: 12 };
          case "branch":
          case "origin":
          case "sector":
          case "destination":
          case "receiverCity":
          case "receiverState":
            return { wch: 15 };
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
        "Booking Report with Amount"
      );

      // Create filename
      const currentDate = new Date().toISOString().split("T")[0];
      const filename = `booking-report-with-amount-${currentDate}.xlsx`;

      // Write and save the file
      XLSX.writeFile(workbook, filename);

      console.log(`Excel file downloaded: ${filename}`);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Failed to download Excel file");
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

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(`${server}/branch-master/get-branch`);
        const branches = res.data || [];

        // IMPORTANT: strings only
        const options = branches.map((b) => `${b.code}`);

        setBranchList(options);
      } catch (err) {
        console.error("Branch fetch error", err);
      }
    };

    if (server) fetchBranches();
  }, [server]);

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
    const showPages = 5; // Show 5 page numbers at a time
    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Fetch customer accounts on component mount
  useEffect(() => {
    const fetchCustomerAccounts = async () => {
      try {
        const response = await axios.get(`${server}/booking-with-report`, {
          params: { action: "customers" },
        });

        if (response.data.success) {
          setCustomerAccounts(response.data.data.customers || []);
        }
      } catch (error) {
        console.error("Error fetching customer accounts:", error);
      }
    };

    if (server) {
      fetchCustomerAccounts();
    }
  }, [server]);

  // Fetch account details when customerValue changes
  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (customerValue && customerValue.trim()) {
        setFetchingAccount(true);
        try {
          const response = await axios.get(`${server}/booking-with-report`, {
            params: { accountCode: customerValue.trim().toUpperCase() },
          });

          if (response.data.success) {
            const { name, email, branch } = response.data.data;
            setValue("State", name);
          }
        } catch (error) {
          console.error("Error fetching account details:", error);
          // Clear fields if account not found
          setValue("State", "");

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
        // Clear fields when customer code is empty
        setValue("State", "");
      }
    };

    // Add debouncing to avoid too many API calls while typing
    const timeoutId = setTimeout(fetchAccountDetails, 500);
    return () => clearTimeout(timeoutId);
  }, [customerValue, server, setValue]);

  const handleShow = async () => {
    if (!fromDate || !toDate) {
      showNotification("error", "Please select both From and To dates");
      return;
    }

    setLoading(true);
    setCurrentPage(1); // Reset to first page when new data is loaded

    try {
      const formData = getValues();

      const range = toISOStartEnd(fromDate, toDate);
      if (!range) {
        showNotification("error", "Invalid date format");
        setLoading(false);
        return;
      }

      const response = await axios.post(`${server}/booking-with-report`, {
        fromDate: range.from,
        toDate: range.to,
        accountCode: formData.Customer?.trim().toUpperCase() || null,
        branch: formData.Branch?.trim().toUpperCase() || null,
        origin: formData.Origin?.trim().toUpperCase() || null,
        sector: formData.Sector?.trim().toUpperCase() || null,
        destination: formData.Destination?.trim().toUpperCase() || null,
        balanceShipment: withBalance,
      });

      if (response.data.success) {
        const { shipments, totals, summary } = response.data.data;

        // Set all table data
        setAllRowData(shipments);

        console.log(
          `Loaded ${summary.totalRecords} records for ${summary.dateRange}`
        );
        console.log("Applied filters:", response.data.data.filters);

        if (shipments.length === 0) {
          showNotification("error", "No data found for the selected criteria");
        }
      } else {
        throw new Error(response.data.error || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("error", error.response?.data?.error || error.message);

      // Reset data on error
      setAllRowData([]);
      setCurrentPageData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle checkbox change
  const handleBalanceShipmentChange = (checked) => {
    setWithBalance(checked);

    // If data is already loaded and we have date range, refresh with new filter
    if (allRowData.length > 0 && fromDate && toDate) {
      // Small delay to ensure state is updated before API call
      setTimeout(() => {
        handleShow();
      }, 100);
    }
  };

  // Handle form refresh
  const handleRefresh = () => {
    // Clear all form data
    setValue("Branch", "");
    setValue("Origin", "");
    setValue("Sector", "");
    setValue("Destination", "");
    setValue("Customer", "");
    setValue("State", "");
    setValue("from", "");
    setValue("to", "");
    setWithBalance(false);
    setAllRowData([]);
    setCurrentPageData([]);
    setCurrentPage(1);
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`Booking Report With Sale Amount`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        fullscreenBtn={true}
        onClickFullscreenBtn={() => {
          setFullScreen(true);
        }}
      />
      <div className="flex flex-col gap-3 mt-3">
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            {/* <InputBox
              placeholder="Branch"
              register={register}
              setValue={setValue}
              value="Branch"
            /> */}
            <LabeledDropdown
              value="Branch"
              title="Branch"
              options={branchList}
              register={register}
              setValue={setValue}
            />

            <InputBox
              placeholder="Origin"
              register={register}
              setValue={setValue}
              value="Origin"
            />
            <InputBox
              placeholder="Sector"
              register={register}
              setValue={setValue}
              value="Sector"
            />
            <InputBox
              placeholder="Destination"
              register={register}
              setValue={setValue}
              value="Destination"
            />
          </div>
          <div className="flex gap-3">
            <div className="w-full relative">
              <InputBox
                placeholder={`Customer Code`}
                register={register}
                setValue={setValue}
                value={`Customer`}
              />
              {fetchingAccount && (
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                </div>
              )}
            </div>

            <DummyInputBoxWithLabelDarkGray
              placeholder={"Customer Name"}
              register={register}
              setValue={setValue}
              value={"State"}
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
            <div className="flex items-end">
              <OutlinedButtonRed
                label={loading ? "Loading..." : "Show"}
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
            register={register}
            setValue={setValue}
            label={`Balance Shipment`}
            id={`balanceShipment`}
            isChecked={withBalance}
            setChecked={handleBalanceShipmentChange}
          />
        </div>
        <div>
          <span className="text-red text-sm">
            *Enter Date Range to Show Data
          </span>
        </div>
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={currentPageData} // Use current page data instead of all data
          className={` h-[45vh]`}
        />

        {fullscreen && (
          <div className="fixed inset-0 z-50 bg-white p-10 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Booking Report With Amount
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
                rowData={currentPageData} // Use current page data instead of all data
                className={`w-full h-[80vh]`}
              />
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
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === pageNumber
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
      </div>

      <div className="flex justify-between">
        <div>{/* <OutlinedButtonRed type="button" label={"Close"} /> */}</div>
      </div>
    </form>
  );
}

export default BookingReportWithAmount;
