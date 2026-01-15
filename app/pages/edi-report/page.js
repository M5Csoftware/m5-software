"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import Table, { TableWithSorting } from "@/app/components/Table";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

const EdiReport = () => {
  const { register, setValue, watch } = useForm();
  const [rowData, setRowData] = useState([]);
  const [csbFile, setCsbFile] = useState(false);
  const [loading, setLoading] = useState(false);
  const { server } = useContext(GlobalContext);
  const [resetFactor, setResetFactor] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const runNumber = watch("runNumber");

  const columns = [
    { key: "HAWBNumber", label: "HAWB Number" },
    { key: "ConsignorName", label: "Consignor Name" },
    { key: "ConsignorAddress1", label: "Consignor Address 1" },
    { key: "ConsignorAddress2", label: "Consignor Address 2" },
    { key: "ConsignorCity", label: "Consignor City" },
    { key: "ConsignorState", label: "Consignor State" },
    { key: "ConsignorPostalCode", label: "Consignor Postal Code" },
    { key: "ConsignorCountry", label: "Consignor Country" },
    { key: "ConsigneeName", label: "Consignee Name" },
    { key: "ConsigneeAddress1", label: "Consignee Address 1" },
    { key: "ConsigneeAddress2", label: "Consignee Address 2" },
    { key: "ConsigneeCity", label: "Consignee City" },
    { key: "ConsigneeState", label: "Consignee State" },
    { key: "ConsigneePostalCode", label: "Consignee Postal Code" },
    { key: "ConsigneeCountry", label: "Consignee Country" },
    { key: "PKG", label: "PKG" },
    { key: "Weight", label: "Weight" },
    { key: "DescriptionofGoods", label: "Description of Goods" },
    { key: "Value", label: "Value" },
    { key: "ExportInvoiceNo", label: "Export Invoice No" },
    { key: "GSTInvoiceNo", label: "GST Invoice No" },
    { key: "InvoiceValue", label: "Invoice Value" },
    { key: "CurrencyType", label: "Currency Type" },
    { key: "PayType", label: "Pay Type" },
    { key: "IGSTPaid", label: "IGST Paid" },
    { key: "Bond", label: "Bond" },
    { key: "MHBSNo", label: "MHBS No" },
    { key: "GSTINType", label: "GSTIN Type" },
    { key: "GSTINNumber", label: "GSTIN Number" },
    { key: "GSTDate", label: "GST Date" },
    { key: "ExportDate", label: "Export Date" },
    { key: "ADCode", label: "AD Code" },
    { key: "CRN_NO", label: "CRN NO" },
    { key: "CRN_MHBS_NO", label: "CRN MHBS NO" },
  ];

  // Function to fetch data based on runNo using axios
  const fetchDataByRunNo = async () => {
    if (!runNumber || runNumber.trim() === "") {
      alert("Please enter a Run Number");
      showNotification("error", "Please enter a Run Number");
      return;
    }

    setLoading(true);
    try {
      // Fetch data from the get-shipment API filtered by runNo
      const response = await axios.get(
        `${server}/portal/get-shipments?runNo=${runNumber}`
      );

      // Extract shipments array from response
      const allData = response.data.shipments || [];

      if (!allData || allData.length === 0) {
        alert("No data found for the entered Run Number");
        showNotification("error", "No data found for the entered Run Number");
        setRowData([]);
        return;
      }

      // Transform the database data to match your table structure
      const transformedData = allData.map((item) => ({
        HAWBNumber: item.awbNo || "",
        ConsignorName: item.shipperFullName || "",
        ConsignorAddress1: item.shipperAddressLine1 || "",
        ConsignorAddress2: item.shipperAddressLine2 || "",
        ConsignorCity: item.shipperCity || "",
        ConsignorState: item.shipperState || "",
        ConsignorPostalCode: item.shipperPincode || "",
        ConsignorCountry: item.shipperCountry || "India",
        ConsigneeName: item.receiverFullName || "",
        ConsigneeAddress1: item.receiverAddressLine1 || "",
        ConsigneeAddress2: item.receiverAddressLine2 || "",
        ConsigneeCity: item.receiverCity || "",
        ConsigneeState: item.receiverState || "",
        ConsigneePostalCode: item.receiverPincode || "",
        ConsigneeCountry: item.receiverCountry || "India",
        PKG: item.pcs || "",
        Weight: item.totalActualWt || "",
        DescriptionofGoods: item.content || "",
        Value: item.totalInvoiceValue || "",
        ExportInvoiceNo: item.awbNo || "",
        GSTInvoiceNo: item.awbNo || "",
        InvoiceValue: item.totalInvoiceValue || "",
        CurrencyType: item.currency || item.currencys || "",
        PayType: "N",
        IGSTPaid: item.igst || "0",
        Bond: "NA",
        MHBSNo: item.alMawb || "",
        GSTINType: item.shipperKycType || "",
        GSTINNumber: item.shipperKycNumber || "",
        GSTDate: item.createdAt
          ? new Date(item.createdAt).toLocaleDateString()
          : "",
        ExportDate: item.date ? new Date(item.date).toLocaleDateString() : "",
        ADCode: "",
        CRN_NO: item.awbNo || "",
        CRN_MHBS_NO: "",
        csb: item.csb || false, // Store csb flag for filtering
      }));

      setRowData(transformedData);
      showNotification("success", `Found ${transformedData.length} shipments`);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response) {
        showNotification(
          "error",
          `Error: ${error.response.status} - ${error.response.statusText}`
        );
      } else if (error.request) {
        showNotification(
          "error",
          "Network error. Please check if the server is running."
        );
      } else {
        showNotification("error", "Error fetching data. Please try again.");
      }
      setRowData([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter data for CSB file if checkbox is checked
  const filteredData = useMemo(() => {
    if (csbFile) {
      return rowData.filter((item) => item.csb === true);
    }
    return rowData;
  }, [rowData, csbFile]);

  // Function to download data as CSV
  const downloadCSV = () => {
    if (filteredData.length === 0) {
      showNotification("error", "No data available to download");
      return;
    }

    // Create CSV headers
    const headers = columns.map((col) => col.label).join(",");

    // Create CSV rows
    const csvRows = filteredData.map((row) =>
      columns
        .map((col) => {
          const value = row[col.key] || "";
          // Escape commas and quotes in values
          const escapedValue =
            value.toString().includes(",") || value.toString().includes('"')
              ? `"${value.toString().replace(/"/g, '""')}"`
              : value;
          return escapedValue;
        })
        .join(",")
    );

    // Combine headers and rows
    const csvContent = [headers, ...csvRows].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `EDI_Report_${runNumber || "data"}_${
          new Date().toISOString().split("T")[0]
        }.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    showNotification("success", "Downloaded successfully");
  };

  const handleRefresh = () => {
    setResetFactor((prev) => prev + 1);
    setRowData([]); // Clear the table data
    showNotification("success", "Refreshed successfully");
  };

  return (
    <form className="flex flex-col gap-[34px]">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title={`EDI Report`}
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <InputBox
            placeholder="Run Number"
            register={register}
            setValue={setValue}
            value="runNumber"
            resetFactor={resetFactor}
          />

          <div>
            <OutlinedButtonRed
              label={loading ? "Loading..." : "Show"}
              onClick={fetchDataByRunNo}
              disabled={loading}
            />
          </div>
          <div>
            <SimpleButton
              name={"Download CSV"}
              onClick={downloadCSV}
              disabled={filteredData.length === 0}
            />
          </div>
        </div>

        <div>
          <RedCheckbox
            isChecked={csbFile}
            setChecked={setCsbFile}
            id="csbfile"
            register={register}
            setValue={setValue}
            label={"CSB File"}
          />
        </div>

        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            name="ediReportTable"
            columns={columns}
            rowData={filteredData}
            className={`h-[50vh]`}
          />
        </div>

        <div className="flex justify-between">
          <div>{/* <OutlinedButtonRed label={"Close"} /> */}</div>

          <div>
            <div className="flex gap-3">
              <div>{/* <OutlinedButtonRed label={"Print"} /> */}</div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EdiReport;
