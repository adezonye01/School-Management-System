import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Settings, BookOpen, Calculator, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useMarksStore } from '../stores/marksStore';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { YemenExamPeriod, MonthlyComponent } from '../types/database';
import clsx from 'clsx';

// Type for mark entries: studentId -> component -> marks
type MarkGrid = Record<string, Record<string, { marks: number; isAbsent: boolean }>>;

export const MarkEntry: React.FC = () => {
  const { t } = useTranslation();
  const {
    getActiveConfig, updatePeriodConfig, updateComponentConfig,
    getPeriodsForSemester, getMarks, bulkSaveMarks,
    calcSemesterTotal, getLetterGrade, getMonthlyTotal, getStudentMarksForSubject,
  } = useMarksStore();
  const { getGradesByBranch, students, getSectionsByGrade, subjectGradeMappings, getSubjectById } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { user } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubjectMapping, setSelectedSubjectMapping] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<1 | 2>(1);
  const [selectedPeriod, setSelectedPeriod] = useState<YemenExamPeriod | ''>('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [markGrid, setMarkGrid] = useState<MarkGrid>({});
  const [isSaving, setIsSaving] = useState(false);

  const config = currentBranch ? getActiveConfig(currentBranch.id) : undefined;
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const sections = selectedGrade && currentAcademicYear ? getSectionsByGrade(selectedGrade, currentAcademicYear.id) : [];
  const gradeSubjects = selectedGrade && currentAcademicYear
    ? subjectGradeMappings.filter((m) => m.gradeId === selectedGrade && m.academicYearId === currentAcademicYear.id && m.isActive) : [];
  const semesterPeriods = currentBranch ? getPeriodsForSemester(currentBranch.id, selectedSemester) : [];
  const currentPeriodConfig = semesterPeriods.find((p) => p.period === selectedPeriod);
  const isMonthlyPeriod = currentPeriodConfig?.isMonthly ?? false;
  const components = config?.monthlyComponents || [];

  const gradeStudents = useMemo(() => {
    if (!currentAcademicYear) return [];
    return students
      .filter((s) => s.currentGradeId === selectedGrade && s.academicYearId === currentAcademicYear.id && s.isActive && (!selectedSection || s.currentSectionId === selectedSection))
      .sort((a, b) => (a.firstName.ar + a.lastName.ar).localeCompare(b.firstName.ar + b.lastName.ar, 'ar'));
  }, [selectedGrade, selectedSection, currentAcademicYear, students]);

  const loadMarks = useCallback(() => {
    if (!selectedSubjectMapping || !selectedPeriod || !currentAcademicYear) return;
    const existing = getMarks(selectedSubjectMapping, selectedPeriod as YemenExamPeriod, selectedSemester, currentAcademicYear.id);
    const grid: MarkGrid = {};
    gradeStudents.forEach((s) => {
      grid[s.id] = {};
      if (isMonthlyPeriod) {
        components.forEach((comp) => {
          const mark = existing.find((m) => m.studentId === s.id && m.component === comp.component);
          grid[s.id][comp.component] = mark ? { marks: mark.marks, isAbsent: mark.isAbsent } : { marks: 0, isAbsent: false };
        });
      } else {
        const mark = existing.find((m) => m.studentId === s.id && m.component === 'exam');
        grid[s.id]['exam'] = mark ? { marks: mark.marks, isAbsent: mark.isAbsent } : { marks: 0, isAbsent: false };
      }
    });
    setMarkGrid(grid);
  }, [selectedSubjectMapping, selectedPeriod, selectedSemester, currentAcademicYear, gradeStudents, getMarks, isMonthlyPeriod, components]);

  useEffect(() => {
    if (selectedSubjectMapping && selectedPeriod && gradeStudents.length > 0) loadMarks();
  }, [selectedSubjectMapping, selectedPeriod, gradeStudents.length, loadMarks]);

  const handleMarkChange = (studentId: string, comp: string, value: number) => {
    const maxMarks = comp === 'exam' ? (currentPeriodConfig?.maxMarks || 100) : (components.find((c) => c.component === comp)?.maxMarks || 20);
    setMarkGrid((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [comp]: { marks: Math.min(Math.max(0, value), maxMarks), isAbsent: false } },
    }));
  };

  const handleAbsentToggle = (studentId: string) => {
    setMarkGrid((prev) => {
      const entry = { ...prev[studentId] };
      const isCurrentlyAbsent = Object.values(entry).some((e) => e.isAbsent);
      const newEntry: Record<string, { marks: number; isAbsent: boolean }> = {};
      Object.keys(entry).forEach((k) => { newEntry[k] = { marks: 0, isAbsent: !isCurrentlyAbsent }; });
      return { ...prev, [studentId]: newEntry };
    });
  };

  const getStudentTotal = (studentId: string): number => {
    const entry = markGrid[studentId];
    if (!entry) return 0;
    return Object.values(entry).reduce((s, e) => s + (e.isAbsent ? 0 : e.marks), 0);
  };

  const handleSave = () => {
    if (!selectedSubjectMapping || !selectedPeriod || !currentAcademicYear || !user) return;
    setIsSaving(true);

    const marksToSave: Parameters<typeof bulkSaveMarks>[0] = [];
    Object.entries(markGrid).forEach(([studentId, comps]) => {
      Object.entries(comps).forEach(([comp, entry]) => {
        const maxMarks = comp === 'exam' ? (currentPeriodConfig?.maxMarks || 100) : (components.find((c) => c.component === comp)?.maxMarks || 20);
        marksToSave.push({
          studentId,
          subjectGradeMappingId: selectedSubjectMapping,
          examPeriod: selectedPeriod as YemenExamPeriod,
          component: comp as MonthlyComponent | 'exam',
          semester: selectedSemester,
          academicYearId: currentAcademicYear.id,
          marks: entry.marks,
          maxMarks,
          isAbsent: entry.isAbsent,
          enteredBy: user.id,
        });
      });
    });

    bulkSaveMarks(marksToSave);
    setTimeout(() => { setIsSaving(false); showToast('success', language === 'ar' ? 'تم حفظ الدرجات بنجاح' : 'Marks saved successfully'); }, 400);
  };

  // Options
  const gradeOptions = branchGrades.map((g) => ({ value: g.id, label: getLocalizedValue(g.name) }));
  const sectionOptions = [{ value: '', label: language === 'ar' ? 'الكل' : 'All' }, ...sections.map((s) => ({ value: s.id, label: getLocalizedValue(s.name) }))];
  const subjectOptions = gradeSubjects.map((m) => { const subj = getSubjectById(m.subjectId); return { value: m.id, label: subj ? getLocalizedValue(subj.name) : m.subjectId }; });
  const semesterOptions = [{ value: '1', label: language === 'ar' ? 'الفصل الأول' : 'Semester 1' }, { value: '2', label: language === 'ar' ? 'الفصل الثاني' : 'Semester 2' }];
  const periodOptions = semesterPeriods.map((p) => ({ value: p.period, label: `${getLocalizedValue(p.name)} ${p.isMonthly ? '📋' : '📝'}` }));

  // Stats
  const enteredCount = Object.values(markGrid).filter((e) => Object.values(e).some((v) => v.marks > 0 || v.isAbsent)).length;
  const absentCount = Object.values(markGrid).filter((e) => Object.values(e).some((v) => v.isAbsent)).length;
  const totals = Object.keys(markGrid).map((sid) => getStudentTotal(sid)).filter((t) => t > 0);
  const avgTotal = totals.length > 0 ? Math.round(totals.reduce((s, t) => s + t, 0) / totals.length) : 0;

  const isReady = selectedGrade && selectedSubjectMapping && selectedPeriod && gradeStudents.length > 0;
  const monthlyMax = components.reduce((s, c) => s + c.maxMarks, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'إدخال الدرجات - النظام اليمني' : 'Mark Entry - Yemen System'}</h1>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'سلوك 20 | واجبات 20 | شفهي 20 | تحريري 40 = 100 درجة' : 'Behavior 20 | Homework 20 | Oral 20 | Written 40 = 100'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsConfigOpen(true)} leftIcon={<Settings className="w-4 h-4" />}>{language === 'ar' ? 'الإعدادات' : 'Config'}</Button>
            {isReady && <Button variant="outline" onClick={() => setIsResultsOpen(true)} leftIcon={<BarChart3 className="w-4 h-4" />}>{language === 'ar' ? 'نتائج الفصل' : 'Results'}</Button>}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <Select label={language === 'ar' ? 'الصف' : 'Grade'} value={selectedGrade} onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSubjectMapping(''); setSelectedSection(''); }} options={[{ value: '', label: t('common.selectOption') }, ...gradeOptions]} />
          <Select label={language === 'ar' ? 'الفصل' : 'Section'} value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} options={sectionOptions} disabled={!selectedGrade} />
          <Select label={language === 'ar' ? 'المادة' : 'Subject'} value={selectedSubjectMapping} onChange={(e) => setSelectedSubjectMapping(e.target.value)} options={[{ value: '', label: t('common.selectOption') }, ...subjectOptions]} disabled={!selectedGrade} />
          <Select label={language === 'ar' ? 'الفصل الدراسي' : 'Semester'} value={String(selectedSemester)} onChange={(e) => { setSelectedSemester(parseInt(e.target.value) as 1 | 2); setSelectedPeriod(''); }} options={semesterOptions} />
          <Select label={language === 'ar' ? 'الفترة' : 'Period'} value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value as YemenExamPeriod)} options={[{ value: '', label: t('common.selectOption') }, ...periodOptions]} />
        </div>

        {currentPeriodConfig && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="info">{getLocalizedValue(currentPeriodConfig.name)}</Badge>
            <Badge variant={currentPeriodConfig.isMonthly ? 'warning' : 'danger'}>{currentPeriodConfig.isMonthly ? (language === 'ar' ? '📋 شهري (4 مكونات)' : '📋 Monthly (4 components)') : (language === 'ar' ? '📝 اختبار تحريري' : '📝 Written Exam')}</Badge>
            <Badge variant="default">{language === 'ar' ? 'الوزن' : 'Weight'}: {currentPeriodConfig.weight}%</Badge>
            <Badge variant="success">{gradeStudents.length} {language === 'ar' ? 'طالب' : 'students'}</Badge>
          </div>
        )}
      </Card>

      {/* Stats */}
      {isReady && (
        <div className="grid grid-cols-3 gap-4">
          <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{enteredCount}/{gradeStudents.length}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'تم إدخالهم' : 'Entered'}</p></div></div></Card>
          <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-red-600" /></div><div><p className="text-2xl font-bold text-red-600">{absentCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'غائبون' : 'Absent'}</p></div></div></Card>
          <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><Calculator className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{avgTotal}/{isMonthlyPeriod ? monthlyMax : (currentPeriodConfig?.maxMarks || 100)}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'المتوسط' : 'Average'}</p></div></div></Card>
        </div>
      )}

      {/* Mark Entry Table */}
      {isReady ? (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'إدخال الدرجات' : 'Enter Marks'}</h3>
            <Button onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-4 h-4" />}>{language === 'ar' ? 'حفظ الدرجات' : 'Save Marks'}</Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell isHeader>#</TableCell>
                  <TableCell isHeader>{language === 'ar' ? 'الطالب' : 'Student'}</TableCell>
                  {isMonthlyPeriod ? (
                    <>
                      {components.map((c) => (
                        <TableCell key={c.component} isHeader className="text-center">
                          <div>{getLocalizedValue(c.name)}</div>
                          <div className="text-xs text-gray-400 font-normal">({c.maxMarks})</div>
                        </TableCell>
                      ))}
                    </>
                  ) : (
                    <TableCell isHeader className="text-center w-40">
                      <div>{language === 'ar' ? 'درجة الاختبار' : 'Exam Marks'}</div>
                      <div className="text-xs text-gray-400 font-normal">({currentPeriodConfig?.maxMarks || 100})</div>
                    </TableCell>
                  )}
                  <TableCell isHeader className="text-center">{language === 'ar' ? 'المجموع' : 'Total'}</TableCell>
                  <TableCell isHeader className="text-center w-16">{language === 'ar' ? 'غ' : 'Ab'}</TableCell>
                  <TableCell isHeader className="text-center">{language === 'ar' ? 'التقدير' : 'Grade'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gradeStudents.map((student, idx) => {
                  const entry = markGrid[student.id] || {};
                  const isAbsent = Object.values(entry).some((e) => e.isAbsent);
                  const total = getStudentTotal(student.id);
                  const maxTotal = isMonthlyPeriod ? monthlyMax : (currentPeriodConfig?.maxMarks || 100);
                  const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
                  const grade = getLetterGrade(pct);

                  return (
                    <TableRow key={student.id} className={clsx(isAbsent && 'bg-red-50 dark:bg-red-900/5')}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>
                        <div><span className="font-medium">{getLocalizedValue(student.firstName)} {getLocalizedValue(student.lastName)}</span></div>
                        <div className="text-xs text-gray-400">{student.studentNumber}</div>
                      </TableCell>

                      {isMonthlyPeriod ? (
                        components.map((c) => (
                          <TableCell key={c.component} className="text-center">
                            <Input
                              type="number"
                              value={isAbsent ? '' : (entry[c.component]?.marks ?? 0)}
                              onChange={(e) => handleMarkChange(student.id, c.component, parseFloat(e.target.value) || 0)}
                              min={0} max={c.maxMarks}
                              disabled={isAbsent}
                              className={clsx('w-20 text-center mx-auto', isAbsent && 'opacity-20')}
                              placeholder={isAbsent ? 'غ' : '0'}
                            />
                          </TableCell>
                        ))
                      ) : (
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={isAbsent ? '' : (entry['exam']?.marks ?? 0)}
                            onChange={(e) => handleMarkChange(student.id, 'exam', parseFloat(e.target.value) || 0)}
                            min={0} max={currentPeriodConfig?.maxMarks || 100}
                            disabled={isAbsent}
                            className={clsx('w-24 text-center mx-auto', isAbsent && 'opacity-20')}
                            placeholder={isAbsent ? 'غ' : '0'}
                          />
                        </TableCell>
                      )}

                      <TableCell className="text-center">
                        {!isAbsent ? (
                          <span className="text-lg font-bold" style={{ color: total > 0 ? grade.color : undefined }}>
                            {total}<span className="text-xs text-gray-400">/{maxTotal}</span>
                          </span>
                        ) : <Badge variant="danger">{language === 'ar' ? 'غائب' : 'Absent'}</Badge>}
                      </TableCell>

                      <TableCell className="text-center">
                        <button onClick={() => handleAbsentToggle(student.id)}
                          className={clsx('w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold transition-all mx-auto', isAbsent ? 'bg-red-500 border-red-500 text-white' : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-red-400')}>
                          {isAbsent ? '✕' : ''}
                        </button>
                      </TableCell>

                      <TableCell className="text-center">
                        {!isAbsent && total > 0 ? (
                          <Badge variant="default"><span style={{ color: grade.color }} className="font-bold">{language === 'ar' ? grade.ar : grade.en}</span></Badge>
                        ) : <span className="text-gray-300">-</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4 pt-4 border-t">
            <Button onClick={handleSave} isLoading={isSaving} size="lg" leftIcon={<Save className="w-5 h-5" />}>{language === 'ar' ? 'حفظ جميع الدرجات' : 'Save All'}</Button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">{language === 'ar' ? 'اختر الصف والمادة والفترة' : 'Select grade, subject and period'}</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              {language === 'ar' ? 'الشهري: سلوك (20) + واجبات (20) + شفهي (20) + تحريري (40) = 100 درجة\nالنصفي/النهائي: اختبار تحريري 100 درجة' : 'Monthly: Behavior(20) + Homework(20) + Oral(20) + Written(40) = 100\nMidterm/Final: Written exam 100 marks'}
            </p>
          </div>
        </Card>
      )}

      {/* Config Modal */}
      <Modal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title={language === 'ar' ? '⚙️ إعدادات النظام اليمني' : '⚙️ Yemen System Config'} size="full">
        {config && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">{language === 'ar' ? 'يتكون كل شهري من: سلوك + واجبات + شفهي + تحريري. يمكنك تعديل الدرجة العظمى لكل مكون والوزن لكل فترة.' : 'Each monthly has: Behavior + Homework + Oral + Written. You can adjust max marks and weights.'}</p>
            </div>

            {/* Monthly Components */}
            <div>
              <h4 className="font-semibold text-lg mb-3">{language === 'ar' ? '📋 مكونات الدرجة الشهرية' : '📋 Monthly Components'}</h4>
              <Table>
                <TableHead><TableRow>
                  <TableCell isHeader>{language === 'ar' ? 'المكون' : 'Component'}</TableCell>
                  <TableCell isHeader>{language === 'ar' ? 'الدرجة العظمى' : 'Max Marks'}</TableCell>
                  <TableCell isHeader>{language === 'ar' ? 'النسبة' : 'Share'}</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {config.monthlyComponents.map((c) => (
                    <TableRow key={c.component}>
                      <TableCell><span className="font-medium">{getLocalizedValue(c.name)}</span></TableCell>
                      <TableCell>
                        <Input type="number" value={c.maxMarks} onChange={(e) => updateComponentConfig(config.id, c.component, { maxMarks: parseInt(e.target.value) || 0 })} min={0} className="w-24" />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">{Math.round((c.maxMarks / config.monthlyComponents.reduce((s, x) => s + x.maxMarks, 0)) * 100)}%</span>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell><span className="font-bold">{language === 'ar' ? 'الإجمالي' : 'Total'}</span></TableCell>
                    <TableCell><span className="text-lg font-bold text-blue-600">{config.monthlyComponents.reduce((s, c) => s + c.maxMarks, 0)}</span></TableCell>
                    <TableCell><span className="font-bold">100%</span></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Semester Periods */}
            {[1, 2].map((sem) => {
              const periods = config.examPeriods.filter((p) => p.semester === sem).sort((a, b) => a.order - b.order);
              const totalWeight = periods.reduce((s, p) => s + p.weight, 0);
              return (
                <div key={sem}>
                  <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">{sem}</span>
                    {language === 'ar' ? `الفصل ${sem === 1 ? 'الأول' : 'الثاني'}` : `Semester ${sem}`}
                    <Badge variant={totalWeight === 100 ? 'success' : 'danger'}>{totalWeight}%</Badge>
                  </h4>
                  <Table>
                    <TableHead><TableRow>
                      <TableCell isHeader>{language === 'ar' ? 'الفترة' : 'Period'}</TableCell>
                      <TableCell isHeader>{language === 'ar' ? 'النوع' : 'Type'}</TableCell>
                      <TableCell isHeader>{language === 'ar' ? 'الدرجة العظمى' : 'Max'}</TableCell>
                      <TableCell isHeader>{language === 'ar' ? 'الوزن %' : 'Weight %'}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {periods.map((p) => (
                        <TableRow key={p.period}>
                          <TableCell><span className="font-medium">{getLocalizedValue(p.name)}</span></TableCell>
                          <TableCell><Badge variant={p.isMonthly ? 'warning' : 'info'}>{p.isMonthly ? (language === 'ar' ? 'شهري' : 'Monthly') : (language === 'ar' ? 'اختبار' : 'Exam')}</Badge></TableCell>
                          <TableCell><Input type="number" value={p.maxMarks} onChange={(e) => updatePeriodConfig(config.id, p.period, { maxMarks: parseInt(e.target.value) || 0 })} min={0} className="w-24" /></TableCell>
                          <TableCell><Input type="number" value={p.weight} onChange={(e) => updatePeriodConfig(config.id, p.period, { weight: parseInt(e.target.value) || 0 })} min={0} max={100} className="w-24" /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              );
            })}
            <div className="flex justify-end pt-4 border-t"><Button onClick={() => setIsConfigOpen(false)}>{t('common.close')}</Button></div>
          </div>
        )}
      </Modal>

      {/* Results Modal */}
      <Modal isOpen={isResultsOpen} onClose={() => setIsResultsOpen(false)} title={language === 'ar' ? `📊 نتائج ${selectedSemester === 1 ? 'الفصل الأول' : 'الفصل الثاني'}` : `📊 Semester ${selectedSemester} Results`} size="full">
        {currentBranch && currentAcademicYear && selectedSubjectMapping && (
          <div className="space-y-4">
            <Table>
              <TableHead><TableRow>
                <TableCell isHeader>#</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'الطالب' : 'Student'}</TableCell>
                {semesterPeriods.map((p) => (
                  <TableCell key={p.period} isHeader className="text-center">
                    <div className="text-xs">{getLocalizedValue(p.name)}</div>
                    <div className="text-[10px] text-gray-400">({p.maxMarks}) {p.weight}%</div>
                  </TableCell>
                ))}
                <TableCell isHeader className="text-center">{language === 'ar' ? 'الأعمال' : 'CW'}</TableCell>
                <TableCell isHeader className="text-center">{language === 'ar' ? 'الامتحان' : 'Exam'}</TableCell>
                <TableCell isHeader className="text-center">{language === 'ar' ? 'المجموع' : 'Total'}</TableCell>
                <TableCell isHeader className="text-center">{language === 'ar' ? 'التقدير' : 'Grade'}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {gradeStudents.map((student, idx) => {
                  const result = calcSemesterTotal(student.id, selectedSubjectMapping, selectedSemester, currentAcademicYear.id, currentBranch.id);
                  const lg = getLetterGrade(result.percentage);
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell><span className="font-medium">{getLocalizedValue(student.firstName)} {getLocalizedValue(student.lastName)}</span></TableCell>
                      {semesterPeriods.map((p) => {
                        const total = p.isMonthly
                          ? getMonthlyTotal(student.id, selectedSubjectMapping, p.period, currentAcademicYear.id)
                          : (() => {
                              const marks = getStudentMarksForSubject(student.id, selectedSubjectMapping, currentAcademicYear.id);
                              const examMark = marks.find((m) => m.examPeriod === p.period && m.component === 'exam');
                              return examMark ? (examMark.isAbsent ? -1 : examMark.marks) : 0;
                            })();
                        return (
                          <TableCell key={p.period} className="text-center">
                            {total === -1 ? <Badge variant="danger">{language === 'ar' ? 'غ' : 'Ab'}</Badge>
                              : total > 0 ? <span className="font-bold">{total}</span>
                              : <span className="text-gray-300">-</span>}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center"><span className="font-bold text-blue-600">{result.monthlyAvg.toFixed(1)}</span></TableCell>
                      <TableCell className="text-center"><span className="font-bold text-purple-600">{result.examMark.toFixed(1)}</span></TableCell>
                      <TableCell className="text-center"><span className="text-lg font-bold">{result.total.toFixed(1)}</span></TableCell>
                      <TableCell className="text-center"><span style={{ color: lg.color }} className="font-bold">{language === 'ar' ? lg.ar : lg.en}</span></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="flex justify-end pt-4 border-t"><Button onClick={() => setIsResultsOpen(false)}>{t('common.close')}</Button></div>
          </div>
        )}
      </Modal>
    </div>
  );
};
