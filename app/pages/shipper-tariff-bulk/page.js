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

const ShipperTariff = () => {
  const { register, setValue, reset, watch, getValues, handleSubmit } =
    useForm();

  const [serviceOptions, setServiceOptions] = useState([]);
  const [zoneMatrixOptions, setzoneMatrixOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { sectors, server } = useContext(GlobalContext);
  const [responseMsg, setResponseMsg] = useState("");
  const [visibleFlag, setVisibleFlag] = useState(false);
  const [rowData, setRowData] = useState([]);

  const [notification, setNotification] = useState({
    type: "success",
    message: "",
    visible: false,
  });

  const showNotification = (type, message) => {
    setNotification({ type, message, visible: true });
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

  useEffect(() => {
    if (selectedSector) {
      fetchZonesData(selectedSector);
    }
  }, [selectedSector]);

  // Add to table only
  const handleApplicableRates = () => {
    const requiredFields = [
      "sector",
      "client",
      "network",
      "service",
      "zoneMatrix",
      "rateTariff",
      "mode",
      "from",
      "to",
    ];

    // run validation
    const formValid = requiredFields.every((field) => {
      const v = getValues(field);
      return v && v.toString().trim() !== "";
    });

    if (!formValid) {
      alert("Fill all fields before adding to table");
      showNotification("error", "Fill all fields before adding to table");
      return;
    }

    const formData = getValues();

    const newRow = {
      id: Date.now(),
      customer: formData.client,
      network: formData.network,
      service: formData.service,
      zoneMatrix: formData.zoneMatrix,
      rateTariff: formData.rateTariff,
      country: formData.sector,
      mode: formData.mode,
      fromDate: formData.from,
      toDate: formData.to,
    };

    setRowData((prev) => [...prev, newRow]);
  };

  // Save to database
  const onSubmit = async (data) => {
    setLoading(true);
    const formData = getValues();

    const payload = {
      customer: formData.client || "",
      network: formData.network || "",
      service: formData.service || "",
      zoneMatrix: formData.zoneMatrix || "",
      rateTariff: formData.rateTariff || "",
      country: formData.sector || "",
      mode: formData.mode || "",
      fromDate: formData.from || "",
      toDate: formData.to || "",
    };

    try {
      const response = await axios.post(`${server}/shipper-tariff`, payload);
      console.log("Saved to database:", response.data);

      // Reset form and clear data
      reset();
      setServiceOptions([]);
      setzoneMatrixOptions([]);

      console.log("Data saved successfully!");
      showNotification("success", "Data saved successfully!");
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

  // Process pasted or typed string into codes
  const [reportType, setReportType] = useState("Rate Update");
  const networkOptions = ["MPL", "M5C"];
  const modeOptions = ["Normal Rate", "Express Rate", "Priority Rate"];

  const handleReportTypeChange = (value) => {
    setReportType(value);
  };

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

  const handleRefresh = () => {
    reset(); // clear form values
    setRowData([]); // clear table
    setServiceOptions([]);
    setzoneMatrixOptions([]);
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
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
        onRefresh={handleRefresh}
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
        <div className="flex-1 max-w-[350px] min-w-[260px]">
          <ShipperTable />
        </div>

        {["Rate Update", "Service Update"].includes(reportType) && (
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col gap-3">
              <h2 className="text-[16px] text-red font-semibold">
                Shipper Details
              </h2>

              <div className="flex gap-[20px]">
                {reportType === "Rate Update" ? (
                  // <InputBox
                  //   placeholder="Type"
                  //   register={register}
                  //   setValue={setValue}
                  //   value="type"
                  // />
                  <LabeledDropdown
                    title={`Network`}
                    register={register}
                    setValue={setValue}
                    value="network"
                    options={["M5C", "MPL"]}
                  />
                ) : (
                  <DummyInputBoxWithLabelDarkGray
                    label="Network"
                    register={register}
                    setValue={setValue}
                    value="dummyType"
                  />
                )}

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

              <div className="flex gap-[20px]">
                {reportType === "Rate Update" ? (
                  <LabeledDropdown
                    options={zoneMatrixOptions}
                    register={register}
                    setValue={setValue}
                    value="zoneMatrix"
                    title="Zone Matrix"
                  />
                ) : (
                  <DummyInputBoxWithLabelDarkGray
                    label="Zone Matrix"
                    register={register}
                    setValue={setValue}
                    value="dummyZoneMatrix"
                  />
                )}

                <InputBox
                  placeholder="Country"
                  register={register}
                  setValue={setValue}
                  value="country"
                />

                {reportType === "Rate Update" ? (
                  <InputBox
                    placeholder="Rate Tariff"
                    register={register}
                    setValue={setValue}
                    value="rateTariff"
                  />
                ) : (
                  <DummyInputBoxWithLabelDarkGray
                    label="Zone Tariff"
                    register={register}
                    setValue={setValue}
                    value="dummyZoneTariff"
                  />
                )}
              </div>

              <div className="flex gap-4">
                {reportType === "Rate Update" ? (
                  <InputBox
                    placeholder="Rate Type"
                    register={register}
                    setValue={setValue}
                    value="rateType"
                  />
                ) : (
                  <DummyInputBoxWithLabelDarkGray
                    label="Rate Type"
                    register={register}
                    setValue={setValue}
                    value="dummyRateType"
                  />
                )}

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
                <div>{/* <OutlinedButtonRed label="Close" /> */}</div>

                <div className="w-[259px]">
                  <SimpleButton
                    name={
                      reportType === "Rate Update"
                        ? "Applicable Rates"
                        : "Applicable Service"
                    }
                    type="button"
                    onClick={handleApplicableRates}
                  />
                </div>
                <div>
                  <SimpleButton
                    name={loading ? "Loading..." : "Save"}
                    type="submit"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <SearchInputBox
              placeholder={
                reportType === "Rate Update"
                  ? "Search Tariff"
                  : "Search Service"
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              <Table
                columns={columns}
                rowData={rowData}
                register={register}
                setValue={setValue}
                name="shippertariff"
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default ShipperTariff;
