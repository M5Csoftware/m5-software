"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ChevronDown, ChevronUp } from "lucide-react";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { LabeledDropdown } from "@/app/components/Dropdown";
import {
  AddButton,
  DeleteButton,
  EditButton,
} from "@/app/components/AddUpdateDeleteButton";
import InputBox from "@/app/components/InputBox";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import axios from "axios";
import { TableWithCheckboxEditDelete } from "@/app/components/Table"; // Changed to use TableWithCheckboxEditDelete
import { GlobalContext } from "@/app/lib/GlobalContext";
import { BranchContext } from "@/app/Context/BranchContext";
import NotificationFlag from "@/app/components/Notificationflag";
import * as XLSX from "xlsx";
import Image from "next/image";
import classNames from "classnames";

// Bulk Upload Modal Component
const BulkUploadModal = ({
  onClose,
  onFileUpload,
  acceptedTypes = [".xls", ".xlsx"],
  title = "Bulk Upload",
}) => {
  const [fileUploaded, setFileUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const handleFileSelect = (file) => {
    if (file && acceptedTypes.includes(`.${file.name.split(".").pop()}`)) {
      setFileUploaded(true);
      setFileName(file.name);
      setSelectedFile(file);
      setError("");
    } else {
      setError(`Please select a valid file (${acceptedTypes.join(", ")})`);
      setFileUploaded(false);
      setFileName("");
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e) => handleFileSelect(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUploadClick = () => {
    if (selectedFile && onFileUpload) {
      onFileUpload(selectedFile);
      onClose();
    }
    showNotification("success", "File uploaded successfully");
  };

  const handleSampleDownload = () => {
    // Generate sample Excel file
    const sampleData = [
      ["Branch Name", "Client Code", "Client Name"],
      ["BR001", "CG001", "Sample Customer 1"],
      ["BR001", "CG002", "Sample Customer 2"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample");
    XLSX.writeFile(wb, "customer_branch_sample.xlsx");
    showNotification("success", "Sample file downloaded successfully");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black bg-opacity-50">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="bg-white px-8 py-6 flex flex-col gap-3 items-center rounded-lg shadow-lg w-[485px] h-[425px]">
        <h2 className="font-bold text-sm">{title}</h2>

        <div className="flex flex-col items-center gap-2 mt-2">
          <button
            type="button"
            className="flex px-4 py-2 gap-2 text-[var(--primary-color)] text-xs"
            onClick={handleSampleDownload}
          >
            <Image src="/download_red.svg" width={16} height={16} alt="" />
            Download Sample File
          </button>
        </div>

        <div
          className={classNames(
            "file-input-wrapper border-2 border-dashed rounded-lg mt-4",
            dragging ? "border-[var(--primary-color)]" : "border-[#979797]"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <label
            htmlFor="file-upload"
            className="bg-[#FAFAFA] rounded-lg flex flex-col gap-2 w-[365px] h-40 justify-center items-center cursor-pointer text-center text-[#A0AEC0]"
          >
            {!fileUploaded ? (
              <Image src="/upload_file.svg" width={24} height={24} alt="" />
            ) : (
              <Image src="/file-uploaded.svg" width={36} height={36} alt="" />
            )}
            <span>
              {fileUploaded
                ? `File Selected: ${fileName}`
                : "Drag & Drop to Upload File"}
            </span>
            {!fileUploaded && <span className="text-[#A0AEC0]">OR</span>}
            {!fileUploaded && (
              <span className="bg-[#c50b30e7] rounded-md px-1.5 py-2 text-white">
                Browse File
              </span>
            )}
          </label>
          <input
            id="file-upload"
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

        <div className="flex gap-4 mt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            disabled={!fileUploaded}
            onClick={handleUploadClick}
            className={classNames(
              "transition-all text-white font-semibold rounded-md text-sm py-2.5 px-11",
              fileUploaded
                ? "bg-[#c50b30e7] hover:bg-[#c50b30cc]"
                : "bg-[#C50B31] cursor-not-allowed"
            )}
          >
            Upload
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  branchCode,
}) => {
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
          Are you sure you want to delete branch{" "}
          <span className="font-semibold">{branchCode}</span>?
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
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

// Customer Branch Wise Dropdown Component - UPDATED with TableWithCheckboxEditDelete
const CustomerBranchWiseDropdown = ({
  isOpen,
  onClose,
  branches,
  server,
  currentBranchCode,
  onUpdate,
  showNotification,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
    trigger,
  } = useForm();

  const [tableData, setTableData] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const selectedBranch = watch("branch");
  const selectedCustomer = watch("customer");

  // Fetch all customer accounts from database
  useEffect(() => {
    const fetchCustomerAccounts = async () => {
      try {
        const response = await axios.get(`${server}/customer-account`);
        if (response.status === 200) {
          setCustomerAccounts(response.data);
        }
      } catch (error) {
        console.error("Error fetching customer accounts:", error);
      }
    };

    if (isOpen) {
      fetchCustomerAccounts();
    }
  }, [isOpen, server]);

  // Fetch existing branch assignments for current branch
  useEffect(() => {
    const fetchBranchData = async () => {
      if (!selectedBranch) return;

      try {
        setLoading(true);
        // Fetch all accounts and filter by selectedBranch
        const response = await axios.get(`${server}/customer-account`);
        if (response.status === 200) {
          const filteredAccounts = response.data.filter(
            (account) => account.selectedBranch === selectedBranch
          );
          const formattedData = filteredAccounts.map((account, index) => ({
            id: index,
            branchName: account.selectedBranch,
            accountCode: account.accountCode,
            name: account.name,
            _id: account._id,
          }));
          setTableData(formattedData);
          setSelectedRows([]); // Reset selected rows when data changes
        }
      } catch (error) {
        console.error("Error fetching branch data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && selectedBranch) {
      fetchBranchData();
    }
  }, [isOpen, selectedBranch, server]);

  // Set default branch when modal opens
  useEffect(() => {
    if (isOpen && currentBranchCode) {
      setValue("branch", currentBranchCode);
    }
  }, [isOpen, currentBranchCode, setValue]);

  // Auto-populate customer name when account code is entered
  useEffect(() => {
    if (selectedCustomer) {
      const matchedCustomer = customerAccounts.find(
        (acc) =>
          acc.accountCode.toLowerCase() === selectedCustomer.toLowerCase()
      );
      if (matchedCustomer) {
        setValue("clientName", matchedCustomer.name);
      } else {
        setValue("clientName", "");
      }
    }
  }, [selectedCustomer, customerAccounts, setValue]);

  // Only show existing branches (from branches array)
  const availableBranches = useMemo(() => {
    return branches.filter((branch) => branch && branch.trim() !== "");
  }, [branches]);

  // Handle select/deselect all rows
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(tableData.map((row) => row.id));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle select/deselect single row
  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    }
  };

  // Handle edit row from table
  const handleEditRow = (index) => {
    const rowToEdit = tableData[index];
    if (!rowToEdit) return;

    setEditMode(true);
    setEditingRowIndex(index);
    setValue("customer", rowToEdit.accountCode);
    setValue("clientName", rowToEdit.name);
    setValue("branch", rowToEdit.branchName);

    showNotification(
      "info",
      `Editing ${rowToEdit.accountCode} - ${rowToEdit.name}`
    );
  };

  // Handle delete row from table
  const handleDeleteRow = async (index) => {
    const rowToDelete = tableData[index];
    if (!rowToDelete) return;

    if (
      !window.confirm(
        `Are you sure you want to remove ${rowToDelete.accountCode} from branch ${rowToDelete.branchName}?`
      )
    ) {
      return;
    }

    await performDelete(rowToDelete);
  };

  // Perform actual deletion
  const performDelete = async (rowToDelete) => {
    try {
      // Find the full customer account data
      const customerAccount = customerAccounts.find(
        (acc) => acc.accountCode === rowToDelete.accountCode
      );

      if (!customerAccount) {
        showNotification("error", "Customer account not found");
        return;
      }

      // Update the customer account to remove selected branch
      const updatePayload = {
        ...customerAccount,
        selectedBranch: "",
      };

      const response = await axios.put(
        `${server}/customer-account`,
        updatePayload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        // Remove from table
        const updatedTableData = tableData.filter(
          (item) => item._id !== rowToDelete._id
        );
        setTableData(updatedTableData);

        // Notify parent component
        if (onUpdate) {
          onUpdate();
        }

        showNotification("success", "Branch assignment removed successfully");
      }
    } catch (error) {
      console.error("Error removing branch assignment:", error);
      showNotification(
        "error",
        "Failed to remove branch assignment: " +
          (error.response?.data?.details || error.message)
      );
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRows.length === 0) {
      showNotification("warning", "Please select rows to delete");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedRows.length} selected row(s)?`
      )
    ) {
      return;
    }

    // Delete selected rows
    selectedRows.forEach((rowId) => {
      const rowToDelete = tableData.find((row) => row.id === rowId);
      if (rowToDelete) {
        performDelete(rowToDelete);
      }
    });

    setSelectedRows([]);
  };

  const onAdd = async (data) => {
    if (!data.branch || !data.customer || !data.clientName) {
      showNotification("error", "Please fill all required fields");
      return;
    }

    try {
      // Check if selected branch exists
      if (!availableBranches.includes(data.branch)) {
        showNotification("error", "Selected branch does not exist");
        return;
      }

      // Find the customer account
      const customerAccount = customerAccounts.find(
        (acc) => acc.accountCode.toLowerCase() === data.customer.toLowerCase()
      );

      if (!customerAccount) {
        showNotification("error", "Customer account not found");
        return;
      }

      // Check if already assigned to this branch
      const alreadyExists = tableData.some(
        (item) => item.accountCode.toLowerCase() === data.customer.toLowerCase()
      );

      if (alreadyExists) {
        showNotification(
          "error",
          "This customer is already assigned to this branch"
        );
        return;
      }

      // Update the customer account with selected branch
      const updatePayload = {
        ...customerAccount,
        selectedBranch: data.branch,
      };

      const response = await axios.put(
        `${server}/customer-account`,
        updatePayload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        // Add to table
        const newEntry = {
          id: tableData.length,
          branchName: data.branch,
          accountCode: data.customer,
          name: data.clientName,
          _id: customerAccount._id,
        };
        setTableData([...tableData, newEntry]);

        // Reset form fields after adding
        setValue("customer", "");
        setValue("clientName", "");

        // Notify parent component
        if (onUpdate) {
          onUpdate();
        }

        showNotification("success", "Branch assigned successfully");
      }
    } catch (error) {
      console.error("Error assigning branch:", error);
      showNotification(
        "error",
        "Failed to assign branch: " +
          (error.response?.data?.details || error.message)
      );
    }
  };

  // Handle update
  const handleUpdateRow = async (data) => {
    if (
      !data.branch ||
      !data.customer ||
      !data.clientName ||
      editingRowIndex === null
    ) {
      showNotification("error", "Please fill all required fields");
      return;
    }

    const rowToUpdate = tableData[editingRowIndex];
    if (!rowToUpdate) return;

    try {
      // Check if selected branch exists
      if (!availableBranches.includes(data.branch)) {
        showNotification("error", "Selected branch does not exist");
        return;
      }

      // Find the customer account
      const customerAccount = customerAccounts.find(
        (acc) =>
          acc.accountCode.toLowerCase() === rowToUpdate.accountCode.toLowerCase()
      );

      if (!customerAccount) {
        showNotification("error", "Customer account not found");
        return;
      }

      // Update the customer account with selected branch
      const updatePayload = {
        ...customerAccount,
        selectedBranch: data.branch,
      };

      const response = await axios.put(
        `${server}/customer-account`,
        updatePayload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        // Update table row
        const updatedTableData = [...tableData];
        updatedTableData[editingRowIndex] = {
          ...updatedTableData[editingRowIndex],
          branchName: data.branch,
          accountCode: data.customer,
          name: data.clientName,
        };
        setTableData(updatedTableData);

        // Reset edit mode
        setEditMode(false);
        setEditingRowIndex(null);
        reset({
          customer: "",
          clientName: "",
          branch: selectedBranch,
        });

        // Notify parent component
        if (onUpdate) {
          onUpdate();
        }

        showNotification("success", "Branch assignment updated successfully");
      }
    } catch (error) {
      console.error("Error updating branch assignment:", error);
      showNotification(
        "error",
        "Failed to update branch assignment: " +
          (error.response?.data?.details || error.message)
      );
    }
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditMode(false);
    setEditingRowIndex(null);
    reset({
      customer: "",
      clientName: "",
      branch: selectedBranch,
    });
    showNotification("info", "Edit cancelled");
  };

  // Handle bulk upload
  const handleBulkUpload = async (file) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let errorCount = 0;

      for (const row of jsonData) {
        try {
          const branchName = row["Branch Name"] || row["branchName"];
          const clientCode = row["Client Code"] || row["clientCode"];
          const clientName = row["Client Name"] || row["clientName"];

          if (!branchName || !clientCode || !clientName) {
            errorCount++;
            continue;
          }

          // Check if branch exists
          if (!availableBranches.includes(branchName)) {
            errorCount++;
            showNotification(
              "warning",
              `Branch ${branchName} does not exist - skipped`
            );
            continue;
          }

          const customerAccount = customerAccounts.find(
            (acc) => acc.accountCode.toLowerCase() === clientCode.toLowerCase()
          );

          if (!customerAccount) {
            errorCount++;
            continue;
          }

          const updatePayload = {
            ...customerAccount,
            selectedBranch: branchName,
          };

          await axios.put(`${server}/customer-account`, updatePayload, {
            headers: { "Content-Type": "application/json" },
          });

          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      // Refresh table data
      const response = await axios.get(`${server}/customer-account`);
      if (response.status === 200) {
        const filteredAccounts = response.data.filter(
          (account) => account.selectedBranch === selectedBranch
        );
        const formattedData = filteredAccounts.map((account, index) => ({
          id: index,
          branchName: account.selectedBranch,
          accountCode: account.accountCode,
          name: account.name,
          _id: account._id,
        }));
        setTableData(formattedData);
      }

      if (onUpdate) {
        onUpdate();
      }

      showNotification(
        "success",
        `Bulk upload completed: ${successCount} successful, ${errorCount} failed`
      );
    } catch (error) {
      console.error("Error processing bulk upload:", error);
      showNotification("error", "Failed to process bulk upload file");
    }
  };

  // Define table columns
  const tableColumns = useMemo(
    () => [
      { key: "branchName", label: "Branch Name" },
      { key: "accountCode", label: "Client Code" },
      { key: "name", label: "Client Name" },
    ],
    []
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-red-600">
            Customer Branch Wise {editMode ? "(Editing)" : ""}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Input Fields */}
          <div className="flex gap-3 items-end">
            <LabeledDropdown
              options={availableBranches}
              register={register}
              setValue={setValue}
              title="Selected Branch"
              value="branch"
              defaultValue={currentBranchCode || ""}
              disabled={editMode} // Disable branch selection during edit
            />

            <InputBox
              placeholder="Customer Code"
              register={register}
              setValue={setValue}
              value="customer"
              error={errors.customer}
              trigger={trigger}
              validation={{ required: "Customer is required" }}
              initialValue={selectedCustomer || ""}
              disabled={editMode} // Disable customer code during edit
            />

            <DummyInputBoxWithLabelDarkGray
              label="Name"
              register={register}
              setValue={setValue}
              value="clientName"
              disabled={true}
            />

            {editMode ? (
              <div className="flex gap-2">
                <OutlinedButtonRed
                  label="Update"
                  onClick={handleSubmit(handleUpdateRow)}
                  className="w-[100px]"
                />
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <OutlinedButtonRed
                label="Add"
                onClick={handleSubmit(onAdd)}
                className="w-[25%]"
              />
            )}

            <button
              type="button"
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <img
                src="/bulk-upload.svg"
                alt="Bulk Upload"
                className="w-20 h-6"
              />
            </button>
          </div>

          {/* Table with checkbox, edit, delete functionality */}
          <div className="mt-4">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : (
              <>
                {/* Bulk delete button for selected rows */}
                {selectedRows.length > 0 && (
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                    >
                      Delete Selected ({selectedRows.length})
                    </button>
                  </div>
                )}

                <TableWithCheckboxEditDelete
                  register={register}
                  setValue={setValue}
                  name="customerBranchWiseTable"
                  columns={tableColumns}
                  rowData={tableData}
                  handleEdit={handleEditRow}
                  handleDelete={handleDeleteRow}
                  disableActions={false}
                  selectedRows={selectedRows}
                  onSelectAll={handleSelectAll}
                  onSelectRow={handleSelectRow}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          onClose={() => setShowBulkUpload(false)}
          onFileUpload={handleBulkUpload}
          title="Bulk Upload Customer Branch"
        />
      )}
    </div>
  );
};

// Main BranchMaster Component
function BranchMaster() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
    trigger,
  } = useForm();

  const { selectedBranch, setSelectedBranch } = useContext(BranchContext);

  const {
    countries,
    states,
    cities,
    server,
    refetch,
    setRefetch,
    setToggleCodeList,
    setCodeListConfig,
  } = useContext(GlobalContext);

  const [dataUpdate, setDataUpdate] = useState(false);
  const [data, setData] = useState([]);
  const [added, setAdded] = useState(false);
  const [addButton, setAddButton] = useState(false);
  const [editButton, setEditButton] = useState(true);
  const [deleteButton, setDeleteButton] = useState(true);
  const [disabledInput, setDisabledInput] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCustomerBranchWise, setShowCustomerBranchWise] = useState(false);

  // Notification state structure
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const code = watch("code");

  // Helper function to show notifications
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  // Bulk upload handler
  const handleBulkUpload = () => {
    console.log("Bulk upload functionality to be implemented");
  };

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        const response = await axios.get(`${server}/branch-master`);
        if (response.status === 200) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranch();
  }, [dataUpdate, added, server]);

  useEffect(() => {
    if (!code || code.trim() === "") {
      setAddButton(true);
      setEditButton(true);
      setDeleteButton(true);
      return;
    }

    const matched = data.find(
      (b) => b.code.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      // Fill form values
      Object.keys(matched).forEach((key) => {
        if (matched[key] !== undefined) setValue(key, matched[key]);
      });

      setAddButton(true); // disable Add
      setEditButton(false); // enable Edit
      setDeleteButton(false); // enable Delete
      setDisabledInput(true);
    } else {
      reset({ code }); // clear form except code
      setAddButton(false); // enable Add
      setEditButton(true); // disable Edit
      setDeleteButton(true); // disable Delete
      setDisabledInput(false);
      selectedRef();
    }
  }, [code, data]);

  const onSubmit = async (formData) => {
    try {
      const response = await axios.post(`${server}/branch-master`, formData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Branch added:", response.data);
      showNotification("success", "New Branch Added Successfully");
      setDataUpdate(!dataUpdate);
      setAdded(!added);
      setRefetch(!refetch);
    } catch (error) {
      console.error("Add failed:", error);
      showNotification("error", "Branch data add failed!");
    }
  };

  const handleUpdate = async (formData) => {
    const matched = data.find(
      (b) => b.code.toLowerCase() === formData.code.toLowerCase()
    );
    if (!matched) return;

    try {
      const response = await axios.put(
        `${server}/branch-master?id=${matched._id}`,
        formData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Branch updated:", response.data);
      setDisabledInput(true);
      showNotification(
        "success",
        `${formData.code} has been Updated Successfully`
      );
      setDataUpdate(!dataUpdate);
      setAdded(!added);
      setRefetch(!refetch);
    } catch (error) {
      console.error("Update failed:", error);
      showNotification("error", "Branch data update failed!");
    }
  };

  const handleEditButton = (data) => {
    if (!editing) {
      setDisabledInput(false);
      setEditing(true);
    } else {
      setEditing(false);
      handleUpdate(data);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async (e) => {
    // Prevent form submission
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const matched = data.find(
      (b) => b.code.toLowerCase() === code?.toLowerCase()
    );
    if (!matched) {
      setShowDeleteModal(false);
      return;
    }

    try {
      const response = await axios.delete(`${server}/branch-master`, {
        params: { code: matched.code },
      });
      console.log("Branch deleted:", response);

      // Close modal first
      setShowDeleteModal(false);

      // Reset form and state
      reset();
      setDisabledInput(false);
      setEditing(false);
      setAddButton(true);
      setEditButton(true);
      setDeleteButton(true);

      // Update data
      setDataUpdate(!dataUpdate);
      setAdded(!added);
      setRefetch(!refetch);

      // Show notification last
      showNotification(
        "success",
        `${matched.code} has been Deleted Successfully`
      );
    } catch (error) {
      console.error("Delete failed:", error);
      setShowDeleteModal(false);
      showNotification("error", "Branch data delete failed!");
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleRefresh = () => {
    setAdded(!added);
    setRefetch(!refetch);
  };

  const selectedRef = () => {
    setValue("companyName", "");
    setValue("addressLine1", "");
    setValue("addressLine2", "");
    setValue("pincode", "");
    setValue("city", "");
    setValue("state", "");
    setValue("country", "");
    setValue("managerName", "");
    setValue("emailId", "");
    setValue("telephone", "");
    setValue("panNo", "");
    setValue("serviceTax", "");
    setValue("cinNo", "");
  };

  const columns = useMemo(
    () => [
      { key: "code", label: "Code" },
      { key: "companyName", label: "Company Name" },
    ],
    []
  );

  // Get only valid branches (non-empty)
  const branches = useMemo(() => {
    return data
      .map((b) => b.code)
      .filter((branch) => branch && branch.trim() !== "");
  }, [data]);

  const openCodeList = () => {
    setCodeListConfig({
      data,
      columns,
      name: "Branch Master",
      handleAction: (action, rowData) => {
        if (action === "edit") {
          setValue("code", rowData.code);
          setSelectedBranch(rowData);
          setToggleCodeList(false);
        } else if (action === "delete") {
          setValue("code", rowData.code);
          handleDeleteClick();
        }
      },
    });

    setToggleCodeList(true);
  };

  return (
    <>
      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        <Heading
          title={"Branch Master"}
          onRefresh={handleRefresh}
          bulkUploadBtn=""
          onBulkUpload={handleBulkUpload}
          onClickCodeList={openCodeList}
        />

        <div className="flex justify-end items-center">
          <div className="flex gap-3">
            <AddButton disabled={addButton} onClick={handleSubmit(onSubmit)} />
            <EditButton
              disabled={editButton}
              onClick={handleSubmit(handleEditButton)}
              label={editing ? "Update" : "Edit"}
            />
            <DeleteButton disabled={deleteButton} onClick={handleDeleteClick} />
          </div>
        </div>

        {/* Form Section */}
        <div className="flex flex-col gap-3">
          <div className="font-semibold text-red-600 text-sm">
            <RedLabelHeading label={`Branch Details`} />{" "}
          </div>

          <div className="flex gap-3">
            <div className="w-[180px]">
              <InputBox
                resetFactor={added}
                placeholder="Code"
                register={register}
                setValue={setValue}
                initialValue={selectedBranch?.code || ""}
                value="code"
                error={errors.code}
                trigger={trigger}
                validation={{ required: "Code is required" }}
              />
            </div>
            <InputBox
              resetFactor={added}
              placeholder="Company Name"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="companyName"
              error={errors.companyName}
              trigger={trigger}
              validation={{ required: "Company Name is required" }}
              initialValue={watch("companyName") || ""}
            />
          </div>

          <div className="flex gap-3">
            <InputBox
              resetFactor={added}
              placeholder="Address Line 1"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="addressLine1"
              error={errors.addressLine1}
              trigger={trigger}
              validation={{ required: "Address Line 1 is required" }}
              initialValue={watch("addressLine1") || ""}
            />
            <InputBox
              resetFactor={added}
              placeholder="Address Line 2"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="addressLine2"
              error={errors.addressLine2}
              trigger={trigger}
              validation={{ required: "Address Line 2 is required" }}
              initialValue={watch("addressLine2") || ""}
            />
          </div>

          <div className="flex gap-3">
            <InputBox
              resetFactor={added}
              placeholder="Pincode"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="pincode"
              error={errors.pincode}
              trigger={trigger}
              validation={{
                required: "Pincode is required",
                pattern: {
                  value: /^[0-9]{6}$/,
                  message: "Enter a valid 6-digit pincode",
                },
              }}
              initialValue={watch("pincode") || ""}
            />
            <LabeledDropdown
              resetFactor={added}
              options={cities.map((c) => c.name)}
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="city"
              title="City"
              error={errors.city}
              trigger={trigger}
              validation={{ required: "City is required" }}
              defaultValue={watch("city") || ""}
            />
          </div>

          <div className="flex gap-3">
            <LabeledDropdown
              resetFactor={added}
              options={states.map((s) => s.name)}
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="state"
              title="State"
              error={errors.state}
              trigger={trigger}
              validation={{ required: "State is required" }}
              defaultValue={watch("state") || ""}
            />
            <LabeledDropdown
              resetFactor={added}
              options={countries.map((c) => c.name)}
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="country"
              title="Country"
              error={errors.country}
              trigger={trigger}
              validation={{ required: "Country is required" }}
              defaultValue={watch("country") || ""}
            />
          </div>
        </div>

        {/* Manager Info */}
        <div className="flex flex-col gap-3">
          <div className="font-semibold text-red-600 text-sm">
            <RedLabelHeading label={`Branch Manager`} />
          </div>

          <InputBox
            resetFactor={added}
            placeholder="Manager Name"
            register={register}
            setValue={setValue}
            disabled={disabledInput}
            value="managerName"
            error={errors.managerName}
            trigger={trigger}
            validation={{ required: "Manager Name is required" }}
            initialValue={watch("managerName") || ""}
          />

          <div className="flex gap-3">
            <InputBox
              resetFactor={added}
              placeholder="Email ID"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="emailId"
              error={errors.emailId}
              trigger={trigger}
              validation={{
                required: "Email ID is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email format",
                },
              }}
              initialValue={watch("emailId") || ""}
            />
            <InputBox
              resetFactor={added}
              placeholder="Mobile No"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="telephone"
              error={errors.telephone}
              trigger={trigger}
              validation={{
                required: "Mobile number is required",
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: "Enter a valid 10-digit number",
                },
              }}
              initialValue={watch("telephone") || ""}
            />
          </div>

          <div className="flex gap-3">
            <InputBox
              resetFactor={added}
              placeholder="PAN No"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="panNo"
              initialValue={watch("panNo") || ""}
            />
            <InputBox
              resetFactor={added}
              placeholder="Service Tax No"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="serviceTax"
              initialValue={watch("serviceTax") || ""}
            />
          </div>
          <div className="flex gap-3">
            <InputBox
              resetFactor={added}
              placeholder="CIN No"
              register={register}
              setValue={setValue}
              disabled={disabledInput}
              value="cinNo"
              initialValue={watch("cinNo") || ""}
            />
          </div>
        </div>

        {/* Customer Branch Wise Section */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowCustomerBranchWise(!showCustomerBranchWise)}
            className="flex items-center justify-between font-semibold text-red-600 text-sm py-2 px-3 bg-gray-200 rounded hover:bg-gray-300 transition-colors h-12"
          >
            <span>Customer Branch Wise</span>
            {showCustomerBranchWise ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        branchCode={code}
      />

      {/* Customer Branch Wise Dropdown with TableWithCheckboxEditDelete */}
      <CustomerBranchWiseDropdown
        isOpen={showCustomerBranchWise}
        onClose={() => setShowCustomerBranchWise(false)}
        branches={branches}
        server={server}
        currentBranchCode={code}
        onUpdate={() => {
          // Refresh data after update
          setDataUpdate(!dataUpdate);
          setRefetch(!refetch);
        }}
        showNotification={showNotification}
      />

      {/* Notification Flag */}
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
    </>
  );
}

export default BranchMaster;