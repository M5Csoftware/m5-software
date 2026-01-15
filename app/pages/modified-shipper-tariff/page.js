"use client";
import { DeleteButton } from "@/app/components/AddUpdateDeleteButton";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  SearchInputBox,
} from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import Table from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";

const ModifiedShipperTariff = () => {
  const { register, setValue, reset, watch, getValues, handleSubmit } =
    useForm();
  const [rowData, setRowData] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [zoneMatrixOptions, setzoneMatrixOptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { sectors, server } = useContext(GlobalContext);
  const [responseMsg, setResponseMsg] = useState("");
  const [visibleFlag, setVisibleFlag] = useState(false);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const normalizeDate = (val) => {
    if (!val) return "";

    // YYYY-MM-DD (safe)
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      return `${y}-${m}-${d}`;
    }

    return "";
  };

  const selectedSector = watch("sector");

  // Fetch zones data based on sector
  const fetchZonesData = async (sector) => {
    if (!sector) {
      setServiceOptions([]);
      setzoneMatrixOptions([]);
      return;
    }

    try {
      const response = await fetch(`${server}/zones`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      const sectorMapping = { "United States": "USA", USA: "USA" };
      const mappedSector = sectorMapping[sector] || sector;

      const filteredData = data.filter(
        (item) => item.sector?.toUpperCase() === mappedSector.toUpperCase()
      );

      const uniqueServices = [
        ...new Set(
          filteredData
            .filter((item) => item.service)
            .map((item) => item.service)
        ),
      ];

      const uniqueZoneMatrices = [
        ...new Set(
          filteredData
            .filter((item) => item.zoneMatrix)
            .map((item) => item.zoneMatrix)
        ),
      ];

      setServiceOptions(uniqueServices);
      setzoneMatrixOptions(uniqueZoneMatrices);
    } catch (error) {
      console.error("Error fetching zones data:", error);
      setServiceOptions([]);
      setzoneMatrixOptions([]);
    }
  };

  // Fetch customer names with account codes
  const fetchCustomerNames = async () => {
    try {
      const response = await axios.get(`${server}/customer-account`);
      const customerData = response.data;

      const customerOptions = customerData
        .filter((item) => item.name?.trim())
        .map((item) => ({
          label: `${item.name.trim()}${
            item.accountCode ? ` (${item.accountCode})` : ""
          }`,
          value: item.name.trim(),
          accountCode: item.accountCode || "",
        }));

      // Remove duplicates
      const uniqueCustomers = customerOptions.filter(
        (customer, index, self) =>
          index === self.findIndex((c) => c.value === customer.value)
      );

      setCustomers(uniqueCustomers);
    } catch (error) {
      console.error("Error fetching customer data:", error);
    }
  };

  useEffect(() => {
    fetchCustomerNames();
  }, []);

  useEffect(() => {
    if (selectedSector) {
      fetchZonesData(selectedSector);
    }
  }, [selectedSector]);

  // Add to table only
  const handleApplicableRates = (e) => {
    e.preventDefault();
    const formData = getValues();

    const fromDate = normalizeDate(formData.from);
    const toDate = normalizeDate(formData.to);

    if (!fromDate || !toDate) {
      showNotification("error", "Select both From and To dates");
      return;
    }

    const newRow = {
      id: Date.now(),
      customer: formData.client || "",
      network: formData.network || "",
      service: formData.service || "",
      zoneMatrix: formData.zoneMatrix || "",
      rateTariff: formData.rateTariff || "",
      country: formData.sector || "",
      mode: formData.mode || "",
      fromDate: normalizeDate(formData.from),
      toDate: normalizeDate(formData.to),
    };

    setRowData((prevData) => [...prevData, newRow]);
    console.log("Added to table:", newRow);
  };

  // Save to database
  const onSubmit = async (data) => {
    setLoading(true);
    const formData = getValues();

    const fromDate = normalizeDate(formData.from);
    const toDate = normalizeDate(formData.to);

    if (!fromDate || !toDate) {
      showNotification("error", "From and To dates are required");
      setLoading(false);
      return;
    }

    const payload = {
      customer: formData.client || "",
      network: formData.network || "",
      service: formData.service || "",
      zoneMatrix: formData.zoneMatrix || "",
      rateTariff: formData.rateTariff || "",
      country: formData.sector || "",
      mode: formData.mode || "",
      fromDate: normalizeDate(formData.from),
      toDate: normalizeDate(formData.to),
      rowData: Array.isArray(rowData) ? rowData : [],
    };

    try {
      const response = await axios.post(`${server}/shipper-tariff`, payload);
      console.log("Saved to database:", response.data);

      // Reset form and clear data
      reset();
      setRowData([]);
      setServiceOptions([]);
      setzoneMatrixOptions([]);

      console.log("Data saved successfully!");
      showNotification("success", "shipper tariff data added successfully!");
    } catch (error) {
      console.error("Error saving data:", error);
      const errorMessage =
        error.response?.data?.error || "Error saving data. Please try again.";

      console.log(errorMessage);
      showNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter table data based on search
  const filteredRowData = useMemo(() => {
    if (!searchTerm.trim()) return rowData;
    return rowData.filter((row) =>
      Object.values(row).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [rowData, searchTerm]);

  const columns = useMemo(
    () => [
      { key: "customer", label: "Customer" },
      { key: "network", label: "Network" },
      { key: "service", label: "Service" },
      { key: "zoneMatrix", label: "Zone Tariff" },
      { key: "rateTariff", label: "Rate Tariff" },
      { key: "country", label: "Country" },
      { key: "mode", label: "Mode" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
    ],
    []
  );

  const networkOptions = ["MPL", "M5C"];
  const modeOptions = ["Normal Rate", "Express Rate", "Priority Rate"];

  return (
    <form
      className="flex flex-col gap-[34px]"
      onSubmit={handleSubmit(onSubmit)}
    >
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Modify Shipper Tariff"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />

      <div className="font-semibold text-sm flex gap-1 items-center justify-end">
        <span className="text-eerie-black">Branch: </span>
        <span className="text-red bg-misty-rose py-0.5 px-2.5 rounded">
          New Delhi
        </span>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-[16px] text-red font-semibold">
            Shipper Details
          </h2>

          <div className="flex gap-[20px]">
            <LabeledDropdown
              options={sectors.map((sector) => sector.name)}
              register={register}
              setValue={setValue}
              value="sector"
              title="Sector"
              reset={reset}
            />
            <LabeledDropdown
              options={customers.map((customer) => customer.label || customer)}
              register={register}
              setValue={setValue}
              value="client"
              title="Client"
            />
            <LabeledDropdown
              options={serviceOptions}
              register={register}
              setValue={setValue}
              value="service"
              title="Service"
            />
          </div>

          <div className="flex gap-[20px]">
            <LabeledDropdown
              options={zoneMatrixOptions}
              register={register}
              setValue={setValue}
              value="zoneMatrix"
              title="Zone Matrix"
            />
            <LabeledDropdown
              options={networkOptions}
              register={register}
              setValue={setValue}
              value="network"
              title="Network"
            />
            <InputBox
              placeholder="Rate Tariff"
              register={register}
              setValue={setValue}
              value="rateTariff"
            />
          </div>

          <div className="flex gap-[20px]">
            <LabeledDropdown
              options={modeOptions}
              register={register}
              setValue={setValue}
              value="mode"
              title="Mode"
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
            />
          </div>
        </div>

        <div className="flex w-full">
          <div className="w-full">
            <DeleteButton />
          </div>
          <div className="flex gap-2 w-full justify-end">
            <div>
              <OutlinedButtonRed label="Close" />
            </div>
            <div>
              <SimpleButton
                name={loading ? "Loading..." : "Save"}
                type="submit"
                disabled={loading}
              />
            </div>

            {/* <div>
              <SimpleButton
                name="Applicable Rates"
                type="button"
                onClick={handleApplicableRates}
              />
            </div> */}
          </div>
        </div>

        <SearchInputBox
          placeholder="Search Tariff"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Table
          columns={columns}
          rowData={filteredRowData}
          register={register}
          setValue={setValue}
          name="shippertariff"
        />
      </div>
    </form>
  );
};

export default ModifiedShipperTariff;
