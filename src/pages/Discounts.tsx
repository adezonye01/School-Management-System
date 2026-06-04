import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Pencil, Trash2, Gift, Users, Award,
  ChevronDown, ChevronRight, Star, 
  Clock, Shield, Zap, Heart, Settings
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';

import { useFeeStore } from '../stores/feeStore';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { DiscountRule, DiscountType, DiscountApplyType, LocalizedText, SiblingDiscountConfig } from '../types/database';
import { sanitizeInput } from '../utils/security';
import clsx from 'clsx';

interface RuleForm {
  nameAr: string;
  nameEn: string;
  code: string;
  discountType: DiscountType;
  descriptionAr: string;
  descriptionEn: string;
  applyType: DiscountApplyType;
  value: number;
  maxDiscountAmount: number;
  priority: number;
  isStackable: boolean;
  applicableFeeCategories: string[];
  applicableGrades: string[];
  startDate: string;
  endDate: string;
  isAutomatic: boolean;
}

const initialForm: RuleForm = {
  nameAr: '',
  nameEn: '',
  code: '',
  discountType: 'custom',
  descriptionAr: '',
  descriptionEn: '',
  applyType: 'percentage',
  value: 0,
  maxDiscountAmount: 0,
  priority: 1,
  isStackable: false,
  applicableFeeCategories: [],
  applicableGrades: [],
  startDate: '',
  endDate: '',
  isAutomatic: false,
};

