import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AttendanceRecord, AttendanceStatus, AttendanceSummary } from '../types/database';

interface AttendanceState {
  records: AttendanceRecord[];
  
  // Actions
  addAttendanceRecord: (record: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>) => AttendanceRecord;
  updateAttendanceRecord: (id: string, data: Partial<AttendanceRecord>) => void;
  deleteAttendanceRecord: (id: string) => void;
  
  // Bulk actions
  bulkAddAttendance: (records: Omit<AttendanceRecord, 'id' | 'createdAt' | 'updatedAt'>[]) => AttendanceRecord[];
  bulkUpdateAttendance: (updates: { id: string; status: AttendanceStatus; notes?: string }[]) => void;
  
  // Queries
  getAttendanceByDate: (date: string, sectionId: string, academicYearId: string) => AttendanceRecord[];
  getAttendanceByStudent: (studentId: string, academicYearId: string) => AttendanceRecord[];
  getAttendanceByDateRange: (startDate: string, endDate: string, sectionId: string, academicYearId: string) => AttendanceRecord[];
  getStudentAttendanceSummary: (studentId: string, academicYearId: string) => AttendanceSummary;
  getSectionAttendanceSummary: (sectionId: string, date: string, academicYearId: string) => {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    sick: number;
  };
  
  // Check if attendance exists for a date
  hasAttendanceForDate: (date: string, sectionId: string, academicYearId: string) => boolean;
  
  // Reset
  resetToDefaults: () => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      records: [],

      addAttendanceRecord: (recordData) => {
        const newRecord: AttendanceRecord = {
          ...recordData,
          id: `attendance-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ records: [...state.records, newRecord] }));
        return newRecord;
      },

      updateAttendanceRecord: (id, data) => {
        set((state) => ({
          records: state.records.map((record) =>
            record.id === id
              ? { ...record, ...data, updatedAt: new Date().toISOString() }
              : record
          ),
        }));
      },

      deleteAttendanceRecord: (id) => {
        set((state) => ({
          records: state.records.filter((record) => record.id !== id),
        }));
      },

      bulkAddAttendance: (recordsData) => {
        const newRecords: AttendanceRecord[] = recordsData.map((recordData) => ({
          ...recordData,
          id: `attendance-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        set((state) => ({ records: [...state.records, ...newRecords] }));
        return newRecords;
      },

      bulkUpdateAttendance: (updates) => {
        set((state) => ({
          records: state.records.map((record) => {
            const update = updates.find((u) => u.id === record.id);
            if (update) {
              return {
                ...record,
                status: update.status,
                notes: update.notes ?? record.notes,
                updatedAt: new Date().toISOString(),
              };
            }
            return record;
          }),
        }));
      },

      getAttendanceByDate: (date, sectionId, academicYearId) =>
        get().records.filter(
          (record) =>
            record.date === date &&
            record.sectionId === sectionId &&
            record.academicYearId === academicYearId
        ),

      getAttendanceByStudent: (studentId, academicYearId) =>
        get().records.filter(
          (record) =>
            record.studentId === studentId &&
            record.academicYearId === academicYearId
        ),

      getAttendanceByDateRange: (startDate, endDate, sectionId, academicYearId) =>
        get().records.filter(
          (record) =>
            record.date >= startDate &&
            record.date <= endDate &&
            record.sectionId === sectionId &&
            record.academicYearId === academicYearId
        ),

      getStudentAttendanceSummary: (studentId, academicYearId) => {
        const records = get().records.filter(
          (r) => r.studentId === studentId && r.academicYearId === academicYearId
        );
        
        const totalDays = records.length;
        const presentDays = records.filter((r) => r.status === 'present').length;
        const absentDays = records.filter((r) => r.status === 'absent').length;
        const lateDays = records.filter((r) => r.status === 'late').length;
        const excusedDays = records.filter((r) => r.status === 'excused').length;
        const sickDays = records.filter((r) => r.status === 'sick').length;
        
        return {
          studentId,
          academicYearId,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          sickDays,
          attendanceRate: totalDays > 0 ? ((presentDays + lateDays) / totalDays) * 100 : 0,
        };
      },

      getSectionAttendanceSummary: (sectionId, date, academicYearId) => {
        const records = get().records.filter(
          (r) =>
            r.sectionId === sectionId &&
            r.date === date &&
            r.academicYearId === academicYearId
        );
        
        return {
          total: records.length,
          present: records.filter((r) => r.status === 'present').length,
          absent: records.filter((r) => r.status === 'absent').length,
          late: records.filter((r) => r.status === 'late').length,
          excused: records.filter((r) => r.status === 'excused').length,
          sick: records.filter((r) => r.status === 'sick').length,
        };
      },

      hasAttendanceForDate: (date, sectionId, academicYearId) =>
        get().records.some(
          (record) =>
            record.date === date &&
            record.sectionId === sectionId &&
            record.academicYearId === academicYearId
        ),

      resetToDefaults: () => {
        set({ records: [] });
      },
    }),
    {
      name: 'attendance-storage',
    }
  )
);
