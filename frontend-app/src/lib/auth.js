import React, { createContext, useContext, useState } from 'react';

const USERS = {
  'kepala@madrasah.id': {
    id: 'u-001',
    name: 'Dr. H. Mahmud Siregar, M.Pd.',
    title: 'Kepala Madrasah',
    email: 'kepala@madrasah.id',
    password: 'admin1234',
    role: 'superadmin',
  },
  'ustadz@madrasah.id': {
    id: 'u-002',
    name: 'Ust. Ahmad Fauzi, S.Pd.I.',
    title: 'Guru Fiqih',
    email: 'ustadz@madrasah.id',
    password: 'guru1234',
    role: 'guru',
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(email, password) {
    const found = USERS[email];
    if (!found) return { ok: false, error: 'Email tidak ditemukan.' };
    if (found.password !== password) return { ok: false, error: 'Password salah.' };
    setUser(found);
    return { ok: true };
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
