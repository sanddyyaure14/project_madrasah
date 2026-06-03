import React, { createContext, useContext, useState } from 'react';

export const API_URL = 'http://20.5.29.105:3000/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // LOGIN → POST /auth/login → dapat JWT → simpan user & token
  async function login(email, password) {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        return { ok: false, error: data.message };
      }

      const mappedRole = data.user.role === 'kepala_sekolah' ? 'superadmin' : data.user.role;

      setUser({
        id: data.user.id,
        name: data.user.nama_lengkap,
        email: data.user.email,
        role: mappedRole,
      });
      setToken(data.accessToken);

      return { ok: true, userRole: mappedRole };
    } catch (error) {
      console.error('Login error:', error);
      return { ok: false, error: 'Tidak dapat terhubung ke server. Pastikan backend berjalan.' };
    }
  }

  // REGISTER → POST /auth/register → kirim data guru ke backend
  async function register(userData) {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!data.success) {
        return { ok: false, error: data.message };
      }

      return { ok: true };
    } catch (error) {
      console.error('Register error:', error);
      return { ok: false, error: 'Tidak dapat terhubung ke server. Pastikan backend berjalan.' };
    }
  }

  // GET INSTITUTIONS → GET /auth/institutions → ambil daftar madrasah
  async function getInstitutions() {
    try {
      const res = await fetch(`${API_URL}/auth/institutions`);
      const data = await res.json();
      if (!data.success) return [];
      return data.data ?? [];
    } catch (error) {
      console.error('Get institutions error:', error);
      return [];
    }
  }

  function logout() {
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, getInstitutions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
