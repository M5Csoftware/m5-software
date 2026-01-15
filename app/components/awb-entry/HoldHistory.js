import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AwbWindowHeading } from '../Heading'
import { TableWithSorting } from '../Table'
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { GlobalContext } from '@/app/lib/GlobalContext';

function HoldHistory({ awbNo, window }) {
    const { register, setValue } = useForm();
    const [rowData, setRowData] = useState([]);
    const { server } = useContext(GlobalContext);


    useEffect(() => {
        if (window) {
            axios.get(`${server}/hold-log/action?awbNo=${awbNo}`)
                .then(res => {
                    console.log("Hold history data:", res.data);
                    setRowData(res.data);
                })
                .catch(err => {
                    console.error("Error fetching hold history:", err);
                    setRowData([]);
                });
        }
    }, [window, awbNo]);

    const columns = useMemo(() => [
        { key: "actionLogDate", label: "Action Date" },
        { key: "reason", label: "Action Time" },
        { key: "holdReason", label: "Hold Reason" },
        { key: "action", label: "Action" },
        { key: "actionUser", label: "Action User" },
    ], []);

    return (
        <div className={`flex flex-col gap-7 bg-white px-9 py-8 fixed inset-x-48 inset-y-10 z-50 backdrop-blur-sm border rounded-md ${window ? "" : "hidden"} `}>
            <AwbWindowHeading label={`Hold History`} awbNo={awbNo} />
            <div className=' rounded-lg py-3.5 px-5'>
                <TableWithSorting columns={columns} rowData={rowData} register={register} setValue={setValue} name={`holdHistory`} />
            </div>
        </div>
    )
}

export default HoldHistory
