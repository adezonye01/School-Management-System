import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users, DollarSign, BookOpen, Printer,
  GraduationCap, PieChart,
  Bus, Shield
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useAcademicStore } from '../stores/academicStore';
import { useMarksStore } from '../stores/marksStore';
import { useFeeStore } from '../stores/feeStore';
import { useInvoiceStore } from '../stores/invoiceStore';
import { usePart4Store } from '../stores/part4Store';
import { useAppStore } from '../stores/appStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import clsx from 'clsx';

type ReportType = 'overview' | 'academic' | 'financial' | 'behavior' | 'transport';

export const Reports: React.FC = () => {
  useTranslation();
  const { students, getGradesByBranch, subjectGradeMappings, getSectionsByGrade } = useAcademicStore();
  const { calcSemesterTotal, getLetterGrade } = useMarksStore();
  const { getTotalFeeAmountForGrade } = useFeeStore();
  const { invoices, payments } = useInvoiceStore();
  const { getIncidentsByBranch, getBusesByBranch, studentTransports, getTransportZonesByBranch } = usePart4Store();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { getLocalizedValue, language } = useLocalizedValue();

  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [selectedGrade, setSelectedGrade] = useState('');

  const isAr = language === 'ar';
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const gradeOptions = [{ value: '', label: isAr ? 'جميع الصفوف' : 'All Grades' }, ...branchGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }))];

  const branchStudents = useMemo(() => {
    if (!currentBranch || !currentAcademicYear) return [];
    return students.filter(s => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id && s.isActive && (!selectedGrade || s.currentGradeId === selectedGrade));
  }, [currentBranch, currentAcademicYear, students, selectedGrade]);

  const branchInvoices = currentBranch && currentAcademicYear ? invoices.filter(i => i.branchId === currentBranch.id && i.academicYearId === currentAcademicYear.id) : [];
  const branchPayments = currentBranch ? payments.filter(p => p.branchId === currentBranch.id) : [];
  const branchIncidents = currentBranch && currentAcademicYear ? getIncidentsByBranch(currentBranch.id, currentAcademicYear.id) : [];
  const branchBuses = currentBranch ? getBusesByBranch(currentBranch.id) : [];
  const branchZones = currentBranch ? getTransportZonesByBranch(currentBranch.id) : [];
  const transportAssignments = currentBranch ? studentTransports.filter(t => t.branchId === currentBranch.id && t.isActive) : [];

  // Academic stats per grade
  const gradeStats = useMemo(() => {
    if (!currentBranch || !currentAcademicYear) return [];
    return branchGrades.map(grade => {
      const gradeStudents = students.filter(s => s.currentGradeId === grade.id && s.academicYearId === currentAcademicYear.id && s.branchId === currentBranch.id && s.isActive);
      const sections = getSectionsByGrade(grade.id, currentAcademicYear.id);
      const subjects = subjectGradeMappings.filter(m => m.gradeId === grade.id && m.academicYearId === currentAcademicYear.id && m.isActive);
      const fees = getTotalFeeAmountForGrade(grade.id, currentAcademicYear.id);

      // Calculate averages
      let totalAvg = 0;
      let avgCount = 0;
      gradeStudents.forEach(student => {
        let studentTotal = 0;
        let subjectCount = 0;
        subjects.forEach(mapping => {
          const s1 = calcSemesterTotal(student.id, mapping.id, 1, currentAcademicYear.id, currentBranch.id);
          if (s1.total > 0) { studentTotal += s1.total; subjectCount++; }
        });
        if (subjectCount > 0) { totalAvg += studentTotal / subjectCount; avgCount++; }
      });

      return {
        grade,
        studentCount: gradeStudents.length,
        sectionCount: sections.length,
        subjectCount: subjects.length,
        fees,
        avgMark: avgCount > 0 ? Math.round(totalAvg / avgCount) : 0,
        maleCount: gradeStudents.filter(s => s.gender === 'male').length,
        femaleCount: gradeStudents.filter(s => s.gender === 'female').length,
      };
    });
  }, [branchGrades, currentBranch, currentAcademicYear, students, subjectGradeMappings, getSectionsByGrade, getTotalFeeAmountForGrade, calcSemesterTotal]);

  // Financial summary
  const totalCharged = branchInvoices.reduce((s, i) => s + i.netAmount, 0);
  const totalPaid = branchInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalBalance = totalCharged - totalPaid;
  const collectionRate = totalCharged > 0 ? Math.round((totalPaid / totalCharged) * 100) : 0;

  // Behavior summary
  const positiveIncidents = branchIncidents.filter(i => i.type === 'positive').length;
  const negativeIncidents = branchIncidents.filter(i => i.type === 'negative').length;

  const handlePrint = () => window.print();

  const reports: { key: ReportType; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'overview', label: isAr ? 'نظرة عامة' : 'Overview', icon: <PieChart className="w-4 h-4" />, color: 'blue' },
    { key: 'academic', label: isAr ? 'التقرير الأكاديمي' : 'Academic', icon: <BookOpen className="w-4 h-4" />, color: 'green' },
    { key: 'financial', label: isAr ? 'التقرير المالي' : 'Financial', icon: <DollarSign className="w-4 h-4" />, color: 'purple' },
    { key: 'behavior', label: isAr ? 'تقرير السلوك' : 'Behavior', icon: <Shield className="w-4 h-4" />, color: 'orange' },
    { key: 'transport', label: isAr ? 'تقرير المواصلات' : 'Transport', icon: <Bus className="w-4 h-4" />, color: 'cyan' },
  ];

  return (
    <div className="space-y-6">
      {/* Report Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2">
        {reports.map(r => (
          <button key={r.key} onClick={() => setActiveReport(r.key)}
            className={clsx('flex items-center gap-2 px-4 py-3 rounded-xl border-2 whitespace-nowrap transition-all', activeReport === r.key ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 font-semibold' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300')}>
            {r.icon}<span className="text-sm">{r.label}</span>
          </button>
        ))}
      </div>

      {/* Grade Filter + Print */}
      <div className="flex items-center justify-between">
        <Select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} options={gradeOptions} />
        <Button variant="outline" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>{isAr ? 'طباعة' : 'Print'}</Button>
      </div>

      {/* ===== OVERVIEW ===== */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{branchStudents.length}</p><p className="text-xs text-gray-500">{isAr ? 'الطلاب' : 'Students'}</p></div></div></Card>
            <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{branchGrades.length}</p><p className="text-xs text-gray-500">{isAr ? 'الصفوف' : 'Grades'}</p></div></div></Card>
            <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><DollarSign className="w-5 h-5 text-purple-600" /></div><div><p className="text-2xl font-bold text-green-600">{collectionRate}%</p><p className="text-xs text-gray-500">{isAr ? 'نسبة التحصيل' : 'Collection'}</p></div></div></Card>
            <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center"><Shield className="w-5 h-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{branchIncidents.length}</p><p className="text-xs text-gray-500">{isAr ? 'حوادث سلوكية' : 'Incidents'}</p></div></div></Card>
          </div>

          {/* Grade Summary Table */}
          <Card>
            <CardHeader title={isAr ? 'ملخص حسب الصف' : 'Summary by Grade'} />
            <Table>
              <TableHead><TableRow>
                <TableCell isHeader>{isAr ? 'الصف' : 'Grade'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'الطلاب' : 'Students'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'ذكور/إناث' : 'M/F'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'الفصول' : 'Sections'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'المواد' : 'Subjects'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'المتوسط' : 'Avg'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'الرسوم' : 'Fees'}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {gradeStats.map(gs => {
                  const lg = getLetterGrade(gs.avgMark);
                  return (
                    <TableRow key={gs.grade.id}>
                      <TableCell><span className="font-medium">{getLocalizedValue(gs.grade.name)}</span></TableCell>
                      <TableCell className="text-center"><Badge variant="info">{gs.studentCount}</Badge></TableCell>
                      <TableCell className="text-center"><span className="text-blue-600">{gs.maleCount}</span> / <span className="text-pink-600">{gs.femaleCount}</span></TableCell>
                      <TableCell className="text-center">{gs.sectionCount}</TableCell>
                      <TableCell className="text-center">{gs.subjectCount}</TableCell>
                      <TableCell className="text-center">{gs.avgMark > 0 ? <span style={{ color: lg.color }} className="font-bold">{gs.avgMark}%</span> : '-'}</TableCell>
                      <TableCell className="text-center">{gs.fees > 0 ? <span className="font-medium">{gs.fees.toLocaleString()}</span> : '-'}</TableCell>
                    </TableRow>
                  );
                })}
                {/* Totals */}
                <TableRow>
                  <TableCell><span className="font-bold">{isAr ? 'الإجمالي' : 'Total'}</span></TableCell>
                  <TableCell className="text-center"><span className="font-bold">{gradeStats.reduce((s, g) => s + g.studentCount, 0)}</span></TableCell>
                  <TableCell className="text-center"><span className="font-bold text-blue-600">{gradeStats.reduce((s, g) => s + g.maleCount, 0)}</span> / <span className="font-bold text-pink-600">{gradeStats.reduce((s, g) => s + g.femaleCount, 0)}</span></TableCell>
                  <TableCell className="text-center font-bold">{gradeStats.reduce((s, g) => s + g.sectionCount, 0)}</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ===== ACADEMIC ===== */}
      {activeReport === 'academic' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-blue-600">{branchStudents.length}</p><p className="text-sm text-gray-500">{isAr ? 'إجمالي الطلاب' : 'Total Students'}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-green-600">{branchStudents.filter(s => s.gender === 'male').length}</p><p className="text-sm text-gray-500">{isAr ? 'ذكور' : 'Male'}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-pink-600">{branchStudents.filter(s => s.gender === 'female').length}</p><p className="text-sm text-gray-500">{isAr ? 'إناث' : 'Female'}</p></div></Card>
          </div>

          <Card>
            <CardHeader title={isAr ? 'الأداء الأكاديمي حسب الصف' : 'Academic Performance by Grade'} />
            <Table>
              <TableHead><TableRow>
                <TableCell isHeader>{isAr ? 'الصف' : 'Grade'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'الطلاب' : 'Students'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'المتوسط' : 'Average'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'التقدير' : 'Grade Level'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'المستوى' : 'Level'}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {gradeStats.filter(gs => gs.studentCount > 0).map(gs => {
                  const lg = getLetterGrade(gs.avgMark);
                  return (
                    <TableRow key={gs.grade.id}>
                      <TableCell><span className="font-medium">{getLocalizedValue(gs.grade.name)}</span></TableCell>
                      <TableCell className="text-center">{gs.studentCount}</TableCell>
                      <TableCell className="text-center"><span className="text-lg font-bold" style={{ color: lg.color }}>{gs.avgMark > 0 ? `${gs.avgMark}%` : '-'}</span></TableCell>
                      <TableCell className="text-center"><Badge variant="default"><span style={{ color: lg.color }}>{gs.avgMark > 0 ? (isAr ? lg.ar : lg.en) : '-'}</span></Badge></TableCell>
                      <TableCell className="text-center">
                        {gs.avgMark > 0 && <div className="w-full bg-gray-200 rounded-full h-3"><div className="h-3 rounded-full" style={{ width: `${gs.avgMark}%`, backgroundColor: lg.color }} /></div>}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ===== FINANCIAL ===== */}
      {activeReport === 'financial' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="sm"><div className="text-center"><p className="text-xs text-gray-500">{isAr ? 'إجمالي المستحقات' : 'Total Charged'}</p><p className="text-2xl font-bold">{totalCharged.toLocaleString()}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-xs text-gray-500">{isAr ? 'المحصّل' : 'Collected'}</p><p className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-xs text-gray-500">{isAr ? 'المتبقي' : 'Outstanding'}</p><p className="text-2xl font-bold text-red-600">{totalBalance.toLocaleString()}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-xs text-gray-500">{isAr ? 'نسبة التحصيل' : 'Collection Rate'}</p><p className="text-2xl font-bold text-blue-600">{collectionRate}%</p></div></Card>
          </div>

          <Card>
            <CardHeader title={isAr ? 'تفاصيل الفواتير' : 'Invoice Breakdown'} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {['paid', 'partial', 'overdue', 'issued'].map(status => {
                const count = branchInvoices.filter(i => i.status === status).length;
                const colors: Record<string, string> = { paid: 'text-green-600', partial: 'text-yellow-600', overdue: 'text-red-600', issued: 'text-blue-600' };
                const labels: Record<string, { ar: string; en: string }> = { paid: { ar: 'مدفوعة', en: 'Paid' }, partial: { ar: 'جزئي', en: 'Partial' }, overdue: { ar: 'متأخرة', en: 'Overdue' }, issued: { ar: 'صادرة', en: 'Issued' } };
                return (
                  <div key={status} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className={clsx('text-2xl font-bold', colors[status])}>{count}</p>
                    <p className="text-xs text-gray-500">{isAr ? labels[status].ar : labels[status].en}</p>
                  </div>
                );
              })}
            </div>

            <Table>
              <TableHead><TableRow>
                <TableCell isHeader>{isAr ? 'طريقة الدفع' : 'Payment Method'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'العدد' : 'Count'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'المبلغ' : 'Amount'}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {['cash', 'bank_transfer', 'check', 'digital_wallet', 'card'].map(method => {
                  const methodPayments = branchPayments.filter(p => p.paymentMethod === method);
                  const methodLabels: Record<string, { ar: string; en: string }> = { cash: { ar: 'نقدي', en: 'Cash' }, bank_transfer: { ar: 'تحويل بنكي', en: 'Bank Transfer' }, check: { ar: 'شيك', en: 'Check' }, digital_wallet: { ar: 'محفظة رقمية', en: 'Digital Wallet' }, card: { ar: 'بطاقة', en: 'Card' } };
                  if (methodPayments.length === 0) return null;
                  return (
                    <TableRow key={method}>
                      <TableCell><span className="font-medium">{isAr ? methodLabels[method].ar : methodLabels[method].en}</span></TableCell>
                      <TableCell className="text-center">{methodPayments.length}</TableCell>
                      <TableCell className="text-center font-bold">{methodPayments.reduce((s, p) => s + p.amount, 0).toLocaleString()} SAR</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* ===== BEHAVIOR ===== */}
      {activeReport === 'behavior' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-green-600">{positiveIncidents}</p><p className="text-sm text-gray-500">{isAr ? 'إيجابية' : 'Positive'}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-red-600">{negativeIncidents}</p><p className="text-sm text-gray-500">{isAr ? 'سلبية' : 'Negative'}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold">{branchIncidents.length}</p><p className="text-sm text-gray-500">{isAr ? 'الإجمالي' : 'Total'}</p></div></Card>
          </div>

          <Card>
            <CardHeader title={isAr ? 'الحوادث حسب الخطورة' : 'Incidents by Severity'} />
            <div className="grid grid-cols-4 gap-4">
              {['minor', 'moderate', 'major', 'critical'].map(severity => {
                const count = branchIncidents.filter(i => i.severity === severity).length;
                const colors: Record<string, string> = { minor: 'bg-blue-100 text-blue-700', moderate: 'bg-yellow-100 text-yellow-700', major: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700' };
                const labels: Record<string, { ar: string; en: string }> = { minor: { ar: 'بسيط', en: 'Minor' }, moderate: { ar: 'متوسط', en: 'Moderate' }, major: { ar: 'كبير', en: 'Major' }, critical: { ar: 'حرج', en: 'Critical' } };
                return (
                  <div key={severity} className={clsx('text-center p-4 rounded-xl', colors[severity])}>
                    <p className="text-3xl font-bold">{count}</p>
                    <p className="text-sm font-medium">{isAr ? labels[severity].ar : labels[severity].en}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ===== TRANSPORT ===== */}
      {activeReport === 'transport' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-blue-600">{branchZones.length}</p><p className="text-sm text-gray-500">{isAr ? 'مناطق' : 'Zones'}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-green-600">{branchBuses.length}</p><p className="text-sm text-gray-500">{isAr ? 'حافلات' : 'Buses'}</p></div></Card>
            <Card padding="sm"><div className="text-center"><p className="text-3xl font-bold text-purple-600">{transportAssignments.length}</p><p className="text-sm text-gray-500">{isAr ? 'طلاب مسجلين' : 'Enrolled'}</p></div></Card>
          </div>

          <Card>
            <CardHeader title={isAr ? 'تقرير المواصلات حسب المنطقة' : 'Transport by Zone'} />
            <Table>
              <TableHead><TableRow>
                <TableCell isHeader>{isAr ? 'المنطقة' : 'Zone'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'الحافلات' : 'Buses'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'الطلاب' : 'Students'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'الرسوم/شهر' : 'Fee/Month'}</TableCell>
                <TableCell isHeader className="text-center">{isAr ? 'الإيراد الشهري' : 'Monthly Revenue'}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {branchZones.map(zone => {
                  const zoneBuses = branchBuses.filter(b => b.zoneId === zone.id);
                  const zoneStudents = transportAssignments.filter(t => t.zoneId === zone.id);
                  return (
                    <TableRow key={zone.id}>
                      <TableCell><span className="font-medium">{getLocalizedValue(zone.name)}</span></TableCell>
                      <TableCell className="text-center">{zoneBuses.length}</TableCell>
                      <TableCell className="text-center"><Badge variant="info">{zoneStudents.length}</Badge></TableCell>
                      <TableCell className="text-center">{zone.monthlyFee.toLocaleString()} SAR</TableCell>
                      <TableCell className="text-center font-bold text-green-600">{(zone.monthlyFee * zoneStudents.length).toLocaleString()} SAR</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
};
