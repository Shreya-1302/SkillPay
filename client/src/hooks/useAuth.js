import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, token, setAuth, clearAuth } = useAuthStore();

  const isAuthenticated = !!token;
  const isStudent = user?.role === 'student';
  const isClient = user?.role === 'client';
  const isAdmin = user?.role === 'admin';

  return {
    user,
    token,
    isAuthenticated,
    isStudent,
    isClient,
    isAdmin,
    setAuth,
    clearAuth,
  };
};
