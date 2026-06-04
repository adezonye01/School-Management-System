import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
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
import {
  defaultEducationLevels,
  defaultEnhancedGrades,
  defaultEnhancedSections,
  defaultSubjects,
  defaultSubjectGradeMappings,
  defaultWeightDistributions,
  defaultGradingScales,
  defaultGradingScaleLevels,
  defaultStudents,
  defaultExamSeatingNumbers
} from '../data/academicData';

interface AcademicState {
  // Data
  educationLevels: EducationLevel[];
  enhancedGrades: EnhancedGrade[];
  sections: EnhancedSection[];
  subjects: Subject[];
  subjectGradeMappings: SubjectGradeMapping[];
  weightDistributions: GradeWeightDistribution[];
  gradingScales: GradingScale[];
  gradingScaleLevels: GradingScaleLevel[];
  students: EnhancedStudent[];
  examSeatingNumbers: ExamSeatingNumber[];

  // Education Level Actions
  addEducationLevel: (level: Omit<EducationLevel, 'id' | 'createdAt' | 'updatedAt'>) => EducationLevel;
  updateEducationLevel: (id: string, data: Partial<EducationLevel>) => void;
  deleteEducationLevel: (id: string) => void;
  getEducationLevelById: (id: string) => EducationLevel | undefined;
  getEducationLevelsByBranch: (branchId: string) => EducationLevel[];

  // Grade Actions
  addEnhancedGrade: (grade: Omit<EnhancedGrade, 'id' | 'createdAt' | 'updatedAt'>) => EnhancedGrade;
  updateEnhancedGrade: (id: string, data: Partial<EnhancedGrade>) => void;
  deleteEnhancedGrade: (id: string) => void;
  getEnhancedGradeById: (id: string) => EnhancedGrade | undefined;
  getGradesByEducationLevel: (levelId: string) => EnhancedGrade[];
  getGradesByBranch: (branchId: string) => EnhancedGrade[];

  // Section Actions
  addSection: (section: Omit<EnhancedSection, 'id' | 'createdAt' | 'updatedAt'>) => EnhancedSection;
  updateSection: (id: string, data: Partial<EnhancedSection>) => void;
  deleteSection: (id: string) => void;
  getSectionById: (id: string) => EnhancedSection | undefined;
  getSectionsByGrade: (gradeId: string, academicYearId: string) => EnhancedSection[];

  // Subject Actions
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => Subject;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  getSubjectById: (id: string) => Subject | undefined;
  getSubjectsByBranch: (branchId: string) => Subject[];

  // Subject-Grade Mapping Actions
  addSubjectGradeMapping: (mapping: Omit<SubjectGradeMapping, 'id' | 'createdAt' | 'updatedAt'>) => SubjectGradeMapping;
  updateSubjectGradeMapping: (id: string, data: Partial<SubjectGradeMapping>) => void;
  deleteSubjectGradeMapping: (id: string) => void;
  getMappingById: (id: string) => SubjectGradeMapping | undefined;
  getMappingsByGrade: (gradeId: string, academicYearId: string) => SubjectGradeMapping[];
  getMappingsBySubject: (subjectId: string) => SubjectGradeMapping[];

  // Weight Distribution Actions
  addWeightDistribution: (distribution: Omit<GradeWeightDistribution, 'id'>) => GradeWeightDistribution;
  updateWeightDistribution: (id: string, data: Partial<GradeWeightDistribution>) => void;
  deleteWeightDistribution: (id: string) => void;
  getWeightDistributionsByMapping: (mappingId: string) => GradeWeightDistribution[];

  // Grading Scale Actions
  addGradingScale: (scale: Omit<GradingScale, 'id' | 'createdAt' | 'updatedAt'>) => GradingScale;
  updateGradingScale: (id: string, data: Partial<GradingScale>) => void;
  deleteGradingScale: (id: string) => void;
  getGradingScaleById: (id: string) => GradingScale | undefined;
  getGradingScalesByBranch: (branchId: string) => GradingScale[];

  // Grading Scale Level Actions
  addGradingScaleLevel: (level: Omit<GradingScaleLevel, 'id'>) => GradingScaleLevel;
  updateGradingScaleLevel: (id: string, data: Partial<GradingScaleLevel>) => void;
  deleteGradingScaleLevel: (id: string) => void;
  getLevelsByScale: (scaleId: string) => GradingScaleLevel[];

