# نظام إدارة المدرسة الخاصة
# Private School Management System

## نظرة عامة | Overview

نظام شامل لإدارة المدارس الخاصة مبني باستخدام React، Vite، TypeScript، وTailwind CSS مع دعم كامل للغة العربية والإنجليزية.

A comprehensive private school management system built with React, Vite, TypeScript, and Tailwind CSS with full Arabic and English bilingual support.

---

## المميزات الرئيسية | Key Features

### الجزء الأول | Part 1: Core Architecture
- ✅ دعم ثنائي اللغة (العربية الافتراضية/الإنجليزية)
- ✅ نظام تعدد الفروع
- ✅ إدارة السنوات الدراسية
- ✅ نظام الصلاحيات الديناميكي (RBAC)
- ✅ إدارة المستخدمين
- ✅ سجل النشاطات

### الجزء الثاني | Part 2: Academic Management
- ✅ الهيكل الأكاديمي (المراحل التعليمية، الصفوف، الفصول)
- ✅ إدارة المواد الدراسية
- ✅ ربط المواد بالصفوف
- ✅ نظام توزيع الدرجات
- ✅ سلالم الدرجات (رقمي، حرفي، وصفي)
- ✅ إدارة الطلاب
- ✅ أرقام الجلوس

---

## بيانات الدخول التجريبية | Demo Credentials

```
اسم المستخدم | Username: admin
كلمة المرور | Password: admin123
```

---

## هيكل الملفات | File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── MainLayout.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Select.tsx
│       ├── Modal.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Table.tsx
│       ├── Checkbox.tsx
│       └── Toast.tsx
├── data/
│   ├── mockData.ts
│   └── academicData.ts
├── hooks/
│   └── useLocalizedValue.ts
├── i18n/
│   ├── index.ts
│   └── locales/
│       ├── ar.json
│       └── en.json
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Branches.tsx
│   ├── AcademicYears.tsx
│   ├── Users.tsx
│   ├── Roles.tsx
│   ├── Grades.tsx
│   ├── AcademicStructure.tsx
│   ├── Subjects.tsx
│   ├── SubjectMapping.tsx
│   ├── GradingScales.tsx
│   ├── Students.tsx
│   ├── ExamSeating.tsx
│   ├── AuditLogs.tsx
│   └── ComingSoon.tsx
├── stores/
│   ├── authStore.ts
│   ├── appStore.ts
│   ├── dataStore.ts
│   └── academicStore.ts
├── types/
│   └── database.ts
├── utils/
│   └── security.ts
├── App.tsx
├── main.tsx
└── index.css
```

---

## أنواع قاعدة البيانات | Database Types

```typescript
// src/types/database.ts

// النص المترجم | Localized Text
export interface LocalizedText {
  ar: string;
  en: string;
}

// الفروع | Branches
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

// السنوات الدراسية | Academic Years
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

// المراحل التعليمية | Education Levels
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

// الصفوف | Grades
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

// الفصول | Sections
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

// المواد | Subjects
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

// ربط المواد بالصفوف | Subject-Grade Mapping
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

// توزيع الدرجات | Weight Distribution
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

// سلم الدرجات | Grading Scale
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

// مستويات سلم الدرجات | Grading Scale Levels
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

// الطلاب | Students
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// أرقام الجلوس | Exam Seating Numbers
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

// الأدوار | Roles
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

// المستخدمين | Users
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

// سجل النشاطات | Audit Logs
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
```

---

## الترجمات العربية | Arabic Translations

```json
// src/i18n/locales/ar.json (مختصر)
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
    "inactive": "غير نشط"
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
    "examSeating": "أرقام الجلوس"
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

## المكونات الرئيسية | Main Components

### 1. مكون الزر | Button Component

```tsx
// src/components/ui/Button.tsx
import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};
```

### 2. مكون الإدخال | Input Component

```tsx
// src/components/ui/Input.tsx
import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 start-0 ps-3 flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          className={clsx(
            'block w-full rounded-lg border py-2.5',
            leftIcon ? 'ps-10' : 'ps-4',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
```

---

## المتاجر (Stores) | State Management

### 1. متجر المصادقة | Auth Store

```typescript
// src/stores/authStore.ts
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
  hasPermission: (moduleCode: string, action: string) => boolean;
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
      },

      hasPermission: (moduleCode: string, action: string): boolean => {
        const { role } = get();
        if (!role) return false;
        
        // Super admin check
        if (role.permissions.some(p => p.moduleCode === '*')) return true;
        
        const perm = role.permissions.find(p => p.moduleCode === moduleCode);
        return perm?.actions.includes(action) || false;
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### 2. متجر التطبيق | App Store

```typescript
// src/stores/appStore.ts
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
  setLanguage: (lang: 'ar' | 'en') => void;
  toggleSidebar: () => void;
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
      setLanguage: (lang) => set({ 
        language: lang, 
        direction: lang === 'ar' ? 'rtl' : 'ltr' 
      }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: 'app-storage' }
  )
);
```

---

## إعداد i18n | i18n Setup

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslations from './locales/ar.json';
import enTranslations from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: arTranslations },
      en: { translation: enTranslations },
    },
    lng: 'ar', // Default language is Arabic
    fallbackLng: 'ar',
    interpolation: { escapeValue: false },
  });

export const changeLanguage = (lang: 'ar' | 'en') => {
  i18n.changeLanguage(lang);
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

export default i18n;
```

---

## أمثلة الصفحات | Page Examples

### صفحة تسجيل الدخول | Login Page

```tsx
// src/pages/Login.tsx (مختصر)
export const Login: React.FC = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Authentication logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">
          {t('auth.loginTitle')}
        </h2>
        <form onSubmit={handleSubmit}>
          <Input label={t('auth.username')} value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input label={t('auth.password')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full">{t('auth.login')}</Button>
        </form>
      </div>
    </div>
  );
};
```

---

## أنماط CSS المخصصة | Custom CSS Styles

```css
/* src/index.css */
@import "tailwindcss";

body {
  font-family: 'Cairo', 'Inter', sans-serif;
}

[dir="ltr"] body {
  font-family: 'Inter', 'Cairo', sans-serif;
}

/* RTL Support */
[dir="rtl"] .ps-64 { padding-inline-start: 16rem; }
[dir="rtl"] .start-64 { inset-inline-start: 16rem; }
[dir="rtl"] .border-e { border-inline-end-width: 1px; }
[dir="rtl"] .ms-4 { margin-inline-start: 1rem; }
[dir="rtl"] .text-start { text-align: start; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

/* Print */
@media print {
  .no-print { display: none !important; }
}
```

---

## الحزم المستخدمة | Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "i18next": "^23.x",
    "react-i18next": "^13.x",
    "zustand": "^4.x",
    "lucide-react": "^0.x",
    "@headlessui/react": "^1.x",
    "clsx": "^2.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vite": "^5.x",
    "tailwindcss": "^3.x",
    "@types/react": "^18.x"
  }
}
```

---

## التثبيت والتشغيل | Installation & Running

```bash
# تثبيت الحزم | Install dependencies
npm install

# تشغيل خادم التطوير | Run development server
npm run dev

# بناء المشروع للإنتاج | Build for production
npm run build
```

---

## الصلاحيات المتاحة | Available Permissions

| الوحدة | Module | الإجراءات | Actions |
|--------|--------|-----------|---------|
| لوحة التحكم | dashboard | عرض | read |
| الفروع | branches | إنشاء، عرض، تعديل، حذف | create, read, update, delete |
| السنوات الدراسية | academicYears | إنشاء، عرض، تعديل، حذف، ترحيل | create, read, update, delete, approve |
| المستخدمين | users | إنشاء، عرض، تعديل، حذف | create, read, update, delete |
| الأدوار | roles | إنشاء، عرض، تعديل، حذف | create, read, update, delete |
| الطلاب | students | إنشاء، عرض، تعديل، حذف، تصدير، استيراد | create, read, update, delete, export, import |
| الصفوف | grades | إنشاء، عرض، تعديل، حذف | create, read, update, delete |
| المواد | subjects | إنشاء، عرض، تعديل، حذف | create, read, update, delete |
| الرسوم | fees | إنشاء، عرض، تعديل، حذف، موافقة | create, read, update, delete, approve |
| التقارير | reports | عرض، تصدير | read, export |
| الإعدادات | settings | عرض، تعديل | read, update |
| سجل النشاطات | auditLogs | عرض، تصدير | read, export |

---

## الأدوار الافتراضية | Default Roles

1. **مدير النظام** (System Administrator) - صلاحيات كاملة
2. **مدير المدرسة** (School Principal) - إدارة شؤون المدرسة
3. **محاسب** (Accountant) - الشؤون المالية
4. **مسجل** (Registrar) - تسجيل الطلاب
5. **معلم** (Teacher) - صلاحيات محدودة

---

## الميزات القادمة | Upcoming Features (Part 3)

- [ ] شجرة الرسوم (Custom Fee Structure)
- [ ] جدولة الأقساط (Installment Scheduling)
- [ ] نظام الخصومات والمنح (Discount & Scholarship Matrix)
- [ ] خصم الإخوة التلقائي (Sibling Discount Engine)
- [ ] كشف حساب الطالب (Student Account Statement)
- [ ] الفواتير والإيصالات (Invoices & Receipts)

---

## المؤلف | Author

نظام إدارة المدرسة الخاصة - تم تطويره كحل شامل لإدارة المدارس الخاصة.

---

## الترخيص | License

MIT License

---

*آخر تحديث: 2024*
