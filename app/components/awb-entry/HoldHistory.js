// app/components/awb-entry/HoldHistory.jsx
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AwbWindowHeading } from '../Heading'
import { TableWithSorting } from '../Table'
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { GlobalContext } from '@/app/lib/GlobalContext';

function HoldHistory({ awbNo, window }) {
    const { register, setValue } = useForm();
    const [rowData, setRowData] = useState([]);
    const [loading, setLoading] = useState(false);
    const { server } = useContext(GlobalContext);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        if (isNaN(date)) return "-";
        return (
            date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }) +
            " " +
            date.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            })
        );
    };

    useEffect(() => {
        if (!window || !awbNo) return;

        const fetchHoldHistory = async () => {
            setLoading(true);
            try {
                // Use the API route path
                const response = await axios.get(`${server}/hold-log/action?awbNo=${awbNo}`);
                
                // console.log("Hold history API response:", response.data);
                
                const data = Array.isArray(response.data) ? response.data : 
                            (response.data ? [response.data] : []);
                
                const formatted = data.map((entry, idx) => ({
                    srNo:         idx + 1,
                    actionDate:   formatDateTime(entry.actionLogDate || entry.createdAt),
                    holdReason:   entry.holdReason  || "-",
                    action:       entry.action      || "-",
                    actionUser:   entry.actionUser  || "-",
                    department:   entry.departmentName || "-",
                    customer:     entry.customer    || "-",
                    accountCode:  entry.accountCode || "-",
                    systemName:   entry.actionSystemName || "-",
                    systemIp:     entry.actionSystemIp   || "-",
                }));
                
                setRowData(formatted);
            } catch (err) {
                console.error("Error fetching hold history:", err);
                setRowData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHoldHistory();
    }, [window, awbNo]); // Removed server dependency since we're using relative path

    const columns = useMemo(() => [
        { key: "srNo",        label: "Sr No"        },
        { key: "actionDate",  label: "Date & Time"   },
        { key: "holdReason",  label: "Hold Reason"   },
        { key: "action",      label: "Action"        },
        { key: "actionUser",  label: "Action User"   },
        { key: "department",  label: "Department"    },
        { key: "customer",    label: "Customer"      },
        { key: "accountCode", label: "Account Code"  },
        { key: "systemName",  label: "System"        },
        { key: "systemIp",    label: "IP Address"    },
    ], []);

    return (
        <div className={`flex flex-col gap-7 bg-white px-9 py-8 fixed inset-x-48 inset-y-10 z-50 backdrop-blur-sm border rounded-md ${window ? "" : "hidden"}`}>
            <AwbWindowHeading label={`Hold History`} awbNo={awbNo} />

            <div className='rounded-lg py-3.5 px-5 max-h-[calc(100vh-200px)] overflow-auto'>
                {loading ? (
                    <div className="flex items-center justify-center h-24 gap-2 text-gray-400 text-sm">
                        <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        Loading hold history...
                    </div>
                ) : rowData.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-gray-400 text-sm">
                        No hold history found for AWB: {awbNo}
                    </div>
                ) : (
                    <TableWithSorting
                        columns={columns}
                        rowData={rowData}
                        register={register}
                        setValue={setValue}
                        name={`holdHistory`}
                    />
                )}
            </div>
        </div>
    );
}

export default HoldHistory;