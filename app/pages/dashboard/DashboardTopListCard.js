"use client";
import { useState, useEffect, useContext } from "react";
import dayjs from "dayjs";
import { GlobalContext } from "@/app/lib/GlobalContext";

const DashboardTopListCard = ({ title, city }) => {
  const currentMonth = dayjs();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [data, setData] = useState({}); // store month-wise fetched data
  const [showAll, setShowAll] = useState(false);
  const { server } = useContext(GlobalContext);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?.userId;

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => prev.subtract(1, "month"));
    setShowAll(false);
  };

  const handleNextMonth = () => {
    const nextMonth = selectedMonth.add(1, "month");
    if (nextMonth.isAfter(currentMonth)) return;
    setSelectedMonth(nextMonth);
    setShowAll(false);
  };

  // convert to backend’s format: 2025-11
  const monthKey = selectedMonth.format("YYYY-MM");

  // ----------------------------
  // 🔥 Fetch real backend data
  // ----------------------------
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${server}/dashboard/sales-dashboard/top-customers?month=${monthKey}&userId=${userId}`
        );
        const json = await res.json();

        setData((prev) => ({
          ...prev,
          [monthKey]: json.list || [],
        }));
      } catch (err) {
        console.log("TopList Fetch Error:", err);
        setData((prev) => ({
          ...prev,
          [monthKey]: [],
        }));
      }
    };

    fetchData();
  }, [monthKey]);

  const filteredData = data[monthKey] || [];

  return (
    <div className="p-5 flex flex-col gap-3 border border-french-gray rounded-md flex-grow">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1 items-start">
          <span className="font-bold">{title}</span>
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
        {filteredData.length > 0 ? (
          filteredData.map((person, index) => (
            <DashboardTopListCardRow
              key={index}
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
  name,
  state,
  id,
  image,
  weight,
  amount,
  title,
}) => {
  const formattedAmt = new Intl.NumberFormat("en-IN").format(amount);
  return (
    <div className="flex justify-between text-xs px-2 py-3 border-b border-seasalt">
      <div className="flex gap-1.5">
        <img
          src={image}
          alt="profile"
          width={32}
          height={32}
          className="rounded-full object-contain"
        />
        <div className="flex flex-col">
          <div className="font-semibold">{name}</div>
          <div className="text-dim-gray">
            {title === "Top Sales Person" ? (
              <span>State: {state}</span>
            ) : (
              <span>#</span>
            )}{" "}
            {id}
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <div className="font-semibold">{weight} Kg</div>
        <div className="text-dim-gray">₹{formattedAmt}</div>
      </div>
    </div>
  );
};
