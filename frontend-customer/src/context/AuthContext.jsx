import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);

  const fetchMe = async () => {
    try { const { data } = await api.get('/customers/me'); setUser(data); }
    catch { setUser(null); }
  };

  useEffect(() => { fetchMe(); }, []);

  const login = async (email, password) => {
    await api.post('/auth/customer/login', { email, password });
    await fetchMe();
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout, fetchMe }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
