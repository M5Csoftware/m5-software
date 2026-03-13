"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { Dropdown } from "@/app/components/Dropdown";
import { TableWithCheckboxEditDelete } from "@/app/components/Table";
import StepsNavbar from "@/app/components/customer-details/StepsNavbar";
import NotificationFlag from "@/app/components/Notificationflag";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";

function RunProcess() {
  const { server } = useContext(GlobalContext);
  const { register, setValue, reset, watch } = useForm({
    defaultValues: {
      runNo: "",
      status: "",
    },
  });

  const [formKey, setFormKey] = useState(0);
  const [step, setStep] = useState(0);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const runNo = watch("runNo");

  // Get user data from localStorage on component mount
  useEffect(() => {
    const getUserData = () => {
      try {
        const storedUserData = localStorage.getItem("userData") || 
                              localStorage.getItem("user") || 
                              localStorage.getItem("userInfo");
        
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          console.log("User data from localStorage:", parsedUserData);
          
          if (parsedUserData.userId && parsedUserData.department) {
            setUserData(parsedUserData);
          } else {
            console.error("User data missing required fields:", parsedUserData);
          }
        } else {
          console.log("No user data found in localStorage");
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
      }
    };

    getUserData();
    
    window.addEventListener('storage', getUserData);
    return () => window.removeEventListener('storage', getUserData);
  }, []);

  const steps = [
    { label: "Run Created" },
    { label: "Advanced Bagging" },
    { label: "Bagging and Clubbing" },
    { label: "Handover" },
    { label: "Departed" },
    { label: "Pre-Alert" },
    { label: "Arrived at Destination" },
    { label: "Custom Clearance" },
    { label: "CP" },
  ];

  const statusOptions = [
    "Run Created",
    "Advanced Bagging",
    "Bagging and Clubbing",
    "Handover",
    "Offloaded",
    "Departed",
    "Pre-Alert",
    "Arrived at Destination",
    "Custom Clearance",
    "CP",
  ];

  const columns = useMemo(
    () => [
      { key: "runNo", label: "Run No" },
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
      { key: "employeeID", label: "Employee ID" },
      { key: "department", label: "Department" },
    ],
    []
  );

  // Handle run number input with debounce
  useEffect(() => {
    let isMounted = true;
    
    const handleRunNoChange = async () => {
      if (runNo && runNo.trim()) {
        setHasSearched(true);
        await fetchRunHistory(runNo);
        if (isMounted) {
          await checkAndAutoUpdateStatuses(runNo);
        }
      } else {
        if (isMounted) {
          setHistoryData([]);
          setStep(0);
          setHasSearched(false);
        }
      }
    };

    const timeoutId = setTimeout(handleRunNoChange, 800);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [runNo]);

  const fetchRunHistory = async (runNumber) => {
    try {
      const response = await axios.get(`${server}/run-process?runNo=${runNumber.toUpperCase()}`);
      
      if (response.data.success) {
        const formattedData = response.data.data.map((item) => {
          // Format date properly
          let formattedDate = 'N/A';
          if (item.date && item.date !== 'N/A') {
            // Date is already formatted from backend
            formattedDate = item.date;
          }
          
          return {
            _id: item._id,
            runNo: item.runNo,
            date: formattedDate,
            status: item.status,
            employeeID: item.employeeID,
            employeeName: item.employeeName || item.employeeID,
            department: item.department,
            stepNumber: item.stepNumber || 0,
          };
        });
        
        setHistoryData(formattedData);
        
        // Set step from the backend response - it returns the most recent step
        const currentStep = response.data.currentStep || 0;
        console.log("Setting step to:", currentStep);
        setStep(currentStep);
        
        // Show success notification only if we have data
        if (formattedData.length > 0) {
          showNotification("success", `Found ${formattedData.length} history entries for run ${runNumber}`);
        } else {
          showNotification("info", `No history found for run ${runNumber}`);
        }
      } else {
        setHistoryData([]);
        setStep(0);
        showNotification("error", response.data.message || "Run number not found");
      }
    } catch (error) {
      console.error("Error fetching run history:", error);
      setHistoryData([]);
      setStep(0);
      showNotification("error", error.response?.data?.message || "Failed to fetch run history");
    }
  };

  const checkAndAutoUpdateStatuses = async (runNumber) => {
    try {
      if (!userData) {
        console.log("User data not available for auto-update");
        return;
      }

      const response = await axios.get(
        `${server}/run-process?runNo=${runNumber.toUpperCase()}&check-auto-statuses=true&userId=${userData.userId}`
      );
      
      if (response.data.success && response.data.autoUpdated) {
        // Refresh history if auto-updates were made
        setTimeout(() => {
          fetchRunHistory(runNumber);
        }, 1000);
        showNotification("success", response.data.message);
      }
    } catch (error) {
      console.error("Error checking auto statuses:", error);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const handleUpdate = async () => {
    if (!userData) {
      showNotification("error", "User data not found. Please log in again.");
      return;
    }

    const formData = {
      runNo: watch("runNo"),
      status: watch("status"),
      employeeID: userData.userId,
    };

    if (!formData.runNo || !formData.status) {
      showNotification("error", "Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      
      if (editMode && editId) {
        // Update existing entry
        const response = await axios.put(`${server}/run-process`, {
          id: editId,
          runNo: formData.runNo,
          ...formData,
        });

        if (response.data.success) {
          showNotification("success", "Run process updated successfully");
          setEditMode(false);
          setEditId(null);
          setValue("status", "");
          await fetchRunHistory(formData.runNo);
        }
      } else {
        // Create new entry
        const response = await axios.post(`${server}/run-process`, formData);

        if (response.data.success) {
          showNotification("success", response.data.message);
          // Update step from response
          if (response.data.currentStep !== undefined) {
            console.log("Updating step to:", response.data.currentStep);
            setStep(response.data.currentStep);
          }
          setValue("status", "");
          await fetchRunHistory(formData.runNo);
        } else {
          showNotification("error", response.data.message || "Failed to update run process");
        }
      }
    } catch (error) {
      console.error("Error updating run process:", error);
      showNotification("error", error.response?.data?.message || "Failed to update run process");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    showNotification("success", "Data saved successfully");
  };

  const handleEdit = (index) => {
    const item = historyData[index];
    setValue("status", item.status);
    setEditMode(true);
    setEditId(item._id);
    showNotification("info", "Edit mode activated");
  };

  const handleDelete = (index) => {
    const item = historyData[index];
    setDeleteId(item._id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setLoading(true);
      const currentRunNo = watch("runNo");
      const response = await axios.delete(`${server}/run-process?id=${deleteId}&runNo=${currentRunNo}`);

      if (response.data.success) {
        showNotification("success", "Run process entry deleted successfully");
        await fetchRunHistory(currentRunNo);
      }
    } catch (error) {
      console.error("Error deleting run process:", error);
      showNotification("error", error.response?.data?.message || "Failed to delete entry");
    } finally {
      setLoading(false);
      setDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleRefresh = () => {
    setFormKey((prev) => prev + 1);
    setStep(0);
    setHistoryData([]);
    setEditMode(false);
    setEditId(null);
    setHasSearched(false);
    
    reset({
      runNo: "",
      status: "",
    });
    
    showNotification("success", "Form refreshed");
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditId(null);
    setValue("status", "");
    showNotification("info", "Edit cancelled");
  };

  // Handle tab key press on runNo input
  const handleRunNoKeyDown = (e) => {
    if (e.key === 'Tab' && runNo && runNo.trim()) {
      e.preventDefault();
      fetchRunHistory(runNo);
    }
  };

  return (
    <>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this run process entry? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red text-white rounded-md hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="flex flex-col gap-3" key={formKey}>
        <Heading
          title="Run Process"
          bulkUploadBtn="hidden"
          onRefresh={handleRefresh}
          fullscreenBtn={false}
          codeListBtn="hidden"
        />

        <div className="w-full">
          <StepsNavbar
            steps={steps}
            step={step}
            setStep={setStep}
            register={register}
            setValue={setValue}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-start">
            <div className="w-full">
              <InputBox
                key={`runNo-${formKey}`}
                placeholder="Run Number"
                register={register}
                setValue={setValue}
                value="runNo"
                name="runNo"
                onKeyDown={handleRunNoKeyDown}
              />
            </div>

            <div className="w-full">
              <Dropdown
                key={`status-${formKey}`}
                title="Status"
                options={statusOptions}
                value="status"
                register={register}
                setValue={setValue}
              />
            </div>

            <div className="flex gap-2">
              <OutlinedButtonRed
                label={editMode ? "Update" : "Update"}
                onClick={handleUpdate}
                type="button"
                disabled={loading || !userData}
                className="whitespace-nowrap min-w-[100px]"
              />
              {editMode && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 whitespace-nowrap min-w-[100px]"
                >
                  Cancel
                </button>
              )}
            </div>

            <div>
              <SimpleButton
                type="button"
                name="Save"
                onClick={handleSave}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2">
            <RedLabelHeading label="Run History" />
          </div>
          
          <TableWithCheckboxEditDelete
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={historyData}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            name="runHistory"
            className="h-[40vh]"
          />
        </div>
      </form>
    </>
  );
}

export default RunProcess;