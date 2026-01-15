'use client'
import dayjs from 'dayjs';
import React, { useState } from 'react'
import { AverageCard } from './DashboardStateWise';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function DashboardSectorWise({ data }) {
  const currentMonth = dayjs();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    const nextMonth = selectedMonth.add(1, 'month');
    if (nextMonth.isAfter(currentMonth)) return;
    setSelectedMonth(nextMonth);
  };
  const monthKey = selectedMonth.format('YYYY-MM');
  const prevMonthKey = selectedMonth.subtract(1, 'month').format('YYYY-MM');
  const year = selectedMonth.format('YYYY');
  const prevYear = selectedMonth.subtract(1, 'year').format('YYYY');

  const currentStateData = data[monthKey] || [];
  const prevMonthData = data[prevMonthKey] || [];

  const currentMonthTotal = currentStateData.reduce((sum, entry) => sum + entry.value, 0);
  const prevMonthTotal = prevMonthData.reduce((sum, entry) => sum + entry.value, 0);

  const allMonthKeys = Object.keys(data);
  const thisYearTotal = allMonthKeys
    .filter((key) => key.startsWith(year))
    .reduce((sum, key) => sum + data[key].reduce((s, e) => s + e.value, 0), 0);

  const prevYearTotal = allMonthKeys
    .filter((key) => key.startsWith(prevYear))
    .reduce((sum, key) => sum + data[key].reduce((s, e) => s + e.value, 0), 0);

  const monthlyAverage = currentStateData.length
    ? currentMonthTotal / currentStateData.length
    : 0;

  const monthlyChange = prevMonthTotal
    ? ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100
    : 0;

  const yearlyChange = prevYearTotal
    ? ((thisYearTotal - prevYearTotal) / prevYearTotal) * 100
    : 0;

  // Merge current and previous month data by sector name
  const mergedData = currentStateData.map((currentEntry) => {
    const prevEntry = prevMonthData.find((entry) => entry.name === currentEntry.name);
    return {
      name: currentEntry.name,
      current: currentEntry.value,
      previous: prevEntry ? prevEntry.value : 0,
    };
  });

  return (
    <div className='p-5 flex flex-col gap-5 border border-french-gray items-start rounded-md text-xs '>
      <div className='flex justify-between w-full items-center gap-3'>
        <h2 className='text-xl font-bold'>Sector Wise</h2>
        <div className="flex gap-3 text-dim-gray border rounded-md items-center w-fit py-2 px-3 border-battleship-gray">
          <div className='flex items-center gap-1'>
            <button onClick={handlePrevMonth}>
              <img src="arrow-right-gray.svg" alt="Left" className='rotate-180' />
            </button>
            <span>
              {selectedMonth.subtract(1, 'month').format('MMM')} - {selectedMonth.format('MMM')}, {selectedMonth.format('YYYY')}
            </span>
            <button onClick={handleNextMonth} disabled={selectedMonth.isSame(currentMonth, 'month')}>
              <img src="arrow-right-gray.svg" alt="Right" />
            </button>
          </div>
          <img src="calender.svg" height={18} width={18} alt="" />
        </div>
      </div>
      <div className="flex gap-8">
        <AverageCard
          isPositive={monthlyChange >= 0}
          label={'Monthly Average'}
          percentage={monthlyChange.toFixed(2)}
          value={monthlyAverage.toFixed(2)}
        />
        <AverageCard
          isPositive={yearlyChange >= 0}
          label={'This Year'}
          percentage={yearlyChange.toFixed(2)}
          value={thisYearTotal}
        />
      </div>
      <div className="mt-5 w-full" style={{ height: 277 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={mergedData}
            layout="horizontal"
            barCategoryGap="20%"
            barSize={20}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name"
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis type="number"
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={(props) => (
                <CustomTooltipWrapper
                  {...props}
                  selectedMonth={selectedMonth}
                />
              )}
              cursor={{ fill: 'transparent' }}
            />

            <Bar dataKey="previous" fill="#EA1B40" radius={[6, 6, 6, 6]} />
            <Bar dataKey="current" fill="#EAECF0" radius={[6, 6, 6, 6]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}

export default DashboardSectorWise



const CustomTooltip = ({ active, payload, selectedMonth }) => {
  if (!active || !payload || !payload.length) return null;

  // find each bar's value
  const prevItem = payload.find((p) => p.dataKey === 'previous');
  const currItem = payload.find((p) => p.dataKey === 'current');

  // month names
  const prevMonthName = selectedMonth
    .clone()
    .subtract(1, 'month')
    .format('MMM');
  const currMonthName = selectedMonth.format('MMM');

  return (
    <div className="bg-white border border-gray-300 rounded-md shadow-md px-3 py-2 text-sm text-gray-800">
      {prevItem && (
        <p>
          <span className="font-medium">{prevMonthName}:</span>{' '}
          {prevItem.value.toLocaleString()} Kg
        </p>
      )}
      {currItem && (
        <p>
          <span className="font-medium">{currMonthName}:</span>{' '}
          {currItem.value.toLocaleString()} Kg
        </p>
      )}
    </div>
  );
};

const CustomTooltipWrapper = ({ selectedMonth, ...props }) => (
  <CustomTooltip {...props} selectedMonth={selectedMonth} />
);
