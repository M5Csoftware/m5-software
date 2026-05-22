"use client";
import { SimpleButton, OutlinedButtonRed } from "@/app/components/Buttons";
import { RedLabelHeading } from "@/app/components/Heading";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import {
  ChevronDown,
  PhoneIncoming,
  PhoneOutgoing,
  RefreshCw,
  X,
  Calendar,
  Clock,
  PhoneCall,
  CheckCircle,
  AlertCircle,
  History,
  Mic,
  Play,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Download,
  DatabaseZap,
  ArrowUpDown,
  Eye,
  ListTodo,
} from "lucide-react";
import React, {
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// ─── Helpers ───────────────────────────────────────────────────────────────────
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

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}
function iso30DaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

// ─── Modal ─────────────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-white rounded-2xl shadow-2xl ${wide ? "w-[700px]" : "w-[540px]"} max-h-[92vh] overflow-y-auto z-10`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-misty-rose bg-misty-rose/30 sticky top-0">
          <h2 className="text-lg font-semibold text-eerie-black">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-dim-gray hover:text-red rounded-full p-1 hover:bg-misty-rose transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// ─── Schedule Call Form ────────────────────────────────────────────────────────
const ScheduleCallForm = ({
  onClose,
  onSave,
  server,
  initialCustomerNumber = "",
  initialCustomerName = "",
}) => {
  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      customer_name: initialCustomerName,
      customer_number: initialCustomerNumber,
      schedule_callback_date_time: new Date(Date.now() + 3600000)
        .toISOString()
        .slice(0, 16),
      schedule_callback_text: "",
      assigned_to: "",
      call_end_min: "10",
    },
  });

  const [saving, setSaving] = useState(false);
  const scheduleDateTime = watch("schedule_callback_date_time");

  // Reset form when initial values change
  useEffect(() => {
    reset({
      customer_name: initialCustomerName,
      customer_number: initialCustomerNumber,
      schedule_callback_date_time: new Date(Date.now() + 3600000)
        .toISOString()
        .slice(0, 16),
      schedule_callback_text: "",
      assigned_to: "",
      call_end_min: "10",
    });
  }, [initialCustomerName, initialCustomerNumber, reset]);

  const onSubmit = async (data) => {
    if (!data.customer_number) {
      toast.error("Customer number is required");
      return;
    }
    if (!data.schedule_callback_date_time) {
      toast.error("Schedule date and time is required");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post(
        `${server}/call-log?action=schedule`,
        data,
      );
      if (response.data.success) {
        toast.success("Call scheduled successfully!");
        onSave?.();
        onClose();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Schedule error:", error);
      toast.error(error.response?.data?.message || "Failed to schedule call");
    } finally {
      setSaving(false);
    }
  };

  // Get min datetime (now)
  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">
            Customer Name
          </label>
          <input
            {...register("customer_name")}
            type="text"
            placeholder="Enter customer name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">
            Customer Number <span className="text-red-500">*</span>
          </label>
          <input
            {...register("customer_number")}
            type="tel"
            placeholder="+91XXXXXXXXXX"
            required
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-700">
          Schedule Date & Time <span className="text-red-500">*</span>
        </label>
        <input
          {...register("schedule_callback_date_time")}
          type="datetime-local"
          min={minDateTime}
          required
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
        />
        {scheduleDateTime && (
          <p className="text-[10px] text-gray-500">
            Scheduled for: {new Date(scheduleDateTime).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">
            Assigned To (Agent ID)
          </label>
          <input
            {...register("assigned_to")}
            type="text"
            placeholder="Agent ID or name"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-gray-700">
            Call Duration (minutes)
          </label>
          <select
            {...register("call_end_min")}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
          >
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-700">
          Call Notes / Agenda
        </label>
        <textarea
          {...register("schedule_callback_text")}
          rows="3"
          placeholder="Enter call agenda or notes..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500"
        />
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 mt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm text-white bg-red rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
        >
          {saving ? "Scheduling..." : "Schedule Call"}
        </button>
      </div>
    </form>
  );
};

// ─── Scheduled Calls List Component ───────────────────────────────────────────
const ScheduledCallsList = ({ server, onScheduleClick, refreshTrigger }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [cancelling, setCancelling] = useState(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: "schedules",
        page: pagination.page,
        limit: 50,
      });
      if (filter === "upcoming") {
        params.append("status", "pending");
      }

      const response = await axios.get(`${server}/call-log?${params}`);
      if (response.data.success) {
        setSchedules(response.data.data);
        setPagination((prev) => ({
          ...prev,
          total: response.data.pagination?.total || 0,
          pages: response.data.pagination?.pages || 1,
        }));
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      toast.error("Failed to fetch scheduled calls");
    } finally {
      setLoading(false);
    }
  }, [server, filter, pagination.page]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules, refreshTrigger]);

  const cancelSchedule = async (id) => {
    if (!confirm("Are you sure you want to cancel this scheduled call?"))
      return;

    setCancelling(id);
    try {
      await axios.delete(`${server}/call-log/schedule/${id}`);
      toast.success("Schedule cancelled");
      fetchSchedules();
    } catch (error) {
      toast.error("Failed to cancel schedule");
    } finally {
      setCancelling(null);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return { date: "—", time: "—", isPast: false };
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString(),
      isPast: date < new Date(),
    };
  };

  const getStatusBadge = (status, isPast) => {
    if (isPast && status === "pending") {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
          Missed
        </span>
      );
    }
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            Pending
          </span>
        );
      case "completed":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Completed
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo size={18} className="text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800">
            Scheduled Calls
          </h3>
          <span className="text-xs text-gray-400">
            ({pagination.total} total)
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filter === "upcoming"
                ? "bg-red text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filter === "all"
                ? "bg-red text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => onScheduleClick()}
            className="px-3 py-1.5 text-xs bg-red text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            + New Schedule
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No scheduled calls found</p>
          <button
            onClick={() => onScheduleClick()}
            className="mt-3 text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Schedule a call
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const { date, time, isPast } = formatDateTime(
              schedule.callStartDateTime,
            );
            const canCancel = !isPast && schedule.status === "pending";

            return (
              <div
                key={schedule._id}
                className={`border rounded-xl p-4 transition-all ${
                  isPast && schedule.status === "pending"
                    ? "bg-red-50 border-red-200"
                    : "bg-white border-gray-200 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusBadge(schedule.status, isPast)}
                      <span className="text-xs text-gray-400">
                        Created:{" "}
                        {new Date(schedule.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="font-medium text-gray-800">
                          {schedule.callForSearch || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Assigned To</p>
                        <p className="font-medium text-gray-800">
                          {schedule.callOwner || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date & Time</p>
                        <p className="font-medium text-gray-800">
                          {date} at {time}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-medium text-gray-800">
                          {schedule.callDurationMin} minutes
                        </p>
                      </div>
                    </div>

                    {schedule.description && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-600">
                          {schedule.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {canCancel && (
                    <button
                      onClick={() => cancelSchedule(schedule._id)}
                      disabled={cancelling === schedule._id}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Cancel schedule"
                    >
                      {cancelling === schedule._id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <X size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Call Detail Modal ─────────────────────────────────────────────────────────
const CallDetailModal = ({ call, onClose }) => {
  if (!call) return null;
  return (
    <Modal open onClose={onClose} title="Call Details" wide>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${call.callType === "Inbound" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
          >
            {call.callType === "Inbound" ? (
              <PhoneIncoming className="inline w-3 h-3 mr-1" />
            ) : (
              <PhoneOutgoing className="inline w-3 h-3 mr-1" />
            )}
            {call.callType}
          </span>
          <StatusBadge status={call.status} />
          {call.recordingFileLink && (
            <a
              href={call.recordingFileLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            >
              <Mic className="w-3 h-3" /> Recording available
            </a>
          )}
        </div>

        <div>
          <RedLabelHeading label="Call Information" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              ["From Number", call.callForSearch || "—"],
              [
                "To Number",
                call.relatedToSearch || call.forwardToNumber || "—",
              ],
              ["Date", call.callStartDate],
              ["Time", call.callStartTime],
              [
                "Duration",
                `${call.callDurationMin || "00"}:${call.callDurationSec || "00"}`,
              ],
              ["Status", call.status],
              ["Service", call.service || "—"],
              ["Call ID", call.callId || call._id || "—"],
            ].map(([label, val]) => (
              <div
                key={label}
                className="flex flex-col gap-0.5 bg-gray-50 rounded-lg p-2.5"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  {label}
                </span>
                <span className="text-xs text-gray-800 font-medium break-all">
                  {String(val)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {call.source === "acefone" && (
          <div>
            <RedLabelHeading label="Telephony Stats" />
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                ["Bill Seconds", `${call.billSec}s`],
                ["Ring Time", `${call.ringTime}s`],
                ["Answer Time", `${call.answerTime}s`],
                ["Inbound Sec", `${call.inboundSec}s`],
                ["Outbound Sec", `${call.outboundSec}s`],
                ["Charges", `₹${call.totalCharges}`],
                ["Hangup Cause", call.hangupCause || "—"],
                ["Reason", call.reasonKey || "—"],
                ["Answered By", call.callAnsweredBy || "—"],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="flex flex-col gap-0.5 bg-blue-50/60 rounded-lg p-2.5"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                    {label}
                  </span>
                  <span className="text-xs text-gray-800 font-medium">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {call.callFlow?.length > 0 && (
          <div>
            <RedLabelHeading label="Call Flow" />
            <ol className="mt-2 flex flex-col gap-1.5 relative border-l-2 border-misty-rose ml-2 pl-4">
              {call.callFlow.map((step, i) => (
                <li
                  key={i}
                  className="text-xs text-gray-500 relative before:absolute before:-left-[21px] before:top-1.5 before:w-3 before:h-3 before:rounded-full before:bg-red before:border-2 before:border-white"
                >
                  <span className="text-red font-semibold mr-1">{i + 1}.</span>
                  {typeof step === "object" ? JSON.stringify(step) : step}
                </li>
              ))}
            </ol>
          </div>
        )}

        {call.recordingFileLink && (
          <div>
            <RedLabelHeading label="Call Recording" />
            <div className="mt-2 flex items-center gap-3">
              <a
                href={call.recordingFileLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 transition-colors"
              >
                <Play size={12} /> Play Recording
              </a>
              <a
                href={call.recordingFileLink}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-xs text-gray-500 hover:border-red-500 hover:text-red-500 transition-colors"
              >
                <Download size={12} /> Download
              </a>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── Sync Progress Modal ───────────────────────────────────────────────────────
const SyncModal = ({ open, onClose, server }) => {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);

  const runSync = async () => {
    setStatus("running");
    try {
      const res = await axios.get(`${server}/call-log?sync=true`);
      setResult(res.data);
      setStatus("done");
    } catch (err) {
      setResult({ message: err.response?.data?.message || err.message });
      setStatus("error");
    }
  };

  const handleClose = () => {
    setStatus("idle");
    setResult(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Sync All Acefone Data to Database"
    >
      <div className="flex flex-col gap-5">
        <div className="bg-blue-50 rounded-xl p-4 text-xs text-blue-700 leading-relaxed">
          This will fetch <strong>every call log</strong> from your Acefone
          account (all pages) and save them permanently to your database.
        </div>

        {status === "idle" && (
          <div className="flex justify-end gap-3">
            <OutlinedButtonRed label="Cancel" onClick={handleClose} />
            <SimpleButton name="Start Sync" onClick={runSync} />
          </div>
        )}

        {status === "running" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 border-4 border-red border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">
              Fetching all pages from Acefone…
            </p>
          </div>
        )}

        {status === "done" && result && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Total Fetched", result.total],
                ["New Records", result.inserted],
                ["Updated", result.updated],
              ].map(([label, val]) => (
                <div
                  key={label}
                  className="bg-green-50 rounded-xl p-3 text-center"
                >
                  <p className="text-2xl font-bold text-green-700">
                    {val ?? "—"}
                  </p>
                  <p className="text-[10px] text-green-600 font-medium uppercase tracking-wider mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-600 font-medium text-center">
              {result.message}
            </p>
            <div className="flex justify-end">
              <SimpleButton name="Done" onClick={handleClose} />
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col gap-3">
            <div className="bg-red-50 rounded-xl p-4 text-xs text-red-600">
              {result?.message}
            </div>
            <div className="flex justify-end gap-2">
              <OutlinedButtonRed label="Close" onClick={handleClose} />
              <SimpleButton name="Retry" onClick={runSync} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// ─── LogACallForm ──────────────────────────────────────────────────────────────
const LogACallForm = ({ onClose, onSave, server }) => {
  const { register, setValue, handleSubmit } = useForm({
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
      reminder: "None",
      callPurpose: "-None-",
      callAgenda: "",
      callResult: "-None-",
      outcomeDescription: "",
    },
  });
  const [saving, setSaving] = useState(false);
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await axios.post(`${server}/call-log`, { ...data, type: "log" });
      toast.success("Call logged!");
      onSave?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <RedLabelHeading label="Call Information" />
      <div className="flex flex-col gap-3">
        {[
          [
            "Call For",
            <div className="flex gap-2 flex-1">
              <select
                {...register("callFor")}
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white w-28"
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
            </div>,
          ],
          [
            "Related To",
            <div className="flex gap-2 flex-1">
              <select
                {...register("relatedTo")}
                className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white w-28"
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
            </div>,
          ],
          [
            "Call Type",
            <select
              {...register("callType")}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white flex-1"
            >
              <option>Outbound</option>
              <option>Inbound</option>
            </select>,
          ],
          [
            "Status",
            <select
              {...register("outgoingCallStatus")}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white flex-1"
            >
              <option>Completed</option>
              <option>No Answer</option>
              <option>Busy</option>
              <option>Failed</option>
            </select>,
          ],
          [
            "Start Time",
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
            </div>,
          ],
          [
            "Duration",
            <div className="flex gap-2 items-center flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationMin"
                placeholder="00"
              />
              <span className="text-xs text-gray-500">min</span>
              <InputBox
                setValue={setValue}
                register={register}
                value="callDurationSec"
                placeholder="00"
              />
              <span className="text-xs text-gray-500">sec</span>
            </div>,
          ],
          [
            "Subject",
            <div className="flex-1">
              <InputBox
                setValue={setValue}
                register={register}
                value="subject"
                placeholder="Subject"
              />
            </div>,
          ],
        ].map(([label, el]) => (
          <div key={label} className="flex items-center gap-3">
            <label className="text-xs font-medium text-gray-500 w-28 text-right shrink-0">
              {label}
            </label>
            {el}
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
        <OutlinedButtonRed label="Cancel" onClick={onClose} />
        <SimpleButton
          name={saving ? "Saving…" : "Save Call"}
          type="submit"
          disabled={saving}
        />
      </div>
    </form>
  );
};

// ─── Status Badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    answered: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    missed: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-gray-100 text-gray-500",
    busy: "bg-purple-100 text-purple-700",
    failed: "bg-red-100 text-red-700",
    unknown: "bg-gray-100 text-gray-500",
  };
  const icons = {
    answered: <CheckCircle size={9} />,
    completed: <CheckCircle size={9} />,
    missed: <AlertCircle size={9} />,
    pending: <Clock size={9} />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-500"}`}
    >
      {icons[status]} {status}
    </span>
  );
};

