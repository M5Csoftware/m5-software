"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { DummyInputBoxWithLabelDarkGray } from "@/app/components/DummyInputBox";
import Heading, { RedLabelHeading } from "@/app/components/Heading";
import InputBox, { DateInputBox } from "@/app/components/InputBox";
import { TableWithCheckbox } from "@/app/components/Table";
import NotificationFlag from "@/app/components/Notificationflag";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useContext, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";

// ─── Confirmation Modal ────────────────────────────────────────────────────────
const ConfirmationModal = ({ isOpen, onClose, onConfirm, count, deleting }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-7 max-w-sm w-full mx-4">
                {/* icon */}
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[#FEE2E2] mx-auto mb-4">
                    <svg className="w-7 h-7 text-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>

                <h3 className="text-lg font-bold text-eerie-black text-center mb-1">
                    Delete {count} Shipment{count !== 1 ? "s" : ""}?
                </h3>
                <p className="text-sm text-[#979797] text-center mb-1">
                    This will permanently remove the selected shipment{count !== 1 ? "s" : ""} and reverse their balance.
                </p>
                <p className="text-xs text-red font-semibold text-center mb-6">
                    ⚠️ This action cannot be undone.
                </p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="flex-1 py-2 border border-[#979797] rounded-md text-sm font-semibold text-[#616161] hover:bg-[#F5F5F5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex-1 py-2 bg-red text-white rounded-md text-sm font-semibold hover:bg-dark-red disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {deleting ? "Deleting..." : "Yes, Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ────────────────────────────────────────────────────────────
function DeleteShipment() {
    const { register, setValue, watch, reset } = useForm();
    const { server } = useContext(GlobalContext);

    const [rowData, setRowData] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [resetFactor, setResetFactor] = useState(false);

    const [notification, setNotification] = useState({
        type: "",
        message: "",
        visible: false,
    });

    const showNotification = (type, message) =>
        setNotification({ type, message, visible: true });

    // Watch form values
    const customerCode = watch("customerCode");
    const awbNo = watch("awbNo");
    const fromDate = watch("from");
    const toDate = watch("to");

    // ── Helper: convert DD/MM/YYYY or native date strings → ISO ──────────────
    const toISODate = (val) => {
        if (!val) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
            const [d, m, y] = val.split("/");
            const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            return isNaN(new Date(iso).getTime()) ? null : iso;
        }
        return null;
    };

    // ── Fetch customer name when code changes ─────────────────────────────────
    React.useEffect(() => {
        if (customerCode && customerCode.trim().length >= 3) {
            fetchCustomerName(customerCode.trim());
        } else {
            setValue("customerName", "");
        }
    }, [customerCode]);

    const fetchCustomerName = async (code) => {
        try {
            const { data } = await axios.get(
                `${server}/customer-account?accountCode=${code}`
            );
            setValue("customerName", data?.name || data?.customerName || "");
        } catch {
            setValue("customerName", "");
        }
    };

    // ── Show / fetch shipments ────────────────────────────────────────────────
    const handleShow = async () => {
        if (!fromDate && !toDate && !awbNo && !customerCode) {
            showNotification(
                "error",
                "Please enter at least one search criterion (AWB No., Customer Code, or Date Range)"
            );
            return;
        }

        setLoading(true);
        try {
            const params = new URLSearchParams();

            if (awbNo && awbNo.trim()) params.append("awbNo", awbNo.trim());
            if (customerCode && customerCode.trim())
                params.append("customerCode", customerCode.trim());

            if (fromDate || toDate) {
                const fromISO = toISODate(fromDate);
                const toISO = toISODate(toDate);
                if (fromISO) params.append("fromDate", fromISO);
                if (toISO) params.append("toDate", toISO);
            }

            const { data } = await axios.get(
                `${server}/delete-shipment?${params.toString()}`
            );

            if (data.success) {
                setRowData(data.data || []);
                showNotification(
                    "success",
                    data.message || `Found ${data.data?.length ?? 0} shipment(s)`
                );
            } else {
                setRowData([]);
                showNotification("warning", data.message || "No shipments found");
            }
        } catch (error) {
            console.error("Error fetching shipments:", error);
            showNotification(
                "error",
                error.response?.data?.error || "Failed to fetch shipments"
            );
            setRowData([]);
        } finally {
            setLoading(false);
        }
    };

    // ── Delete flow ───────────────────────────────────────────────────────────
    const handleDeleteClick = () => {
        if (selectedItems.length === 0) {
            showNotification(
                "error",
                "Please select at least one shipment to delete"
            );
            return;
        }
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setDeleting(true);
        try {
            const shipmentIds = selectedItems.map((item) => item._id);
            const { data } = await axios.delete(`${server}/delete-shipment`, {
                data: { shipmentIds },
            });

            if (data.success) {
                showNotification("success", data.message || "Shipments deleted successfully");
                setShowDeleteModal(false);
                setSelectedItems([]);
                handleShow();
            } else {
                showNotification("error", data.message || "Failed to delete shipments");
            }
        } catch (error) {
            console.error("Error deleting shipments:", error);
            showNotification(
                "error",
                error.response?.data?.error || "Failed to delete shipments"
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
    };

    // ── Refresh ────────────────────────────────────────────────────────────────
    const handleRefresh = () => {
        setRowData([]);
        setSelectedItems([]);
        setResetFactor((p) => !p);
        reset({
            customerCode: "",
            customerName: "",
            awbNo: "",
            from: "",
            to: "",
        });
    };

    // ── Table columns ──────────────────────────────────────────────────────────
    const columns = useMemo(
        () => [
            { key: "awbNo", label: "AWB No." },
            { key: "bookingDate", label: "Booking Date" },
            { key: "customerCode", label: "Customer Code" },
            { key: "customerName", label: "Customer Name" },
            { key: "origin", label: "Origin" },
            { key: "destination", label: "Destination" },
            { key: "weight", label: "Weight (kg)" },
            { key: "pieces", label: "Pieces" },
            { key: "grandTotal", label: "Grand Total" },
            { key: "status", label: "Status" },
        ],
        []
    );

    return (
        <>
            <NotificationFlag
                type={notification.type}
                message={notification.message}
                visible={notification.visible}
                setVisible={(visible) =>
                    setNotification((prev) => ({ ...prev, visible }))
                }
            />

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                count={selectedItems.length}
                deleting={deleting}
            />

            <form className="flex flex-col gap-3">
                {/* ── Header ──────────────────────────────────────────────────── */}
                <Heading
                    title="Delete Shipments"
                    bulkUploadBtn="hidden"
                    codeListBtn={"hidden"}
                    onRefresh={handleRefresh}
                    fullscreenBtn={false}
                />

                {/* ── Search Filters ───────────────────────────────────────────── */}
                <div className="flex flex-col gap-2">
                    <RedLabelHeading label="Search Filters" />

                    <div className="flex gap-3 items-end">
                        {/* AWB No. */}
                        <div className="w-1/6">
                            <InputBox
                                placeholder="AWB No."
                                register={register}
                                setValue={setValue}
                                value="awbNo"
                                resetFactor={resetFactor}
                            />
                        </div>

                        {/* Customer Code */}
                        <div className="w-1/6">
                            <InputBox
                                placeholder="Customer Code"
                                register={register}
                                setValue={setValue}
                                value="customerCode"
                                resetFactor={resetFactor}
                            />
                        </div>

                        {/* Customer Name (read-only) */}
                        <div className="w-1/6">
                            <DummyInputBoxWithLabelDarkGray
                                placeholder="Customer Name"
                                register={register}
                                setValue={setValue}
                                value="customerName"
                            />
                        </div>

                        {/* From Date */}
                        <div className="w-1/6">
                            <DateInputBox
                                register={register}
                                setValue={setValue}
                                value="from"
                                placeholder="From"
                                resetFactor={resetFactor}
                            />
                        </div>

                        {/* To Date */}
                        <div className="w-1/6">
                            <DateInputBox
                                register={register}
                                setValue={setValue}
                                value="to"
                                placeholder="To"
                                resetFactor={resetFactor}
                            />
                        </div>

                        {/* Show Button */}
                        <div className="w-1/6">
                            <OutlinedButtonRed
                                type="button"
                                label={loading ? "Loading..." : "Show"}
                                onClick={handleShow}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Results Area ────────────────────────────────────────────── */}
                <div className="border-[1px] rounded-md p-4 min-h-[45vh]">
                    {loading ? (
                        /* Loading state */
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <svg className="animate-spin w-8 h-8 text-red" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <p className="text-sm text-[#979797]">Fetching shipments...</p>
                        </div>
                    ) : rowData.length === 0 ? (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-16 gap-3 ">
                            <svg className="w-12 h-12 text-[#D1D5DB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                            </svg>
                            <p className="text-sm font-semibold text-[#9CA3AF]">No shipments found</p>
                            <p className="text-xs text-[#C4C4C4]">Enter filters above and click Show</p>
                        </div>
                    ) : (
                        /* Table */
                        <TableWithCheckbox
                            register={register}
                            setValue={setValue}
                            columns={columns}
                            rowData={rowData}
                            selectedItems={selectedItems}
                            setSelectedItems={setSelectedItems}
                            name="shipments"
                            className={`h-[45vh]`}
                        />
                    )}


                    {/* ── Footer: Delete action ────────────────────────────────────── */}
                    <div className="mt-3">
                        {rowData.length > 0 && (
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-[#979797]">
                                    {selectedItems.length > 0
                                        ? `${selectedItems.length} of ${rowData.length} shipment${rowData.length !== 1 ? "s" : ""} selected`
                                        : `${rowData.length} shipment${rowData.length !== 1 ? "s" : ""} found — select rows to delete`}
                                </p>
                                <div className="min-w-[140px]">
                                    <SimpleButton
                                        type="button"
                                        name={
                                            deleting
                                                ? "Deleting..."
                                                : `Delete${selectedItems.length > 0 ? ` (${selectedItems.length})` : ""}`
                                        }
                                        onClick={handleDeleteClick}
                                        disabled={deleting || selectedItems.length === 0}
                                        perm="Delete Shipment"
                                    />
                                </div>
                            </div>
                        )}
                    </div>


                </div>


            </form>
        </>
    );
}

export default DeleteShipment;