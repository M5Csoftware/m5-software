import React, { useEffect, useState, useMemo } from "react";

function DashboardProgressBar({ data, title, rupee = true }) {
  const options = Object.keys(data);
  const [selectedRange, setSelectedRange] = useState("Last 7 Days");
  const sectorData = data[selectedRange] || [];

  const maxValue = useMemo(() => {
    const numericValues = sectorData.map((item) => {
      const val = parseFloat(String(item.value).replace(/[^\d.]+/g, ""));
      // downscale weight a bit to keep proportional visual balance
      return item.label.includes("Weight") ? val / 100 : val;
    });
    return Math.max(...numericValues, 1);
  }, [sectorData]);

  const [animatedWidths, setAnimatedWidths] = useState(
    Array(sectorData.length).fill(0)
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      const newWidths = sectorData.map((sector) => {
        let numeric =
          typeof sector.value === "number"
            ? sector.value
            : parseFloat(String(sector.value).replace(/[^\d.]+/g, "")); // remove "kg" or commas
        return Number.isFinite(numeric)
          ? Math.min((numeric / (numeric + 10)) * 95, 5)
          : 0;
      });

      setAnimatedWidths(newWidths);
    }, 100);

    return () => clearTimeout(timeout);
  }, [sectorData, maxValue]);

  return (
    <div className="p-5 flex flex-col gap-5 border border-french-gray items-start rounded-md text-xs bg-seasalt">
      <div className="flex justify-between w-full items-center gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <select
          className="text-dim-gray text-xs border border-gray-300 px-2 py-1 rounded"
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {sectorData.length > 0 ? (
        sectorData.map((sector, idx) => (
          <div key={idx} className="w-full">
            <div className="flex justify-between text-sm font-medium text-eerie-black">
              <span>{sector.label}</span>
              <span>
                {sector.label === "Total Weight"
                  ? `${sector.value}`
                  : typeof sector.value === "number"
                  ? `${rupee ? "₹" : ""}${sector.value.toLocaleString("en-IN", {
                      maximumFractionDigits: 0,
                    })}`
                  : sector.value}
              </span>
            </div>
            <div className="w-full h-2 bg-platinum rounded-full overflow-hidden">
              <div
                className="h-full bg-red rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${animatedWidths[idx]}%` }}
              ></div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-400 text-sm">No data available</p>
      )}
    </div>
  );
}

export default DashboardProgressBar;
