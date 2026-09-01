import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string; // Changed to string to support all custom and backend roles (customer, assessor, admin, etc.)
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: user !== null }),
      
      setToken: (token) => set({ token }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setError: (error) => set({ error }),

      login: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        });
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('auth_user', JSON.stringify(user));
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
        }
      },

      initialize: () => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          const userStr = localStorage.getItem('auth_user');
          
          if (token && userStr) {
            try {
              const user = JSON.parse(userStr);
              set({
                token,
                user,
                isAuthenticated: true,
              });
            } catch {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
            }
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);