import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, BookOpen, Search, Scale, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { SubjectGradeMapping, GradeWeightDistribution, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';


interface MappingFormData {
  subjectId: string;
  gradeId: string;
  maxMarks: number;
  minPassingMarks: number;
  creditHours: number;
  isCore: boolean;
}

interface WeightFormData {
  nameAr: string;
  nameEn: string;
  componentCode: string;
  weightPercentage: number;
  maxMarks: number;
  order: number;
}

const initialMappingForm: MappingFormData = {
  subjectId: '',
  gradeId: '',
  maxMarks: 100,
  minPassingMarks: 50,
  creditHours: 3,
  isCore: true,
};

const initialWeightForm: WeightFormData = {
  nameAr: '',
  nameEn: '',
  componentCode: '',
  weightPercentage: 0,
  maxMarks: 0,
  order: 1,
};

export const SubjectMapping: React.FC = () => {
  const { t } = useTranslation();
  const { 
    getSubjectsByBranch, 
    getGradesByBranch,
    
    getSubjectById,
    getEnhancedGradeById,
    getWeightDistributionsByMapping,
    addSubjectGradeMapping,
    updateSubjectGradeMapping,
    deleteSubjectGradeMapping,
    addWeightDistribution,
    updateWeightDistribution,
    deleteWeightDistribution,
    subjectGradeMappings
  } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [expandedMappings, setExpandedMappings] = useState<string[]>([]);
  
  // Modal states
  const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'mapping' | 'weight'; id: string } | null>(null);
  
  const [selectedMapping, setSelectedMapping] = useState<SubjectGradeMapping | null>(null);
  const [selectedWeight, setSelectedWeight] = useState<GradeWeightDistribution | null>(null);
  const [mappingForm, setMappingForm] = useState<MappingFormData>(initialMappingForm);
  const [weightForm, setWeightForm] = useState<WeightFormData>(initialWeightForm);
  const [currentMappingId, setCurrentMappingId] = useState<string>('');

  const canCreate = hasPermission('subjects', 'create');
  const canUpdate = hasPermission('subjects', 'update');
  const canDelete = hasPermission('subjects', 'delete');

  const branchSubjects = currentBranch ? getSubjectsByBranch(currentBranch.id) : [];
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  
  const allMappings = currentBranch && currentAcademicYear 
    ? subjectGradeMappings.filter(m => m.branchId === currentBranch.id && m.academicYearId === currentAcademicYear.id)
    : [];

  const filteredMappings = allMappings.filter((mapping) => {
    const subject = getSubjectById(mapping.subjectId);
    const query = searchQuery.toLowerCase();
    const matchesSearch = subject && (
      subject.name.ar.toLowerCase().includes(query) ||
      subject.name.en.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query)
    );
    const matchesGrade = !filterGrade || mapping.gradeId === filterGrade;
    return matchesSearch && matchesGrade;
  });

  const subjectOptions = branchSubjects.map(s => ({ value: s.id, label: `${getLocalizedValue(s.name)} (${s.code})` }));
  const gradeOptions = branchGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }));

  const toggleMapping = (mappingId: string) => {
    setExpandedMappings(prev => 
      prev.includes(mappingId) ? prev.filter(id => id !== mappingId) : [...prev, mappingId]
    );
  };

  // Mapping handlers
  const handleOpenMappingModal = (mapping?: SubjectGradeMapping) => {
    if (mapping) {
      setSelectedMapping(mapping);
      setMappingForm({
        subjectId: mapping.subjectId,
        gradeId: mapping.gradeId,
        maxMarks: mapping.maxMarks,
        minPassingMarks: mapping.minPassingMarks,
        creditHours: mapping.creditHours || 3,
        isCore: mapping.isCore,
      });
    } else {
      setSelectedMapping(null);
      setMappingForm(initialMappingForm);
    }
    setIsMappingModalOpen(true);
  };

  const handleSaveMapping = () => {
    if (!currentBranch || !currentAcademicYear) return;

    if (selectedMapping) {
      updateSubjectGradeMapping(selectedMapping.id, {
        subjectId: mappingForm.subjectId,
        gradeId: mappingForm.gradeId,
        maxMarks: mappingForm.maxMarks,
        minPassingMarks: mappingForm.minPassingMarks,
        creditHours: mappingForm.creditHours,
        isCore: mappingForm.isCore,
      });
      showToast('success', t('subjectMapping.mappingUpdated'));
    } else {
      addSubjectGradeMapping({
        subjectId: mappingForm.subjectId,
        gradeId: mappingForm.gradeId,
        academicYearId: currentAcademicYear.id,
        maxMarks: mappingForm.maxMarks,
        minPassingMarks: mappingForm.minPassingMarks,
        creditHours: mappingForm.creditHours,
        isCore: mappingForm.isCore,
        branchId: currentBranch.id,
        isActive: true,
      });
      showToast('success', t('subjectMapping.mappingCreated'));
    }
    setIsMappingModalOpen(false);
  };

  // Weight handlers
  const handleOpenWeightModal = (mappingId: string, weight?: GradeWeightDistribution) => {
    setCurrentMappingId(mappingId);
    if (weight) {
      setSelectedWeight(weight);
      setWeightForm({
        nameAr: weight.componentName.ar,
        nameEn: weight.componentName.en,
        componentCode: weight.componentCode,
        weightPercentage: weight.weightPercentage,
        maxMarks: weight.maxMarks,
        order: weight.order,
      });
    } else {
      setSelectedWeight(null);
      const existingWeights = getWeightDistributionsByMapping(mappingId);
      setWeightForm({ ...initialWeightForm, order: existingWeights.length + 1 });
    }
    setIsWeightModalOpen(true);
  };

  const handleSaveWeight = () => {
    const componentName: LocalizedText = {
      ar: sanitizeInput(weightForm.nameAr),
      en: sanitizeInput(weightForm.nameEn),
    };

    if (selectedWeight) {
      updateWeightDistribution(selectedWeight.id, {
        componentName,
        componentCode: sanitizeInput(weightForm.componentCode),
        weightPercentage: weightForm.weightPercentage,
        maxMarks: weightForm.maxMarks,
        order: weightForm.order,
      });
      showToast('success', t('common.success'));
    } else {
      addWeightDistribution({
        subjectGradeMappingId: currentMappingId,
        componentName,
        componentCode: sanitizeInput(weightForm.componentCode),
        weightPercentage: weightForm.weightPercentage,
        maxMarks: weightForm.maxMarks,
        order: weightForm.order,
        isActive: true,
      });
      showToast('success', t('common.success'));
    }
    setIsWeightModalOpen(false);
  };

  // Delete handler
  const handleDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'mapping') {
      deleteSubjectGradeMapping(deleteTarget.id);
      showToast('success', t('subjectMapping.mappingDeleted'));
    } else {
      deleteWeightDistribution(deleteTarget.id);
      showToast('success', t('common.success'));
    }
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const getTotalWeight = (mappingId: string) => {
    const weights = getWeightDistributionsByMapping(mappingId);
    return weights.reduce((sum, w) => sum + w.weightPercentage, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('subjectMapping.title')}
          subtitle={`${filteredMappings.length} ${language === 'ar' ? 'ربط' : 'mappings'}`}
          action={
            canCreate && (
              <Button onClick={() => handleOpenMappingModal()} leftIcon={<Plus className="w-4 h-4" />}>
                {t('subjectMapping.addMapping')}
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
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...gradeOptions]}
            placeholder={t('subjectMapping.grade')}
          />
        </div>

        {/* Mappings List */}
        <div className="space-y-3">
          {filteredMappings.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('common.noData')}</p>
            </div>
          ) : (
            filteredMappings.map((mapping) => {
              const subject = getSubjectById(mapping.subjectId);
              const grade = getEnhancedGradeById(mapping.gradeId);
              const weights = getWeightDistributionsByMapping(mapping.id);
              const totalWeight = getTotalWeight(mapping.id);
              const isExpanded = expandedMappings.includes(mapping.id);

              return (
                <div key={mapping.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Mapping Header */}
                  <div 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                    onClick={() => toggleMapping(mapping.id)}
                  >
                    <div className="flex items-center gap-4">
                      <button className="text-gray-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{subject ? getLocalizedValue(subject.name) : '-'}</p>
                        <p className="text-sm text-gray-500">{grade ? getLocalizedValue(grade.name) : '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={mapping.isCore ? 'info' : 'default'}>
                        {mapping.isCore ? t('subjectMapping.isCore') : t('subjectMapping.isElective')}
                      </Badge>
                      <Badge variant="default">
                        {t('subjectMapping.maxMarks')}: {mapping.maxMarks}
                      </Badge>
                      <Badge variant="default">
                        {t('subjectMapping.minPassingMarks')}: {mapping.minPassingMarks}
                      </Badge>
                      <Badge variant={totalWeight === 100 ? 'success' : 'warning'}>
                        {t('grading.totalWeight')}: {totalWeight}%
                      </Badge>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canUpdate && (
                          <Button variant="ghost" size="sm" onClick={() => handleOpenMappingModal(mapping)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'mapping', id: mapping.id }); setIsDeleteModalOpen(true); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weight Distribution */}
                  {isExpanded && (
                    <div className="p-4 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Scale className="w-4 h-4" />
                          {t('grading.weightDistribution')}
                        </h4>
                        {canCreate && (
                          <Button size="sm" variant="outline" onClick={() => handleOpenWeightModal(mapping.id)} leftIcon={<Plus className="w-4 h-4" />}>
                            {t('grading.addComponent')}
                          </Button>
                        )}
                      </div>

                      {weights.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">{t('common.noData')}</p>
                      ) : (
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell isHeader>{t('grading.componentName')}</TableCell>
                              <TableCell isHeader>{t('grading.weightPercentage')}</TableCell>
                              <TableCell isHeader>{t('subjectMapping.maxMarks')}</TableCell>
                              <TableCell isHeader>{t('grades.order')}</TableCell>
                              <TableCell isHeader>{t('common.actions')}</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {weights.map((weight) => (
                              <TableRow key={weight.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="default">{weight.componentCode}</Badge>
                                    {getLocalizedValue(weight.componentName)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${weight.weightPercentage}%` }}
                                      />
                                    </div>
                                    <span>{weight.weightPercentage}%</span>
                                  </div>
                                </TableCell>
                                <TableCell>{weight.maxMarks}</TableCell>
                                <TableCell>{weight.order}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    {canUpdate && (
                                      <Button variant="ghost" size="sm" onClick={() => handleOpenWeightModal(mapping.id, weight)}>
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {canDelete && (
                                      <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'weight', id: weight.id }); setIsDeleteModalOpen(true); }}>
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

                      {totalWeight !== 100 && weights.length > 0 && (
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                          ⚠️ {t('grading.mustEqual100')} ({language === 'ar' ? 'الحالي' : 'Current'}: {totalWeight}%)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Mapping Modal */}
      <Modal
        isOpen={isMappingModalOpen}
        onClose={() => setIsMappingModalOpen(false)}
        title={selectedMapping ? t('subjectMapping.editMapping') : t('subjectMapping.addMapping')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('subjectMapping.subject')}
              value={mappingForm.subjectId}
              onChange={(e) => setMappingForm({ ...mappingForm, subjectId: e.target.value })}
              options={subjectOptions}
              required
            />
            <Select
              label={t('subjectMapping.grade')}
              value={mappingForm.gradeId}
              onChange={(e) => setMappingForm({ ...mappingForm, gradeId: e.target.value })}
              options={gradeOptions}
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('subjectMapping.maxMarks')}
              type="number"
              value={mappingForm.maxMarks}
              onChange={(e) => setMappingForm({ ...mappingForm, maxMarks: parseInt(e.target.value) || 100 })}
              min={1}
              required
            />
            <Input
              label={t('subjectMapping.minPassingMarks')}
              type="number"
              value={mappingForm.minPassingMarks}
              onChange={(e) => setMappingForm({ ...mappingForm, minPassingMarks: parseInt(e.target.value) || 50 })}
              min={0}
              required
            />
            <Input
              label={t('subjectMapping.creditHours')}
              type="number"
              value={mappingForm.creditHours}
              onChange={(e) => setMappingForm({ ...mappingForm, creditHours: parseInt(e.target.value) || 3 })}
              min={1}
            />
          </div>
          <Checkbox
            checked={mappingForm.isCore}
            onChange={(checked) => setMappingForm({ ...mappingForm, isCore: checked })}
            label={t('subjectMapping.isCore')}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsMappingModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveMapping}>{selectedMapping ? t('common.update') : t('common.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Weight Modal */}
      <Modal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title={selectedWeight ? t('grading.editComponent') : t('grading.addComponent')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('grading.componentNameAr')}
              value={weightForm.nameAr}
              onChange={(e) => setWeightForm({ ...weightForm, nameAr: e.target.value })}
              dir="rtl"
              required
              placeholder={language === 'ar' ? 'مثال: الاختبارات القصيرة' : 'e.g., الاختبارات القصيرة'}
            />
            <Input
              label={t('grading.componentNameEn')}
              value={weightForm.nameEn}
              onChange={(e) => setWeightForm({ ...weightForm, nameEn: e.target.value })}
              dir="ltr"
              required
              placeholder="e.g., Quizzes"
            />
          </div>
          <Input
            label={language === 'ar' ? 'رمز المكون' : 'Component Code'}
            value={weightForm.componentCode}
            onChange={(e) => setWeightForm({ ...weightForm, componentCode: e.target.value.toUpperCase() })}
            required
            placeholder="e.g., QUIZ, MID, FINAL"
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('grading.weightPercentage')}
              type="number"
              value={weightForm.weightPercentage}
              onChange={(e) => setWeightForm({ ...weightForm, weightPercentage: parseInt(e.target.value) || 0 })}
              min={0}
              max={100}
              required
            />
            <Input
              label={t('subjectMapping.maxMarks')}
              type="number"
              value={weightForm.maxMarks}
              onChange={(e) => setWeightForm({ ...weightForm, maxMarks: parseInt(e.target.value) || 0 })}
              min={0}
              required
            />
            <Input
              label={t('grades.order')}
              type="number"
              value={weightForm.order}
              onChange={(e) => setWeightForm({ ...weightForm, order: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsWeightModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveWeight}>{selectedWeight ? t('common.update') : t('common.create')}</Button>
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
