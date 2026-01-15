import React, { useContext, useEffect, useState } from "react";
import {
  DataCardWithTable,
  HoldReport,
  StatusCard,
} from "./SSDashboardComponents";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";

const SSDashboard = () => {
  const [holdRange, setHoldRange] = useState("today");
  const [rtfRange, setRtfRange] = useState("today");

  const [holdCount, setHoldCount] = useState(0);
  const [holdWeight, setHoldWeight] = useState(0);
  const { server } = useContext(GlobalContext);
  const { register, setValue } = useForm();
  const [customerRows, setCustomerRows] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [reasonRows, setReasonRows] = useState([]);
  const [rtfCount, setRtfCount] = useState(0);
  const [rtfWeight, setRtfWeight] = useState(0);
  const [user, setUser] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [allowedSectors, setAllowedSectors] = useState([]);

  const getStoredUser = () => {
    try {
      const lsUser = localStorage.getItem("user");
      if (lsUser) return JSON.parse(lsUser);

      const ssUser = sessionStorage.getItem("user");
      if (ssUser) return JSON.parse(ssUser);

      return null;
    } catch (err) {
      return null;
    }
  };

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadSectors = async () => {
      const res = await fetch(
        `${server}/dashboard/ss-dashboard/fetch-sector?userId=${user.userId}`
      );
      const data = await res.json();
      setAllowedSectors(data.sectors || []);
    };

    loadSectors();
  }, [user]);

  useEffect(() => {
    if (allowedSectors === null) return; // still loading user sectors

    const loadRTF = async () => {
      const res = await fetch(
        `${server}/dashboard/ss-dashboard/ready-to-fly?range=${rtfRange}&sectors=${allowedSectors.join(
          ","
        )}`
      );
      const data = await res.json();

      setRtfCount(data.totalReady || 0);
      setRtfWeight(data.totalWeight || 0);
    };

    loadRTF();
  }, [rtfRange, allowedSectors]);

  useEffect(() => {
    if (allowedSectors === null) return; // still loading user sectors

    const loadReason = async () => {
      const m = selectedMonth.month() + 1;
      const y = selectedMonth.year();

      const res = await fetch(
        `${server}/dashboard/ss-dashboard/reason-wise?month=${m}&year=${y}&sectors=${allowedSectors.join(
          ","
        )}`
      );
      const data = await res.json();

      setReasonRows(data);
    };

    loadReason();
  }, [selectedMonth, allowedSectors]);

  useEffect(() => {
    if (allowedSectors === null) return; // still loading user sectors

    const loadCustomerHold = async () => {
      const m = selectedMonth.month() + 1;
      const y = selectedMonth.year();

      const res = await fetch(
        `${server}/dashboard/ss-dashboard/customer-wise?month=${m}&year=${y}&sectors=${allowedSectors.join(
          ","
        )}`
      );
      const data = await res.json();

      setCustomerRows(data);
    };

    loadCustomerHold();
  }, [selectedMonth, allowedSectors]);

  useEffect(() => {
    if (allowedSectors === null) return; // still loading user sectors

    const fetchHold = async () => {
      const res = await fetch(
        `${server}/dashboard/ss-dashboard/shipments-on-hold?range=${holdRange}&sectors=${allowedSectors.join(
          ","
        )}`
      );
      const data = await res.json();

      setHoldCount(data.totalHold || 0);
      setHoldWeight(data.totalWeight || 0);
    };

    fetchHold();
  }, [holdRange, allowedSectors]);

  // useEffect(() => {
  //   if (allowedSectors.length === 0) return; // wait for sectors
  //   loadHoldData();
  //   loadRTFData();
  //   loadCustomerWise();
  //   loadReasonWise();
  // }, [allowedSectors]);

  const customerColumns = [
    { key: "customerName", label: "Customer Name" },
    { key: "awb", label: "AWB" },
    { key: "weight", label: "Weight (KG)" },
  ];

  const reasonColumns = [
    { key: "reason", label: "Reason" },
    { key: "awb", label: "AWB" },
    { key: "weight", label: "Weight (KG)" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full flex justify-end">
        <span className="bg-red text-white px-4 py-1 rounded text-sm tracking-wide">
          {allowedSectors.length > 0 ? allowedSectors.join(", ") : "All Sectors"}
        </span>
      </div>

      <div className="flex gap-3">
        <div className="w-1/2 flex gap-3">
          <div className="w-1/2">
            <StatusCard
              title="SHIPMENTS ON HOLD"
              greenCount={holdCount}
              greenUnit="On Hold"
              redCount={holdWeight}
              redUnit="Kg"
              range={holdRange}
              onDateChange={(val) => setHoldRange(val)}
            />
          </div>
          <div className="w-1/2">
            <StatusCard
              title="READY TO FLY"
              greenCount={rtfCount}
              greenUnit="Shipments"
              redCount={rtfWeight}
              redUnit="Kg"
              range={rtfRange}
              onDateChange={(val) => setRtfRange(val)}
            />
          </div>
        </div>
        <div className="w-1/2">
          <HoldReport />
        </div>
      </div>

      <div className="flex gap-3">
        <div className="w-1/2">
          {" "}
          <DataCardWithTable
            title="Customer Wise Hold"
            columns={customerColumns}
            rowData={customerRows}
            name="customerWiseHold"
            register={register}
            setValue={setValue}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
        <div className="w-1/2">
          {" "}
          <DataCardWithTable
            title="Reason With Hold"
            periodLabel="Mar–April, 2025"
            columns={reasonColumns}
            rowData={reasonRows}
            name="reasonWithHold"
            register={register}
            setValue={setValue}
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        </div>
      </div>
    </div>
  );
};

export default SSDashboard;
