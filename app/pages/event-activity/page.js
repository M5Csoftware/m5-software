"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { RedLabelHeading } from "@/app/components/Heading";
import { SearchInputBox } from "@/app/components/InputBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { TableWithSorting, TableWithCheckbox } from "@/app/components/Table";
import axios from "axios";
import * as XLSX from "xlsx";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useAuth } from "@/app/Context/AuthContext";
import CodeList from "@/app/components/CodeList";
import NotificationFlag from "@/app/components/Notificationflag";
import { sendNotification } from "@/app/lib/sendNotifications";
import { LabeledDropdown } from "@/app/components/Dropdown";

function EventActivity() {
  const { register, setValue, handleSubmit, reset, watch } = useForm();
  const [demoRadio, setDemoRadio] = useState("AWB Wise");
  const [rowData, setRowData] = useState([]);
  const [originalRowData, setOriginalRowData] = useState([]); // Store original data for filtering
  const [eventData, setEventData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const { server, eventCode } = useContext(GlobalContext);
  const { user } = useAuth();
  const [excelPath, setExcelPath] = useState("");
  const [resetForm, setResetForm] = useState(false);
  const [eventStatus, setEventStatus] = useState("");

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const columns = [
    { key: "awbNo", label: "AWB No." },
    { key: "createdAt", label: "Shipment Date" },
    { key: "sector", label: "Sector" },
    { key: "destination", label: "Destination" },
    { key: "receiverFullName", label: "Consignee Name" },
  ];

  const columns2 = [
    { key: "eventDate", label: "Event Date" },
    { key: "eventTime", label: "Event Time" },
    { key: "eventCode", label: "Event Code" },
    { key: "status", label: "Status" },
    { key: "eventLocation", label: "Event Location" },
    { key: "eventUser", label: "Event User" },
    { key: "eventLogTime", label: "Event Log Time" },
  ];

  // Reset all data when radio button changes
  const handleRefresh = () => {
    setRowData([]);
    setOriginalRowData([]);
    setEventData([]);
    setSelectedItems([]);
    setSelectedFile(null);
    setExcelPath("");
    setError("");
    setResetForm((prev) => !prev);
    showNotification("success", "Form cleared");
  };

  useEffect(() => {
    handleRefresh();
  }, [demoRadio]);

  // Always convert to HHmm (string)

  const normalizeTime = (time) => {
    if (!time) return "";

    // // Already in HHmm
    // if (/^\d{4}$/.test(time)) {
    //   return time;
    // }

    // // Format like "HH:mm"
    // if (/^\d{2}:\d{2}$/.test(time)) {
    //   return time.replace(":", "");
    // }

    // Try parsing ISO/Date
    const d = new Date(time);
    if (!isNaN(d.getTime())) {
      // 👉 if you want UTC
      const hours = String(d.getUTCHours()).padStart(2, "0");
      const minutes = String(d.getUTCMinutes()).padStart(2, "0");

      return `${hours}:${minutes}`;
    }

    return time; // fallback if not parsable
  };

  // Always convert to yyyymmdd (string)
  const normalizeDate = (date) => {
    if (!date) return "";

    // Already in yyyymmdd
    if (/^\d{8}$/.test(date)) {
      return date.toString();
    }

    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}${month}${day}`; // yyyymmdd
    }

    return date; // fallback
  };

  // helper: normalize shipment data into array
  const normalizeShipments = (shipment) => {
    if (!shipment) return [];
    return Array.isArray(shipment) ? shipment : [shipment];
  };

  // API call functions for different search types
  // Search Functions

  const eventbyAWB = async (awbNumber) => {
    try {
      setLoading(true);
      setError("");
      const eventResponse = await axios.get(
        `${server}/event-activity?awbNo=${awbNumber}`
      );

      if (eventResponse?.data) {
        const e = eventResponse.data;

        // ✅ Determine the number of events (use length of any array, e.g. eventCode)
        const totalEvents = e.eventCode?.length || 0;

        // ✅ Build an array of events
        const allEvents = Array.from({ length: totalEvents }, (_, i) => ({
          awbNo: e.awbNo,
          eventCode: e.eventCode?.[i] || "",
          eventDate: normalizeDate(e.eventDate?.[i]) || "",
          eventTime: normalizeTime(e.eventTime?.[i]) || "",
          status: e.status?.[i] || "",
          eventUser: e.eventUser?.[i] || "",
          eventLocation: e.eventLocation?.[i] || "",
          eventLogTime: normalizeTime(e.eventLogTime?.[i]) || "",
        }));

        setEventData(allEvents);

        // store all events in state as rows
      } else {
        setEventData([]);
      }
    } catch (error) {
      console.error("Error searching by AWB:", error);
      setError("Failed to search by AWB number");
      setEventData([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByAWB = async (awbNumber) => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${server}/portal/get-shipments?awbNo=${awbNumber}`
      );

      const shipments = normalizeShipments(response.data.shipment).map((s) => ({
        ...s,
        createdAt: normalizeDate(s.createdAt || s.shipmentDate),
      }));
      setRowData(shipments);
      setOriginalRowData(shipments);
      showNotification("success", "Awb Found");
    } catch (error) {
      console.error("Error searching by AWB:", error);
      showNotification("error", `Error searching by AWB: ${error}`);
      setError("Failed to search by AWB number");
      setRowData([]);
      setOriginalRowData([]);
      setEventData([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByRun = async (runNumber) => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${server}/portal/get-shipments?runNo=${runNumber}`
      );

      const shipments = normalizeShipments(response.data.shipments).map(
        (s) => ({
          ...s,
          createdAt: normalizeDate(s.createdAt || s.shipmentDate),
        })
      );
      setRowData(shipments);
      setOriginalRowData(shipments);
      showNotification("success", `Found ${shipments.length}`);

      // Clear event data when searching for new shipments
      setEventData([]);
    } catch (error) {
      console.error("Error searching by Run:", error);
      showNotification("error", `Error searching by Run: ${error}`);
      setError("Failed to search by run number");
      setRowData([]);
      setOriginalRowData([]);
      setEventData([]);
    } finally {
      setLoading(false);
    }
  };

  const searchByClubbing = async (clubbingNumber) => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${server}/portal/get-shipments?clubNo=${clubbingNumber}`
      );

      const shipments = normalizeShipments(response.data.shipments);
      setRowData(shipments);
      setOriginalRowData(shipments);
      showNotification("error", `Found: ${shipments.length} shipments`);

      // Clear event data when searching for new shipments
      setEventData([]);

      if (shipments.length > 0) {
        const eventResponse = await axios.get(
          `${server}/events/clubbing/${clubbingNumber}`
        );
        setEventData(eventResponse.data || []);
      }
    } catch (error) {
      console.error("Error searching by Clubbing Number:", error);
      showNotification("error", "Error searching by Clubbing Number");
      setError("Failed to search by clubbing number");
      setRowData([]);
      setOriginalRowData([]);
      setEventData([]);
    } finally {
      setLoading(false);
    }
  };

  // Update (Add Event Entry) - Modified to not reset main data
  const handleUpdateEvent = () => {
    const data = watch();

    if (
      !data.eventCode ||
      !data.status ||
      !data.statusDate ||
      !data["time(Use 24 hr Format)"]
    ) {
      setError("Please fill all required event fields");
      showNotification("error", "Please fill all required event fields");
      return;
    }

    // Check if there are items to update (either selected or all)
    const itemsToUpdate = selectedItems.length > 0 ? selectedItems : rowData;

    if (itemsToUpdate.length === 0) {
      setError("No shipments available to update events for");
      showNotification("error", "No shipments available to update events for");
      return;
    }

    const now = new Date();
    const newEvents = itemsToUpdate.map((item) => ({
      awbNo: item.awbNo,
      accountCode: item.accountCode || "",
      customerName: item.receiverFullName || item.customerName || "",
      eventDate: data.statusDate,
      eventTime: data["time(Use 24 hr Format)"],
      eventCode: data.eventCode,
      status: data.status,
      eventLocation: data.locationCode || data.locationName || "",
      eventUser: user?.userName || "System",
      eventLogTime: normalizeTime(now.toISOString()),
    }));

    // ✅ Merge unique by awbNo
    setEventData((prev) => {
      const merged = [...prev];

      newEvents.forEach((newEvent) => {
        const index = merged.findIndex((e) => e.awbNo === newEvent.awbNo);
        if (index > -1) {
          // Replace existing entry with new one (latest update)
          merged[index] = newEvent;
        } else {
          // Add if not already present
          merged.push(newEvent);
        }
      });

      return merged;
    });

    setError("");
    setResetForm((prev) => !prev);
  };

  // Handle file selection and upload for Excel
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setValue("excelPath", file.name);
    setExcelPath(file.name);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // Assume first sheet
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        // Map data to match your table structure
        const shipments = jsonData.map((row) => ({
          awbNo: row["AWB No"] || "",
          createdAt: normalizeDate(row["Shipment Date"] || ""),
          sector: row["Sector"] || "",
          destination: row["Destination"] || "",
          receiverFullName: row["Consignee Name"] || "",
        }));

        setRowData(shipments);
        setOriginalRowData(shipments);

        // Clear event data when loading new Excel data
        setEventData([]);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading Excel:", error);
      showNotification("error", "Error reading Excel");
      setError("Failed to read Excel file");
      setRowData([]);
      setOriginalRowData([]);
      setEventData([]);
    }
  };

  const handleSearch = async () => {
    const formData = watch();

    switch (demoRadio) {
      case "AWB Wise":
        if (formData.airwaybillNumber) {
          await searchByAWB(formData.airwaybillNumber);
          await eventbyAWB(formData.airwaybillNumber);
        } else {
          setError("Please enter AWB number");
          showNotification("error", "Please enter AWB Number");
        }
        break;
      case "Run Wise":
        if (formData.runNumber) {
          await searchByRun(formData.runNumber);
        } else {
          setError("Please enter run number");
          showNotification("error", "Please enter run Number");
        }
        break;
      case "Club No":
        if (formData.clubbingNumber) {
          await searchByClubbing(formData.clubbingNumber);
        } else {
          setError("Please enter clubbing number");
          showNotification("error", "Please enter clubbing Number");
        }
        break;
      case "Excel":
        if (!selectedFile) {
          setError("Please select an Excel file");
          showNotification("error", "Please select an excel file");
        }
        // File upload is handled in handleFileChange
        break;
      default:
        break;
    }
  };

  const handleExcludeSelected = async () => {
    if (selectedItems.length === 0) {
      setError("No items selected for exclusion");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Remove excluded items from both current and original data
      const excludedIds = selectedItems.map((item) => item.id || item.awbNo);
      setRowData((prev) =>
        prev.filter((item) => !excludedIds.includes(item.id || item.awbNo))
      );
      setOriginalRowData((prev) =>
        prev.filter((item) => !excludedIds.includes(item.id || item.awbNo))
      );

      // Also remove events for excluded AWBs
      setEventData((prev) =>
        prev.filter((item) => !excludedIds.includes(item.awbNo))
      );

      setSelectedItems([]);
      console.log("Items excluded successfully:", selectedItems);
      showNotification("success", "Items excluded successfully");
    } catch (error) {
      console.error("Error excluding items:", error);
      showNotification("error", "Error excluding items");
      setError("Failed to exclude selected items");
    } finally {
      setLoading(false);
    }
  };

  const createEventActivity = async (eventActivityData) => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.post(`${server}/event-activity`, {
        ...eventActivityData,
      });

      console.log("Event activity created successfully:", response.data);
      showNotification("success", "Event activity created successfully");
      return response.data;
    } catch (error) {
      console.error("Error creating event activity:", error);
      showNotification("error", "Error creating event activity");
      setError("Failed to create event activity");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      console.log(eventData);
      await createEventActivity(eventData);

      // Send notifications for each event
      for (const event of eventData) {
        await sendNotification({
          accountCode: event.accountCode,
          name: event.customerName,
          awbNo: event.awbNo,
          event: "Shipment Status Update",
          description: `${event.awbNo} - ${event.eventCode}`,
          message: `${event.awbNo} ~ ${event.status}`,
          priority: "medium",
        });
      }

      // Reset additional UI state
      setResetForm((prev) => !prev);
      setRowData([]);
      setOriginalRowData([]);
      setEventData([]);
      setSelectedItems([]);
      setSelectedFile(null);
      setExcelPath("");
      setError("");
    } catch (error) {
      // Error handling is done in createEventActivity
    }
  };

  // Create sample CSV data
  const downloadSampleCSV = () => {
    const csvData = [
      ["AWB No", "Shipment Date", "Sector", "Destination", "Consignee Name"],
      ["1234567890", "2025-03-16", "NYC-DEL", "New Delhi", "John Doe"],
      ["9876543210", "2025-03-14", "LAX-LHR", "London", "Alice Smith"],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_shipments.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Handle AWB filtering for non-AWB Wise modes
  const additionalSearchTerm = watch("additionalSearchTerm");
  useEffect(() => {
    if (demoRadio !== "AWB Wise") {
      if (!additionalSearchTerm) {
        setRowData(originalRowData);
        setError("");
        return;
      }

      const filtered = originalRowData.filter((item) =>
        String(item.awbNo || "")
          .toLowerCase()
          .includes(additionalSearchTerm.toLowerCase())
      );

      if (filtered.length === 0) {
        setError("No matching AWB found in current data");
        showNotification("error", "No matching AWB found in current data");
        setRowData([]);
      } else {
        setRowData(filtered);
        setError("");
      }
    }
  }, [additionalSearchTerm, originalRowData, demoRadio]);

  // Watch eventCode field
  const eventCodeValue = watch("eventCode");
  const statusValue = watch("status");

  // Sync Status when Event Code changes
  useEffect(() => {
    if (!eventCodeValue) return;

    const handler = setTimeout(() => {
      const matchedEvent = eventCode.find(
        (item) => item.code.toLowerCase() === eventCodeValue.toLowerCase()
      );

      if (matchedEvent) {
        setEventStatus(matchedEvent.name);
        setValue("status", matchedEvent.name);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [eventCodeValue, eventCode, setValue]);

  // Sync Event Code when Status changes
  const handleStatusChange = (selectedStatus) => {
    if (!selectedStatus) return;

    const matchedEvent = eventCode.find(
      (item) => item.name.toLowerCase() === selectedStatus.toLowerCase()
    );

    if (matchedEvent) {
      setValue("eventCode", matchedEvent.code);
    }
  };

  return (
    <form className="flex flex-col gap-9" onSubmit={handleSubmit(onSubmit)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div>
        <Heading
          title="Event Activity"
          bulkUploadBtn="hidden"
          onRefresh={handleRefresh}
        />
        {/* Event Codes CodeList */}
        {eventCode && eventCode.length > 0 && (
          <div className="my-4">
            <CodeList
              handleAction={() => { }}
              data={eventCode} // assuming eventCode = [{ code: 'EV001', name: 'Delivered' }, ...]
              columns={[
                { key: "code", label: "Event Code" },
                { key: "name", label: "Event Name" },
              ]}
              name="Event Codes"
            />
          </div>
        )}

        {/* Show error message */}
        {/* {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )} */}

        {/* Radio Buttons */}
        <div className="flex w-full gap-3">
          {["AWB Wise", "Run Wise", "Excel", "Club No"].map((item) => (
            <RadioButtonLarge
              key={item}
              id={item}
              label={item}
              name="demo"
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={setDemoRadio}
            />
          ))}
        </div>
      </div>

      {/* Conditionally render based on selection */}
      {["AWB Wise", "Run Wise", "Excel", "Club No"].includes(demoRadio) && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <RedLabelHeading
              label={`Search ${demoRadio === "AWB Wise"
                ? "Airwaybills"
                : demoRadio === "Run Wise"
                  ? "Runs"
                  : demoRadio === "Club No"
                    ? "Clubbing Numbers"
                    : "Excel File"
                }`}
            />

            {/* Search Input and Button */}
            <div className="flex gap-2 flex-col">
              <div className="w-full">
                {demoRadio === "Excel" ? (
                  <div className="flex gap-2 w-full">
                    <InputBox
                      placeholder="Excel Path"
                      register={register}
                      setValue={setValue}
                      value="excelPath"
                      readOnly={true}
                      initialValue={excelPath}
                      resetFactor={resetForm}
                    />

                    <div className="flex gap-2 w-full justify-between">
                      <div className="w-full">
                        <OutlinedButtonRed
                          label={"Sample CSV"}
                          onClick={downloadSampleCSV}
                        />
                      </div>
                      <div className="w-[300px] cursor-pointer bg-red hover:bg-dark-red transition-all text-white font-semibold rounded-md text-sm py-2.5">
                        <label htmlFor="excelFile">
                          <span className="px-32">Browse</span>
                        </label>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          id="excelFile"
                          onChange={handleFileChange}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <InputBox
                      resetFactor={resetForm}
                      placeholder={
                        demoRadio === "AWB Wise"
                          ? "Airwaybill Number"
                          : demoRadio === "Club No"
                            ? "Clubbing Number"
                            : "Run Number"
                      }
                      register={register}
                      setValue={setValue}
                      value={
                        demoRadio === "AWB Wise"
                          ? "airwaybillNumber"
                          : demoRadio === "Club No"
                            ? "clubbingNumber"
                            : "runNumber"
                      }
                    />
                    <div className="min-w-[120px]">
                      <OutlinedButtonRed
                        label={"Search"}
                        onClick={handleSearch}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* AWB filter search for non-AWB Wise modes */}
              <div>
                {demoRadio !== "AWB Wise" && (
                  <div className="flex gap-2">
                    <SearchInputBox
                      placeholder="Search Airwaybill Below"
                      name="additionalSearchTerm"
                      register={register}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Results Table */}
            <div>
              {/* <TableWithCheckbox
                register={register}
                setValue={setValue}
                name="event activity"
                columns={columns}
                rowData={rowData}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                className={`h-[15vh]`}
              /> */}
              <TableWithSorting
                register={register}
                setValue={setValue}
                name={"Event Activity"}
                columns={columns}
                rowData={rowData}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                className={`h-[10vh]`}
              />
            </div>

            {/* <OutlinedButtonRed
              label={"Exclude Selected"}
              onClick={handleExcludeSelected}
              disabled={loading || selectedItems.length === 0}
            /> */}
          </div>

          {/* Shipment Event Activity Section */}
          <div className="flex flex-col gap-3">
            <RedLabelHeading label={`Shipment Event Activity`} />

            <div className="flex gap-2">
              <div className="w-[350px]">
                <InputBox
                  placeholder="Event Code"
                  register={register}
                  setValue={setValue}
                  value="eventCode"
                  required={true}
                  resetFactor={resetForm}
                />
              </div>

              <div className="w-full">
                <LabeledDropdown
                  title="Status"
                  options={eventCode.map((item) => item.name)}
                  value="status"
                  register={register}
                  setValue={setValue}
                  selectedValue={statusValue}
                  onChange={handleStatusChange}
                  resetFactor={resetForm}
                  required={true}
                />
              </div>

              <div className="w-[350px]">
                <InputBox
                  placeholder="Location Code"
                  register={register}
                  setValue={setValue}
                  value="locationCode"
                  resetFactor={resetForm}
                />
              </div>

              <InputBox
                placeholder="Location Name"
                register={register}
                setValue={setValue}
                value="locationName"
                resetFactor={resetForm}
              />
            </div>

            <div className="flex gap-2">
              <div className="w-[39.5%]">
                {/* <InputBox
                  register={register}
                  setValue={setValue}
                  value="statusDate"
                  type="date"
                  required={true}
                  resetFactor={resetForm}
                /> */}
                <DateInputBox
                  register={register}
                  setValue={setValue}
                  value="statusDate"
                  placeholder="Date"
                  required={true}
                  resetFactor={resetForm}
                />
              </div>

              <div className="w-[39.5%]">
                <InputBox
                  placeholder="Time (Use 24 hr Format)"
                  register={register}
                  setValue={setValue}
                  value="time(Use 24 hr Format)"
                  type="time"
                  required={true}
                  resetFactor={resetForm}
                />
              </div>

              <div className="w-[11.5%]">
                <OutlinedButtonRed
                  label={"Add Event"}
                  type="button"
                  onClick={handleUpdateEvent}
                />
              </div>
              <div className="w-[11.5%]">
                <SimpleButton name={"Save"} type="submit" disabled={loading} />
              </div>
            </div>
          </div>

          {/* Event Activities Table */}
          <div>
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="event_activities"
              columns={columns2}
              rowData={eventData}
            />
          </div>

          <div className="flex justify-between">
            <div>
              {/* <OutlinedButtonRed
                label={"Close"}
                onClick={() => {
                  reset();
                  setRowData([]);
                  setOriginalRowData([]);
                  setEventData([]);
                  setSelectedItems([]);
                  setSelectedFile(null);
                  setExcelPath("");
                  setError("");
                }}
              /> */}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default EventActivity;
