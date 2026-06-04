import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useFeeStore, TreeNode } from '../stores/feeStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { FeeCategory, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';
import clsx from 'clsx';

interface CategoryFormData {
  nameAr: string;
  nameEn: string;
  code: string;
  descriptionAr: string;
  descriptionEn: string;
  parentId: string | null;
  order: number;
}

const initialFormData: CategoryFormData = {
  nameAr: '',
  nameEn: '',
  code: '',
  descriptionAr: '',
  descriptionEn: '',
  parentId: null,
  order: 1,
};

export const FeeCategories: React.FC = () => {
  const { t } = useTranslation();
  const { 
    feeCategories,
    getFeeCategoriesByBranch,
    getRootCategories,
    getChildCategories,
    getCategoryTree,
    addFeeCategory,
    updateFeeCategory,
    deleteFeeCategory,
    getFeeGradeAssignmentsByCategory
  } = useFeeStore();
  const { currentBranch } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FeeCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [deleteError, setDeleteError] = useState('');

  const canCreate = hasPermission('fees', 'create');
  const canUpdate = hasPermission('fees', 'update');
  const canDelete = hasPermission('fees', 'delete');

  const branchCategories = currentBranch ? getFeeCategoriesByBranch(currentBranch.id) : [];
  const categoryTree = currentBranch ? getCategoryTree(currentBranch.id) : [];

  // Filter categories based on search
  const filteredCategories = branchCategories.filter((cat) => {
    const query = searchQuery.toLowerCase();
    return (
      cat.name.ar.toLowerCase().includes(query) ||
      cat.name.en.toLowerCase().includes(query) ||
      cat.code.toLowerCase().includes(query)
    );
  });

  const rootCategories = currentBranch ? getRootCategories(currentBranch.id) : [];

  const parentOptions = [
    { value: '', label: language === 'ar' ? 'فئة رئيسية (بدون أب)' : 'Root Category (No Parent)' },
    ...rootCategories.map((cat) => ({
      value: cat.id,
      label: getLocalizedValue(cat.name),
    })),
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleOpenModal = (category?: FeeCategory) => {
    if (category) {
      setSelectedCategory(category);
      setFormData({
        nameAr: category.name.ar,
        nameEn: category.name.en,
        code: category.code,
        descriptionAr: category.description.ar,
        descriptionEn: category.description.en,
        parentId: category.parentId,
        order: category.order,
      });
    } else {
      setSelectedCategory(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentBranch) {
      showToast('error', language === 'ar' ? 'يرجى اختيار الفرع' : 'Please select a branch');
      return;
    }

    const name: LocalizedText = {
      ar: sanitizeInput(formData.nameAr),
      en: sanitizeInput(formData.nameEn),
    };

    const description: LocalizedText = {
      ar: sanitizeInput(formData.descriptionAr),
      en: sanitizeInput(formData.descriptionEn),
    };

    // Calculate level based on parent
    let level = 0;
    if (formData.parentId) {
      const parent = feeCategories.find((c) => c.id === formData.parentId);
      if (parent) {
        level = parent.level + 1;
      }
    }

    if (selectedCategory) {
      updateFeeCategory(selectedCategory.id, {
        name,
        code: sanitizeInput(formData.code),
        description,
        parentId: formData.parentId,
        level,
        order: formData.order,
      });
      showToast('success', t('fees.categoryUpdated'));
    } else {
      addFeeCategory({
        name,
        code: sanitizeInput(formData.code),
        description,
        parentId: formData.parentId,
        level,
        order: formData.order,
        branchId: currentBranch.id,
        isActive: true,
      });
      showToast('success', t('fees.categoryCreated'));
    }

    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedCategory) {
      const success = deleteFeeCategory(selectedCategory.id);
      if (success) {
        showToast('success', t('fees.categoryDeleted'));
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      } else {
        setDeleteError(t('fees.cannotDeleteCategory'));
      }
    }
  };

  const getCategoryIcon = (category: FeeCategory) => {
    const hasChildren = getChildCategories(category.id).length > 0;
    const isExpanded = expandedCategories.includes(category.id);
    
    if (hasChildren) {
      return isExpanded ? (
        <FolderOpen className="w-5 h-5 text-yellow-500" />
      ) : (
        <Folder className="w-5 h-5 text-yellow-500" />
      );
    }
    return <FileText className="w-5 h-5 text-blue-500" />;
  };

  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const category = node.category;
    const isExpanded = expandedCategories.includes(category.id);
    const hasChildren = node.children.length > 0;
    const assignments = getFeeGradeAssignmentsByCategory(category.id);

    return (
      <div key={category.id}>
        <div
          className={clsx(
            'flex items-center justify-between p-3 rounded-lg border transition-colors',
            depth === 0 ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700/50',
            'hover:bg-blue-50 dark:hover:bg-blue-900/10'
          )}
          style={{ 
            marginInlineStart: `${depth * 24}px`
          }}
        >
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => hasChildren && toggleCategory(category.id)}
              className={clsx(
                'p-1 rounded transition-colors',
                hasChildren ? 'hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' : 'cursor-default opacity-0'
              )}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {getCategoryIcon(category)}

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {getLocalizedValue(category.name)}
                </span>
                <Badge variant="default" size="sm">{category.code}</Badge>
                {category.isActive ? (
                  <Badge variant="success" size="sm">{t('common.active')}</Badge>
                ) : (
                  <Badge variant="danger" size="sm">{t('common.inactive')}</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {getLocalizedValue(category.description)}
              </p>
              {assignments.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {assignments.length} {language === 'ar' ? 'تعيين للصفوف' : 'grade assignments'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {canUpdate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenModal(category)}
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
                  setSelectedCategory(category);
                  setDeleteError('');
                  setIsDeleteModalOpen(true);
                }}
                title={t('common.delete')}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="mt-1 space-y-1">
            {node.children.map((childNode) => renderTreeNode(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('fees.feeTree')}
          subtitle={`${branchCategories.length} ${language === 'ar' ? 'فئة' : 'categories'}`}
          action={
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('tree')}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'tree'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {language === 'ar' ? 'شجرة' : 'Tree'}
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={clsx(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  {language === 'ar' ? 'قائمة' : 'List'}
                </button>
              </div>
              {canCreate && (
                <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
                  {t('fees.addCategory')}
                </Button>
              )}
            </div>
          }
        />

        {/* Search */}
        <div className="mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>

        {/* Tree View */}
        {viewMode === 'tree' ? (
          <div className="space-y-2">
            {categoryTree.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('common.noData')}</p>
                {canCreate && (
                  <Button 
                    className="mt-4" 
                    onClick={() => handleOpenModal()}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    {t('fees.addCategory')}
                  </Button>
                )}
              </div>
            ) : (
              categoryTree.map((node) => renderTreeNode(node))
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filteredCategories.length === 0 ? (
              <div className="text-center py-12">
                <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('common.noData')}</p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    {category.parentId ? (
                      <FileText className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Folder className="w-5 h-5 text-yellow-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getLocalizedValue(category.name)}
                        </span>
                        <Badge variant="default" size="sm">{category.code}</Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {getLocalizedValue(category.description)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <Button variant="ghost" size="sm" onClick={() => handleOpenModal(category)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(category);
                          setDeleteError('');
                          setIsDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedCategory ? t('fees.editCategory') : t('fees.addCategory')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('fees.parentCategory')}
            value={formData.parentId || ''}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
            options={parentOptions}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('fees.categoryNameAr')}
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              required
              dir="rtl"
            />
            <Input
              label={t('fees.categoryNameEn')}
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('fees.categoryCode')}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
              placeholder="TUITION, BOOKS, etc."
            />
            <Input
              label={t('grades.order')}
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
              min={1}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('common.description')} (${t('common.arabic')})`}
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              dir="rtl"
            />
            <Input
              label={`${t('common.description')} (${t('common.english')})`}
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              dir="ltr"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {selectedCategory ? t('common.update') : t('common.create')}
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
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          {t('fees.deleteCategoryConfirm')}
        </p>
        
        {deleteError && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {deleteError}
          </div>
        )}

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
