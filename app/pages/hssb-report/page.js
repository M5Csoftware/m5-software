"use client";
import React, { useContext, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { Dropdown, LabeledDropdown } from "@/app/components/Dropdown";
import { SimpleButton } from "@/app/components/Buttons";
import { DateInputBox } from "@/app/components/InputBox";
import LoaderAnimation from "@/app/components/Loader";
import NotificationFlag from "@/app/components/Notificationflag";
import Heading from "@/app/components/Heading";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useAuth } from "@/app/Context/AuthContext";
import { downloadStateHSSB } from "../dashboard/HssbStates";
import { RadioButtonLarge } from "@/app/components/RadioButton";

const HSSBReportPage = () => {
  const { register, setValue, handleSubmit, watch, trigger, formState: { errors } } = useForm();
  const { server, states } = useContext(GlobalContext);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [salePersonOptions, setSalePersonOptions] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(true);
  const [reportType, setReportType] = useState("salesperson"); // "salesperson" | "state"
  
  const [notification, setNotification] = useState({
    visible: false,
    type: "success",
    message: "",
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get(`${server}/sale-report/dropdown-options`);
        if (res.data.success) {
          const names = (res.data.data.salePersons || []).filter(n => n && n.trim() !== "");
          setSalePersonOptions(names);
          
          const currentUserInList = names.find(n => n.includes(user.userId) || n.includes(user.userName));
          if (currentUserInList) {
             setValue("salePerson", currentUserInList);
          }
        }
      } catch (err) {
        console.error("Error fetching sale persons:", err);
      } finally {
        setLoadingPersons(false);
      }
    };
    fetchOptions();
  }, [server, user, setValue]);

  // Helper to convert DD/MM/YYYY to YYYY-MM
  const toYearMonth = (dateStr) => {
    if (!dateStr) return "";
    const [d, m, y] = dateStr.split("/");
    return `${y}-${m}`;
  };

  async function getLatestState(userId, from, to, server) {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    function toTargetMonthFormat(ym) {
      const [y, m] = ym.split("-").map(Number);
      return `${monthNames[m - 1]}-${y}`;
    }

    function monthList(from, to) {
      let [fy, fm] = from.split("-").map(Number);
      let [ty, tm] = to.split("-").map(Number);
      const out = [];
      while (fy < ty || (fy === ty && fm <= tm)) {
        out.push(`${fy}-${String(fm).padStart(2, "0")}`);
        fm++;
        if (fm === 13) { fm = 1; fy++; }
      }
      return out;
    }

    const months = monthList(from, to);
    for (let i = months.length - 1; i >= 0; i--) {
      const ym = months[i];
      const targetMonth = toTargetMonthFormat(ym);
      try {
        const res = await fetch(`${server}/hssb-report/get-sales?user=${userId}&month=${targetMonth}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data && data.stateAssigned) return data.stateAssigned;
      } catch (e) { continue; }
    }
    return "State Report";
  }

  const downloadSalesPersonReport = async (form) => {
    const fromMonth = toYearMonth(form.from);
    const toMonth = toYearMonth(form.to);

    if (!form.salePerson || !fromMonth || !toMonth) {
      setNotification({
        visible: true,
        type: "error",
        message: "Please select salesperson, from date and to date",
      });
      return;
    }

    let targetUserId = form.salePerson;
    const idMatch = form.salePerson.match(/\(([^)]+)\)/);
    if (idMatch) {
      targetUserId = idMatch[1];
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${server}/hssb-report?from=${fromMonth}&to=${toMonth}&user=${targetUserId}`);
      const summary = await res.json();
      const { salesperson, monthly } = summary;
      const months = Object.keys(monthly).sort();

      if (months.length === 0) throw new Error("No sales data found for selected period.");

      const stateName = await getLatestState(targetUserId, fromMonth, toMonth, server);

      const res2 = await fetch(`${server}/hssb-report/full?from=${fromMonth}&to=${toMonth}&user=${targetUserId}`);
      const full = await res2.json();

      if (!full || !full.months || !Array.isArray(full.months)) throw new Error("Missing detailed data for second sheet.");

      const months2 = full.months;
      const customers = full.customers;

      const groupedCustomers = {};
      customers.forEach((cust) => {
        const groupCode = cust.groupCode || cust.code;
        if (!groupedCustomers[groupCode]) groupedCustomers[groupCode] = [];
        groupedCustomers[groupCode].push(cust);
      });

      const sortedGroupCodes = Object.keys(groupedCustomers).sort();
      const customersWithBlanks = [];
      sortedGroupCodes.forEach((groupCode, index) => {
        groupedCustomers[groupCode].forEach((cust) => customersWithBlanks.push(cust));
        if (index < sortedGroupCodes.length - 1) customersWithBlanks.push(null);
      });

      const workbook = new ExcelJS.Workbook();
      const sheet1 = workbook.addWorksheet("HSSB Report");
      const sheet2 = workbook.addWorksheet(stateName);

      const headerStyle = {
        font: { bold: true, size: 11, color: { argb: "FFFFFFFF" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFEA1B40" } },
        alignment: { vertical: "middle", horizontal: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      };

      const subHeaderStyle = {
        font: { bold: true, size: 10, color: { argb: "FF000000" } },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD966" } },
        alignment: { vertical: "middle", horizontal: "left", indent: 1 },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      };

      const cellStyle = {
        font: { size: 10 },
        alignment: { vertical: "middle", horizontal: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      };

      const totalStyle = {
        font: { bold: true, size: 10 },
        fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F2F2" } },
        alignment: { vertical: "middle", horizontal: "center" },
        border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
      };

      const monthLabel = (ym) => {
        const [year, month] = ym.split("-");
        const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${names[Number(month) - 1]} ${year}`;
      };

      sheet1.mergeCells("A1", "H1");
      sheet1.getCell("A1").value = "HSSB SALES REPORT";
      sheet1.getCell("A1").style = { font: { bold: true, size: 14 }, alignment: { horizontal: "center" } };
      sheet1.addRow([]);
      sheet1.addRow(["SALES PERSON", ...months.map(monthLabel)]).eachCell(c => c.style = headerStyle);
      sheet1.addRow([salesperson, ...months.map(m => monthly[m] || 0)]).eachCell(c => Object.assign(c.style, cellStyle));
      sheet1.addRow(["TOTAL", ...months.map(m => monthly[m] || 0)]).eachCell(c => Object.assign(c.style, totalStyle));
      sheet1.columns.forEach(col => col.width = 18);

      const REGION_ORDER = ["GRAND TOTAL", "AUSTRALIA", "BRANDED", "CANADA", "EUROPE", "FEDEX IE", "UK", "USA"];
      const customerHeaderLabels = ["S.No", "Customer Code", "Customer Name", "Group Code", "Type", "City", "State", "ServiceTax", "Account", "SalesPerson"];
      
      let currentCol = customerHeaderLabels.length + 1;
      const regionColumns = {};
      REGION_ORDER.forEach(region => {
        regionColumns[region] = { start: currentCol, end: currentCol + months2.length - 1 };
        currentCol = currentCol + months2.length + 1;
      });

      sheet2.addRow([]);
      REGION_ORDER.forEach(region => {
        const { start, end } = regionColumns[region];
        sheet2.getCell(1, start).value = region;
        if (start !== end) sheet2.mergeCells(1, start, 1, end);
        sheet2.getCell(1, start).style = { ...headerStyle, alignment: { vertical: "middle", horizontal: "left", indent: 1 } };
      });

      const row2 = [...customerHeaderLabels];
      REGION_ORDER.forEach(region => {
        months2.forEach(m => row2.push(monthLabel(m)));
        row2.push("");
      });
      sheet2.addRow(row2).eachCell((cell) => { if (cell.value) cell.style = subHeaderStyle; });

      let sn = 1;
      customersWithBlanks.forEach(cust => {
        if (!cust) { sheet2.addRow([]); return; }
        const row = [sn++, cust.code, cust.name, cust.groupCode || cust.code, cust.type, cust.city, cust.state, cust.serviceTax, cust.accountStatus, cust.salesman];
        REGION_ORDER.forEach(region => {
          months2.forEach(m => row.push(cust.regions[region][m] || 0));
          row.push("");
        });
        sheet2.addRow(row).eachCell(c => c.style = cellStyle);
      });
      sheet2.columns.forEach(col => col.width = 18);

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), `HSSB_Report_${salesperson}.xlsx`);
      setNotification({ visible: true, type: "success", message: "Report downloaded successfully" });
    } catch (error) {
      console.error("Download failed:", error);
      setNotification({ visible: true, type: "error", message: error.message || "Failed to download report" });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadStateReport = async (form) => {
    const fromMonth = toYearMonth(form.from);
    const toMonth = toYearMonth(form.to);

    if (!form.state || !fromMonth || !toMonth) {
      setNotification({ visible: true, type: "error", message: "Please select state, from date and to date" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${server}/hssb-report/state?state=${form.state}&from=${fromMonth}&to=${toMonth}`);
      const data = await res.json();
      if (!data || data.success === false) throw new Error(data.message || "Failed to fetch report data");
      downloadStateHSSB(data);
      setNotification({ visible: true, type: "success", message: "Report downloaded successfully" });
    } catch (error) {
      console.error("Download failed:", error);
      setNotification({ visible: true, type: "error", message: error.message || "Failed to download report" });
    } finally {
      setIsLoading(false);
    }
  };

  const onDownload = (form) => {
    if (reportType === "salesperson") {
      downloadSalesPersonReport(form);
    } else {
      downloadStateReport(form);
    }
  };

  const [resetFactor, setResetFactor] = useState(false);
  const handleRefresh = () => {
    setResetFactor(!resetFactor);
    setValue("salePerson", "");
    setValue("state", "");
    setValue("from", "");
    setValue("to", "");
  };

  return (
    <div className="flex flex-col gap-9">
      <LoaderAnimation show={isLoading} />
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="HSSB Reports"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="bg-seasalt border border-french-gray rounded-md p-5 flex flex-col gap-6">
        <div className="flex gap-4">
          <RadioButtonLarge
            id="salesperson"
            name="reportType"
            label="Salesperson Wise"
            register={register}
            setValue={setValue}
            selectedValue={reportType}
            setSelectedValue={setReportType}
          />
          <RadioButtonLarge
            id="state"
            name="reportType"
            label="State Wise"
            register={register}
            setValue={setValue}
            selectedValue={reportType}
            setSelectedValue={setReportType}
          />
        </div>

        <form onSubmit={handleSubmit(onDownload)} className="flex flex-col">
          <div className="flex w-full gap-3 pb-2">
            <div className="flex w-full gap-3 items-end">
              {reportType === "salesperson" ? (
                <div className="w-1/4">
                  <Dropdown
                    register={register}
                    setValue={setValue}
                    value="salePerson"
                    title="Select Sales Person"
                    options={salePersonOptions}
                    placeholder={loadingPersons ? "Loading..." : "Sales Person"}
                  />
                </div>
              ) : (
                <div className="w-1/4">
                  <LabeledDropdown
                    register={register}
                    setValue={setValue}
                    value="state"
                    title="Select State"
                    options={["All States", ...states.map((s) => s.name)]}
                  />
                </div>
              )}

              <div className="w-1/4">
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value="from"
                  placeholder="From"
                  trigger={trigger}
                  error={errors.from}
                  resetFactor={resetFactor}
                />
              </div>

              <div className="w-1/4">
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value="to"
                  placeholder="To"
                  trigger={trigger}
                  error={errors.to}
                  resetFactor={resetFactor}
                />
              </div>

              <div className="w-1/4 pb-1">
                <SimpleButton name={isLoading ? "Downloading..." : "Download Report"} type="submit" disabled={isLoading} />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HSSBReportPage;
