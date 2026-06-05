import { create } from 'zustand';
import api from '../api/client';
import type { User, TokenResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('access_token'),
  loading: false,

  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const res = await api.post<TokenResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const { access_token, user_id, email: userEmail, full_name, is_superuser } = res.data;
    localStorage.setItem('access_token', access_token);

    set({
      token: access_token,
      user: {
        id: user_id || '',
        email: userEmail || email,
        full_name: full_name || '',
        is_active: true,
        is_superuser: !!is_superuser,
        preferences: {},
        created_at: new Date().toISOString(),
      },
    });
  },

  register: async (email, fullName, password) => {
    const res = await api.post<TokenResponse>('/auth/register', {
      email,
      full_name: fullName,
      password,
    });

    const { access_token, user_id } = res.data;
    localStorage.setItem('access_token', access_token);

    set({
      token: access_token,
      user: {
        id: user_id || '',
        email,
        full_name: fullName,
        is_active: true,
        is_superuser: false,
        preferences: {},
        created_at: new Date().toISOString(),
      },
    });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    set({ user: null, token: null });
  },

  fetchUser: async () => {
    try {
      set({ loading: true });
      const res = await api.get<User>('/users/me');
      set({ user: res.data });
    } catch {
      set({ user: null, token: null });
    } finally {
      set({ loading: false });
    }
  },

  updateUser: async (data) => {
    const res = await api.put<User>('/users/me', data);
    set({ user: res.data });
  },
}));