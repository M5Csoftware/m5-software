import React, { useState, useEffect, useContext } from "react";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";

const AssignCodeModal = ({ isOpen, onClose, user, onAssignSuccess }) => {
  const { server } = useContext(GlobalContext);
  const [suggestedCode, setSuggestedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      generateAccountCode();
    }
  }, [isOpen, user]);

  const generateAccountCode = async () => {
    try {
      setLoading(true);
      setError("");

      if (!user.state) {
        setError("User state information is missing");
        setSuggestedCode("");
        return;
      }

      // console.log("=== Generating Account Code ===");
      // console.log("User state:", user.state);

      // Call the backend route to generate account code
      const response = await axios.post(`${server}/portal/auth/assign-code`, {
        state: user.state
      });

      // console.log("API Response:", response.data);

      if (response.data.success) {
        const { accountCode, stateAbbreviation } = response.data;
        setSuggestedCode(accountCode);
        // console.log("Generated code:", accountCode);
        // console.log("State abbreviation:", stateAbbreviation);
      } else {
        setError(response.data.message || "Failed to generate account code");
        setSuggestedCode("");
      }

      // console.log("=== End Account Code Generation ===");
    } catch (error) {
      console.error("Error generating account code:", error);
      console.error("Error details:", error.response?.data || error.message);
      setError(
        error.response?.data?.message || 
        "Failed to generate account code. Please try again."
      );
      setSuggestedCode("");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    try {
      setLoading(true);
      setError("");

      if (!suggestedCode) {
        setError("No account code generated");
        return;
      }

      // console.log("=== Assigning Account Code ===");
      // console.log("User:", user.fullName);
      // console.log("User ID:", user._id);
      // console.log("Email:", user.emailId);
      // console.log("Code:", suggestedCode);

      // Update user with account code in the database
      // console.log("Updating user record with account code...");
      await axios.put(`${server}/portal/auth/register?id=${user._id}`, {
        accountCode: suggestedCode,
      });

      // console.log("✅ Account code assigned successfully to user record!");

      // Create initial customer account entry with basic info
      // console.log("Creating customer account entry...");
      try {
        await axios.post(`${server}/customer-account`, {
          accountCode: suggestedCode,
          name: user.fullName,
          accountType: user.accountType || "customer",
          addressLine1: user.addressLine1 || "",
          addressLine2: user.addressLine2 || "",
          city: user.city || "",
          state: user.state || "",
          country: user.country || "",
          pinCode: user.zipCode || "",
          contactPerson: user.fullName,
          email: user.emailId,
          telNo: user.mobileNumber || "",
          gstNo: user.gstNumber || "",
        });
        // console.log("✅ Customer account entry created!");
      } catch (createError) {
        // If account already exists, that's okay - we'll update it later
        // console.log("Customer account might already exist, continuing...");
      }

      // console.log("=== Assignment Complete ===");
      // console.log("NO EMAIL SENT - will be sent when form is saved");

      // Call success callback with code and user data
      // The parent component will open the customer form
      onAssignSuccess(suggestedCode, user);
      
    } catch (error) {
      console.error("❌ Error assigning code:", error);
      console.error("Error details:", error.response?.data || error.message);
      setError(
        error.response?.data?.message || 
        error.message || 
        "Failed to assign account code"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">Assign Account Code</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              User Name
            </label>
            <input
              type="text"
              value={user?.fullName || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={user?.state || ""}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Suggested Account Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={loading && !suggestedCode ? "Generating..." : suggestedCode}
                disabled
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-semibold text-lg"
              />
            </div>
            {suggestedCode && (
              <p className="text-xs text-gray-500 mt-1">
                Based on state: {user?.state}
              </p>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Clicking "Assign" will save the account code and open the customer form where you can complete all details. No email will be sent until you save the form on the last step.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={loading || !suggestedCode}
            className="px-4 py-2 bg-[#EA1B40] text-white rounded-md hover:bg-[#d01636] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Assign"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignCodeModal;