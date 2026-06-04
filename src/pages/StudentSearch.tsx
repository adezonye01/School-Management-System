import React, { useState, useMemo } from 'react';
import {
  Search, User, BookOpen, DollarSign, Heart, Bus
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useAcademicStore } from '../stores/academicStore';
import { useMarksStore } from '../stores/marksStore';
import { useFeeStore } from '../stores/feeStore';
import { useInvoiceStore } from '../stores/invoiceStore';
import { usePart4Store } from '../stores/part4Store';
import { useAppStore } from '../stores/appStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import type { EnhancedStudent } from '../types/database';
import clsx from 'clsx';

type TabType = 'info' | 'academic' | 'financial' | 'behavior' | 'transport';

export const StudentSearch: React.FC = () => {
  const { students, getEnhancedGradeById, getSectionById, subjectGradeMappings, getSubjectById, getEducationLevelById } = useAcademicStore();
  const { calcSemesterTotal, getLetterGrade } = useMarksStore();
  const { getTotalFeeAmountForGrade } = useFeeStore();
  const { getInvoicesByStudent, getPaymentsByStudent } = useInvoiceStore();
  const { getIncidentsByStudent, getStudentTotalPoints, getParentByStudentId, getStudentTransport, getBusesByBranch } = usePart4Store();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { getLocalizedValue, language } = useLocalizedValue();

  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<EnhancedStudent | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');

  const branchStudents = useMemo(() => {
    if (!currentBranch || !currentAcademicYear) return [];
    return students.filter(s => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id);
  }, [currentBranch, currentAcademicYear, students]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return branchStudents.filter(s =>
      s.firstName.ar.includes(q) || s.firstName.en.toLowerCase().includes(q) ||
      s.lastName.ar.includes(q) || s.lastName.en.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q) ||
      s.guardianPhone.includes(q)
    ).slice(0, 10);
  }, [query, branchStudents]);

  // Selected student data
  const grade = selectedStudent ? getEnhancedGradeById(selectedStudent.currentGradeId) : null;
  const section = selectedStudent ? getSectionById(selectedStudent.currentSectionId) : null;
  const level = grade ? getEducationLevelById(grade.educationLevelId) : null;
  const parent = selectedStudent ? getParentByStudentId(selectedStudent.id) : undefined;

  // Academic
  const studentSubjects = selectedStudent && currentAcademicYear
    ? subjectGradeMappings.filter(m => m.gradeId === selectedStudent.currentGradeId && m.academicYearId === currentAcademicYear.id && m.isActive)
    : [];

  const semesterResults = useMemo(() => {
    if (!selectedStudent || !currentBranch || !currentAcademicYear) return [];
    return [1, 2].map(sem => {
      const results = studentSubjects.map(mapping => {
        const subj = getSubjectById(mapping.subjectId);
        const result = calcSemesterTotal(selectedStudent.id, mapping.id, sem as 1 | 2, currentAcademicYear.id, currentBranch.id);
        return { subject: subj, result, lg: getLetterGrade(result.percentage) };
      });
      const avg = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.result.total, 0) / results.length) : 0;
      return { semester: sem, results, avg, lg: getLetterGrade(avg) };
    });
  }, [selectedStudent, currentBranch, currentAcademicYear, studentSubjects, calcSemesterTotal, getLetterGrade, getSubjectById]);

  // Financial
  const invoices = selectedStudent ? getInvoicesByStudent(selectedStudent.id) : [];
  const payments = selectedStudent ? getPaymentsByStudent(selectedStudent.id) : [];
  const totalCharged = invoices.reduce((s, i) => s + i.netAmount, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const gradeFees = selectedStudent && currentAcademicYear ? getTotalFeeAmountForGrade(selectedStudent.currentGradeId, currentAcademicYear.id) : 0;

  // Behavior
  const incidents = selectedStudent && currentAcademicYear ? getIncidentsByStudent(selectedStudent.id, currentAcademicYear.id) : [];
  const totalPoints = selectedStudent && currentAcademicYear ? getStudentTotalPoints(selectedStudent.id, currentAcademicYear.id) : 0;
  const positiveCount = incidents.filter(i => i.type === 'positive').length;
  const negativeCount = incidents.filter(i => i.type === 'negative').length;

  // Transport
  const transport = selectedStudent && currentAcademicYear ? getStudentTransport(selectedStudent.id, currentAcademicYear.id) : undefined;
  const buses = currentBranch ? getBusesByBranch(currentBranch.id) : [];
  const studentBus = transport ? buses.find(b => b.id === transport.busId) : undefined;

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'info', label: isAr ? 'البيانات الشخصية' : 'Personal Info', icon: <User className="w-4 h-4" /> },
    { key: 'academic', label: isAr ? 'الأكاديمي' : 'Academic', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'financial', label: isAr ? 'المالي' : 'Financial', icon: <DollarSign className="w-4 h-4" /> },
    { key: 'behavior', label: isAr ? 'السلوك' : 'Behavior', icon: <Heart className="w-4 h-4" /> },
    { key: 'transport', label: isAr ? 'المواصلات' : 'Transport', icon: <Bus className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
            <Search className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <Input
              value={query}
              onChange={e => { setQuery(e.target.value); if (!e.target.value) setSelectedStudent(null); }}
              placeholder={isAr ? 'ابحث بالاسم أو رقم الطالب أو رقم الهاتف...' : 'Search by name, student number, or phone...'}
              leftIcon={<Search className="w-5 h-5" />}
              className="text-lg"
            />
          </div>
        </div>

        {/* Search Results Dropdown */}
        {query && !selectedStudent && searchResults.length > 0 && (
          <div className="mt-3 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            {searchResults.map(student => {
              const g = getEnhancedGradeById(student.currentGradeId);
              return (
                <button key={student.id} onClick={() => { setSelectedStudent(student); setQuery(''); setActiveTab('info'); }}
                  className="w-full flex items-center gap-4 p-4 hover:bg-blue-50 dark:hover:bg-blue-900/10 border-b last:border-b-0 border-gray-100 dark:border-gray-800 text-start transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {student.firstName.en.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getLocalizedValue(student.firstName)} {getLocalizedValue(student.lastName)}</p>
                    <p className="text-xs text-gray-500">{student.studentNumber} • {g ? getLocalizedValue(g.name) : ''} • {student.guardianPhone}</p>
                  </div>
                  <Badge variant={student.isActive ? 'success' : 'danger'}>{student.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}</Badge>
                </button>
              );
            })}
          </div>
        )}

        {query && !selectedStudent && searchResults.length === 0 && (
          <p className="mt-3 text-center text-gray-500 py-4">{isAr ? 'لا توجد نتائج' : 'No results found'}</p>
        )}
      </Card>

      {/* Student Profile */}
      {selectedStudent && (
        <>
          {/* Student Header Card */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                  {selectedStudent.firstName.en.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{getLocalizedValue(selectedStudent.firstName)} {getLocalizedValue(selectedStudent.lastName)}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="font-mono">{selectedStudent.studentNumber}</span>
                    <Badge variant="info">{grade ? getLocalizedValue(grade.name) : ''}</Badge>
                    {section && <Badge variant="default">{getLocalizedValue(section.name)}</Badge>}
                    {level && <span>{getLocalizedValue(level.name)}</span>}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setSelectedStudent(null)}>{isAr ? 'بحث جديد' : 'New Search'}</Button>
            </div>
          </Card>

          {/* Tabs */}
          <div className="flex overflow-x-auto gap-1 bg-white dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={clsx('flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all', activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700')}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader title={isAr ? '👨‍🎓 بيانات الطالب' : '👨‍🎓 Student Data'} />
                <div className="space-y-3 text-sm">
                  {[
                    [isAr ? 'الاسم (عربي)' : 'Name (AR)', `${selectedStudent.firstName.ar} ${selectedStudent.lastName.ar}`],
                    [isAr ? 'الاسم (إنجليزي)' : 'Name (EN)', `${selectedStudent.firstName.en} ${selectedStudent.lastName.en}`],
                    [isAr ? 'تاريخ الميلاد' : 'DOB', selectedStudent.dateOfBirth],
                    [isAr ? 'الجنس' : 'Gender', selectedStudent.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')],
                    [isAr ? 'الجنسية' : 'Nationality', selectedStudent.nationality || '-'],
                    [isAr ? 'رقم الهوية' : 'National ID', selectedStudent.nationalId || '-'],
                    [isAr ? 'تاريخ التسجيل' : 'Enrolled', selectedStudent.enrollmentDate],
                    [isAr ? 'الحالة' : 'Status', selectedStudent.status],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500">{label}</span><span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card>
                <CardHeader title={isAr ? '👨‍👩‍👧 ولي الأمر' : '👨‍👩‍👧 Guardian'} />
                <div className="space-y-3 text-sm">
                  {parent ? (
                    <>
                      <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{isAr ? 'الاسم' : 'Name'}</span><span className="font-medium">{getLocalizedValue(parent.firstName)} {getLocalizedValue(parent.lastName)}</span></div>
                      <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{isAr ? 'الهاتف' : 'Phone'}</span><span className="font-medium">{parent.phone}</span></div>
                      <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{isAr ? 'البريد' : 'Email'}</span><span className="font-medium">{parent.email || '-'}</span></div>
                      <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{isAr ? 'الصلة' : 'Relation'}</span><span className="font-medium">{parent.relation}</span></div>
                      <div className="flex justify-between py-2"><span className="text-gray-500">{isAr ? 'عدد الأبناء' : 'Children'}</span><Badge variant="info">{parent.studentIds.length}</Badge></div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between py-2 border-b"><span className="text-gray-500">{isAr ? 'الاسم' : 'Name'}</span><span className="font-medium">{selectedStudent.guardianName ? getLocalizedValue(selectedStudent.guardianName) : '-'}</span></div>
                      <div className="flex justify-between py-2"><span className="text-gray-500">{isAr ? 'الهاتف' : 'Phone'}</span><span className="font-medium">{selectedStudent.guardianPhone}</span></div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'academic' && (
            <div className="space-y-4">
              {semesterResults.map(sem => (
                <Card key={sem.semester}>
                  <CardHeader title={isAr ? `📚 ${sem.semester === 1 ? 'الفصل الأول' : 'الفصل الثاني'}` : `📚 Semester ${sem.semester}`}
                    subtitle={sem.avg > 0 ? `${isAr ? 'المعدل' : 'Average'}: ${sem.avg}% - ${isAr ? sem.lg.ar : sem.lg.en}` : undefined} />
                  <Table>
                    <TableHead><TableRow>
                      <TableCell isHeader>{isAr ? 'المادة' : 'Subject'}</TableCell>
                      <TableCell isHeader className="text-center">{isAr ? 'الأعمال' : 'CW'}</TableCell>
                      <TableCell isHeader className="text-center">{isAr ? 'الامتحان' : 'Exam'}</TableCell>
                      <TableCell isHeader className="text-center">{isAr ? 'المجموع' : 'Total'}</TableCell>
                      <TableCell isHeader className="text-center">{isAr ? 'التقدير' : 'Grade'}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {sem.results.map(r => (
                        <TableRow key={r.subject?.id || Math.random()}>
                          <TableCell><span className="font-medium">{r.subject ? getLocalizedValue(r.subject.name) : '-'}</span></TableCell>
                          <TableCell className="text-center">{r.result.monthlyAvg.toFixed(1)}</TableCell>
                          <TableCell className="text-center">{r.result.examMark.toFixed(1)}</TableCell>
                          <TableCell className="text-center"><span className="font-bold">{r.result.total.toFixed(1)}</span></TableCell>
                          <TableCell className="text-center"><span style={{ color: r.lg.color }} className="font-bold">{isAr ? r.lg.ar : r.lg.en}</span></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card padding="sm"><div className="text-center"><p className="text-xs text-gray-500">{isAr ? 'رسوم الصف' : 'Grade Fees'}</p><p className="text-xl font-bold">{gradeFees.toLocaleString()}</p></div></Card>
                <Card padding="sm"><div className="text-center"><p className="text-xs text-gray-500">{isAr ? 'المفوتر' : 'Invoiced'}</p><p className="text-xl font-bold">{totalCharged.toLocaleString()}</p></div></Card>
                <Card padding="sm"><div className="text-center"><p className="text-xs text-gray-500">{isAr ? 'المدفوع' : 'Paid'}</p><p className="text-xl font-bold text-green-600">{totalPaid.toLocaleString()}</p></div></Card>
                <Card padding="sm"><div className="text-center"><p className="text-xs text-gray-500">{isAr ? 'المتبقي' : 'Balance'}</p><p className={clsx('text-xl font-bold', totalCharged - totalPaid > 0 ? 'text-red-600' : 'text-green-600')}>{(totalCharged - totalPaid).toLocaleString()}</p></div></Card>
              </div>

              {invoices.length > 0 && (
                <Card>
                  <CardHeader title={isAr ? '🧾 الفواتير' : '🧾 Invoices'} />
                  <Table>
                    <TableHead><TableRow>
                      <TableCell isHeader>{isAr ? 'الرقم' : '#'}</TableCell>
                      <TableCell isHeader>{isAr ? 'التاريخ' : 'Date'}</TableCell>
                      <TableCell isHeader className="text-center">{isAr ? 'المبلغ' : 'Amount'}</TableCell>
                      <TableCell isHeader className="text-center">{isAr ? 'المدفوع' : 'Paid'}</TableCell>
                      <TableCell isHeader className="text-center">{isAr ? 'الحالة' : 'Status'}</TableCell>
                    </TableRow></TableHead>
                    <TableBody>
                      {invoices.map(inv => (
                        <TableRow key={inv.id}>
                          <TableCell><span className="font-mono text-sm">{inv.invoiceNumber}</span></TableCell>
                          <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">{inv.netAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-center text-green-600 font-medium">{inv.paidAmount.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={inv.status === 'paid' ? 'success' : inv.status === 'overdue' ? 'danger' : 'warning'}>
                              {inv.status === 'paid' ? (isAr ? 'مدفوع' : 'Paid') : inv.status === 'overdue' ? (isAr ? 'متأخر' : 'Overdue') : (isAr ? 'جزئي' : 'Partial')}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'behavior' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-green-600">+{positiveCount}</p><p className="text-xs text-gray-500">{isAr ? 'إيجابي' : 'Positive'}</p></div></Card>
                <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-red-600">{negativeCount}</p><p className="text-xs text-gray-500">{isAr ? 'سلبي' : 'Negative'}</p></div></Card>
                <Card padding="sm"><div className="text-center"><p className={clsx('text-3xl font-bold', totalPoints >= 0 ? 'text-green-600' : 'text-red-600')}>{totalPoints}</p><p className="text-xs text-gray-500">{isAr ? 'الرصيد' : 'Balance'}</p></div></Card>
              </div>

              {incidents.length > 0 && (
                <Card>
                  <CardHeader title={isAr ? '📋 سجل الحوادث' : '📋 Incident Log'} />
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {incidents.map(inc => (
                      <div key={inc.id} className={clsx('p-3 rounded-lg border-s-4', inc.type === 'positive' ? 'bg-green-50 dark:bg-green-900/10 border-green-500' : 'bg-red-50 dark:bg-red-900/10 border-red-500')}>
                        <div className="flex justify-between">
                          <div><p className="font-medium text-sm">{getLocalizedValue(inc.description)}</p><p className="text-xs text-gray-400 mt-1">{inc.date} {inc.time}</p></div>
                          <span className={clsx('text-lg font-bold', inc.points > 0 ? 'text-green-600' : 'text-red-600')}>{inc.points > 0 ? '+' : ''}{inc.points}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'transport' && (
            <Card>
              <CardHeader title={isAr ? '🚌 بيانات المواصلات' : '🚌 Transport Info'} />
              {transport ? (
                <div className="space-y-3 text-sm">
                  {[
                    [isAr ? 'الحافلة' : 'Bus', studentBus ? `${studentBus.busNumber} (${studentBus.plateNumber})` : '-'],
                    [isAr ? 'السائق' : 'Driver', studentBus ? getLocalizedValue(studentBus.driverName) : '-'],
                    [isAr ? 'هاتف السائق' : 'Driver Phone', studentBus?.driverPhone || '-'],
                    [isAr ? 'نقطة الصعود' : 'Pickup', transport.pickupPoint ? getLocalizedValue(transport.pickupPoint) : '-'],
                    [isAr ? 'وقت الصعود' : 'Pickup Time', transport.pickupTime || '-'],
                    [isAr ? 'وقت النزول' : 'Dropoff Time', transport.dropoffTime || '-'],
                    [isAr ? 'الاتجاه' : 'Direction', transport.direction === 'both' ? (isAr ? 'ذهاب وإياب' : 'Both Ways') : transport.direction === 'to_school' ? (isAr ? 'ذهاب' : 'To School') : (isAr ? 'إياب' : 'From School')],
                    [isAr ? 'الرسوم/شهر' : 'Fee/Month', `${transport.monthlyFee.toLocaleString()} SAR`],
                  ].map(([label, val], i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500">{label}</span><span className="font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Bus className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>{isAr ? 'لا يوجد تسجيل في المواصلات' : 'No transport registration'}</p>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {/* Empty state */}
      {!selectedStudent && !query && (
        <Card>
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-500 mb-2">{isAr ? 'ابحث عن طالب' : 'Search for a Student'}</h3>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              {isAr ? 'اكتب اسم الطالب أو رقمه أو رقم هاتف ولي الأمر لعرض جميع بياناته الأكاديمية والمالية والسلوكية' : 'Type student name, number, or guardian phone to view all academic, financial, and behavioral data'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};
