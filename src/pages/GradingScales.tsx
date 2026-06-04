import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Scale, ChevronDown, ChevronRight } from 'lucide-react';
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
import type { GradingScale, GradingScaleLevel, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';

interface ScaleFormData {
  nameAr: string;
  nameEn: string;
  evaluationType: 'numerical' | 'alphabetical' | 'descriptive';
  gradeId: string;
  isDefault: boolean;
}

interface LevelFormData {
  gradeAr: string;
  gradeEn: string;
  minPercentage: number;
  maxPercentage: number;
  gpa: number;
  descriptionAr: string;
  descriptionEn: string;
  color: string;
  order: number;
}

const initialScaleForm: ScaleFormData = {
  nameAr: '',
  nameEn: '',
  evaluationType: 'numerical',
  gradeId: '',
  isDefault: false,
};

const initialLevelForm: LevelFormData = {
  gradeAr: '',
  gradeEn: '',
  minPercentage: 0,
  maxPercentage: 100,
  gpa: 0,
  descriptionAr: '',
  descriptionEn: '',
  color: '#3b82f6',
  order: 1,
};

const colorOptions = [
  { value: '#22c55e', label: '🟢' },
  { value: '#84cc16', label: '🟡' },
  { value: '#eab308', label: '🟠' },
  { value: '#f97316', label: '🟤' },
  { value: '#ef4444', label: '🔴' },
  { value: '#3b82f6', label: '🔵' },
  { value: '#8b5cf6', label: '🟣' },
];

export const GradingScales: React.FC = () => {
  const { t } = useTranslation();
  const { 
    getGradingScalesByBranch,
    getLevelsByScale,
    getGradesByBranch,
    addGradingScale,
    updateGradingScale,
    deleteGradingScale,
    addGradingScaleLevel,
    updateGradingScaleLevel,
    deleteGradingScaleLevel,
  } = useAcademicStore();
  const { currentBranch } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [expandedScales, setExpandedScales] = useState<string[]>([]);
  
  // Modal states
  const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'scale' | 'level'; id: string } | null>(null);
  
  const [selectedScale, setSelectedScale] = useState<GradingScale | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<GradingScaleLevel | null>(null);
  const [scaleForm, setScaleForm] = useState<ScaleFormData>(initialScaleForm);
  const [levelForm, setLevelForm] = useState<LevelFormData>(initialLevelForm);
  const [currentScaleId, setCurrentScaleId] = useState<string>('');

  const canCreate = hasPermission('settings', 'update');
  const canUpdate = hasPermission('settings', 'update');
  const canDelete = hasPermission('settings', 'update');

  const branchScales = currentBranch ? getGradingScalesByBranch(currentBranch.id) : [];
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const gradeOptions = [{ value: '', label: language === 'ar' ? 'جميع الصفوف' : 'All Grades' }, ...branchGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }))];

  const evaluationTypeOptions = [
    { value: 'numerical', label: t('grading.numerical') },
    { value: 'alphabetical', label: t('grading.alphabetical') },
    { value: 'descriptive', label: t('grading.descriptive') },
  ];

  const toggleScale = (scaleId: string) => {
    setExpandedScales(prev => 
      prev.includes(scaleId) ? prev.filter(id => id !== scaleId) : [...prev, scaleId]
    );
  };

  // Scale handlers
  const handleOpenScaleModal = (scale?: GradingScale) => {
    if (scale) {
      setSelectedScale(scale);
      setScaleForm({
        nameAr: scale.name.ar,
        nameEn: scale.name.en,
        evaluationType: scale.evaluationType,
        gradeId: scale.gradeId || '',
        isDefault: scale.isDefault,
      });
    } else {
      setSelectedScale(null);
      setScaleForm(initialScaleForm);
    }
    setIsScaleModalOpen(true);
  };

  const handleSaveScale = () => {
    if (!currentBranch) return;

    const name: LocalizedText = {
      ar: sanitizeInput(scaleForm.nameAr),
      en: sanitizeInput(scaleForm.nameEn),
    };

    if (selectedScale) {
      updateGradingScale(selectedScale.id, {
        name,
        evaluationType: scaleForm.evaluationType,
        gradeId: scaleForm.gradeId || undefined,
        isDefault: scaleForm.isDefault,
      });
      showToast('success', t('common.success'));
    } else {
      addGradingScale({
        name,
        evaluationType: scaleForm.evaluationType,
        gradeId: scaleForm.gradeId || undefined,
        branchId: currentBranch.id,
        isDefault: scaleForm.isDefault,
        isActive: true,
      });
      showToast('success', t('common.success'));
    }
    setIsScaleModalOpen(false);
  };

  // Level handlers
  const handleOpenLevelModal = (scaleId: string, level?: GradingScaleLevel) => {
    setCurrentScaleId(scaleId);
    if (level) {
      setSelectedLevel(level);
      setLevelForm({
        gradeAr: level.grade.ar,
        gradeEn: level.grade.en,
        minPercentage: level.minPercentage,
        maxPercentage: level.maxPercentage,
        gpa: level.gpa || 0,
        descriptionAr: level.description.ar,
        descriptionEn: level.description.en,
        color: level.color,
        order: level.order,
      });
    } else {
      setSelectedLevel(null);
      const existingLevels = getLevelsByScale(scaleId);
      setLevelForm({ ...initialLevelForm, order: existingLevels.length + 1 });
    }
    setIsLevelModalOpen(true);
  };

  const handleSaveLevel = () => {
    const grade: LocalizedText = {
      ar: sanitizeInput(levelForm.gradeAr),
      en: sanitizeInput(levelForm.gradeEn),
    };
    const description: LocalizedText = {
      ar: sanitizeInput(levelForm.descriptionAr),
      en: sanitizeInput(levelForm.descriptionEn),
    };

    if (selectedLevel) {
      updateGradingScaleLevel(selectedLevel.id, {
        grade,
        minPercentage: levelForm.minPercentage,
        maxPercentage: levelForm.maxPercentage,
        gpa: levelForm.gpa,
        description,
        color: levelForm.color,
        order: levelForm.order,
      });
      showToast('success', t('common.success'));
    } else {
      addGradingScaleLevel({
        gradingScaleId: currentScaleId,
        grade,
        minPercentage: levelForm.minPercentage,
        maxPercentage: levelForm.maxPercentage,
        gpa: levelForm.gpa,
        description,
        color: levelForm.color,
        order: levelForm.order,
      });
      showToast('success', t('common.success'));
    }
    setIsLevelModalOpen(false);
  };

  // Delete handler
  const handleDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'scale') {
      deleteGradingScale(deleteTarget.id);
    } else {
      deleteGradingScaleLevel(deleteTarget.id);
    }
    showToast('success', t('common.success'));
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('grading.gradingScale')}
          subtitle={`${branchScales.length} ${language === 'ar' ? 'سلم درجات' : 'grading scales'}`}
          action={
            canCreate && (
              <Button onClick={() => handleOpenScaleModal()} leftIcon={<Plus className="w-4 h-4" />}>
                {t('grading.addScale')}
              </Button>
            )
          }
        />

        {/* Scales List */}
        <div className="space-y-3">
          {branchScales.length === 0 ? (
            <div className="text-center py-8">
              <Scale className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('common.noData')}</p>
            </div>
          ) : (
            branchScales.map((scale) => {
              const levels = getLevelsByScale(scale.id);
              const isExpanded = expandedScales.includes(scale.id);

              return (
                <div key={scale.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Scale Header */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                    onClick={() => toggleScale(scale.id)}
                  >
                    <div className="flex items-center gap-4">
                      <button className="text-gray-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Scale className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">{getLocalizedValue(scale.name)}</p>
                        <p className="text-sm text-gray-500">
                          {evaluationTypeOptions.find(e => e.value === scale.evaluationType)?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {scale.isDefault && (
                        <Badge variant="success">{language === 'ar' ? 'افتراضي' : 'Default'}</Badge>
                      )}
                      <Badge variant="info">{levels.length} {language === 'ar' ? 'مستويات' : 'levels'}</Badge>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canUpdate && (
                          <Button variant="ghost" size="sm" onClick={() => handleOpenScaleModal(scale)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'scale', id: scale.id }); setIsDeleteModalOpen(true); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scale Levels */}
                  {isExpanded && (
                    <div className="p-4 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">{language === 'ar' ? 'مستويات الدرجات' : 'Grade Levels'}</h4>
                        {canCreate && (
                          <Button size="sm" variant="outline" onClick={() => handleOpenLevelModal(scale.id)} leftIcon={<Plus className="w-4 h-4" />}>
                            {language === 'ar' ? 'إضافة مستوى' : 'Add Level'}
                          </Button>
                        )}
                      </div>

                      {levels.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">{t('common.noData')}</p>
                      ) : (
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell isHeader>{t('grading.gradeLevel')}</TableCell>
                              <TableCell isHeader>{t('grading.minPercentage')}</TableCell>
                              <TableCell isHeader>{t('grading.maxPercentage')}</TableCell>
                              {scale.evaluationType !== 'descriptive' && (
                                <TableCell isHeader>{t('grading.gpa')}</TableCell>
                              )}
                              <TableCell isHeader>{t('common.actions')}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {levels.map((level) => (
                              <TableRow key={level.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full"
                                      style={{ backgroundColor: level.color }}
                                    />
                                    <span className="font-medium">{getLocalizedValue(level.grade)}</span>
                                    <span className="text-sm text-gray-500">({getLocalizedValue(level.description)})</span>
                                  </div>
                                </TableCell>
                                <TableCell>{level.minPercentage}%</TableCell>
                                <TableCell>{level.maxPercentage}%</TableCell>
                                {scale.evaluationType !== 'descriptive' && (
                                  <TableCell>{level.gpa}</TableCell>
                                )}
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {canUpdate && (
                                      <Button variant="ghost" size="sm" onClick={() => handleOpenLevelModal(scale.id, level)}>
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {canDelete && (
                                      <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'level', id: level.id }); setIsDeleteModalOpen(true); }}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </Button>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Scale Modal */}
      <Modal
        isOpen={isScaleModalOpen}
        onClose={() => setIsScaleModalOpen(false)}
        title={selectedScale ? t('grading.editScale') : t('grading.addScale')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('grading.scaleName')} (${t('common.arabic')})`}
              value={scaleForm.nameAr}
              onChange={(e) => setScaleForm({ ...scaleForm, nameAr: e.target.value })}
              dir="rtl"
              required
            />
            <Input
              label={`${t('grading.scaleName')} (${t('common.english')})`}
              value={scaleForm.nameEn}
              onChange={(e) => setScaleForm({ ...scaleForm, nameEn: e.target.value })}
              dir="ltr"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('grading.evaluationType')}
              value={scaleForm.evaluationType}
              onChange={(e) => setScaleForm({ ...scaleForm, evaluationType: e.target.value as any })}
              options={evaluationTypeOptions}
              required
            />
            <Select
              label={language === 'ar' ? 'خاص بصف معين' : 'Specific Grade'}
              value={scaleForm.gradeId}
              onChange={(e) => setScaleForm({ ...scaleForm, gradeId: e.target.value })}
              options={gradeOptions}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isDefault"
              checked={scaleForm.isDefault}
              onChange={(e) => setScaleForm({ ...scaleForm, isDefault: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'سلم افتراضي' : 'Default Scale'}
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsScaleModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveScale}>{selectedScale ? t('common.update') : t('common.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Level Modal */}
      <Modal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        title={selectedLevel ? (language === 'ar' ? 'تعديل المستوى' : 'Edit Level') : (language === 'ar' ? 'إضافة مستوى' : 'Add Level')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('grading.gradeLevel')} (${t('common.arabic')})`}
              value={levelForm.gradeAr}
              onChange={(e) => setLevelForm({ ...levelForm, gradeAr: e.target.value })}
              dir="rtl"
              required
              placeholder="مثال: ممتاز، A"
            />
            <Input
              label={`${t('grading.gradeLevel')} (${t('common.english')})`}
              value={levelForm.gradeEn}
              onChange={(e) => setLevelForm({ ...levelForm, gradeEn: e.target.value })}
              dir="ltr"
              required
              placeholder="e.g., Excellent, A"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('grading.minPercentage')}
              type="number"
              value={levelForm.minPercentage}
              onChange={(e) => setLevelForm({ ...levelForm, minPercentage: parseInt(e.target.value) || 0 })}
              min={0}
              max={100}
              required
            />
            <Input
              label={t('grading.maxPercentage')}
              type="number"
              value={levelForm.maxPercentage}
              onChange={(e) => setLevelForm({ ...levelForm, maxPercentage: parseInt(e.target.value) || 100 })}
              min={0}
              max={100}
              required
            />
            <Input
              label={t('grading.gpa')}
              type="number"
              step="0.1"
              value={levelForm.gpa}
              onChange={(e) => setLevelForm({ ...levelForm, gpa: parseFloat(e.target.value) || 0 })}
              min={0}
              max={4}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${language === 'ar' ? 'الوصف' : 'Description'} (${t('common.arabic')})`}
              value={levelForm.descriptionAr}
              onChange={(e) => setLevelForm({ ...levelForm, descriptionAr: e.target.value })}
              dir="rtl"
            />
            <Input
              label={`${language === 'ar' ? 'الوصف' : 'Description'} (${t('common.english')})`}
              value={levelForm.descriptionEn}
              onChange={(e) => setLevelForm({ ...levelForm, descriptionEn: e.target.value })}
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {language === 'ar' ? 'اللون' : 'Color'}
              </label>
              <div className="flex gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setLevelForm({ ...levelForm, color: color.value })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      levelForm.color === color.value ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
            <Input
              label={t('grades.order')}
              type="number"
              value={levelForm.order}
              onChange={(e) => setLevelForm({ ...levelForm, order: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsLevelModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveLevel}>{selectedLevel ? t('common.update') : t('common.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('common.confirm')}
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete?'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
};