// ─── Stats Card ────────────────────────────────────────────────────────────────
const StatsCard = ({ title, value, icon: Icon, color, sub }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
        {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${color}/10`}>
        <Icon size={18} className={color.replace("bg-", "text-")} />
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const CallLog = () => {
  const { server, setActiveTabs, activeTabs, setCurrentTab } =
    useContext(GlobalContext);

  const [activeView, setActiveView] = useState("logs");
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acefoneOk, setAcefoneOk] = useState(null);
  const [stats, setStats] = useState({
    totalCalls: 0,
    inboundCalls: 0,
    outboundCalls: 0,
    avgDuration: "—",
    answeredCalls: 0,
    missedCalls: 0,
    totalCharges: "0.00",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0,
    pageRecords: 0,
  });
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    from_date: iso30DaysAgo(),
    to_date: isoToday(),
    call_status: "",
    search: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState({ field: "date", order: "desc" });
  const [modal, setModal] = useState(null);
  const [detailCall, setDetailCall] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [scheduleRefreshTrigger, setScheduleRefreshTrigger] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState({
    number: "",
    name: "",
  });

  const dropdownRef = useRef(null);
  const LIMIT = 100;

  const fetchCalls = useCallback(
    async (pg = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          source: "acefone",
          limit: LIMIT,
          page: pg,
          sort: sort.field,
          order: sort.order,
        });
        if (filters.from_date) params.set("from_date", filters.from_date);
        if (filters.to_date) params.set("to_date", filters.to_date);
        if (filters.call_status) params.set("call_status", filters.call_status);

        const res = await axios.get(`${server}/call-log?${params}`);
        if (!res.data.success) throw new Error(res.data.message);

        let data = res.data.data;
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase();
          data = data.filter(
            (c) =>
              c.subject?.toLowerCase().includes(q) ||
              c.callForSearch?.toLowerCase().includes(q) ||
              c.relatedToSearch?.toLowerCase().includes(q) ||
              c.callId?.toLowerCase().includes(q) ||
              c.service?.toLowerCase().includes(q),
          );
        }

        setCalls(data);
        setStats(res.data.stats);
        setPagination(res.data.pagination);
        setAcefoneOk(true);
      } catch (err) {
        console.error(err);
        setAcefoneOk(false);
        toast.error(
          "Acefone fetch failed: " +
            (err.response?.data?.message || err.message),
        );
      } finally {
        setLoading(false);
      }
    },
    [server, page, filters, sort],
  );

  useEffect(() => {
    fetchCalls(page);
  }, [page, sort]);

  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCalls(page);
    setRefreshing(false);
    toast.success("Refreshed");
  };

  const applyFilters = () => {
    setPage(1);
    setFilterOpen(false);
    fetchCalls(1);
  };
  const resetFilters = () => {
    setFilters({
      from_date: iso30DaysAgo(),
      to_date: isoToday(),
      call_status: "",
      search: "",
    });
    setPage(1);
    setFilterOpen(false);
  };

  const exportCSV = () => {
    if (!calls.length) return toast.error("No data to export");
    const headers = [
      "Date",
      "Time",
      "Type",
      "From",
      "To",
      "Duration",
      "Status",
      "Service",
      "Call ID",
      "Recording",
    ];
    const rows = calls.map((c) => [
      c.callStartDate,
      c.callStartTime,
      c.callType,
      c.callForSearch,
      c.relatedToSearch,
      `${c.callDurationMin}:${c.callDurationSec}`,
      c.status,
      c.service,
      c.callId,
      c.recordingFileLink || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call_logs_${isoToday()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${calls.length} records`);
  };

  const toggleSort = (field) =>
    setSort((s) => ({
      field,
      order: s.field === field && s.order === "asc" ? "desc" : "asc",
    }));
  const SortBtn = ({ field, label }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 group"
    >
      {label}
      <ArrowUpDown
        size={10}
        className={`transition-colors ${sort.field === field ? "text-red-500" : "text-gray-400 group-hover:text-gray-500"}`}
      />
    </button>
  );

  const openScheduleForCustomer = (customerNumber, customerName) => {
    setSelectedCustomer({ number: customerNumber, name: customerName });
    setModal("schedule");
  };

  return (
    <div className="bg-gray-50/40 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Heading
            title="Call Log"
            bulkUploadBtn="hidden"
            codeListBtn="hidden"
            refreshBtn="hidden"
          />
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-400">
              Live data from Acefone · Last 30 days by default
            </p>
            {acefoneOk === true && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <Wifi size={9} /> Acefone Live
              </span>
            )}
            {acefoneOk === false && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                <WifiOff size={9} /> Acefone Offline
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={filters.search}
              onChange={(e) =>
                setFilters((f) => ({ ...f, search: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && fetchCalls(1)}
              placeholder="Search…"
              className="pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg w-36 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-lg transition-colors ${filterOpen || filters.call_status ? "border-red-500 text-red-500 bg-red-50" : "border-gray-300 text-gray-500 hover:border-red-500 hover:text-red-500"}`}
            >
              <Filter size={11} /> Filters
              {filters.call_status && (
                <span className="w-1.5 h-1.5 rounded-full bg-red" />
              )}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 p-5 flex flex-col gap-4 w-72">
                <p className="text-xs font-bold text-gray-800">Filter Calls</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={filters.from_date}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, from_date: e.target.value }))
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={filters.to_date}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, to_date: e.target.value }))
                      }
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                    Call Status
                  </label>
                  <select
                    value={filters.call_status}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, call_status: e.target.value }))
                    }
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="">All Statuses</option>
                    <option value="answered">Answered</option>
                    <option value="missed">Missed</option>
                    <option value="busy">Busy</option>
                    <option value="no-answer">No Answer</option>
                    <option value="failed">Failed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={resetFilters}
                    className="flex-1 text-xs text-gray-500 border border-gray-300 rounded-lg py-1.5 hover:border-red-500 hover:text-red-500"
                  >
                    Reset
                  </button>
                  <button
                    onClick={applyFilters}
                    className="flex-1 text-xs text-white bg-red rounded-lg py-1.5 hover:bg-red-600"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-500 hover:border-red-500 hover:text-red-500"
          >
            <Download size={11} /> Export
          </button>
          <button
            onClick={() => setModal("sync")}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600"
          >
            <DatabaseZap size={11} /> Sync DB
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          </button>

          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center h-[30px]">
              <SimpleButton
                name="Log Call"
                onClick={() => {
                  setDropdownOpen(false);
                  setModal("log");
                  setSelectedCustomer({ number: "", name: "" });
                }}
                className="rounded-r-none bg-red"
              />
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center justify-center h-[30px] px-2.5 bg-red text-white rounded-r-lg border-l"
              >
                <ChevronDown size={13} />
              </button>
            </div>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 min-w-[160px] overflow-hidden">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setModal("schedule");
                    setSelectedCustomer({ number: "", name: "" });
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-gray-500 hover:bg-red-50 hover:text-red-500"
                >
                  <Calendar size={11} /> Schedule a call
                </button>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setModal("log");
                    setSelectedCustomer({ number: "", name: "" });
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs text-gray-500 hover:bg-red-50 hover:text-red-500 border-t border-gray-100"
                >
                  <PhoneOutgoing size={11} /> Log a call
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setActiveView("logs")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeView === "logs" ? "text-red-500 border-b-2 border-red-500" : "text-gray-500 hover:text-gray-700"}`}
        >
          <PhoneCall size={14} className="inline mr-1" /> Call Logs
        </button>
        <button
          onClick={() => setActiveView("schedules")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeView === "schedules" ? "text-red-500 border-b-2 border-red-500" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Calendar size={14} className="inline mr-1" /> Scheduled Calls
        </button>
      </div>

      {activeView === "logs" ? (
        <>
          <div className="grid grid-cols-6 gap-3 mb-6">
            <StatsCard
              title="Total Calls"
              value={pagination.total || stats.totalCalls}
              icon={PhoneCall}
              color="bg-red"
              sub={`${pagination.pageRecords || calls.length} on this page`}
            />
            <StatsCard
              title="Inbound"
              value={stats.inboundCalls}
              icon={PhoneIncoming}
              color="bg-green-500"
              sub="received"
            />
            <StatsCard
              title="Outbound"
              value={stats.outboundCalls}
              icon={PhoneOutgoing}
              color="bg-blue-500"
              sub="dialled"
            />
            <StatsCard
              title="Answered"
              value={stats.answeredCalls}
              icon={CheckCircle}
              color="bg-emerald-500"
              sub="connected"
            />
            <StatsCard
              title="Missed"
              value={stats.missedCalls}
              icon={AlertCircle}
              color="bg-orange-500"
              sub="no answer"
            />
            <StatsCard
              title="Avg Duration"
              value={stats.avgDuration}
              icon={Clock}
              color="bg-purple-500"
              sub={`₹${stats.totalCharges} total`}
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="w-10 p-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortBtn field="date" label="Date & Time" />
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      From Number
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      To / Service
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <SortBtn field="bill_sec" label="Duration" />
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="p-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Hangup
                    </th>
                    <th className="p-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Rec
                    </th>
                    <th className="p-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-gray-500">
                            Fetching call logs from Acefone…
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : calls.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-16 text-center">
                        <PhoneCall
                          size={36}
                          className="mx-auto text-gray-300 mb-3"
                        />
                        <p className="text-gray-500">No calls found</p>
                      </td>
                    </tr>
                  ) : (
                    calls.map((call) => (
                      <tr
                        key={call._id}
                        onClick={() => setDetailCall(call)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <td
                          className="p-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <span className="text-xs font-medium text-gray-800">
                              {call.callStartDate}
                            </span>
                            <br />
                            <span className="text-[10px] text-gray-500">
                              {call.callStartTime}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${call.callType === "Inbound" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {call.callType === "Inbound" ? (
                              <PhoneIncoming size={9} />
                            ) : (
                              <PhoneOutgoing size={9} />
                            )}{" "}
                            {call.callType}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-mono text-gray-800">
                            {call.callForSearch || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs text-gray-800 font-medium">
                            {call.service || call.relatedToSearch || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-mono text-gray-500">
                            {call.callDurationMin}:{call.callDurationSec}
                          </span>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={call.status} />
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] text-gray-500">
                            {call.hangupCause || "—"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {call.recordingFileLink ? (
                            <a
                              href={call.recordingFileLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white"
                            >
                              <Play size={11} />
                            </a>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td
                          className="p-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setDetailCall(call)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() =>
                                openScheduleForCustomer(
                                  call.callForSearch,
                                  call.clientName || "",
                                )
                              }
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <Calendar size={12} />
                            </button>
                            <button
                              onClick={() => {
                                const customer =
                                  call.callForSearch || "General";
                                const tabName = `Timeline: ${customer}`;
                                if (
                                  !activeTabs?.find(
                                    (t) => t.subfolder === tabName,
                                  )
                                )
                                  setActiveTabs?.((prev) => [
                                    ...prev,
                                    {
                                      folder: "CRM",
                                      subfolder: tabName,
                                      customer,
                                    },
                                  ]);
                                setCurrentTab?.(tabName);
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <History size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-800">
                  {calls.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-800">
                  {pagination.total ?? "—"}
                </span>{" "}
                records
              </div>
              {pagination.pages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="text-xs font-medium px-2">
                    {page} / {pagination.pages}
                  </span>
                  <button
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <ScheduledCallsList
          server={server}
          onScheduleClick={() => {
            setSelectedCustomer({ number: "", name: "" });
            setModal("schedule");
          }}
          refreshTrigger={scheduleRefreshTrigger}
        />
      )}

      <Modal
        open={modal === "log"}
        onClose={() => setModal(null)}
        title="Log a Call"
      >
        <LogACallForm
          onClose={() => setModal(null)}
          onSave={() => {
            setModal(null);
            fetchCalls(page);
          }}
          server={server}
        />
      </Modal>

      <Modal
        open={modal === "schedule"}
        onClose={() => setModal(null)}
        title="Schedule a Call"
      >
        <ScheduleCallForm
          onClose={() => {
            setModal(null);
            setScheduleRefreshTrigger((prev) => prev + 1);
          }}
          onSave={() => {
            setModal(null);
            setScheduleRefreshTrigger((prev) => prev + 1);
          }}
          server={server}
          initialCustomerNumber={selectedCustomer.number}
          initialCustomerName={selectedCustomer.name}
        />
      </Modal>

      <SyncModal
        open={modal === "sync"}
        onClose={() => setModal(null)}
        server={server}
      />
      {detailCall && (
        <CallDetailModal
          call={detailCall}
          onClose={() => setDetailCall(null)}
        />
      )}
    </div>
  );
};

export default CallLog;
