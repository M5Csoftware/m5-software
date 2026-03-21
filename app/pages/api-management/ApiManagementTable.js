"use client";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

export default function ApiManagementTable({
    apiUsers,
    onSort,
    sortConfig,
    onApiUserAction,
}) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeMenu, setActiveMenu] = useState(null);
    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] = useState(false);
    const [userToDeactivate, setUserToDeactivate] = useState(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [showUseCasesModal, setShowUseCasesModal] = useState(false);
    const [selectedUserUseCases, setSelectedUserUseCases] = useState([]);
    const [selectedUserName, setSelectedUserName] = useState("");
    const menuRef = useRef(null);

    const toggleSelectAll = () => {
        if (selectedIds.length === apiUsers.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(apiUsers.map((u) => u.id || u._id || u.userId));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const handleMenuAction = (action, user, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        setActiveMenu(null);

        switch (action) {
            case "edit":
                onApiUserAction("edit", user);
                break;
            case "delete":
                setUserToDelete(user);
                setShowConfirmDeleteModal(true);
                break;
            case "view":
                onApiUserAction("view", user);
                break;
            case "deactivate":
                setUserToDeactivate(user);
                setShowConfirmDeactivateModal(true);
                break;
            case "activate":
                onApiUserAction("activate", user);
                break;
            case "regenerate":
                onApiUserAction("regenerate", user);
                break;
            case "approve":
                onApiUserAction("approve", user);
                break;
            case "reject":
                onApiUserAction("reject", user);
                break;
            default:
                break;
        }
    };

    // Helper: normalize apiUseCase to array
    const getUseCases = (user) => {
        let useCaseData = user.apiUseCase;
        if (Array.isArray(useCaseData)) return useCaseData;
        if (typeof useCaseData === "string") {
            try {
                const parsed = JSON.parse(useCaseData);
                if (Array.isArray(parsed)) return parsed;
            } catch {
                if (useCaseData.includes(","))
                    return useCaseData.split(",").map((s) => s.trim()).filter(Boolean);
                return useCaseData.trim() ? [useCaseData.trim()] : [];
            }
        }
        return [];
    };

    const showAllUseCases = (user) => {
        setSelectedUserUseCases(getUseCases(user));
        setSelectedUserName(user.customerName || "Customer");
        setShowUseCasesModal(true);
    };

    const confirmDeactivate = async () => {
        if (userToDeactivate) {
            setIsDeactivating(true);
            try {
                await onApiUserAction("deactivate", userToDeactivate);
                setShowConfirmDeactivateModal(false);
                setUserToDeactivate(null);
            } catch (error) {
                console.error("Failed to deactivate API user:", error);
            } finally {
                setIsDeactivating(false);
            }
        }
    };

    const cancelDeactivate = () => {
        if (!isDeactivating) {
            setShowConfirmDeactivateModal(false);
            setUserToDeactivate(null);
        }
    };

    const handleMenuToggle = (userId, event) => {
        event.preventDefault();
        event.stopPropagation();
        setActiveMenu(activeMenu === userId ? null : userId);
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            setIsDeleting(true);
            try {
                await onApiUserAction("delete", userToDelete);
                setShowConfirmDeleteModal(false);
                setUserToDelete(null);
            } catch (error) {
                console.error("Failed to delete API user:", error);
            } finally {
                setIsDeleting(false);
            }
        }
    };

    const cancelDelete = () => {
        if (!isDeleting) {
            setShowConfirmDeleteModal(false);
            setUserToDelete(null);
        }
    };

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener("mousedown", handler);
        document.addEventListener("touchstart", handler);
        return () => {
            document.removeEventListener("mousedown", handler);
            document.removeEventListener("touchstart", handler);
        };
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                setActiveMenu(null);
                if (showUseCasesModal) setShowUseCasesModal(false);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [showUseCasesModal]);

    const getSortIcon = (key) => {
        if (sortConfig.key === key)
            return sortConfig.direction === "asc" ? "↑" : "↓";
        return "";
    };

    const headers = [
        { key: "customerName", label: "Customer Name", width: "w-[250px]", sortable: true },
        { key: "contact", label: "Contact", width: "w-[150px]", sortable: false },
        { key: "branch", label: "Branch", width: "w-[150px]", sortable: true },
        { key: "useCase", label: "Use Case", width: "w-[200px]", sortable: false },
        { key: "appliedOn", label: "Applied On", width: "w-[150px]", sortable: true },
        { key: "status", label: "Status", width: "w-[150px]", sortable: true },
    ];

    return (
        <>
            <div className="overflow-hidden">
                {/* Header row */}
                <div className="bg-gray-100 border-b border-[#D0D5DD] px-6 py-4">
                    <div className="flex items-center gap-6 text-sm font-semibold text-[#18181B]">
                        <div className="w-[30px]">
                            <input
                                type="checkbox"
                                checked={apiUsers.length > 0 && selectedIds.length === apiUsers.length}
                                onChange={toggleSelectAll}
                                className="accent-[#EA1B40] w-4 h-4"
                            />
                        </div>
                        {headers.map((col) => (
                            <div
                                key={col.key}
                                className={`${col.width} flex items-center gap-1 text-gray-600 font-medium font-sans`}
                            >
                                {col.sortable ? (
                                    <button
                                        onClick={() => onSort(col.key)}
                                        className="hover:text-gray-800 transition-colors"
                                    >
                                        {col.label}
                                    </button>
                                ) : (
                                    <span>{col.label}</span>
                                )}
                                <span className="text-gray-400">{getSortIcon(col.key)}</span>
                            </div>
                        ))}
                        <div className="w-[30px]"></div>
                    </div>
                </div>

                {/* Rows */}
                <div className="min-h-[55vh] bg-white overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hidden-scrollbar">
                    {apiUsers.map((user) => {
                        const userId = user.id || user._id || user.userId;
                        const normalizedStatus = (user.status || user.Status || "").toLowerCase();
                        const useCases = getUseCases(user);

                        return (
                            <div
                                key={userId}
                                className="border-b border-gray-200 px-6 py-4 text-sm text-[#18181B] transition-colors relative bg-white hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-6">
                                    {/* Checkbox */}
                                    <div className="w-[30px]">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(userId)}
                                            onChange={() => toggleSelectOne(userId)}
                                            className="accent-[#EA1B40] w-4 h-4"
                                        />
                                    </div>

                                    {/* Customer Name + Code */}
                                    <div className="w-[250px]">
                                        <div className="text-gray-900 text-sm font-semibold">
                                            {user.customerName || "—"}
                                        </div>
                                        <div className="text-gray-500 truncate text-xs">
                                            {user.customerCode || "—"}
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="w-[150px] text-gray-700 text-sm">
                                        {user.contact || user.phone || "—"}
                                    </div>

                                    {/* Branch */}
                                    <div className="w-[150px] text-gray-700 text-sm">
                                        {user.branch || "—"}
                                    </div>

                                    {/* Use Cases */}
                                    <div className="w-[200px]">
                                        {useCases.length === 0 ? (
                                            <span className="text-gray-400 text-sm">No use case</span>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-700 text-sm truncate" title={useCases[0]}>
                                                    {useCases[0]}
                                                </span>
                                                {useCases.length > 1 && (
                                                    <button
                                                        onClick={() => showAllUseCases(user)}
                                                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline text-left"
                                                        type="button"
                                                    >
                                                        +{useCases.length - 1} more
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Applied On */}
                                    <div className="w-[150px] text-gray-700 text-sm flex items-center">
                                        {new Date(
                                            user.appliedOn || user.createdAt || Date.now()
                                        ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </div>

                                    {/* Status Badge */}
                                    <div className="w-[150px]">
                                        <ApiStatusBadge
                                            status={user.status || user.Status}
                                            user={user}
                                            onAction={(action, u) => handleMenuAction(action, u)}
                                        />
                                    </div>

                                    {/* 3-dot Menu */}
                                    <div className="relative w-[30px]">
                                        <button
                                            onClick={(e) => handleMenuToggle(userId, e)}
                                            className="p-2 hover:bg-gray-200 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300"
                                            aria-label="More options"
                                            type="button"
                                        >
                                            <div className="flex flex-col gap-[2px] items-center justify-center">
                                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                                <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                                            </div>
                                        </button>

                                        {activeMenu === userId && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10 md:hidden"
                                                    onClick={() => setActiveMenu(null)}
                                                />
                                                <div
                                                    ref={menuRef}
                                                    className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2"
                                                    role="menu"
                                                >
                                                    {/* Edit */}
                                                    <button
                                                        onClick={(e) => handleMenuAction("edit", user, e)}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3"
                                                        type="button"
                                                    >
                                                        Edit API user
                                                    </button>

                                                    {/* Approve/Reject for pending */}
                                                    {normalizedStatus === "pending" && (
                                                        <>
                                                            <div className="border-t border-gray-100" />
                                                            <button
                                                                onClick={(e) => handleMenuAction("approve", user, e)}
                                                                className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm text-green-600 flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                ✔ Approve
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleMenuAction("reject", user, e)}
                                                                className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-red-600 flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                ✖ Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    <div className="border-t border-gray-100" />

                                                    {/* Active or Approved → show deactivate + regenerate */}
                                                    {(normalizedStatus === "active" || normalizedStatus === "approved") ? (
                                                        <>
                                                            <button
                                                                onClick={(e) => handleMenuAction("deactivate", user, e)}
                                                                className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-red-500 flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                De-activate API access
                                                            </button>
                                                            <button
                                                                onClick={(e) => handleMenuAction("regenerate", user, e)}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                Regenerate API key
                                                            </button>
                                                        </>
                                                    ) : (
                                                        /* All other statuses → show activate */
                                                        normalizedStatus !== "pending" && (
                                                            <button
                                                                onClick={(e) => handleMenuAction("activate", user, e)}
                                                                className="w-full text-left px-4 py-3 hover:bg-green-50 text-sm text-green-600 flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                Activate API access
                                                            </button>
                                                        )
                                                    )}

                                                    {/* Delete */}
                                                    <div className="border-t border-gray-100" />
                                                    <button
                                                        onClick={(e) => handleMenuAction("delete", user, e)}
                                                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-red-500 flex items-center gap-3"
                                                        type="button"
                                                    >
                                                        Delete API user
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showConfirmDeleteModal && (
                <ConfirmationModal
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                    message={`Are you sure you want to delete ${userToDelete?.customerName || "this API user"}? This action cannot be undone.`}
                    title="Delete API User"
                    confirmText="Delete User"
                    cancelText="Cancel"
                    isLoading={isDeleting}
                />
            )}

            {/* Deactivate Confirmation Modal */}
            {showConfirmDeactivateModal && (
                <ConfirmationModal
                    onConfirm={confirmDeactivate}
                    onCancel={cancelDeactivate}
                    message={`Are you sure you want to deactivate ${userToDeactivate?.customerName || "this API user"}? They won't be able to access the API until reactivated.`}
                    title="Deactivate API Access"
                    confirmText="Deactivate"
                    cancelText="Cancel"
                    isLoading={isDeactivating}
                />
            )}

            {/* Use Cases Modal */}
            {showUseCasesModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                        onClick={() => setShowUseCasesModal(false)}
                    />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div
                            className="relative bg-white rounded-2xl px-6 pb-6 pt-5 shadow-xl w-full max-w-md"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">All Use Cases</h3>
                                <p className="text-sm text-gray-500">{selectedUserName}</p>
                            </div>
                            <div className="border-t border-gray-200 pt-4">
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {selectedUserUseCases.map((useCase, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-semibold">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm text-gray-800">{useCase}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowUseCasesModal(false)}
                                    className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────
// Status Badge  –  distinct styles per status
// ─────────────────────────────────────────────
function ApiStatusBadge({ status, user, onAction }) {
    const normalized = (status || "").toLowerCase();

    // APPROVED  – green
    if (normalized === "approved") {
        return (
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-[#00A86B] text-white text-xs font-semibold whitespace-nowrap">
                Approved
            </span>
        );
    }

    // ACTIVE  – blue (distinct from approved)
    if (normalized === "active") {
        return (
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-[#2563EB] text-white text-xs font-semibold whitespace-nowrap">
                Active
            </span>
        );
    }

    // NON-APPROVED / REJECTED  – red
    if (normalized === "non-approved" || normalized === "rejected") {
        return (
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-[#E50914] text-white text-xs font-semibold whitespace-nowrap">
                Non-Approved
            </span>
        );
    }

    // DEACTIVATED / INACTIVE  – dark gray
    if (normalized === "deactivated" || normalized === "inactive") {
        return (
            <span className="inline-flex items-center justify-center px-3 py-1 rounded-md bg-gray-500 text-white text-xs font-semibold whitespace-nowrap">
                De-activated
            </span>
        );
    }

    // PENDING  – inline approve / reject icons
    return (
        <div className="flex gap-3 items-center">
            <button
                type="button"
                onClick={() => onAction("approve", user)}
                title="Approve"
                className="hover:scale-110 transition-transform"
            >
                <Image src="/right_green.svg" alt="approve" width={26} height={26} />
            </button>
            <button
                type="button"
                onClick={() => onAction("reject", user)}
                title="Reject"
                className="hover:scale-110 transition-transform"
            >
                <Image src="/wrong_red.svg" alt="reject" width={26} height={26} />
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────
// Confirmation Modal
// ─────────────────────────────────────────────
function ConfirmationModal({
    onConfirm,
    onCancel,
    message = "Are you sure you want to proceed?",
    title = "Confirm Action",
    confirmText = "Delete",
    cancelText = "Cancel",
    isLoading = false,
}) {
    const modalRef = useRef(null);
    const cancelButtonRef = useRef(null);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape" && !isLoading) {
                e.preventDefault();
                onCancel();
            }
        };
        document.addEventListener("keydown", handleEscape, { passive: false });
        const timer = setTimeout(() => cancelButtonRef.current?.focus(), 100);
        return () => {
            document.removeEventListener("keydown", handleEscape);
            clearTimeout(timer);
        };
    }, [onCancel, isLoading]);

    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target) && !isLoading) {
            onCancel();
        }
    };

    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = original; };
    }, []);

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={handleBackdropClick}
            />
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    ref={modalRef}
                    className="relative bg-white rounded-2xl px-6 pb-6 pt-5 shadow-xl w-full max-w-lg"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-row-reverse gap-3">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={(e) => { e.preventDefault(); if (!isLoading) onConfirm(); }}
                            className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-red hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px] justify-center"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{confirmText}...</span>
                                </>
                            ) : confirmText}
                        </button>
                        <button
                            ref={cancelButtonRef}
                            type="button"
                            disabled={isLoading}
                            onClick={(e) => { e.preventDefault(); if (!isLoading) onCancel(); }}
                            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}