"use client";
import React, { useState } from "react";
import {
    AlertTriangle,
    CheckCircle2,
    XCircle,
    X,
    Zap,
    CheckCheck,
} from "lucide-react";

/**
 * AutoCalcModal — A themed modal for the Auto Calculation page.
 *
 * variant:
 *   "confirm"  — confirm dialog with Cancel + Proceed buttons
 *   "warning"  — tabbed view: "Failed" tab + "OK" tab (failed opens first)
 *   "info"     — key/value info rows (test result), one OK button
 *   "error"    — simple error message, one OK button
 */
const VARIANTS = {
    confirm: {
        icon: Zap,
        iconBg: "bg-[#EA1B40]/10",
        iconColor: "text-[#EA1B40]",
        title: "Confirm Recalculation",
    },
    warning: {
        icon: AlertTriangle,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        title: "Partial Failure",
    },
    info: {
        icon: CheckCircle2,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        title: "Test Result",
    },
    error: {
        icon: XCircle,
        iconBg: "bg-rose-100",
        iconColor: "text-[#EA1B40]",
        title: "Error",
    },
    success: {
        icon: Zap,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        title: "Calculation Success",
    },
};

export const AutoCalcModal = ({
    isOpen,
    onClose,
    onConfirm,
    variant = "confirm",
    title,
    message,
    rows,           // [{ label, value }] — for info variant
    failedItems,    // [{ awbNo, error }] — failed shipments
    okItems,        // [{ awbNo }]        — successful shipments (for warning tabs)
    meta,           // string[]           — badge pills
    confirmLabel = "Proceed",
    cancelLabel = "Cancel",
}) => {
    const [activeTab, setActiveTab] = useState(variant === "warning" ? "failed" : "ok");

    if (!isOpen) return null;

    const v = VARIANTS[variant] || VARIANTS.confirm;
    const Icon = v.icon;
    const modalTitle = title || v.title;
    const isConfirm = variant === "confirm";
    const isWarning = variant === "warning";
    const isSuccess = variant === "success";

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
            style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
            <div
                className="bg-white rounded-2xl w-full shadow-2xl flex flex-col overflow-hidden"
                style={{
                    maxWidth: (isWarning || isSuccess) ? "680px" : "520px",
                    animation: "acModalIn 0.22s cubic-bezier(.4,0,.2,1)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ─────────── HEADER ─────────── */}
                <div className="px-7 pt-6 pb-5 border-b border-gray-100 flex items-start gap-4">
                    <div className={`${v.iconBg} rounded-xl p-3 flex-shrink-0 transition-transform duration-300 hover:scale-110`}>
                        <Icon className={`${v.iconColor} w-6 h-6`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-gray-900 leading-tight">
                            {modalTitle}
                        </h2>
                        {message && (
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{message}</p>
                        )}
                        {/* meta badges */}
                        {meta && meta.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {meta.map((m, i) => (
                                    <span
                                        key={i}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                                    >
                                        {m}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors ml-2 flex-shrink-0 mt-0.5"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ─────────── BODY ─────────── */}
                <div className="px-7 py-5 flex flex-col gap-4 min-h-0">

                    {/* ── TABBED view for warning variant ── */}
                    {isWarning && (
                        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setActiveTab("failed")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "failed"
                                    ? "bg-white text-[#EA1B40] shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <XCircle size={15} />
                                Failed
                                {failedItems && failedItems.length > 0 && (
                                    <span
                                        className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${activeTab === "failed"
                                            ? "bg-[#EA1B40] text-white"
                                            : "bg-gray-300 text-gray-700"
                                            }`}
                                    >
                                        {failedItems.length}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("ok")}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === "ok"
                                    ? "bg-white text-green-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <CheckCheck size={15} />
                                OK
                                {okItems && okItems.length > 0 && (
                                    <span
                                        className={`ml-1 px-1.5 py-0.5 rounded-full text-[11px] font-bold ${activeTab === "ok"
                                            ? "bg-green-600 text-white"
                                            : "bg-gray-300 text-gray-700"
                                            }`}
                                    >
                                        {okItems.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Content Area */}
                    {(isWarning || isSuccess) && (
                        <div className="flex flex-col gap-4">
                            {/* Failed tab content (only in warning and if failed) */}
                            {isWarning && activeTab === "failed" && (
                                <div className="rounded-xl border border-red-100 overflow-hidden">
                                    <div className="px-4 py-2.5 bg-rose-50 border-b border-red-100 flex items-center gap-2">
                                        <XCircle size={14} className="text-[#EA1B40]" />
                                        <span className="text-xs font-semibold text-[#EA1B40] uppercase tracking-wide">
                                            {failedItems?.length ?? 0} shipment{failedItems?.length !== 1 ? "s" : ""} failed
                                        </span>
                                    </div>
                                    <div
                                        className="divide-y divide-gray-100 overflow-y-auto"
                                        style={{ maxHeight: "280px" }}
                                    >
                                        {(!failedItems || failedItems.length === 0) ? (
                                            <div className="px-4 py-8 text-center text-gray-400 text-sm">No failed shipments</div>
                                        ) : (
                                            failedItems.map((item, i) => (
                                                <div key={i} className="px-4 py-3 flex gap-3 items-start hover:bg-gray-50 transition-colors">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        <XCircle size={14} className="text-[#EA1B40]" />
                                                    </div>
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="font-mono text-xs font-bold text-gray-800">
                                                            {item.awbNo}
                                                        </span>
                                                        <span className="text-xs text-gray-500 leading-relaxed break-words">
                                                            {item.error}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* OK Items List (in Success variant or OK tab of warning) */}
                            {((isSuccess) || (isWarning && activeTab === "ok")) && (
                                <div className="rounded-xl border border-green-100 overflow-hidden shadow-sm">
                                    <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 flex items-center gap-2">
                                        <CheckCheck size={14} className="text-green-600" />
                                        <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                                            {okItems?.length ?? 0} shipment{okItems?.length !== 1 ? "s" : ""} calculated successfully
                                        </span>
                                    </div>
                                    <div
                                        className="divide-y divide-gray-100 overflow-y-auto"
                                        style={{ maxHeight: isSuccess ? "400px" : "280px" }}
                                    >
                                        {(!okItems || okItems.length === 0) ? (
                                            <div className="px-4 py-8 text-center text-gray-400 text-sm">No successful shipments</div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-gray-50">
                                                {okItems.map((item, i) => (
                                                    <div key={i} className="px-4 py-3 flex gap-3 items-center hover:bg-green-50/30 transition-colors">
                                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                            <CheckCheck size={12} className="text-green-600" />
                                                        </div>
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <span className="font-mono text-xs font-bold text-gray-800 truncate">
                                                                {item.awbNo}
                                                            </span>
                                                            {item.service && (
                                                                <span className="text-[10px] text-gray-400 truncate">{item.service}</span>
                                                            )}
                                                        </div>
                                                        {item.grandTotal !== undefined && (
                                                            <span className="ml-auto text-xs font-semibold text-green-700">
                                                                ₹{Number(item.grandTotal).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Key–value rows (info / error variant) ── */}
                    {!isWarning && rows && rows.length > 0 && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100">
                            {rows.map((row, i) => (
                                <div key={i} className="flex justify-between items-center px-5 py-3 text-sm">
                                    <span className="text-gray-500 font-medium">{row.label}</span>
                                    <span className="text-gray-900 font-semibold text-right">{row.value}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Confirm variant detail pill (service + count) ── */}
                    {isConfirm && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 px-5 py-4 text-sm text-gray-600 leading-relaxed">
                            Proceeding will recalculate and save all displayed shipments. This cannot be undone.
                        </div>
                    )}
                </div>

                {/* ─────────── FOOTER ─────────── */}
                <div className="px-7 pb-6 pt-3 border-t border-gray-100 flex gap-3 justify-end">
                    {isConfirm && (
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold transition-colors"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        onClick={isConfirm ? onConfirm : onClose}
                        className={`px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-sm active:scale-95 ${isSuccess
                            ? "bg-green-600 hover:bg-green-700 font-bold"
                            : "bg-[#EA1B40] hover:bg-[#c91535]"
                            }`}
                    >
                        {isConfirm ? confirmLabel : "Close"}
                    </button>
                </div>
            </div>

            <style jsx>{`
        @keyframes acModalIn {
          from { opacity: 0; transform: translateY(-14px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
      `}</style>
        </div>
    );
};

export default AutoCalcModal;
