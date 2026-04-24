"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelLightGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import { ArrowLeft, X } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => {
  if (!d) return "--/--/--";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN");
};
const now = () => new Date();
const fmtDate = (d) => d.toLocaleDateString("en-IN");
const fmtTime = (d) =>
  d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

// ─── component ────────────────────────────────────────────────────────────────
const CounterPartInscan = () => {
  const { register, setValue, watch } = useForm();
  const { setCurrentTab, server } = useContext(GlobalContext);

  // ── read InputBox values via watch (register intercepts onChange) ───────────
  const runNoInput = watch("runNoInput") || "";
  const awbInput = watch("awbInput") || "";
  const location = watch("location") || "";
  const arrivalRemark = watch("arrivalRemark") || "";

  // ── other state ────────────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(now());
  const [runNos, setRunNos] = useState([]);
  const [runReceived, setRunReceived] = useState([]);
  const [shipmentDetails, setShipmentDetails] = useState(null);
  const [scannedAwbs, setScannedAwbs] = useState([]);
  const [loadingAwb, setLoadingAwb] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [awbKey, setAwbKey] = useState(0);
  const [runKey, setRunKey] = useState(0);
  const [alreadyInscanned, setAlreadyInscanned] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const awbInputRef = useRef(null);
  const runNoInputRef = useRef(null);

  // live clock
  useEffect(() => {
    const d = new Date();
    setValue("statusDate", fmtDate(d));
    setValue("time", fmtTime(d));
    const t = setInterval(() => {
      const d2 = new Date();
      setCurrentTime(d2);
      setValue("statusDate", fmtDate(d2));
      setValue("time", fmtTime(d2));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Set default value for arrivalRemark on component mount
  useEffect(() => {
    setValue("arrivalRemark", "Shipment arrived at Destination Country");
  }, [setValue]);

  // ── refresh function ───────────────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setAwbKey((k) => k + 1);
    setRunKey((k) => k + 1);
    setRunNos([]);
    setRunReceived([]);
    setShipmentDetails(null);
    setScannedAwbs([]);
    setAlreadyInscanned(false);
    setIsChecking(false);
    setValue("runNoInput", "");
    setValue("awbInput", "");
    setValue("location", "");
    setValue("arrivalRemark", "Shipment arrived at Destination Country");
    setCurrentTime(now());
    toast.success("Form refreshed");
  };

  // ── add a run number ───────────────────────────────────────────────────────
  const handleAddRunNo = async () => {
    const rn = runNoInput.trim().toUpperCase();
    if (!rn) {
      toast.error("Please enter a Run No.");
      return;
    }
    if (runNos.find((r) => r.runNo === rn)) {
      toast.error("Run No. already added");
      return;
    }
    try {
      const res = await axios.get(`${server}/counter-part-inscan?runNo=${rn}`);
      if (res.data.success) {
        const newEntry = { runNo: rn, awbNos: res.data.awbNos || [] };
        setRunNos((prev) => [...prev, newEntry]);
        setRunReceived((prev) => [...prev, ...newEntry.awbNos]);
        setValue("runNoInput", "");
        setRunKey((k) => k + 1); // force remount to clear input
        if (runNoInputRef.current) {
          runNoInputRef.current.focus();
        }
        toast.success(`Run ${rn} added (${newEntry.awbNos.length} AWBs)`);
      }
    } catch {
      toast.error("Failed to fetch Run No.");
    }
  };

  const handleRemoveRunNo = (rn) => {
    const entry = runNos.find((r) => r.runNo === rn);
    setRunNos((prev) => prev.filter((r) => r.runNo !== rn));
    if (entry) {
      setRunReceived((prev) => prev.filter((a) => !entry.awbNos.includes(a)));
    }
  };

  // ── check if AWB is already counter part inscanned ─────────────────────────
  const checkIfAlreadyInscanned = async (awb) => {
    try {
      const res = await axios.get(
        `${server}/counter-part-inscan?checkAwb=${awb}`,
      );
      if (res.data.success && res.data.alreadyScanned === true) {
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error checking counter part inscan status:", error);
      return false;
    }
  };

  // ── fetch AWB details automatically when AWB is entered ─────────────────────
  useEffect(() => {
    const fetchAwbAutomatically = async () => {
      const awb = awbInput.trim().toUpperCase();
      if (!awb) {
        setShipmentDetails(null);
        setAlreadyInscanned(false);
        return;
      }

      if (scannedAwbs.find((s) => s.awbNo === awb)) {
        toast.error(`AWB ${awb} already scanned in this session`);
        setShipmentDetails(null);
        setAlreadyInscanned(false);
        return;
      }

      setIsChecking(true);
      const isAlreadyInscanned = await checkIfAlreadyInscanned(awb);
      setIsChecking(false);

      if (isAlreadyInscanned) {
        toast.error(
          `AWB ${awb} has already been counter part inscanned. Cannot scan again.`,
        );
        setAlreadyInscanned(true);
        setShipmentDetails(null);
        return;
      }

      setAlreadyInscanned(false);
      setLoadingAwb(true);

      try {
        const res = await axios.get(
          `${server}/counter-part-inscan?awbNo=${awb}`,
        );
        if (res.data.success) {
          setShipmentDetails(res.data.data);
        } else {
          setShipmentDetails(null);
          toast.error(res.data.message || "AWB not found");
        }
      } catch {
        setShipmentDetails(null);
        toast.error("Failed to fetch shipment details");
      } finally {
        setLoadingAwb(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      if (awbInput.trim()) {
        fetchAwbAutomatically();
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [awbInput, server, scannedAwbs]);

  // ── scan AWB ───────────────────────────────────────────────────────────────
  const handleScan = () => {
    if (!shipmentDetails) {
      toast.error("Please enter a valid AWB number first");
      return;
    }

    if (alreadyInscanned) {
      toast.error("This AWB has already been counter part inscanned");
      return;
    }

    if (scannedAwbs.find((s) => s.awbNo === shipmentDetails.awbNo)) {
      toast.error("AWB already scanned in this session");
      return;
    }

    setScannedAwbs((prev) => [
      ...prev,
      { ...shipmentDetails, counterPartInscan: true, scannedAt: new Date() },
    ]);
    setValue("awbInput", "");
    setAwbKey((k) => k + 1); // force remount to clear input
    setShipmentDetails(null);
    setAlreadyInscanned(false);
    if (awbInputRef.current) {
      awbInputRef.current.focus();
    }
    toast.success(`${shipmentDetails.awbNo} scanned successfully`);
  };

  // ── save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!location || location.trim() === "") {
      toast.error("Location is mandatory. Please enter a location.");
      return;
    }

    if (scannedAwbs.length === 0) {
      toast.error("No AWBs scanned yet");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${server}/counter-part-inscan`, {
        statusDate: currentTime,
        location,
        arrivalRemark: "Shipment arrived at Destination Country",
        runNos,
        scannedAwbs,
      });
      toast.success("Counter Part Inscan saved successfully!");
      handleRefresh();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error.response?.data?.message || "Failed to save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCurrentTab("CounterPartDashboard")}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-misty-rose text-red hover:bg-red hover:text-white transition-colors duration-150"
          title="Back to CounterPart Dashboard"
        >
          <ArrowLeft size={16} />
        </button>
        <Heading
          title="Counter Part Inscan"
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          onRefresh={handleRefresh}
        />
      </div>

      <div className="flex gap-4">
        {/* ── Left column: Run Received + Scanned ── */}
        <div className="flex flex-col gap-2 min-w-[200px] w-[200px]">
          <RedLabelHeading label="Run Received" />
          <div className="border rounded-md h-[280px] overflow-y-auto p-1 bg-gray-50 text-xs">
            {runReceived.length === 0 ? (
              <p className="text-gray-400 text-center mt-8">No AWBs</p>
            ) : (
              runReceived.map((awb, i) => (
                <div
                  key={i}
                  className={`py-0.5 px-1 rounded mb-0.5 font-mono ${
                    scannedAwbs.find((s) => s.awbNo === awb)
                      ? "bg-green-100 text-green-700 line-through"
                      : "bg-white"
                  }`}
                >
                  {awb}
                </div>
              ))
            )}
          </div>

          <RedLabelHeading label="Scanned" />
          <div className="border rounded-md h-[280px] overflow-y-auto p-1 bg-gray-50 text-xs">
            {scannedAwbs.length === 0 ? (
              <p className="text-gray-400 text-center mt-8">No scans yet</p>
            ) : (
              scannedAwbs.map((s, i) => (
                <div
                  key={i}
                  className="py-0.5 px-1 rounded mb-0.5 font-mono bg-green-100 text-green-700"
                >
                  {s.awbNo}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right column ── */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Scan Airwaybill Number */}
          <div>
            <RedLabelHeading label="Scan Airwaybill Number" />
            <div className="flex flex-col gap-3 mt-2">
              {/* Status Date + Time */}
              <div className="flex gap-3">
                <div className="w-1/2">
                  <DummyInputBoxWithLabelLightGray
                    setValue={setValue}
                    register={register}
                    value="statusDate"
                    label="Status Date"
                    inputValue={fmtDate(currentTime)}
                  />
                </div>
                <div className="w-1/2">
                  <DummyInputBoxWithLabelLightGray
                    setValue={setValue}
                    register={register}
                    value="time"
                    label="Time"
                    inputValue={fmtTime(currentTime)}
                  />
                </div>
              </div>
              {/* Location + Arrival Remark */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <InputBox
                    key={`location-${refreshKey}`}
                    setValue={setValue}
                    register={register}
                    value="location"
                    placeholder="Location *"
                    required
                  />
                </div>
                <div className="flex-1">
                  <DummyInputBoxWithLabelLightGray
                    setValue={setValue}
                    register={register}
                    value="arrivalRemark"
                    label="Arrival Remark"
                    inputValue="Shipment arrived at Destination Country"
                  />
                </div>
              </div>
              {/* Run Number entry */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <div className="w-40">
                    <InputBox
                      key={`runNoInput-${refreshKey}-${runKey}`}
                      setValue={setValue}
                      register={register}
                      value="runNoInput"
                      placeholder="Enter Run No."
                      inputRef={runNoInputRef}
                      onKeyDown={(e) => e.key === "Enter" && handleAddRunNo()}
                      onChange={(e) =>
                        setValue("runNoInput", e.target.value.toUpperCase())
                      }
                    />
                  </div>
                  <div className="w-fit">
                    <SimpleButton name="Add Run" onClick={handleAddRunNo} />
                  </div>
                </div>

                {/* run number chips */}
                {runNos.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {runNos.map((r) => (
                      <span
                        key={r.runNo}
                        className="flex items-center gap-1 bg-misty-rose text-red text-xs px-2 py-1 rounded-full"
                      >
                        {r.runNo} ({r.awbNos.length})
                        <button
                          type="button"
                          onClick={() => handleRemoveRunNo(r.runNo)}
                          className="ml-1 hover:text-red-700"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* AWB scan input */}
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <InputBox
                    key={`awbInput-${refreshKey}-${awbKey}`}
                    setValue={setValue}
                    register={register}
                    value="awbInput"
                    placeholder="Enter / Scan AWB No."
                    inputRef={awbInputRef}
                    onKeyDown={(e) => e.key === "Enter" && handleScan()}
                    onChange={(e) =>
                      setValue("awbInput", e.target.value.toUpperCase())
                    }
                  />
                </div>
                <div className="w-fit">
                  <SimpleButton
                    name="Scan"
                    onClick={handleScan}
                    disabled={
                      !shipmentDetails ||
                      loadingAwb ||
                      alreadyInscanned ||
                      isChecking
                    }
                  />
                </div>
              </div>
              {loadingAwb && (
                <p className="text-xs text-gray-500">
                  Fetching shipment details...
                </p>
              )}
              {isChecking && (
                <p className="text-xs text-gray-500">
                  Checking if AWB is already scanned...
                </p>
              )}
              {alreadyInscanned && (
                <p className="text-xs text-red-500">
                  This AWB has already been counter part inscanned
                </p>
              )}
            </div>
          </div>

          {/* ── Shipment Origin / Destination ── */}
          <div>
            <RedLabelHeading label="Shipment Origin/Destination" />
            <div className="flex gap-3 mt-2">
              {[
                {
                  label: "Date",
                  val: shipmentDetails ? fmt(shipmentDetails.date) : "--/--/--",
                },
                { label: "Origin", val: shipmentDetails?.origin || "---" },
                { label: "Sector", val: shipmentDetails?.sector || "---" },
                {
                  label: "Destination",
                  val: shipmentDetails?.destination || "---",
                },
              ].map(({ label, val }) => (
                <div key={label} className="w-1/4">
                  <DummyInputBoxWithLabelLightGray
                    setValue={setValue}
                    register={register}
                    value={label.toLowerCase()}
                    label={label}
                    inputValue={val}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── Customer Details ── */}
          <div>
            <RedLabelHeading label="Customer Details" />
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex gap-3">
                <div>
                  <DummyInputBoxWithLabelLightGray
                    setValue={setValue}
                    register={register}
                    value="network"
                    label="Network"
                    inputValue={
                      shipmentDetails?.network ||
                      shipmentDetails?.networkName ||
                      "---"
                    }
                  />
                </div>
                <div className="flex-1">
                  <DummyInputBoxWithLabelLightGray
                    setValue={setValue}
                    register={register}
                    value="service"
                    label="Service"
                    inputValue={shipmentDetails?.service || "---"}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                {[
                  {
                    label: "Goods Description",
                    val: shipmentDetails?.goodsDescription || "---",
                  },
                  { label: "Pcs", val: shipmentDetails?.pcs ?? "---" },
                  {
                    label: "Actual Wt",
                    val: shipmentDetails?.totalActualWt ?? "---",
                  },
                  {
                    label: "Vol Wt",
                    val: shipmentDetails?.totalVolWt ?? "---",
                  },
                ].map(({ label, val }) => (
                  <div key={label} className="w-1/4">
                    <DummyInputBoxWithLabelLightGray
                      setValue={setValue}
                      register={register}
                      value={label}
                      label={label}
                      inputValue={String(val)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Consignor / Consignee ── */}
          <div className="flex gap-6">
            {[
              {
                heading: "Consignor Details",
                lines: shipmentDetails
                  ? [
                      shipmentDetails.shipperFullName,
                      shipmentDetails.shipperPhoneNumber,
                      shipmentDetails.shipperAddressLine1,
                      [
                        shipmentDetails.shipperCity,
                        shipmentDetails.shipperState,
                        shipmentDetails.shipperCountry,
                      ]
                        .filter(Boolean)
                        .join(", "),
                    ]
                  : [],
              },
              {
                heading: "Consignee Details",
                lines: shipmentDetails
                  ? [
                      shipmentDetails.receiverFullName,
                      shipmentDetails.receiverPhoneNumber,
                      shipmentDetails.receiverAddressLine1,
                      [
                        shipmentDetails.receiverCity,
                        shipmentDetails.receiverState,
                        shipmentDetails.receiverCountry,
                      ]
                        .filter(Boolean)
                        .join(", "),
                    ]
                  : [],
              },
            ].map(({ heading, lines }) => (
              <div key={heading} className="w-1/2">
                <RedLabelHeading label={heading} />
                <div className="border h-[180px] rounded-md mt-1 p-3 bg-gray-50 text-sm">
                  {lines.length === 0 ? (
                    <p className="text-gray-400 text-xs">No data</p>
                  ) : (
                    lines.filter(Boolean).map((l, i) => (
                      <p key={i} className="text-gray-700 leading-snug">
                        {l}
                      </p>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex justify-between items-center pt-2 border-t">
        <p className="text-xs text-gray-500">
          {scannedAwbs.length} AWB{scannedAwbs.length !== 1 ? "s" : ""} scanned
          / {runReceived.length} received
        </p>
        <div className="w-fit">
          <SimpleButton
            name={saving ? "Saving…" : "Save"}
            onClick={handleSave}
            disabled={saving || scannedAwbs.length === 0}
          />
        </div>
      </div>
    </div>
  );
};

export default CounterPartInscan;
