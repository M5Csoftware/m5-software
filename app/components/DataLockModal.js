// app/components/DataLockModal.js
"use client";
import React from "react";
import { SimpleButton } from "./Buttons";

const DataLockModal = ({ isOpen, onClose, awbNo, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[480px] p-6">
        {/* Header */}
        <div className="flex justify-center items-center gap-3 mr-[10%] mb-4">
          <div className="w-8 h-8 rounded-full bg-red flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Data Locked</h3>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-3 text-center tracking-wide text-sm">
            {message || `AWB Number ${awbNo} is locked and cannot be edited`}
          </p>

          <div className="mt-4 bg-misty-rose border border-red rounded-md p-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Note:</span> Locked shipments
              cannot be modified. Please contact administrator if you need to
              make changes.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <SimpleButton name="OK" onClick={onClose} />
        </div>
      </div>
    </div>
  );
};

export default DataLockModal;
