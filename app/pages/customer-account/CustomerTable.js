"use client";
import Image from "next/image";
import { useRef, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";
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
            className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

// Deactivate Confirmation Modal Component
const DeactivateConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isActive,
}) => {
  const [deactivateReason, setDeactivateReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isActive && !deactivateReason.trim()) {
      alert("Please provide a reason for deactivation");
      return;
    }

    onConfirm(e, deactivateReason);
    setDeactivateReason("");
  };

  const handleClose = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeactivateReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">
          Confirm {isActive ? "Deactivation" : "Activation"}
        </h3>
        <p className="text-gray-600 mb-4">
          Are you sure you want to {isActive ? "deactivate" : "activate"} user{" "}
          <span className="font-semibold">{userName}</span>?
        </p>

        {isActive && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason for Deactivation *
            </label>
            <textarea
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows="3"
              placeholder="Enter reason for deactivation..."
            />
          </div>
        )}

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
            className={`px-4 py-2 text-white rounded-md transition-colors ${
              isActive
                ? "bg-orange-600 hover:bg-orange-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CustomerTable({
  users,
  onSort,
  sortConfig,
  selectedIds,
  setSelectedIds,
  refetchUsers,
  onEditUser,
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
  const [deactivateModal, setDeactivateModal] = useState({
    isOpen: false,
    user: null,
  });
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });
  const [form16Status, setForm16Status] = useState({});
  const menuRef = useRef(null);
  const router = useRouter();
  const { server } = useContext(GlobalContext);

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Check Form-16 status for all users
  useEffect(() => {
    const checkForm16Status = async () => {
      const statusMap = {};

      for (const user of users) {
        try {
          const accountCode = user.accountCode || user._id;
          const response = await axios.get(
            `${server}/portal/setting-billing?accountCode=${accountCode}&type=form16`
          );

          statusMap[accountCode] =
            response.data.success &&
            response.data.data &&
            response.data.data.fileUrl;
        } catch (error) {
          statusMap[user.accountCode || user._id] = false;
        }
      }

      setForm16Status(statusMap);
    };

    if (users.length > 0) {
      checkForm16Status();
    }
  }, [users, server]);
  // Edit Details - Redirect to customer details AddressAndContact page with accountCode
  const handleEditDetails = (user) => {
    const accountCode = user.accountCode || user._id;

    // Prepare user data in the format expected by CustomerAccount
    const userData = {
      accountCode: accountCode,
      accountType: user.accountType,
      name: user.name,
      fullName: user.name,
      companyName: user.companyName || user.name,
      contactPerson: user.contactPerson || user.name,
      email: user.email,
      emailId: user.email,
      telNo: user.telNo || user.contact,
      mobileNumber: user.contact,
      mobile: user.contact,
      phone: user.contact,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      address1: user.addressLine1,
      address2: user.addressLine2,
      city: user.city,
      state: user.state,
      country: user.country,
      pinCode: user.pinCode,
      pincode: user.pinCode,
      zipCode: user.pinCode,
      branch: user.branch,
      hub: user.hub,
      gstNo: user.gstNo,
      gstNumber: user.gstNo,
      gstin: user.gstNo,
      gst: user.gstNo,
      panNo: user.panNo,
      kycNo: user.kycNo,
      managedBy: user.managedBy,
    };

    // console.log("Editing user with data:", userData);

    if (onEditUser) {
      onEditUser(userData);
    }

    setActiveMenu(null);
  };

  // Export to Excel function - Export complete customer data
  const handleExportDetails = async (user) => {
    try {
      const accountCode = user.accountCode || user._id;

      // Fetch complete customer data from server using correct query param
      const response = await axios.get(
        `${server}/customer-account?accountCode=${accountCode}`
      );
      const customerData = response.data;

      // console.log("Customer Data for Export:", customerData);

      if (!customerData) {
        showNotification("error", "Customer data not found");
        setActiveMenu(null);
        return;
      }

      // Create export data with all fields
      const exportData = [
        {
          "Account Code": customerData.accountCode || "",
          "Account Type": customerData.accountType || "",
          Name: customerData.name || "",
          "Address Line 1": customerData.addressLine1 || "",
          "Address Line 2": customerData.addressLine2 || "",
          City: customerData.city || "",
          State: customerData.state || "",
          Country: customerData.country || "",
          "Pin Code": customerData.pinCode || "",
          "Contact Person": customerData.contactPerson || "",
          Email: customerData.email || "",
          "Tel No": customerData.telNo || "",
          "PAN No": customerData.panNo || "",
          "GST No": customerData.gstNo || "",
          "KYC No": customerData.kycNo || "",
          Branch: customerData.branch || "",
          Hub: customerData.hub || "",
          "Company Name": customerData.companyName || "",
          "Sales Person Name": customerData.salesPersonName || "",
          "Reference By": customerData.referenceBy || "",
          "Managed By": customerData.managedBy || "",
          "Collection By": customerData.collectionBy || "",
          "Account Manager": customerData.accountManager || "",
          "Report Person": customerData.reportPerson || "",
          "Sales Coordinator": customerData.salesCoordinator || "",
          "Applicable Tariff": customerData.applicableTariff || "",
          GST: customerData.gst || "",
          "Account Status": customerData.account || "",
          Fuel: customerData.fuel || "",
          "Rate Modify": customerData.rateModify || "",
          "Billing Email ID": customerData.billingEmailId || "",
          "Payment Terms": customerData.paymentTerms || "",
          "Rate Type": customerData.rateType || "",
          "Parent Code": customerData.parentCode || "",
          "Billing Tag": customerData.billingTag || "",
          Currency: customerData.currency || "",
          CSB: customerData.csb || "",
          Branded: customerData.branded || "",
          Handling: customerData.handling || "",
          "Mode Type": customerData.modeType || "",
          "Deactivate Reason": customerData.deactivateReason || "",
          "Deactivate Status": customerData.deactivateStatus ? "Yes" : "No",
          "Enable OS": customerData.enableOS ? "Yes" : "No",
          "Opening Balance": customerData.openingBalance || "",
          "Credit Limit": customerData.creditLimit || "",
          "Left Over Balance": customerData.leftOverBalance || 0,
          "No Of Days Credit": customerData.noOfDaysCredit || "",
          "Portal Balance": customerData.portalBalance || "",
          "Bank Name": customerData.bankName || "",
          "Account Number": customerData.accountNumber || "",
          "Company Code": customerData.companyCode || "",
          IFSC: customerData.ifsc || "",
          "Bank Address": customerData.bankAddress || "",
          GM: customerData.gm || "",
          RM: customerData.rm || "",
          SM: customerData.sm || "",
          SE: customerData.se || "",
          "Created At": customerData.createdAt
            ? new Date(customerData.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "",
          "Updated At": customerData.updatedAt
            ? new Date(customerData.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Customer Details");

      const customerName = customerData.name
        ? customerData.name.replace(/\s+/g, "_")
        : "Customer";
      const fileName = `${customerName}_${accountCode}_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      XLSX.writeFile(wb, fileName);

      showNotification("success", "Customer details exported successfully");
      setActiveMenu(null);
    } catch (error) {
      console.error("Error exporting customer details:", error);
      showNotification("error", "Failed to export customer details");
    }
  };

  // Handle Form-16 download
  const handleForm16Download = async (user) => {
    try {
      const accountCode = user.accountCode || user._id;

      // console.log("Attempting to download Form-16 for account:", accountCode);

      // Get the Form-16 data from API
      const response = await axios.get(
        `${server}/portal/setting-billing?accountCode=${accountCode}&type=form16`
      );

      if (
        response.data.success &&
        response.data.data &&
        response.data.data.fileUrl
      ) {
        const form16Data = response.data.data;

        // console.log("Form-16 data received:", {
//           fileName: form16Data.fileName,
//           fileUrl: form16Data.fileUrl,
//           fileSize: form16Data.fileSize,
//         });

        // Fetch the file as blob with proper headers
        const fileResponse = await fetch(form16Data.fileUrl, {
          method: "GET",
          headers: {
            Accept:
              "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream",
          },
        });

        if (!fileResponse.ok) {
          throw new Error(`HTTP error! status: ${fileResponse.status}`);
        }

        // Get the blob
        const blob = await fileResponse.blob();

        // Verify blob has content
        if (blob.size === 0) {
          throw new Error("Downloaded file is empty");
        }

        // console.log("Form-16 file downloaded as blob:", {
//           size: blob.size,
//           type: blob.type,
//         });

        // Create blob URL
        const blobUrl = window.URL.createObjectURL(blob);

        // Create link and trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = form16Data.fileName || `Form16_${accountCode}.pdf`;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();

        // Clean up after a short delay
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);

        showNotification("success", "Form-16 downloaded successfully");
      } else {
        // console.log("No Form-16 available for this customer");
        showNotification("info", "No Form-16 available for this customer");
      }

      setActiveMenu(null);
    } catch (error) {
      console.error("Error downloading Form-16:", error);
      showNotification(
        "error",
        "Failed to download Form-16. Please try again."
      );
    }
  };

  // Delete user function
  const handleDeleteUser = async () => {
    try {
      const accountCode = deleteModal.user.accountCode || deleteModal.user._id;

      await axios.delete(`${server}/customer-account?code=${accountCode}`);

      showNotification("success", "Customer deleted successfully");
      setDeleteModal({ isOpen: false, user: null });
      setActiveMenu(null);

      if (refetchUsers) {
        refetchUsers();
      }
    } catch (error) {
      console.error(
        "Error deleting customer:",
        error.response?.data || error.message
      );
      showNotification(
        "error",
        `Failed to delete customer: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  // Deactivate/Activate user function
  const handleToggleActiveStatus = async (e, deactivateReason = "") => {
    try {
      const user = deactivateModal.user;
      const accountCode = user.accountCode || user._id;

      // Check current status: true = deactivated, false/undefined = active
      const isCurrentlyDeactivated = user.deactivateStatus === true;

      // Determine new status: if currently active -> deactivate (true), if deactivated -> activate (false)
      const newStatus = !isCurrentlyDeactivated;

      // console.log(
//         "Toggle Status - Current:",
//         user.deactivateStatus,
//         "New:",
//         newStatus
//       );

      // Validate: if deactivating (newStatus === true), reason is required
      if (
        newStatus === true &&
        (!deactivateReason || deactivateReason.trim() === "")
      ) {
        showNotification("error", "Deactivation reason is required");
        return;
      }

      // Prepare update data
      const updateData = {
        accountCode: accountCode,
        deactivateStatus: newStatus,
      };

      // Add deactivate reason only when deactivating
      if (newStatus === true) {
        updateData.deactivateReasonModal = deactivateReason.trim();
      }

      // Call the deactivate API endpoint
      const response = await axios.put(
        `${server}/customer-account/deactivate`,
        updateData
      );

      // console.log("API Response:", response.data);

      const statusMessage = newStatus ? "deactivated" : "activated";
      showNotification(
        "success",
        `Account ${accountCode} ${statusMessage} successfully`
      );

      // Close modal and refresh users
      setDeactivateModal({ isOpen: false, user: null });
      setActiveMenu(null);

      if (refetchUsers) {
        refetchUsers();
      }
    } catch (error) {
      console.error(
        "Error toggling customer status:",
        error.response?.data || error.message
      );
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.message;
      showNotification(
        "error",
        `Failed to update customer status: ${errorMessage}`
      );
    }
  };

  const openDeleteModal = (user) => {
    setDeleteModal({ isOpen: true, user });
    setActiveMenu(null);
  };

  const openDeactivateModal = (user) => {
    setDeactivateModal({ isOpen: true, user });
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
    { key: "name", label: "Customer Name", width: "w-[250px]", sortable: true },
    { key: "contact", label: "Contact", width: "w-[210px]" },
    { key: "branch", label: "Branch", width: "w-[180px]", sortable: true },
    { key: "location", label: "Location", width: "w-[180px]", sortable: true },
    {
      key: "managedBy",
      label: "Managed By",
      width: "w-[180px]",
      sortable: true,
    },
    {
      key: "lastActive",
      label: "Last Active",
      width: "w-[180px]",
      sortable: true,
    },
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
        userName={deleteModal.user?.name || ""}
      />

      {/* Deactivate Confirmation Modal */}
      <DeactivateConfirmationModal
        isOpen={deactivateModal.isOpen}
        onClose={() => setDeactivateModal({ isOpen: false, user: null })}
        onConfirm={handleToggleActiveStatus}
        userName={deactivateModal.user?.name || ""}
        isActive={deactivateModal.user?.deactivateStatus !== true}
      />

      {/* Table Container with Horizontal Scroll */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header */}
          <div className="bg-gray-100 border-b border-[#D0D5DD] px-4 md:px-6 py-4">
            <div className="grid grid-cols-[40px_minmax(200px,2fr)_minmax(180px,1.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(130px,1fr)_40px] gap-3 md:gap-4 text-sm font-semibold text-[#18181B]">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === users.length && users.length > 0
                  }
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
            {users.map((user) => {
              const isDeactivated = user.deactivateStatus === true;
              const hasForm16 = form16Status[user.accountCode || user._id];

              return (
                <div
                  key={user._id || user.id}
                  className={`border-b border-gray-200 px-4 md:px-6 py-4 text-sm transition-colors ${
                    isDeactivated
                      ? "bg-gray-300 hover:bg-gray-400"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="grid grid-cols-[40px_minmax(200px,2fr)_minmax(180px,1.5fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(140px,1fr)_minmax(130px,1fr)_40px] gap-3 md:gap-4 items-start">
                    {/* Checkbox */}
                    <div className="flex items-center justify-center pt-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user._id || user.id)}
                        onChange={() => toggleSelectOne(user._id || user.id)}
                        className="accent-[#EA1B40] w-4 h-4"
                        disabled={isDeactivated}
                      />
                    </div>

                    {/* Customer Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Image
                        src="/newlogo.svg"
                        alt="Avatar"
                        width={40}
                        height={40}
                        className={`rounded-full flex-shrink-0 ${
                          isDeactivated ? "opacity-50" : ""
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-semibold truncate ${
                            isDeactivated ? "text-gray-600" : "text-gray-700"
                          }`}
                          title={`${user.name}${
                            isDeactivated ? " (DEACTIVATED)" : ""
                          }`}
                        >
                          {user.name}
                          {isDeactivated && (
                            <span className="ml-2 text-xs font-bold text-red-600">
                              (DEACTIVATED)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${
                              isDeactivated
                                ? "bg-gray-200 text-gray-600 border-gray-500"
                                : "bg-green-100 text-[#047644] border-[#047644]"
                            }`}
                          >
                            {user.accountType}
                          </span>
                          <span
                            className={`text-xs whitespace-nowrap ${
                              isDeactivated ? "text-gray-600" : "text-gray-500"
                            }`}
                          >
                            #{user.accountCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact */}
                    <div
                      className={`min-w-0 ${
                        isDeactivated ? "text-gray-600" : "text-gray-700"
                      }`}
                    >
                      <div className="truncate" title={user.contact || "N/A"}>
                        {user.contact || "N/A"}
                      </div>
                      <div className="truncate" title={user.email}>
                        <span className="text-xs font-extralight text-gray-500">
                          {user.email}
                        </span>
                      </div>
                    </div>

                    {/* Branch */}
                    <div
                      className={`min-w-0 truncate ${
                        isDeactivated ? "text-gray-600" : "text-gray-700"
                      }`}
                      title={user.branch || "N/A"}
                    >
                      {user.branch || "N/A"}
                    </div>

                    {/* Location */}
                    <div
                      className={`min-w-0 truncate ${
                        isDeactivated ? "text-gray-600" : "text-gray-700"
                      }`}
                      title={user.location || "N/A"}
                    >
                      {user.location || "N/A"}
                    </div>

                    {/* Managed By */}
                    <div
                      className={`min-w-0 truncate ${
                        isDeactivated ? "text-gray-600" : "text-gray-700"
                      }`}
                      title={user.managedBy || "Unassigned"}
                    >
                      {user.managedBy || "Unassigned"}
                    </div>

                    {/* Last Active */}
                    <div
                      className={`min-w-0 truncate ${
                        isDeactivated ? "text-gray-600" : "text-gray-700"
                      }`}
                      title={
                        user.lastActive
                          ? new Date(user.lastActive).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "N/A"
                      }
                    >
                      {user.lastActive
                        ? new Date(user.lastActive).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
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
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                      >
                        <Image
                          src="/three-dot.svg"
                          alt="menu"
                          width={5}
                          height={5}
                        />
                      </button>

                      {activeMenu === (user._id || user.id) && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-2 w-48 bg-white border rounded shadow-lg z-10"
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDetails(user);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                          >
                            Edit details
                          </button>
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
                              handleForm16Download(user);
                            }}
                            disabled={!hasForm16}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              hasForm16
                                ? "hover:bg-blue-100 text-blue-600"
                                : "text-gray-400 cursor-not-allowed bg-gray-50"
                            }`}
                            title={
                              hasForm16
                                ? "Download Form-16"
                                : "No Form-16 available"
                            }
                          >
                            Form-16
                            {!hasForm16 && (
                              <span className="ml-1 text-xs">
                                (Not Available)
                              </span>
                            )}
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeactivateModal(user);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              isDeactivated
                                ? "hover:bg-green-100 text-green-600 font-semibold"
                                : "hover:bg-orange-100 text-orange-600"
                            }`}
                          >
                            {isDeactivated ? "Activate" : "Deactivate"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
