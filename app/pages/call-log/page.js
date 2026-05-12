"use client";
import { SimpleButton, OutlinedButtonRed } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelLightGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import {
  ChevronDown,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  RefreshCw,
  X,
  Calendar,
  Clock,
  PhoneCall,
  Users,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
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
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-misty-rose bg-misty-rose/30">
          <h2 className="text-lg font-semibold text-eerie-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-dim-gray hover:text-red transition-colors rounded-full p-1 hover:bg-misty-rose"
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
      subject: "",
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
      await axios.post(`${server}/call-log`, { ...data, type: "log" });
      toast.success("Call logged successfully!");
      onSave?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log call");
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
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call For
            </label>
            <div className="flex gap-2 flex-1">
              <select
                {...register("callFor")}
                className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white w-28 focus:outline-none focus:border-red"
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Related To
            </label>
            <div className="flex gap-2 flex-1">
              <select
                {...register("relatedTo")}
                className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white w-28 focus:outline-none focus:border-red"
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call Type
            </label>
            <select
              {...register("callType")}
              className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white flex-1 focus:outline-none focus:border-red"
            >
              <option>Outbound</option>
              <option>Inbound</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Outgoing Status
            </label>
            <select
              {...register("outgoingCallStatus")}
              className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white flex-1 focus:outline-none focus:border-red"
            >
              <option>Completed</option>
              <option>No Answer</option>
              <option>Busy</option>
              <option>Failed</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call Duration
            </label>
            <div className="flex gap-2 items-center flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationMin"
                placeholder="00"
              />
              <span className="text-xs text-battleship-gray">min</span>
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationSec"
                placeholder="00"
              />
              <span className="text-xs text-battleship-gray">sec</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Reminder
            </label>
            <select
              {...register("reminder")}
              className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white flex-1 focus:outline-none focus:border-red"
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
      <div>
        <RedLabelHeading label="Purpose Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call Purpose
            </label>
            <select
              {...register("callPurpose")}
              className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white flex-1 focus:outline-none focus:border-red"
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
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
      <div>
        <RedLabelHeading label="Outcome Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call Result
            </label>
            <select
              {...register("callResult")}
              className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white flex-1 focus:outline-none focus:border-red"
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
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
      <div>
        <RedLabelHeading label="Reason For Incoming Call" />
        <div className="flex items-center gap-3 mt-3">
          <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
      <div className="flex justify-end gap-3 pt-3 border-t border-misty-rose">
        <OutlinedButtonRed label="Cancel" onClick={onClose} />
        <SimpleButton
          name={saving ? "Saving..." : "Save Call"}
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
      await axios.post(`${server}/call-log`, { ...data, type: "schedule" });
      toast.success("Call scheduled successfully!");
      onSave?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule call");
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
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call For
            </label>
            <div className="flex gap-2 flex-1">
              <select
                {...register("callFor")}
                className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white w-28 focus:outline-none focus:border-red"
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Related To
            </label>
            <div className="flex gap-2 flex-1">
              <select
                {...register("relatedTo")}
                className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white w-28 focus:outline-none focus:border-red"
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call Type
            </label>
            <select
              {...register("callType")}
              className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white flex-1 focus:outline-none focus:border-red"
            >
              <option>Outbound</option>
              <option>Inbound</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call Duration
            </label>
            <div className="flex gap-2 items-center flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationMin"
                placeholder="00"
              />
              <span className="text-xs text-battleship-gray">min</span>
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationSec"
                placeholder="00"
              />
              <span className="text-xs text-battleship-gray">sec</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Reminder
            </label>
            <select
              {...register("reminder")}
              className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white flex-1 focus:outline-none focus:border-red"
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
      <div>
        <RedLabelHeading label="Purpose Of Outgoing Call" />
        <div className="flex flex-col gap-3 mt-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
              Call Purpose
            </label>
            <select
              {...register("callPurpose")}
              className="border border-french-gray rounded-lg px-3 py-2 text-xs text-eerie-black bg-white flex-1 focus:outline-none focus:border-red"
            >
              <option>-None-</option>
              <option>Prospecting</option>
              <option>Administrative</option>
              <option>Negotiation</option>
              <option>Demo</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
      <div>
        <RedLabelHeading label="Description" />
        <div className="flex items-center gap-3 mt-3">
          <label className="text-xs font-medium text-dim-gray w-32 text-right shrink-0">
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
      <div className="flex justify-end gap-3 pt-3 border-t border-misty-rose">
        <OutlinedButtonRed name="Cancel" onClick={onClose} />
        <SimpleButton
          name={saving ? "Saving..." : "Schedule Call"}
          type="submit"
          disabled={saving}
        />
      </div>
    </form>
  );
};

