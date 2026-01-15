"use client";
import React, { useState, useMemo, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import InputBox, {
  DateInputBox,
  SearchInputBox,
} from "@/app/components/InputBox";
import Heading from "@/app/components/Heading";
import { TableWithSorting } from "@/app/components/Table";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import RedCheckbox from "@/app/components/RedCheckBox";
import NotificationFlag from "@/app/components/Notificationflag";
import CodeList from "@/app/components/CodeList";
import * as XLSX from "xlsx";
import { X } from "lucide-react";

function General() {
  const { register, setValue, watch, reset } = useForm({
    defaultValues: {
      Customer: "",
      from: "",
      to: "",
    },
  });
  const { server, setToggleCodeList, toggleCodeList } =
    useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [allData, setAllData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGroupingEnabled, setIsGroupingEnabled] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formKey, setFormKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [notification, setNotification] = useState({
    type: "",
    message: "",
    visible: false,
  });

  const fromDate = watch("from");
  const toDate = watch("to");
  const customerCode = watch("Customer");

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      visible: true,
    });
  };

  useEffect(() => {
    fetchCustomerAccountsForCodeList();
  }, []);

  const dmyToYmd = (d) => {
    if (!d) return "";
    const [dd, mm, yyyy] = d.split("/");
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchCustomerAccountsForCodeList = async () => {
    try {
      const response = await axios.get(`${server}/customer-account`);
      if (response.data) {
        const accounts = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setCustomerAccounts(
          accounts.map((acc) => ({
            accountCode: acc.accountCode,
            name: acc.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching customer accounts for code list:", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    if (isFullscreen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    let dataToFilter = isGroupingEnabled ? getGroupedData() : allData;

    if (searchTerm) {
      const filtered = dataToFilter.filter((item) => {
        if (item.isGroupTotal || item.isSpacer) {
          return false;
        }

        const accountCodeMatch = item.accountCode
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const nameMatch = item.name
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        return accountCodeMatch || nameMatch;
      });
      setRowData(filtered);
    } else {
      setRowData(dataToFilter);
    }
  }, [searchTerm, allData, isGroupingEnabled]);

  const getGroupedData = () => {
    if (allData.length === 0) return [];

    const grouped = allData.reduce((acc, item) => {
      const key = item.groupingCode || "No Group";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});

    const result = [];
    Object.keys(grouped).forEach((groupCode) => {
      const groupItems = grouped[groupCode];

      groupItems.forEach((item) => {
        result.push(item);
      });

      const groupTotalOutstanding = groupItems.reduce((total, item) => {
        return total + parseFloat(item.totalOutstanding || 0);
      }, 0);

      const groupAdvanceTotal = groupItems.reduce((total, item) => {
        return total + parseFloat(item.advance || 0);
      }, 0);

      const groupOsWithoutHoldTotal = groupItems.reduce((total, item) => {
        return total + parseFloat(item.osWithoutHold || 0);
      }, 0);

      const groupNetAmount = groupTotalOutstanding + groupAdvanceTotal;

      result.push({
        accountCode: "",
        groupingCode: `Group Code: ${groupCode}`,
        name: "",
        branch: "",
        state: "",
        city: "",
        hub: "",
        accountType: "",
        gst: "",
        billingTag: "",
        salePerson: "",
        account: "",
        noOfDaysCredit: "",
        creditLimit: "",
        totalSales: "",
        totalReceipt: "",
        totalOutstanding: groupTotalOutstanding.toFixed(2),
        advance: groupAdvanceTotal.toFixed(2),
        netAmount: groupNetAmount.toFixed(2),
        osWithoutHold: groupOsWithoutHoldTotal.toFixed(2),
        creditBalance: "",
        id: `group-${groupCode}`,
        isGroupTotal: true,
      });

      result.push({
        accountCode: "",
        groupingCode: "",
        name: "",
        branch: "",
        state: "",
        city: "",
        hub: "",
        accountType: "",
        gst: "",
        billingTag: "",
        salePerson: "",
        account: "",
        noOfDaysCredit: "",
        creditLimit: "",
        totalSales: "",
        totalReceipt: "",
        totalOutstanding: "",
        advance: "",
        netAmount: "",
        osWithoutHold: "",
        creditBalance: "",
        id: `spacer-${groupCode}`,
        isSpacer: true,
      });
    });

    return result;
  };

  const fetchAllCustomerAccounts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${server}/total-outstanding`);
      const customerData = await response.data;

      const transformedData = customerData.map((account) => {
        const totalOutstanding = parseFloat(account.totalOutstanding || 0);
        const totalSales = parseFloat(account.totalSales || 0);
        const totalReceipt = parseFloat(account.totalReceipt || 0);
        const advance = parseFloat(account.advance || 0);
        const creditBalance = parseFloat(account.creditBalance || 0);

        const netAmount = (totalOutstanding + advance).toFixed(2);

        return {
          accountCode: account.accountCode,
          groupingCode: account.groupCode || "",
          name: account.name,
          branch: account.branch,
          state: account.state,
          city: account.city,
          hub: account.hub,
          accountType: account.accountType,
          gst: account.gst,
          billingTag: account.billingTag,
          salePerson: account.salesPersonName,
          account: account.account,
          noOfDaysCredit: account.noOfDaysCredit,
          creditLimit: account.creditLimit,
          totalSales: totalSales.toFixed(2),
          totalReceipt: totalReceipt.toFixed(2),
          totalOutstanding: totalOutstanding.toFixed(2),
          advance: advance.toFixed(2),
          netAmount: netAmount,
          osWithoutHold: parseFloat(account.osWithoutHold || 0).toFixed(2),
          creditBalance: creditBalance.toFixed(2),
          id: account._id,
        };
      });

      setAllData(transformedData);
      showNotification(
        "success",
        `Found ${transformedData.length} customer accounts`
      );
    } catch (err) {
      console.error("Error fetching customer accounts:", err);
      setError("Failed to fetch customer accounts");
      showNotification("error", "Failed to fetch customer accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerAccountsByDateRange = async () => {
    try {
      setLoading(true);
      setError("");

      if (!fromDate || !toDate) {
        setError("Please select both from and to dates");
        showNotification("error", "Please select both from and to dates");
        return;
      }

      const response = await axios.get(`${server}/total-outstanding`, {
        params: {
          fromDate: dmyToYmd(fromDate),
          toDate: dmyToYmd(toDate),
        },
      });

      const customerData = response.data;

      const transformedData = customerData.map((account) => {
        const totalOutstanding = parseFloat(account.totalOutstanding || 0);
        const totalSales = parseFloat(account.totalSales || 0);
        const totalReceipt = parseFloat(account.totalReceipt || 0);
        const advance = parseFloat(account.advance || 0);
        const creditBalance = parseFloat(account.creditBalance || 0);

        const netAmount = (totalOutstanding + advance).toFixed(2);

        return {
          accountCode: account.accountCode,
          groupingCode: account.groupCode || "",
          name: account.name,
          branch: account.branch,
          state: account.state,
          city: account.city,
          hub: account.hub,
          accountType: account.accountType,
          gst: account.gst,
          billingTag: account.billingTag,
          salePerson: account.salesPersonName,
          account: account.account,
          noOfDaysCredit: account.noOfDaysCredit,
          creditLimit: account.creditLimit,
          totalSales: totalSales.toFixed(2),
          totalReceipt: totalReceipt.toFixed(2),
          totalOutstanding: totalOutstanding.toFixed(2),
          advance: advance.toFixed(2),
          netAmount: netAmount,
          osWithoutHold: parseFloat(account.osWithoutHold || 0).toFixed(2),
          creditBalance: creditBalance.toFixed(2),
          id: account._id,
        };
      });

      setAllData(transformedData);
      showNotification(
        "success",
        `Found ${transformedData.length} records for selected date range`
      );
    } catch (err) {
      console.error("Error fetching customer accounts by date:", err);
      setError("Failed to fetch customer accounts for the selected date range");
      showNotification(
        "error",
        "Failed to fetch customer accounts for the selected date range"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleCustomerAccount = async (accountCode) => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `${server}/total-outstanding?accountCode=${accountCode}`
      );

      if (response.data) {
        const account = response.data;
        const totalOutstanding = parseFloat(account.totalOutstanding || 0);
        const totalSales = parseFloat(account.totalSales || 0);
        const totalReceipt = parseFloat(account.totalReceipt || 0);
        const advance = parseFloat(account.advance || 0);
        const creditBalance = parseFloat(account.creditBalance || 0);

        const netAmount = (totalOutstanding + advance).toFixed(2);

        const transformedData = [
          {
            accountCode: account.accountCode,
            groupingCode: account.groupCode || "",
            name: account.name,
            branch: account.branch,
            state: account.state,
            city: account.city,
            hub: account.hub,
            accountType: account.accountType,
            gst: account.gst,
            billingTag: account.billingTag,
            salePerson: account.salesPersonName,
            account: account.account,
            noOfDaysCredit: account.noOfDaysCredit,
            creditLimit: account.creditLimit,
            totalSales: totalSales.toFixed(2),
            totalReceipt: totalReceipt.toFixed(2),
            totalOutstanding: totalOutstanding.toFixed(2),
            advance: advance.toFixed(2),
            netAmount: netAmount,
            osWithoutHold: parseFloat(account.osWithoutHold || 0).toFixed(2),
            creditBalance: creditBalance.toFixed(2),
            id: account._id,
          },
        ];

        setAllData(transformedData);
        showNotification("success", "Customer account loaded successfully");
      }
    } catch (err) {
      console.error("Error fetching customer account:", err);
      setError("Failed to fetch customer account");
      showNotification("error", "Failed to fetch customer account");
    } finally {
      setLoading(false);
    }
  };

  const handleShow = () => {
    if (customerCode && customerCode.trim() !== "") {
      fetchSingleCustomerAccount(customerCode.trim());
    } else {
      fetchCustomerAccountsByDateRange();
    }
  };

  const handleShowAll = () => {
    fetchAllCustomerAccounts();
  };

  const calculateTotal = () => {
    return rowData
      .filter((item) => !item.isGroupTotal && !item.isSpacer)
      .reduce((total, item) => {
        return total + parseFloat(item.totalOutstanding || 0) + parseFloat(item.advance || 0);
      }, 0)
      .toFixed(2);
  };

  const columns = useMemo(
    () => [
      { key: "accountCode", label: "Customer Code" },
      { key: "groupingCode", label: "Grouping Code" },
      { key: "name", label: "Customer Name" },
      { key: "branch", label: "Branch Code" },
      { key: "state", label: "State" },
      { key: "city", label: "City" },
      { key: "hub", label: "Hub" },
      { key: "accountType", label: "Type" },
      { key: "gst", label: "GST" },
      { key: "billingTag", label: "Billing Tag" },
      { key: "salePerson", label: "Sale Person" },
      { key: "account", label: "Account" },
      { key: "noOfDaysCredit", label: "No Of Days Credit Limit" },
      { key: "creditLimit", label: "Credit Limit" },
      { key: "totalReceipt", label: "Total Receipt" },
      { key: "totalSales", label: "Total Sales" },
      { key: "totalOutstanding", label: "Total Outstanding" },
      { key: "advance", label: "Advance" },
      { key: "netAmount", label: "Net Amount" },
      { key: "creditBalance", label: "Credit Balance" },
      { key: "osWithoutHold", label: "OS without Hold" },
    ],
    []
  );

  const codeListColumns = useMemo(
    () => [
      { key: "accountCode", label: "Customer Code" },
      { key: "name", label: "Customer Name" },
    ],
    []
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClose = () => {
    setRowData([]);
    setAllData([]);
    setSearchTerm("");
    setError("");
    setIsGroupingEnabled(false);
    setValue("Customer", "");
    setValue("from", "");
    setValue("to", "");
  };

  const handleDownloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const dataToDownload = rowData.filter((item) => !item.isSpacer);
      const headers = columns.map((col) => col.label);

      const csvContent = [
        headers.join(","),
        ...dataToDownload.map((row) =>
          columns
            .map((col) => {
              const value = row[col.key] || "";
              return typeof value === "string" && value.includes(",")
                ? `"${value.replace(/"/g, '""')}"`
                : value;
            })
            .join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `customer_accounts_${new Date().getTime()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", "CSV file downloaded successfully");
    } catch (error) {
      console.error("Error downloading CSV:", error);
      showNotification("error", "Failed to download CSV file");
    }
  };

  const handleDownloadExcel = () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download");
      return;
    }

    try {
      const dataToDownload = rowData.filter((item) => !item.isSpacer);

      const wsData = [
        columns.map((col) => col.label),
        ...dataToDownload.map((row) =>
          columns.map((col) => row[col.key] || "")
        ),
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      const colWidths = columns.map(() => ({ wch: 15 }));
      ws["!cols"] = colWidths;

      const headerRange = XLSX.utils.decode_range(ws["!ref"]);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "EEEEEE" } },
          };
        }
      }

      XLSX.utils.book_append_sheet(wb, ws, "Customer Accounts");
      XLSX.writeFile(wb, `customer_accounts_${new Date().getTime()}.xlsx`);

      showNotification("success", "Excel file downloaded successfully");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      showNotification("error", "Failed to download Excel file");
    }
  };

  const handleRefresh = () => {
    setRowData([]);
    setAllData([]);
    setSearchTerm("");
    setError("");
    setIsGroupingEnabled(false);
    setLoading(false);

    setFormKey((prev) => prev + 1);
    setRefreshKey((prev) => prev + 1);

    reset({
      Customer: "",
      from: "",
      to: "",
    });

    showNotification("success", "Page refreshed successfully");
  };

  const handleCodeListAction = (action, data) => {
    if (action === "edit") {
      setValue("Customer", data.accountCode);
      setToggleCodeList(false);
    }
  };

  return (
    <>
      <form className="flex flex-col gap-3" key={formKey}>
        <NotificationFlag
          type={notification.type}
          message={notification.message}
          visible={notification.visible}
          setVisible={(visible) =>
            setNotification((prev) => ({ ...prev, visible }))
          }
        />

        <Heading
          title="Total Outstanding"
          bulkUploadBtn="hidden"
          codeListBtn={true}
          fullscreenBtn={true}
          onRefresh={handleRefresh}
          onClickFullscreenBtn={() => setIsFullscreen(true)}
        />

        <div className="flex flex-col gap-3 mt-6">
          <div className="flex gap-3">
            <div className="w-1/3">
              <InputBox
                key={`Customer-${formKey}`}
                placeholder="Customer Code"
                register={register}
                setValue={setValue}
                value="Customer"
              />
            </div>
            <div className="w-1/4">
              <DateInputBox
                key={`from-${formKey}`}
                register={register}
                setValue={setValue}
                value={`from`}
                placeholder="From"
                disabled={!!customerCode}
              />
            </div>
            <div className="w-1/4">
              <DateInputBox
                key={`to-${formKey}`}
                register={register}
                setValue={setValue}
                value={`to`}
                placeholder="To"
                disabled={!!customerCode}
              />
            </div>

            <div>
              <OutlinedButtonRed
                type="button"
                label={loading ? "Loading..." : "Show"}
                onClick={handleShow}
                disabled={loading}
              />
            </div>
            <div className="flex gap-2">
              <div className="w-50">
                <OutlinedButtonRed
                  type="button"
                  label={loading ? "Loading..." : "Show All"}
                  onClick={handleShowAll}
                  disabled={loading}
                />
              </div>
              <div className="w-[45.5%]">
                <DownloadDropdown
                  type="button"
                  name="Download"
                  handleDownloadExcel={handleDownloadExcel}
                  handleDownloadCSV={handleDownloadCSV}
                />
              </div>
            </div>
            {/* <div className="flex gap-2">
              <DownloadDropdown
                type="button"
                name="Download"
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
                disabled={rowData.length === 0 ? true : false}
              />
            </div> */}
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm p-2 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        <div className="flex items-center">
          <RedCheckbox
            key={`grouping-${formKey}`}
            id="grouping"
            register={register}
            setValue={setValue}
            isChecked={isGroupingEnabled}
            setChecked={setIsGroupingEnabled}
            label="Group by Grouping Code"
          />
        </div>

        <div className="">
          <SearchInputBox
            placeholder="Search Outstanding"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        <div>
          {loading ? (
            <div className="flex justify-center items-center h-[45vh] border border-[#D0D5DD] rounded">
              <p className="text-gray-500">Loading customer accounts...</p>
            </div>
          ) : rowData.length > 0 ? (
            <>
              <TableWithSorting
                register={register}
                setValue={setValue}
                columns={columns}
                rowData={rowData}
                className="border-b-0 rounded-b-none h-[45vh]"
              />
              <div className="flex justify-end border border-t-0 border-[#D0D5DD] border-opacity-75 bg-[#D0D5DDB8] text-gray-900 rounded rounded-t-none font-sans px-4 py-2">
                <div>
                  Total: <span className="text-red">{calculateTotal()}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center items-center h-[45vh] border border-[#D0D5DD] rounded">
              <p className="text-gray-500">
                {customerCode
                  ? "Click 'Show' to load customer account"
                  : fromDate && toDate
                    ? "Click 'Show' to load customer accounts for selected dates"
                    : "Click 'Show All' to load customer accounts"}
              </p>
            </div>
          )}
        </div>

        {isFullscreen && (
          <div className="fixed inset-0 z-50 bg-white p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Total Outstanding - Fullscreen View
              </h2>
              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto">
              <TableWithSorting
                register={register}
                setValue={setValue}
                columns={columns}
                rowData={rowData}
                className="h-full w-full"
              />
            </div>
            <div className="flex justify-end border-t border-gray-300 pt-4 mt-4">
              <div>
                <span className="font-semibold">Total: </span>
                <span className="text-red font-semibold">
                  {calculateTotal()}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <div>
            {/* <OutlinedButtonRed
              type="button"
              label="Close"
              onClick={handleClose}
            /> */}
          </div>
        </div>
      </form>

      <CodeList
        data={customerAccounts}
        columns={codeListColumns}
        name="Customer Accounts"
        handleAction={handleCodeListAction}
      />
    </>
  );
}

export default General;