import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('cs_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (email, password) => {
    // Demo: accept any credentials
    const mockUser = {
      id: 1,
      name: 'Priya Sharma',
      email,
      vehicle: 'Tata Nexon EV',
      token: 'demo_jwt_token_user'
    };
    setUser(mockUser);
    localStorage.setItem('cs_user', JSON.stringify(mockUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cs_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
