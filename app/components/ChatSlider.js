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
} from "lucide-react";
import { GlobalContext } from "../lib/GlobalContext";
import { useAuth } from "../Context/AuthContext";
import axios from "axios";
import io from "socket.io-client";

const NODE_SERVER = process.env.NEXT_PUBLIC_CHAT_SERVER || "http://localhost:5000";

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
  const [unreadCounts, setUnreadCounts] = useState({});
  const [viewTab, setViewTab] = useState("chats");
  const [recentUserIds, setRecentUserIds] = useState([]);
  const [notification, setNotification] = useState(null);
  const messagesEndRef = useRef(null);
  const isChatOpenRef = useRef(isChatOpen);
  const selectedMemberRef = useRef(selectedMember);

  // Update refs
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

  // Initialize Socket
  useEffect(() => {
    const newSocket = io(NODE_SERVER, {
      transports: ["websocket"],
      upgrade: false,
    });
    setSocket(newSocket);

    if (user?.userId) {
      newSocket.emit("join_chat", user.userId);
    }

    newSocket.on("receive_message", (msg) => {
      setMessages((prev) => {
        if (prev.find((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });

      const isBroadcast = msg.type === "broadcast";
      const senderKey = isBroadcast ? "broadcast" : msg.senderId;

      const currentSelected = selectedMemberRef.current;
      const currentIsChatOpen = isChatOpenRef.current;
      
      const isMessageFromActiveChat = isBroadcast ? !currentSelected : (currentSelected?.userId === msg.senderId);
      
      // Move to top of recent list (WhatsApp style) and update preview
      const chatPartnerId = isBroadcast ? "broadcast" : (msg.senderId === user.userId ? msg.receiverId : msg.senderId);
      setRecentUserIds(prev => {
        const filtered = prev.filter(c => (c._id || c) !== chatPartnerId);
        return [{ _id: chatPartnerId, lastMessage: msg.text, lastTimestamp: msg.timestamp }, ...filtered];
      });

      setUnreadCounts((prev) => {
        if (!currentIsChatOpen || !isMessageFromActiveChat) {
          if (msg.senderId !== user.userId) {
            setNotification({
              senderName: msg.senderName,
              text: msg.text,
              senderId: msg.senderId
            });
            setTimeout(() => setNotification(null), 4000);
            
            return {
              ...prev,
              [senderKey]: (prev[senderKey] || 0) + 1
            };
          }
        }
        return prev;
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

  // Fetch Recent Conversations & Unread Counts on mount/login
  useEffect(() => {
    if (user?.userId) {
      const fetchData = async () => {
        try {
          // Fetch Recent Users
          const recentRes = await axios.get(`${NODE_SERVER}/chat/recent-users`, {
            params: { userId: user.userId },
          });
          if (recentRes.data.success) {
            setRecentUserIds(recentRes.data.data);
          }

          // Fetch Unread Counts
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

  // Clear unread counts when opening a chat
  useEffect(() => {
    if (isChatOpen && selectedMember) {
      setUnreadCounts((prev) => {
        if (!prev[selectedMember.userId]) return prev;
        const next = { ...prev };
        delete next[selectedMember.userId];
        return next;
      });

      // Mark as read on backend
      axios.post(`${NODE_SERVER}/chat/mark-read`, {
        userId: user.userId,
        senderId: selectedMember.userId
      }).catch(e => console.error("Failed to mark messages as read", e));
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
    if (type === "private") {
      setRecentUserIds((prev) =>
        prev.includes(selectedMember.userId)
          ? prev
          : [selectedMember.userId, ...prev],
      );
    } else if (type === "broadcast") {
      setUnreadCounts((prev) => {
        if (!prev["broadcast"]) return prev;
        const next = { ...prev };
        delete next["broadcast"];
        return next;
      });
    }
    setMessage("");
  };

  const filteredEmployees = employees
    .filter((emp) => {
      const name = (emp.name || "").toLowerCase();
      const role = (emp.role || "").toLowerCase();
      const searchTerm = search.toLowerCase();
      return (
        (name.includes(searchTerm) || role.includes(searchTerm)) &&
        emp.userId !== user?.userId
      );
    })
    .sort((a, b) => {
      const isAAdmin = (a.role || "").toLowerCase() === "admin" || a.userId === "11111111";
      const isBAdmin = (b.role || "").toLowerCase() === "admin" || b.userId === "11111111";
      if (isAAdmin && !isBAdmin) return -1;
      if (!isAAdmin && isBAdmin) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

  const renderEmployeeItem = (emp, idx, arr) => {
    const isFirstAdmin =
      emp.role === "Admin" && (idx === 0 || arr[idx - 1].role !== "Admin");
    const isFirstRegular =
      emp.role !== "Admin" && idx > 0 && arr[idx - 1].role === "Admin";
    return (
      <React.Fragment key={emp.userId}>
        {isFirstAdmin && (
          <p className="px-6 py-3 text-[10px] font-black text-red bg-red/5 uppercase tracking-[0.1em] border-y border-red/10 flex items-center gap-2">
            <Shield size={12} />
            Support & Administration
          </p>
        )}
        {isFirstRegular && (
          <p className="px-6 py-3 text-[10px] font-black text-battleship-gray uppercase tracking-[0.1em] bg-white/50 border-y border-platinum/30">
            Team Members
          </p>
        )}
        <div
          onClick={() => setSelectedMember(emp)}
          className="flex items-center gap-4 p-4 hover:bg-seasalt cursor-pointer transition-all border-b border-platinum/50 group last:border-b-0"
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-misty-rose to-white border border-red/10 flex items-center justify-center text-red font-black text-lg group-hover:from-red group-hover:to-dark-red group-hover:text-white transition-all duration-300 shadow-sm">
              {(emp.name || "U").charAt(0)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-gunmetal truncate">{emp.name}</p>
            {viewTab === "chats" && (
              <p className="text-[11px] text-battleship-gray truncate mt-0.5 font-medium">
                {recentUserIds.find(c => String(c._id || c) === String(emp.userId))?.lastMessage || "No messages yet"}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 min-w-[80px]">
            <span className="text-[8px] font-black text-battleship-gray bg-seasalt border border-platinum/50 px-2 py-0.5 rounded-lg uppercase tracking-widest text-right">
              {emp.department || emp.role || "Team"}
            </span>
            {viewTab === "chats" && (
              <span className="text-[10px] font-semibold text-red uppercase mr-2">
                {recentUserIds.find((c) => String(c._id || c) === String(emp.userId))
                  ?.lastTimestamp
                  ? new Date(
                      recentUserIds.find(
                        (c) => String(c._id || c) === String(emp.userId),
                      ).lastTimestamp,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            )}
            {unreadCounts[emp.userId] > 0 && (
              <span className="bg-red text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                {unreadCounts[emp.userId]}
              </span>
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
              const sender = employees.find(
                (e) => e.userId === notification.senderId,
              );
              if (sender) {
                setSelectedMember(sender);
                setViewTab("chats");
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
        {!selectedMember && (
          <div className="flex bg-white border-b border-platinum px-6 py-2 gap-4">
            <button
              onClick={() => setViewTab("chats")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${viewTab === "chats" ? "text-red border-red" : "text-battleship-gray border-transparent hover:text-red/60"}`}
            >
              Chats
              {Object.values(unreadCounts).filter((v) => v > 0).length > 0 && (
                <span className="ml-2 bg-red text-white px-1.5 py-0.5 rounded-full text-[8px]">
                  {Object.values(unreadCounts).filter((v) => v > 0).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewTab("contacts")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 ${viewTab === "contacts" ? "text-red border-red" : "text-battleship-gray border-transparent hover:text-red/60"}`}
            >
              Contacts
            </button>
          </div>
        )}

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
                      className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                      <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%]`}>
                        <div
                          className={`px-4 py-3 rounded-2xl text-sm backdrop-blur-sm border ${
                            isMe
                              ? "bg-red/10 border-red/20 text-red rounded-tr-none"
                              : "bg-black/5 border-platinum/50 text-gunmetal rounded-tl-none"
                          }`}
                        >
                          <p className="font-medium leading-relaxed">{msg.text}</p>
                        </div>
                        <p className="text-[9px] mt-1.5 font-bold text-dim-gray/60 uppercase tracking-wider px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
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
                  {viewTab === "chats" ? (
                    /* Active Conversations View (Sorted by Activity) */
                    <>
                      <p className="px-6 py-3 text-[10px] font-black text-battleship-gray uppercase tracking-[0.1em] bg-white/50">
                        Your Conversations
                      </p>
                      {recentUserIds.length === 0 ? (
                        <div className="p-8 text-center text-xs text-dim-gray">
                          No chats yet. Go to Contacts to start a conversation.
                        </div>
                      ) : (
                        recentUserIds
                          .map((chat) => employees.find((e) => String(e.userId) === String(chat._id || chat)))
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider">
                Broadcast to Team
              </span>
              {unreadCounts["broadcast"] > 0 && (
                <span className="bg-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCounts["broadcast"]}
                </span>
              )}
            </div>
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
