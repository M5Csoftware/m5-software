"use client";
import React, { useContext, useState, useMemo, useEffect } from "react";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";

const NewImportBookingReport = () => {
  const {
    register,
    setValue,
    trigger,
    watch,
    formState: { errors },
    handleSubmit,
  } = useForm();
  const [dateFormat, setDateFormat] = useState(false);
  const [holdShipments, setHoldShipments] = useState(false);
  const [skipMum, setSkipMum] = useState(false);
  const [skipAmd, setSkipAmd] = useState(false);
  const [includeChild, setIncludeChild] = useState(false);
  const [balanceShipment, setBalanceShipmet] = useState(false);
  const [added, setAdded] = useState(false);
  const [csbV, setcsbV] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { server } = useContext(GlobalContext);
  const [reports, setReports] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50);
  const [currentFilters, setCurrentFilters] = useState(null);

  // Watch fields
  const codeValue = watch("code");

  // Notification state
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

  const baseColumns = [
    { key: "awbNo", label: "AwbNo" },
    { key: "createdAt", label: "ShipmentDate" },
    { key: "status", label: "Status" },
    { key: "manifestNo", label: "Manifest Number" },
    { key: "alMawbNo", label: "AlMawbNo" },
    { key: "origin", label: "Origin Name" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "DestinationName" },
    { key: "accountCode", label: "CustomerCode" },
    { key: "name", label: "Customer Name" },
    
    { key: "receiverFullName", label: "ConsigneeName" },
    { key: "receiverAddressLine1", label: "ConsigneeAddressLine1" },
    { key: "receiverCity", label: "ConsigneeCity" },
    { key: "receiverState", label: "ConsigneeState" },
    { key: "receiverPincode", label: "ConsigneeZipCode" },
    { key: "receiverPhoneNumber", label: "ConsigneePhoneNo" },
    { key: "service", label: "Service" },
    { key: "upsService", label: "UPSService" },
    { key: "shipmentForwarderTo", label: "ShipmentForwarderTo" },
    { key: "shipmentForwardingNo", label: "ShipmentForwardingNo" },
    { key: "payment", label: "PaymentType" },
    { key: "pcs", label: "Pcs" },
    { key: "goodstype", label: "Goods Type" },
    { key: "totalActualWt", label: "Actual Weight" },
    { key: "totalVolWt", label: "Volume Weight" },
    { key: "volDisc", label: "Volumetric Discount" },
    { key: "chargeableWt", label: "Chargeable Wt" },
    { key: "content", label: "Shipment Content" },
    { key: "totalInvoiceValue", label: "Custom Value" },
    { key: "currency", label: "Currency" },
    { key: "isHold", label: "Hold Shipment" },
    { key: "holdReason", label: "Hold Reason" },
    { key: "otherHoldReason", label: "Hold Reason 2" },
    { key: "unholdDate", label: "Unhold Date" },
    
    { key: "userBranch", label: "User Branch" },
    { key: "insertUser", label: "Insert User" },
    
    { key: "entryType", label: "Entry Type" },
  ];

  // Dynamically add Master AWB column when includeChild is checked
  const columns = useMemo(() => {
    if (includeChild) {
      return [
        baseColumns[0],
        { key: "masterAwbNo", label: "Master AWB" },
        ...baseColumns.slice(1),
      ];
    }
    return baseColumns;
  }, [includeChild]);

  // Fetch customer name when code is entered
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (!codeValue || codeValue.trim() === "") {
        setValue("client", "");
        return;
      }

      try {
        const response = await axios.get(
          `${server}/customer-account?accountCode=${codeValue.trim().toUpperCase()}`,
        );

        if (response.data && response.data.name) {
          setValue("client", response.data.name);
        } else {
          setValue("client", "");
        }
      } catch (error) {
        console.error("Error fetching customer name:", error);
        if (error.response?.status === 404) {
          setValue("client", "Customer not found");
        } else {
          setValue("client", "");
        }
      }
    };

    const timeoutId = setTimeout(() => {
      fetchCustomerName();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [codeValue, server, setValue]);

  // Helper function to parse DD/MM/YYYY format
  const parseDateDDMMYYYY = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
  };

  // Function to fetch reports with pagination
  const fetchReports = async (filters, page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        code: filters.code || "",
        runNumber: filters.runNumber || "",
        origin: filters.origin || "",
        sector: filters.sector || "",
        salePerson: filters.salePerson || "",
        branch: filters.branch || "",
        destination: filters.destination || "",
        service: filters.service || "",
        from: filters.from,
        to: filters.to,
        holdShipments: filters.holdShipments.toString(),
        skipMum: filters.skipMum.toString(),
        skipAmd: filters.skipAmd.toString(),
        csbV: filters.csbV.toString(),
        includeChild: filters.includeChild.toString(),
        balanceShipment: filters.balanceShipment.toString(),
        page: page.toString(),
        limit: pageLimit.toString(),
      });

      console.log("Fetching import reports with pagination:", { page, limit: pageLimit });

      const response = await axios.get(
        `${server}/reports/import-booking-report?${params.toString()}`,
      );

      console.log("API Response:", response.data);

      const responseData = response.data.data || [];
      const pagination = response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: responseData.length,
        limit: pageLimit,
      };

      // Filter only available columns and remove empty/null values
      const allowedKeys = columns.map((col) => col.key);
      const filteredData = responseData.map((item) => {
        let filtered = {};
        allowedKeys.forEach((key) => {
          if (item[key] !== undefined && item[key] !== null && item[key] !== "") {
            if (typeof item[key] === "boolean") {
              filtered[key] = item[key] ? "Yes" : "No";
            } else filtered[key] = item[key];
          }
        });
        return filtered;
      });

      setReports(filteredData);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);

      if (filteredData.length > 0) {
        showNotification(
          "success",
          `Import booking report generated (${filteredData.length} records, Page ${pagination.currentPage} of ${pagination.totalPages})`,
        );
      } else {
        showNotification("error", "No records found for selected criteria");
      }

      return filteredData;
    } catch (error) {
      console.error("Error downloading report:", error);
      const errorMessage = error.response?.data?.error || "Error downloading import booking report";
      setReports([]);
      showNotification("error", errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      const { from, to, runNumber, origin, sector, branch, code, salePerson, destination, service } = data;

      const mandatoryPresence = !!(branch || sector || code || salePerson || destination || service);
      const optionalPresence = !!(runNumber || origin);

      if (optionalPresence) {
        // Run Number or Origin present: Dates are optional
      } else if (mandatoryPresence) {
        if (!from || !to) {
          showNotification(
            "error",
            "From and To dates are required for specific filter searches.",
          );
          return;
        }
      } else if (!from || !to) {
        showNotification("error", "Please select both From and To dates");
        return;
      }

      let fromDateObj = null;
      let toDateObj = null;

      if (from && to) {
        fromDateObj = parseDateDDMMYYYY(from);
        toDateObj = parseDateDDMMYYYY(to);

        if (!fromDateObj || !toDateObj || isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
          showNotification("error", "Invalid date format. Please select valid dates.");
          return;
        }

        fromDateObj.setHours(0, 0, 0, 0);
        toDateObj.setHours(23, 59, 59, 999);
      }

      const filters = {
        code: data.code?.toUpperCase() || "",
        runNumber: data.runNumber?.toUpperCase() || "",
        origin: data.origin?.toUpperCase() || "",
        sector: data.sector?.toUpperCase() || "",
        salePerson: data.salePerson?.toUpperCase() || "",
        branch: data.branch?.toUpperCase() || "",
        destination: data.destination?.toUpperCase() || "",
        service: data.service?.toUpperCase() || "",
        from: fromDateObj ? fromDateObj.toISOString() : "",
        to: toDateObj ? toDateObj.toISOString() : "",
        holdShipments,
        skipMum,
        skipAmd,
        csbV,
        includeChild,
        balanceShipment,
      };

      console.log("Submitting filters:", filters);
      
      setCurrentFilters(filters);
      setCurrentPage(1);
      await fetchReports(filters, 1);

      if (data.code && reports.length > 0) {
        const first = reports[0];
        const clientName = first.name || first.customer || first.customerName || first.client || "";
        setValue("client", clientName);
      } else if (!data.code) {
        setValue("client", "");
      }
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    fetchReports(currentFilters, newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      setCurrentPage(1);
      fetchReports(currentFilters, 1);
    }
  };

  const handleDownloadCSV = () => {
    if (!reports || reports.length === 0) {
      showNotification("error", "Nothing to download");
      return;
    }

    const csvHeaders = columns.map((col) => col.label).join(",");
    const csvRows = reports.map((row) =>
      columns.map((col) => `"${row[col.key] || ""}"`).join(","),
    );
    const csvContent = [csvHeaders, ...csvRows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "new-import-booking-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("success", "CSV downloaded");
  };

  const handleRefresh = () => {
    setAdded(!added);
    setReports([]);
    setValue("client", "");
    setHoldShipments(false);
    setSkipMum(false);
    setSkipAmd(false);
    setcsbV(false);
    setBalanceShipmet(false);
    setIncludeChild(false);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    showNotification("success", "Refreshed");
  };

  const PaginationControls = () => {
    if (totalPages <= 1 && reports.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{reports.length}</span> of{" "}
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
              disabled={isLoading}
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
            disabled={currentPage === 1 || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-9">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading
        title={"Import Booking Report"}
        codeListBtn="hidden"
        onRefresh={handleRefresh}
        bulkUploadBtn="hidden"
      />
      
      <div className="flex flex-col gap-4">
        <div className="flex gap-3 items-center">
          <InputBox
            placeholder={"Code"}
            register={register}
            setValue={setValue}
            value={"code"}
            resetFactor={added}
          />
          <DummyInputBoxWithLabelDarkGray
            label="Client"
            register={register}
            setValue={setValue}
            value="client"
            resetFactor={added}
            inputValue={watch("client") || ""}
          />
          <InputBox
            placeholder={"Run Number"}
            register={register}
            setValue={setValue}
            value={"runNumber"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Branch"}
            register={register}
            setValue={setValue}
            value={"branch"}
            resetFactor={added}
          />
        </div>

        <div className="flex gap-3">
          <InputBox
            placeholder={"Origin"}
            register={register}
            setValue={setValue}
            value={"origin"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Sector"}
            register={register}
            setValue={setValue}
            value={"sector"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Sale Person"}
            register={register}
            setValue={setValue}
            value={"salePerson"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Destination"}
            register={register}
            setValue={setValue}
            value={"destination"}
            resetFactor={added}
          />
          <InputBox
            placeholder={"Service"}
            register={register}
            setValue={setValue}
            value={"service"}
            resetFactor={added}
          />
        </div>

        <div className="flex gap-3">
          <div className="w-[19.4%]">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
              trigger={trigger}
              error={errors.from}
              maxToday
              resetFactor={added}
            />
          </div>
          <div className="w-[19.4%]">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
              maxToday
              trigger={trigger}
              error={errors.to}
              resetFactor={added}
            />
          </div>

          <div>
            <OutlinedButtonRed
              type="submit"
              label={isLoading ? "Loading..." : "View"}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-between items-center gap-3">
            <div className="w-[120px] ml-2">
              <RedCheckbox
                isChecked={holdShipments}
                setChecked={setHoldShipments}
                id="holdShipments"
                register={register}
                setValue={setValue}
                label="Hold Shipments"
              />
            </div>

            <div className="w-[98px]">
              <RedCheckbox
                isChecked={skipMum}
                setChecked={setSkipMum}
                id="skipMum"
                register={register}
                setValue={setValue}
                label="Skip MUM"
              />
            </div>

            <div className="w-[90px]">
              <RedCheckbox
                isChecked={skipAmd}
                setChecked={setSkipAmd}
                id="skipAmd"
                register={register}
                setValue={setValue}
                label="Skip AMD"
              />
            </div>
            
            <div className="w-[90px]">
              <RedCheckbox
                isChecked={csbV}
                setChecked={setcsbV}
                id="csbV"
                register={register}
                setValue={setValue}
                label="CSB V"
              />
            </div>

            <div className="w-[150px]">
              <RedCheckbox
                isChecked={balanceShipment}
                setChecked={setBalanceShipmet}
                id="balanceShipment"
                register={register}
                setValue={setValue}
                label="Balance Shipment"
              />
            </div>
            
            <div className="w-[150px]">
              <RedCheckbox
                isChecked={includeChild}
                setChecked={setIncludeChild}
                id="includeChild"
                register={register}
                setValue={setValue}
                label="Include Child"
              />
            </div>
          </div>
        </div>

        <TableWithSorting
          register={register}
          setValue={setValue}
          name="newImportBookingReportTable"
          columns={columns}
          rowData={reports}
          className={`h-72`}
        />
        
        <PaginationControls />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {totalRecords > 0 && <span>Total Records: {totalRecords}</span>}
          </div>

          <div>
            <SimpleButton
              disabled={reports.length === 0}
              name={"Download"}
              onClick={handleDownloadCSV}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default NewImportBookingReport;