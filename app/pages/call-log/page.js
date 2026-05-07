"use client";
import { SimpleButton, OutlinedButtonRed } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelLightGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import { ArrowLeft, ChevronDown, Phone, PhoneIncoming, PhoneOutgoing, RefreshCw, X, Calendar, Clock, PhoneCall, Users, User, Briefcase, FileText, CheckCircle, AlertCircle, Mic, Bell, Target, List, MessageSquare } from "lucide-react";
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <RedLabelHeading label="Call Information" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call For</label>
            <div className="flex gap-2 flex-1">
              <select {...register("callFor")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white w-28 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all">
                <option>Contact</option><option>Lead</option>
              </select>
              <InputBox setValue={setValue} register={register} value="callForSearch" placeholder="Search..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Related To</label>
            <div className="flex gap-2 flex-1">
              <select {...register("relatedTo")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white w-28 focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300">
                <option>Account</option><option>Deal</option><option>Lead</option>
              </select>
              <InputBox setValue={setValue} register={register} value="relatedToSearch" placeholder="Search..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Type</label>
            <select {...register("callType")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white flex-1 focus:outline-none focus:ring-2 focus:ring-red-100">
              <option>Outbound</option><option>Inbound</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Outgoing Status</label>
            <select {...register("outgoingCallStatus")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white flex-1">
              <option>Completed</option><option>No Answer</option><option>Busy</option><option>Failed</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Start Time</label>
            <div className="flex gap-2 flex-1">
              <InputBox setValue={setValue} register={register} value="callStartDate" placeholder="MM/DD/YYYY" />
              <InputBox setValue={setValue} register={register} value="callStartTime" placeholder="HH:MM AM/PM" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Duration</label>
            <div className="flex gap-2 items-center flex-1">
              <InputBox setValue={setValue} register={register} value="callDurationMin" placeholder="00" />
              <span className="text-xs text-gray-400">min</span>
              <InputBox setValue={setValue} register={register} value="callDurationSec" placeholder="00" />
              <span className="text-xs text-gray-400">sec</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Subject</label>
            <div className="flex-1"><InputBox setValue={setValue} register={register} value="subject" placeholder="Subject" /></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Voice Recording</label>
            <div className="flex-1"><InputBox setValue={setValue} register={register} value="voiceRecording" placeholder="" /></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Reminder</label>
            <select {...register("reminder")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white flex-1">
              <option>None</option><option>5 minutes</option><option>10 minutes</option><option>15 minutes</option><option>30 minutes</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <RedLabelHeading label="Purpose Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Purpose</label>
            <select {...register("callPurpose")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white flex-1">
              <option>-None-</option><option>Prospecting</option><option>Administrative</option><option>Negotiation</option><option>Demo</option><option>Project</option><option>Desk</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Agenda</label>
            <div className="flex-1"><InputBox setValue={setValue} register={register} value="callAgenda" placeholder="" /></div>
          </div>
        </div>
      </div>
      <div>
        <RedLabelHeading label="Outcome Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Result</label>
            <select {...register("callResult")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white flex-1">
              <option>-None-</option><option>Interested</option><option>Not Interested</option><option>No response/Busy</option><option>Requested more info</option><option>Requested call back</option><option>Invalid number</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Description</label>
            <div className="flex-1"><InputBox setValue={setValue} register={register} value="outcomeDescription" placeholder="" /></div>
          </div>
        </div>
      </div>
      <div>
        <RedLabelHeading label="Reason For Incoming Call" />
        <div className="flex items-center gap-3 mt-3">
          <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Description</label>
          <div className="flex-1"><InputBox setValue={setValue} register={register} value="incomingDescription" placeholder="" /></div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
        <OutlinedButtonRed name="Cancel" onClick={onClose} />
        <SimpleButton name={saving ? "Saving…" : "Save Call"} type="submit" disabled={saving} />
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div>
        <RedLabelHeading label="Call Information" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call For</label>
            <div className="flex gap-2 flex-1">
              <select {...register("callFor")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white w-28">
                <option>Contact</option><option>Lead</option>
              </select>
              <InputBox setValue={setValue} register={register} value="callForSearch" placeholder="Search..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Related To</label>
            <div className="flex gap-2 flex-1">
              <select {...register("relatedTo")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white w-28">
                <option>Account</option><option>Deal</option><option>Lead</option>
              </select>
              <InputBox setValue={setValue} register={register} value="relatedToSearch" placeholder="Search..." />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Type</label>
            <select {...register("callType")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white flex-1">
              <option>Outbound</option><option>Inbound</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Start Time</label>
            <div className="flex gap-2 flex-1">
              <InputBox setValue={setValue} register={register} value="callStartDate" placeholder="MM/DD/YYYY" />
              <InputBox setValue={setValue} register={register} value="callStartTime" placeholder="HH:MM AM/PM" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Duration</label>
            <div className="flex gap-2 items-center flex-1">
              <InputBox setValue={setValue} register={register} value="callDurationMin" placeholder="00" />
              <span className="text-xs text-gray-400">min</span>
              <InputBox setValue={setValue} register={register} value="callDurationSec" placeholder="00" />
              <span className="text-xs text-gray-400">sec</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Subject</label>
            <div className="flex-1"><InputBox setValue={setValue} register={register} value="subject" placeholder="Subject" /></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Reminder</label>
            <select {...register("reminder")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white flex-1">
              <option>None</option><option>5 minutes</option><option>10 minutes</option><option>15 minutes</option><option>30 minutes</option>
            </select>
          </div>
        </div>
      </div>
      <div>
        <RedLabelHeading label="Purpose Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Purpose</label>
            <select {...register("callPurpose")} className="border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 bg-white flex-1">
              <option>-None-</option><option>Prospecting</option><option>Administrative</option><option>Negotiation</option><option>Demo</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Call Agenda</label>
            <div className="flex-1"><InputBox setValue={setValue} register={register} value="callAgenda" placeholder="" /></div>
          </div>
        </div>
      </div>
      <div>
        <RedLabelHeading label="Description" />
        <div className="flex items-center gap-3 mt-3">
          <label className="text-xs font-medium text-gray-500 w-32 text-right shrink-0">Description</label>
          <div className="flex-1"><InputBox setValue={setValue} register={register} value="description" placeholder="" /></div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
        <OutlinedButtonRed name="Cancel" onClick={onClose} />
        <SimpleButton name={saving ? "Saving…" : "Schedule Call"} type="submit" disabled={saving} />
      </div>
    </form>
  );
};

// ─── Stats Card ────────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon size={20} className={color.replace("bg-", "text-")} />
      </div>
    </div>
  </div>
);

// ─── Main CallLog component ───────────────────────────────────────────────────
const CallLog = () => {
  const { setCurrentTab, server } = useContext(GlobalContext);
  const [calls, setCalls] = useState([
    { id: 1, subject: "Call Customer on Potential", callType: "Inbound", callStartTime: "07/05/2026 11:50 AM", callDuration: "00:15", relatedTo: "King", contactName: "Sage Wieser (Sample)", callOwner: "Harmanjeet Singh" },
    { id: 2, subject: "Follow up with Lead", callType: "Outbound", callStartTime: "07/05/2026 03:50 PM", callDuration: "00:00", relatedTo: "Chau Kitzman (Sample)", contactName: "", callOwner: "Harmanjeet Singh" },
  ]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.success("Calls refreshed");
    setRefreshing(false);
  };

  const handleSaved = () => {};

  const stats = {
    total: calls.length,
    inbound: calls.filter(c => c.callType === "Inbound").length,
    outbound: calls.filter(c => c.callType === "Outbound").length,
    avgDuration: "7m 30s"
  };

  return (
    <div className="min-h-screen bg-gray-50/40 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl shadow-md">
              <PhoneCall size={20} className="text-white" />
            </div>
            <div>
              <Heading title="Call Log" bulkUploadBtn="hidden" codeListBtn="hidden" />
              <p className="text-xs text-gray-400 mt-0.5">Track and manage all your call activities</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            </button>

            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center">
                <SimpleButton name="Create Call" onClick={() => { setDropdownOpen(false); setModal("log"); }} />
                <button
                  type="button"
                  onClick={() => setDropdownOpen(v => !v)}
                  className="flex items-center justify-center h-full px-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-r-lg border-l border-red-400 hover:from-red-600 hover:to-red-700 transition-all"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-100 rounded-xl shadow-lg z-20 min-w-[170px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <button onClick={() => { setDropdownOpen(false); setModal("schedule"); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                    <Calendar size={12} className="text-gray-400" /> Schedule a call
                  </button>
                  <button onClick={() => { setDropdownOpen(false); setModal("log"); }} className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-50">
                    <PhoneOutgoing size={12} className="text-gray-400" /> Log a call
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCard title="Total Calls" value={stats.total} icon={PhoneCall} color="bg-blue-500" />
          <StatsCard title="Inbound" value={stats.inbound} icon={PhoneIncoming} color="bg-green-500" />
          <StatsCard title="Outbound" value={stats.outbound} icon={PhoneOutgoing} color="bg-orange-500" />
          <StatsCard title="Avg Duration" value={stats.avgDuration} icon={Clock} color="bg-purple-500" />
        </div>

        {/* Calls Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="w-10 p-4"><input type="checkbox" className="rounded border-gray-300 text-red-500 focus:ring-red-200" /></th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Subject</th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Type</th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Start Time</th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Duration</th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Related To</th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Contact</th>
                  <th className="p-4 text-left font-semibold text-gray-600 text-xs uppercase tracking-wider">Owner</th>
                </tr>
              </thead>
              <tbody>
                {calls.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-gray-400 text-sm">No calls recorded yet</td></tr>
                ) : (
                  calls.map((call) => (
                    <tr key={call.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4"><input type="checkbox" className="rounded border-gray-300" /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {call.callType === "Inbound" ? <PhoneIncoming size={14} className="text-green-500" /> : <PhoneOutgoing size={14} className="text-blue-500" />}
                          <button className="text-gray-700 font-medium hover:text-red-600 hover:underline transition-colors">{call.subject}</button>
                        </div>
                      </td>
                      <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${call.callType === "Inbound" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>{call.callType}</span></td>
                      <td className="p-4 text-gray-500 text-xs">{call.callStartTime}</td>
                      <td className="p-4 text-gray-500 text-xs">{call.callDuration}</td>
                      <td className="p-4">{call.relatedTo ? <button className="text-blue-600 hover:underline text-xs">{call.relatedTo}</button> : <span className="text-gray-300">—</span>}</td>
                      <td className="p-4">{call.contactName ? <button className="text-blue-600 hover:underline text-xs">{call.contactName}</button> : <span className="text-gray-300">—</span>}</td>
                      <td className="p-4 text-gray-500 text-xs flex items-center gap-1"><Users size={10} className="text-gray-400" />{call.callOwner}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500">
            <span>Showing <span className="font-medium text-gray-700">{calls.length}</span> records</span>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={modal === "log"} onClose={() => setModal(null)} title="Log a Call">
        <LogACallForm onClose={() => setModal(null)} onSave={handleSaved} server={server} />
      </Modal>
      <Modal open={modal === "schedule"} onClose={() => setModal(null)} title="Schedule a Call">
        <ScheduleACallForm onClose={() => setModal(null)} onSave={handleSaved} server={server} />
      </Modal>
    </div>
  );
};

export default CallLog;