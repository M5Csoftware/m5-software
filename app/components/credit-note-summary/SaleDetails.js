"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import DownloadCsvExcel from "@/app/components/DownloadCsvExcel";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useMemo, useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function SaleDetails() {
  const { server } = useContext(GlobalContext);
  const { register, setValue, watch, getValues } = useForm();
  const [rowData, setRowData] = useState([]);
  const [totals, setTotals] = useState({
    totalBagWeight: 0,
    totalWeight: 0,
    grandTotal: 0,
  });
  const [loading, setLoading] = useState(false);
  const [withBookingDate, setBookingDate] = useState(false);
  const [withUnbilled, setUnbilled] = useState(false);
  const [withDHL, setDHL] = useState(false);
  const [withDate, setDate] = useState(false);
  const [withBranchWise, setBranchWise] = useState(false);
  const [withConsignor, setConsignor] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  // Watch for customer code changes
  const customerCode = watch("customerCode");

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  // Auto-populate customer name when customer code changes
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (customerCode && customerCode.trim() !== "") {
        try {
          const response = await axios.get(
            `${server}/customer-account/${customerCode}`
          );

          if (response.data.success && response.data.data) {
            const name = response.data.data.name || "";
            setCustomerName(name);
            setValue("name", name);
          } else {
            setCustomerName("");
            setValue("name", "");
          }
        } catch (error) {
          console.error("Error fetching customer name:", error);
          setCustomerName("");
          setValue("name", "");
        }
      } else {
        setCustomerName("");
        setValue("name", "");
      }
    };

    fetchCustomerName();
  }, [customerCode, server, setValue]);

  const columns = useMemo(
    () => [
      { key: "AwbNo", label: "AWB No" },
      { key: "BookingDate", label: "Booking Date" },
      { key: "FlightDate", label: "Flight Date" },
      { key: "RunNo", label: "Run No" },
      { key: "HUB", label: "HUB" },
      { key: "ClubNo", label: "Club No" },
      { key: "Branch", label: "Branch" },
      { key: "State", label: "State" },
      { key: "City", label: "City" },
      { key: "Type", label: "Type" },
      { key: "SalePerson", label: "Sale Person" },
      { key: "RefrenceBy", label: "Reference By" },
      { key: "ManagedBy", label: "Managed By" },
      { key: "CollectionBy", label: "Collection By" },
      { key: "AccountManager", label: "Account Manager" },
      { key: "GM", label: "GM" },
      { key: "RM", label: "RM" },
      { key: "SM", label: "SM" },
      { key: "RateType", label: "Rate Type" },
      { key: "OpeningAccount", label: "Opening Account" },
      { key: "Currency", label: "Currency" },
      { key: "OriginName", label: "Origin Name" },
      { key: "Sector", label: "Sector" },
      { key: "DestinationCode", label: "Destination Code" },
      { key: "CustomerCode", label: "Customer Code" },
      { key: "CustomerName", label: "Customer Name" },
      { key: "ConsignorName", label: "Consignor Name" },
      { key: "ConsigneeName", label: "Consignee Name" },
      { key: "ConsigneeAddressLine1", label: "Consignee Address Line 1" },
      { key: "ConsigneeCity", label: "Consignee City" },
      { key: "ConsigneeState", label: "Consignee State" },
      { key: "ConsigneeZipCode", label: "Consignee Zip Code" },
      { key: "ConsigneePhoneNo", label: "Consignee Phone No" },
      { key: "ShipmentForwarderTo", label: "Shipment Forwarder To" },
      { key: "ShipmentForwardingNo", label: "Shipment Forwarding No" },
      { key: "ServiceType", label: "Service Type" },
      { key: "Pcs", label: "PCS" },
      { key: "GoodsDesc", label: "Goods Description" },
      { key: "ActWeight", label: "Actual Weight" },
      { key: "VolWeight", label: "Volumetric Weight" },
      { key: "VolDiscount", label: "Volume Discount" },
      { key: "ChgWeight", label: "Chargeable Weight" },
      { key: "BagWeight", label: "Bag Weight" },
      { key: "PaymentType", label: "Payment Type" },
      { key: "BillingTag", label: "Billing Tag" },
      { key: "BasicAmount", label: "Basic Amount" },
      { key: "DiscountPerKg", label: "Discount Per Kg" },
      { key: "DiscountAmt", label: "Discount Amount" },
      { key: "BasicAmtAfterDiscount", label: "Basic Amount After Discount" },
      { key: "RateHike", label: "Rate Hike" },
      { key: "SGST", label: "SGST" },
      { key: "CGST", label: "CGST" },
      { key: "IGST", label: "IGST" },
      { key: "Handling", label: "Handling" },
      { key: "OVWT", label: "Overweight" },
      { key: "Mischg", label: "Misc Charge" },
      { key: "MiscRemark", label: "Misc Remark" },
      { key: "Fuel", label: "Fuel" },
      { key: "NonTaxable", label: "Non Taxable" },
      { key: "GrandTotal", label: "Grand Total" },
      { key: "Currency1", label: "Currency 1" },
      { key: "BillNo", label: "Bill No" },
      { key: "CRAmount", label: "CR Amount" },
      { key: "CRBillNo", label: "CR Bill No" },
      { key: "AwbCheck", label: "AWB Check" },
      { key: "ShipmentRemark", label: "Shipment Remark" },
      { key: "CSB", label: "CSB" },
      { key: "HandlingTag", label: "Handling Tag" },
    ],
    []
  );

  const fetchSaleDetails = async () => {
    const formData = getValues();

    if (!formData.from || !formData.to) {
      setNotification({
        type: "error",
        message: "Please select both From and To dates",
        visible: true,
      });
      return;
    }

    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();

      // Ensure dates are in YYYY-MM-DD format
      const fromParsed = parseDateDDMMYYYY(formData.from);
      const toParsed = parseDateDDMMYYYY(formData.to);

      if (
        !fromParsed ||
        !toParsed ||
        isNaN(fromParsed.getTime()) ||
        isNaN(toParsed.getTime())
      ) {
        setNotification({
          type: "error",
          message: "Invalid date format",
          visible: true,
        });
        setLoading(false);
        return;
      }

      fromParsed.setHours(0, 0, 0, 0);
      toParsed.setHours(23, 59, 59, 999);

      params.append("from", fromParsed.toISOString());
      params.append("to", toParsed.toISOString());

      if (formData.runNumber) params.append("runNumber", formData.runNumber);
      if (formData.payment) params.append("payment", formData.payment);
      if (formData.branch) params.append("branch", formData.branch);
      if (formData.origin) params.append("origin", formData.origin);
      if (formData.sector) params.append("sector", formData.sector);
      if (formData.destination)
        params.append("destination", formData.destination);
      if (formData.network) params.append("network", formData.network);
      if (formData.counterPart)
        params.append("counterPart", formData.counterPart);
      if (formData.salePerson) params.append("salePerson", formData.salePerson);
      if (formData.saleRefPerson)
        params.append("saleRefPerson", formData.saleRefPerson);
      if (formData.company) params.append("company", formData.company);
      if (formData.state) params.append("state", formData.state);
      if (formData.accountManager)
        params.append("accountManager", formData.accountManager);
      if (formData.type) params.append("type", formData.type);
      if (formData.customerCode)
        params.append("customerCode", formData.customerCode);

      params.append("withBookingDate", withBookingDate.toString());
      params.append("withUnbilled", withUnbilled.toString());
      params.append("withDHL", withDHL.toString());
      params.append("withDate", withDate.toString());
      params.append("withBranchWise", withBranchWise.toString());
      params.append("withConsignor", withConsignor.toString());

      const response = await axios.get(
        `${server}/credit-note-awb-wise/sale-details?${params.toString()}`
      );

      if (response.data.success) {
        setRowData(response.data.data || []);
        setTotals(
          response.data.totals || {
            totalBagWeight: 0,
            totalWeight: 0,
            grandTotal: 0,
          }
        );
        setNotification({
          type: "success",
          message:
            response.data.message ||
            `Found ${response.data.data?.length || 0} records`,
          visible: true,
        });
      } else {
        setNotification({
          type: "error",
          message: response.data.message || "Failed to fetch data",
          visible: true,
        });
        setRowData([]);
        setTotals({ totalBagWeight: 0, totalWeight: 0, grandTotal: 0 });
      }
    } catch (error) {
      console.error("Error fetching sale details:", error);
      setNotification({
        type: "error",
        message:
          error.response?.data?.message ||
          "An error occurred while fetching data",
        visible: true,
      });
      setRowData([]);
      setTotals({ totalBagWeight: 0, totalWeight: 0, grandTotal: 0 });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (rowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to export",
        visible: true,
      });
      return;
    }

    try {
      const doc = new jsPDF("landscape");

      doc.setFontSize(18);
      doc.text("Credit Note AWB-Wise Sale Details Report", 14, 15);

      doc.setFontSize(10);
      const formData = getValues();
      doc.text(
        `Period: ${formData.from || ""} to ${formData.to || ""}`,
        14,
        22
      );

      const tableColumns = columns.map((col) => col.label);
      const tableRows = rowData.map((row) =>
        columns.map((col) => row[col.key] || "")
      );

      doc.autoTable({
        head: [tableColumns],
        body: tableRows,
        startY: 28,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [220, 53, 69] },
        margin: { top: 28 },
      });

      const finalY = doc.lastAutoTable.finalY || 28;
      doc.setFontSize(10);
      doc.text(
        `Total Bag Weight: ${totals.totalBagWeight.toFixed(2)}`,
        14,
        finalY + 10
      );
      doc.text(
        `Total Weight: ${totals.totalWeight.toFixed(2)}`,
        80,
        finalY + 10
      );
      doc.text(
        `Grand Total: ${totals.grandTotal.toFixed(2)}`,
        150,
        finalY + 10
      );

      doc.save("credit-note-sale-details-report.pdf");
      setNotification({
        type: "success",
        message: "PDF exported successfully",
        visible: true,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      setNotification({
        type: "error",
        message: "Failed to export PDF",
        visible: true,
      });
    }
  };

  const handleDownloadExcel = async () => {
    if (!rowData.length) {
      setNotification({
        type: "error",
        message: "No data to export",
        visible: true,
      });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sale Details");

    /* ================= TITLE ================= */
    worksheet.addRow(["Credit Note AWB-Wise Sale Details"]);
    worksheet.mergeCells(1, 1, 1, columns.length);

    const titleCell = worksheet.getCell("A1");
    titleCell.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDC3545" },
    };
    worksheet.getRow(1).height = 34;

    /* ================= HEADER ================= */
    worksheet.columns = columns.map((c) => ({
      header: c.label,
      key: c.key,
      width: Math.max(c.label.length + 6, 18),
    }));

    const headerRow = worksheet.getRow(2);
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
        fgColor: { argb: "FFDC3545" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    /* ================= DATA ================= */
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

    /* ================= TOTAL ================= */
    const totalRow = worksheet.addRow({
      AwbNo: "TOTAL",
      BagWeight: totals.totalBagWeight,
      ChgWeight: totals.totalWeight,
      GrandTotal: totals.grandTotal,
    });

    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F2F2" },
      };
      cell.border = {
        top: { style: "double" },
        bottom: { style: "double" },
      };
    });

    /* ================= FORMATTING ================= */
    ["ActWeight", "VolWeight", "ChgWeight", "BagWeight"].forEach((k) => {
      if (worksheet.getColumn(k)) worksheet.getColumn(k).numFmt = "0.00";
    });

    [
      "BasicAmount",
      "DiscountAmt",
      "BasicAmtAfterDiscount",
      "Fuel",
      "Handling",
      "GrandTotal",
    ].forEach((k) => {
      if (worksheet.getColumn(k)) worksheet.getColumn(k).numFmt = "#,##0.00";
    });

    /* ================= EXTRAS ================= */
    worksheet.views = [{ state: "frozen", ySplit: 2 }];
    worksheet.autoFilter = {
      from: "A2",
      to: worksheet.getRow(2).lastCell.address,
    };

    /* ================= EXPORT ================= */
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "credit-note-sale-details-report.xlsx"
    );

    setNotification({
      type: "success",
      message: "Excel exported successfully",
      visible: true,
    });
  };

  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to export",
        visible: true,
      });
      return;
    }

    try {
      const csvData = rowData.map((row) => {
        const rowObj = {};
        columns.forEach((col) => {
          rowObj[col.label] = row[col.key] || "";
        });
        return rowObj;
      });

      // Add totals row
      csvData.push({
        "AWB No": "TOTAL",
        "Bag Weight": totals.totalBagWeight.toFixed(2),
        "Chargeable Weight": totals.totalWeight.toFixed(2),
        "Grand Total": totals.grandTotal.toFixed(2),
      });

      const worksheet = XLSX.utils.json_to_sheet(csvData);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute("download", "credit-note-sale-details-report.csv");
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setNotification({
        type: "success",
        message: "CSV exported successfully",
        visible: true,
      });
    } catch (error) {
      console.error("Error exporting CSV:", error);
      setNotification({
        type: "error",
        message: "Failed to export CSV",
        visible: true,
      });
    }
  };

  const handlePrint = () => {
    if (rowData.length === 0) {
      setNotification({
        type: "error",
        message: "No data to print",
        visible: true,
      });
      return;
    }
    window.print();
  };

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            {/* Row 1 - 4 columns */}
            <div className="grid grid-cols-4 gap-3">
              <InputBox
                placeholder={`Run Number`}
                register={register}
                setValue={setValue}
                value={`runNumber`}
              />
              <LabeledDropdown
                options={["Paid", "ToPay", "FOC"]}
                title="Payment"
                register={register}
                setValue={setValue}
                value="payment"
              />
              <InputBox
                placeholder={`Branch`}
                register={register}
                setValue={setValue}
                value={`branch`}
              />
              <InputBox
                placeholder={`Origin`}
                register={register}
                setValue={setValue}
                value={`origin`}
              />
            </div>

            {/* Row 2 - 4 columns */}
            <div className="grid grid-cols-4 gap-3">
              <InputBox
                placeholder={`Sector`}
                register={register}
                setValue={setValue}
                value={`sector`}
              />
              <InputBox
                placeholder={`Destination`}
                register={register}
                setValue={setValue}
                value={`destination`}
              />
              <InputBox
                placeholder={`Network`}
                register={register}
                setValue={setValue}
                value={`network`}
              />
              <InputBox
                placeholder={`Counter Part`}
                register={register}
                setValue={setValue}
                value={`counterPart`}
              />
            </div>

            {/* Row 3 - 4 columns */}
            <div className="grid grid-cols-4 gap-3">
              <LabeledDropdown
                options={["Person 1", "Person 2", "Person 3"]}
                title="Sale Person"
                register={register}
                setValue={setValue}
                value="salePerson"
              />
              <LabeledDropdown
                options={["Person 1", "Person 2", "Person 3"]}
                title="Sale Ref. Person"
                register={register}
                setValue={setValue}
                value="saleRefPerson"
              />
              <InputBox
                placeholder={`Company`}
                register={register}
                setValue={setValue}
                value={`company`}
              />
              <InputBox
                placeholder={`State`}
                register={register}
                setValue={setValue}
                value={`state`}
              />
            </div>

            {/* Row 4 - 4 columns */}
            <div className="grid grid-cols-4 gap-3">
              <LabeledDropdown
                options={["Manager 1", "Manager 2", "Manager 3"]}
                title="Account Manager"
                register={register}
                setValue={setValue}
                value="accountManager"
              />
              <LabeledDropdown
                options={["Document", "Non-Document"]}
                title="Type"
                register={register}
                setValue={setValue}
                value="type"
              />
              <InputBox
                placeholder={`Customer Code`}
                register={register}
                setValue={setValue}
                value={`customerCode`}
              />
              <DummyInputBoxWithLabelDarkGray
                placeholder={"Customer Name"}
                register={register}
                setValue={setValue}
                value={"name"}
              />
            </div>
            <div className="grid grid-cols-4 gap-3">
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
              <div className="">
                <OutlinedButtonRed
                  type="button"
                  label={loading ? "Loading..." : "Show"}
                  onClick={fetchSaleDetails}
                  disabled={loading}
                />
              </div>
              <div>
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
            setChecked={setBranchWise}
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
            className={`border-b-0 rounded-b-none h-[35vh]`}
          />
          <div className="flex justify-end border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 text-gray-900 bg-[#D0D5DDB8] rounded rounded-t-none font-sans px-4 py-2 gap-16">
            <div>
              <span className="font-sans">Total Bag Weight: </span>
              <span className="text-red">
                {totals.totalBagWeight.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="font-sans">Total Weight: </span>
              <span className="text-red">{totals.totalWeight.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-16">
                <div>
                  Grand Total:{" "}
                  <span className="text-red">
                    {totals.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between">
          <div>{/* <OutlinedButtonRed type="button" label={"Close"} /> */}</div>
          <div className="flex gap-2">
            {/* <OutlinedButtonRed
              type="button"
              label={"Print"}
              onClick={(e) => {
                e.preventDefault();
                handlePrint();
              }}
            /> */}
          </div>
        </div>
      </form>
    </>
  );
}

export default SaleDetails;
