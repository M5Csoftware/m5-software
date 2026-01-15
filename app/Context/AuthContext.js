"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { GlobalContext } from "../lib/GlobalContext";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setActiveTabs, setCurrentTab } = useContext(GlobalContext);

  useEffect(() => {
    // Load from either localStorage or sessionStorage
    const savedUser =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    const savedToken =
      sessionStorage.getItem("token") || localStorage.getItem("token");

    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, userToken, rememberMe = false) => {
    const fullUser = {
      userId: userData.userId,
      userName: userData.userName,
      email: userData.email,
      role: userData.role,
      branch: userData.branch,
      hub: userData.hub,
      department: userData.department,
      dashboardAccess: userData.dashboardAccess || [],
      permissions: userData.permissions || {},
    };

    if (rememberMe) {
      localStorage.setItem("user", JSON.stringify(fullUser));
      localStorage.setItem("token", userToken);
    } else {
      sessionStorage.setItem("user", JSON.stringify(fullUser));
      sessionStorage.setItem("token", userToken);
    }

    setUser(fullUser);
    setToken(userToken);
    setActiveTabs([]);
    setCurrentTab(null);
  };

  const logout = () => {
    // Clear both storages just in case
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
    setToken(null);
    setActiveTabs([]);
    setCurrentTab(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
