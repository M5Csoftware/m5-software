"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading from "@/app/components/Heading";
import InputBox, { SearchInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import React, { useState, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useAuth } from "@/app/Context/AuthContext";
import NotificationFlag from "@/app/components/Notificationflag";
import { format } from "date-fns";

const RegisterComplaint = ({ setRegisterComplaint, initialAwbNo = "" }) => {
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setError,
    clearErrors,
    reset,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      date: new Date(),
    },
  });

  const [rowData, setRowData] = useState([]);
  const [resetFactor, setResetFactor] = useState(false);
  const [resetComplaintRemark, setResetComplaintRemark] = useState(false);
  const [resetReassign, setResetReassign] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const [registeredComplaint, setRegisteredComplaint] = useState(null);
  const [date, setDate] = useState(new Date());
  const [displayDate, setDisplayDate] = useState("");
  const [complainNo, setComplaintNo] = useState("");
  const [complaintID, setComplaintID] = useState("");
  const { server } = useContext(GlobalContext);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [manualSearch, setManualSearch] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

  const awbNo = watch("awbNo");

  const formatDDMMYYYY = (value) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("en-GB");
  };

  // Set initial AWB number from props
  useEffect(() => {
    if (initialAwbNo && initialAwbNo.trim() !== "") {
      setValue("awbNo", initialAwbNo);
      trigger("awbNo");
    }
  }, [initialAwbNo, setValue, trigger]);

  const onSubmit = async (data) => {
    try {
      let response;
      if (registeredComplaint) {
        const payload = {
          awbNo: registeredComplaint.awbNo,
          complaintRemark: watch("complaintRemark"),
          actionUser: watch("actionUser") || user?.userId,
        };
        response = await axios.put(`${server}/register-complaint`, payload);
        setValue("complaintRemark", "");
        setResetComplaintRemark(!resetComplaintRemark);
      } else {
        const submitData = {
          ...data,
          date: displayDate,
        };
        response = await axios.post(`${server}/register-complaint`, submitData);
      }

      const complaintData = response.data.complaint;
      if (complaintData.date) {
        complaintData.date = formatDDMMYYYY(complaintData.date);
      }

      setRegisteredComplaint(complaintData);
      showNotification("success", "Complaint registered successfully!");
    } catch (error) {
      console.error("Error submitting data:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Error registering complaint. Please try again.";
      showNotification("error", errorMsg);
    }
  };

  const handleCloseComplaint = async () => {
    try {
      if (!registeredComplaint) {
        showNotification("error", "No complaint selected to close.");
        return;
      }

      const payload = {
        awbNo: registeredComplaint.awbNo,
        closeRemark: watch("closeRemark"),
        actionUser: watch("actionUser") || user?.userId,
      };

      const response = await axios.put(
        `${server}/register-complaint/close`,
        payload,
      );

      if (response.data.success) {
        const complaintData = response.data.complaint;
        if (complaintData.date) {
          complaintData.date = formatDDMMYYYY(complaintData.date);
        }
        setRegisteredComplaint(complaintData);
        showNotification("success", "Complaint closed successfully!");
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to close complaint.",
        );
      }
    } catch (error) {
      console.error("Error closing complaint:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Error closing complaint. Please try again.";
      showNotification("error", errorMsg);
    }
  };

  const handleReopenComplaint = async () => {
    try {
      if (!registeredComplaint) {
        showNotification("error", "No complaint selected to reopen.");
        return;
      }

      const payload = {
        awbNo: registeredComplaint.awbNo,
        actionUser: watch("actionUser") || user?.userId,
      };

      const response = await axios.put(
        `${server}/register-complaint/reopen`,
        payload,
      );

      if (response.data.success) {
        const complaintData = response.data.complaint;
        if (complaintData.date) {
          complaintData.date = formatDDMMYYYY(complaintData.date);
        }
        setRegisteredComplaint(complaintData);
        showNotification("success", "Complaint reopened successfully!");
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to reopen complaint.",
        );
      }
    } catch (error) {
      console.error("Error reopening complaint:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Error reopening complaint. Please try again.";
      showNotification("error", errorMsg);
    }
  };

  const handleReassign = async () => {
    try {
      if (!registeredComplaint) {
        showNotification("error", "No complaint selected to reassign.");
        return;
      }

      const payload = {
        awbNo: registeredComplaint.awbNo,
        assignTo: watch("reAssignTo"),
        actionUser: watch("actionUser") || user?.userId,
      };

      if (!payload.assignTo) {
        showNotification(
          "error",
          "Please select a user to reassign the complaint.",
        );
        return;
      }

      const response = await axios.put(
        `${server}/register-complaint/reassign`,
        payload,
      );

      if (response.data.success) {
        const complaintData = response.data.complaint;
        if (complaintData.date) {
          complaintData.date = formatDDMMYYYY(complaintData.date);
        }
        setRegisteredComplaint(complaintData);
        showNotification(
          "success",
          `Complaint reassigned to ${payload.assignTo} successfully!`,
        );
        setValue("reAssignTo", "");
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to reassign complaint.",
        );
      }
    } catch (error) {
      console.error("Error reassigning complaint:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Error reassigning complaint. Please try again.";
      showNotification("error", errorMsg);
    }
  };

  const handlePrioritize = async () => {
    try {
      if (!registeredComplaint) {
        showNotification("error", "No complaint selected to prioritize.");
        return;
      }

      const payload = {
        awbNo: registeredComplaint.awbNo,
        actionUser: watch("actionUser") || user?.userId,
      };

      const response = await axios.put(
        `${server}/register-complaint/prioritize`,
        payload,
      );

      if (response.data.success) {
        const complaintData = response.data.complaint;
        if (complaintData.date) {
          complaintData.date = formatDDMMYYYY(complaintData.date);
        }
        setRegisteredComplaint(complaintData);
        showNotification("success", "Complaint prioritized successfully!");
      } else {
        showNotification(
          "error",
          response.data.message || "Failed to prioritize complaint.",
        );
      }
    } catch (error) {
      console.error("Error prioritizing complaint:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Error prioritizing complaint. Please try again.";
      showNotification("error", errorMsg);
    }
  };

  useEffect(() => {
    if (!awbNo || manualSearch) {
      return;
    }

    const checkAwbNo = async () => {
      const regex = /^[A-Z]{1,3}\d{6,}$/i;

      if (!regex.test(awbNo)) {
        setError("awbNo", {
          type: "manual",
          message:
            "Invalid AWB format. Use 1-3 letters followed by 6+ digits (e.g., ABC123456)",
        });
        setResetFactor(!resetFactor);
        return;
      } else {
        clearErrors("awbNo");
      }

      try {
        await axios.get(
          `${server}/portal/get-shipments?awbNo=${awbNo.toUpperCase()}`,
        );
      } catch (error) {
        console.error("Error fetching AWB details:", error);
        setRegisteredComplaint(null);
      }

      try {
        const response = await axios.get(
          `${server}/register-complaint/get-complaint-by-awb?awbNo=${awbNo}`,
        );

        const complaintData = response.data.complaint;

        if (complaintData.date) {
          complaintData.date = formatDDMMYYYY(complaintData.date);
        }

        setRegisteredComplaint(complaintData);
      } catch (error) {
        console.error("Error fetching registered complaint:", error);
        setRegisteredComplaint(null);
      }
    };

    checkAwbNo();
  }, [awbNo, manualSearch, server]);

  useEffect(() => {
    setValue("actionUser", user?.userId);
    if (registeredComplaint) {
      setValue("complaintNo", registeredComplaint?.complaintNo || "");
      setValue("complaintID", registeredComplaint?.complaintID || "");

      setDisplayDate(registeredComplaint?.date || formatDDMMYYYY(new Date()));
      setValue("date", registeredComplaint?.date || formatDDMMYYYY(new Date()));

      setValue("status", registeredComplaint?.status || "Open");
      setValue("complaintSource", registeredComplaint?.complaintSource || "");
      setValue("caseType", registeredComplaint?.caseType || "");
      setValue("complaintType", registeredComplaint?.complaintType || "");
      setValue(
        "assignTo",
        registeredComplaint?.assignTo || `${user?.userId} - ${user?.userName}`,
      );

      const formattedHistory = (registeredComplaint.history || []).map((h) => {
        let dateStr = "-";
        let timeStr = "-";

        if (h.date) {
          try {
            const parsedDate = new Date(h.date);

            if (!isNaN(parsedDate.getTime())) {
              dateStr = parsedDate.toLocaleDateString("en-GB");
              timeStr = format(parsedDate, "HH:mm:ss");
            }
          } catch (e) {
            console.error("Failed to parse date:", h.date, e);
          }
        }

        return {
          action: h.action || "",
          complaintDate: dateStr,
          time: timeStr,
          actionUser: h.actionUser || "",
        };
      });

      setRowData(formattedHistory);

      setDate(new Date(registeredComplaint?.date));
      setComplaintNo(registeredComplaint?.complaintNo);
      setComplaintID(registeredComplaint?.complaintID);
    } else {
      setValue("complaintType", "");
      setValue("complaintNo", "");
      setValue("complaintID", "");

      const currentDate = new Date();
      const formattedCurrentDate = formatDDMMYYYY(currentDate);
      setDisplayDate(formattedCurrentDate);
      setValue("date", formattedCurrentDate);

      setValue("status", "Open");
      setValue("complaintSource", "");
      setValue("caseType", "");
      setRowData([]);
      setDate(new Date());
      setComplaintNo("");
      setComplaintID("");
      setValue("assignTo", `${user?.userId} - ${user?.userName}`);
      setValue("complaintType", []);
    }
  }, [registeredComplaint]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `${server}/employee-master/employees?department=Customer Support`,
        );

        const formattedEmployees = response.data.data.map(
          (emp) => `${emp.userId} - ${emp.userName}`,
        );

        setEmployees(formattedEmployees);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  const columns = [
    { key: "action", label: "Action" },
    { key: "complaintDate", label: "Date" },
    { key: "time", label: "Time" },
    { key: "actionUser", label: "Action User" },
  ];

  const handleRefresh = () => {
    setFormKey((prev) => prev + 1);
    setResetReassign(!resetReassign);
    setResetFactor(!resetFactor);
    setResetComplaintRemark(!resetComplaintRemark);
    reset();

    const currentDate = new Date();
    const formattedCurrentDate = formatDDMMYYYY(currentDate);

    setValue("actionUser", user?.userId);
    setValue("closeRemark", "");
    setValue("status", "Open");
    setValue("complaintSource", "");
    setValue("caseType", "");
    setValue("complaintType", "");
    setValue("assignTo", "");
    setValue("reAssignTo", "");
    setValue("complaintRemark", "");
    setValue("awbNo", "");

    setDate(currentDate);
    setDisplayDate(formattedCurrentDate);
    setComplaintNo("");
    setComplaintID("");
    setRowData([]);
    setRegisteredComplaint(null);
    setSearchTerm("");
    setManualSearch(false);

    showNotification("success", "Form refreshed successfully");
    clearErrors();
  };

  const handleSearch = async () => {
    if (!searchTerm)
      return showNotification("error", "Enter Complaint No or ID to search");

    try {
      const response = await axios.get(
        `${server}/register-complaint/search?complaintNo=${searchTerm}&complaintID=${searchTerm}`,
      );
      if (response.data.success) {
        setManualSearch(true);
        setValue("awbNo", response.data.complaint.awbNo);

        const complaintData = response.data.complaint;
        if (complaintData.date) {
          complaintData.date = formatDDMMYYYY(complaintData.date);
        }
        setRegisteredComplaint(complaintData);

        if (trigger) {
          await trigger("awbNo");
        }

        setManualSearch(false);
        showNotification("success", "Complaint found successfully");
      }
    } catch (err) {
      showNotification("error", "Complaint not found!");
      setValue("awbNo", "");
      setRegisteredComplaint(null);
      setManualSearch(false);
    }
  };

  const handleBack = () => {
    setRegisterComplaint(false);
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={handleSubmit(onSubmit)}
      key={formKey}
    >
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={handleBack}
          className="text-red-500 hover:text-red-700 flex items-center gap-2 px-4 py-2 rounded-md border border-red-500 hover:bg-red-50 transition-colors"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
      </div>
      <Heading
        title="Register Complaint"
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
      />
      <div className="w-[150px]"></div>

      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <div className="flex flex-col gap-3">
        <div className="font-semibold text-red text-sm">Complaint Details</div>
        <div className="flex gap-9">
          <div className="flex flex-col gap-3 w-full">
            <div className="flex gap-2">
              <InputBox
                key={`awbNo-${formKey}`}
                placeholder="Airwaybill Number"
                register={register}
                setValue={setValue}
                resetFactor={resetReassign}
                value="awbNo"
                error={errors.awbNo}
                validation={{
                  required: "AWB No is required",
                }}
                initialValue={watch("awbNo")}
                trigger={trigger}
              />
            </div>
          </div>
          <div className="flex gap-2 w-full">
            <DummyInputBoxWithLabelDarkGray
              key={`complaintNo-${formKey}`}
              label="Complaint Number"
              register={register}
              setValue={setValue}
              value="complaintNo"
              inputValue={complainNo}
              resetFactor={resetFactor}
              reset={reset}
            />
            <DummyInputBoxWithLabelDarkGray
              key={`complaintID-${formKey}`}
              label="Complaint ID"
              register={register}
              setValue={setValue}
              value="complaintID"
              inputValue={complaintID}
              resetFactor={resetFactor}
              reset={reset}
            />
            <DummyInputBoxWithLabelDarkGray
              key={`date-${formKey}`}
              register={register}
              setValue={setValue}
              value={"date"}
              label="Date"
              inputValue={displayDate}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-9">
        <div className="w-full flex flex-col gap-3">
          <div className="font-semibold text-red text-sm">
            Complaint Details
          </div>
          <div className="flex flex-col gap-4">
            <LabeledDropdown
              key={`complaintType-${formKey}`}
              options={["High-Priority", "Priority", "Regular"]}
              register={register}
              setValue={setValue}
              title="Complaint Type"
              value="complaintType"
              error={errors.complaintType}
              defaultValue={registeredComplaint?.complaintType || ""}
              validation={{
                required: "Complaint type is required",
              }}
              trigger={trigger}
              disabled={registeredComplaint !== null}
              resetFactor={resetFactor}
            />
            <LabeledDropdown
              key={`complaintSource-${formKey}`}
              options={["Telephone", "Email", "WhatsApp"]}
              register={register}
              setValue={setValue}
              title="Complaint Source"
              value="complaintSource"
              error={errors.complaintSource}
              defaultValue={registeredComplaint?.complaintSource || ""}
              validation={{
                required: "Complaint source is required",
              }}
              trigger={trigger}
              disabled={registeredComplaint !== null}
              resetFactor={resetFactor}
            />
            <LabeledDropdown
              key={`caseType-${formKey}`}
              options={[
                "ADDRESS QUERY",
                "CNEE NOT AVAILABLE",
                "WRONG DELIVERY",
                "NEED FWB NUMBER",
                "SHORT DELIVERY",
                "NOT CONNECTED CASES",
                "LOST PARCELS",
              ]}
              register={register}
              setValue={setValue}
              title="Case Type"
              value="caseType"
              error={errors.caseType}
              defaultValue={registeredComplaint?.caseType || ""}
              validation={{
                required: "Case type is required",
              }}
              trigger={trigger}
              disabled={registeredComplaint !== null}
              resetFactor={resetFactor}
            />
            <LabeledDropdown
              key={`assignTo-${formKey}`}
              options={employees}
              register={register}
              setValue={setValue}
              title="Assign To"
              value="assignTo"
              defaultValue={registeredComplaint?.assignTo || watch("assignTo")}
              error={errors.assignTo}
              validation={{
                required: "Assign to is required",
              }}
              trigger={trigger}
              disabled={registeredComplaint !== null}
              resetFactor={resetFactor}
            />
            <div className="flex gap-2 w-full">
              <LabeledDropdown
                key={`status-${formKey}`}
                options={["Open", "Close", "Process Claim", "Claim Processed"]}
                register={register}
                setValue={setValue}
                title="Status"
                value="status"
                defaultValue={registeredComplaint?.status || "Open"}
                trigger={trigger}
                disabled
                resetFactor={resetFactor}
              />
              <div className="w-full">
                <OutlinedButtonRed
                  onClick={() => handleReopenComplaint()}
                  disabled={
                    registeredComplaint?.status === "Open" ||
                    registeredComplaint === null
                  }
                  label="Complaint Re-open"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          <div className="font-semibold text-red text-sm">Search History</div>
          <div className="flex gap-2 w-full">
            <div className="w-full">
              <SearchInputBox
                key={`searchTerm-${formKey}`}
                placeholder="Search by Complaint No or ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-[50%]">
              <OutlinedButtonRed label="Search" onClick={handleSearch} />
            </div>
          </div>
          <div className="py-2 flex-1">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="history"
              columns={columns}
              rowData={rowData}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <InputBox
          key={`complaintRemark-${formKey}`}
          placeholder="Complaint Remark"
          register={register}
          setValue={setValue}
          value="complaintRemark"
          disabled={registeredComplaint?.status === "Close"}
          resetFactor={resetComplaintRemark}
        />
        <DummyInputBoxWithLabelDarkGray
          key={`operationRemark-${formKey}`}
          register={register}
          setValue={setValue}
          value="operationRemark"
          label="Operation Remark"
          inputValue={registeredComplaint?.operationRemark || ""}
        />
        <div className="flex gap-2">
          <div className="w-full">
            <InputBox
              key={`closeRemark-${formKey}`}
              register={register}
              setValue={setValue}
              placeholder="Close Remark"
              value="closeRemark"
              disabled={
                registeredComplaint === null ||
                registeredComplaint?.status === "Close"
              }
            />
          </div>
          <div className="w-[255px] whitespace-nowrap">
            <OutlinedButtonRed
              disabled={
                registeredComplaint === null ||
                registeredComplaint?.status === "Close"
              }
              onClick={() => handleCloseComplaint()}
              label="Complaint Resolved"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <div className="w-full">
            <LabeledDropdown
              key={`reAssignTo-${formKey}`}
              options={employees}
              register={register}
              setValue={setValue}
              title="Re-Assign To"
              value="reAssignTo"
              disabled={
                registeredComplaint === null ||
                registeredComplaint?.status === "Close"
              }
              resetFactor={resetReassign}
            />
          </div>
          <div className="w-[275px]">
            <OutlinedButtonRed
              onClick={() => handleReassign()}
              disabled={
                registeredComplaint === null ||
                registeredComplaint?.status === "Close"
              }
              label="Re-Assign"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-2">
          <div>
            <OutlinedButtonRed
              onClick={() => handlePrioritize()}
              disabled={
                registeredComplaint === null ||
                registeredComplaint?.complaintType === "High-Priority"
              }
              label="Prioritize"
            />
          </div>
          <div>
            <SimpleButton
              name={
                registeredComplaint?.status === "Open"
                  ? "Update Complaint"
                  : "Register Complaint"
              }
              type="submit"
              disabled={registeredComplaint?.status === "Close"}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

export default RegisterComplaint;
