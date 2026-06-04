import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpCircle, Archive, CheckCircle, XCircle, AlertTriangle,
  Users, GraduationCap, Calendar, RefreshCw,
  Zap
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useAcademicStore } from '../stores/academicStore';
import { useMarksStore } from '../stores/marksStore';
import { useDataStore } from '../stores/dataStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { EnhancedStudent } from '../types/database';
import clsx from 'clsx';

// Promotion result for a student
interface PromotionResult {
  student: EnhancedStudent;
  average: number;
  isPassed: boolean;
  currentGradeName: string;
  nextGradeId: string | null;
  nextGradeName: string;
  selected: boolean;
  overridePass?: boolean; // manual override
}

export const Promotion: React.FC = () => {
  const { t } = useTranslation();
  const {
    students, getGradesByBranch, getEnhancedGradeById,
    subjectGradeMappings, updateStudent,
  } = useAcademicStore();
  const { calcSemesterTotal, getLetterGrade } = useMarksStore();
  const {
    addAcademicYear, archiveAcademicYear,
    setCurrentAcademicYear,
  } = useDataStore();
  const { currentBranch, currentAcademicYear, setCurrentAcademicYear: setAppYear } = useAppStore();
  useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const isAr = language === 'ar';

  const [selectedGrade, setSelectedGrade] = useState('');
  const [passingPercentage, setPassingPercentage] = useState(50);
  const [promotionResults, setPromotionResults] = useState<PromotionResult[]>([]);
  const [hasCalculated, setHasCalculated] = useState(false);

  // New Year Modal
  const [isNewYearOpen, setIsNewYearOpen] = useState(false);
  const [newYearNameAr, setNewYearNameAr] = useState('');
  const [newYearNameEn, setNewYearNameEn] = useState('');
  const [newYearStart, setNewYearStart] = useState('');
  const [newYearEnd, setNewYearEnd] = useState('');

  // Promote Modal
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  // Archive Modal
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const gradeOptions = branchGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }));

  const branchStudents = useMemo(() => {
    if (!currentBranch || !currentAcademicYear) return [];
    return students.filter(s =>
      s.branchId === currentBranch.id &&
      s.academicYearId === currentAcademicYear.id &&
      s.isActive &&
      (!selectedGrade || s.currentGradeId === selectedGrade)
    );
  }, [currentBranch, currentAcademicYear, students, selectedGrade]);

  // Calculate promotion results
  const calculateResults = () => {
    if (!currentBranch || !currentAcademicYear) return;

    const results: PromotionResult[] = branchStudents.map(student => {
      const grade = getEnhancedGradeById(student.currentGradeId);
      const gradeSubjects = subjectGradeMappings.filter(
        m => m.gradeId === student.currentGradeId && m.academicYearId === currentAcademicYear.id && m.isActive
      );

      // Calculate annual average (average of both semesters)
      let totalMarks = 0;
      let subjectCount = 0;
      gradeSubjects.forEach(mapping => {
        const s1 = calcSemesterTotal(student.id, mapping.id, 1, currentAcademicYear.id, currentBranch.id);
        const s2 = calcSemesterTotal(student.id, mapping.id, 2, currentAcademicYear.id, currentBranch.id);
        const annual = (s1.total + s2.total) / 2;
        if (s1.total > 0 || s2.total > 0) {
          totalMarks += annual;
          subjectCount++;
        }
      });

      const average = subjectCount > 0 ? Math.round((totalMarks / subjectCount) * 100) / 100 : 0;
      const isPassed = average >= passingPercentage;

      return {
        student,
        average,
        isPassed,
        currentGradeName: grade ? getLocalizedValue(grade.name) : '-',
        nextGradeId: grade?.nextGradeId || null,
        nextGradeName: grade?.nextGradeId ? (getEnhancedGradeById(grade.nextGradeId) ? getLocalizedValue(getEnhancedGradeById(grade.nextGradeId)!.name) : isAr ? 'متخرج' : 'Graduated') : (isAr ? 'متخرج / آخر صف' : 'Graduated / Final'),
        selected: isPassed,
      };
    });

    setPromotionResults(results);
    setHasCalculated(true);
  };

  const toggleStudentSelection = (studentId: string) => {
    setPromotionResults(prev => prev.map(r =>
      r.student.id === studentId ? { ...r, selected: !r.selected, overridePass: !r.selected !== r.isPassed ? !r.selected : undefined } : r
    ));
  };

  const selectAllPassed = () => {
    setPromotionResults(prev => prev.map(r => ({ ...r, selected: r.isPassed })));
  };

  const selectAll = () => {
    setPromotionResults(prev => prev.map(r => ({ ...r, selected: true })));
  };

  const deselectAll = () => {
    setPromotionResults(prev => prev.map(r => ({ ...r, selected: false })));
  };

  // Stats
  const totalStudents = promotionResults.length;
  const passedCount = promotionResults.filter(r => r.isPassed).length;
  const failedCount = promotionResults.filter(r => !r.isPassed).length;
  const selectedCount = promotionResults.filter(r => r.selected).length;
  const overrideCount = promotionResults.filter(r => r.overridePass !== undefined).length;

  // Execute promotion
  const handlePromote = () => {
    if (!currentAcademicYear) return;
    setIsPromoting(true);

    const promoted: string[] = [];
    const retained: string[] = [];

    promotionResults.forEach(result => {
      if (result.selected && result.nextGradeId) {
        // Promote: move to next grade
        updateStudent(result.student.id, {
          currentGradeId: result.nextGradeId,
          currentSectionId: '', // Will need reassignment
        });
        promoted.push(result.student.id);
      } else if (result.selected && !result.nextGradeId) {
        // Graduated (last grade)
        updateStudent(result.student.id, {
          status: 'graduated',
          isActive: false,
        });
        promoted.push(result.student.id);
      } else {
        // Retained in same grade
        retained.push(result.student.id);
      }
    });

    setTimeout(() => {
      setIsPromoting(false);
      setIsPromoteOpen(false);
      showToast('success',
        isAr
          ? `تم ترفيع ${promoted.length} طالب وإبقاء ${retained.length} طالب`
          : `${promoted.length} promoted, ${retained.length} retained`
      );
      setHasCalculated(false);
      setPromotionResults([]);
    }, 1000);
  };

  // Create new academic year
  const handleCreateNewYear = () => {
    if (!currentBranch || !newYearNameAr || !newYearStart || !newYearEnd) return;

    const newYear = addAcademicYear({
      branchId: currentBranch.id,
      name: { ar: newYearNameAr, en: newYearNameEn || newYearNameAr },
      startDate: newYearStart,
      endDate: newYearEnd,
      isCurrent: true,
      isArchived: false,
    });

    // Set as current
    setCurrentAcademicYear(currentBranch.id, newYear.id);
    setAppYear(newYear);

    showToast('success', isAr ? 'تم إنشاء السنة الدراسية الجديدة' : 'New academic year created');
    setIsNewYearOpen(false);
  };

  // Archive current year
  const handleArchive = () => {
    if (!currentAcademicYear) return;
    archiveAcademicYear(currentAcademicYear.id);
    showToast('success', isAr ? 'تم أرشفة السنة الدراسية' : 'Academic year archived');
    setIsArchiveOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{isAr ? 'ترفيع الطلاب وأرشفة السنة' : 'Student Promotion & Year Archive'}</h1>
              <p className="text-sm text-gray-500">
                {currentAcademicYear ? getLocalizedValue(currentAcademicYear.name) : '-'}
                {currentAcademicYear?.isArchived && <span className="ms-2"><Badge variant="warning" size="sm">{isAr ? 'مؤرشفة' : 'Archived'}</Badge></span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsNewYearOpen(true)} leftIcon={<Calendar className="w-4 h-4" />}>
              {isAr ? 'سنة جديدة' : 'New Year'}
            </Button>
            {currentAcademicYear && !currentAcademicYear.isArchived && (
              <Button variant="outline" onClick={() => setIsArchiveOpen(true)} leftIcon={<Archive className="w-4 h-4" />} className="text-orange-600">
                {isAr ? 'أرشفة السنة' : 'Archive Year'}
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select label={isAr ? 'الصف (اتركه فارغاً لجميع الصفوف)' : 'Grade (empty for all)'} value={selectedGrade} onChange={e => { setSelectedGrade(e.target.value); setHasCalculated(false); }} options={[{ value: '', label: isAr ? 'جميع الصفوف' : 'All Grades' }, ...gradeOptions]} />
          <Input label={isAr ? 'نسبة النجاح (%)' : 'Passing % '} type="number" value={passingPercentage} onChange={e => { setPassingPercentage(parseInt(e.target.value) || 50); setHasCalculated(false); }} min={0} max={100} />
          <div className="flex items-end">
            <Button onClick={calculateResults} className="w-full" leftIcon={<Zap className="w-4 h-4" />}>
              {isAr ? 'حساب نتائج الترفيع' : 'Calculate Promotion Results'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {hasCalculated && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div>
                <div><p className="text-2xl font-bold">{totalStudents}</p><p className="text-xs text-gray-500">{isAr ? 'إجمالي' : 'Total'}</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div><p className="text-2xl font-bold text-green-600">{passedCount}</p><p className="text-xs text-gray-500">{isAr ? 'ناجح' : 'Passed'}</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><XCircle className="w-5 h-5 text-red-600" /></div>
                <div><p className="text-2xl font-bold text-red-600">{failedCount}</p><p className="text-xs text-gray-500">{isAr ? 'راسب' : 'Failed'}</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><ArrowUpCircle className="w-5 h-5 text-purple-600" /></div>
                <div><p className="text-2xl font-bold text-purple-600">{selectedCount}</p><p className="text-xs text-gray-500">{isAr ? 'سيُرفّع' : 'To Promote'}</p></div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-yellow-600" /></div>
                <div><p className="text-2xl font-bold text-yellow-600">{overrideCount}</p><p className="text-xs text-gray-500">{isAr ? 'تجاوز يدوي' : 'Override'}</p></div>
              </div>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{isAr ? 'نتائج الترفيع' : 'Promotion Results'}</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllPassed}>{isAr ? 'تحديد الناجحين' : 'Select Passed'}</Button>
                <Button variant="outline" size="sm" onClick={selectAll}>{isAr ? 'تحديد الكل' : 'Select All'}</Button>
                <Button variant="outline" size="sm" onClick={deselectAll}>{isAr ? 'إلغاء الكل' : 'Deselect All'}</Button>
                <Button onClick={() => setIsPromoteOpen(true)} disabled={selectedCount === 0} leftIcon={<ArrowUpCircle className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700">
                  {isAr ? `ترفيع ${selectedCount} طالب` : `Promote ${selectedCount} Students`}
                </Button>
              </div>
            </div>

            <Table>
              <TableHead><TableRow>
                <TableCell isHeader className="w-10">✓</TableCell>
                <TableCell isHeader>#</TableCell>
                <TableCell isHeader>{isAr ? 'الطالب' : 'Student'}</TableCell>
                <TableCell isHeader>{isAr ? 'الصف الحالي' : 'Current Grade'}</TableCell>
                <TableCell isHeader>{isAr ? 'المعدل السنوي' : 'Annual Avg'}</TableCell>
                <TableCell isHeader>{isAr ? 'الحالة' : 'Status'}</TableCell>
                <TableCell isHeader>{isAr ? 'الصف التالي' : 'Next Grade'}</TableCell>
                <TableCell isHeader>{isAr ? 'القرار' : 'Decision'}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {promotionResults.length === 0 ? (
                  <TableRow><TableCell className="text-center py-8" colSpan={8}>
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-gray-500">{t('common.noData')}</p>
                  </TableCell></TableRow>
                ) : promotionResults.map((result, idx) => {
                  const lg = getLetterGrade(Math.round(result.average));
                  return (
                    <TableRow key={result.student.id} className={clsx(result.overridePass !== undefined && 'bg-yellow-50 dark:bg-yellow-900/5')}>
                      <TableCell>
                        <Checkbox checked={result.selected} onChange={() => toggleStudentSelection(result.student.id)} />
                      </TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium">{getLocalizedValue(result.student.firstName)} {getLocalizedValue(result.student.lastName)}</span>
                          <p className="text-xs text-gray-400">{result.student.studentNumber}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="default">{result.currentGradeName}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: lg.color }}>{result.average.toFixed(1)}%</span>
                          <span className="text-xs" style={{ color: lg.color }}>{isAr ? lg.ar : lg.en}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.isPassed ? 'success' : 'danger'}>
                          {result.isPassed ? (isAr ? '✓ ناجح' : '✓ Pass') : (isAr ? '✗ راسب' : '✗ Fail')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.selected ? (
                          <span className="text-green-600 font-medium flex items-center gap-1">
                            <ArrowUpCircle className="w-4 h-4" />
                            {result.nextGradeId ? result.nextGradeName : (isAr ? '🎓 تخرّج' : '🎓 Graduate')}
                          </span>
                        ) : (
                          <span className="text-orange-600 font-medium flex items-center gap-1">
                            <RefreshCw className="w-4 h-4" />
                            {isAr ? 'يبقى' : 'Retain'}: {result.currentGradeName}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {result.overridePass !== undefined && (
                          <Badge variant="warning">{isAr ? 'تجاوز يدوي' : 'Override'}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Not calculated yet */}
      {!hasCalculated && (
        <Card>
          <div className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">{isAr ? 'اضغط "حساب نتائج الترفيع" للبدء' : 'Click "Calculate" to start'}</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              {isAr
                ? 'النظام سيحسب المعدل السنوي لكل طالب (متوسط الفصلين) ويحدد الناجحين والراسبين. يمكنك تجاوز النتيجة يدوياً لأي طالب.'
                : 'The system will calculate each student\'s annual average (both semesters) and determine pass/fail. You can manually override any result.'}
            </p>
          </div>
        </Card>
      )}

      {/* Promote Confirmation Modal */}
      <Modal isOpen={isPromoteOpen} onClose={() => setIsPromoteOpen(false)} title={isAr ? '🎓 تأكيد الترفيع' : '🎓 Confirm Promotion'} size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-300">{isAr ? 'سيتم تنفيذ الإجراءات التالية:' : 'The following actions will be executed:'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl">
              <p className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2"><ArrowUpCircle className="w-4 h-4" />{isAr ? 'سيُرفّع' : 'Will Promote'}</p>
              <p className="text-3xl font-bold text-green-600">{selectedCount}</p>
              <p className="text-xs text-gray-500">{isAr ? 'طالب إلى الصف التالي' : 'students to next grade'}</p>
            </div>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl">
              <p className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-2"><RefreshCw className="w-4 h-4" />{isAr ? 'سيبقى' : 'Will Retain'}</p>
              <p className="text-3xl font-bold text-orange-600">{totalStudents - selectedCount}</p>
              <p className="text-xs text-gray-500">{isAr ? 'طالب في نفس الصف' : 'students in same grade'}</p>
            </div>
          </div>

          {overrideCount > 0 && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
              <AlertTriangle className="w-4 h-4" />
              {isAr ? `تنبيه: ${overrideCount} طالب تم تجاوز نتيجتهم يدوياً` : `Warning: ${overrideCount} students have manual overrides`}
            </div>
          )}

          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
            <p className="text-sm font-bold text-red-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{isAr ? 'تحذير:' : 'Warning:'}</p>
            <ul className="text-sm text-red-700 mt-2 space-y-1 list-disc ps-5">
              <li>{isAr ? 'هذا الإجراء لا يمكن التراجع عنه' : 'This action cannot be undone'}</li>
              <li>{isAr ? 'سيتم نقل الطلاب المُختارين إلى الصف التالي' : 'Selected students will move to next grade'}</li>
              <li>{isAr ? 'الفصول ستحتاج إعادة تعيين يدوياً' : 'Sections will need manual reassignment'}</li>
              <li>{isAr ? 'يُنصح بأرشفة السنة بعد الترفيع' : 'Archive the year after promotion is recommended'}</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsPromoteOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handlePromote} isLoading={isPromoting} leftIcon={<ArrowUpCircle className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700">
              {isAr ? 'تنفيذ الترفيع' : 'Execute Promotion'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Year Modal */}
      <Modal isOpen={isNewYearOpen} onClose={() => setIsNewYearOpen(false)} title={isAr ? '📅 إنشاء سنة دراسية جديدة' : '📅 Create New Academic Year'} size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-300">{isAr ? 'سيتم إنشاء سنة جديدة وتعيينها كالسنة الحالية. يُنصح بإنشائها بعد ترفيع الطلاب.' : 'A new year will be created and set as current. Recommended after student promotion.'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'اسم السنة (عربي)' : 'Year Name (AR)'} value={newYearNameAr} onChange={e => setNewYearNameAr(e.target.value)} dir="rtl" required placeholder="العام الدراسي 2025-2026" />
            <Input label={isAr ? 'اسم السنة (إنجليزي)' : 'Year Name (EN)'} value={newYearNameEn} onChange={e => setNewYearNameEn(e.target.value)} dir="ltr" placeholder="Academic Year 2025-2026" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'تاريخ البدء' : 'Start Date'} type="date" value={newYearStart} onChange={e => setNewYearStart(e.target.value)} required />
            <Input label={isAr ? 'تاريخ الانتهاء' : 'End Date'} type="date" value={newYearEnd} onChange={e => setNewYearEnd(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsNewYearOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateNewYear} disabled={!newYearNameAr || !newYearStart || !newYearEnd} leftIcon={<Calendar className="w-4 h-4" />}>{isAr ? 'إنشاء السنة' : 'Create Year'}</Button>
          </div>
        </div>
      </Modal>

      {/* Archive Modal */}
      <Modal isOpen={isArchiveOpen} onClose={() => setIsArchiveOpen(false)} title={isAr ? '📦 أرشفة السنة الدراسية' : '📦 Archive Academic Year'} size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800">
            <p className="text-sm font-bold text-orange-800 flex items-center gap-2"><Archive className="w-4 h-4" />{isAr ? 'ماذا يحدث عند الأرشفة:' : 'What happens on archive:'}</p>
            <ul className="text-sm text-orange-700 mt-2 space-y-1 list-disc ps-5">
              <li>{isAr ? 'السنة لن تكون "الحالية" بعد الآن' : 'Year will no longer be "current"'}</li>
              <li>{isAr ? 'جميع البيانات (درجات، رسوم، سلوك) ستُحفظ للرجوع إليها' : 'All data (marks, fees, behavior) will be preserved'}</li>
              <li>{isAr ? 'لن يمكن تعديل البيانات المؤرشفة' : 'Archived data cannot be modified'}</li>
              <li>{isAr ? 'تأكد من ترفيع الطلاب أولاً' : 'Make sure to promote students first'}</li>
            </ul>
          </div>
          {currentAcademicYear && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
              <p className="text-sm text-gray-500">{isAr ? 'السنة المراد أرشفتها:' : 'Year to archive:'}</p>
              <p className="text-lg font-bold">{getLocalizedValue(currentAcademicYear.name)}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsArchiveOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleArchive} leftIcon={<Archive className="w-4 h-4" />} className="bg-orange-600 hover:bg-orange-700 text-white">{isAr ? 'تأكيد الأرشفة' : 'Confirm Archive'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
