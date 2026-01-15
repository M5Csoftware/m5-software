"use client";

import React from "react";
import { X } from "lucide-react"; // Icon for close button

const Modal = ({ title, onClose, children }) => {
  return (
    <div className="absolute flex items-center top-28 right-[60px] z-50">
      <div className="bg-white rounded-md shadow-lg w-full max-w-3xl p-6 relative border border-gray-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold text-red mb-4">{title}</h2>

        {/* Body Content */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
