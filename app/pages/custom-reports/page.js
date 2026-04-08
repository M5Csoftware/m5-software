"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { DateInputBox } from "@/app/components/InputBox";
import { PlusIcon } from "lucide-react";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import BookingSection from "./BookingSection";
import OperationsSection from "./OperationsSection";
import CustomerServiceSection from "./CustomerServiceSection";
import BillingSection from "./BillingSection";
import { format } from "date-fns";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";

const CustomReports = () => {
  const { register, setValue, watch, reset } = useForm();
  const department = watch("department");
  const [selectedFields, setSelectedFields] = useState({
    Booking: [],
    Operations: [],
    "Customer Service": [],
    Billing: [],
  });

  const allSelectedFields = [
    ...new Set(["AWB Number", ...Object.values(selectedFields).flat()]),
  ];

  const dynamicColumns = allSelectedFields.map((field) => ({
    key: field.toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, ""), // convert to safe key
    label: field,
  }));

  const handleFieldChange = (dept, fields) => {
    setSelectedFields((prev) => ({
      ...prev,
      [dept]: fields,
    }));
  };

  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const processReportData = (data) => {
    const formatted = data.map((item) => {
      const newItem = { ...item };
      Object.keys(newItem).forEach((key) => {
        if (key.toLowerCase().includes("date") && newItem[key]) {
          try {
            newItem[key] = format(new Date(newItem[key]), "dd/MM/yyyy");
          } catch (e) {
            // ignore
          }
        }
        // Format numbers to 2 decimal places
        if (typeof newItem[key] === "number") {
          newItem[key] = newItem[key].toFixed(2);
        }
      });
      return newItem;
    });

    // De-duplicate by AWB Number
    const seenAWB = new Set();
    const uniqueData = formatted.filter((item) => {
      const awb = item.awb_number;
      if (awb) {
        if (seenAWB.has(awb)) return false;
        seenAWB.add(awb);
      }
      return true;
    });

    return uniqueData;
  };

  const handleShowReport = async () => {
    if (allSelectedFields.length === 0) {
      alert("Please select at least one field to generate a report.");
      return;
    }

    const filters = watch();
    if (!filters.from || !filters.to) {
      alert("Please select both 'From' and 'To' dates.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${server}/custom-reports/personal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: allSelectedFields,
          filters: {
            from: filters.from,
            to: filters.to,
            sector: filters.sector,
            shipmentType: filters.shipmentType,
            status: filters.status,
          },
        }),
      });

      const result = await res.json();
      if (result.success) {
        const uniqueData = processReportData(result.data);
        setReportData(uniqueData);
      } else {
        alert(result.message || "Failed to fetch report");
      }
    } catch (error) {
      console.error("Error fetching report:", error);
      alert("An error occurred while fetching the report.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (allSelectedFields.length === 0) {
      alert("Please select at least one field to generate a report.");
      return;
    }

    const filters = watch();
    if (!filters.from || !filters.to) {
      alert("Please select both 'From' and 'To' dates.");
      return;
    }

    setLoading(true);
    try {
      let dataToExport = reportData;

      if (dataToExport.length === 0) {
        const res = await fetch(`${server}/custom-reports/personal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: allSelectedFields,
            filters: {
              from: filters.from,
              to: filters.to,
              sector: filters.sector,
              shipmentType: filters.shipmentType,
              status: filters.status,
            },
          }),
        });

        const result = await res.json();
        if (result.success) {
          dataToExport = processReportData(result.data);
          setReportData(dataToExport);
        } else {
          alert(result.message || "Failed to fetch report for export");
          setLoading(false);
          return;
        }
      }

      // Dynamic Imports
      const ExcelJS = (await import("exceljs")).default;
      const fileSaver = await import("file-saver");
      const saveAs = fileSaver.saveAs || fileSaver.default;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Custom Report");

      // Set columns with auto-width calculation
      worksheet.columns = dynamicColumns.map((col) => {
        let maxLen = col.label.length;
        dataToExport.forEach((item) => {
          const value = item[col.key];
          if (value) {
            const currentLen = value.toString().length;
            if (currentLen > maxLen) {
              maxLen = currentLen;
            }
          }
        });

        return {
          header: col.label,
          key: col.key,
          width: maxLen + 5, // add padding
        };
      });

      // Add Data
      worksheet.addRows(dataToExport);

      // Theme Styling (Red Header, White Font)
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "EA1B40" },
        };
        cell.font = {
          color: { argb: "FFFFFF" },
          bold: true,
          size: 12,
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Styling Data Cells
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.eachCell((cell) => {
            cell.alignment = { horizontal: "left", vertical: "middle" };
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        }
      });

      // Write and Save
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const fileName = `Custom_Report_${format(new Date(), "dd_MM_yyyy_HHmm")}.xlsx`;

      saveAs(blob, fileName);
    } catch (error) {
      console.error("Export error:", error);
      alert("An error occurred during export.");
    } finally {
      setLoading(false);
    }
  };

  const [resetFactor, setResetFactor] = useState(false);

  const refreshComponent = () => {
    reset({
      department: "",
      from: "",
      to: "",
      sector: "",
      shipmentType: "",
      status: "",
    });
    setSelectedFields({
      Booking: [],
      Operations: [],
      "Customer Service": [],
      Billing: [],
    });
    setReportData([]);
    setResetFactor((prev) => !prev);
  };

  const resetFields = () => {
    setSelectedFields({
      Booking: [],
      Operations: [],
      "Customer Service": [],
      Billing: [],
    });
    setReportData([]);
  };

  const { server, sectors } = useContext(GlobalContext);

  return (
    <div>
      <div className="flex flex-col gap-3">
        <Heading
          title={`Custom Reports`}
          fullscreenBtn
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          onRefresh={refreshComponent}
        />

        <div className="flex gap-6">
          {/* Left Side */}
          <div className="w-1/3 p-4 bg-white h-[75vh] rounded-lg shadow-sm border-opacity-30 border-battleship-gray border-[1px]">
            <RedLabelHeading label="Select Date Fields to add in your Report" />

            <div className="flex flex-col mt-2">
              <div className="flex bg-[#F2F2F2] p-2 rounded-lg gap-3">
                {["Booking", "Operations", "CS", "Billing"].map((dept) => (
                  <button
                    key={dept}
                    onClick={() => setValue("department", dept)}
                    className={`flex-1 py-2 text-xs font-medium tracking-wider rounded-md transition-all duration-200 ${
                      department === dept
                        ? "bg-red text-white shadow-md scale-105"
                        : "text-battleship-gray hover:bg-white hover:text-red hover:shadow-sm"
                    }`}
                  >
                    {dept}
                  </button>
                ))}
              </div>
              {/* DYNAMIC ACCORDING TO DEPARTMENT */}

              {!department && (
                <div className="flex justify-center mt-6 items-center gap-2">
                  <div className="w-3 h-3 bg-red rounded-full" />
                  <span className="text-sm font-semibold">
                    Select a Department to get specific reports
                  </span>
                </div>
              )}

              {department === "Booking" && (
                <div className="rounded mt-6 h-[60vh] overflow-y-auto table-scrollbar">
                  <BookingSection
                    preSelectedFields={selectedFields.Booking}
                    onChange={(fields) => handleFieldChange("Booking", fields)}
                  />
                </div>
              )}

              {department === "Operations" && (
                <div className="rounded mt-6 h-[60vh] overflow-y-auto table-scrollbar">
                  <OperationsSection
                    preSelectedFields={selectedFields.Operations}
                    onChange={(fields) =>
                      handleFieldChange("Operations", fields)
                    }
                  />
                </div>
              )}

              {(department === "Customer Service" || department === "CS") && (
                <div className="rounded mt-6 h-[60vh] overflow-y-auto table-scrollbar">
                  <CustomerServiceSection
                    preSelectedFields={selectedFields["Customer Service"]}
                    onChange={(fields) =>
                      handleFieldChange("Customer Service", fields)
                    }
                  />
                </div>
              )}

              {department === "Billing" && (
                <div className="rounded mt-6 h-[60vh] overflow-y-auto table-scrollbar">
                  <BillingSection
                    preSelectedFields={selectedFields.Billing}
                    onChange={(fields) => handleFieldChange("Billing", fields)}
                  />
                </div>
              )}
            </div>
          </div>
          {/* Right Side */}
          <div className="w-2/3 bg-white h-[75vh] flex flex-col gap-4">
            {/* Selcted fileds card */}
            <div className="flex items-center justify-between p-4 border-opacity-30 rounded-lg shadow-sm border-battleship-gray border-[1px]">
              <div>
                <h2 className="font-semibold">Selected Fields</h2>
                <span className="font-extralight text-sm text-battleship-gray">
                  {allSelectedFields.length} Fields selected for your report
                </span>
              </div>

              <div className="h-8 w-8 bg-red rounded-md p-2 flex items-center justify-center text-sm text-white">
                {allSelectedFields.length}
              </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-col gap-3">
              <RedLabelHeading label="Filters" />
              <div className="flex gap-6">
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value="from"
                  resetFactor={resetFactor}
                  placeholder="From"
                />
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value="to"
                  resetFactor={resetFactor}
                  placeholder="To"
                />
              </div>
              <div className="flex gap-3">
                <LabeledDropdown
                  setValue={setValue}
                  register={register}
                  title="Sector"
                  value="sector"
                  resetFactor={resetFactor}
                  options={sectors.map((s) => s.name)}
                />
                <LabeledDropdown
                  setValue={setValue}
                  register={register}
                  title="Shipment Type"
                  value="shipmentType"
                  resetFactor={resetFactor}
                  options={["Dox", "NDox"]}
                />
                <LabeledDropdown
                  setValue={setValue}
                  register={register}
                  title="Status"
                  value="status"
                  resetFactor={resetFactor}
                  options={[
                    "All",
                    "Booked",
                    "Inscan",
                    "Manifested",
                    "In Transit",
                    "Out for Delivery",
                    "Delivered",
                    "RTO",
                    "Hold",
                  ]}
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2 cursor-pointer bg-[#F2F2F2] rounded-lg flex justify-center items-center border-opacity-30 shadow-sm border-battleship-gray border-[1px] p-2">
                  <button className=" flex justify-center items-center opacity-75 gap-2 text-sm tracking-wide">
                    <PlusIcon size={16} />
                    Add More Filters
                  </button>
                </div>
                <div
                  onClick={handleShowReport}
                  className="w-1/2 cursor-pointer bg-red text-white rounded-lg flex justify-center items-center border-opacity-30 shadow-sm border-battleship-gray border-[1px] p-2"
                >
                  <button className="flex justify-center items-center gap-2 text-sm tracking-wide font-semibold">
                    {loading ? "Fetching..." : "Show Report"}
                  </button>
                </div>
              </div>
            </div>

            {/* Reports Preview */}
            <div className="p-4 bg-white rounded-lg border-battleship-gray border-opacity-30 border-[1px] h-[60vh] shadow-sm">
              <RedLabelHeading label="Reports Preview" />
              <TableWithSorting
                setValue={setValue}
                register={register}
                columns={dynamicColumns}
                rowData={reportData}
                className={`h-[38vh] border-battleship-gray mt-4`}
              />
            </div>
          </div>
        </div>

        {/* Buttons Section */}
        <div className="flex justify-end items-center gap-4">
          <div>
            <OutlinedButtonRed
              label={"Reset Fields"}
              type="button"
              buttonIcon
              onClick={resetFields}
            />
          </div>

          <div>
            <SimpleButton
              name={"Generate Report"}
              type="button"
              reportIcon
              onClick={handleGenerateReport}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomReports;
