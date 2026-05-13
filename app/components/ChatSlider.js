"use client";
import React, { useState, useContext, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  User,
  Search,
  ChevronRight,
  Users,
  Shield,
  Megaphone,
} from "lucide-react";
import { GlobalContext } from "../lib/GlobalContext";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import io from "socket.io-client";

const NODE_SERVER = "http://localhost:5000";

const ChatSlider = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const { server } = useContext(GlobalContext);
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket
  useEffect(() => {
    const newSocket = io(NODE_SERVER);
    setSocket(newSocket);

    if (user?.userId) {
      newSocket.emit("join_chat", user.userId);
    }

    newSocket.on("receive_message", (msg) => {
      // Only add message if it belongs to current conversation or is a broadcast
      setMessages((prev) => {
        // Prevent duplicates
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => newSocket.close();
  }, [user?.userId]);

  // Fetch Employees
  useEffect(() => {
    if (isChatOpen && employees.length === 0) {
      const fetchEmployees = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${server}/employees/department`);
          if (res.data.success) {
            const all = Object.values(res.data.data).flat();
            setEmployees(all);
          }
        } catch (e) {
          console.error("Failed to fetch employees", e);
        } finally {
          setLoading(false);
        }
      };
      fetchEmployees();
    }
  }, [isChatOpen, server, employees.length]);

  // Fetch History
  useEffect(() => {
    if (isChatOpen && user?.userId) {
      const fetchHistory = async () => {
        try {
          const type = selectedMember ? "private" : "broadcast";
          const params = selectedMember
            ? {
                user1: user.userId,
                user2: selectedMember.userId,
                type: "private",
              }
            : { type: "broadcast" };

          const res = await axios.get(`${NODE_SERVER}/chat/history`, {
            params,
          });
          if (res.data.success) {
            setMessages(res.data.data);
          }
        } catch (e) {
          console.error("Failed to fetch history", e);
        }
      };
      fetchHistory();
    }
  }, [isChatOpen, selectedMember, user?.userId]);

  const handleSendMessage = (e, type = "private") => {
    if (e) e.preventDefault();
    if (!message.trim() || !socket) return;

    const messageData = {
      senderId: user.userId,
      senderName: user.userName || user.name,
      receiverId: type === "broadcast" ? "broadcast" : selectedMember.userId,
      receiverName: type === "broadcast" ? "Team" : selectedMember.name,
      text: message,
      type: type,
    };

    socket.emit("send_message", messageData);
    setMessage("");
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) &&
      emp.userId !== user?.userId,
  );

  return (
    <>
      {/* 1. The "Slider Bar" Trigger */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed right-0 bottom-2 z-[100] transition-all duration-300 ease-in-out cursor-pointer flex items-center pr-0 pl-4 py-2 ${isChatOpen ? "translate-x-full" : "translate-x-0"}`}
      >
        <div
          onClick={() => setIsChatOpen(true)}
          className={`flex items-center justify-center transition-all duration-300 ${isHovered ? "w-14 h-20 rounded-l-2xl bg-red shadow-[-5px_0_20px_rgba(234,27,64,0.4)]" : "w-1.5 h-20 rounded-l-2xl bg-red/60 shadow-[-2px_0_10px_rgba(234,27,64,0.2)]"}`}
        >
          {isHovered && (
            <div className="flex flex-col items-center gap-1 text-white animate-in fade-in zoom-in duration-300">
              <MessageSquare size={20} fill="white" />
              <span className="text-[9px] font-medium uppercase tracking-wider">
                Chat
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Main Sliding Panel */}
      <div
        className={`fixed bg-white top-2 bottom-2 z-[110] border border-platinum shadow-[-20px_0_50px_rgba(0,0,0,0.1)] rounded-2xl w-[450px] flex flex-col overflow-hidden transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isChatOpen ? "right-2" : "-right-[480px]"}`}
      >
        {/* Header */}
        <div className="p-6 bg-seasalt text-red border-b border-platinum relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {selectedMember ? (
                <button
                  onClick={() => setSelectedMember(null)}
                  className="p-2 hover:bg-red/5 rounded-xl transition-all text-red"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
              ) : (
                <div className="w-12 h-12 bg-red flex items-center justify-center rounded-2xl shadow-lg shadow-red/20">
                  <Users size={24} className="text-white" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold tracking-tight">
                  {selectedMember ? selectedMember.name : "Team Connect"}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] text-dim-gray font-medium uppercase tracking-wider">
                    {selectedMember
                      ? selectedMember.department || "Active Now"
                      : "Live Network"}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsChatOpen(false);
                setSelectedMember(null);
              }}
              className="p-2 hover:bg-red/5 rounded-xl transition-all hover:rotate-90 duration-300 text-red"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {selectedMember ? (
          /* Active Chat View */
          <div className="flex-1 flex flex-col bg-seasalt overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 table-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-platinum/30 flex items-center justify-center text-battleship-gray mb-4">
                    <User size={40} strokeWidth={1} />
                  </div>
                  <p className="text-xs text-dim-gray max-w-[200px]">
                    This is the beginning of your conversation with{" "}
                    <b>{selectedMember.name}</b>.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user.userId;
                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          isMe
                            ? "bg-blue-100 text-gray-600 rounded-br-none"
                            : "bg-white text-gunmetal border border-platinum rounded-bl-none shadow-sm"
                        }`}
                      >
                        <p className="font-medium">{msg.text}</p>
                        <p
                          className={`text-[9px] mt-1 opacity-60 font-bold uppercase ${isMe ? "text-white" : "text-dim-gray"}`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
<div></div>


                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-platinum">
              <form
                onSubmit={(e) => handleSendMessage(e, "private")}
                className="relative flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 pl-4 pr-12 py-3 bg-seasalt border border-platinum rounded-2xl focus:outline-none focus:ring-2 focus:ring-red/10 focus:border-red transition-all text-sm font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-2 p-2 bg-red text-white rounded-xl shadow-lg shadow-red/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Contact List View */
          <>
            {/* Search Area */}
            <div className="px-6 py-4 bg-white border-b border-platinum">
              <div className="relative group">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-battleship-gray group-focus-within:text-red transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Find a team member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-seasalt border border-platinum rounded-2xl focus:outline-none focus:ring-2 focus:ring-red/10 focus:border-red transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 overflow-y-auto bg-seasalt table-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-dim-gray">
                  <div className="w-8 h-8 border-4 border-red/20 border-t-red rounded-full animate-spin"></div>
                  <p className="text-xs font-bold animate-pulse">
                    Synchronizing team...
                  </p>
                </div>
              ) : filteredEmployees.length > 0 ? (
                <div className="divide-y divide-platinum/30">
                  <p className="px-6 py-3 text-[10px] font-black text-battleship-gray uppercase tracking-[0.1em] bg-white/50">
                    All Contacts
                  </p>
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.userId}
                      onClick={() => setSelectedMember(emp)}
                      className="flex items-center gap-4 p-4 hover:bg-seasalt cursor-pointer transition-all border-b border-platinum/50 group last:border-b-0"
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-misty-rose to-white border border-red/10 flex items-center justify-center text-red font-black text-lg group-hover:from-red group-hover:to-dark-red group-hover:text-white transition-all duration-300 shadow-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-gunmetal group-hover:text-red transition-colors truncate">
                          {emp.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-dim-gray bg-white px-2 py-0.5 rounded-md border border-platinum/50 font-bold uppercase">
                            {emp.department || "Staff"}
                          </span>
                        </div>
                      </div>
                      <div className="opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        <div className="p-2 bg-red/5 rounded-lg">
                          <Send size={16} className="text-red" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                  <div className="w-20 h-20 bg-platinum/30 rounded-3xl flex items-center justify-center text-battleship-gray">
                    <Search size={40} strokeWidth={1} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gunmetal">
                      No members found
                    </h4>
                    <p className="text-xs text-dim-gray mt-1">
                      Try searching for a different name or department.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer Info - Generalized Broadcast Message */}
        <div className="p-4 bg-seasalt border-t border-platinum">
          <button
            onClick={(e) => handleSendMessage(e, "broadcast")}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-platinum rounded-2xl text-dim-gray hover:text-red hover:border-red/30 hover:shadow-sm transition-all group"
          >
            <Megaphone size={16} className="group-hover:animate-bounce" />
            <span className="text-[11px] font-black uppercase tracking-wider">
              Broadcast to Team
            </span>
          </button>
        </div>
      </div>

      <style jsx global>{`
        .cubic-bezier {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
};

export default ChatSlider;
