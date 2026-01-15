"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { InputBoxYellow } from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import RedCheckbox from "@/app/components/RedCheckBox";
import Table from "@/app/components/Table";
import React, { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

export default function BagReport() {
  const [reportType, setReportType] = useState("Shipper");
  const { register, setValue, watch } = useForm();
  const [tableData, setTableData] = useState([]);
  const [skipShipper, setSkipShipper] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runData, setRunData] = useState(null);
  const { server } = useContext(GlobalContext);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const runNumber = watch("runNo");

  // Table columns configuration
  const columns = {
    Shipper: [
      { key: "awbNo", label: "AWB No." },
      { key: "date", label: "Date" },
      { key: "bagNo", label: "Bag No." },
      { key: "weight", label: "Weight" },
      { key: "shipperName", label: "Shipper Name" },
      { key: "shipperAddress", label: "Shipper Address" },
      { key: "shipperPhone", label: "Shipper Phone" },
      { key: "destination", label: "Destination" },
      { key: "state", label: "State" },
      { key: "zipCode", label: "ZipCode" },
      { key: "service", label: "Service" },
      { key: "forwardingNo", label: "ForwardingNo" },
      { key: "shipmentRemark", label: "ShipmentRemark" },
    ],
    Consignee: [
      { key: "mawbNo", label: "MawbNo" },
      { key: "awbNo", label: "AwbNo" },
      { key: "date", label: "Date" },
      { key: "bagNo", label: "BagNo" },
      { key: "weight", label: "Weight" },
      { key: "shipper", label: "Shipper" },
      { key: "consignee", label: "Consignee" },
      { key: "destination", label: "Destination" },
      { key: "state", label: "State" },
      { key: "zipCode", label: "ZipCode" },
      { key: "service", label: "Service" },
      { key: "forwardingNo", label: "ForwardingNo" },
      { key: "shipmentRem", label: "ShipmentRem" },
    ],
    Summary: [
      { key: "srNo", label: "SrNo." },
      { key: "countAwbNo", label: "Count AwbNo" },
      { key: "bagNo", label: "BagNo" },
      { key: "bagWeight", label: "BagWeight" },
    ],
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Get filtered columns based on report type and skipShipper checkbox
  const getFilteredColumns = () => {
    const cols = columns[reportType];

    // If Consignee report and skipShipper is checked, filter out the "shipper" column
    if (reportType === "Consignee" && skipShipper) {
      return cols.filter((col) => col.key !== "shipper");
    }

    return cols;
  };

  // CSV Download Function
  const handleDownloadCSV = () => {
    if (tableData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const filteredColumns = getFilteredColumns();

    // Create CSV header
    const headers = filteredColumns.map((col) => col.label).join(",");

    // Create CSV rows
    const rows = tableData
      .map((row) => {
        return filteredColumns
          .map((col) => {
            const value = row[col.key] || "";
            // Escape values that contain commas, quotes, or newlines
            const stringValue = String(value);
            if (
              stringValue.includes(",") ||
              stringValue.includes('"') ||
              stringValue.includes("\n")
            ) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(",");
      })
      .join("\n");

    // Combine headers and rows
    const csv = `${headers}\n${rows}`;

    // Create blob and download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    // Generate filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `Bag_Report_${reportType}_${
      runNumber || "data"
    }_${timestamp}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success notification
    showNotification("success", "CSV file downloaded successfully");
  };

  // API calls
  const fetchRunData = async (runNo) => {
    const response = await axios.get(`${server}/run-entry?runNo=${runNo}`);
    return response.data;
  };

  const fetchShipmentData = async (runNo) => {
    const response = await axios.get(
      `${server}/portal/create-shipment?runNo=${runNo}`
    );
    return Array.isArray(response.data)
      ? response.data.filter((item) => item.runNo === runNo)
      : response.data
      ? [response.data]
      : [];
  };

  const fetchBaggingData = async (runNo) => {
    const response = await axios.get(`${server}/bagging?runNo=${runNo}`);
    return response.data;
  };

  const fetchBranchBaggingData = async (runNo) => {
    const response = await axios.get(`${server}/branch-bagging?runNo=${runNo}`);
    return response.data;
  };

  // Data mapping functions
  const createBaggingLookup = (baggingData, branchBaggingData) => {
    const lookup = {};

    // Process regular bagging data
    if (baggingData && baggingData.rowData) {
      baggingData.rowData.forEach((item) => {
        const awb = item.awbNo || item.childShipment;
        if (awb) {
          lookup[awb] = {
            bagNo: item.bagNo,
            mhbsNo: baggingData.mhbsNo,
          };
        }
      });
    }

    // Process branch bagging data
    if (branchBaggingData && branchBaggingData.rowData) {
      branchBaggingData.rowData.forEach((item) => {
        const awb = item.awbNo || item.childShipment;
        if (awb) {
          lookup[awb] = {
            bagNo: item.bagNo,
            mhbsNo: branchBaggingData.mawb || "",
          };
        }
      });
    }

    return lookup;
  };

  const mapShipperData = (shipmentData, baggingLookup) => {
    return shipmentData.map((item) => {
      const baggingInfo = baggingLookup[item.awbNo] || {};
      return {
        awbNo: item.awbNo || "",
        date: item.date ? new Date(item.date).toLocaleDateString("en-GB") : "",
        bagNo: baggingInfo.bagNo || "",
        weight: item.totalActualWt || "",
        shipperName: item.shipperFullName || "",
        shipperAddress: [
          item.shipperAddressLine1,
          item.shipperAddressLine2,
          item.shipperCity,
          item.shipperState,
          item.shipperPincode,
        ]
          .filter(Boolean)
          .join(", "),
        shipperPhone: item.shipperPhoneNumber || "",
        destination: item.destination || item.receiverCity || "",
        state: item.receiverState || "",
        zipCode: item.receiverPincode || "",
        service: item.service || "",
        forwardingNo: item.reference || "",
        shipmentRemark: item.shipmentType || "",
      };
    });
  };

  const mapConsigneeData = (shipmentData, baggingLookup) => {
    return shipmentData.map((item) => {
      const baggingInfo = baggingLookup[item.awbNo] || {};
      return {
        mawbNo: baggingInfo.mhbsNo || "",
        awbNo: item.awbNo || "",
        date: item.date ? new Date(item.date).toLocaleDateString("en-GB") : "",
        bagNo: baggingInfo.bagNo || "",
        weight: item.totalActualWt || "",
        shipper: item.shipperFullName || "",
        consignee: item.receiverFullName || item.receiverName || "",
        destination: item.destination || item.receiverCity || "",
        state: item.receiverState || "",
        zipCode: item.receiverPincode || "",
        service: item.service || "",
        forwardingNo: item.reference || "",
        shipmentRem: item.shipmentType || item.remarks || "",
      };
    });
  };

  const mapSummaryData = (baggingData, branchBaggingData) => {
    const bagSummary = {};

    // Process regular bagging data
    if (baggingData && baggingData.rowData) {
      baggingData.rowData.forEach((item) => {
        if (item.bagNo) {
          if (!bagSummary[item.bagNo]) {
            bagSummary[item.bagNo] = {
              bagNo: item.bagNo,
              countAwbNo: 0,
              bagWeight: 0,
            };
          }
          bagSummary[item.bagNo].countAwbNo += 1;
          bagSummary[item.bagNo].bagWeight += parseFloat(item.bagWeight) || 0;
        }
      });
    }

    // Process branch bagging data
    if (branchBaggingData && branchBaggingData.rowData) {
      branchBaggingData.rowData.forEach((item) => {
        if (item.bagNo) {
          if (!bagSummary[item.bagNo]) {
            bagSummary[item.bagNo] = {
              bagNo: item.bagNo,
              countAwbNo: 0,
              bagWeight: 0,
            };
          }
          bagSummary[item.bagNo].countAwbNo += 1;
          bagSummary[item.bagNo].bagWeight += parseFloat(item.bagWeight) || 0;
        }
      });
    }

    return Object.values(bagSummary).map((bag, index) => ({
      srNo: index + 1,
      countAwbNo: bag.countAwbNo,
      bagNo: bag.bagNo,
      bagWeight: bag.bagWeight.toFixed(2),
    }));
  };

  // Main data fetching function
  const handleShowData = async () => {
    if (!runNumber?.trim()) {
      console.log("Run number is empty");
      showNotification("error", "Please enter a run number");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching data for run number:", runNumber);

      if (reportType === "Summary") {
        const [baggingData, branchBaggingData] = await Promise.all([
          fetchBaggingData(runNumber).catch(() => null),
          fetchBranchBaggingData(runNumber).catch(() => null),
        ]);
        setTableData(mapSummaryData(baggingData, branchBaggingData));
      } else {
        const [shipmentData, baggingData, branchBaggingData] =
          await Promise.all([
            fetchShipmentData(runNumber),
            fetchBaggingData(runNumber).catch(() => null),
            fetchBranchBaggingData(runNumber).catch(() => null),
          ]);

        const baggingLookup = createBaggingLookup(
          baggingData,
          branchBaggingData
        );

        if (reportType === "Shipper") {
          setTableData(mapShipperData(shipmentData, baggingLookup));
        } else {
          setTableData(mapConsigneeData(shipmentData, baggingLookup));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setTableData([]);
      showNotification("error", "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Form auto-fill from run data
  const fillFormFromRunData = (runData) => {
    const fields = {
      date: formatDate(runData.date),
      sector: runData.sector || "",
      counterpart: runData.counterpart || "",
      flight: runData.flight || runData.flightnumber || "",
      obc: runData.obc || "",
      almawb: runData.almawb || "",
    };

    Object.entries(fields).forEach(([key, value]) => setValue(key, value));
  };

  // Fetch run data when runNumber changes
  useEffect(() => {
    const fetchAndFillRunData = async () => {
      if (runNumber?.trim()) {
        try {
          const fetchedRunData = await fetchRunData(runNumber);
          setRunData(fetchedRunData);
          fillFormFromRunData(fetchedRunData);
        } catch (error) {
          console.error("Error fetching run data:", error);
          setRunData(null);
          ["sector", "date", "counterpart", "flight", "obc", "almawb"].forEach(
            (field) => setValue(field, "")
          );
          setTableData([]);
        }
      } else {
        setRunData(null);
        ["sector", "date", "counterpart", "flight", "obc", "almawb"].forEach(
          (field) => setValue(field, "")
        );
        setTableData([]);
      }
    };

    fetchAndFillRunData();
  }, [runNumber, setValue]);

  const handleReportTypeChange = (value) => {
    setReportType(value);
    setTableData([]);
  };

  return (
    <form className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading title="Bag Report" bulkUploadBtn="hidden" codeListBtn="hidden" />

      <div>
        {/* Report Type Selection */}
        <div className="flex w-full gap-3 mt-3">
          {["Shipper", "Consignee", "Summary"].map((type) => (
            <RadioButtonLarge
              key={type}
              id={type}
              label={type}
              name="reportType"
              register={register}
              setValue={setValue}
              selectedValue={reportType}
              setSelectedValue={handleReportTypeChange}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 mt-3">
          {/* Run Details Form */}
          <div className="flex flex-col gap-3 mt-3">
            <RedLabelHeading label="Run Details" />

            <div className="flex flex-col gap-3">
              {/* First Row */}
              <div className="flex gap-3 w-full">
                <InputBoxYellow
                  placeholder="Run Number"
                  register={register}
                  setValue={setValue}
                  value="runNo"
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Sector"
                  register={register}
                  setValue={setValue}
                  value="sector"
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Date"
                  register={register}
                  setValue={setValue}
                  value="date"
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Counterpart"
                  register={register}
                  setValue={setValue}
                  value="counterpart"
                />
              </div>

              {/* Second Row - Fixed with equal spacing and proper alignment */}
              <div className="flex gap-3 w-full justify-between items-center">
                <div className="flex gap-3 flex-1">
                  <DummyInputBoxWithLabelDarkGray
                    label="Flight"
                    register={register}
                    setValue={setValue}
                    value="flight"
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="OBC"
                    register={register}
                    setValue={setValue}
                    value="obc"
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="A/L Mawb"
                    register={register}
                    setValue={setValue}
                    value="almawb"
                  />
                </div>

                <div className="flex gap-3 w-[24%]">
                  <OutlinedButtonRed
                    label={loading ? "Loading..." : "Show"}
                    onClick={handleShowData}
                    type="button"
                    disabled={loading}
                  />
                  <SimpleButton
                    name="Download"
                    onClick={handleDownloadCSV}
                    type="button"
                  />
                </div>
              </div>

              {/* Skip Shipper Checkbox for Consignee */}
              {reportType === "Consignee" && (
                <RedCheckbox
                  isChecked={skipShipper}
                  setChecked={setSkipShipper}
                  id="skipShipper"
                  register={register}
                  setValue={setValue}
                  label="Skip Shipper"
                />
              )}

              {/* Data Table */}
              <Table
                columns={getFilteredColumns()}
                rowData={tableData}
                register={register}
                setValue={setValue}
                name="begReportTable"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div>{/* <OutlinedButtonRed label="Close" /> */}</div>
          </div>
        </div>
      </div>
    </form>
  );
}
