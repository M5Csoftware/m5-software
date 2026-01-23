import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { GlobalContext } from "@/app/lib/GlobalContext";
import CustomerManagementTable from "./CustomerManagementTable";
import * as XLSX from "xlsx";

function UserManagement({
  setUserManagementForm,
  setShowCustomerForm,
  onBack,
  setShowCreateAccount,
  setSelectedUserData,
  onEditCustomer, // ✅ NEW: Receive this prop
}) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [lineLeft, setLineLeft] = useState(0);
  const [lineWidth, setLineWidth] = useState(0);
  const lineRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const { server } = React.useContext(GlobalContext);
  const [fetching, setFetching] = useState(false);

  // Filter states
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedTurnover, setSelectedTurnover] = useState("All");

  // Options extracted from data
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [turnovers, setTurnovers] = useState([]);

  const departmentMap = {
    All: null,
    Pending: "Pending",
    Approved: "Approved",
    NonApproved: "Rejected",
  };

  const departments = Object.keys(departmentMap);
  const accountTypes = ["All", "Individual", "Business"];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${server}/portal/auth/register`);
        const data = Array.isArray(response.data)
          ? response.data
          : [response.data];

        const mappedData = data.map((user) => ({
          ...user,
          user: user.user,
          contact: user.mobileNumber,
          gstNumber: user.gstNumber,
          address: user.addressLine1,
          status: user.status || "pending",
        }));

        setUsers(mappedData);

        // Extract unique values for filters
        const uniqueCities = [
          ...new Set(data.map((u) => u.city).filter(Boolean)),
        ];
        const uniqueStates = [
          ...new Set(data.map((u) => u.state).filter(Boolean)),
        ];
        const uniqueTurnovers = [
          ...new Set(data.map((u) => u.turnover).filter(Boolean)),
        ];

        setCities(["All", ...uniqueCities.sort()]);
        setStates(["All", ...uniqueStates.sort()]);
        setTurnovers(["All", ...uniqueTurnovers.sort()]);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [fetching, server]);

  useEffect(() => {
    let filtered = [...users];

    // Filter by status based on selected department
    const statusFilter = departmentMap[selectedDepartment];
    if (statusFilter) {
      filtered = filtered.filter((user) => {
        const userStatus = user.status?.toLowerCase();
        const filterStatus = statusFilter.toLowerCase();
        return userStatus === filterStatus;
      });
    }

    // Filter by account type
    if (selectedAccountType !== "All") {
      filtered = filtered.filter(
        (user) =>
          user.accountType?.toLowerCase() === selectedAccountType.toLowerCase()
      );
    }

    // Filter by city
    if (selectedCity !== "All") {
      filtered = filtered.filter((user) => user.city === selectedCity);
    }

    // Filter by state
    if (selectedState !== "All") {
      filtered = filtered.filter((user) => user.state === selectedState);
    }

    // Filter by turnover
    if (selectedTurnover !== "All") {
      filtered = filtered.filter((user) => user.turnover === selectedTurnover);
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      filtered = filtered.filter(
        (user) =>
          user.fullName &&
          user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
    // Clear selected IDs when filters change
    setSelectedIds([]);
  }, [
    users,
    selectedDepartment,
    searchQuery,
    selectedAccountType,
    selectedCity,
    selectedState,
    selectedTurnover,
  ]);

  useEffect(() => {
    const selectedElement = document.querySelector(
      `.department-tabs > li[data-dept='${selectedDepartment}']`
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

  const handleClearFilters = () => {
    setSelectedAccountType("All");
    setSelectedCity("All");
    setSelectedState("All");
    setSelectedTurnover("All");
  };

  const handleCreateAccount = (user) => {
    if (setSelectedUserData && setShowCreateAccount) {
      setSelectedUserData(user);
      setShowCreateAccount(true);
    }
  };

  const handleDownloadExcel = () => {
    // Determine data to export based on selection
    const dataToExport =
      selectedIds.length > 0
        ? filteredUsers.filter((user) =>
          selectedIds.includes(user._id || user.id)
        )
        : filteredUsers;

    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    // Define comprehensive columns to export
    const exportColumns = [
      { key: "fullName", label: "Full Name" },
      { key: "emailId", label: "Email" },
      { key: "mobileNumber", label: "Contact Number" },
      { key: "accountType", label: "Account Type" },
      { key: "accountCode", label: "Account Code" },
      { key: "gstNumber", label: "GSTIN" },
      { key: "panNumber", label: "PAN Number" },
      { key: "addressLine1", label: "Address Line 1" },
      { key: "addressLine2", label: "Address Line 2" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "country", label: "Country" },
      { key: "zipCode", label: "Zip Code" },
      { key: "turnover", label: "Turnover" },
      { key: "status", label: "Status" },
    ];

    // Map the data to export format
    const exportData = dataToExport.map((user) => {
      const row = {};
      exportColumns.forEach((col) => {
        let value = user[col.key];

        // Format dates if present
        if ((col.key === "createdAt" || col.key === "updatedAt") && value) {
          value = new Date(value).toLocaleString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        }

        // Handle empty values
        row[col.label] = value !== undefined && value !== null ? value : "";
      });
      return row;
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths for better readability
    const columnWidths = exportColumns.map((col) => ({
      wch: Math.max(
        col.label.length + 2,
        ...exportData.map((row) => String(row[col.label] || "").length)
      ),
    }));
    ws["!cols"] = columnWidths;

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Management");

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName =
      selectedIds.length > 0
        ? `selected_users_${selectedIds.length}_${timestamp}.xlsx`
        : `all_users_${dataToExport.length}_${timestamp}.xlsx`;

    // Download the file
    XLSX.writeFile(wb, fileName);

    // Show success message
    console.log(
      selectedIds.length > 0
        ? `Downloaded ${selectedIds.length} selected user(s)`
        : `Downloaded all ${dataToExport.length} user(s)`
    );
  };

  const hasActiveFilters =
    selectedAccountType !== "All" ||
    selectedCity !== "All" ||
    selectedState !== "All" ||
    selectedTurnover !== "All";

  return (
    <div className="flex flex-col gap-8">
      <div className="justify-center items-center overflow-hidden w-full">
        <div className="flex justify-between">
          <div className="flex items-start gap-3">
            <span onClick={onBack} className="cursor-pointer mt-1">
              <Image
                src="./back-filled.svg"
                alt="back_arrow"
                width={15}
                height={13}
              />
            </span>
            <div className="flex flex-col gap-1">
              <h1 className="text-[24px] font-bold">User Management</h1>
              <p className="text-sm font-sans text-[#979797]">
                Manage new applied account to be approved/not-approved here.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div>
          <ul className="department-tabs list-none flex gap-6 font-sans font-semibold px-2">
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
                placeholder="Search customer"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 ">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD]"></div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadExcel}
                  className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD] px-4 py-[9px] hover:bg-gray-50 transition-colors relative"
                  title={
                    selectedIds.length > 0
                      ? `Download ${selectedIds.length} selected user(s)`
                      : `Download all ${filteredUsers.length} user(s)`
                  }
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
                  {selectedIds.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[#EA1B40] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                      {selectedIds.length}
                    </span>
                  )}
                </button>
                
                {/* Filter button with dropdown wrapper - FIXED POSITIONING */}
                <div className="relative">
                  <div
                    className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD] cursor-pointer"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <p className="px-4 py-[9px] flex gap-4 font-sans text-gray-500 font-semibold relative">
                      <Image
                        src="/filter.svg"
                        alt="Filter"
                        width={20}
                        height={20}
                      />
                      Filter
                      {hasActiveFilters && (
                        <span className="absolute -top-2 -right-2 bg-[#EA1B40] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                          {
                            [
                              selectedAccountType,
                              selectedCity,
                              selectedState,
                              selectedTurnover,
                            ].filter((f) => f !== "All").length
                          }
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Filter dropdown - positioned at bottom of button */}
                  {showFilterDropdown && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-[#D0D5DD] p-4 z-50">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-sm">Filters</h3>
                        {hasActiveFilters && (
                          <button
                            onClick={handleClearFilters}
                            className="text-xs text-[#EA1B40] font-semibold hover:underline"
                          >
                            Clear All
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Account Type Filter */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Account Type
                          </label>
                          <select
                            value={selectedAccountType}
                            onChange={(e) =>
                              setSelectedAccountType(e.target.value)
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
                          >
                            {accountTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City Filter */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            City
                          </label>
                          <select
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
                          >
                            {cities.map((city) => (
                              <option key={city} value={city}>
                                {city}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* State Filter */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            State
                          </label>
                          <select
                            value={selectedState}
                            onChange={(e) => setSelectedState(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
                          >
                            {states.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Turnover Filter */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Turnover
                          </label>
                          <select
                            value={selectedTurnover}
                            onChange={(e) => setSelectedTurnover(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
                          >
                            {turnovers.map((turnover) => (
                              <option key={turnover} value={turnover}>
                                {turnover}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="w-full mt-4 px-4 py-2 bg-[#EA1B40] text-white rounded-md text-sm font-semibold hover:bg-[#d01636]"
                      >
                        Apply Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <CustomerManagementTable
            users={filteredUsers}
            onSort={handleSort}
            sortConfig={sortConfig}
            refetchUsers={setFetching}
            onCreateAccount={handleCreateAccount}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onEditCustomer={onEditCustomer} // ✅ PASS IT HERE
          />
          {filteredUsers.length > 0 ? (
            ""
          ) : (
            <div className="p-4 text-center text-gray-500">
              No employees found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagement;