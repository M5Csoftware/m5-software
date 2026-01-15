'use client';

import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell } from 'recharts';




function UserCountCard({ data }) {
    const [isClient, setIsClient] = useState(false);
    const totalUsers = data.reduce((acc, curr) => acc + curr.value, 0);

    useEffect(() => {
        // Trigger client-only rendering
        setIsClient(true);
    }, []);

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Donut Chart */}
            <div className="relative">
                {isClient ? (
                    <PieChart width={112} height={112}>
                        <Pie
                            data={data}
                            innerRadius={36}
                            outerRadius={52}
                            paddingAngle={1}
                            dataKey="value"
                            startAngle={90}
                            endAngle={-270}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>

                ) : (<div className='w-28 h-28'></div>)}

                {/* Centered text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] text-dim-gray">User Count</p>
                    <p className="text-sm font-bold">
                        {totalUsers.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Labels */}
            <div className="flex justify-around w-full">
                {data.map((item, index) => (
                    <div key={index} className="flex items-start gap-1">
                        <div className="mt-1">
                            <svg width="8" height="8" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="4" cy="4" r="4" fill={item.color} />
                            </svg>
                        </div>
                        <div className="flex flex-col text-xs">
                            <span className="text-dim-gray">{item.name}</span>
                            <span className="font-bold">{item.value.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default UserCountCard;
