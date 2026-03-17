"use client";

import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useState, useMemo, useContext, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import NotificationFlag from "../Notificationflag";
import Heading from "@/app/components/Heading";
import { OutlinedButtonRed } from "@/app/components/Buttons";
import { RedCheckbox } from "@/app/components/Checkbox";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithSorting } from "@/app/components/Table";
import DownloadDropdown from "../DownloadDropdown";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import { Dropdown } from "../Dropdown";

function SaleSummary() {
  const { register, setValue, getValues, watch } = useForm();
  const { server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const [totals, setTotals] = useState({
    totalWeight: 0,
    grandTotal: 0,
  });

  const showNotification = (type, message) =>
    setNotification({ type, message, visible: true });

  const parseDateDDMMYYYY = (str) => {
    if (!str) return null;
    const [d, m, y] = str.split("/");
    return new Date(y, m - 1, d);
  };

  const columns = useMemo(
    () => [
      { key: "awbNo", label: "AWB No" },
      { key: "shipmentDate", label: "Shipment Date" },
      { key: "customerCode", label: "Customer Code" },
      { key: "customerName", label: "Customer Name" },
      { key: "salePerson", label: "Sale Person" },
      { key: "consigneeName", label: "Consignee Name" },
      { key: "consigneeAddress", label: "Consignee Address" },
    ],
    []
  );

  const handleShow = async (page = 1) => {
    const filters = getValues();
    if (!filters.from || !filters.to) {
      showNotification("error", "Please select from and to dates");
      return;
    }

    const fromObj = parseDateDDMMYYYY(filters.from);
    const toObj = parseDateDDMMYYYY(filters.to);

    if (!fromObj || !toObj || isNaN(fromObj.getTime()) || isNaN(toObj.getTime())) {
      showNotification("error", "Invalid date format");
      return;
    }

    setLoading(true);
    setCurrentFilters(filters);

    try {
      const queryParams = new URLSearchParams({
        from: fromObj.toISOString(),
        to: toObj.toISOString(),
        summary: "true",
        runNo: filters["Run Number"] || "",
        payment: filters.Payment !== "All" ? filters.Payment : "",
        branch: filters.Branch || "",
        origin: filters.Origin || "",
        sector: filters.Sector || "",
        destination: filters.Destination || "",
        network: filters.Network || "",
        counterPart: filters["Couter Part"] || "",
        salePerson: filters.salePerson !== "All" ? filters.salePerson : "",
        saleRefPerson: filters.saleRefPerson !== "All" ? filters.saleRefPerson : "",
        company: filters.Company !== "All" ? filters.Company : "",
        accountCode: filters.Customer || "",
        state: filters.State || "",
        page: page.toString(),
        limit: pageLimit.toString(),
      });

      const res = await axios.get(`${server}/sale-report-with-hold?${queryParams.toString()}`);
      
      if (res.data.success) {
        const data = res.data.data || [];
        const pagination = res.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalRecords: data.length,
        };

        setRowData(data);
        setCurrentPage(pagination.currentPage);
        setTotalPages(pagination.totalPages);
        setTotalRecords(pagination.totalRecords);

        // Update totals
        const totalW = data.reduce((acc, curr) => acc + (parseFloat(curr.totalActualWt) || 0), 0);
        const totalA = data.reduce((acc, curr) => acc + (parseFloat(curr.totalAmt) || 0), 0);
        setTotals({ totalWeight: totalW, grandTotal: totalA });

        showNotification("success", `Fetched ${data.length} records (Page ${pagination.currentPage} of ${pagination.totalPages})`);
      } else {
        showNotification("error", res.data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error(err);
      showNotification("error", "Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || loading || !currentFilters) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
    handleShow(newPage);
  };

  const handleLimitChange = (e) => {
    const newLimit = parseInt(e.target.value, 10);
    setPageLimit(newLimit);
    if (currentFilters) {
      handleShow(1);
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
            disabled={currentPage === 1 || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            First
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading || !currentFilters}
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
            disabled={currentPage === totalPages || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            Next
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || loading || !currentFilters}
            className="px-3 py-1 rounded border bg-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            type="button"
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  return (
    <form className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      {/* 🔹 Filters Section */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <InputBox
            placeholder="Run Number"
            register={register}
            setValue={setValue}
            value="Run Number"
          />
          <Dropdown
            title="Payment"
            options={[
              "Cash",
              "Credit",
              "FOC",
              "Cash On Delivery",
              "Other",
              "All",
            ]}
            value="Payment"
            register={register}
            setValue={setValue}
            defaultValue="All"
          />
          <InputBox
            placeholder="Branch"
            register={register}
            setValue={setValue}
            value="Branch"
          />
          <InputBox
            placeholder="Origin"
            register={register}
            setValue={setValue}
            value="Origin"
          />
        </div>
        <div className="flex gap-3">
          <InputBox
            placeholder="Sector"
            register={register}
            setValue={setValue}
            value="Sector"
          />
          <InputBox
            placeholder="Destination"
            register={register}
            setValue={setValue}
            value="Destination"
          />
          <InputBox
            placeholder="Network"
            register={register}
            setValue={setValue}
            value="Network"
          />
          <InputBox
            placeholder="Counter Part"
            register={register}
            setValue={setValue}
            value="Couter Part"
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Wrap inputs in fixed-width divs */}

          <Dropdown
            title="Sale Person"
            options={["All", "Sale Person 1", "Sale Person 2"]} // Placeholder as per other reports
            value="salePerson"
            register={register}
            setValue={setValue}
            defaultValue="All"
          />

          <Dropdown
            title="Sale Ref. Person"
            options={["All", "Ref 1", "Ref 2"]}
            value="saleRefPerson"
            register={register}
            setValue={setValue}
            defaultValue="All"
          />

          <Dropdown
            title="Company"
            options={["All", "Company 1", "Company 2"]}
            value="Company"
            register={register}
            setValue={setValue}
            defaultValue="All"
          />
        </div>
        <div className="flex gap-3">
          <div className="w-full">
            <InputBox
              placeholder={`Customer`}
              register={register}
              setValue={setValue}
              value={`Customer`}
            />
          </div>

          <DummyInputBoxWithLabelDarkGray
            placeholder={"DEL"}
            register={register}
            setValue={setValue}
            value={"State"}
          />
          <DateInputBox
            register={register}
            setValue={setValue}
            value={`from`}
            placeholder="From"
          />
          <DateInputBox
            register={register}
            setValue={setValue}
            value={`to`}
            placeholder="To"
          />
          <div className>
            <OutlinedButtonRed
              label={loading ? "Loading..." : "Show"}
              onClick={() => handleShow(1)}
              disabled={loading}
              type="button"
            />
          </div>
        </div>
      </div>

      {/* 🔹 Table Section */}
      <div>
        <TableWithSorting
          register={register}
          setValue={setValue}
          columns={columns}
          rowData={rowData}
          loading={loading}
          className="border-b-0 rounded-b-none h-[45vh]"
        />

        <PaginationControls />

        {/* Totals Row */}
        <div className="flex justify-between border border-t-0 border-[#D0D5DD] border-opacity-75 bg-[#D0D5DDB8] text-gray-900 rounded rounded-t-none font-sans px-4 py-2">
          <div>
            <span>Total Weight: </span>
            <span className="text-red">{totals.totalWeight.toFixed(2)} kg</span>
          </div>
          <div>
            Grand Total: <span className="text-red">{totals.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 🔹 Footer Buttons */}
      <div className="flex justify-between">
        <div></div>
        <div className="flex gap-2">
          <OutlinedButtonRed label="Print" className=" px-10 py-1" />
          <DownloadDropdown type="button" name={"Download"} />
        </div>
      </div>
    </form>
  );
}

export default SaleSummary;
