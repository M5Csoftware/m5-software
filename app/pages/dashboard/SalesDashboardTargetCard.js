"use client";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useEffect, useState, useMemo, useContext } from "react";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const ArcProgress = ({
  progress,
  size,
  strokeWidth = 8,
  fillColor = "#EA1B40",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className="relative"
      style={{ width: size, height: size / 2 + strokeWidth }}
    >
      <svg width={size} height={size / 2 + strokeWidth}>
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
            size - strokeWidth / 2
          } ${size / 2}`}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${
            size - strokeWidth / 2
          } ${size / 2}`}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  );
};

export const TargetCard = () => {
  const now = new Date();
  const currentMonth = months[now.getMonth()];
  const currentYear = now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [data, setData] = useState({ current: 0, target: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const [animatedValue, setAnimatedValue] = useState(0);
  const [showPercentSign, setShowPercentSign] = useState(false);

  const selectedKey = useMemo(() => {
    const m = months.indexOf(selectedMonth) + 1;
    return `${currentYear}-${String(m).padStart(2, "0")}`;
  }, [selectedMonth, currentYear]);

  const { server } = useContext(GlobalContext);

  const percentage =
    data.target > 0 ? Math.round((data.current / data.target) * 100) : 0;

  // -------------------------
  // Fetch real API data
  // -------------------------
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setData({ current: 0, target: 0 });

      try {
        // 1️⃣ get user from localstorage
        const user = JSON.parse(localStorage.getItem("user"));
        const userId = user?.userId;

        if (!userId) {
          console.warn("No userId found in localStorage");
          setIsLoading(false);
          return;
        }

        // 2️⃣ pass userId to backend
        const res = await fetch(
          `${server}/dashboard/sales-dashboard/target-card?month=${selectedKey}&userId=${userId}`
        );

        const json = await res.json();

        setData({
          current: json.current || 0,
          target: json.target || 0,
        });
      } catch {
        setData({ current: 0, target: 0 });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedKey]);

  // -------------------------
  // Animate %
  // -------------------------
  useEffect(() => {
    setAnimatedValue(0);
    setShowPercentSign(false);

    const duration = 800;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = percentage / steps;
    let currentVal = 0;

    const interval = setInterval(() => {
      currentVal += increment;

      if (currentVal >= percentage) {
        currentVal = percentage;
        setAnimatedValue(Math.round(currentVal));
        setShowPercentSign(true);
        clearInterval(interval);
      } else {
        setAnimatedValue(Math.round(currentVal));
      }
    }, stepTime);

    return () => clearInterval(interval);
  }, [percentage]);

  return (
    <div className="flex flex-col gap-2 bg-white">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-gray-900">Target</h2>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-500 bg-white"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {month === currentMonth ? "This Month" : month}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col items-center mt-2">
        <div className="relative">
          <ArcProgress progress={percentage / 100} size={170} />

          <div className="absolute bottom-0 left-0 right-0 text-center font-bold text-[#EA1B40] text-[20px]">
            {isLoading ? "..." : animatedValue}
            {!isLoading && showPercentSign && "%"}
          </div>
        </div>

        {!isLoading ? (
          <div className="text-xs font-bold mt-1 text-gray-700">
            ₹{data.current.toLocaleString("en-IN")} / ₹
            {data.target.toLocaleString("en-IN")}
          </div>
        ) : (
          <div className="text-xs mt-1 text-gray-500">Loading...</div>
        )}
      </div>
    </div>
  );
};
