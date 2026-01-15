import React, { useContext, useState } from "react";
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

const CounterPartDashboard = () => {
  const [location, setLocation] = useState("New Delhi"); // selected location
  const locationOptions = ["New Delhi", "Mumbai", "Ahmedabad"]; // your options
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
  const rows = [
    {
      runNo: "RN-1021",
      arrivalDate: "2025-10-01",
      departureDate: "2025-10-02",
      bagsCount: 12,
      awbCount: 48,
      pcsCount: 320,
      totalWt: "1,245 kg",
    },
    {
      runNo: "RN-1022",
      arrivalDate: "2025-10-03",
      departureDate: "2025-10-03",
      bagsCount: 9,
      awbCount: 36,
      pcsCount: 250,
      totalWt: "980 kg",
    },
    {
      runNo: "RN-1023",
      arrivalDate: "2025-10-05",
      departureDate: "2025-10-06",
      bagsCount: 15,
      awbCount: 60,
      pcsCount: 410,
      totalWt: "1,560 kg",
    },
  ];

  const totalRow = {
    runNo: "Total",
    arrivalDate: "",
    departureDate: "",
    bagsCount: 36,
    awbCount: 144,
    pcsCount: 980,
    totalWt: "3,785 kg",
  };

  const data = [
    {
      id: "M5937583290",
      date: "01/05/2025",
      status: "Recipient Refused",
      carrier: "UPS",
    },
    {
      id: "M5937583290",
      date: "01/05/2025",
      status: "Recipient Refused",
      carrier: "FedEx",
    },
    {
      id: "M5937583290",
      date: "01/05/2025",
      status: "Recipient Refused",
      carrier: "UPS",
    },
    {
      id: "M5937583290",
      date: "01/05/2025",
      status: "Recipient Refused",
      carrier: "FedEx",
    },
    {
      id: "M5937583290",
      date: "01/05/2025",
      status: "Recipient Refused",
      carrier: "UPS",
    },
  ];

  return (
    <div className="flex flex-col gap-3">
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

      {/* Upper Status Cards */}
      <div className="flex w-full gap-3 items-center">
        <div className="w-2/3 flex gap-3">
          <div className="w-1/2">
            <StatusCard
              title="INCOMING SHIPMENTS"
              greenCount={20}
              redCount={50}
              greenText="Remaining"
              redText="Resolved"
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
            <YearRangePicker />
          </div>
          <div className="flex justify-between p-6">
            <div className="flex gap-10">
              {/* left */}
              <div className="flex flex-col">
                <h2 className="tracking-wide text-[#71717A]">
                  Monthly Average
                </h2>
                <span className="text-xl">5,003</span>
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
                <span className="text-xl ">60,422</span>
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
          <CounterPartChart />
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
        />
      </div>
    </div>
  );
};

export default CounterPartDashboard;
