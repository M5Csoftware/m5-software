import React, { useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LabeledDropdown } from "../Dropdown";
import InputBox from "../InputBox";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import RedCheckbox from "../RedCheckBox";
import { TableWithCTD } from "../Table";
import { GlobalContext } from "@/app/lib/GlobalContext";

const ServiceSetting = ({
  register,
  setValue,
  setStep,
  getValues,
  customerData,
  resetFactor
}) => {
  const { sectors, server } = useContext(GlobalContext);

  const [rowData, setRowData] = useState([]);
  const [volRowData, setVolRowData] = useState([]);
  const [volDiscount, setVolDescount] = useState(false);
  const [all, setAll] = useState(false);
  const [uniqueServices, setUniqueServices] = useState([]);

  const columns = useMemo(
    () => [
      { key: "sector", label: "Sector" },
      { key: "service", label: "Service" },
    ],
    []
  );

  const volDiscountColumns = useMemo(
    () => [
      { key: "volDiscountSector", label: "Sector" },
      { key: "volDiscountService", label: "Service" },
      { key: "volDiscountWeight", label: "Weight" },
      { key: "volDiscount", label: "Discount" },
    ],
    []
  );

  // Fetch Service Names from Rate Sheets
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${server}/rate-sheet`);
        const services = [...new Set(response.data.map((s) => s.service).filter(Boolean))];
        setUniqueServices(services);
      } catch (error) {
        console.error("Error fetching rate sheets:", error);
      }
    };

    fetchServices();
  }, [server]);


  useEffect(() => {
    if (all && sectors.length && uniqueServices.length) {
      const combinations = [];

      sectors.forEach(sector => {
        uniqueServices.forEach(service => {
          combinations.push({
            sector: sector.name,
            service: service,
          });
        });
      });

      setRowData(combinations);
    }

    if (!all) {
      setRowData([]); // If user unchecks "All", clear list.
    }
  }, [all, sectors, uniqueServices]);


  const handleAdd = () => {
    const newRow = {
      sector: getValues("serviceSettingsSector"),
      service: getValues("serviceSettingsService"),
    };
    setRowData((prevRowData) => [...prevRowData, newRow]);
  };

  const handleVolDiscAdd = () => {
    const newRow = {
      volDiscountSector: getValues("volDiscountSector"),
      volDiscountService: getValues("volDiscountService"),
      volDiscountWeight: getValues("volDiscountWeight"),
      volDiscount: getValues("volDiscount"),
    };
    setVolRowData((prev) => [...prev, newRow]);
  };

  const handleDeleteServiceSetting = (index) => {
    setRowData(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteVolDisc = (index) => {
    setVolRowData(prev => prev.filter((_, i) => i !== index));
  };


  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-5 h-[55vh]">
        {/* Service Settings */}
        <div className="flex flex-col gap-3 w-full">
          <div className=" flex justify-between">
            <h2 className="text-red font-semibold text-[16px]">Service Settings</h2>
            <RedCheckbox
              isChecked={all}
              setChecked={setAll}
              id="allServiceSettings"
              register={register}
              setValue={setValue}
              label={`All`}
            />
          </div>

          <div className="flex flex-col gap-3">
            <LabeledDropdown
              options={sectors.map((sector) => sector.name)}
              title="Sector"
              register={register}
              setValue={setValue}
              value="serviceSettingsSector"
              defaultValue={customerData?.serviceSettingsSector || ""}
            />

            <LabeledDropdown
              options={uniqueServices}
              title="Service"
              register={register}
              setValue={setValue}
              value="serviceSettingsService"
              defaultValue={customerData?.serviceSettingsService || ""}
            />

            <div className="w-full flex flex-row-reverse">
              <div>
                <SimpleButton onClick={handleAdd} name={`Add`} />
              </div>
            </div>
          </div>

          <TableWithCTD
            columns={columns}
            rowData={rowData}
            register={register}
            setValue={setValue}
            name={"serviceSetting"}
            handleDelete={handleDeleteServiceSetting}
          />

        </div>

        {/* Vol Discount */}
        <div className="flex flex-col gap-3 w-full">
          <div className=" flex justify-between">
            <h2 className="text-red font-semibold text-[16px]">Vol Discount</h2>
            <RedCheckbox
              isChecked={customerData?.enableVolDiscount || volDiscount}
              setChecked={setVolDescount}
              id="enableVolDiscount"
              register={register}
              setValue={setValue}
              label={`Enable Vol. Discount`}
            />
          </div>

          <LabeledDropdown
            options={sectors.map((sector) => sector.name)}
            register={register}
            setValue={setValue}
            value="volDiscountSector"
            title="Sector"
            defaultValue={customerData?.volDiscountSector || ""}
          />

          <LabeledDropdown
            options={uniqueServices}
            register={register}
            setValue={setValue}
            value="volDiscountService"
            title="Service"
            defaultValue={customerData?.volDiscountService || ""}
          />

          <div className="flex gap-3 w-full items-center text-red">
            <InputBox placeholder="Weight" register={register} setValue={setValue} value="volDiscountWeight" />
            <InputBox placeholder="Vol Discount" register={register} setValue={setValue} value="volDiscount" />
            <SimpleButton onClick={handleVolDiscAdd} name={`Add`} />
          </div>

          <TableWithCTD
            columns={volDiscountColumns}
            rowData={volRowData}
            register={register}
            setValue={setValue}
            name={"volDisc"}
            handleDelete={handleDeleteVolDisc}
          />

        </div>
      </div>

      <div className="flex justify-between">
        <div>
          <OutlinedButtonRed label={"Back"} onClick={() => setStep((prevStep) => prevStep - 1)} />
        </div>
        <div>
          <SimpleButton onClick={() => setStep((prevStep) => prevStep + 1)} name={"Next"} />
        </div>
      </div>
    </div>
  );
};

export default ServiceSetting;
