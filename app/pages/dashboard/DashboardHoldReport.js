import { Dropdown } from "@/app/components/Dropdown";
import { MonthInput } from "@/app/components/MonthInput";
import { RadioButtonLarge } from "@/app/components/RadioButton";
import { TableWithTotal } from "@/app/components/Table";
import { GlobalContext } from "@/app/lib/GlobalContext";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const DashboardHoldReport = () => {
  const [selectedValue, setSelectedValue] = useState("cred");
  const { server } = useContext(GlobalContext);
  const [hubs, setHubs] = useState([]);
  const { register, setValue, watch } = useForm();
  const month = watch("from");
  const hub = watch("hub");

  useEffect(() => {
    const fetchHubs = async () => {
      try {
        const response = await axios.get(`${server}/entity-manager`, {
          params: { entityType: "Hub" },
        });

        // console.log("Fetched hubs:", response.data);

        setHubs(response.status === 200 ? response.data : []);
      } catch (error) {
        console.error("Error fetching hubs:", error);
        setHubs([]);
      }
    };

    fetchHubs();
  }, [server]);
  return (
    <>
      <div className="rounded-md border-[1px] p-6 h-full bg-seasalt border-french-gray">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800 text-lg">Outstanding</h2>
          <div className="flex flex-row gap-2">
            <div className="w-[175px]">
              <MonthInput
                register={register}
                setValue={setValue}
                value="from"
                placeholder="Select Month"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 my-4">
          <RadioButtonLarge
            id="cred"
            name="cred"
            label="Cred Limit"
            register={register}
            setValue={setValue}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
          />
          <RadioButtonLarge
            id="other"
            name="other"
            label="Other Reason"
            register={register}
            setValue={setValue}
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
          />
        </div>

        {/* Conditional Tables */}
        <div className="overflow-y-auto table-scrollbar">
          {selectedValue === "cred" ? (
            <CredLimitTable
              register={register}
              setValue={setValue}
              month={month}
              hub={hub}
            />
          ) : (
            <OtherReasonTable
              register={register}
              setValue={setValue}
              month={month}
              hub={hub}
            />
          )}
        </div>
      </div>
    </>
  );
};

function CredLimitTable({ register, setValue, month, hub }) {
  const { server } = useContext(GlobalContext);
  const [rows, setRows] = useState([]);

  const columns = [
    { key: "customer", label: "Customers" },
    { key: "shipmentOnHold", label: "Shipments On Hold" },
    { key: "outstanding", label: "Outstanding" },
  ];

  useEffect(() => {
    if (!month) return;

    const load = async () => {
      try {
        const res = await axios.get(
          `${server}/dashboard/sales-dashboard/cred-limit-hold`,
          {
            params: {
              month,
              hub,
              type: "cred",
            },
          }
        );

        setRows(res.data);
      } catch (err) {
        console.log("Error fetching:", err);
        setRows([]);
      }
    };

    load();
  }, [month, hub, server]);

  const totalRow = {
    customer: "Total",
    shipmentOnHold: rows.reduce((sum, r) => sum + (r.shipmentOnHold || 0), 0),
    outstanding: rows
      .reduce((sum, r) => sum + (r.outstanding || 0), 0)
      .toLocaleString(),
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="sales"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

function OtherReasonTable({ register, setValue, month, hub }) {
  const { server } = useContext(GlobalContext);
  const [rows, setRows] = useState([]);

  const columns = [
    { key: "customer", label: "Customers" },
    { key: "reason", label: "Hold Reason" },
    { key: "shipmentsOnHold", label: "Shipments On Hold" },
    { key: "outstanding", label: "Outstanding" },
  ];

  useEffect(() => {
    if (!month) return;

    const load = async () => {
      try {
        const res = await axios.get(
          `${server}/dashboard/sales-dashboard/other-reason-hold`,
          {
            params: { month, hub },
          }
        );

        setRows(res.data);
      } catch (err) {
        console.log("Error fetching:", err);
        setRows([]);
      }
    };

    load();
  }, [month, hub, server]);

  const totalRow = {
    reason: "Total",
    outstanding: rows.reduce((sum, r) => sum + (r.outstanding || 0), 0),
    shipmentsOnHold: rows.reduce((sum, r) => sum + (r.shipmentsOnHold || 0), 0),

    // outstanding: "-",
  };

  return (
    <TableWithTotal
      register={register}
      setValue={setValue}
      name="agent"
      rowData={rows}
      columns={columns}
      totalRow={totalRow}
    />
  );
}

export default DashboardHoldReport;
