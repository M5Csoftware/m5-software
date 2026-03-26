"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import {
  DummyInputBoxTransparent,
  DummyInputBoxWithLabelDarkGray,
  DummyInputBoxWithLabelTransparent,
} from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox, InputBoxRed } from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import { useAlertCheck } from "@/app/hooks/useAlertCheck";
import NotificationFlag from "@/app/components/Notificationflag";
import { AlertModal } from "@/app/components/AlertModal";

const ShipmentQuery = ({ setRegisterComplaint }) => {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const { checkAlert } = useAlertCheck();
  const [runDetails, setRunDetails] = useState([]);
  const [shipmentQuery, setshipmentQuery] = useState({});
  const [eventActivityData, setEventActivityData] = useState([]);
  const [latestEventData, setLatestEventData] = useState({});
  const [forwardingData, setForwardingData] = useState([]);
  const [consigneeDetail, setConsigneeDetail] = useState({});
  const [consignorDetail, setConsignorDetail] = useState({});
  const [complaintRowData, setComplaintRowData] = useState([]);
  const [childShipmentsData, setChildShipmentsData] = useState([]);
  const [statusKey, setStatusKey] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Alert Modal State
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", awbNo: "" });

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const [searchLoading, setSearchLoading] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const awbNo = watch("awbNo");

  // Helper function to normalize time
  const normalizeTime = (time) => {
    if (!time) return "";

    const d = new Date(time);
    if (!isNaN(d.getTime())) {
      const hours = String(d.getUTCHours()).padStart(2, "0");
      const minutes = String(d.getUTCMinutes()).padStart(2, "0");
      return `${hours}:${minutes}`;
    }

    return time;
  };

  // Helper function to normalize date
  const normalizeDate = (date) => {
    if (!date) return "";

    if (/^\d{8}$/.test(date)) {
      return date.toString();
    }

    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}${month}${day}`;
    }

    return date;
  };

  // Helper function to format date to DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB"); // DD/MM/YYYY format
  };

  const fetchAwb = async () => {
    setSearchLoading(true);
    try {
      // console.log(awbNo);

      // Check for alerts first
      const alertResult = await checkAlert(awbNo);
      if (alertResult.hasAlert) {
        setAlertData({
          message: alertResult.message,
          awbNo: alertResult.awbNo,
        });
        setAlertModalOpen(true);
      }

      const response = await axios.get(
        `${server}/shipment-query?awbNo=${awbNo.toUpperCase()}`,
      );
      const run = response.data.response;
      // console.log(run);

      if (!run) {
        showNotification("error", "No shipment found for this AWB");
        setshipmentQuery({});
        setEventActivityData([]);
        setLatestEventData({});
        setForwardingData([]);
        setConsigneeDetail({});
        setConsignorDetail({});
        setComplaintRowData([]);
        setChildShipmentsData([]);
        return;
      }
      setshipmentQuery(run);
      showNotification("success", "Shipment details loaded");

      // ✅ NEW: fetch status + web history from custom route
      const statusRes = await axios.get(
        `${server}/shipment-query/shipment-status?awbNo=${awbNo.toUpperCase()}`,
      );

      if (statusRes.data?.data) {
        const { latestStatus, history } = statusRes.data.data;

        setLatestEventData(latestStatus);
        setEventActivityData(history);
        setStatusKey((k) => k + 1);
      } else {
        setLatestEventData({});
        setEventActivityData([]);
      }

      // Set child shipments data with bagging details
      if (run.childShipments && run.childShipments.length > 0) {
        // console.log("Child shipments with bagging data:", run.childShipments);
        setChildShipmentsData(run.childShipments);
      } else {
        setChildShipmentsData([]);
      }

      // Set consignee and consignor details from the response
      if (run.consigneeDetail) {
        setConsigneeDetail(run.consigneeDetail);
      }
      if (run.consignorDetail) {
        setConsignorDetail(run.consignorDetail);
      }

      setRunDetails([
        { label: "Mawb No.", value: run.mawb },
        { label: "Run No.", value: run.runNo },
        { label: "Bag No.", value: run.bagNo },
        { label: "Bag Weight", value: run.bagWeight },
        { label: "AL Mawb No.", value: run.almawb },
        { label: "Flight", value: run.flight },
        { label: "Flight Number", value: run.flightNo },
        { label: "OBC", value: run.obc },
        { label: "Sector", value: run.sector },
        { label: "Origin", value: run.origin },
        { label: "Destination", value: run.destination },
        {
          label: "Date",
          value: new Date(run.date).toLocaleDateString(),
        },
      ]);

      // Fetch forwarding data from portal/get-shipments
      await fetchForwardingData(awbNo);

      // Fetch complaint data
      await fetchComplaintData(awbNo);
    } catch (error) {
      console.error("Error fetching AWB:", error?.message || error);
      showNotification("error", "Failed to fetch shipment details");
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchForwardingData = async (awbNumber) => {
    try {
      // Get data from portal/get-shipments endpoint
      const shipmentResponse = await axios.get(
        `${server}/portal/get-shipments?awbNo=${awbNumber.toUpperCase()}`,
      );

      // Get child shipments data from shipment-query
      const childResponse = await axios.get(
        `${server}/shipment-query?awbNo=${awbNumber}`,
      );

      const forwarding = [];
      const addedForwardingNumbers = new Set(); // Track added forwarding numbers

      let mainForwarderCode = "";
      let mainColoaderName = "";
      let mainCoLoaderNumber = "";

      // Add main shipment forwarding data if exists
      if (shipmentResponse?.data?.shipment) {
        const shipment = shipmentResponse.data.shipment;
        mainForwarderCode = shipment.forwarder || "";
        mainColoaderName = shipment.coLoader || "";
        mainCoLoaderNumber = shipment.coLoaderNumber || "";

        if (
          shipment.forwardingNo &&
          !addedForwardingNumbers.has(shipment.forwardingNo)
        ) {
          forwarding.push({
            srNo: 1,
            forwardingNumber: shipment.forwardingNo,
            forwarderCode: mainForwarderCode,
            coloaderName: mainColoaderName,
            coLoaderNumber: mainCoLoaderNumber,
          });
          addedForwardingNumbers.add(shipment.forwardingNo);
        } else if (!shipment.forwardingNo && mainForwarderCode) {
          // If no forwarding number but has forwarder code, still add it
          forwarding.push({
            srNo: 1,
            forwardingNumber: "",
            forwarderCode: mainForwarderCode,
            coloaderName: mainColoaderName,
            coLoaderNumber: mainCoLoaderNumber,
          });
        }
      }

      // Add child shipments forwarding data with same forwarder code as main AWB
      if (childResponse?.data?.response?.childShipments) {
        const childShipments = childResponse.data.response.childShipments;

        childShipments.forEach((child) => {
          // Only add if forwarding number exists and hasn't been added yet
          if (
            child.forwardingNo &&
            !addedForwardingNumbers.has(child.forwardingNo)
          ) {
            forwarding.push({
              srNo: forwarding.length + 1,
              forwardingNumber: child.forwardingNo,
              forwarderCode: mainForwarderCode, // Use main AWB's forwarder code
              coloaderName: mainColoaderName,
              coLoaderNumber: mainCoLoaderNumber,
            });
            addedForwardingNumbers.add(child.forwardingNo);
          }
        });
      }

      // console.log("Forwarding data (deduplicated):", forwarding);
      setForwardingData(forwarding);
    } catch (error) {
      console.error("Error fetching forwarding data:", error);
      setForwardingData([]);
    }
  };

  const fetchEventActivity = async (awbNumber) => {
    try {
      const eventResponse = await axios.get(
        `${server}/event-activity?awbNo=${awbNumber}`,
      );

      if (eventResponse?.data) {
        const e = eventResponse.data;

        // Determine the number of events
        const totalEvents = e.eventCode?.length || 0;

        // Build an array of events with formatted dates
        const allEvents = Array.from({ length: totalEvents }, (_, i) => {
          const eventDate = e.eventDate?.[i];
          let formattedDate = "";

          if (eventDate) {
            const d = new Date(eventDate);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toLocaleDateString("en-GB"); // DD/MM/YYYY format
            }
          }

          return {
            awbNo: e.awbNo,
            eventCode: e.eventCode?.[i] || "",
            eventDate: formattedDate,
            eventTime: normalizeTime(e.eventTime?.[i]) || "",
            status: e.status?.[i] || "",
            eventUser: e.eventUser?.[i] || "",
            eventLocation: e.eventLocation?.[i] || "",
            eventLogTime: normalizeTime(e.eventLogTime?.[i]) || "",
          };
        });

        // console.log("Formatted event data for table:", allEvents);
        setEventActivityData(allEvents);

        // Get the latest event (last entry in the arrays)
        if (totalEvents > 0) {
          const latestIndex = totalEvents - 1;
          const latest = {
            statusDate: e.eventDate?.[latestIndex]
              ? new Date(e.eventDate[latestIndex]).toISOString().split("T")[0]
              : "",
            time: normalizeTime(e.eventTime?.[latestIndex]) || "",
            status: e.status?.[latestIndex] || "",
            receiverName: e.receiverName || "",
            remark: e.remark || "",
          };
          setLatestEventData(latest);

          // Set values in form
          setValue("statusDate", latest.statusDate);
          setValue("time", latest.time);
          setValue("status", latest.status);
          setValue("receiverName", latest.receiverName);
          setValue("remark", latest.remark);

          // optional state (for tables / display)
          setLatestEventData(latest);
        }
      } else {
        setEventActivityData([]);
        setLatestEventData({});
      }
    } catch (error) {
      console.error("Error fetching event activity:", error);
      setEventActivityData([]);
      setLatestEventData({});
    }
  };

  const fetchComplaintData = async (awbNumber) => {
    try {
      if (!awbNumber) {
        setComplaintRowData([]);
        return;
      }

      const response = await axios.get(
        `${server}/register-complaint?awbNo=${awbNumber}`,
      );

      if (response?.data) {
        const complaints = Array.isArray(response.data)
          ? response.data
          : response.data.complaints || [];

        // Filter complaints that match the entered AWB number
        const filteredComplaints = complaints.filter(
          (complaint) => complaint.awbNo === awbNumber,
        );

        // Map complaint data to table format
        const formattedComplaints = filteredComplaints.map(
          (complaint, index) => {
            // Get the last entry from history array
            const lastHistory =
              complaint.history && complaint.history.length > 0
                ? complaint.history[complaint.history.length - 1]
                : {};

            return {
              awbNo: complaint.awbNo || "",
              date: formatDateToDDMMYYYY(complaint.date) || "",
              caseType: complaint.caseType || "",
              action: lastHistory.action || "",
              lastDate: formatDateToDDMMYYYY(lastHistory.date) || "",
              actionUser: lastHistory.actionUser || "",
              statusHistory: lastHistory.statusHistory || "",
            };
          },
        );

        // console.log("Formatted complaint data:", formattedComplaints);
        setComplaintRowData(formattedComplaints);
      } else {
        setComplaintRowData([]);
      }
    } catch (error) {
      console.error("Error fetching complaint data:", error);
      setComplaintRowData([]);
    }
  };

  // Column definitions
  const columns = [
    { key: "eventDate", label: "Event Date" },
    { key: "eventTime", label: "Event Time" },
    { key: "eventCode", label: "Event Code" },
    { key: "status", label: "Status" },
    { key: "eventLocation", label: "Event Location" },
    { key: "eventUser", label: "Event User" },
    { key: "eventLogTime", label: "Event Log Time" },
  ];

  const columnsData = [
    { key: "srNo", label: "Sr No." },
    { key: "forwardingNumber", label: "Forwarding Number" },
    { key: "forwarderCode", label: "Forwarder Code" },
    { key: "coloaderName", label: "Coloader Name" },
    { key: "coLoaderNumber", label: "Coloader Number" },
  ];

  const complaintData = [
    { key: "awbNo", label: "AWB No." },
    { key: "date", label: "Date" },
    { key: "caseType", label: "Case Type" },
    { key: "action", label: "Action" },
    { key: "lastDate", label: "Last Date" },
    { key: "actionUser", label: "Action User" },
    { key: "statusHistory", label: "Status History" },
  ];

  const childShipmentsColumns = [
    { key: "srNo", label: "Sr No." },
    { key: "childAwbNo", label: "Child AWB No." },
    { key: "forwardingNo", label: "Forwarding No." },
    { key: "runNo", label: "Run No." },
    { key: "bagNo", label: "Bag No." },
    { key: "bagWeight", label: "Bag Weight" },
    { key: "alMawb", label: "AL Mawb" },
    { key: "flight", label: "Flight" },
    { key: "flightNo", label: "Flight No." },
    { key: "obc", label: "OBC" },
  ];
  // Add this function after your existing helper functions
  const handleFormKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent form submission
      const currentAwb = watch("awbNo");
      if (currentAwb && currentAwb.trim() !== "") {
        fetchAwb();
      }
    }
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setLatestEventData({});
    setForwardingData([]);
    setComplaintRowData([]);
    setChildShipmentsData([]);
    setEventActivityData([]);
    setConsigneeDetail({});
    setAlertModalOpen(false);
    setNotification({ type: "", message: "", visible: false });
    setRunDetails([]);
    setChildShipmentsData([]);
    setConsignorDetail({});
    setConsigneeDetail({});
    setValue("awbNo", "");
    setshipmentQuery({});
    setValue("statusDate", "");
    setValue("statusTime", "");
  };

  return (
    <form className="flex flex-col gap-[34px]" onKeyDown={handleFormKeyDown}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        awbNo={alertData.awbNo}
        message={alertData.message}
        title="Shipment Alert"
      />

      <Heading
        title="Shipment Query"
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex gap-[34px] w-full">
        <div className="flex flex-col gap-3 w-full">
          <div className="font-semibold text-red text-sm">
            Search Airwaybill Numbers
          </div>
          <div className="flex gap-2">
            <InputBox
              placeholder="Airwaybill Number"
              register={register}
              setValue={setValue}
              value="awbNo"
              resetFactor={refreshKey}
            />
            <div>
              <OutlinedButtonRed
                label={searchLoading ? "Searching..." : "Search"}
                onClick={fetchAwb}
                disabled={searchLoading}
              />
            </div>
          </div>
          <div>
            <SimpleButton
              name={`Register Complaint`}
              onClick={() => {
                const currentAwb = watch("awbNo");
                if (!currentAwb || currentAwb.trim() === "") {
                  showNotification("error", "Please enter an AWB number first");
                  return;
                }
                setRegisterComplaint(true, currentAwb);
              }}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex gap-2 w-[130px]">
              <InputBox
                placeholder="Company"
                register={register}
                setValue={setValue}
                value="company"
              />
            </div>
            <div className="w-full">
              <InputBox
                placeholder=""
                register={register}
                setValue={setValue}
                value="dummy"
              />
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px]">
              <TableWithSorting
                register={register}
                setValue={setValue}
                name="forwarding"
                columns={columnsData}
                rowData={forwardingData}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-5 w-full">
            <div className="flex flex-col gap-3.5 w-full">
              <div className="flex gap-2">
                <DummyInputBoxWithLabelDarkGray
                  label="Pickup Date"
                  register={register}
                  setValue={setValue}
                  value="pickupDate"
                  inputValue={
                    shipmentQuery.date
                      ? new Date(shipmentQuery.date).toLocaleDateString()
                      : ""
                  }
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Origin"
                  register={register}
                  setValue={setValue}
                  value="origin"
                  inputValue={shipmentQuery.origin || ""}
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Sector"
                  register={register}
                  setValue={setValue}
                  value="sector"
                  inputValue={shipmentQuery.sector || ""}
                />
              </div>

              <div className="flex gap-2">
                <DummyInputBoxWithLabelDarkGray
                  label="Destination"
                  register={register}
                  setValue={setValue}
                  value="destination"
                  inputValue={shipmentQuery.destination || ""}
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Forwarder"
                  register={register}
                  setValue={setValue}
                  value="forwarder"
                  inputValue={shipmentQuery.forwarder || ""}
                />
              </div>

              <div className="flex gap-2">
                <div className="w-[108px]">
                  <DummyInputBoxWithLabelDarkGray
                    label="Code"
                    register={register}
                    setValue={setValue}
                    value="code"
                    inputValue={shipmentQuery.accountCode || ""}
                  />
                </div>
                <DummyInputBoxWithLabelDarkGray
                  label="Customer"
                  register={register}
                  setValue={setValue}
                  value="customer"
                  inputValue={shipmentQuery.customerName || ""}
                />
              </div>
              <div className="flex gap-2">
                <DummyInputBoxWithLabelDarkGray
                  register={register}
                  label={`Branch`}
                  setValue={setValue}
                  value={`branch`}
                  inputValue={shipmentQuery.branch || ""}
                />
                <DummyInputBoxWithLabelDarkGray
                  label="Bill Number"
                  register={register}
                  setValue={setValue}
                  value="billNumber"
                  inputValue={shipmentQuery.billNo || ""}
                />
              </div>

              <div className="flex gap-3 mb-4 mt-4">
                <div className="flex flex-col gap-3 flex-grow w-1/2">
                  <div className="font-semibold text-red text-sm">
                    Consignee Details
                  </div>
                  <div className="bg-white w-full h-[195px] border border-[#D0D5DD] rounded-md flex flex-col text-xs p-3 overflow-y-auto">
                    {consigneeDetail &&
                    Object.keys(consigneeDetail).length > 0 ? (
                      <>
                        {consigneeDetail.name && (
                          <>
                            {consigneeDetail.name} <br />
                          </>
                        )}
                        {consigneeDetail.addressLine1 && (
                          <>
                            {consigneeDetail.addressLine1} <br />
                          </>
                        )}
                        {consigneeDetail.addressLine2 && (
                          <>
                            {consigneeDetail.addressLine2} <br />
                          </>
                        )}
                        {(consigneeDetail.city || consigneeDetail.pincode) && (
                          <>
                            {consigneeDetail.city}
                            {consigneeDetail.city && consigneeDetail.pincode
                              ? " - "
                              : ""}
                            {consigneeDetail.pincode} <br />
                          </>
                        )}
                        {(consigneeDetail.state || consigneeDetail.country) && (
                          <>
                            {consigneeDetail.state}
                            {consigneeDetail.state && consigneeDetail.country
                              ? ", "
                              : ""}
                            {consigneeDetail.country} <br />
                          </>
                        )}
                        {consigneeDetail.phoneNo && (
                          <>
                            Ph: {consigneeDetail.phoneNo} <br />
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">
                        No consignee details available
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3 flex-grow w-1/2">
                  <div className="font-semibold text-red text-sm">
                    Consignor Details
                  </div>
                  <div className="bg-white w-full h-[195px] border border-[#D0D5DD] rounded-md flex flex-col text-xs p-3 overflow-y-auto">
                    {consignorDetail &&
                    Object.keys(consignorDetail).length > 0 ? (
                      <>
                        {consignorDetail.name && (
                          <>
                            {consignorDetail.name} <br />
                          </>
                        )}
                        {consignorDetail.addressLine1 && (
                          <>
                            {consignorDetail.addressLine1} <br />
                          </>
                        )}
                        {consignorDetail.addressLine2 && (
                          <>
                            {consignorDetail.addressLine2} <br />
                          </>
                        )}
                        {(consignorDetail.city || consignorDetail.pincode) && (
                          <>
                            {consignorDetail.city}
                            {consignorDetail.city && consignorDetail.pincode
                              ? " - "
                              : ""}
                            {consignorDetail.pincode} <br />
                          </>
                        )}
                        {(consignorDetail.state || consignorDetail.country) && (
                          <>
                            {consignorDetail.state}
                            {consignorDetail.state && consignorDetail.country
                              ? ", "
                              : ""}
                            {consignorDetail.country} <br />
                          </>
                        )}
                        {consignorDetail.phoneNo && (
                          <>
                            Ph: {consignorDetail.phoneNo} <br />
                          </>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500">
                        No consignor details available
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3.5 mt-2">
                <div className="flex gap-2">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    setValue={setValue}
                    label={`Good Type`}
                    value={`goodType`}
                    inputValue={shipmentQuery.goodsType || ""}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="Pcs"
                    register={register}
                    setValue={setValue}
                    value="pcs"
                    inputValue={shipmentQuery.pcs || ""}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="Actual Wt."
                    register={register}
                    setValue={setValue}
                    value="actualWt"
                    inputValue={shipmentQuery.totalActualWt || ""}
                  />
                </div>

                <div className="flex gap-2">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={`Vol Wt`}
                    setValue={setValue}
                    value={`volWt`}
                    inputValue={shipmentQuery.totalVolWt || ""}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    label="Chg Wt"
                    register={register}
                    setValue={setValue}
                    value="chgWt"
                    inputValue={Math.max(
                      shipmentQuery.totalActualWt || 0,
                      shipmentQuery.totalVolWt || 0,
                    )}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    setValue={setValue}
                    label={`Payment`}
                    value={`payment`}
                    inputValue={shipmentQuery.payment || ""}
                  />
                </div>

                <div className="flex gap-2">
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={`Service`}
                    setValue={setValue}
                    value={`service`}
                    inputValue={shipmentQuery.service || ""}
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={`Unknown`}
                    setValue={setValue}
                    value={`unknown`}
                  />
                </div>

                <div className="flex gap-2">
                  <RedCheckbox
                    isChecked={shipmentQuery.isHold || false}
                    setChecked={() => {}}
                    id="hold"
                    register={register}
                    setValue={setValue}
                    label={"Hold"}
                    disabled
                  />
                  <DummyInputBoxWithLabelDarkGray
                    register={register}
                    label={`Hold Reason`}
                    setValue={setValue}
                    value={`holdReason`}
                    inputValue={shipmentQuery.holdReason || ""}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[55%] flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex flex-col gap-3 w-1/2">
              <div className="font-semibold text-red text-sm">Run Details</div>
              <div className="border border-french-gray rounded-lg overflow-y-auto text-xs table-scrollbar h-[23.5vh]">
                {runDetails.map((item, index) => (
                  <RunDetailRow key={index} row={item} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-1/2">
              <div className="font-semibold text-red text-sm">
                Child Airwaybill Number{" "}
                {childShipmentsData.length > 0
                  ? `(${childShipmentsData.length})`
                  : ""}
              </div>
              <div className="bg-white w-full h-[23.5vh] border border-[#D0D5DD] rounded-md overflow-hidden">
                {childShipmentsData && childShipmentsData.length > 0 ? (
                  <div className="w-full h-full overflow-x-auto overflow-y-auto">
                    <div className="min-w-[900px]">
                      <TableWithSorting
                        register={register}
                        setValue={setValue}
                        name="childShipments"
                        columns={childShipmentsColumns}
                        rowData={childShipmentsData}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    No child shipments available
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <div className="font-semibold text-red text-sm">
              Shipment Status Details
            </div>
            <div className="flex gap-2">
              <DateInputBox
                key={`statusDate-${statusKey}`}
                placeholder="Status Date"
                register={register}
                setValue={setValue}
                value="statusDate"
                initialValue={latestEventData.statusDate || ""}
                disabled
                resetFactor={refreshKey}
              />

              <DateInputBox
                key={`time-${statusKey}`}
                placeholder="Time"
                register={register}
                setValue={setValue}
                value="time"
                initialValue={latestEventData.time || ""}
                disabled
                resetFactor={refreshKey}
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-[#C0FFC0] rounded-md">
                <DummyInputBoxWithLabelTransparent
                  key={`status-${statusKey}`}
                  label="Status"
                  register={register}
                  setValue={setValue}
                  value="status"
                  inputValue={latestEventData.status || ""}
                />
              </div>
              <div className="flex gap-3">
                <InputBox
                  key={`receiver-${statusKey}`}
                  placeholder="Receiver Name"
                  register={register}
                  setValue={setValue}
                  value="receiverName"
                  initialValue={latestEventData.receiverName || ""}
                  disabled
                />

                <InputBox
                  key={`remark-${statusKey}`}
                  placeholder="Remark"
                  register={register}
                  setValue={setValue}
                  value="remark"
                  initialValue={latestEventData.remark || ""}
                  disabled
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="font-semibold text-red text-sm">Web History</div>
              <div className="overflow-x-auto">
                <div className="w-[100%]">
                  <TableWithSorting
                    register={register}
                    setValue={setValue}
                    name="Shipment Query"
                    columns={columns}
                    rowData={eventActivityData}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <InputBox
                  placeholder="Remark"
                  register={register}
                  setValue={setValue}
                  value="webHistoryRemark"
                />
                <div>
                  <OutlinedButtonRed label={`Add`} />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="font-semibold text-red text-sm">
                  Customer Care history
                </div>
                <div className="overflow-x-auto">
                  <div className="w-[100%]">
                    <TableWithSorting
                      register={register}
                      setValue={setValue}
                      name="Shipment Query"
                      columns={complaintData}
                      rowData={complaintRowData}
                    />
                  </div>
                </div>
              </div>

              <div>
                <DummyInputBoxWithLabelDarkGray
                  label="Ops Remarks"
                  register={register}
                  setValue={setValue}
                  value="opsRemarks"
                  inputValue={shipmentQuery.operationRemark || "--"}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="w-full">
            <DummyInputBoxWithLabelDarkGray
              label="Content"
              register={register}
              setValue={setValue}
              value="content"
              inputValue={shipmentQuery.content || ""}
            />
          </div>
          <div className="flex gap-2">
            <DummyInputBoxWithLabelDarkGray
              register={register}
              label={`Value`}
              setValue={setValue}
              value={`value`}
              inputValue={shipmentQuery.totalInvoiceValue || ""}
            />
            <DummyInputBoxWithLabelDarkGray
              register={register}
              label={``}
              setValue={setValue}
              value={`currency`}
              inputValue={shipmentQuery.currency || ""}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <DummyInputBoxWithLabelDarkGray
            label="USPS Number"
            register={register}
            setValue={setValue}
            value="uspsNumber"
            inputValue={shipmentQuery.forwardingNo || "To be implemented"}
          />
          <DummyInputBoxWithLabelDarkGray
            label="Hold Notifications"
            register={register}
            setValue={setValue}
            value="holdNotifications"
            inputValue={shipmentQuery.holdNotification || ""}
          />
        </div>
      </div>
      <div className="flex justify-end">
        {/* <div>
          <OutlinedButtonRed label={`Close`} />
        </div> */}
      </div>
    </form>
  );
};

function RunDetailRow({ row }) {
  return (
    <div className="flex font-medium py-1 px-6 border-b last:border-b-0 border-french-gray">
      <div className="w-40 text-dim-gray">{row.label}</div>
      <div>{row.value}</div>
    </div>
  );
}

export default ShipmentQuery;
