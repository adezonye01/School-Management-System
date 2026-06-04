import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Calendar, Archive, RefreshCw, Search } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { AcademicYear, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';

interface YearFormData {
  nameAr: string;
  nameEn: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

const initialFormData: YearFormData = {
  nameAr: '',
  nameEn: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
};

export const AcademicYears: React.FC = () => {
  const { t } = useTranslation();
  const { 
    academicYears, 
    branches, 
    addAcademicYear, 
    updateAcademicYear, 
    deleteAcademicYear,
    archiveAcademicYear,
    setCurrentAcademicYear: setCurrentYear,
    addAuditLog 
  } = useDataStore();
  const { hasPermission, user } = useAuthStore();
  const { currentBranch } = useAppStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState<string>(currentBranch?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isRollOverModalOpen, setIsRollOverModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState<YearFormData>(initialFormData);

  const canCreate = hasPermission('academicYears', 'create');
  const canUpdate = hasPermission('academicYears', 'update');
  const canDelete = hasPermission('academicYears', 'delete');
  const canApprove = hasPermission('academicYears', 'approve');

  const filteredYears = academicYears.filter((year) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      year.name.ar.toLowerCase().includes(query) ||
      year.name.en.toLowerCase().includes(query);
    const matchesBranch = !filterBranch || year.branchId === filterBranch;
    return matchesSearch && matchesBranch;
  });

  const branchOptions = branches
    .filter((b) => b.isActive)
    .map((b) => ({
      value: b.id,
      label: getLocalizedValue(b.name),
    }));

  const handleOpenModal = (year?: AcademicYear) => {
    if (year) {
      setSelectedYear(year);
      setFormData({
        nameAr: year.name.ar,
        nameEn: year.name.en,
        startDate: year.startDate,
        endDate: year.endDate,
        isCurrent: year.isCurrent,
      });
    } else {
      setSelectedYear(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedYear(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!filterBranch) {
      showToast('error', t('branches.selectBranch'));
      return;
    }

    const name: LocalizedText = {
      ar: sanitizeInput(formData.nameAr),
      en: sanitizeInput(formData.nameEn),
    };

    if (selectedYear) {
      updateAcademicYear(selectedYear.id, {
        name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: formData.isCurrent,
      });

      // If setting as current, unset other years
      if (formData.isCurrent) {
        setCurrentYear(selectedYear.branchId, selectedYear.id);
      }

      addAuditLog({
        userId: user!.id,
        action: 'update',
        module: 'academicYears',
        entityId: selectedYear.id,
        oldValues: selectedYear,
        newValues: { name, startDate: formData.startDate, endDate: formData.endDate },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('academicYears.yearUpdated'));
    } else {
      const newYear = addAcademicYear({
        branchId: filterBranch,
        name,
        startDate: formData.startDate,
        endDate: formData.endDate,
        isCurrent: formData.isCurrent,
        isArchived: false,
      });

      // If setting as current, unset other years
      if (formData.isCurrent) {
        setCurrentYear(filterBranch, newYear.id);
      }

      addAuditLog({
        userId: user!.id,
        action: 'create',
        module: 'academicYears',
        entityId: newYear.id,
        newValues: { name, branchId: filterBranch },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('academicYears.yearCreated'));
    }

    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedYear) {
      deleteAcademicYear(selectedYear.id);

      addAuditLog({
        userId: user!.id,
        action: 'delete',
        module: 'academicYears',
        entityId: selectedYear.id,
        oldValues: selectedYear,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('common.success'));
      setIsDeleteModalOpen(false);
      setSelectedYear(null);
    }
  };

  const handleArchive = () => {
    if (selectedYear) {
      archiveAcademicYear(selectedYear.id);

      addAuditLog({
        userId: user!.id,
        action: 'archive',
        module: 'academicYears',
        entityId: selectedYear.id,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('academicYears.yearArchived'));
      setIsArchiveModalOpen(false);
      setSelectedYear(null);
    }
  };

  const handleRollOver = () => {
    if (selectedYear) {
      // In a real application, this would:
      // 1. Get all students in the current year
      // 2. Check their final grades/pass status
      // 3. Move passing students to the next grade
      // 4. Create new enrollments for the new academic year
      // 5. Archive the old year's data

      addAuditLog({
        userId: user!.id,
        action: 'rollover',
        module: 'academicYears',
        entityId: selectedYear.id,
        newValues: { action: 'Student roll-over initiated' },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('common.success'));
      setIsRollOverModalOpen(false);
      setSelectedYear(null);
    }
  };

  const getBranchName = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    return branch ? getLocalizedValue(branch.name) : '-';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('academicYears.title')}
          subtitle={`${filteredYears.length} ${language === 'ar' ? 'سنة دراسية' : 'academic years'}`}
          action={
            canCreate && (
              <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
                {t('academicYears.addYear')}
              </Button>
            )
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            leftIcon={<Search className="w-5 h-5" />}
          />
          <Select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...branchOptions]}
            placeholder={t('branches.selectBranch')}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>{t('academicYears.yearName')}</TableCell>
              <TableCell isHeader>{t('sidebar.branches')}</TableCell>
              <TableCell isHeader>{t('academicYears.startDate')}</TableCell>
              <TableCell isHeader>{t('academicYears.endDate')}</TableCell>
              <TableCell isHeader>{t('common.status')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredYears.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredYears.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getLocalizedValue(year.name)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getBranchName(year.branchId)}</TableCell>
                  <TableCell>{new Date(year.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(year.endDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {year.isCurrent && (
                        <Badge variant="success">{t('academicYears.isCurrent')}</Badge>
                      )}
                      {year.isArchived && (
                        <Badge variant="warning">{t('academicYears.isArchived')}</Badge>
                      )}
                      {!year.isCurrent && !year.isArchived && (
                        <Badge variant="default">{t('common.inactive')}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canUpdate && !year.isArchived && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(year)}
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canApprove && year.isCurrent && !year.isArchived && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedYear(year);
                              setIsRollOverModalOpen(true);
                            }}
                            title={t('academicYears.rollOver')}
                          >
                            <RefreshCw className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedYear(year);
                              setIsArchiveModalOpen(true);
                            }}
                            title={t('academicYears.archiveYear')}
                          >
                            <Archive className="w-4 h-4 text-orange-500" />
                          </Button>
                        </>
                      )}
                      {canDelete && !year.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedYear(year);
                            setIsDeleteModalOpen(true);
                          }}
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedYear ? t('academicYears.editYear') : t('academicYears.addYear')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('academicYears.yearNameAr')}
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              required
              dir="rtl"
              placeholder="العام الدراسي 2025-2026"
            />
            <Input
              label={t('academicYears.yearNameEn')}
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              required
              dir="ltr"
              placeholder="Academic Year 2025-2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('academicYears.startDate')}
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label={t('academicYears.endDate')}
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isCurrent"
              checked={formData.isCurrent}
              onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isCurrent" className="text-sm text-gray-700 dark:text-gray-300">
              {t('academicYears.isCurrent')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {selectedYear ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('common.confirm')}
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {language === 'ar' 
            ? 'هل أنت متأكد من حذف هذه السنة الدراسية؟' 
            : 'Are you sure you want to delete this academic year?'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>

      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        title={t('academicYears.archiveYear')}
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {t('academicYears.archiveConfirm')}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsArchiveModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleArchive} leftIcon={<Archive className="w-4 h-4" />}>
            {t('academicYears.archiveYear')}
          </Button>
        </div>
      </Modal>

      {/* Roll Over Modal */}
      <Modal
        isOpen={isRollOverModalOpen}
        onClose={() => setIsRollOverModalOpen(false)}
        title={t('academicYears.rollOverTitle')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {t('academicYears.rollOverDescription')}
            </p>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              {language === 'ar'
                ? 'تنبيه: هذه العملية لا يمكن التراجع عنها. تأكد من مراجعة جميع درجات الطلاب قبل الترحيل.'
                : 'Warning: This action cannot be undone. Make sure all student grades are reviewed before proceeding.'}
            </p>
          </div>

          <p className="text-gray-600 dark:text-gray-300">
            {t('academicYears.rollOverConfirm')}
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsRollOverModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleRollOver} leftIcon={<RefreshCw className="w-4 h-4" />}>
              {t('academicYears.rollOver')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
