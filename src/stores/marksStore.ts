import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  YemenGradeConfig,
  YemenExamPeriodConfig,
  YemenExamPeriod,
  MonthlyComponent,
  MonthlyComponentConfig,
  StudentMark,
} from '../types/database';

// Default Yemen Grade Config
const defaultYemenConfig: YemenGradeConfig = {
  id: 'yemen-config-1',
  name: { ar: 'النظام اليمني القياسي', en: 'Yemen Standard System' },
  code: 'YEMEN-STD',
  monthlyComponents: [
    { component: 'behavior', name: { ar: 'السلوك', en: 'Behavior' }, maxMarks: 20, order: 1 },
    { component: 'homework', name: { ar: 'الواجبات', en: 'Homework' }, maxMarks: 20, order: 2 },
    { component: 'oral', name: { ar: 'الشفهي', en: 'Oral' }, maxMarks: 20, order: 3 },
    { component: 'written', name: { ar: 'التحريري', en: 'Written' }, maxMarks: 40, order: 4 },
  ],
  examPeriods: [
    // Semester 1
    { period: 'monthly_1', name: { ar: 'الشهري الأول', en: '1st Monthly' }, maxMarks: 100, weight: 15, order: 1, semester: 1, isMonthly: true, isActive: true },
    { period: 'monthly_2', name: { ar: 'الشهري الثاني', en: '2nd Monthly' }, maxMarks: 100, weight: 15, order: 2, semester: 1, isMonthly: true, isActive: true },
    { period: 'midterm', name: { ar: 'اختبار نصف العام', en: 'Midterm Exam' }, maxMarks: 100, weight: 70, order: 3, semester: 1, isMonthly: false, isActive: true },
    // Semester 2
    { period: 'monthly_3', name: { ar: 'الشهري الثالث', en: '3rd Monthly' }, maxMarks: 100, weight: 15, order: 4, semester: 2, isMonthly: true, isActive: true },
    { period: 'monthly_4', name: { ar: 'الشهري الرابع', en: '4th Monthly' }, maxMarks: 100, weight: 15, order: 5, semester: 2, isMonthly: true, isActive: true },
    { period: 'final', name: { ar: 'الاختبار النهائي', en: 'Final Exam' }, maxMarks: 100, weight: 70, order: 6, semester: 2, isMonthly: false, isActive: true },
  ],
  branchId: 'branch-1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Sample marks with components
const sampleMarks: StudentMark[] = [
  // Student 1 - Arabic - Monthly 1 (components)
  { id: 'mk-1a', studentId: 'student-1', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'monthly_1', component: 'behavior', semester: 1, academicYearId: 'year-2024-2025', marks: 18, maxMarks: 20, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  { id: 'mk-1b', studentId: 'student-1', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'monthly_1', component: 'homework', semester: 1, academicYearId: 'year-2024-2025', marks: 17, maxMarks: 20, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  { id: 'mk-1c', studentId: 'student-1', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'monthly_1', component: 'oral', semester: 1, academicYearId: 'year-2024-2025', marks: 16, maxMarks: 20, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  { id: 'mk-1d', studentId: 'student-1', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'monthly_1', component: 'written', semester: 1, academicYearId: 'year-2024-2025', marks: 35, maxMarks: 40, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  // Student 1 - Arabic - Midterm
  { id: 'mk-1e', studentId: 'student-1', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'midterm', component: 'exam', semester: 1, academicYearId: 'year-2024-2025', marks: 88, maxMarks: 100, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-12-20T00:00:00Z', updatedAt: '2024-12-20T00:00:00Z' },
  // Student 2 - Arabic - Monthly 1
  { id: 'mk-2a', studentId: 'student-2', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'monthly_1', component: 'behavior', semester: 1, academicYearId: 'year-2024-2025', marks: 15, maxMarks: 20, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  { id: 'mk-2b', studentId: 'student-2', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'monthly_1', component: 'homework', semester: 1, academicYearId: 'year-2024-2025', marks: 12, maxMarks: 20, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  { id: 'mk-2c', studentId: 'student-2', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'monthly_1', component: 'oral', semester: 1, academicYearId: 'year-2024-2025', marks: 14, maxMarks: 20, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
  { id: 'mk-2d', studentId: 'student-2', subjectGradeMappingId: 'map-g1-arabic', examPeriod: 'monthly_1', component: 'written', semester: 1, academicYearId: 'year-2024-2025', marks: 28, maxMarks: 40, isAbsent: false, enteredBy: 'user-admin', enteredAt: '2024-10-15T00:00:00Z', updatedAt: '2024-10-15T00:00:00Z' },
];

interface MarksState {
  yemenConfigs: YemenGradeConfig[];
  studentMarks: StudentMark[];

  getActiveConfig: (branchId: string) => YemenGradeConfig | undefined;
  updateConfig: (id: string, data: Partial<YemenGradeConfig>) => void;
  updatePeriodConfig: (configId: string, period: YemenExamPeriod, data: Partial<YemenExamPeriodConfig>) => void;
  updateComponentConfig: (configId: string, component: MonthlyComponent, data: Partial<MonthlyComponentConfig>) => void;
  getPeriodsForSemester: (branchId: string, semester: 1 | 2) => YemenExamPeriodConfig[];

  // Marks
  getMarks: (subjectMappingId: string, examPeriod: YemenExamPeriod, semester: number, academicYearId: string) => StudentMark[];
  getStudentMarksForSubject: (studentId: string, subjectMappingId: string, academicYearId: string) => StudentMark[];
  bulkSaveMarks: (marks: Omit<StudentMark, 'id' | 'enteredAt' | 'updatedAt' | 'remarks'>[]) => void;

  // Calculations
  getMonthlyTotal: (studentId: string, subjectMappingId: string, period: YemenExamPeriod, academicYearId: string) => number;
  calcSemesterTotal: (studentId: string, subjectMappingId: string, semester: 1 | 2, academicYearId: string, branchId: string) => { monthlyAvg: number; examMark: number; total: number; percentage: number };
  getLetterGrade: (percentage: number) => { ar: string; en: string; color: string };
}

export const useMarksStore = create<MarksState>()(
  persist(
    (set, get) => ({
      yemenConfigs: [defaultYemenConfig],
      studentMarks: sampleMarks,

      getActiveConfig: (branchId) => get().yemenConfigs.find((c) => c.branchId === branchId && c.isActive),

      updateConfig: (id, data) => {
        set((s) => ({ yemenConfigs: s.yemenConfigs.map((c) => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c) }));
      },

      updatePeriodConfig: (configId, period, data) => {
        set((s) => ({
          yemenConfigs: s.yemenConfigs.map((c) => c.id !== configId ? c : {
            ...c,
            examPeriods: c.examPeriods.map((p) => p.period === period ? { ...p, ...data } : p),
            updatedAt: new Date().toISOString(),
          }),
        }));
      },

      updateComponentConfig: (configId, component, data) => {
        set((s) => ({
          yemenConfigs: s.yemenConfigs.map((c) => c.id !== configId ? c : {
            ...c,
            monthlyComponents: c.monthlyComponents.map((mc) => mc.component === component ? { ...mc, ...data } : mc),
            updatedAt: new Date().toISOString(),
          }),
        }));
      },

      getPeriodsForSemester: (branchId, semester) => {
        const config = get().getActiveConfig(branchId);
        if (!config) return [];
        return config.examPeriods.filter((p) => p.semester === semester && p.isActive).sort((a, b) => a.order - b.order);
      },

      getMarks: (subjectMappingId, examPeriod, semester, academicYearId) =>
        get().studentMarks.filter((m) => m.subjectGradeMappingId === subjectMappingId && m.examPeriod === examPeriod && m.semester === semester && m.academicYearId === academicYearId),

      getStudentMarksForSubject: (studentId, subjectMappingId, academicYearId) =>
        get().studentMarks.filter((m) => m.studentId === studentId && m.subjectGradeMappingId === subjectMappingId && m.academicYearId === academicYearId),

      bulkSaveMarks: (marks) => {
        const existing = get().studentMarks;
        const newMarks: StudentMark[] = [];
        const updatedIds = new Set<string>();

        marks.forEach((m) => {
          const found = existing.find((e) =>
            e.studentId === m.studentId && e.subjectGradeMappingId === m.subjectGradeMappingId &&
            e.examPeriod === m.examPeriod && e.component === m.component &&
            e.semester === m.semester && e.academicYearId === m.academicYearId
          );
          if (found) {
            updatedIds.add(found.id);
            newMarks.push({ ...found, marks: m.marks, isAbsent: m.isAbsent, updatedAt: new Date().toISOString() });
          } else {
            newMarks.push({ id: `mk-${uuidv4()}`, ...m, remarks: undefined, enteredAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
          }
        });

        set((s) => ({ studentMarks: [...s.studentMarks.filter((m) => !updatedIds.has(m.id)), ...newMarks] }));
      },

      // Sum all components for a monthly period
      getMonthlyTotal: (studentId, subjectMappingId, period, academicYearId) => {
        return get().studentMarks
          .filter((m) => m.studentId === studentId && m.subjectGradeMappingId === subjectMappingId && m.examPeriod === period && m.academicYearId === academicYearId && m.component !== 'exam')
          .reduce((s, m) => s + (m.isAbsent ? 0 : m.marks), 0);
      },

      calcSemesterTotal: (studentId, subjectMappingId, semester, academicYearId, branchId) => {
        const config = get().getActiveConfig(branchId);
        if (!config) return { monthlyAvg: 0, examMark: 0, total: 0, percentage: 0 };

        const periods = config.examPeriods.filter((p) => p.semester === semester && p.isActive);
        const monthlyPeriods = periods.filter((p) => p.isMonthly);
        const examPeriod = periods.find((p) => !p.isMonthly);

        // Monthly average: average of all monthly totals, then apply weight
        const monthlyTotals = monthlyPeriods.map((p) => get().getMonthlyTotal(studentId, subjectMappingId, p.period, academicYearId));
        const totalMonthlyWeight = monthlyPeriods.reduce((s, p) => s + p.weight, 0);
        
        let monthlyAvg = 0;
        const enteredMonthlies = monthlyTotals.filter((t) => t > 0);
        if (enteredMonthlies.length > 0) {
          const avgPct = enteredMonthlies.reduce((s, t) => s + t, 0) / (enteredMonthlies.length * 100);
          monthlyAvg = Math.round(avgPct * totalMonthlyWeight * 100) / 100;
        }

        // Exam mark
        let examMark = 0;
        if (examPeriod) {
          const examRecord = get().studentMarks.find(
            (m) => m.studentId === studentId && m.subjectGradeMappingId === subjectMappingId &&
            m.examPeriod === examPeriod.period && m.component === 'exam' && m.academicYearId === academicYearId
          );
          if (examRecord) {
            examMark = Math.round((examRecord.isAbsent ? 0 : examRecord.marks) / examPeriod.maxMarks * examPeriod.weight * 100) / 100;
          }
        }

        const total = Math.round((monthlyAvg + examMark) * 100) / 100;
        return { monthlyAvg, examMark, total, percentage: Math.round(total) };
      },

      getLetterGrade: (percentage) => {
        if (percentage >= 90) return { ar: 'ممتاز', en: 'Excellent', color: '#22c55e' };
        if (percentage >= 80) return { ar: 'جيد جداً', en: 'Very Good', color: '#84cc16' };
        if (percentage >= 70) return { ar: 'جيد', en: 'Good', color: '#eab308' };
        if (percentage >= 50) return { ar: 'مقبول', en: 'Pass', color: '#f97316' };
        return { ar: 'راسب', en: 'Fail', color: '#ef4444' };
      },
    }),
    { name: 'marks-data-storage' }
  )
);
