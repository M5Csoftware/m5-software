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

const PortalTicketDetails = () => {
  const { register, setValue, getValues } = useForm();
  const {
    server,
    ticket: ticketId,
    setCurrentTab,
    setActiveTabs,
    activeTabs,
    currentTab,
  } = useContext(GlobalContext);
  const [ticket, setTicket] = useState(null);
  const [defaultEmp, setDefaultEmp] = useState("");
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

  // ✅ FIX: Use ticket.isResolved from database instead of local state
  const resolved = ticket?.isResolved || false;

  // close on escape!
  useEffect(() => {
    if (currentTab !== "Portal Ticket Details") return;

    const handleEscape = (e) => {
      if (e.key !== "Escape") return;

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

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [activeTabs, currentTab, setActiveTabs, setCurrentTab]);

  const historyWithTicketData = ticket
    ? ticket.history.map((h) => ({
        ...h,
        ticketId: ticket.ticketId,
        awbNo: ticket.awbNumber,
        accountCode: ticket.accountCode,
        category: ticket.category,
        subCategory: ticket.subCategory,
      }))
    : [];

  useEffect(() => {
    if (!server) return;

    const fetchCSEmployees = async () => {
      try {
        const res = await fetch(`${server}/ticket-dashboard/cs`);
        const data = await res.json();

        const namesWithId = data.dropdown.map(
          (emp) => `${emp.id} - ${emp.name}`,
        );

        setCsEmployees(namesWithId);
        setDefaultEmp(namesWithId[0] || "");
        setValue("reassignTo", namesWithId[0] || "");
      } catch (err) {
        console.error("Failed to fetch CS employees", err);
      }
    };

    fetchCSEmployees();
  }, [server, setValue]);

  useEffect(() => {
    if (!ticketId || !server) return;

    const fetchTicket = async () => {
      try {
        const res = await fetch(
          `${server}/ticket-dashboard/ticket-details?ticketId=${ticketId}`,
        );
        const data = await res.json();
        setTicket(data.ticket);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTicket();
  }, [ticketId, server]);

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

  const handleRefresh = () => {
    setResetFactor((prev) => prev + 1);
    setValue("updateTicket", "");
    setValue("priorityStatus", "");
    setValue("status", "");
    setValue("reassignTo", defaultEmp || "");
    setValue("estimatedResolutionDate", "");
  };

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    if (!dd || !mm || !yyyy) return "";
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleResolveTicket = async () => {
    const remarks = getValues("updateTicket");
    const reassignTo = getValues("reassignTo");
    const priorityStatus = getValues("priorityStatus");
    const estimatedResolutionDate = dmyToYmd(
      getValues("estimatedResolutionDate"),
    );

    if (!remarks) {
      showNotification("error", "Remarks are required!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const updatedBy = user?.userId || user?.username || "Unknown";

      const res = await fetch(`${server}/ticket-dashboard/ticket-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          remarks,
          updatedBy,
          priorityStatus,
          assignedTo: reassignTo,
          resolve: true,
          estimatedResolutionDate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showNotification("success", "Ticket resolved successfully!");
        setTicket(data.ticket); // ✅ This will now have isResolved: true
        handleRefresh();
      } else {
        showNotification("error", "Failed to resolve ticket");
      }
    } catch (err) {
      console.error("Error resolving ticket:", err);
      showNotification("error", "Failed to resolve ticket");
    }
  };

  const handleUpdateTicket = async () => {
    const remarks = getValues("updateTicket");
    const status = getValues("status");
    const reassignTo = getValues("reassignTo");
    const priorityStatus = getValues("priorityStatus");
    const estimatedResolutionDate = dmyToYmd(
      getValues("estimatedResolutionDate"),
    );

    if (!remarks || !status) {
      showNotification("error", "Remarks and status are required!");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const updatedBy = user?.userId || user?.username || "Unknown";
      const res = await fetch(`${server}/ticket-dashboard/ticket-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId,
          remarks,
          status,
          updatedBy,
          priorityStatus,
          assignedTo: reassignTo,
          estimatedResolutionDate,
        }),
      });

      const data = await res.json();

      if (data.success) {
        showNotification("success", "Ticket updated successfully!");
        setTicket(data.ticket);
        handleRefresh();
      } else {
        showNotification("error", "Failed to update ticket");
      }
    } catch (err) {
      console.error("Error updating ticket:", err);
      showNotification("error", "Failed to update ticket");
    }
  };

  if (!ticket)
    return (
      <div className="flex justify-center items-center h-[70vh] w-full ">
        <div className="flex flex-col justify-center items-center h-full w-full leading-tight">
          <h2 className="font-semibold">The Ticked ID was not Valid,</h2>
          <h2>No Information Found!</h2>
          <button
            className="bg-red text-white px-4 py-2 rounded mt-3"
            onClick={() => window.history.back()}
          >
            Go back to Ticket Dashboard
          </button>
        </div>
      </div>
    );

  const ticketColumns = [
    { key: "awbNumber", label: "AWB Number" },
    { key: "accountCode", label: "Customer Code" },
    { key: "ticketId", label: "Ticket ID" },
    { key: "sector", label: "Sector" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
    { key: "remarks", label: "Remarks" },
    { key: "priorityStatus", label: "Priority" },
    { key: "status", label: "Status" },
  ];

  const historyColumns = [
    { key: "ticketId", label: "Ticket ID" },
    { key: "date", label: "Date & Time" },
    { key: "awbNo", label: "AWB Number" },
    { key: "action", label: "Remarks" },
    { key: "actionUser", label: "Updated By" },
    { key: "assignedTo", label: "Assigned User" },
    { key: "statusHistory", label: "Status" },
  ];

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
          {resolved ? (
            <span className="bg-green-100 border-green-3 border text-green-700 px-2 py-0.5 rounded-2xl text-xs font-semibold mr-2">
              Resolved
            </span>
          ) : (
            <span className="bg-misty-rose border-red border text-red px-2 py-0.5 rounded-2xl text-xs font-semibold mr-2">
              Not Resolved
            </span>
          )}
          <span className="bg-misty-rose border-red border text-red px-2 py-0.5 rounded-2xl text-xs font-semibold">
            Portal
          </span>
        </div>
      </div>

      <div>
        <TableWithSorting
          setValue={setValue}
          register={register}
          columns={ticketColumns}
          className={"h-24"}
          rowData={[ticket]}
          disabled
        />
      </div>
      <div>
        <h2 className="text-sm text-battleship-gray font-semibold mb-3">
          Ticket History
        </h2>
        <TableWithSorting
          setValue={setValue}
          register={register}
          columns={historyColumns}
          className={"h-48"}
          rowData={historyWithTicketData}
        />
      </div>

      <div>
        <h2 className="text-sm text-battleship-gray font-semibold mb-3">
          Update Ticket
        </h2>
        <div className="flex flex-col !items-start">
          {" "}
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
          value={"priorityStatus"}
          title={`Priority`}
          resetFactor={resetFactor}
          disabled={resolved}
        />
        <LabeledDropdown
          options={["open", "pending"]}
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
          />
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

export default PortalTicketDetails;
