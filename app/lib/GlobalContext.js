"use client";
import React, { createContext, useRef, useState } from "react";

export const GlobalContext = createContext(); // Create the context

export const GlobalProvider = ({ children }) => {
  const [toggleCodeList, setToggleCodeList] = useState(false); // Controls which entity is selected
  const [activeTabs, setActiveTabs] = useState([]);
  const [currentTab, setCurrentTab] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [eventCode, setEventCode] = useState([]);
  const [cities, setCities] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [refetch, setRefetch] = useState(false);
  const [zones, setZones] = useState([]);
  const [rates, setRates] = useState([]);
  const [actualWtt, setActualWtt] = useState(0);
  const server = process.env.NEXT_PUBLIC_SERVER;
  const [hub, setHub] = useState([]);
  const [counterpart, setCounterPart] = useState([]);
  const [globalTotalPcs, setGlobalTotalPcs] = useState(0);
  const [ticket, setTicket] = useState(null);

  const [codeListConfig, setCodeListConfig] = useState(null);
  const activeCodeListRef = useRef(null);


  // Tab Data Cache - NEW
  const [tabDataCache, setTabDataCache] = useState({});
  const [mountedTabs, setMountedTabs] = useState(new Set([0])); // Track which tabs are mounted

  // Get cached data for a specific tab
  const getCachedData = (tabName) => {
    return tabDataCache[tabName] || null;
  };

  // Set cached data for a specific tab with timestamp
  const setCachedData = (tabName, data) => {
    setTabDataCache((prev) => ({
      ...prev,
      [tabName]: {
        data,
        timestamp: Date.now(),
      },
    }));
  };

  // Clear cache for a specific tab
  const clearCachedData = (tabName) => {
    setTabDataCache((prev) => {
      const newCache = { ...prev };
      delete newCache[tabName];
      return newCache;
    });
  };

  // Clear all cached data
  const clearAllCache = () => {
    setTabDataCache({});
  };

  // Check if cache is still valid (default: 5 minutes)
  const isCacheValid = (tabName, maxAgeMinutes = 5) => {
    const cached = tabDataCache[tabName];
    if (!cached) return false;

    const ageInMinutes = (Date.now() - cached.timestamp) / (1000 * 60);
    return ageInMinutes < maxAgeMinutes;
  };

  return (
    <GlobalContext.Provider
      value={{
        toggleCodeList,
        setToggleCodeList,
        activeTabs,
        setActiveTabs,
        currentTab,
        setCurrentTab,
        server,
        countries,
        setCountries,
        states,
        setStates,
        cities,
        setCities,
        accounts,
        setAccounts,
        branches,
        setBranches,
        refetch,
        setRefetch,
        sectors,
        setSectors,
        zones,
        setZones,
        rates,
        setRates,
        actualWtt,
        setActualWtt,
        hub,
        setHub,
        counterpart,
        setCounterPart,
        globalTotalPcs,
        setGlobalTotalPcs,
        eventCode,
        setEventCode,
        ticket,
        setTicket,
        // NEW: Cache management functions
        tabDataCache,
        getCachedData,
        setCachedData,
        clearCachedData,
        clearAllCache,
        isCacheValid,
        mountedTabs,
        setMountedTabs,
        // CodeList fix
        activeCodeListRef,
        codeListConfig,
        setCodeListConfig,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};