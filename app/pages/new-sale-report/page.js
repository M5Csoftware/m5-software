"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DropdownOptionOnly } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { X, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useForm } from "react-hook-form";

const NewSaleReport = () => {
  const [dropdownKey, setDropdownKey] = useState(0); // use as a key to force remount

  const [demoRadio, setDemoRadio] = useState("AWB Wise");
  const { register, setValue, watch } = useForm();
  const [tableData, setTableData] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [comparisonMode, setComparisonMode] = useState("State");
  const [isLoading, setIsLoading] = useState(false);
  const [resetFactor, setResetFactor] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Use ref to prevent unnecessary re-renders
  const abortControllerRef = useRef(null);

  const context = useContext(GlobalContext);
  const server = context?.server || process.env.NEXT_PUBLIC_API_URL || "";

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const getISODateRange = (from, to) => {
    const f = parseDateDDMMYYYY(from);
    const t = parseDateDDMMYYYY(to);

    if (!f || !t || isNaN(f) || isNaN(t)) return null;

    f.setHours(0, 0, 0, 0);
    t.setHours(23, 59, 59, 999);

    return {
      from: f.toISOString(),
      to: t.toISOString(),
    };
  };

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Memoize static data to prevent recalculation
  const monthNames = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
    []
  );

  const formatDate = useCallback(
    (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`,
    []
  );

  const getPreviousMonthRange = useCallback(
    (toDateStr) => {
      const toDate = new Date(toDateStr);
      const prevEnd = new Date(toDate);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setMonth(prevStart.getMonth() - 1);
      prevStart.setDate(prevStart.getDate() + 1);

      return {
        from: formatDate(prevStart),
        to: formatDate(prevEnd),
      };
    },
    [formatDate]
  );

  const getPreviousMonthLabel = useCallback(
    (toDateStr) => {
      const prevRange = getPreviousMonthRange(toDateStr);
      const start = new Date(prevRange.from);
      return `GRAND TOTAL ${
        monthNames[start.getMonth()]
      } ${start.getFullYear()}`;
    },
    [getPreviousMonthRange, monthNames]
  );

  // Memoize table columns to prevent recreation
  const tableColumns = useMemo(
    () => ({
      "AWB Wise": [
        { key: "awbNo", label: "Awb No" },
        { key: "bookingDate", label: "Booking Date" },
        { key: "flightDate", label: "Flight Date" },
        { key: "runNo", label: "Run No" },
        { key: "hub", label: "HUB" },
        { key: "branch", label: "Branch" },
        { key: "customerCode", label: "Customer Code" },
        { key: "customerName", label: "Customer Name" },
        { key: "state", label: "State" },
        { key: "city", label: "City" },
        { key: "type", label: "Type" },
        { key: "billingTag", label: "Billing Tag" },
        { key: "gstTag", label: "GST TAG" },
        { key: "currency", label: "Currency" },
        { key: "sector", label: "Sector" },
        { key: "destinationCode", label: "Destination Code" },
        { key: "service", label: "Service Type" },
        { key: "pcs", label: "Pcs" },
        { key: "goodsDesc", label: "Goods Desc" },
        { key: "actWeight", label: "Act Weight" },
        { key: "volWeight", label: "Vol Weight" },
        { key: "volDiscount", label: "Vol Discount" },
        { key: "chgWeight", label: "Chg Weight" },
        { key: "bagWeight", label: "Bag Weight" },
        { key: "paymentType", label: "Payment Type" },
        { key: "basicAmount", label: "Basic Amount" },
        { key: "discountPerKg", label: "Discount Per Kg" },
        { key: "discountAmt", label: "Discount Amt" },
        { key: "basicAmtAfterDiscount", label: "Basic Amt After Discount" },
        { key: "rateHike", label: "Rate Hike" },
        { key: "sgst", label: "SGST" },
        { key: "cgst", label: "CGST" },
        { key: "igst", label: "IGST" },
        { key: "handling", label: "Handling" },
        { key: "ovwt", label: "OVWT" },
        { key: "mischg", label: "Misc Charges" },
        { key: "miscRemark", label: "Misc Remark" },
        { key: "revenue", label: "REVENUE" },
        { key: "grandTotal", label: "Grand Total" },
      ],
      "Client Wise": [
        { key: "customerCode", label: "Customer Code" },
        { key: "customerName", label: "Customer Name" },
        { key: "state", label: "State" },
        { key: "city", label: "City" },
        { key: "type", label: "Type" },
        { key: "billingTag", label: "Billing Tag" },
        { key: "gstTag", label: "GST TAG" },
        { key: "chgWeight", label: "CH WT" },
        { key: "revenue", label: "REVENUE" },
        { key: "igst", label: "IGST" },
        { key: "grandTotal", label: "Grand Total" },
      ],
    }),
    []
  );

  // Watch form values with useMemo to prevent unnecessary re-renders
  const fromDate = watch("from");
  const toDate = watch("to");

  const prevMonthLabel = useMemo(
    () => getPreviousMonthLabel(toDate || new Date()),
    [toDate, getPreviousMonthLabel]
  );

  const comparisonColumns = useMemo(
    () => ({
      State: [
        { key: "state", label: "STATE" },
        { key: "customerCount", label: "CUSTOMER" },
        { key: "total", label: "TOTAL" },
        { key: "agentCount", label: "AGENT" },
        { key: "awbCount", label: "#AWB" },
        { key: "chargeableWeight", label: "CH WT" },
        { key: "revenue", label: "REVENUE" },
        { key: "igst", label: "IGST" },
        { key: "grandTotal", label: "GRAND TOTAL" },
        { key: "grandTotalRef", label: prevMonthLabel },
        { key: "diff", label: "DIFF" },
      ],
      Product: [
        { key: "product", label: "PRODUCT" },
        { key: "awbCount", label: "#AWB" },
        { key: "chargeableWeight", label: "CH WT" },
        { key: "revenue", label: "REVENUE" },
        { key: "igst", label: "IGST" },
        { key: "grandTotal", label: "GRAND TOTAL" },
        { key: "grandTotalRef", label: prevMonthLabel },
        { key: "diff", label: "DIFF" },
      ],
      Hub: [
        { key: "hub", label: "HUB" },
        { key: "awbCount", label: "#AWB" },
        { key: "chargeableWeight", label: "CH WT" },
        { key: "revenue", label: "REVENUE" },
        { key: "igst", label: "IGST" },
        { key: "grandTotal", label: "GRAND TOTAL" },
        { key: "grandTotalRef", label: prevMonthLabel },
        { key: "diff", label: "DIFF" },
      ],
      "Sec & Hub": [
        { key: "secHub", label: "SEC & HUB" },
        { key: "awbCount", label: "#AWB" },
        { key: "chargeableWeight", label: "CH WT" },
        { key: "revenue", label: "REVENUE" },
        { key: "igst", label: "IGST" },
        { key: "grandTotal", label: "GRAND TOTAL" },
        { key: "grandTotalRef", label: prevMonthLabel },
        { key: "diff", label: "DIFF" },
      ],
    }),
    [prevMonthLabel]
  );

  const fetchComparisonData = useCallback(
    async ({ fromDate, toDate, mode, page, limit, server }) => {
      if (!fromDate || !toDate || !server)
        return { data: [], totalPages: 1, page };

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const prevMonthRange = getPreviousMonthRange(toDate);

      try {
        const range = getISODateRange(fromDate, toDate);
        if (!range) return { data: [], totalPages: 1, page };
        const route = `${server}/new-sale-report/comparison?mode=${mode}&from=${range.from}&to=${range.to}`;

        const res = await fetch(
          `${route}&prevFrom=${prevMonthRange.from}&prevTo=${prevMonthRange.to}&page=${page}&limit=${limit}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        return {
          data: result.data || [],
          totalPages: result.totalPages || 1,
          page: result.page || page,
        };
      } catch (err) {
        if (err.name === "AbortError") return null; // Request was cancelled
        console.error("Comparison fetch error:", err);
        return { data: [], totalPages: 1, page, error: err.message };
      }
    },
    [getPreviousMonthRange]
  );

  const handleShowComparison = useCallback(async () => {
    if (!fromDate || !toDate || !server) {
      showNotification("error", "Select FROM and TO date");
      return;
    }

    setIsLoading(true);
    try {
      const result = await fetchComparisonData({
        fromDate,
        toDate,
        mode: comparisonMode,
        page,
        limit,
        server,
      });

      if (result) {
        // Only update if request wasn't cancelled
        setTableData(result.data || []);
        setTotalPages(result.totalPages || 1);
        showNotification("success", `Page ${result.page || page} loaded`);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setTableData([]);
      showNotification("error", `Failed to fetch report: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [
    fromDate,
    toDate,
    page,
    limit,
    server,
    comparisonMode,
    fetchComparisonData,
    showNotification,
  ]);

  const handleShow = useCallback(async () => {
    if (!fromDate || !toDate || !server) {
      showNotification("error", "Select FROM and TO date");
      return;
    }

    setIsLoading(true);

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (demoRadio === "Comparison") {
      const result = await fetchComparisonData({
        fromDate,
        toDate,
        mode: comparisonMode,
        page,
        limit,
        server,
      });

      if (result?.error) {
        showNotification(
          "error",
          `Failed to fetch comparison: ${result.error}`
        );
        setTableData([]);
        setIsLoading(false);
        return;
      }

      if (result) {
        // Only update if request wasn't cancelled
        setTableData(result.data);
        setTotalPages(result.totalPages);
        showNotification("success", `Page ${result.page} loaded`);
      }
    } else {
      try {
        const route = `${server}/new-sale-report`;
        const range = getISODateRange(fromDate, toDate);
        if (!range) {
          showNotification("error", "Invalid date format");
          return;
        }

        const res = await fetch(
          `${route}?from=${range.from}&to=${range.to}&page=${page}&limit=${limit}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        setTableData(result.data || []);
        setTotalPages(result.totalPages || 1);
        showNotification("success", `Page ${result.page || page} loaded`);
      } catch (err) {
        if (err.name !== "AbortError") {
          // Don't show error for cancelled requests
          console.error("Fetch error:", err);
          setTableData([]);
          showNotification("error", `Failed to fetch report: ${err.message}`);
        }
      }
    }
    setIsLoading(false);
  }, [
    demoRadio,
    comparisonMode,
    page,
    limit,
    server,
    fromDate,
    toDate,
    fetchComparisonData,
    showNotification,
  ]);

  // Debounced effect to prevent rapid API calls
  useEffect(() => {
    setTableData([]);
  }, [demoRadio]);

  useEffect(() => {
    if (!fromDate || !toDate || !server) return;

    setPage(1); // reset page ONLY here
    handleShow(); // single fetch
  }, [fromDate, toDate, demoRadio, comparisonMode]);

  // Memoize event handlers to prevent recreating functions
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const downloadFile = useCallback(
    async (url, defaultFileName) => {
      try {
        setDownloading(true); // Show downloading on button

        const res = await fetch(url);
        if (!res.ok) throw new Error("Download failed");

        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = defaultFileName || "report.xlsx";

        document.body.appendChild(link);
        link.click();
        link.remove();

        showNotification("success", "Download completed");
      } catch (err) {
        console.error(err);
        showNotification("error", "Download failed");
      } finally {
        setDownloading(false); // Stop loading
      }
    },
    [showNotification]
  );

  const handleDownload = useCallback(() => {
    if (!fromDate || !toDate || !server) {
      showNotification("error", "Please select date range");
      return;
    }

    let url = `${server}/new-sale-report/export-excel?from=${fromDate}&to=${toDate}&type=${encodeURIComponent(
      demoRadio
    )}`;
    if (demoRadio === "Comparison") {
      url += `&mode=${encodeURIComponent(comparisonMode)}`;
    }

    const fileName = `NewSaleReport_${fromDate}_to_${toDate}.xlsx`;
    downloadFile(url, fileName);
  }, [fromDate, toDate, server, demoRadio, comparisonMode, downloadFile]);

  const handlePrevPage = useCallback(() => {
    setPage((p) => Math.max(p - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const handleCloseNotif = useCallback((v) => {
    setNotif((prev) => ({ ...prev, visible: v }));
  }, []);

  // Memoize radio button options
  const radioOptions = useMemo(
    () => ["AWB Wise", "Comparison", "Client Wise"],
    []
  );
  const comparisonOptions = useMemo(
    () => ["State", "Product", "Hub", "Sec & Hub"],
    []
  );

  // Current columns based on mode
  const currentColumns = useMemo(() => {
    return demoRadio === "Comparison"
      ? comparisonColumns[comparisonMode]
      : tableColumns[demoRadio];
  }, [demoRadio, comparisonMode, comparisonColumns, tableColumns]);

  // Add error boundary-like behavior
  if (!server) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Configuration Error:</strong>
          <span className="block sm:inline">
            {" "}
            Server configuration is missing. Please check your environment
            variables or context provider.
          </span>
        </div>
      </div>
    );
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleRefresh = () => {
    setTableData([]);
    setComparisonMode("State");
    setPage(1);

    // Force DropdownOptionOnly to remount and reset
    setDropdownKey((prev) => prev + 1);
  };
  const secHubDownload = useCallback(() => {
    if (!fromDate || !toDate || !server) {
      showNotification("error", "Please select date range");
      return;
    }

    const url = `${server}/new-sale-report/sec-hub?from=${fromDate}&to=${toDate}`;
    const fileName = `SecHubReport_${fromDate}_to_${toDate}.xlsx`;
    downloadFile(url, fileName);
  }, [fromDate, toDate, server, downloadFile]);

  return (
    <div>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <div className="mb-6">
        <Heading
          title={`New Sale Report`}
          fullscreenBtn
          onClickFullscreenBtn={toggleFullscreen}
          bulkUploadBtn="hidden"
          refreshBtn
          onRefresh={handleRefresh}
          codeListBtn="hidden"
        />
      </div>
      <div className="space-y-4">
        <div className="flex gap-2">
          {radioOptions.map((item) => (
            <RadioButtonLarge
              key={item}
              id={item}
              label={item}
              name="demo"
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={setDemoRadio}
              resetFactor={resetFactor}
            />
          ))}
        </div>
        <div className="flex gap-2">
          {demoRadio === "Comparison" && (
            <div className="w-1/4">
              <DropdownOptionOnly
                key={dropdownKey} // forces remount on refresh
                options={comparisonOptions}
                defaultValue={comparisonMode} // use parent state as default
                onChange={(val) => setComparisonMode(val)} // update parent state
              />
            </div>
          )}
          <div className="w-1/2">
            <DateInputBox
              placeholder={`From`}
              value="from"
              setValue={setValue}
              register={register}
              maxToday
              resetFactor={resetFactor}
            />
          </div>
          <div className="w-1/2">
            <DateInputBox
              placeholder={`To`}
              value="to"
              setValue={setValue}
              register={register}
              maxToday
              resetFactor={resetFactor}
            />
          </div>

          <div className="w-[200px]">
            <OutlinedButtonRed
              label={isLoading ? "Loading..." : "Show"}
              onClick={handleShow}
              disabled={isLoading}
            />

          </div>
          <div>
            {demoRadio === "Comparison" && comparisonMode === "Sec & Hub" ? (
              <SimpleButton
                name={isLoading ? "Downloading..." : "Download"}
                onClick={secHubDownload}
                disabled={isLoading || !tableData.length}
              />
            ) : (
              <SimpleButton
                name={isLoading ? "Downloading..." : "Download"}
                onClick={handleDownload}
                disabled={isLoading || !tableData.length}
              />
            )}
          </div>
        </div>

        <div>
          {/* Normal table */}
          {!isFullscreen && (
            <div className="relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="flex items-center space-x-1">
                    <Loader2 className="h-6 w-6 animate-spin text-red" />
                    <span>Loading data...</span>
                  </div>
                </div>
              )}
              <TableWithSorting
                columns={currentColumns}
                rowData={tableData}
                setValue={setValue}
                register={register}
                className={`${isFullscreen ? "h-[85vh]" : "h-[48vh]"}`}
              />
            </div>
          )}
          {/* Fullscreen table */}
          {isFullscreen && (
            <div className="fixed inset-0 bg-white z-50 p-9 overflow-auto">
              <div className="flex justify-between items-center mb-2 mx-1">
                <Heading
                  title={demoRadio}
                  bulkUploadBtn="hidden"
                  codeListBtn="hidden"
                  refreshBtn="hidden"
                />
                <div className="flex gap-6 items-center justify-end">
                  <div className="flex items-start justify-start w-44">
                    {demoRadio === "Comparison" &&
                    comparisonMode === "Sec & Hub" ? (
                      <SimpleButton
                        name={downloading ? "Downloading..." : "Download"}
                        onClick={secHubDownload}
                        disabled={downloading || !tableData.length}
                      />
                    ) : (
                      <SimpleButton
                        name={downloading ? "Downloading..." : "Download"}
                        onClick={handleDownload}
                        disabled={downloading || !tableData.length}
                      />
                    )}
                  </div>
                  <X onClick={toggleFullscreen} className="cursor-pointer" />
                </div>
              </div>

              <div className="relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <div className="flex items-center space-x-1">
                      <Loader2 className="h-6 w-6 animate-spin text-red" />
                      <span>Loading data...</span>
                    </div>
                  </div>
                )}
                <TableWithSorting
                  columns={currentColumns}
                  rowData={tableData}
                  setValue={setValue}
                  register={register}
                  className={`${isFullscreen ? "h-[80vh]" : "h-[45vh]"}`}
                />
              </div>
              <div className="flex justify-center items-center gap-2 mt-2 text-xs">
                <div className="flex gap-1 justify-center items-center">
                  <button
                    disabled={page === 1 || isLoading}
                    onClick={handlePrevPage}
                    className="px-3 py-[2px] gap-2 flex justify-start items-center border tracking-widest font-extralight bg-[#EA1B40] text-white rounded disabled:opacity-50"
                  >
                    <ArrowLeft size={14} />
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages || isLoading}
                    onClick={handleNextPage}
                    className="px-3 py-[2px] gap-2 flex justify-end items-center border tracking-widest font-extralight bg-[#EA1B40] text-white rounded disabled:opacity-50"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mt-4">
        <div className="flex justify-center items-center gap-3 mt-2 text-xs ">
          <button
            disabled={page === 1 || isLoading}
            onClick={handlePrevPage}
            className="px-3 py-[2px] gap-2 flex justify-start items-center border tracking-widest font-extralight bg-[#EA1B40] text-white rounded disabled:opacity-50"
          >
            <ArrowLeft size={14} />
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages || isLoading}
            onClick={handleNextPage}
            className="px-3 py-[2px] gap-2 flex justify-end items-center border tracking-widest font-extralight bg-[#EA1B40] text-white rounded disabled:opacity-50"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewSaleReport;
