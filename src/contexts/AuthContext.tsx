import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, LoginCredentials, AuthState, UserRole } from '@/types';
import { setAuthToken } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'propel_auth_token';
const USER_KEY = 'propel_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const userStr = localStorage.getItem(USER_KEY);

      if (token && userStr) {
        try {
          const user = JSON.parse(userStr) as User;
          setAuthToken(token); // Ensure API service has the token
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setAuthToken(null);
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } else {
        setAuthToken(null);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();

    // Listen for storage events (e.g. logout in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY || e.key === USER_KEY) {
        initAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    // Call the actual backend API
    const { authApi, setAuthToken } = await import('@/services/api');

    const response = await authApi.login(credentials);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Login failed');
    }

    const { token, user: userData } = response.data;

    // Map backend user data to frontend User type
    const user: User = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role as UserRole,
      organization_id: userData.organization_id,
      organization_name: userData.organization_name,
      is_active: true,
      is_password_set: true,
    };

    // Store token in API service
    setAuthToken(token);

    // Store in localStorage
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));

    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    // Call backend logout (currently client-side only)
    const { authApi, setAuthToken } = await import('@/services/api');
    await authApi.logout();

    // Clear token from API service
    setAuthToken(null);

    // Clear localStorage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const hasRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!state.user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
