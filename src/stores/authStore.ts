import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types/database';

interface AuthState {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (user: User, role: Role, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  hasPermission: (moduleCode: string, action: string) => boolean;
  hasAnyPermission: (moduleCode: string, actions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isAuthenticated: false,
      token: null,

      login: (user, role, token) => {
        set({ user, role, isAuthenticated: true, token });
      },

      logout: () => {
        set({ user: null, role: null, isAuthenticated: false, token: null });
        localStorage.removeItem('auth-storage');
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      hasPermission: (moduleCode: string, action: string): boolean => {
        const { role } = get();
        if (!role) return false;

        // Super admin check
        if (role.permissions.some(p => p.moduleCode === '*' && p.actions.includes('*'))) {
          return true;
        }

        const modulePermission = role.permissions.find(p => p.moduleCode === moduleCode);
        return modulePermission?.actions.includes(action) || false;
      },

      hasAnyPermission: (moduleCode: string, actions: string[]): boolean => {
        const { role } = get();
        if (!role) return false;

        // Super admin check
        if (role.permissions.some(p => p.moduleCode === '*' && p.actions.includes('*'))) {
          return true;
        }

        const modulePermission = role.permissions.find(p => p.moduleCode === moduleCode);
        if (!modulePermission) return false;

        return actions.some(action => modulePermission.actions.includes(action));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);
