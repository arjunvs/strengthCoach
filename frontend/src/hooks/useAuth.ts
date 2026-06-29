import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';

export function useAuth() {
  const { user, token, setAuth, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/');
    },
    [setAuth, navigate],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await authApi.register(email, password, name);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/');
    },
    [setAuth, navigate],
  );

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    storeLogout();
    navigate('/login');
  }, [storeLogout, navigate]);

  return { user, token, isAuthenticated: !!token, login, register, logout };
}
