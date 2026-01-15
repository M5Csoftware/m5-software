import React, { useState, useRef, useEffect, useContext } from "react";
import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import localeData from "dayjs/plugin/localeData";
import { Dropdown, DropdownOptionOnly } from "@/app/components/Dropdown";
import { useForm } from "react-hook-form";
import { SimpleButton } from "@/app/components/Buttons";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";

dayjs.extend(localeData);

function BillingEmployee({ setShowShipperTariff, setShowCustomerManagement }) {
  const { server } = useContext(GlobalContext);
  
  const [selectedMonthForRunHandover, setSelectedMonthForRunHandover] =
    useState(dayjs());
  const [selectedMonthForOldSHipment, setSelectedMonthForOldSHipment] =
    useState(dayjs());
  const [showCalendarForRunHandover, setShowCalendarForRunHandover] =
    useState(false);
  const [showCalendarForOldShipment, setShowCalendarForOldShipment] =
    useState(false);
  const calendarRefRunHandover = useRef(null);
  const calendarRefOldShipment = useRef(null);

  // State for table data
  const [runHandOver, setRunHandOver] = useState([]);
  const [oldShipment, setOldShipment] = useState([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  
  // State for shipments data
  const [shipmentsData, setShipmentsData] = useState({
    noOfAwb: 0,
    runWeight: 0,
  });
  const [loadingShipments, setLoadingShipments] = useState(false);
  const [selectedDateForShipments, setSelectedDateForShipments] = useState(dayjs());

  // State for runs data
  const [runsData, setRunsData] = useState({
    totalRuns: 0,
    totalRunWeight: 0,
  });
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [selectedDateForRuns, setSelectedDateForRuns] = useState(dayjs());

  const months = dayjs.months();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calendarRefRunHandover.current &&
        !calendarRefRunHandover.current.contains(event.target)
      ) {
        setShowCalendarForRunHandover(false);
      }
      if (
        calendarRefOldShipment.current &&
        !calendarRefOldShipment.current.contains(event.target)
      ) {
        setShowCalendarForOldShipment(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch billing data
  useEffect(() => {
    fetchBillingData();
  }, [selectedMonthForRunHandover]);

  // Fetch invoice data
  useEffect(() => {
    fetchInvoiceData();
  }, [selectedMonthForOldSHipment]);

  // Fetch shipments data
  useEffect(() => {
    fetchShipmentsData();
  }, [selectedDateForShipments]);

  // Fetch runs data
  useEffect(() => {
    fetchRunsData();
  }, [selectedDateForRuns]);

  const fetchBillingData = async () => {
    setLoadingBilling(true);
    try {
      const monthParam = selectedMonthForRunHandover.format("YYYY-MM");
      const response = await axios.get(`${server}/billing-dashboard`, {
        params: {
          month: monthParam,
          type: "billing",
        },
      });

      if (response.data.success) {
        // Format data for table
        const formattedData = response.data.data.map((item) => [
          dayjs(item.date).format("DD/MM/YYYY"),
          item.runNo,
          item.totalAwb,
          item.unbilledAwb,
        ]);
        setRunHandOver(formattedData);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
      setRunHandOver([]);
    } finally {
      setLoadingBilling(false);
    }
  };

  const fetchInvoiceData = async () => {
    setLoadingInvoice(true);
    try {
      const monthParam = selectedMonthForOldSHipment.format("YYYY-MM");
      const response = await axios.get(`${server}/billing-dashboard`, {
        params: {
          month: monthParam,
          type: "invoice",
        },
      });

      if (response.data.success) {
        // Format data for table
        const formattedData = response.data.data.map((item) => [
          item.customerName,
          item.invoiceNo,
          item.status,
        ]);
        setOldShipment(formattedData);
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      setOldShipment([]);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const fetchShipmentsData = async () => {
    setLoadingShipments(true);
    try {
      const dateParam = selectedDateForShipments.format("YYYY-MM-DD");
      const monthParam = selectedDateForShipments.format("YYYY-MM");
      
      const response = await axios.get(`${server}/billing-dashboard`, {
        params: {
          month: monthParam,
          date: dateParam,
          type: "shipments",
        },
      });

      if (response.data.success) {
        setShipmentsData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching shipments data:", error);
      setShipmentsData({ noOfAwb: 0, runWeight: 0 });
    } finally {
      setLoadingShipments(false);
    }
  };

  const fetchRunsData = async () => {
    setLoadingRuns(true);
    try {
      const dateParam = selectedDateForRuns.format("YYYY-MM-DD");
      const monthParam = selectedDateForRuns.format("YYYY-MM");
      
      const response = await axios.get(`${server}/billing-dashboard`, {
        params: {
          month: monthParam,
          date: dateParam,
          type: "runs",
        },
      });

      if (response.data.success) {
        setRunsData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching runs data:", error);
      setRunsData({ totalRuns: 0, totalRunWeight: 0 });
    } finally {
      setLoadingRuns(false);
    }
  };

  const handleMonthClick = (monthIndex, type) => {
    const selectedMonth =
      type === "runHandover"
        ? selectedMonthForRunHandover
        : selectedMonthForOldSHipment;
    const newDate = dayjs().year(selectedMonth.year()).month(monthIndex);
    const now = dayjs();

    if (newDate.isAfter(now, "month")) return;

    if (type === "runHandover") {
      setSelectedMonthForRunHandover(newDate);
      setShowCalendarForRunHandover(false);
    } else {
      setSelectedMonthForOldSHipment(newDate);
      setShowCalendarForOldShipment(false);
    }
  };

  const changeYear = (delta, type) => {
    const selectedMonth =
      type === "runHandover"
        ? selectedMonthForRunHandover
        : selectedMonthForOldSHipment;
    const newYear = selectedMonth.year() + delta;
    const currentYear = dayjs().year();

    if (newYear > currentYear) return;

    if (type === "runHandover") {
      setSelectedMonthForRunHandover((prev) => prev.year(newYear));
    } else {
      setSelectedMonthForOldSHipment((prev) => prev.year(newYear));
    }
  };

  // Navigation handlers
  const handleManageRatesClick = () => {
    if (setShowShipperTariff) {
      setShowShipperTariff(true);
    }
  };

  const handleCreateCustomerClick = () => {
    if (setShowCustomerManagement) {
      setShowCustomerManagement(true);
    }
  };

  // Export handler for runs
  const handleExportRuns = async () => {
    try {
      const dateParam = selectedDateForRuns.format("YYYY-MM-DD");
      const monthParam = selectedDateForRuns.format("YYYY-MM");
      
      const response = await axios.get(`${server}/billing-dashboard`, {
        params: {
          month: monthParam,
          date: dateParam,
          type: "runs-export",
        },
      });

      if (response.data.success && response.data.data.length > 0) {
        // Import xlsx dynamically
        const XLSX = await import("xlsx");
        
        // Format data for Excel
        const excelData = response.data.data.map((item) => ({
          "Run No": item.runNo,
          "Date": dayjs(item.date).format("DD/MM/YYYY"),
          "Sector": item.sector || "",
          "Flight": item.flight || "",
          "MAWB": item.mawb || "",
          "Count Bag": item.countBag || 0,
          "Total AWB": item.totalAWB || 0,
          "Run Weight (kg)": item.runWeight || 0,
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(excelData);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Runs Data");
        
        // Generate filename
        const filename = `Runs_${selectedDateForRuns.format("YYYY-MM-DD")}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
      } else {
        alert("No data available for export");
      }
    } catch (error) {
      console.error("Error exporting runs data:", error);
      alert("Failed to export runs data");
    }
  };

  const summaries = [
    {
      title: "RUN",
      Component: (
        <LoadInWarehouse 
          departed={loadingRuns ? "..." : runsData.totalRuns} 
          advanceBagging={loadingRuns ? "..." : runsData.totalRunWeight}
          departedLabel="Total Runs"
          advanceBaggingLabel="Total Weight"
        />
      ),
      selectedDate: selectedDateForRuns,
      setSelectedDate: setSelectedDateForRuns,
      onExport: handleExportRuns,
    },
    {
      title: "SHIPMENTS",
      Component: (
        <LoadInWarehouse 
          departed={loadingShipments ? "..." : shipmentsData.noOfAwb} 
          advanceBagging={loadingShipments ? "..." : shipmentsData.runWeight}
          departedLabel="Departed"
          advanceBaggingLabel="Run Weight"
        />
      ),
      selectedDate: selectedDateForShipments,
      setSelectedDate: setSelectedDateForShipments,
    },
  ];

  const tableHeadersForRunHandover = [
    "Date",
    "Run Number",
    "Total AWB",
    "Unbilled AWB",
  ];

  const tableHeardersForOldShipment = ["Customer Name", "Invoice No.", "Status"];

  return (
    <div className="w-full flex flex-col gap-6 p-4">
      <div className="w-full flex justify-end">
        <div className="flex gap-3">
          <SimpleButton 
            type="button" 
            name="Manage Rates" 
            onClick={handleManageRatesClick}
          />
          <SimpleButton 
            type="button" 
            name="Create Customer Account" 
            onClick={handleCreateCustomerClick}
          />
        </div>
      </div>

      {/* Summaries Row */}
      <div className="flex flex-row gap-3">
        {summaries.map(({ title, Component, selectedDate, setSelectedDate, onExport, showLink = false }, index) => (
          <CSSummary
            key={index}
            title={title}
            link="#"
            DataComponent={Component}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            onExport={onExport}
            showLink={showLink}
          />
        ))}
      </div>

      {/* Tables Section */}
      <div className="w-full flex flex-row gap-6">
        {/* Table for Billing Summary */}
        <div className="flex-1 p-5 border-battleship-gray border bg-seasalt rounded-md flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <span className="font-bold text-lg">Billing Summary</span>
            <div className="relative inline-block" ref={calendarRefRunHandover}>
              {/* Calendar Trigger */}
              <div
                className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-2 px-6 border-battleship-gray bg-white w-[255px] cursor-pointer"
                onClick={() =>
                  setShowCalendarForRunHandover(!showCalendarForRunHandover)
                }
              >
                <div className="flex items-center gap-1">
                  <span>
                    {selectedMonthForRunHandover.format("MMMM")},{" "}
                    {selectedMonthForRunHandover.format("YYYY")}
                  </span>
                </div>
                <img src="calender.svg" height={18} width={18} alt="calendar" />
              </div>

              {/* Calendar Popover */}
              {showCalendarForRunHandover && (
                <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-[255px]">
                  <div className="flex justify-between items-center mb-3">
                    <button onClick={() => changeYear(-1, "runHandover")}>
                      &lt;
                    </button>
                    <span className="font-semibold">
                      {selectedMonthForRunHandover.year()}
                    </span>
                    <button
                      onClick={() => changeYear(1, "runHandover")}
                      disabled={
                        selectedMonthForRunHandover.year() >= dayjs().year()
                      }
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => {
                      const isFuture = dayjs()
                        .year(selectedMonthForRunHandover.year())
                        .month(index)
                        .isAfter(dayjs(), "month");

                      return (
                        <button
                          key={month}
                          onClick={() =>
                            !isFuture && handleMonthClick(index, "runHandover")
                          }
                          disabled={isFuture}
                          className={`py-1 px-2 rounded text-xs transition-colors duration-200 ${
                            selectedMonthForRunHandover.month() === index &&
                            !isFuture
                              ? "bg-red text-white"
                              : isFuture
                              ? "text-gray-400 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border border-alice-blue border-collapse rounded-md overflow-hidden flex flex-col h-[600px]">
            <table className="w-full text-dim-gray border-collapse table-fixed bg-seasalt">
              <thead className="bg-seasalt text-xs font-medium sticky top-0 z-10">
                <tr className="border-b border-alice-blue">
                  {tableHeadersForRunHandover.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-center whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>

            {/* Scrollable section */}
            <div className="flex-1 overflow-y-auto hidden-scrollbar">
              {loadingBilling ? (
                <div className="flex justify-center items-center h-full">
                  <span className="text-dim-gray">Loading...</span>
                </div>
              ) : runHandOver.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <span className="text-dim-gray">No data available</span>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse table-fixed">
                  <tbody>
                    {runHandOver.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="bg-white border-b border-alice-blue hover:bg-gray-50"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-4 py-3 text-center text-dim-gray"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Table for Invoice Summary */}
        <div className="flex-1 p-5 border-battleship-gray border bg-seasalt rounded-md flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <span className="font-bold text-lg text-red">Invoice Summary</span>
            <div className="relative inline-block" ref={calendarRefOldShipment}>
              {/* Calendar Trigger */}
              <div
                className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-2 px-6 border-battleship-gray bg-white w-[255px] cursor-pointer"
                onClick={() =>
                  setShowCalendarForOldShipment(!showCalendarForOldShipment)
                }
              >
                <div className="flex items-center gap-1">
                  <span>
                    {selectedMonthForOldSHipment.format("MMMM")},{" "}
                    {selectedMonthForOldSHipment.format("YYYY")}
                  </span>
                </div>
                <img src="calender.svg" height={18} width={18} alt="calendar" />
              </div>

              {/* Calendar Popover */}
              {showCalendarForOldShipment && (
                <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-[255px]">
                  <div className="flex justify-between items-center mb-3">
                    <button onClick={() => changeYear(-1, "oldShipment")}>
                      &lt;
                    </button>
                    <span className="font-semibold">
                      {selectedMonthForOldSHipment.year()}
                    </span>
                    <button
                      onClick={() => changeYear(1, "oldShipment")}
                      disabled={
                        selectedMonthForOldSHipment.year() >= dayjs().year()
                      }
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {months.map((month, index) => {
                      const isFuture = dayjs()
                        .year(selectedMonthForOldSHipment.year())
                        .month(index)
                        .isAfter(dayjs(), "month");

                      return (
                        <button
                          key={month}
                          onClick={() =>
                            !isFuture && handleMonthClick(index, "oldShipment")
                          }
                          disabled={isFuture}
                          className={`py-1 px-2 rounded text-xs transition-colors duration-200 ${
                            selectedMonthForOldSHipment.month() === index &&
                            !isFuture
                              ? "bg-red text-white"
                              : isFuture
                              ? "text-gray-400 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {month}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border border-alice-blue border-collapse rounded-md overflow-hidden flex flex-col h-[600px]">
            <table className="w-full text-dim-gray border-collapse table-fixed bg-seasalt">
              <thead className="bg-seasalt text-xs font-medium sticky top-0 z-10">
                <tr className="border-b border-alice-blue">
                  {tableHeardersForOldShipment.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-center whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            </table>

            {/* Scrollable section */}
            <div className="flex-1 overflow-y-auto hidden-scrollbar">
              {loadingInvoice ? (
                <div className="flex justify-center items-center h-full">
                  <span className="text-dim-gray">Loading...</span>
                </div>
              ) : oldShipment.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <span className="text-dim-gray">No data available</span>
                </div>
              ) : (
                <table className="w-full text-sm border-collapse table-fixed">
                  <tbody>
                    {oldShipment.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="bg-white border-b border-alice-blue hover:bg-gray-50"
                      >
                        {row.map((cell, cellIndex) => {
                          const isStatusColumn =
                            tableHeardersForOldShipment[cellIndex] === "Status";
                          let statusClass = "";

                          if (isStatusColumn) {
                            if (cell === "Completed") {
                              statusClass =
                                "bg-green-3/10 text-green-3 border-green-3";
                            } else if (cell === "Pending") {
                              statusClass =
                                "bg-old-gold/10 text-old-gold border-old-gold";
                            } else if (cell === "Processing") {
                              statusClass =
                                "bg-blue-200/10 text-blue-600 border-blue-200";
                            }
                          }

                          return (
                            <td
                              key={cellIndex}
                              className="px-4 py-3 text-center text-dim-gray"
                            >
                              {isStatusColumn ? (
                                <span
                                  className={`text-xs py-1.5 px-3 rounded-full border ${statusClass}`}
                                >
                                  {cell}
                                </span>
                              ) : (
                                cell
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BillingEmployee;

// Generic summary box with date selector
function CSSummary({ title, link, DataComponent, selectedDate, setSelectedDate, onExport, showLink = false }) {
  const currentDate = dayjs();
  const dateInputRef = useRef(null);
  const dateContainerRef = useRef(null);

  const handlePrevDay = () => {
    setSelectedDate((prev) => prev.subtract(1, "day"));
  };

  const handleNextDay = () => {
    const nextDate = selectedDate.add(1, "day");
    if (nextDate.isAfter(currentDate)) return;
    setSelectedDate(nextDate);
  };

  const handleDateChange = (e) => {
    setSelectedDate(dayjs(e.target.value));
  };

  const openCalendar = () => {
    if (dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  };

  const handleExportClick = (e) => {
    e.preventDefault();
    if (onExport) {
      onExport();
    }
  };

  return (
    <div className="flex flex-col gap-2.5 border p-4 rounded-md border-french-gray flex-1">
      <div className="flex justify-between text-xs">
        <span className="text-dim-gray font-semibold">{title}</span>
        <div ref={dateContainerRef} className="text-dim-gray text-xs flex items-center gap-1 relative">
          <button onClick={handlePrevDay}>
            <img src="arrow-right-gray.svg" alt="Left" className="rotate-180" />
          </button>

          <span onClick={openCalendar} className="cursor-pointer">
            {selectedDate.format("DD MMM, YYYY")}
          </span>

          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate.format("YYYY-MM-DD")}
            onChange={handleDateChange}
            className="absolute opacity-0 pointer-events-none"
            style={{ position: 'absolute', top: 0, left: 0 }}
            max={currentDate.format("YYYY-MM-DD")}
          />

          <button
            onClick={handleNextDay}
            disabled={selectedDate.isSame(currentDate, "day")}
          >
            <img src="arrow-right-gray.svg" alt="Right" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>{DataComponent}</div>
        {onExport ? (
          <button onClick={handleExportClick} className="cursor-pointer">
            <Image
              src="/external-link.svg"
              alt="export"
              width={18}
              height={18}
            />
          </button>
        ) : showLink ? (
          <Link href={link}>
            <Image
              src="/external-link.svg"
              alt="external link"
              width={18}
              height={18}
            />
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function LoadInWarehouse({ departed, advanceBagging, departedLabel = "Departed", advanceBaggingLabel = "Advance Bagging" }) {
  return (
    <div className="flex gap-6">
      <LoadValue value={departed} label={departedLabel} color="text-red" unit="" />
      <LoadValue value={advanceBagging} label={advanceBaggingLabel} unit=" kg" />
    </div>
  );
}

function LoadValue({ value, label, color = "", unit = " Tonn" }) {
  return (
    <div className="flex flex-col">
      <span className={`font-bold ${color}`}>{value}{unit}</span>
      <span className="text-xs text-dim-gray">{label}</span>
    </div>
  );
}