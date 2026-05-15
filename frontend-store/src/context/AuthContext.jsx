import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [store, setStore] = useState(undefined);

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/stores/me');
      setUser(data.user);
      setStore(data.store);
    } catch { setUser(null); setStore(null); }
  };

  useEffect(() => { fetchMe(); }, []);

  const login = async (slug, email, password) => {
    await api.post('/auth/store/login', { slug, email, password });
    await fetchMe();
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null); setStore(null);
  };

  return <AuthContext.Provider value={{ user, store, login, logout, fetchMe }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
