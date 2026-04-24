"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { InputBoxYellow } from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import RedCheckbox from "@/app/components/RedCheckBox";
import Table from "@/app/components/Table";
import React, { useState, useEffect, useContext, useMemo } from "react";
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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50);
  const [currentFilters, setCurrentFilters] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const runNumber = watch("runNo");

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
      { key: "forwardingNo", label: "Forwarding No." },
      { key: "shipmentRemark", label: "Shipment Remarks" },
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
      { key: "forwardingNo", label: "Forwarding No." },
      { key: "shipmentRemark", label: "Shipment Remarks" },
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

  const getFilteredColumns = () => {
    const cols = columns[reportType];
    if (reportType === "Consignee" && skipShipper) {
      return cols.filter((col) => col.key !== "shipper");
    }
    return cols;
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    handleShowData(currentFilters, newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      setCurrentPage(1);
      handleShowData(currentFilters, 1);
    }
  };

  const handleDownloadCSV = () => {
    if (tableData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const filteredColumns = getFilteredColumns();
    const headers = filteredColumns.map((col) => col.label).join(",");
    const rows = tableData
      .map((row) =>
        filteredColumns
          .map((col) => {
            const value = row[col.key] || "";
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
          .join(","),
      )
      .join("\n");

    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, -5);
    const filename = `Bag_Report_${reportType}_${runNumber || "data"}_${timestamp}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("success", "CSV file downloaded successfully");
  };

  const fetchRunData = async (runNo) => {
    const response = await axios.get(
      `${server}/run-entry?runNo=${runNo.toUpperCase()}`,
    );
    return response.data;
  };

  const fetchShipmentData = async (runNo, page = 1) => {
    const response = await axios.get(
      `${server}/portal/create-shipment?runNo=${runNo.toUpperCase()}&page=${page}&limit=${pageLimit}`,
    );
    return response.data;
  };

  const fetchBaggingData = async (runNo) => {
    const response = await axios.get(
      `${server}/bagging?runNo=${runNo.toUpperCase()}`,
    );
    return response.data;
  };

  const fetchBranchBaggingData = async (runNo) => {
    const response = await axios.get(
      `${server}/branch-bagging?runNo=${runNo.toUpperCase()}`,
    );
    return response.data;
  };

  const createBaggingLookup = (baggingData, branchBaggingData) => {
    const lookup = {};
    if (baggingData && baggingData.rowData) {
      baggingData.rowData.forEach((item) => {
        const awb = item.awbNo || item.childShipment;
        if (awb)
          lookup[awb] = { bagNo: item.bagNo, mhbsNo: baggingData.mhbsNo };
      });
    }
    if (branchBaggingData && branchBaggingData.rowData) {
      branchBaggingData.rowData.forEach((item) => {
        const awb = item.awbNo || item.childShipment;
        if (awb)
          lookup[awb] = {
            bagNo: item.bagNo,
            mhbsNo: branchBaggingData.mawb || "",
          };
      });
    }
    return lookup;
  };

  const mapShipperData = (shipmentData, baggingLookup) =>
    shipmentData.map((item) => {
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
        forwardingNo: item.forwardingNo || item.reference || "",
        shipmentRemark: item.shipmentType || "",
      };
    });

  const mapConsigneeData = (shipmentData, baggingLookup) =>
    shipmentData.map((item) => {
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
        forwardingNo: item.forwardingNo || item.reference || "",
        shipmentRem: item.shipmentType || item.remarks || "",
      };
    });

  const mapSummaryData = (baggingData, branchBaggingData) => {
    const bagSummary = {};
    if (baggingData && baggingData.rowData) {
      baggingData.rowData.forEach((item) => {
        if (item.bagNo) {
          if (!bagSummary[item.bagNo])
            bagSummary[item.bagNo] = {
              bagNo: item.bagNo,
              countAwbNo: 0,
              bagWeight: 0,
            };
          bagSummary[item.bagNo].countAwbNo += 1;
          bagSummary[item.bagNo].bagWeight += parseFloat(item.bagWeight) || 0;
        }
      });
    }
    if (branchBaggingData && branchBaggingData.rowData) {
      branchBaggingData.rowData.forEach((item) => {
        if (item.bagNo) {
          if (!bagSummary[item.bagNo])
            bagSummary[item.bagNo] = {
              bagNo: item.bagNo,
              countAwbNo: 0,
              bagWeight: 0,
            };
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

  // ─── Fix: onClick passes a SyntheticEvent as first arg.
  //     Detect and discard it, always resolving runNo from form state.
  const handleShowData = async (runNumOrEvent = runNumber, page = 1) => {
    const isEvent =
      runNumOrEvent !== null &&
      typeof runNumOrEvent === "object" &&
      ("nativeEvent" in runNumOrEvent || "target" in runNumOrEvent);

    const runNum = isEvent ? runNumber : runNumOrEvent;
    const queryRunNo = typeof runNum === "string" ? runNum.trim() : "";

    if (!queryRunNo) {
      showNotification("error", "Please enter a run number");
      return;
    }

    try {
      setLoading(true);
      setCurrentFilters(queryRunNo);

      let newTableData = [];
      let pagination = { currentPage: 1, totalPages: 1, totalRecords: 0 };

      if (reportType === "Summary") {
        const [baggingData, branchBaggingData] = await Promise.all([
          fetchBaggingData(queryRunNo).catch(() => null),
          fetchBranchBaggingData(queryRunNo).catch(() => null),
        ]);
        newTableData = mapSummaryData(baggingData, branchBaggingData);
        pagination.totalRecords = newTableData.length;
        pagination.totalPages = Math.ceil(newTableData.length / pageLimit);
        pagination.currentPage = page;
      } else {
        const [shipmentRes, baggingData, branchBaggingData] = await Promise.all(
          [
            fetchShipmentData(queryRunNo, page),
            fetchBaggingData(queryRunNo).catch(() => null),
            fetchBranchBaggingData(queryRunNo).catch(() => null),
          ],
        );

        const shipmentData =
          shipmentRes.data || (Array.isArray(shipmentRes) ? shipmentRes : []);
        const respPagination = shipmentRes.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: shipmentData.length,
        };

        const baggingLookup = createBaggingLookup(
          baggingData,
          branchBaggingData,
        );

        newTableData =
          reportType === "Shipper"
            ? mapShipperData(shipmentData, baggingLookup)
            : mapConsigneeData(shipmentData, baggingLookup);

        pagination = respPagination;
      }

      setTableData(newTableData);
      setTotalRecords(pagination.totalRecords);
      setTotalPages(pagination.totalPages);
      setCurrentPage(pagination.currentPage);

      showNotification(
        "success",
        `Found ${pagination.totalRecords} records (Page ${pagination.currentPage} of ${pagination.totalPages})`,
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      setTableData([]);
      setTotalRecords(0);
      setTotalPages(1);
      showNotification("error", "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

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
            (field) => setValue(field, ""),
          );
          setTableData([]);
          setTotalRecords(0);
          setTotalPages(1);
        }
      } else {
        setRunData(null);
        ["sector", "date", "counterpart", "flight", "obc", "almawb"].forEach(
          (field) => setValue(field, ""),
        );
        setTableData([]);
        setTotalRecords(0);
        setTotalPages(1);
      }
    };
    fetchAndFillRunData();
  }, [runNumber, setValue]);

  const handleReportTypeChange = (value) => {
    setReportType(value);
    setTableData([]);
    setTotalRecords(0);
    setTotalPages(1);
    setCurrentPage(1);
  };

  const PaginationControls = () => {
    if (totalPages <= 1 && tableData.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{tableData.length}</span> of{" "}
            <span className="font-medium">{totalRecords}</span> records
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="limit" className="text-sm text-gray-600">
              Rows per page:
            </label>
            <select
              id="limit"
              value={pageLimit}
              onChange={handleLimitChange}
              className="border rounded px-2 py-1 text-sm"
              disabled={loading}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
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
        title="Bag Report"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={() => {
          setTableData([]);
          setRunData(null);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalRecords(0);
          setCurrentFilters(null);
          setValue("runNo", "");
          ["sector", "date", "counterpart", "flight", "obc", "almawb"].forEach(
            (field) => setValue(field, ""),
          );
        }}
      />

      <div>
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

              {/* Second Row */}
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
                    disabled={tableData.length === 0 || loading}
                  />
                </div>
              </div>

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

              <Table
                columns={getFilteredColumns()}
                rowData={tableData}
                register={register}
                setValue={setValue}
                name="begReportTable"
                height={"h-[45vh]"}
              />

              <PaginationControls />

              <div className="flex justify-between mt-2">
                <div className="text-sm text-gray-600">
                  {totalRecords > 0 && (
                    <span>Total Records: {totalRecords}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <div></div>
          </div>
        </div>
      </div>
    </form>
  );
}
