"use client";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { OutlinedButtonRed, SimpleButton } from "../Buttons";
import { DeleteButton, EditButton } from "../AddUpdateDeleteButton";
import { DummyInputBoxWithLabelDarkGray } from "../DummyInputBox";
import { DateInputBox, SearchInputBox } from "../InputBox";
import { DropdownRedLabel, LabeledDropdown } from "../Dropdown";
import Table from "../Table";
import { GlobalContext } from "@/app/lib/GlobalContext";

const ViewRate = ({ register, setValue, reset, watch }) => {
  const [rateData, setRateData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedShipper, setSelectedShipper] = useState("");
  const { sectors, server } = useContext(GlobalContext);

  const selectedType = watch("type");
  const selectedNetwork = watch("network");

  const fetchRateData = async () => {
    try {
      const response = await fetch(`${server}/rate-sheet`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setRateData(data);
    } catch (err) {
      console.log("error", err);
    }
  };

  useEffect(() => {
    fetchRateData();
  }, []);

  const columns = useMemo(
    () => [
      { key: "shipper", label: "SHIPPER" },
      { key: "network", label: "NETWORK" },
      { key: "service", label: "SERVICE" },
      { key: "type", label: "TYPE" },
      { key: "minWeight", label: "MIN WEIGHT" },
      { key: "maxWeight", label: "MAX WEIGHT" },
      ...Array.from({ length: 35 }, (_, i) => ({
        key: `${i + 1}`,
        label: `Zone ${i + 1}`,
      })),
    ],
    []
  );

  // Get unique shipper names from rate data
  const uniqueShippers = useMemo(() => {
    if (!Array.isArray(rateData) || rateData.length === 0) return [];
    
    const unique = [...new Set(rateData.map(item => item.shipper))].filter(Boolean);
    return unique.sort();
  }, [rateData]);

  const filteredRateData = useMemo(() => {
    if (!Array.isArray(rateData)) return [];

    return rateData.filter(item => {
      // Filter by type
      const typeMatch = !selectedType ||
        (selectedType === "Bulk" && item.type === "B") ||
        (selectedType === "Slab" && item.type === "S");

      // Filter by network
      const networkMatch = !selectedNetwork || item.network === selectedNetwork;

      // Filter by shipper
      const shipperMatch = !selectedShipper || item.shipper === selectedShipper;

      // Filter by search query
      const searchMatch = !searchQuery ||
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );

      return typeMatch && networkMatch && shipperMatch && searchMatch;
    });
  }, [rateData, selectedType, selectedNetwork, selectedShipper, searchQuery]);

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <h2 className="text-[16px] text-red font-semibold">Rate Sheet</h2>
          <div className="font-semibold text-sm flex gap-1 items-center">
            <span className="text-eerie-black">Branch: </span>
            <span className="text-red bg-misty-rose py-0.5 px-2.5 rounded">
              New Delhi
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="flex justify-between gap-3">
          <div className="flex flex-col gap-3 w-full">
            <LabeledDropdown
              options={["Bulk", "Slab"]}
              register={register}
              setValue={setValue}
              value="type"
              title="Type"
            />
            <LabeledDropdown
              options={sectors.map((sector) => sector.name)}
              register={register}
              setValue={setValue}
              value="sector"
              title="Sector"
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="effectiveFrom"
              placeholder="Effective From"
            />
          </div>
          <div className="flex flex-col gap-3 w-full">
            <LabeledDropdown
              options={["MPL", "M5C"]}
              register={register}
              setValue={setValue}
              value="network"
              title="Network"
            />
            <DummyInputBoxWithLabelDarkGray
              reset={reset}
              label="Zone Tariff"
              register={register}
              setValue={setValue}
              value="zoneTariff"
            />
            <DateInputBox
              register={register}
              setValue={setValue}
              value="to"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-3">
          <EditButton perm="Accounts Edit" />
          <DeleteButton perm="Accounts Deletion" />
        </div>
        <div className="flex gap-3">
          <div className="w-36">
            <SimpleButton name="View" onClick={fetchRateData} />
          </div>
          <div className="w-36">
            <OutlinedButtonRed label="Close" />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-6">
          <DropdownRedLabel
            options={uniqueShippers}
            register={register}
            setValue={(name, value) => {
              setValue(name, value);
              setSelectedShipper(value);
            }}
            title="*RateSheet Name*"
            value="rateSheetName"
          />
          <SearchInputBox
            placeholder="Search Rate Sheet"
            onChange={(e) => setSearchQuery(e.target.value)}
            value={searchQuery}
          />
        </div>

        {/* Table */}
        <Table
          columns={columns}
          rowData={filteredRateData}
          register={register}
          setValue={setValue}
          name="zones"
        />
      </div>
    </div>
  );
};

export default ViewRate;