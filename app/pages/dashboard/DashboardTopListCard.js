"use client";
import { useState, useEffect, useContext } from "react";
import dayjs from "dayjs";
import { GlobalContext } from "@/app/lib/GlobalContext";
import ExcelJS from "exceljs";
import { DownloadIcon, LucideClockFading } from "lucide-react";

const DashboardTopListCard = ({ title, city }) => {
  const currentMonth = dayjs();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [data, setData] = useState({}); // store month-wise fetched data
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { server } = useContext(GlobalContext);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => prev.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    const nextMonth = selectedMonth.add(1, "month");
    if (nextMonth.isAfter(currentMonth)) return;
    setSelectedMonth(nextMonth);
  };

  // convert to backend's format: 2025-01
  const monthKey = selectedMonth.format("YYYY-MM");

  // Fetch data from new unified API
  useEffect(() => {
    const fetchData = async () => {
      // Check if we already have data for this month
      if (data[monthKey]) return;

      setLoading(true);
      try {
        const res = await fetch(
          `${server}/dashboard/revenue-dashboard-data/top-sales-customers?month=${monthKey}`,
        );
        const json = await res.json();

        if (json.success) {
          setData((prev) => ({
            ...prev,
            [monthKey]: {
              topCustomers: json.topCustomers || [],
              topSalesPersons: json.topSalesPersons || [],
            },
          }));
        } else {
          setData((prev) => ({
            ...prev,
            [monthKey]: {
              topCustomers: [],
              topSalesPersons: [],
            },
          }));
        }
      } catch (err) {
        console.error("TopList Fetch Error:", err);
        setData((prev) => ({
          ...prev,
          [monthKey]: {
            topCustomers: [],
            topSalesPersons: [],
          },
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthKey, server]);

  // Get the correct data based on title
  const monthData = data[monthKey] || { topCustomers: [], topSalesPersons: [] };
  const filteredData =
    title === "Top Sales Person"
      ? monthData.topSalesPersons
      : monthData.topCustomers;

  const downloadExcel = async () => {
    setIsDownloading(true);
    try {
      const monthData = data[monthKey] || {
        topCustomers: [],
        topSalesPersons: [],
      };

      if (
        monthData.topCustomers.length === 0 &&
        monthData.topSalesPersons.length === 0
      ) {
        alert("No data available to download for this month.");
        setIsDownloading(false);
        return;
      }

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Revenue Dashboard";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Helper function to style header
      const styleHeader = (headerRow) => {
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
      };

      // Helper function to style data rows
      const styleDataRows = (worksheet, startRow) => {
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber > startRow) {
            row.height = 18;

            row.eachCell((cell, colNumber) => {
              cell.font = {
                size: 10,
                name: "Calibri",
                color: { argb: "FF000000" },
              };

              // Center align rank and numeric columns
              if (colNumber === 1 || colNumber >= 4) {
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

              cell.border = {
                top: { style: "thin", color: { argb: "FFE0E0E0" } },
                left: { style: "thin", color: { argb: "FFE0E0E0" } },
                bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
                right: { style: "thin", color: { argb: "FFE0E0E0" } },
              };
            });

            // Add alternating row shading
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
      };

      // =============================
      // TOP CUSTOMERS SHEET
      // =============================
      if (monthData.topCustomers.length > 0) {
        const customersSheet = workbook.addWorksheet("Top Customers");

        // Define headers
        const customerHeaders = [
          "Rank",
          "Customer Name",
          "Account Code",
          "State/Branch",
          "Weight (Kg)",
          "Amount (₹)",
          "Shipment Count",
        ];

        // Add headers
        customersSheet.addRow(customerHeaders);
        const customerHeaderRow = customersSheet.getRow(1);
        styleHeader(customerHeaderRow);

        // Add data rows
        monthData.topCustomers.forEach((customer, index) => {
          const row = [
            index + 1,
            customer.name || "",
            customer.id || "",
            customer.state || "N/A",
            customer.weight || 0,
            customer.amount || 0,
            customer.shipmentCount || 0,
          ];
          customersSheet.addRow(row);
        });

        // Set column widths
        customersSheet.getColumn(1).width = 8; // Rank
        customersSheet.getColumn(2).width = 35; // Customer Name
        customersSheet.getColumn(3).width = 18; // Account Code
        customersSheet.getColumn(4).width = 20; // State/Branch
        customersSheet.getColumn(5).width = 15; // Weight
        customersSheet.getColumn(6).width = 15; // Amount
        customersSheet.getColumn(7).width = 18; // Shipment Count

        // Format numeric columns
        customersSheet.getColumn(5).numFmt = "#,##0.00"; // Weight
        customersSheet.getColumn(6).numFmt = "#,##0.00"; // Amount

        // Style data rows
        styleDataRows(customersSheet, 1);

        // Freeze header row
        customersSheet.views = [{ state: "frozen", ySplit: 1 }];

        // Add auto-filter
        customersSheet.autoFilter = {
          from: "A1",
          to: `G1`,
        };

        // Add summary at the bottom
        const summaryRow = customersSheet.rowCount + 2;
        customersSheet.addRow([]);

        const totalWeight = monthData.topCustomers.reduce(
          (sum, c) => sum + (c.weight || 0),
          0,
        );
        const totalAmount = monthData.topCustomers.reduce(
          (sum, c) => sum + (c.amount || 0),
          0,
        );
        const totalShipments = monthData.topCustomers.reduce(
          (sum, c) => sum + (c.shipmentCount || 0),
          0,
        );

        const summaryTitleRow = customersSheet.addRow(["Summary"]);
        summaryTitleRow.getCell(1).font = {
          bold: true,
          size: 12,
          color: { argb: "FFFFFFFF" },
          name: "Calibri",
        };
        summaryTitleRow.getCell(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        customersSheet.mergeCells(`A${summaryRow}:G${summaryRow}`);

        customersSheet.addRow([
          "Total",
          "",
          "",
          "",
          totalWeight,
          totalAmount,
          totalShipments,
        ]);

        const totalRow = customersSheet.getRow(summaryRow + 1);
        totalRow.font = { bold: true, size: 10, name: "Calibri" };
        totalRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FF808080" } },
            left: { style: "thin", color: { argb: "FF808080" } },
            bottom: { style: "thin", color: { argb: "FF808080" } },
            right: { style: "thin", color: { argb: "FF808080" } },
          };
        });
      }

      // =============================
      // TOP SALES PERSONS SHEET
      // =============================
      if (monthData.topSalesPersons.length > 0) {
        const salesSheet = workbook.addWorksheet("Top Sales Persons");

        // Define headers
        const salesHeaders = [
          "Rank",
          "Sales Person Name",
          "State/Branch",
          "Weight (Kg)",
          "Amount (₹)",
          "Shipment Count",
          "Customer Count",
        ];

        // Add headers
        salesSheet.addRow(salesHeaders);
        const salesHeaderRow = salesSheet.getRow(1);
        styleHeader(salesHeaderRow);

        // Add data rows
        monthData.topSalesPersons.forEach((salesPerson, index) => {
          const row = [
            index + 1,
            salesPerson.name || "",
            salesPerson.state || "N/A",
            salesPerson.weight || 0,
            salesPerson.amount || 0,
            salesPerson.shipmentCount || 0,
            salesPerson.customerCount || 0,
          ];
          salesSheet.addRow(row);
        });

        // Set column widths
        salesSheet.getColumn(1).width = 8; // Rank
        salesSheet.getColumn(2).width = 35; // Sales Person Name
        salesSheet.getColumn(3).width = 20; // State/Branch
        salesSheet.getColumn(4).width = 15; // Weight
        salesSheet.getColumn(5).width = 15; // Amount
        salesSheet.getColumn(6).width = 18; // Shipment Count
        salesSheet.getColumn(7).width = 18; // Customer Count

        // Format numeric columns
        salesSheet.getColumn(4).numFmt = "#,##0.00"; // Weight
        salesSheet.getColumn(5).numFmt = "#,##0.00"; // Amount

        // Style data rows
        styleDataRows(salesSheet, 1);

        // Freeze header row
        salesSheet.views = [{ state: "frozen", ySplit: 1 }];

        // Add auto-filter
        salesSheet.autoFilter = {
          from: "A1",
          to: `G1`,
        };

        // Add summary at the bottom
        const summaryRow = salesSheet.rowCount + 2;
        salesSheet.addRow([]);

        const totalWeight = monthData.topSalesPersons.reduce(
          (sum, sp) => sum + (sp.weight || 0),
          0,
        );
        const totalAmount = monthData.topSalesPersons.reduce(
          (sum, sp) => sum + (sp.amount || 0),
          0,
        );
        const totalShipments = monthData.topSalesPersons.reduce(
          (sum, sp) => sum + (sp.shipmentCount || 0),
          0,
        );
        const totalCustomers = monthData.topSalesPersons.reduce(
          (sum, sp) => sum + (sp.customerCount || 0),
          0,
        );

        const summaryTitleRow = salesSheet.addRow(["Summary"]);
        summaryTitleRow.getCell(1).font = {
          bold: true,
          size: 12,
          color: { argb: "FFFFFFFF" },
          name: "Calibri",
        };
        summaryTitleRow.getCell(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4472C4" },
        };
        salesSheet.mergeCells(`A${summaryRow}:G${summaryRow}`);

        salesSheet.addRow([
          "Total",
          "",
          "",
          totalWeight,
          totalAmount,
          totalShipments,
          totalCustomers,
        ]);

        const totalRow = salesSheet.getRow(summaryRow + 1);
        totalRow.font = { bold: true, size: 10, name: "Calibri" };
        totalRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FF808080" } },
            left: { style: "thin", color: { argb: "FF808080" } },
            bottom: { style: "thin", color: { argb: "FF808080" } },
            right: { style: "thin", color: { argb: "FF808080" } },
          };
        });
      }

      // Generate and download Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const monthName = selectedMonth.format("MMMM_YYYY");
      const fileName = `Top_Sales_Customers_${monthName}.xlsx`;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert(`Failed to download report: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-5 flex flex-col gap-3 border border-french-gray rounded-md flex-grow">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1 items-start">
          <span className="font-bold">{title}</span>
          <span className="text-dim-gray text-xs">{city}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadExcel}
            disabled={isDownloading || loading}
            className="px-3 py-1 text-xs rounded hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? <LucideClockFading size={18}/>  : <DownloadIcon size={18}/>}
          </button>
          <div className="text-dim-gray text-xs flex items-center gap-1">
            <button onClick={handlePrevMonth}>
              <img
                src="arrow-right-gray.svg"
                alt="Left"
                className="rotate-180"
              />
            </button>

            <span>{selectedMonth.format("MMMM, YYYY")}</span>

            <button
              onClick={handleNextMonth}
              disabled={selectedMonth.isSame(currentMonth, "month")}
            >
              <img src="arrow-right-gray.svg" alt="Right" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col max-h-[75vh] flex-grow overflow-y-auto table-scrollbar">
        {loading ? (
          <div className="text-dim-gray text-sm text-center py-3">
            Loading...
          </div>
        ) : filteredData.length > 0 ? (
          filteredData.map((person, index) => (
            <DashboardTopListCardRow
              key={person.id}
              rank={index + 1}
              name={person.name}
              state={person.state}
              id={person.id}
              image={person.image}
              weight={person.weight}
              amount={person.amount}
              title={title}
            />
          ))
        ) : (
          <div className="text-dim-gray text-sm text-center py-3">
            No data for this month
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTopListCard;

const DashboardTopListCardRow = ({
  rank,
  name,
  state,
  id,
  image,
  weight,
  amount,
  title,
}) => {
  const [imgSrc, setImgSrc] = useState("/default-avatar.png");

  const formattedAmt = new Intl.NumberFormat("en-IN").format(amount);
  const formattedWeight = new Intl.NumberFormat("en-IN").format(weight);

  // Load image in useEffect to prevent flashing
  useEffect(() => {
    if (image) {
      // Create a new Image object to check if it loads
      const img = new Image();
      img.src = image;

      img.onload = () => {
        setImgSrc(image);
      };

      img.onerror = () => {
        setImgSrc("/default-avatar.png");
      };
    } else {
      setImgSrc("/default-avatar.png");
    }
  }, [image]);

  return (
    <div className="flex justify-between text-xs px-2 py-3 border-b border-seasalt hover:bg-gray-50 transition-colors">
      <div className="flex gap-1.5 items-center">
        <span className="text-dim-gray font-semibold min-w-[20px]">
          #{rank}
        </span>
        <img
          src="/logo.svg"
          alt="profile"
          width={32}
          height={32}
          className="rounded-full border-eerie-black p-[3px] border-[2px] object-cover"
        />
        <div className="flex flex-col">
          <div className="font-semibold">{name}</div>
          <div className="text-dim-gray">
            {title === "Top Sales Person" ? (
              <span>State: {state}</span>
            ) : (
              <span>#{id}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-semibold">{formattedWeight} Kg</div>
        <div className="text-dim-gray">₹{formattedAmt}</div>
      </div>
    </div>
  );
};
