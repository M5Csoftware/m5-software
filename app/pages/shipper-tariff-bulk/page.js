"use client";
import { DeleteButton } from "@/app/components/AddUpdateDeleteButton";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { LabeledDropdown } from "@/app/components/Dropdown";
import Heading from "@/app/components/Heading";
import InputBox, {
  DateInputBox,
  SearchInputBox,
} from "@/app/components/InputBox";
import Table from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import React, {
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useForm } from "react-hook-form";
import ShipperTable from "./ShipperTable";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import NotificationFlag from "@/app/components/Notificationflag";

const ShipperTariffBulk = () => {
  const { register, setValue, reset, watch, getValues, handleSubmit } =
    useForm();

  const [serviceOptions, setServiceOptions] = useState([]);
  const [zoneMatrixOptions, setZoneMatrixOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { sectors, server } = useContext(GlobalContext);
  const [rowData, setRowData] = useState([]);
  const [selectedAccountCodes, setSelectedAccountCodes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // Added refresh key
  const [formKey, setFormKey] = useState(0); // Added form key

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

  const [reportType, setReportType] = useState("Rate Update");
  const modeOptions = ["Normal Rate", "Zip Code Wise"];

  const selectedSector = watch("sector");
  const selectedClient = watch("client");

  // Receive selected account codes from ShipperTable
  const handleAccountCodesSelected = useCallback((codes) => {
    const validCodes = codes.filter(code => code.isValid).map(code => code.code);
    setSelectedAccountCodes(validCodes);
  }, []);

  // Fetch services and zone matrix based on sector
  const fetchServicesAndZones = async (sector) => {
    if (!sector) {
      setServiceOptions([]);
      setZoneMatrixOptions([]);
      return;
    }

    try {
      const response = await axios.get(
        `${server}/shipper-tariff/get-zones?sector=${encodeURIComponent(sector)}`
      );
      
      const services = response.data?.services || [];
      const zoneMatrices = response.data?.zoneMatrix || [];
      
      setServiceOptions(services);
      setZoneMatrixOptions(zoneMatrices);
    } catch (error) {
      console.error("Error fetching zones data:", error);
      setServiceOptions([]);
      setZoneMatrixOptions([]);
      showNotification("error", "Failed to load services and zones");
    }
  };

  useEffect(() => {
    if (selectedSector) {
      fetchServicesAndZones(selectedSector);
    }
  }, [selectedSector]);

  // Handle report type change
  const handleReportTypeChange = (value) => {
    setReportType(value);
    // Reset form when switching between Rate Update and Service Update
    reset({
      sector: getValues("sector"),
      client: getValues("client"),
    });
    setRowData([]);
  };

  // Add to table only - for Rate Update
  const handleApplicableRates = () => {
    if (selectedAccountCodes.length === 0) {
      showNotification("error", "Please select valid account codes first");
      return;
    }

    const requiredFields = [
      "sector",
      "network",
      "service",
      "zoneMatrix",
      "rateTariff",
      "mode",
      "from",
      "to",
    ];

    // Validate all required fields
    const missingFields = requiredFields.filter(field => {
      const value = getValues(field);
      return !value || value.toString().trim() === "";
    });

    if (missingFields.length > 0) {
      showNotification("error", `Please fill all required fields: ${missingFields.join(", ")}`);
      return;
    }

    const formData = getValues();
    const fromDate = normalizeDate(formData.from);
    const toDate = normalizeDate(formData.to);

    if (!fromDate || !toDate) {
      showNotification("error", "Invalid date format");
      return;
    }

    // Create rows for all selected account codes
    const newRows = selectedAccountCodes.map(accountCode => ({
      id: Date.now() + Math.random(),
      customer: `${accountCode}`, // You might want to get customer name from account code
      network: formData.network,
      service: formData.service,
      zoneMatrix: formData.zoneMatrix,
      rateTariff: formData.rateTariff,
      country: formData.sector,
      mode: formData.mode,
      fromDate: fromDate,
      toDate: toDate,
    }));

    setRowData(prev => [...prev, ...newRows]);
    showNotification("success", `Added ${newRows.length} rates to table`);
  };

  // Add to table only - for Service Update
  const handleApplicableService = () => {
    if (selectedAccountCodes.length === 0) {
      showNotification("error", "Please select valid account codes first");
      return;
    }

    const requiredFields = [
      "sector",
      "network",
      "service",
    ];

    // Validate all required fields
    const missingFields = requiredFields.filter(field => {
      const value = getValues(field);
      return !value || value.toString().trim() === "";
    });

    if (missingFields.length > 0) {
      showNotification("error", `Please fill all required fields: ${missingFields.join(", ")}`);
      return;
    }

    const formData = getValues();

    // Create service rows for all selected account codes
    const newRows = selectedAccountCodes.map(accountCode => ({
      id: Date.now() + Math.random(),
      customer: `${accountCode}`,
      network: formData.network,
      service: formData.service,
      country: formData.sector,
      serviceType: "Applicable Service", // Mark as service update
    }));

    setRowData(prev => [...prev, ...newRows]);
    showNotification("success", `Added ${newRows.length} services to table`);
  };

  // Normalize date format
  const normalizeDate = (val) => {
    if (!val) return "";

    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
      const [d, m, y] = val.split("/");
      return `${y}-${m}-${d}`;
    }

    return "";
  };

  // Save to database
  const onSubmit = async (data) => {
    if (rowData.length === 0) {
      showNotification("error", "No data to save. Please add data to table first.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${server}/shipper-tariff/bulk`, {
        type: reportType,
        data: rowData
      });

      console.log("Bulk data saved to database:", response.data);
      
      // Reset form and clear data
      reset();
      setRowData([]);
      setServiceOptions([]);
      setZoneMatrixOptions([]);
      
      showNotification("success", `Successfully saved ${rowData.length} ${reportType === "Rate Update" ? "rates" : "services"}`);
    } catch (error) {
      console.error("Error saving bulk data:", error);
      const errorMessage = error.response?.data?.error || "Error saving data. Please try again.";
      showNotification("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Filter table data based on search
  const filteredRowData = useMemo(() => {
    if (!searchTerm.trim()) return rowData;
    
    const searchLower = searchTerm.toLowerCase();
    return rowData.filter((row) =>
      Object.values(row).some((value) =>
        value && value.toString().toLowerCase().includes(searchLower)
      )
    );
  }, [rowData, searchTerm, refreshKey]); // Added refreshKey dependency

  // Define columns based on report type
  const columns = useMemo(() => {
    if (reportType === "Rate Update") {
      return [
        { key: "customer", label: "Customer" },
        { key: "network", label: "Network" },
        { key: "service", label: "Service" },
        { key: "zoneMatrix", label: "Zone Tariff" },
        { key: "rateTariff", label: "Rate Tariff" },
        { key: "country", label: "Country" },
        { key: "mode", label: "Mode" },
        { key: "fromDate", label: "From Date" },
        { key: "toDate", label: "To Date" },
      ];
    } else {
      return [
        { key: "customer", label: "Customer" },
        { key: "network", label: "Network" },
        { key: "service", label: "Service" },
        { key: "country", label: "Country" },
        { key: "serviceType", label: "Type" },
      ];
    }
  }, [reportType]);

  // Enhanced refresh function like in General component
  const handleRefresh = () => {
    // Clear all data states
    setRowData([]);
    setSelectedAccountCodes([]);
    setServiceOptions([]);
    setZoneMatrixOptions([]);
    setSearchTerm("");
    setLoading(false);
    
    // Increment keys to force re-renders
    setFormKey(prev => prev + 1);
    setRefreshKey(prev => prev + 1);
    
    // Reset form with default values
    reset({
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
    
    // Set default report type
    setReportType("Rate Update");
    
    // Show success notification
    showNotification("success", "Page refreshed successfully");
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)} key={formKey}>
      <NotificationFlag
        type={notification.type}
        message={notification.message}
        visible={notification.visible}
        setVisible={(v) => setNotification({ ...notification, visible: v })}
      />
      
      <Heading
        title="Shipper Tariff Bulk"
        bulkUploadBtn="hidden"
        codeListBtn="hidden"
        onRefresh={handleRefresh} // Pass refresh handler
      />

      <div className="flex w-full gap-3">
        {["Rate Update", "Service Update"].map((type) => (
          <RadioButtonLarge
            key={type}
            id={type}
            label={type}
            name="reportType"
            register={register}
            setValue={setValue}
            selectedValue={reportType}
            setSelectedValue={handleReportTypeChange}
          />
        ))}
      </div>

      <div className="flex gap-6 h-full">
        {/* Left side: Shipper Table */}
        <div className="flex-1 max-w-[350px] min-w-[260px]">
          <ShipperTable 
            key={refreshKey} // Add refreshKey to force re-render
            onAccountCodesSelected={handleAccountCodesSelected} 
          />
        </div>

        {/* Right side: Form and Table */}
        <div className="flex flex-col gap-6 w-full">
          <div className="flex flex-col gap-3">
            <h2 className="text-[16px] text-red font-semibold">
              {reportType === "Rate Update" ? "Rate Details" : "Service Details"}
            </h2>

            <div className="flex gap-[20px]">
              <LabeledDropdown
                title="Network"
                register={register}
                setValue={setValue}
                value="network"
                options={["M5C", "MPL"]}
              />

              <LabeledDropdown
                options={sectors.map((sector) => sector.name)}
                register={register}
                setValue={setValue}
                value="sector"
                title="Sector"
                reset={reset}
              />

              <LabeledDropdown
                options={serviceOptions}
                register={register}
                setValue={setValue}
                value="service"
                title="Service"
              />
            </div>

            {reportType === "Rate Update" ? (
              <>
                <div className="flex gap-[20px]">
                  <LabeledDropdown
                    options={zoneMatrixOptions}
                    register={register}
                    setValue={setValue}
                    value="zoneMatrix"
                    title="Zone Matrix"
                  />

                  <InputBox
                    placeholder="Rate Tariff"
                    register={register}
                    setValue={setValue}
                    value="rateTariff"
                  />

                  <LabeledDropdown
                    options={modeOptions}
                    register={register}
                    setValue={setValue}
                    value="mode"
                    title="Mode"
                  />
                </div>

                <div className="flex gap-4">
                  <DateInputBox
                    register={register}
                    setValue={setValue}
                    value="from"
                    placeholder="From Date"
                  />
                  
                  <DateInputBox
                    register={register}
                    setValue={setValue}
                    value="to"
                    placeholder="To Date"
                  />
                </div>
              </>
            ) : (
              <div className="text-gray-500 text-sm">
                Service Update: Only Network, Sector, and Service are required
              </div>
            )}
          </div>

          <div className="flex w-full justify-between items-center">
            <div className="text-sm">
              {selectedAccountCodes.length > 0 ? (
                <span className="text-green-600">
                  {selectedAccountCodes.length} account code(s) selected
                </span>
              ) : (
                <span className="text-red">No account codes selected</span>
              )}
            </div>
            
            <div className="flex gap-2">
              <div className="w-[259px]">
                <SimpleButton
                  name={
                    reportType === "Rate Update"
                      ? "Applicable Rates"
                      : "Applicable Service"
                  }
                  type="button"
                  onClick={reportType === "Rate Update" ? handleApplicableRates : handleApplicableService}
                />
              </div>
              
              <div>
                <SimpleButton
                  name={loading ? "Saving..." : "Save All"}
                  type="submit"
                  disabled={loading || rowData.length === 0}
                />
              </div>
            </div>
          </div>

          <SearchInputBox
            placeholder={
              reportType === "Rate Update"
                ? "Search Tariff..."
                : "Search Service..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="border rounded-lg overflow-hidden">
            <Table
              key={`table-${refreshKey}`} // Add refreshKey to force table re-render
              columns={columns}
              rowData={filteredRowData}
              register={register}
              setValue={setValue}
              name="shippertariffbulk"
              height="h-72"
            />
          </div>

          {rowData.length > 0 && (
            <div className="text-sm text-gray-600">
              Total rows in table: {rowData.length}
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default ShipperTariffBulk;