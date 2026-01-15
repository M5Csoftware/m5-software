"use client";
import { SimpleButton } from "@/app/components/Buttons";
import { GlobalContext } from "@/app/lib/GlobalContext";
import React, { useCallback, useContext, useState } from "react";
import axios from "axios";

const ShipperTable = ({ onShippersUpdate }) => {
  const [codes, setCodes] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  // Extract account codes (CG001, DL001…)
  const extractAccountCodes = useCallback((input) => {
    if (!input || typeof input !== "string") return [];
    const cleanInput = input.replace(/\s+/g, "").toUpperCase();
    const primaryPattern = /[A-Z]{2}\d{3}/g;
    const primaryMatches = cleanInput.match(primaryPattern) || [];
    if (primaryMatches.length > 0) {
      return [...new Set(primaryMatches)];
    }
    const chunks = cleanInput.match(/.{5}/g) || [];
    return [...new Set(chunks)];
  }, []);

  // Validate account code + fetch billingEmailId
  const validateAccountCode = useCallback(
    async (accountCode) => {
      try {
        const response = await axios.get(`${server}/customer-account`);
        
        if (!Array.isArray(response.data)) throw new Error("Invalid response");

        const account = response.data.find(
          (acc) =>
            acc.accountCode &&
            acc.accountCode.toUpperCase() === accountCode.toUpperCase()
        );

        const isValid = !!account;
        return {
          accNo: accountCode,
          billingEmailId: isValid ? account.billingEmailId || "" : "", // Changed from email to billingEmailId
          isValid,
          status: isValid ? "Valid" : "Invalid",
        };
      } catch (error) {
        console.error("Error validating account code:", error);
        return {
          accNo: accountCode,
          billingEmailId: "", // Changed from email to billingEmailId
          isValid: false,
          status: "Error",
        };
      }
    },
    [server]
  );

  // Remove individual code
  const handleRemoveCode = useCallback((accNoToRemove) => {
    const updatedCodes = codes.filter((code) => code.accNo !== accNoToRemove);
    setCodes(updatedCodes);
    
    // Update parent component
    if (onShippersUpdate) onShippersUpdate(updatedCodes);
  }, [codes, onShippersUpdate]);

  // Process codes
  const handleProcessCodes = useCallback(async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    try {
      const extractedCodes = extractAccountCodes(inputValue);
      if (extractedCodes.length === 0) return;

      const existingCodes = codes.map((c) => c.accNo.toUpperCase());
      const newCodes = extractedCodes.filter(
        (code) => !existingCodes.includes(code.toUpperCase())
      );
      if (newCodes.length === 0) return;

      const validatedCodes = await Promise.all(
        newCodes.map((code) => validateAccountCode(code))
      );

      const updatedCodes = [...codes, ...validatedCodes];
      setCodes(updatedCodes);

      // Send to parent
      if (onShippersUpdate) onShippersUpdate(updatedCodes);

      setInputValue("");
    } catch (error) {
      console.error("Error processing codes:", error);
    } finally {
      setLoading(false);
    }
  }, [inputValue, codes, extractAccountCodes, validateAccountCode, onShippersUpdate]);

  // Reset
  const handleReset = useCallback(() => {
    setCodes([]);
    setInputValue("");
    if (onShippersUpdate) onShippersUpdate([]);
  }, [onShippersUpdate]);

  return (
    <div>
      <div className="p-4 w-[290px] mx-auto rounded-lg border border-gray-300 shadow-sm bg-white h-[590px] flex flex-col justify-between">
        <div>
          {/* Input */}
          <div className="mb-4 space-y-3">
            <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              placeholder="Enter Codes: CG001 DL001 ....."
              className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
            <div className="flex gap-2">
              <SimpleButton
                name={loading ? "loading..." : "Add"}
                onClick={handleProcessCodes}
                disabled={loading || !inputValue.trim()}
              />
              <div className="w-[100px] flex items-center justify-center">
                <button
                  type="button"
                  className="border border-red transition-all text-red font-semibold rounded-md text-sm py-2.5 px-4"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="max-h-[410px] overflow-y-auto hidden-scrollbar">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-300">
                      Code
                    </th>
                    <th className="px-3 py-2 text-center border-b border-gray-300">
                      Status
                    </th>
                    <th className="px-2 py-2 text-center border-b border-gray-300 w-10">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((codeObj, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono">{codeObj.accNo}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            codeObj.isValid
                              ? "bg-green-100 text-green-700"
                              : "bg-red/20 text-red-700"
                          }`}
                        >
                          {codeObj.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center">
                        {/* Show cross (×) button only for valid accounts */}
                        {codeObj.isValid && (
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-6 h-6 flex items-center justify-center font-bold text-lg transition-all"
                            onClick={() => handleRemoveCode(codeObj.accNo)}
                            title={`Remove ${codeObj.accNo}`}
                          >
                            ×
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {codes.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-3 py-4 text-center text-gray-500 text-sm"
                      >
                        No codes added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stats */}
        {codes.length > 0 && (
          <div className="mt-3 flex justify-between text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
            <span>Total: {codes.length}</span>
            <span className="text-green-600">
              Valid: {codes.filter((c) => c.isValid).length}
            </span>
            <span className="text-red">
              Invalid: {codes.filter((c) => !c.isValid).length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipperTable;