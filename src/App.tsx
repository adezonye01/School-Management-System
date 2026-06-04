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
// import { ComingSoon } from './pages/ComingSoon';
import { FeeCategories } from './pages/FeeCategories';
import { FeeAssignment } from './pages/FeeAssignment';
import { InstallmentPlans } from './pages/InstallmentPlans';
import { Discounts } from './pages/Discounts';
import { Invoices } from './pages/Invoices';
import { BehaviorTracking } from './pages/BehaviorTracking';
import { Transport } from './pages/Transport';
import { MarkEntry } from './pages/MarkEntry';
import { StudentDiscounts } from './pages/StudentDiscounts';
import { ReportCards } from './pages/ReportCards';
import { StudentAudit } from './pages/StudentAudit';
import { AdmissionForm } from './pages/AdmissionForm';
import { AdmissionReview } from './pages/AdmissionReview';
import { Promotion } from './pages/Promotion';
import { Reports } from './pages/Reports';
import { SchoolSettings } from './pages/SchoolSettings';
import { StudentSearch } from './pages/StudentSearch';
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
    // Initialize direction on app load
    initializeDirection();
  }, []);

  useEffect(() => {
    // Update direction when language changes
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  return (
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admission" element={<AdmissionForm />} />

            {/* Protected Routes */}
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              <Route
                path="student-search"
                element={<ProtectedRoute moduleCode="students"><StudentSearch /></ProtectedRoute>}
              />

              <Route
                path="school-settings"
                element={<ProtectedRoute moduleCode="settings"><SchoolSettings /></ProtectedRoute>}
              />

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

              {/* Fee Management Routes */}
              <Route
                path="fee-categories"
                element={
                  <ProtectedRoute moduleCode="fees">
                    <FeeCategories />
                  </ProtectedRoute>
                }
              />

              <Route
                path="fee-assignment"
                element={
                  <ProtectedRoute moduleCode="fees">
                    <FeeAssignment />
                  </ProtectedRoute>
                }
              />

              <Route
                path="installments"
                element={
                  <ProtectedRoute moduleCode="fees">
                    <InstallmentPlans />
                  </ProtectedRoute>
                }
              />

              <Route
                path="discounts"
                element={
                  <ProtectedRoute moduleCode="fees">
                    <Discounts />
                  </ProtectedRoute>
                }
              />

              <Route
                path="student-discounts"
                element={
                  <ProtectedRoute moduleCode="fees">
                    <StudentDiscounts />
                  </ProtectedRoute>
                }
              />

              <Route
                path="invoices"
                element={
                  <ProtectedRoute moduleCode="fees">
                    <Invoices />
                  </ProtectedRoute>
                }
              />

              <Route
                path="mark-entry"
                element={
                  <ProtectedRoute moduleCode="students">
                    <MarkEntry />
                  </ProtectedRoute>
                }
              />

              {/* Part 4 Routes */}
              <Route
                path="behavior"
                element={
                  <ProtectedRoute moduleCode="students">
                    <BehaviorTracking />
                  </ProtectedRoute>
                }
              />

              <Route
                path="transport"
                element={
                  <ProtectedRoute moduleCode="settings">
                    <Transport />
                  </ProtectedRoute>
                }
              />

              <Route
                path="promotion"
                element={
                  <ProtectedRoute moduleCode="students">
                    <Promotion />
                  </ProtectedRoute>
                }
              />

              <Route
                path="admission-review"
                element={
                  <ProtectedRoute moduleCode="students">
                    <AdmissionReview />
                  </ProtectedRoute>
                }
              />

              <Route
                path="student-audit"
                element={
                  <ProtectedRoute moduleCode="students">
                    <StudentAudit />
                  </ProtectedRoute>
                }
              />

              <Route
                path="report-cards"
                element={
                  <ProtectedRoute moduleCode="students">
                    <ReportCards />
                  </ProtectedRoute>
                }
              />

              <Route
                path="reports"
                element={
                  <ProtectedRoute moduleCode="reports">
                    <Reports />
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
