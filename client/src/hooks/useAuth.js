import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, refreshToken, setAuth, clearAuth } = useAuthStore();

  const isAuthenticated = !!token;
  const isStudent = user?.role === 'student';
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    token,
    refreshToken,
    isAuthenticated,
    isStudent,
    isClient,
    isAdmin,
    setAuth,
    clearAuth,
  };
};
