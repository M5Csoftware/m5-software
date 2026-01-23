import { SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DateInputBox } from "@/app/components/InputBox";
import dayjs from "dayjs";
import { ExternalLink } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as ExcelJS from "exceljs";
import { GlobalContext } from "@/app/lib/GlobalContext";
export function StatusCard({
  title = "TITLE",
  greenCount = 0,
  redCount = 0,
  grayCount = 0,
  greenColor = "text-green-600",
  redColor = "text-red",
  grayColor = "text-gray-600",
  redText = "",
  greenText = "",
  grayText = "",
  greenUnit = "",
  redUnit = "",
  grayUnit = "",
  enableGrayText = false,
  onLinkClick = () => {},
  onDateChange = () => {},
  range = "today",
}) {
  return (
    <div className="rounded-lg border p-4 bg-white shadow flex justify-between items-center">
      {/* Left side */}
      <div className="ml-2 p-1 cursor-default">
        <div className="text-sm font-medium text-gray-600 tracking-wider">
          {title}
        </div>

        <div className="flex gap-8 mt-2">
          <div className="text-left tracking-wide mr-4">
            <div className={`${greenColor} font-bold  text-2xl`}>
              {greenCount}
            </div>
            <div className={`${greenColor} flex`}>
              {greenText} <span className="text-xs">{greenUnit}</span>
            </div>
          </div>
          <div className="text-left">
            <div
              className={`${redColor} font-semibold flex flex-col justify-start text-2xl`}
            >
              {redCount}
              <span className="text-xs">{redUnit}</span>
            </div>
            <div className={`${redColor}`}>{redText}</div>
          </div>
          {enableGrayText && (
            <div className="text-left">
              <div
                className={`${grayColor} font-semibold flex flex-col justify-start text-2xl`}
              >
                {grayCount}
                <span className="text-xs">{grayUnit}</span>
              </div>
              <div className={`${grayColor}`}>{grayText}</div>
            </div>
          )}
        </div>
      </div>

      {/* Right side icon */}
      <div className="flex flex-col items-end gap-8 cursor-pointer mr-3">
        <div className="relative mb-2">
          {/* Date filter */}
          <select
            value={range}
            onChange={(e) => onDateChange(e.target.value)}
            className="text-[10px] border border-gray-300 px-2 py-[2px] pr-5 rounded text-dim-gray appearance-none cursor-pointer bg-white"
          >
            <option value="today">Today</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
          </select>
          <span className="pointer-events-none absolute top-2 right-3 text-[8px] text-gray-500">
            ▼
          </span>
        </div>

        <div>
          <ExternalLink onClick={onLinkClick} className="text-red w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export function HoldReport() {
  const { register, setValue, handleSubmit, watch } = useForm({
    defaultValues: {
      dateRange: "",
      from: "",
      to: "",
    },
  });

  const { server } = useContext(GlobalContext);
  const [isLoading, setIsLoading] = useState(false);

  // Watch the dateRange field
  const selectedDateRange = watch("dateRange");

  // Mapping object: Display label -> API value
  const dateRangeMap = {
    "All Time": "",
    "Last 7 Days": "7",
    "Last 30 Days": "30",
    "Last 90 Days": "90",
    "Custom Range": "custom",
  };

  // For the dropdown options (display strings)
  const dateRangeOptions = [
    "All Time",
    "Last 7 Days",
    "Last 30 Days",
    "Last 90 Days",
    "Custom Range",
  ];

  const downloadHoldReport = async (formData) => {
    setIsLoading(true);

    try {
      // Map display label to API value
      const apiDateRange = dateRangeMap[formData.dateRange] || "";

      // Build query parameters
      const params = new URLSearchParams();

      if (apiDateRange && apiDateRange !== "custom") {
        params.append("dateRange", apiDateRange);
      }

      // Only include from/to dates for custom range
      if (apiDateRange === "custom") {
        if (formData.from) {
          params.append("from", formData.from);
        }
        if (formData.to) {
          params.append("to", formData.to);
        }
      }

      // Fetch hold shipments from API
      const response = await fetch(
        `${server}/dashboard/ss-dashboard/hold-report?${params.toString()}`,
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch hold report");
      }

      const shipments = result.data;

      if (shipments.length === 0) {
        alert("No hold shipments found for the selected criteria.");
        setIsLoading(false);
        return;
      }

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Hold Report System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const worksheet = workbook.addWorksheet("Hold Report");

      // Define headers
      const headers = [
        "AwbNo",
        "ShipmentDate",
        "Branch",
        "OriginName",
        "Sector",
        "DestinationName",
        "CustomerCode",
        "CustomerName",
        "ConsigneeName",
        "ServiceType",
        "ShipmentForwardingNo",
        "Pcs",
        "ActWeight",
        "ChgWeight",
        "HoldReason",
        "Reason2",
        "LocalMfNo",
        "Rcving Dt.",
        "Unhold Dt.",
        "Other Remark",
      ];

      // Add headers
      worksheet.addRow(headers);

      // Enhanced Header Styling - DARK RED
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;

      headerRow.eachCell((cell) => {
        cell.font = {
          bold: true,
          size: 11,
          color: { argb: "FFFFFFFF" }, // White text
          name: "Calibri",
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFC00000" }, // Dark red background
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF808080" } },
          left: { style: "thin", color: { argb: "FF808080" } },
          bottom: { style: "thin", color: { argb: "FF808080" } },
          right: { style: "thin", color: { argb: "FF808080" } },
        };
      });

      // Add data rows
      shipments.forEach((shipment) => {
        const row = [
          shipment.awbNo || "",
          shipment.date ? new Date(shipment.date).toLocaleDateString() : "",
          shipment.branch || shipment.company || "",
          shipment.origin || "",
          shipment.sector || "",
          shipment.destination || "",
          shipment.accountCode || "",
          shipment.customer || "",
          shipment.receiverFullName || "",
          shipment.service || "",
          shipment.forwardingNo || "",
          shipment.pcs || 0,
          shipment.totalActualWt || 0,
          shipment.chargeableWt || 0,
          shipment.holdReason || "",
          shipment.otherHoldReason || "",
          shipment.localMF || "",
          shipment.createdAt
            ? new Date(shipment.createdAt).toLocaleDateString()
            : "",
          "",
          shipment.operationRemark || "",
        ];
        worksheet.addRow(row);
      });

      // Set optimized column widths
      const columnWidths = [
        18, 15, 15, 20, 12, 22, 18, 30, 30, 15, 22, 10, 12, 12, 25, 20, 15, 15,
        15, 30,
      ];

      headers.forEach((_, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = columnWidths[index];

        // Format number columns with 2 decimal places
        if (index === 11 || index === 12 || index === 13) {
          column.numFmt = "0.00";
        }

        // Auto-fit for text columns
        if (index >= 2) {
          column.alignment = {
            vertical: "middle",
            horizontal: "left",
            wrapText: true,
          };
        }
      });

      // Style data rows - NO YELLOW ANYWHERE
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.height = 18;

          row.eachCell((cell, colNumber) => {
            // Set font for all data cells
            cell.font = {
              size: 10,
              name: "Calibri",
              color: { argb: "FF000000" },
            };

            // Center align specific columns
            if (
              colNumber <= 2 ||
              colNumber === 5 ||
              colNumber === 10 ||
              colNumber === 11 ||
              colNumber === 12 ||
              colNumber === 13 ||
              colNumber === 14
            ) {
              cell.alignment = {
                vertical: "middle",
                horizontal: "center",
                wrapText: false,
              };
            } else {
              cell.alignment = {
                vertical: "middle",
                horizontal: "left",
                wrapText: false,
              };
            }

            // Add subtle borders
            cell.border = {
              top: { style: "thin", color: { argb: "FFE0E0E0" } },
              left: { style: "thin", color: { argb: "FFE0E0E0" } },
              bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
              right: { style: "thin", color: { argb: "FFE0E0E0" } },
            };
          });

          // Add light alternating row shading - ONLY GRAY, NO YELLOW
          if (rowNumber % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8F9FA" }, // Very subtle light gray
              };
            });
          }
        }
      });

      // Freeze header row
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      // Add auto-filter
      worksheet.autoFilter = {
        from: "A1",
        to: `${String.fromCharCode(64 + headers.length)}1`,
      };

      // Add summary section
      const summaryRowNum = worksheet.rowCount + 2;

      // Count by hold reason categories
      const creditLimitCount = shipments.filter(
        (s) =>
          s.holdReason &&
          s.holdReason.toLowerCase().includes("credit limit exceeded"),
      ).length;

      const readyToFlyCount = shipments.filter(
        (s) =>
          s.holdReason && s.holdReason.toLowerCase().includes("ready to fly"),
      ).length;

      const otherReasonsCount =
        shipments.length - creditLimitCount - readyToFlyCount;

      // Add summary table
      worksheet.addRow([]);

      const summaryTitleRow = worksheet.addRow(["Hold Report Summary"]);
      summaryTitleRow.getCell(1).font = {
        bold: true,
        size: 12,
        color: { argb: "FFFFFFFF" },
        name: "Calibri",
      };
      summaryTitleRow.getCell(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" }, // Professional blue
      };
      summaryTitleRow.getCell(1).alignment = {
        vertical: "middle",
        horizontal: "left",
      };
      worksheet.mergeCells(`A${summaryRowNum}:D${summaryRowNum}`);

      worksheet.addRow(["Category", "Count", "", ""]);
      const categoryRow = worksheet.getRow(summaryRowNum + 1);
      categoryRow.font = {
        bold: true,
        size: 10,
        name: "Calibri",
      };
      categoryRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD9E1F2" }, // Light blue-gray
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });

      worksheet.addRow(["Credit Limit Exceeded", creditLimitCount, "", ""]);
      worksheet.addRow(["Other Reasons", otherReasonsCount, "", ""]);
      worksheet.addRow(["Ready to Fly", readyToFlyCount, "", ""]);
      worksheet.addRow(["TOTAL", shipments.length, "", ""]);

      // Style summary rows - NO YELLOW
      for (let i = summaryRowNum; i <= summaryRowNum + 5; i++) {
        const row = worksheet.getRow(i);
        row.height = 20;
        row.eachCell((cell) => {
          if (i > summaryRowNum) {
            cell.font = {
              size: 10,
              name: "Calibri",
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: i === summaryRowNum + 1 ? "center" : "left",
            };
          }
          cell.border = {
            top: { style: "thin", color: { argb: "FF808080" } },
            left: { style: "thin", color: { argb: "FF808080" } },
            bottom: { style: "thin", color: { argb: "FF808080" } },
            right: { style: "thin", color: { argb: "FF808080" } },
          };
        });
      }

      // Make total row bold - NO BACKGROUND COLOR AT ALL
      const totalRow = worksheet.getRow(summaryRowNum + 5);
      totalRow.font = {
        bold: true,
        size: 10,
        name: "Calibri",
      };

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const fileName = `Hold_Report_${dateStr}_${shipments.length}_shipments.xlsx`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading hold report:", error);
      alert(`Failed to download report: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    await downloadHoldReport(data);
  };

  // Check if custom range is selected
  const isCustomRange = selectedDateRange === "Custom Range";

  return (
    <div className="bg-seasalt border-french-gray border-opacity-50 shadow rounded-md pt-4 pb-3 px-4 flex flex-col gap-4">
      <h2 className="font-bold text-lg">Hold Report</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="flex gap-2 justify-between w-full pb-2 flex-row flex-wrap">
          <div className="flex w-full gap-3">
            <div className="w-1/4">
              <LabeledDropdown
                setValue={setValue}
                register={register}
                value={`dateRange`}
                options={dateRangeOptions}
                title={`Date Range`}
              />
            </div>
            <div className="w-1/4">
              <DateInputBox
                register={register}
                setValue={setValue}
                value="from"
                placeholder="From"
                disabled={!isCustomRange}
              />
            </div>
            <div className="w-1/4">
              <DateInputBox
                register={register}
                setValue={setValue}
                value="to"
                placeholder="To"
                disabled={!isCustomRange}
              />
            </div>
            <div className="w-1/4">
              <SimpleButton
                name={isLoading ? "Generating..." : "Download Excel"}
                type="submit"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export function DataCardWithTable({
  register,
  setValue,
  name,
  columns = [],
  rowData = [],
  totalRow = null,
  title = "",
  className = "",
  disabled = false,
  selectedMonth,
  onMonthChange,
}) {
  useEffect(() => {
    if (setValue && name) setValue(`${name}Table`, rowData);
  }, [rowData]);

  return (
    <div
      className={`rounded-lg border bg-[#F6F8F9] shadow-sm p-4 ${
        disabled ? "bg-gray-50" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-base font-semibold ml-1 text-gray-800">{title}</h2>
        <MonthYearPicker
          selectedDate={selectedMonth}
          onChange={onMonthChange}
          disabledFuture={true}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg ">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-[#71717A] tracking-wide text-xs">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-center">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rowData.map((row, i) => (
              <tr key={i} className="border-t bg-white hover:bg-gray-50">
                {/* Customer */}
                <td className="px-4 py-2 flex items-center gap-2 justify-center">
                  <div className="flex flex-col text-center">
                    <span className="font-semibold text-gray-700">
                      {row?.customerName || row.reason}
                    </span>
                    <span className="text-sm text-gray-400 tracking-wide">
                      {row.id && "#"}
                      {row.id}
                    </span>
                  </div>
                </td>

                {/* AWB */}
                <td className="px-4 py-2 text-center text-gray-800">
                  {row.awb}
                </td>

                {/* Weight */}
                <td className="px-4 py-2 text-center">
                  {row.weightIsView ? (
                    <span className="text-red cursor-pointer">View</span>
                  ) : (
                    <span className="text-red">{row.weight}</span>
                  )}
                </td>
              </tr>
            ))}

            {totalRow && (
              <tr className="border-t bg-[#FAFAFA] font-semibold text-gray-700">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2 text-center">
                    {totalRow[col.key] || ""}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {register && name && (
        <input type="hidden" {...register(`${name}Table`)} />
      )}
    </div>
  );
}

