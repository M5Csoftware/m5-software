// "use client";
// import React, { useContext } from "react";
// import { GlobalContext } from "@/app/lib/GlobalContext";

// export function CloseButton({
//   label = "Close",
//   tabKey, // 👈 pass the unique tab key when using this button
//   className = "",
// }) {
//   const { activeTabs, setActiveTabs, setCurrentTab } =
//     useContext(GlobalContext);

//   const handleClose = () => {
//     // 1️⃣ Remove this tab from activeTabs
//     setActiveTabs((prevTabs) => {
//       const newTabs = prevTabs.filter((tab) => tab.key !== tabKey);

//       // If the closed tab was the current one → fallback to Dashboard (0) or last tab
//       if (newTabs.length > 0) {
//         setCurrentTab(newTabs[newTabs.length - 1].label);
//       } else {
//         setCurrentTab("Dashboard");
//       }

//       return newTabs;
//     });

//     // 2️⃣ Reload page to refresh forms/inputs
//     if (typeof window !== "undefined") {
//       setTimeout(() => {
//         window.location.reload();
//       }, 300); // slight delay so tab closes before reload
//     }
//   };

//   return (
//     <button
//       type="button"
//       onClick={handleClose}
//       className={`border border-red text-red font-semibold text-sm rounded-md px-12 py-2.5 flex items-center justify-center gap-2 hover:bg-[#00000033] transition-all ${className}`}
//     >
//       <span>{label}</span>
//     </button>
//   );
// }
"use client";
import React, { useContext, useState } from "react";
import { GlobalContext } from "@/app/lib/GlobalContext";
import { useForm } from "react-hook-form";

export function CloseButton({
  label = "Close",
  tabKey,
  className = "",
}) {
  const { activeTabs, setActiveTabs, setCurrentTab } =
    useContext(GlobalContext);

  // ✅ Form controller to reset fields
  const { reset } = useForm();

  // ✅ Local states to mimic your handleRefresh logic
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [toggleCodeList, setToggleCodeList] = useState(false);

  // ✅ Internal handleRefresh logic
  const handleRefresh = () => {
    console.log("🔄 Refresh clicked - Force refetch from API");
    reset();                  // clear form fields
    setError("");             // clear error
    setApiError("");          // clear API error
    setRefreshKey((prev) => prev + 1); // force refresh
    setToggleCodeList(false); // reset toggle
  };

  const handleClose = () => {
    // 1️⃣ Clear all fields and states
    handleRefresh();

    // 2️⃣ Close the tab visually
    setActiveTabs((prevTabs) => prevTabs.filter((tab) => tab.key !== tabKey));

    // 3️⃣ Switch to last tab or Dashboard
    const remainingTabs = activeTabs.filter((tab) => tab.key !== tabKey);
    if (remainingTabs.length > 0) {
      setCurrentTab(remainingTabs[remainingTabs.length - 1].label);
    } else {
      setCurrentTab("Dashboard");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClose}
      className={`border border-red text-red font-semibold text-sm rounded-md px-12 py-2.5 flex items-center justify-center gap-2 hover:bg-[#00000033] transition-all ${className}`}
    >
      <span>{label}</span>
    </button>
  );
}
