"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithSorting } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import React, {
  useMemo,
  useState,
  useContext,
  useCallback,
  useEffect,
} from "react";
import { useForm } from "react-hook-form";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import { X } from "lucide-react";

const MultipleRunWise = () => {
  const { register, setValue, watch } = useForm();
  const { server } = useContext(GlobalContext);

  // State management
  const [dateFormat, setdateFormat] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [MultipleRunReset, setMultipleRunReset] = useState(false);
  const [runNumberReset, setRunNumberReset] = useState(false);
  const [runNumbers, setRunNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 30;
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  // Watch accountCode field for auto-fetch
  const accountCode = watch("accountCode");

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  // Auto-fetch customer name when accountCode changes
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (accountCode && accountCode.trim()) {
        try {
          const response = await fetch(`${server}/multiple-run-wise`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accountCode: accountCode.trim(),
              fetchCustomerName: true,
            }),
          });

          const result = await response.json();

          if (result.success && result.customerName) {
            setValue("name", result.customerName);
          } else {
            setValue("name", "");
          }
        } catch (error) {
          console.error("Error fetching customer name:", error);
        }
      } else {
        setValue("name", "");
      }
    };

    const timer = setTimeout(() => {
      fetchCustomerName();
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [accountCode, server, setValue]);

  const handleRefresh = () => {
    setMultipleRunReset(!MultipleRunReset);
    setRunNumbers([]);
    setRowData([]);
    setCurrentPage(1);
    setTotalPages(0);
    setValue("runNumber", "");
    setValue("accountCode", "");
    setValue("name", "");
  };

  // Add run number to list
  const handleAddRunNumber = () => {
    const inputValue = watch("runNumber");
    if (
      inputValue &&
      inputValue.trim() &&
      !runNumbers.includes(inputValue.trim())
    ) {
      setRunNumbers([...runNumbers, inputValue.trim()]);
      setValue("runNumber", "");
      setRunNumberReset(!runNumberReset);
      showNotification("success", `Run number ${inputValue.trim()} added`);
    } else if (inputValue && runNumbers.includes(inputValue.trim())) {
      showNotification("warning", "This run number already exists");
    } else {
      showNotification("warning", "Please enter a run number");
    }
  };

  // Remove run number from list
  const handleRemoveRunNumber = (index) => {
    setRunNumbers(runNumbers.filter((_, i) => i !== index));
  };

  // Fetch data from backend
  const fetchData = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      try {
        const fromRaw = watch("from");
        const toRaw = watch("to");
        const branch = watch("branch");
        const sector = watch("sector");
        const accountCodeVal = watch("accountCode");
        const origin = watch("origin");
        const destination = watch("destination");
        const network = watch("network");
        const counterPart = watch("counterPart");

        // Check if dates are mandatory based on specific filters
        const mandatoryPresence = !!(
          branch ||
          sector ||
          accountCodeVal ||
          destination ||
          network ||
          counterPart
        );
        const hasRunNumbers = runNumbers && runNumbers.length > 0;
        const optionalPresence = !!(hasRunNumbers || origin);

        if (optionalPresence) {
          // Run Numbers or Origin present: Dates are optional even if mandatory filters are present
        } else if (mandatoryPresence && (!fromRaw || !toRaw)) {
          showNotification(
            "error",
            "From and To dates are required for specific filter searches.",
          );
          setLoading(false);
          return;
        }

        if (!mandatoryPresence && !optionalPresence && (!fromRaw || !toRaw)) {
          showNotification("error", "Please select From and To dates");
          setLoading(false);
          return;
        }

        let fromISO = "";
        let toISO = "";

        if (fromRaw && toRaw) {
          const fromParsed = parseDateDDMMYYYY(fromRaw);
          const toParsed = parseDateDDMMYYYY(toRaw);

          if (
            !fromParsed ||
            !toParsed ||
            isNaN(fromParsed.getTime()) ||
            isNaN(toParsed.getTime())
          ) {
            showNotification("error", "Invalid date format");
            setLoading(false);
            return;
          }

          fromParsed.setHours(0, 0, 0, 0);
          toParsed.setHours(23, 59, 59, 999);

          fromISO = fromParsed.toISOString();
          toISO = toParsed.toISOString();
        }

        const payload = {
          runNumbers,
          accountCode: watch("accountCode") || "",
          branch: watch("branch") || "",
          origin: watch("origin") || "",
          sector: watch("sector") || "",
          destination: watch("destination") || "",
          network: watch("network") || "",
          counterPart: watch("counterPart") || "",
          from: fromISO,
          to: toISO,
          page: pageNum,
          itemsPerPage,
        };

        const response = await fetch(`${server}/multiple-run-wise`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.success) {
          const sanitizedData = result.data.map((item) => {
            if (item.status?.toLowerCase() !== "delivered") {
              return {
                ...item,
                status: "",
                eventDate: "",
                eventTime: "",
                remark: "",
              };
            }
            return item;
          });
          setRowData(sanitizedData);
          setTotalPages(result.pagination.totalPages);
          setTotalCount(result.pagination.totalCount);
          setCurrentPage(pageNum);

          if (result.data.length === 0) {
            showNotification("info", "No data found matching your filters");
          } else {
            showNotification("success", `Loaded ${result.data.length} records`);
          }
        } else {
          showNotification("error", result.error || "Failed to fetch data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        showNotification("error", "Error fetching data: " + error.message);
      } finally {
        setLoading(false);
      }
    },
    [runNumbers, watch, server, itemsPerPage],
  );

  const showNotification = (type, message) => {
    setNotification({
      type: type,
      message: message,
      visible: true,
    });
    setTimeout(() => {
      setNotification((prev) => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Pagination handlers
  const goToPage = (pageNum) => {
    fetchData(pageNum);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxPages = 5;

    if (totalPages <= maxPages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxPages; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - maxPages + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
  };

  // Export to Excel
  const exportToExcel = () => {
    if (rowData.length === 0) {
      showNotification("warning", "No data to export");
      return;
    }

    // Create workbook and worksheet
    const worksheet_data = [
      columns.map((col) => col.label), // Headers
      ...rowData.map((row) => columns.map((col) => row[col.key] || "")),
    ];

    // Convert to CSV format but save as .xlsx
    const ws = worksheet_data.map((row) => row.join("\t")).join("\n");

    // Create Excel file using HTML table method
    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Sheet1</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
        </head>
        <body>
          <table>
            ${worksheet_data
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
              )
              .join("")}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelContent], {
      type: "application/vnd.ms-excel",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `multiple-run-wise-${
      new Date().toISOString().split("T")[0]
    }.xls`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification("success", "Data exported to Excel successfully");
  };

  // Download CSV
  const downloadCSV = () => {
    if (rowData.length === 0) {
      showNotification("warning", "No data to export");
      return;
    }

    const headers = columns.map((col) => col.label);
    const csvContent = [
      headers.join(","),
      ...rowData.map((row) =>
        columns
          .map((col) => {
            const value = row[col.key] || "";
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `multiple-run-wise-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification("success", "CSV downloaded successfully");
  };

  const columns = useMemo(
    () => [
      { key: "runNo", label: "Run No" },
      { key: "awbNo", label: "AWB No" },
      { key: "masterAwbNo", label: "MAWB No" },
      { key: "name", label: "Shipper" },
      { key: "destination", label: "Destination" },
      { key: "counterpart", label: "Counter Part" },
      { key: "flight", label: "Flight" },
      { key: "bookingDate", label: "Booking Date" },
      { key: "flightDate", label: "Flight Date" },
      { key: "landlingDate", label: "Landing Date" },
      { key: "dateOfConnections", label: "Date of Connections" },
      { key: "receiverFullName", label: "Consignee Name" },
      { key: "pcs", label: "Pcs" },
      { key: "totalActualWt", label: "Actual Weight" },
      { key: "service", label: "Service Type" },
      { key: "bag", label: "Bag No" },
      { key: "forwarder", label: "Forwarder" },
      { key: "forwardingNo", label: "Forwarding Numbers" },
      { key: "status", label: "Status" },
      { key: "eventDate", label: "Delivery Date" },
      { key: "eventTime", label: "Delivery Time" },
      { key: "remark", label: "Delivery Remarks" },
      { key: "caseType", label: "Case Type" },
      { key: "exceptionRemarks", label: "Exception Remarks" },
      { key: "exceptionMail", label: "Exception Mail" },
      { key: "caseRegisterDate", label: "Case Register Date" },
    ],
    [],
  );

  return (
    <form className="flex flex-col gap-9">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(visible) =>
          setNotification((prev) => ({ ...prev, visible }))
        }
      />

      <Heading
        title={`Multiple Run Wise`}
        bulkUploadBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex flex-col gap-3">
        {/* Run Number Input with Tags */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <InputBox
                placeholder="Run Number"
                register={register}
                setValue={setValue}
                resetFactor={runNumberReset}
                value="runNumber"
              />
            </div>
            <div className="w-[10%]">
              <SimpleButton
                name="Add"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddRunNumber();
                }}
              />
            </div>
          </div>

          {/* Run Number Tags */}
          {runNumbers.length > 0 && (
            <div className="flex flex-wrap gap-2 bg-gray-50 p-1 rounded">
              {runNumbers.map((runNo, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-red text-white px-3 py-1 rounded-full"
                >
                  <span className="text-sm font-medium">{runNo}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRunNumber(index)}
                    className="text-red-700 hover:text-red-900"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Inputs */}
        <div className="flex gap-3 items-center">
          <div className="w-full">
            <InputBox
              placeholder="Account Code"
              register={register}
              setValue={setValue}
              resetFactor={MultipleRunReset}
              value="accountCode"
            />
          </div>
          <DummyInputBoxWithLabelDarkGray
            register={register}
            label="Customer Name"
            setValue={setValue}
            value="name"
          />
          <InputBox
            placeholder="Branch"
            register={register}
            setValue={setValue}
            resetFactor={MultipleRunReset}
            value="branch"
          />
          <InputBox
            placeholder="Origin"
            register={register}
            setValue={setValue}
            resetFactor={MultipleRunReset}
            value="origin"
          />
        </div>

        <div className="flex gap-3">
          <InputBox
            placeholder="Sector"
            register={register}
            setValue={setValue}
            resetFactor={MultipleRunReset}
            value="sector"
          />
          <InputBox
            placeholder="Destination"
            register={register}
            setValue={setValue}
            resetFactor={MultipleRunReset}
            value="destination"
          />
          <InputBox
            placeholder="Network"
            register={register}
            setValue={setValue}
            resetFactor={MultipleRunReset}
            value="network"
          />
          <InputBox
            placeholder="Counter Part"
            register={register}
            setValue={setValue}
            resetFactor={MultipleRunReset}
            value="counterPart"
          />
        </div>

        <div className="flex gap-3 ">
          <div className="w-full flex gap-3">
            <DateInputBox
              placeholder="From"
              register={register}
              setValue={setValue}
              resetFactor={MultipleRunReset}
              value="from"
            />
            <DateInputBox
              placeholder="To"
              register={register}
              setValue={setValue}
              resetFactor={MultipleRunReset}
              value="to"
            />
          </div>
          <div className="flex gap-2">
            <OutlinedButtonRed
              label={"Show"}
              onClick={(e) => {
                e.preventDefault();
                fetchData(1);
              }}
              disabled={loading}
            />

            <OutlinedButtonRed label={"Excel"} onClick={exportToExcel} />

            <SimpleButton name={"Download CSV"} onClick={downloadCSV} />
          </div>
        </div>

        {/* <div className="w-full">
          <RedCheckbox
            isChecked={dateFormat}
            setChecked={setdateFormat}
            id="dateFormat"
            register={register}
            setValue={setValue}
            resetFactor={MultipleRunReset}
            label={"(YYYYMMDD) DATE FORMAT"}
          />
        </div> */}

        {/* Table */}
        <div>
          <TableWithSorting
            register={register}
            setValue={setValue}
            columns={columns}
            rowData={rowData}
            loading={loading}
            className={`h-[40vh]`}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center border-[#D0D5DD] border-opacity-75 border-[1px] border-t-0 border-b-0 bg-gray-50 px-4 py-3">
            <div className="text-sm text-gray-700">
              Showing{" "}
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)} to{" "}
              {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrevious}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>

              {getPageNumbers().map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => goToPage(pageNumber)}
                  className={`px-3 py-1 border rounded text-sm ${
                    currentPage === pageNumber
                      ? "bg-red-500 text-white border-red-500"
                      : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>{/* <OutlinedButtonRed label={"Close"} /> */}</div>
        </div>
      </div>
    </form>
  );
};

export default MultipleRunWise;
