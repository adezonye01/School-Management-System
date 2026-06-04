import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  FeeCategory,
  FeeGradeAssignment,
  InstallmentPlan,
  DiscountRule,
  SiblingDiscountConfig
} from '../types/database';
import {
  defaultFeeCategories,
  defaultFeeGradeAssignments,
  defaultInstallmentPlans,
  defaultDiscountRules,
  defaultSiblingDiscountConfigs
} from '../data/feeData';

interface FeeState {
  // Data
  feeCategories: FeeCategory[];
  feeGradeAssignments: FeeGradeAssignment[];
  installmentPlans: InstallmentPlan[];
  discountRules: DiscountRule[];
  siblingDiscountConfigs: SiblingDiscountConfig[];

  // Fee Category Actions
  addFeeCategory: (category: Omit<FeeCategory, 'id' | 'createdAt' | 'updatedAt'>) => FeeCategory;
  updateFeeCategory: (id: string, data: Partial<FeeCategory>) => void;
  deleteFeeCategory: (id: string) => boolean;
  getFeeCategoryById: (id: string) => FeeCategory | undefined;
  getFeeCategoriesByBranch: (branchId: string) => FeeCategory[];
  getRootCategories: (branchId: string) => FeeCategory[];
  getChildCategories: (parentId: string) => FeeCategory[];
  getCategoryTree: (branchId: string) => TreeNode[];

  // Fee Grade Assignment Actions
  addFeeGradeAssignment: (assignment: Omit<FeeGradeAssignment, 'id' | 'createdAt' | 'updatedAt'>) => FeeGradeAssignment;
  updateFeeGradeAssignment: (id: string, data: Partial<FeeGradeAssignment>) => void;
  deleteFeeGradeAssignment: (id: string) => void;
  getFeeGradeAssignmentsByGrade: (gradeId: string, academicYearId: string) => FeeGradeAssignment[];
  getFeeGradeAssignmentsByCategory: (categoryId: string) => FeeGradeAssignment[];
  getTotalFeeAmountForGrade: (gradeId: string, academicYearId: string) => number;

  // Installment Plan Actions
  addInstallmentPlan: (plan: Omit<InstallmentPlan, 'id' | 'createdAt' | 'updatedAt'>) => InstallmentPlan;
  updateInstallmentPlan: (id: string, data: Partial<InstallmentPlan>) => void;
  deleteInstallmentPlan: (id: string) => void;
  getInstallmentPlansByBranch: (branchId: string) => InstallmentPlan[];

  // Discount Rule Actions
  addDiscountRule: (rule: Omit<DiscountRule, 'id' | 'createdAt' | 'updatedAt'>) => DiscountRule;
  updateDiscountRule: (id: string, data: Partial<DiscountRule>) => void;
  deleteDiscountRule: (id: string) => void;
  getDiscountRulesByBranch: (branchId: string) => DiscountRule[];
  getApplicableDiscounts: (studentId: string, feeCategoryId?: string) => DiscountRule[];

  // Sibling Discount Config Actions
  addSiblingDiscountConfig: (config: Omit<SiblingDiscountConfig, 'id'>) => SiblingDiscountConfig;
  updateSiblingDiscountConfig: (id: string, data: Partial<SiblingDiscountConfig>) => void;
  deleteSiblingDiscountConfig: (id: string) => void;
  getSiblingDiscountConfigs: (discountRuleId: string) => SiblingDiscountConfig[];
  calculateSiblingDiscount: (siblingOrder: number, discountRuleId: string) => number;

  // Reset
  resetToDefaults: () => void;
}

// Helper type for tree structure
export interface TreeNode {
  category: FeeCategory;
  children: TreeNode[];
  level: number;
}

