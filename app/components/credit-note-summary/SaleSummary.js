"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { LabeledDropdown } from "@/app/components/Dropdown";
import axios from "axios";
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
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import DownloadCsvExcel from "../DownloadCsvExcel";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function SaleSummary() {
  const { register, setValue, handleSubmit, watch } = useForm();
  const [rowData, setRowData] = useState([]);
  const [withBookingDate, setBookingDate] = useState(false);
  const [withUnbilled, setUnbilled] = useState(false);
  const [withDHL, setDHL] = useState(false);
  const [withDate, setDate] = useState(false);
  const [withBranchWise, setBrnachWise] = useState(false);
  const [withConsignor, setConsignor] = useState(false);
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState({
    grandTotal: 0,
    totalOutstanding: 0,
    totalDebit: 0,
    totalCredit: 0,
  });

  const handleShow = async (values) => {
    try {
      setLoading(true);

      // Prepare all filter parameters
      const params = {
        from: toISODate(values.from),
        to: toISODate(values.to),
        ...(values.branch && { branch: values.branch }),
        ...(values.state && { state: values.state }),
        ...(values.salePerson && { salePerson: values.salePerson }),
        ...(values.accountManager && { accountManager: values.accountManager }),
        ...(values.customerCode && { customerCode: values.customerCode }),
        ...(withUnbilled && { withUnbilled: true }),
      };

      const res = await axios.get(
        `${server}/credit-note-awb-wise/sale-summary`,
        {
          params: params,
        }
      );

      const rows = res.data.data || [];
      setRowData(rows);

      // Calculate footer totals
      const footer = rows.reduce(
        (acc, r) => {
          acc.grandTotal += r.GrandTotal || 0;
          acc.totalOutstanding += r.TotalOutStanding || 0;
          acc.totalDebit += r.TotalDebit || 0;
          acc.totalCredit += r.TotalCredit || 0;
          return acc;
        },
        {
          grandTotal: 0,
          totalOutstanding: 0,
          totalDebit: 0,
          totalCredit: 0,
        }
      );

      setTotals(footer);
    } catch (err) {
      console.error(err);
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  const toISODate = (value) => {
    if (!value) return null;

    // If already ISO format, return as is
    if (value.includes("-")) return value;

    // Convert from DD/MM/YYYY to YYYY-MM-DD
    const [dd, mm, yyyy] = value.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Optional: Add a reset function to clear all filters
  const handleReset = () => {
    // Reset form values
    const resetValues = {
      runNumber: "",
      payment: "",
      branch: "",
      origin: "",
      sector: "",
      destination: "",
      network: "",
      counterPart: "",
      salePerson: "",
      saleRefPerson: "",
      company: "",
      state: "",
      accountManager: "",
      type: "",
      customerCode: "",
      name: "",
      from: "",
      to: "",
    };

    Object.keys(resetValues).forEach((key) => {
      setValue(key, resetValues[key]);
    });

    // Reset checkboxes
    setBookingDate(false);
    setUnbilled(false);
    setDHL(false);
    setDate(false);
    setBrnachWise(false);
    setConsignor(false);

    // Clear table data
    setRowData([]);
    setTotals({
      grandTotal: 0,
      totalOutstanding: 0,
      totalDebit: 0,
      totalCredit: 0,
    });
  };

  const columns = useMemo(
    () => [
      { key: "CustomerCode", label: "Customer Code" },
      { key: "CustomerName", label: "Customer Name" },
      { key: "Type", label: "Type" },
      { key: "BranchCode", label: "Branch" },
      { key: "State", label: "State" },
      { key: "City", label: "City" },
      { key: "SalePerson", label: "Sale Person" },
      { key: "RefrenceBy", label: "Reference By" },
      { key: "ManagedBy", label: "Managed By" },
      { key: "CollectionBy", label: "Collection By" },
      { key: "AccountManager", label: "Account Manager" },
      { key: "GM", label: "GM" },
      { key: "RM", label: "RM" },
      { key: "SM", label: "SM" },
      { key: "RateType", label: "Rate Type" },
      { key: "Currency", label: "Currency" },
      { key: "BasicAmount", label: "Basic Amount" },
      { key: "DiscountAmt", label: "Discount Amount" },
      { key: "BasicAmtAfterDiscount", label: "Basic After Discount" },
      { key: "RateHike", label: "Rate Hike" },
      { key: "SGST", label: "SGST" },
      { key: "CGST", label: "CGST" },
      { key: "IGST", label: "IGST" },
      { key: "Handling", label: "Handling" },
      { key: "OVWT", label: "OVWT" },
      { key: "Mischg", label: "Misc Charge" },
      { key: "Fuel", label: "Fuel" },
      { key: "NonTaxable", label: "Non Taxable" },
      { key: "GrandTotal", label: "Grand Total" },
      { key: "OpeningBalance", label: "Opening Balance" },
      { key: "TotalRcpt", label: "Total Receipt" },
      { key: "TotalDebit", label: "Total Debit" },
      { key: "TotalCredit", label: "Total Credit" },
      { key: "TotalOutStanding", label: "Outstanding" },
    ],
    []
  );

  const handleDownloadExcel = async () => {
    if (!rowData || rowData.length === 0) {
      alert("No data to export");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sale Summary");

    /* ===== HEADER (SaleDetails style) ===== */
    worksheet.columns = columns.map((col) => ({
      header: col.label,
      key: col.key,
      width: Math.max(col.label.length + 6, 18),
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFDC3545" }, // red
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    /* ===== DATA ===== */
    rowData.forEach((row) => {
      const r = worksheet.addRow(row);
      r.height = 22;

      r.eachCell((cell) => {
        cell.alignment = { vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    /* ===== TOTAL ROW ===== */
    const totalRow = worksheet.addRow({
      CustomerName: "TOTAL",
      GrandTotal: totals.grandTotal,
      TotalDebit: totals.totalDebit,
      TotalCredit: totals.totalCredit,
      TotalOutStanding: totals.totalOutstanding,
    });

    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.border = {
        top: { style: "double" },
        bottom: { style: "double" },
      };
    });

    /* ===== NUMBER FORMAT ===== */
    [
      "BasicAmount",
      "DiscountAmt",
      "BasicAmtAfterDiscount",
      "RateHike",
      "Fuel",
      "Handling",
      "GrandTotal",
      "TotalDebit",
      "TotalCredit",
      "TotalOutStanding",
    ].forEach((key) => {
      worksheet.getColumn(key).numFmt = "#,##0.00";
    });

    /* ===== FREEZE HEADER ONLY ===== */
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    /* ===== DOWNLOAD ===== */
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "credit-note-sale-summary.xlsx"
    );
  };

  const handleDownloadCSV = () => {
    if (!rowData || rowData.length === 0) {
      alert("No data to export");
      return;
    }

    // Build CSV header from columns
    const headers = columns.map((c) => `"${c.label}"`).join(",");

    // Build CSV rows
    const rows = rowData.map((row) =>
      columns
        .map((c) => {
          const val = row[c.key] ?? "";
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    // Totals row (same logic as Excel)
    const totalRow = columns
      .map((c) => {
        if (c.key === "CustomerName") return `"TOTAL"`;
        if (c.key === "GrandTotal") return `"${totals.grandTotal.toFixed(2)}"`;
        if (c.key === "TotalDebit") return `"${totals.totalDebit.toFixed(2)}"`;
        if (c.key === "TotalCredit")
          return `"${totals.totalCredit.toFixed(2)}"`;
        if (c.key === "TotalOutStanding")
          return `"${totals.totalOutstanding.toFixed(2)}"`;
        return `""`;
      })
      .join(",");

    const csvContent = [headers, ...rows, totalRow].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = "credit-note-sale-summary.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <form className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          {/* Row 1 - 4 columns */}
          <div className="grid grid-cols-4 gap-3">
            <InputBox
              placeholder="Run Number"
              register={register}
              setValue={setValue}
              value="runNumber"
            />
            <LabeledDropdown
              options={["ABC", "XYZ", "LMN"]}
              title="Payment"
              register={register}
              setValue={setValue}
              value="payment"
            />
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
          </div>

          {/* Row 2 - 4 columns */}
          <div className="grid grid-cols-4 gap-3">
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
            <InputBox
              placeholder="Network"
              register={register}
              setValue={setValue}
              value="network"
            />
            <InputBox
              placeholder="Counter Part"
              register={register}
              setValue={setValue}
              value="counterPart"
            />
          </div>

          {/* Row 3 - 4 columns */}
          <div className="grid grid-cols-4 gap-3">
            <LabeledDropdown
              options={["ABC", "XYZ", "LMN"]}
              title="Sale Person"
              register={register}
              setValue={setValue}
              value="salePerson"
            />
            <LabeledDropdown
              options={["ABC", "XYZ", "LMN"]}
              title="Sale Ref. Person"
              register={register}
              setValue={setValue}
              value="saleRefPerson"
            />
            <InputBox
              placeholder="Company"
              register={register}
              setValue={setValue}
              value="company"
            />
            <InputBox
              placeholder="State"
              register={register}
              setValue={setValue}
              value="state"
            />
          </div>

          {/* Row 4 - 4 columns */}
          <div className="grid grid-cols-4 gap-3">
            <LabeledDropdown
              options={["ABC", "XYZ", "LMN"]}
              title="Account Manager"
              register={register}
              setValue={setValue}
              value="accountManager"
            />
            <LabeledDropdown
              options={["ABC", "XYZ", "LMN"]}
              title="Type"
              register={register}
              setValue={setValue}
              value="type"
            />
            <InputBox
              placeholder="Customer Code"
              register={register}
              setValue={setValue}
              value="customerCode"
            />
            <DummyInputBoxWithLabelDarkGray
              placeholder="Customer Name"
              register={register}
              setValue={setValue}
              value="name"
            />
          </div>

          {/* Row 5 - Date range and buttons */}
          <div className="grid grid-cols-4 gap-3">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
              required
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
              required
            />
            <div className="flex gap-2">
              <OutlinedButtonRed
                type="button"
                label="Show"
                onClick={handleSubmit(handleShow)}
                disabled={loading}
              />
            </div>
            <div className="w-full">
              <DownloadCsvExcel
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center w-full">
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Booking Date"
          id="bookingDate"
          isChecked={withBookingDate}
          setChecked={setBookingDate}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Unbilled Shipment"
          id="unbilledShipment"
          isChecked={withUnbilled}
          setChecked={setUnbilled}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Skip DHL"
          id="skipDHL"
          isChecked={withDHL}
          setChecked={setDHL}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="YYYYMMDD"
          id="date"
          isChecked={withDate}
          setChecked={setDate}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Special Report Branch Wise"
          id="branchWise"
          isChecked={withBranchWise}
          setChecked={setBrnachWise}
        />
        <RedCheckbox
          register={register}
          setValue={setValue}
          label="Consignor Wise"
          id="consignorWise"
          isChecked={withConsignor}
          setChecked={setConsignor}
        />
      </div>

      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          className="border-b-0 rounded-b-none h-[35vh]"
          loading={loading}
        />
        <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16">
          <div>
            Total Debit :
            <span className="text-red ml-1">
              {totals.totalDebit.toFixed(2)}
            </span>
          </div>
          <div>
            Total Credit :
            <span className="text-red ml-1">
              {totals.totalCredit.toFixed(2)}
            </span>
          </div>
          <div>
            Outstanding :
            <span className="text-red ml-1">
              {totals.totalOutstanding.toFixed(2)}
            </span>
          </div>
          <div>
            Grand Total :
            <span className="text-red ml-1">
              {totals.grandTotal.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-2">{/* Add other buttons if needed */}</div>
      </div>
    </form>
  );
}

export default SaleSummary;
