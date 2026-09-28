import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  roles: any[];
  permissions: string[];
}

interface AuthState {
  session_id: string | null;
  user: User | null;
  login: (session_id: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session_id: null,
      user: null,
      login: (session_id, user) => set({ session_id, user }),
      logout: () => {
        set({ session_id: null, user: null });
        window.location.href = '/login';
      },
    }),
    {
      name: 'evolix-auth',
    }
  )
);
