import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Layers, 
  GraduationCap, 
  Users, 
  CheckCircle, 
  Plus, 
  Pencil, 
  Trash2, 
  ChevronRight,
  ChevronDown,
  Building2
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { EducationLevel, EnhancedGrade, EnhancedSection, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';
import clsx from 'clsx';

type WizardStep = 1 | 2 | 3 | 4;

export const AcademicStructure: React.FC = () => {
  const { t } = useTranslation();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { 
    sections,
    getEducationLevelsByBranch,
    getGradesByEducationLevel,
    getSectionsByGrade,
    addEducationLevel,
    updateEducationLevel,
    deleteEducationLevel,
    addEnhancedGrade,
    updateEnhancedGrade,
    deleteEnhancedGrade,
    addSection,
    updateSection,
    deleteSection,
    getGradesByBranch
  } = useAcademicStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [expandedLevels, setExpandedLevels] = useState<string[]>([]);
  const [expandedGrades, setExpandedGrades] = useState<string[]>([]);

  // Modal states
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'level' | 'grade' | 'section'; id: string } | null>(null);

  // Form states
  const [selectedLevel, setSelectedLevel] = useState<EducationLevel | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<EnhancedGrade | null>(null);
  const [selectedSection, setSelectedSection] = useState<EnhancedSection | null>(null);
  const [parentLevelId, setParentLevelId] = useState<string>('');
  const [parentGradeId, setParentGradeId] = useState<string>('');

  const [levelForm, setLevelForm] = useState({ nameAr: '', nameEn: '', code: '', descriptionAr: '', descriptionEn: '', order: 1 });
  const [gradeForm, setGradeForm] = useState({ nameAr: '', nameEn: '', code: '', order: 1, nextGradeId: '' });
  const [sectionForm, setSectionForm] = useState({ nameAr: '', nameEn: '', code: '', capacity: 30 });

  const canEdit = hasPermission('grades', 'update');

  const branchLevels = currentBranch ? getEducationLevelsByBranch(currentBranch.id) : [];
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];

  const steps = [
    { number: 1, title: t('academicStructure.step1'), icon: <Layers className="w-5 h-5" /> },
    { number: 2, title: t('academicStructure.step2'), icon: <GraduationCap className="w-5 h-5" /> },
    { number: 3, title: t('academicStructure.step3'), icon: <Users className="w-5 h-5" /> },
    { number: 4, title: t('academicStructure.step4'), icon: <CheckCircle className="w-5 h-5" /> },
  ];

  const toggleLevel = (levelId: string) => {
    setExpandedLevels(prev => 
      prev.includes(levelId) ? prev.filter(id => id !== levelId) : [...prev, levelId]
    );
  };

  const toggleGrade = (gradeId: string) => {
    setExpandedGrades(prev =>
      prev.includes(gradeId) ? prev.filter(id => id !== gradeId) : [...prev, gradeId]
    );
  };

  // Level handlers
  const handleOpenLevelModal = (level?: EducationLevel) => {
    if (level) {
      setSelectedLevel(level);
      setLevelForm({
        nameAr: level.name.ar,
        nameEn: level.name.en,
        code: level.code,
        descriptionAr: level.description.ar,
        descriptionEn: level.description.en,
        order: level.order,
      });
    } else {
      setSelectedLevel(null);
      setLevelForm({ nameAr: '', nameEn: '', code: '', descriptionAr: '', descriptionEn: '', order: branchLevels.length + 1 });
    }
    setIsLevelModalOpen(true);
  };

  const handleSaveLevel = () => {
    if (!currentBranch) return;

    const name: LocalizedText = { ar: sanitizeInput(levelForm.nameAr), en: sanitizeInput(levelForm.nameEn) };
    const description: LocalizedText = { ar: sanitizeInput(levelForm.descriptionAr), en: sanitizeInput(levelForm.descriptionEn) };

    if (selectedLevel) {
      updateEducationLevel(selectedLevel.id, { name, code: sanitizeInput(levelForm.code), description, order: levelForm.order });
      showToast('success', t('educationLevels.levelUpdated'));
    } else {
      addEducationLevel({ name, code: sanitizeInput(levelForm.code), description, order: levelForm.order, branchId: currentBranch.id, isActive: true });
      showToast('success', t('educationLevels.levelCreated'));
    }
    setIsLevelModalOpen(false);
  };

  // Grade handlers
  const handleOpenGradeModal = (grade?: EnhancedGrade, levelId?: string) => {
    if (grade) {
      setSelectedGrade(grade);
      setParentLevelId(grade.educationLevelId);
      setGradeForm({
        nameAr: grade.name.ar,
        nameEn: grade.name.en,
        code: grade.code,
        order: grade.order,
        nextGradeId: grade.nextGradeId || '',
      });
    } else {
      setSelectedGrade(null);
      setParentLevelId(levelId || '');
      const levelGrades = levelId ? getGradesByEducationLevel(levelId) : [];
      setGradeForm({ nameAr: '', nameEn: '', code: '', order: levelGrades.length + 1, nextGradeId: '' });
    }
    setIsGradeModalOpen(true);
  };

  const handleSaveGrade = () => {
    if (!currentBranch || !parentLevelId) return;

    const name: LocalizedText = { ar: sanitizeInput(gradeForm.nameAr), en: sanitizeInput(gradeForm.nameEn) };

    if (selectedGrade) {
      updateEnhancedGrade(selectedGrade.id, { 
        name, 
        code: sanitizeInput(gradeForm.code), 
        order: gradeForm.order, 
        nextGradeId: gradeForm.nextGradeId || null,
        educationLevelId: parentLevelId 
      });
      showToast('success', t('grades.gradeUpdated'));
    } else {
      addEnhancedGrade({ 
        name, 
        code: sanitizeInput(gradeForm.code), 
        order: gradeForm.order, 
        nextGradeId: gradeForm.nextGradeId || null,
        educationLevelId: parentLevelId, 
        branchId: currentBranch.id, 
        isActive: true 
      });
      showToast('success', t('grades.gradeCreated'));
    }
    setIsGradeModalOpen(false);
  };

  // Section handlers
  const handleOpenSectionModal = (section?: EnhancedSection, gradeId?: string) => {
    if (section) {
      setSelectedSection(section);
      setParentGradeId(section.gradeId);
      setSectionForm({
        nameAr: section.name.ar,
        nameEn: section.name.en,
        code: section.code,
        capacity: section.capacity,
      });
    } else {
      setSelectedSection(null);
      setParentGradeId(gradeId || '');
      setSectionForm({ nameAr: '', nameEn: '', code: '', capacity: 30 });
    }
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = () => {
    if (!currentBranch || !currentAcademicYear || !parentGradeId) return;

    const name: LocalizedText = { ar: sanitizeInput(sectionForm.nameAr), en: sanitizeInput(sectionForm.nameEn) };

    if (selectedSection) {
      updateSection(selectedSection.id, { name, code: sanitizeInput(sectionForm.code), capacity: sectionForm.capacity });
      showToast('success', t('sections.sectionUpdated'));
    } else {
      addSection({ 
        name, 
        code: sanitizeInput(sectionForm.code), 
        capacity: sectionForm.capacity, 
        gradeId: parentGradeId,
        academicYearId: currentAcademicYear.id,
        branchId: currentBranch.id,
        isActive: true 
      });
      showToast('success', t('sections.sectionCreated'));
    }
    setIsSectionModalOpen(false);
  };

  // Delete handler
  const handleDelete = () => {
    if (!deleteTarget) return;

    switch (deleteTarget.type) {
      case 'level':
        deleteEducationLevel(deleteTarget.id);
        showToast('success', t('educationLevels.levelDeleted'));
        break;
      case 'grade':
        deleteEnhancedGrade(deleteTarget.id);
        showToast('success', t('grades.gradeDeleted'));
        break;
      case 'section':
        deleteSection(deleteTarget.id);
        showToast('success', t('sections.sectionDeleted'));
        break;
    }
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const levelOptions = branchLevels.map(l => ({ value: l.id, label: getLocalizedValue(l.name) }));
  const gradeOptions = branchGrades.filter(g => !selectedGrade || g.id !== selectedGrade.id).map(g => ({ value: g.id, label: getLocalizedValue(g.name) }));

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('educationLevels.title')}</h3>
        {canEdit && (
          <Button onClick={() => handleOpenLevelModal()} leftIcon={<Plus className="w-4 h-4" />} size="sm">
            {t('educationLevels.addLevel')}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {branchLevels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Layers className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>{t('common.noData')}</p>
          </div>
        ) : (
          branchLevels.map((level) => (
            <div key={level.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{getLocalizedValue(level.name)}</p>
                    <p className="text-sm text-gray-500">{level.code} • {getLocalizedValue(level.description)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{language === 'ar' ? `الترتيب: ${level.order}` : `Order: ${level.order}`}</Badge>
                  {canEdit && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleOpenLevelModal(level)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'level', id: level.id }); setIsDeleteModalOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('grades.title')}</h3>
      </div>

      <div className="space-y-3">
        {branchLevels.map((level) => {
          const levelGrades = getGradesByEducationLevel(level.id);
          const isExpanded = expandedLevels.includes(level.id);

          return (
            <div key={level.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                onClick={() => toggleLevel(level.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  <Layers className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{getLocalizedValue(level.name)}</span>
                  <Badge variant="info">{levelGrades.length} {language === 'ar' ? 'صفوف' : 'grades'}</Badge>
                </div>
                {canEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); handleOpenGradeModal(undefined, level.id); }}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {t('grades.addGrade')}
                  </Button>
                )}
              </div>

              {isExpanded && (
                <div className="p-4 space-y-2 bg-white dark:bg-gray-900">
                  {levelGrades.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">{t('common.noData')}</p>
                  ) : (
                    levelGrades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <GraduationCap className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium">{getLocalizedValue(grade.name)}</p>
                            <p className="text-sm text-gray-500">{grade.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{language === 'ar' ? `الترتيب: ${grade.order}` : `Order: ${grade.order}`}</Badge>
                          {canEdit && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleOpenGradeModal(grade)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'grade', id: grade.id }); setIsDeleteModalOpen(true); }}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('sections.title')}</h3>
      </div>

      {!currentAcademicYear ? (
        <div className="text-center py-8 text-gray-500">
          <p>{language === 'ar' ? 'يرجى اختيار السنة الدراسية أولاً' : 'Please select an academic year first'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {branchGrades.map((grade) => {
            const gradeSections = currentAcademicYear ? getSectionsByGrade(grade.id, currentAcademicYear.id) : [];
            const isExpanded = expandedGrades.includes(grade.id);

            return (
              <div key={grade.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div 
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                  onClick={() => toggleGrade(grade.id)}
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    <GraduationCap className="w-5 h-5 text-green-600" />
                    <span className="font-medium">{getLocalizedValue(grade.name)}</span>
                    <Badge variant="info">{gradeSections.length} {language === 'ar' ? 'فصول' : 'sections'}</Badge>
                  </div>
                  {canEdit && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); handleOpenSectionModal(undefined, grade.id); }}
                      leftIcon={<Plus className="w-4 h-4" />}
                    >
                      {t('sections.addSection')}
                    </Button>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-2 bg-white dark:bg-gray-900">
                    {gradeSections.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">{t('common.noData')}</p>
                    ) : (
                      gradeSections.map((section) => (
                        <div key={section.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="font-medium">{getLocalizedValue(section.name)}</p>
                              <p className="text-sm text-gray-500">{section.code} • {language === 'ar' ? `السعة: ${section.capacity}` : `Capacity: ${section.capacity}`}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {canEdit && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleOpenSectionModal(section)}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'section', id: section.id }); setIsDeleteModalOpen(true); }}>
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{t('academicStructure.step4')}</h3>
        <p className="text-gray-500">{language === 'ar' ? 'مراجعة الهيكل الأكاديمي المكتمل' : 'Review your completed academic structure'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{branchLevels.length}</p>
              <p className="text-sm text-gray-500">{t('educationLevels.title')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{branchGrades.length}</p>
              <p className="text-sm text-gray-500">{t('grades.title')}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{sections.filter(s => s.branchId === currentBranch?.id).length}</p>
              <p className="text-sm text-gray-500">{t('sections.title')}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {branchLevels.map((level) => (
          <Card key={level.id} padding="sm">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="font-semibold">{getLocalizedValue(level.name)}</span>
            </div>
            <div className="ps-6 space-y-2">
              {getGradesByEducationLevel(level.id).map((grade) => (
                <div key={grade.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                    <span>{getLocalizedValue(grade.name)}</span>
                  </div>
                  <Badge variant="default">
                    {currentAcademicYear ? getSectionsByGrade(grade.id, currentAcademicYear.id).length : 0} {language === 'ar' ? 'فصول' : 'sections'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('academicStructure.title')}</h1>
              <p className="text-sm text-gray-500">{currentBranch ? getLocalizedValue(currentBranch.name) : ''}</p>
            </div>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <button
                onClick={() => setCurrentStep(step.number as WizardStep)}
                className={clsx(
                  'flex flex-col items-center gap-2 p-3 rounded-lg transition-colors',
                  currentStep === step.number
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
              >
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                    currentStep === step.number
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.number
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  )}
                >
                  {currentStep > step.number ? <CheckCircle className="w-5 h-5" /> : step.icon}
                </div>
                <span className={clsx(
                  'text-sm font-medium',
                  currentStep === step.number ? 'text-blue-600' : 'text-gray-500'
                )}>
                  {step.title}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={clsx(
                  'flex-1 h-1 mx-2 rounded',
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1) as WizardStep)}
            disabled={currentStep === 1}
          >
            {t('common.previous')}
          </Button>
          <Button
            onClick={() => setCurrentStep(prev => Math.min(4, prev + 1) as WizardStep)}
            disabled={currentStep === 4}
          >
            {t('common.next')}
          </Button>
        </div>
      </Card>

      {/* Level Modal */}
      <Modal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        title={selectedLevel ? t('educationLevels.editLevel') : t('educationLevels.addLevel')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('educationLevels.levelNameAr')} value={levelForm.nameAr} onChange={(e) => setLevelForm({ ...levelForm, nameAr: e.target.value })} dir="rtl" required />
            <Input label={t('educationLevels.levelNameEn')} value={levelForm.nameEn} onChange={(e) => setLevelForm({ ...levelForm, nameEn: e.target.value })} dir="ltr" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('educationLevels.levelCode')} value={levelForm.code} onChange={(e) => setLevelForm({ ...levelForm, code: e.target.value.toUpperCase() })} required />
            <Input label={t('grades.order')} type="number" value={levelForm.order} onChange={(e) => setLevelForm({ ...levelForm, order: parseInt(e.target.value) || 1 })} min={1} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={`${t('educationLevels.description')} (${t('common.arabic')})`} value={levelForm.descriptionAr} onChange={(e) => setLevelForm({ ...levelForm, descriptionAr: e.target.value })} dir="rtl" />
            <Input label={`${t('educationLevels.description')} (${t('common.english')})`} value={levelForm.descriptionEn} onChange={(e) => setLevelForm({ ...levelForm, descriptionEn: e.target.value })} dir="ltr" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsLevelModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveLevel}>{selectedLevel ? t('common.update') : t('common.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Grade Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title={selectedGrade ? t('grades.editGrade') : t('grades.addGrade')}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label={t('grades.educationLevel')}
            value={parentLevelId}
            onChange={(e) => setParentLevelId(e.target.value)}
            options={levelOptions}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('grades.gradeNameAr')} value={gradeForm.nameAr} onChange={(e) => setGradeForm({ ...gradeForm, nameAr: e.target.value })} dir="rtl" required />
            <Input label={t('grades.gradeNameEn')} value={gradeForm.nameEn} onChange={(e) => setGradeForm({ ...gradeForm, nameEn: e.target.value })} dir="ltr" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('grades.gradeCode')} value={gradeForm.code} onChange={(e) => setGradeForm({ ...gradeForm, code: e.target.value.toUpperCase() })} required />
            <Input label={t('grades.order')} type="number" value={gradeForm.order} onChange={(e) => setGradeForm({ ...gradeForm, order: parseInt(e.target.value) || 1 })} min={1} required />
          </div>
          <Select
            label={t('grades.nextGrade')}
            value={gradeForm.nextGradeId}
            onChange={(e) => setGradeForm({ ...gradeForm, nextGradeId: e.target.value })}
            options={[{ value: '', label: language === 'ar' ? 'لا يوجد (آخر صف)' : 'None (Final Grade)' }, ...gradeOptions]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsGradeModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveGrade}>{selectedGrade ? t('common.update') : t('common.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Section Modal */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title={selectedSection ? t('sections.editSection') : t('sections.addSection')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('sections.sectionNameAr')} value={sectionForm.nameAr} onChange={(e) => setSectionForm({ ...sectionForm, nameAr: e.target.value })} dir="rtl" required />
            <Input label={t('sections.sectionNameEn')} value={sectionForm.nameEn} onChange={(e) => setSectionForm({ ...sectionForm, nameEn: e.target.value })} dir="ltr" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('sections.sectionCode')} value={sectionForm.code} onChange={(e) => setSectionForm({ ...sectionForm, code: e.target.value.toUpperCase() })} required />
            <Input label={t('sections.capacity')} type="number" value={sectionForm.capacity} onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) || 30 })} min={1} required />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsSectionModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveSection}>{selectedSection ? t('common.update') : t('common.create')}</Button>
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
