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
            // backend currently returns: { data: [...] }
            const data = Array.isArray(response.data)
                ? response.data
                : response.data?.data || [];

            const formatted = data.map((item) => ({
                id: item._id,
                customerName: item.customerName,
                email: item.email,
                contact: item.phone,
                branch: item.branch,
                useCase: item.apiUseCase,
                appliedOn: item.createdAt,
                status: item.Status,
                apiKey: item.apiKey,
                customerCode: item.customerCode,
            }));

            setApiUsers(formatted);
        } catch (error) {
            console.error("Error fetching API users:", error);
        }
    };

    useEffect(() => {
        fetchApiUsers();
    }, [refreshTrigger]);

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
            alert("No data to export");
            return;
        }

        const columns = [
            { key: "customerName", label: "Customer Name" },
            { key: "contact", label: "Contact" },
            { key: "email", label: "Email" },
            { key: "branch", label: "Branch" },
            { key: "useCase", label: "Use Case" },
            { key: "appliedOn", label: "Applied On" },
            { key: "status", label: "Status" },
            { key: "apiKey", label: "API Key" },
        ];

        const exportData = filteredApiUsers.map((user) => {
            const row = {};
            columns.forEach((col) => {
                row[col.label] = user[col.key] || "";
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "API Users");
        XLSX.writeFile(wb, `api_users_${new Date().toISOString().split("T")[0]}.xlsx`);
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
            console.log("View user:", userData);
            return;
        }
        if (action === "edit") {
            onEditApiUser && onEditApiUser(userData);
            return;
        }

        try {
            if (action === "approve") {
                await axios.patch(`${server}/api-request/approve?id=${id}`);
            }

            if (action === "reject") {
                await axios.put(`${server}/api-request?id=${id}`, {
                    Status: "non-approved",
                    apiKey: "",
                });
            }

            if (action === "activate") {
                await axios.put(`${server}/api-request?id=${id}`, {
                    Status: "active",
                });
            }

            if (action === "deactivate") {
                await axios.put(`${server}/api-request?id=${id}`, {
                    Status: "deactivated",
                });
            }

            if (action === "regenerate") {
                const newApiKey =
                    Date.now().toString(36) + Math.random().toString(36).substring(2, 15);

                await axios.put(`${server}/api-request?id=${id}`, {
                    apiKey: newApiKey.toUpperCase(),
                });
            }

            if (action === "delete") {
                await axios.delete(`${server}/api-request?id=${id}`);
            }

            setRefreshTrigger((prev) => prev + 1);
        } catch (error) {
            console.error("API action error:", error);
        }
    };

    // ============================
    // RENDER
    // ============================
    return (
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
    );
}

export default ApiManagement;