export const useFeeStore = create<FeeState>()(
  persist(
    (set, get) => ({
      feeCategories: defaultFeeCategories,
      feeGradeAssignments: defaultFeeGradeAssignments,
      installmentPlans: defaultInstallmentPlans,
      discountRules: defaultDiscountRules,
      siblingDiscountConfigs: defaultSiblingDiscountConfigs,

      // Fee Category Actions
      addFeeCategory: (categoryData) => {
        const newCategory: FeeCategory = {
          ...categoryData,
          id: `fee-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ feeCategories: [...state.feeCategories, newCategory] }));
        return newCategory;
      },

      updateFeeCategory: (id, data) => {
        set((state) => ({
          feeCategories: state.feeCategories.map((cat) =>
            cat.id === id
              ? { ...cat, ...data, updatedAt: new Date().toISOString() }
              : cat
          ),
        }));
      },

      deleteFeeCategory: (id) => {
        // Check if category has children
        const hasChildren = get().feeCategories.some((cat) => cat.parentId === id);
        if (hasChildren) return false;

        // Check if category has fee assignments
        const hasAssignments = get().feeGradeAssignments.some(
          (assign) => assign.feeCategoryId === id
        );
        if (hasAssignments) return false;

        set((state) => ({
          feeCategories: state.feeCategories.filter((cat) => cat.id !== id),
        }));
        return true;
      },

      getFeeCategoryById: (id) => get().feeCategories.find((cat) => cat.id === id),

      getFeeCategoriesByBranch: (branchId) =>
        get().feeCategories
          .filter((cat) => cat.branchId === branchId)
          .sort((a, b) => a.order - b.order),

      getRootCategories: (branchId) =>
        get().feeCategories
          .filter((cat) => cat.branchId === branchId && cat.parentId === null)
          .sort((a, b) => a.order - b.order),

      getChildCategories: (parentId) =>
        get().feeCategories
          .filter((cat) => cat.parentId === parentId)
          .sort((a, b) => a.order - b.order),

      getCategoryTree: (branchId) => {
        const buildTree = (parentId: string | null, level: number): TreeNode[] => {
          const categories = get().feeCategories.filter(
            (cat) => cat.branchId === branchId && cat.parentId === parentId
          );
          
          return categories.map((cat) => ({
            category: cat,
            children: buildTree(cat.id, level + 1),
            level,
          }));
        };

        return buildTree(null, 0);
      },

      // Fee Grade Assignment Actions
      addFeeGradeAssignment: (assignmentData) => {
        const newAssignment: FeeGradeAssignment = {
          ...assignmentData,
          id: `fga-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          feeGradeAssignments: [...state.feeGradeAssignments, newAssignment],
        }));
        return newAssignment;
      },

      updateFeeGradeAssignment: (id, data) => {
        set((state) => ({
          feeGradeAssignments: state.feeGradeAssignments.map((assign) =>
            assign.id === id
              ? { ...assign, ...data, updatedAt: new Date().toISOString() }
              : assign
          ),
        }));
      },

      deleteFeeGradeAssignment: (id) => {
        set((state) => ({
          feeGradeAssignments: state.feeGradeAssignments.filter(
            (assign) => assign.id !== id
          ),
        }));
      },

      getFeeGradeAssignmentsByGrade: (gradeId, academicYearId) =>
        get().feeGradeAssignments.filter(
          (assign) =>
            assign.gradeId === gradeId &&
            assign.academicYearId === academicYearId &&
            assign.isActive
        ),

      getFeeGradeAssignmentsByCategory: (categoryId) =>
        get().feeGradeAssignments.filter(
          (assign) => assign.feeCategoryId === categoryId
        ),

      getTotalFeeAmountForGrade: (gradeId, academicYearId) => {
        const assignments = get().getFeeGradeAssignmentsByGrade(gradeId, academicYearId);
        return assignments.reduce((total, assign) => total + assign.amount, 0);
      },

      // Installment Plan Actions
      addInstallmentPlan: (planData) => {
        const newPlan: InstallmentPlan = {
          ...planData,
          id: `plan-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ installmentPlans: [...state.installmentPlans, newPlan] }));
        return newPlan;
      },

      updateInstallmentPlan: (id, data) => {
        set((state) => ({
          installmentPlans: state.installmentPlans.map((plan) =>
            plan.id === id
              ? { ...plan, ...data, updatedAt: new Date().toISOString() }
              : plan
          ),
        }));
      },

      deleteInstallmentPlan: (id) => {
        set((state) => ({
          installmentPlans: state.installmentPlans.filter((plan) => plan.id !== id),
        }));
      },

      getInstallmentPlansByBranch: (branchId) =>
        get().installmentPlans.filter(
          (plan) => plan.branchId === branchId && plan.isActive
        ),

      // Discount Rule Actions
      addDiscountRule: (ruleData) => {
        const newRule: DiscountRule = {
          ...ruleData,
          id: `disc-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ discountRules: [...state.discountRules, newRule] }));
        return newRule;
      },

      updateDiscountRule: (id, data) => {
        set((state) => ({
          discountRules: state.discountRules.map((rule) =>
            rule.id === id
              ? { ...rule, ...data, updatedAt: new Date().toISOString() }
              : rule
          ),
        }));
      },

      deleteDiscountRule: (id) => {
        set((state) => ({
          discountRules: state.discountRules.filter((rule) => rule.id !== id),
          siblingDiscountConfigs: state.siblingDiscountConfigs.filter(
            (config) => config.discountRuleId !== id
          ),
        }));
      },

      getDiscountRulesByBranch: (branchId) =>
        get().discountRules.filter(
          (rule) => rule.branchId === branchId && rule.isActive
        ),

      getApplicableDiscounts: (_studentId, feeCategoryId) => {
        // This would check student siblings, staff status, etc.
        // For now, return all active discounts
        return get().discountRules.filter((rule) => {
          const isActive = rule.isActive;
          const inDateRange =
            (!rule.startDate || new Date() >= new Date(rule.startDate)) &&
            (!rule.endDate || new Date() <= new Date(rule.endDate));
          const applicableToCategory =
            rule.applicableFeeCategories.length === 0 ||
            (feeCategoryId && rule.applicableFeeCategories.includes(feeCategoryId));

          return isActive && inDateRange && applicableToCategory;
        });
      },

      // Sibling Discount Config Actions
      addSiblingDiscountConfig: (configData) => {
        const newConfig: SiblingDiscountConfig = {
          ...configData,
          id: `sdc-${uuidv4()}`,
        };
        set((state) => ({
          siblingDiscountConfigs: [...state.siblingDiscountConfigs, newConfig],
        }));
        return newConfig;
      },

      updateSiblingDiscountConfig: (id, data) => {
        set((state) => ({
          siblingDiscountConfigs: state.siblingDiscountConfigs.map((config) =>
            config.id === id ? { ...config, ...data } : config
          ),
        }));
      },

      deleteSiblingDiscountConfig: (id) => {
        set((state) => ({
          siblingDiscountConfigs: state.siblingDiscountConfigs.filter(
            (config) => config.id !== id
          ),
        }));
      },

      getSiblingDiscountConfigs: (discountRuleId) =>
        get().siblingDiscountConfigs
          .filter((config) => config.discountRuleId === discountRuleId)
          .sort((a, b) => a.siblingOrder - b.siblingOrder),

      calculateSiblingDiscount: (siblingOrder, discountRuleId) => {
        const config = get().siblingDiscountConfigs.find(
          (c) => c.discountRuleId === discountRuleId && c.siblingOrder === siblingOrder
        );
        return config?.discountPercentage || 0;
      },

      // Reset
      resetToDefaults: () => {
        set({
          feeCategories: defaultFeeCategories,
          feeGradeAssignments: defaultFeeGradeAssignments,
          installmentPlans: defaultInstallmentPlans,
          discountRules: defaultDiscountRules,
          siblingDiscountConfigs: defaultSiblingDiscountConfigs,
        });
      },
    }),
    {
      name: 'fee-data-storage',
    }
  )
);
