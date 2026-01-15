'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';

function DashboardSummaryCard({
    monthlyData = {}, // <-- Expect data as { 'YYYY-MM': { value1, value2 } }
    server,
    title
}) {
    const currentMonth = dayjs();
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const handlePrevMonth = () => {
        setSelectedMonth(prev => prev.subtract(1, 'month'));
    };

    const handleNextMonth = () => {
        const nextMonth = selectedMonth.add(1, 'month');
        if (nextMonth.isAfter(currentMonth)) return;
        setSelectedMonth(nextMonth);
    };

    const formatAmount = (label, amount) => {
        return label.toLowerCase() === 'weight'
            ? `${amount} Kg`
            : `₹${amount.toLocaleString()}`;
    };

    // Get data for the selected month
    const selectedKey = selectedMonth.format('YYYY-MM');
    const { value1 = { label: 'N/A', amount: 0 }, value2 = { label: 'N/A', amount: 0 } } = monthlyData[selectedKey] || {};


    const handleDownloadCSV = async () => {
        const selectedKey = selectedMonth.format('YYYY-MM');
        const res = await fetch(`${server}/dashboard/download-shipment-data?month=${selectedKey}&title=${title}`);
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.replace(" ", "_").toLowerCase()}_${selectedKey}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } else {
            alert("Failed to download CSV.");
        }
    };

    return (
        <div className={`rounded-md w-full border flex flex-col gap-4 p-4 ${title === 'TOTAL REVENUE' ? "border-red" : "border-french-gray"} `}>
            <div className="flex justify-between gap-9  items-center text-xs ">
                <span className="font-semibold text-dim-gray">{title}</span>
                <div className="text-dim-gray font-medium flex items-center justify-between gap-1">
                    <button onClick={handlePrevMonth}>
                        <img
                            src="arrow-right-gray.svg"
                            alt="Left"
                            width={14}
                            height={14}
                            className="rotate-180"
                        />
                    </button>
                    <span className='    text-center'>{selectedMonth.format('MMMM, YYYY')}</span>
                    <button
                        onClick={handleNextMonth}
                        disabled={selectedMonth.isSame(currentMonth, 'month')}
                    >
                        <img
                            src="arrow-right-gray.svg"
                            alt="Right"
                            width={14}
                            height={14}
                        />
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-end">
                <div className="flex gap-6">
                    <div className="flex flex-col">
                        <span className={`font-bold text-base ${value1.label === "Outstanding" ? "text-red" : ""}`}>
                            {formatAmount(value1.label, value1.amount)}
                        </span>
                        <span className="text-xs text-dim-gray">{value1.label}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-base">
                            {formatAmount(value2.label, value2.amount)}
                        </span>
                        <span className="text-xs text-dim-gray">{value2.label}</span>
                    </div>
                </div>

                <button onClick={handleDownloadCSV}>
                    <img src="download.svg" alt="Download CSV" width={18} height={18} />
                </button>

            </div>
        </div>
    );
}

export default DashboardSummaryCard;
