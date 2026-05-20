// src/context/AuthProvider.jsx
import { useState } from "react";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  // Solo el token se persiste en localStorage.
  // El objeto usuario NO se guarda nunca en localStorage por seguridad;
  // se obtiene en tiempo real con authApi.getUsuarioActual() cuando se necesita.
  const [token, setToken] = useState(localStorage.getItem("access_token") ?? null);

  function login(accessToken) {
    setToken(accessToken);
    localStorage.setItem("access_token", accessToken);
  }

  function logout() {
    setToken(null);
    localStorage.removeItem("access_token");
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
