"use client";
import { useState, useRef, useEffect, useContext } from "react";
import {
  Paperclip,
  Image,
  FileText,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  RefreshCw,
  Calendar,
  Download,
  Trash2,
  Plus,
  Search,
  Loader2,
  ArrowLeft,
  Flag,
  User,
  Building2,
  Calendar as CalendarIcon,
  FileIcon,
  Sparkles,
  BriefcaseIcon,
} from "lucide-react";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useAuth } from "@/app/Context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

const priorityColors = {
  high: {
    bg: "#fee2e2",
    text: "#dc2626",
    border: "#fecaca",
    dot: "#dc2626",
  },
  medium: {
    bg: "#ffedd5",
    text: "#ea580c",
    border: "#fed7aa",
    dot: "#f97316",
  },
  low: {
    bg: "#dcfce7",
    text: "#16a34a",
    border: "#bbf7d0",
    dot: "#22c55e",
  },
};

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "#fef08a",
    textColor: "#854d0e",
  },
  "in-progress": {
    label: "In Progress",
    icon: RefreshCw,
    color: "#dbeafe",
    textColor: "#1e40af",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle,
    color: "#dcfce7",
    textColor: "#166534",
  },
};

const TABS = ["My Tasks", "Assigned Tasks"];

export default function TaskOrganiser() {
  const { server } = useContext(GlobalContext);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("My Tasks");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
  const [tasks, setTasks] = useState({ myTasks: [], assignedTasks: [] });
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    assigned: 0,
    unread: 0,
  });
  const [departmentList, setDepartmentList] = useState([]);
  const [employeesByDept, setEmployeesByDept] = useState({});
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [selectedAssignee, setSelectedAssignee] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [assignToTeam, setAssignToTeam] = useState(false);

  const currentUserId = user?.userId;
  const currentUserName = user?.userName || "Current User";
  const currentDepartment = user?.department || "Other";

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${server}/employees/department`);
      if (response.data.success) {
        const groupedMap = response.data.data || {};
        const deptKeys = Object.keys(groupedMap);
        setDepartmentList(deptKeys);
        setEmployeesByDept(groupedMap);
        if (deptKeys.length > 0 && !selectedDepartment) {
          setSelectedDepartment(deptKeys[0]);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
      return false;
    }
  };
  const sanitizeAttachments = (attachments) => {
    if (!Array.isArray(attachments)) return [];
    return attachments.map((file) => ({
      name: file.name || "",
      url: file.url || "",
      type: file.type || "",
      size: typeof file.size === "number" ? file.size : 0,
    }));
  };
  const fetchMyTasks = async () => {
    if (!currentUserId) return;
    try {
      const response = await axios.get(
        `${server}/tasks?userId=${currentUserId}&type=received`,
      );
      if (response.data.success) {
        setTasks((prev) => ({ ...prev, myTasks: response.data.data }));
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching my tasks:", error);
    }
  };

  const fetchAssignedTasks = async () => {
    if (!currentUserId) return;
    try {
      const response = await axios.get(
        `${server}/tasks?userId=${currentUserId}&type=assigned`,
      );
      if (response.data.success) {
        setTasks((prev) => ({ ...prev, assignedTasks: response.data.data }));
      }
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchEmployees();
      if (currentUserId) {
        await Promise.all([fetchMyTasks(), fetchAssignedTasks()]);
      }
      setLoading(false);
    };
    loadData();
  }, [currentUserId]);

  const getDepartmentUsers = () => {
    if (!selectedDepartment) return [];
    return employeesByDept[selectedDepartment] || [];
  };

  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${server}/tasks/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.success) {
        // Explicitly return only the 4 fields we need
        const { name, url, type, size } = response.data.data;
        return { name, url, type, size };
      }
      throw new Error("Upload failed");
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedFiles = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        continue;
      }

      try {
        const uploaded = await uploadFile(file);
        uploadedFiles.push(uploaded);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setAttachments((prev) => [...prev, ...uploadedFiles]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteTask = async (taskId, type) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`${server}/tasks?id=${taskId}`);
        if (type === "myTasks") fetchMyTasks();
        else fetchAssignedTasks();
        setSelectedTaskForDetail(null);
        toast.success("Task deleted successfully");
      } catch (error) {
        toast.error("Failed to delete task");
      }
    }
  };

  const addTask = async () => {
    if (!newTask.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const sanitizedAttachments = sanitizeAttachments(attachments);

    if (assignToTeam) {
      const teamMembers = getDepartmentUsers();
      if (teamMembers.length === 0) {
        toast.error("No team members found in this department");
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const member of teamMembers) {
        try {
          await axios.post(`${server}/tasks`, {
            title: newTask.trim(),
            description: taskDescription.trim(),
            priority: newPriority,
            dueDate: taskDueDate || new Date().toISOString().split("T")[0],
            assignedToUserId: member.userId,
            assignedToUserName: member.name,
            assignedToDepartment: selectedDepartment,
            assignedByUserId: currentUserId,
            assignedByUserName: currentUserName,
            assignedByDepartment: currentDepartment,
            attachments: sanitizedAttachments,
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to assign task to ${member.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(
          `Task assigned to ${successCount} team member(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
        );
        setNewTask("");
        setTaskDescription("");
        setTaskDueDate("");
        setAttachments([]);
        setAssignToTeam(false);
        fetchAssignedTasks();
      } else {
        toast.error("Failed to assign tasks to team");
      }
      return;
    }

    if (!selectedAssignee) {
      toast.error("Please select an employee or assign to team");
      return;
    }

    const assigneeUser = getDepartmentUsers().find(
      (u) => u.name === selectedAssignee,
    );

    if (!assigneeUser) {
      toast.error("Selected user not found");
      return;
    }

    try {
      await axios.post(`${server}/tasks`, {
        title: newTask.trim(),
        description: taskDescription.trim(),
        priority: newPriority,
        dueDate: taskDueDate || new Date().toISOString().split("T")[0],
        assignedToUserId: assigneeUser.userId,
        assignedToUserName: assigneeUser.name,
        assignedToDepartment: selectedDepartment,
        assignedByUserId: currentUserId,
        assignedByUserName: currentUserName,
        assignedByDepartment: currentDepartment,
        attachments: sanitizedAttachments,
      });

      toast.success("Task assigned successfully!");
      setNewTask("");
      setTaskDescription("");
      setSelectedAssignee("");
      setTaskDueDate("");
      setAttachments([]);
      fetchAssignedTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign task");
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${server}/tasks?id=${taskId}`, { status: newStatus });
      fetchMyTasks();
      fetchAssignedTasks();
      setSelectedTaskForDetail(null);
      toast.success(`Task status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchEmployees();
    if (currentUserId) {
      await Promise.all([fetchMyTasks(), fetchAssignedTasks()]);
    }
    setLoading(false);
    toast.success("Refreshed successfully");
  };
 const handleDownload = async (attachment) => {
  try {
    toast.loading("Downloading...", { id: "download" });

    // Always fetch as blob so browser saves to disk instead of opening in a tab
    const response = await fetch(attachment.url, { mode: "cors" });

    if (!response.ok) throw new Error("Fetch failed, trying proxy...");

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    toast.success("Downloaded successfully", { id: "download" });
  } catch {
    // CORS blocked — fall back to your proxy which sets Content-Disposition: attachment
    try {
      const proxyUrl = `/api/tasks/download?url=${encodeURIComponent(attachment.url)}&name=${encodeURIComponent(attachment.name)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Proxy download failed");
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success("Downloaded successfully", { id: "download" });
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download file", { id: "download" });
    }
  }
};

  const filteredAssignedTasks = tasks.assignedTasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const filteredMyTasks = tasks.myTasks.filter((task) => {
    if (filterStatus !== "all" && task.status !== filterStatus) return false;
    if (
      searchQuery &&
      !task.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const pendingTasks = stats.pending + stats.inProgress;
  const totalUnread = stats.unread;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const isTaskAssignee = (task) => {
    return task.assignedTo?.userId === currentUserId;
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-500 font-medium">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-96 bg-white shadow-2xl flex flex-col flex-shrink-0 border-r border-gray-200 h-full overflow-hidden">
        {/* Header with inline red gradient */}
        <div
          className="px-6 py-5 text-white flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <BriefcaseIcon size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Task Flow</h1>
                <p className="text-xs mt-0.5" style={{ color: "#fecaca" }}>
                  Task Management System
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl transition-all duration-200"
              style={{ color: "rgba(255,255,255,0.8)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                e.currentTarget.style.color = "white";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.8)";
              }}
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className="rounded-xl p-2 text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <p className="text-2xl font-bold">{pendingTasks}</p>
              <p
                className="text-[10px] uppercase tracking-wide"
                style={{ color: "#fecaca" }}
              >
                Pending
              </p>
            </div>
            <div
              className="rounded-xl p-2 text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <p className="text-2xl font-bold">{stats.inProgress}</p>
              <p
                className="text-[10px] uppercase tracking-wide"
                style={{ color: "#fecaca" }}
              >
                In Progress
              </p>
            </div>
            <div
              className="rounded-xl p-2 text-center"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              <p className="text-2xl font-bold">{totalUnread}</p>
              <p
                className="text-[10px] uppercase tracking-wide"
                style={{ color: "#fecaca" }}
              >
                Unread
              </p>
            </div>
          </div>
        </div>

        {/* Department Selector */}
        <div className="px-4 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
            <Building2 size={12} />
            <span>SELECT DEPARTMENT</span>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedAssignee("");
            }}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2.5 outline-none bg-white font-medium"
            style={{ focusBorderColor: "#dc2626" }}
          >
            <option value="">— Choose a department —</option>
            {departmentList.map((dept) => {
              const userCount = employeesByDept[dept]?.length || 0;
              return (
                <option key={dept} value={dept}>
                  {dept} ({userCount} {userCount === 1 ? "member" : "members"})
                </option>
              );
            })}
          </select>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-white px-4 pt-2 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedTaskForDetail(null);
                setFilterStatus("all");
                setSearchQuery("");
              }}
              className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
                activeTab === tab
                  ? "text-red-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {tab === "My Tasks" && pendingTasks > 0 && (
                <span
                  className="ml-2 text-white rounded-full px-2 py-0.5 text-[10px]"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  {pendingTasks}
                </span>
              )}
              {tab === "Assigned Tasks" && stats.assigned > 0 && (
                <span className="ml-2 bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-[10px]">
                  {stats.assigned}
                </span>
              )}
              {activeTab === tab && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: "#dc2626" }}
                ></div>
              )}
            </button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="p-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Task Lists */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "My Tasks" && (
            <div className="p-4 space-y-3">
              {filteredMyTasks.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    No tasks assigned
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    When you receive tasks, they'll appear here
                  </p>
                </div>
              )}
              {filteredMyTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTaskForDetail(task)}
                  className={`group p-4 rounded-xl transition-all duration-200 cursor-pointer border ${
                    !task.isRead && task.status !== "completed"
                      ? "shadow-sm"
                      : "bg-white border-gray-200 hover:shadow-md"
                  }`}
                  style={
                    !task.isRead && task.status !== "completed"
                      ? { backgroundColor: "#fef2f2", borderColor: "#fecaca" }
                      : {}
                  }
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateTaskStatus(
                          task._id,
                          task.status === "completed" ? "pending" : "completed",
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 mt-1 rounded border-gray-300"
                      style={{ accentColor: "#dc2626" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: priorityColors[task.priority].bg,
                            color: priorityColors[task.priority].text,
                          }}
                        >
                          {task.priority}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: statusConfig[task.status]?.color,
                            color: statusConfig[task.status]?.textColor,
                          }}
                        >
                          {statusConfig[task.status]?.label}
                        </span>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          task.status === "completed"
                            ? "line-through text-gray-400"
                            : "text-gray-800"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User size={10} />
                          {task.assignedBy?.userName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={10} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task._id, "myTasks");
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Assigned Tasks" && (
            <div className="p-4 space-y-3">
              {filteredAssignedTasks.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    No tasks assigned by you
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Select a department to assign tasks
                  </p>
                </div>
              )}
              {filteredAssignedTasks.map((task) => (
                <div
                  key={task._id}
                  onClick={() => setSelectedTaskForDetail(task)}
                  className="group p-4 bg-white border border-gray-200 rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#fecaca";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-semibold text-gray-800 flex-1">
                      {task.title}
                    </p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: statusConfig[task.status]?.color,
                        color: statusConfig[task.status]?.textColor,
                      }}
                    >
                      {statusConfig[task.status]?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User size={10} />
                      To: {task.assignedTo?.userName}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon size={10} />
                      {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: priorityColors[task.priority].bg,
                        color: priorityColors[task.priority].text,
                      }}
                    >
                      {task.priority} priority
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task._id, "assignedTasks");
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
        {selectedTaskForDetail ? (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Task Detail Header */}
            <div className="px-8 py-5 border-b border-gray-200 bg-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedTaskForDetail(null)}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors group"
                >
                  <ArrowLeft
                    size={20}
                    className="group-hover:-translate-x-1 transition-transform"
                  />
                  <span className="font-medium">Back to list</span>
                </button>
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm px-3 py-1.5 rounded-full font-medium"
                    style={{
                      backgroundColor:
                        statusConfig[selectedTaskForDetail.status]?.color,
                      color:
                        statusConfig[selectedTaskForDetail.status]?.textColor,
                    }}
                  >
                    {statusConfig[selectedTaskForDetail.status]?.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Task Detail Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-3xl mx-auto px-8 py-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    {selectedTaskForDetail.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Task #{selectedTaskForDetail._id?.slice(-6)}</span>
                    <span>•</span>
                    <span>
                      Created{" "}
                      {new Date(
                        selectedTaskForDetail.createdAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      borderColor:
                        priorityColors[selectedTaskForDetail.priority].border,
                      backgroundColor:
                        priorityColors[selectedTaskForDetail.priority].bg,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Flag
                        size={16}
                        style={{
                          color:
                            priorityColors[selectedTaskForDetail.priority].text,
                        }}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Priority
                      </span>
                    </div>
                    <span
                      className="text-lg font-bold capitalize"
                      style={{
                        color:
                          priorityColors[selectedTaskForDetail.priority].text,
                      }}
                    >
                      {selectedTaskForDetail.priority}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon size={16} className="text-gray-500" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Due Date
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-800">
                      {new Date(
                        selectedTaskForDetail.dueDate,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="mb-8 p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <Users size={16} />
                    Assignment Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Assigned To</span>
                      <span className="text-sm font-medium text-gray-800">
                        {selectedTaskForDetail.assignedTo?.userName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">Department</span>
                      <span className="text-sm font-medium text-gray-800">
                        {selectedTaskForDetail.assignedTo?.department}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Assigned By</span>
                      <span className="text-sm font-medium text-gray-800">
                        {selectedTaskForDetail.assignedBy?.userName}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedTaskForDetail.description && (
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Description
                    </h3>
                    <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-700 leading-relaxed">
                        {selectedTaskForDetail.description}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTaskForDetail.attachments &&
                  selectedTaskForDetail.attachments.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Paperclip size={14} />
                        Attachments ({selectedTaskForDetail.attachments.length})
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedTaskForDetail.attachments.map(
                          (attachment, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleDownload(attachment)}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 transition-all group cursor-pointer"
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "#fecaca";
                                e.currentTarget.style.backgroundColor =
                                  "#fef2f2";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "#e5e7eb";
                                e.currentTarget.style.backgroundColor =
                                  "#f9fafb";
                              }}
                            >
                              {attachment.type?.startsWith("image/") ? (
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <Image size={18} className="text-blue-600" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <FileIcon
                                    size={18}
                                    className="text-gray-600"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 truncate">
                                  {attachment.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {formatFileSize(attachment.size)}
                                </p>
                              </div>
                              <Download
                                size={16}
                                className="text-gray-400 group-hover:text-red-500 transition-colors"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {isTaskAssignee(selectedTaskForDetail) &&
                  selectedTaskForDetail.status !== "completed" && (
                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex gap-3">
                        {selectedTaskForDetail.status === "pending" && (
                          <button
                            onClick={() =>
                              updateTaskStatus(
                                selectedTaskForDetail._id,
                                "in-progress",
                              )
                            }
                            className="flex-1 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                            style={{
                              background:
                                "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";
                            }}
                          >
                            Start Progress
                          </button>
                        )}
                        {selectedTaskForDetail.status === "in-progress" && (
                          <button
                            onClick={() =>
                              updateTaskStatus(
                                selectedTaskForDetail._id,
                                "completed",
                              )
                            }
                            className="flex-1 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                            style={{
                              background:
                                "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";
                            }}
                          >
                            Mark as Completed
                          </button>
                        )}
                        <button
                          onClick={() =>
                            deleteTask(
                              selectedTaskForDetail._id,
                              activeTab === "My Tasks"
                                ? "myTasks"
                                : "assignedTasks",
                            )
                          }
                          className="px-6 py-3 border-2 rounded-xl font-semibold transition-all"
                          style={{ borderColor: "#fecaca", color: "#dc2626" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#fef2f2";
                            e.currentTarget.style.borderColor = "#fca5a5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                            e.currentTarget.style.borderColor = "#fecaca";
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                {selectedTaskForDetail.status === "completed" && (
                  <div className="pt-6 border-t border-gray-200">
                    <div
                      className="p-4 rounded-xl text-center border"
                      style={{
                        backgroundColor: "#dcfce7",
                        borderColor: "#bbf7d0",
                      }}
                    >
                      <CheckCircle
                        size={20}
                        className="text-green-600 mx-auto mb-2"
                      />
                      <p className="text-sm font-medium text-green-700">
                        This task has been completed
                      </p>
                      {selectedTaskForDetail.completedAt && (
                        <p className="text-xs text-green-600 mt-1">
                          Completed on{" "}
                          {new Date(
                            selectedTaskForDetail.completedAt,
                          ).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="flex-1 flex items-start justify-center pt-20 overflow-y-auto">
            <div className="text-center max-w-lg p-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background:
                    "linear-gradient(135deg, #fecaca 0%, #fee2e2 100%)",
                }}
              >
                {activeTab === "My Tasks" ? (
                  <Sparkles size={40} style={{ color: "#dc2626" }} />
                ) : (
                  <BriefcaseIcon size={40} style={{ color: "#dc2626" }} />
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {activeTab === "My Tasks"
                  ? "Your Task Dashboard"
                  : "Task Assignment"}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {activeTab === "My Tasks"
                  ? "Select any task from the left panel to view details and update progress"
                  : activeTab === "Assigned Tasks"
                    ? selectedDepartment
                      ? "Fill out the form below to assign a new task to your team member"
                      : "Please select a department from the left panel to start assigning tasks"
                    : ""}
              </p>

              {activeTab === "Assigned Tasks" && selectedDepartment && (
                <div className="mt-2 p-6 bg-white border border-gray-200 rounded-2xl shadow-lg text-left max-h-[55vh] overflow-y-auto">
                  <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "#fee2e2" }}
                    >
                      <Plus size={14} style={{ color: "#dc2626" }} />
                    </div>
                    Assign to {selectedDepartment}
                  </h3>

                  <div className="space-y-3">
                    {/* Team Assignment Toggle */}
                    <div
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ backgroundColor: "#f8fafc" }}
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Assign to entire team
                        </p>
                        <p className="text-xs text-gray-500">
                          Task will be assigned to all{" "}
                          {getDepartmentUsers().length} members
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAssignToTeam(!assignToTeam);
                          if (!assignToTeam) setSelectedAssignee("");
                        }}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 shadow-sm"
                        style={{
                          backgroundColor: assignToTeam ? "#dc2626" : "#9ca3af",
                        }}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                            assignToTeam ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Individual Assignment */}
                    {!assignToTeam && (
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">
                          Assign To
                        </label>
                        <select
                          value={selectedAssignee}
                          onChange={(e) => setSelectedAssignee(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2 outline-none bg-white focus:ring-2 focus:ring-red-100"
                          style={{ focusBorderColor: "#dc2626" }}
                        >
                          <option value="">— Select team member —</option>
                          {getDepartmentUsers().map((user) => (
                            <option key={user.userId} value={user.name}>
                              {user.name} {user.role ? `(${user.role})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Team assignment info */}
                    {assignToTeam && (
                      <div
                        className="p-3 rounded-xl border"
                        style={{
                          backgroundColor: "#dcfce7",
                          borderColor: "#bbf7d0",
                        }}
                      >
                        <p className="text-sm" style={{ color: "#166534" }}>
                          📋 Task will be assigned to all{" "}
                          <strong>{getDepartmentUsers().length}</strong> team
                          member(s) in {selectedDepartment}
                        </p>
                      </div>
                    )}

                    {/* Task Title */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">
                        Task Title
                      </label>
                      <input
                        type="text"
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="Enter task title..."
                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-red-100"
                        style={{ focusBorderColor: "#dc2626" }}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">
                        Description (Optional)
                      </label>
                      <textarea
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        placeholder="Enter task description..."
                        rows="2"
                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2 outline-none resize-none focus:ring-2 focus:ring-red-100"
                        style={{ focusBorderColor: "#dc2626" }}
                      />
                    </div>

                    {/* Due Date and Priority */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-red-100"
                          style={{ focusBorderColor: "#dc2626" }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1 block">
                          Priority
                        </label>
                        <div className="flex gap-1.5">
                          {["high", "medium", "low"].map((p) => (
                            <button
                              key={p}
                              onClick={() => setNewPriority(p)}
                              className="flex-1 text-xs py-1.5 rounded-lg capitalize font-medium transition-all"
                              style={
                                newPriority === p
                                  ? {
                                      backgroundColor: priorityColors[p].bg,
                                      color: priorityColors[p].text,
                                      border: `1px solid ${priorityColors[p].border}`,
                                    }
                                  : {
                                      backgroundColor: "#f8fafc",
                                      color: "#475569",
                                      border: "1px solid #e2e8f0",
                                    }
                              }
                              onMouseEnter={(e) => {
                                if (newPriority !== p) {
                                  e.currentTarget.style.backgroundColor =
                                    "#f1f5f9";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (newPriority !== p) {
                                  e.currentTarget.style.backgroundColor =
                                    "#f8fafc";
                                }
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Attachments */}
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 mb-2">
                        <Paperclip size={12} />
                        <span>Attachments</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors disabled:opacity-50"
                          style={{
                            backgroundColor: "#f1f5f9",
                            color: "#334155",
                          }}
                          onMouseEnter={(e) => {
                            if (!uploading)
                              e.currentTarget.style.backgroundColor = "#e2e8f0";
                          }}
                          onMouseLeave={(e) => {
                            if (!uploading)
                              e.currentTarget.style.backgroundColor = "#f1f5f9";
                          }}
                        >
                          {uploading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Paperclip size={12} />
                          )}
                          Upload Files
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,application/pdf,.csv,.xlsx,.xls,.doc,.docx,.txt"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <span className="text-xs text-gray-400">
                          Max 10MB per file
                        </span>
                      </div>

                      {attachments.length > 0 && (
                        <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto">
                          {attachments.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-1.5 rounded-lg"
                              style={{ backgroundColor: "#f8fafc" }}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {file.type?.startsWith("image/") ? (
                                  <Image
                                    size={12}
                                    className="text-blue-500 flex-shrink-0"
                                  />
                                ) : (
                                  <FileText
                                    size={12}
                                    className="text-gray-500 flex-shrink-0"
                                  />
                                )}
                                <span className="text-xs text-gray-600 truncate">
                                  {file.name}
                                </span>
                              </div>
                              <button
                                onClick={() => removeAttachment(idx)}
                                className="text-gray-400 hover:text-red-500 flex-shrink-0"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Button - With inline red gradient */}
                    <button
                      onClick={addTask}
                      disabled={uploading}
                      className="w-full text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background:
                          "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
                      }}
                      onMouseEnter={(e) => {
                        if (!uploading) {
                          e.currentTarget.style.background =
                            "linear-gradient(135deg, #b91c1c 0%, #991b1b 100%)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!uploading) {
                          e.currentTarget.style.background =
                            "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)";
                        }
                      }}
                    >
                      {uploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : assignToTeam ? (
                        `Assign to Team (${getDepartmentUsers().length} members)`
                      ) : (
                        "Assign Task"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "Assigned Tasks" && !selectedDepartment && (
                <div
                  className="mt-4 p-4 rounded-xl border"
                  style={{ backgroundColor: "#fef3c7", borderColor: "#fde68a" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#fde68a" }}
                    >
                      <Building2 size={16} style={{ color: "#92400e" }} />
                    </div>
                    <div className="text-left">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "#92400e" }}
                      >
                        No Department Selected
                      </p>
                      <p className="text-xs" style={{ color: "#b45309" }}>
                        Please select a department from the left panel to assign
                        tasks
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
