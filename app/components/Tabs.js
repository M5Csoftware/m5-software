"use client";
import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../lib/GlobalContext";
import Image from "next/image";
import { SimpleButton } from "./Buttons";
import { useAuth } from "../Context/AuthContext";

function Tabs() {
  const { activeTabs, setActiveTabs, currentTab, setCurrentTab } =
    useContext(GlobalContext);

  // State for logout popup
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);

  const { logout } = useAuth();

  // Handle close tab action
  const handleClose = (folder, subfolder) => {
    const newActiveTabs = activeTabs.filter(
      (item) => !(item.folder === folder && item.subfolder === subfolder),
    );

    // If the current tab is the last tab and is removed, set the previous tab as current tab
    if (newActiveTabs.length === 0) {
      setCurrentTab(null); // If no tabs remain, set current tab to null
    } else if (currentTab === subfolder) {
      const currentIndex = activeTabs.findIndex(
        (item) => item.subfolder === currentTab,
      );
      const previousTab = newActiveTabs[currentIndex - 1] || newActiveTabs[0]; // Get the previous tab or first tab
      setCurrentTab(previousTab.subfolder);
    }

    // Update activeTabs after removing the tab
    setActiveTabs(newActiveTabs);
  };

  // Handle logout button click
  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  // Handle logout confirmation
  const handleLogoutConfirm = () => {
    // Add your logout logic here
    // console.log("User logged out");

    // Example logout actions:
    // - Clear user session
    // - Clear local storage
    // - Redirect to login page
    // - Reset global state

    // Close popup
    setShowLogoutPopup(false);

    // You can add your logout logic here, for example:
    // localStorage.clear();
    // router.push('/login');
  };

  // Handle logout cancellation
  const handleLogoutCancel = () => {
    setShowLogoutPopup(false);
  };

  // Handle Ctrl + Tab, Ctrl + Shift + Tab, and Ctrl + F4 keypress to switch tabs or close tab
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Detect Ctrl + Tab (Next tab)
      if (e.ctrlKey && e.key === "Tab" && !e.shiftKey) {
        e.preventDefault(); // Prevent default behavior of Ctrl + Tab (browser switching tabs)

        // Find the current tab index
        const currentIndex = activeTabs.findIndex(
          (item) => item.subfolder === currentTab,
        );

        // Determine the next tab index (wrap around to the first tab if current tab is the last one)
        const nextIndex =
          currentIndex === activeTabs.length - 1 ? 0 : currentIndex + 1;

        // Set the current tab to the next tab
        setCurrentTab(activeTabs[nextIndex].subfolder);
      }

      // Detect Ctrl + Shift + Tab (Previous tab)
      if (e.ctrlKey && e.shiftKey && e.key === "Tab") {
        e.preventDefault(); // Prevent default behavior of Ctrl + Shift + Tab (browser switching tabs)

        // Find the current tab index
        const currentIndex = activeTabs.findIndex(
          (item) => item.subfolder === currentTab,
        );

        // Determine the previous tab index (wrap around to the last tab if current tab is the first one)
        const prevIndex =
          currentIndex === 0 ? activeTabs.length - 1 : currentIndex - 1;

        // Set the current tab to the previous tab
        setCurrentTab(activeTabs[prevIndex].subfolder);
      }

      // Detect Ctrl + F4 (Close current tab)
      if (e.ctrlKey && e.key === "F4") {
        e.preventDefault(); // Prevent default behavior of Ctrl + F4 (browser tab closing)

        // Find and remove the current tab from the activeTabs list
        const tabToClose = activeTabs.find(
          (item) => item.subfolder === currentTab,
        );
        if (tabToClose) {
          handleClose(tabToClose.folder, tabToClose.subfolder);
        }
      }

      // Close popup on Escape key
      if (e.key === "Escape" && showLogoutPopup) {
        setShowLogoutPopup(false);
      }
    };

    // Attach the keydown event listener to the document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTabs, currentTab, setCurrentTab, showLogoutPopup]);

  return (
    <>
      <div className="h-10 sticky top-0 flex border-b font-medium text-xs justify-between">
        <div>
          <ul
            className={`h-10 sticky top-0 flex border-b font-medium text-xs overflow-x-auto max-w-[80.8vw] hidden-scrollbar ${
              activeTabs.length < 1 ? "hidden" : ""
            }`}
          >
            {activeTabs.map((item, index) => (
              <li
                onClick={() => setCurrentTab(item.subfolder)}
                className={`cursor-pointer min-w-36 border-x px-1 flex flex-nowrap ${
                  currentTab === item.subfolder ? "bg-white-smoke " : "bg-white"
                }`}
                key={index}
              >
                <div
                  className={`flex items-center justify-between relative h-full w-full flex-nowrap`}
                >
                  <div
                    className={`absolute bottom-0 rounded-md left-0 right-0  ${
                      currentTab === item.subfolder
                        ? "border-t-2 border-red"
                        : ""
                    } `}
                  ></div>
                  <span
                    className={`text-black h-2 flex justify-center items-center flex-nowrap `}
                  >
                    {item.subfolder}
                  </span>
                  <button
                    className="flex justify-center items-center"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent click event from triggering the tab selection
                      handleClose(item.folder, item.subfolder); // Handle the close action
                    }}
                  >
                    <Image
                      src={`/close.svg`}
                      alt="close"
                      width={16}
                      height={16}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-center px-4 bg-gray-50 border-r min-w-fit">
          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logout.svg"
              alt="Logout"
              width={19}
              height={20}
              className="object-contain"
            />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Popup */}
      {showLogoutPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999]">
          <div className="absolute top-14 right-6 bg-white rounded-lg shadow-lg p-2 max-w-sm w-[208px] h-26 flex flex-col gap-2">
            <div className="relative">
              <button
                onClick={handleLogoutCancel}
                className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Image
                  src="/cross.svg"
                  alt="cross"
                  width={11}
                  height={11}
                  className="text-red-600"
                />
              </button>

              <div className="flex justify-center text-center items-center">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center ">
                  <Image
                    src="/logout.svg"
                    alt="Logout"
                    width={20}
                    height={20}
                    className="text-red-600"
                  />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Logging Out?
                </h3>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex">
              <SimpleButton name={"Logout"} onClick={logout} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Tabs;