export default function MonthYearPicker({
  selectedDate,
  onChange,
  disabledFuture = true,
  width = 255,
  className = "",
}) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(selectedDate || dayjs());
  const calendarRef = useRef(null);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Hide popover when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeYear = (offset) => {
    setSelectedMonth(selectedMonth.add(offset, "year"));
  };

  const handleMonthClick = (monthIndex) => {
    const newDate = selectedMonth.month(monthIndex);
    setSelectedMonth(newDate);
    onChange(newDate);
    setShowCalendar(false);
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      ref={calendarRef}
      style={{ width }}
    >
      {/* Trigger */}
      <div
        className="flex gap-3 text-dim-gray border rounded-md items-center justify-between py-1 px-4 border-opacity-50 border-battleship-gray bg-white cursor-pointer"
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <div className="flex items-center gap-1">
          <span>
            {selectedMonth.format("MMMM")}, {selectedMonth.format("YYYY")}
          </span>
        </div>
        <img src="calender.svg" height={18} width={18} alt="calendar" />
      </div>

      {/* Calendar Popup */}
      {showCalendar && (
        <div className="absolute z-10 mt-2 p-4 bg-white shadow-lg border rounded-md w-full">
          <div className="flex justify-between items-center mb-3">
            <button onClick={() => changeYear(-1)}>&lt;</button>
            <span className="font-semibold">{selectedMonth.year()}</span>
            <button
              onClick={() => changeYear(1)}
              disabled={
                disabledFuture && selectedMonth.year() >= dayjs().year()
              }
            >
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {months.map((month, i) => {
              const isFuture =
                disabledFuture &&
                dayjs()
                  .year(selectedMonth.year())
                  .month(i)
                  .isAfter(dayjs(), "month");

              const isActive = selectedMonth.month() === i && !isFuture;

              return (
                <button
                  key={month}
                  onClick={() => !isFuture && handleMonthClick(i)}
                  disabled={isFuture}
                  className={`py-1 px-2 rounded text-xs transition-colors duration-200 ${
                    isActive
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
  );
}
