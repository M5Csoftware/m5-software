import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Image from "next/image";
import CustomerTable from "./CustomerTable";
import CustomerAccount from "./CustomerAccount"; // ✅ Import CustomerAccount
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useDebounce } from "@/app/hooks/useDebounce";

// Filter Modal Component (unchanged)
const FilterModal = ({ isOpen, onClose, onApply, filterOptions, users }) => {
  const [filters, setFilters] = useState({
    accountType: "",
    city: "",
    state: "",
    country: "",
    branchCode: "",
    gstNumber: "",
    hub: "",
  });

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      accountType: "",
      city: "",
      state: "",
      country: "",
      branchCode: "",
      gstNumber: "",
      hub: "",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Filter Customers</h3>
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

        <div className="grid grid-cols-2 gap-4">
          {/* Account Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              value={filters.accountType}
              onChange={(e) =>
                setFilters({ ...filters, accountType: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.accountTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <select
              value={filters.state}
              onChange={(e) =>
                setFilters({ ...filters, state: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          {/* Country Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              value={filters.country}
              onChange={(e) =>
                setFilters({ ...filters, country: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Code Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Code
            </label>
            <select
              value={filters.branchCode}
              onChange={(e) =>
                setFilters({ ...filters, branchCode: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.branchCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          {/* GST Number Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              GST Number
            </label>
            <select
              value={filters.gstNumber}
              onChange={(e) =>
                setFilters({ ...filters, gstNumber: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.gstNumbers.map((gst) => (
                <option key={gst} value={gst}>
                  {gst}
                </option>
              ))}
            </select>
          </div>

          {/* Hub Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hub
            </label>
            <select
              value={filters.hub}
              onChange={(e) => setFilters({ ...filters, hub: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
            >
              <option value="">All</option>
              {filterOptions.hubs.map((hub) => (
                <option key={hub} value={hub}>
                  {hub}
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

function CustomerManagement({ setShowCustomerForm, setUserManagementForm }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [lineLeft, setLineLeft] = useState(0);
  const [lineWidth, setLineWidth] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const lineRef = useRef(null);
  const [appliedFilters, setAppliedFilters] = useState({});
  const lineRef = useRef(null);
  const [filterOptions, setFilterOptions] = useState({
    accountTypes: [],
    cities: [],
    states: [],
    countries: [],
    branchCodes: [],
    gstNumbers: [],
    hubs: [],
  });

  // ✅ NEW: State for edit mode
  const [currentView, setCurrentView] = useState("table"); // 'table' or 'form'
  const [editingUser, setEditingUser] = useState(null);

  const { 
    server, 
    getCachedData, 
    setCachedData, 
    isCacheValid 
  } = React.useContext(GlobalContext);

  // Memoize handleSort to avoid scoping issues during build
  const handleSort = React.useCallback(
    (key) => {
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
    },
    [filteredUsers, sortConfig]
  );

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const departmentMap = {
    All: null,
    Agents: "Agents",
    Customer: "Customer",
    Active: "Active",
    "De-activated": "De-activated",
  };

  const departments = Object.keys(departmentMap);

  const columns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "address1", label: "Address1" },
    { key: "address2", label: "Address2" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "pinCode", label: "PinCode" },
    { key: "contactPerson", label: "ContactPerson" },
    { key: "emailId", label: "EmailId" },
    { key: "telPhone", label: "TelPhone" },
    { key: "pan", label: "PAN" },
    { key: "serviceTax", label: "ServiceTax" },
    { key: "cinNo", label: "CINNo" },
    { key: "branchCode", label: "BranchCode" },
    { key: "branchName", label: "BranchName" },
    { key: "salePerson", label: "SalePerson" },
    { key: "refrenceBy", label: "RefrenceBy" },
    { key: "collectionBy", label: "CollectionBy" },
    { key: "accountManager", label: "AccountManager" },
    { key: "managedBy", label: "ManagedBy" },
    { key: "gm", label: "GM" },
    { key: "rm", label: "RM" },
    { key: "sm", label: "SM" },
    { key: "se", label: "SE" },
    { key: "applicableTariff", label: "ApplicableTariff" },
    { key: "serviceTaxOption", label: "ServiceTaxOption" },
    { key: "account", label: "Account" },
    { key: "creditLimitEnable", label: "CreditLimitEnable" },
    { key: "openingBalance", label: "OpeningBalance" },
    { key: "creditLimit", label: "CreditLimit" },
    { key: "createUser", label: "CreateUser" },
    { key: "serviceSetting", label: "ServiceSetting" },
    { key: "volDiscount", label: "VolDiscount" },
    { key: "portalPassword", label: "PortalPassword" },
    { key: "password", label: "Password" },
    { key: "labelSetting", label: "LabelSetting" },
    { key: "companyCode", label: "CompanyCode" },
    { key: "companyName", label: "CompanyName" },
    { key: "fuel", label: "Fuel" },
    { key: "fuelAmount", label: "FuelAmount" },
    { key: "saleType", label: "SaleType" },
    { key: "billingTag", label: "BillingTag" },
    { key: "gCode", label: "GCode" },
    { key: "gName", label: "GName" },
    { key: "reportPerson", label: "ReportPerson" },
    { key: "rateModify", label: "RateModify" },
    { key: "billingEmailId", label: "BillingEmailId" },
    { key: "rateType", label: "RateType" },
    { key: "rateDate", label: "RateDate" },
    { key: "currency", label: "Currency" },
    { key: "outGroupCode", label: "OutGroupCode" },
    { key: "csb", label: "CSB" },
    { key: "handling", label: "Handling" },
    { key: "billingCycle", label: "BillingCycle" },
    { key: "saleCoordinator", label: "SaleCoordinator" },
    { key: "paymentCycle", label: "PaymentCycle" },
    { key: "branded", label: "Branded" },
    { key: "hub", label: "HUB" },
    { key: "billDisplayName", label: "BillDisplayName" },
    { key: "noOfDaysCr", label: "NoOfDaysCr" },
    { key: "billType", label: "BillType" },
    { key: "logDate", label: "LogDate" },
    { key: "logUser", label: "LogUser" },
    { key: "accountOpeningDate", label: "AccountOpeningDate" },
    { key: "accountOpenUser", label: "AccountOpenUser" },
  ];

  // ✅ Function to fetch users with caching
  const fetchUsers = async (forceRefresh = false) => {
    try {
      const cacheKey = "CustomerManagement";
      
      // Check cache first if not forcing refresh
      if (!forceRefresh && isCacheValid(cacheKey)) {
        const cached = getCachedData(cacheKey);
        if (cached && cached.data) {
          // console.log("=== Using Cached Customer Data ===");
          setUsers(cached.data);
          
          // Still need to update filter options from cached data
          updateFilterOptions(cached.data);
          return;
        }
      }

      console.log("=== Fetching Fresh Customer Data from Server ===");
      const response = await axios.get(`${server}/customer-account`);
      const data = Array.isArray(response.data)
        ? response.data
        : [response.data];

      const mappedData = data.map((user) => ({
        ...user,
        name: user.name || user.UserName,
        contact: user.contactPerson || user.telNo || user.email,
        branch: user.branch || user.branchName,
        location: user.city,
        lastActive: user.updatedAt,
      }));

      setUsers(mappedData);
      
      // Update cache
      setCachedData(cacheKey, mappedData);

      updateFilterOptions(mappedData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Helper to update filter options
  const updateFilterOptions = (mappedData) => {
    const uniqueAccountTypes = [
      ...new Set(mappedData.map((u) => u.accountType).filter(Boolean)),
    ];
    const uniqueCities = [
      ...new Set(mappedData.map((u) => u.city).filter(Boolean)),
    ];
    const uniqueStates = [
      ...new Set(mappedData.map((u) => u.state).filter(Boolean)),
    ];
    const uniqueCountries = [
      ...new Set(mappedData.map((u) => u.country).filter(Boolean)),
    ];
    const uniqueBranchCodes = [
      ...new Set(mappedData.map((u) => u.branch).filter(Boolean)),
    ];
    const uniqueGstNumbers = [
      ...new Set(mappedData.map((u) => u.gst).filter(Boolean)),
    ];
    const uniqueHubs = [
      ...new Set(mappedData.map((u) => u.hub).filter(Boolean)),
    ];

    setFilterOptions({
      accountTypes: uniqueAccountTypes.sort(),
      cities: uniqueCities.sort(),
      states: uniqueStates.sort(),
      countries: uniqueCountries.sort(),
      branchCodes: uniqueBranchCodes.sort(),
      gstNumbers: uniqueGstNumbers.sort(),
      hubs: uniqueHubs.sort(),
    });
  };

  useEffect(() => {
    fetchUsers();
  }, [server]);

  // In your useEffect that filters users
  useEffect(() => {
    let filtered = [...users];

    // Apply department filter based on accountType
    const internalKey = departmentMap[selectedDepartment];
    if (internalKey === "Agents") {
      filtered = filtered.filter(
        (user) => user.accountType && user.accountType.toLowerCase() === "agent"
      );
    } else if (internalKey === "Customer") {
      filtered = filtered.filter(
        (user) =>
          user.accountType && user.accountType.toLowerCase() === "customer"
      );
    } else if (internalKey === "Active") {
      filtered = filtered.filter((user) => !user.deactivateReason);
    } else if (internalKey === "De-activated") {
      filtered = filtered.filter((user) => !!user.deactivateReason);
    }

    // Apply search filter - now searches name AND account code
    const query = debouncedSearchQuery.toLowerCase().trim();
    if (query !== "") {
      filtered = filtered.filter((user) => {
        // Check name
        if (user.name && user.name.toLowerCase().includes(query)) {
          return true;
        }
        // Check account code
        if (
          user.accountCode &&
          user.accountCode.toLowerCase().includes(query)
        ) {
          return true;
        }
        // Check email
        if (user.email && user.email.toLowerCase().includes(query)) {
          return true;
        }
        // Check contact person
        if (
          user.contactPerson &&
          user.contactPerson.toLowerCase().includes(query)
        ) {
          return true;
        }
        // Check phone number
        if (user.telNo && user.telNo.includes(query)) {
          return true;
        }
        // Check branch/city if needed
        if (user.city && user.city.toLowerCase().includes(query)) {
          return true;
        }
        if (user.branchName && user.branchName.toLowerCase().includes(query)) {
          return true;
        }
        return false;
      });
    }

    // Apply advanced filters
    if (appliedFilters.accountType) {
      filtered = filtered.filter(
        (user) => user.accountType === appliedFilters.accountType
      );
    }
    // ... rest of your advanced filters remain the same
    if (appliedFilters.city) {
      filtered = filtered.filter((user) => user.city === appliedFilters.city);
    }
    if (appliedFilters.state) {
      filtered = filtered.filter((user) => user.state === appliedFilters.state);
    }
    if (appliedFilters.country) {
      filtered = filtered.filter(
        (user) => user.country === appliedFilters.country
      );
    }
    if (appliedFilters.branchCode) {
      filtered = filtered.filter(
        (user) => user.branchCode === appliedFilters.branchCode
      );
    }
    if (appliedFilters.gstNumber) {
      filtered = filtered.filter(
        (user) => user.gstNumber === appliedFilters.gstNumber
      );
    }
    if (appliedFilters.hub) {
      filtered = filtered.filter((user) => user.hub === appliedFilters.hub);
    }

    setFilteredUsers(filtered);
  }, [users, selectedDepartment, searchQuery, appliedFilters]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const selectedElement = document.querySelector(
      `.department-tabs > li[data-dept='${selectedDepartment}']`
    );
    if (selectedElement && lineRef.current) {
      const ulElement = selectedElement.parentElement;
      setLineWidth(selectedElement.offsetWidth);
      setLineLeft(selectedElement.offsetLeft - ulElement.offsetLeft);
    }
  }, [selectedDepartment]);



  const handleDownloadExcel = async () => {
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

    const exportData = dataToExport.map((user) => {
      const row = {};
      columns.forEach((col) => {
        let value = user[col.key];

        if (col.key === "code") value = user.accountCode;
        if (col.key === "type") value = user.accountType;
        if (col.key === "address1") value = user.address1;
        if (col.key === "address2") value = user.address2;
        if (col.key === "emailId") value = user.email;
        if (col.key === "telPhone") value = user.telNo;

        row[col.label] = value || "";
      });
      return row;
    });

    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");

    const fileName =
      selectedIds.length > 0
        ? `selected_customers_${new Date().toISOString().split("T")[0]}.xlsx`
        : `all_customers_${new Date().toISOString().split("T")[0]}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const handleApplyFilters = (filters) => {
    setAppliedFilters(filters);
  };

  // ✅ NEW: Handler when user clicks "Edit details" in kebab menu
  const handleEditUser = (userData) => {
    // console.log("Opening form with user data:", userData);
    setEditingUser(userData);
    setCurrentView("form");
  };

  // ✅ NEW: Handler to go back to table view
  const handleBackToTable = () => {
    setCurrentView("table");
    setEditingUser(null);
    // Refresh the users list - can use cache here as it's just a back button
    fetchUsers();
  };

  // ✅ NEW: Handler after successful save
  const handleSaveSuccess = () => {
    // console.log("Save successful, returning to table and forcing refresh");
    setCurrentView("table");
    setEditingUser(null);
    // Force refresh the users list after a save
    fetchUsers(true);
  };

  const activeFilterCount = Object.values(appliedFilters).filter(
    (v) => v !== ""
  ).length;

  // ✅ Render CustomerAccount form if in form view
  if (currentView === "form") {
    return (
      <CustomerAccount
        onBack={handleBackToTable}
        prefilledUserData={editingUser}
        onSaveSuccess={handleSaveSuccess}
      />
    );
  }

  // ✅ Otherwise render the table view
  return (
    <div className="flex flex-col gap-8">
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        filterOptions={filterOptions}
        users={users}
      />

      <div className="justify-center items-center overflow-hidden w-full">
        <div className="flex justify-between">
          <div>
            <h1 className="text-[24px] font-bold">Customer Management</h1>
            <p className="text-sm font-sans text-[#979797]">
              Manage all the customer and their accounts here.
            </p>
          </div>

          <div className="flex gap-2 justify-center items-center">
            <button
              className="px-4 py-2.5  text-red border border-red rounded flex gap-2"
              onClick={() => setUserManagementForm(true)}
            >
              User Management
            </button>

            <div className="flex items-center gap-5 font-sans font-bold">
              <button
                className="px-4 py-3 bg-[#EA1B40] text-white rounded flex gap-2"
                onClick={() => setShowCustomerForm(true)}
              >
                <Image
                  src="/plus.svg"
                  alt="Add Employee"
                  width={16}
                  height={16}
                />
                Add Customer
              </button>
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
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD] px-4 py-[9px] hover:bg-gray-50 transition-colors relative"
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

              <button
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 bg-white rounded-lg border border-[#D0D5DD] px-4 py-[9px] hover:bg-gray-50 transition-colors relative"
              >
                <Image src="/filter.svg" alt="Filter" width={20} height={20} />
                <span className="font-sans text-gray-500 font-semibold">
                  Filter
                </span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#EA1B40] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <CustomerTable
            users={filteredUsers}
            onSort={handleSort}
            sortConfig={sortConfig}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            refetchUsers={() => fetchUsers(true)} // ✅ Force refresh on manual triggers
            onEditUser={handleEditUser} // ✅ Pass edit handler
          />
          {filteredUsers.length > 0 ? (
            ""
          ) : (
            <div className="p-4 text-center text-gray-500">
              No customers found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CustomerManagement;
