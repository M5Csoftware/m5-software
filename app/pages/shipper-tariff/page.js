"use client";
import { DeleteButton } from "@/app/components/AddUpdateDeleteButton";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown, DropdownRedLabel } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  SearchInputBox,
} from "@/app/components/InputBox";
import NotificationFlag from "@/app/components/Notificationflag";
import Table, {
  TableWithCheckboxEditDelete,
  TableWithCTA,
} from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import React, { useContext, useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";

const ShipperTariff = () => {
  const {
    register,
    setValue,
    reset,
    watch,
    getValues,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm();
  const [rowData, setRowData] = useState([]);
  const [serviceOptions, setServiceOptions] = useState([]);
  const [zoneMatrixOptions, setzoneMatrixOptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [networkOptions, setNetworkOptions] = useState([]);
  const [rateTariffOptions, setRateTariffOptions] = useState([]);
  const [selectedRateTariff, setSelectedRateTariff] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { sectors, server } = useContext(GlobalContext);


  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
  };

  const selectedSector = watch("sector");
  const selectedClient = watch("client");

  const normalizeDate = (val) => {
    if (!val) return "";

    // already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    // DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      return `${y}-${m}-${d}`;
    }

    return "";
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return "";

    try {
      // Handle different date formats
      if (typeof dateString === 'string') {
        // If it's already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }

        // If it's in ISO format with time
        if (dateString.includes('T')) {
          return dateString.split('T')[0];
        }

        // Try to parse it
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      }

      return dateString;
    } catch (error) {
      console.error("Error formatting date:", error, dateString);
      return dateString;
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
          label: `${item.name.trim()}${item.accountCode ? ` (${item.accountCode})` : ""
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

  // Fetch rate tariff options from rate sheet
  const fetchRateTariffOptions = async () => {
    try {
      const response = await axios.get(`${server}/rate-sheet`);
      const rateData = response.data;

      // Extract unique shipper names
      const uniqueRateTariffs = [...new Set(rateData.map(item => item.shipper))].filter(Boolean);
      setRateTariffOptions(uniqueRateTariffs.sort());
    } catch (error) {
      console.error("Error fetching rate tariff data:", error);
      setRateTariffOptions([]);
    }
  };

  // Fetch zones data based on sector
  const fetchZonesData = async (sector) => {
    if (!sector || sector === "All") {
      setServiceOptions([]);
      setzoneMatrixOptions([]);
      return;
    }

    console.log("🔍 Fetching zones for sector:", sector);

    try {
      // Send the sector as-is to the backend
      // Backend should handle normalization
      const response = await axios.get(
        `${server}/shipper-tariff/get-zones?sector=${encodeURIComponent(sector)}`
      );

      console.log("✅ Zones response:", response.data);

      // Transform the response data to match your UI needs
      const services = response.data?.services || [];
      const zoneMatrices = response.data?.zoneMatrix || [];

      console.log("📋 Services found:", services);
      console.log("📋 Zone Matrices found:", zoneMatrices);

      setServiceOptions(services);
      setzoneMatrixOptions(zoneMatrices);

    } catch (error) {
      console.error("❌ Error fetching zones data:", error);
      console.error("Error details:", error.response?.data || error.message);
      setServiceOptions([]);
      setzoneMatrixOptions([]);

      // Show notification to user
      showNotification("error", "Failed to load services and zones. Please try again.");
    }
  };

  // Fetch applicable rates from database based on sector and client
  const fetchApplicableRates = async (sector, client) => {
    if (!client) {
      setRowData([]);
      return;
    }

    try {
      let url = `${server}/shipper-tariff?customer=${encodeURIComponent(client)}`;

      if (sector && sector !== "All") {
        url += `&sector=${encodeURIComponent(sector)}`;
      }

      const response = await axios.get(url);

      // Transform the dates in the response
      const formattedData = response.data.map(item => ({
        ...item,
        fromDate: formatDisplayDate(item.fromDate),
        toDate: formatDisplayDate(item.toDate)
      }));

      setRowData(formattedData || []);
    } catch (error) {
      console.error("Error fetching applicable rates:", error);
      setRowData([]);
    }
  };

  //Fetch Network
  const fetchNetworkData = async () => {
    try {
      const response = await axios.get(
        `${server}/entity-manager?entityType=Network`
      );
      console.log("Network response:", response.data);
      setNetworkOptions(response.data || []);
    } catch (error) {
      console.error("Error fetching network data:", error);
      setNetworkOptions([]);
    }
  };

  useEffect(() => {
    fetchCustomerNames();
    fetchNetworkData();
    fetchRateTariffOptions();
  }, []);

  useEffect(() => {
    if (selectedSector) {
      setValue("service", "");
      setValue("zoneMatrix", "");
      setValue("rateTariff", "");
      fetchZonesData(selectedSector);

      // Fetch data if client is also selected
      if (selectedClient) {
        fetchApplicableRates(selectedSector, selectedClient);
      }
    }
  }, [selectedSector]);

  useEffect(() => {
    // Fetch data when client changes and sector is selected
    if (selectedClient && selectedSector) {
      fetchApplicableRates(selectedSector, selectedClient);
    } else if (!selectedClient) {
      setRowData([]);
    }
  }, [selectedClient]);

  // Add to table only
  useEffect(() => {
    const service = watch("service");
    const client = watch("client");
    const sector = watch("sector");
    const zoneMatrix = watch("zoneMatrix");
    const network = watch("network");

    if (!service || !client || !sector) return;

    // Helper function for case-insensitive comparison
    const normalizeStr = (str) => (str || "").toString().toLowerCase().trim();

    const match = rowData.find(
      (row) =>
        normalizeStr(row.customer) === normalizeStr(client) &&
        normalizeStr(row.country) === normalizeStr(sector) &&
        normalizeStr(row.service) === normalizeStr(service)
    );

    if (match) {
      setValue("rateTariff", match.rateTariff);
      setSelectedRateTariff(match.rateTariff);
      setValue("mode", match.mode);
      setValue("from", normalizeDate(match.fromDate));
      setValue("to", normalizeDate(match.toDate));
    } else {
      setValue("rateTariff", "");
      setSelectedRateTariff("");
      setValue("mode", "");
      setValue("from", "");
      setValue("to", "");
    }
  }, [watch("service"), watch("zoneMatrix"), watch("network")]);

  const handleApplicableRates = () => {
    if (
      !watch("sector") ||
      !watch("client") ||
      !watch("network") ||
      !watch("service") ||
      !watch("zoneMatrix") ||
      !watch("rateTariff") ||
      !watch("mode") ||
      !watch("from") ||
      !watch("to")
    ) {
      trigger();
      return;
    }

    const formData = getValues();

    const fromDate = normalizeDate(formData.from);
    const toDate = normalizeDate(formData.to);

    if (!fromDate || !toDate) {
      showNotification("error", "Invalid date format");
      return;
    }

    const newRow = {
      id: Date.now(),
      customer: formData.client,
      network: formData.network,
      service: formData.service,
      zoneMatrix: formData.zoneMatrix,
      rateTariff: formData.rateTariff,
      country: formData.sector,
      mode: formData.mode,
      fromDate: formatDisplayDate(fromDate),
      toDate: formatDisplayDate(toDate),
    };
    const normalizeStr = (str) => (str || "").toString().toLowerCase().trim();

    // ✅ Check if same tariff already exists (case-insensitive)
    const existsIndex = rowData.findIndex(
      (row) =>
        normalizeStr(row.customer) === normalizeStr(formData.client) &&
        normalizeStr(row.country) === normalizeStr(formData.sector) &&
        normalizeStr(row.service) === normalizeStr(formData.service)
    );

    if (existsIndex !== -1) {
      // ✅ Update existing row
      const updatedRows = [...rowData];
      updatedRows[existsIndex] = { ...updatedRows[existsIndex], ...newRow };
      setRowData(updatedRows);
      console.log("🔄 Modified existing tariff:", newRow);
      showNotification("success", "Tariff updated in table");
    } else {
      // ✅ Insert new row
      setRowData((prev) => [...prev, newRow]);
      console.log("➕ Added new tariff:", newRow);
      showNotification("success", "Tariff added to table");
    }
  };

  // Save to database
  const onSubmit = async () => {
    if (rowData.length === 0) {
      showNotification("error", "No data to save.");
      return;
    }

    console.log("Submitting data to server:", rowData);
    try {
      const response = await axios.post(`${server}/shipper-tariff`, rowData);
      console.log("Saved to database:", response.data);

      // Reset form and clear data
      setRowData([]);
      setServiceOptions([]);
      setzoneMatrixOptions([]);
      setSelectedRateTariff("");
      reset(); // Clear React Hook Form state
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

  const modeOptions = ["Normal Rate", "Zip Code Wise"];

  // Create sector options with "All" at the beginning
  const sectorOptions = ["All", ...sectors.map((sector) => sector.name)];

  // Edit & Delete Row
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [formValues, setFormValues] = useState({
    sector: "",
    client: "",
    network: "",
    service: "",
    zoneMatrix: "",
    rateTariff: "",
    mode: "",
    from: "",
    to: "",
  });

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

  const askEdit = (index) => {
    setSelectedIndex(index);
    setModalAction("edit");
    setModalOpen(true);
  };

  const askDelete = (index) => {
    setSelectedIndex(index);
    setModalAction("delete");
    setModalOpen(true);
  };

  const handleModalConfirm = () => {
    if (modalAction === "edit") {
      handleEdit(selectedIndex);
    }
    if (modalAction === "delete") {
      handleDelete(selectedIndex);
    }
    setModalOpen(false);
  };

  const handleModalCancel = () => {
    setModalOpen(false);
  };

  const handleDelete = (index) => {
    const newData = rowData.filter((_, i) => i !== index);
    // setRowData(newData);
    console.log(newData);
  };

  const handleEdit = (index) => {
    const row = rowData[index];
    if (!row) return;

    setValue("sector", row.country);
    setValue("client", row.customer);
    setValue("network", row.network);
    setValue("service", row.service);
    setValue("zoneMatrix", row.zoneMatrix);
    setValue("rateTariff", row.rateTariff);
    setSelectedRateTariff(row.rateTariff);
    setValue("mode", row.mode);
    setValue("from", row.fromDate);
    setValue("to", row.toDate);

    setFormValues({
      sector: row.country,
      client: row.customer,
      network: row.network,
      service: row.service,
      zoneMatrix: row.zoneMatrix,
      rateTariff: row.rateTariff,
      mode: row.mode,
      from: formatDate(row.fromDate),
      to: formatDate(row.toDate),
    });

    // Remove row being edited
    const newData = [...rowData];
    newData.splice(index, 1);
    // setRowData(newData);
    console.log(newData);
  };

  //handle refresh btn
  const handleRefresh = () => {
    reset(); // Reset form values
    setSelectedRateTariff("");
    setRowData([]); // Clear table data on refresh? (Optional, based on requirement, but usually refresh means start over)
  };

  return (
    <form className="flex flex-col gap-[34px]">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      <Heading
        title="Shipper Tariff"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh}
      />

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <h2 className="text-[16px] text-red font-semibold">
              Shipper Details
            </h2>
            <div className="">
              <span className="text-eerie-black font-semibold">Branch: </span>
              <span className="text-red font-semibold bg-misty-rose py-0.5 px-2.5 rounded">
                New Delhi
              </span>
            </div>
          </div>

          <div className="flex gap-[20px]">
            <LabeledDropdown
              options={sectorOptions}
              register={register}
              setValue={setValue}
              value={`sector`}
              title="Sector"
              selectedValue={watch("sector")}
              trigger={trigger}
              error={errors.sector}
              validation={{
                required: "Sector is required",
                minLength: { value: 1, message: "Sector is required" },
              }}
              defaultValue={formValues.sector}
            />
            <LabeledDropdown
              options={customers.map((customer) => customer.label || customer)}
              register={register}
              setValue={setValue}
              value={"client"}
              title="Client"
              selectedValue={watch("client")}
              error={errors.client}
              validation={{
                required: "Client is required",
                minLength: {
                  value: 1,
                  message: "Client is required",
                },
              }}
              trigger={trigger}
              defaultValue={formValues.client}
            />
            <LabeledDropdown
              options={serviceOptions}
              register={register}
              setValue={setValue}
              value={"service"}
              title="Service"
              selectedValue={watch("service")}
              error={errors.service}
              validation={{
                required: "Service is required",
                minLength: { value: 1, message: "Service is required" },
              }}
              trigger={trigger}
              defaultValue={formValues.service}
            />
          </div>

          <div className="flex gap-[20px]">
            <LabeledDropdown
              options={zoneMatrixOptions}
              register={register}
              setValue={setValue}
              value={`zoneMatrix`}
              title="Zone Matrix"
              selectedValue={watch("zoneMatrix")}
              error={errors.zoneMatrix}
              validation={{
                required: "Zone Matrix is required",
                minLength: { value: 1, message: "Zone Matrix is required" },
              }}
              trigger={trigger}
              defaultValue={formValues.zoneMatrix}
            />
            <LabeledDropdown
              options={networkOptions.map((network) => network.name)}
              register={register}
              setValue={setValue}
              value={`network`}
              title="Network"
              selectedValue={watch("network")}
              error={errors.network}
              validation={{
                required: "Network is required",
                minLength: { value: 1, message: "Network is required" },
              }}
              trigger={trigger}
              defaultValue={formValues.network}
            />
            <LabeledDropdown
              options={rateTariffOptions}
              register={register}
              setValue={(name, value) => {
                setValue(name, value);
                setSelectedRateTariff(value);
              }}
              title="Rate Tariff"
              value="rateTariff"
              selectedValue={watch("rateTariff")}
            />
          </div>

          <div className="flex gap-[20px]">
            <LabeledDropdown
              options={modeOptions}
              register={register}
              setValue={setValue}
              value={"mode"}
              title="Mode"
              selectedValue={watch("mode")}
              error={errors.mode}
              validation={{
                required: "Mode is required",
                minLength: { value: 1, message: "Mode is required" },
              }}
              trigger={trigger}
              defaultValue={formValues.mode}
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="from"
              placeholder="From"
              error={errors.from}
              validation={{ required: "From date is required" }}
              trigger={trigger}
              initialValue={formValues.from}
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
              error={errors.to}
              validation={{ required: "To date is required" }}
              trigger={trigger}
              initialValue={formValues.to}
            />
          </div>
        </div>

        <div className="flex w-full">
          <div className="w-full">
            {/* <DeleteButton /> */}
          </div>
          <div className="flex gap-2 w-full justify-end">
            <div>
              <SimpleButton
                name="Applicable Rates"
                type="button"
                onClick={handleApplicableRates}
              />
            </div>
            <div>
              <SimpleButton
                name={loading ? "Loading..." : "Save"}
                onClick={() => onSubmit()}
                disabled={rowData.length <= 0}
              />
            </div>
          </div>
        </div>

        <SearchInputBox
          placeholder="Search Tariff"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <TableWithCTA
          columns={columns}
          rowData={filteredRowData}
          register={register}
          setValue={setValue}
          name="shippertariff"
          handleDelete={askDelete}
          handleEdit={askEdit}
        />
      </div>
      <ConfirmModal
        open={modalOpen}
        title="Confirmation"
        message={
          modalAction === "delete"
            ? "Are you sure you want to delete this row?"
            : "Do you want to edit this row?"
        }
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />
    </form>
  );
};

export default ShipperTariff;

// ConfirmModal
function ConfirmModal({
  open,
  title = "Are you sure?",
  message = "Do you want to continue?",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-[350px]">
        <h2 className="text-lg font-bold mb-1">{title}</h2>
        <p className="text-gray-600 mb-5">{message}</p>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 w-[5vw]"
            onClick={onCancel}
          >
            No
          </button>

          <button
            className="px-4 py-2 rounded-md bg-red text-white hover:bg-dark-red w-[5vw]"
            onClick={onConfirm}
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
}