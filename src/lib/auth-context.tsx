'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { authenticatedFetch } from './utils';

interface AuthUser extends Pick<User, 'name' | 'email' | 'role'> {
  id: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await authenticatedFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const login = useCallback((userData: AuthUser) => {
    // Store user data in localStorage
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Handle token expiration by checking API responses
  useEffect(() => {
    const handleApiError = (event: CustomEvent) => {
      if (event.detail?.status === 401) {
        // Only logout if we have a user in state (avoid false positives)
        if (user) {
          console.log('Authentication failed, logging out user');
          localStorage.removeItem('user');
          setUser(null);
          router.push('/login');
        }
      }
    };

    window.addEventListener('api-error', handleApiError as EventListener);
    return () => {
      window.removeEventListener('api-error', handleApiError as EventListener);
    };
  }, [router, user]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
