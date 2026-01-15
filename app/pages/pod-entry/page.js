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

function PODEntry() {
  const { register, setValue, handleSubmit, reset, watch } = useForm();
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
    setResetForm((prev) => !prev);
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
        d.getMinutes()
      ).padStart(2, "0")}`;
    }
    return "";
  };

  const normalizeShipments = (s) => (Array.isArray(s) ? s : [s]);

  const searchByAWB = async (awbNumber) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${server}/portal/get-shipments?awbNo=${awbNumber}`
      );

      const shipments = normalizeShipments(response.data.shipment).map((s) => ({
        ...s,
        createdAt: normalizeDate(s.createdAt || s.shipmentDate),
      }));

      setRowData(shipments);
      setOriginalRowData(shipments);

      showNotification("success", "AWB found");
    } catch (error) {
      setRowData([]);
      setOriginalRowData([]);
      showNotification("error", "AWB not found");
    } finally {
      setLoading(false);
    }
  };

  const eventbyAWB = async (awbNumber) => {
    try {
      const res = await axios.get(
        `${server}/event-activity?awbNo=${awbNumber}`
      );

      if (!res.data) {
        showNotification("error", "No event data for this AWB");
        return;
      }

      const e = res.data;
      const last = (e.eventCode?.length || 1) - 1;

      const latest = {
        eventDate: normalizeDate(e.eventDate?.[last]),
        eventTime: normalizeTime(e.eventTime?.[last]),
        receiverName: e.receiverName || "",
        remark: e.remark || "",
      };

      setEventData(latest);

      setValue("statusDate", latest.eventDate);
      setValue("time(Use 24 hr Format)", latest.eventTime);
      setValue("receiverName", latest.receiverName);
      setValue("remark", latest.remark);

      showNotification("success", "Last event loaded");
    } catch (err) {
      showNotification("error", "Failed to load event");
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
        }));

        setRowData(shipments);
        setOriginalRowData(shipments);

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
      await eventbyAWB(form.airwaybillNumber);
    } else {
      if (!selectedFile) return showNotification("error", "Select Excel file");
    }
  };

  const handleExcludeSelected = () => {
    if (selectedItems.length === 0)
      return showNotification("error", "No items selected");

    const excluded = selectedItems.map((a) => a.awbNo);

    setRowData((prev) => prev.filter((i) => !excluded.includes(i.awbNo)));
    setOriginalRowData((prev) =>
      prev.filter((i) => !excluded.includes(i.awbNo))
    );
    setSelectedItems([]);

    showNotification("success", "Selected removed");
  };

  const deleteBulkAWB = async (list) => {
    try {
      await axios.delete(`${server}/event-activity/podentry`, {
        data: list,
      });
      showNotification("success", "Deleted successfully");
    } catch {
      showNotification("error", "Deletion failed");
    }
  };

  const handleRemoveSelected = () => {
    if (selectedItems.length === 0)
      return showNotification("error", "No items selected");

    deleteBulkAWB(selectedItems.map((i) => i.awbNo));
  };

  const createPODActivity = async (data) => {
    try {
      await axios.post(`${server}/event-activity/podentry`, data);
      showNotification("success", "POD saved");
    } catch {
      showNotification("error", "Failed to save POD");
      throw new Error();
    }
  };

  const onSubmit = async (data) => {
    if (
      !data.eventCode ||
      !data.status ||
      !data.statusDate ||
      !data["time(Use 24 hr Format)"] ||
      !data.receiverName
    )
      return showNotification("error", "Fill all required fields");

    const list = selectedItems.length ? selectedItems : rowData;

    if (list.length === 0)
      return showNotification("error", "No shipments to update");

    const now = new Date();

    const payload = list.map((i) => ({
      awbNo: i.awbNo,
      eventDate: data.statusDate,
      eventTime: data["time(Use 24 hr Format)"],
      eventCode: data.eventCode,
      status: data.status,
      receiverName: data.receiverName,
      remark: data.remark || "",
      eventUser: user?.userName || "System",
      eventLogTime: normalizeTime(now.toISOString()),
    }));

    try {
      await createPODActivity(payload);
      handleRefresh();
    } catch {}
  };

  useEffect(() => {
    const term = watch("additional_SearchTerm");

    if (!term) {
      setRowData(originalRowData);
      return;
    }

    const filtered = originalRowData.filter((i) =>
      String(i.awbNo).toLowerCase().includes(term.toLowerCase())
    );

    if (filtered.length === 0) {
      showNotification("error", "No matching AWB");
      setRowData([]);
    } else {
      setRowData(filtered);
    }
  }, [watch("additional_SearchTerm")]);

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
    a.download = "sample_pod_shipments.csv";
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
        title="POD Entry"
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
                      label={"Search"}
                      onClick={handleSearch}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* AWB filter search */}
            <div>
              {demoRadio !== "AWB" && (
                <div className="flex gap-2">
                  <SearchInputBox
                    placeholder="Search Airwaybill Below"
                    name="additional_SearchTerm"
                    register={register}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Results Table */}
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

        {/* POD Entry Section */}
        <div className="flex flex-col gap-3">
          <RedLabelHeading label={`Shipment POD Entry`} />

          <div className="flex gap-2">
            <div className="w-[350px]">
              <DummyInputBoxWithLabelTransparent
                watch={watch}
                label={`Event Code`}
                inputValue={"DLV"}
                register={register}
                setValue={setValue}
                resetFactor={resetForm}
                value={`eventCode`}
              />
            </div>

            <DummyInputBoxWithLabelTransparent
              watch={watch}
              label={`Status`}
              inputValue={"Delivered (POD Updated)"}
              register={register}
              setValue={setValue}
              resetFactor={resetForm}
              value={`status`}
            />
          </div>

          <div className="flex gap-2">
            {/* <InputBox
              register={register}
              setValue={setValue}
              value="statusDate"
              type="date"
              required={true}
              resetFactor={resetForm}
              initialValue={eventData.eventDate || " "}
            /> */}
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
              initialValue={eventData.eventTime || " "}
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
              initialValue={eventData.receiverName || " "}
            />
            <InputBox
              placeholder="Remark"
              register={register}
              setValue={setValue}
              value="remark"
              resetFactor={resetForm}
              initialValue={eventData.remark || " "}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>
            {/* <OutlinedButtonRed
              label={"Close"}
              onClick={() => {
                reset();
                setRowData([]);
                setOriginalRowData([]);
                setSelectedItems([]);
                setSelectedFile(null);
                setExcelPath("");
                setError("");
              }}
            /> */}
          </div>
          <div className="flex gap-2">
            <OutlinedButtonRed
              label={"Remove"}
              onClick={handleRemoveSelected}
              //   disabled={podData.length === 0}
              perm="CC Deletion"
            />
            <SimpleButton
              name={"Save"}
              type="submit"
              // disabled={loading || podData.length === 0}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export default PODEntry;
