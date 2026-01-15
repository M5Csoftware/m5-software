"use client";
import { useState } from "react";

const PasswordModal = ({
    isOpen,
    onClose,
    onSuccess,
    title = "Enter Password",
    description = "Please enter password to continue",
}) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = () => {
        if (password === "12345678") {
            onSuccess();
            setPassword("");
            setError("");
        } else {
            setError("Incorrect password. Please try again.");
        }
    };

    const handleCancel = () => {
        setPassword("");
        setError("");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6 mx-4">
                {/* Header */}
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                <p className="text-sm text-gray-500 mt-1">{description}</p>

                {/* Error */}
                {error && (
                    <div className="mt-4 p-3 rounded bg-red-100 text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Input */}
                <div className="mt-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        autoFocus
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        placeholder="Enter password"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA1B40]"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-sm border rounded-md hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm bg-[#EA1B40] text-white rounded-md hover:bg-[#d01636]"
                    >
                        Verify
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PasswordModal;
