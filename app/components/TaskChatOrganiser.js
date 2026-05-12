"use client";
import { useState, useRef, useEffect, useContext } from "react";
import {
  Send,
  Paperclip,
  Image,
  FileText,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Briefcase,
  Headphones,
  CreditCard,
  DollarSign,
  RefreshCw,
  PhoneCall,
  BarChart3,
  Settings,
  MoreVertical,
  Calendar,
  MessageSquare,
  Download,
  Trash2,
  Plus,
  Bell,
  Eye,
  Edit2,
  Filter,
  Search,
} from "lucide-react";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useAuth } from "@/app/Context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

const priorityColors = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const TABS = ["My Tasks", "Assigned Tasks", "Chats"];

const getDepartmentColor = (deptName) => {
  const colorMap = {
    Sales: "bg-blue-500",
    Operations: "bg-purple-500",
    "Customer Support": "bg-green-500",
    Account: "bg-cyan-500",
    Billing: "bg-orange-500",
    Collection: "bg-red-500",
    Counterpart: "bg-pink-500",
    "Sale Support": "bg-indigo-500",
    Management: "bg-gray-700",
  };
  return colorMap[deptName] || "bg-gray-500";
};

const getDepartmentTextColor = (deptName) => {
  const colorMap = {
    Sales: "text-blue-600",
    Operations: "text-purple-600",
    "Customer Support": "text-green-600",
    Account: "text-cyan-600",
    Billing: "text-orange-600",
    Collection: "text-red-600",
    Counterpart: "text-pink-600",
    "Sale Support": "text-indigo-600",
    Management: "text-gray-700",
  };
  return colorMap[deptName] || "text-gray-600";
};

const getDepartmentBgLight = (deptName) => {
  const colorMap = {
    Sales: "bg-blue-50",
    Operations: "bg-purple-50",
    "Customer Support": "bg-green-50",
    Account: "bg-cyan-50",
    Billing: "bg-orange-50",
    Collection: "bg-red-50",
    Counterpart: "bg-pink-50",
    "Sale Support": "bg-indigo-50",
    Management: "bg-gray-100",
  };
  return colorMap[deptName] || "bg-gray-50";
};

