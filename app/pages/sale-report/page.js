"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import { saveAs } from "file-saver";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import RedCheckbox from "@/app/components/RedCheckBox";
import { TableWithSorting } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { X } from "lucide-react";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDebounce } from "@/app/hooks/useDebounce";

const SalesReport = () => {
  const { register, setValue, getValues, reset, handleSubmit, watch } = useForm();
  const values = watch();
  const debouncedValues = useDebounce(values, 800);
  const [demoRadio, setDemoRadio] = useState("Sale Details");
  const [bookingDate, setBookingDate] = useState(false);
  const [unBilledShipment, setUnBilledShipment] = useState(false);
  const [skipDHL, setSkipDHL] = useState(false);
  const [speacialReport, setSpeacialReport] = useState(false);
  const [consignorDetail, setConsignorDetail] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const { server } = useContext(GlobalContext);

  const [filteredData, setFilteredData] = useState([]);
  const [accountManagers, setAccountManagers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [salePersons, setSalePersons] = useState([]);
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
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination
  const [loading, setLoading] = useState(false);

  // Totals state (if backend provides them for the full dataset)
  const [overallTotals, setOverallTotals] = useState({
    totalActualWeight: 0,
    totalChargeableWeight: 0,
    grandTotal: 0
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  // Inside SalesReport component:

  const handleDownloadExcel = async () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to download!");
      return;
    }

    const wsData = rowData.map((row) => ({
      "AWB No": row.awbNo,
      "Booking Date": row.bookingDate
        ? new Date(row.bookingDate).toLocaleDateString("en-GB") // dd/mm/yyyy
        : "",
      "Flight Date": row.flightDate
        ? new Date(row.flightDate).toLocaleDateString("en-GB")
        : "",
      "Run No": row.runNo,
      "Club No": row.clubNo,
      Branch: row.branch,
      "Sale Person": row.salePerson,
      Reference: row.reference,
      "Managed By": row.managedBy,
      "Collection By": row.collectionBy,
      "Account Manager": row.accountManager,
      "Rate Type": row.rateType,
      "Origin Name": row.originName,
      Sector: row.sector,
      "Destination Code": row.destinationCode,
      "Customer Code": row.accountCode,
      "Customer Name": row.customer,
      "Consignee Name": row.consigneeName,
      "Consignee Address Line1": row.consigneeAddressLine1,
      "Consignee City": row.consigneeCity,
      "Consignee State": row.consigneeState,
      "Consignee ZipCode": row.consigneeZipCode,
      "Consignee Phone No": row.consigneePhoneNo,
      "Service Type": row.serviceType,
      Pcs: row.pcs,
      "Goods Desc": row.goodsDesc,
      "Act Weight": row.actWeight,
      "Vol Weight": row.volWeight,
      "Chg Weight": row.chgWeight,
      "Vol Discount": row.volDiscount,
      "Payment Type": row.paymentType,
      "Basic Amount": row.basicAmount,
      SGST: row.sgst,
      CGST: row.cgst,
      IGST: row.igst,
      "Misc Chg": row.mischg,
      "Misc Remark": row.miscRemark,
      Fuel: row.fuel,
      "Grand Total": row.grandTotal,
      Currency: row.currency,
      "Bill No": row.billNo,
      "Awb Check": row.awbCheck,
      "Sale Type": row.saleType,
      "Shipment Forwarder": row.shipmentForwarder,
    }));

    // Add summary row
    const emptyCols = Object.keys(wsData[0]).length - 6;
    const summaryRow = {};
    for (let i = 0; i < emptyCols; i++)
      summaryRow[Object.keys(wsData[0])[i]] = "";
    const last6Keys = Object.keys(wsData[0]).slice(-6);
    summaryRow[last6Keys[0]] = "Total Actual Weight";
    summaryRow[last6Keys[1]] = totalActualWeight + "Kg";
    summaryRow[last6Keys[2]] = "Total Chargeable Weight";
    summaryRow[last6Keys[3]] = totalChargeableWeight + "Kg";
    summaryRow[last6Keys[4]] = "Grand Total";
    summaryRow[last6Keys[5]] = "Rs " + grandTotalValue;
    wsData.push(summaryRow);

    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(wsData);

    // Set column widths
    ws["!cols"] = [
      { wch: 15 }, // AWB No
      { wch: 15 }, // Booking Date
      { wch: 15 }, // Flight Date
      { wch: 10 }, // Run No
      { wch: 10 }, // Club No
      { wch: 15 }, // Branch
      { wch: 15 }, // Sale Person
      { wch: 15 }, // Reference
      { wch: 15 }, // Managed By
      { wch: 15 }, // Collection By
      { wch: 15 }, // Account Manager
      { wch: 10 }, // Rate Type
      { wch: 15 }, // Origin Name
      { wch: 10 }, // Sector
      { wch: 15 }, // Destination Code
      { wch: 12 }, // Customer Code
      { wch: 20 }, // Customer Name
      { wch: 20 }, // Consignee Name
      { wch: 25 }, // Consignee Address Line1
      { wch: 15 }, // Consignee City
      { wch: 10 }, // Consignee State
      { wch: 10 }, // Consignee ZipCode
      { wch: 15 }, // Consignee Phone No
      { wch: 15 }, // Service Type
      { wch: 5 }, // Pcs
      { wch: 25 }, // Goods Desc
      { wch: 10 }, // Act Weight
      { wch: 10 }, // Vol Weight
      { wch: 10 }, // Chg Weight
      { wch: 10 }, // Vol Discount
      { wch: 15 }, // Payment Type
      { wch: 10 }, // Basic Amount
      { wch: 10 }, // SGST
      { wch: 10 }, // CGST
      { wch: 10 }, // IGST
      { wch: 10 }, // Misc Chg
      { wch: 15 }, // Misc Remark
      { wch: 10 }, // Fuel
      { wch: 20 }, // Grand Total
      { wch: 10 }, // Currency
      { wch: 25 }, // Bill No
      { wch: 10 }, // Awb Check
      { wch: 15 }, // Sale Type
      { wch: 15 }, // Shipment Forwarder
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SalesReport");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      "SalesReport.xlsx"
    );
    showNotification("success", "Sale Report Downloaded");
  };

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "bookingDate", label: "Booking Date" },
      { key: "flightDate", label: "Flight Date" },
      { key: "runNo", label: "Run No" },
      { key: "clubNo", label: "Club No" },
      { key: "branch", label: "Branch" },
      { key: "salePerson", label: "Sale Person" },
      { key: "reference", label: "Reference By" },
      { key: "managedBy", label: "Managed By" },
      { key: "collectionBy", label: "Collection By" },
      { key: "accountManager", label: "Account Manager" },
      { key: "rateType", label: "Rate Type" },
      { key: "originName", label: "Origin Name" },
      { key: "sector", label: "Sector" },
      { key: "destinationCode", label: "Destination Code" },
      { key: "accountCode", label: "Customer Code" },
      { key: "customer", label: "Customer Name" },
      { key: "consigneeName", label: "Consignee Name" },
      { key: "consigneeAddressLine1", label: "Consignee Address Line1" },
      { key: "consigneeCity", label: "Consignee City" },
      { key: "consigneeState", label: "Consignee State" },
      { key: "consigneeZipCode", label: "Consignee ZipCode" },
      { key: "consigneePhoneNo", label: "Consignee Phone No" },
      { key: "serviceType", label: "Service Type" },
      { key: "pcs", label: "Pcs" },
      { key: "goodsDesc", label: "Goods Desc" },
      { key: "actWeight", label: "Act Weight" },
      { key: "volWeight", label: "Vol Weight" },
      { key: "chgWeight", label: "Chg Weight" },
      { key: "volDiscount", label: "Vol Discount" },
      { key: "paymentType", label: "Payment Type" },
      { key: "basicAmount", label: "Basic Amount" },
      { key: "sgst", label: "SGST" },
      { key: "cgst", label: "CGST" },
      { key: "igst", label: "IGST" },
      { key: "mischg", label: "Misc Chg" },
      { key: "miscRemark", label: "Misc Remark" },
      { key: "fuel", label: "Fuel" },
      { key: "grandTotal", label: "Grand Total" },
      { key: "currency", label: "Currency" },
      { key: "billNo", label: "Bill No" },
      { key: "awbCheck", label: "Awb Check" },
      { key: "saleType", label: "Sale Type" },
      { key: "date", label: "Date" },
      { key: "shipmentForwarder", label: "Shipment Forwarder" },
    ],
    []
  );

  const handleSearch = async (page = 1) => {
    try {
      setLoading(true);
      const values = getValues(); // Use direct values for search

      const { from, to } = values;

      if (!from || !to) {
        showNotification("error", "Please select both From and To dates.");
        setLoading(false);
        return;
      }

      setCurrentFilters(values);

      const params = new URLSearchParams();
      params.append("from", from);
      params.append("to", to);
      params.append("page", page);
      params.append("limit", pageLimit);

      const filterKeys = [
        "runNumber", "customer", "branch", "origin", "sector", "destination",
        "network", "counterPart", "company", "state", "payment",
        "accountManager", "salePerson", "saleRefPerson",
      ];

      filterKeys.forEach((key) => {
        if (values[key]) {
          let val = values[key];
          if (["runNumber", "customer", "branch"].includes(key)) {
            val = val.toUpperCase();
          }
          params.append(key, val);
        }
      });

      if (bookingDate) params.append("bookingDate", "true");
      if (unBilledShipment) params.append("unBilledShipment", "true");
      if (skipDHL) params.append("skipDHL", "true");
      if (speacialReport) params.append("speacialReport", "true");
      if (consignorDetail) params.append("consignorDetail", "true");

      const res = await fetch(`${server}/sale-report?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        const records = json.data || [];
        const pagination = json.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: records.length,
        };

        const mapped = records.map((item) => ({
          ...item,
          bookingDate: item.bookingDate || item.date,
          flightDate: item.flightDate || item.date,
          createdDate: item.createdAt,
        }));

        setRowData(mapped);
        setFilteredData(mapped);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);

        // Update overall totals if provided, otherwise calculate from page
        if (json.totals) {
          setOverallTotals({
            totalActualWeight: json.totals.totalActualWeight || 0,
            totalChargeableWeight: json.totals.totalChargeableWeight || 0,
            grandTotal: json.totals.grandTotal || 0,
          });
        } else {
          // Fallback if backend doesn't provide overall totals
          const pageActualWeight = mapped.reduce((sum, row) => sum + (row.actWeight || 0), 0);
          const pageChargeableWeight = mapped.reduce((sum, row) => sum + (row.chgWeight || 0), 0);
          const pageGrandTotal = mapped.reduce((sum, row) => sum + (row.grandTotal || 0), 0);
          setOverallTotals({
            totalActualWeight: pageActualWeight,
            totalChargeableWeight: pageChargeableWeight,
            grandTotal: pageGrandTotal
          });
        }

        showNotification("success", `Found ${pagination.totalRecords} rows (Page ${pagination.currentPage} of ${pagination.totalPages})`);
      } else {
        showNotification("error", `Failed to fetch: ${json.message}`);
      }
    } catch (err) {
      showNotification("error", `Failed to fetch report: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    handleSearch(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      setCurrentPage(1);
      handleSearch(1);
    }
  };

  const PaginationControls = () => {
    if (totalPages <= 1 && rowData.length === 0) return null;

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-gray-50 border rounded-lg">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{rowData.length}</span> of{" "}
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

  const handleRefresh = () => {
    reset({
      runNumber: "",
      customer: "",
      branch: "",
      payment: "", // dropdown
      origin: "",
      sector: "",
      destination: "",
      network: "",
      counterPart: "",
      accountManager: "", // dropdown
      salePerson: "", // dropdown
      saleRefPerson: "", // dropdown
      company: "", // dropdown
      state: "",
      // from: "", // date
      // to: "", // date
    });

    // Reset checkboxes
    setBookingDate(false);
    setUnBilledShipment(false);
    setSkipDHL(false);
    setSpeacialReport(false);
    setConsignorDetail(false);

    // Reset table data
    setRowData([]);
    setFilteredData([]);

    // Reset pagination
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
    setCurrentFilters(null);
    setOverallTotals({
      totalActualWeight: 0,
      totalChargeableWeight: 0,
      grandTotal: 0
    });

    // Reset notifications
    setNotification({ type: "success", message: "", visible: false });
    showNotification("success", "Reset successful");
  };

  const totalActualWeight = overallTotals.totalActualWeight;
  const totalChargeableWeight = overallTotals.totalChargeableWeight;
  const grandTotalValue = overallTotals.grandTotal;

  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const res = await fetch(`${server}/sale-report/dropdown-options`);
        const json = await res.json();

        if (json.success) {
          setAccountManagers(json.data.accountManagers || []);
          setCompanies(json.data.companies || []);
          setSalePersons(json.data.salePersons || []);
        } else {
          showNotification("error", json.message);
        }
      } catch (err) {
        showNotification("error", `Failed to fetch dropdowns: ${err.message}`);
      }
    };

    fetchDropdownOptions();
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch(1);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleSearch]);

  return (
    <div className="flex flex-col gap-4">
      <Heading
        title={`Sales Report`}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        fullscreenBtn
        onRefresh={handleRefresh}
        onClickFullscreenBtn={() => {
          setIsFullScreen(true);
        }}
      />
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <div className="flex w-full gap-3">
        {["Sale Details", "Sale Summary", "Sale Summary with Collection"].map(
          (item) => (
            <RadioButtonLarge
              key={item}
              id={item}
              label={item}
              name="demo"
              register={register}
              setValue={setValue}
              selectedValue={demoRadio}
              setSelectedValue={setDemoRadio}
            />
          )
        )}
      </div>

      {[
        "Sale Details",
        "Sale Summary",
        "Sale Summary with Collection",
      ].includes(demoRadio) && (
        <form
          className="flex flex-col"
          onSubmit={handleSubmit(() => handleSearch(1))}
          noValidate
        >
          <div className=" flex  flex-col gap-3">
            <div className="flex gap-3">
              <InputBox
                placeholder="Run Number"
                register={register}
                setValue={setValue}
                value="runNumber"
              />
              <InputBox
                placeholder="Customer"
                register={register}
                setValue={setValue}
                value="customer"
              />
              <InputBox
                placeholder="Branch"
                register={register}
                setValue={setValue}
                value="branch"
              />
              <LabeledDropdown
                options={["AIR CARGO", "COD", "Credit", "FOC", "RTO"]}
                register={register}
                setValue={setValue}
                value="payment"
                title="Payment"
              />
              <InputBox
                placeholder="Origin"
                register={register}
                setValue={setValue}
                value="origin"
              />
              <InputBox
                placeholder="Sector"
                register={register}
                setValue={setValue}
                value="sector"
              />
            </div>

            <div className="flex gap-3">
              <InputBox
                placeholder="Destination"
                register={register}
                setValue={setValue}
                value="destination"
              />
              <InputBox
                placeholder="Network"
                register={register}
                setValue={setValue}
                value="network"
              />
              <InputBox
                placeholder="Counter Part"
                register={register}
                setValue={setValue}
                value="counterPart"
              />
              <LabeledDropdown
                options={accountManagers}
                register={register}
                setValue={setValue}
                value="accountManager"
                title="Account Manager"
              />
              <LabeledDropdown
                options={salePersons}
                register={register}
                setValue={setValue}
                value="salePerson"
                title="Sale Person"
              />
              <LabeledDropdown
                options={[]}
                register={register}
                setValue={setValue}
                value="saleRefPerson"
                title="Sale Ref. Person"
              />
            </div>
            <div className="flex gap-3">
              <LabeledDropdown
                options={companies}
                register={register}
                setValue={setValue}
                value="company"
                title="Company"
              />

              <InputBox
                placeholder="State"
                register={register}
                setValue={setValue}
                value="state"
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value={`from`}
                placeholder="From"
                required={false}
              />
              <DateInputBox
                register={register}
                setValue={setValue}
                value={`to`}
                placeholder="To"
                required={false}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-20">
                <RedCheckbox
                  isChecked={bookingDate}
                  setChecked={setBookingDate}
                  id="bookingDate"
                  register={register}
                  setValue={setValue}
                  label={"Booking Date"}
                />
                <RedCheckbox
                  isChecked={unBilledShipment}
                  setChecked={setUnBilledShipment}
                  id="unBilledShipment"
                  register={register}
                  setValue={setValue}
                  label={"UnBilled Shipment"}
                />
                <RedCheckbox
                  isChecked={skipDHL}
                  setChecked={setSkipDHL}
                  id="skipDHL"
                  register={register}
                  setValue={setValue}
                  label={"skip DHL"}
                />
                <RedCheckbox
                  isChecked={speacialReport}
                  setChecked={setSpeacialReport}
                  id="speacialReport"
                  register={register}
                  setValue={setValue}
                  label={"Speacial Report Branch Wise"}
                />
                <RedCheckbox
                  isChecked={consignorDetail}
                  setChecked={setConsignorDetail}
                  id="consignorDetail"
                  register={register}
                  setValue={setValue}
                  label={"Consignor Detail Wise"}
                />
              </div>               <div className="w-[200px]">
                <SimpleButton name={loading ? "Searching..." : "Search"} type="submit" disabled={loading} />
              </div>
            </div>
          </div>

          <div className="mt-3">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="refShipper"
              columns={columns}
              rowData={filteredData}
              className={"h-[40vh] rounded-b-none border-b-0"}
            />
            <div className="flex text-sm bg-[#D0D5DDB8] font-semibold justify-end items-center gap-6 tracking-wide w-full px-3 py-2 rounded-md rounded-t-none border-t-0 border border-battleship-gray mb-1">
              <div>
                Total Actual Weight:{" "}
                <span className="text-[#EA1B40] tracking-wider">
                  {totalActualWeight}Kg
                </span>
              </div>
              <div>
                Total Chargeable Weight:{" "}
                <span className="text-[#EA1B40] tracking-wider">
                  {totalChargeableWeight}Kg
                </span>
              </div>
              <div className="pr-3">
                Grand Total:{" "}
                <span className="text-[#EA1B40] tracking-wider pr-3">
                  {grandTotalValue}
                </span>
              </div>
            </div>
            <PaginationControls />
          </div>


          {isFullScreen && (
            <div className="fixed inset-0 z-50 p-10 bg-white">
              <div className="flex justify-between items-center mb-2 mx-1">
                <Heading
                  title={`Sales Details`}
                  codeListBtn="hidden"
                  bulkUploadBtn="hidden"
                  refreshBtn="hidden"
                />
                <X
                  onClick={() => setIsFullScreen(false)}
                  className="cursor-pointer text-black"
                />
              </div>

              <div className="h-full mb-20">
                <TableWithSorting
                  register={register}
                  setValue={setValue}
                  name="refShipper"
                  columns={columns}
                  rowData={filteredData}
                  className={"h-[85vh] rounded-b-none border-b-0"}
                />
                <div className="flex text-sm bg-[#D0D5DDB8] font-semibold justify-end items-center gap-6 tracking-wide w-full px-3 py-2 rounded-md rounded-t-none border-t-0 border border-battleship-gray mb-3">
                  <div>
                    Total Actual Weight:{" "}
                    <span className="text-[#EA1B40] tracking-wider">
                      {totalActualWeight}Kg
                    </span>
                  </div>
                  <div>
                    Total Chargeable Weight:{" "}
                    <span className="text-[#EA1B40] tracking-wider">
                      {totalChargeableWeight}Kg
                    </span>
                  </div>
                    <div className="pr-3">
                      Grand Total:{" "}
                      <span className="text-[#EA1B40] tracking-wider pr-3">
                        {grandTotalValue}
                      </span>
                    </div>
                  </div>
                  <PaginationControls />
                </div>
              </div>
            )}

          <div className="flex  justify-between">
            <div className="w-36">
              <OutlinedButtonRed label={`Close`} />
            </div>
            <div>
              <SimpleButton
                name={`Download Excel`}
                onClick={handleDownloadExcel}
              />
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SalesReport;
