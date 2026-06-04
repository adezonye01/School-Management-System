import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Branch, 
  AcademicYear, 
  User, 
  Role, 
  Grade,
  AuditLog,
  PermissionModule
} from '../types/database';
import { 
  defaultBranches, 
  defaultAcademicYears, 
  defaultUsers, 
  defaultRoles,
  defaultGrades,
  defaultAuditLogs,
  permissionModules
} from '../data/mockData';

interface DataState {
  // Data
  branches: Branch[];
  academicYears: AcademicYear[];
  users: User[];
  roles: Role[];
  grades: Grade[];
  auditLogs: AuditLog[];
  permissionModules: PermissionModule[];

  // Branch Actions
  addBranch: (branch: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => Branch;
  updateBranch: (id: string, data: Partial<Branch>) => void;
  deleteBranch: (id: string) => void;
  getBranchById: (id: string) => Branch | undefined;

  // Academic Year Actions
  addAcademicYear: (year: Omit<AcademicYear, 'id' | 'createdAt' | 'updatedAt'>) => AcademicYear;
  updateAcademicYear: (id: string, data: Partial<AcademicYear>) => void;
  deleteAcademicYear: (id: string) => void;
  getAcademicYearById: (id: string) => AcademicYear | undefined;
  getAcademicYearsByBranch: (branchId: string) => AcademicYear[];
  setCurrentAcademicYear: (branchId: string, yearId: string) => void;
  archiveAcademicYear: (id: string) => void;

  // User Actions
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;
  getUsersByBranch: (branchId: string) => User[];

  // Role Actions
  addRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Role;
  updateRole: (id: string, data: Partial<Role>) => void;
  deleteRole: (id: string) => boolean;
  getRoleById: (id: string) => Role | undefined;
  duplicateRole: (id: string) => Role | null;

  // Grade Actions
  addGrade: (grade: Omit<Grade, 'id'>) => Grade;
  updateGrade: (id: string, data: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
  getGradeById: (id: string) => Grade | undefined;
  getGradesByBranch: (branchId: string) => Grade[];

  // Audit Log Actions
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  getAuditLogs: (filters?: { userId?: string; module?: string; dateFrom?: string; dateTo?: string }) => AuditLog[];

  // Reset
  resetToDefaults: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      branches: defaultBranches,
      academicYears: defaultAcademicYears,
      users: defaultUsers,
      roles: defaultRoles,
      grades: defaultGrades,
      auditLogs: defaultAuditLogs,
      permissionModules: permissionModules,

      // Branch Actions
      addBranch: (branchData) => {
        const newBranch: Branch = {
          ...branchData,
          id: `branch-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ branches: [...state.branches, newBranch] }));
        return newBranch;
      },

      updateBranch: (id, data) => {
        set((state) => ({
          branches: state.branches.map((branch) =>
            branch.id === id
              ? { ...branch, ...data, updatedAt: new Date().toISOString() }
              : branch
          ),
        }));
      },

      deleteBranch: (id) => {
        set((state) => ({
          branches: state.branches.filter((branch) => branch.id !== id),
        }));
      },

      getBranchById: (id) => get().branches.find((branch) => branch.id === id),

      // Academic Year Actions
      addAcademicYear: (yearData) => {
        const newYear: AcademicYear = {
          ...yearData,
          id: `year-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ academicYears: [...state.academicYears, newYear] }));
        return newYear;
      },

      updateAcademicYear: (id, data) => {
        set((state) => ({
          academicYears: state.academicYears.map((year) =>
            year.id === id
              ? { ...year, ...data, updatedAt: new Date().toISOString() }
              : year
          ),
        }));
      },

      deleteAcademicYear: (id) => {
        set((state) => ({
          academicYears: state.academicYears.filter((year) => year.id !== id),
        }));
      },

      getAcademicYearById: (id) => get().academicYears.find((year) => year.id === id),

      getAcademicYearsByBranch: (branchId) =>
        get().academicYears.filter((year) => year.branchId === branchId),

