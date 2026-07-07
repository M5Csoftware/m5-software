"use client";
import React, { useContext, useEffect, useState } from "react";
import { GlobalContext } from "../lib/GlobalContext";
import Image from "next/image";
import { SimpleButton } from "./Buttons";
import { useAuth } from "../Context/AuthContext";
import UpdateNotification from "./UpdateNotification";
import io from "socket.io-client";

const NODE_SERVER =
  process.env.NEXT_PUBLIC_CHAT_SERVER || "http://localhost:5000";

function Tabs() {
  const { activeTabs, setActiveTabs, currentTab, setCurrentTab, server } =
    useContext(GlobalContext);

  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [unreadTaskCount, setUnreadTaskCount] = useState(0);
  const { logout, user } = useAuth();

  // Real-time unread task count via Fastify Socket.io (No polling!)
  useEffect(() => {
    if (!user?.userId) return;

    // 1. Initial REST fetch for robustness & immediate load
    const fetchInitialCount = async () => {
      try {
        const response = await fetch(
          `${NODE_SERVER}/tasks/unread-count?userId=${user.userId}`,
        );
        const data = await response.json();
        if (data.success) {
          setUnreadTaskCount(data.count || 0);
        }
      } catch (error) {
        console.error("Failed to fetch initial unread tasks:", error);
      }
    };
    fetchInitialCount();

    // 2. Establish Socket.io connection for real-time pushed updates
    const socket = io(NODE_SERVER, {
      transports: ["websocket"],
      upgrade: false,
    });

    socket.emit("join_chat", user.userId);

    socket.on("task_unread_count", ({ count }) => {
      setUnreadTaskCount(count);
    });

    return () => {
      socket.close();
    };
  }, [user?.userId]);

  const handleOpenTaskChat = () => {
    const TAB_NAME = "Task & Chat Organiser";
    const already = activeTabs.find((t) => t.subfolder === TAB_NAME);
    if (!already) {
      setActiveTabs((prev) => [
        ...prev,
        { folder: "Organiser", subfolder: TAB_NAME },
      ]);
    }
    setCurrentTab(TAB_NAME);
    // Clear badge when user opens the tab
    setUnreadTaskCount(0);
  };

  const handleClose = (folder, subfolder) => {
    const newActiveTabs = activeTabs.filter(
      (item) => !(item.folder === folder && item.subfolder === subfolder),
    );

    if (newActiveTabs.length === 0) {
      setCurrentTab(null);
    } else if (currentTab === subfolder) {
      const currentIndex = activeTabs.findIndex(
        (item) => item.subfolder === currentTab,
      );
      const previousTab = newActiveTabs[currentIndex - 1] || newActiveTabs[0];
      setCurrentTab(previousTab.subfolder);
    }

    setActiveTabs(newActiveTabs);
  };

  // Close all open tabs at once
  const handleCloseAll = () => {
    setActiveTabs([]);
    setCurrentTab(null);
  };

  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutPopup(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        const currentIndex = activeTabs.findIndex(
          (item) => item.subfolder === currentTab,
        );
        const nextIndex =
          currentIndex === activeTabs.length - 1 ? 0 : currentIndex + 1;
        setCurrentTab(activeTabs[nextIndex].subfolder);
      }

      if (e.ctrlKey && e.shiftKey && e.key === "Tab") {
        e.preventDefault();
        const currentIndex = activeTabs.findIndex(
          (item) => item.subfolder === currentTab,
        );
        const prevIndex =
          currentIndex === 0 ? activeTabs.length - 1 : currentIndex - 1;
        setCurrentTab(activeTabs[prevIndex].subfolder);
      }

      if (e.ctrlKey && e.key === "F4") {
        e.preventDefault();
        const tabToClose = activeTabs.find(
          (item) => item.subfolder === currentTab,
        );
        if (tabToClose) {
          handleClose(tabToClose.folder, tabToClose.subfolder);
        }
      }

      if (e.key === "Escape" && showLogoutPopup) {
        setShowLogoutPopup(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTabs, currentTab, setCurrentTab, showLogoutPopup]);

  return (
    <>
      <div className="h-10 sticky top-0 flex border-b font-medium text-xs justify-between bg-white z-50">
        <div className="flex-1 overflow-x-auto hidden-scrollbar">
          <ul
            className={`h-10 flex font-medium text-xs ${
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
                <div className="flex items-center justify-between relative h-full w-full flex-nowrap">
                  <div
                    className={`absolute bottom-0 rounded-md left-0 right-0 ${
                      currentTab === item.subfolder
                        ? "border-t-2 border-red"
                        : ""
                    }`}
                  ></div>
                  <span className="text-black h-2 flex justify-center items-center flex-nowrap">
                    {item.subfolder}
                  </span>
                  <button
                    className="flex justify-center items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClose(item.folder, item.subfolder);
                    }}
                  >
                    <Image
                      src="/close.svg"
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

        <div className="flex items-center gap-1 justify-center px-4 bg-gray-50 border-l sticky right-0  z-50">
          {activeTabs.length > 1 && (
            <button
              onClick={handleCloseAll}
              title="Close All Tabs"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              <Image src="/close.svg" alt="close all" width={14} height={14} />
              <span>Close All</span>
            </button>
          )}

          <UpdateNotification variant="topbar" />

          {/* ── TASK & CHAT ORGANISER BUTTON ── */}
          <button
            onClick={handleOpenTaskChat}
            title="Task & Chat Organiser"
            className="relative flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            <div className="relative w-[17px] h-[17px]">
              <img
                src="/hourglass.png"
                alt="Tasks"
                className="w-full h-full object-contain"
                style={{
                  filter:
                    "invert(20%) sepia(100%) saturate(700%) hue-rotate(340deg) brightness(90%)",
                }}
              />
              {unreadTaskCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center text-white rounded-full font-bold"
                  style={{
                    backgroundColor: "#dc2626",
                    fontSize: "8px",
                    minWidth: "14px",
                    height: "14px",
                    padding: "0 3px",
                  }}
                >
                  {unreadTaskCount > 99 ? "99+" : unreadTaskCount}
                </span>
              )}
            </div>
            <span>Tasks</span>
          </button>
          {/* ── END ── */}

          <button
            onClick={handleLogoutClick}
            className="flex items-center justify-center hover:opacity-80 transition-opacity whitespace-nowrap"
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
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
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