export default function TaskChatOrganiser() {
  const { server } = useContext(GlobalContext);
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("My Tasks");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [messages, setMessages] = useState({});
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
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

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

  const toggleTask = async (taskId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await axios.put(`${server}/tasks?id=${taskId}`, {
        status: newStatus ? "completed" : "pending",
      });
      fetchMyTasks();
      toast.success(`Task marked as ${newStatus ? "completed" : "pending"}`);
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  const deleteTask = async (taskId, type) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`${server}/tasks?id=${taskId}`);
        if (type === "myTasks") fetchMyTasks();
        else fetchAssignedTasks();
        toast.success("Task deleted successfully");
      } catch (error) {
        toast.error("Failed to delete task");
      }
    }
  };

  const addTask = async () => {
    if (!newTask.trim() || !selectedAssignee) {
      toast.error("Please fill in all required fields");
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
        priority: newPriority,
        dueDate: taskDueDate || new Date().toISOString().split("T")[0],
        assignedToUserId: assigneeUser.userId,
        assignedToUserName: assigneeUser.name,
        assignedToDepartment: selectedDepartment,
        assignedByUserId: currentUserId,
        assignedByUserName: currentUserName,
        assignedByDepartment: currentDepartment,
      });

      toast.success("Task assigned successfully!");
      setNewTask("");
      setSelectedAssignee("");
      setTaskDueDate("");
      fetchAssignedTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to assign task");
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await axios.put(`${server}/tasks?id=${taskId}`, { status: newStatus });
      fetchAssignedTasks();
      toast.success(`Task status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update task status");
    }
  };

  const markTaskAsRead = async (taskId) => {
    try {
      await axios.put(`${server}/tasks/read?id=${taskId}`);
      fetchMyTasks();
    } catch (error) {
      console.error("Error marking task as read:", error);
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

  const filteredAssignedTasks = tasks.assignedTasks.filter((task) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "in-progress":
        return "text-blue-600 bg-blue-50";
      case "completed":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return { icon: Clock, text: "Pending" };
      case "in-progress":
        return { icon: RefreshCw, text: "In Progress" };
      case "completed":
        return { icon: CheckCircle, text: "Completed" };
      default:
        return { icon: AlertCircle, text: status };
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Left Panel */}
      <div className="w-80 bg-white shadow-xl flex flex-col flex-shrink-0 border-r border-gray-200 overflow-hidden">
        {/* Header */}
        <div
          className="px-5 py-5 border-b text-white"
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            borderBottomColor: "rgba(255,255,255,0.1)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">Task & Chat Organizer</h1>
              <p className="text-xs text-red-100 mt-1">
                {pendingTasks} pending · {stats.inProgress} in progress ·{" "}
                {totalUnread} unread
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="p-1.5 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Department Selector */}
        <div className="px-3 py-3 border-b bg-gray-50">
          <label className="text-xs font-semibold text-gray-600 mb-2 block">
            Select Department
          </label>
          <select
            value={selectedDepartment}
            onChange={(e) => {
              setSelectedDepartment(e.target.value);
              setSelectedAssignee("");
              setSelectedUser(null);
            }}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-red-400 bg-white"
          >
            <option value="">— Select a department —</option>
            {departmentList.map((dept) => {
              const userCount = employeesByDept[dept]?.length || 0;
              return (
                <option key={dept} value={dept}>
                  {dept} ({userCount} {userCount === 1 ? "member" : "members"})
                </option>
              );
            })}
          </select>

          {selectedDepartment && getDepartmentUsers().length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Team Members:</p>
              <div className="flex flex-wrap gap-2">
                {getDepartmentUsers()
                  .slice(0, 5)
                  .map((user) => (
                    <div
                      key={user.userId}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer hover:shadow-sm transition-all ${getDepartmentBgLight(selectedDepartment)}`}
                      onClick={() => {
                        setSelectedUser(user);
                        setActiveTab("Chats");
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-red-600">
                          {user.avatar}
                        </span>
                      </div>
                      <span className="text-xs text-gray-700">{user.name}</span>
                    </div>
                  ))}
                {getDepartmentUsers().length > 5 && (
                  <span className="text-xs text-gray-400">
                    +{getDepartmentUsers().length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex border-b bg-gray-50">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedTaskForDetail(null);
              }}
              className={`flex-1 py-3 text-xs font-semibold transition-all ${
                activeTab === tab
                  ? "text-red-600 border-b-2 border-red-600 bg-white"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab}
              {tab === "My Tasks" && pendingTasks > 0 && (
                <span className="ml-1 bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 text-[10px]">
                  {pendingTasks}
                </span>
              )}
              {tab === "Assigned Tasks" && stats.assigned > 0 && (
                <span className="ml-1 bg-purple-100 text-purple-600 rounded-full px-1.5 py-0.5 text-[10px]">
                  {stats.assigned}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* My Tasks List */}
        {activeTab === "My Tasks" && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 pb-3 border-b">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Task Summary
                </h3>
                <span className="text-xs text-gray-500">
                  {stats.completed}/{tasks.myTasks.length || 0} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{
                    width: `${(stats.completed / (tasks.myTasks.length || 1)) * 100 || 0}%`,
                  }}
                />
              </div>
            </div>

            {tasks.myTasks.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">
                  No tasks assigned to you
                </p>
              </div>
            )}

            {tasks.myTasks.map((task) => {
              const StatusIcon = getStatusBadge(task.status).icon;
              return (
                <div
                  key={task._id}
                  onClick={() => setSelectedTaskForDetail(task)}
                  className={`mb-3 p-3 rounded-xl hover:shadow-md transition-all cursor-pointer ${
                    !task.isRead && task.status !== "completed"
                      ? "bg-red-50 border-l-4 border-l-red-500"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTask(task._id, task.status === "completed");
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="accent-red-600 mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-gray-400" : "text-gray-800"}`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">
                          By: {task.assignedBy?.userName}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{
                              backgroundColor: priorityColors[task.priority],
                            }}
                          />
                          <span className="text-xs capitalize text-gray-500">
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task._id, "myTasks");
                      }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Assigned Tasks List */}
        {activeTab === "Assigned Tasks" && (
          <div className="flex-1 overflow-y-auto p-4">
            {selectedDepartment ? (
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Plus size={16} className="text-purple-600" /> Assign New Task
                  to {selectedDepartment}
                </h3>
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Task description..."
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 outline-none focus:border-purple-400"
                />

                {/* Made wider - full width layout */}
                <div className="flex flex-col gap-3 mb-3">
                  <div className="w-full">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Select Employee
                    </label>
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-purple-400 bg-white"
                    >
                      <option value="">— Select employee —</option>
                      {getDepartmentUsers().map((user) => (
                        <option key={user.userId} value={user.name}>
                          {user.name} {user.role ? `(${user.role})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full">
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                {/* Priority buttons - full width */}
                <div className="flex gap-2 mb-3">
                  {["high", "medium", "low"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`flex-1 text-sm py-2.5 rounded-lg transition capitalize font-medium ${
                        newPriority === p
                          ? "text-white shadow-md"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                      }`}
                      style={
                        newPriority === p
                          ? { backgroundColor: priorityColors[p] }
                          : {}
                      }
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Assign button - full width */}
                <button
                  onClick={addTask}
                  className="w-full bg-purple-600 text-white text-sm py-2.5 rounded-lg font-medium hover:bg-purple-700 transition-all shadow-sm"
                >
                  Assign Task
                </button>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-yellow-50 rounded-xl text-center">
                <p className="text-sm text-yellow-700">
                  Please select a department from the dropdown above to assign
                  tasks.
                </p>
              </div>
            )}

            {/* Filter and Search - Made wider */}
            <div className="mb-4 flex gap-2">
              <div className="flex-1 relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-purple-400"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-purple-400 bg-white min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Task Cards - Better width utilization */}
            {filteredAssignedTasks.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-400">
                  No tasks assigned by you
                </p>
              </div>
            )}

            {filteredAssignedTasks.map((task) => {
              const StatusIcon = getStatusBadge(task.status).icon;
              return (
                <div
                  key={task._id}
                  onClick={() => setSelectedTaskForDetail(task)}
                  className="mb-3 p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all cursor-pointer hover:border-purple-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-semibold text-gray-800 flex-1 line-clamp-2">
                      {task.title}
                    </p>
                    <select
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateTaskStatus(task._id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs px-3 py-1 rounded-full border-0 font-medium ${getStatusColor(task.status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      <span>To: {task.assignedTo?.userName}</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: priorityColors[task.priority],
                          }}
                        />
                        <span className="text-xs capitalize font-medium text-gray-600">
                          {task.priority} priority
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task._id, "assignedTasks");
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Chats List */}
        {activeTab === "Chats" && (
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedDepartment ? (
              <div className="text-center py-12">
                <MessageSquare
                  size={48}
                  className="mx-auto text-gray-300 mb-3"
                />
                <p className="text-sm text-gray-400">
                  Please select a department from the dropdown above
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {selectedDepartment} Team Members
                </h3>
                <div className="space-y-2">
                  {getDepartmentUsers().map((user) => (
                    <div
                      key={user.userId}
                      onClick={() => setSelectedUser(user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedUser?.userId === user.userId
                          ? "bg-red-50 border-l-4 border-l-red-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-red-600">
                            {user.avatar}
                          </span>
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Task Detail View */}
      {activeTab !== "Chats" && (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {selectedTaskForDetail ? (
            <div className="h-full flex flex-col">
              {/* Task Detail Header */}
              <div className="px-6 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedTaskForDetail(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={20} />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Task Details
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full capitalize ${getStatusColor(selectedTaskForDetail.status)}`}
                    >
                      {selectedTaskForDetail.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Task Detail Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto">
                  {/* Title Section */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {selectedTaskForDetail.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>
                        Task ID: {selectedTaskForDetail._id?.slice(-8)}
                      </span>
                      <span>•</span>
                      <span>
                        Created:{" "}
                        {new Date(
                          selectedTaskForDetail.createdAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Priority and Due Date Cards */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Priority</p>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              priorityColors[selectedTaskForDetail.priority],
                          }}
                        />
                        <span className="text-lg font-semibold capitalize text-gray-800">
                          {selectedTaskForDetail.priority}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Due Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-gray-500" />
                        <span className="text-lg font-semibold text-gray-800">
                          {new Date(
                            selectedTaskForDetail.dueDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Info */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Assignment Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Assigned To:
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {selectedTaskForDetail.assignedTo?.userName || "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Department:
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {selectedTaskForDetail.assignedTo?.department ||
                            "N/A"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Assigned By:
                        </span>
                        <span className="text-sm font-medium text-gray-800">
                          {selectedTaskForDetail.assignedBy?.userName || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedTaskForDetail.description && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {selectedTaskForDetail.description}
                      </p>
                    </div>
                  )}

                  {/* Comments Section */}
                  {selectedTaskForDetail.comments &&
                    selectedTaskForDetail.comments.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          Comments
                        </h4>
                        <div className="space-y-3">
                          {selectedTaskForDetail.comments.map(
                            (comment, idx) => (
                              <div
                                key={idx}
                                className="p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-700">
                                    {comment.userName}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(
                                      comment.createdAt,
                                    ).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {comment.text}
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    {selectedTaskForDetail.status !== "completed" && (
                      <button
                        onClick={() => {
                          updateTaskStatus(
                            selectedTaskForDetail._id,
                            "completed",
                          );
                          setSelectedTaskForDetail(null);
                        }}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {selectedTaskForDetail.status === "pending" && (
                      <button
                        onClick={() => {
                          updateTaskStatus(
                            selectedTaskForDetail._id,
                            "in-progress",
                          );
                          setSelectedTaskForDetail(null);
                        }}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Start Progress
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
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Delete Task
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  {activeTab === "My Tasks" ? (
                    <CheckCircle size={48} className="text-blue-500" />
                  ) : (
                    <Users size={48} className="text-purple-500" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {activeTab === "My Tasks"
                    ? "Your Tasks Dashboard"
                    : "Task Assignment Hub"}
                </h3>
                <p className="text-gray-500 text-sm">
                  {activeTab === "My Tasks"
                    ? "Click on any task to view detailed information"
                    : "Click on any assigned task to view details and track progress"}
                </p>
                {activeTab === "Assigned Tasks" &&
                  tasks.assignedTasks.length > 0 && (
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-purple-600">
                        💡 Tip: Click on any task card to see full details
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Window */}
      {activeTab === "Chats" && selectedUser && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-lg font-bold text-red-600">
                    {selectedUser.avatar}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white"></div>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">
                  {selectedUser.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedUser.role} • {selectedUser.department}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">
                Chat feature coming soon with WebSocket integration
              </p>
              <p className="text-xs text-gray-300 mt-2">
                Real-time messaging will be available shortly
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Chats" &&
        !selectedUser &&
        selectedDepartment &&
        getDepartmentUsers().length > 0 && (
          <div className="flex-1 flex flex-col items-center justify-center bg-white text-gray-300">
            <MessageSquare size={48} />
            <p className="mt-3 text-sm">
              Select a team member to start chatting
            </p>
          </div>
        )}
    </div>
  );
}
