import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Gift, Users, Award, Trash2, Eye,
  DollarSign,
  Link2, Calculator, CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useFeeStore } from '../stores/feeStore';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { DiscountType, EnhancedStudent } from '../types/database';


// Applied discount record stored locally
interface AppliedStudentDiscount {
  id: string;
  studentId: string;
  discountRuleId: string;
  discountType: DiscountType;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  siblingOrder?: number;
  linkedStudentIds?: string[];
  notes: string;
  appliedBy: string;
  appliedAt: string;
}

// Sibling group
interface SiblingGroup {
  guardianPhone: string;
  students: EnhancedStudent[];
}

export const StudentDiscounts: React.FC = () => {
  const { t } = useTranslation();
  const {
    getDiscountRulesByBranch,
    getTotalFeeAmountForGrade, getSiblingDiscountConfigs,
    calculateSiblingDiscount,
  } = useFeeStore();
  const { students, getEnhancedGradeById } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { user } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [appliedDiscounts, setAppliedDiscounts] = useState<AppliedStudentDiscount[]>([]);

  // Modals
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isSiblingModalOpen, setIsSiblingModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');

  // Apply form
  const [applyStudentId, setApplyStudentId] = useState('');
  const [applyRuleId, setApplyRuleId] = useState('');
  const [applyCustomAmount, setApplyCustomAmount] = useState(0);
  const [applyNotes, setApplyNotes] = useState('');

  // Sibling form
  const [siblingStudentId, setSiblingStudentId] = useState('');
  const [siblingLinkedIds, setSiblingLinkedIds] = useState<string[]>([]);

  // Detail view
  const [detailStudentId, setDetailStudentId] = useState('');

  const branchRules = currentBranch ? getDiscountRulesByBranch(currentBranch.id) : [];
  const branchStudents = useMemo(() => {
    if (!currentBranch || !currentAcademicYear) return [];
    return students.filter((s) => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id && s.isActive);
  }, [currentBranch, currentAcademicYear, students]);

  const studentOptions = branchStudents.map((s) => ({
    value: s.id,
    label: `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)} (${s.studentNumber})`,
  }));

  const ruleOptions = branchRules.map((r) => ({
    value: r.id,
    label: `${getTypeEmoji(r.discountType)} ${getLocalizedValue(r.name)} (${r.applyType === 'percentage' ? r.value + '%' : r.value + ' SAR'})`,
  }));

  const filterOptions = [
    { value: '', label: t('common.all') },
    { value: 'sibling', label: language === 'ar' ? '👨‍👩‍👧‍👦 خصم الإخوة' : '👨‍👩‍👧‍👦 Sibling' },
    { value: 'merit', label: language === 'ar' ? '🏆 منحة التفوق' : '🏆 Merit' },
    { value: 'staff', label: language === 'ar' ? '🛡️ أبناء العاملين' : '🛡️ Staff' },
    { value: 'early_payment', label: language === 'ar' ? '⚡ سداد مبكر' : '⚡ Early' },
    { value: 'financial_aid', label: language === 'ar' ? '❤️ إعانة مالية' : '❤️ Aid' },
    { value: 'custom', label: language === 'ar' ? '🎁 مخصص' : '🎁 Custom' },
  ];

  // Detect sibling groups by guardian phone
  const siblingGroups = useMemo<SiblingGroup[]>(() => {
    const groups: Record<string, EnhancedStudent[]> = {};
    branchStudents.forEach((s) => {
      const phone = s.guardianPhone;
      if (phone) {
        if (!groups[phone]) groups[phone] = [];
        groups[phone].push(s);
      }
    });
    return Object.entries(groups)
      .filter(([, sts]) => sts.length > 1)
      .map(([phone, sts]) => ({ guardianPhone: phone, students: sts }));
  }, [branchStudents]);

  // Filtered applied discounts
  const filteredDiscounts = appliedDiscounts.filter((d) => {
    const student = branchStudents.find((s) => s.id === d.studentId);
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (student && (
      student.firstName.ar.includes(q) || student.firstName.en.toLowerCase().includes(q) ||
      student.studentNumber.toLowerCase().includes(q)
    ));
    const matchType = !filterType || d.discountType === filterType;
    return matchSearch && matchType;
  });

  // Stats
  const totalDiscountAmount = appliedDiscounts.reduce((s, d) => s + d.discountAmount, 0);
  const siblingCount = appliedDiscounts.filter((d) => d.discountType === 'sibling').length;
  const meritCount = appliedDiscounts.filter((d) => d.discountType === 'merit').length;

  function getTypeEmoji(type: DiscountType): string {
    const map: Record<string, string> = { sibling: '👨‍👩‍👧‍👦', staff: '🛡️', merit: '🏆', financial_aid: '❤️', early_payment: '⚡', loyalty: '⭐', custom: '🎁' };
    return map[type] || '🎁';
  }

  function getTypeName(type: DiscountType): string {
    const names: Record<string, { ar: string; en: string }> = {
      sibling: { ar: 'خصم الإخوة', en: 'Sibling Discount' },
      staff: { ar: 'أبناء العاملين', en: 'Staff Children' },
      merit: { ar: 'منحة التفوق', en: 'Merit Scholarship' },
      financial_aid: { ar: 'إعانة مالية', en: 'Financial Aid' },
      early_payment: { ar: 'سداد مبكر', en: 'Early Payment' },
      loyalty: { ar: 'خصم الولاء', en: 'Loyalty Discount' },
      custom: { ar: 'خصم مخصص', en: 'Custom Discount' },
    };
    return language === 'ar' ? names[type].ar : names[type].en;
  }

  function getStudentName(id: string): string {
    const s = branchStudents.find((st) => st.id === id);
    return s ? `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)}` : '-';
  }

  function getStudentFees(studentId: string): number {
    const student = branchStudents.find((s) => s.id === studentId);
    if (!student || !currentAcademicYear) return 0;
    return getTotalFeeAmountForGrade(student.currentGradeId, currentAcademicYear.id);
  }

  // ===== APPLY SINGLE DISCOUNT =====
  const openApplyModal = () => {
    setApplyStudentId('');
    setApplyRuleId('');
    setApplyCustomAmount(0);
    setApplyNotes('');
    setIsApplyModalOpen(true);
  };

  const selectedRule = branchRules.find((r) => r.id === applyRuleId);
  const applyStudentFees = applyStudentId ? getStudentFees(applyStudentId) : 0;
  const calculatedDiscount = useMemo(() => {
    if (!selectedRule || applyStudentFees <= 0) return 0;
    if (applyCustomAmount > 0) return applyCustomAmount;
    let disc = selectedRule.applyType === 'percentage' ? applyStudentFees * (selectedRule.value / 100) : selectedRule.value;
    if (selectedRule.maxDiscountAmount && disc > selectedRule.maxDiscountAmount) disc = selectedRule.maxDiscountAmount;
    return Math.round(disc);
  }, [selectedRule, applyStudentFees, applyCustomAmount]);

  const handleApplyDiscount = () => {
    if (!applyStudentId || !applyRuleId || !selectedRule || !user) return;

    const newDiscount: AppliedStudentDiscount = {
      id: `asd-${Date.now()}`,
      studentId: applyStudentId,
      discountRuleId: applyRuleId,
      discountType: selectedRule.discountType,
      originalAmount: applyStudentFees,
      discountAmount: calculatedDiscount,
      finalAmount: applyStudentFees - calculatedDiscount,
      notes: applyNotes,
      appliedBy: user.id,
      appliedAt: new Date().toISOString(),
    };

    setAppliedDiscounts((prev) => [...prev, newDiscount]);
    showToast('success', language === 'ar' ? 'تم تطبيق الخصم بنجاح' : 'Discount applied successfully');
    setIsApplyModalOpen(false);
  };

  // ===== SIBLING DISCOUNT =====
  const openSiblingModal = () => {
    setSiblingStudentId('');
    setSiblingLinkedIds([]);
    setIsSiblingModalOpen(true);
  };

  const selectedSiblingStudent = branchStudents.find((s) => s.id === siblingStudentId);
  const autoDetectedSiblings = useMemo(() => {
    if (!selectedSiblingStudent) return [];
    return branchStudents.filter((s) => 
      s.id !== siblingStudentId && s.guardianPhone === selectedSiblingStudent.guardianPhone
    );
  }, [siblingStudentId, selectedSiblingStudent, branchStudents]);

  const toggleSiblingLink = (studentId: string) => {
    setSiblingLinkedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleApplySiblingDiscount = () => {
    if (!siblingStudentId || siblingLinkedIds.length === 0 || !user) return;

    const siblingRule = branchRules.find((r) => r.discountType === 'sibling');
    if (!siblingRule) {
      showToast('error', language === 'ar' ? 'لا توجد قاعدة خصم إخوة' : 'No sibling discount rule found');
      return;
    }

    const allSiblings = [siblingStudentId, ...siblingLinkedIds];
    const newDiscounts: AppliedStudentDiscount[] = [];

    allSiblings.forEach((studentId, index) => {
      const order = index + 1;
      const pct = calculateSiblingDiscount(order, siblingRule.id);
      const fees = getStudentFees(studentId);
      const discountAmount = Math.round(fees * (pct / 100));

      if (pct > 0) {
        newDiscounts.push({
          id: `asd-${Date.now()}-${index}`,
          studentId,
          discountRuleId: siblingRule.id,
          discountType: 'sibling',
          originalAmount: fees,
          discountAmount,
          finalAmount: fees - discountAmount,
          siblingOrder: order,
          linkedStudentIds: allSiblings.filter((id) => id !== studentId),
          notes: `${language === 'ar' ? 'الترتيب' : 'Order'}: ${order} (${pct}%)`,
          appliedBy: user.id,
          appliedAt: new Date().toISOString(),
        });
      }
    });

    // Remove existing sibling discounts for these students
    setAppliedDiscounts((prev) => [
      ...prev.filter((d) => !(d.discountType === 'sibling' && allSiblings.includes(d.studentId))),
      ...newDiscounts,
    ]);

    showToast('success', language === 'ar' ? `تم تطبيق خصم الإخوة على ${newDiscounts.length} طلاب` : `Sibling discount applied to ${newDiscounts.length} students`);
    setIsSiblingModalOpen(false);
  };

  // ===== DELETE =====
  const handleDelete = () => {
    setAppliedDiscounts((prev) => prev.filter((d) => d.id !== deleteTargetId));
    showToast('success', t('common.success'));
    setIsDeleteOpen(false);
  };

  // ===== STUDENT DETAIL =====
  const detailDiscounts = appliedDiscounts.filter((d) => d.studentId === detailStudentId);
  const detailStudent = branchStudents.find((s) => s.id === detailStudentId);
  const detailTotalDiscount = detailDiscounts.reduce((s, d) => s + d.discountAmount, 0);
  const detailOriginalFees = detailStudent && currentAcademicYear ? getStudentFees(detailStudentId) : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><Gift className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-600">{appliedDiscounts.length}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'خصومات مُطبّقة' : 'Applied Discounts'}</p></div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><DollarSign className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-blue-600">{totalDiscountAmount.toLocaleString()}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'إجمالي الخصومات (ر.س)' : 'Total Discounts (SAR)'}</p></div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-2xl font-bold text-purple-600">{siblingCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'خصومات إخوة' : 'Sibling Discounts'}</p></div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center"><Award className="w-5 h-5 text-yellow-600" /></div>
            <div><p className="text-2xl font-bold text-yellow-600">{meritCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'منح تفوق' : 'Merit Scholarships'}</p></div>
          </div>
        </Card>
      </div>

      {/* Auto-detected Sibling Groups */}
      {siblingGroups.length > 0 && (
        <Card>
          <CardHeader title={language === 'ar' ? '👨‍👩‍👧‍👦 مجموعات الإخوة المكتشفة تلقائياً' : '👨‍👩‍👧‍👦 Auto-Detected Sibling Groups'} subtitle={`${siblingGroups.length} ${language === 'ar' ? 'مجموعة' : 'groups'}`} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {siblingGroups.map((group) => (
              <div key={group.guardianPhone} className="p-4 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{group.guardianPhone}</span>
                  </div>
                  <Badge variant="info">{group.students.length} {language === 'ar' ? 'أبناء' : 'children'}</Badge>
                </div>
                <div className="space-y-1">
                  {group.students.map((s, idx) => {
                    const hasDiscount = appliedDiscounts.some((d) => d.studentId === s.id && d.discountType === 'sibling');
                    return (
                      <div key={s.id} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">{idx + 1}</span>
                          {getLocalizedValue(s.firstName)} {getLocalizedValue(s.lastName)}
                        </span>
                        {hasDiscount ? <CheckCircle className="w-4 h-4 text-green-500" /> : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Main Table */}
      <Card>
        <CardHeader
          title={language === 'ar' ? 'خصومات ومنح الطلاب' : 'Student Discounts & Scholarships'}
          subtitle={`${filteredDiscounts.length} ${language === 'ar' ? 'خصم' : 'discounts'}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={openSiblingModal} leftIcon={<Link2 className="w-4 h-4" />}>
                {language === 'ar' ? 'ربط إخوة وتطبيق خصم' : 'Link Siblings & Apply'}
              </Button>
              <Button onClick={openApplyModal} leftIcon={<Gift className="w-4 h-4" />}>
                {language === 'ar' ? 'تطبيق خصم/منحة' : 'Apply Discount'}
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('common.search')} leftIcon={<Search className="w-5 h-5" />} />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} options={filterOptions} />
        </div>

        <Table>
          <TableHead><TableRow>
            <TableCell isHeader>{language === 'ar' ? 'الطالب' : 'Student'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'نوع الخصم' : 'Type'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'الرسوم الأصلية' : 'Original'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'مبلغ الخصم' : 'Discount'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'بعد الخصم' : 'After'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'ملاحظات' : 'Notes'}</TableCell>
            <TableCell isHeader>{t('common.actions')}</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {filteredDiscounts.length === 0 ? (
              <TableRow><TableCell className="text-center py-12" colSpan={7}>
                <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">{language === 'ar' ? 'لا توجد خصومات مُطبّقة بعد' : 'No discounts applied yet'}</p>
                <div className="flex justify-center gap-2">
                  <Button size="sm" onClick={openApplyModal} leftIcon={<Gift className="w-4 h-4" />}>{language === 'ar' ? 'تطبيق خصم' : 'Apply Discount'}</Button>
                  <Button size="sm" variant="outline" onClick={openSiblingModal} leftIcon={<Link2 className="w-4 h-4" />}>{language === 'ar' ? 'ربط إخوة' : 'Link Siblings'}</Button>
                </div>
              </TableCell></TableRow>
            ) : filteredDiscounts.map((d) => {
              const grade = (() => { const st = branchStudents.find(s => s.id === d.studentId); return st ? getEnhancedGradeById(st.currentGradeId) : null; })();
              return (
                <TableRow key={d.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {getStudentName(d.studentId).charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{getStudentName(d.studentId)}</p>
                        <p className="text-xs text-gray-500">{grade ? getLocalizedValue(grade.name) : ''}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.discountType === 'sibling' ? 'info' : d.discountType === 'merit' ? 'warning' : 'default'}>
                      {getTypeEmoji(d.discountType)} {getTypeName(d.discountType)}
                    </Badge>
                    {d.siblingOrder && <p className="text-xs text-gray-500 mt-1">{language === 'ar' ? `الترتيب: ${d.siblingOrder}` : `Order: ${d.siblingOrder}`}</p>}
                  </TableCell>
                  <TableCell><span className="text-gray-500">{d.originalAmount.toLocaleString()} SAR</span></TableCell>
                  <TableCell><span className="text-red-600 font-bold">-{d.discountAmount.toLocaleString()} SAR</span></TableCell>
                  <TableCell><span className="text-green-600 font-bold">{d.finalAmount.toLocaleString()} SAR</span></TableCell>
                  <TableCell><span className="text-sm text-gray-500">{d.notes || '-'}</span></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setDetailStudentId(d.studentId); setIsDetailModalOpen(true); }}><Eye className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeleteTargetId(d.id); setIsDeleteOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* ===== APPLY DISCOUNT MODAL ===== */}
      <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title={language === 'ar' ? '🎁 تطبيق خصم أو منحة للطالب' : '🎁 Apply Discount to Student'} size="lg">
        <div className="space-y-5">
          <Select label={language === 'ar' ? 'اختر الطالب' : 'Select Student'} value={applyStudentId} onChange={(e) => setApplyStudentId(e.target.value)} options={[{ value: '', label: t('common.selectOption') }, ...studentOptions]} required />

          <Select label={language === 'ar' ? 'نوع الخصم / المنحة' : 'Discount / Scholarship Type'} value={applyRuleId} onChange={(e) => setApplyRuleId(e.target.value)} options={[{ value: '', label: t('common.selectOption') }, ...ruleOptions]} required />

          {/* Calculation Preview */}
          {applyStudentId && applyRuleId && selectedRule && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">{language === 'ar' ? 'حساب الخصم' : 'Discount Calculation'}</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">{language === 'ar' ? 'إجمالي الرسوم' : 'Total Fees'}</span><span className="font-medium">{applyStudentFees.toLocaleString()} SAR</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{language === 'ar' ? 'نسبة/مبلغ الخصم' : 'Discount Rate'}</span><span className="font-medium">{selectedRule.applyType === 'percentage' ? `${selectedRule.value}%` : `${selectedRule.value} SAR`}</span></div>
                <div className="flex justify-between text-red-600"><span>{language === 'ar' ? 'مبلغ الخصم' : 'Discount Amount'}</span><span className="font-bold">-{calculatedDiscount.toLocaleString()} SAR</span></div>
                <div className="flex justify-between text-lg pt-2 border-t font-bold"><span>{language === 'ar' ? 'المبلغ بعد الخصم' : 'After Discount'}</span><span className="text-green-600">{(applyStudentFees - calculatedDiscount).toLocaleString()} SAR</span></div>
              </div>
            </div>
          )}

          <Input label={language === 'ar' ? 'مبلغ مخصص (اختياري - يتجاوز الحساب التلقائي)' : 'Custom Amount (optional - overrides auto)'} type="number" value={applyCustomAmount} onChange={(e) => setApplyCustomAmount(parseFloat(e.target.value) || 0)} min={0} />
          <Input label={language === 'ar' ? 'ملاحظات' : 'Notes'} value={applyNotes} onChange={(e) => setApplyNotes(e.target.value)} placeholder={language === 'ar' ? 'سبب الخصم أو المنحة...' : 'Reason for discount...'} />

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsApplyModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleApplyDiscount} disabled={!applyStudentId || !applyRuleId} leftIcon={<CheckCircle className="w-4 h-4" />}>{language === 'ar' ? 'تطبيق الخصم' : 'Apply Discount'}</Button>
          </div>
        </div>
      </Modal>

      {/* ===== SIBLING DISCOUNT MODAL ===== */}
      <Modal isOpen={isSiblingModalOpen} onClose={() => setIsSiblingModalOpen(false)} title={language === 'ar' ? '👨‍👩‍👧‍👦 ربط الإخوة وتطبيق خصم الإخوة' : '👨‍👩‍👧‍👦 Link Siblings & Apply Discount'} size="lg">
        <div className="space-y-5">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {language === 'ar'
                ? 'اختر الطالب الأول وسيتم اكتشاف إخوته تلقائياً من رقم هاتف ولي الأمر. يمكنك أيضاً إضافة إخوة يدوياً.'
                : 'Select the first student and siblings will be auto-detected by guardian phone. You can also add siblings manually.'}
            </p>
          </div>

          <Select label={language === 'ar' ? 'اختر الطالب الأول' : 'Select First Student'} value={siblingStudentId} onChange={(e) => { setSiblingStudentId(e.target.value); setSiblingLinkedIds([]); }} options={[{ value: '', label: t('common.selectOption') }, ...studentOptions]} required />

          {/* Auto-detected siblings */}
          {siblingStudentId && autoDetectedSiblings.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {language === 'ar' ? `تم اكتشاف ${autoDetectedSiblings.length} إخوة تلقائياً:` : `${autoDetectedSiblings.length} siblings auto-detected:`}
              </p>
              <div className="space-y-2">
                {autoDetectedSiblings.map((s) => (
                  <label key={s.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg border cursor-pointer">
                    <input type="checkbox" checked={siblingLinkedIds.includes(s.id)} onChange={() => toggleSiblingLink(s.id)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="font-medium">{getLocalizedValue(s.firstName)} {getLocalizedValue(s.lastName)}</span>
                    <Badge variant="default">{s.studentNumber}</Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Manual add */}
          {siblingStudentId && (
            <div>
              <p className="text-sm font-medium mb-2">{language === 'ar' ? 'أو أضف إخوة يدوياً:' : 'Or add siblings manually:'}</p>
              <Select value="" onChange={(e) => { if (e.target.value && !siblingLinkedIds.includes(e.target.value)) toggleSiblingLink(e.target.value); }}
                options={[{ value: '', label: language === 'ar' ? 'اختر طالب...' : 'Select student...' }, ...studentOptions.filter((o) => o.value !== siblingStudentId && !siblingLinkedIds.includes(o.value) && !autoDetectedSiblings.some((s) => s.id === o.value))]} />
            </div>
          )}

          {/* Preview discount calculation */}
          {siblingStudentId && siblingLinkedIds.length > 0 && (() => {
            const siblingRule = branchRules.find((r) => r.discountType === 'sibling');
            if (!siblingRule) return <div className="p-3 bg-red-50 rounded-lg text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{language === 'ar' ? 'لا توجد قاعدة خصم إخوة. أنشئها أولاً من صفحة الخصومات.' : 'No sibling rule found. Create one first.'}</div>;
            const allIds = [siblingStudentId, ...siblingLinkedIds];
            const configs = getSiblingDiscountConfigs(siblingRule.id);
            return (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border">
                <p className="font-semibold mb-3 flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-600" />{language === 'ar' ? 'معاينة خصم الإخوة' : 'Sibling Discount Preview'}</p>
                <Table>
                  <TableHead><TableRow>
                    <TableCell isHeader>#</TableCell>
                    <TableCell isHeader>{language === 'ar' ? 'الطالب' : 'Student'}</TableCell>
                    <TableCell isHeader>{language === 'ar' ? 'الرسوم' : 'Fees'}</TableCell>
                    <TableCell isHeader>{language === 'ar' ? 'نسبة الخصم' : 'Discount %'}</TableCell>
                    <TableCell isHeader>{language === 'ar' ? 'مبلغ الخصم' : 'Discount'}</TableCell>
                    <TableCell isHeader>{language === 'ar' ? 'بعد الخصم' : 'After'}</TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {allIds.map((id, idx) => {
                      const order = idx + 1;
                      const pct = configs.find((c) => c.siblingOrder === order)?.discountPercentage || 0;
                      const fees = getStudentFees(id);
                      const disc = Math.round(fees * (pct / 100));
                      return (
                        <TableRow key={id}>
                          <TableCell><span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">{order}</span></TableCell>
                          <TableCell><span className="font-medium">{getStudentName(id)}</span></TableCell>
                          <TableCell>{fees.toLocaleString()}</TableCell>
                          <TableCell><Badge variant={pct > 0 ? 'success' : 'default'}>{pct}%</Badge></TableCell>
                          <TableCell>{pct > 0 ? <span className="text-red-600 font-bold">-{disc.toLocaleString()}</span> : '-'}</TableCell>
                          <TableCell><span className="font-bold text-green-600">{(fees - disc).toLocaleString()}</span></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })()}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsSiblingModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleApplySiblingDiscount} disabled={!siblingStudentId || siblingLinkedIds.length === 0} leftIcon={<CheckCircle className="w-4 h-4" />}>
              {language === 'ar' ? 'تطبيق خصم الإخوة' : 'Apply Sibling Discount'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== STUDENT DETAIL MODAL ===== */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={`📊 ${getStudentName(detailStudentId)}`} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'الرسوم الأصلية' : 'Original Fees'}</p><p className="text-xl font-bold">{detailOriginalFees.toLocaleString()} SAR</p></Card>
            <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'إجمالي الخصومات' : 'Total Discounts'}</p><p className="text-xl font-bold text-red-600">-{detailTotalDiscount.toLocaleString()} SAR</p></Card>
            <Card padding="sm"><p className="text-xs text-gray-500">{language === 'ar' ? 'المطلوب بعد الخصم' : 'Net Amount'}</p><p className="text-xl font-bold text-green-600">{(detailOriginalFees - detailTotalDiscount).toLocaleString()} SAR</p></Card>
          </div>
          <Table>
            <TableHead><TableRow>
              <TableCell isHeader>{language === 'ar' ? 'النوع' : 'Type'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'المبلغ' : 'Amount'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'التاريخ' : 'Date'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'ملاحظات' : 'Notes'}</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {detailDiscounts.map((d) => (
                <TableRow key={d.id}>
                  <TableCell><Badge>{getTypeEmoji(d.discountType)} {getTypeName(d.discountType)}</Badge></TableCell>
                  <TableCell><span className="text-red-600 font-bold">-{d.discountAmount.toLocaleString()} SAR</span></TableCell>
                  <TableCell>{new Date(d.appliedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{d.notes || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end pt-4 border-t"><Button onClick={() => setIsDetailModalOpen(false)}>{t('common.close')}</Button></div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t('common.confirm')} size="sm">
        <p className="text-gray-600 dark:text-gray-300 mb-6">{language === 'ar' ? 'هل أنت متأكد من إزالة هذا الخصم؟' : 'Remove this discount?'}</p>
        <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button></div>
      </Modal>
    </div>
  );
};
