"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { useSearchParams } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "../../lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

const RegisteredTicketDetails = () => {
  const { register, setValue, getValues, reset } = useForm();
  const {
    server,
    ticket: complaintNo,
    setCurrentTab,
    currentTab,
    setActiveTabs,
    activeTabs,
  } = useContext(GlobalContext);
  const [ticket, setTicket] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [csEmployees, setCsEmployees] = useState([]);
  const [resetFactor, setResetFactor] = useState(0);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const handleClose = () => {
    const tabToClose = activeTabs.find((tab) => tab.subfolder === currentTab);
    if (!tabToClose) return;

    const newActiveTabs = activeTabs.filter(
      (tab) => tab.subfolder !== currentTab,
    );

    if (newActiveTabs.length === 0) {
      setCurrentTab(null);
    } else {
      const currentIndex = activeTabs.findIndex(
        (tab) => tab.subfolder === currentTab,
      );
      const previousTab = newActiveTabs[currentIndex - 1] || newActiveTabs[0];
      setCurrentTab(previousTab.subfolder);
    }

    setActiveTabs(newActiveTabs);
  };

  // close on escape!
  useEffect(() => {
    if (currentTab !== "Registered Ticket Details") return;

    const handleEscape = (e) => {
      if (e.key !== "Escape") return;

      // find this tab in activeTabs
      const tabToClose = activeTabs.find((tab) => tab.subfolder === currentTab);
      if (!tabToClose) return;

      const newActiveTabs = activeTabs.filter(
        (tab) => tab.subfolder !== currentTab,
      );

      // update currentTab
      if (newActiveTabs.length === 0) {
        setCurrentTab(null);
      } else if (currentTab === tabToClose.subfolder) {
        const currentIndex = activeTabs.findIndex(
          (tab) => tab.subfolder === currentTab,
        );
        const previousTab = newActiveTabs[currentIndex - 1] || newActiveTabs[0];
        setCurrentTab(previousTab.subfolder);
      }

      setActiveTabs(newActiveTabs);
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeTabs, currentTab, setActiveTabs, setCurrentTab]);

  useEffect(() => {
    if (!server) return;

    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${server}/ticket-dashboard/cs`);
        const data = await res.json();
        if (!data.error) {
          // map to "id - name" strings
          const namesWithId = data.dropdown.map(
            (emp) => `${emp.id} - ${emp.name}`,
          );
          setCsEmployees(namesWithId);
        }
      } catch (err) {
        console.error("Failed to fetch CS employees:", err);
      }
    };

    fetchEmployees();
  }, [server]);

  const fetchTicket = async () => {
    if (!complaintNo || !server) return;
    try {
      const res = await fetch(
        `${server}/ticket-dashboard/complaint-details?complaintNo=${complaintNo}`,
      );
      const data = await res.json();
      if (data.error) return;

      const createdDate = new Date(data.date || data.createdAt);
      const formattedDate = createdDate.toLocaleDateString();
      const formattedTime = createdDate.toLocaleTimeString();

      setTicket({
        ...data,
        complaintDate: formattedDate,
        time: formattedTime,
        remarks: data.remarks || "",
        isResolved: data.isResolved || false,
      });

      setHistoryData(
        data.history.map((h) => {
          const hDate = new Date(h.date);
          return {
            ticketNo: data.complaintNo,
            historyDate: hDate.toLocaleDateString(),
            time: hDate.toLocaleTimeString(),
            action: h.action,
            remarks: h.remarks || "",
            updatedBy: h.actionUser,
            assignedTo: h.assignTo,
            status: h.statusHistory || data.status,
          };
        }),
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [complaintNo, server]);

  const handleRefresh = () => {
    reset();
    setResetFactor((prev) => prev + 1);
    setValue("estimatedResolutionDate", "");
  };

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    if (!dd || !mm || !yyyy) return "";
    return `${yyyy}-${mm}-${dd}`;
  };

  const ticketColumns = [
    { key: "complaintNo", label: "Complaint No." },
    { key: "complaintID", label: "Complaint ID" },
    { key: "awbNo", label: "AWB No." },
    { key: "complaintDate", label: "Date" },
    { key: "time", label: "Time" },
    { key: "caseType", label: "Case Type" },
    { key: "remarks", label: "Description" },
    { key: "assignTo", label: "Assign User" },
    { key: "status", label: "Status" },
  ];

  const historyColumns = [
    { key: "ticketNo", label: "Complaint No." },
    { key: "historyDate", label: "Date" },
    { key: "time", label: "Time" },
    { key: "action", label: "Remarks" },
    { key: "updatedBy", label: "Updated By" },
    { key: "assignedTo", label: "Assigned User" },
    { key: "status", label: "Status" },
  ];

  // Fetch only history data
  const fetchHistory = async (complaintNoParam) => {
    if (!complaintNoParam || !server) return;
    try {
      const res = await fetch(
        `${server}/ticket-dashboard/complaint-details?complaintNo=${complaintNoParam}`,
      );
      const data = await res.json();
      if (data.error) return;

      setHistoryData(
        data.history.map((h) => {
          const hDate = new Date(h.date);
          return {
            ticketNo: data.complaintNo,
            historyDate: hDate.toLocaleDateString(),
            time: hDate.toLocaleTimeString(),
            action: h.action,
            remarks: h.remarks || "",
            updatedBy: h.actionUser,
            assignedTo: h.assignTo,
            status: h.statusHistory || data.status,
          };
        }),
      );
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const handleUpdateTicket = async () => {
    if (!ticket) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const updatedBy = user?.userId || user?.username || "Unknown";

    const updateData = {
      complaintNo: ticket.complaintNo,
      action: getValues("updateTicket"), // for history
      status: getValues("status"), // update status
      assignTo: getValues("reassignTo"), // update assigned user
      remarks: getValues("updateTicket"), // ✅ save current remarks
      actionUser: updatedBy,
      estimatedResolutionDate: dmyToYmd(getValues("estimatedResolutionDate")),
    };

    try {
      const res = await fetch(`${server}/ticket-dashboard/complaint-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!data.error) {
        showNotification("success", "Ticket updated successfully!");
        await fetchTicket(); // refresh main ticket info
        await fetchHistory(complaintNo);
        handleRefresh(); // reset form inputs
      } else {
        showNotification("error", "Failed to update ticket!");
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const resolved = ticket?.isResolved;

  const handleResolveTicket = async () => {
    if (!ticket) return;

    const user = JSON.parse(localStorage.getItem("user"));
    const updatedBy = user?.userId || user?.username || "Unknown";

    const updateData = {
      complaintNo: ticket.complaintNo,
      action: getValues("updateTicket") || "Resolved by user", // history entry
      status: "Close",
      assignTo: ticket.assignTo,
      remarks: getValues("updateTicket"), // save current remarks
      actionUser: updatedBy,
      estimatedResolutionDate: dmyToYmd(getValues("estimatedResolutionDate")),
    };

    try {
      const res = await fetch(`${server}/ticket-dashboard/complaint-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!data.error) {
        showNotification("success", "Ticket resolved successfully!");
        await fetchTicket(); // refresh main ticket info
        await fetchHistory(complaintNo);
        handleRefresh();
      } else {
        showNotification("error", `Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Resolve failed:", err);
    }
  };

  return (
    <div className="gap-4 flex flex-col">
      <Heading
        title={`Ticket Details`}
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
      />
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={() => setNotification({ ...notification, visible: false })}
      />
      <div className="flex justify-between mt-2">
        <RedLabelHeading label={"Ticket Information"} />
        <div>
          {" "}
          {resolved ? (
            <span className="bg-green-100 border-green-600 border text-green-600 px-2 py-0.5 rounded-2xl text-xs font-semibold">
              Resolved
            </span>
          ) : (
            <span className="bg-misty-rose border-red border text-red px-2 py-0.5 rounded-2xl text-xs font-semibold">
              Not Resolved
            </span>
          )}
          <span className="bg-misty-rose border-red border text-red px-2 py-0.5 rounded-2xl text-xs font-semibold ml-2">
            Manual
          </span>
        </div>
      </div>

      <div>
        <TableWithSorting
          setValue={setValue}
          register={register}
          columns={ticketColumns}
          className={"h-24"}
          rowData={ticket ? [ticket] : []}
          disabled
        />
      </div>
      <div>
        {" "}
        <h2 className="text-sm text-battleship-gray font-semibold mb-3">
          Ticket History
        </h2>
        <TableWithSorting
          setValue={setValue}
          register={register}
          columns={historyColumns}
          className={"h-48"}
          rowData={historyData}
        />
      </div>

      <div>
        <h2 className="text-sm text-battleship-gray font-semibold mb-3">
          Update Ticket
        </h2>
        <div className="flex flex-col !items-start">
          <InputBox
            value={"updateTicket"}
            setValue={setValue}
            register={register}
            className="align-top h-24"
            isTextArea="true"
            placeholder={"Enter your remarks here..."}
            resetFactor={resetFactor}
            disabled={resolved}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <LabeledDropdown
          options={["Low", "Normal", "High"]}
          setValue={setValue}
          register={register}
          value={"priority"}
          title={`Priority`}
          resetFactor={resetFactor}
          disabled={resolved}
        />
        <LabeledDropdown
          options={["Open", "Pending"]}
          setValue={setValue}
          register={register}
          value={"status"}
          title={`Status`}
          resetFactor={resetFactor}
          disabled={resolved}
        />

        <LabeledDropdown
          options={csEmployees}
          setValue={setValue}
          register={register}
          value={"reassignTo"}
          title={`Re-assign To`}
          resetFactor={resetFactor}
          disabled={resolved}
        />
        <DateInputBox
          setValue={setValue}
          register={register}
          value={"estimatedResolutionDate"}
          placeholder={`Est. Resolution Date`}
          resetFactor={resetFactor}
          disabled={resolved}
        />
      </div>
      <div className="flex justify-between">
        <div>
          <OutlinedButtonRed label={`Close`} onClick={handleClose} />
        </div>
        <div className="flex gap-3">
          <OutlinedButtonRed
            label={`Update Ticket`}
            onClick={handleUpdateTicket}
            disabled={resolved}
            perm="CC Edit"
          />{" "}
          <SimpleButton
            name={`Resolve Ticket`}
            onClick={handleResolveTicket}
            disabled={resolved}
          />
        </div>
      </div>
    </div>
  );
};

export default RegisteredTicketDetails;
