'use client';
import React, { useState } from 'react';
import dayjs from 'dayjs';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

function HubWise({ monthlyData }) {
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

    // 🔢 Updated data with only `value`


    const monthKey = selectedMonth.format('YYYY-MM');
    const prevMonthKey = selectedMonth.subtract(1, 'month').format('YYYY-MM');

    const currentData = monthlyData[monthKey] || [];
    const previousData = monthlyData[prevMonthKey] || [];

    const pieDataWithChange = currentData.map((hub) => {
        const prevHub = previousData.find((prev) => prev.name === hub.name);
        const previousValue = prevHub ? prevHub.value : 0;
        const percentChange = previousValue
            ? ((hub.value - previousValue) / previousValue) * 100
            : 0;

        return {
            ...hub,
            percentChange,
        };
    });

    const COLORS = ['#FF6B6B', '#4ECDC4', '#FFD93D'];

    const topHub = pieDataWithChange.reduce(
        (max, hub) => (hub.value > max.value ? hub : max),
        pieDataWithChange[0] || { name: '', value: 0, percentChange: 0 }
    );

    return (
        <div className='p-5 w-[255px] flex flex-col gap-5 border  border-french-gray items-start rounded-md text-xs'>
            <div className='flex flex-col gap-3'>
                <h2 className='text-xl font-bold'>Hub Wise</h2>
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

            {/* Top Hub Details */}
            {pieDataWithChange.length > 0 ? (
                <div className="flex flex-col gap-1">
                    <span className='text-dim-gray'>Top Hub</span>
                    <span className='font-semibold'>{topHub.name}</span>
                    <span className='text-base'>{topHub.value.toFixed(1)} Kg</span>
                    <div
                        className={`flex text-[10px] items-center gap-1.5 ${topHub.percentChange >= 0 ? 'text-green-2' : 'text-red'
                            }`}
                    >
                        <img src={topHub.percentChange >= 0 ? "gain.svg" : "loss.svg"} alt="gain/loss" />
                        <span>{topHub.percentChange.toFixed(2)}%</span>
                    </div>
                </div>
            ) : (
                <div className="text-sm text-dim-gray">No data available for this month</div>
            )}

            {/* Pie Chart */}
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                    <Pie
                        data={pieDataWithChange}
                        cx="50%"
                        cy="50%"
                        label={renderCustomizedLabel}
                        labelLine={false}
                        outerRadius={80}
                        dataKey="value"
                    >
                        {pieDataWithChange.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

export default HubWise;

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};
