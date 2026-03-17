"use client";
import React, { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

const AirwaybillLog = () => {
  const { register, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      awbNo: "",
      reportType: "Action",
    },
  });
  const { server } = useContext(GlobalContext);

  const [reportType, setReportType] = useState("Action");
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noRecords, setNoRecords] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const awbNo = watch("awbNo");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const handleReportTypeChange = (value) => {
    setReportType(value);
    setRowData([]); // Clear table data when switching report types
    setNoRecords(false);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
  };

  const columns = {
    Action: [
      { key: "actionLogDate", label: "Action Log Date" },
      { key: "awbNo", label: "AWB No." },
      { key: "action", label: "Action" },
      { key: "actionUser", label: "Action User" },
      { key: "actionSystemIP", label: "Action System IP" },
      { key: "accountCode", label: "Account Code" },
      { key: "customerName", label: "Customer Name" },
    ],
    "Log Details": [
      { key: "awbNo", label: "AWB No." },
      { key: "shipmentDate", label: "Shipment Date" },
      { key: "originCode", label: "Origin Code" },
      { key: "sector", label: "Sector" },
      { key: "destination", label: "Destination" },
      { key: "accountCode", label: "Account Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "forwarder", label: "Shipment Forwarder" },
      { key: "forwardingNo", label: "Forwarding No." },
      { key: "pcs", label: "No of Items" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "volumeWt", label: "Volume Weight" },
      { key: "chargeableWt", label: "Chargeable Weight" },
      { key: "isHold", label: "Hold" },
      { key: "holdReason", label: "Hold Reason" },
      { key: "inscanUser", label: "Inscan User" },
      { key: "logDate", label: "Log Date" },
      { key: "lastUser", label: "Last User" },
    ],
  };

  // Get the current columns based on selected report type
  const currentColumns = columns[reportType];

  // Fetch AWB Log by awbNo and populate rowData depending on reportType
  const fetchAwbLog = async (queryAwbNo, page = 1) => {
    if (!queryAwbNo) {
      showNotification("error", "Please enter an AWB Number first");
      return;
    }

    setLoading(true);
    setNoRecords(false);
    setRowData([]);

    try {
      if (reportType === "Action") {
        const resp = await axios.get(
          `${server}/awb-log/action?awbNo=${encodeURIComponent(queryAwbNo)}&page=${page}&limit=${pageLimit}`
        );
        const doc = resp.data;
        const data = doc.logs || doc.data || [];
        const pagination = doc.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: data.length,
        };

        const mapped = (Array.isArray(data) ? data : []).map((log) => {
          const systemName =
            log.actionSystemName ||
            log.actionSystemname ||
            log.actionSystemNAME ||
            "System";

          const ip =
            log.actionSystemIp ||
            log.actionSystemIP ||
            log.actionSystemip ||
            "unknown";

          return {
            actionLogDate: log.actionLogDate
              ? new Date(log.actionLogDate).toLocaleString()
              : "",
            awbNo: doc.awbNo || log.awbNo || queryAwbNo || "",
            action: log.action || "",
            actionUser: log.actionUser || "",
            actionSystemIP: `${systemName} - ${ip}`,
            accountCode: doc.accountCode || log.accountCode || "",
            customerName: doc.customer || doc.customerName || log.customer || log.customerName || "",
          };
        });

        setRowData(mapped);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);

        if (!mapped.length) {
          setNoRecords(true);
          showNotification("error", "No Action Logs found");
        } else {
          showNotification("success", `Loaded ${mapped.length} Action Logs (Page ${pagination.currentPage} of ${pagination.totalPages})`);
        }
      } else {
        const resp = await axios.get(
          `${server}/awb-log/log-details?awbNo=${encodeURIComponent(
            queryAwbNo
          )}&page=${page}&limit=${pageLimit}`
        );

        const responseData = resp.data;
        const detailsArray = responseData.data || (Array.isArray(responseData) ? responseData : [responseData]);
        const pagination = responseData.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: detailsArray.length,
        };

        const mappedDetails = detailsArray.map((d) => {
          return {
            awbNo: d.awbNo || "",
            shipmentDate: d.shipmentDate
              ? new Date(d.shipmentDate).toLocaleDateString()
              : d.createdAt
              ? new Date(d.createdAt).toLocaleDateString()
              : "",
            originCode: d.originCode || d.from || "",
            sector: d.sector || "",
            destination: d.destination || d.to || "",
            accountCode: d.accountCode || "",
            customerName: d.customer || d.customerName || "",
            receiverFullName: d.receiverFullName || "",
            forwarder: d.forwarder || "",
            forwardingNo: d.forwardingNo || "",
            pcs: d.pcs || 0,
            totalActualWt: d.totalActualWt || 0,
            volumeWt: d.volumeWt || d.totalVolWt || 0,
            chargeableWt: d.chargeableWt || 0,
            isHold: d.isHold ? "Yes" : "No",
            holdReason: d.holdReason || "",
            shipmentInscanUser: d.shipmentInscanUser || "",
            logDate: d.logDate
              ? new Date(d.logDate).toLocaleString()
              : d.updatedAt
              ? new Date(d.updatedAt).toLocaleString()
              : "",
            lastUser: d.lastUser || "",
            inscanUser: d.inscanUser || "",
          };
        });

        setRowData(mappedDetails);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);

        if (!mappedDetails.length) {
          setNoRecords(true);
          showNotification("error", "No Log Details found");
        } else {
          showNotification("success", `Found ${mappedDetails.length} AWB Logs (Page ${pagination.currentPage} of ${pagination.totalPages})`);
        }
      }
    } catch (err) {
      console.error("Error fetching AWB log:", err);
      showNotification("error", "Error Fetching AWB Log");
      setRowData([]);
      setNoRecords(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
    fetchAwbLog(currentFilters, newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      setCurrentPage(1);
      fetchAwbLog(currentFilters, 1);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1 && rowData.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{rowData.length}</span> of{" "}
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
              className="border rounded px-2 py-1 text-sm bg-white"
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
            type="button"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
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
            type="button"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  // This function handles form submission (Enter key)
  const onSubmit = async (data) => {
    const query = data.awbNo?.trim();

    if (!query) {
      showNotification("error", "Enter an AWB Number");
      return;
    }

    setCurrentFilters(query);
    setCurrentPage(1);
    await fetchAwbLog(query, 1);
  };

  // Button click handler (same functionality)
  const handleShow = async () => {
    const query = awbNo?.trim();

    if (!query) {
      showNotification("error", "Enter an AWB Number");
      return;
    }

    setCurrentFilters(query);
    setCurrentPage(1);
    await fetchAwbLog(query, 1);
  };

  const handleClose = () => {
    setValue("awbNo", "");
    setRowData([]);
    setNoRecords(false);
  };

  // Refresh functionality
  const handleRefresh = () => {
    // Clear all states
    setRowData([]);
    setNoRecords(false);
    setLoading(false);
    setReportType("Action");

    // Increment form key to force re-render
    setFormKey((prev) => prev + 1);

    // Reset form with default values
    reset({
      awbNo: "",
      reportType: "Action",
    });

    showNotification("success", "Page refreshed successfully");
  };

  return (
    <form
      className="flex flex-col gap-[34px]"
      onSubmit={handleSubmit(onSubmit)}
      key={formKey}
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Airwaybill Log"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div>
        {/* Report Type Selection */}
        <div className="flex w-full gap-3">
          {["Action", "Log Details"].map((type) => (
            <RadioButtonLarge
              key={`${type}-${formKey}`}
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

        <div className="mt-3">
          <div className="flex gap-3">
            <InputBox
              key={`awbNo-${formKey}`}
              register={register}
              setValue={setValue}
              placeholder={"AirwayBill Number"}
              value={"awbNo"}
            />

            <div>
              <SimpleButton name={loading ? "Loading..." : "Show"} onClick={handleShow} type="button" className={`${loading ? "opacity-75 cursor-pointer" : ""}`}/>
            </div>
          </div>

          <div className="mt-3 relative min-h-[200px]">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="airwaybilltable"
              columns={currentColumns}
              rowData={rowData}
              className={loading ? "opacity-75 pointer-events-none" : ""}
            />
            <PaginationControls />
          </div>
        </div>
      </div>
    </form>
  );
};

export default AirwaybillLog;
