import { useState } from "react";
import { RedLabelHeading } from "../Heading";

export default function ChildAccountsManager() {
  const [linkedAccounts, setLinkedAccounts] = useState([
    "JP003",
    "JP002",
    "JP006",
  ]);
  const [unlinkedAccounts, setUnlinkedAccounts] = useState(["JP004", "JP005"]);
  const [inputValue, setInputValue] = useState("");

  // Step 1 → Always add to Unlinked box on Enter
  const handleAddAccount = (e) => {
    if (e) e.preventDefault();
    const trimmedValue = inputValue.trim().toUpperCase();
    if (!trimmedValue) return;

    // If it already exists in either list → show alert, don't add
    if (
      linkedAccounts.includes(trimmedValue) ||
      unlinkedAccounts.includes(trimmedValue)
    ) {
      alert(`Account ${trimmedValue} already exists!`);
      return;
    }

    setUnlinkedAccounts((prev) => [...prev, trimmedValue]);
    setInputValue(""); // clear input only if added
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddAccount();
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Step 2 → Move from Unlinked → Linked
  const addToLinked = (accountId) => {
    setUnlinkedAccounts((prev) => prev.filter((id) => id !== accountId));
    setLinkedAccounts((prev) => [...prev, accountId]);
  };

  // Step 3 → Delete completely from Linked
  const removeFromLinked = (accountId) => {
    setLinkedAccounts((prev) => prev.filter((id) => id !== accountId));
  };

  return (
    <div className="bg-white">
      {/* Input box */}
      <div className="mb-6">
        <div className="flex flex-col gap-3">
          <RedLabelHeading label={"Child setting"} />
          <input
            id="accountInput"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter account ID (e.g., JP009) and press Enter"
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
          />
        </div>
      </div>

      <div className="flex gap-6 border border-[#979797] items-center justify-center p-4 w-[450px]">
        {/* Linked Accounts */}
        <div className="space-y-3">
          <RedLabelHeading label={"Link to Parent - Credit Limit"} />
          <div className="bg-gray-300 rounded-lg p-2 h-28 w-[173px]">
            <div className="flex flex-wrap gap-3">
              {linkedAccounts.map((accountId) => (
                <button
                  key={accountId}
                  onClick={() => removeFromLinked(accountId)}
                  className="flex items-center gap-2 bg-white rounded-md text-gray-800 font-medium hover:bg-gray-100 transition-colors px-2 py-1"
                >
                  <span>{accountId}</span>
                  <span className="text-gray-500 hover:text-red-500 text-lg">
                    ×
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Unlinked Accounts */}
        <div className="space-y-3">
          <RedLabelHeading label={"Unlinked Accounts"} />
          <div className="bg-gray-300 rounded-lg p-2 h-28 w-[173px]">
            <div className="flex flex-wrap gap-3">
              {unlinkedAccounts.map((accountId) => (
                <button
                  key={accountId}
                  onClick={() => addToLinked(accountId)}
                  className="flex items-center gap-2 bg-white rounded-md text-gray-800 font-medium hover:bg-gray-100 transition-colors px-2 py-1"
                >
                  <span className="text-gray-500 hover:text-green-500 text-lg">
                    +
                  </span>
                  <span>{accountId}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
