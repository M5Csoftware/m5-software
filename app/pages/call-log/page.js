"use client";
import { SimpleButton, OutlinedButtonRed } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelLightGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import { ArrowLeft, ChevronDown, Phone, PhoneIncoming, PhoneOutgoing, X } from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// ─── helpers ──────────────────────────────────────────────────────────────────
const now = () => new Date();
const fmtDate = (d) =>
  d.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
const fmtTime = (d) =>
  d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// ─── Modal wrapper ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl w-[480px] max-h-[90vh] overflow-y-auto z-10">
        {/* modal header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

// ─── LogACallForm ─────────────────────────────────────────────────────────────
const LogACallForm = ({ onClose, onSave, server }) => {
  const { register, setValue, watch, handleSubmit } = useForm({
    defaultValues: {
      callFor: "Contact",
      relatedTo: "Account",
      callType: "Outbound",
      outgoingCallStatus: "Completed",
      callStartDate: fmtDate(now()),
      callStartTime: fmtTime(now()),
      callDurationMin: "00",
      callDurationSec: "00",
      subject: "Outgoing call to Unknown",
      voiceRecording: "",
      reminder: "None",
      callPurpose: "-None-",
      callAgenda: "",
      callResult: "-None-",
      outcomeDescription: "",
      incomingDescription: "",
    },
  });

  const [saving, setSaving] = useState(false);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (server) {
        await axios.post(`${server}/call-log`, { ...data, type: "log" });
      }
      toast.success("Call logged successfully!");
      onSave?.();
      onClose();
    } catch {
      toast.error("Failed to log call");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Call Information */}
      <div>
        <RedLabelHeading label="Call Information" />
        <div className="flex flex-col gap-3 mt-2">
          {/* Call For */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call For
            </label>
            <div className="flex gap-2 flex-1">
              <select
                {...register("callFor")}
                className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white w-28"
              >
                <option>Contact</option>
                <option>Lead</option>
              </select>
              <InputBox
                setValue={setValue}
                register={register}
                value="callForSearch"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Related To */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Related To
            </label>
            <div className="flex gap-2 flex-1">
              <select
                {...register("relatedTo")}
                className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white w-28"
              >
                <option>Account</option>
                <option>Deal</option>
                <option>Lead</option>
              </select>
              <InputBox
                setValue={setValue}
                register={register}
                value="relatedToSearch"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Call Type */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Type
            </label>
            <select
              {...register("callType")}
              className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white flex-1"
            >
              <option>Outbound</option>
              <option>Inbound</option>
            </select>
          </div>

          {/* Outgoing Call Status */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Outgoing Call Status
            </label>
            <select
              {...register("outgoingCallStatus")}
              className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white flex-1"
            >
              <option>Completed</option>
              <option>No Answer</option>
              <option>Busy</option>
              <option>Failed</option>
            </select>
          </div>

          {/* Call Start Time */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Start Time
            </label>
            <div className="flex gap-2 flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callStartDate"
                placeholder="MM/DD/YYYY"
              />
              <InputBox
                setValue={setValue}
                register={register}
                value="callStartTime"
                placeholder="HH:MM AM/PM"
              />
            </div>
          </div>

          {/* Call Duration */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Duration
            </label>
            <div className="flex gap-2 items-center flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationMin"
                placeholder="00"
              />
              <span className="text-xs text-gray-500">minutes</span>
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationSec"
                placeholder="00"
              />
              <span className="text-xs text-gray-500">seconds</span>
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Subject
            </label>
            <div className="flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="subject"
                placeholder="Subject"
              />
            </div>
          </div>

          {/* Voice Recording */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Voice Recording
            </label>
            <div className="flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="voiceRecording"
                placeholder=""
              />
            </div>
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Reminder
            </label>
            <select
              {...register("reminder")}
              className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white flex-1"
            >
              <option>None</option>
              <option>5 minutes</option>
              <option>10 minutes</option>
              <option>15 minutes</option>
              <option>30 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purpose Of Outgoing Call */}
      <div>
        <RedLabelHeading label="Purpose Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Purpose
            </label>
            <select
              {...register("callPurpose")}
              className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white flex-1"
            >
              <option>-None-</option>
              <option>Prospecting</option>
              <option>Administrative</option>
              <option>Negotiation</option>
              <option>Demo</option>
              <option>Project</option>
              <option>Desk</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Agenda
            </label>
            <div className="flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callAgenda"
                placeholder=""
              />
            </div>
          </div>
        </div>
      </div>

      {/* Outcome Of Outgoing Call */}
      <div>
        <RedLabelHeading label="Outcome Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Result
            </label>
            <select
              {...register("callResult")}
              className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white flex-1"
            >
              <option>-None-</option>
              <option>Interested</option>
              <option>Not Interested</option>
              <option>No response/Busy</option>
              <option>Requested more info</option>
              <option>Requested call back</option>
              <option>Invalid number</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Description
            </label>
            <div className="flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="outcomeDescription"
                placeholder=""
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reason For Incoming Call */}
      <div>
        <RedLabelHeading label="Reason For Incoming Call" />
        <div className="flex items-center gap-3 mt-2">
          <label className="text-xs text-gray-600 w-36 text-right shrink-0">
            Description
          </label>
          <div className="flex-1">
            <InputBox
              setValue={setValue}
              register={register}
              value="incomingDescription"
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <OutlinedButtonRed name="Cancel" onClick={onClose} />
        <SimpleButton
          name={saving ? "Saving…" : "Save"}
          type="submit"
          disabled={saving}
        />
      </div>
    </form>
  );
};

// ─── ScheduleACallForm ────────────────────────────────────────────────────────
const ScheduleACallForm = ({ onClose, onSave, server }) => {
  const { register, setValue, handleSubmit } = useForm({
    defaultValues: {
      callFor: "Contact",
      relatedTo: "Account",
      callType: "Outbound",
      callStartDate: fmtDate(now()),
      callStartTime: fmtTime(now()),
      callDurationMin: "00",
      callDurationSec: "00",
      subject: "",
      reminder: "None",
      callPurpose: "-None-",
      callAgenda: "",
      description: "",
    },
  });

  const [saving, setSaving] = useState(false);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (server) {
        await axios.post(`${server}/call-log`, { ...data, type: "schedule" });
      }
      toast.success("Call scheduled successfully!");
      onSave?.();
      onClose();
    } catch {
      toast.error("Failed to schedule call");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Call Information */}
      <div>
        <RedLabelHeading label="Call Information" />
        <div className="flex flex-col gap-3 mt-2">
          {/* Call For */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call For
            </label>
            <div className="flex gap-2 flex-1">
              <select
                {...register("callFor")}
                className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white w-28"
              >
                <option>Contact</option>
                <option>Lead</option>
              </select>
              <InputBox
                setValue={setValue}
                register={register}
                value="callForSearch"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Related To */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Related To
            </label>
            <div className="flex gap-2 flex-1">
              <select
                {...register("relatedTo")}
                className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white w-28"
              >
                <option>Account</option>
                <option>Deal</option>
                <option>Lead</option>
              </select>
              <InputBox
                setValue={setValue}
                register={register}
                value="relatedToSearch"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Call Type */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Type
            </label>
            <select
              {...register("callType")}
              className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white flex-1"
            >
              <option>Outbound</option>
              <option>Inbound</option>
            </select>
          </div>

          {/* Call Start Time */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Start Time
            </label>
            <div className="flex gap-2 flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callStartDate"
                placeholder="MM/DD/YYYY"
              />
              <InputBox
                setValue={setValue}
                register={register}
                value="callStartTime"
                placeholder="HH:MM AM/PM"
              />
            </div>
          </div>

          {/* Call Duration */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Duration
            </label>
            <div className="flex gap-2 items-center flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationMin"
                placeholder="00"
              />
              <span className="text-xs text-gray-500">minutes</span>
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationSec"
                placeholder="00"
              />
              <span className="text-xs text-gray-500">seconds</span>
            </div>
          </div>

          {/* Subject */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Subject
            </label>
            <div className="flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="subject"
                placeholder="Subject"
              />
            </div>
          </div>

          {/* Reminder */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Reminder
            </label>
            <select
              {...register("reminder")}
              className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white flex-1"
            >
              <option>None</option>
              <option>5 minutes</option>
              <option>10 minutes</option>
              <option>15 minutes</option>
              <option>30 minutes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Purpose Of Call */}
      <div>
        <RedLabelHeading label="Purpose Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Purpose
            </label>
            <select
              {...register("callPurpose")}
              className="border rounded px-2 py-1.5 text-xs text-gray-700 bg-white flex-1"
            >
              <option>-None-</option>
              <option>Prospecting</option>
              <option>Administrative</option>
              <option>Negotiation</option>
              <option>Demo</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-600 w-36 text-right shrink-0">
              Call Agenda
            </label>
            <div className="flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callAgenda"
                placeholder=""
              />
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <RedLabelHeading label="Description" />
        <div className="flex items-center gap-3 mt-2">
          <label className="text-xs text-gray-600 w-36 text-right shrink-0">
            Description
          </label>
          <div className="flex-1">
            <InputBox
              setValue={setValue}
              register={register}
              value="description"
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2 border-t">
        <OutlinedButtonRed name="Cancel" onClick={onClose} />
        <SimpleButton
          name={saving ? "Saving…" : "Save"}
          type="submit"
          disabled={saving}
        />
      </div>
    </form>
  );
};

// ─── Main CallLog component ───────────────────────────────────────────────────
const CallLog = () => {
  const { setCurrentTab, server } = useContext(GlobalContext);

  const [calls, setCalls] = useState([
    {
      id: 1,
      subject: "Call Customer on Potential",
      callType: "Inbound",
      callStartTime: "07/05/2026 11:50 AM",
      callDuration: "00:15",
      relatedTo: "King",
      contactName: "Sage Wieser (Sample)",
      callOwner: "Harmanjeet Singh",
    },
    {
      id: 2,
      subject: "Follow up with Lead",
      callType: "Outbound",
      callStartTime: "07/05/2026 03:50 PM",
      callDuration: "00:00",
      relatedTo: "Chau Kitzman (Sample)",
      contactName: "",
      callOwner: "Harmanjeet Singh",
    },
  ]);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null); // "log" | "schedule" | null
  const dropdownRef = useRef(null);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSaved = () => {
    // In a real app, refetch calls from server here
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setCurrentTab?.("Dashboard")}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-misty-rose text-red hover:bg-red hover:text-white transition-colors duration-150"
          title="Back"
        >
          <ArrowLeft size={16} />
        </button>
        <Heading
          title="Calls"
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
        />

        {/* Create Call split-button */}
        <div className="ml-auto relative" ref={dropdownRef}>
          <div className="flex items-center">
            <SimpleButton
              name="Create Call"
              onClick={() => {
                setDropdownOpen(false);
                setModal("log");
              }}
            />
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center justify-center h-full px-2 bg-red text-white rounded-r border-l border-red-700 hover:bg-red-700 transition-colors -ml-px"
              style={{ borderRadius: "0 4px 4px 0" }}
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 min-w-[160px]">
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setModal("schedule");
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                <Phone size={12} />
                Schedule a call
              </button>
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setModal("log");
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 text-left"
              >
                <PhoneOutgoing size={12} />
                Log a call
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Calls Table ── */}
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="w-8 p-2">
                <input type="checkbox" className="rounded" />
              </th>
              <th className="p-2 text-left font-medium text-gray-600">
                Subject
              </th>
              <th className="p-2 text-left font-medium text-gray-600">
                Call Type
              </th>
              <th className="p-2 text-left font-medium text-gray-600">
                Call Start Time
              </th>
              <th className="p-2 text-left font-medium text-gray-600">
                Call Duration
              </th>
              <th className="p-2 text-left font-medium text-gray-600">
                Related To
              </th>
              <th className="p-2 text-left font-medium text-gray-600">
                Contact Name
              </th>
              <th className="p-2 text-left font-medium text-gray-600">
                Call Owner
              </th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="p-8 text-center text-gray-400 text-xs"
                >
                  No calls found
                </td>
              </tr>
            ) : (
              calls.map((call) => (
                <tr
                  key={call.id}
                  className="border-b last:border-0 hover:bg-gray-50"
                >
                  <td className="p-2">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="p-2">
                    <div className="flex items-center gap-1">
                      {call.callType === "Inbound" ? (
                        <PhoneIncoming size={12} className="text-green-500 shrink-0" />
                      ) : (
                        <PhoneOutgoing size={12} className="text-blue-500 shrink-0" />
                      )}
                      <button
                        type="button"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {call.subject}
                      </button>
                    </div>
                  </td>
                  <td className="p-2 text-gray-600">{call.callType}</td>
                  <td className="p-2 text-gray-600">{call.callStartTime}</td>
                  <td className="p-2 text-gray-600">{call.callDuration}</td>
                  <td className="p-2">
                    {call.relatedTo ? (
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                      >
                        {call.relatedTo}
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-2">
                    {call.contactName ? (
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                      >
                        {call.contactName}
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-2 text-gray-600">{call.callOwner}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer count ── */}
      <div className="flex justify-between items-center text-xs text-gray-500 pt-1 border-t">
        <span>Total Records {calls.length}</span>
        <span>1 to {calls.length}</span>
      </div>

      {/* ── Modals ── */}
      <Modal
        open={modal === "log"}
        onClose={() => setModal(null)}
        title="Log a Call"
      >
        <LogACallForm
          onClose={() => setModal(null)}
          onSave={handleSaved}
          server={server}
        />
      </Modal>

      <Modal
        open={modal === "schedule"}
        onClose={() => setModal(null)}
        title="Schedule a Call"
      >
        <ScheduleACallForm
          onClose={() => setModal(null)}
          onSave={handleSaved}
          server={server}
        />
      </Modal>
    </div>
  );
};

export default CallLog;