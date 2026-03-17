"use client";
import { useState, useEffect, useContext } from "react";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

export default function ClientReport() {
  const { register, setValue, watch } = useForm();
  const [clients, setClients] = useState([]);
  const { server } = useContext(GlobalContext); // ✅ use same backend
  const query = (watch("customerSearch") || "").toString();
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [paginatedData, setPaginatedData] = useState([]);

  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

  const columns = [
    { key: "accountCode", label: "Code" },
    { key: "name", label: "Customer Name" },
    { key: "addressLine1", label: "Address 1" },
    { key: "addressLine2", label: "Address 2" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pinCode", label: "Pincode" },
    { key: "email", label: "Email" },
    { key: "telNo", label: "Telephone" },
    { key: "branch", label: "Branch" },
  ];

  // normalize + fuzzy helpers
  const norm = (s) =>
    (s ?? "").toString().toLowerCase().replace(/\s+/g, "").trim();
  const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fuzzy = (text, q) => {
    const nText = norm(text);
    const nQ = norm(q);
    if (!nQ) return true;
    if (nText.includes(nQ)) return true;
    const pattern = nQ.split("").map(escapeReg).join(".*");
    return new RegExp(pattern).test(nText);
  };

  // filter by code OR name
  const filteredClients = clients.filter(
    (c) => fuzzy(c.accountCode, query) || fuzzy(c.name, query)
  );

  // Update paginated data whenever filtered clients or page/limit changes
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageLimit;
    const endIndex = startIndex + pageLimit;
    setPaginatedData(filteredClients.slice(startIndex, endIndex));
    
    // Reset to page 1 if current page is beyond available pages
    if (filteredClients.length > 0 && currentPage > Math.ceil(filteredClients.length / pageLimit)) {
      setCurrentPage(1);
    }
  }, [filteredClients, currentPage, pageLimit]);

  // load initially
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch(`${server}/customer-account`); // ✅ same as working
        const data = await res.json();
        console.log("Fetched clients:", data);
        showNotification("success", `Fetched ${data.length} Clients`);
        setClients(data);
        setValue("customerSearch", "");
        // Reset pagination when new data loads
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching clients:", err);
        showNotification("error", "Error fetching clients");
      }
    };
    fetchClients();
  }, [server, setValue]);

  // 🔥 notify when they type something and get no results
  useEffect(() => {
    if (query && filteredClients.length === 0) {
      showNotification("error", "No matching clients found");
      // Reset to page 1
      setCurrentPage(1);
    }
  }, [query, filteredClients.length]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle limit change
  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const handleDownloadCSV = () => {
    if (filteredClients.length === 0) {
      showNotification("error", "No data to download"); // 🔥 added
      return;
    }

    const headers = columns.map((col) => col.label).join(",");
    const rows = filteredClients.map((client) =>
      columns.map((col) => client[col.key] ?? "").join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client_report.csv";

    a.click();
    window.URL.revokeObjectURL(url);

    showNotification("success", "Report Downloaded"); // 🔥 works same as your other screens
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredClients.length / pageLimit);
  const totalRecords = filteredClients.length;

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{paginatedData.length}</span> of{" "}
            <span className="font-medium">{totalRecords}</span> records
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="limit" className="text-sm text-gray-600">
              Rows per page:
            </label>
            <select
              id="limit"
              value={pageLimit}
              onChange={handleLimitChange}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          
          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading
        title="Client Report"
        onRefresh={async () => {
          try {
            const res = await fetch(`${server}/customer-account`);
            const data = await res.json();
            setClients(data);
            setValue("customerSearch", "");
            setCurrentPage(1); // Reset to first page on refresh

            showNotification("success", "Client list refreshed"); // 🔥 added
          } catch (err) {
            console.error("Error refreshing clients:", err);
            showNotification("error", "Error refreshing clients"); // 🔥 added
          }
        }}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />

      <div className="flex gap-2">
        <div className="flex-1">
          <InputBox
            placeholder="Search by Code or Name"
            register={register}
            setValue={setValue}
            value="customerSearch"
            onChange={(e) => setValue("customerSearch", e.target.value)}
          />
        </div>

        <div className="w=[10%]">
          <SimpleButton name="Download CSV" onClick={handleDownloadCSV} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md">
        <TableWithSorting
          register={register}
          setValue={setValue}
          name="Client Report"
          columns={columns}
          rowData={paginatedData}
          className="min-h-[60vh]"
        />
      </div>

      {/* Pagination Controls */}
      <PaginationControls />

      <div className="flex justify-between">
        <div className="text-sm text-gray-600">
          {totalRecords > 0 && (
            <span>Total Records: {totalRecords}</span>
          )}
        </div>
      </div>
    </div>
  );
}