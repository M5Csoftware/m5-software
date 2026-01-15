"use client";
import Image from "next/image";
import { useRef, useState, useEffect, useContext } from "react";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";

// Rejection Modal Component
const RejectionModal = ({ isOpen, onClose, onConfirm, customerName }) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }
    onConfirm(reason);
    setReason("");
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Reject KYC Verification</h3>
        <p className="text-gray-600 mb-4">
          Customer: <span className="font-semibold">{customerName}</span>
        </p>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rejection Reason *
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA1B40] min-h-[100px]"
          placeholder="Please provide reason for rejection..."
        />
        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 bg-[#E91B40] text-white rounded-md hover:bg-red-600 transition-colors"
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  );
};

// Document Preview Modal Component
const DocumentPreviewModal = ({
  isOpen,
  onClose,
  document,
  documentNumber,
}) => {
  if (!isOpen || !document) return null;

  const handleDownload = async (url, type) => {
    try {
      // Fetch the image
      const response = await fetch(url);
      const blob = await response.blob();

      // Create blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // Create temporary link element
      const link = window.document.createElement("a");
      link.href = blobUrl;
      link.download = `Document-${documentNumber}-${type}.jpg`;

      // Append to body, click, and cleanup
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);

      // Revoke blob URL to free memory
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download image. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            Document {documentNumber} - {document.documentType}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front Side */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-700">Front Side</h4>
              <button
                onClick={() => handleDownload(document.frontImageUrl, "Front")}
                className="flex items-center gap-2 px-3 py-1.5 bg-red text-white rounded-md hover:bg-red transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={document.frontImageUrl}
                alt={`${document.documentType} Front`}
                className="w-full h-auto"
              />
            </div>
          </div>

          {/* Back Side */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-gray-700">Back Side</h4>
              <button
                onClick={() => handleDownload(document.backImageUrl, "Back")}
                className="flex items-center gap-2 px-3 py-1.5 bg-red text-white rounded-md hover:bg-red transition-colors text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <img
                src={document.backImageUrl}
                alt={`${document.documentType} Back`}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-500 text-center">
          Uploaded: {new Date(document.uploadedAt).toLocaleString()}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// All Documents View Modal
const AllDocumentsModal = ({ isOpen, onClose, documents, customerName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">
            KYC Documents - {customerName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {documents && documents.length > 0 ? (
            documents.map((doc, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">
                  Document {doc.documentNumber}: {doc.documentType}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Front Side</p>
                    <img
                      src={doc.frontImageUrl}
                      alt={`${doc.documentType} Front`}
                      className="w-full h-auto rounded border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(doc.frontImageUrl, "_blank")}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Back Side</p>
                    <img
                      src={doc.backImageUrl}
                      alt={`${doc.documentType} Back`}
                      className="w-full h-auto rounded border cursor-pointer hover:opacity-80"
                      onClick={() => window.open(doc.backImageUrl, "_blank")}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Uploaded: {new Date(doc.uploadedAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No documents uploaded</p>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function KycVerificationTable({
  customers,
  refetchData,
  showNotification,
}) {
  const [activeMenu, setActiveMenu] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    customer: null,
  });
  const [documentPreviewModal, setDocumentPreviewModal] = useState({
    isOpen: false,
    document: null,
    documentNumber: null,
  });
  const [allDocumentsModal, setAllDocumentsModal] = useState({
    isOpen: false,
    customer: null,
  });
  const [processing, setProcessing] = useState(false);
  const menuRef = useRef(null);
  const { server } = useContext(GlobalContext);

  // Handle approve action
  const handleApprove = async (customer) => {
    if (processing) return;

    try {
      setProcessing(true);

      // Step 1: Approve KYC in CustomerAccount
      const response = await axios.put(`${server}/kyc-software`, {
        accountCode: customer.accountCode,
        action: "approve",
      });

      if (response.data.success) {
        // Step 2: Update User onboarding progress
        try {
          await axios.put(`${server}/user/update-onboarding`, {
            accountCode: customer.accountCode,
            field: "kycCompleted",
            value: true,
          });
        } catch (onboardingError) {
          console.error("Error updating onboarding:", onboardingError);
          // Continue even if onboarding update fails
        }

        showNotification("success", `KYC verified for ${customer.fullName}`);
        refetchData((prev) => !prev);
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to approve KYC"
        );
      }
    } catch (error) {
      console.error("Error approving KYC:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to approve KYC"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle reject action - open modal
  const handleRejectClick = (customer) => {
    setRejectionModal({ isOpen: true, customer });
    setActiveMenu(null);
  };

  // Handle rejection confirmation
  const handleRejectConfirm = async (reason) => {
    const customer = rejectionModal.customer;
    if (!customer) return;

    try {
      setProcessing(true);

      const response = await axios.put(`${server}/kyc-software`, {
        accountCode: customer.accountCode,
        action: "reject",
        rejectionReason: reason,
      });

      if (response.data.success) {
        showNotification("success", `KYC rejected for ${customer.fullName}`);
        setRejectionModal({ isOpen: false, customer: null });
        refetchData((prev) => !prev);
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to reject KYC"
        );
      }
    } catch (error) {
      console.error("Error rejecting KYC:", error);
      showNotification(
        "error",
        error.response?.data?.message || "Failed to reject KYC"
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle document preview
  const handleDocumentPreview = (doc, docNumber) => {
    setDocumentPreviewModal({
      isOpen: true,
      document: doc,
      documentNumber: docNumber,
    });
    setActiveMenu(null);
  };

  // Handle view all documents
  const handleViewAllDocuments = (customer) => {
    setAllDocumentsModal({ isOpen: true, customer });
    setActiveMenu(null);
  };

  // Close menu when clicking outside
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
    window.document.addEventListener("mousedown", handler);
    return () => window.document.removeEventListener("mousedown", handler);
  }, []);

  const headers = [
    { key: "customer", label: "Customer", width: "flex-1 min-w-[200px]" },
    {
      key: "verificationType",
      label: "Verification Type",
      width: "flex-1 min-w-[160px]",
    },
    { key: "document1", label: "Document 1", width: "flex-1 min-w-[140px]" },
    { key: "document2", label: "Document 2", width: "flex-1 min-w-[140px]" },
    { key: "status", label: "KYC Status", width: "flex-1 min-w-[160px]" },
  ];

  return (
    <div className="overflow-hidden w-full">
      {/* Rejection Modal */}
      <RejectionModal
        isOpen={rejectionModal.isOpen}
        onClose={() => setRejectionModal({ isOpen: false, customer: null })}
        onConfirm={handleRejectConfirm}
        customerName={rejectionModal.customer?.fullName || ""}
      />

      {/* Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={documentPreviewModal.isOpen}
        onClose={() =>
          setDocumentPreviewModal({
            isOpen: false,
            document: null,
            documentNumber: null,
          })
        }
        document={documentPreviewModal.document}
        documentNumber={documentPreviewModal.documentNumber}
      />

      {/* All Documents Modal */}
      <AllDocumentsModal
        isOpen={allDocumentsModal.isOpen}
        onClose={() => setAllDocumentsModal({ isOpen: false, customer: null })}
        documents={allDocumentsModal.customer?.documents || []}
        customerName={allDocumentsModal.customer?.fullName || ""}
      />

      {/* Header */}
      <div className="bg-gray-100 border-b w-full border-[#D0D5DD] px-6 py-4">
        <div className="flex items-center gap-6 w-full text-sm font-semibold text-[#18181B]">
          {headers.map((col, index) => (
            <div
              key={`${col.key}-${index}`}
              className={`${col.width} flex-shrink-0 flex items-center gap-1 text-gray-600 font-medium font-sans`}
            >
              <span>{col.label}</span>
            </div>
          ))}
          <div className="w-[30px] flex-shrink-0"></div>
        </div>
      </div>

      {/* Scrollable Rows */}
      <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hidden-scrollbar">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="bg-white border-b border-gray-200 px-6 py-4 hover:bg-gray-50 text-sm text-[#18181B]"
          >
            <div className="flex items-center gap-6">
              {/* Customer */}
              <div className="flex-1 min-w-[200px] flex items-center gap-3">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-gray-700 font-semibold truncate">
                    {customer.fullName}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap inline-block w-fit bg-green-100 text-[#047644] border-[#047644]`}
                    >
                      {customer.accountType || "N/A"}
                    </span>
                    <span className="text-xs text-gray-500">
                      #{customer.accountCode || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification Type */}
              <div className="flex-1 min-w-[160px] flex-shrink-0 text-gray-700">
                <span className="truncate">{customer.verificationType}</span>
              </div>

              {/* Document 1 */}
              <div className="flex-1 min-w-[140px] text-gray-700">
                {customer.documents && customer.documents[0] ? (
                  <button
                    onClick={() =>
                      handleDocumentPreview(customer.documents[0], 1)
                    }
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    {customer.documents[0].documentType}
                  </button>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </div>

              {/* Document 2 */}
              <div className="flex-1 min-w-[140px] text-gray-700">
                {customer.documents && customer.documents[1] ? (
                  <button
                    onClick={() =>
                      handleDocumentPreview(customer.documents[1], 2)
                    }
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                  >
                    {customer.documents[1].documentType}
                  </button>
                ) : (
                  <span className="text-gray-400">N/A</span>
                )}
              </div>

              {/* KYC Status */}
              <div className="flex-1 min-w-[160px] flex flex-col gap-2">
                {customer.kycStatus === "under_review" ? (
                  <div className="flex gap-4 items-center">
                    <button
                      onClick={() => !processing && handleApprove(customer)}
                      disabled={processing}
                      className={`cursor-pointer ${
                        processing ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      title="Approve KYC"
                    >
                      <Image
                        src="/right_green.svg"
                        alt="approve"
                        width={26}
                        height={26}
                      />
                    </button>
                    <button
                      onClick={() => !processing && handleRejectClick(customer)}
                      disabled={processing}
                      className={`cursor-pointer ${
                        processing ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                      title="Reject KYC"
                    >
                      <Image
                        src="/wrong_red.svg"
                        alt="reject"
                        width={26}
                        height={26}
                      />
                    </button>
                  </div>
                ) : customer.kycStatus === "verified" ? (
                  <>
                    <span className="px-3 py-1.5 rounded text-white bg-green-500 text-center text-xs font-semibold">
                      Verified
                    </span>
                    {customer.verifiedAt && (
                      <span className="text-xs text-gray-500 text-center block">
                        {new Date(customer.verifiedAt).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : customer.kycStatus === "rejected" ? (
                  <>
                    <span className="px-3 py-1.5 rounded text-white bg-[#E91B40] text-center text-xs font-semibold">
                      Rejected
                    </span>
                    {customer.rejectionReason && (
                      <span
                        className="text-xs text-red-600 truncate"
                        title={customer.rejectionReason}
                      >
                        {customer.rejectionReason}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="px-3 py-1.5 rounded text-white bg-yellow-500 text-center text-xs font-semibold">
                    {customer.kycStatus}
                  </span>
                )}
              </div>

              {/* Actions Menu */}
              <div className="relative w-[30px] flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenu(
                      activeMenu === customer.id ? null : customer.id
                    );
                  }}
                  data-menu-trigger
                >
                  <Image src="/three-dot.svg" alt="menu" width={5} height={5} />
                </button>

                {activeMenu === customer.id && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-2 w-48 bg-white border rounded shadow-lg z-10"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAllDocuments(customer);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                    >
                      View All Documents
                    </button>
                    {customer.kycStatus === "rejected" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(
                            `Rejection Reason: ${customer.rejectionReason}`
                          );
                          setActiveMenu(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      >
                        View Rejection Reason
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
