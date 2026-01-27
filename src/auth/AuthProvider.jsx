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
    }
  }, [user]);

  // Login with email and password
  const login = (email, password) => {
    const users = [
        { id: 1, email: 'benutzer1@example.com', password: 'password123', name: 'Benutzer 1' },
        { id: 2, email: 'benutzer2@example.com', password: 'password123', name: 'Benutzer 2' },
        { id: 3, email: 'benutzer3@example.com', password: 'password123', name: 'Benutzer 3' },
        { id: 4, email: 'benutzer4@example.com', password: 'password123', name: 'Benutzer 4' }
    ];
    
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      const userData = {
        user_id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name
      };
      setUser(userData);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

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
