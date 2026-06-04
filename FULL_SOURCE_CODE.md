# الكود المصدري الكامل | Full Source Code

## index.html

```html
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>نظام إدارة المدرسة | School Management System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

---

## src/main.tsx

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

---

## src/App.tsx

```tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n, { initializeDirection } from './i18n';
import { ToastProvider } from './components/ui/Toast';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Branches } from './pages/Branches';
import { AcademicYears } from './pages/AcademicYears';
import { Users } from './pages/Users';
import { Roles } from './pages/Roles';
import { AuditLogs } from './pages/AuditLogs';
import { Grades } from './pages/Grades';
import { AcademicStructure } from './pages/AcademicStructure';
import { Subjects } from './pages/Subjects';
import { SubjectMapping } from './pages/SubjectMapping';
import { GradingScales } from './pages/GradingScales';
import { Students } from './pages/Students';
import { ExamSeating } from './pages/ExamSeating';
import { ComingSoon } from './pages/ComingSoon';
import { useAuthStore } from './stores/authStore';
import { useAppStore } from './stores/appStore';

const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  moduleCode?: string;
}> = ({ children, moduleCode }) => {
  const { isAuthenticated, hasPermission } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (moduleCode && !hasPermission(moduleCode, 'read')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { language } = useAppStore();

  useEffect(() => {
    initializeDirection();
  }, []);

  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<ProtectedRoute moduleCode="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="branches" element={<ProtectedRoute moduleCode="branches"><Branches /></ProtectedRoute>} />
              <Route path="academic-years" element={<ProtectedRoute moduleCode="academicYears"><AcademicYears /></ProtectedRoute>} />
              <Route path="users" element={<ProtectedRoute moduleCode="users"><Users /></ProtectedRoute>} />
              <Route path="roles" element={<ProtectedRoute moduleCode="roles"><Roles /></ProtectedRoute>} />
              <Route path="audit-logs" element={<ProtectedRoute moduleCode="auditLogs"><AuditLogs /></ProtectedRoute>} />
              <Route path="academic-structure" element={<ProtectedRoute moduleCode="grades"><AcademicStructure /></ProtectedRoute>} />
              <Route path="grades" element={<ProtectedRoute moduleCode="grades"><Grades /></ProtectedRoute>} />
              <Route path="subjects" element={<ProtectedRoute moduleCode="subjects"><Subjects /></ProtectedRoute>} />
              <Route path="subject-mapping" element={<ProtectedRoute moduleCode="subjects"><SubjectMapping /></ProtectedRoute>} />
              <Route path="grading-scales" element={<ProtectedRoute moduleCode="settings"><GradingScales /></ProtectedRoute>} />
              <Route path="students" element={<ProtectedRoute moduleCode="students"><Students /></ProtectedRoute>} />
              <Route path="exam-seating" element={<ProtectedRoute moduleCode="students"><ExamSeating /></ProtectedRoute>} />
              <Route path="fees" element={<ProtectedRoute moduleCode="fees"><ComingSoon /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute moduleCode="reports"><ComingSoon /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </I18nextProvider>
  );
}

export default App;
```

---

## src/index.css

```css
@import "tailwindcss";

body {
  font-family: 'Cairo', 'Inter', sans-serif;
}

[dir="ltr"] body {
  font-family: 'Inter', 'Cairo', sans-serif;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.dark ::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark ::-webkit-scrollbar-thumb {
  background: #475569;
}

@keyframes slide-in-rtl {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-in-ltr {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

[dir="rtl"] .animate-slide-in {
  animation: slide-in-rtl 0.3s ease-out;
}

[dir="ltr"] .animate-slide-in {
  animation: slide-in-ltr 0.3s ease-out;
}

[dir="rtl"] .ps-64 { padding-inline-start: 16rem; }
[dir="rtl"] .ps-20 { padding-inline-start: 5rem; }
[dir="rtl"] .start-64 { inset-inline-start: 16rem; }
[dir="rtl"] .start-20 { inset-inline-start: 5rem; }
[dir="rtl"] .start-0 { inset-inline-start: 0; }
[dir="rtl"] .end-0 { inset-inline-end: 0; }
[dir="rtl"] .border-e { border-inline-end-width: 1px; }
[dir="rtl"] .border-s { border-inline-start-width: 1px; }
[dir="rtl"] .ms-1 { margin-inline-start: 0.25rem; }
[dir="rtl"] .ms-4 { margin-inline-start: 1rem; }
[dir="rtl"] .ps-3 { padding-inline-start: 0.75rem; }
[dir="rtl"] .ps-4 { padding-inline-start: 1rem; }
[dir="rtl"] .ps-10 { padding-inline-start: 2.5rem; }
[dir="rtl"] .ps-16 { padding-inline-start: 4rem; }
[dir="rtl"] .pe-3 { padding-inline-end: 0.75rem; }
[dir="rtl"] .pe-4 { padding-inline-end: 1rem; }
[dir="rtl"] .pe-10 { padding-inline-end: 2.5rem; }
[dir="rtl"] .text-start { text-align: start; }
[dir="rtl"] .text-end { text-align: end; }

*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

@media print {
  .no-print { display: none !important; }
}
```

---

## src/types/database.ts

```typescript
export interface LocalizedText {
  ar: string;
  en: string;
}

export interface Branch {
  id: string;
  name: LocalizedText;
  code: string;
  address: LocalizedText;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  branchId: string;
  name: LocalizedText;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  name: LocalizedText;
  order: number;
  nextGradeId: string | null;
  branchId: string;
  isActive: boolean;
}

export interface Section {
  id: string;
  gradeId: string;
  academicYearId: string;
  name: LocalizedText;
  capacity: number;
  isActive: boolean;
}

export interface PermissionModule {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  parentId: string | null;
  order: number;
  actions: PermissionAction[];
}

export interface PermissionAction {
  code: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'approve';
  name: LocalizedText;
}

export interface Role {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  branchId: string | null;
  isSystem: boolean;
  permissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  moduleCode: string;
  actions: string[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: LocalizedText;
  lastName: LocalizedText;
  phone: string;
  avatar?: string;
  roleId: string;
  branchIds: string[];
  currentBranchId: string;
  currentAcademicYearId: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

export interface Student {
  id: string;
  studentNumber: string;
  firstName: LocalizedText;
  lastName: LocalizedText;
  dateOfBirth: string;
  gender: 'male' | 'female';
  branchId: string;
  currentGradeId: string;
  currentSectionId: string;
  academicYearId: string;
  status: 'active' | 'graduated' | 'transferred' | 'withdrawn';
  enrollmentDate: string;
  isActive: boolean;
}

export interface Subject {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EducationLevel {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  order: number;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedGrade {
  id: string;
  educationLevelId: string;
  name: LocalizedText;
  code: string;
  order: number;
  nextGradeId: string | null;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedSection {
  id: string;
  gradeId: string;
  academicYearId: string;
  name: LocalizedText;
  code: string;
  capacity: number;
  teacherId?: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectGradeMapping {
  id: string;
  subjectId: string;
  gradeId: string;
  academicYearId: string;
  maxMarks: number;
  minPassingMarks: number;
  creditHours?: number;
  isCore: boolean;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GradeWeightDistribution {
  id: string;
  subjectGradeMappingId: string;
  componentName: LocalizedText;
  componentCode: string;
  weightPercentage: number;
  maxMarks: number;
  order: number;
  isActive: boolean;
}

export interface GradingScale {
  id: string;
  name: LocalizedText;
  branchId: string;
  gradeId?: string;
  evaluationType: 'numerical' | 'alphabetical' | 'descriptive';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GradingScaleLevel {
  id: string;
  gradingScaleId: string;
  grade: LocalizedText;
  minPercentage: number;
  maxPercentage: number;
  gpa?: number;
  description: LocalizedText;
  color: string;
  order: number;
}

export interface EnhancedStudent {
  id: string;
  studentNumber: string;
  firstName: LocalizedText;
  middleName?: LocalizedText;
  lastName: LocalizedText;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationalId?: string;
  nationality?: string;
  religion?: string;
  bloodType?: string;
  photo?: string;
  branchId: string;
  educationLevelId: string;
  currentGradeId: string;
  currentSectionId: string;
  academicYearId: string;
  enrollmentDate: string;
  status: 'active' | 'graduated' | 'transferred' | 'withdrawn' | 'suspended';
  guardianName: LocalizedText;
  guardianPhone: string;
  guardianEmail?: string;
  address?: LocalizedText;
  medicalNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSeatingNumber {
  id: string;
  studentId: string;
  academicYearId: string;
  gradeId: string;
  sectionId: string;
  seatingNumber: string;
  examPeriod: string;
  generatedAt: string;
  isManualOverride: boolean;
  branchId: string;
}
```

---

## src/i18n/index.ts

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';

const resources = {
  ar: { translation: arTranslations },
  en: { translation: enTranslations },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export const changeLanguage = (lang: 'ar' | 'en') => {
  i18n.changeLanguage(lang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  localStorage.setItem('language', lang);
  localStorage.setItem('direction', dir);
};

export const initializeDirection = () => {
  const savedLang = localStorage.getItem('language') || 'ar';
  const dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = savedLang;
};

export default i18n;
```

---

## src/stores/authStore.ts

```typescript
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
        if (role.permissions.some(p => p.moduleCode === '*' && p.actions.includes('*'))) {
          return true;
        }
        const modulePermission = role.permissions.find(p => p.moduleCode === moduleCode);
        return modulePermission?.actions.includes(action) || false;
      },

      hasAnyPermission: (moduleCode: string, actions: string[]): boolean => {
        const { role } = get();
        if (!role) return false;
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
```

---

## src/stores/appStore.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch, AcademicYear } from '../types/database';

interface AppState {
  currentBranch: Branch | null;
  currentAcademicYear: AcademicYear | null;
  sidebarOpen: boolean;
  language: 'ar' | 'en';
  direction: 'rtl' | 'ltr';
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
```

---

## src/utils/security.ts

```typescript
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+966|966|0)?5[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts = 5, windowMs = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const loginRateLimiter = new RateLimiter(5, 60000);
```

---

## src/hooks/useLocalizedValue.ts

```typescript
import { useAppStore } from '../stores/appStore';
import type { LocalizedText } from '../types/database';

export const useLocalizedValue = () => {
  const { language } = useAppStore();

  const getLocalizedValue = (text: LocalizedText | undefined | null): string => {
    if (!text) return '';
    return text[language] || text.ar || text.en || '';
  };

  return { getLocalizedValue, language };
};

export const getLocalizedText = (text: LocalizedText, language: 'ar' | 'en'): string => {
  return text[language] || text.ar || text.en || '';
};
```

---

## ملاحظة | Note

هذا الملف يحتوي على الأجزاء الرئيسية من الكود. للحصول على الكود الكامل، يرجى مراجعة الملفات الأصلية في المشروع.

This file contains the main parts of the code. For the complete code, please refer to the original files in the project.

---

*تم التصدير بتاريخ: 2024*
