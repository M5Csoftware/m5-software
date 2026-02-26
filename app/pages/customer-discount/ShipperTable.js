"use client";
import { OutlinedButtonRed, SimpleButton } from "@/app/components/Buttons";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { Button } from "@mui/material";
import React, { useCallback, useContext, useState, useEffect } from "react";

const ShipperTable = ({ onAccountCodesSelected }) => {
  const [codes, setCodes] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const { server } = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);
  useEffect(() => {
    if (onAccountCodesSelected) {
      onAccountCodesSelected(codes);
    }
  }, [codes, onAccountCodesSelected]);

  // Extract account codes from input string
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

  // Validate single account code
  const validateAccountCode = useCallback(async (accountCode) => {
    try {
      const response = await fetch(`${server}/customer-account`);

      if (!response.ok) {
        throw new Error("API Error");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response");
      }

      const isValid = data.some(
        (account) =>
          account.accountCode &&
          account.accountCode.toUpperCase() === accountCode.toUpperCase()
      );

      return {
        code: accountCode,
        isValid: isValid,
        status: isValid ? "Valid" : "Invalid",
      };
    } catch (error) {
      return {
        code: accountCode,
        isValid: false,
        status: "Error",
      };
    }
  }, []);

  // Process and validate codes
  const handleProcessCodes = useCallback(async () => {
    if (!inputValue.trim()) return;

    setLoading(true);

    try {
      const extractedCodes = extractAccountCodes(inputValue);

      if (extractedCodes.length === 0) {
        console.log("No valid codes found");
        return;
      }

      const existingCodes = codes.map((c) => c.code.toUpperCase());
      const newCodes = extractedCodes.filter(
        (code) => !existingCodes.includes(code.toUpperCase())
      );

      if (newCodes.length === 0) {
        console.log("All codes already exist");
        return;
      }

      const validatedCodes = await Promise.all(
        newCodes.map((code) => validateAccountCode(code))
      );

      setCodes((prev) => [...prev, ...validatedCodes]);
      setInputValue("");
    } catch (error) {
      console.log("Error processing codes");
    } finally {
      setLoading(false);
    }
  }, [inputValue, codes, extractAccountCodes, validateAccountCode]);

  // Clear all codes
 const handleReset = useCallback(() => {
    setCodes([]);
    setInputValue("");
  }, []);

  return (
    <div>
      <div className="p-4 w-full rounded-lg border border-gray-300 shadow-sm bg-white h-[580px] flex flex-col justify-between">
        <div>
          {/* Input Section */}
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
                  className="border border-red transition-all text-red font-semibold rounded-md  text-sm  py-2.5 px-4"
                  onClick={handleReset}
                  disabled={loading}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Simple Table */}
          <div className="border border-gray-300 rounded overflow-hidden ">
            <div className="max-h-[410px] overflow-y-auto hidden-scrollbar">
              <table className="w-full text-sm ">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left border-b border-gray-300">
                      Code
                    </th>
                    <th className="px-3 py-2 text-center border-b border-gray-300">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((codeObj, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-mono">{codeObj.code}</td>
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
                    </tr>
                  ))}
                  {codes.length === 0 && (
                    <tr>
                      <td
                        colSpan="2"
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

        {/* Simple Stats */}
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
