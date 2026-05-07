"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
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
} from "lucide-react";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { toast, Toaster } from "react-hot-toast";
import { format, isSameDay, parseISO, startOfDay } from "date-fns";

const TimelinePage = () => {
  const [activeTab, setActiveTab] = useState("add");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterByDate, setFilterByDate] = useState(false);

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
      const [timelineRes, effectiveRes] = await Promise.all([
        axios.get(API_URL).catch(() => ({ data: [] })),
        axios.get(EFFECTIVE_API_URL).catch(() => ({ data: [] })),
      ]);

      const timelineEvents = timelineRes.data;
      const effectiveEvents = effectiveRes.data.map((ev) => ({
        ...ev,
        title: ev.topic,
        date: ev.effectiveFrom,
        endDate: ev.effectiveUntil,
      }));

      const merged = [...timelineEvents, ...effectiveEvents].sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      );

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

  const onSubmit = async (data) => {
    try {
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
      reset({
        category: "General",
        date: format(new Date(), "yyyy-MM-dd"),
        entryType: data.entryType,
      });
      fetchEvents();
      setActiveTab("view");
    } catch (error) {
      console.error("Error recording event:", error);
      toast.error("Failed to record event");
    }
  };

  const filteredEvents = useMemo(() => {
    if (!filterByDate) return events;
    return events.filter((event) =>
      isSameDay(parseISO(event.date), selectedDate),
    );
  }, [events, selectedDate, filterByDate]);

  return (
    <div className="w-full">
      {/* <Toaster position="top-right" /> */}

      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-4 rounded-2xl shadow-sm border border-french-gray/20">
        {/* Left: Title */}
        <div className="md:w-1/4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-red rounded-lg flex items-center justify-center shrink-0">
              <History className="text-white" size={16} />
            </div>
            <h1 className="text-xl font-bold text-eerie-black tracking-tight whitespace-nowrap">
              Timeline Hub
            </h1>
          </div>
        </div>

        {/* Center: Tabs Navigation */}
        <div className="flex bg-white-smoke p-1 rounded-xl border border-french-gray/20 shadow-inner">
          <div className="flex-1 min-w-[250px]">
            <RadioButtonLarge
              id="add"
              name="tab_nav"
              register={register}
              setValue={(name, val) => setActiveTab(val)}
              selectedValue={activeTab}
              setSelectedValue={setActiveTab}
              label="Enter Event"
            />
          </div>
          <div className="flex-1 min-w-[250px]">
            <RadioButtonLarge
              id="view"
              name="tab_nav"
              register={register}
              setValue={(name, val) => setActiveTab(val)}
              selectedValue={activeTab}
              setSelectedValue={setActiveTab}
              label="View Timeline"
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
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-french-gray/20 animate-slide-in-right relative overflow-hidden mx-auto">
            <div className="absolute top-0 right-0 w-24 h-24 bg-misty-rose rounded-bl-full -mr-8 -mt-8 opacity-50"></div>

            <div className="relative z-10">
              {/* Sub-Tabs for Add Mode */}
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
                  Standard Update
                </button>
                <input type="hidden" {...register("entryType")} />
              </div>

              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-eerie-black">
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
              </h2>

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
                  <div className="flex flex-wrap gap-2">
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
                        className={`py-1.5 px-3 rounded-lg font-semibold text-[10px] transition-all duration-300 border-2 ${
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
                  className="max-w-[500px] min-w-[450px] mx-auto bg-gradient-to-r px-4 from-red to-dark-red text-white py-2 rounded-xl font-bold hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-lg shadow-red/25 flex items-center justify-center gap-2 text-sm tracking-wide"
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
              <div className="bg-white p-5 rounded-3xl shadow-lg border border-french-gray/20 sticky top-8">
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
            <div className="flex-1">
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

                  <div className="space-y-6 relative">
                    {filteredEvents.map((event, index) => (
                      <div key={event._id} className="flex gap-6 group">
                        {/* Timeline Marker */}
                        <div className="relative flex flex-col items-center">
                          <div className="w-[70px] hidden md:flex flex-col items-center justify-center bg-white border border-french-gray/20 rounded-xl py-2 shadow-sm group-hover:border-red/30 transition-colors">
                            <span className="text-[9px] font-semibold text-dim-gray uppercase">
                              {format(parseISO(event.date), "MMM")}
                            </span>
                            <span className="text-lg font-bold text-eerie-black leading-none">
                              {format(parseISO(event.date), "dd")}
                            </span>
                          </div>
                          <div className="absolute left-[-22px] md:left-auto md:right-[-22px] top-4 w-4 h-4 rounded-full bg-white border-[4px] border-red shadow-md shadow-red/20 z-10 transform scale-100 group-hover:scale-125 transition-transform duration-300">
                            <div className="absolute inset-0 rounded-full bg-red/10 animate-ping opacity-20"></div>
                          </div>
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 pb-2">
                          <div className="bg-white p-5 rounded-2xl shadow-sm border border-french-gray/10 hover:shadow-xl transition-all duration-500 group-hover:translate-x-1 relative overflow-hidden">
                            {/* Accent Decoration */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-misty-rose/20 rounded-bl-full pointer-events-none"></div>

                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[8px] font-semibold text-red uppercase tracking-[0.2em] px-2 py-0.5 bg-misty-rose rounded-full">
                                {event.category}
                              </span>
                              <div className="flex items-center gap-1 text-dim-gray font-semibold text-[9px] bg-white-smoke px-2 py-0.5 rounded-full border border-french-gray/10">
                                <Clock size={10} className="text-red/60" />
                                {format(parseISO(event.date), "MMM dd, yyyy")}
                                {event.endDate && (
                                  <>
                                    <span className="mx-1 text-red/40">→</span>
                                    <span>
                                      {format(
                                        parseISO(event.endDate),
                                        "MMM dd, yyyy",
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <h3 className="text-lg font-bold text-eerie-black mb-1.5 group-hover:text-red transition-colors tracking-tight">
                              {event.title}
                            </h3>
                            <p className="text-dim-gray font-normal text-xs leading-relaxed">
                              {event.description}
                            </p>

                            <div className="mt-4 pt-3 border-t border-french-gray/5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-white-smoke flex items-center justify-center">
                                  <Sparkles size={10} className="text-red/40" />
                                </div>
                                <span className="text-[8px] font-semibold text-french-gray uppercase tracking-widest">
                                  Milestone
                                </span>
                              </div>
                              <button className="text-red opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-misty-rose rounded-lg">
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <style jsx global>{`
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
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelinePage;
