import React, { useContext, useState, useEffect } from "react";
import dayjs from "dayjs";
import MonthYearPicker, {
  DataCardWithTable,
  StatusCard,
} from "./SSDashboardComponents";
import YearRangePicker, {
  CounterPartChart,
  DataCardWithTableTotal,
  SummaryCardWithSeeAll,
} from "./CPDashboardComponents";
import { ArrowUp } from "lucide-react";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useAuth } from "@/app/Context/AuthContext";

export default function CounterPartDashboard() {
  const [location, setLocation] = useState("New Delhi");
  const defaultChartData = [
    { name: "Jan", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Feb", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Mar", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Apr", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "May", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Jun", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Jul", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Aug", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Sep", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Oct", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Nov", delhi: 0, mumbai: 0, Ahmedabad: 0 },
    { name: "Dec", delhi: 0, mumbai: 0, Ahmedabad: 0 },
  ];

  const [incomingStats, setIncomingStats] = useState({
    remaining: 0,
    resolved: 0,
  });
  const [chartData, setChartData] = useState(defaultChartData);

  const [counterPartInfo, setCounterPartInfo] = useState({
    name: "",
    code: "",
  });

  const [rows, setRows] = useState([]);
  const [data, setData] = useState([]);
  const [runSummaryMonth, setRunSummaryMonth] = useState(dayjs());
  const [rtoSummaryMonth, setRtoSummaryMonth] = useState(dayjs());
  const [incomingDateRange, setIncomingDateRange] = useState("today");
  const [chartYear, setChartYear] = useState(dayjs().year());

  const { server } = useContext(GlobalContext);
  const { user } = useAuth();

  const fetchCounterPartInfo = async () => {
    if (user?.userId) {
      try {
        const response = await fetch(
          `${server}/employee-master?userId=${user.userId}`
        );
        const data = await response.json();
        if (data && data.counterpart) {
          setCounterPartInfo({
            name: data.counterpart,
            code: data.counterpartCode || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch counterpart info:", error);
      }
    }
  };

  const fetchIncomingStats = async () => {
    try {
      let url = `${server}/dashboard/counterpart/stats?location=${location}&range=${incomingDateRange}&year=${chartYear}`;
      if (counterPartInfo.name) {
        url += `&counterpart=${counterPartInfo.name}`;
      }
      const response = await fetch(url);
      const result = await response.json();
      if (result?.success && result?.stats) {
        setIncomingStats(result.stats.incoming || { remaining: 0, resolved: 0 });
        if (result.stats.monthlyStats && result.stats.monthlyStats.length > 0) {
          setChartData(result.stats.monthlyStats);
        } else {
          setChartData(defaultChartData);
        }
      }
    } catch (error) {
      console.error("Failed to fetch incoming stats:", error);
    }
  };

  const fetchRunSummary = async () => {
    if (!counterPartInfo.name) return;
    try {
      const from = runSummaryMonth.startOf("month").format("YYYY-MM-DD");
      const to = runSummaryMonth.endOf("month").format("YYYY-MM-DD");
      const response = await fetch(
        `${server}/run-summary?counterpart=${counterPartInfo.name}&fromDate=${from}&toDate=${to}&limit=10`
      );
      const result = await response.json();
      if (result.success) {
        const mappedRows = result.data.map((item) => ({
          runNo: item.runNo,
          arrivalDate: item.flightDate,
          departureDate: "-",
          bagsCount: item.countBag,
          awbCount: item.countAwb,
          pcsCount: item.pcsCount,
          totalWt: `${item.totalActualWt} kg`,
        }));
        setRows(mappedRows);
      }
    } catch (error) {
      console.error("Failed to fetch run summary:", error);
    }
  };

  const fetchRTOSummary = async () => {
    if (!counterPartInfo.name) return;
    try {
      const from = rtoSummaryMonth.startOf("month").format("YYYY-MM-DD");
      const to = rtoSummaryMonth.endOf("month").format("YYYY-MM-DD");
      const response = await fetch(
        `${server}/rto-shipment-report?counterpart=${counterPartInfo.name}&from=${from}&to=${to}&limit=5`
      );
      const result = await response.json();
      if (result.success) {
        const mappedRto = result.data.map((item) => ({
          id: item.awbNo,
          date: item.date,
          status: item.shipmentRemark || "RTO",
          carrier: item.origin,
        }));
        setData(mappedRto);
      }
    } catch (error) {
      console.error("Failed to fetch RTO summary:", error);
    }
  };

  useEffect(() => {
    fetchCounterPartInfo();
  }, [user]);

  useEffect(() => {
    fetchIncomingStats();
  }, [location, incomingDateRange, counterPartInfo, chartYear]);

  useEffect(() => {
    fetchRunSummary();
  }, [runSummaryMonth, counterPartInfo]);

  useEffect(() => {
    fetchRTOSummary();
  }, [rtoSummaryMonth, counterPartInfo]);

  const locationOptions = ["New Delhi", "Mumbai", "Ahmedabad"];
  const { setActiveTabs, setCurrentTab } = useContext(GlobalContext);

  const columns = [
    { key: "runNo", label: "Run No" },
    { key: "arrivalDate", label: "Arrival Date" },
    { key: "departureDate", label: "Departure Date" },
    { key: "bagsCount", label: "No. of Bags" },
    { key: "awbCount", label: "No. of AWBs" },
    { key: "pcsCount", label: "Pcs" },
    { key: "totalWt", label: "Total Weight" },
  ];

  const totalRow = {
    runNo: "Total",
    arrivalDate: "",
    departureDate: "",
    bagsCount: rows.reduce((acc, curr) => acc + (curr.bagsCount || 0), 0),
    awbCount: rows.reduce((acc, curr) => acc + (curr.awbCount || 0), 0),
    pcsCount: rows.reduce((acc, curr) => acc + (curr.pcsCount || 0), 0),
    totalWt: `${rows
      .reduce((acc, curr) => acc + parseFloat(curr.totalWt || 0), 0)
      .toFixed(2)} kg`,
  };

  const thisYearTotal = (chartData || []).reduce(
    (acc, curr) => acc + (curr?.delhi || 0) + (curr?.mumbai || 0) + (curr?.Ahmedabad || 0),
    0
  );
  const monthlyAverage = Math.round(thisYearTotal / 12);

  return (
    <div className="flex flex-col gap-3">
      {/* Header section with Counterpart dynamic info */}
      <div className="flex">
        <div className="flex items-center gap-3 text-sm w-[50%]">
          <h2 className="font-semibold">CounterPart :</h2>
          <span className="tracking-wider text-xs bg-blue-100 shadow-sm text-blue-500 px-2 py-1 rounded">
            {counterPartInfo.name || "No Counterpart found"}
            {counterPartInfo.code && ` (${counterPartInfo.code})`}
          </span>
        </div>
        <div className="w-full flex justify-end">
          <span
            className="bg-red text-white px-4 py-1 rounded mb-2 text-sm cursor-pointer"
            onClick={() => {
              setActiveTabs((prev) => [
                ...prev,
                { folder: "Operations", subfolder: "CounterPartInscan" },
              ]);
              setCurrentTab("CounterPartInscan");
            }}
          >
            Inscan Run
          </span>
        </div>
      </div>

      {/* Upper Status Cards */}
      <div className="flex w-full gap-3 items-center">
        <div className="w-2/3 flex gap-3">
          <div className="w-1/2">
            <StatusCard
              title="INCOMING SHIPMENTS"
              greenCount={incomingStats.remaining}
              redCount={incomingStats.resolved}
              greenText="Incoming"
              redText="Delivered"
              range={incomingDateRange}
              onDateChange={setIncomingDateRange}
            />
          </div>

          <div className="w-1/2">
            <StatusCard
              title="SHIPMENTS (WAREHOUSE)"
              greenCount={30}
              redCount={45}
              greenText="Hold"
              redText="Re-Forward"
              redColor="text-gray-600"
              grayCount={10}
              grayText="RTO"
              enableGrayText
            />
          </div>
        </div>
        <div className="w-1/3">
          <StatusCard
            title="RUN HANDOVER - FORWARDER"
            greenCount={25}
            redCount={15}
            greenText="Remaining"
            redText="Forwarded"
          />
        </div>
      </div>

      {/* Chart and Summary */}
      <div className="flex justify-between gap-3">
        <div className="w-2/3 shadow rounded-lg flex flex-col gap-3 border">
          <div className="p-6 pb-0 flex justify-between">
            <h2 className="text-lg font-semibold">
              Shipment Received from Hub
            </h2>
            <YearRangePicker
              selectedYear={chartYear}
              onChange={setChartYear}
            />
          </div>
          <div className="flex justify-between p-6">
            <div className="flex gap-10">
              {/* left */}
              <div className="flex flex-col">
                <h2 className="tracking-wide text-[#71717A]">
                  Monthly Average
                </h2>
                <span className="text-xl">{monthlyAverage.toLocaleString()}</span>
                <span className="text-xs text-[#14A166] flex items-center gap-1">
                  <ArrowUp
                    size={16}
                    className="bg-[#C4E7d8] rounded-full p-[2px]"
                  />
                  12.66%
                </span>
              </div>
              {/* Right */}
              <div className="flex flex-col">
                <h2 className="tracking-wide text-[#71717A]">This Year</h2>
                <span className="text-xl ">{thisYearTotal.toLocaleString()}</span>
                <span className="text-xs text-[#14A166] flex items-center gap-1">
                  <ArrowUp
                    size={16}
                    className="bg-[#C4E7d8] rounded-full p-[2px]"
                  />
                  79.99%
                </span>
              </div>
            </div>
            <div className="flex items-end gap-6">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-[#FF617E] mb-[2px]" />
                <span>Ahmedabad</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-[#EA1B40] mb-[2px]" />
                <span>Delhi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm bg-[#9A182F] mb-[2px]" />
                <span>Mumbai</span>
              </div>
            </div>
          </div>
          <CounterPartChart data={chartData || []} />
        </div>
        <div className="border shadow-sm rounded-lg w-1/3">
          <SummaryCardWithSeeAll
            title="RTO Summary"
            month={`month`}
            locationOptions={locationOptions}
            selectedLocation={location}
            onLocationChange={(value) => setLocation(value)}
            data={data}
            maxRows={5}
            selectedMonth={rtoSummaryMonth}
            onMonthChange={setRtoSummaryMonth}
          />
        </div>
      </div>

      {/* Run Summary */}
      <div className="">
        <DataCardWithTableTotal
          title="Run Summary"
          columns={columns}
          rowData={rows}
          totalRow={totalRow}
          onSeeAll={() => console.log("See All Clicked")}
          selectedMonth={runSummaryMonth}
          onMonthChange={setRunSummaryMonth}
        />
      </div>
    </div>
  );
}
