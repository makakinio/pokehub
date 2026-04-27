// src/context/AuthProvider.jsx
import { useState } from "react";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") ?? null);
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user") ?? "null")
  );

  function login(accessToken, userData = null) {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem("token", accessToken);
    localStorage.setItem("user", JSON.stringify(userData));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  async function authFetch(url, options = {}) {
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      logout();
      return null;
    }

    return res;
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}