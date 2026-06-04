import type { 
  EducationLevel, 
  EnhancedGrade, 
  EnhancedSection,
  Subject,
  SubjectGradeMapping,
  GradeWeightDistribution,
  GradingScale,
  GradingScaleLevel,
  EnhancedStudent,
  ExamSeatingNumber
} from '../types/database';

// Default Education Levels
export const defaultEducationLevels: EducationLevel[] = [
  {
    id: 'level-kg',
    name: { ar: 'رياض الأطفال', en: 'Kindergarten' },
    code: 'KG',
    description: { ar: 'مرحلة رياض الأطفال', en: 'Kindergarten stage' },
    order: 1,
    branchId: 'branch-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'level-primary',
    name: { ar: 'المرحلة الابتدائية', en: 'Primary' },
    code: 'PRI',
    description: { ar: 'المرحلة الابتدائية من الصف الأول إلى السادس', en: 'Primary stage from Grade 1 to 6' },
    order: 2,
    branchId: 'branch-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'level-intermediate',
    name: { ar: 'المرحلة المتوسطة', en: 'Intermediate' },
    code: 'INT',
    description: { ar: 'المرحلة المتوسطة من الصف السابع إلى التاسع', en: 'Intermediate stage from Grade 7 to 9' },
    order: 3,
    branchId: 'branch-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'level-secondary',
    name: { ar: 'المرحلة الثانوية', en: 'Secondary' },
    code: 'SEC',
    description: { ar: 'المرحلة الثانوية من الصف العاشر إلى الثاني عشر', en: 'Secondary stage from Grade 10 to 12' },
    order: 4,
    branchId: 'branch-1',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Default Enhanced Grades
export const defaultEnhancedGrades: EnhancedGrade[] = [
  // Kindergarten
  { id: 'grade-kg1', educationLevelId: 'level-kg', name: { ar: 'روضة أولى', en: 'KG 1' }, code: 'KG1', order: 1, nextGradeId: 'grade-kg2', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-kg2', educationLevelId: 'level-kg', name: { ar: 'روضة ثانية', en: 'KG 2' }, code: 'KG2', order: 2, nextGradeId: 'grade-1', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Primary
  { id: 'grade-1', educationLevelId: 'level-primary', name: { ar: 'الصف الأول', en: 'Grade 1' }, code: 'G1', order: 3, nextGradeId: 'grade-2', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-2', educationLevelId: 'level-primary', name: { ar: 'الصف الثاني', en: 'Grade 2' }, code: 'G2', order: 4, nextGradeId: 'grade-3', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-3', educationLevelId: 'level-primary', name: { ar: 'الصف الثالث', en: 'Grade 3' }, code: 'G3', order: 5, nextGradeId: 'grade-4', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-4', educationLevelId: 'level-primary', name: { ar: 'الصف الرابع', en: 'Grade 4' }, code: 'G4', order: 6, nextGradeId: 'grade-5', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-5', educationLevelId: 'level-primary', name: { ar: 'الصف الخامس', en: 'Grade 5' }, code: 'G5', order: 7, nextGradeId: 'grade-6', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-6', educationLevelId: 'level-primary', name: { ar: 'الصف السادس', en: 'Grade 6' }, code: 'G6', order: 8, nextGradeId: 'grade-7', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Intermediate
  { id: 'grade-7', educationLevelId: 'level-intermediate', name: { ar: 'الصف السابع', en: 'Grade 7' }, code: 'G7', order: 9, nextGradeId: 'grade-8', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-8', educationLevelId: 'level-intermediate', name: { ar: 'الصف الثامن', en: 'Grade 8' }, code: 'G8', order: 10, nextGradeId: 'grade-9', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-9', educationLevelId: 'level-intermediate', name: { ar: 'الصف التاسع', en: 'Grade 9' }, code: 'G9', order: 11, nextGradeId: 'grade-10', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Secondary
  { id: 'grade-10', educationLevelId: 'level-secondary', name: { ar: 'الصف العاشر', en: 'Grade 10' }, code: 'G10', order: 12, nextGradeId: 'grade-11', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-11', educationLevelId: 'level-secondary', name: { ar: 'الصف الحادي عشر', en: 'Grade 11' }, code: 'G11', order: 13, nextGradeId: 'grade-12', branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'grade-12', educationLevelId: 'level-secondary', name: { ar: 'الصف الثاني عشر', en: 'Grade 12' }, code: 'G12', order: 14, nextGradeId: null, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Default Sections
export const defaultEnhancedSections: EnhancedSection[] = [
  { id: 'section-1a', gradeId: 'grade-1', academicYearId: 'year-2024-2025', name: { ar: 'شعبة أ', en: 'Section A' }, code: 'G1-A', capacity: 30, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'section-1b', gradeId: 'grade-1', academicYearId: 'year-2024-2025', name: { ar: 'شعبة ب', en: 'Section B' }, code: 'G1-B', capacity: 30, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'section-2a', gradeId: 'grade-2', academicYearId: 'year-2024-2025', name: { ar: 'شعبة أ', en: 'Section A' }, code: 'G2-A', capacity: 30, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'section-3a', gradeId: 'grade-3', academicYearId: 'year-2024-2025', name: { ar: 'شعبة أ', en: 'Section A' }, code: 'G3-A', capacity: 30, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'section-kg1a', gradeId: 'grade-kg1', academicYearId: 'year-2024-2025', name: { ar: 'شعبة أ', en: 'Section A' }, code: 'KG1-A', capacity: 25, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Default Subjects
export const defaultSubjects: Subject[] = [
  { id: 'subj-arabic', name: { ar: 'اللغة العربية', en: 'Arabic Language' }, code: 'ARA', description: { ar: 'مادة اللغة العربية', en: 'Arabic Language Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'subj-english', name: { ar: 'اللغة الإنجليزية', en: 'English Language' }, code: 'ENG', description: { ar: 'مادة اللغة الإنجليزية', en: 'English Language Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'subj-math', name: { ar: 'الرياضيات', en: 'Mathematics' }, code: 'MATH', description: { ar: 'مادة الرياضيات', en: 'Mathematics Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'subj-science', name: { ar: 'العلوم', en: 'Science' }, code: 'SCI', description: { ar: 'مادة العلوم', en: 'Science Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'subj-islamic', name: { ar: 'التربية الإسلامية', en: 'Islamic Studies' }, code: 'ISL', description: { ar: 'مادة التربية الإسلامية', en: 'Islamic Studies Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'subj-social', name: { ar: 'الدراسات الاجتماعية', en: 'Social Studies' }, code: 'SOC', description: { ar: 'مادة الدراسات الاجتماعية', en: 'Social Studies Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'subj-computer', name: { ar: 'الحاسب الآلي', en: 'Computer Science' }, code: 'CS', description: { ar: 'مادة الحاسب الآلي', en: 'Computer Science Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'subj-art', name: { ar: 'التربية الفنية', en: 'Art' }, code: 'ART', description: { ar: 'مادة التربية الفنية', en: 'Art Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'subj-pe', name: { ar: 'التربية البدنية', en: 'Physical Education' }, code: 'PE', description: { ar: 'مادة التربية البدنية', en: 'Physical Education Subject' }, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Default Subject-Grade Mappings
export const defaultSubjectGradeMappings: SubjectGradeMapping[] = [
  // Grade 1 Subjects
  { id: 'map-g1-arabic', subjectId: 'subj-arabic', gradeId: 'grade-1', academicYearId: 'year-2024-2025', maxMarks: 100, minPassingMarks: 50, creditHours: 6, isCore: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'map-g1-english', subjectId: 'subj-english', gradeId: 'grade-1', academicYearId: 'year-2024-2025', maxMarks: 100, minPassingMarks: 50, creditHours: 4, isCore: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'map-g1-math', subjectId: 'subj-math', gradeId: 'grade-1', academicYearId: 'year-2024-2025', maxMarks: 100, minPassingMarks: 50, creditHours: 5, isCore: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'map-g1-science', subjectId: 'subj-science', gradeId: 'grade-1', academicYearId: 'year-2024-2025', maxMarks: 100, minPassingMarks: 50, creditHours: 4, isCore: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'map-g1-islamic', subjectId: 'subj-islamic', gradeId: 'grade-1', academicYearId: 'year-2024-2025', maxMarks: 100, minPassingMarks: 50, creditHours: 3, isCore: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  // Grade 2 Subjects
  { id: 'map-g2-arabic', subjectId: 'subj-arabic', gradeId: 'grade-2', academicYearId: 'year-2024-2025', maxMarks: 100, minPassingMarks: 50, creditHours: 6, isCore: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'map-g2-english', subjectId: 'subj-english', gradeId: 'grade-2', academicYearId: 'year-2024-2025', maxMarks: 100, minPassingMarks: 50, creditHours: 4, isCore: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
  { id: 'map-g2-math', subjectId: 'subj-math', gradeId: 'grade-2', academicYearId: 'year-2024-2025', maxMarks: 100, minPassingMarks: 50, creditHours: 5, isCore: true, branchId: 'branch-1', isActive: true, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z' },
];

// Default Weight Distributions
export const defaultWeightDistributions: GradeWeightDistribution[] = [
  // Grade 1 Arabic
  { id: 'wd-g1-arabic-quiz', subjectGradeMappingId: 'map-g1-arabic', componentName: { ar: 'الاختبارات القصيرة', en: 'Quizzes' }, componentCode: 'QUIZ', weightPercentage: 20, maxMarks: 20, order: 1, isActive: true },
  { id: 'wd-g1-arabic-assign', subjectGradeMappingId: 'map-g1-arabic', componentName: { ar: 'الواجبات', en: 'Assignments' }, componentCode: 'ASSIGN', weightPercentage: 20, maxMarks: 20, order: 2, isActive: true },
  { id: 'wd-g1-arabic-midterm', subjectGradeMappingId: 'map-g1-arabic', componentName: { ar: 'اختبار منتصف الفصل', en: 'Midterm' }, componentCode: 'MID', weightPercentage: 20, maxMarks: 20, order: 3, isActive: true },
  { id: 'wd-g1-arabic-final', subjectGradeMappingId: 'map-g1-arabic', componentName: { ar: 'الاختبار النهائي', en: 'Final Exam' }, componentCode: 'FINAL', weightPercentage: 40, maxMarks: 40, order: 4, isActive: true },
  // Grade 1 Math
  { id: 'wd-g1-math-quiz', subjectGradeMappingId: 'map-g1-math', componentName: { ar: 'الاختبارات القصيرة', en: 'Quizzes' }, componentCode: 'QUIZ', weightPercentage: 15, maxMarks: 15, order: 1, isActive: true },
  { id: 'wd-g1-math-assign', subjectGradeMappingId: 'map-g1-math', componentName: { ar: 'الواجبات', en: 'Assignments' }, componentCode: 'ASSIGN', weightPercentage: 15, maxMarks: 15, order: 2, isActive: true },
  { id: 'wd-g1-math-midterm', subjectGradeMappingId: 'map-g1-math', componentName: { ar: 'اختبار منتصف الفصل', en: 'Midterm' }, componentCode: 'MID', weightPercentage: 30, maxMarks: 30, order: 3, isActive: true },
  { id: 'wd-g1-math-final', subjectGradeMappingId: 'map-g1-math', componentName: { ar: 'الاختبار النهائي', en: 'Final Exam' }, componentCode: 'FINAL', weightPercentage: 40, maxMarks: 40, order: 4, isActive: true },
];

// Default Grading Scales
export const defaultGradingScales: GradingScale[] = [
  {
    id: 'scale-numerical',
    name: { ar: 'سلم الدرجات الرقمي', en: 'Numerical Grading Scale' },
    branchId: 'branch-1',
    evaluationType: 'numerical',
    isDefault: true,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'scale-alphabetical',
    name: { ar: 'سلم الدرجات الحرفي', en: 'Alphabetical Grading Scale' },
    branchId: 'branch-1',
    evaluationType: 'alphabetical',
    isDefault: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'scale-kg-descriptive',
    name: { ar: 'سلم التقييم الوصفي - رياض الأطفال', en: 'Descriptive Scale - Kindergarten' },
    branchId: 'branch-1',
    gradeId: 'grade-kg1',
    evaluationType: 'descriptive',
    isDefault: false,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Default Grading Scale Levels
export const defaultGradingScaleLevels: GradingScaleLevel[] = [
  // Numerical Scale
  { id: 'level-num-a', gradingScaleId: 'scale-numerical', grade: { ar: 'ممتاز', en: 'Excellent' }, minPercentage: 90, maxPercentage: 100, gpa: 4.0, description: { ar: 'أداء ممتاز', en: 'Excellent performance' }, color: '#22c55e', order: 1 },
  { id: 'level-num-b', gradingScaleId: 'scale-numerical', grade: { ar: 'جيد جداً', en: 'Very Good' }, minPercentage: 80, maxPercentage: 89, gpa: 3.5, description: { ar: 'أداء جيد جداً', en: 'Very good performance' }, color: '#84cc16', order: 2 },
  { id: 'level-num-c', gradingScaleId: 'scale-numerical', grade: { ar: 'جيد', en: 'Good' }, minPercentage: 70, maxPercentage: 79, gpa: 3.0, description: { ar: 'أداء جيد', en: 'Good performance' }, color: '#eab308', order: 3 },
  { id: 'level-num-d', gradingScaleId: 'scale-numerical', grade: { ar: 'مقبول', en: 'Acceptable' }, minPercentage: 50, maxPercentage: 69, gpa: 2.0, description: { ar: 'أداء مقبول', en: 'Acceptable performance' }, color: '#f97316', order: 4 },
  { id: 'level-num-f', gradingScaleId: 'scale-numerical', grade: { ar: 'راسب', en: 'Fail' }, minPercentage: 0, maxPercentage: 49, gpa: 0, description: { ar: 'راسب', en: 'Failed' }, color: '#ef4444', order: 5 },
  // Alphabetical Scale
  { id: 'level-alpha-a', gradingScaleId: 'scale-alphabetical', grade: { ar: 'أ', en: 'A' }, minPercentage: 90, maxPercentage: 100, gpa: 4.0, description: { ar: 'ممتاز', en: 'Excellent' }, color: '#22c55e', order: 1 },
  { id: 'level-alpha-b', gradingScaleId: 'scale-alphabetical', grade: { ar: 'ب', en: 'B' }, minPercentage: 80, maxPercentage: 89, gpa: 3.0, description: { ar: 'جيد جداً', en: 'Very Good' }, color: '#84cc16', order: 2 },
  { id: 'level-alpha-c', gradingScaleId: 'scale-alphabetical', grade: { ar: 'ج', en: 'C' }, minPercentage: 70, maxPercentage: 79, gpa: 2.0, description: { ar: 'جيد', en: 'Good' }, color: '#eab308', order: 3 },
  { id: 'level-alpha-d', gradingScaleId: 'scale-alphabetical', grade: { ar: 'د', en: 'D' }, minPercentage: 50, maxPercentage: 69, gpa: 1.0, description: { ar: 'مقبول', en: 'Acceptable' }, color: '#f97316', order: 4 },
  { id: 'level-alpha-f', gradingScaleId: 'scale-alphabetical', grade: { ar: 'هـ', en: 'F' }, minPercentage: 0, maxPercentage: 49, gpa: 0, description: { ar: 'راسب', en: 'Fail' }, color: '#ef4444', order: 5 },
  // Descriptive Scale for KG
  { id: 'level-desc-exc', gradingScaleId: 'scale-kg-descriptive', grade: { ar: 'متميز', en: 'Outstanding' }, minPercentage: 90, maxPercentage: 100, description: { ar: 'أداء متميز', en: 'Outstanding performance' }, color: '#22c55e', order: 1 },
  { id: 'level-desc-prog', gradingScaleId: 'scale-kg-descriptive', grade: { ar: 'متقدم', en: 'Progressing' }, minPercentage: 70, maxPercentage: 89, description: { ar: 'يتقدم بشكل جيد', en: 'Progressing well' }, color: '#84cc16', order: 2 },
  { id: 'level-desc-dev', gradingScaleId: 'scale-kg-descriptive', grade: { ar: 'يتطور', en: 'Developing' }, minPercentage: 50, maxPercentage: 69, description: { ar: 'بحاجة إلى دعم', en: 'Needs support' }, color: '#eab308', order: 3 },
  { id: 'level-desc-need', gradingScaleId: 'scale-kg-descriptive', grade: { ar: 'بحاجة لمساعدة', en: 'Needs Assistance' }, minPercentage: 0, maxPercentage: 49, description: { ar: 'بحاجة إلى مساعدة إضافية', en: 'Needs additional assistance' }, color: '#f97316', order: 4 },
];

// Sample Students
export const defaultStudents: EnhancedStudent[] = [
  {
    id: 'student-1',
    studentNumber: 'STU-2024-001',
    firstName: { ar: 'محمد', en: 'Mohammed' },
    middleName: { ar: 'أحمد', en: 'Ahmed' },
    lastName: { ar: 'العلي', en: 'Al-Ali' },
    dateOfBirth: '2017-05-15',
    gender: 'male',
    nationalId: '1234567890',
    nationality: 'Saudi',
    branchId: 'branch-1',
    educationLevelId: 'level-primary',
    currentGradeId: 'grade-1',
    currentSectionId: 'section-1a',
    academicYearId: 'year-2024-2025',
    enrollmentDate: '2024-09-01',
    status: 'active',
    guardianName: { ar: 'أحمد العلي', en: 'Ahmed Al-Ali' },
    guardianPhone: '+966501234567',
    guardianEmail: 'ahmed.alali@email.com',
    address: { ar: 'الرياض - حي النخيل', en: 'Riyadh - Al Nakheel' },
    isActive: true,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'student-2',
    studentNumber: 'STU-2024-002',
    firstName: { ar: 'فاطمة', en: 'Fatima' },
    lastName: { ar: 'السالم', en: 'Al-Salem' },
    dateOfBirth: '2017-08-20',
    gender: 'female',
    nationalId: '1234567891',
    nationality: 'Saudi',
    branchId: 'branch-1',
    educationLevelId: 'level-primary',
    currentGradeId: 'grade-1',
    currentSectionId: 'section-1a',
    academicYearId: 'year-2024-2025',
    enrollmentDate: '2024-09-01',
    status: 'active',
    guardianName: { ar: 'سالم السالم', en: 'Salem Al-Salem' },
    guardianPhone: '+966507654321',
    isActive: true,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'student-3',
    studentNumber: 'STU-2024-003',
    firstName: { ar: 'عبدالله', en: 'Abdullah' },
    lastName: { ar: 'الخالد', en: 'Al-Khaled' },
    dateOfBirth: '2017-03-10',
    gender: 'male',
    nationalId: '1234567892',
    nationality: 'Saudi',
    branchId: 'branch-1',
    educationLevelId: 'level-primary',
    currentGradeId: 'grade-1',
    currentSectionId: 'section-1a',
    academicYearId: 'year-2024-2025',
    enrollmentDate: '2024-09-01',
    status: 'active',
    guardianName: { ar: 'خالد الخالد', en: 'Khaled Al-Khaled' },
    guardianPhone: '+966509876543',
    isActive: true,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'student-4',
    studentNumber: 'STU-2024-004',
    firstName: { ar: 'نورة', en: 'Noura' },
    lastName: { ar: 'المحمد', en: 'Al-Mohammed' },
    dateOfBirth: '2017-11-25',
    gender: 'female',
    nationalId: '1234567893',
    nationality: 'Saudi',
    branchId: 'branch-1',
    educationLevelId: 'level-primary',
    currentGradeId: 'grade-1',
    currentSectionId: 'section-1b',
    academicYearId: 'year-2024-2025',
    enrollmentDate: '2024-09-01',
    status: 'active',
    guardianName: { ar: 'محمد المحمد', en: 'Mohammed Al-Mohammed' },
    guardianPhone: '+966503456789',
    isActive: true,
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
  {
    id: 'student-5',
    studentNumber: 'STU-2024-005',
    firstName: { ar: 'سارة', en: 'Sara' },
    lastName: { ar: 'العمر', en: 'Al-Omar' },
    dateOfBirth: '2016-07-12',
    gender: 'female',
    nationalId: '1234567894',
    nationality: 'Saudi',
    branchId: 'branch-1',
    educationLevelId: 'level-primary',
    currentGradeId: 'grade-2',
    currentSectionId: 'section-2a',
    academicYearId: 'year-2024-2025',
    enrollmentDate: '2023-09-01',
    status: 'active',
    guardianName: { ar: 'عمر العمر', en: 'Omar Al-Omar' },
    guardianPhone: '+966502345678',
    isActive: true,
    createdAt: '2023-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
];

// Default Exam Seating Numbers
export const defaultExamSeatingNumbers: ExamSeatingNumber[] = [];
