import Image from "next/image";
import { useRef, useState, useEffect } from "react";

// Improved ConfirmationModal Component
function ConfirmationModal({
  onConfirm,
  onCancel,
  message = "Are you sure you want to proceed?",
  title = "Confirm Action",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}) {
  const modalRef = useRef(null);
  const cancelButtonRef = useRef(null);

  // Handle escape key - avoid using native dialog APIs
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !isLoading) {
        e.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape, { passive: false });

    // Focus the cancel button by default for safety
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

  // Handle click outside
  const handleBackdropClick = (e) => {
    if (
      modalRef.current &&
      !modalRef.current.contains(e.target) &&
      !isLoading
    ) {
      e.preventDefault();
      onCancel();
    }
  };

  // Prevent body scroll when modal is open
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={handleBackdropClick}
        aria-hidden="true"
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          ref={modalRef}
          className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all duration-300 sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
          role="dialog"
          aria-modal="true"
          style={{
            animation: "modalSlideIn 0.3s ease-out",
          }}
        >
          {/* Content */}
          <div className="sm:flex sm:items-start">
            {/* Icon */}
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

            {/* Text content */}
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

          {/* Actions */}
          <div className="mt-6 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
            {/* Confirm Button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleConfirm}
              className="inline-flex w-full bg-red justify-center items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 sm:w-auto min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 focus:ring-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2"
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

            {/* Cancel Button */}
            <button
              ref={cancelButtonRef}
              type="button"
              disabled={isLoading}
              onClick={handleCancel}
              className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function EmployeeTable({
  users,
  onSort,
  sortConfig,
  onEmployeeAction,
}) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);
  const [showConfirmDeactivateModal, setShowConfirmDeactivateModal] =
    useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const allowedRoles = [
    "admin",
    "booking",
    "account",
    "customerCare",
    "Billing",
    "Operation",
  ];

  const roleColors = {
    admin: "bg-green-100 text-green-800 border-green-800",
    user: "bg-pink-200 text-pink-800 border-pink-800",
    branchuser: "bg-gray-100 text-gray-700 border-gray-300",
    counterpart: "bg-gray-100 text-gray-700 border-gray-300",
  };

  // Define colors for each department
  const departmentColors = {
    admin: "bg-green-100 text-green-800 border-green-800",
    booking: "bg-purple-100  text-purple-800 border-purple-800",
    account: "bg-orange-100 text-orange-800 border-orange-800",
    billing: "bg-cyan-100 text-cyan-800 border-cyan-800",
    customercare: "bg-pink-100 text-pink-800 border-pink-800",
    operations: "bg-[#0345D01F] text-blue-800 border-blue-800",
    sales: "bg-[#5822DD1F] text-[#5822DD] border-[#5822DD]",
    salesupport: "bg-fuchsia-200 text-fuchsia-800 border-fuchsia-800",
    customersupport: "bg-[#FE47731F] text-[#FE4773] border-[#FE4773]",
  };

  // Helper function
  const getDepartmentColor = (dept) => {
    if (!dept) return "bg-gray-100 text-gray-700 border-gray-300";
    return (
      departmentColors[dept.toLowerCase().replace(/\s/g, "")] ||
      "bg-gray-100 text-gray-700 border-gray-300"
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id || u._id || u.userId));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMenuAction = (action, user, event) => {
    // Prevent event bubbling
    event?.preventDefault();
    event?.stopPropagation();

    setActiveMenu(null);

    switch (action) {
      case "edit":
        // ✅ Pass complete user data for editing
        onEmployeeAction("edit", user);
        break;
      case "delete":
        setUserToDelete(user);
        setShowConfirmDeleteModal(true);
        break;
      case "permissions":
        onEmployeeAction("permissions", user);
        // console.log("Change permissions for:", user);
        break;
      case "deactivate":
        setUserToDeactivate(user);
        setShowConfirmDeactivateModal(true);
        break;
      default:
        break;
    }
  };

  const confirmDeactivate = async () => {
    if (userToDeactivate) {
      setIsDeactivating(true);
      try {
        await onEmployeeAction("deactivate", userToDeactivate, "");
        setShowConfirmDeactivateModal(false);
        setUserToDeactivate(null);
      } catch (error) {
        console.error("Failed to deactivate user:", error);
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

  // Handle confirmed delete
  const confirmDelete = async () => {
    if (userToDelete) {
      setIsDeleting(true);
      try {
        await onEmployeeAction("delete", userToDelete);
        setShowConfirmDeleteModal(false);
        setUserToDelete(null);
      } catch (error) {
        console.error("Failed to delete user:", error);
        // Keep modal open if delete fails so user can retry
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // Handle cancel delete
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
    document.addEventListener("touchstart", handler); // For mobile
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  // Close menu on escape key
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

  const getRoleColor = (role) => {
    return (
      roleColors[role.toLowerCase()] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const headers = [
    {
      key: "employee",
      label: "Employee Name",
      width: "w-[370px]",
      sortable: true,
    },
    { key: "access", label: "Access", width: "w-[400px]" },
    {
      key: "lastActive",
      label: "Last Active",
      width: "w-[180px]",
      sortable: true,
    },
    {
      key: "dateAdded",
      label: "Date Added",
      width: "w-[180px]",
      sortable: true,
    },
  ];

  return (
    <>
      <div className="overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-100 border-b border-[#D0D5DD] px-6 py-4">
          <div className="flex items-center gap-6 text-sm font-semibold text-[#18181B]">
            <div className="w-[30px]">
              <input
                type="checkbox"
                checked={
                  users.length > 0 && selectedIds.length === users.length
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

        {/* Table Rows */}
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hidden-scrollbar">
          {users.map((user) => {
            const userId = user.id || user._id || user.userId;
            return (
              <div
                key={userId}
                className={`border-b border-gray-200 px-6 py-4 text-sm text-[#18181B] transition-colors relative ${
                  user.deactivated
                    ? "bg-misty-rose"
                    : "bg-white hover:bg-gray-50"
                }`}
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

                  {/* Employee Info */}
                  <div className="w-[370px] flex items-center gap-3">
                    <Image
                      src="/newlogo.svg"
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <div className="text-gray-900 text-sm font-semibold">
                        {user.userName}
                      </div>
                      <div className="text-gray-500 truncate text-xs">
                        {user.email}
                      </div>
                      <div className="text-gray-400 text-xs">
                        ID: {user.userId}
                      </div>
                    </div>
                  </div>

                  {/* Access Roles */}
                  <div className="w-[400px]">
                    <div className="flex flex-wrap gap-1">
                      {user.role && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      )}
                      {user.department && (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getDepartmentColor(
                            user.department
                          )}`}
                        >
                          {user.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Last Active */}
                  <div className="w-[180px] text-gray-700 text-xs">
                    {user.lastActive
                      ? new Date(user.lastActive).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : new Date(
                          user.createdAt || user.dateAdded || Date.now()
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                  </div>

                  {/* Date Added */}
                  <div className="w-[180px] text-gray-700 text-xs">
                    {user.dateAdded
                      ? new Date(user.dateAdded).toLocaleDateString("en-US", {
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

                  {/* Menu Button and Dropdown */}
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

                    {/* Improved Dropdown Menu */}
                    {activeMenu === userId && (
                      <>
                        {/* Backdrop for mobile */}
                        <div
                          className="fixed inset-0 z-10 md:hidden"
                          onClick={() => setActiveMenu(null)}
                        ></div>

                        {/* Menu */}
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-2 animate-in fade-in-0 zoom-in-95 duration-200"
                          role="menu"
                          aria-orientation="vertical"
                        >
                          <button
                            onClick={(e) => handleMenuAction("edit", user, e)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-sm text-gray-700 flex items-center gap-3 transition-colors duration-150 group"
                            role="menuitem"
                            type="button"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-gray-500 group-hover:text-gray-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </div>
                            <span>Edit details</span>
                          </button>

                          <button
                            onClick={(e) =>
                              handleMenuAction("permissions", user, e)
                            }
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-sm text-gray-700 flex items-center gap-3 transition-colors duration-150 group"
                            role="menuitem"
                            type="button"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-gray-500 group-hover:text-gray-700"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                            </div>
                            <span>Change permissions</span>
                          </button>

                          {/* Divider */}
                          <div className="my-2 border-t border-gray-100"></div>

                          <button
                            onClick={(e) => handleMenuAction("delete", user, e)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 active:bg-red-100 text-sm text-red flex items-center gap-3 transition-colors duration-150 group"
                            role="menuitem"
                            type="button"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-red group-hover:text-red"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </div>
                            <span>Delete user</span>
                          </button>

                          <button
                            onClick={(e) =>
                              handleMenuAction("deactivate", user, e)
                            }
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 active:bg-red-100 text-sm text-red flex items-center gap-3 transition-colors duration-150 group"
                            role="menuitem"
                            type="button"
                          >
                            <div className="w-4 h-4 flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-red group-hover:text-red"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  fill="currentColor"
                                />
                                <line
                                  x1="8"
                                  y1="8"
                                  x2="16"
                                  y2="16"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                                <line
                                  x1="16"
                                  y1="8"
                                  x2="8"
                                  y2="16"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                            <span>De-activate user</span>
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

      {/* Confirmation Modal */}
      {showConfirmDeleteModal && (
        <ConfirmationModal
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          message={`Are you sure you want to delete ${
            userToDelete?.userName || "this user"
          }? This action cannot be undone.`}
          title="Delete User"
          confirmText="Delete User"
          cancelText="Cancel"
          isLoading={isDeleting}
        />
      )}
      {showConfirmDeactivateModal && (
        <ConfirmationModal
          onConfirm={confirmDeactivate}
          onCancel={cancelDeactivate}
          message={`Are you sure you want to deactivate ${
            userToDeactivate?.userName || "this user"
          }? They won’t be able to access the system until reactivated.`}
          title="Deactivate User"
          confirmText="Deactivate"
          cancelText="Cancel"
          isLoading={isDeactivating}
        />
      )}
    </>
  );
}
