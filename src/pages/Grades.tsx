import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, GraduationCap, Search, ArrowRight, Layers } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { EnhancedGrade, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';

interface GradeFormData {
  nameAr: string;
  nameEn: string;
  code: string;
  educationLevelId: string;
  order: number;
  nextGradeId: string | null;
  isActive: boolean;
}

const initialFormData: GradeFormData = {
  nameAr: '',
  nameEn: '',
  code: '',
  educationLevelId: '',
  order: 1,
  nextGradeId: null,
  isActive: true,
};

export const Grades: React.FC = () => {
  const { t } = useTranslation();
  const { 
    enhancedGrades, 
    addEnhancedGrade, 
    updateEnhancedGrade, 
    deleteEnhancedGrade,
    getEducationLevelsByBranch,
    getGradesByBranch,
    getEducationLevelById
  } = useAcademicStore();
  const { hasPermission } = useAuthStore();
  const { currentBranch } = useAppStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<EnhancedGrade | null>(null);
  const [formData, setFormData] = useState<GradeFormData>(initialFormData);

  const canCreate = hasPermission('grades', 'create');
  const canUpdate = hasPermission('grades', 'update');
  const canDelete = hasPermission('grades', 'delete');

  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const educationLevels = currentBranch ? getEducationLevelsByBranch(currentBranch.id) : [];

  const filteredGrades = branchGrades.filter((grade) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      grade.name.ar.toLowerCase().includes(query) ||
      grade.name.en.toLowerCase().includes(query) ||
      grade.code.toLowerCase().includes(query);
    const matchesLevel = !filterLevel || grade.educationLevelId === filterLevel;
    return matchesSearch && matchesLevel;
  }).sort((a, b) => a.order - b.order);

  const levelOptions = educationLevels.map(l => ({ value: l.id, label: getLocalizedValue(l.name) }));
  const filterLevelOptions = [{ value: '', label: t('common.all') }, ...levelOptions];
  const gradeOptions = branchGrades
    .filter((g) => selectedGrade ? g.id !== selectedGrade.id : true)
    .map((g) => ({ value: g.id, label: getLocalizedValue(g.name) }));

  const getNextGradeName = (nextGradeId: string | null) => {
    if (!nextGradeId) return '-';
    const grade = enhancedGrades.find((g) => g.id === nextGradeId);
    return grade ? getLocalizedValue(grade.name) : '-';
  };

  const getLevelName = (levelId: string) => {
    const level = getEducationLevelById(levelId);
    return level ? getLocalizedValue(level.name) : '-';
  };

  const handleOpenModal = (grade?: EnhancedGrade) => {
    if (grade) {
      setSelectedGrade(grade);
      setFormData({
        nameAr: grade.name.ar,
        nameEn: grade.name.en,
        code: grade.code,
        educationLevelId: grade.educationLevelId,
        order: grade.order,
        nextGradeId: grade.nextGradeId,
        isActive: grade.isActive,
      });
    } else {
      setSelectedGrade(null);
      setFormData({
        ...initialFormData,
        order: filteredGrades.length + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGrade(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentBranch) {
      showToast('error', t('branches.selectBranch'));
      return;
    }

    const name: LocalizedText = {
      ar: sanitizeInput(formData.nameAr),
      en: sanitizeInput(formData.nameEn),
    };

    if (selectedGrade) {
      updateEnhancedGrade(selectedGrade.id, {
        name,
        code: sanitizeInput(formData.code),
        educationLevelId: formData.educationLevelId,
        order: formData.order,
        nextGradeId: formData.nextGradeId,
        isActive: formData.isActive,
      });
      showToast('success', t('grades.gradeUpdated'));
    } else {
      addEnhancedGrade({
        name,
        code: sanitizeInput(formData.code),
        educationLevelId: formData.educationLevelId,
        order: formData.order,
        nextGradeId: formData.nextGradeId,
        branchId: currentBranch.id,
        isActive: formData.isActive,
      });
      showToast('success', t('grades.gradeCreated'));
    }

    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedGrade) {
      deleteEnhancedGrade(selectedGrade.id);
      showToast('success', t('grades.gradeDeleted'));
      setIsDeleteModalOpen(false);
      setSelectedGrade(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('grades.title')}
          subtitle={`${filteredGrades.length} ${language === 'ar' ? 'مرحلة دراسية' : 'grades'}`}
          action={
            canCreate && (
              <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
                {t('grades.addGrade')}
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
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            options={filterLevelOptions}
            placeholder={t('grades.educationLevel')}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>{t('grades.order')}</TableCell>
              <TableCell isHeader>{t('grades.gradeName')}</TableCell>
              <TableCell isHeader>{t('grades.gradeCode')}</TableCell>
              <TableCell isHeader>{t('grades.educationLevel')}</TableCell>
              <TableCell isHeader>{t('grades.nextGrade')}</TableCell>
              <TableCell isHeader>{t('common.status')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGrades.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={7}>
                  <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredGrades.map((grade) => (
                <TableRow key={grade.id}>
                  <TableCell>
                    <Badge>{grade.order}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getLocalizedValue(grade.name)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{grade.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>{getLevelName(grade.educationLevelId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {grade.nextGradeId ? (
                        <>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span>{getNextGradeName(grade.nextGradeId)}</span>
                        </>
                      ) : (
                        <Badge variant="info">
                          {language === 'ar' ? 'آخر مرحلة' : 'Final Grade'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={grade.isActive ? 'success' : 'danger'}>
                      {grade.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(grade)}
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGrade(grade);
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
        title={selectedGrade ? t('grades.editGrade') : t('grades.addGrade')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('grades.educationLevel')}
            value={formData.educationLevelId}
            onChange={(e) => setFormData({ ...formData, educationLevelId: e.target.value })}
            options={[{ value: '', label: t('common.selectOption') }, ...levelOptions]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('grades.gradeNameAr')}
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              required
              dir="rtl"
              placeholder="الصف الأول"
            />
            <Input
              label={t('grades.gradeNameEn')}
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              required
              dir="ltr"
              placeholder="Grade 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('grades.gradeCode')}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              placeholder="G1"
            />
            <Input
              label={t('grades.order')}
              type="number"
              min={1}
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              required
            />
          </div>

          <Select
            label={t('grades.nextGrade')}
            value={formData.nextGradeId || ''}
            onChange={(e) => setFormData({ ...formData, nextGradeId: e.target.value || null })}
            options={[
              { value: '', label: language === 'ar' ? 'لا يوجد (آخر مرحلة)' : 'None (Final Grade)' },
              ...gradeOptions,
            ]}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              {t('common.active')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {selectedGrade ? t('common.update') : t('common.create')}
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
            ? 'هل أنت متأكد من حذف هذه المرحلة الدراسية؟'
            : 'Are you sure you want to delete this grade?'}
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
    </div>
  );
};
