"use client";


import React, { useState, useEffect, useMemo, useContext, Suspense} from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import {
  Calendar as LucideCalendar,
  Plus,
  Clock,
  FileText,
  CalendarDays,
  History,
  Sparkles,
  Filter,
  List,
  Download,
  Settings,
  Trash2,
  Edit3,
} from "lucide-react";
import { saveAs } from "file-saver";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast, Toaster } from "react-hot-toast";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";

const TimelinePage = () => {
  const { activeTabs, currentTab } = useContext(GlobalContext);
  const searchParams = useSearchParams();

  // Get customer from current tab metadata or search params
  const customerParam = useMemo(() => {
    const currentTabData = activeTabs.find((t) => t.subfolder === currentTab);
    return currentTabData?.customer || searchParams.get("customer");
  }, [activeTabs, currentTab, searchParams]);

  const [activeTab, setActiveTab] = useState("view");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterByDate, setFilterByDate] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const API_URL =
    (process.env.NEXT_PUBLIC_SERVER || "http://localhost:3001/api") +
    "/timeline";
  const EFFECTIVE_API_URL =
    (process.env.NEXT_PUBLIC_SERVER || "http://localhost:3001/api") +
    "/effective-events";

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      category: "General",
      date: format(new Date(), "yyyy-MM-dd"),
      entryType: "general",
    },
  });

  const categoryValue = watch("category");
  const entryTypeValue = watch("entryType");

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const [timelineRes, effectiveRes, callLogRes] = await Promise.all([
        axios.get(API_URL).catch(() => ({ data: [] })),
        axios.get(EFFECTIVE_API_URL).catch(() => ({ data: [] })),
        axios.get(`${API_URL.replace("/timeline", "/call-log")}`).catch(() => ({
          data: { success: false, data: [] },
        })),
      ]);

      const timelineEvents = timelineRes.data;
      const effectiveEvents = effectiveRes.data.map((ev) => ({
        ...ev,
        title: ev.topic,
        date: ev.effectiveFrom,
        endDate: ev.effectiveUntil,
      }));

      const callLogEvents = (callLogRes.data?.data || []).map((call) => {
        let normalizedDate = call.callStartDate;
        if (normalizedDate && normalizedDate.includes("/")) {
          const [m, d, y] = normalizedDate.split("/");
          normalizedDate = `${y}-${m}-${d}`;
        }
        return {
          _id: call._id,
          title: `Call: ${call.subject || "No Subject"}`,
          description: `Call with ${call.callForSearch || call.callFor}. Type: ${call.callType}. Purpose: ${call.callPurpose}. Result: ${call.callResult}. ${call.outcomeDescription || call.incomingDescription || ""}`,
          date: normalizedDate,
          category: "Meeting",
          type: "call-log",
          status: call.status,
          customer: call.callForSearch || call.callFor,
        };
      });

      const merged = [
        ...timelineEvents,
        ...effectiveEvents,
        ...callLogEvents,
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setEvents(merged);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const safeFormat = (dateStr, fmt) => {
    try {
      if (!dateStr) return "N/A";
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";
      return format(date, fmt);
    } catch (e) {
      return "Invalid Date";
    }
  };

  useEffect(() => {
    if (customerParam) {
      document.title = `Customer Timeline: ${customerParam}`;
    } else {
      document.title = "Timeline Hub";
    }
  }, [customerParam]);

  const onSubmit = async (data) => {
    try {
      if (editingEvent) {
        const payload = {
          id: editingEvent._id,
          ...data,
        };

        if (data.entryType === "update") {
          payload.topic = data.topic || data.title;
          payload.effectiveFrom = data.date;
          payload.effectiveUntil = data.endDate;
          await axios.put(EFFECTIVE_API_URL, payload);
        } else {
          await axios.put(API_URL, payload);
        }
        toast.success("Event updated successfully!");
        setEditingEvent(null);
      } else {
        if (data.entryType === "update") {
          const payload = {
            topic: data.topic,
            effectiveFrom: data.date,
            effectiveUntil: data.endDate,
            description: data.description,
          };
          await axios.post(EFFECTIVE_API_URL, payload);
        } else {
          await axios.post(API_URL, data);
        }
        toast.success("Event recorded successfully!");
      }

      reset({
        category: "General",
        date: format(new Date(), "yyyy-MM-dd"),
        entryType: data.entryType || "general",
      });
      fetchEvents();
      setActiveTab("view");
    } catch (error) {
      console.error("Error processing event:", error);
      toast.error("Failed to process event");
    }
  };

  const handleDelete = async (event) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      const url = event.topic ? EFFECTIVE_API_URL : API_URL;
      await axios.delete(`${url}?id=${event._id}`);
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };

  const startEdit = (event) => {
    setEditingEvent(event);
    const isUpdate = !!event.topic;
    reset({
      entryType: isUpdate ? "update" : "general",
      title: event.title || event.topic,
      topic: event.topic || "",
      date: format(parseISO(event.date), "yyyy-MM-dd"),
      endDate: event.endDate
        ? format(parseISO(event.endDate), "yyyy-MM-dd")
        : "",
      category: event.category || "Internal",
      description: event.description || "",
    });
    setActiveTab("add");
  };

  const filteredEvents = useMemo(() => {
    let result = events;
    if (filterByDate) {
      result = result.filter((event) =>
        isSameDay(parseISO(event.date), selectedDate),
      );
    }
    if (customerParam) {
      const query = customerParam.toLowerCase();
      result = result.filter(
        (event) =>
          (event.title && event.title.toLowerCase().includes(query)) ||
          (event.topic && event.topic.toLowerCase().includes(query)) ||
          (event.description && event.description.toLowerCase().includes(query)),
      );
    }
    return result;
  }, [events, selectedDate, filterByDate, customerParam]);

  const handleDownloadExcel = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Timeline Report");

      // Define columns
      worksheet.columns = [
        { header: "Date", key: "date", width: 15 },
        { header: "Category", key: "category", width: 15 },
        { header: "Title", key: "title", width: 35 },
        { header: "Description", key: "description", width: 50 },
        { header: "Effective Until", key: "endDate", width: 15 },
      ];

      // Style header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      headerRow.height = 25;
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFEA1B40" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add data
      filteredEvents.forEach((event) => {
        const row = worksheet.addRow({
          date: format(parseISO(event.date), "yyyy-MM-dd"),
          category: event.category,
          title: event.title,
          description: event.description,
          endDate: event.endDate
            ? format(parseISO(event.endDate), "yyyy-MM-dd")
            : "-",
        });
        row.alignment = { vertical: "middle", wrapText: true };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFEEEEEE" } },
            left: { style: "thin", color: { argb: "FFEEEEEE" } },
            bottom: { style: "thin", color: { argb: "FFEEEEEE" } },
            right: { style: "thin", color: { argb: "FFEEEEEE" } },
          };
        });
      });

      // Generate and save
      const buffer = await workbook.xlsx.writeBuffer();
      const filename = filterByDate
        ? `Timeline_Report_${format(selectedDate, "yyyy_MM_dd")}.xlsx`
        : "Timeline_Full_Report.xlsx";

      saveAs(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        filename,
      );
      toast.success("Excel report downloaded!");
    } catch (error) {
      console.error("Excel download error:", error);
      toast.error("Failed to download Excel report");
    }
  };

  return (
    <div className="w-full">
      {/* <Toaster position="top-right" /> */}

      {/* Header Section */}
      <div className="mb-6 flex border-[1px] flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-2xl shadow-sm border-french-gray/40">
        {/* Left: Title */}
        <div className="md:w-1/4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red rounded-lg flex items-center justify-center shrink-0">
              <History className="text-white" size={16} />
            </div>
            <h1 className="text-xl font-bold text-eerie-black tracking-tight whitespace-nowrap">
              {customerParam ? `Timeline: ${customerParam}` : "Timeline Hub"}
            </h1>
          </div>
        </div>

        {/* Center: Tabs Navigation */}
        <div className="flex bg-white-smoke p-1 rounded-xl border gap-2 border-french-gray/20 shadow-inner overflow-x-auto no-scrollbar">
          <div>
            <RadioButtonLarge
              id="view"
              name="tab_nav"
              register={register}
              setValue={(name, val) => {
                setEditingEvent(null);
                setActiveTab(val);
              }}
              selectedValue={activeTab}
              setSelectedValue={setActiveTab}
              label="View Timeline"
            />
          </div>

          <div>
            <RadioButtonLarge
              id="add"
              name="tab_nav"
              register={register}
              setValue={(name, val) => {
                if (val !== "add") setEditingEvent(null);
                setActiveTab(val);
              }}
              selectedValue={activeTab}
              setSelectedValue={setActiveTab}
              label={editingEvent ? "Edit Event" : "Enter Event"}
            />
          </div>

          <div>
            <RadioButtonLarge
              id="manage"
              name="tab_nav"
              register={register}
              setValue={(name, val) => {
                setEditingEvent(null);
                setActiveTab(val);
              }}
              selectedValue={activeTab}
              setSelectedValue={setActiveTab}
              label="Edit/Delete Event"
            />
          </div>
        </div>

        {/* Right: Records Badge */}
        <div className="md:w-1/4 flex justify-end">
          <div className="bg-misty-rose px-4 py-2 rounded-xl flex items-center gap-2 border border-red/10 shadow-sm shrink-0">
            <div className="w-1.5 h-1.5 bg-red rounded-full animate-pulse"></div>
            <span className="text-red font-semibold text-[10px] uppercase tracking-widest whitespace-nowrap">
              {events.length} Records
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full mx-auto">
        {activeTab === "add" && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-french-gray/40 animate-slide-in-right relative overflow-hidden mx-auto">
            <div className="absolute top-0 right-0 w-24 h-24 bg-misty-rose rounded-bl-full -mr-8 -mt-8 opacity-50"></div>

            <div className="relative z-10">
              {/* Sub-Tabs for Add Mode */}
              <div className="flex justify-between">
                <div className="flex gap-2 mb-8 bg-white-smoke p-1 rounded-xl border border-french-gray/10 w-fit">
                  <button
                    type="button"
                    onClick={() => setValue("entryType", "general")}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      (watch("entryType") || "general") === "general"
                        ? "bg-white text-red shadow-sm"
                        : "text-dim-gray hover:text-eerie-black"
                    }`}
                  >
                    General Event
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("entryType", "update")}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      watch("entryType") === "update"
                        ? "bg-white text-red shadow-sm"
                        : "text-dim-gray hover:text-eerie-black"
                    }`}
                  >
                    Rate/Service Update
                  </button>
                  <input type="hidden" {...register("entryType")} />
                </div>
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-eerie-black mr-4">
                  <div className="w-8 h-8 bg-red/10 rounded-lg flex items-center justify-center">
                    {(watch("entryType") || "general") === "general" ? (
                      <Plus className="text-red" size={20} />
                    ) : (
                      <Sparkles className="text-red" size={20} />
                    )}
                  </div>
                  {(watch("entryType") || "general") === "general"
                    ? "Log New Event"
                    : "Post Standard Update"}
                </h2>{" "}
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Conditional Fields Based on Entry Type */}
                {(watch("entryType") || "general") === "general" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-eerie-black ml-1 uppercase tracking-wider">
                        Event Title
                      </label>
                      <input
                        {...register("title", {
                          required:
                            (watch("entryType") || "general") === "general",
                        })}
                        className="p-3 bg-white-smoke border-2 border-transparent focus:border-red focus:bg-white rounded-xl outline-none transition-all duration-300 shadow-inner text-sm font-medium"
                        placeholder="e.g. Annual Strategy Meeting"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-eerie-black ml-1 uppercase tracking-wider">
                        Event Date
                      </label>
                      <input
                        type="date"
                        {...register("date", { required: true })}
                        className="p-3 bg-white-smoke border-2 border-transparent focus:border-red focus:bg-white rounded-xl outline-none transition-all duration-300 shadow-inner text-sm font-medium"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-slide-in-right">
                    <div className="flex flex-col gap-1.5 md:col-span-1">
                      <label className="text-[10px] font-semibold text-eerie-black ml-1 uppercase tracking-wider">
                        Effective Topic
                      </label>
                      <select
                        {...register("topic", {
                          required: watch("entryType") === "update",
                        })}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            setValue("title", val);
                            setValue("category", "Internal");
                          }
                        }}
                        className="p-3 bg-white-smoke border-2 border-transparent focus:border-red focus:bg-white rounded-xl outline-none transition-all duration-300 shadow-inner text-sm font-medium"
                      >
                        <option value="">Select Topic...</option>
                        <option value="New rates added">New rates added</option>
                        <option value="New service added">
                          New service added
                        </option>
                        <option value="Rate changes for a service">
                          Rate changes for a service
                        </option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-red ml-1 uppercase tracking-widest">
                        Effective From
                      </label>
                      <input
                        type="date"
                        {...register("date", { required: true })}
                        className="p-3 bg-misty-rose/30 border-2 border-transparent focus:border-red focus:bg-white rounded-xl outline-none transition-all duration-300 shadow-inner text-sm font-medium"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold text-dim-gray ml-1 uppercase tracking-widest">
                        Effective Until
                      </label>
                      <input
                        type="date"
                        {...register("endDate")}
                        className="p-3 bg-white-smoke border-2 border-transparent focus:border-red focus:bg-white rounded-xl outline-none transition-all duration-300 shadow-inner text-sm font-medium"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-eerie-black ml-1 uppercase tracking-wider">
                    Category
                  </label>
                  <div className="flex w-full gap-2">
                    {[
                      "General",
                      "Milestone",
                      "Meeting",
                      "Holiday",
                      "Internal",
                    ].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setValue("category", cat)}
                        className={`py-1.5 px-6 tracking-wide font-light text-xs rounded-lg transition-all duration-300 border-2 ${
                          (categoryValue || "General") === cat
                            ? "bg-red text-white border-red shadow-sm"
                            : "bg-white text-dim-gray border-french-gray/30 hover:border-red/50"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    <input type="hidden" {...register("category")} />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-eerie-black ml-1 uppercase tracking-wider">
                    Detailed Description
                  </label>
                  <textarea
                    {...register("description")}
                    rows={4}
                    className="p-3 bg-white-smoke border-2 border-transparent focus:border-red focus:bg-white rounded-xl outline-none transition-all duration-300 shadow-inner resize-none text-sm font-medium"
                    placeholder="Provide context and details about this event..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r px-4 from-red to-dark-red text-white py-3 rounded-xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-lg shadow-red/25 flex items-center justify-center gap-2 text-sm tracking-wide"
                >
                  <FileText size={18} />
                  Record to Timeline
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "view" && (
          <div className="flex flex-col lg:flex-row gap-6 animate-slide-in-right">
            {/* Left Sidebar: Calendar & Filters */}
            <div className="lg:w-[300px] space-y-4">
              <div className="bg-white p-5 rounded-3xl shadow-lg border border-french-gray/40 sticky top-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-eerie-black uppercase tracking-widest flex items-center gap-2">
                    <LucideCalendar className="text-red" size={16} />
                    Calendar
                  </h3>
                  {filterByDate && (
                    <button
                      onClick={() => setFilterByDate(false)}
                      className="text-[9px] font-semibold text-red bg-misty-rose px-2 py-0.5 rounded-full uppercase hover:bg-red hover:text-white transition-all"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <Calendar
                  onChange={(date) => {
                    setSelectedDate(date);
                    setFilterByDate(true);
                  }}
                  value={selectedDate}
                  className="custom-calendar-mini"
                  tileClassName={({ date }) => {
                    const hasEvent = events.some((e) =>
                      isSameDay(parseISO(e.date), date),
                    );
                    return hasEvent ? "has-event-marker" : null;
                  }}
                />

                <button
                  onClick={handleDownloadExcel}
                  className="mt-6 w-full bg-red text-white py-3 rounded-2xl font-bold hover:bg-dark-red hover:shadow-lg hover:shadow-red/30 transition-all duration-300 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest group active:scale-[0.98]"
                >
                  <Download
                    size={16}
                    className="group-hover:bounce transition-transform"
                  />
                  Download Excel Report
                </button>

                <div className="mt-4 pt-4 border-t border-french-gray/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-dim-gray uppercase tracking-wider">
                      Context
                    </span>
                    <span className="text-[10px] font-bold text-red">
                      {format(selectedDate, "MMM yyyy")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-dim-gray font-semibold text-[9px] uppercase tracking-tighter">
                    <div className="w-2 h-2 rounded-full bg-red shadow-sm shadow-red/20"></div>
                    <span>Logged Events</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content: Timeline Feed */}
            <div className="flex-1 bg-white-smoke p-6 rounded-[2.5rem] border border-french-gray/10 shadow-inner min-h-[700px] overflow-y-auto custom-scrollbar">
              {/* Filter Display Header */}
              <div className="mb-4 flex items-center justify-between bg-white px-6 py-4 rounded-2xl shadow-sm border border-french-gray/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white-smoke rounded-lg flex items-center justify-center">
                    {filterByDate ? (
                      <Filter className="text-red" size={16} />
                    ) : (
                      <List className="text-red" size={16} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-eerie-black uppercase tracking-widest">
                      {filterByDate
                        ? `Events: ${format(selectedDate, "MMM dd")}`
                        : "Timeline"}
                    </h3>
                    <p className="text-dim-gray text-[9px] font-semibold uppercase tracking-widest opacity-60">
                      {filterByDate
                        ? `${filteredEvents.length} records found`
                        : "Chronological sequence"}
                    </p>
                  </div>
                </div>
                {filterByDate && (
                  <button
                    onClick={() => setFilterByDate(false)}
                    className="p-1.5 hover:bg-misty-rose rounded-lg transition-colors group"
                    title="Show All Events"
                  >
                    <List
                      className="text-dim-gray group-hover:text-red transition-colors"
                      size={18}
                    />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-french-gray/10">
                  <div className="loader mb-3 scale-75"></div>
                  <p className="text-dim-gray font-semibold animate-pulse uppercase tracking-widest text-[10px]">
                    Synchronizing...
                  </p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-4 border-dashed border-french-gray/20">
                  <div className="w-16 h-16 bg-white-smoke rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="text-french-gray" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-eerie-black mb-1">
                    No Records
                  </h3>
                  <p className="text-dim-gray max-w-xs mx-auto font-medium text-xs">
                    {filterByDate
                      ? "No events recorded for this specific date."
                      : "Your timeline is currently empty."}
                  </p>
                  {!filterByDate && (
                    <button
                      onClick={() => setActiveTab("add")}
                      className="mt-6 px-6 py-2.5 bg-red text-white rounded-xl font-semibold uppercase tracking-widest text-[10px] hover:bg-dark-red hover:shadow-lg shadow-red/20 transition-all active:scale-95"
                    >
                      Add First Event
                    </button>
                  )}
                </div>
              ) : (
                <div className="relative pl-6 md:pl-0">
                  {/* Vertical Line */}
                  <div className="absolute left-3 md:left-[35px] top-4 bottom-4 w-1 bg-gradient-to-b from-red/60 via-red/20 to-transparent rounded-full"></div>

                  <div className="space-y-2.5 relative">
                    {filteredEvents.map((event, index) => (
                      <div key={event._id} className="flex gap-6 group">
                        {/* Timeline Marker */}
                        <div className="relative flex flex-col items-center">
                          <div className="w-[60px] hidden md:flex flex-col items-center justify-center bg-white border border-french-gray/20 rounded-xl py-1.5 shadow-sm group-hover:border-red/30 transition-colors">
                            <span className="text-[9px] font-semibold text-dim-gray uppercase">
                              {safeFormat(event.date, "MMM")}
                            </span>
                            <span className="text-lg font-bold text-eerie-black leading-none">
                              {safeFormat(event.date, "dd")}
                            </span>
                          </div>
                          <div className="absolute left-[-22px] md:left-auto md:right-[-22px] top-4 w-4 h-4 rounded-full bg-white border-[4px] border-red shadow-md shadow-red/20 z-10 transform scale-100 group-hover:scale-125 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-full bg-red/10 animate-ping opacity-20"></div>
                          </div>
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 pb-1">
                          <div className="bg-white px-4 py-2.5 rounded-xl shadow-sm border border-french-gray/10 hover:shadow-md transition-all duration-300 group-hover:translate-x-1 relative overflow-hidden">
                            {/* Accent Decoration */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-misty-rose/20 rounded-bl-full pointer-events-none"></div>

                            <div className="flex justify-between items-start gap-4">
                              <h3 className="text-sm font-bold text-eerie-black group-hover:text-red transition-colors tracking-tight leading-tight">
                                {event.title}
                              </h3>
                              <span className="text-[10px] font-bold text-red uppercase tracking-widest px-2 py-0.5 bg-misty-rose rounded-lg whitespace-nowrap shrink-0">
                                {event.category}
                              </span>
                            </div>

                            <p className="text-dim-gray font-normal text-[11px] leading-relaxed mt-0.5 line-clamp-2">
                              {event.description}
                            </p>

                            <div className="mt-1.5 flex items-center justify-between text-[8px] font-semibold text-french-gray uppercase tracking-tighter">
                              <div className="flex items-center gap-2 text-black/70 text-[10px]">
                                <div className="flex items-center gap-1">
                                  <Clock size={8} className="text-red/90" />
                                  {safeFormat(event.date, "MMM dd, yyyy")}
                                </div>
                                {event.endDate && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-red/80">→</span>
                                    <span className="">
                                      {safeFormat(
                                        event.endDate,
                                        "MMM dd, yyyy",
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "manage" && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-french-gray/40 animate-slide-in-right relative overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-eerie-black flex items-center gap-2">
                <Settings className="text-red" size={20} />
                Manage Records
              </h2>
              <div className="text-[10px] font-bold text-dim-gray bg-white-smoke px-3 py-1 rounded-full uppercase tracking-widest border border-french-gray/10">
                {events.length} total events
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-bold text-dim-gray uppercase tracking-widest">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Category</th>
                    <th className="px-4 py-2">Event Title</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr
                      key={event._id}
                      className="group bg-white-smoke hover:bg-misty-rose/30 transition-colors rounded-xl overflow-hidden"
                    >
                      <td className="px-4 py-3 first:rounded-l-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-red/40 group-hover:bg-red group-hover:scale-125 transition-all"></div>
                          <span className="text-xs font-semibold text-eerie-black">
                            {format(parseISO(event.date), "MMM dd, yyyy")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-bold text-red bg-white px-2 py-0.5 rounded-full uppercase border border-red/10">
                          {event.category || "General"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-[300px]">
                          <p className="text-xs font-bold text-eerie-black truncate">
                            {event.title || event.topic}
                          </p>
                          <p className="text-[10px] text-dim-gray truncate opacity-60">
                            {event.description || "No description provided"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[9px] font-bold text-dim-gray uppercase">
                          {event.topic ? "Update" : "Event"}
                        </span>
                      </td>
                      <td className="px-4 py-3 last:rounded-r-xl text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(event)}
                            className="p-2 hover:bg-white text-dim-gray hover:text-red rounded-lg transition-all border border-transparent hover:border-red/10 shadow-sm hover:shadow-red/5"
                            title="Edit Event"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(event)}
                            className="p-2 hover:bg-red text-dim-gray hover:text-white rounded-lg transition-all border border-transparent hover:border-red/10 shadow-sm hover:shadow-lg"
                            title="Delete Event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {events.length === 0 && (
              <div className="text-center py-20">
                <History
                  className="mx-auto text-french-gray/20 mb-4"
                  size={48}
                />
                <p className="text-sm font-semibold text-dim-gray uppercase tracking-widest">
                  No records to manage
                </p>
              </div>
            )}
          </div>
        )}

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .custom-calendar-mini {
            width: 100% !important;
            border: none !important;
            font-family: inherit !important;
            background: transparent !important;
          }
          .react-calendar__navigation {
            margin-bottom: 10px !important;
            height: 40px !important;
          }
          .react-calendar__navigation button {
            font-weight: 700 !important;
            text-transform: uppercase !important;
            color: #18181b !important;
            border-radius: 12px !important;
            font-size: 0.75rem !important;
          }
          .react-calendar__navigation button:hover {
            background-color: #f6f8f9 !important;
          }
          .react-calendar__month-view__weekdays {
            font-weight: 700 !important;
            text-transform: uppercase !important;
            font-size: 0.6rem !important;
            color: #979797 !important;
            margin-bottom: 5px !important;
          }
          .react-calendar__month-view__weekdays__weekday abbr {
            text-decoration: none !important;
          }
          .react-calendar__month-view__days__day {
            font-weight: 600 !important;
            color: #18181b !important;
            border-radius: 12px !important;
            padding: 10px 0 !important;
            font-size: 0.8rem !important;
          }
          .react-calendar__tile--active {
            background: #ea1b40 !important;
            color: white !important;
            box-shadow: 0 8px 12px -3px rgba(234, 27, 64, 0.3) !important;
          }
          .react-calendar__tile--now {
            background: #ffe5e9 !important;
            color: #ea1b40 !important;
          }
          .has-event-marker {
            position: relative;
          }
          .has-event-marker::after {
            content: "";
            position: absolute;
            bottom: 4px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            background: #ea1b40;
            border-radius: 50%;
          }
          .react-calendar__tile--active.has-event-marker::after {
            background: white;
          }
          @keyframes slide-in-right {
            from {
              transform: translateX(20px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-slide-in-right {
            animation: slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1)
              forwards;
          }
          @keyframes bounce {
            0%,
            100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-3px);
            }
          }
          .group:hover .group-hover\:bounce {
            animation: bounce 0.6s ease-in-out infinite;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            margin: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #ea1b40;
          }
        `}</style>
      </div>
    </div>
  );
};

export default TimelinePage;
