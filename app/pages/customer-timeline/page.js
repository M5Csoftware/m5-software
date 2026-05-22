"use client";

import React, { useState, useEffect, useMemo, useContext } from "react";
import axios from "axios";
import {
  History,
  Clock,
  Search,
  User,
  Phone,
  Zap,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { GlobalContext } from "@/app/lib/GlobalContext";

const CustomerTimeline = () => {
  const { activeTabs, currentTab, server } = useContext(GlobalContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const customerName = useMemo(() => {
    const currentTabData = activeTabs.find((t) => t.subfolder === currentTab);
    return currentTabData?.customer || "Unknown Customer";
  }, [activeTabs, currentTab]);

  const API_URL = (server || "http://localhost:3001/api") + "/timeline";
  const EFFECTIVE_API_URL = (server || "http://localhost:3001/api") + "/effective-events";

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

      const query = customerName.toLowerCase();
      const merged = [...timelineEvents, ...effectiveEvents]
        .filter((event) => {
          const cName = (event.customer || "").toLowerCase();
          const title = (event.title || "").toLowerCase();
          const topic = (event.topic || "").toLowerCase();
          const desc = (event.description || "").toLowerCase();
          return cName.includes(query) || title.includes(query) || topic.includes(query) || desc.includes(query);
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setEvents(merged);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [customerName]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = searchTerm === "" || 
        (event.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "All" || event.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, categoryFilter]);

  const safeFormat = (dateStr, fmt) => {
    try {
      if (!dateStr) return "N/A";
      const date = parseISO(dateStr);
      return isNaN(date.getTime()) ? "N/A" : format(date, fmt);
    } catch (e) { return "N/A"; }
  };

  return (
    <div className="bg-[#F1F3F6] min-h-screen text-eerie-black pb-20">
      {/* Premium Header */}
      <div className="bg-white border-b border-gray-200 px-10 py-6 sticky top-0 z-40 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-red text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red/20">
              <User size={30} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight">{customerName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-red bg-misty-rose px-3 py-0.5 rounded-full uppercase tracking-widest border border-red/10 animate-pulse">Live Timeline</span>
                <span className="text-[10px] font-bold text-dim-gray uppercase tracking-widest opacity-60">• {filteredEvents.length} Interactions</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim-gray group-focus-within:text-red transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3 bg-[#F1F3F6] border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-red/10 w-80 transition-all shadow-inner"
              />
            </div>
            <div className="flex gap-2">
              {["All", "Meeting", "General"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    categoryFilter === cat ? "bg-red text-white shadow-lg shadow-red/20 scale-105" : "bg-white text-dim-gray border border-gray-200 hover:border-red/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Distinguished Card Feed */}
      <div className="max-w-[1400px] mx-auto px-10 mt-10">
        {loading ? (
          <div className="flex justify-center py-40 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="w-10 h-10 border-4 border-red/10 border-t-red rounded-full animate-spin"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-40 bg-white rounded-3xl border-4 border-dashed border-gray-200 shadow-sm">
            <History size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Interaction History Found</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5 relative">
            {/* Minimal Background Line */}
            <div className="absolute left-[44px] top-6 bottom-6 w-1 bg-gray-200 rounded-full opacity-30"></div>

            {filteredEvents.map((event) => (
              <div key={event._id} className="relative pl-24 group">
                {/* Visual Date Indicator */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-14 flex flex-col items-center">
                  <span className="text-[10px] font-black text-red uppercase tracking-tighter mb-0.5">{safeFormat(event.date, "MMM")}</span>
                  <span className="text-2xl font-black text-eerie-black leading-none">{safeFormat(event.date, "dd")}</span>
                  <div className={`w-3 h-3 rounded-full border-2 border-white shadow-md mt-3 ${event.type === 'call-log' ? 'bg-blue-500 animate-pulse' : 'bg-red'}`}></div>
                </div>

                {/* DISTINGUISHED INTERACTION CARD */}
                <div className="w-full bg-white rounded-2xl shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-xl hover:shadow-red/5 transition-all duration-300 p-6 flex flex-col md:flex-row md:items-center gap-6 relative group-hover:border-red/20 overflow-hidden">
                  
                  {/* Decorative Gradient Edge */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${event.type === 'call-log' ? 'bg-blue-500' : 'bg-red'}`}></div>

                  {/* Header Segment */}
                  <div className="min-w-[100px] flex flex-col gap-1 pr-6 border-r border-gray-50 hidden md:flex">
                    <span className="text-[11px] font-black text-eerie-black uppercase tracking-tight">{safeFormat(event.createdAt || event.date, "h:mm a")}</span>
                    <span className="text-[9px] font-bold text-dim-gray uppercase tracking-widest opacity-60">Recorded At</span>
                  </div>

                  {/* Main Content Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${event.type === 'call-log' ? 'bg-blue-50 text-blue-500' : 'bg-red/5 text-red'}`}>
                        {event.type === 'call-log' ? (event.meta?.direction === 'Incoming' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />) : <FileText size={18} />}
                      </div>
                      
                      <div className="min-w-0">
                        <h3 className="text-lg font-black tracking-tight text-eerie-black group-hover:text-red transition-colors truncate">
                          {event.title}
                        </h3>
                        
                        {/* Inline Metadata Row */}
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {event.meta && (
                            <>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 rounded-lg text-blue-600 border border-blue-100/50">
                                <Phone size={10} />
                                <span className="text-[9px] font-black uppercase tracking-tighter">{event.meta.direction}</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg text-amber-600 border border-amber-100/50">
                                <Clock size={10} />
                                <span className="text-[9px] font-black uppercase tracking-tighter">{event.meta.duration}</span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg text-dim-gray border border-gray-200/50">
                                <Zap size={10} />
                                <span className="text-[9px] font-black uppercase tracking-tighter">{event.meta.result}</span>
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red/5 rounded-lg text-red border border-red/10">
                            <Activity size={10} />
                            <span className="text-[9px] font-black uppercase tracking-tighter">{event.category || 'General'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[13px] text-dim-gray font-medium leading-relaxed italic opacity-90 pl-12 line-clamp-2 group-hover:opacity-100 transition-opacity">
                      "{event.description}"
                    </p>
                  </div>

                  {/* Status Segment */}
                  <div className="flex items-center gap-6 shrink-0 md:ml-auto">
                    <div className="flex flex-col items-end gap-1">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${
                        event.status === 'Completed' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${event.status === 'Completed' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                        {event.status || 'Active'}
                      </div>
                      <span className="text-[8px] font-bold text-dim-gray uppercase opacity-40">Workflow Status</span>
                    </div>
                    
                    <button className="w-10 h-10 bg-gray-50 text-gray-300 hover:bg-red hover:text-white rounded-xl transition-all flex items-center justify-center group-hover:translate-x-1">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-10 right-10 w-14 h-14 bg-eerie-black text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-red transition-all group active:scale-95 z-50 border-4 border-white"
      >
        <Zap size={24} className="group-hover:rotate-12 transition-transform" />
      </button>
    </div>
  );
};

export default CustomerTimeline;
