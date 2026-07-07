"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import AwbWise from "@/app/components/offload-shipment/AwbWise";
import RunWise from "@/app/components/offload-shipment/RunWise";
import Modal from "@/app/components/Modal";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DateInputBox } from "@/app/components/InputBox";
import { SimpleButton } from "@/app/components/Buttons";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import * as XLSX from "xlsx";
import { subDays, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "react-hot-toast";

function OffloadShipment() {
  const { register, setValue, reset, watch, getValues } = useForm();
  const { server } = useContext(GlobalContext);
  const [demoRadio, setDemoRadio] = useState("AWB Wise");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 🔄 Refresh (keep tab, clear child + parent form)
  const handleRefresh = () => {
    reset();
    setRefreshKey((prev) => prev + 1);
  };
  const dateFilters = [
    { label: "This Month", value: "this_month" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "Month Name", value: "month_name" },
    { label: "Last Financial Year", value: "last_fy" },
    { label: "Custom", value: "custom" },
  ];

  const selectedRange = watch("dateRange");

  // Handle dropdown value changes to auto-populate dates
  useEffect(() => {
    if (selectedRange) {
      const today = new Date();
      if (selectedRange === "This Month") {
        setValue("fromDate", startOfMonth(today).toISOString().split("T")[0]);
        setValue("toDate", endOfMonth(today).toISOString().split("T")[0]);
      } else if (selectedRange === "Last 7 Days") {
        setValue("fromDate", subDays(today, 6).toISOString().split("T")[0]);
        setValue("toDate", today.toISOString().split("T")[0]);
      } else if (selectedRange === "Last Financial Year") {
        const currentYear = today.getFullYear();
        const lastFYStart = new Date(currentYear - 1, 3, 1);
        const lastFYEnd = new Date(currentYear, 2, 31);
        setValue("fromDate", lastFYStart.toISOString().split("T")[0]);
        setValue("toDate", lastFYEnd.toISOString().split("T")[0]);
      } else if (selectedRange === "Month Name") {
        setValue("fromDate", startOfMonth(today).toISOString().split("T")[0]);
        setValue("toDate", endOfMonth(today).toISOString().split("T")[0]);
      } else if (selectedRange === "Custom") {
        setValue("fromDate", "");
        setValue("toDate", "");
      }
    }
  }, [selectedRange, setValue]);

  const handleDownload = async () => {
    const fromDate = getValues("fromDate");
    const toDate = getValues("toDate");

    if (!fromDate || !toDate) {
      toast.error("Please select both 'From' and 'To' dates");
      return;
    }

    setDownloading(true);
    try {
      const response = await axios.get(
        `${server}/offload-shipment/report?fromDate=${fromDate}&toDate=${toDate}`
      );

      if (response.data.success) {
        const reportData = response.data.data;

        if (reportData.length === 0) {
          toast.error("No offloaded shipments found for this date range");
          return;
        }

        const formatDate = (val) => {
          if (!val) return "";
          const d = new Date(val);
          if (isNaN(d.getTime())) return "";
          return d.toLocaleDateString("en-GB"); // Format as DD/MM/YYYY
        };

        // Format data for Excel
        const excelData = reportData.map((row, index) => ({
          "Sr No.": index + 1,
          "AWB No": row.awbNo || "",
          "Offload Date": formatDate(row.offloadDate),
          "Offload Time": row.offloadTime || "",
          "Offload Reason": row.offloadReason || "",
          
          // Booking Report columns
          "Shipment Date": formatDate(row.createdAt),
          "Run No": row.runNo || "",
          "Bag No": row.bagNo || "",
          "Flight Date": row.flight || "",
          "Manifest Number": row.manifestNo || "",
          "Branch": row.branch || "",
          "Origin Name": row.origin || "",
          "Sector": row.sector || "",
          "DestinationName": row.destination || "",
          "CustomerCode": row.accountCode || "",
          "Customer Name": row.name || "",
          "Sales Person Name": row.salesPersonName || "",
          "ConsigneeName": row.receiverFullName || "",
          "ConsigneeAddressLine1": row.receiverAddressLine1 || "",
          "ConsigneeCity": row.receiverCity || "",
          "ConsigneeState": row.receiverState || "",
          "ConsigneeZipCode": row.receiverPincode || "",
          "ConsigneePhoneNo": row.receiverPhoneNumber || "",
          "Service": row.service || "",
          "UPSService": row.upsService || "",
          "ShipmentForwarderTo": row.shipmentForwarderTo || "",
          "ShipmentForwardingNo": row.shipmentForwardingNo || "",
          "PaymentType": row.payment || "",
          "Pcs": row.pcs || "",
          "Goods Type": row.goodstype || "",
          "Actual Weight": row.totalActualWt || "",
          "Volume Weight": row.totalVolWt || "",
          "Volumetric Discount": row.volDisc || "",
          "Chargeable Wt": row.chargeableWt || "",
          "Shipment Content": row.content || "",
          "Custom Value": row.totalInvoiceValue || "",
          "Currency": row.currency || "",
          "ContainerNo": row.containerNo || "",
          "Hold Shipment": row.isHold || "No",
          "Hold Reason": row.holdReason || "",
          "Hold Reason 2": row.otherHoldReason || "",
          "Unhold Date": formatDate(row.unholdDate),
          "CSB": row.csb || "",
          "User Branch": row.userBranch || "",
          "Insert User": row.insertUser || "",
          "LocalMfNo": row.localMfNo || "",
          "Entry Type": row.entryType || "",
          "Quick Inscan": row.isQuickInscan || "No",
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Offload Shipments");

        // Set column widths dynamically or predefined
        const colWidths = Object.keys(excelData[0] || {}).map((key) => {
          if (key === "Offload Reason" || key === "ConsigneeAddressLine1") return { wch: 35 };
          if (key === "Customer Name" || key === "Email") return { wch: 25 };
          return { wch: 15 };
        });
        ws["!cols"] = colWidths;

        XLSX.writeFile(wb, `offload report ( ${fromDate} to ${toDate} ).xlsx`);
        toast.success("Report downloaded successfully");
        setShowDownloadModal(false);
      } else {
        toast.error("Failed to fetch report data");
      }
    } catch (error) {
      console.error("Error downloading report:", error);
      toast.error(error.response?.data?.message || "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-9">
      <Heading
        title="Offload Shipment"
        bulkUploadBtn="hidden"
        tableReportBtn
        codeListBtn="hidden"
        fullscreenBtn={false}
        onRefresh={handleRefresh}
        onClickTableReportBtn={() => setShowDownloadModal(true)}
      />

      <div className="flex w-full gap-3">
        <RadioButtonLarge
          id="AWB Wise"
          label="AWB Wise"
          name="offload-shipment"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          id="Run Wise"
          label="Run Wise"
          name="offload-shipment"
          register={register}
          setValue={setValue}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>
      {showDownloadModal && (
        <Modal
          title="Offload Shipment Report"
          onClose={() => setShowDownloadModal(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-end">

              <LabeledDropdown
                options={dateFilters.map((option) => option.label)}
                register={register}
                setValue={setValue}
                title="Date Range"
                value="dateRange"
              />

              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                value="fromDate"
                disabled={selectedRange !== "Custom"}
              />

              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                value="toDate"
                disabled={selectedRange !== "Custom"}
              />
              <div>
                <SimpleButton
                  name={downloading ? "Downloading..." : "Download"}
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
      {demoRadio === "AWB Wise" && <AwbWise key={`details-${refreshKey}`} />}
      {demoRadio === "Run Wise" && <RunWise key={`summary-${refreshKey}`} />}
    </div>
  );
}

export default OffloadShipment;
