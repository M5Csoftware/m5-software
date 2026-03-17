"use client";
import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import Image from "next/image";
import ApiManagementTable from "./ApiManagementTable";
import { GlobalContext } from "@/app/lib/GlobalContext";
import * as XLSX from "xlsx";

function ApiManagement({ setShowApiUserForm, onEditApiUser }) {
    const [apiUsers, setApiUsers] = useState([]);
    const [filteredApiUsers, setFilteredApiUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
    const [lineLeft, setLineLeft] = useState(0);
    const [lineWidth, setLineWidth] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    
    // Modal states
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [modalData, setModalData] = useState({
        title: "",
        message: "",
        type: "", // success, warning, error
        userData: null,
        emailSent: false,
        apiKey: ""
    });

    const lineRef = useRef(null);
    const ulRef = useRef(null);

    const { server } = useContext(GlobalContext);

    const statusMap = {
        All: null,
        Active: "active",
        "De-activated": "deactivated",
        Approved: "approved",
        "Non-Approved": "non-approved",
        Pending: "pending",
    };

    const statuses = Object.keys(statusMap);

    // ============================
    // Fetch API Users
    // ============================
    const fetchApiUsers = async () => {
        try {
            const response = await axios.get(`${server}/api-request`);
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];

            const formatted = data.map((item) => ({
                id: item._id,
                customerName: item.customerName,
                email: item.email,
                contact: item.phone,
                branch: item.branch,
                apiUseCase: item.apiUseCase,
                appliedOn: item.createdAt,
                status: item.Status,
                apiKey: item.apiKey,
                customerCode: item.customerCode,
            }));

            setApiUsers(formatted);
        } catch (error) {
            console.error("Error fetching API users:", error);
            showModal("Error", `Failed to fetch API users: ${error.message}`, "error");
        }
    };

    useEffect(() => {
        fetchApiUsers();
    }, [refreshTrigger]);

    // ============================
    // Modal Functions
    // ============================
    const showModal = (title, message, type, userData = null, emailSent = false, apiKey = "") => {
        setModalData({
            title,
            message,
            type,
            userData,
            emailSent,
            apiKey
        });
        setShowSuccessModal(true);
    };

    const closeModal = () => {
        setShowSuccessModal(false);
        setModalData({
            title: "",
            message: "",
            type: "",
            userData: null,
            emailSent: false,
            apiKey: ""
        });
    };

    // Close modal on Escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && showSuccessModal) {
                closeModal();
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [showSuccessModal]);

    // ============================
    // Status tab underline
    // ============================
    useEffect(() => {
        const selectedElement = ulRef.current?.querySelector(
            `li[data-status="${selectedStatus}"]`
        );
        if (selectedElement && lineRef.current) {
            const ulElement = selectedElement.parentElement;
            setLineWidth(selectedElement.offsetWidth);
            setLineLeft(selectedElement.offsetLeft - ulElement.offsetLeft);
        }
    }, [selectedStatus]);

    // ============================
    // Sorting
    // ============================
    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedUsers = [...filteredApiUsers].sort((a, b) => {
            if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
            if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
            return 0;
        });

        setFilteredApiUsers(sortedUsers);
    };

    // ============================
    // Download Excel
    // ============================
    const handleDownloadExcel = () => {
        if (filteredApiUsers.length === 0) {
            showModal("No Data", "There is no data to export.", "warning");
            return;
        }

        const columns = [
            { key: "customerName", label: "Customer Name" },
            { key: "contact", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "branch", label: "Branch" },
            { key: "apiUseCase", label: "Use Case" },
            { key: "appliedOn", label: "Applied On" },
            { key: "status", label: "Status" },
            { key: "apiKey", label: "API Key" },
        ];

        const exportData = filteredApiUsers.map((user) => {
            const row = {};
            columns.forEach((col) => {
                let value = user[col.key];
                
                if (col.key === "apiUseCase") {
                    if (Array.isArray(value)) {
                        value = value.join(", ");
                    } else if (typeof value === 'string') {
                        // Keep as is
                    } else if (value === null || value === undefined) {
                        value = "";
                    }
                }
                
                row[col.label] = value || "";
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "API Users");
        XLSX.writeFile(wb, `api_users_${new Date().toISOString().split("T")[0]}.xlsx`);
        
        showModal("Download Complete", "API users data has been exported successfully.", "success");
    };

    // ============================
    // Filter: status + search
    // ============================
    useEffect(() => {
        let filtered = [...apiUsers];

        if (selectedStatus !== "All") {
            const statusKey = statusMap[selectedStatus];
            filtered = filtered.filter((user) => user.status === statusKey);
        }

        if (searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter((user) => {
                const name = (user.customerName || "").toLowerCase();
                const email = (user.email || "").toLowerCase();
                const contact = (user.contact || "").toLowerCase();
                return name.includes(q) || email.includes(q) || contact.includes(q);
            });
        }

        setFilteredApiUsers(filtered);
    }, [apiUsers, selectedStatus, searchQuery]);

    // ============================
    // Actions (approve, reject, etc.)
    // ============================
    const handleApiUserAction = async (action, userData) => {
        const id = userData.id;

        // view / edit are handled locally
        if (action === "view") {
            // console.log("View user:", userData);
            return;
        }
        if (action === "edit") {
            onEditApiUser && onEditApiUser(userData);
            return;
        }

        try {
            if (action === "approve") {
                const response = await axios.patch(`${server}/api-request/approve?id=${id}`);
                
                if (response.data.emailSent) {
                    showModal(
                        "Approval Successful!",
                        `API request has been approved and an email has been sent to ${userData.email} with the API key.`,
                        "success",
                        userData,
                        true,
                        response.data.data?.apiKey
                    );
                } else {
                    showModal(
                        "Approval Successful - Email Failed",
                        `API request approved but email notification failed to send to ${userData.email}. Please notify the user manually.`,
                        "warning",
                        userData,
                        false,
                        response.data.data?.apiKey
                    );
                }
            }

            if (action === "reject") {
                await axios.put(`${server}/api-request?id=${id}`, {
                    Status: "non-approved",
                    apiKey: "",
                });
                showModal(
                    "Request Rejected",
                    `API request has been rejected for ${userData.customerName}.`,
                    "error",
                    userData
                );
            }

            if (action === "activate") {
                await axios.put(`${server}/api-request?id=${id}`, {
                    Status: "active",
                });
                showModal(
                    "API Access Activated",
                    `API access has been activated for ${userData.customerName}.`,
                    "success",
                    userData
                );
            }

            if (action === "deactivate") {
                await axios.put(`${server}/api-request?id=${id}`, {
                    Status: "deactivated",
                });
                showModal(
                    "API Access Deactivated",
                    `API access has been deactivated for ${userData.customerName}.`,
                    "warning",
                    userData
                );
            }

            if (action === "regenerate") {
                const newApiKey = Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
                
                await axios.put(`${server}/api-request?id=${id}`, {
                    apiKey: newApiKey.toUpperCase(),
                });
                
                showModal(
                    "API Key Regenerated",
                    `API key has been regenerated for ${userData.customerName}.`,
                    "success",
                    userData,
                    false,
                    newApiKey.toUpperCase()
                );
            }

            if (action === "delete") {
                await axios.delete(`${server}/api-request?id=${id}`);
                showModal(
                    "User Deleted",
                    `API user ${userData.customerName} has been deleted.`,
                    "error",
                    userData
                );
            }

            setRefreshTrigger((prev) => prev + 1);
        } catch (error) {
            console.error("API action error:", error);
            
            let errorMessage = "An unknown error occurred.";
            if (error.response) {
                errorMessage = error.response.data.error || "Server error";
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showModal(
                "Action Failed",
                `Failed to ${action} user: ${errorMessage}`,
                "error",
                userData
            );
        }
    };

    // ============================
    // Modal Component
    // ============================
    const SuccessModal = () => {
        if (!showSuccessModal) return null;

        const getIcon = () => {
            switch (modalData.type) {
                case "success":
                    return (
                        <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    );
                case "warning":
                    return (
                        <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-yellow-100">
                            <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    );
                case "error":
                    return (
                        <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    );
                default:
                    return null;
            }
        };

        const getTitleColor = () => {
            switch (modalData.type) {
                case "success": return "text-green-600";
                case "warning": return "text-yellow-600";
                case "error": return "text-red-600";
                default: return "text-gray-600";
            }
        };

        const handleCopyApiKey = () => {
            if (modalData.apiKey) {
                navigator.clipboard.writeText(modalData.apiKey);
                // You could add a toast notification here
                alert("API Key copied to clipboard!");
            }
        };

        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
                
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                    <div className="relative transform overflow-hidden rounded-2xl bg-white px-8 pb-8 pt-10 text-left shadow-xl transition-all w-full max-w-lg">
                        <div className="flex flex-col items-center">
                            {getIcon()}
                            
                            <div className="mt-6 text-center w-full">
                                <h3 className={`text-lg font-semibold leading-6 ${getTitleColor()} mb-2`}>
                                    {modalData.title}
                                </h3>
                                
                                <div className="text-sm text-gray-600 mb-6 space-y-3">
                                    <p>{modalData.message}</p>
                                    
                                    {modalData.userData && (
                                        <div className="bg-gray-50 rounded-lg p-4 mt-3">
                                            <div className="grid grid-cols-2 gap-2 text-left">
                                                <div>
                                                    <span className="text-xs text-gray-500">Customer:</span>
                                                    <p className="font-medium">{modalData.userData.customerName}</p>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-gray-500">Email:</span>
                                                    <p className="font-medium truncate">{modalData.userData.email}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <span className="text-xs text-gray-500">Status:</span>
                                                    <p className="font-medium capitalize">{modalData.userData.status || "updated"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {modalData.apiKey && (
                                        <div className="mt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-medium text-gray-700">API Key:</span>
                                                <button
                                                    onClick={handleCopyApiKey}
                                                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    Copy Key
                                                </button>
                                            </div>
                                            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all">
                                                {modalData.apiKey}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {modalData.emailSent === false && modalData.userData && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <p className="text-xs text-yellow-800">
                                                <strong>Note:</strong> Email notification was not sent. Please contact the user directly.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="w-full mt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="inline-flex w-full justify-center rounded-lg bg-[#EA1B40] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================
    // RENDER
    // ============================
    return (
        <>
            <div className="flex flex-col gap-8">
                {/* Header */}
                <div className="flex justify-between">
                    <div>
                        <h1 className="text-[24px] font-bold">API Management</h1>
                        <p className="text-sm font-sans text-[#979797]">
                            Manage all API users and their accounts here.
                        </p>
                    </div>
                    <div className="flex items-center gap-5 font-sans font-bold">
                        <button
                            className="px-4 py-3 bg-[#EA1B40] text-white rounded flex gap-2"
                            onClick={() => setShowApiUserForm(true)}
                        >
                            <Image src="/plus.svg" alt="Add API User" width={16} height={16} />
                            Add API User
                        </button>
                    </div>
                </div>

                {/* Status Tabs */}
                <div>
                    <ul
                        className="status-tabs list-none flex gap-6 font-sans font-semibold px-2"
                        ref={ulRef}
                    >
                        {statuses.map((status) => (
                            <li
                                key={status}
                                data-status={status}
                                style={{
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    color: selectedStatus === status ? "black" : "inherit",
                                }}
                                onClick={() => setSelectedStatus(status)}
                            >
                                {status}
                            </li>
                        ))}
                    </ul>
                    <div className="relative mt-1">
                        <div
                            ref={lineRef}
                            className="transition-all duration-400 rounded-t-lg absolute bottom-[1px] bg-[#EA1B40]"
                            style={{ width: lineWidth, height: "3px", left: lineLeft }}
                        ></div>
                    </div>

                    {/* Table + controls */}
                    <div className="bg-gray-100 border-gray-200 rounded-lg shadow-sm">
                        <div className="flex justify-between p-3">
                            {/* Search */}
                            <div className="border rounded-md overflow-hidden font-sans bg-white border-french-gray flex items-center gap-4 pl-6 text-sm">
                                <Image alt="search" src="/search.svg" width={18} height={18} />
                                <input
                                    className="outline-none h-9 pr-4 placeholder:font-semibold w-full"
                                    type="search"
                                    placeholder="Search customer"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Download */}
                            <div className="flex items-center gap-2">
                                <button
                                    className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD] px-4 py-[9px] hover:bg-gray-50 transition-colors relative"
                                    onClick={handleDownloadExcel}
                                >
                                    <Image
                                        src="/Download-gray.svg"
                                        alt="download"
                                        width={20}
                                        height={20}
                                    />
                                    <span className="font-sans text-gray-500 font-semibold">
                                        Download
                                    </span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Pass apiUsers with correct property name */}
                        <ApiManagementTable
                            apiUsers={filteredApiUsers}
                            onSort={handleSort}
                            sortConfig={sortConfig}
                            onApiUserAction={handleApiUserAction}
                        />

                        {filteredApiUsers.length === 0 && (
                            <div className="p-4 text-center text-gray-500">
                                No API users found.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            <SuccessModal />
        </>
    );
}

export default ApiManagement;