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
    const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] =
        useState(false);
    const [userToDeactivate, setUserToDeactivate] = useState(null);
    const [isDeactivating, setIsDeactivating] = useState(false);
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

    // Close menu when clicking outside
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

    // Close menu on Escape
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                setActiveMenu(null);
            }
        };
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    const getSortIcon = (key) => {
        if (sortConfig.key === key)
            return sortConfig.direction === "asc" ? "↑" : "↓";
        return "";
    };

    const headers = [
        {
            key: "customerName",
            label: "Customer Name",
            width: "w-[250px]",
            sortable: true,
        },
        {
            key: "contact",
            label: "Contact",
            width: "w-[150px]",
            sortable: false,
        },
        {
            key: "branch",
            label: "Branch",
            width: "w-[150px]",
            sortable: true,
        },
        {
            key: "useCase",
            label: "Use Case",
            width: "w-[200px]",
            sortable: false,
        },
        {
            key: "appliedOn",
            label: "Applied On",
            width: "w-[150px]",
            sortable: true,
        },
        {
            key: "status",
            label: "Status",
            width: "w-[150px]",
            sortable: true,
        },
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
                                checked={
                                    apiUsers.length > 0 && selectedIds.length === apiUsers.length
                                }
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
                        const normalizedStatus = (user.status || "").toLowerCase();

                        return (
                            <div
                                key={userId}
                                className={`border-b border-gray-200 px-6 py-4 text-sm text-[#18181B] transition-colors relative bg-white hover:bg-gray-50`}
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

                                    {/* Customer */}
                                    <div className="w-[250px]">
                                        <div className="text-gray-900 text-sm font-semibold">
                                            {user.customerName || "Customer Name"}
                                        </div>
                                        <div className="text-gray-500 truncate text-xs">
                                            {user.customerCode || "CG***"}
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="w-[150px] text-gray-700 text-sm">
                                        {user.contact || "+91 7458961230"}
                                    </div>

                                    {/* Branch */}
                                    <div className="w-[150px] text-gray-700 text-sm">
                                        {user.branch || "Delhi"}
                                    </div>

                                    {/* Use Case */}
                                    <div className="w-[200px]">
                                        <div className="text-gray-700 text-sm truncate">
                                            {user.useCase || "tilak nagar, new delhi"}
                                        </div>
                                    </div>

                                    {/* Applied On */}
                                    <div className="w-[150px] text-gray-700 text-xs">
                                        {user.appliedOn
                                            ? new Date(user.appliedOn).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                            : new Date(
                                                user.createdAt || Date.now()
                                            ).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                    </div>

                                    {/* Status */}
                                    <div className="w-[150px]">
                                        <ApiStatusBadge
                                            status={user.status}
                                            user={user}
                                            onAction={(action, user) => handleMenuAction(action, user)}
                                        />

                                    </div>

                                    {/* Menu */}
                                    <div className="relative w-[30px]">
                                        <button
                                            onClick={(e) => handleMenuToggle(userId, e)}
                                            className="p-2 hover:bg-gray-200 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-gray-200"
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
                                                ></div>

                                                <div
                                                    ref={menuRef}
                                                    className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2"
                                                    role="menu"
                                                    aria-orientation="vertical"
                                                >
                                                    {/* View */}
                                                    {/* <button
                                                        onClick={(e) =>
                                                            handleMenuAction("view", user, e)
                                                        }
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3"
                                                        type="button"
                                                    >
                                                        <span>View details</span>
                                                    </button> */}

                                                    {/* Edit */}
                                                    <button
                                                        onClick={(e) =>
                                                            handleMenuAction("edit", user, e)
                                                        }
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3"
                                                        type="button"
                                                    >
                                                        <span>Edit API user</span>
                                                    </button>


                                                    {/* Approve / Reject only if pending */}
                                                    {normalizedStatus === "pending" && (
                                                        <>
                                                            <div className="border-t border-gray-100"></div>
                                                            <button
                                                                onClick={(e) =>
                                                                    handleMenuAction("approve", user, e)
                                                                }
                                                                className="w-full text-left px-4 py-3 hover:bg-green-100 text-sm text-green-600 flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                ✔ Approve
                                                            </button>
                                                            <button
                                                                onClick={(e) =>
                                                                    handleMenuAction("reject", user, e)
                                                                }
                                                                className="w-full text-left px-4 py-3 hover:bg-red-100 text-sm text-red-600 flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                ✖ Reject
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Divider */}
                                                    <div className="border-t border-gray-100"></div>

                                                    {/* Activate / De-activate */}
                                                    {normalizedStatus === "active" ||
                                                        normalizedStatus === "approved" ? (
                                                        <div>
                                                            <button
                                                                onClick={(e) =>
                                                                    handleMenuAction("deactivate", user, e)
                                                                }
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-100 active:bg-red-100 text-sm text-red flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                De-activate API access
                                                            </button>
                                                            {/* Regenerate */}
                                                            <button
                                                                onClick={(e) =>
                                                                    handleMenuAction("regenerate", user, e)
                                                                }
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-3"
                                                                type="button"
                                                            >
                                                                <span>Regenerate API key</span>
                                                            </button>
                                                        </div>

                                                    ) : (
                                                        <button
                                                            onClick={(e) =>
                                                                handleMenuAction("activate", user, e)
                                                            }
                                                            className="w-full text-left px-4 py-3 hover:bg-gray-100 active:bg-green-100 text-sm text-green-600 flex items-center gap-3"
                                                            type="button"
                                                        >
                                                            Activate API access
                                                        </button>
                                                    )}

                                                    {/* Delete */}
                                                    <button
                                                        onClick={(e) =>
                                                            handleMenuAction("delete", user, e)
                                                        }
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-100 active:bg-red-100 text-sm text-red flex items-center gap-3"
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

            {/* Delete Modal */}
            {showConfirmDeleteModal && (
                <ConfirmationModal
                    onConfirm={confirmDelete}
                    onCancel={cancelDelete}
                    message={`Are you sure you want to delete ${userToDelete?.customerName || "this API user"
                        }? This action cannot be undone.`}
                    title="Delete API User"
                    confirmText="Delete User"
                    cancelText="Cancel"
                    isLoading={isDeleting}
                />
            )}

            {/* Deactivate Modal */}
            {showConfirmDeactivateModal && (
                <ConfirmationModal
                    onConfirm={confirmDeactivate}
                    onCancel={cancelDeactivate}
                    message={`Are you sure you want to deactivate ${userToDeactivate?.customerName || "this API user"
                        }? They won't be able to access the API until reactivated.`}
                    title="Deactivate API Access"
                    confirmText="Deactivate"
                    cancelText="Cancel"
                    isLoading={isDeactivating}
                />
            )}
        </>
    );
}

// ==========================
// Status Badge
// ==========================
function ApiStatusBadge({ status, user, onAction }) {
    const normalized = status?.toLowerCase();

    if (normalized === "approved") {
        return (
            <div className="inline-flex items-center justify-center px-4 py-1 rounded-md bg-[#00A86B] text-white text-xs font-semibold">
                Approved
            </div>
        );
    }

    if (normalized === "non-approved" || normalized === "rejected") {
        return (
            <div className="inline-flex items-center justify-center px-4 py-1 rounded-md bg-[#E50914] text-white text-xs font-semibold">
                Non-Approved
            </div>
        );
    }

    if (normalized === "active") {
        return (
            <div className="inline-flex items-center justify-center px-4 py-1 rounded-md bg-[#FACC15] text-white text-xs font-semibold">
                Active
            </div>
        );
    }

    if (normalized === "deactivated" || normalized === "inactive") {
        return (
            <div className="inline-flex items-center justify-center px-4 py-1 rounded-md bg-[#E50914] text-white text-xs font-semibold">
                De-activated
            </div>
        );
    }

    // Pending / Unknown
    return (
        <div className="flex gap-4 items-center">
            <span
                onClick={() => onAction("approve", user)}
                title="Approve user"
            >
                <Image src="/right_green.svg" alt="approve" width={26} height={26} />
            </span>

            <span
                onClick={() => onAction("reject", user)}
                title="Reject user"
            >
                <Image src="/wrong_red.svg" alt="reject" width={26} height={26} />
            </span>
        </div>
    );
}

// ==========================
// Confirmation Modal
// ==========================
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

        const timer = setTimeout(() => {
            if (cancelButtonRef.current) {
                cancelButtonRef.current.focus();
            }
        }, 100);

        return () => {
            document.removeEventListener("keydown", handleEscape);
            clearTimeout(timer);
        };
    }, [onCancel, isLoading]);

    const handleBackdropClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target) && !isLoading) {
            e.preventDefault();
            onCancel();
        }
    };

    useEffect(() => {
        const originalStyle = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    const handleConfirm = async (e) => {
        e.preventDefault();
        if (!isLoading) {
            try {
                await onConfirm();
            } catch (error) {
                console.error("Confirmation action failed:", error);
            }
        }
    };

    const handleCancel = (e) => {
        e.preventDefault();
        if (!isLoading) {
            onCancel();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
                onClick={handleBackdropClick}
                aria-hidden="true"
            ></div>

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div
                    ref={modalRef}
                    className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all duration-300 sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
                    role="dialog"
                    aria-modal="true"
                    style={{ animation: "modalSlideIn 0.3s ease-out" }}
                >
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <svg
                                className="w-6 h-6 text-red-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                        </div>

                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left flex-1">
                            <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-2">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={handleConfirm}
                            className="inline-flex w-full justify-center items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white bg-[#E91B40] shadow-sm transition-all duration-200 sm:w-auto min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg
                                        className="animate-spin h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    <span>{confirmText}...</span>
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>

                        <button
                            ref={cancelButtonRef}
                            type="button"
                            disabled={isLoading}
                            onClick={handleCancel}
                            className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
        </div>
    );
}