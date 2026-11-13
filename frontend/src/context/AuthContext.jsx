import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
  updateProfile as updateProfileRequest,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCurrentUser();
      setUser(response.data.data);
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setUser(null);
      } else {
        setError(requestError.response?.data?.message || 'Could not connect to the server.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const authenticate = async (request) => {
    const response = await request;
    setUser(response.data.data);
    setError('');
    return response.data.data;
  };

  const login = (credentials) => authenticate(loginRequest(credentials));
  const signup = (details) => authenticate(signupRequest(details));

  const updateProfile = async (details) => {
    const response = await updateProfileRequest(details);
    setUser(response.data.data);
    return response.data.data;
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, error, refresh, login, signup, updateProfile, logout }),
    [user, loading, error, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
