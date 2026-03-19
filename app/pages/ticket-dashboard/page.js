//app/ticket-dashboard/page.js
"use client";
import { useContext, useEffect, useState } from "react";
import { Search, RefreshCcw, ChevronDown, ExternalLink, X } from "lucide-react";
import { TableWithSorting } from "@/app/components/Table";
import { useForm } from "react-hook-form";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";
import Modal from "@/app/components/Modal";
import * as XLSX from "xlsx";
import { subDays, startOfMonth, endOfMonth } from "date-fns";


export default function TicketDashboard() {
  const {
    register,
    setValue,
    trigger,
    getValues,
    watch,
    reset,
    formState: { errors },
  } = useForm();
  const [status, setStatus] = useState("Open");
  const [added, setAdded] = useState(false);
  const [demoRadio, setDemoRadio] = useState("portal");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reports, setReports] = useState([]);
  const { server, setActiveTabs, setCurrentTab, setTicket } =
    useContext(GlobalContext);
  const [summary, setSummary] = useState([]);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const [downloadFrom, setDownloadFrom] = useState("");
  const [downloadTo, setDownloadTo] = useState("");
  const [resetFactor, setResetFactor] = useState(false);

  const selectedRange = watch("dateRange");
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const dateFilters = [
    { label: "This Month", value: "this_month" },
    { label: "Date Wise", value: "date_wise" },
    { label: "Last 7 Days", value: "last_7_days" },
    { label: "Month Name", value: "month_name" }, // can be implemented later
    { label: "Last Financial Year", value: "last_fy" },
    { label: "Custom", value: "custom" },
  ];

  const registeredColumns = [
    { key: "ticketNo", label: "Complaint No." },
    { key: "jobId", label: "Complaint ID" },
    { key: "awbNo", label: "AWB No." },
    { key: "complaintDate", label: "Date" },
    { key: "time", label: "Time" },
    { key: "caseType", label: "Case Type" },
    { key: "remarks", label: "Description" },
    { key: "assignUser", label: "Assigned To" },
    { key: "status", label: "Status" },
    { key: "view", label: "View" },
  ];

  const portalColumns = [
    { key: "ticketId", label: "Ticket ID" },
    { key: "awbNumber", label: "AWB No." },
    { key: "accountCode", label: "Customer Code" },
    { key: "ticketDate", label: "Date" },
    { key: "time", label: "Time" },
    { key: "category", label: "Category" },
    { key: "subCategory", label: "Sub Category" },
    { key: "assignTo", label: "Assigned To" },
    { key: "remarks", label: "Remarks" },
    { key: "priorityStatus", label: "Priority" },
    { key: "status", label: "Status" },
    // { key: "lateUpdated", label: "Last Updated" },
    { key: "view", label: "View" },
  ];
  const [columns, setColumns] = useState(
    demoRadio === "portal" ? portalColumns : registeredColumns
  );
  async function fetchComplaints(filters = {}, type = demoRadio) {
    try {
      let url = `${server}/ticket-dashboard`;
      if (type === "portal") url += "/portal";

      const query = new URLSearchParams(filters).toString();
      const res = await fetch(`${url}?${query}`);
      const data = await res.json();

      if (filters.from) filters.from = dmyToYmd(filters.from);
      if (filters.to) filters.to = dmyToYmd(filters.to);

      let mappedData = [];
      if (type === "portal") {
        mappedData = data.map((ticket) => ({
          ticketId: ticket.ticketId,
          awbNumber: ticket.awbNumber || "",
          accountCode: ticket.accountCode || "",
          ticketDate: ticket.date,
          time: ticket.time,
          category: ticket.category || "",
          subCategory: ticket.subCategory || "",
          remarks: ticket.remarks || "",
          priorityStatus: ticket.priorityStatus || "",
          status: ticket.status || "",
          lateUpdated: ticket.lateUpdated || "",
          assignTo: ticket.assignTo || "",
          view: (
            <button
              onClick={() => openPortalTicketTab(ticket.ticketId)}
              className="text-red font-semibold tracking-wide hover:underline"
            >
              View
            </button>
          ),
        }));
      } else {
        mappedData = data.map((item) => ({
          ticketNo: item.ticketNo,
          jobId: item.jobId,
          awbNo: item.awbNo,
          complaintDate: item.date,
          time: item.time,
          caseType: item.caseType,
          remarks: item.remarks,
          assignUser: item.assignUser,
          status: item.status,
          view: (
            <button
              onClick={() => openRegisteredTicketTab(item.ticketNo)}
              className="text-red font-semibold tracking-wide hover:underline"
            >
              View
            </button>
          ),
        }));
      }

      setReports(mappedData);

      showNotification(
        "success",
        `${mappedData.length} ${type === "portal" ? "Portal" : "Registered"
        } ticket${mappedData.length > 1 ? "s" : ""} found`
      );
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to fetch tickets");
    }
  }

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    if (!dd || !mm || !yyyy) return "";
    return `${yyyy}-${mm}-${dd}`;
  };

  const ymdToDmy = (d) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date)) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const openPortalTicketTab = (ticketId) => {
    const tab = {
      folder: "Customer Care",
      subfolder: "Portal Ticket Details",
      ticketId,
    };

    setActiveTabs((prev) =>
      prev.some(
        (item) => item.folder === tab.folder && item.subfolder === tab.subfolder
      )
        ? prev
        : [...prev, tab]
    );

    setCurrentTab("Portal Ticket Details");
    setTicket(ticketId);
  };

  const openRegisteredTicketTab = (ticketNo) => {
    const tab = {
      folder: "Customer Care",
      subfolder: "Registered Ticket Details",
      ticketNo,
    };

    setActiveTabs((prev) =>
      prev.some(
        (item) => item.folder === tab.folder && item.subfolder === tab.subfolder
      )
        ? prev
        : [...prev, tab]
    );

    setCurrentTab("Registered Ticket Details");
    setTicket(ticketNo);
  };

  // On Search
  const handleSearch = async () => {
    const fromRaw = getValues("from");
    const toRaw = getValues("to");

    const from = dmyToYmd(fromRaw);
    const to = dmyToYmd(toRaw);

    if ((fromRaw || toRaw) && (!from || !to)) {
      showNotification("error", "Invalid date format");
      return;
    }

    const status = getValues("complaintStatus");
    const type = demoRadio; // "portal" or "registered"

    try {
      let url = `${server}/ticket-dashboard`;
      if (type === "portal") url += "/portal";

      const query = new URLSearchParams({ from, to, status }).toString();
      const res = await fetch(`${url}?${query}`);
      const data = await res.json();

      let mappedData = data;

      // Only map portal tickets to match frontend table columns
      if (type === "portal") {
        mappedData = data.map((ticket) => ({
          ticketId: ticket.ticketId,
          awbNumber: ticket.awbNumber || "",
          accountCode: ticket.accountCode || "",
          ticketDate: ticket.date,
          time: ticket.time,
          category: ticket.category || "",
          subCategory: ticket.subCategory || "",
          remarks: ticket.remarks || "",
          priorityStatus: ticket.priorityStatus || "",
          status: ticket.status || "",
          lateUpdated: ticket.lateUpdated || "",
          assignTo: ticket.assignTo || "",
          view: (
            <button
              onClick={() => openPortalTicketTab(ticket.ticketId)}
              className="text-red font-semibold tracking-wide hover:underline"
            >
              View
            </button>
          ),
        }));
      }

      if (type === "registered") {
        mappedData = data.map((item) => ({
          ticketNo: item.ticketNo,
          jobId: item.jobId,
          awbNo: item.awbNo,
          complaintDate: item.date,
          time: item.time,
          caseType: item.caseType,
          remarks: item.remarks,
          assignUser: item.assignUser,
          status: item.status,
          view: (
            <button
              onClick={() => openRegisteredTicketTab(item.ticketNo)}
              className="text-red font-semibold tracking-wide hover:underline"
            >
              View
            </button>
          ),
        }));
      }

      setReports(mappedData);
      setValue("name", "");
      showNotification(
        "success",
        `${mappedData.length} ${type === "portal" ? "Portal" : "Registered"
        } ticket${mappedData.length > 1 ? "s" : ""} found`
      );
    } catch (err) {
      console.error(err);
      showNotification("error", "Failed to fetch tickets");
    }
  };


  useEffect(() => {
    async function fetchEmployees() {
      const res = await fetch(`${server}/ticket-dashboard/cs`);
      const data = await res.json();
      const summary = data.summary;
      setSummary(summary);
    }

    fetchEmployees();
  }, []);

  const handleSummaryClick = (empName) => {
    setValue("name", empName);
    if (demoRadio === "registered") {
      fetchComplaints({ assignTo: empName });
    } else {
      fetchComplaints({ assignedUser: empName });
    }
  };

  const fetchSummary = async (type = "registered") => {
    const res = await fetch(`${server}/ticket-dashboard/cs?type=${type}`);
    const data = await res.json();
    setSummary(data.summary);
  };

  useEffect(() => {
    const fetchSummary = async (type = demoRadio) => {
      try {
        const res = await fetch(`${server}/ticket-dashboard/cs?type=${type}`);
        const data = await res.json();
        setSummary(data.summary || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchSummary(demoRadio);
  }, [server, demoRadio]);

  const handleRefresh = () => {
    reset({
      from: "",
      to: "",
      fromDate: "",
      toDate: "",
      name: "",
      complaintStatus: "",
      dateRange: "",
    });

    setReports([]);
    setResetFactor((prev) => !prev); // toggles resetFactor to force InputBox/Dropdown to reset
    showNotification("success", "Dashboard refreshed successfully");
  };

  const handleClearFilter = () => {
    setReports([]);
    reset({
      name: "",
      from: "",
      to: "",
      fromDate: "",
      toDate: "",
      complaintStatus: "",
      dateRange: "",
    });
  };

  useEffect(() => {
    if (selectedRange) handleRangeChange(selectedRange);
  }, [selectedRange]);

  useEffect(() => {
    setDownloadFrom(fromDate);
    setDownloadTo(toDate);
  }, [fromDate, toDate]);

  const handleRangeChange = (range) => {
    const today = new Date();
    let from = "";
    let to = "";

    switch (range) {
      case "last_7_days":
        // Today minus 7 days (exclude today if needed)
        from = subDays(today, 7).toISOString().split("T")[0];
        to = subDays(today, 1).toISOString().split("T")[0];
        break;
      case "this_month":
        from = startOfMonth(today).toISOString().split("T")[0];
        to = today.toISOString().split("T")[0];
        break;
      case "last_fy":
        const lastFYStart = new Date(today.getFullYear() - 1, 3, 1);
        const lastFYEnd = new Date(today.getFullYear(), 2, 31);
        from = lastFYStart.toISOString().split("T")[0];
        to = lastFYEnd.toISOString().split("T")[0];
        break;
      default:
        from = "";
        to = "";
    }

    setDownloadFrom(from);
    setDownloadTo(to);
    setValue("fromDate", ymdToDmy(from));
    setValue("toDate", ymdToDmy(to));
  };

  const handleDownload = async () => {
    try {
      const from = dmyToYmd(getValues("fromDate"));
      const to = dmyToYmd(getValues("toDate"));

      if (!from || !to) {
        showNotification("error", "Invalid date range");
        return;
      }

      const query = new URLSearchParams({ from, to }).toString();
      const res = await fetch(`${server}/ticket-dashboard?${query}`);
      const data = await res.json();

      if (!data.length) {
        showNotification("error", "No data found");
        return;
      }

      // ✅ Format for clean headers
      const formattedData = data.map((item) => ({
        "Complaint No.": item.ticketNo || "",
        "Complaint ID": item.jobId || "",
        "AWB No.": item.awbNo || "",
        Date: item.date ? new Date(item.date).toLocaleDateString() : "",
        Time: item.time ? new Date(item.date).toLocaleTimeString() : "",
        "Case Type": item.caseType || "",
        Description: item.remarks || "",
        "Assign User": item.assignUser || "",
        Status: item.status || "",
      }));

      // ✅ Create Excel
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Complaint Report");

      // ✅ Auto column width
      worksheet["!cols"] = Object.keys(formattedData[0]).map(() => ({
        wch: 20,
      }));

      // ✅ Export to xlsx (cleaner than CSV)
      XLSX.writeFile(workbook, "Complaint_Report.xlsx");

      setShowDownloadModal(false);
    } catch (err) {
      console.error("Download failed:", err);
      showNotification("error", "Download failed");
    }
  };

  useEffect(() => {
    setColumns(demoRadio === "portal" ? portalColumns : registeredColumns);
    setReports([]);
    reset();
    setValue("from", "");
    setValue("to", "");
    setValue("name", "");
  }, [demoRadio]);

  return (
    <div>
      <div className="py-3">
        <Heading
          bulkUploadBtn="hidden"
          codeListBtn="hidden"
          title={`Ticket Dashboard`}
          onRefresh={handleRefresh}
          fullscreenBtn
          onClickFullscreenBtn={() => setIsFullscreen(true)}
          tableReportBtn
          onClickTableReportBtn={() => {
            setShowDownloadModal(true);
          }}
        />
        <NotificationFlag
          type={notification.type}
          message={notification.message}
          visible={notification.visible}
          setVisible={() =>
            setNotification({ ...notification, visible: false })
          }
        />
      </div>
      <div className="flex gap-3 mb-3">
        <RadioButtonLarge
          name={`demo`}
          register={register}
          setValue={setValue}
          id={"portal"}
          label={"Portal Tickets"}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
        <RadioButtonLarge
          name={`demo`}
          register={register}
          setValue={setValue}
          id={"registered"}
          label={"Registered Complaints"}
          selectedValue={demoRadio}
          setSelectedValue={setDemoRadio}
        />
      </div>

      {showDownloadModal && (
        <Modal
          title="Complaint Report"
          onClose={() => setShowDownloadModal(false)}
        >
          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-end">
              <LabeledDropdown
                options={dateFilters.map((option) => option.label)}
                register={register}
                setValue={setValue}
                title="Date Range"
                value="dateRange"
                resetFactor={resetFactor}
                onChange={(val) => {
                  const selected = dateFilters.find(
                    (opt) => opt.label === val
                  )?.value;
                  setValue("dateRange", selected); // update react-hook-form value
                  handleRangeChange(selected); // update from/to values
                }}
              />
              <DateInputBox
                placeholder="From"
                register={register}
                setValue={setValue}
                resetFactor={resetFactor}
                value="fromDate" // <-- react-hook-form controlled
                disabled={
                  selectedRange !== "date_wise" && selectedRange !== "custom"
                }
              />
              <DateInputBox
                placeholder="To"
                register={register}
                setValue={setValue}
                resetFactor={resetFactor}
                value="toDate"
                disabled={
                  selectedRange !== "date_wise" && selectedRange !== "custom"
                }
              />

              <div>
                <SimpleButton
                  name="Download"
                  type="button"
                  onClick={handleDownload}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div className="mt-4 ">
          <aside className="w-64 border-[1px] rounded-lg bg-white flex flex-col h-[60vh]">
            <div>
              <h2 className="font-semibold text-sm text-gray-500 my-4 ml-6">
                Complaint Summary
              </h2>
              <div className="flex flex-col justify-between h-[52vh] overflow-y-scroll table-scrollbar">
                <div className="">
                  {" "}
                  {summary.map((item, i) => (
                    <div
                      key={i}
                      className="flex border-t items-center justify-between px-3 py-1.5"
                    >
                      <div className="mx-6 my-1 flex gap-4 justify-between items-center w-full">
                        <div className="">
                          <span className="text-sm mr-2">{item.name}</span>
                        </div>
                        <div className="flex justify-end">
                          <span className="bg-misty-rose text-red px-2 py-1 text-xs rounded-md">
                            {item.count}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end items-end mx-6 mr-4">
                        <ExternalLink
                          className="w-4 h-4 text-gray-500 hover:text-red cursor-pointer"
                          onClick={() => handleSummaryClick(item.name)}
                        />
                      </div>
                    </div>
                  ))}{" "}
                </div>

                <div className="flex justify-center items-center w-[75%] mx-auto">
                  <button
                    className="text-xs font-semibold text-[#EA1B40] border-[#EA1B40] w-full border-[1px] rounded-md px-8 py-1.5"
                    onClick={handleClearFilter}
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Main Content */}
        <div className="ml-4 py-4 flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Header */}

          <RedLabelHeading label={`Complaints`} />

          {/* Filters */}
          <div className="flex gap-3">
            <div className="flex gap-4 w-1/2">
              <DateInputBox
                register={register}
                setValue={setValue}
                value="from"
                placeholder="From"
                trigger={trigger}
                resetFactor={resetFactor}
                error={errors.from}
                validation={{ required: "From date is required" }}
                maxToday
              />

              <DateInputBox
                register={register}
                setValue={setValue}
                value="to"
                placeholder="To"
                maxToday
                resetFactor={resetFactor}
                trigger={trigger}
                error={errors.to}
              />
            </div>
            <div>
              <InputBox
                register={register}
                setValue={setValue}
                value={"name"}
                disabled
                resetFactor={resetFactor}
                placeholder="Assigned To"
                initialValue={watch("name")}
              />
            </div>

            <div className="relative">
              <LabeledDropdown
                title="Complaint Status"
                options={["Open", "Resolved", "Pending"]}
                value="complaintStatus"
                register={register}
                setValue={setValue}
                defaultValue={watch("complaintStatus") || ""}
                className={``}
              />
            </div>

            <div className="w-[200px]">
              <OutlinedButtonRed label={`Search`} onClick={handleSearch} />
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center border rounded-md px-3 py-2 text-sm">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search Complaints"
              className="outline-none"
            />
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-w-full border rounded-lg">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="complaintTable"
              columns={columns}
              rowData={reports}
              className={`h-[45vh]`}
            />
            {isFullscreen && (
              <div className="inset-0 z-50 fixed bg-white p-10">
                <div className="flex justify-between items-center mb-4 ml-1">
                  <Heading
                    title={
                      demoRadio === "portal"
                        ? "Portal Tickets"
                        : "Registered Tickets"
                    }
                    codeListBtn="hidden"
                    bulkUploadBtn="hidden"
                    refreshBtn="hidden"
                  />
                  <X
                    onClick={() => setIsFullscreen(false)}
                    className="cursor-pointer text-black w-6 h-6"
                  />
                </div>

                <TableWithSorting
                  register={register}
                  setValue={setValue}
                  name="complaintTable"
                  columns={columns}
                  rowData={reports}
                  className={`h-[85vh]`}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
