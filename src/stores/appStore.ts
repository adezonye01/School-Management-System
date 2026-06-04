import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch, AcademicYear } from '../types/database';

interface AppState {
  // Current context
  currentBranch: Branch | null;
  currentAcademicYear: AcademicYear | null;
  
  // UI State
  sidebarOpen: boolean;
  language: 'ar' | 'en';
  direction: 'rtl' | 'ltr';
  
  // Actions
  setCurrentBranch: (branch: Branch | null) => void;
  setCurrentAcademicYear: (year: AcademicYear | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setLanguage: (lang: 'ar' | 'en') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentBranch: null,
      currentAcademicYear: null,
      sidebarOpen: true,
      language: 'ar',
      direction: 'rtl',

      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      setCurrentAcademicYear: (year) => set({ currentAcademicYear: year }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setLanguage: (lang) => set({ 
        language: lang, 
        direction: lang === 'ar' ? 'rtl' : 'ltr' 
      }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        currentBranch: state.currentBranch,
        currentAcademicYear: state.currentAcademicYear,
        sidebarOpen: state.sidebarOpen,
        language: state.language,
        direction: state.direction,
      }),
    }
  )
);
