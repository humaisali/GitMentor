/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../services/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        // Token is invalid or expired
        localStorage.removeItem('gitmentor_token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('gitmentor_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('gitmentor_token');
    if (!token) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }

    let active = true;
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async response => {
      if (!response.ok) throw new Error('Session expired.');
      const data = await response.json();
      if (active) setUser(data);
    }).catch(() => {
      localStorage.removeItem('gitmentor_token');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const loginWithToken = (token) => {
    localStorage.setItem('gitmentor_token', token);
    fetchUser(token);
  };

  const logout = () => {
    localStorage.removeItem('gitmentor_token');
    setUser(null);
  };

  const refreshUser = () => {
    const token = localStorage.getItem('gitmentor_token');
    if (token) return fetchUser(token);
    return Promise.resolve();
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithToken, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
