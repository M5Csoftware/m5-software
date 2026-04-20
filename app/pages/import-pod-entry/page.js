"use client";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  SearchInputBox,
} from "@/app/components/InputBox";
import { RedLabelHeading } from "@/app/components/Heading";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { TableWithCheckbox } from "@/app/components/Table";
import axios from "axios";
import * as XLSX from "xlsx";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useAuth } from "@/app/Context/AuthContext";
import { DummyInputBoxWithLabelTransparent } from "@/app/components/DummyInputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import pushAWBLog from "@/app/lib/pushAWBLog";

const EVENT_CODE = "DLV";
const STATUS_VALUE = "Shipment Delivered To Consignee";

function PODEntryImport() {
  const { register, setValue, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      eventCode: EVENT_CODE,
      status: STATUS_VALUE,
    },
  });
  const [demoRadio, setDemoRadio] = useState("AWB");
  const [rowData, setRowData] = useState([]);
  const [originalRowData, setOriginalRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const { server } = useContext(GlobalContext);
  const { user } = useAuth();
  const [excelPath, setExcelPath] = useState("");
  const [resetForm, setResetForm] = useState(false);
  const [eventData, setEventData] = useState({});
  const [hasSearched, setHasSearched] = useState(false);

  // Always keep eventCode and status set — survives resets and re-renders
  useEffect(() => {
    setValue("eventCode", EVENT_CODE);
    setValue("status", STATUS_VALUE);
  }, [resetForm, setValue]);

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

  const handleRefresh = () => {
    setRowData([]);
    setOriginalRowData([]);
    setSelectedItems([]);
    setSelectedFile(null);
    setExcelPath("");
    setEventData({});
    setHasSearched(false);
    setResetForm((prev) => !prev);
    setValue("eventCode", EVENT_CODE);
    setValue("status", STATUS_VALUE);
    setValue("statusDate", "");
    setValue("time(Use 24 hr Format)", "");
    setValue("receiverName", "");
    setValue("remark", "");
    setValue("airwaybillNumber", "");
    showNotification("success", "Refreshed");
  };

  useEffect(() => {
    handleRefresh();
  }, [demoRadio]);

  const normalizeDate = (date) => {
    if (!date) return "";
    if (/^\d{8}$/.test(date))
      return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      const [d, m, y] = date.split("/");
      return `${y}-${m}-${d}`;
    }
    const d = new Date(date);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  };

  const normalizeTime = (time) => {
    if (!time) return "";
    if (/^\d{1,2}:\d{1,2}$/.test(time)) {
      const [h, m] = time.split(":");
      return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
    }
    const d = new Date(time);
    if (!isNaN(d.getTime())) {
      return `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")}`;
    }
    return "";
  };

  const normalizeShipments = (s) => (Array.isArray(s) ? s : [s]);

  // Search by AWB from Import Shipment collection
  const searchByAWB = async (awbNumber) => {
    try {
      setLoading(true);
      setHasSearched(true);

      const response = await axios.get(
        `${server}/import-pod-entry?awbNo=${awbNumber.toUpperCase()}`,
      );

      const shipments = normalizeShipments(response.data.shipment).map((s) => ({
        ...s,
        createdAt: normalizeDate(s.createdAt || s.shipmentDate),
      }));

      setRowData(shipments);
      setOriginalRowData(shipments);

      // Check if already delivered
      if (shipments[0]?.isDelivered) {
        showNotification("warning", "This shipment already has POD entry");
        // Load existing POD data
        if (shipments[0]?.podEventDate) {
          const existingData = {
            eventDate: normalizeDate(shipments[0].podEventDate),
            eventTime: shipments[0].podEventTime || "",
            receiverName: shipments[0].podReceiverName || "",
            remark: shipments[0].podRemark || "",
          };
          setEventData(existingData);
          setValue("statusDate", existingData.eventDate);
          setValue("time(Use 24 hr Format)", existingData.eventTime);
          setValue("receiverName", existingData.receiverName);
          setValue("remark", existingData.remark);
        }
      } else {
        showNotification("success", "AWB found");
        // Clear POD form for new entry
        setEventData({});
        setValue("statusDate", "");
        setValue("time(Use 24 hr Format)", "");
        setValue("receiverName", "");
        setValue("remark", "");
      }
    } catch (error) {
      setRowData([]);
      setOriginalRowData([]);
      setHasSearched(true);
      showNotification("error", error.response?.data?.error || "AWB not found");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setValue("excelPath", file.name);
    setExcelPath(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        const shipments = json.map((row) => ({
          awbNo: row["AWB No"] || "",
          createdAt: normalizeDate(row["Shipment Date"]),
          sector: row["Sector"] || "",
          destination: row["Destination"] || "",
          receiverFullName: row["Consignee Name"] || "",
          isDelivered: false,
        }));

        setRowData(shipments);
        setOriginalRowData(shipments);
        setHasSearched(true);

        showNotification("success", "Excel loaded");
      } catch {
        showNotification("error", "Invalid Excel file");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSearch = async () => {
    const form = watch();

    if (demoRadio === "AWB") {
      if (!form.airwaybillNumber)
        return showNotification("error", "Enter AWB number");

      await searchByAWB(form.airwaybillNumber);
    } else {
      if (!selectedFile) return showNotification("error", "Select Excel file");
      setHasSearched(true);
    }
  };

  const handleExcludeSelected = () => {
    if (selectedItems.length === 0)
      return showNotification("error", "No items selected");

    const excluded = selectedItems.map((a) => a.awbNo);

    setRowData((prev) => prev.filter((i) => !excluded.includes(i.awbNo)));
    setOriginalRowData((prev) =>
      prev.filter((i) => !excluded.includes(i.awbNo)),
    );
    setSelectedItems([]);

    showNotification("success", "Selected removed");
  };

  // Save POD entry to Import Shipment collection
  const savePODEntry = async (data) => {
    try {
      const eventCode = data.eventCode || EVENT_CODE;
      const status = data.status || STATUS_VALUE;

      const list = selectedItems.length ? selectedItems : rowData;

      if (list.length === 0) {
        showNotification("error", "No shipments to update");
        return false;
      }

      const payload = {
        eventCode,
        status,
        eventDate: data.statusDate,
        eventTime: data["time(Use 24 hr Format)"],
        receiverName: data.receiverName,
        remark: data.remark || "",
        eventUser: user?.userName || user?.userId || "System",
        awbList: list.map((i) => ({
          awbNo: i.awbNo,
          accountCode: i.accountCode,
        })),
      };

      const response = await axios.post(`${server}/import-pod-entry`, payload);

      if (response.status === 200) {
        // Log each successful POD entry
        const getCustomerName = async (accountCode) => {
          if (!accountCode) return "";
          try {
            const res = await axios.get(
              `${server}/customer-account?accountCode=${accountCode}`,
            );
            return res.data?.name || "";
          } catch {
            return "";
          }
        };

        for (const item of list) {
          try {
            const customer = await getCustomerName(item.accountCode);
            await pushAWBLog({
              awbNo: item.awbNo,
              accountCode: item.accountCode || "",
              customer: customer || item.receiverFullName || "",
              action: "POD Entry Generated (Import)",
              actionUser: user?.userId || "System",
              department: "Operations",
            });
          } catch (logErr) {
            console.error("Failed to push AWB Log for:", item.awbNo, logErr);
          }
        }

        showNotification("success", response.data.message);
        handleRefresh();
        return true;
      }
    } catch (error) {
      console.error("Error saving POD entry:", error);
      const errorMsg =
        error.response?.data?.error || "Failed to save POD entry";
      showNotification("error", errorMsg);
      return false;
    }
  };

  const onSubmit = async (data) => {
    const eventCode = data.eventCode || EVENT_CODE;
    const status = data.status || STATUS_VALUE;

    if (
      !eventCode ||
      !status ||
      !data.statusDate ||
      !data["time(Use 24 hr Format)"] ||
      !data.receiverName
    ) {
      showNotification("error", "Fill all required fields");
      return;
    }

    const list = selectedItems.length ? selectedItems : rowData;

    if (list.length === 0) {
      showNotification("error", "No shipments to update");
      return;
    }

    // Check if any shipment is already delivered
    const alreadyDelivered = list.filter((item) => item.isDelivered === true);
    if (alreadyDelivered.length > 0) {
      showNotification(
        "error",
        `${alreadyDelivered.length} shipment(s) already have POD entry. Please exclude them first.`,
      );
      return;
    }

    await savePODEntry(data);
  };

  // Remove POD entry from Import Shipment
  const removePODEntry = async (awbList) => {
    try {
      let successCount = 0;
      let failCount = 0;

      for (const awbNo of awbList) {
        try {
          await axios.delete(`${server}/import-pod-entry?awbNo=${awbNo}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to remove POD for ${awbNo}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        showNotification(
          "success",
          `POD removed for ${successCount} shipment(s)`,
        );
        handleRefresh();
      }
      if (failCount > 0) {
        showNotification(
          "error",
          `Failed to remove POD for ${failCount} shipment(s)`,
        );
      }
    } catch (error) {
      showNotification("error", "Failed to remove POD entries");
    }
  };

  const handleRemoveSelected = () => {
    if (selectedItems.length === 0) {
      showNotification("error", "No items selected");
      return;
    }

    const confirmRemove = window.confirm(
      `Are you sure you want to remove POD entry for ${selectedItems.length} shipment(s)?`,
    );

    if (confirmRemove) {
      removePODEntry(selectedItems.map((i) => i.awbNo));
    }
  };

  useEffect(() => {
    const term = watch("additional_SearchTerm");

    if (!term) {
      setRowData(originalRowData);
      return;
    }

    const filtered = originalRowData.filter((i) =>
      String(i.awbNo).toLowerCase().includes(term.toLowerCase()),
    );

    if (filtered.length === 0) {
      setRowData([]);
    } else {
      setRowData(filtered);
    }
  }, [watch("additional_SearchTerm"), originalRowData]);

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
    a.download = "sample_import_pod_shipments.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <form className="flex flex-col gap-9" onSubmit={handleSubmit(onSubmit)}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Import POD Entry"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      {/* Radio Buttons */}
      <div className="flex w-full gap-3">
        {["AWB", "Excel"].map((item) => (
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

      {/* Search Section */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <RedLabelHeading label={`Search Airwaybills`} />

          {/* Search Input */}
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
                      <label htmlFor="excelFilePod">
                        <span className="px-32">Browse</span>
                      </label>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        id="excelFilePod"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <InputBox
                    resetFactor={resetForm}
                    placeholder="Airwaybill Number"
                    register={register}
                    setValue={setValue}
                    value="airwaybillNumber"
                  />
                  <div className="min-w-[120px]">
                    <OutlinedButtonRed
                      label={loading ? "Searching..." : "Search"}
                      onClick={handleSearch}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AWB filter search - only show when there are results */}

            <div className="flex gap-2">
              <SearchInputBox
                placeholder="Search Airwaybill Below"
                name="additional_SearchTerm"
                register={register}
              />
            </div>
          </div>

          {/* Results Table - Always show when hasSearched is true */}

          <div>
            <TableWithCheckbox
              register={register}
              setValue={setValue}
              name="pod_shipments"
              columns={columns}
              rowData={rowData}
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
            />
          </div>

          <OutlinedButtonRed
            label={"Exclude Selected"}
            onClick={handleExcludeSelected}
            disabled={loading || selectedItems.length === 0}
          />
        </div>

        {/* POD Entry Section - Always show when hasSearched is true and there are results */}

        <div className="flex flex-col gap-3">
          <RedLabelHeading label={`Shipment POD Entry`} />

          <div className="flex gap-2">
            <div className="w-[350px]">
              <DummyInputBoxWithLabelTransparent
                watch={watch}
                label={`Event Code`}
                inputValue={EVENT_CODE}
                register={register}
                setValue={setValue}
                resetFactor={resetForm}
                value={`eventCode`}
              />
            </div>

            <DummyInputBoxWithLabelTransparent
              watch={watch}
              label={`Status`}
              inputValue={STATUS_VALUE}
              register={register}
              setValue={setValue}
              resetFactor={resetForm}
              value={`status`}
            />
          </div>

          <div className="flex gap-2">
            <DateInputBox
              register={register}
              setValue={setValue}
              value="statusDate"
              required
              resetFactor={resetForm}
              initialValue={eventData.eventDate || ""}
            />

            <InputBox
              placeholder="Time (Use 24 hr Format)"
              register={register}
              setValue={setValue}
              value="time(Use 24 hr Format)"
              type="time"
              required={true}
              resetFactor={resetForm}
              initialValue={eventData.eventTime || ""}
            />
          </div>

          <div className="flex flex-col gap-3">
            <InputBox
              placeholder="Receiver Name"
              register={register}
              setValue={setValue}
              value="receiverName"
              required={true}
              resetFactor={resetForm}
              initialValue={eventData.receiverName || ""}
            />
            <InputBox
              placeholder="Remark"
              register={register}
              setValue={setValue}
              value="remark"
              resetFactor={resetForm}
              initialValue={eventData.remark || ""}
            />
          </div>
        </div>

        {/* Action Buttons - Always show when hasSearched is true and there are results */}
        {hasSearched && rowData.length > 0 && (
          <div className="flex justify-between">
            <div></div>
            <div className="flex gap-2">
              <OutlinedButtonRed
                label={"Remove"}
                onClick={handleRemoveSelected}
                perm="CC Deletion"
                disabled={selectedItems.length === 0}
              />
              <SimpleButton name={"Save"} type="submit" />
            </div>
          </div>
        )}
      </div>
    </form>
  );
}

export default PODEntryImport;
