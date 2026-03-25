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
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState({ search: "" });
  const [loading, setLoading] = useState(false);

  const [resetFactor, setResetFactor] = useState(false);

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

  const fetchClients = async (page = 1, searchQuery = "") => {
    setLoading(true);
    setCurrentFilters({ search: searchQuery });
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: pageLimit,
        search: searchQuery,
      });
      const res = await fetch(
        `${server}/customer-account?${queryParams.toString()}`,
      );
      const responseData = await res.json();

      const data = responseData.data || [];
      const pagination = responseData.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: data.length,
      };

      setClients(data);
      setCurrentPage(pagination.currentPage);
      setTotalPages(pagination.totalPages);
      setTotalRecords(pagination.totalRecords);

      showNotification(
        "success",
        `Fetched ${pagination.totalRecords} Clients (Page ${pagination.currentPage} of ${pagination.totalPages})`,
      );
    } catch (err) {
      console.error("Error fetching clients:", err);
      showNotification("error", "Error fetching clients");
    } finally {
      setLoading(false);
    }
  };

  // load initially

  // load initially
  useEffect(() => {
    fetchClients(1, "");
  }, [server]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    fetchClients(1, watch("customerSearch"));
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchClients(newPage, currentFilters.search);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    fetchClients(1, currentFilters.search);
  };

  const handleDownloadCSV = () => {
    if (clients.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    const headers = columns.map((col) => col.label).join(",");
    const rows = clients.map((client) =>
      columns.map((col) => client[col.key] ?? "").join(","),
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "client_report.csv";

    a.click();
    window.URL.revokeObjectURL(url);

    showNotification("success", "Report Downloaded");
  };

  const totalRecordsCount = totalRecords;

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{clients.length}</span> of{" "}
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
        onRefresh={() => {
          setValue("customerSearch", "");
          setResetFactor(!resetFactor);
          fetchClients(1, "");
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
            resetFactor={resetFactor}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearchSubmit(e);
              }
            }}
          />
        </div>

        <div className="flex gap-2">
          <OutlinedButtonRed
            label={loading ? "Searching..." : "Search"}
            onClick={handleSearchSubmit}
            disabled={loading}
          />
          <SimpleButton name="Download CSV" onClick={handleDownloadCSV} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md">
        <TableWithSorting
          register={register}
          setValue={setValue}
          name="Client Report"
          columns={columns}
          rowData={clients}
          className="h-[60vh]"
        />
      </div>

      {/* Pagination Controls */}
      <PaginationControls />

      {/* Total Records Display */}
      <div className="flex justify-between mt-2">
        <div className="text-sm text-gray-600">
          {totalRecordsCount > 0 && (
            <span>Total Records: {totalRecordsCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}
