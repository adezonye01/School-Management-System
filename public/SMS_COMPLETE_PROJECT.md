# 🏫 نظام إدارة المدرسة الخاصة الشامل
# Private School Management System (SMS)

[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)](https://vitejs.dev/)

---

## 📋 جدول المحتويات | Table of Contents

1. [نظرة عامة | Overview](#overview)
2. [المميزات | Features](#features)
3. [التثبيت | Installation](#installation)
4. [بيانات الدخول | Login Credentials](#credentials)
5. [هيكل المشروع | Project Structure](#structure)
6. [الكود المصدري الكامل | Full Source Code](#source-code)
7. [الترجمات | Translations](#translations)

---

<a name="overview"></a>
## 🌟 نظرة عامة | Overview

نظام متكامل لإدارة المدارس الخاصة مع دعم كامل للغة العربية (RTL) والإنجليزية (LTR).

A comprehensive private school management system with full Arabic (RTL) and English (LTR) support.

### التقنيات المستخدمة | Tech Stack
- ⚛️ React 18 + TypeScript
- 🎨 Tailwind CSS
- 📦 Zustand (State Management)
- 🌐 i18next (Internationalization)
- 🚀 Vite (Build Tool)

---

<a name="features"></a>
## ✨ المميزات | Features

### الجزء الأول | Part 1: Core Architecture
- ✅ دعم ثنائي اللغة (العربية افتراضياً)
- ✅ نظام تعدد الفروع
- ✅ إدارة السنوات الدراسية مع الترحيل
- ✅ نظام صلاحيات ديناميكي (RBAC)
- ✅ إدارة المستخدمين والأدوار
- ✅ سجل النشاطات والتدقيق

### الجزء الثاني | Part 2: Academic Management
- ✅ الهيكل الأكاديمي (مراحل، صفوف، فصول)
- ✅ إدارة المواد الدراسية
- ✅ ربط المواد بالصفوف
- ✅ نظام توزيع الدرجات المرن
- ✅ سلالم الدرجات (رقمي، حرفي، وصفي)
- ✅ إدارة الطلاب الشاملة
- ✅ توليد أرقام الجلوس

---

<a name="installation"></a>
## 🚀 التثبيت | Installation

```bash
# استنساخ المشروع
git clone [repository-url]
cd school-management-system

# تثبيت الحزم
npm install

# تشغيل خادم التطوير
npm run dev

# بناء للإنتاج
npm run build
```

---

<a name="credentials"></a>
## 🔐 بيانات الدخول | Login Credentials

```
👤 اسم المستخدم | Username: admin
🔑 كلمة المرور | Password: admin123
```

---

<a name="structure"></a>
## 📁 هيكل المشروع | Project Structure

```
school-management-system/
├── public/
│   └── SMS_COMPLETE_PROJECT.md
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       ├── Modal.tsx
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── Table.tsx
│   │       ├── Checkbox.tsx
│   │       └── Toast.tsx
│   ├── data/
│   │   ├── mockData.ts
│   │   └── academicData.ts
│   ├── hooks/
│   │   └── useLocalizedValue.ts
│   ├── i18n/
│   │   ├── index.ts
│   │   └── locales/
│   │       ├── ar.json
│   │       └── en.json
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Branches.tsx
│   │   ├── AcademicYears.tsx
│   │   ├── Users.tsx
│   │   ├── Roles.tsx
│   │   ├── Grades.tsx
│   │   ├── AcademicStructure.tsx
│   │   ├── Subjects.tsx
│   │   ├── SubjectMapping.tsx
│   │   ├── GradingScales.tsx
│   │   ├── Students.tsx
│   │   ├── ExamSeating.tsx
│   │   ├── AuditLogs.tsx
│   │   └── ComingSoon.tsx
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── appStore.ts
│   │   ├── dataStore.ts
│   │   └── academicStore.ts
│   ├── types/
│   │   └── database.ts
│   ├── utils/
│   │   └── security.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

<a name="source-code"></a>
## 💻 الكود المصدري الكامل | Full Source Code

### 📄 index.html

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

### 📄 package.json

```json
{
  "name": "school-management-system",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0",
    "i18next-browser-languagedetector": "^7.2.0",
    "zustand": "^4.4.0",
    "lucide-react": "^0.294.0",
    "@headlessui/react": "^1.7.0",
    "clsx": "^2.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

### 📄 src/main.tsx

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

### 📄 src/App.tsx

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

// Protected Route Component
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
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute moduleCode="dashboard">
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="branches"
                element={
                  <ProtectedRoute moduleCode="branches">
                    <Branches />
                  </ProtectedRoute>
                }
              />

              <Route
                path="academic-years"
                element={
                  <ProtectedRoute moduleCode="academicYears">
                    <AcademicYears />
                  </ProtectedRoute>
                }
              />

              <Route
                path="users"
                element={
                  <ProtectedRoute moduleCode="users">
                    <Users />
                  </ProtectedRoute>
                }
              />

              <Route
                path="roles"
                element={
                  <ProtectedRoute moduleCode="roles">
                    <Roles />
                  </ProtectedRoute>
                }
              />

              <Route
                path="audit-logs"
                element={
                  <ProtectedRoute moduleCode="auditLogs">
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />

              {/* Academic Management Routes */}
              <Route
                path="academic-structure"
                element={
                  <ProtectedRoute moduleCode="grades">
                    <AcademicStructure />
                  </ProtectedRoute>
                }
              />

              <Route
                path="grades"
                element={
                  <ProtectedRoute moduleCode="grades">
                    <Grades />
                  </ProtectedRoute>
                }
              />

              <Route
                path="subjects"
                element={
                  <ProtectedRoute moduleCode="subjects">
                    <Subjects />
                  </ProtectedRoute>
                }
              />

              <Route
                path="subject-mapping"
                element={
                  <ProtectedRoute moduleCode="subjects">
                    <SubjectMapping />
                  </ProtectedRoute>
                }
              />

              <Route
                path="grading-scales"
                element={
                  <ProtectedRoute moduleCode="settings">
                    <GradingScales />
                  </ProtectedRoute>
                }
              />

              <Route
                path="students"
                element={
                  <ProtectedRoute moduleCode="students">
                    <Students />
                  </ProtectedRoute>
                }
              />

              <Route
                path="exam-seating"
                element={
                  <ProtectedRoute moduleCode="students">
                    <ExamSeating />
                  </ProtectedRoute>
                }
              />

              {/* Placeholder routes */}
              <Route
                path="fees"
                element={
                  <ProtectedRoute moduleCode="fees">
                    <ComingSoon />
                  </ProtectedRoute>
                }
              />

              <Route
                path="reports"
                element={
                  <ProtectedRoute moduleCode="reports">
                    <ComingSoon />
                  </ProtectedRoute>
                }
              />

              {/* Catch all */}
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

### 📄 src/index.css

```css
@import "tailwindcss";

/* Custom Fonts */
body {
  font-family: 'Cairo', 'Inter', sans-serif;
}

[dir="ltr"] body {
  font-family: 'Inter', 'Cairo', sans-serif;
}

/* Scrollbar Styling */
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

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark ::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark ::-webkit-scrollbar-thumb {
  background: #475569;
}

/* Toast Animation */
@keyframes slide-in-rtl {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slide-in-ltr {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

[dir="rtl"] .animate-slide-in {
  animation: slide-in-rtl 0.3s ease-out;
}

[dir="ltr"] .animate-slide-in {
  animation: slide-in-ltr 0.3s ease-out;
}

/* RTL Support */
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

/* Focus States */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Print Styles */
@media print {
  .no-print {
    display: none !important;
  }
}
```

---

### 📄 src/types/database.ts

```typescript
// Database Schema Types for School Management System
// Supports multi-branch, multi-academic year, and bilingual data

export interface LocalizedText {
  ar: string;
  en: string;
}

// Branch Management
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

// Academic Year Management
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

// Grade/Class Level
export interface Grade {
  id: string;
  name: LocalizedText;
  order: number;
  nextGradeId: string | null;
  branchId: string;
  isActive: boolean;
}

// Section/Class
export interface Section {
  id: string;
  gradeId: string;
  academicYearId: string;
  name: LocalizedText;
  capacity: number;
  isActive: boolean;
}

// Permission Module Definition
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

// Role Definition
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

// User Management
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

// Audit Log for Security
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

// Student
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

// Subject (Bilingual)
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

// Education Level (Kindergarten, Primary, Secondary)
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

// Enhanced Grade with Education Level
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

// Enhanced Section
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

// Subject Assignment to Grades
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

// Weight Distribution for Grading
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

// Grading Scale Configuration
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

// Grading Scale Levels
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

// Enhanced Student
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

// Exam Seating Number
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

### 📄 src/i18n/index.ts

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
    lng: 'ar', // Default language is Arabic
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

// Function to change language and direction
export const changeLanguage = (lang: 'ar' | 'en') => {
  i18n.changeLanguage(lang);
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  localStorage.setItem('language', lang);
  localStorage.setItem('direction', dir);
};

// Initialize direction on load
export const initializeDirection = () => {
  const savedLang = localStorage.getItem('language') || 'ar';
  const dir = savedLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = savedLang;
};

export default i18n;
```

---

### 📄 src/stores/authStore.ts

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
```

---

### 📄 src/stores/appStore.ts

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

### 📄 src/utils/security.ts

```typescript
// Security utilities for input sanitization and validation

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

### 📄 src/hooks/useLocalizedValue.ts

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

<a name="translations"></a>
## 🌐 الترجمات | Translations

### 📄 src/i18n/locales/ar.json (مختصر)

```json
{
  "common": {
    "appName": "نظام إدارة المدرسة",
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "add": "إضافة",
    "search": "بحث",
    "active": "نشط",
    "inactive": "غير نشط",
    "yes": "نعم",
    "no": "لا",
    "confirm": "تأكيد",
    "loading": "جاري التحميل...",
    "noData": "لا توجد بيانات",
    "success": "تمت العملية بنجاح",
    "error": "حدث خطأ"
  },
  "auth": {
    "login": "تسجيل الدخول",
    "logout": "تسجيل الخروج",
    "username": "اسم المستخدم",
    "password": "كلمة المرور",
    "loginTitle": "تسجيل الدخول إلى النظام"
  },
  "sidebar": {
    "dashboard": "لوحة التحكم",
    "branches": "الفروع",
    "academicYears": "السنوات الدراسية",
    "users": "المستخدمين",
    "roles": "الأدوار والصلاحيات",
    "students": "الطلاب",
    "grades": "المراحل الدراسية",
    "subjects": "المواد الدراسية",
    "examSeating": "أرقام الجلوس",
    "academicStructure": "الهيكل الأكاديمي"
  },
  "educationLevels": {
    "title": "المراحل التعليمية",
    "kindergarten": "رياض الأطفال",
    "primary": "المرحلة الابتدائية",
    "intermediate": "المرحلة المتوسطة",
    "secondary": "المرحلة الثانوية"
  },
  "grading": {
    "excellent": "ممتاز",
    "veryGood": "جيد جداً",
    "good": "جيد",
    "acceptable": "مقبول",
    "fail": "راسب"
  },
  "examSeating": {
    "title": "أرقام الجلوس",
    "generateNumbers": "توليد أرقام الجلوس",
    "seatingNumber": "رقم الجلوس"
  }
}
```

---

## 🔐 الصلاحيات | Permissions

| الوحدة | Module | الإجراءات | Actions |
|--------|--------|-----------|---------|
| لوحة التحكم | dashboard | عرض | read |
| الفروع | branches | إنشاء، عرض، تعديل، حذف | CRUD |
| السنوات الدراسية | academicYears | إنشاء، عرض، تعديل، حذف، ترحيل | CRUD + approve |
| المستخدمين | users | إنشاء، عرض، تعديل، حذف | CRUD |
| الأدوار | roles | إنشاء، عرض، تعديل، حذف | CRUD |
| الطلاب | students | إنشاء، عرض، تعديل، حذف، تصدير، استيراد | CRUD + export/import |
| الصفوف | grades | إنشاء، عرض، تعديل، حذف | CRUD |
| المواد | subjects | إنشاء، عرض، تعديل، حذف | CRUD |

---

## 👥 الأدوار الافتراضية | Default Roles

1. **مدير النظام** (System Admin) - صلاحيات كاملة
2. **مدير المدرسة** (Principal) - إدارة المدرسة
3. **محاسب** (Accountant) - الشؤون المالية
4. **مسجل** (Registrar) - تسجيل الطلاب
5. **معلم** (Teacher) - صلاحيات محدودة

---

## 📞 الدعم | Support

للمساعدة أو الاستفسارات، يرجى التواصل معنا.

---

## 📜 الترخيص | License

MIT License © 2024

---

**تم التطوير بـ ❤️ لإدارة المدارس الخاصة**

*Built with ❤️ for Private School Management*