  // Student Actions
  addStudent: (student: Omit<EnhancedStudent, 'id' | 'createdAt' | 'updatedAt'>) => EnhancedStudent;
  updateStudent: (id: string, data: Partial<EnhancedStudent>) => void;
  deleteStudent: (id: string) => void;
  getStudentById: (id: string) => EnhancedStudent | undefined;
  getStudentsBySection: (sectionId: string, academicYearId: string) => EnhancedStudent[];
  getStudentsByGrade: (gradeId: string, academicYearId: string) => EnhancedStudent[];

  // Exam Seating Actions
  generateSeatingNumbers: (
    gradeId: string,
    sectionId: string | null,
    academicYearId: string,
    examPeriod: string,
    sortBy: 'alphabeticalAr' | 'alphabeticalEn' | 'studentNumber' | 'random',
    prefix: string,
    startFrom: number,
    branchId: string
  ) => ExamSeatingNumber[];
  updateSeatingNumber: (id: string, seatingNumber: string) => void;
  getSeatingNumbers: (gradeId: string, academicYearId: string, examPeriod: string) => ExamSeatingNumber[];
  clearSeatingNumbers: (gradeId: string, academicYearId: string, examPeriod: string) => void;

  // Reset
  resetToDefaults: () => void;
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set, get) => ({
      educationLevels: defaultEducationLevels,
      enhancedGrades: defaultEnhancedGrades,
      sections: defaultEnhancedSections,
      subjects: defaultSubjects,
      subjectGradeMappings: defaultSubjectGradeMappings,
      weightDistributions: defaultWeightDistributions,
      gradingScales: defaultGradingScales,
      gradingScaleLevels: defaultGradingScaleLevels,
      students: defaultStudents,
      examSeatingNumbers: defaultExamSeatingNumbers,

      // Education Level Actions
      addEducationLevel: (levelData) => {
        const newLevel: EducationLevel = {
          ...levelData,
          id: `level-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ educationLevels: [...state.educationLevels, newLevel] }));
        return newLevel;
      },

      updateEducationLevel: (id, data) => {
        set((state) => ({
          educationLevels: state.educationLevels.map((level) =>
            level.id === id
              ? { ...level, ...data, updatedAt: new Date().toISOString() }
              : level
          ),
        }));
      },

      deleteEducationLevel: (id) => {
        set((state) => ({
          educationLevels: state.educationLevels.filter((level) => level.id !== id),
        }));
      },

      getEducationLevelById: (id) => get().educationLevels.find((level) => level.id === id),

      getEducationLevelsByBranch: (branchId) =>
        get().educationLevels.filter((level) => level.branchId === branchId).sort((a, b) => a.order - b.order),

      // Grade Actions
      addEnhancedGrade: (gradeData) => {
        const newGrade: EnhancedGrade = {
          ...gradeData,
          id: `grade-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ enhancedGrades: [...state.enhancedGrades, newGrade] }));
        return newGrade;
      },

      updateEnhancedGrade: (id, data) => {
        set((state) => ({
          enhancedGrades: state.enhancedGrades.map((grade) =>
            grade.id === id
              ? { ...grade, ...data, updatedAt: new Date().toISOString() }
              : grade
          ),
        }));
      },

      deleteEnhancedGrade: (id) => {
        set((state) => ({
          enhancedGrades: state.enhancedGrades.filter((grade) => grade.id !== id),
        }));
      },

      getEnhancedGradeById: (id) => get().enhancedGrades.find((grade) => grade.id === id),

      getGradesByEducationLevel: (levelId) =>
        get().enhancedGrades.filter((grade) => grade.educationLevelId === levelId).sort((a, b) => a.order - b.order),

      getGradesByBranch: (branchId) =>
        get().enhancedGrades.filter((grade) => grade.branchId === branchId).sort((a, b) => a.order - b.order),

      // Section Actions
      addSection: (sectionData) => {
        const newSection: EnhancedSection = {
          ...sectionData,
          id: `section-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ sections: [...state.sections, newSection] }));
        return newSection;
      },

      updateSection: (id, data) => {
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === id
              ? { ...section, ...data, updatedAt: new Date().toISOString() }
              : section
          ),
        }));
      },

      deleteSection: (id) => {
        set((state) => ({
          sections: state.sections.filter((section) => section.id !== id),
        }));
      },

      getSectionById: (id) => get().sections.find((section) => section.id === id),

      getSectionsByGrade: (gradeId, academicYearId) =>
        get().sections.filter(
          (section) => section.gradeId === gradeId && section.academicYearId === academicYearId
        ),

      // Subject Actions
      addSubject: (subjectData) => {
        const newSubject: Subject = {
          ...subjectData,
          id: `subj-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ subjects: [...state.subjects, newSubject] }));
        return newSubject;
      },

      updateSubject: (id, data) => {
        set((state) => ({
          subjects: state.subjects.map((subject) =>
            subject.id === id
              ? { ...subject, ...data, updatedAt: new Date().toISOString() }
              : subject
          ),
        }));
      },

      deleteSubject: (id) => {
        set((state) => ({
          subjects: state.subjects.filter((subject) => subject.id !== id),
        }));
      },

      getSubjectById: (id) => get().subjects.find((subject) => subject.id === id),

      getSubjectsByBranch: (branchId) =>
        get().subjects.filter((subject) => subject.branchId === branchId),

      // Subject-Grade Mapping Actions
      addSubjectGradeMapping: (mappingData) => {
        const newMapping: SubjectGradeMapping = {
          ...mappingData,
          id: `map-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ subjectGradeMappings: [...state.subjectGradeMappings, newMapping] }));
        return newMapping;
      },

      updateSubjectGradeMapping: (id, data) => {
        set((state) => ({
          subjectGradeMappings: state.subjectGradeMappings.map((mapping) =>
            mapping.id === id
              ? { ...mapping, ...data, updatedAt: new Date().toISOString() }
              : mapping
          ),
        }));
      },

      deleteSubjectGradeMapping: (id) => {
        set((state) => ({
          subjectGradeMappings: state.subjectGradeMappings.filter((mapping) => mapping.id !== id),
          // Also delete related weight distributions
          weightDistributions: state.weightDistributions.filter(
            (wd) => wd.subjectGradeMappingId !== id
          ),
        }));
      },

      getMappingById: (id) => get().subjectGradeMappings.find((mapping) => mapping.id === id),

      getMappingsByGrade: (gradeId, academicYearId) =>
        get().subjectGradeMappings.filter(
          (mapping) => mapping.gradeId === gradeId && mapping.academicYearId === academicYearId
        ),

      getMappingsBySubject: (subjectId) =>
        get().subjectGradeMappings.filter((mapping) => mapping.subjectId === subjectId),

      // Weight Distribution Actions
      addWeightDistribution: (distributionData) => {
        const newDistribution: GradeWeightDistribution = {
          ...distributionData,
          id: `wd-${uuidv4()}`,
        };
        set((state) => ({ weightDistributions: [...state.weightDistributions, newDistribution] }));
        return newDistribution;
      },

      updateWeightDistribution: (id, data) => {
        set((state) => ({
          weightDistributions: state.weightDistributions.map((wd) =>
            wd.id === id ? { ...wd, ...data } : wd
          ),
        }));
      },

      deleteWeightDistribution: (id) => {
        set((state) => ({
          weightDistributions: state.weightDistributions.filter((wd) => wd.id !== id),
        }));
      },

      getWeightDistributionsByMapping: (mappingId) =>
        get().weightDistributions
          .filter((wd) => wd.subjectGradeMappingId === mappingId)
          .sort((a, b) => a.order - b.order),

      // Grading Scale Actions
      addGradingScale: (scaleData) => {
        const newScale: GradingScale = {
          ...scaleData,
          id: `scale-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ gradingScales: [...state.gradingScales, newScale] }));
        return newScale;
      },

      updateGradingScale: (id, data) => {
        set((state) => ({
          gradingScales: state.gradingScales.map((scale) =>
            scale.id === id
              ? { ...scale, ...data, updatedAt: new Date().toISOString() }
              : scale
          ),
        }));
      },

      deleteGradingScale: (id) => {
        set((state) => ({
          gradingScales: state.gradingScales.filter((scale) => scale.id !== id),
          gradingScaleLevels: state.gradingScaleLevels.filter((level) => level.gradingScaleId !== id),
        }));
      },

      getGradingScaleById: (id) => get().gradingScales.find((scale) => scale.id === id),

      getGradingScalesByBranch: (branchId) =>
        get().gradingScales.filter((scale) => scale.branchId === branchId),

      // Grading Scale Level Actions
      addGradingScaleLevel: (levelData) => {
        const newLevel: GradingScaleLevel = {
          ...levelData,
          id: `level-${uuidv4()}`,
        };
        set((state) => ({ gradingScaleLevels: [...state.gradingScaleLevels, newLevel] }));
        return newLevel;
      },

      updateGradingScaleLevel: (id, data) => {
        set((state) => ({
          gradingScaleLevels: state.gradingScaleLevels.map((level) =>
            level.id === id ? { ...level, ...data } : level
          ),
        }));
      },

      deleteGradingScaleLevel: (id) => {
        set((state) => ({
          gradingScaleLevels: state.gradingScaleLevels.filter((level) => level.id !== id),
        }));
      },

      getLevelsByScale: (scaleId) =>
        get().gradingScaleLevels
          .filter((level) => level.gradingScaleId === scaleId)
          .sort((a, b) => a.order - b.order),

      // Student Actions
      addStudent: (studentData) => {
        const newStudent: EnhancedStudent = {
          ...studentData,
          id: `student-${uuidv4()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ students: [...state.students, newStudent] }));
        return newStudent;
      },

      updateStudent: (id, data) => {
        set((state) => ({
          students: state.students.map((student) =>
            student.id === id
              ? { ...student, ...data, updatedAt: new Date().toISOString() }
              : student
          ),
        }));
      },

      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((student) => student.id !== id),
        }));
      },

      getStudentById: (id) => get().students.find((student) => student.id === id),

      getStudentsBySection: (sectionId, academicYearId) =>
        get().students.filter(
          (student) =>
            student.currentSectionId === sectionId &&
            student.academicYearId === academicYearId &&
            student.isActive
        ),

      getStudentsByGrade: (gradeId, academicYearId) =>
        get().students.filter(
          (student) =>
            student.currentGradeId === gradeId &&
            student.academicYearId === academicYearId &&
            student.isActive
        ),

      // Exam Seating Actions
      generateSeatingNumbers: (gradeId, sectionId, academicYearId, examPeriod, sortBy, prefix, startFrom, branchId) => {
        const state = get();
        
        // Get students
        let students = sectionId
          ? state.getStudentsBySection(sectionId, academicYearId)
          : state.getStudentsByGrade(gradeId, academicYearId);

        // Sort students
        switch (sortBy) {
          case 'alphabeticalAr':
            students = students.sort((a, b) => 
              (a.firstName.ar + a.lastName.ar).localeCompare(b.firstName.ar + b.lastName.ar, 'ar')
            );
            break;
          case 'alphabeticalEn':
            students = students.sort((a, b) =>
              (a.firstName.en + a.lastName.en).localeCompare(b.firstName.en + b.lastName.en, 'en')
            );
            break;
          case 'studentNumber':
            students = students.sort((a, b) => a.studentNumber.localeCompare(b.studentNumber));
            break;
          case 'random':
            students = students.sort(() => Math.random() - 0.5);
            break;
        }

        // Generate seating numbers
        const seatingNumbers: ExamSeatingNumber[] = students.map((student, index) => ({
          id: `seat-${uuidv4()}`,
          studentId: student.id,
          academicYearId,
          gradeId,
          sectionId: student.currentSectionId,
          seatingNumber: `${prefix}${String(startFrom + index).padStart(3, '0')}`,
          examPeriod,
          generatedAt: new Date().toISOString(),
          isManualOverride: false,
          branchId,
        }));

        // Remove old seating numbers for this exam period
        set((state) => ({
          examSeatingNumbers: [
            ...state.examSeatingNumbers.filter(
              (sn) =>
                !(sn.gradeId === gradeId &&
                  sn.academicYearId === academicYearId &&
                  sn.examPeriod === examPeriod &&
                  (sectionId ? sn.sectionId === sectionId : true))
            ),
            ...seatingNumbers,
          ],
        }));

        return seatingNumbers;
      },

      updateSeatingNumber: (id, seatingNumber) => {
        set((state) => ({
          examSeatingNumbers: state.examSeatingNumbers.map((sn) =>
            sn.id === id
              ? { ...sn, seatingNumber, isManualOverride: true }
              : sn
          ),
        }));
      },

      getSeatingNumbers: (gradeId, academicYearId, examPeriod) =>
        get().examSeatingNumbers.filter(
          (sn) =>
            sn.gradeId === gradeId &&
            sn.academicYearId === academicYearId &&
            sn.examPeriod === examPeriod
        ),

      clearSeatingNumbers: (gradeId, academicYearId, examPeriod) => {
        set((state) => ({
          examSeatingNumbers: state.examSeatingNumbers.filter(
            (sn) =>
              !(sn.gradeId === gradeId &&
                sn.academicYearId === academicYearId &&
                sn.examPeriod === examPeriod)
          ),
        }));
      },

      // Reset
      resetToDefaults: () => {
        set({
          educationLevels: defaultEducationLevels,
          enhancedGrades: defaultEnhancedGrades,
          sections: defaultEnhancedSections,
          subjects: defaultSubjects,
          subjectGradeMappings: defaultSubjectGradeMappings,
          weightDistributions: defaultWeightDistributions,
          gradingScales: defaultGradingScales,
          gradingScaleLevels: defaultGradingScaleLevels,
          students: defaultStudents,
          examSeatingNumbers: defaultExamSeatingNumbers,
        });
      },
    }),
    {
      name: 'academic-data-storage',
    }
  )
);
