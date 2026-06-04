import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { AdmissionApplication, AdmissionStatus } from '../types/database';

const sampleApplications: AdmissionApplication[] = [
  {
    id: 'app-1', applicationNumber: 'ADM-2025-001',
    studentFirstNameAr: 'يوسف', studentFirstNameEn: 'Yousef', studentLastNameAr: 'الحارثي', studentLastNameEn: 'Al-Harithi',
    dateOfBirth: '2018-03-15', gender: 'male', nationality: 'يمني',
    previousSchool: 'مدارس الإيمان', desiredGradeId: 'grade-1', desiredBranchId: 'branch-1', academicYearId: 'year-2024-2025',
    parentFirstNameAr: 'علي', parentFirstNameEn: 'Ali', parentLastNameAr: 'الحارثي', parentLastNameEn: 'Al-Harithi',
    parentPhone: '+967771234567', parentEmail: 'ali@email.com', parentRelation: 'father',
    address: 'صنعاء - شارع الزبيري',
    birthCertificateUploaded: true, photoUploaded: true, previousReportUploaded: false, nationalIdUploaded: true,
    bloodType: 'O+', status: 'pending', submittedAt: '2025-01-10T08:00:00Z', updatedAt: '2025-01-10T08:00:00Z',
  },
  {
    id: 'app-2', applicationNumber: 'ADM-2025-002',
    studentFirstNameAr: 'آمنة', studentFirstNameEn: 'Amna', studentLastNameAr: 'المقطري', studentLastNameEn: 'Al-Maqtari',
    dateOfBirth: '2017-07-22', gender: 'female', nationality: 'يمنية', nationalId: '9876543210',
    desiredGradeId: 'grade-2', desiredBranchId: 'branch-1', academicYearId: 'year-2024-2025',
    parentFirstNameAr: 'محمد', parentFirstNameEn: 'Mohammed', parentLastNameAr: 'المقطري', parentLastNameEn: 'Al-Maqtari',
    parentPhone: '+967777654321', parentRelation: 'father', parentOccupation: 'مهندس',
    birthCertificateUploaded: true, photoUploaded: true, previousReportUploaded: true, nationalIdUploaded: true,
    status: 'under_review', submittedAt: '2025-01-08T10:00:00Z', updatedAt: '2025-01-09T14:00:00Z',
  },
  {
    id: 'app-3', applicationNumber: 'ADM-2025-003',
    studentFirstNameAr: 'عمر', studentFirstNameEn: 'Omar', studentLastNameAr: 'باسلامة', studentLastNameEn: 'Basalama',
    dateOfBirth: '2019-11-05', gender: 'male', nationality: 'يمني',
    desiredGradeId: 'grade-kg1', desiredBranchId: 'branch-1', academicYearId: 'year-2024-2025',
    parentFirstNameAr: 'أحمد', parentFirstNameEn: 'Ahmed', parentLastNameAr: 'باسلامة', parentLastNameEn: 'Basalama',
    parentPhone: '+967773456789', parentRelation: 'father',
    birthCertificateUploaded: true, photoUploaded: false, previousReportUploaded: false, nationalIdUploaded: false,
    status: 'changes_requested', reviewNotes: 'يرجى رفع صورة شخصية وصورة الهوية',
    submittedAt: '2025-01-05T09:00:00Z', updatedAt: '2025-01-07T11:00:00Z',
  },
];

interface AdmissionState {
  applications: AdmissionApplication[];
  addApplication: (app: Omit<AdmissionApplication, 'id' | 'applicationNumber' | 'submittedAt' | 'updatedAt'>) => AdmissionApplication;
  updateApplication: (id: string, data: Partial<AdmissionApplication>) => void;
  deleteApplication: (id: string) => void;
  getApplicationsByBranch: (branchId: string) => AdmissionApplication[];
  getApplicationsByStatus: (status: AdmissionStatus) => AdmissionApplication[];
  generateAppNumber: () => string;
  approveApplication: (id: string, reviewedBy: string) => void;
  rejectApplication: (id: string, reviewedBy: string, notes: string) => void;
  requestChanges: (id: string, reviewedBy: string, notes: string) => void;
}

export const useAdmissionStore = create<AdmissionState>()(
  persist(
    (set, get) => ({
      applications: sampleApplications,

      addApplication: (data) => {
        const app: AdmissionApplication = {
          ...data, id: `app-${uuidv4()}`,
          applicationNumber: get().generateAppNumber(),
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set(s => ({ applications: [...s.applications, app] }));
        return app;
      },

      updateApplication: (id, data) => {
        set(s => ({ applications: s.applications.map(a => a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a) }));
      },

      deleteApplication: (id) => {
        set(s => ({ applications: s.applications.filter(a => a.id !== id) }));
      },

      getApplicationsByBranch: (branchId) =>
        get().applications.filter(a => a.desiredBranchId === branchId).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),

      getApplicationsByStatus: (status) =>
        get().applications.filter(a => a.status === status),

      generateAppNumber: () => {
        const year = new Date().getFullYear();
        const count = get().applications.length + 1;
        return `ADM-${year}-${String(count).padStart(3, '0')}`;
      },

      approveApplication: (id, reviewedBy) => {
        get().updateApplication(id, { status: 'approved', reviewedBy, reviewedAt: new Date().toISOString() });
      },

      rejectApplication: (id, reviewedBy, notes) => {
        get().updateApplication(id, { status: 'rejected', reviewedBy, reviewedAt: new Date().toISOString(), reviewNotes: notes });
      },

      requestChanges: (id, reviewedBy, notes) => {
        get().updateApplication(id, { status: 'changes_requested', reviewedBy, reviewedAt: new Date().toISOString(), reviewNotes: notes });
      },
    }),
    { name: 'admission-data-storage' }
  )
);
