import Image from "next/image";
import { useRef, useState, useEffect, useContext } from "react";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";
import AssignCodeModal from "@/app/components/customer-details/AssignCodeModal";
import * as XLSX from "xlsx";

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, userName }) => {
  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onConfirm(e);
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete user{" "}
          <span className="font-semibold">{userName}</span>?
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            No
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CustomerManagementTable({
  users,
  onSort,
  sortConfig,
  refetchUsers,
  onCreateAccount,
  selectedIds,
  setSelectedIds,
  onEditCustomer,
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [assignModal, setAssignModal] = useState({ isOpen: false, user: null });
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const menuRef = useRef(null);
  const { server } = useContext(GlobalContext);

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  const sendStatusEmail = async (user, status) => {
    try {
      setEmailSending(true);

      const userEmail = user.emailId;

      if (!userEmail) {
        console.error("No email found for user:", user);
        showNotification(
          "error",
          "User email not found. Please update user details."
        );
        return false;
      }

      const response = await axios.post(`${server}/portal/auth/send-email`, {
        email: userEmail,
        fullName: user.fullName,
        accountCode: user.accountCode || user._id,
        status: status,
        reason:
          status === "rejected"
            ? "incomplete details / verification issues / internal criteria"
            : undefined,
      });

      console.log("Email sent successfully:", response.data);
      showNotification(
        "success",
        `${
          status === "approved" ? "Approval" : "Rejection"
        } email sent successfully to ${userEmail}`
      );
      return true;
    } catch (error) {
      console.error(
        "Error sending email:",
        error.response?.data || error.message
      );
      showNotification(
        "error",
        `Failed to send email: ${
          error.response?.data?.details || error.message
        }`
      );
      return false;
    } finally {
      setEmailSending(false);
    }
  };

  const updateUserStatus = async (id, status, user) => {
    try {
      const response = await axios.put(
        `${server}/portal/auth/register?id=${id}`,
        { status }
      );
      console.log("Status updated:", response.data);

      showNotification("success", `User status updated to ${status}`);

      await sendStatusEmail(user, status);

      refetchUsers(true);
    } catch (error) {
      console.error(
        "Error updating status:",
        error.response?.data || error.message
      );
      showNotification(
        "error",
        `Failed to update status: ${error.response?.data || error.message}`
      );
    }
  };

  const handleApprove = (user) => {
    if (!emailSending) {
      updateUserStatus(user._id, "approved", user);
    }
  };

  const handleNonApprove = (user) => {
    if (!emailSending) {
      updateUserStatus(user._id, "rejected", user);
    }
  };

  const handleAssignCodeClick = (user) => {
    setAssignModal({ isOpen: true, user });
  };

  const handleAssignSuccess = async (assignedCode, userData) => {
    console.log("=== handleAssignSuccess called ===");
    console.log("Assigned Code:", assignedCode);
    console.log("User Data:", userData);
    
    setAssignModal({ isOpen: false, user: null });
    
    if (!userData || !userData._id) {
      console.error("User data not available");
      showNotification("error", "Failed to load user data");
      return;
    }

    try {
      const mappedUserData = {
        _id: userData._id,
        accountCode: assignedCode,
        name: userData.fullName,
        fullName: userData.fullName,
        email: userData.emailId,
        emailId: userData.emailId,
        telNo: userData.mobileNumber || "",
        mobileNumber: userData.mobileNumber || "",
        addressLine1: userData.addressLine1 || "",
        addressLine2: userData.addressLine2 || "",
        city: userData.city || "",
        state: userData.state || "",
        country: userData.country || "",
        pinCode: userData.zipCode || "",
        zipCode: userData.zipCode || "",
        gstNo: userData.gstNumber || "",
        gstNumber: userData.gstNumber || "",
        accountType: userData.accountType || "customer",
        contactPerson: userData.fullName,
        turnover: userData.turnover || "",
      };
      
      console.log("Opening customer form with mapped data:", mappedUserData);
      
      if (onEditCustomer) {
        onEditCustomer(mappedUserData);
      } else {
        console.error("onEditCustomer callback not provided");
        showNotification("error", "Failed to open customer form");
      }
      
      showNotification(
        "success",
        `Account code ${assignedCode} assigned! Please complete the form and save.`
      );
      
      if (refetchUsers) {
        refetchUsers(true);
      }
      
    } catch (error) {
      console.error("Error in handleAssignSuccess:", error);
      showNotification(
        "error", 
        "Code assigned but failed to open form. Please try again."
      );
    }
  };

  const handleCreateAccountClick = (user) => {
    if (onCreateAccount) {
      onCreateAccount(user);
    }
  };

  const handleExportDetails = (user) => {
    try {
      const exportData = [
        {
          "Full Name": user.fullName || "",
          "Mobile Number": user.mobileNumber || "",
          Email: user.emailId || "",
          "GST Number": user.gstNumber || "",
          Turnover: user.turnover || "",
          "Address Line 1": user.addressLine1 || "",
          "Address Line 2": user.addressLine2 || "",
          City: user.city || "",
          State: user.state || "",
          Country: user.country || "",
          "Zip Code": user.zipCode || "",
          Status: user.status || "",
          "Account Code": user.accountCode || "",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "User Details");

      const fileName = `${user.fullName.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      showNotification("success", "User details exported successfully");
      setActiveMenu(null);
    } catch (error) {
      console.error("Error exporting user details:", error);
      showNotification("error", "Failed to export user details");
    }
  };

  const handleDeleteUser = async () => {
    try {
      const userId = deleteModal.user._id;

      await axios.delete(`${server}/portal/auth/register?id=${userId}`);

      showNotification("success", "User deleted successfully");
      setDeleteModal({ isOpen: false, user: null });
      setActiveMenu(null);
      refetchUsers(true);
    } catch (error) {
      console.error(
        "Error deleting user:",
        error.response?.data || error.message
      );
      showNotification(
        "error",
        `Failed to delete user: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const openDeleteModal = (user) => {
    setDeleteModal({ isOpen: true, user });
    setActiveMenu(null);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id || u._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const handler = (e) => {
      const isMenuButton = e.target.closest("button[data-menu-trigger]");
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !isMenuButton
      ) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getSortIcon = (key) => {
    if (sortConfig.key === key)
      return sortConfig.direction === "asc" ? "↑" : "↓";
    return "";
  };

  const headers = [
    { key: "user", label: "User", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "contact", label: "Contact" },
    { key: "gstin", label: "GSTIN", sortable: true },
    { key: "address", label: "Address", sortable: true },
    { key: "status", label: "Status", sortable: true },
  ];

  return (
    <div className="overflow-hidden w-full">
      {/* Notification Flag */}
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDeleteUser}
        userName={deleteModal.user?.fullName || ""}
      />

      {/* Assign Code Modal */}
      <AssignCodeModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, user: null })}
        user={assignModal.user}
        onAssignSuccess={handleAssignSuccess}
      />

      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header */}
          <div className="bg-gray-100 border-b border-[#D0D5DD] px-4 md:px-6 py-4">
            <div className="grid grid-cols-[40px_minmax(140px,1fr)_minmax(160px,1.2fr)_minmax(120px,0.8fr)_minmax(140px,1fr)_minmax(200px,1.5fr)_minmax(180px,1.2fr)_40px] gap-3 md:gap-4 text-sm font-semibold text-[#18181B]">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedIds.length === users.length && users.length > 0}
                  onChange={toggleSelectAll}
                  className="accent-[#EA1B40] w-4 h-4"
                />
              </div>

              {headers.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center gap-1 text-gray-600 font-medium font-sans min-w-0"
                >
                  {col.sortable ? (
                    <button 
                      onClick={() => onSort(col.key)}
                      className="truncate hover:text-gray-900 transition-colors"
                    >
                      {col.label}
                    </button>
                  ) : (
                    <span className="truncate">{col.label}</span>
                  )}
                  <span className="flex-shrink-0">{getSortIcon(col.key)}</span>
                </div>
              ))}

              <div></div>
            </div>
          </div>

          {/* Scrollable Rows */}
          <div className="max-h-[500px] overflow-y-auto table-scrollbar scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {users.map((user) => (
              <div
                key={user._id || user.id}
                className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 hover:bg-gray-50 text-sm text-[#18181B]"
              >
                <div className="grid grid-cols-[40px_minmax(140px,1fr)_minmax(160px,1.2fr)_minmax(120px,0.8fr)_minmax(140px,1fr)_minmax(200px,1.5fr)_minmax(180px,1.2fr)_40px] gap-3 md:gap-4 items-start">
                  {/* Checkbox */}
                  <div className="flex items-center justify-center pt-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user._id || user.id)}
                      onChange={() => toggleSelectOne(user._id || user.id)}
                      className="accent-[#EA1B40] w-4 h-4"
                    />
                  </div>

                  {/* User */}
                  <div className="flex flex-col min-w-0 gap-1">
                    <span className="text-sm text-gray-700 font-semibold truncate" title={user.fullName}>
                      {user.fullName}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap bg-green-100 text-[#047644] border-[#047644] w-fit">
                      {user.turnover || "N/A"}
                    </span>
                  </div>

                  {/* Email */}
                  <div className="text-gray-700 min-w-0">
                    <span className="block truncate" title={user.emailId || "N/A"}>
                      {user.emailId || "N/A"}
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="text-gray-700 min-w-0">
                    <span className="block truncate">
                      {user.mobileNumber || "N/A"}
                    </span>
                  </div>

                  {/* GSTIN */}
                  <div className="text-gray-700 min-w-0">
                    <span className="block truncate" title={user.gstNumber || "N/A"}>
                      {user.gstNumber || "N/A"}
                    </span>
                  </div>

                  {/* Address */}
                  <div className="text-gray-700 min-w-0">
                    <span className="block truncate" title={
                      user.addressLine1 && user.city
                        ? `${user.addressLine1}, ${
                            user.addressLine2 ? user.addressLine2 + ", " : ""
                          }${user.city}, ${user.state}, ${user.country} - ${
                            user.zipCode
                          }`
                        : "N/A"
                    }>
                      {user.addressLine1 && user.city
                        ? `${user.addressLine1}, ${
                            user.addressLine2 ? user.addressLine2 + ", " : ""
                          }${user.city}, ${user.state}, ${user.country} - ${
                            user.zipCode
                          }`
                        : "N/A"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-2 min-w-0">
                    {user.status === "pending" ? (
                      <div className="flex gap-3 items-center">
                        <span
                          onClick={() => handleApprove(user)}
                          className={`cursor-pointer flex-shrink-0 ${
                            emailSending ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title="Approve user"
                        >
                          <Image
                            src="/right_green.svg"
                            alt="approve"
                            width={26}
                            height={26}
                          />
                        </span>
                        <span
                          onClick={() => handleNonApprove(user)}
                          className={`cursor-pointer flex-shrink-0 ${
                            emailSending ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          title="Reject user"
                        >
                          <Image
                            src="/wrong_red.svg"
                            alt="reject"
                            width={26}
                            height={26}
                          />
                        </span>
                      </div>
                    ) : user.status === "approved" ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="px-3 py-1.5 rounded text-white bg-green-500 text-center text-xs font-semibold whitespace-nowrap">
                            Approved
                          </span>
                          {!user.accountCode && (
                            <button
                              onClick={() => handleAssignCodeClick(user)}
                              className="px-3 py-1.5 bg-[#EA1B40] text-white rounded hover:bg-[#d01636] font-semibold text-xs transition-colors whitespace-nowrap"
                            >
                              Assign Code
                            </button>
                          )}
                        </div>
                        {user.accountCode && (
                          <span className="text-xs font-semibold text-gray-700 truncate" title={`Code: ${user.accountCode}`}>
                            Code: {user.accountCode}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 rounded text-white bg-[#E91B40] text-center text-xs font-semibold whitespace-nowrap">
                        Non-Approved
                      </span>
                    )}
                  </div>

                  {/* Actions Menu */}
                  <div className="relative flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenu(
                          activeMenu === (user._id || user.id)
                            ? null
                            : user._id || user.id
                        );
                      }}
                      data-menu-trigger
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Image src="/three-dot.svg" alt="menu" width={5} height={5} />
                    </button>

                    {activeMenu === (user._id || user.id) && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full mt-2 w-48 bg-white border rounded shadow-lg z-10"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportDetails(user);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                        >
                          Export details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(user);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 text-sm"
                        >
                          Delete user
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}