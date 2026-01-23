"use client";
import { useState, useEffect, useContext } from "react";
import dayjs from "dayjs";
import { GlobalContext } from "@/app/lib/GlobalContext";

const DashboardTopListCard = ({ title, city }) => {
  const currentMonth = dayjs();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [data, setData] = useState({}); // store month-wise fetched data
  const [loading, setLoading] = useState(false);
  const { server } = useContext(GlobalContext);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => prev.subtract(1, "month"));
  };

  const handleNextMonth = () => {
    const nextMonth = selectedMonth.add(1, "month");
    if (nextMonth.isAfter(currentMonth)) return;
    setSelectedMonth(nextMonth);
  };

  // convert to backend's format: 2025-01
  const monthKey = selectedMonth.format("YYYY-MM");

  // Fetch data from new unified API
  useEffect(() => {
    const fetchData = async () => {
      // Check if we already have data for this month
      if (data[monthKey]) return;

      setLoading(true);
      try {
        const res = await fetch(
          `${server}/dashboard/revenue-dashboard-data/top-sales-customers?month=${monthKey}`,
        );
        const json = await res.json();

        if (json.success) {
          setData((prev) => ({
            ...prev,
            [monthKey]: {
              topCustomers: json.topCustomers || [],
              topSalesPersons: json.topSalesPersons || [],
            },
          }));
        } else {
          setData((prev) => ({
            ...prev,
            [monthKey]: {
              topCustomers: [],
              topSalesPersons: [],
            },
          }));
        }
      } catch (err) {
        console.error("TopList Fetch Error:", err);
        setData((prev) => ({
          ...prev,
          [monthKey]: {
            topCustomers: [],
            topSalesPersons: [],
          },
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [monthKey, server]);

  // Get the correct data based on title
  const monthData = data[monthKey] || { topCustomers: [], topSalesPersons: [] };
  const filteredData =
    title === "Top Sales Person"
      ? monthData.topSalesPersons
      : monthData.topCustomers;

  return (
    <div className="p-5 flex flex-col gap-3 border border-french-gray rounded-md flex-grow">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1 items-start">
          <span className="font-bold">{title}</span>
          <span className="text-dim-gray text-xs">{city}</span>
        </div>
        <div className="text-dim-gray text-xs flex items-center gap-1">
          <button onClick={handlePrevMonth}>
            <img src="arrow-right-gray.svg" alt="Left" className="rotate-180" />
          </button>

          <span>{selectedMonth.format("MMMM, YYYY")}</span>

          <button
            onClick={handleNextMonth}
            disabled={selectedMonth.isSame(currentMonth, "month")}
          >
            <img src="arrow-right-gray.svg" alt="Right" />
          </button>
        </div>
      </div>

      <div className="flex flex-col max-h-[75vh] flex-grow overflow-y-auto table-scrollbar">
        {loading ? (
          <div className="text-dim-gray text-sm text-center py-3">
            Loading...
          </div>
        ) : filteredData.length > 0 ? (
          filteredData.map((person, index) => (
            <DashboardTopListCardRow
              key={person.id}
              rank={index + 1}
              name={person.name}
              state={person.state}
              id={person.id}
              image={person.image}
              weight={person.weight}
              amount={person.amount}
              title={title}
            />
          ))
        ) : (
          <div className="text-dim-gray text-sm text-center py-3">
            No data for this month
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTopListCard;

const DashboardTopListCardRow = ({
  rank,
  name,
  state,
  id,
  image,
  weight,
  amount,
  title,
}) => {
  const [imgSrc, setImgSrc] = useState("/default-avatar.png");
  
  const formattedAmt = new Intl.NumberFormat("en-IN").format(amount);
  const formattedWeight = new Intl.NumberFormat("en-IN").format(weight);

  // Load image in useEffect to prevent flashing
  useEffect(() => {
    if (image) {
      // Create a new Image object to check if it loads
      const img = new Image();
      img.src = image;
      
      img.onload = () => {
        setImgSrc(image);
      };
      
      img.onerror = () => {
        setImgSrc("/default-avatar.png");
      };
    } else {
      setImgSrc("/default-avatar.png");
    }
  }, [image]);

  return (
    <div className="flex justify-between text-xs px-2 py-3 border-b border-seasalt hover:bg-gray-50 transition-colors">
      <div className="flex gap-1.5 items-center">
        <span className="text-dim-gray font-semibold min-w-[20px]">
          #{rank}
        </span>
        <img
          src={imgSrc}
          alt="profile"
          width={32}
          height={32}
          className="rounded-full object-cover"
        />
        <div className="flex flex-col">
          <div className="font-semibold">{name}</div>
          <div className="text-dim-gray">
            {title === "Top Sales Person" ? (
              <span>State: {state}</span>
            ) : (
              <span>#{id}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-semibold">{formattedWeight} Kg</div>
        <div className="text-dim-gray">₹{formattedAmt}</div>
      </div>
    </div>
  );
};