export const Discounts: React.FC = () => {
  const { t } = useTranslation();
  const {
    getDiscountRulesByBranch,
    addDiscountRule,
    updateDiscountRule,
    deleteDiscountRule,
    getSiblingDiscountConfigs,
    updateSiblingDiscountConfig,
    addSiblingDiscountConfig,
    getFeeCategoriesByBranch,
    getFeeCategoryById,
  } = useFeeStore();
  const { getGradesByBranch, getEnhancedGradeById } = useAcademicStore();
  const { currentBranch } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [expandedRules, setExpandedRules] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSiblingConfigOpen, setIsSiblingConfigOpen] = useState(false);
  const [selected, setSelected] = useState<DiscountRule | null>(null);
  const [form, setForm] = useState<RuleForm>(initialForm);
  const [siblingConfigs, setSiblingConfigs] = useState<SiblingDiscountConfig[]>([]);
  const [, setSelectedRuleForSibling] = useState<string>('');

  const canCreate = hasPermission('fees', 'create');
  const canUpdate = hasPermission('fees', 'update');
  const canDelete = hasPermission('fees', 'delete');

  const branchRules = currentBranch ? getDiscountRulesByBranch(currentBranch.id) : [];
  const branchCategories = currentBranch ? getFeeCategoriesByBranch(currentBranch.id) : [];
  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];

  const discountTypeOptions: { value: DiscountType; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'sibling', label: t('discounts.siblingDiscount'), icon: <Users className="w-4 h-4" />, color: 'bg-blue-500' },
    { value: 'staff', label: t('discounts.staffDiscount'), icon: <Shield className="w-4 h-4" />, color: 'bg-purple-500' },
    { value: 'merit', label: t('discounts.meritDiscount'), icon: <Award className="w-4 h-4" />, color: 'bg-yellow-500' },
    { value: 'financial_aid', label: t('discounts.financialAid'), icon: <Heart className="w-4 h-4" />, color: 'bg-red-500' },
    { value: 'early_payment', label: t('discounts.earlyPaymentDiscount'), icon: <Zap className="w-4 h-4" />, color: 'bg-green-500' },
    { value: 'loyalty', label: t('discounts.loyaltyDiscount'), icon: <Star className="w-4 h-4" />, color: 'bg-orange-500' },
    { value: 'custom', label: t('discounts.customDiscount'), icon: <Gift className="w-4 h-4" />, color: 'bg-gray-500' },
  ];

  const getTypeInfo = (type: DiscountType) => discountTypeOptions.find((o) => o.value === type)!;

  const toggleRule = (id: string) => {
    setExpandedRules((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const openModal = (rule?: DiscountRule) => {
    if (rule) {
      setSelected(rule);
      setForm({
        nameAr: rule.name.ar,
        nameEn: rule.name.en,
        code: rule.code,
        discountType: rule.discountType,
        descriptionAr: rule.description.ar,
        descriptionEn: rule.description.en,
        applyType: rule.applyType,
        value: rule.value,
        maxDiscountAmount: rule.maxDiscountAmount || 0,
        priority: rule.priority,
        isStackable: rule.isStackable,
        applicableFeeCategories: rule.applicableFeeCategories,
        applicableGrades: rule.applicableGrades,
        startDate: rule.startDate || '',
        endDate: rule.endDate || '',
        isAutomatic: rule.isAutomatic,
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

    const data = {
      name,
      code: sanitizeInput(form.code),
      discountType: form.discountType,
      description,
      applyType: form.applyType,
      value: form.value,
      maxDiscountAmount: form.maxDiscountAmount || undefined,
      priority: form.priority,
      isStackable: form.isStackable,
      applicableFeeCategories: form.applicableFeeCategories,
      applicableGrades: form.applicableGrades,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isAutomatic: form.isAutomatic,
    };

    if (selected) {
      updateDiscountRule(selected.id, data);
      showToast('success', t('discounts.discountUpdated'));
    } else {
      const newRule = addDiscountRule({
        ...data,
        branchId: currentBranch.id,
        isActive: true,
      });
      // If sibling type, auto-create default configs
      if (form.discountType === 'sibling') {
        for (let i = 1; i <= 5; i++) {
          const pct = i === 1 ? 0 : i === 2 ? 10 : i === 3 ? 20 : i === 4 ? 30 : 50;
          addSiblingDiscountConfig({ discountRuleId: newRule.id, siblingOrder: i, discountPercentage: pct, branchId: currentBranch.id });
        }
      }
      showToast('success', t('discounts.discountCreated'));
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (selected) {
      deleteDiscountRule(selected.id);
      showToast('success', t('discounts.discountDeleted'));
      setIsDeleteOpen(false);
      setSelected(null);
    }
  };

  // Sibling Config handlers
  const openSiblingConfig = (ruleId: string) => {
    setSelectedRuleForSibling(ruleId);
    const configs = getSiblingDiscountConfigs(ruleId);
    setSiblingConfigs([...configs]);
    setIsSiblingConfigOpen(true);
  };

  const handleSiblingConfigChange = (index: number, value: number) => {
    const updated = [...siblingConfigs];
    updated[index] = { ...updated[index], discountPercentage: value };
    setSiblingConfigs(updated);
  };

  const saveSiblingConfigs = () => {
    siblingConfigs.forEach((config) => {
      updateSiblingDiscountConfig(config.id, { discountPercentage: config.discountPercentage });
    });
    showToast('success', t('common.success'));
    setIsSiblingConfigOpen(false);
  };

  const toggleFeeCategory = (catId: string) => {
    setForm((prev) => ({
      ...prev,
      applicableFeeCategories: prev.applicableFeeCategories.includes(catId)
        ? prev.applicableFeeCategories.filter((id) => id !== catId)
        : [...prev.applicableFeeCategories, catId],
    }));
  };

  const toggleGrade = (gradeId: string) => {
    setForm((prev) => ({
      ...prev,
      applicableGrades: prev.applicableGrades.includes(gradeId)
        ? prev.applicableGrades.filter((id) => id !== gradeId)
        : [...prev.applicableGrades, gradeId],
    }));
  };

  // Calculate example discount
  const calcExample = (rule: DiscountRule, amount: number = 20000): { discount: number; final: number } => {
    let discount = rule.applyType === 'percentage' ? amount * (rule.value / 100) : rule.value;
    if (rule.maxDiscountAmount && discount > rule.maxDiscountAmount) discount = rule.maxDiscountAmount;
    return { discount: Math.round(discount), final: Math.round(amount - discount) };
  };

  const getSiblingLabel = (order: number): string => {
    const labels: Record<number, { ar: string; en: string }> = {
      1: { ar: 'الطفل الأول', en: '1st Child' },
      2: { ar: 'الطفل الثاني', en: '2nd Child' },
      3: { ar: 'الطفل الثالث', en: '3rd Child' },
      4: { ar: 'الطفل الرابع', en: '4th Child' },
      5: { ar: 'الطفل الخامس+', en: '5th Child+' },
    };
    const l = labels[order] || { ar: `الطفل ${order}`, en: `Child #${order}` };
    return language === 'ar' ? l.ar : l.en;
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {discountTypeOptions.slice(0, 4).map((type) => {
          const count = branchRules.filter((r) => r.discountType === type.value).length;
          return (
            <Card key={type.value} padding="sm">
              <div className="flex items-center gap-3">
                <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center text-white', type.color)}>
                  {type.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-xs text-gray-500">{type.label}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader
          title={t('discounts.title')}
          subtitle={`${branchRules.length} ${language === 'ar' ? 'قاعدة خصم' : 'discount rules'}`}
          action={canCreate && (
            <Button onClick={() => openModal()} leftIcon={<Plus className="w-4 h-4" />}>{t('discounts.addDiscount')}</Button>
          )}
        />

        {/* Rules List */}
        <div className="space-y-3">
          {branchRules.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('common.noData')}</p>
            </div>
          ) : (
            branchRules.map((rule) => {
              const isExpanded = expandedRules.includes(rule.id);
              const typeInfo = getTypeInfo(rule.discountType);
              const example = calcExample(rule);
              const siblingConfigs = rule.discountType === 'sibling' ? getSiblingDiscountConfigs(rule.id) : [];

              return (
                <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => toggleRule(rule.id)}
                  >
                    <div className="flex items-center gap-4">
                      <button className="text-gray-400">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </button>
                      <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-white', typeInfo.color)}>
                        {typeInfo.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{getLocalizedValue(rule.name)}</p>
                        <p className="text-sm text-gray-500">{getLocalizedValue(rule.description)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Badge variant="info">{typeInfo.label}</Badge>
                      <Badge variant={rule.applyType === 'percentage' ? 'warning' : 'success'}>
                        {rule.applyType === 'percentage' ? `${rule.value}%` : `${rule.value} SAR`}
                      </Badge>
                      {rule.isAutomatic && (
                        <Badge variant="success"><Zap className="w-3 h-3 inline me-1" />{language === 'ar' ? 'تلقائي' : 'Auto'}</Badge>
                      )}
                      {rule.isStackable && (
                        <Badge variant="default">{language === 'ar' ? 'قابل للجمع' : 'Stackable'}</Badge>
                      )}
                      {rule.discountType === 'sibling' && (
                        <Button variant="ghost" size="sm" onClick={() => openSiblingConfig(rule.id)} title={t('discounts.siblingConfig')}>
                          <Settings className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      {canUpdate && (
                        <Button variant="ghost" size="sm" onClick={() => openModal(rule)}><Pencil className="w-4 h-4" /></Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="sm" onClick={() => { setSelected(rule); setIsDeleteOpen(true); }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  {isExpanded && (
                    <div className="p-5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 space-y-4">
                      {/* Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">{t('discounts.discountValue')}</p>
                          <p className="text-xl font-bold text-blue-600">
                            {rule.applyType === 'percentage' ? `${rule.value}%` : `${rule.value.toLocaleString()} SAR`}
                          </p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">{t('discounts.priority')}</p>
                          <p className="text-xl font-bold text-purple-600">{rule.priority}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'مثال على 20,000' : 'Example on 20,000'}</p>
                          <p className="text-xl font-bold text-green-600">-{example.discount.toLocaleString()}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-500 mb-1">{language === 'ar' ? 'المبلغ بعد الخصم' : 'After Discount'}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">{example.final.toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Applicable Categories */}
                      {rule.applicableFeeCategories.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {language === 'ar' ? 'الفئات المطبقة:' : 'Applicable Categories:'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rule.applicableFeeCategories.map((catId) => {
                              const cat = getFeeCategoryById(catId);
                              return cat ? (
                                <Badge key={catId} variant="info">{getLocalizedValue(cat.name)}</Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Applicable Grades */}
                      {rule.applicableGrades.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {language === 'ar' ? 'الصفوف المطبقة:' : 'Applicable Grades:'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rule.applicableGrades.map((gId) => {
                              const g = getEnhancedGradeById(gId);
                              return g ? (
                                <Badge key={gId} variant="default">{getLocalizedValue(g.name)}</Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {/* Date Range */}
                      {(rule.startDate || rule.endDate) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {rule.startDate && <span>{new Date(rule.startDate).toLocaleDateString()}</span>}
                          <span>→</span>
                          {rule.endDate && <span>{new Date(rule.endDate).toLocaleDateString()}</span>}
                        </div>
                      )}

                      {/* Sibling Config Display */}
                      {rule.discountType === 'sibling' && siblingConfigs.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            {t('discounts.siblingConfig')}:
                          </p>
                          <div className="flex gap-3 overflow-x-auto pb-2">
                            {siblingConfigs.map((config) => (
                              <div key={config.id} className="flex flex-col items-center min-w-[100px] p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <div className={clsx(
                                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2',
                                  config.discountPercentage > 0
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                )}>
                                  {config.discountPercentage}%
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 text-center">{getSiblingLabel(config.siblingOrder)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Add/Edit Rule Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? t('discounts.editDiscount') : t('discounts.addDiscount')} size="full">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pe-2">
          {/* Discount Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('discounts.discountType')}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {discountTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, discountType: opt.value })}
                  className={clsx(
                    'flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-start',
                    form.discountType === opt.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  )}
                >
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0', opt.color)}>
                    {opt.icon}
                  </div>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={language === 'ar' ? 'اسم الخصم (عربي)' : 'Name (Arabic)'} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} dir="rtl" required />
            <Input label={language === 'ar' ? 'اسم الخصم (إنجليزي)' : 'Name (English)'} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} dir="ltr" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'} value={form.descriptionAr} onChange={(e) => setForm({ ...form, descriptionAr: e.target.value })} dir="rtl" />
            <Input label={language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} dir="ltr" />
          </div>

          <Input label={t('discounts.discountCode')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required />

          {/* Value Settings */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select
              label={t('discounts.applyType')}
              value={form.applyType}
              onChange={(e) => setForm({ ...form, applyType: e.target.value as DiscountApplyType })}
              options={[
                { value: 'percentage', label: `${t('discounts.percentage')} (%)` },
                { value: 'fixed_amount', label: `${t('discounts.fixedAmount')} (SAR)` },
              ]}
            />
            <Input
              label={t('discounts.discountValue')}
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
              min={0}
              max={form.applyType === 'percentage' ? 100 : undefined}
              step={form.applyType === 'percentage' ? 0.5 : 1}
              required
            />
            <Input
              label={t('discounts.maxDiscountAmount')}
              type="number"
              value={form.maxDiscountAmount}
              onChange={(e) => setForm({ ...form, maxDiscountAmount: parseFloat(e.target.value) || 0 })}
              min={0}
              helperText={`SAR (0 = ${language === 'ar' ? 'بلا حد' : 'unlimited'})`}
            />
            <Input
              label={t('discounts.priority')}
              type="number"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
              min={1}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <Input label={language === 'ar' ? 'تاريخ البداية' : 'Start Date'} type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label={language === 'ar' ? 'تاريخ النهاية' : 'End Date'} type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>

          {/* Applicable Fee Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'ar' ? 'الفئات المطبقة (اتركها فارغة = جميع الفئات)' : 'Applicable Categories (empty = all)'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg max-h-32 overflow-y-auto">
              {branchCategories.filter((c) => c.parentId === null).map((cat) => (
                <Checkbox
                  key={cat.id}
                  checked={form.applicableFeeCategories.includes(cat.id)}
                  onChange={() => toggleFeeCategory(cat.id)}
                  label={getLocalizedValue(cat.name)}
                />
              ))}
            </div>
          </div>

          {/* Applicable Grades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {language === 'ar' ? 'الصفوف المطبقة (اتركها فارغة = جميع الصفوف)' : 'Applicable Grades (empty = all)'}
            </label>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-3 border border-gray-200 dark:border-gray-700 rounded-lg max-h-32 overflow-y-auto">
              {branchGrades.map((g) => (
                <Checkbox
                  key={g.id}
                  checked={form.applicableGrades.includes(g.id)}
                  onChange={() => toggleGrade(g.id)}
                  label={getLocalizedValue(g.name)}
                />
              ))}
            </div>
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-6">
            <Checkbox checked={form.isAutomatic} onChange={(checked) => setForm({ ...form, isAutomatic: checked })} label={t('discounts.isAutomatic')} />
            <Checkbox checked={form.isStackable} onChange={(checked) => setForm({ ...form, isStackable: checked })} label={t('discounts.isStackable')} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-800">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
            <Button type="submit">{selected ? t('common.update') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t('common.confirm')} size="sm">
        <p className="text-gray-600 dark:text-gray-300 mb-6">{language === 'ar' ? 'هل أنت متأكد من حذف هذا الخصم؟' : 'Delete this discount rule?'}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>

      {/* Sibling Config Modal */}
      <Modal isOpen={isSiblingConfigOpen} onClose={() => setIsSiblingConfigOpen(false)} title={`⚙️ ${t('discounts.siblingConfig')}`} size="lg">
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {language === 'ar'
                ? 'حدد نسبة الخصم لكل ترتيب من الإخوة. الطفل الأول عادة لا يحصل على خصم.'
                : 'Set the discount percentage for each sibling order. The first child usually gets no discount.'}
            </p>
          </div>

          <div className="space-y-3">
            {siblingConfigs.map((config, index) => (
              <div key={config.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className={clsx(
                  'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0',
                  config.siblingOrder === 1 ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                )}>
                  {config.siblingOrder}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{getSiblingLabel(config.siblingOrder)}</p>
                  <p className="text-xs text-gray-500">
                    {config.discountPercentage === 0
                      ? (language === 'ar' ? 'بدون خصم' : 'No discount')
                      : (language === 'ar' ? `خصم ${config.discountPercentage}%` : `${config.discountPercentage}% discount`)}
                  </p>
                </div>
                <div className="w-32">
                  <Input
                    type="number"
                    value={config.discountPercentage}
                    onChange={(e) => handleSiblingConfigChange(index, parseFloat(e.target.value) || 0)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <span className="text-lg font-bold text-gray-400">%</span>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm font-medium mb-3">{language === 'ar' ? 'معاينة (مثال: رسوم 20,000 ريال)' : 'Preview (Example: 20,000 SAR fees)'}</p>
            <div className="grid grid-cols-5 gap-2">
              {siblingConfigs.map((config) => {
                const fee = 20000;
                const discount = fee * (config.discountPercentage / 100);
                const final = fee - discount;
                return (
                  <div key={config.id} className="text-center p-2 bg-white dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500">{getSiblingLabel(config.siblingOrder)}</p>
                    {discount > 0 && <p className="text-xs text-red-500 line-through">{fee.toLocaleString()}</p>}
                    <p className="text-sm font-bold text-green-600">{final.toLocaleString()}</p>
                    {discount > 0 && <p className="text-[10px] text-gray-400">-{discount.toLocaleString()}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsSiblingConfigOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={saveSiblingConfigs}>{t('common.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
