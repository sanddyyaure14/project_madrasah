import React, { createContext, useContext, useState } from 'react';
import {
  loginAPI,
  setAuthToken,
  clearAuthToken,
} from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  async function login(email, password) {
    try {
      const response = await loginAPI(email, password);

      if (!response.success) {
        return {
          ok: false,
          error: response.message || 'Login gagal',
        };
      }

      if (response.accessToken) {
        setAuthToken(response.accessToken);
        setToken(response.accessToken);
      }

      setUser(response.user);

      return { ok: true };
    } catch (err) {
      return {
        ok: false,
        error: err.message || 'Terjadi kesalahan saat login',
      };
    }
  }

  function logout() {
    clearAuthToken();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}