      setCurrentAcademicYear: (branchId, yearId) => {
        set((state) => ({
          academicYears: state.academicYears.map((year) =>
            year.branchId === branchId
              ? { ...year, isCurrent: year.id === yearId }
              : year
          ),
        }));
      },

      archiveAcademicYear: (id) => {
        set((state) => ({
          academicYears: state.academicYears.map((year) =>
            year.id === id
              ? { ...year, isArchived: true, isCurrent: false, updatedAt: new Date().toISOString() }
              : year
          ),
        }));
      },

      // User Actions
      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: `user-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ users: [...state.users, newUser] }));
        return newUser;
      },

      updateUser: (id, data) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === id
              ? { ...user, ...data, updatedAt: new Date().toISOString() }
              : user
          ),
        }));
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter((user) => user.id !== id),
        }));
      },

      getUserById: (id) => get().users.find((user) => user.id === id),

      getUsersByBranch: (branchId) =>
        get().users.filter((user) => user.branchIds.includes(branchId)),

      // Role Actions
      addRole: (roleData) => {
        const newRole: Role = {
          ...roleData,
          id: `role-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ roles: [...state.roles, newRole] }));
        return newRole;
      },

      updateRole: (id, data) => {
        set((state) => ({
          roles: state.roles.map((role) =>
            role.id === id
              ? { ...role, ...data, updatedAt: new Date().toISOString() }
              : role
          ),
        }));
      },

      deleteRole: (id) => {
        const role = get().getRoleById(id);
        if (role?.isSystem) return false;

        // Check if any users have this role
        const usersWithRole = get().users.filter((user) => user.roleId === id);
        if (usersWithRole.length > 0) return false;

        set((state) => ({
          roles: state.roles.filter((role) => role.id !== id),
        }));
        return true;
      },

      getRoleById: (id) => get().roles.find((role) => role.id === id),

      duplicateRole: (id) => {
        const originalRole = get().getRoleById(id);
        if (!originalRole) return null;

        const newRole: Role = {
          ...originalRole,
          id: `role-${uuidv4()}`,
          name: {
            ar: `${originalRole.name.ar} (نسخة)`,
            en: `${originalRole.name.en} (Copy)`,
          },
          isSystem: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ roles: [...state.roles, newRole] }));
        return newRole;
      },

      // Grade Actions
      addGrade: (gradeData) => {
        const newGrade: Grade = {
          ...gradeData,
          id: `grade-${uuidv4()}`,
        };
        set((state) => ({ grades: [...state.grades, newGrade] }));
        return newGrade;
      },

      updateGrade: (id, data) => {
        set((state) => ({
          grades: state.grades.map((grade) =>
            grade.id === id ? { ...grade, ...data } : grade
          ),
        }));
      },

      deleteGrade: (id) => {
        set((state) => ({
          grades: state.grades.filter((grade) => grade.id !== id),
        }));
      },

      getGradeById: (id) => get().grades.find((grade) => grade.id === id),

      getGradesByBranch: (branchId) =>
        get().grades.filter((grade) => grade.branchId === branchId),

      // Audit Log Actions
      addAuditLog: (logData) => {
        const newLog: AuditLog = {
          ...logData,
          id: `log-${uuidv4()}`,
          timestamp: new Date().toISOString(),
        };
        set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
      },

      getAuditLogs: (filters) => {
        let logs = get().auditLogs;
        if (filters?.userId) {
          logs = logs.filter((log) => log.userId === filters.userId);
        }
        if (filters?.module) {
          logs = logs.filter((log) => log.module === filters.module);
        }
        if (filters?.dateFrom) {
          logs = logs.filter((log) => log.timestamp >= filters.dateFrom!);
        }
        if (filters?.dateTo) {
          logs = logs.filter((log) => log.timestamp <= filters.dateTo!);
        }
        return logs;
      },

      // Reset
      resetToDefaults: () => {
        set({
          branches: defaultBranches,
          academicYears: defaultAcademicYears,
          users: defaultUsers,
          roles: defaultRoles,
          grades: defaultGrades,
          auditLogs: defaultAuditLogs,
        });
      },
    }),
    {
      name: 'sms-data-storage',
    }
  )
);
