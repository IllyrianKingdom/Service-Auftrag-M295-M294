import React, { createContext, useContext, useEffect, useState } from "react";
import { API_ENDPOINTS } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("sa_user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Direkt initialisieren
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Speichere user in localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem("sa_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("sa_user");
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("auth_token");
    }
  }, [user]);

  const login = (userData) => {
    if (userData && userData.id) {
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = async () => {
    try {
      await fetch(API_ENDPOINTS.logout, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setUser(null);
    }
  };

  if (!isInitialized) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export default AuthContext;
