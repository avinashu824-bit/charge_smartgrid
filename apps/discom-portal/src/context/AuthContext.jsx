import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const VALID_CREDENTIALS = {
  'admin@bescom.gov.in': { password: 'admin123', role: 'discom_admin', name: 'Rajan Sharma', designation: 'Grid Operations Manager' },
  'operator@bescom.gov.in': { password: 'pass123', role: 'operator', name: 'Priya Venkatesh', designation: 'Substation Operator' },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 900)); // simulate network
    setLoading(false);

    const cred = VALID_CREDENTIALS[email];
    if (cred && cred.password === password) {
      const u = { email, role: cred.role, name: cred.name, designation: cred.designation };
      setUser(u);
      return { success: true, user: u };
    }
    return { success: false, error: 'Invalid credentials. Try admin@bescom.gov.in / admin123' };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
