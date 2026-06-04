import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Pencil, Trash2, CreditCard, Calendar, 
  ChevronDown, ChevronRight, Clock, AlertTriangle,
  Calculator, Eye
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
import type { InstallmentPlan, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';
import clsx from 'clsx';

interface PlanForm {
  nameAr: string;
  nameEn: string;
  code: string;
  descriptionAr: string;
  descriptionEn: string;
  numberOfInstallments: number;
  intervalDays: number;
  lateFeePercentage: number;
  lateFeeFixedAmount: number;
  gracePeriodDays: number;
}

const initialForm: PlanForm = {
  nameAr: '',
  nameEn: '',
  code: '',
  descriptionAr: '',
  descriptionEn: '',
  numberOfInstallments: 4,
  intervalDays: 90,
  lateFeePercentage: 0,
  lateFeeFixedAmount: 0,
  gracePeriodDays: 7,
};

interface SimulationResult {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  lateFee: number;
}

export const InstallmentPlans: React.FC = () => {
  const { t } = useTranslation();
  const {
    installmentPlans,
    getInstallmentPlansByBranch,
    addInstallmentPlan,
    updateInstallmentPlan,
    deleteInstallmentPlan,
    getTotalFeeAmountForGrade,
  } = useFeeStore();
  const { getGradesByBranch } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);
  const [selected, setSelected] = useState<InstallmentPlan | null>(null);
  const [form, setForm] = useState<PlanForm>(initialForm);

  // Simulator state
  const [simGradeId, setSimGradeId] = useState('');
  const [simPlanId, setSimPlanId] = useState('');
  const [simStartDate, setSimStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [simCustomAmount, setSimCustomAmount] = useState(0);

  const canCreate = hasPermission('fees', 'create');
  const canUpdate = hasPermission('fees', 'update');
  const canDelete = hasPermission('fees', 'delete');

  const branchPlans = currentBranch ? getInstallmentPlansByBranch(currentBranch.id) : [];
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const gradeOptions = branchGrades.map((g) => ({ value: g.id, label: getLocalizedValue(g.name) }));

  const togglePlan = (id: string) => {
    setExpandedPlans((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  // Simulator calculation
  const simulationResults: SimulationResult[] = useMemo(() => {
    const plan = installmentPlans.find((p) => p.id === simPlanId);
    if (!plan) return [];

    let totalAmount = simCustomAmount;
    if (!totalAmount && simGradeId && currentAcademicYear) {
      totalAmount = getTotalFeeAmountForGrade(simGradeId, currentAcademicYear.id);
    }
    if (!totalAmount) return [];

    const installmentAmount = Math.round((totalAmount / plan.numberOfInstallments) * 100) / 100;
    const results: SimulationResult[] = [];
    const start = new Date(simStartDate);

    for (let i = 0; i < plan.numberOfInstallments; i++) {
      const dueDate = new Date(start);
      dueDate.setDate(dueDate.getDate() + (plan.intervalDays * i));

      const lateFee = plan.lateFeePercentage
        ? Math.round(installmentAmount * (plan.lateFeePercentage / 100) * 100) / 100
        : (plan.lateFeeFixedAmount || 0);

      // Adjust last installment for rounding
      const amount = i === plan.numberOfInstallments - 1
        ? totalAmount - (installmentAmount * (plan.numberOfInstallments - 1))
        : installmentAmount;

      results.push({
        installmentNumber: i + 1,
        amount: Math.round(amount * 100) / 100,
        dueDate: dueDate.toISOString().split('T')[0],
        lateFee,
      });
    }
    return results;
  }, [simPlanId, simGradeId, simStartDate, simCustomAmount, installmentPlans, currentAcademicYear, getTotalFeeAmountForGrade]);

  const simulationTotal = simulationResults.reduce((s, r) => s + r.amount, 0);

  const openModal = (plan?: InstallmentPlan) => {
    if (plan) {
      setSelected(plan);
      setForm({
        nameAr: plan.name.ar,
        nameEn: plan.name.en,
        code: plan.code,
        descriptionAr: plan.description.ar,
        descriptionEn: plan.description.en,
        numberOfInstallments: plan.numberOfInstallments,
        intervalDays: plan.intervalDays,
        lateFeePercentage: plan.lateFeePercentage || 0,
        lateFeeFixedAmount: plan.lateFeeFixedAmount || 0,
        gracePeriodDays: plan.gracePeriodDays,
      });
    } else {
      setSelected(null);
      setForm(initialForm);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch) return;

    const name: LocalizedText = { ar: sanitizeInput(form.nameAr), en: sanitizeInput(form.nameEn) };
    const description: LocalizedText = { ar: sanitizeInput(form.descriptionAr), en: sanitizeInput(form.descriptionEn) };

    if (selected) {
      updateInstallmentPlan(selected.id, {
        name,
        code: sanitizeInput(form.code),
        description,
        numberOfInstallments: form.numberOfInstallments,
        intervalDays: form.intervalDays,
        lateFeePercentage: form.lateFeePercentage || undefined,
        lateFeeFixedAmount: form.lateFeeFixedAmount || undefined,
        gracePeriodDays: form.gracePeriodDays,
      });
      showToast('success', t('installments.planUpdated'));
    } else {
      addInstallmentPlan({
        name,
        code: sanitizeInput(form.code),
        description,
        numberOfInstallments: form.numberOfInstallments,
        intervalDays: form.intervalDays,
        lateFeePercentage: form.lateFeePercentage || undefined,
        lateFeeFixedAmount: form.lateFeeFixedAmount || undefined,
        gracePeriodDays: form.gracePeriodDays,
        branchId: currentBranch.id,
        isActive: true,
      });
      showToast('success', t('installments.planCreated'));
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (selected) {
      deleteInstallmentPlan(selected.id);
      showToast('success', t('installments.planDeleted'));
      setIsDeleteOpen(false);
      setSelected(null);
    }
  };

  const getIntervalLabel = (days: number): string => {
    if (days <= 31) return t('installments.monthly');
    if (days <= 92) return t('installments.quarterly');
    if (days <= 183) return t('installments.semiAnnually');
    return t('installments.annually');
  };

  const openSimulator = (planId?: string) => {
    if (planId) setSimPlanId(planId);
    setSimStartDate(new Date().toISOString().split('T')[0]);
    setSimCustomAmount(0);
    setSimGradeId('');
    setIsSimulatorOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('installments.installmentPlans')}
          subtitle={`${branchPlans.length} ${language === 'ar' ? 'خطة' : 'plans'}`}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openSimulator()} leftIcon={<Calculator className="w-4 h-4" />}>
                {language === 'ar' ? 'محاكي الأقساط' : 'Installment Simulator'}
              </Button>
              {canCreate && (
                <Button onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>{t('installments.addPlan')}</Button>
              )}
            </div>
          }
        />

        {/* Plans List */}
        <div className="space-y-3">
          {branchPlans.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('common.noData')}</p>
            </div>
          ) : (
            branchPlans.map((plan) => {
              const isExpanded = expandedPlans.includes(plan.id);
              return (
                <div key={plan.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => togglePlan(plan.id)}
                  >
                    <div className="flex items-center gap-4">
                      <button className="text-gray-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{getLocalizedValue(plan.name)}</p>
                        <p className="text-sm text-gray-500">{getLocalizedValue(plan.description)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <Badge variant="info">{plan.numberOfInstallments} {language === 'ar' ? 'أقساط' : 'installments'}</Badge>
                        <Badge variant="default">{getIntervalLabel(plan.intervalDays)}</Badge>
                        {plan.gracePeriodDays > 0 && (
                          <Badge variant="warning">
                            <Clock className="w-3 h-3 me-1 inline" />
                            {plan.gracePeriodDays} {language === 'ar' ? 'يوم سماح' : 'days grace'}
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openSimulator(plan.id)} title={language === 'ar' ? 'محاكاة' : 'Simulate'}>
                        <Eye className="w-4 h-4 text-blue-500" />
                      </Button>
                      {canUpdate && (
                        <Button variant="ghost" size="sm" onClick={() => openModal(plan)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(plan); setIsDeleteOpen(true); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">{t('installments.numberOfInstallments')}</p>
                          <p className="text-xl font-bold text-blue-600">{plan.numberOfInstallments}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">{t('installments.intervalDays')}</p>
                          <p className="text-xl font-bold text-green-600">{plan.intervalDays} {language === 'ar' ? 'يوم' : 'days'}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">{t('installments.lateFeePercentage')}</p>
                          <p className="text-xl font-bold text-orange-600">{plan.lateFeePercentage || 0}%</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">{t('installments.gracePeriodDays')}</p>
                          <p className="text-xl font-bold text-purple-600">{plan.gracePeriodDays} {language === 'ar' ? 'يوم' : 'days'}</p>
                        </div>
                      </div>

                      {/* Visual timeline */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-2">
                        {Array.from({ length: plan.numberOfInstallments }).map((_, i) => (
                          <React.Fragment key={i}>
                            <div className="flex flex-col items-center min-w-[80px]">
                              <div className={clsx(
                                'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold',
                                i === 0 ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              )}>
                                {i + 1}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {language === 'ar' ? `قسط ${i + 1}` : `#${i + 1}`}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {language === 'ar' ? `يوم ${plan.intervalDays * i}` : `Day ${plan.intervalDays * i}`}
                              </p>
                            </div>
                            {i < plan.numberOfInstallments - 1 && (
                              <div className="flex-1 h-0.5 bg-gray-300 dark:bg-gray-600 min-w-[20px]" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {(plan.lateFeePercentage || plan.lateFeeFixedAmount) ? (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            {language === 'ar'
                              ? `رسوم التأخير: ${plan.lateFeePercentage ? plan.lateFeePercentage + '% من قيمة القسط' : plan.lateFeeFixedAmount + ' ريال ثابت'} بعد انتهاء فترة السماح (${plan.gracePeriodDays} يوم)`
                              : `Late fee: ${plan.lateFeePercentage ? plan.lateFeePercentage + '% of installment amount' : plan.lateFeeFixedAmount + ' SAR fixed'} after grace period (${plan.gracePeriodDays} days)`}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? t('installments.editPlan') : t('installments.addPlan')} size="full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('installments.planNameAr')} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" required />
            <Input label={t('installments.planNameEn')} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={`${language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}`} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} dir="rtl" />
            <Input label={`${language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}`} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} dir="ltr" />
          </div>
          <Input label={t('installments.planCode')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="MONTHLY, QUARTERLY" />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('installments.numberOfInstallments')} type="number" value={form.numberOfInstallments} onChange={(e) => setForm({ ...form, numberOfInstallments: parseInt(e.target.value) || 1 })} min={1} max={24} required />
            <Input label={t('installments.intervalDays')} type="number" value={form.intervalDays} onChange={(e) => setForm({ ...form, intervalDays: parseInt(e.target.value) || 30 })} min={1} required helperText={language === 'ar' ? '30=شهري، 90=ربع سنوي، 180=نصف سنوي' : '30=monthly, 90=quarterly, 180=semi-annual'} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('installments.lateFeePercentage')} type="number" value={form.lateFeePercentage} onChange={(e) => setForm({ ...form, lateFeePercentage: parseFloat(e.target.value) || 0 })} min={0} max={100} step="0.5" helperText="%" />
            <Input label={t('installments.lateFeeFixedAmount')} type="number" value={form.lateFeeFixedAmount} onChange={(e) => setForm({ ...form, lateFeeFixedAmount: parseFloat(e.target.value) || 0 })} min={0} helperText="SAR" />
            <Input label={t('installments.gracePeriodDays')} type="number" value={form.gracePeriodDays} onChange={(e) => setForm({ ...form, gracePeriodDays: parseInt(e.target.value) || 0 })} min={0} helperText={language === 'ar' ? 'أيام' : 'days'} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{selected ? t('common.update') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t('common.confirm')} size="sm">
        <p className="text-gray-600 dark:text-gray-300 mb-6">{language === 'ar' ? 'هل أنت متأكد من حذف خطة الأقساط هذه؟' : 'Delete this installment plan?'}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>

      {/* Installment Simulator Modal */}
      <Modal isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} title={language === 'ar' ? '🧮 محاكي جدول الأقساط' : '🧮 Installment Schedule Simulator'} size="full">
        <div className="space-y-5">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {language === 'ar'
                ? 'اختر خطة الأقساط والصف لمحاكاة جدول الأقساط وحساب المبالغ وتواريخ الاستحقاق تلقائياً.'
                : 'Select a plan and grade to simulate the installment schedule with auto-calculated amounts and due dates.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select
              label={language === 'ar' ? 'خطة الأقساط' : 'Installment Plan'}
              value={simPlanId}
              onChange={(e) => setSimPlanId(e.target.value)}
              options={[{ value: '', label: t('common.selectOption') }, ...branchPlans.map((p) => ({ value: p.id, label: getLocalizedValue(p.name) }))]}
            />
            <Select
              label={language === 'ar' ? 'الصف الدراسي' : 'Grade'}
              value={simGradeId}
              onChange={(e) => {
                setSimGradeId(e.target.value);
                if (e.target.value && currentAcademicYear) {
                  setSimCustomAmount(getTotalFeeAmountForGrade(e.target.value, currentAcademicYear.id));
                }
              }}
              options={[{ value: '', label: t('common.selectOption') }, ...gradeOptions]}
            />
            <Input
              label={language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
              type="number"
              value={simCustomAmount}
              onChange={(e) => setSimCustomAmount(parseFloat(e.target.value) || 0)}
              min={0}
            />
            <Input
              label={language === 'ar' ? 'تاريخ البدء' : 'Start Date'}
              type="date"
              value={simStartDate}
              onChange={(e) => setSimStartDate(e.target.value)}
            />
          </div>

          {simulationResults.length > 0 && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card padding="sm">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{simulationTotal.toLocaleString()} <span className="text-sm font-normal">SAR</span></p>
                </Card>
                <Card padding="sm">
                  <p className="text-sm text-gray-500">{t('installments.numberOfInstallments')}</p>
                  <p className="text-2xl font-bold text-blue-600">{simulationResults.length}</p>
                </Card>
                <Card padding="sm">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'قيمة القسط' : 'Per Installment'}</p>
                  <p className="text-2xl font-bold text-green-600">{simulationResults[0]?.amount.toLocaleString()} <span className="text-sm font-normal">SAR</span></p>
                </Card>
              </div>

              {/* Schedule Table */}
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell isHeader>{t('installments.installmentNumber')}</TableCell>
                    <TableCell isHeader>{t('installments.dueDate')}</TableCell>
                    <TableCell isHeader>{t('installments.amount')}</TableCell>
                    <TableCell isHeader>{language === 'ar' ? 'رسوم التأخير (إذا تأخر)' : 'Late Fee (if overdue)'}</TableCell>
                    <TableCell isHeader>{language === 'ar' ? 'الإجمالي مع التأخير' : 'Total with Late Fee'}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {simulationResults.map((r) => (
                    <TableRow key={r.installmentNumber}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600">
                            {r.installmentNumber}
                          </div>
                          <span>{language === 'ar' ? `القسط ${r.installmentNumber}` : `Installment ${r.installmentNumber}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(r.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{r.amount.toLocaleString()}</span> <span className="text-gray-500 text-xs">SAR</span>
                      </TableCell>
                      <TableCell>
                        {r.lateFee > 0 ? (
                          <span className="text-red-600 font-medium">+{r.lateFee.toLocaleString()} SAR</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.lateFee > 0 ? (
                          <span className="font-bold text-red-600">{(r.amount + r.lateFee).toLocaleString()} SAR</span>
                        ) : (
                          <span className="font-bold">{r.amount.toLocaleString()} SAR</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total Row */}
              <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <span className="font-bold text-lg">{language === 'ar' ? 'الإجمالي' : 'Total'}</span>
                <span className="font-bold text-xl text-blue-600">{simulationTotal.toLocaleString()} SAR</span>
              </div>
            </>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsSimulatorOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
