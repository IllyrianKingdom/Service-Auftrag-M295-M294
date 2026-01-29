import React, { createContext, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    if (user) {
      localStorage.setItem("sa_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("sa_user");
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("auth_token");
    }
  }, [user]);

  // Login mit User-Daten vom Backend
  const login = (userData) => {
    if (userData && userData.id) {
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    // Optional: Logout-Endpoint aufrufen
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
