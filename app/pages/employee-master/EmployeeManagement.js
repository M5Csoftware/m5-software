import React, { useEffect, useRef, useState, useContext } from "react";
import axios from "axios";
import Image from "next/image";
import EmployeeTable from "./EmployeeTable";
import { GlobalContext } from "@/app/lib/GlobalContext";
import * as XLSX from "xlsx";

function EmployeeManagement({ setShowEmployeeForm, onEditEmployee }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [lineLeft, setLineLeft] = useState(0);
  const [lineWidth, setLineWidth] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const lineRef = useRef(null);
  const ulRef = useRef(null);
  const { server } = useContext(GlobalContext);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({
    departments: [
      "Operations",
      "Sales",
      "Billing",
      "Customer Support",
      "Sale Support",
      "Account",
    ],
    roles: ["User", "Admin", "Branch User", "Counter Part"],
    hubs: [],
    branches: [],
  });

  const departmentMap = {
    All: null,
    Operations: "Operation",
    Sales: "Sales",
    Billing: "Billing",
    "Customer Support": "CSD (Customer Service Department)",
    "Sale Support": "Sale Support",
    Account: "Account",
  };

  const departments = Object.keys(departmentMap);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${server}/employee-master`);
      const data = Array.isArray(response.data)
        ? response.data
        : [response.data];

      // If you want to map or rename fields, do it here
      const mappedData = data;

      // Extract unique hubs and branches
      const uniqueHubs = [
        ...new Set(mappedData.map((u) => u.hub).filter(Boolean)),
      ];
      const uniqueBranches = [
        ...new Set(mappedData.map((u) => u.branch).filter(Boolean)),
      ];

      // Update filter options
      setFilterOptions((prev) => ({
        ...prev,
        hubs: uniqueHubs.sort(),
        branches: uniqueBranches.sort(),
      }));

      // Set users
      setUsers(mappedData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [refreshTrigger]);

  // useEffect(() => {
  //   let filtered = [...users];

  //   const internalKey = departmentMap[selectedDepartment];
  //   if (internalKey) {
  //     filtered = filtered.filter(
  //       (user) => user.permissions?.[internalKey] === true
  //     );
  //   }

  //   if (searchQuery.trim() !== "") {
  //     filtered = filtered.filter((user) =>
  //       (user.userName || "").toLowerCase().includes(searchQuery.toLowerCase())
  //     );
  //   }

  //   setFilteredUsers(filtered);
  // }, [users, selectedDepartment, searchQuery]);

  useEffect(() => {
    const selectedElement = ulRef.current?.querySelector(
      `li[data-dept="${selectedDepartment}"]`
    );
    if (selectedElement && lineRef.current) {
      const ulElement = selectedElement.parentElement;
      setLineWidth(selectedElement.offsetWidth);
      setLineLeft(selectedElement.offsetLeft - ulElement.offsetLeft);
    }
  }, [selectedDepartment]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredUsers(sortedUsers);
  };

  const handleDownloadExcel = () => {
  let dataToExport = filteredUsers;

  if (selectedIds.length > 0) {
    dataToExport = filteredUsers.filter((user) =>
      selectedIds.includes(user.id || user._id || user.userId)
    );
  }

  if (dataToExport.length === 0) {
    alert("No data to export");
    return;
  }

  // Updated columns to include email
  const columns = [
    { key: "userId", label: "User ID" },
    { key: "userName", label: "Name" },
    { key: "email", label: "Email" }, // Added email field
    { key: "department", label: "Department" },
    { key: "role", label: "Role" },
    { key: "hub", label: "Hub" },
    { key: "branch", label: "Branch" },
    { key: "password", label: "Password" },
  ];

  const exportData = dataToExport.map((user) => {
    const row = {};
    columns.forEach((col) => {
      // Get the email value - you might need to adjust the property name
      // If your API returns email differently, change 'email' to the correct property name
      // For example: user.emailId, user.emailAddress, etc.
      row[col.label] = user[col.key] || "";
    });
    return row;
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");

  XLSX.writeFile(
    wb,
    `employees_${new Date().toISOString().split("T")[0]}.xlsx`
  );
};

  const handleEmployeeAction = async (action, employeeData) => {
    if (action === "edit") {
      onEditEmployee(employeeData);
    } else if (action === "delete") {
      if (confirm("Are you sure you want to delete this employee?")) {
        try {
          await axios.delete(`${server}/employee-master`, {
            params: { userId: employeeData.userId },
          });
          setRefreshTrigger((prev) => prev + 1);
        } catch (error) {
          console.error("Error deleting employee:", error);
          alert("Failed to delete employee. Please try again.");
        }
      }
    } else if (action === "deactivate") {
      try {
        await axios.patch(`${server}/employee-master/deactivate`, {
          userId: employeeData.userId,
        });
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error deactivating employee:", error);
      }
    } else if (action === "activate") {
      try {
        await axios.patch(`${server}/employee-master/activate`, {
          userId: employeeData.userId,
        });
        setRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Error activating employee:", error);
      }
    }
  };

  useEffect(() => {
    let filtered = [...users];

    if (selectedDepartment !== "All") {
      filtered = filtered.filter(
        (user) => user.department === selectedDepartment
      );
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toString().toLowerCase();
      filtered = filtered.filter((user) => {
        const name = (user.userName || "").toString().toLowerCase();
        const id = (user.userId || "").toString().toLowerCase();
        return name.includes(q) || id.includes(q);
      });
    }

    if (appliedFilters.department)
      filtered = filtered.filter(
        (u) => u.department === appliedFilters.department
      );
    if (appliedFilters.role)
      filtered = filtered.filter((u) => u.role === appliedFilters.role);
    if (appliedFilters.hub)
      filtered = filtered.filter((u) => u.hub === appliedFilters.hub);
    if (appliedFilters.branch)
      filtered = filtered.filter((u) => u.branch === appliedFilters.branch);
    if (appliedFilters.status)
      filtered = filtered.filter((u) =>
        appliedFilters.status === "Active"
          ? !u.deactivateReason
          : !!u.deactivateReason
      );

    setFilteredUsers(filtered);
  }, [users, selectedDepartment, searchQuery, appliedFilters]);

  // Reset selection when filters or search change
  useEffect(() => {
    setSelectedIds([]);
  }, [selectedDepartment, searchQuery, appliedFilters]);

  // useEffect(() => {
  //   let filtered = [...users];

  //   // Department tab
  //   if (selectedDepartment !== "All") {
  //     filtered = filtered.filter(
  //       (user) => user.department === selectedDepartment
  //     );
  //   }

  //   // Search
  //   if (searchQuery) {
  //     filtered = filtered.filter((user) =>
  //       (user.userName || "").toLowerCase().includes(searchQuery.toLowerCase())
  //     );
  //   }

  //   // Applied filters from modal
  //   if (appliedFilters.department)
  //     filtered = filtered.filter(
  //       (u) => u.department === appliedFilters.department
  //     );
  //   if (appliedFilters.role)
  //     filtered = filtered.filter((u) => u.role === appliedFilters.role);
  //   if (appliedFilters.hub)
  //     filtered = filtered.filter((u) => u.hub === appliedFilters.hub);
  //   if (appliedFilters.branch)
  //     filtered = filtered.filter((u) => u.branch === appliedFilters.branch);
  //   if (appliedFilters.status)
  //     filtered = filtered.filter((u) =>
  //       appliedFilters.status === "Active"
  //         ? !u.deactivateReason
  //         : !!u.deactivateReason
  //     );

  //   setFilteredUsers(filtered);
  // }, [users, selectedDepartment, searchQuery, appliedFilters]);

  return (
    <div className="flex flex-col gap-8">
      <EmployeeFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => setAppliedFilters(filters)}
        filterOptions={filterOptions}
      />

      <div className="justify-center items-center overflow-hidden w-full">
        <div className="flex justify-between">
          <div>
            <h1 className="text-[24px] font-bold">Employee Management</h1>
            <p className="text-sm font-sans text-[#979797]">
              Manage employees/department and their account permissions here.
            </p>
          </div>
          <div className="flex items-center gap-5 font-sans font-bold">
            <button
              className="px-4 py-3 bg-[#EA1B40] text-white rounded flex gap-2"
              onClick={() => setShowEmployeeForm(true)}
            >
              <Image
                src="/plus.svg"
                alt="Add Employee"
                width={16}
                height={16}
              />
              Add Employee
            </button>
          </div>
        </div>
      </div>

      <div>
        <div>
          <ul
            className="department-tabs list-none flex gap-6 font-sans font-semibold px-2"
            ref={ulRef}
          >
            {departments.map((dept) => (
              <li
                key={dept}
                data-dept={dept}
                style={{
                  cursor: "pointer",
                  fontSize: "14px",
                  color: selectedDepartment === dept ? "black" : "inherit",
                }}
                onClick={() => setSelectedDepartment(dept)}
              >
                {dept}
              </li>
            ))}
          </ul>
          <div className="relative mt-1">
            <div
              ref={lineRef}
              className="transition-all duration-400 rounded-t-lg absolute bottom-[1px] bg-[#EA1B40]"
              style={{ width: lineWidth, height: "3px", left: lineLeft }}
            ></div>
          </div>
        </div>

        <div className="bg-gray-100 border-gray-200 rounded-lg shadow-sm">
          <div className="flex justify-between p-3">
            <div className="border rounded-md overflow-hidden font-sans bg-white border-french-gray flex items-center gap-4 pl-6 text-sm">
              <Image alt="search" src="/search.svg" width={18} height={18} />
              <input
                className="outline-none h-9 pr-4 placeholder:font-semibold w-full"
                type="search"
                placeholder="Search employee"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD] px-4 py-[9px] hover:bg-gray-50 transition-colors relative"
                onClick={handleDownloadExcel}
              >
                <Image
                  src="/Download-gray.svg"
                  alt="download"
                  width={20}
                  height={20}
                />
                <span className="font-sans text-gray-500 font-semibold">
                  Download
                </span>
              </button>

              <div className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD]">
                <button
                  onClick={() => setShowFilterModal(true)}
                  className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD] px-4 py-[9px] hover:bg-gray-50 transition-colors relative"
                >
                  <Image
                    src="/filter.svg"
                    alt="Filter"
                    width={20}
                    height={20}
                  />
                  <span className="font-sans text-gray-500 font-semibold">
                    Filter
                  </span>
                  {Object.values(appliedFilters).filter((v) => v).length >
                    0 && (
                    <span className="absolute -top-2 -right-2 bg-[#EA1B40] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {Object.values(appliedFilters).filter((v) => v).length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          <EmployeeTable
            users={filteredUsers}
            onSort={handleSort}
            sortConfig={sortConfig}
            onEmployeeAction={handleEmployeeAction}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
          />

          {filteredUsers.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No employees found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmployeeManagement;

const EmployeeFilterModal = ({ isOpen, onClose, onApply, filterOptions }) => {
  const [filters, setFilters] = useState({
    department: "",
    role: "",
    status: "",
  });

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({ department: "", role: "", status: "" });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Filter Employees</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-red">
            <svg
              className="w-3 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hub
            </label>
            <select
              value={filters.hub || ""}
              onChange={(e) => setFilters({ ...filters, hub: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.hubs.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={filters.branch || ""}
              onChange={(e) =>
                setFilters({ ...filters, branch: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-[#EA1B40] text-white rounded-md hover:bg-[#d01636] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};
