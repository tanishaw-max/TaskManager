import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("rbac_user");
    const storedToken = localStorage.getItem("rbac_token");
    if (storedUser && storedToken) {
      api.setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("rbac_user", JSON.stringify(userData));
    localStorage.setItem("rbac_token", token);
    api.setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("rbac_user");
    localStorage.removeItem("rbac_token");
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

