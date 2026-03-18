"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import {
  DummyInputBoxDarkGray,
  DummyInputBoxWithLabelDarkGray,
} from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox from "@/app/components/InputBox";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import RedCheckbox from "@/app/components/RedCheckBox";
import Table from "@/app/components/Table";
import React, { useMemo, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";

export default function ManifestReportD() {
  const [demoRadio, setDemoRadio] = useState("Manifest (O)");
  const { register, setValue, watch } = useForm();
  const [rowData, setrowData] = useState([]);
  const [enableCanada, setEnableCanada] = useState(false);
  const [singleAddress, setSingleAddress] = useState(false);
  const [enableBagNumber, setEnableBagNumber] = useState(false);
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const runNo = watch("runNumber");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pageLimit, setPageLimit] = useState(50); // Records per page
  const [currentFilters, setCurrentFilters] = useState(null); // Store filters for pagination

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const columns = useMemo(
    () => [
      { key: "serviceName", label: "Service Name" },
      { key: "chgWeight", label: "Chg. Weight" },
      { key: "volWeight", label: "Vol. Weight" },
      { key: "estRate", label: "Est. Rate" },
    ],
    []
  );

  const handleRadioChange = (value) => {
    setDemoRadio(value);
    setrowData([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalRecords(0);
  };

  const fetchManifestData = async (runNumber, page = 1) => {
    if (!runNumber) return;

    setLoading(true);
    try {
      // Endpoint is a guess based on naming convention
      const response = await axios.get(`${server}/portal/manifest-report-d?runNo=${runNumber}&page=${page}&limit=${pageLimit}`);
      const data = response.data.records || response.data.shipments || response.data.data || [];
      const pagination = response.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalRecords: data.length,
      };

      setrowData(data);
      setTotalRecords(pagination.totalRecords);
      setTotalPages(pagination.totalPages);
      setCurrentPage(pagination.currentPage);

      if (data.length === 0) {
        showNotification("error", "No records found");
      } else {
        showNotification("success", `Found ${pagination.totalRecords} records`);
      }
    } catch (err) {
      console.error("Failed fetching manifest data D:", err);
      showNotification("error", "Failed to fetch data. Endpoint might be missing.");
      setrowData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = () => {
    const query = runNo?.trim();
    if (!query) {
      showNotification("error", "Please enter a run number");
      return;
    }
    setCurrentFilters(query);
    setCurrentPage(1);
    fetchManifestData(query, 1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || !currentFilters) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="flex flex-col gap-3">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Manifest Report D"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
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
            setSelectedValue={handleRadioChange}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <div className="flex gap-3">
            <RedCheckbox
              id="enableCanada"
              label="Canada M/f"
              isChecked={enableCanada}
              setChecked={setEnableCanada}
              register={register}
              setValue={setValue}
            />

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
              register={register}
              setValue={setValue}
            />
            <DummyInputBoxWithLabelDarkGray
              label="A/L MAWB"
              value="a/lMawb"
              register={register}
              setValue={setValue}
            />
            <DummyInputBoxWithLabelDarkGray
              label="OBC"
              value="obc"
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
                register={register}
                setValue={setValue}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Counter Part"
                value="counterPart"
                register={register}
                setValue={setValue}
              />
              <DummyInputBoxWithLabelDarkGray
                label="Flight"
                value="flight"
                register={register}
                setValue={setValue}
              />
            </div>
            
            <div className="flex gap-3 w-[24%]">
              <OutlinedButtonRed label={loading ? "Loading..." : "View"} onClick={handleView} disabled={loading} />
              <SimpleButton name="Download" disabled={rowData.length === 0 || loading} />
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          rowData={rowData}
          register={register}
          setValue={setValue}
          name="manifestreportd"
        />
        <PaginationControls />
      </div>
    </div>
  );
}