'use client'
import dayjs from 'dayjs';
import React, { useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

function DashboardStateWise({ data }) {
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

    return (
        <div className='p-5 flex flex-col gap-5 border border-french-gray items-start rounded-md text-xs w-[440px]'>
            <div className='flex justify-between w-full items-center gap-3'>
                <h2 className='text-xl font-bold'>State Wise</h2>
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

            {/* Horizontal Bar Chart */}
            <div className="mt-5 w-full" style={{ height: 500 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={currentStateData}
                        layout="vertical"
                        barCategoryGap={38}
                        barSize={16}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number"
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis type="category" hide /> {/* Hide axis labels */}
                        {/* <Tooltip /> */}

                        <Bar
                            dataKey="value"
                            fill="#EA1B40"
                            radius={[0, 2, 2, 0]}
                            label={({ x, y, value, index }) => {
                                const labelText = `${currentStateData[index].name}`;
                                return (
                                    <text
                                        x={x}
                                        y={y - 8}
                                        dy={3}
                                        fontSize={12}
                                    >
                                        <tspan fill="#212123">{labelText}:</tspan>
                                        <tspan fill="#8A8A8C"> [{value}Kg]</tspan>
                                    </text>
                                );
                            }}
                        />
                    </BarChart>
                </ResponsiveContainer>

            </div>

        </div>
    );
}

export default DashboardStateWise;

export function AverageCard({ label, value, percentage, isPositive }) {
    const isTonn = value >= 1000;
    const displayValue = isTonn ? (value / 1000).toFixed(2) : value;
    const unitLabel = isTonn ? 'Tons' : 'Kg';

    return (
        <div className="flex flex-col gap-1">
            <span className='text-dim-gray'>{label}</span>
            <span className='text-base'>{displayValue} {unitLabel}</span>
            <div className={`flex text-[10px] items-center gap-1.5 ${isPositive ? 'text-green-2' : 'text-red'}`}>
                <img src={isPositive ? 'gain.svg' : 'loss.svg'} alt="gain/loss" />
                <span>{percentage}%</span>
            </div>
        </div>
    );
}
