import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, CheckCircle, Search, RefreshCw, ArrowRight,
  User, BookOpen, Shield, Eye, Wrench, XCircle,
  FileWarning, Zap
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAcademicStore } from '../stores/academicStore';
import { useFeeStore } from '../stores/feeStore';
import { useMarksStore } from '../stores/marksStore';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useAppStore } from '../stores/appStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { EnhancedStudent } from '../types/database';
import clsx from 'clsx';

// Issue types
type IssueType = 'grade_mismatch' | 'missing_fees' | 'wrong_fees' | 'missing_marks' | 'orphan_marks' | 'no_section' | 'age_mismatch';
type IssueSeverity = 'critical' | 'warning' | 'info';

interface AuditIssue {
  id: string;
  studentId: string;
  type: IssueType;
  severity: IssueSeverity;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  currentValue: string;
  expectedValue?: string;
  canAutoFix: boolean;
  isResolved: boolean;
}

export const StudentAudit: React.FC = () => {
  const { t } = useTranslation();
  const {
    students, getEnhancedGradeById, getSectionById, getGradesByBranch,
    getSectionsByGrade, subjectGradeMappings,
    getSubjectById, updateStudent,
  } = useAcademicStore();
  const {
    getFeeGradeAssignmentsByGrade, getTotalFeeAmountForGrade,
  } = useFeeStore();
  const { studentMarks } = useMarksStore();
  const { getInvoicesByStudent } = useInvoiceStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterType, setFilterType] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  // Transfer modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState<EnhancedStudent | null>(null);
  const [transferNewGradeId, setTransferNewGradeId] = useState('');
  const [transferNewSectionId, setTransferNewSectionId] = useState('');


  // Detail modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState('');

  const branchStudents = useMemo(() => {
    if (!currentBranch || !currentAcademicYear) return [];
    return students.filter(s => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id);
  }, [currentBranch, currentAcademicYear, students]);

  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const gradeOptions = branchGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }));

  const transferSections = transferNewGradeId && currentAcademicYear
    ? getSectionsByGrade(transferNewGradeId, currentAcademicYear.id)
    : [];
  const transferSectionOptions = transferSections.map(s => ({ value: s.id, label: getLocalizedValue(s.name) }));

  // ========== AUDIT ENGINE ==========
  const runAudit = () => {
    setIsScanning(true);
    const found: AuditIssue[] = [];
    let counter = 0;

    branchStudents.forEach(student => {
      const grade = getEnhancedGradeById(student.currentGradeId);
      const section = student.currentSectionId ? getSectionById(student.currentSectionId) : null;

      // 1. No section assigned
      if (!section) {
        counter++;
        found.push({
          id: `issue-${counter}`,
          studentId: student.id,
          type: 'no_section',
          severity: 'warning',
          titleAr: 'لا يوجد فصل مُعيّن',
          titleEn: 'No section assigned',
          descriptionAr: `الطالب ${student.firstName.ar} غير معيّن لأي فصل دراسي`,
          descriptionEn: `Student ${student.firstName.en} has no section assigned`,
          currentValue: '-',
          canAutoFix: false,
          isResolved: false,
        });
      }

      // 2. Section doesn't belong to student's grade
      if (section && section.gradeId !== student.currentGradeId) {
        counter++;
        const sectionGrade = getEnhancedGradeById(section.gradeId);
        found.push({
          id: `issue-${counter}`,
          studentId: student.id,
          type: 'grade_mismatch',
          severity: 'critical',
          titleAr: 'تعارض بين الصف والفصل',
          titleEn: 'Grade-Section mismatch',
          descriptionAr: `الطالب في الصف "${grade?.name.ar || '-'}" لكن الفصل "${section.name.ar}" تابع للصف "${sectionGrade?.name.ar || '-'}"`,
          descriptionEn: `Student in grade "${grade?.name.en || '-'}" but section "${section.name.en}" belongs to grade "${sectionGrade?.name.en || '-'}"`,
          currentValue: grade ? getLocalizedValue(grade.name) : '-',
          expectedValue: sectionGrade ? getLocalizedValue(sectionGrade.name) : '-',
          canAutoFix: false,
          isResolved: false,
        });
      }

      // 3. Check if grade has fee assignments
      if (currentAcademicYear) {
        const gradeFees = getFeeGradeAssignmentsByGrade(student.currentGradeId, currentAcademicYear.id);
        if (gradeFees.length === 0) {
          counter++;
          found.push({
            id: `issue-${counter}`,
            studentId: student.id,
            type: 'missing_fees',
            severity: 'warning',
            titleAr: 'لا توجد رسوم مُعرّفة للصف',
            titleEn: 'No fees defined for grade',
            descriptionAr: `الصف "${grade?.name.ar || '-'}" ليس له رسوم مُعرّفة في هذه السنة`,
            descriptionEn: `Grade "${grade?.name.en || '-'}" has no fee assignments this year`,
            currentValue: '0 SAR',
            canAutoFix: false,
            isResolved: false,
          });
        }
      }

      // 4. Student has marks for subjects not in their current grade
      if (currentAcademicYear) {
        const gradeSubjects = subjectGradeMappings.filter(m => m.gradeId === student.currentGradeId && m.academicYearId === currentAcademicYear.id);
        const gradeSubjectIds = new Set(gradeSubjects.map(m => m.id));

        const studentMarksAll = studentMarks.filter(m => m.studentId === student.id && m.academicYearId === currentAcademicYear.id);
        const orphanMappingIds = new Set<string>();
        studentMarksAll.forEach(m => {
          if (!gradeSubjectIds.has(m.subjectGradeMappingId)) {
            orphanMappingIds.add(m.subjectGradeMappingId);
          }
        });

        if (orphanMappingIds.size > 0) {
          counter++;
          const orphanNames = Array.from(orphanMappingIds).map(id => {
            const mapping = subjectGradeMappings.find(m => m.id === id);
            if (!mapping) return '?';
            const subj = getSubjectById(mapping.subjectId);
            const g = getEnhancedGradeById(mapping.gradeId);
            return `${subj ? getLocalizedValue(subj.name) : '?'} (${g ? getLocalizedValue(g.name) : '?'})`;
          });

          found.push({
            id: `issue-${counter}`,
            studentId: student.id,
            type: 'orphan_marks',
            severity: 'critical',
            titleAr: 'درجات لمواد في صف آخر',
            titleEn: 'Marks for subjects in wrong grade',
            descriptionAr: `الطالب لديه درجات مسجلة لمواد ليست في صفه الحالي: ${orphanNames.join('، ')}`,
            descriptionEn: `Student has marks for subjects not in current grade: ${orphanNames.join(', ')}`,
            currentValue: `${orphanMappingIds.size} ${language === 'ar' ? 'مواد' : 'subjects'}`,
            canAutoFix: false,
            isResolved: false,
          });
        }

        // 5. Student has no marks at all
        if (studentMarksAll.length === 0 && gradeSubjects.length > 0) {
          counter++;
          found.push({
            id: `issue-${counter}`,
            studentId: student.id,
            type: 'missing_marks',
            severity: 'info',
            titleAr: 'لا توجد درجات مُسجّلة',
            titleEn: 'No marks recorded',
            descriptionAr: `الطالب ليس لديه أي درجات مسجلة رغم وجود ${gradeSubjects.length} مواد مُعرّفة`,
            descriptionEn: `Student has no marks despite ${gradeSubjects.length} subjects being defined`,
            currentValue: `0 / ${gradeSubjects.length}`,
            canAutoFix: false,
            isResolved: false,
          });
        }
      }

      // 6. Age mismatch check (basic)
      if (student.dateOfBirth && grade) {
        const age = new Date().getFullYear() - new Date(student.dateOfBirth).getFullYear();
        const expectedMinAge = grade.order + 4; // KG1 starts at ~5
        if (age > expectedMinAge + 4 || age < expectedMinAge - 2) {
          counter++;
          found.push({
            id: `issue-${counter}`,
            studentId: student.id,
            type: 'age_mismatch',
            severity: 'info',
            titleAr: 'فرق كبير في العمر والصف',
            titleEn: 'Age-grade mismatch',
            descriptionAr: `عمر الطالب ${age} سنة في الصف "${grade.name.ar}" (العمر المتوقع ~${expectedMinAge})`,
            descriptionEn: `Student age ${age} in "${grade.name.en}" (expected ~${expectedMinAge})`,
            currentValue: `${age} ${language === 'ar' ? 'سنة' : 'years'}`,
            expectedValue: `~${expectedMinAge}`,
            canAutoFix: false,
            isResolved: false,
          });
        }
      }
    });

    setTimeout(() => {
      setIssues(found);
      setIsScanning(false);
      setHasScanned(true);
      showToast(found.length > 0 ? 'warning' : 'success',
        found.length > 0
          ? (language === 'ar' ? `تم اكتشاف ${found.length} مشكلة` : `${found.length} issues found`)
          : (language === 'ar' ? 'لا توجد مشاكل!' : 'No issues found!')
      );
    }, 800);
  };

  // Filtered issues
  const filteredIssues = issues.filter(issue => {
    if (issue.isResolved) return false;
    const student = branchStudents.find(s => s.id === issue.studentId);
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (student && (
      student.firstName.ar.includes(q) || student.firstName.en.toLowerCase().includes(q) ||
      student.studentNumber.toLowerCase().includes(q)
    ));
    const matchSeverity = !filterSeverity || issue.severity === filterSeverity;
    const matchType = !filterType || issue.type === filterType;
    return matchSearch && matchSeverity && matchType;
  });

  // Stats
  const criticalCount = issues.filter(i => i.severity === 'critical' && !i.isResolved).length;
  const warningCount = issues.filter(i => i.severity === 'warning' && !i.isResolved).length;
  const infoCount = issues.filter(i => i.severity === 'info' && !i.isResolved).length;
  const resolvedCount = issues.filter(i => i.isResolved).length;

  const getStudentName = (id: string) => {
    const s = branchStudents.find(st => st.id === id);
    return s ? `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)}` : '-';
  };

  const getSeverityInfo = (severity: IssueSeverity) => {
    const map = {
      critical: { variant: 'danger' as const, icon: <XCircle className="w-4 h-4" />, label: language === 'ar' ? 'حرج' : 'Critical', color: 'text-red-600' },
      warning: { variant: 'warning' as const, icon: <AlertTriangle className="w-4 h-4" />, label: language === 'ar' ? 'تحذير' : 'Warning', color: 'text-yellow-600' },
      info: { variant: 'info' as const, icon: <FileWarning className="w-4 h-4" />, label: language === 'ar' ? 'معلومة' : 'Info', color: 'text-blue-600' },
    };
    return map[severity];
  };

  const getTypeLabel = (type: IssueType) => {
    const map: Record<string, { ar: string; en: string }> = {
      grade_mismatch: { ar: 'تعارض الصف', en: 'Grade Mismatch' },
      missing_fees: { ar: 'رسوم مفقودة', en: 'Missing Fees' },
      wrong_fees: { ar: 'رسوم خاطئة', en: 'Wrong Fees' },
      missing_marks: { ar: 'درجات مفقودة', en: 'Missing Marks' },
      orphan_marks: { ar: 'درجات يتيمة', en: 'Orphan Marks' },
      no_section: { ar: 'بدون فصل', en: 'No Section' },
      age_mismatch: { ar: 'فرق العمر', en: 'Age Mismatch' },
    };
    return language === 'ar' ? map[type].ar : map[type].en;
  };

  // ===== TRANSFER / FIX =====
  const openTransferModal = (student: EnhancedStudent) => {
    setTransferStudent(student);
    setTransferNewGradeId('');
    setTransferNewSectionId('');

    setIsTransferOpen(true);
  };

  const handleTransfer = () => {
    if (!transferStudent || !transferNewGradeId || !transferNewSectionId) return;

    const oldGrade = getEnhancedGradeById(transferStudent.currentGradeId);
    const newGrade = getEnhancedGradeById(transferNewGradeId);

    // Update student
    updateStudent(transferStudent.id, {
      currentGradeId: transferNewGradeId,
      currentSectionId: transferNewSectionId,
      educationLevelId: newGrade?.educationLevelId || transferStudent.educationLevelId,
    });

    // Mark related issues as resolved
    setIssues(prev => prev.map(issue =>
      issue.studentId === transferStudent.id
        ? { ...issue, isResolved: true }
        : issue
    ));

    showToast('success', language === 'ar'
      ? `تم نقل ${getLocalizedValue(transferStudent.firstName)} من "${oldGrade?.name.ar}" إلى "${newGrade?.name.ar}"`
      : `Transferred ${getLocalizedValue(transferStudent.firstName)} from "${oldGrade?.name.en}" to "${newGrade?.name.en}"`
    );
    setIsTransferOpen(false);
  };

  // ===== DETAIL =====
  const openDetail = (studentId: string) => {
    setDetailStudentId(studentId);
    setIsDetailOpen(true);
  };

  const detailStudent = branchStudents.find(s => s.id === detailStudentId);
  const detailGrade = detailStudent ? getEnhancedGradeById(detailStudent.currentGradeId) : null;
  const detailSection = detailStudent ? getSectionById(detailStudent.currentSectionId) : null;
  const detailIssues = issues.filter(i => i.studentId === detailStudentId);

  const detailSubjects = detailStudent && currentAcademicYear
    ? subjectGradeMappings.filter(m => m.gradeId === detailStudent.currentGradeId && m.academicYearId === currentAcademicYear.id)
    : [];

  const detailFees = detailStudent && currentAcademicYear
    ? getTotalFeeAmountForGrade(detailStudent.currentGradeId, currentAcademicYear.id) : 0;

  const detailMarksCount = detailStudent && currentAcademicYear
    ? studentMarks.filter(m => m.studentId === detailStudent.id && m.academicYearId === currentAcademicYear.id).length : 0;

  const detailInvoices = detailStudent ? getInvoicesByStudent(detailStudent.id) : [];

  const typeOptions = [
    { value: '', label: t('common.all') },
    { value: 'grade_mismatch', label: language === 'ar' ? '🔴 تعارض الصف' : '🔴 Grade Mismatch' },
    { value: 'orphan_marks', label: language === 'ar' ? '🔴 درجات يتيمة' : '🔴 Orphan Marks' },
    { value: 'no_section', label: language === 'ar' ? '🟡 بدون فصل' : '🟡 No Section' },
    { value: 'missing_fees', label: language === 'ar' ? '🟡 رسوم مفقودة' : '🟡 Missing Fees' },
    { value: 'missing_marks', label: language === 'ar' ? '🔵 درجات مفقودة' : '🔵 Missing Marks' },
    { value: 'age_mismatch', label: language === 'ar' ? '🔵 فرق العمر' : '🔵 Age Mismatch' },
  ];

  return (
    <div className="space-y-6">
      {/* Scan Button */}
      {!hasScanned && (
        <Card>
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {language === 'ar' ? 'نظام تدقيق بيانات الطلاب' : 'Student Data Audit System'}
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-6">
              {language === 'ar'
                ? 'يفحص النظام جميع بيانات الطلاب ويكتشف: التعارضات بين الصفوف والفصول، الدرجات المسجلة لصفوف خاطئة، الرسوم المفقودة، وفروقات الأعمار.'
                : 'The system scans all student data to detect: grade-section mismatches, marks recorded for wrong grades, missing fees, and age discrepancies.'}
            </p>
            <Button size="lg" onClick={runAudit} isLoading={isScanning} leftIcon={<Zap className="w-5 h-5" />}>
              {language === 'ar' ? 'بدء الفحص الشامل' : 'Start Full Audit'}
            </Button>
            <p className="text-sm text-gray-400 mt-4">{branchStudents.length} {language === 'ar' ? 'طالب سيتم فحصهم' : 'students will be scanned'}</p>
          </div>
        </Card>
      )}

      {/* Stats */}
      {hasScanned && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
                <div><p className="text-2xl font-bold text-red-600">{criticalCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'حرج' : 'Critical'}</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-yellow-600" /></div>
                <div><p className="text-2xl font-bold text-yellow-600">{warningCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'تحذير' : 'Warning'}</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><FileWarning className="w-5 h-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold text-blue-600">{infoCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'معلومات' : 'Info'}</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold text-green-600">{resolvedCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'تم حلها' : 'Resolved'}</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <Button onClick={runAudit} isLoading={isScanning} className="w-full h-full" variant="outline" leftIcon={<RefreshCw className="w-4 h-4" />}>
                {language === 'ar' ? 'إعادة الفحص' : 'Re-scan'}
              </Button>
            </Card>
          </div>

          {/* Issues Table */}
          <Card>
            <CardHeader
              title={language === 'ar' ? 'المشاكل المكتشفة' : 'Detected Issues'}
              subtitle={`${filteredIssues.length} ${language === 'ar' ? 'مشكلة' : 'issues'}`}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('common.search')} leftIcon={<Search className="w-5 h-5" />} />
              <Select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} options={[{ value: '', label: t('common.all') }, { value: 'critical', label: language === 'ar' ? '🔴 حرج' : '🔴 Critical' }, { value: 'warning', label: language === 'ar' ? '🟡 تحذير' : '🟡 Warning' }, { value: 'info', label: language === 'ar' ? '🔵 معلومة' : '🔵 Info' }]} />
              <Select value={filterType} onChange={e => setFilterType(e.target.value)} options={typeOptions} />
            </div>

            {filteredIssues.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-600">{language === 'ar' ? 'لا توجد مشاكل!' : 'No issues found!'}</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIssues.map(issue => {
                  const sev = getSeverityInfo(issue.severity);
                  const student = branchStudents.find(s => s.id === issue.studentId);
                  const grade = student ? getEnhancedGradeById(student.currentGradeId) : null;

                  return (
                    <div key={issue.id} className={clsx('p-4 rounded-xl border-s-4 bg-white dark:bg-gray-800 border', issue.severity === 'critical' ? 'border-s-red-500 border-red-200 dark:border-red-800' : issue.severity === 'warning' ? 'border-s-yellow-500 border-yellow-200 dark:border-yellow-800' : 'border-s-blue-500 border-blue-200 dark:border-blue-800')}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', issue.severity === 'critical' ? 'bg-red-100 text-red-600' : issue.severity === 'warning' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600')}>
                            {sev.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900 dark:text-white">{language === 'ar' ? issue.titleAr : issue.titleEn}</span>
                              <Badge variant={sev.variant}>{sev.label}</Badge>
                              <Badge variant="default">{getTypeLabel(issue.type)}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{language === 'ar' ? issue.descriptionAr : issue.descriptionEn}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-gray-500"><User className="w-3.5 h-3.5" />{getStudentName(issue.studentId)}</span>
                              <span className="flex items-center gap-1 text-gray-500"><BookOpen className="w-3.5 h-3.5" />{grade ? getLocalizedValue(grade.name) : '-'}</span>
                              <span className="text-gray-400">{student?.studentNumber}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => openDetail(issue.studentId)} title={language === 'ar' ? 'التفاصيل' : 'Details'}><Eye className="w-4 h-4" /></Button>
                          {student && (issue.type === 'grade_mismatch' || issue.type === 'orphan_marks' || issue.type === 'no_section') && (
                            <Button variant="outline" size="sm" onClick={() => openTransferModal(student)} leftIcon={<Wrench className="w-3.5 h-3.5" />}>
                              {language === 'ar' ? 'تصحيح' : 'Fix'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Transfer / Fix Modal */}
      <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title={language === 'ar' ? '🔧 تصحيح صف الطالب' : '🔧 Fix Student Grade'} size="lg">
        {transferStudent && (
          <div className="space-y-5">
            {/* Current Info */}
            <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">{language === 'ar' ? '📍 الوضع الحالي (الخاطئ)' : '📍 Current (Wrong)'}</p>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-gray-500">{language === 'ar' ? 'الطالب' : 'Student'}</span><p className="font-bold">{getLocalizedValue(transferStudent.firstName)} {getLocalizedValue(transferStudent.lastName)}</p></div>
                <div><span className="text-gray-500">{language === 'ar' ? 'الصف الحالي' : 'Current Grade'}</span><p className="font-bold text-red-600">{getEnhancedGradeById(transferStudent.currentGradeId) ? getLocalizedValue(getEnhancedGradeById(transferStudent.currentGradeId)!.name) : '-'}</p></div>
                <div><span className="text-gray-500">{language === 'ar' ? 'الفصل' : 'Section'}</span><p className="font-bold">{getSectionById(transferStudent.currentSectionId) ? getLocalizedValue(getSectionById(transferStudent.currentSectionId)!.name) : '-'}</p></div>
              </div>
            </div>

            <div className="flex items-center justify-center"><ArrowRight className="w-6 h-6 text-gray-400" /></div>

            {/* New Info */}
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-3">{language === 'ar' ? '✅ البيانات الصحيحة (الجديدة)' : '✅ Correct Data (New)'}</p>
              <div className="grid grid-cols-2 gap-4">
                <Select label={language === 'ar' ? 'الصف الصحيح' : 'Correct Grade'} value={transferNewGradeId} onChange={e => { setTransferNewGradeId(e.target.value); setTransferNewSectionId(''); }} options={[{ value: '', label: t('common.selectOption') }, ...gradeOptions]} required />
                <Select label={language === 'ar' ? 'الفصل' : 'Section'} value={transferNewSectionId} onChange={e => setTransferNewSectionId(e.target.value)} options={[{ value: '', label: t('common.selectOption') }, ...transferSectionOptions]} disabled={!transferNewGradeId} required />
              </div>
            </div>

            {/* Impact Warning */}
            {transferNewGradeId && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{language === 'ar' ? 'تأثير النقل:' : 'Transfer Impact:'}</p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1 list-disc ps-5">
                  <li>{language === 'ar' ? 'سيتم تحديث الصف والفصل والمرحلة التعليمية للطالب' : 'Student grade, section, and level will be updated'}</li>
                  <li>{language === 'ar' ? `رسوم الصف الجديد: ${currentAcademicYear ? getTotalFeeAmountForGrade(transferNewGradeId, currentAcademicYear.id).toLocaleString() : 0} ريال` : `New grade fees: ${currentAcademicYear ? getTotalFeeAmountForGrade(transferNewGradeId, currentAcademicYear.id).toLocaleString() : 0} SAR`}</li>
                  <li>{language === 'ar' ? 'الدرجات السابقة لن تُحذف تلقائياً - يرجى مراجعتها يدوياً' : 'Previous marks won\'t auto-delete - review manually'}</li>
                  <li>{language === 'ar' ? 'الفواتير السابقة تحتاج مراجعة يدوية' : 'Previous invoices need manual review'}</li>
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setIsTransferOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleTransfer} disabled={!transferNewGradeId || !transferNewSectionId} variant="primary" leftIcon={<CheckCircle className="w-4 h-4" />}>
                {language === 'ar' ? 'تنفيذ التصحيح' : 'Execute Fix'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Student Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`📋 ${getStudentName(detailStudentId)}`} size="lg">
        {detailStudent && (
          <div className="space-y-4">
            {/* Student Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'الصف' : 'Grade'}</p><p className="font-bold">{detailGrade ? getLocalizedValue(detailGrade.name) : '-'}</p></Card>
              <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'الفصل' : 'Section'}</p><p className="font-bold">{detailSection ? getLocalizedValue(detailSection.name) : '-'}</p></Card>
              <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'المواد' : 'Subjects'}</p><p className="font-bold">{detailSubjects.length}</p></Card>
              <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'الدرجات' : 'Marks'}</p><p className="font-bold">{detailMarksCount}</p></Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'رسوم الصف' : 'Grade Fees'}</p><p className="font-bold text-blue-600">{detailFees.toLocaleString()} SAR</p></Card>
              <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'الفواتير' : 'Invoices'}</p><p className="font-bold">{detailInvoices.length}</p></Card>
            </div>

            {/* Issues for this student */}
            {detailIssues.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">{language === 'ar' ? 'المشاكل المتعلقة:' : 'Related Issues:'}</h4>
                <div className="space-y-2">
                  {detailIssues.map(issue => {
                    const sev = getSeverityInfo(issue.severity);
                    return (
                      <div key={issue.id} className={clsx('p-3 rounded-lg flex items-center gap-3 text-sm', issue.isResolved ? 'bg-green-50 dark:bg-green-900/10' : issue.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/10' : issue.severity === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/10' : 'bg-blue-50 dark:bg-blue-900/10')}>
                        {issue.isResolved ? <CheckCircle className="w-4 h-4 text-green-500" /> : sev.icon}
                        <span className={issue.isResolved ? 'line-through text-gray-400' : ''}>{language === 'ar' ? issue.titleAr : issue.titleEn}</span>
                        {issue.isResolved && <Badge variant="success">{language === 'ar' ? 'تم الحل' : 'Resolved'}</Badge>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => { setIsDetailOpen(false); openTransferModal(detailStudent); }} leftIcon={<Wrench className="w-4 h-4" />}>
                {language === 'ar' ? 'تصحيح الصف' : 'Fix Grade'}
              </Button>
              <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>{t('common.close')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