// ─── Stats Card ────────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-xl border border-french-gray p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-battleship-gray uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-eerie-black mt-1">{value}</p>
      </div>
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon size={20} className={color.replace("bg-", "text-")} />
      </div>
    </div>
  </div>
);

// ─── Main CallLog component ───────────────────────────────────────────────────
const CallLog = () => {
  const { server } = useContext(GlobalContext);
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCalls: 0,
    totalLogs: 0,
    totalSchedules: 0,
    inboundCalls: 0,
    outboundCalls: 0,
    pendingCalls: 0,
    completedCalls: 0,
    avgDuration: "0m 0s",
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch calls from API
  const fetchCalls = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${server}/call-log`);
      if (response.data.success) {
        setCalls(response.data.data);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching calls:", error);
      toast.error("Failed to fetch calls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [server]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCalls();
    setRefreshing(false);
    toast.success("Calls refreshed");
  };

  const handleSaved = () => {
    fetchCalls();
  };

  const handleUpdateStatus = async (callId, action) => {
    try {
      await axios.patch(`${server}/call-log?id=${callId}&action=${action}`);
      toast.success(`Call ${action}ed successfully`);
      fetchCalls();
    } catch (error) {
      toast.error(`Failed to ${action} call`);
    }
  };

  const handleDelete = async (callId, isSchedule = false) => {
    const message = isSchedule
      ? "Are you sure you want to cancel this scheduled call?"
      : "Are you sure you want to delete this call log?";

    if (confirm(message)) {
      try {
        await axios.delete(`${server}/call-log?id=${callId}`);
        toast.success(
          isSchedule
            ? "Call cancelled successfully"
            : "Call deleted successfully",
        );
        fetchCalls();
      } catch (error) {
        toast.error("Failed to delete call");
      }
    }
  };

  // Format duration display
  const formatDuration = (call) => {
    if (call.callDurationMin && call.callDurationSec) {
      const mins = parseInt(call.callDurationMin);
      const secs = parseInt(call.callDurationSec);
      if (mins > 0 || secs > 0) {
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
    }
    return "--:--";
  };

  // Format date/time display
  const formatDateTime = (call) => {
    if (call.callStartDate && call.callStartTime) {
      return `${call.callStartDate} ${call.callStartTime}`;
    }
    return "Date not set";
  };

  return (
    <div className="bg-gray-50/40 p-6">
      <div className="mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <Heading
                title="Call Log"
                bulkUploadBtn="hidden"
                codeListBtn="hidden"
                refreshBtn="hidden"
              />
              <p className="text-xs text-gray-400 mt-0.5">
                Track and manage all your call activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-battleship-gray hover:text-red hover:bg-misty-rose rounded-lg transition-all"
            >
              <RefreshCw
                size={16}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>

            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center h-[30px]">
                <SimpleButton
                  name="Create Call"
                  onClick={() => {
                    setDropdownOpen(false);
                    setModal("log");
                  }}
                  className={`rounded-r-none bg-red`}
                />
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center justify-center h-[30px] px-2.5 bg-gradient-to-r from-red to-rose-700 text-white rounded-r-lg border-l hover:from-red hover:to-rose-500 transition-all"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-french-gray rounded-xl shadow-lg z-20 min-w-[170px] overflow-hidden">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setModal("schedule");
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-dim-gray hover:bg-misty-rose/30 hover:text-red transition-colors"
                  >
                    <Calendar size={12} /> Schedule a call
                  </button>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setModal("log");
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-xs text-dim-gray hover:bg-misty-rose/30 hover:text-red transition-colors border-t border-french-gray"
                  >
                    <PhoneOutgoing size={12} /> Log a call
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatsCard
            title="Total Calls"
            value={stats.totalCalls}
            icon={PhoneCall}
            color="bg-red"
          />
          <StatsCard
            title="Inbound"
            value={stats.inboundCalls}
            icon={PhoneIncoming}
            color="bg-green-500"
          />
          <StatsCard
            title="Outbound"
            value={stats.outboundCalls}
            icon={PhoneOutgoing}
            color="bg-orange-500"
          />
          <StatsCard
            title="Avg Duration"
            value={stats.avgDuration}
            icon={Clock}
            color="bg-blue-500"
          />
        </div>

        {/* Calls Table */}
        <div className="bg-white rounded-2xl border border-french-gray shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-misty-rose/20 border-b border-french-gray">
                  <th className="w-10 p-4">
                    <input
                      type="checkbox"
                      className="rounded border-french-gray accent-red"
                    />
                  </th>
                  <th className="p-4 text-left font-semibold text-eerie-black text-xs uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="p-4 text-left font-semibold text-eerie-black text-xs uppercase tracking-wider">
                    Type
                  </th>
                  <th className="p-4 text-left font-semibold text-eerie-black text-xs uppercase tracking-wider">
                    Start Time
                  </th>
                  <th className="p-4 text-left font-semibold text-eerie-black text-xs uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="p-4 text-left font-semibold text-eerie-black text-xs uppercase tracking-wider">
                    Related To
                  </th>
                  <th className="p-4 text-left font-semibold text-eerie-black text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="p-4 text-center font-semibold text-eerie-black text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-battleship-gray text-sm"
                    >
                      Loading calls...
                    </td>
                  </tr>
                ) : calls.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-12 text-center text-battleship-gray text-sm"
                    >
                      No calls recorded yet
                    </td>
                  </tr>
                ) : (
                  calls.map((call) => (
                    <tr
                      key={call._id}
                      className="border-b border-anti-flash-white last:border-0 hover:bg-seasalt transition-colors group"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="rounded border-french-gray accent-red"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {call.callType === "Inbound" ? (
                            <PhoneIncoming
                              size={14}
                              className="text-green-500"
                            />
                          ) : (
                            <PhoneOutgoing
                              size={14}
                              className="text-blue-500"
                            />
                          )}
                          <span className="text-eerie-black font-medium">
                            {call.subject || "No subject"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            call.callType === "Inbound"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {call.callType}
                        </span>
                      </td>
                      <td className="p-4 text-dim-gray text-xs">
                        {formatDateTime(call)}
                      </td>
                      <td className="p-4 text-dim-gray text-xs">
                        {formatDuration(call)}
                      </td>
                      <td className="p-4">
                        {call.relatedToSearch || call.relatedTo || "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            call.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : call.status === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : call.status === "missed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {call.status === "completed" && (
                            <CheckCircle size={10} />
                          )}
                          {call.status === "pending" && <Clock size={10} />}
                          {call.status === "missed" && (
                            <AlertCircle size={10} />
                          )}
                          {call.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {call.entryType === "schedule" &&
                            call.status === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(call._id, "complete")
                                  }
                                  className="p-1 text-green-600 hover:text-green-700 transition-colors"
                                  title="Mark as completed"
                                >
                                  <CheckCircle size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(call._id, "miss")
                                  }
                                  className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                  title="Mark as missed"
                                >
                                  <AlertCircle size={14} />
                                </button>
                              </>
                            )}
                          <button
                            onClick={() =>
                              handleDelete(
                                call._id,
                                call.entryType === "schedule",
                              )
                            }
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title={
                              call.entryType === "schedule"
                                ? "Cancel call"
                                : "Delete call"
                            }
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-4 py-3 bg-seasalt border-t border-french-gray text-xs text-dim-gray">
            <span>
              Showing{" "}
              <span className="font-medium text-eerie-black">
                {calls.length}
              </span>{" "}
              records
            </span>
            <div className="flex gap-2">
              <span className="text-battleship-gray">
                Total: {stats.totalCalls} | Logs: {stats.totalLogs} | Schedules:{" "}
                {stats.totalSchedules}
              </span>
            </div>
          </div>
        </div>
      </div>

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
