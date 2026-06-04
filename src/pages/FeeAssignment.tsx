import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, DollarSign, GraduationCap } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useFeeStore } from '../stores/feeStore';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { FeeGradeAssignment } from '../types/database';

interface AssignmentForm {
  feeCategoryId: string;
  gradeId: string;
  amount: number;
  currency: string;
  isMandatory: boolean;
  dueDate: string;
}

const initial: AssignmentForm = {
  feeCategoryId: '',
  gradeId: '',
  amount: 0,
  currency: 'SAR',
  isMandatory: true,
  dueDate: '',
};

export const FeeAssignment: React.FC = () => {
  const { t } = useTranslation();
  const {
    feeGradeAssignments,
    getFeeCategoriesByBranch,
    getFeeCategoryById,
    addFeeGradeAssignment,
    updateFeeGradeAssignment,
    deleteFeeGradeAssignment,
    getTotalFeeAmountForGrade,
  } = useFeeStore();
  const { getGradesByBranch, getEnhancedGradeById } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [filterGrade, setFilterGrade] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<FeeGradeAssignment | null>(null);
  const [form, setForm] = useState<AssignmentForm>(initial);

  const canCreate = hasPermission('fees', 'create');
  const canUpdate = hasPermission('fees', 'update');
  const canDelete = hasPermission('fees', 'delete');

  const branchCategories = currentBranch ? getFeeCategoriesByBranch(currentBranch.id) : [];
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];

  const filtered = feeGradeAssignments.filter((a) => {
    const matchBranch = currentBranch ? a.branchId === currentBranch.id : true;
    const matchYear = currentAcademicYear ? a.academicYearId === currentAcademicYear.id : true;
    const matchGrade = !filterGrade || a.gradeId === filterGrade;
    const matchCat = !filterCategory || a.feeCategoryId === filterCategory;
    return matchBranch && matchYear && matchGrade && matchCat;
  });

  const categoryOptions = branchCategories.map((c) => ({ value: c.id, label: `${getLocalizedValue(c.name)} (${c.code})` }));
  const gradeOptions = branchGrades.map((g) => ({ value: g.id, label: getLocalizedValue(g.name) }));
  const currencyOptions = [
    { value: 'SAR', label: t('feeAssignment.sar') },
    { value: 'USD', label: t('feeAssignment.usd') },
    { value: 'EUR', label: t('feeAssignment.eur') },
  ];

  const openModal = (item?: FeeGradeAssignment) => {
    if (item) {
      setSelected(item);
      setForm({
        feeCategoryId: item.feeCategoryId,
        gradeId: item.gradeId,
        amount: item.amount,
        currency: item.currency,
        isMandatory: item.isMandatory,
        dueDate: item.dueDate || '',
      });
    } else {
      setSelected(null);
      setForm(initial);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBranch || !currentAcademicYear) return;

    if (selected) {
      updateFeeGradeAssignment(selected.id, {
        feeCategoryId: form.feeCategoryId,
        gradeId: form.gradeId,
        amount: form.amount,
        currency: form.currency,
        isMandatory: form.isMandatory,
        dueDate: form.dueDate || undefined,
      });
      showToast('success', t('feeAssignment.assignmentUpdated'));
    } else {
      addFeeGradeAssignment({
        feeCategoryId: form.feeCategoryId,
        gradeId: form.gradeId,
        academicYearId: currentAcademicYear.id,
        amount: form.amount,
        currency: form.currency,
        isMandatory: form.isMandatory,
        dueDate: form.dueDate || undefined,
        branchId: currentBranch.id,
        isActive: true,
      });
      showToast('success', t('feeAssignment.assignmentCreated'));
    }
    setIsModalOpen(false);
    setSelected(null);
  };

  const handleDelete = () => {
    if (selected) {
      deleteFeeGradeAssignment(selected.id);
      showToast('success', t('feeAssignment.assignmentDeleted'));
      setIsDeleteOpen(false);
      setSelected(null);
    }
  };

  // Calculate grade totals summary
  const gradeSummary = branchGrades.map((g) => ({
    grade: g,
    total: currentAcademicYear ? getTotalFeeAmountForGrade(g.id, currentAcademicYear.id) : 0,
    count: filtered.filter((a) => a.gradeId === g.id).length,
  })).filter((s) => s.count > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {gradeSummary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {gradeSummary.map((s) => (
            <Card key={s.grade.id} padding="sm">
              <div className="flex items-center gap-2 mb-1">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{getLocalizedValue(s.grade.name)}</span>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {s.total.toLocaleString()} <span className="text-xs font-normal text-gray-500">SAR</span>
              </p>
              <p className="text-xs text-gray-500">{s.count} {language === 'ar' ? 'رسم' : 'fees'}</p>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader
          title={t('feeAssignment.title')}
          subtitle={`${filtered.length} ${language === 'ar' ? 'تعيين' : 'assignments'}`}
          action={canCreate && (
            <Button onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>{t('feeAssignment.addAssignment')}</Button>
          )}
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...gradeOptions]}
            placeholder={t('feeAssignment.grade')}
          />
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...categoryOptions]}
            placeholder={t('feeAssignment.feeCategory')}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>{t('feeAssignment.feeCategory')}</TableCell>
              <TableCell isHeader>{t('feeAssignment.grade')}</TableCell>
              <TableCell isHeader>{t('feeAssignment.amount')}</TableCell>
              <TableCell isHeader>{t('feeAssignment.currency')}</TableCell>
              <TableCell isHeader>{t('feeAssignment.isMandatory')}</TableCell>
              <TableCell isHeader>{t('feeAssignment.dueDate')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={7}>
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((a) => {
                const cat = getFeeCategoryById(a.feeCategoryId);
                const grade = getEnhancedGradeById(a.gradeId);
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{cat ? getLocalizedValue(cat.name) : '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{grade ? getLocalizedValue(grade.name) : '-'}</TableCell>
                    <TableCell>
                      <span className="font-bold text-gray-900 dark:text-white">{a.amount.toLocaleString()}</span>
                    </TableCell>
                    <TableCell><Badge>{a.currency}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={a.isMandatory ? 'danger' : 'default'}>
                        {a.isMandatory ? (language === 'ar' ? 'إلزامي' : 'Mandatory') : (language === 'ar' ? 'اختياري' : 'Optional')}
                      </Badge>
                    </TableCell>
                    <TableCell>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canUpdate && (
                          <Button variant="ghost" size="sm" onClick={() => openModal(a)}><Pencil className="w-4 h-4" /></Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => { setSelected(a); setIsDeleteOpen(true); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? t('feeAssignment.editAssignment') : t('feeAssignment.addAssignment')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('feeAssignment.feeCategory')}
            value={form.feeCategoryId}
            onChange={(e) => setForm({ ...form, feeCategoryId: e.target.value })}
            options={[{ value: '', label: t('common.selectOption') }, ...categoryOptions]}
            required
          />
          <Select
            label={t('feeAssignment.grade')}
            value={form.gradeId}
            onChange={(e) => setForm({ ...form, gradeId: e.target.value })}
            options={[{ value: '', label: t('common.selectOption') }, ...gradeOptions]}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('feeAssignment.amount')}
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              min={0}
              step="0.01"
              required
            />
            <Select
              label={t('feeAssignment.currency')}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={currencyOptions}
            />
          </div>
          <Input
            label={t('feeAssignment.dueDate')}
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <Checkbox
            checked={form.isMandatory}
            onChange={(checked) => setForm({ ...form, isMandatory: checked })}
            label={t('feeAssignment.isMandatory')}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{selected ? t('common.update') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t('common.confirm')} size="sm">
        <p className="text-gray-600 dark:text-gray-300 mb-6">{language === 'ar' ? 'هل أنت متأكد من حذف هذا التعيين؟' : 'Delete this fee assignment?'}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
};
