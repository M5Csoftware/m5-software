"use client";
import React from "react";
import { AlertTriangle } from "lucide-react";

export const AlertModal = ({
  isOpen,
  onClose,
  awbNo,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center z-[9999] px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-modalSlideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-8 pt-7 pb-5 border-b border-gray-200 text-center">
          <p className="text-sm font-medium text-gray-500 tracking-wide">
            AWB NUMBER
          </p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">
            {awbNo || "--"}
          </p>
        </div>

        {/* ERROR BLOCK */}
        <div className="px-8 py-5">
          <div className="w-full bg-rose-200 border border-[#EA1B40] rounded-xl p-5 flex gap-3">
            <AlertTriangle className="text-[#EA1B40] w-6 h-6 flex-shrink-0 mt-1" />

            <p className="text-gray-900 whitespace-pre-line leading-relaxed text-[15px]">
              {message}
            </p>
          </div>

          {/* Info Note */}
          <div className="flex gap-2 mt-5 text-gray-600 text-sm">
            <svg
              className="w-5 h-5 text-[#EA1B40] flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="leading-snug">
              This AWB has active alerts. Please review carefully before
              continuing with any operations.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 pb-6 pt-4 border-t bg-gray-50 rounded-b-2xl border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-[#EA1B40] hover:bg-[#EA1B40] text-white rounded-lg font-semibold shadow-sm transition-all active:scale-[0.97]"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
