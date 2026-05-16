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
  Minus,
  Bell,
  AlertTriangle,
  Info,
} from "lucide-react";
import { GlobalContext } from "../lib/GlobalContext";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import io from "socket.io-client";

const NODE_SERVER =
  process.env.NEXT_PUBLIC_CHAT_SERVER || "http://localhost:5000";

const ChatSlider = () => {
  // --- STATE MANAGEMENT ---
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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [viewTab, setViewTab] = useState("chats");
  const [recentUserIds, setRecentUserIds] = useState([]);
  const [userStatuses, setUserStatuses] = useState({});
  const [notification, setNotification] = useState(null);
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastPriority, setBroadcastPriority] = useState("normal");
  const messagesEndRef = useRef(null);

  // Refs for real-time state access inside socket listeners
  const isChatOpenRef = useRef(isChatOpen);
  const selectedMemberRef = useRef(selectedMember);

  // Sync refs with state
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    selectedMemberRef.current = selectedMember;
  }, [isChatOpen, selectedMember]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- SOCKET.IO INITIALIZATION & EVENT LISTENERS ---
  useEffect(() => {
    // Force WebSocket transport for better reliability on hosted servers (Render)
    const newSocket = io(NODE_SERVER, {
      transports: ["websocket"],
      upgrade: false,
    });
    setSocket(newSocket);

    // Join personal room for private messaging
    if (user?.userId) {
      newSocket.emit("join_chat", user.userId);
    }

    newSocket.on("all_statuses", (statuses) => {
      setUserStatuses(statuses);
    });

    newSocket.on("status_update", ({ userId, status }) => {
      setUserStatuses((prev) => ({ ...prev, [userId]: status }));
    });

    // Listen for incoming messages (Private or Broadcast)
    newSocket.on("receive_message", (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      const isBroadcast = msg.type === "broadcast";
      const senderKey = isBroadcast ? "broadcast" : msg.senderId;

      const currentSelected = selectedMemberRef.current;
      const currentIsChatOpen = isChatOpenRef.current;

      const isMessageFromActiveChat = isBroadcast
        ? currentSelected?.userId === "broadcast"
        : currentSelected?.userId === msg.senderId;

      // Move to top of recent list (WhatsApp style) and update preview
      const chatPartnerId = isBroadcast
        ? "broadcast"
        : msg.senderId === user.userId
          ? msg.receiverId
          : msg.senderId;
      setRecentUserIds((prev) => {
        const filtered = prev.filter((c) => (c._id || c) !== chatPartnerId);
        return [
          {
            _id: chatPartnerId,
            lastMessage: isBroadcast && msg.title ? msg.title : msg.text,
            lastTimestamp: msg.timestamp,
          },
          ...filtered,
        ];
      });

      if (msg.senderId !== user.userId) {
        try {
          const audio = new Audio('/chat-notification.wav');
          audio.play().catch(e => console.log("Audio play blocked by browser:", e));
        } catch (err) {
          console.error("Error playing audio", err);
        }
      }

      setUnreadCounts((prev) => {
        if (!currentIsChatOpen || !isMessageFromActiveChat) {
          if (msg.senderId !== user.userId) {
            setNotification({
              senderName: isBroadcast ? "Team Announcement" : msg.senderName,
              text: isBroadcast && msg.title ? msg.title : msg.text,
              senderId: isBroadcast ? "broadcast" : msg.senderId,
            });
            setTimeout(() => setNotification(null), 4000);

            return {
              ...prev,
              [senderKey]: (prev[senderKey] || 0) + 1,
            };
          }
        }
        return prev;
      });
    });

    return () => newSocket.close();
  }, [user?.userId]);

  // --- IDLE TIMEOUT HOOK ---
  const idleTimerRef = useRef(null);
  const isAwayRef = useRef(false);

  useEffect(() => {
    if (!socket || !user?.userId) return;

    const resetIdleTimer = () => {
      if (isAwayRef.current) {
        isAwayRef.current = false;
        socket.emit("set_status", { userId: user.userId, status: "online" });
      }
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        isAwayRef.current = true;
        socket.emit("set_status", { userId: user.userId, status: "away" });
      }, 5 * 60 * 1000); // 5 minutes
    };

    // Events to track user activity
    const events = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((event) => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Start timer initially
    resetIdleTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetIdleTimer);
      });
      clearTimeout(idleTimerRef.current);
    };
  }, [socket, user?.userId]);

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
          const type = selectedMember?.userId === "broadcast" ? "broadcast" : "private";
          const params = type === "broadcast"
            ? { type: "broadcast" }
            : {
                user1: user.userId,
                user2: selectedMember.userId,
                type: "private",
              };

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

  // --- API DATA FETCHING ---

  // Fetch Recent Conversations & Unread Counts on mount/login
  useEffect(() => {
    if (user?.userId) {
      const fetchData = async () => {
        try {
          // Fetch Recent Users (WhatsApp style list)
          const recentRes = await axios.get(
            `${NODE_SERVER}/chat/recent-users`,
            {
              params: { userId: user.userId },
            },
          );
          if (recentRes.data.success) {
            setRecentUserIds(recentRes.data.data);
          }

          // Fetch Unread Counts from DB
          const unreadRes = await axios.get(
            `${NODE_SERVER}/chat/unread-counts`,
            {
              params: { userId: user.userId },
            },
          );
          if (unreadRes.data.success) {
            setUnreadCounts(unreadRes.data.data);
          }
        } catch (e) {
          console.error("Failed to fetch chat data", e);
        }
      };
      fetchData();
    }
  }, [user?.userId]);

  // Sync: Mark messages as read when a chat window is opened
  useEffect(() => {
    if (isChatOpen && selectedMember) {
      setUnreadCounts((prev) => {
        if (!prev[selectedMember.userId]) return prev;
        const next = { ...prev };
        delete next[selectedMember.userId];
        return next;
      });

      // Update read status on backend
      axios
        .post(`${NODE_SERVER}/chat/mark-read`, {
          userId: user.userId,
          senderId: selectedMember.userId,
        })
        .catch((e) => console.error("Failed to mark messages as read", e));
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
      title: type === "broadcast" ? broadcastTitle : undefined,
      priority: type === "broadcast" ? broadcastPriority : undefined,
    };

    socket.emit("send_message", messageData);
    if (type === "broadcast") {
      setBroadcastTitle("");
      setBroadcastPriority("normal");
      setUnreadCounts((prev) => {
        if (!prev["broadcast"]) return prev;
        const next = { ...prev };
        delete next["broadcast"];
        return next;
      });
    } else if (type === "private") {
      setRecentUserIds((prev) =>
        prev.includes(selectedMember.userId)
          ? prev
          : [selectedMember.userId, ...prev],
      );
    }
    setMessage("");
  };

  const filteredEmployees = employees
    .filter((emp) => {
      const name = (emp.name || "").toLowerCase();
      const role = (emp.role || "").toLowerCase();
      const department = (emp.department || "").toLowerCase();
      const searchTerm = search.toLowerCase();
      return (
        (name.includes(searchTerm) || role.includes(searchTerm) || department.includes(searchTerm)) &&
        emp.userId !== user?.userId
      );
    })
    .sort((a, b) => {
      const deptA = (a.department || "Other").toLowerCase();
      const deptB = (b.department || "Other").toLowerCase();
      if (deptA < deptB) return -1;
      if (deptA > deptB) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

  const formatMessageDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    
    // Check if it's today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if it's yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    
    // Check if it's within the last 7 days
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const renderEmployeeItem = (emp, idx, arr) => {
    const currentDept = emp.department || "Other";
    const prevDept = idx > 0 ? (arr[idx - 1].department || "Other") : null;
    const isNewDept = currentDept !== prevDept;
    
    return (
      <React.Fragment key={emp.userId}>
        {isNewDept && viewTab === "contacts" && (
          <div className="px-6 py-4 flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-platinum to-transparent"></div>
            <p className="text-[9px] font-black text-battleship-gray uppercase tracking-[0.2em] flex items-center gap-1.5">
              {currentDept}
            </p>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-platinum to-transparent"></div>
          </div>
        )}
        <div
          onClick={() => setSelectedMember(emp)}
          className="flex items-center gap-4 p-4 mx-4 my-2 bg-white hover:bg-gradient-to-r hover:from-white hover:to-misty-rose/20 cursor-pointer transition-all duration-300 border border-platinum/60 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:border-red/30 hover:shadow-[0_8px_20px_-6px_rgba(234,27,64,0.15)] group relative overflow-hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-seasalt border border-platinum flex items-center justify-center text-red font-black text-lg group-hover:bg-red group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-red/20">
              {(emp.name || "U").charAt(0)}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${userStatuses[emp.userId] === 'online' ? 'bg-green-500' : userStatuses[emp.userId] === 'away' ? 'bg-yellow-400' : 'bg-platinum'}`} title={userStatuses[emp.userId] || 'offline'}></div>
            {unreadCounts[emp.userId] > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red border-2 border-white rounded-full flex items-center justify-center animate-pulse shadow-sm"></div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <p className="font-bold text-[13px] text-gunmetal truncate group-hover:text-red transition-colors">
                {emp.name}
              </p>
              <span className="shrink-0 text-[8px] font-black text-battleship-gray bg-seasalt border border-platinum/90 px-1.5 py-0.5 rounded uppercase tracking-widest group-hover:bg-white group-hover:border-red/20 group-hover:text-red transition-all">
                {emp.department || emp.role || "Team"}
              </span>
            </div>
            {viewTab === "chats" ? (
              <p className="text-[11px] text-dim-gray truncate mt-0.5 font-medium">
                {recentUserIds.find(
                  (c) => String(c._id || c) === String(emp.userId),
                )?.lastMessage || "Start a conversation..."}
              </p>
            ) : (
              <p className="text-[11px] text-dim-gray truncate mt-0.5 font-medium">
                Click to start conversation
              </p>
            )}
          </div>
          <div className="flex flex-col items-end justify-center gap-1.5 min-w-[70px]">
            {viewTab === "chats" &&
              recentUserIds.find(
                (c) => String(c._id || c) === String(emp.userId),
              )?.lastTimestamp && (
                <span className="text-[9px] mr-1 font-bold text-battleship-gray uppercase tracking-wider group-hover:text-red/80 transition-colors">
                  {formatMessageDate(
                    recentUserIds.find((c) => String(c._id || c) === String(emp.userId)).lastTimestamp
                  )}
                </span>
              )}
            {unreadCounts[emp.userId] > 0 ? (
              <span className="bg-red text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center justify-center">
                {unreadCounts[emp.userId]} new
              </span>
            ) : (
              <ChevronRight
                size={14}
                className="text-platinum group-hover:text-red transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 mr-1"
              />
            )}
          </div>
        </div>
      </React.Fragment>
    );
  };

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
              <div className="relative">
                <MessageSquare size={20} fill="white" />
                {Object.values(unreadCounts).some((v) => v > 0) && (
                  <span className="absolute -top-2 -right-2 bg-white text-red text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-lg border border-red/20">
                    {Object.values(unreadCounts).reduce(
                      (a, b) => a + (Number(b) || 0),
                      0,
                    )}
                  </span>
                )}
              </div>
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
        {/* Global Notification Toast */}
        {notification && (
          <div
            onClick={() => {
              if (notification.senderId === "broadcast") {
                setSelectedMember({ userId: "broadcast", name: "Team Announcements", role: "Company-Wide" });
                setViewTab("chats");
              } else {
                const sender = employees.find(
                  (e) => e.userId === notification.senderId,
                );
                if (sender) {
                  setSelectedMember(sender);
                  setViewTab("chats");
                }
              }
              setNotification(null);
            }}
            className="absolute top-20 left-4 right-4 z-[120] bg-white border border-platinum shadow-2xl rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-full duration-500 cursor-pointer hover:border-red/30 transition-all"
          >
            <div className="w-10 h-10 rounded-full bg-red/10 flex items-center justify-center text-red font-bold">
              {(notification.senderName || "U").charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-red uppercase tracking-widest">
                New Message
              </p>
              <p className="text-xs font-bold text-gunmetal truncate">
                {notification.senderName}
              </p>
              <p className="text-[11px] text-dim-gray truncate">
                {notification.text}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setNotification(null);
              }}
              className="text-platinum hover:text-red p-1"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-white to-seasalt text-red border-b border-platinum relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-misty-rose/20 rounded-full blur-2xl -ml-16 -mb-16"></div>
          <div className="relative z-10 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {selectedMember || showBroadcastForm ? (
                <button
                  onClick={() => {
                    setSelectedMember(null);
                    setShowBroadcastForm(false);
                  }}
                  className="p-2 hover:bg-red/10 rounded-xl transition-all text-red/80 hover:text-red hover:shadow-sm"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-red to-dark-red flex items-center justify-center rounded-2xl shadow-lg shadow-red/30 ring-4 ring-red/5">
                  <Users size={24} className="text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black tracking-tight text-gunmetal">
                    {showBroadcastForm ? "New Broadcast" : selectedMember ? selectedMember.name : "Team Connect"}
                  </h3>
                  {selectedMember && selectedMember.userId !== "broadcast" && !showBroadcastForm && (
                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm border border-white ${userStatuses[selectedMember.userId] === 'online' ? 'bg-green-500' : userStatuses[selectedMember.userId] === 'away' ? 'bg-yellow-400' : 'bg-platinum'}`} title={userStatuses[selectedMember.userId] || 'offline'}></div>
                  )}
                </div>
                {showBroadcastForm ? (
                   <p className="text-[11px] font-semibold text-battleship-gray uppercase tracking-widest mt-0.5 text-red/80">
                     Send to All Members
                   </p>
                ) : selectedMember && (
                  <p className="text-[11px] font-semibold text-battleship-gray uppercase tracking-widest mt-0.5">
                    {selectedMember.department ||
                      selectedMember.role ||
                      "Team Member"}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-red/5 rounded-xl transition-all hover:scale-110 text-dim-gray hover:text-red"
                title="Minimize"
              >
                <Minus size={20} />
              </button>
              <button
                onClick={() => {
                  setIsChatOpen(false);
                  setSelectedMember(null);
                  setShowBroadcastForm(false);
                }}
                className="p-2 hover:bg-red/5 rounded-xl transition-all hover:rotate-90 duration-300 text-red"
                title="Close Chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        {!selectedMember && !showBroadcastForm && (
          <div className="bg-white border-b border-platinum/50 px-6 py-3 relative z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
            <div className="flex bg-seasalt rounded-xl p-1 shadow-inner border border-platinum/30 gap-1">
              <button
                onClick={() => setViewTab("chats")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2 ${viewTab === "chats" ? "bg-white text-red shadow-sm border border-platinum/50" : "text-battleship-gray hover:text-gunmetal hover:bg-white/50"}`}
              >
                Chats
                {Object.values(unreadCounts).filter((v) => v > 0).length >
                  0 && (
                  <span className="bg-red text-white px-1.5 py-0.5 rounded-full text-[8px] shadow-sm">
                    {Object.values(unreadCounts).filter((v) => v > 0).length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setViewTab("contacts")}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center justify-center gap-2 ${viewTab === "contacts" ? "bg-white text-red shadow-sm border border-platinum/50" : "text-battleship-gray hover:text-gunmetal hover:bg-white/50"}`}
              >
                Contacts
              </button>
            </div>
          </div>
        )}

        {showBroadcastForm ? (
          /* Broadcast Form View */
          <div className="flex-1 flex flex-col bg-seasalt overflow-hidden p-6 space-y-5 table-scrollbar overflow-y-auto">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-battleship-gray tracking-widest ml-1">Title</label>
              <input type="text" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="e.g. System Maintenance" className="w-full p-3.5 bg-white border border-platinum/70 rounded-2xl focus:outline-none focus:border-red focus:ring-4 focus:ring-red/5 transition-all text-[13px] font-medium text-gunmetal shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-battleship-gray tracking-widest ml-1">Priority</label>
              <select value={broadcastPriority} onChange={(e) => setBroadcastPriority(e.target.value)} className="w-full p-3.5 bg-white border border-platinum/70 rounded-2xl focus:outline-none focus:border-red focus:ring-4 focus:ring-red/5 transition-all text-[13px] font-medium text-gunmetal shadow-sm appearance-none cursor-pointer">
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-1.5 flex-1 flex flex-col min-h-[200px]">
              <label className="text-[10px] font-black uppercase text-battleship-gray tracking-widest ml-1">Message</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your announcement..." className="w-full flex-1 p-4 bg-white border border-platinum/70 rounded-2xl focus:outline-none focus:border-red focus:ring-4 focus:ring-red/5 transition-all text-[13px] font-medium text-gunmetal shadow-sm resize-none"></textarea>
            </div>
            <button onClick={(e) => {
               handleSendMessage(e, "broadcast");
               setShowBroadcastForm(false);
            }} disabled={!message.trim() || !broadcastTitle.trim()} className="w-full py-4 mt-2 bg-gradient-to-r from-red to-dark-red text-white font-black text-[13px] rounded-2xl shadow-lg shadow-red/30 hover:shadow-red/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none uppercase tracking-wider flex items-center justify-center gap-2">
              <Megaphone size={16} /> Send Broadcast
            </button>
          </div>
        ) : selectedMember ? (
          /* Active Chat View */
          <div className="flex-1 flex flex-col bg-seasalt overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gradient-to-b from-seasalt/50 to-seasalt table-scrollbar">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-24 h-24 rounded-full bg-white shadow-xl shadow-platinum/50 flex items-center justify-center text-battleship-gray mb-6 border border-platinum/50 relative">
                    <div className="absolute inset-0 rounded-full border border-red/10 animate-ping opacity-20"></div>
                    <User size={48} strokeWidth={1} />
                  </div>
                  <h4 className="font-black text-gunmetal text-lg mb-2">
                    Say Hello!
                  </h4>
                  <p className="text-[13px] text-dim-gray max-w-[220px] leading-relaxed">
                    Start a conversation with{" "}
                    <b className="text-red">{selectedMember.name}</b> right now.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === user.userId;
                  const sender = employees.find((e) => String(e.userId) === String(msg.senderId));
                  const displayName = sender?.name || msg.senderName || 'Team Member';
                  const department = sender?.department || sender?.role || '';
                  if (msg.type === "broadcast") {
                    return (
                      <div key={msg._id || idx} className="flex flex-col animate-in slide-in-from-bottom-2 duration-300 my-4 px-2">
                        <div className={`w-full bg-white border border-platinum rounded-2xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] overflow-hidden transition-all hover:shadow-[0_8px_30px_-5px_rgba(0,0,0,0.08)] ${msg.priority === 'urgent' ? 'border-t-4 border-t-red' : msg.priority === 'important' ? 'border-t-4 border-t-orange-400' : 'border-t-4 border-t-battleship-gray'}`}>
                          
                          {/* Card Header */}
                          <div className={`px-5 py-3 flex items-center justify-between border-b ${msg.priority === 'urgent' ? 'bg-red/5 border-red/10' : msg.priority === 'important' ? 'bg-orange-50 border-orange-200/50' : 'bg-seasalt border-platinum'}`}>
                            <div className="flex items-center gap-2.5">
                               <div className={`p-1.5 rounded-lg ${msg.priority === 'urgent' ? 'bg-red/10 text-red' : msg.priority === 'important' ? 'bg-orange-500/10 text-orange-600' : 'bg-battleship-gray/10 text-battleship-gray'}`}>
                                 {msg.priority === 'urgent' ? <AlertTriangle size={14} /> : msg.priority === 'important' ? <Info size={14} /> : <Megaphone size={14} />}
                               </div>
                               <span className={`text-[11px] font-bold uppercase tracking-wider ${msg.priority === 'urgent' ? 'text-red' : msg.priority === 'important' ? 'text-orange-600' : 'text-gunmetal'}`}>
                                 {msg.title || 'Announcement'}
                               </span>
                            </div>
                            <span className="text-[9px] font-bold text-battleship-gray uppercase tracking-widest bg-white px-2 py-1 rounded-md shadow-sm border border-platinum/50">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          {/* Card Body */}
                          <div className="p-5 bg-white">
                            <p className="text-[13px] text-gunmetal font-medium leading-relaxed whitespace-pre-wrap">
                              {msg.text}
                            </p>
                          </div>
                          
                          {/* Card Footer: Sender Info */}
                          <div className="px-5 py-2.5 bg-seasalt border-t border-platinum flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-[9px] font-black text-battleship-gray uppercase tracking-widest">Sent By</p>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-platinum/60 shadow-sm">
                              <div className="w-4 h-4 rounded-full bg-red/10 flex items-center justify-center text-[8px] font-black text-red">
                                {displayName.charAt(0)}
                              </div>
                              <p className="text-[10px] font-bold text-gunmetal">
                                {displayName}
                                {department && <span className="text-dim-gray font-medium ml-1.5 border-l border-platinum pl-1.5">{department}</span>}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Standard Private Chat Message
                  return (
                    <div
                      key={msg._id || idx}
                      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300 group`}
                    >
                      <div
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%] relative`}
                      >
                        <div
                          className={`px-5 py-3.5 text-[13px] shadow-sm relative ${
                            isMe
                              ? "bg-gradient-to-br from-red to-dark-red text-white rounded-[20px] rounded-tr-[4px] shadow-red/20"
                              : "bg-white border border-platinum/50 text-gunmetal rounded-[20px] rounded-tl-[4px] shadow-platinum/20"
                          }`}
                        >
                          <p className="font-medium leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 mt-1.5 px-2 opacity-70 group-hover:opacity-100 transition-opacity ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <p className="text-[9px] font-black text-battleship-gray uppercase tracking-widest">
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {selectedMember.userId === "broadcast" ? (
              <div className="p-4 bg-white border-t border-platinum/60 flex flex-col items-center justify-center py-5">
                <p className="text-[11px] font-black text-battleship-gray uppercase tracking-widest flex items-center gap-2 bg-seasalt px-4 py-2 rounded-xl border border-platinum/50">
                  <Shield size={14} className="text-red/60" /> Read-only broadcast channel
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white border-t border-platinum/60">
                <form
                  onSubmit={(e) => handleSendMessage(e, "private")}
                  className="relative flex items-center gap-3 bg-seasalt border border-platinum/60 rounded-2xl p-1.5 focus-within:border-red/40 focus-within:ring-4 focus-within:ring-red/5 transition-all shadow-inner"
                >
                  <input
                    type="text"
                    placeholder="Write a message..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-transparent focus:outline-none text-[13px] font-medium text-gunmetal placeholder:text-dim-gray/60"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim()}
                    className="p-2.5 bg-red text-white rounded-xl shadow-md shadow-red/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none flex items-center justify-center"
                  >
                    <Send size={16} className="ml-0.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Contact List View */
          <>
            {/* Search Area */}
            <div className="px-6 py-4 bg-gradient-to-b from-white to-seasalt/30 border-b border-platinum/50">
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-battleship-gray group-focus-within:text-red transition-colors"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Find a team member..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-platinum/70 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red/20 focus:border-red transition-all text-sm font-medium shadow-sm group-hover:border-platinum placeholder:text-dim-gray/60 text-gunmetal"
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
                <div className="py-1.5">
                  {viewTab === "chats" ? (
                    /* Active Conversations View (Sorted by Activity) */
                    <>
                      <p className="px-6 pt-3 pb-1 text-[10px] font-black text-battleship-gray uppercase tracking-[0.1em]">
                        Your Conversations
                      </p>

                      {/* Permanent Broadcast Card */}
                      <div
                        onClick={() => setSelectedMember({ userId: "broadcast", name: "Team Announcements", role: "Company-Wide" })}
                        className="flex items-center gap-4 p-4 mx-4 my-2 bg-white hover:bg-gradient-to-r hover:from-white hover:to-misty-rose/20 cursor-pointer transition-all duration-300 border border-red/30 rounded-2xl shadow-[0_2px_10px_-3px_rgba(234,27,64,0.1)] hover:border-red/50 hover:shadow-[0_8px_20px_-6px_rgba(234,27,64,0.2)] group relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red opacity-100"></div>
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-red/10 border border-red/30 flex items-center justify-center text-red font-black text-lg group-hover:bg-red group-hover:text-white transition-all duration-300 shadow-inner group-hover:shadow-red/20">
                            <Megaphone size={20} />
                          </div>
                          {unreadCounts["broadcast"] > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red border-2 border-white rounded-full flex items-center justify-center animate-pulse shadow-sm"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[13px] text-gunmetal truncate group-hover:text-red transition-colors">
                              Team Announcements
                            </p>
                            <span className="shrink-0 text-[8px] font-black text-red bg-misty-rose/50 border border-red/20 px-1.5 py-0.5 rounded uppercase tracking-widest transition-all">
                              Broadcasts
                            </span>
                          </div>
                          <p className="text-[11px] text-dim-gray truncate mt-0.5 font-medium">
                            {recentUserIds.find(c => String(c._id || c) === "broadcast")?.lastMessage || "View company updates..."}
                          </p>
                        </div>
                        <div className="flex flex-col items-end justify-center gap-1.5 min-w-[70px]">
                          {recentUserIds.find(c => String(c._id || c) === "broadcast")?.lastTimestamp && (
                            <span className="text-[9px] mr-1 font-bold text-battleship-gray uppercase tracking-wider group-hover:text-red/80 transition-colors">
                              {formatMessageDate(recentUserIds.find(c => String(c._id || c) === "broadcast").lastTimestamp)}
                            </span>
                          )}
                          {unreadCounts["broadcast"] > 0 ? (
                            <span className="bg-red text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center justify-center">
                              {unreadCounts["broadcast"]} new
                            </span>
                          ) : (
                            <ChevronRight
                              size={14}
                              className="text-platinum group-hover:text-red transition-colors opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 mr-1"
                            />
                          )}
                        </div>
                      </div>

                      {recentUserIds.length === 0 ? (
                        <div className="p-8 text-center text-xs text-dim-gray">
                          No chats yet. Go to Contacts to start a conversation.
                        </div>
                      ) : (
                        recentUserIds
                          .map((chat) =>
                            employees.find(
                              (e) =>
                                String(e.userId) === String(chat._id || chat),
                            ),
                          )
                          .filter(Boolean) // Remove if employee not found
                          .filter((emp) => {
                            const name = (emp.name || "").toLowerCase();
                            const searchTerm = search.toLowerCase();
                            return name.includes(searchTerm);
                          })
                          .map((emp, idx, arr) =>
                            renderEmployeeItem(emp, idx, arr),
                          )
                      )}
                    </>
                  ) : (
                    /* Full Directory View (Sorted Alphabetically) */
                    filteredEmployees.map((emp, idx, arr) =>
                      renderEmployeeItem(emp, idx, arr),
                    )
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-5">
                  <div className="w-24 h-24 bg-white rounded-full shadow-xl shadow-platinum/50 flex items-center justify-center text-battleship-gray border border-platinum/50">
                    <Search size={40} strokeWidth={1} />
                  </div>
                  <div>
                    <h4 className="font-black text-gunmetal text-lg mb-1">
                      No members found
                    </h4>
                    <p className="text-[13px] text-dim-gray leading-relaxed max-w-[200px]">
                      Try searching for a different name or role.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Footer Info - Generalized Broadcast Message */}
        {!selectedMember && !showBroadcastForm && (
          <div className="p-4 bg-gradient-to-b from-white to-seasalt border-t border-platinum/60">
            <button
              onClick={() => setShowBroadcastForm(true)}
              className="w-full relative overflow-hidden flex items-center justify-center gap-3 py-3.5 bg-white border border-platinum/80 rounded-2xl text-gunmetal hover:text-red hover:border-red/30 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_20px_-6px_rgba(234,27,64,0.15)] transition-all duration-300 group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red/0 via-red/5 to-red/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <Megaphone
                size={16}
                className="group-hover:rotate-[-15deg] group-hover:scale-110 transition-transform duration-300 text-red"
              />
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.15em]">
                  Broadcast to Team
                </span>
                {unreadCounts["broadcast"] > 0 && (
                  <span className="bg-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-bounce">
                    {unreadCounts["broadcast"]}
                  </span>
                )}
              </div>
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .cubic-bezier {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
};

export default ChatSlider;
