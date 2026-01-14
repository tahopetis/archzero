import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api';
import api from '@/lib/api';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const data = response.data;

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
          });

          // Store token in localStorage for axios interceptor
          localStorage.setItem('auth_token', data.token);
        } catch (error) {
          console.error('Login error:', error);

          // Extract error message from axios error
          let errorMessage = 'Login failed';
          if (error && typeof error === 'object') {
            const err = error as any;

            // Axios HTTP error with response
            if (err.response?.data?.error) {
              errorMessage = err.response.data.error;
            }
            // Network error (no response)
            else if (err.message) {
              errorMessage = err.message;
            }
          }

          throw new Error(errorMessage);
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      },

      setUser: (user: User) => set({ user }),
      setToken: (token: string) => set({ token }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
