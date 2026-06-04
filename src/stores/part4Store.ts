import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  ParentProfile,
  BehaviorCategory,
  BehaviorIncident,
  DisciplinaryAction,
  TransportZone,
  Bus,
  StudentTransport,
} from '../types/database';

// Default Behavior Categories
const defaultBehaviorCategories: BehaviorCategory[] = [
  { id: 'bc-excellent', name: { ar: 'تفوق دراسي', en: 'Academic Excellence' }, code: 'EXCELLENCE', type: 'positive', defaultPoints: 5, severity: 'minor', description: { ar: 'تميز في الأداء الأكاديمي', en: 'Outstanding academic performance' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bc-help', name: { ar: 'مساعدة الزملاء', en: 'Helping Peers' }, code: 'HELP', type: 'positive', defaultPoints: 3, severity: 'minor', description: { ar: 'مساعدة الزملاء في الدراسة', en: 'Helping classmates with studies' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bc-participate', name: { ar: 'مشاركة فعالة', en: 'Active Participation' }, code: 'PARTICIPATE', type: 'positive', defaultPoints: 2, severity: 'minor', description: { ar: 'مشاركة فعالة في الفصل', en: 'Active class participation' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bc-late', name: { ar: 'تأخر عن الحصة', en: 'Late to Class' }, code: 'LATE', type: 'negative', defaultPoints: -2, severity: 'minor', description: { ar: 'الحضور متأخراً إلى الحصة', en: 'Arriving late to class' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bc-disrupt', name: { ar: 'إزعاج في الفصل', en: 'Class Disruption' }, code: 'DISRUPT', type: 'negative', defaultPoints: -3, severity: 'moderate', description: { ar: 'التسبب في إزعاج أثناء الحصة', en: 'Causing disruption during class' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bc-absent', name: { ar: 'غياب بدون عذر', en: 'Unexcused Absence' }, code: 'ABSENT', type: 'negative', defaultPoints: -5, severity: 'moderate', description: { ar: 'غياب بدون عذر مقبول', en: 'Absent without valid excuse' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bc-fight', name: { ar: 'مشاجرة', en: 'Physical Altercation' }, code: 'FIGHT', type: 'negative', defaultPoints: -10, severity: 'major', description: { ar: 'مشاجرة مع طالب آخر', en: 'Physical fight with another student' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bc-bully', name: { ar: 'تنمر', en: 'Bullying' }, code: 'BULLY', type: 'negative', defaultPoints: -15, severity: 'critical', description: { ar: 'ممارسة التنمر على الآخرين', en: 'Bullying other students' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Default Disciplinary Actions
const defaultDisciplinaryActions: DisciplinaryAction[] = [
  { id: 'da-verbal', name: { ar: 'تنبيه شفهي', en: 'Verbal Warning' }, code: 'VERBAL', pointThreshold: -5, actionType: 'warning', description: { ar: 'تنبيه شفهي للطالب', en: 'Verbal warning to student' }, requiresParentSignature: false, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'da-written', name: { ar: 'إنذار كتابي', en: 'Written Warning' }, code: 'WRITTEN', pointThreshold: -15, actionType: 'letter', description: { ar: 'إنذار كتابي يُرسل لولي الأمر', en: 'Written warning sent to parents' }, requiresParentSignature: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'da-meeting', name: { ar: 'استدعاء ولي الأمر', en: 'Parent Meeting' }, code: 'MEETING', pointThreshold: -25, actionType: 'meeting', description: { ar: 'طلب حضور ولي الأمر للمدرسة', en: 'Request parent to visit school' }, requiresParentSignature: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'da-suspend', name: { ar: 'إيقاف مؤقت', en: 'Suspension' }, code: 'SUSPEND', pointThreshold: -40, actionType: 'suspension', description: { ar: 'إيقاف الطالب عن الدراسة مؤقتاً', en: 'Temporary suspension from school' }, durationDays: 3, requiresParentSignature: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Default Transport Zones
const defaultTransportZones: TransportZone[] = [
  { id: 'zone-a', name: { ar: 'المنطقة أ - قريبة', en: 'Zone A - Near' }, code: 'ZONE-A', description: { ar: 'المناطق القريبة من المدرسة (0-5 كم)', en: 'Areas near school (0-5 km)' }, monthlyFee: 300, annualFee: 3000, currency: 'SAR', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'zone-b', name: { ar: 'المنطقة ب - متوسطة', en: 'Zone B - Medium' }, code: 'ZONE-B', description: { ar: 'المناطق المتوسطة البعد (5-15 كم)', en: 'Medium distance areas (5-15 km)' }, monthlyFee: 500, annualFee: 5000, currency: 'SAR', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'zone-c', name: { ar: 'المنطقة ج - بعيدة', en: 'Zone C - Far' }, code: 'ZONE-C', description: { ar: 'المناطق البعيدة (15-30 كم)', en: 'Far areas (15-30 km)' }, monthlyFee: 700, annualFee: 7000, currency: 'SAR', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Default Buses
const defaultBuses: Bus[] = [
  { id: 'bus-1', busNumber: 'BUS-01', plateNumber: 'ABC-1234', capacity: 40, model: 'Toyota Coaster', year: 2022, driverName: { ar: 'سعيد الأحمدي', en: 'Saeed Al-Ahmadi' }, driverPhone: '+966501111111', supervisorName: { ar: 'خالد العتيبي', en: 'Khaled Al-Otaibi' }, supervisorPhone: '+966502222222', zoneId: 'zone-a', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bus-2', busNumber: 'BUS-02', plateNumber: 'DEF-5678', capacity: 35, model: 'Hyundai County', year: 2023, driverName: { ar: 'محمد القحطاني', en: 'Mohammed Al-Qahtani' }, driverPhone: '+966503333333', zoneId: 'zone-b', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'bus-3', busNumber: 'BUS-03', plateNumber: 'GHI-9012', capacity: 45, model: 'Mitsubishi Rosa', year: 2021, driverName: { ar: 'عبدالرحمن الشهري', en: 'Abdulrahman Al-Shahri' }, driverPhone: '+966504444444', supervisorName: { ar: 'فهد الدوسري', en: 'Fahad Al-Dosari' }, supervisorPhone: '+966505555555', zoneId: 'zone-c', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Sample Parent
const defaultParents: ParentProfile[] = [
  { id: 'parent-1', firstName: { ar: 'أحمد', en: 'Ahmed' }, lastName: { ar: 'العلي', en: 'Al-Ali' }, phone: '+966501234567', email: 'ahmed@email.com', relation: 'father', studentIds: ['student-1', 'student-3'], isStaff: false, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'parent-2', firstName: { ar: 'سالم', en: 'Salem' }, lastName: { ar: 'السالم', en: 'Al-Salem' }, phone: '+966507654321', relation: 'father', studentIds: ['student-2'], isStaff: false, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Sample Behavior Incidents
const defaultBehaviorIncidents: BehaviorIncident[] = [
  { id: 'bi-1', studentId: 'student-1', categoryId: 'bc-excellent', type: 'positive', points: 5, severity: 'minor', description: { ar: 'حصل على أعلى درجة في اختبار الرياضيات', en: 'Scored highest in math test' }, date: '2024-10-15', time: '10:30', reportedBy: 'user-admin', parentNotified: true, parentNotifiedDate: '2024-10-15', branchId: 'branch-1', academicYearId: 'year-2024-2025', createdAt: '2024-10-15T10:30:00Z', updatedAt: '2024-10-15T10:30:00Z' },
  { id: 'bi-2', studentId: 'student-2', categoryId: 'bc-late', type: 'negative', points: -2, severity: 'minor', description: { ar: 'تأخر عن حصة العلوم', en: 'Late to science class' }, date: '2024-10-16', time: '08:15', reportedBy: 'user-admin', parentNotified: false, branchId: 'branch-1', academicYearId: 'year-2024-2025', createdAt: '2024-10-16T08:15:00Z', updatedAt: '2024-10-16T08:15:00Z' },
  { id: 'bi-3', studentId: 'student-1', categoryId: 'bc-help', type: 'positive', points: 3, severity: 'minor', description: { ar: 'ساعد زميله في فهم درس الرياضيات', en: 'Helped a classmate understand math lesson' }, date: '2024-10-17', time: '11:00', reportedBy: 'user-admin', parentNotified: false, branchId: 'branch-1', academicYearId: 'year-2024-2025', createdAt: '2024-10-17T11:00:00Z', updatedAt: '2024-10-17T11:00:00Z' },
];

// Sample Transport Assignments
const defaultStudentTransports: StudentTransport[] = [
  { id: 'st-1', studentId: 'student-1', busId: 'bus-1', zoneId: 'zone-a', academicYearId: 'year-2024-2025', pickupPoint: { ar: 'أمام مسجد النور', en: 'In front of Al-Noor Mosque' }, pickupTime: '06:30', dropoffTime: '13:30', direction: 'both', monthlyFee: 300, branchId: 'branch-1', isActive: true, createdAt: '2024-09-01T00:00:00Z', updatedAt: '2024-09-01T00:00:00Z' },
];

interface Part4State {
  parents: ParentProfile[];
  behaviorCategories: BehaviorCategory[];
  behaviorIncidents: BehaviorIncident[];
  disciplinaryActions: DisciplinaryAction[];
  transportZones: TransportZone[];
  buses: Bus[];
  studentTransports: StudentTransport[];

  // Parents
  addParent: (p: Omit<ParentProfile, 'id' | 'createdAt' | 'updatedAt'>) => ParentProfile;
  updateParent: (id: string, d: Partial<ParentProfile>) => void;
  deleteParent: (id: string) => void;
  getParentsByBranch: (branchId: string) => ParentProfile[];
  getParentByStudentId: (studentId: string) => ParentProfile | undefined;

  // Behavior Categories
  addBehaviorCategory: (c: Omit<BehaviorCategory, 'id' | 'createdAt' | 'updatedAt'>) => BehaviorCategory;
  updateBehaviorCategory: (id: string, d: Partial<BehaviorCategory>) => void;
  deleteBehaviorCategory: (id: string) => void;
  getBehaviorCategoriesByBranch: (branchId: string) => BehaviorCategory[];

  // Behavior Incidents
  addBehaviorIncident: (i: Omit<BehaviorIncident, 'id' | 'createdAt' | 'updatedAt'>) => BehaviorIncident;
  updateBehaviorIncident: (id: string, d: Partial<BehaviorIncident>) => void;
  deleteBehaviorIncident: (id: string) => void;
  getIncidentsByStudent: (studentId: string, academicYearId?: string) => BehaviorIncident[];
  getIncidentsByBranch: (branchId: string, academicYearId?: string) => BehaviorIncident[];
  getStudentTotalPoints: (studentId: string, academicYearId: string) => number;

  // Disciplinary Actions
  addDisciplinaryAction: (a: Omit<DisciplinaryAction, 'id' | 'createdAt' | 'updatedAt'>) => DisciplinaryAction;
  updateDisciplinaryAction: (id: string, d: Partial<DisciplinaryAction>) => void;
  getDisciplinaryActionsByBranch: (branchId: string) => DisciplinaryAction[];
  getTriggeredActions: (studentId: string, academicYearId: string, branchId: string) => DisciplinaryAction[];

  // Transport Zones
  addTransportZone: (z: Omit<TransportZone, 'id' | 'createdAt' | 'updatedAt'>) => TransportZone;
  updateTransportZone: (id: string, d: Partial<TransportZone>) => void;
  deleteTransportZone: (id: string) => void;
  getTransportZonesByBranch: (branchId: string) => TransportZone[];

  // Buses
  addBus: (b: Omit<Bus, 'id' | 'createdAt' | 'updatedAt'>) => Bus;
  updateBus: (id: string, d: Partial<Bus>) => void;
  deleteBus: (id: string) => void;
  getBusesByBranch: (branchId: string) => Bus[];
  getBusesByZone: (zoneId: string) => Bus[];

  // Student Transport
  addStudentTransport: (t: Omit<StudentTransport, 'id' | 'createdAt' | 'updatedAt'>) => StudentTransport;
  updateStudentTransport: (id: string, d: Partial<StudentTransport>) => void;
  deleteStudentTransport: (id: string) => void;
  getStudentTransport: (studentId: string, academicYearId: string) => StudentTransport | undefined;
  getStudentsByBus: (busId: string) => StudentTransport[];
}

export const usePart4Store = create<Part4State>()(
  persist(
    (set, get) => ({
      parents: defaultParents,
      behaviorCategories: defaultBehaviorCategories,
      behaviorIncidents: defaultBehaviorIncidents,
      disciplinaryActions: defaultDisciplinaryActions,
      transportZones: defaultTransportZones,
      buses: defaultBuses,
      studentTransports: defaultStudentTransports,

      // Parents
      addParent: (d) => { const p: ParentProfile = { ...d, id: `parent-${uuidv4()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; set((s) => ({ parents: [...s.parents, p] })); return p; },
      updateParent: (id, d) => { set((s) => ({ parents: s.parents.map((p) => p.id === id ? { ...p, ...d, updatedAt: new Date().toISOString() } : p) })); },
      deleteParent: (id) => { set((s) => ({ parents: s.parents.filter((p) => p.id !== id) })); },
      getParentsByBranch: (branchId) => get().parents.filter((p) => p.branchId === branchId),
      getParentByStudentId: (studentId) => get().parents.find((p) => p.studentIds.includes(studentId)),

      // Behavior Categories
      addBehaviorCategory: (d) => { const c: BehaviorCategory = { ...d, id: `bc-${uuidv4()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; set((s) => ({ behaviorCategories: [...s.behaviorCategories, c] })); return c; },
      updateBehaviorCategory: (id, d) => { set((s) => ({ behaviorCategories: s.behaviorCategories.map((c) => c.id === id ? { ...c, ...d, updatedAt: new Date().toISOString() } : c) })); },
      deleteBehaviorCategory: (id) => { set((s) => ({ behaviorCategories: s.behaviorCategories.filter((c) => c.id !== id) })); },
      getBehaviorCategoriesByBranch: (branchId) => get().behaviorCategories.filter((c) => c.branchId === branchId && c.isActive),

      // Behavior Incidents
      addBehaviorIncident: (d) => { const i: BehaviorIncident = { ...d, id: `bi-${uuidv4()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; set((s) => ({ behaviorIncidents: [...s.behaviorIncidents, i] })); return i; },
      updateBehaviorIncident: (id, d) => { set((s) => ({ behaviorIncidents: s.behaviorIncidents.map((i) => i.id === id ? { ...i, ...d, updatedAt: new Date().toISOString() } : i) })); },
      deleteBehaviorIncident: (id) => { set((s) => ({ behaviorIncidents: s.behaviorIncidents.filter((i) => i.id !== id) })); },
      getIncidentsByStudent: (studentId, academicYearId) => get().behaviorIncidents.filter((i) => i.studentId === studentId && (!academicYearId || i.academicYearId === academicYearId)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      getIncidentsByBranch: (branchId, academicYearId) => get().behaviorIncidents.filter((i) => i.branchId === branchId && (!academicYearId || i.academicYearId === academicYearId)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      getStudentTotalPoints: (studentId, academicYearId) => get().behaviorIncidents.filter((i) => i.studentId === studentId && i.academicYearId === academicYearId).reduce((s, i) => s + i.points, 0),

      // Disciplinary Actions
      addDisciplinaryAction: (d) => { const a: DisciplinaryAction = { ...d, id: `da-${uuidv4()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; set((s) => ({ disciplinaryActions: [...s.disciplinaryActions, a] })); return a; },
      updateDisciplinaryAction: (id, d) => { set((s) => ({ disciplinaryActions: s.disciplinaryActions.map((a) => a.id === id ? { ...a, ...d, updatedAt: new Date().toISOString() } : a) })); },
      getDisciplinaryActionsByBranch: (branchId) => get().disciplinaryActions.filter((a) => a.branchId === branchId && a.isActive).sort((a, b) => a.pointThreshold - b.pointThreshold),
      getTriggeredActions: (studentId, academicYearId, branchId) => {
        const totalPoints = get().getStudentTotalPoints(studentId, academicYearId);
        return get().getDisciplinaryActionsByBranch(branchId).filter((a) => totalPoints <= a.pointThreshold);
      },

      // Transport Zones
      addTransportZone: (d) => { const z: TransportZone = { ...d, id: `zone-${uuidv4()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; set((s) => ({ transportZones: [...s.transportZones, z] })); return z; },
      updateTransportZone: (id, d) => { set((s) => ({ transportZones: s.transportZones.map((z) => z.id === id ? { ...z, ...d, updatedAt: new Date().toISOString() } : z) })); },
      deleteTransportZone: (id) => { set((s) => ({ transportZones: s.transportZones.filter((z) => z.id !== id) })); },
      getTransportZonesByBranch: (branchId) => get().transportZones.filter((z) => z.branchId === branchId && z.isActive),

      // Buses
      addBus: (d) => { const b: Bus = { ...d, id: `bus-${uuidv4()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; set((s) => ({ buses: [...s.buses, b] })); return b; },
      updateBus: (id, d) => { set((s) => ({ buses: s.buses.map((b) => b.id === id ? { ...b, ...d, updatedAt: new Date().toISOString() } : b) })); },
      deleteBus: (id) => { set((s) => ({ buses: s.buses.filter((b) => b.id !== id) })); },
      getBusesByBranch: (branchId) => get().buses.filter((b) => b.branchId === branchId && b.isActive),
      getBusesByZone: (zoneId) => get().buses.filter((b) => b.zoneId === zoneId && b.isActive),

      // Student Transport
      addStudentTransport: (d) => { const t: StudentTransport = { ...d, id: `st-${uuidv4()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }; set((s) => ({ studentTransports: [...s.studentTransports, t] })); return t; },
      updateStudentTransport: (id, d) => { set((s) => ({ studentTransports: s.studentTransports.map((t) => t.id === id ? { ...t, ...d, updatedAt: new Date().toISOString() } : t) })); },
      deleteStudentTransport: (id) => { set((s) => ({ studentTransports: s.studentTransports.filter((t) => t.id !== id) })); },
      getStudentTransport: (studentId, academicYearId) => get().studentTransports.find((t) => t.studentId === studentId && t.academicYearId === academicYearId && t.isActive),
      getStudentsByBus: (busId) => get().studentTransports.filter((t) => t.busId === busId && t.isActive),
    }),
    { name: 'part4-data-storage' }
  )
);
