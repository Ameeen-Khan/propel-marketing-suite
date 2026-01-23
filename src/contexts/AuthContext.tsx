import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, LoginCredentials, AuthState, UserRole } from '@/types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'remp_auth_token';
const USER_KEY = 'remp_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state from storage
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    // TODO: Replace with actual API call
    // For now, simulate login with mock data
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock response based on email
    let mockUser: User;
    
    if (credentials.email.includes('super')) {
      mockUser = {
        id: '1',
        email: credentials.email,
        name: 'Super Admin',
        role: 'super_admin',
        is_active: true,
        is_password_set: true,
      };
    } else if (credentials.email.includes('admin')) {
      mockUser = {
        id: '2',
        email: credentials.email,
        name: 'Org Admin',
        role: 'org_admin',
        organization_id: 'org-1',
        organization_name: 'Acme Real Estate',
        is_active: true,
        is_password_set: true,
      };
    } else {
      mockUser = {
        id: '3',
        email: credentials.email,
        name: 'Org User',
        role: 'org_user',
        organization_id: 'org-1',
        organization_name: 'Acme Real Estate',
        is_active: true,
        is_password_set: true,
      };
    }

    const mockToken = 'mock-jwt-token-' + Date.now();

    localStorage.setItem(TOKEN_KEY, mockToken);
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser));

    setState({
      user: mockUser,
      token: mockToken,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
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
