"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import RedCheckbox from "@/app/components/RedCheckBox";
import Table from "@/app/components/Table";
import React, { useMemo, useState, useEffect, useRef, useContext } from "react";
import { useForm } from "react-hook-form";
import JsBarcode from "jsbarcode";
import axios from "axios";
import { saveAs } from "file-saver";
import DownloadDropdown from "@/app/components/DownloadDropdown";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useDebounce } from "@/app/hooks/useDebounce";

export default function ManifestReport() {
  const [demoRadio, setDemoRadio] = useState("Manifest (O)");
  const { register, setValue, watch, reset } = useForm();
  const [rowData, setRowData] = useState([]);
  const [enableCanada, setEnableCanada] = useState(false);
  const [cadRate, setCadRate] = useState(null); // INR per 1 CAD (auto-fetched)
  const [cadRateLoading, setCadRateLoading] = useState(false);
  const [singleAddress, setSingleAddress] = useState(false);
  const [enableBagNumber, setEnableBagNumber] = useState(false);
  const [rundata, setRunData] = useState({});
  const [data, setData] = useState([]);
  const { server } = useContext(GlobalContext);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination
  const [loading, setLoading] = useState(false);

  const runNo = watch("runNumber");
  const debouncedRunNo = useDebounce(runNo, 600);
  const fromDate = watch("from");
  const toDate = watch("to");

  const columns = useMemo(
    () => [
      { key: "srNo", label: "srNo" },
      { key: "awbNo", label: "awbNo" },
      { key: "consignor", label: "consignor" },
      { key: "pcs", label: "pcs" },
      { key: "wt", label: "wt" },
      { key: "description", label: "description" },
      { key: "value", label: "value" },
      { key: "dest", label: "dest" },
    ],
    [],
  );

  const contentRef = useRef();

  const getTitleFromRadio = (val) => {
    switch (val) {
      case "Manifest (O)":
        return "MANIFEST REPORT - OUTBOUND";
      case "Manifest (O) with Currency":
        return "MANIFEST REPORT - OUTBOUND (with Currency)";
      case "Manifest (R)":
        return "MANIFEST REPORT - RETURN";
      case "Manifest (R) with Currency":
        return "MANIFEST REPORT - RETURN (with Currency)";
      default:
        return "MANIFEST REPORT";
    }
  };

  const getFilteredData = (dataset) => {
    if (!Array.isArray(dataset)) return [];

    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate) : null;

    return dataset.filter((item) => {
      const date = new Date(item.date || rundata.date);
      return (!from || date >= from) && (!to || date <= to);
    });
  };

  const handleDownloadPDF = async () => {
    const input = contentRef.current;
    input.style.visibility = "visible";
    input.style.position = "static";

    await new Promise((resolve) => {
      data.forEach((item, idx) => {
        const barcodeEl = document.getElementById(`barcode-${idx}`);
        if (barcodeEl && item.awbNo) {
          JsBarcode(barcodeEl, item.awbNo, {
            format: "CODE128",
            width: 1,
            height: 30,
            fontSize: 10,
            displayValue: true,
            text: enableCanada ? `80KT${item.awbNo}` : item.awbNo,
            margin: 0,
          });
        }
      });
      setTimeout(resolve, 500);
    });

    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(input, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL("image/png");

    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "letter");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    input.style.visibility = "hidden";
    input.style.position = "absolute";
    pdf.save(`Manifest_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleDownloadExcel = async () => {
    const filtered = getFilteredData(data);

    if (!filtered || filtered.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = [
      "S.No.",
      "AwbNo",
      "Pcs",
      "Weight",
      "Description of Goods",
      "Consignor Name & Address",
      "GST InvoiceNo & Date",
      "GST InvoiceNo & Date(Other)",
      "Invoice Value",
      "Port of Shipment",
      "Consignee Name & Address",
      "Whether Supply for Export is on Payment of IGST or Not. Pls indicate",
      "Whether Against Bond or UT",
      "Total IGST paid",
    ];

    const aoa = [headers];

    filtered.forEach((item, i) => {
      // 1st line
      aoa.push([
        i + 1,
        item.awbNo || "",
        item.pcs || "",
        item.wt || "",
        "SPX OF",
        item.consignor || "",
        "NA",
        "NA",
        enableCanada
          ? `${(parseFloat(item.value || 0) / (cadRate || 60)).toFixed(2)} CAD`
          : item.value || "",
        "CANADA",
        item.consignee || "",
        "NA",
        "NA",
        "NA",
      ]);

      // 2nd line
      aoa.push([
        "",
        item.bagNo || "",
        "",
        "",
        item.description || "",
        item.shipperAddressLine1 || "",
        "",
        "",
        enableCanada ? "CAD" : "INR",
        "",
        item.receiverAddressLine1 || "",
        "",
        "",
      ]);

      // 3rd line
      aoa.push([
        "",
        "",
        "",
        "",
        "",
        item.shipperAddressLine2 || "",
        "",
        "",
        "",
        "",
        item.receiverAddressLine2 || "",
        "",
        "",
      ]);

      // 4th line
      aoa.push([
        "",
        "",
        "",
        "",
        "",
        item.shipperPhoneNumber || "",
        "",
        "",
        "",
        "",
        item.receiverPhoneNumber || "",
        "",
        "",
      ]);

      // spacer
      aoa.push([]);
    });

    const XLSX = await import("xlsx");
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Manifest");
    XLSX.writeFile(
      wb,
      `Manifest_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  };

  const handleDownloadCSV = async () => {
    const filtered = getFilteredData(data);

    if (!filtered || filtered.length === 0) {
      alert("No data to export");
      return;
    }

    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(filtered);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(
      blob,
      `Manifest_Report_${new Date().toISOString().slice(0, 10)}.csv`,
    );
  };

  // Fetch run entry data and populate fields
  const fetchRunEntryData = async (runNumber) => {
    if (!runNumber) return;

    try {
      const response = await axios.get(
        `${server}/run-entry?runNo=${runNumber}`,
      );
      const runEntry = response.data;

      if (runEntry) {
        setRunData(runEntry);

        // Populate the form fields
        setValue("sector", runEntry.sector || "");
        setValue("a/lMawb", runEntry.almawb || "");
        setValue("obc", runEntry.obc || "");
        setValue("counterPart", runEntry.counterpart || "");
        setValue("flight", runEntry.flight || "");

        // Format and set date
        if (runEntry.date) {
          const date = new Date(runEntry.date);
          const formattedDate = date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
          setValue("date", formattedDate);
        }

        // console.log("Run entry data loaded:", runEntry);
      }
    } catch (err) {
      console.error("Failed to fetch run entry data:", err);
      // Clear fields if run not found
      setRunData({});
      setValue("sector", "");
      setValue("a/lMawb", "");
      setValue("obc", "");
      setValue("counterPart", "");
      setValue("flight", "");
      setValue("date", "");
    }
  };

  // Fetch manifest shipment data
  const fetchManifestData = async (runNumber, page = 1) => {
    if (!runNumber)
      return {
        shipments: [],
        pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 },
      };

    setLoading(true);
    try {
      const response = await axios.get(
        `${server}/portal/get-shipments?runNo=${runNumber}&page=${page}&limit=${pageLimit}`,
      );
      const responseData = response.data.shipments || [];
      const pagination = response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: responseData.length,
      };

      const transformed = responseData.map((item, idx) => ({
        srNo: (page - 1) * pageLimit + idx + 1,
        awbNo: item.awbNo || "N/A",
        consignor: item.shipperFullName || "N/A",
        consignee: item.receiverFullName || "N/A",
        pcs: item.pcs || 0,
        wt: item.totalActualWt || 0,
        value: item.totalInvoiceValue || 0,
        dest: item.destination || "N/A",
        date: item.date || new Date(),

        // Array-safe content
        description: Array.isArray(item.content)
          ? item.content.join(", ")
          : item.content || "",

        bagNo: item.bag || "",
        goodsType: item.goodstype || "",
        shipperAddressLine1: item.shipperAddressLine1 || "",
        shipperAddressLine2: item.shipperAddressLine2 || "",
        shipperPhoneNumber: item.shipperPhoneNumber || "",
        receiverAddressLine1: item.receiverAddressLine1 || "",
        receiverAddressLine2: item.receiverAddressLine2 || "",
        receiverPhoneNumber: item.receiverPhoneNumber || "",
      }));

      setData(transformed);
      setRowData(transformed);
      setTotalRecords(pagination.totalRecords);
      setTotalPages(pagination.totalPages);
      setCurrentPage(pagination.currentPage);

      return { transformed, pagination };
    } catch (err) {
      console.error("Failed fetching manifest data:", err);
      setData([]);
      setRowData([]);
      return {
        transformed: [],
        pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 },
      };
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;

    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: "smooth" });

    fetchManifestData(currentFilters, newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      setCurrentPage(1);
      fetchManifestData(currentFilters, 1);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1 && data.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{data.length}</span> of{" "}
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
              className="border rounded px-2 py-1 text-sm bg-white"
              disabled={loading}
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
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            Previous
          </button>

          <span className="px-3 py-1 text-sm">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  // Auto-fetch run entry data when run number changes
  useEffect(() => {
    if (debouncedRunNo && debouncedRunNo.trim()) {
      fetchRunEntryData(debouncedRunNo.trim().toUpperCase());
    } else {
      // Clear all fields when run number is cleared
      setRunData({});
      setValue("sector", "");
      setValue("a/lMawb", "");
      setValue("obc", "");
      setValue("counterPart", "");
      setValue("flight", "");
      setValue("date", "");
    }
  }, [debouncedRunNo]);

  // Auto-fetch INR to CAD exchange rate when Canada M/f is enabled
  useEffect(() => {
    if (!enableCanada) return;
    const fetchRate = async () => {
      setCadRateLoading(true);
      try {
        const res = await fetch("https://open.er-api.com/v6/latest/CAD");
        const json = await res.json();
        if (json && json.rates && json.rates.INR) {
          // json.rates.INR = how many INR per 1 CAD
          setCadRate(json.rates.INR);
        } else {
          setCadRate(60); // fallback
        }
      } catch (err) {
        console.error("Failed to fetch exchange rate:", err);
        setCadRate(60); // fallback
      } finally {
        setCadRateLoading(false);
      }
    };
    fetchRate();
  }, [enableCanada]);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    // Clear all piece-wise state
    setData([]);
    setRowData([]);
    setRunData({});
    setEnableCanada(false);
    setSingleAddress(false);
    setEnableBagNumber(false);
    setDemoRadio("Manifest (O)");

    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);

    // Reset form to default values
    reset({
      runNumber: "",
      from: "",
      to: "",
      sector: "",
      "a/lMawb": "",
      obc: "",
      counterPart: "",
      flight: "",
      date: "",
      enableCanada: false,
      singleAddress: false,
      enableBagNumber: false,
      accountType: "Manifest (O)",
    });

    // Increment refreshKey to force the entire form to re-render (clears all internal component states)
    setRefreshKey((prev) => prev + 1);
  };

  const handleView = async () => {
    const query = runNo?.trim();
    if (!query) {
      alert("Please enter a run number");
      return;
    }

    setCurrentFilters(query);
    setCurrentPage(1);

    // Fetch both run entry and manifest data
    await fetchRunEntryData(query);
    const result = await fetchManifestData(query, 1);

    if (result.transformed.length === 0) {
      alert("No shipments found for this run number");
    }
  };

  return (
    <form className="flex flex-col gap-3" key={refreshKey}>
      <Heading
        title="Manifest Report D"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex flex-row gap-3">
        {[
          "Manifest (O)",
          "Manifest (O) with Currency",
          "Manifest (R)",
          "Manifest (R) with Currency",
        ].map((type) => (
          <RadioButtonLarge
            key={type}
            id={type}
            label={type}
            name="accountType"
            register={register}
            setValue={setValue}
            selectedValue={demoRadio}
            setSelectedValue={setDemoRadio}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <RedCheckbox
              id="enableCanada"
              label="Canada M/f"
              isChecked={enableCanada}
              setChecked={setEnableCanada}
              register={register}
              setValue={setValue}
            />

            {enableCanada && (
              <span className="text-xs text-gray-500 ml-1">
                {cadRateLoading
                  ? "(Fetching rate...)"
                  : cadRate
                    ? `(1 CAD = ${cadRate.toFixed(2)} INR)`
                    : ""}
              </span>
            )}

            <RedCheckbox
              id="singleAddress"
              label="Single Address"
              isChecked={singleAddress}
              setChecked={setSingleAddress}
              register={register}
              setValue={setValue}
            />
          </div>

          <div className="flex gap-2 items-center">
            <div className="w-full">
              <RedCheckbox
                id="enableBagNumber"
                label="Bag Number"
                isChecked={enableBagNumber}
                setChecked={setEnableBagNumber}
                register={register}
                setValue={setValue}
              />
            </div>
            <InputBox
              value="from"
              placeholder="From"
              register={register}
              setValue={setValue}
              disabled={!enableBagNumber}
            />
            <InputBox
              value="to"
              placeholder="To"
              register={register}
              setValue={setValue}
              disabled={!enableBagNumber}
            />
          </div>
        </div>

        <RedLabelHeading label="Run Details" />

        <div className="flex flex-col gap-3">
          {/* First Row */}
          <div className="flex gap-3 w-full">
            <InputBox
              value="runNumber"
              placeholder="Run Number"
              register={register}
              setValue={setValue}
            />
            <DummyInputBoxWithLabelDarkGray
              label="Sector"
              value="sector"
              inputValue={rundata?.sector || ""}
              register={register}
              setValue={setValue}
            />
            <DummyInputBoxWithLabelDarkGray
              label="A/L MAWB"
              value="a/lMawb"
              inputValue={rundata?.almawb || ""}
              register={register}
              setValue={setValue}
            />
            <DummyInputBoxWithLabelDarkGray
              label="OBC"
              value="obc"
              inputValue={rundata?.obc || ""}
              register={register}
              setValue={setValue}
            />
          </div>

          {/* Second Row - Fixed with equal spacing and proper alignment */}
          <div className="flex gap-3 w-full justify-between items-center">
            <div className="flex gap-3 flex-1">
              <DummyInputBoxWithLabelDarkGray
                label="Date"
                value="date"
                inputValue={
                  rundata?.date
                    ? new Date(rundata.date).toLocaleDateString("en-GB")
                    : ""
                }
                register={register}
                setValue={setValue}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Counter Part"
                value="counterPart"
                inputValue={rundata?.counterpart || ""}
                register={register}
                setValue={setValue}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Flight"
                value="flight"
                inputValue={rundata?.flight || ""}
                register={register}
                setValue={setValue}
              />
            </div>

            <div className="flex gap-3 w-[24%]">
              <OutlinedButtonRed label="View" onClick={handleView} />
              <DownloadDropdown
                handleDownloadPDF={handleDownloadPDF}
                handleDownloadExcel={handleDownloadExcel}
                handleDownloadCSV={handleDownloadCSV}
              />
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          rowData={rowData}
          register={register}
          setValue={setValue}
          name="manifestreportd"
          height="h-[45vh]"
        />
        <PaginationControls />
      </div>

      {/* Hidden content for PDF rendering */}
      <div
        ref={contentRef}
        className="text-[10px] leading-tight p-4 bg-white w-full"
        style={{ visibility: "hidden", position: "absolute", top: 0, left: 0 }}
      >
        <div className="flex justify-between mb-2">
          <div>
            <strong>FROM:</strong> M5C LOGISTICS
          </div>
          <div className="text-right">
            <strong>TO:</strong> DCW SOLUTIONS INC
            <br />
            13937 60 AVE SURREY, BC V3X0K7
          </div>
        </div>

        <h2 className="text-center font-bold mb-4 text-xs">
          {getTitleFromRadio(demoRadio)}
        </h2>

        <table className="w-full">
          <thead className="border-y-2 border-t-[#000080] border-y-[#ff0000]">
            <tr>
              {[
                "SrNo",
                "AWB No.",
                "Consignor",
                "Consignee",
                "PCS",
                "WT",
                "DEST",
                "Description",
                "Value",
              ].map((header, i) => (
                <th key={i} className="pt-2 pb-4 px-2 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getFilteredData(data).map((item, idx) => (
              <tr key={idx} className="align-top">
                <td className="px-2 pt-3">{item.srNo}</td>
                <td className="py-3 text-center px-2">
                  {enableCanada ? (
                    <svg id={`barcode-${idx}`} className="h-[40px]"></svg>
                  ) : (
                    item.awbNo
                  )}
                </td>
                <td className="px-2 pt-3">{item.consignor}</td>
                <td className="px-2 pt-3">{item.consignee}</td>
                <td className="px-2 pt-3">{item.pcs}</td>
                <td className="px-2 pt-3">{item.wt}</td>
                <td className="px-2 pt-3">{item.dest}</td>
                <td className="px-2 pt-3">{item.description}</td>
                <td className="px-2 pt-3">
                  {enableCanada
                    ? `${(parseFloat(item.value || 0) / (cadRate || 60)).toFixed(2)} CAD`
                    : typeof item.value === "number"
                      ? item.value.toFixed(2)
                      : item.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
