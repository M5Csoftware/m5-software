"use client";
import React, {
  useState,
  useMemo,
  useCallback,
  useContext,
  useEffect,
} from "react";
import { useForm } from "react-hook-form";
import Heading from "@/app/components/Heading";
import { SearchInputBox, DateInputBox } from "@/app/components/InputBox";
import { LabeledDropdown } from "@/app/components/Dropdown";
import InputBox from "@/app/components/InputBox";
import Table, { TableWithSorting } from "@/app/components/Table";
import ShipperTable from "./ShipperTable";
import { GlobalContext } from "@/app/lib/GlobalContext";
import NotificationFlag from "@/app/components/Notificationflag";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import axios from "axios";

const CustomerDiscount = () => {
  const { register, setValue, watch, getValues, reset, handleSubmit } =
    useForm();
  const { server, sectors } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [selectedAccountCodes, setSelectedAccountCodes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [serviceOptions, setServiceOptions] = useState([]);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
    setTimeout(() => {
      setNotification({ ...notification, visible: false });
    }, 3000);
  };

  // Watch for sector changes to fetch services
  const selectedSector = watch("sector");

  // Fetch services based on selected sector
  const fetchServices = async (sector) => {
    if (!sector) {
      setServiceOptions([]);
      return;
    }

    try {
      const response = await axios.get(
        `${server}/shipper-tariff/get-zones?sector=${encodeURIComponent(sector)}`,
      );

      const services = response.data?.services || [];
      setServiceOptions(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      setServiceOptions([]);
      showNotification("error", "Failed to load services");
    }
  };

  useEffect(() => {
    if (selectedSector) {
      fetchServices(selectedSector);
    }
  }, [selectedSector]);

  // Sample data based on the image
  const sampleCustomerData = [
    {
      cln_cd: "RJ010",
      sector: "AUSTRALIA",
      service: "EX - DEL AUS",
      discount: "10",
      fromDate: "23/02/2026",
      toDate: "23/02/2026",
    },
    {
      cln_cd: "HR001",
      sector: "AUSTRALIA",
      service: "EX - DEL AUS",
      discount: "10",
      fromDate: "23/02/2026",
      toDate: "23/02/2026",
    },
    {
      cln_cd: "DL002",
      sector: "AUSTRALIA",
      service: "EX - DEL AUS",
      discount: "10",
      fromDate: "23/02/2026",
      toDate: "23/02/2026",
    },
    {
      cln_cd: "HR003",
      sector: "AUSTRALIA",
      service: "EX - DEL AUS",
      discount: "10",
      fromDate: "23/02/2026",
      toDate: "23/02/2026",
    },
    {
      cln_cd: "PB008",
      sector: "AUSTRALIA",
      service: "EX - DEL AUS",
      discount: "10",
      fromDate: "23/02/2026",
      toDate: "23/02/2026",
    },
    {
      cln_cd: "HR005",
      sector: "AUSTRALIA",
      service: "EX - DEL AUS",
      discount: "10",
      fromDate: "23/02/2026",
      toDate: "23/02/2026",
    },
    {
      cln_cd: "UK001",
      sector: "AUSTRALIA",
      service: "EX - DEL AUS",
      discount: "10",
      fromDate: "23/02/2026",
      toDate: "23/02/2026",
    },
    {
      cln_cd: "DL013",
      sector: "AUSTRALIA",
      service: "EX - DEL AUS",
      discount: "10",
      fromDate: "23/02/2026",
      toDate: "23/02/2026",
    },
  ];

  // Load sample data on component mount
  useEffect(() => {
    const initialData = sampleCustomerData.map((item, index) => ({
      id: Date.now() + index,
      cln_cd: item.cln_cd,
      sector: item.sector,
      service: item.service,
      discount: item.discount,
      fromDate: item.fromDate,
      toDate: item.toDate,
    }));
    setRowData(initialData);
  }, []);

  // Receive selected account codes from ShipperTable
  const handleAccountCodesSelected = useCallback((codes) => {
    const validCodes = codes
      .filter((code) => code.isValid)
      .map((code) => code.code);
    setSelectedAccountCodes(validCodes);
  }, []);

  // Filter table data based on search
  const filteredRowData = useMemo(() => {
    if (!searchTerm.trim()) return rowData;

    const searchLower = searchTerm.toLowerCase();
    return rowData.filter((row) =>
      Object.values(row).some(
        (value) =>
          value && value.toString().toLowerCase().includes(searchLower),
      ),
    );
  }, [rowData, searchTerm]);

  // Add selected codes to the table with form data
  const handleAddToTable = () => {
    if (selectedAccountCodes.length === 0) {
      showNotification("error", "Please select valid account codes first");
      return;
    }

    const formData = getValues();
    const requiredFields = [
      "sector",
      "service",
      "discount",
      "fromDate",
      "toDate",
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = formData[field];
      return !value || value.toString().trim() === "";
    });

    if (missingFields.length > 0) {
      showNotification(
        "error",
        `Please fill all fields: ${missingFields.join(", ")}`,
      );
      return;
    }

    const newRows = selectedAccountCodes.map((code, index) => ({
      id: Date.now() + index + Math.random(),
      cln_cd: code,
      sector: formData.sector,
      service: formData.service,
      discount: formData.discount,
      fromDate: formData.fromDate,
      toDate: formData.toDate,
    }));

    setRowData((prev) => [...prev, ...newRows]);
    showNotification("success", `Added ${newRows.length} customer(s) to table`);
  };

  // Save data
  const onSubmit = async (data) => {
    if (rowData.length === 0) {
      showNotification("error", "No data to save");
      return;
    }

    setLoading(true);
    try {
      // API call would go here
      // await axios.post(`${server}/customer-discount/save`, { data: rowData });

      showNotification(
        "success",
        `Successfully saved ${rowData.length} customer(s)`,
      );

      // Optionally reset after save
      // handleReset();
    } catch (error) {
      showNotification("error", "Error saving data");
    } finally {
      setLoading(false);
    }
  };

  // Reset/Clear all data
  const handleReset = () => {
    setRowData([]);
    setSelectedAccountCodes([]);
    setSearchTerm("");
    setServiceOptions([]);
    setRefreshKey((prev) => prev + 1);
    reset({
      sector: "",
      service: "",
      discount: "",
      fromDate: "",
      toDate: "",
    });
    showNotification("success", "Reset successfully");
  };

  // Close/Discard changes
  const handleClose = () => {
    setRowData([]);
    setSelectedAccountCodes([]);
    setSearchTerm("");
    setServiceOptions([]);
    setRefreshKey((prev) => prev + 1);
    reset({
      sector: "",
      service: "",
      discount: "",
      fromDate: "",
      toDate: "",
    });
    showNotification("info", "Changes discarded");
  };

  // Table columns
  const columns = useMemo(
    () => [
      { key: "cln_cd", label: "Cln_cd" },
      { key: "sector", label: "Sector" },
      { key: "service", label: "Service" },
      { key: "discount", label: "Discount (Per Kg)" },
      { key: "fromDate", label: "From Date" },
      { key: "toDate", label: "To Date" },
    ],
    [],
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-6">
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />

      <Heading
        title="CUSTOMER DISCOUNT"
        onRefresh={handleReset}
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
      />

      <div className="flex gap-6 mt-6">
        {/* Left side: Shipper Table for code selection */}
        <div className="flex-1 max-w-[350px] min-w-[260px]">
          <ShipperTable
            key={refreshKey}
            onAccountCodesSelected={handleAccountCodesSelected}
          />
        </div>

        {/* Right side: Form and Table */}
        <div className="flex-1">
          {/* Form Section */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Discount Details
            </h3>

            <div className="flex gap-2">
              {/* Sector Dropdown */}
              <LabeledDropdown
                title="Sector"
                register={register}
                setValue={setValue}
                value="sector"
                options={sectors.map((s) => s.name)}
              />

              {/* Service Dropdown */}
              <LabeledDropdown
                title="Service"
                register={register}
                setValue={setValue}
                value="service"
                options={serviceOptions}
                disabled={!selectedSector}
              />
            </div>

            {/* Discount Input using InputBox component */}
            <div className="flex gap-2">
              {/* From Date */}
              <DateInputBox
                register={register}
                setValue={setValue}
                value="fromDate"
                placeholder="From Date"
              />

              {/* To Date */}
              <DateInputBox
                register={register}
                setValue={setValue}
                value="toDate"
                placeholder="To Date"
              />
            </div>
            <div className="flex gap-2">
              <div className="w-2/4">
                {" "}
                <InputBox
                  placeholder="Discount (Per Kg)"
                  register={register}
                  setValue={setValue}
                  value="discount"
                  type="text"
                />
              </div>
              <div className="w-1/4">
                <SimpleButton
                  name={loading ? "Saving..." : "Save"}
                  type="submit"
                  disabled={loading || rowData.length === 0}
                />
              </div>

              <div className="w-1/4">
                {" "}
                <OutlinedButtonRed label="Close" onClick={handleClose} />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <TableWithSorting
              register={register}
              setValue={setValue}
              name="customerDiscount"
              columns={columns}
              rowData={filteredRowData}
              disabled={false}
            />
          </div>

          {/* Footer Summary */}
          {filteredRowData.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 border rounded-lg">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total customers: {filteredRowData.length}
                </div>
                <div className="text-sm font-semibold text-red">
                  {filteredRowData[0]?.service} - {filteredRowData[0]?.discount}
                  /Per Kg
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default CustomerDiscount;
