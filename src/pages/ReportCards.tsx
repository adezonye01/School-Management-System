import React, { useState, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText, Printer, Settings, Eye, Save,
  ChevronUp, ChevronDown, Check, Calendar, Award, BookOpen
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import { useMarksStore } from '../stores/marksStore';
import { useAcademicStore } from '../stores/academicStore';
import { usePart4Store } from '../stores/part4Store';
import { useAppStore } from '../stores/appStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { ReportCardTemplate, ReportCardSectionConfig, ReportCardSection, YemenExamPeriod } from '../types/database';
import clsx from 'clsx';

// Certificate type
type CertificateType = 'monthly' | 'semester' | 'annual';

const defaultSections: ReportCardSectionConfig[] = [
  { section: 'header', enabled: true, order: 1, label: { ar: 'ترويسة المدرسة', en: 'School Header' } },
  { section: 'studentInfo', enabled: true, order: 2, label: { ar: 'بيانات الطالب', en: 'Student Info' } },
  { section: 'marksTable', enabled: true, order: 3, label: { ar: 'جدول الدرجات', en: 'Marks Table' } },
  { section: 'summary', enabled: true, order: 4, label: { ar: 'ملخص النتائج', en: 'Results Summary' } },
  { section: 'behaviorSummary', enabled: true, order: 5, label: { ar: 'ملخص السلوك', en: 'Behavior Summary' } },
  { section: 'attendanceSummary', enabled: false, order: 6, label: { ar: 'ملخص الحضور', en: 'Attendance' } },
  { section: 'notes', enabled: true, order: 7, label: { ar: 'ملاحظات', en: 'Notes' } },
  { section: 'signature', enabled: true, order: 8, label: { ar: 'التوقيعات', en: 'Signatures' } },
  { section: 'footer', enabled: true, order: 9, label: { ar: 'التذييل', en: 'Footer' } },
];

const defaultTemplate: ReportCardTemplate = {
  id: 'tpl-1', name: { ar: 'الشهادة الرسمية', en: 'Official Report Card' }, type: 'report_card', language: 'both', sections: defaultSections,
  schoolNameAr: 'مدارس النور الأهلية', schoolNameEn: 'Al-Noor Private Schools', headerColor: '#1e40af',
  showLogo: true, showWatermark: true, showBorder: true,
  principalNameAr: 'أ. أحمد المحمد', principalNameEn: 'Mr. Ahmed Al-Mohammed',
  footerTextAr: 'هذه الشهادة صادرة من نظام إدارة المدرسة الإلكتروني', footerTextEn: 'This certificate is issued by the School Management System',
  branchId: 'branch-1', isDefault: true, isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
};

export const ReportCards: React.FC = () => {
  const { t } = useTranslation();
  const {
    getPeriodsForSemester, getMonthlyTotal, getStudentMarksForSubject,
    calcSemesterTotal, getLetterGrade, getActiveConfig,
  } = useMarksStore();
  const { students, getGradesByBranch, getEnhancedGradeById, getSectionById, subjectGradeMappings, getSubjectById, getEducationLevelById } = useAcademicStore();
  const { getIncidentsByStudent, getStudentTotalPoints, getParentByStudentId } = usePart4Store();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [template, setTemplate] = useState<ReportCardTemplate>(defaultTemplate);
  const [certType, setCertType] = useState<CertificateType>('monthly');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedMonthlyPeriod, setSelectedMonthlyPeriod] = useState<YemenExamPeriod | ''>('');
  const [previewLang, setPreviewLang] = useState<'ar' | 'en'>('ar');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isAr = previewLang === 'ar';
  const config = currentBranch ? getActiveConfig(currentBranch.id) : undefined;
  const components = config?.monthlyComponents || [];
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const branchStudents = useMemo(() => {
    if (!currentBranch || !currentAcademicYear) return [];
    return students.filter(s => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id && s.isActive && (!selectedGrade || s.currentGradeId === selectedGrade));
  }, [currentBranch, currentAcademicYear, students, selectedGrade]);

  const gradeOptions = branchGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }));
  const studentOptions = branchStudents.map(s => ({ value: s.id, label: `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)} (${s.studentNumber})` }));

  const semesterPeriods = currentBranch ? getPeriodsForSemester(currentBranch.id, selectedSemester) : [];
  const monthlyPeriods = semesterPeriods.filter(p => p.isMonthly);
  const monthlyPeriodOptions = monthlyPeriods.map(p => ({ value: p.period, label: getLocalizedValue(p.name) }));

  const student = branchStudents.find(s => s.id === selectedStudent);
  const grade = student ? getEnhancedGradeById(student.currentGradeId) : null;
  const section = student ? getSectionById(student.currentSectionId) : null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const educationLevel = grade ? getEducationLevelById(grade.educationLevelId) : null;
  const parent = student ? getParentByStudentId(student.id) : undefined;

  const studentSubjects = student && currentAcademicYear
    ? subjectGradeMappings.filter(m => m.gradeId === student.currentGradeId && m.academicYearId === currentAcademicYear.id && m.isActive) : [];

  // ========== DATA COMPUTATION ==========

  // MONTHLY: Subject -> 4 components + total for ONE specific monthly period
  const monthlyResults = useMemo(() => {
    if (certType !== 'monthly' || !student || !currentAcademicYear || !selectedMonthlyPeriod) return [];
    return studentSubjects.map(mapping => {
      const subj = getSubjectById(mapping.subjectId);
      const allMarks = getStudentMarksForSubject(student.id, mapping.id, currentAcademicYear.id);
      const periodMarks = allMarks.filter(m => m.examPeriod === selectedMonthlyPeriod);

      const compMarks = components.map(c => {
        const mark = periodMarks.find(m => m.component === c.component);
        return { component: c, marks: mark ? (mark.isAbsent ? -1 : mark.marks) : 0 };
      });
      const total = compMarks.reduce((s, cm) => s + (cm.marks > 0 ? cm.marks : 0), 0);
      const maxTotal = components.reduce((s, c) => s + c.maxMarks, 0);
      const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
      const lg = getLetterGrade(pct);
      return { mapping, subject: subj, compMarks, total, maxTotal, pct, letterGrade: lg };
    });
  }, [certType, student, currentAcademicYear, selectedMonthlyPeriod, studentSubjects, components, getStudentMarksForSubject, getSubjectById, getLetterGrade]);

  // SEMESTER: Subject -> all monthlies + exam + weighted total
  const semesterResults = useMemo(() => {
    if (certType !== 'semester' || !student || !currentBranch || !currentAcademicYear) return [];
    return studentSubjects.map(mapping => {
      const subj = getSubjectById(mapping.subjectId);
      const result = calcSemesterTotal(student.id, mapping.id, selectedSemester, currentAcademicYear.id, currentBranch.id);
      const lg = getLetterGrade(result.percentage);
      const periodMarks = semesterPeriods.map(p => {
        if (p.isMonthly) return { period: p, total: getMonthlyTotal(student.id, mapping.id, p.period, currentAcademicYear.id) };
        const marks = getStudentMarksForSubject(student.id, mapping.id, currentAcademicYear.id);
        const exam = marks.find(m => m.examPeriod === p.period && m.component === 'exam');
        return { period: p, total: exam ? (exam.isAbsent ? -1 : exam.marks) : 0 };
      });
      return { mapping, subject: subj, periodMarks, result, letterGrade: lg };
    });
  }, [certType, student, currentBranch, currentAcademicYear, selectedSemester, studentSubjects, semesterPeriods, calcSemesterTotal, getLetterGrade, getMonthlyTotal, getStudentMarksForSubject, getSubjectById]);

  // ANNUAL: Subject -> semester1 total + semester2 total + annual avg
  const annualResults = useMemo(() => {
    if (certType !== 'annual' || !student || !currentBranch || !currentAcademicYear) return [];
    return studentSubjects.map(mapping => {
      const subj = getSubjectById(mapping.subjectId);
      const s1 = calcSemesterTotal(student.id, mapping.id, 1, currentAcademicYear.id, currentBranch.id);
      const s2 = calcSemesterTotal(student.id, mapping.id, 2, currentAcademicYear.id, currentBranch.id);
      const annual = Math.round(((s1.total + s2.total) / 2) * 100) / 100;
      const pct = Math.round(annual);
      const lg = getLetterGrade(pct);
      return { mapping, subject: subj, s1, s2, annual, pct, letterGrade: lg };
    });
  }, [certType, student, currentBranch, currentAcademicYear, studentSubjects, calcSemesterTotal, getLetterGrade, getSubjectById]);

  // Overall averages
  const overallAvg = certType === 'monthly'
    ? (monthlyResults.length ? Math.round(monthlyResults.reduce((s, r) => s + r.pct, 0) / monthlyResults.length) : 0)
    : certType === 'semester'
    ? (semesterResults.length ? Math.round(semesterResults.reduce((s, r) => s + r.result.total, 0) / semesterResults.length) : 0)
    : (annualResults.length ? Math.round(annualResults.reduce((s, r) => s + r.pct, 0) / annualResults.length) : 0);
  const overallGrade = getLetterGrade(overallAvg);

  // Behavior
  const behaviorPoints = student && currentAcademicYear ? getStudentTotalPoints(student.id, currentAcademicYear.id) : 0;
  const incidents = student && currentAcademicYear ? getIncidentsByStudent(student.id, currentAcademicYear.id) : [];
  const positiveCount = incidents.filter(i => i.type === 'positive').length;
  const negativeCount = incidents.filter(i => i.type === 'negative').length;

  // Certificate title
  const getCertTitle = (): string => {
    if (certType === 'monthly') {
      const period = monthlyPeriods.find(p => p.period === selectedMonthlyPeriod);
      return isAr ? `الشهادة الشهرية - ${period ? period.name.ar : ''}` : `Monthly Report - ${period ? period.name.en : ''}`;
    }
    if (certType === 'semester') return isAr ? `شهادة ${selectedSemester === 1 ? 'نصف العام' : 'نهاية الفصل الثاني'}` : `${selectedSemester === 1 ? 'Midterm' : 'Semester 2'} Report Card`;
    return isAr ? 'الشهادة النهائية - نهاية العام الدراسي' : 'Final Annual Report Card';
  };

  const enabledSections = template.sections.filter(s => s.enabled).sort((a, b) => a.order - b.order);

  // ========== RENDER SECTIONS ==========
  const renderSection = (sec: ReportCardSectionConfig) => {
    const hc = template.headerColor;
    switch (sec.section) {
      case 'header':
        return (
          <div style={{ backgroundColor: hc, color: 'white', padding: 24, borderRadius: 8, marginBottom: 20, textAlign: 'center' }}>
            {template.showLogo && <div style={{ width: 60, height: 60, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🏫</div>}
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{isAr ? template.schoolNameAr : template.schoolNameEn}</h1>
            <p style={{ fontSize: 16, fontWeight: 600, opacity: 0.95 }}>{getCertTitle()}</p>
            {currentAcademicYear && <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{getLocalizedValue(currentAcademicYear.name)}</p>}
          </div>
        );

      case 'studentInfo':
        if (!student) return null;
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
            <div><span style={{ color: '#6b7280', fontSize: 11 }}>{isAr ? 'اسم الطالب' : 'Student Name'}</span><p style={{ fontWeight: 600 }}>{isAr ? `${student.firstName.ar} ${student.lastName.ar}` : `${student.firstName.en} ${student.lastName.en}`}</p></div>
            <div><span style={{ color: '#6b7280', fontSize: 11 }}>{isAr ? 'رقم الطالب' : 'Student #'}</span><p style={{ fontWeight: 600 }}>{student.studentNumber}</p></div>
            <div><span style={{ color: '#6b7280', fontSize: 11 }}>{isAr ? 'المرحلة / الصف' : 'Level / Grade'}</span><p style={{ fontWeight: 600 }}>{educationLevel ? (isAr ? educationLevel.name.ar : educationLevel.name.en) : ''} - {grade ? (isAr ? grade.name.ar : grade.name.en) : '-'} ({section ? (isAr ? section.name.ar : section.name.en) : ''})</p></div>
            <div><span style={{ color: '#6b7280', fontSize: 11 }}>{isAr ? 'ولي الأمر' : 'Guardian'}</span><p style={{ fontWeight: 600 }}>{parent ? (isAr ? `${parent.firstName.ar} ${parent.lastName.ar}` : `${parent.firstName.en} ${parent.lastName.en}`) : (student.guardianName ? (isAr ? student.guardianName.ar : student.guardianName.en) : '-')}</p></div>
          </div>
        );

      case 'marksTable':
        return (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, borderBottom: `2px solid ${hc}`, paddingBottom: 6 }}>{isAr ? '📋 جدول الدرجات' : '📋 Marks Table'}</h3>

            {/* ---- MONTHLY TABLE ---- */}
            {certType === 'monthly' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: hc, color: 'white' }}>
                    <th style={{ padding: '8px 10px', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'المادة' : 'Subject'}</th>
                    {components.map(c => <th key={c.component} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11 }}>{isAr ? c.name.ar : c.name.en}<br/><span style={{ opacity: 0.7, fontSize: 10 }}>({c.maxMarks})</span></th>)}
                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>{isAr ? 'المجموع' : 'Total'}</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>{isAr ? 'النسبة' : '%'}</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>{isAr ? 'التقدير' : 'Grade'}</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyResults.map((r, idx) => (
                    <tr key={r.mapping.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'white' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>{r.subject ? (isAr ? r.subject.name.ar : r.subject.name.en) : '-'}</td>
                      {r.compMarks.map((cm, i) => <td key={i} style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{cm.marks === -1 ? (isAr ? 'غ' : 'Ab') : cm.marks > 0 ? cm.marks : '-'}</td>)}
                      <td style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14 }}>{r.total}</td>
                      <td style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{r.pct}%</td>
                      <td style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: r.letterGrade.color, fontWeight: 700 }}>{isAr ? r.letterGrade.ar : r.letterGrade.en}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ---- SEMESTER TABLE ---- */}
            {certType === 'semester' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: hc, color: 'white' }}>
                    <th style={{ padding: '8px 10px', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'المادة' : 'Subject'}</th>
                    {semesterPeriods.map(p => <th key={p.period} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 10 }}>{isAr ? p.name.ar : p.name.en}<br/><span style={{ opacity: 0.7 }}>({p.maxMarks})</span></th>)}
                    <th style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11 }}>{isAr ? 'أعمال' : 'CW'}<br/><span style={{ opacity: 0.7 }}>(30%)</span></th>
                    <th style={{ padding: '6px 4px', textAlign: 'center', fontSize: 11 }}>{isAr ? 'امتحان' : 'Exam'}<br/><span style={{ opacity: 0.7 }}>(70%)</span></th>
                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>{isAr ? 'المجموع' : 'Total'}</th>
                    <th style={{ padding: '6px 4px', textAlign: 'center' }}>{isAr ? 'التقدير' : 'Grade'}</th>
                  </tr>
                </thead>
                <tbody>
                  {semesterResults.map((r, idx) => (
                    <tr key={r.mapping.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'white' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>{r.subject ? (isAr ? r.subject.name.ar : r.subject.name.en) : '-'}</td>
                      {r.periodMarks.map((pm, i) => <td key={i} style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{pm.total === -1 ? (isAr ? 'غ' : 'Ab') : pm.total > 0 ? pm.total : '-'}</td>)}
                      <td style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#2563eb', fontWeight: 600 }}>{r.result.monthlyAvg.toFixed(1)}</td>
                      <td style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: '#7c3aed', fontWeight: 600 }}>{r.result.examMark.toFixed(1)}</td>
                      <td style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14 }}>{r.result.total.toFixed(1)}</td>
                      <td style={{ padding: '7px 4px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: r.letterGrade.color, fontWeight: 700 }}>{isAr ? r.letterGrade.ar : r.letterGrade.en}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* ---- ANNUAL TABLE ---- */}
            {certType === 'annual' && (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: hc, color: 'white' }}>
                    <th style={{ padding: '8px 10px', textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'المادة' : 'Subject'}</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>{isAr ? 'الفصل الأول' : 'Semester 1'}</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>{isAr ? 'الفصل الثاني' : 'Semester 2'}</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 700 }}>{isAr ? 'المعدل السنوي' : 'Annual Avg'}</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>{isAr ? 'النسبة' : '%'}</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>{isAr ? 'التقدير' : 'Grade'}</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {annualResults.map((r, idx) => (
                    <tr key={r.mapping.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'white' }}>
                      <td style={{ padding: '7px 10px', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>{r.subject ? (isAr ? r.subject.name.ar : r.subject.name.en) : '-'}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{r.s1.total.toFixed(1)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>{r.s2.total.toFixed(1)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 14 }}>{r.annual.toFixed(1)}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 600 }}>{r.pct}%</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', color: r.letterGrade.color, fontWeight: 700 }}>{isAr ? r.letterGrade.ar : r.letterGrade.en}</td>
                      <td style={{ padding: '7px 8px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontWeight: 700, color: r.pct >= 50 ? '#22c55e' : '#ef4444' }}>{r.pct >= 50 ? (isAr ? 'ناجح ✓' : 'Pass ✓') : (isAr ? 'راسب ✗' : 'Fail ✗')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case 'summary':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: certType === 'annual' ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div style={{ padding: 14, backgroundColor: '#eff6ff', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#6b7280' }}>{isAr ? 'المعدل العام' : 'Overall Average'}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: overallGrade.color }}>{overallAvg}%</p>
            </div>
            <div style={{ padding: 14, backgroundColor: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#6b7280' }}>{isAr ? 'التقدير' : 'Grade'}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: overallGrade.color }}>{isAr ? overallGrade.ar : overallGrade.en}</p>
            </div>
            <div style={{ padding: 14, backgroundColor: '#fefce8', borderRadius: 8, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#6b7280' }}>{isAr ? 'عدد المواد' : 'Subjects'}</p>
              <p style={{ fontSize: 26, fontWeight: 700 }}>{studentSubjects.length}</p>
            </div>
            {certType === 'annual' && (
              <div style={{ padding: 14, backgroundColor: overallAvg >= 50 ? '#f0fdf4' : '#fef2f2', borderRadius: 8, textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#6b7280' }}>{isAr ? 'القرار' : 'Decision'}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: overallAvg >= 50 ? '#22c55e' : '#ef4444' }}>{overallAvg >= 50 ? (isAr ? 'ناجح ✓' : 'PASS ✓') : (isAr ? 'راسب ✗' : 'FAIL ✗')}</p>
              </div>
            )}
          </div>
        );

      case 'behaviorSummary':
        return (
          <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{isAr ? '📊 ملخص السلوك' : '📊 Behavior'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div style={{ textAlign: 'center' }}><p style={{ color: '#22c55e', fontSize: 20, fontWeight: 700 }}>+{positiveCount}</p><p style={{ fontSize: 10, color: '#6b7280' }}>{isAr ? 'إيجابي' : 'Positive'}</p></div>
              <div style={{ textAlign: 'center' }}><p style={{ color: '#ef4444', fontSize: 20, fontWeight: 700 }}>{negativeCount}</p><p style={{ fontSize: 10, color: '#6b7280' }}>{isAr ? 'سلبي' : 'Negative'}</p></div>
              <div style={{ textAlign: 'center' }}><p style={{ color: behaviorPoints >= 0 ? '#22c55e' : '#ef4444', fontSize: 20, fontWeight: 700 }}>{behaviorPoints}</p><p style={{ fontSize: 10, color: '#6b7280' }}>{isAr ? 'الرصيد' : 'Balance'}</p></div>
            </div>
          </div>
        );

      case 'attendanceSummary':
        return (
          <div style={{ padding: 14, border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{isAr ? '📅 الحضور' : '📅 Attendance'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'center' }}>
              <div><p style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>85</p><p style={{ fontSize: 10, color: '#6b7280' }}>{isAr ? 'حضور' : 'Present'}</p></div>
              <div><p style={{ fontSize: 20, fontWeight: 700, color: '#ef4444' }}>5</p><p style={{ fontSize: 10, color: '#6b7280' }}>{isAr ? 'غياب' : 'Absent'}</p></div>
              <div><p style={{ fontSize: 20, fontWeight: 700 }}>94%</p><p style={{ fontSize: 10, color: '#6b7280' }}>{isAr ? 'النسبة' : 'Rate'}</p></div>
            </div>
          </div>
        );

      case 'notes':
        return <div style={{ padding: 14, border: '1px dashed #d1d5db', borderRadius: 8, marginBottom: 20, minHeight: 50 }}><h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{isAr ? '📝 ملاحظات' : '📝 Notes'}</h3><p style={{ fontSize: 11, color: '#9ca3af' }}>________________________________________________</p></div>;

      case 'signature':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20, paddingTop: 16 }}>
            {[{ ar: 'معلم الفصل', en: 'Class Teacher' }, { ar: 'مدير المدرسة', en: 'Principal', name: isAr ? template.principalNameAr : template.principalNameEn }, { ar: 'ولي الأمر', en: 'Guardian' }].map((sig, i) => (
              <div key={i} style={{ textAlign: 'center' }}><p style={{ fontSize: 11, fontWeight: 600, marginBottom: 28 }}>{isAr ? sig.ar : sig.en}</p><div style={{ borderBottom: '1px solid #000', marginBottom: 6 }} />{sig.name && <p style={{ fontSize: 10, color: '#4b5563' }}>{sig.name}</p>}</div>
            ))}
          </div>
        );

      case 'footer':
        return <div style={{ textAlign: 'center', paddingTop: 12, borderTop: `2px solid ${hc}`, fontSize: 10, color: '#9ca3af' }}><p>{isAr ? template.footerTextAr : template.footerTextEn}</p><p style={{ marginTop: 3 }}>{isAr ? `تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}` : `Print Date: ${new Date().toLocaleDateString('en-US')}`}</p></div>;

      default: return null;
    }
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${previewLang}"><head><meta charset="UTF-8"><title>${getCertTitle()}</title><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&family=Inter:wght@400;600;700&display=swap" rel="stylesheet"><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'${isAr ? 'Cairo' : 'Inter'}',sans-serif;padding:15px;color:#1a1a1a}@media print{body{padding:0}}</style></head><body>${content.innerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const moveSection = (index: number, dir: -1 | 1) => {
    const ns = [...template.sections];
    const ni = index + dir;
    if (ni < 0 || ni >= ns.length) return;
    [ns[index], ns[ni]] = [ns[ni], ns[index]];
    ns.forEach((s, i) => s.order = i + 1);
    setTemplate({ ...template, sections: ns });
  };

  const toggleSection = (s: ReportCardSection) => {
    setTemplate({ ...template, sections: template.sections.map(x => x.section === s ? { ...x, enabled: !x.enabled } : x) });
  };

  const certTabs: { value: CertificateType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'monthly', label: language === 'ar' ? 'شهادة شهرية' : 'Monthly Report', icon: <Calendar className="w-4 h-4" />, color: 'blue' },
    { value: 'semester', label: language === 'ar' ? 'شهادة نصفية' : 'Semester Report', icon: <BookOpen className="w-4 h-4" />, color: 'purple' },
    { value: 'annual', label: language === 'ar' ? 'شهادة نهائية' : 'Annual Report', icon: <Award className="w-4 h-4" />, color: 'green' },
  ];

  const hasData = (certType === 'monthly' && monthlyResults.length > 0) || (certType === 'semester' && semesterResults.length > 0) || (certType === 'annual' && annualResults.length > 0);
  const isReady = selectedStudent && (certType !== 'monthly' || selectedMonthlyPeriod);

  return (
    <div className="space-y-6">
      {/* Certificate Type Tabs */}
      <div className="grid grid-cols-3 gap-4">
        {certTabs.map(tab => (
          <button key={tab.value} onClick={() => setCertType(tab.value)}
            className={clsx('p-4 rounded-xl border-2 transition-all flex items-center gap-3', certType === tab.value ? `border-${tab.color}-500 bg-${tab.color}-50 dark:bg-${tab.color}-900/20` : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
            <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-white', tab.color === 'blue' ? 'bg-blue-600' : tab.color === 'purple' ? 'bg-purple-600' : 'bg-green-600')}>{tab.icon}</div>
            <div className="text-start"><p className="font-semibold text-sm">{tab.label}</p><p className="text-xs text-gray-500">{tab.value === 'monthly' ? (language === 'ar' ? 'سلوك+واجبات+شفهي+تحريري' : 'Behavior+HW+Oral+Written') : tab.value === 'semester' ? (language === 'ar' ? 'شهريات + اختبار نصفي/نهائي' : 'Monthlies + Midterm/Final') : (language === 'ar' ? 'فصل أول + فصل ثاني = المعدل' : 'Sem1 + Sem2 = Annual Avg')}</p></div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title={language === 'ar' ? 'مصمم الشهادات والتقارير' : 'Report Card Builder'} action={<div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsConfigOpen(true)} leftIcon={<Settings className="w-4 h-4" />}>{language === 'ar' ? 'تصميم القالب' : 'Template'}</Button>
          {isReady && hasData && <Button onClick={() => setIsPreviewOpen(true)} leftIcon={<Eye className="w-4 h-4" />}>{language === 'ar' ? 'معاينة وطباعة' : 'Preview & Print'}</Button>}
        </div>} />

        {/* Filters */}
        <div className={clsx('grid gap-4 mb-6', certType === 'monthly' ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-4')}>
          <Select label={language === 'ar' ? 'الصف' : 'Grade'} value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedStudent(''); }} options={[{ value: '', label: t('common.selectOption') }, ...gradeOptions]} />
          <Select label={language === 'ar' ? 'الطالب' : 'Student'} value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} options={[{ value: '', label: t('common.selectOption') }, ...studentOptions]} disabled={!selectedGrade} />
          {certType !== 'annual' && (
            <Select label={language === 'ar' ? 'الفصل الدراسي' : 'Semester'} value={String(selectedSemester)} onChange={(e) => { setSelectedSemester(parseInt(e.target.value) as 1 | 2); setSelectedMonthlyPeriod(''); }} options={[{ value: '1', label: language === 'ar' ? 'الفصل الأول' : 'Semester 1' }, { value: '2', label: language === 'ar' ? 'الفصل الثاني' : 'Semester 2' }]} />
          )}
          {certType === 'monthly' && (
            <Select label={language === 'ar' ? 'الفترة الشهرية' : 'Monthly Period'} value={selectedMonthlyPeriod} onChange={(e) => setSelectedMonthlyPeriod(e.target.value as YemenExamPeriod)} options={[{ value: '', label: t('common.selectOption') }, ...monthlyPeriodOptions]} />
          )}
          <Select label={language === 'ar' ? 'لغة الشهادة' : 'Language'} value={previewLang} onChange={(e) => setPreviewLang(e.target.value as 'ar' | 'en')} options={[{ value: 'ar', label: 'العربية' }, { value: 'en', label: 'English' }]} />
        </div>

        {/* Inline Preview */}
        {isReady && hasData ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-900">
            <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Inter, sans-serif', maxWidth: 800, margin: '0 auto' }}>
              {template.showBorder ? <div style={{ border: `3px double ${template.headerColor}`, padding: 20, borderRadius: 10 }}>{enabledSections.map(s => <React.Fragment key={s.section}>{renderSection(s)}</React.Fragment>)}</div>
                : enabledSections.map(s => <React.Fragment key={s.section}>{renderSection(s)}</React.Fragment>)}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500">{language === 'ar' ? 'اختر البيانات المطلوبة لعرض الشهادة' : 'Select required data to generate report card'}</h3>
            <p className="text-sm text-gray-400 mt-2">{certType === 'monthly' ? (language === 'ar' ? 'الصف ← الطالب ← الفصل الدراسي ← الفترة الشهرية' : 'Grade → Student → Semester → Monthly Period') : certType === 'semester' ? (language === 'ar' ? 'الصف ← الطالب ← الفصل الدراسي' : 'Grade → Student → Semester') : (language === 'ar' ? 'الصف ← الطالب' : 'Grade → Student')}</p>
          </div>
        )}
      </Card>

      {/* Config Modal */}
      <Modal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title={language === 'ar' ? '⚙️ تصميم قالب الشهادة' : '⚙️ Template Designer'} size="full">
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pe-2">
          <div><h4 className="font-semibold mb-3">{language === 'ar' ? '🏫 بيانات المدرسة' : '🏫 School Info'}</h4>
            <div className="grid grid-cols-2 gap-4"><Input label={language === 'ar' ? 'اسم المدرسة (عربي)' : 'School (AR)'} value={template.schoolNameAr} onChange={(e) => setTemplate({ ...template, schoolNameAr: e.target.value })} dir="rtl" /><Input label={language === 'ar' ? 'اسم المدرسة (إنجليزي)' : 'School (EN)'} value={template.schoolNameEn} onChange={(e) => setTemplate({ ...template, schoolNameEn: e.target.value })} dir="ltr" /></div>
            <div className="grid grid-cols-2 gap-4 mt-3"><Input label={language === 'ar' ? 'اسم المدير (عربي)' : 'Principal (AR)'} value={template.principalNameAr} onChange={(e) => setTemplate({ ...template, principalNameAr: e.target.value })} dir="rtl" /><Input label={language === 'ar' ? 'اسم المدير (إنجليزي)' : 'Principal (EN)'} value={template.principalNameEn} onChange={(e) => setTemplate({ ...template, principalNameEn: e.target.value })} dir="ltr" /></div>
          </div>
          <div><h4 className="font-semibold mb-3">{language === 'ar' ? '🎨 التصميم' : '🎨 Style'}</h4>
            <div className="flex flex-wrap gap-4 items-end">
              <div><label className="block text-sm font-medium mb-1">{language === 'ar' ? 'اللون' : 'Color'}</label><div className="flex gap-2">{['#1e40af','#059669','#7c3aed','#dc2626','#ea580c','#0891b2','#4f46e5'].map(c => <button key={c} onClick={() => setTemplate({ ...template, headerColor: c })} className={clsx('w-8 h-8 rounded-full border-2', template.headerColor === c ? 'border-gray-900 scale-110' : 'border-transparent')} style={{ backgroundColor: c }} />)}</div></div>
              <Checkbox checked={template.showLogo} onChange={v => setTemplate({ ...template, showLogo: v })} label={language === 'ar' ? 'الشعار' : 'Logo'} />
              <Checkbox checked={template.showBorder} onChange={v => setTemplate({ ...template, showBorder: v })} label={language === 'ar' ? 'إطار' : 'Border'} />
            </div>
          </div>
          <div><h4 className="font-semibold mb-3">{language === 'ar' ? '📝 التذييل' : '📝 Footer'}</h4>
            <div className="grid grid-cols-2 gap-4"><Input value={template.footerTextAr} onChange={e => setTemplate({ ...template, footerTextAr: e.target.value })} dir="rtl" /><Input value={template.footerTextEn} onChange={e => setTemplate({ ...template, footerTextEn: e.target.value })} dir="ltr" /></div>
          </div>
          <div><h4 className="font-semibold mb-3">{language === 'ar' ? '📋 الأقسام' : '📋 Sections'}</h4>
            <div className="space-y-2">{template.sections.sort((a,b) => a.order - b.order).map((sec,idx) => (
              <div key={sec.section} className={clsx('flex items-center justify-between p-3 rounded-lg border', sec.enabled ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 opacity-50')}>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col"><button onClick={() => moveSection(idx,-1)} disabled={idx===0} className="text-gray-400 hover:text-gray-600 disabled:opacity-20"><ChevronUp className="w-4 h-4" /></button><button onClick={() => moveSection(idx,1)} disabled={idx===template.sections.length-1} className="text-gray-400 hover:text-gray-600 disabled:opacity-20"><ChevronDown className="w-4 h-4" /></button></div>
                  <Badge variant="default">{sec.order}</Badge>
                  <span className="font-medium">{sec.label ? getLocalizedValue(sec.label) : sec.section}</span>
                </div>
                <button onClick={() => toggleSection(sec.section)} className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', sec.enabled ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-400')}>{sec.enabled ? <Check className="w-4 h-4" /> : ''}</button>
              </div>
            ))}</div>
          </div>
          <div className="flex justify-end pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-800"><Button onClick={() => { setIsConfigOpen(false); showToast('success', t('common.success')); }} leftIcon={<Save className="w-4 h-4" />}>{language === 'ar' ? 'حفظ' : 'Save'}</Button></div>
        </div>
      </Modal>

      {/* Print Preview Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={`🖨️ ${getCertTitle()}`} size="full">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Select value={previewLang} onChange={e => setPreviewLang(e.target.value as 'ar'|'en')} options={[{value:'ar',label:'العربية'},{value:'en',label:'English'}]} />
            </div>
            <Button onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>{language === 'ar' ? 'طباعة' : 'Print'}</Button>
          </div>
          <div ref={printRef} className="border rounded-xl p-4 bg-white" dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? 'Cairo, sans-serif' : 'Inter, sans-serif', maxWidth: 800, margin: '0 auto' }}>
            {template.showBorder ? <div style={{ border: `3px double ${template.headerColor}`, padding: 20, borderRadius: 10 }}>{enabledSections.map(s => <React.Fragment key={s.section}>{renderSection(s)}</React.Fragment>)}</div>
              : enabledSections.map(s => <React.Fragment key={s.section}>{renderSection(s)}</React.Fragment>)}
          </div>
          <div className="flex justify-end pt-4 border-t"><Button variant="secondary" onClick={() => setIsPreviewOpen(false)}>{t('common.close')}</Button></div>
        </div>
      </Modal>
    </div>
  );
};
