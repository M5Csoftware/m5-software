"use client";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { LabeledDropdown } from "@/app/components/Dropdown";
import InputBox from "@/app/components/InputBox";
import { SimpleButton } from "@/app/components/Buttons";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import NotificationFlag from "@/app/components/Notificationflag";

function DayWiseSale() {
  const { register, setValue, getValues, reset, watch } = useForm();
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState([]);
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const month = watch("month");
  const year = watch("year");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
    setRows([]);
    setLoading(false); // ✅ reset loader
    showNotification("success", "Refreshed");
  };

  const columns = [
    { key: "clientCode", label: "ClientCode" },
    { key: "clientName", label: "ClientName" },
    { key: "company", label: "Company" },
    { key: "branch", label: "Branch" },
    { key: "salesPersonName", label: "SalePerson" },
    { key: "referenceBy", label: "RefrenceBy" },
    { key: "collectionBy", label: "CollectionBy" },
    { key: "openingBalance", label: "OpeningBalance" },
    { key: "creditLimit", label: "CreditLimit" },
    { key: "currency", label: "Currency" },

    ...Array.from({ length: 31 }, (_, i) => ({
      key: `day${i + 1}`,
      label: `Day ${i + 1}`,
    })),

    { key: "total", label: "Total" },
  ];

  const handleShow = async () => {
    const m = getValues("month");
    const y = getValues("year");

    if (!m || !y) {
      showNotification("error", "Select month and enter year");
      return;
    }

    setLoading(true); // ✅ START

    try {
      const res = await fetch(`${server}/daywise-sale?month=${m}&year=${y}`);
      const data = await res.json();
      setRows(data.records);

      if (!data.records || data.records.length === 0) {
        showNotification("error", "No records found");
        setLoading(false); // ✅ END
        return;
      }

      showNotification("success", `Found ${data.records.length} records`);
    } catch (err) {
      showNotification("error", "Server not reachable");
    }

    setLoading(false); // ✅ END
  };

  const downloadExcel = async () => {
    setLoading(true);

    try {
      if (rows.length === 0) {
        showNotification("error", "No data found to export");
        return;
      }

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(`DayWiseSale`);

      // Add header row
      const headers = ["SrNo", ...Object.keys(rows[0])];
      ws.addRow(headers);

      // Add data rows
      rows.forEach((row, idx) => {
        ws.addRow([idx + 1, ...Object.values(row)]);
      });

      // Style everything
      ws.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" },
            bottom: { style: "thin" },
            left: { style: "thin" },
            right: { style: "thin" },
          };
        });

        // Header style
        if (rowNumber === 1) {
          row.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "EA1B40" },
            };
          });
        }
      });

      // Auto width
      ws.columns.forEach((col) => {
        let max = 10;
        col.eachCell({ includeEmpty: true }, (cell) => {
          const len = cell.value ? cell.value.toString().length : 0;
          if (len > max) max = len;
        });
        col.width = max + 3;
      });

      const buf = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buf]), `DayWiseSale  ${month}-${year}.xlsx`);
      showNotification("success", "File downloaded successfully");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Day Wise Sale"
        bulkUploadBtn="hidden"
        downloadBtn={false}
        codeListBtn="hidden"
        fullscreenBtn={false}
        onRefresh={handleRefresh}
      />

      <div className="flex flex-col gap-4 mt-6">
        <div className="flex gap-3 items-end">
          <LabeledDropdown
            options={[
              "January",
              "Feburary",
              "March",
              "April",
              "May",
              "June",
              "July",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
            ]}
            register={register}
            setValue={setValue}
            title="Month"
            value="month"
            resetFactor={refreshKey}
          />

          <InputBox
            placeholder="Year"
            register={register}
            setValue={setValue}
            value="year"
            resetFactor={refreshKey}
          />
          <div>
            <SimpleButton
              name={loading ? "Loading..." : "Show"}
              onClick={handleShow}
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <RedLabelHeading label="Report" />
        <div className="relative h-[50vh]">
          {loading && (
            <div className="absolute inset-0 flex justify-center items-center bg-white/70 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red"></div>
            </div>
          )}

          <TableWithSorting
            columns={columns}
            rowData={rows}
            register={register}
            setValue={setValue}
            className={`h-[50vh]`}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <div className="flex gap-2">
          <SimpleButton
            type="button"
            name={loading ? "Loading..." : "Download Excel"}
            onClick={downloadExcel}
          />{" "}
        </div>
      </div>
    </form>
  );
}

export default DayWiseSale;
