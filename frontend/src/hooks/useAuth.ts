import { useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

interface User {
  userId: string;
  username: string;
  full_name?: string;
  role: 'student' | 'teacher' | 'admin';
  email?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const currentUser = AuthService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Failed to get current user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    AuthService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const isStudent = user?.role === 'student';

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    logout,
  };
};