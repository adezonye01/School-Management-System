// Database Schema Types for School Management System
// Supports multi-branch, multi-academic year, and bilingual data

export interface LocalizedText {
  ar: string;
  en: string;
}

// Branch Management
export interface Branch {
  id: string;
  name: LocalizedText;
  code: string;
  address: LocalizedText;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Academic Year Management
export interface AcademicYear {
  id: string;
  branchId: string;
  name: LocalizedText;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// Grade/Class Level
export interface Grade {
  id: string;
  name: LocalizedText;
  order: number;
  nextGradeId: string | null; // For rolling-over
  branchId: string;
  isActive: boolean;
}

// Section/Class
export interface Section {
  id: string;
  gradeId: string;
  academicYearId: string;
  name: LocalizedText;
  capacity: number;
  isActive: boolean;
}

// Permission Module Definition
export interface PermissionModule {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  parentId: string | null;
  order: number;
  actions: PermissionAction[];
}

export interface PermissionAction {
  code: 'create' | 'read' | 'update' | 'delete' | 'export' | 'import' | 'approve';
  name: LocalizedText;
}

// Role Definition
export interface Role {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  branchId: string | null; // null means system-wide
  isSystem: boolean; // System roles cannot be deleted
  permissions: RolePermission[];
  createdAt: string;
  updatedAt: string;
}

export interface RolePermission {
  moduleCode: string;
  actions: string[]; // ['create', 'read', 'update', 'delete']
}

// User Management
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  firstName: LocalizedText;
  lastName: LocalizedText;
  phone: string;
  avatar?: string;
  roleId: string;
  branchIds: string[]; // User can have access to multiple branches
  currentBranchId: string;
  currentAcademicYearId: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Audit Log for Security
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  module: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// Student (For rolling-over feature)
export interface Student {
  id: string;
  studentNumber: string;
  firstName: LocalizedText;
  lastName: LocalizedText;
  dateOfBirth: string;
  gender: 'male' | 'female';
  branchId: string;
  currentGradeId: string;
  currentSectionId: string;
  academicYearId: string;
  status: 'active' | 'graduated' | 'transferred' | 'withdrawn';
  enrollmentDate: string;
  isActive: boolean;
}

// Academic Year Archive (For data archiving)
export interface AcademicYearArchive {
  id: string;
  academicYearId: string;
  studentId: string;
  gradeId: string;
  sectionId: string;
  finalGrade: number;
  passed: boolean;
  promotedToGradeId?: string;
  archivedAt: string;
}

// Session/Token Management
export interface UserSession {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// Fee Category (Bilingual)
export interface FeeCategory {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  branchId: string;
  isActive: boolean;
}

// Subject (Bilingual)
export interface Subject {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Education Level (Kindergarten, Primary, Secondary)
export interface EducationLevel {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  order: number;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Enhanced Grade with Education Level
export interface EnhancedGrade {
  id: string;
  educationLevelId: string;
  name: LocalizedText;
  code: string;
  order: number;
  nextGradeId: string | null;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Enhanced Section with more details
export interface EnhancedSection {
  id: string;
  gradeId: string;
  academicYearId: string;
  name: LocalizedText;
  code: string;
  capacity: number;
  teacherId?: string; // Homeroom teacher
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Subject Assignment to Grades
export interface SubjectGradeMapping {
  id: string;
  subjectId: string;
  gradeId: string;
  academicYearId: string;
  maxMarks: number;
  minPassingMarks: number;
  creditHours?: number;
  isCore: boolean; // Core or elective
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Weight Distribution for Grading
export interface GradeWeightDistribution {
  id: string;
  subjectGradeMappingId: string;
  componentName: LocalizedText; // e.g., Quizzes, Assignments, Final Exam
  componentCode: string;
  weightPercentage: number;
  maxMarks: number;
  order: number;
  isActive: boolean;
}

// Grading Scale Configuration
export interface GradingScale {
  id: string;
  name: LocalizedText;
  branchId: string;
  gradeId?: string; // null means applies to all grades in branch
  evaluationType: 'numerical' | 'alphabetical' | 'descriptive';
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Grading Scale Levels (A, B, C or ممتاز، جيد جداً)
export interface GradingScaleLevel {
  id: string;
  gradingScaleId: string;
  grade: LocalizedText; // A, B, C or ممتاز، جيد جداً
  minPercentage: number;
  maxPercentage: number;
  gpa?: number;
  description: LocalizedText;
  color: string;
  order: number;
}

// Enhanced Student with more fields
export interface EnhancedStudent {
  id: string;
  studentNumber: string;
  firstName: LocalizedText;
  middleName?: LocalizedText;
  lastName: LocalizedText;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationalId?: string;
  nationality?: string;
  religion?: string;
  bloodType?: string;
  photo?: string;
  branchId: string;
  educationLevelId: string;
  currentGradeId: string;
  currentSectionId: string;
  academicYearId: string;
  enrollmentDate: string;
  status: 'active' | 'graduated' | 'transferred' | 'withdrawn' | 'suspended';
  guardianName: LocalizedText;
  guardianPhone: string;
  guardianEmail?: string;
  address?: LocalizedText;
  medicalNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Exam Seating Number
export interface ExamSeatingNumber {
  id: string;
  studentId: string;
  academicYearId: string;
  gradeId: string;
  sectionId: string;
  seatingNumber: string;
  examPeriod: string; // e.g., "midterm-1", "final"
  generatedAt: string;
  isManualOverride: boolean;
  branchId: string;
}

// ========== YEMEN GRADING SYSTEM ==========

// Exam Period (الفترة الامتحانية)
export type YemenExamPeriod = 'monthly_1' | 'monthly_2' | 'midterm' | 'monthly_3' | 'monthly_4' | 'final';

// Monthly Component (مكون الدرجة الشهرية)
export type MonthlyComponent = 'behavior' | 'homework' | 'oral' | 'written';

// Monthly Component Config
export interface MonthlyComponentConfig {
  component: MonthlyComponent;
  name: LocalizedText;
  maxMarks: number;
  order: number;
}

// Yemen Grade Configuration
export interface YemenGradeConfig {
  id: string;
  name: LocalizedText;
  code: string;
  monthlyComponents: MonthlyComponentConfig[];
  examPeriods: YemenExamPeriodConfig[];
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Exam Period Config
export interface YemenExamPeriodConfig {
  period: YemenExamPeriod;
  name: LocalizedText;
  maxMarks: number;
  weight: number;
  order: number;
  semester: 1 | 2;
  isMonthly: boolean;
  isActive: boolean;
}

// Student Marks - Component level
export interface StudentMark {
  id: string;
  studentId: string;
  subjectGradeMappingId: string;
  examPeriod: YemenExamPeriod;
  component: MonthlyComponent | 'exam';
  semester: 1 | 2;
  academicYearId: string;
  marks: number;
  maxMarks: number;
  isAbsent: boolean;
  remarks?: string;
  enteredBy: string;
  enteredAt: string;
  updatedAt: string;
}

// Student Semester Result
export interface StudentSemesterResult {
  id: string;
  studentId: string;
  subjectGradeMappingId: string;
  academicYearId: string;
  semester: 1 | 2;
  monthlyAvg: number;
  examMark: number;
  semesterTotal: number;
  percentage: number;
  letterGrade?: string;
  isPassed: boolean;
}

// Student Final Grade (Annual)
export interface StudentFinalGrade {
  id: string;
  studentId: string;
  subjectGradeMappingId: string;
  academicYearId: string;
  semester1Total: number;
  semester2Total: number;
  annualTotal: number;
  percentage: number;
  letterGrade?: string;
  gpa?: number;
  isPassed: boolean;
  remarks?: string;
  calculatedAt: string;
}

// ========== PART 3: FINANCIAL MODULE - FEE TREE ==========

// Fee Category (Hierarchical Fee Tree)
export interface FeeCategory {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  parentId: string | null;
  level: number;
  order: number;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fee Grade Assignment
export interface FeeGradeAssignment {
  id: string;
  feeCategoryId: string;
  gradeId: string;
  academicYearId: string;
  amount: number;
  currency: string;
  isMandatory: boolean;
  dueDate?: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Payment Methods
export type PaymentMethod = 'cash' | 'bank_transfer' | 'check' | 'digital_wallet' | 'card';

// Invoice
export interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  academicYearId: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  netAmount: number;
  paidAmount: number;
  status: 'draft' | 'issued' | 'paid' | 'partial' | 'overdue' | 'cancelled';
  notes?: LocalizedText;
  branchId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Invoice Item
export interface InvoiceItem {
  id: string;
  invoiceId: string;
  feeCategoryId: string;
  description: LocalizedText;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount: number;
}

// Payment/Receipt
export interface Payment {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referenceNumber?: string;
  bankName?: string;
  checkNumber?: string;
  notes?: string;
  receivedBy: string;
  branchId: string;
  createdAt: string;
}

// Installment Plan
export interface InstallmentPlan {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  numberOfInstallments: number;
  intervalDays: number;
  lateFeePercentage?: number;
  lateFeeFixedAmount?: number;
  gracePeriodDays: number;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Student Installment
export interface StudentInstallment {
  id: string;
  studentId: string;
  invoiceId: string;
  installmentPlanId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  paidDate?: string;
  lateFeeAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  branchId: string;
  createdAt: string;
  updatedAt: string;
}

// Discount Types
export type DiscountType = 'sibling' | 'staff' | 'merit' | 'financial_aid' | 'early_payment' | 'loyalty' | 'custom';
export type DiscountApplyType = 'percentage' | 'fixed_amount';

// Discount Rules
export interface DiscountRule {
  id: string;
  name: LocalizedText;
  code: string;
  discountType: DiscountType;
  description: LocalizedText;
  applyType: DiscountApplyType;
  value: number;
  maxDiscountAmount?: number;
  minFeeAmount?: number;
  priority: number;
  isStackable: boolean;
  applicableFeeCategories: string[];
  applicableGrades: string[];
  startDate?: string;
  endDate?: string;
  isAutomatic: boolean;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Sibling Discount Configuration
export interface SiblingDiscountConfig {
  id: string;
  discountRuleId: string;
  siblingOrder: number;
  discountPercentage: number;
  branchId: string;
}

// Student Discount
export interface StudentDiscount {
  id: string;
  studentId: string;
  discountRuleId: string;
  invoiceId?: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  reason?: string;
  approvedBy: string;
  approvedAt: string;
  branchId: string;
  createdAt: string;
}

// Student Sibling Link
export interface StudentSibling {
  id: string;
  studentId1: string;
  studentId2: string;
  relation: 'sibling' | 'cousin' | 'other';
  sameGuardian: boolean;
  branchId: string;
  createdAt: string;
}

// ========== PART 4: PROFILES, BEHAVIOR, TRANSPORT ==========

// Parent Profile
export interface ParentProfile {
  id: string;
  firstName: LocalizedText;
  lastName: LocalizedText;
  nationalId?: string;
  phone: string;
  phone2?: string;
  email?: string;
  occupation?: LocalizedText;
  address?: LocalizedText;
  relation: 'father' | 'mother' | 'guardian' | 'other';
  studentIds: string[];
  isStaff: boolean;
  userId?: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Behavior Incident Types
export type BehaviorType = 'positive' | 'negative';
export type BehaviorSeverity = 'minor' | 'moderate' | 'major' | 'critical';

// Behavior Category
export interface BehaviorCategory {
  id: string;
  name: LocalizedText;
  code: string;
  type: BehaviorType;
  defaultPoints: number;
  severity: BehaviorSeverity;
  description: LocalizedText;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Behavior Incident Log
export interface BehaviorIncident {
  id: string;
  studentId: string;
  categoryId: string;
  type: BehaviorType;
  points: number;
  severity: BehaviorSeverity;
  description: LocalizedText;
  actionTaken?: LocalizedText;
  date: string;
  time: string;
  location?: string;
  reportedBy: string;
  witnessedBy?: string;
  parentNotified: boolean;
  parentNotifiedDate?: string;
  attachments?: string[];
  branchId: string;
  academicYearId: string;
  createdAt: string;
  updatedAt: string;
}

// Disciplinary Action
export interface DisciplinaryAction {
  id: string;
  name: LocalizedText;
  code: string;
  pointThreshold: number;
  actionType: 'warning' | 'letter' | 'suspension' | 'meeting' | 'expulsion';
  description: LocalizedText;
  templateAr?: string;
  templateEn?: string;
  durationDays?: number;
  requiresParentSignature: boolean;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Transport Zone
export interface TransportZone {
  id: string;
  name: LocalizedText;
  code: string;
  description: LocalizedText;
  monthlyFee: number;
  annualFee: number;
  currency: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Bus
export interface Bus {
  id: string;
  busNumber: string;
  plateNumber: string;
  capacity: number;
  model?: string;
  year?: number;
  driverName: LocalizedText;
  driverPhone: string;
  supervisorName?: LocalizedText;
  supervisorPhone?: string;
  zoneId: string;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Student Transport Assignment
export interface StudentTransport {
  id: string;
  studentId: string;
  busId: string;
  zoneId: string;
  academicYearId: string;
  pickupPoint?: LocalizedText;
  pickupTime?: string;
  dropoffTime?: string;
  direction: 'both' | 'to_school' | 'from_school';
  monthlyFee: number;
  branchId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== REPORT CARD & CERTIFICATES ==========

export type ReportCardSection = 'header' | 'studentInfo' | 'marksTable' | 'summary' | 'behaviorSummary' | 'attendanceSummary' | 'signature' | 'notes' | 'footer';

export interface ReportCardTemplate {
  id: string;
  name: LocalizedText;
  type: 'report_card' | 'certificate' | 'transcript';
  language: 'ar' | 'en' | 'both';
  sections: ReportCardSectionConfig[];
  schoolNameAr: string;
  schoolNameEn: string;
  logoUrl?: string;
  headerColor: string;
  showLogo: boolean;
  showWatermark: boolean;
  showBorder: boolean;
  principalNameAr: string;
  principalNameEn: string;
  signatureUrl?: string;
  footerTextAr: string;
  footerTextEn: string;
  branchId: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportCardSectionConfig {
  section: ReportCardSection;
  enabled: boolean;
  order: number;
  label?: LocalizedText;
}

// ========== ADMISSION PORTAL ==========

export type AdmissionStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'changes_requested' | 'enrolled';

export interface AdmissionApplication {
  id: string;
  applicationNumber: string;
  // Student Info
  studentFirstNameAr: string;
  studentFirstNameEn: string;
  studentLastNameAr: string;
  studentLastNameEn: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationality: string;
  nationalId?: string;
  previousSchool?: string;
  // Desired Grade
  desiredGradeId: string;
  desiredBranchId: string;
  academicYearId: string;
  // Parent Info
  parentFirstNameAr: string;
  parentFirstNameEn: string;
  parentLastNameAr: string;
  parentLastNameEn: string;
  parentPhone: string;
  parentPhone2?: string;
  parentEmail?: string;
  parentRelation: 'father' | 'mother' | 'guardian';
  parentNationalId?: string;
  parentOccupation?: string;
  address?: string;
  // Documents
  birthCertificateUploaded: boolean;
  photoUploaded: boolean;
  previousReportUploaded: boolean;
  nationalIdUploaded: boolean;
  // Health
  bloodType?: string;
  allergies?: string;
  medicalNotes?: string;
  // Status
  status: AdmissionStatus;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  enrolledStudentId?: string;
  // Timestamps
  submittedAt: string;
  updatedAt: string;
}
