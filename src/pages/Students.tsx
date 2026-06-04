import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Users, Search, Download } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { EnhancedStudent, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';

interface StudentFormData {
  studentNumber: string;
  firstNameAr: string;
  firstNameEn: string;
  lastNameAr: string;
  lastNameEn: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  nationalId: string;
  educationLevelId: string;
  gradeId: string;
  sectionId: string;
  enrollmentDate: string;
  guardianNameAr: string;
  guardianNameEn: string;
  guardianPhone: string;
  guardianEmail: string;
  status: EnhancedStudent['status'];
}

const initialFormData: StudentFormData = {
  studentNumber: '',
  firstNameAr: '',
  firstNameEn: '',
  lastNameAr: '',
  lastNameEn: '',
  dateOfBirth: '',
  gender: 'male',
  nationalId: '',
  educationLevelId: '',
  gradeId: '',
  sectionId: '',
  enrollmentDate: new Date().toISOString().split('T')[0],
  guardianNameAr: '',
  guardianNameEn: '',
  guardianPhone: '',
  guardianEmail: '',
  status: 'active',
};

export const Students: React.FC = () => {
  const { t } = useTranslation();
  const { 
    students,
    getEducationLevelsByBranch,
    getGradesByEducationLevel,
    getSectionsByGrade,
    getEnhancedGradeById,
    getSectionById,
    addStudent,
    updateStudent,
    deleteStudent,
  } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<EnhancedStudent | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(initialFormData);

  const canCreate = hasPermission('students', 'create');
  const canUpdate = hasPermission('students', 'update');
  const canDelete = hasPermission('students', 'delete');
  const canExport = hasPermission('students', 'export');

  const branchStudents = currentBranch && currentAcademicYear
    ? students.filter(s => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id)
    : [];

  const filteredStudents = branchStudents.filter((student) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      student.firstName.ar.toLowerCase().includes(query) ||
      student.firstName.en.toLowerCase().includes(query) ||
      student.lastName.ar.toLowerCase().includes(query) ||
      student.lastName.en.toLowerCase().includes(query) ||
      student.studentNumber.toLowerCase().includes(query);
    const matchesGrade = !filterGrade || student.currentGradeId === filterGrade;
    const matchesSection = !filterSection || student.currentSectionId === filterSection;
    const matchesStatus = !filterStatus || student.status === filterStatus;
    return matchesSearch && matchesGrade && matchesSection && matchesStatus;
  });

  const educationLevels = currentBranch ? getEducationLevelsByBranch(currentBranch.id) : [];
  const levelOptions = educationLevels.map(l => ({ value: l.id, label: getLocalizedValue(l.name) }));
  
  const grades = formData.educationLevelId ? getGradesByEducationLevel(formData.educationLevelId) : [];
  const gradeOptions = grades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }));
  
  const sections = formData.gradeId && currentAcademicYear ? getSectionsByGrade(formData.gradeId, currentAcademicYear.id) : [];
  const sectionOptions = sections.map(s => ({ value: s.id, label: getLocalizedValue(s.name) }));

  // Filter options
  const allGrades = currentBranch ? educationLevels.flatMap(l => getGradesByEducationLevel(l.id)) : [];
  const filterGradeOptions = [{ value: '', label: t('common.all') }, ...allGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }))];
  
  const filterSections = filterGrade && currentAcademicYear ? getSectionsByGrade(filterGrade, currentAcademicYear.id) : [];
  const filterSectionOptions = [{ value: '', label: t('common.all') }, ...filterSections.map(s => ({ value: s.id, label: getLocalizedValue(s.name) }))];

  const statusOptions = [
    { value: '', label: t('common.all') },
    { value: 'active', label: t('students.active') },
    { value: 'graduated', label: t('students.graduated') },
    { value: 'transferred', label: t('students.transferred') },
    { value: 'withdrawn', label: t('students.withdrawn') },
    { value: 'suspended', label: t('students.suspended') },
  ];

  const genderOptions = [
    { value: 'male', label: t('students.male') },
    { value: 'female', label: t('students.female') },
  ];

  const generateStudentNumber = () => {
    const year = new Date().getFullYear();
    const count = branchStudents.length + 1;
    return `STU-${year}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenModal = (student?: EnhancedStudent) => {
    if (student) {
      setSelectedStudent(student);
      setFormData({
        studentNumber: student.studentNumber,
        firstNameAr: student.firstName.ar,
        firstNameEn: student.firstName.en,
        lastNameAr: student.lastName.ar,
        lastNameEn: student.lastName.en,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        nationalId: student.nationalId || '',
        educationLevelId: student.educationLevelId,
        gradeId: student.currentGradeId,
        sectionId: student.currentSectionId,
        enrollmentDate: student.enrollmentDate,
        guardianNameAr: student.guardianName.ar,
        guardianNameEn: student.guardianName.en,
        guardianPhone: student.guardianPhone,
        guardianEmail: student.guardianEmail || '',
        status: student.status,
      });
    } else {
      setSelectedStudent(null);
      setFormData({
        ...initialFormData,
        studentNumber: generateStudentNumber(),
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentBranch || !currentAcademicYear) {
      showToast('error', language === 'ar' ? 'يرجى اختيار الفرع والسنة الدراسية' : 'Please select branch and academic year');
      return;
    }

    const firstName: LocalizedText = { ar: sanitizeInput(formData.firstNameAr), en: sanitizeInput(formData.firstNameEn) };
    const lastName: LocalizedText = { ar: sanitizeInput(formData.lastNameAr), en: sanitizeInput(formData.lastNameEn) };
    const guardianName: LocalizedText = { ar: sanitizeInput(formData.guardianNameAr), en: sanitizeInput(formData.guardianNameEn) };

    if (selectedStudent) {
      updateStudent(selectedStudent.id, {
        studentNumber: sanitizeInput(formData.studentNumber),
        firstName,
        lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationalId: sanitizeInput(formData.nationalId),
        educationLevelId: formData.educationLevelId,
        currentGradeId: formData.gradeId,
        currentSectionId: formData.sectionId,
        enrollmentDate: formData.enrollmentDate,
        guardianName,
        guardianPhone: sanitizeInput(formData.guardianPhone),
        guardianEmail: sanitizeInput(formData.guardianEmail),
        status: formData.status,
      });
      showToast('success', t('students.studentUpdated'));
    } else {
      addStudent({
        studentNumber: sanitizeInput(formData.studentNumber),
        firstName,
        lastName,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        nationalId: sanitizeInput(formData.nationalId),
        branchId: currentBranch.id,
        educationLevelId: formData.educationLevelId,
        currentGradeId: formData.gradeId,
        currentSectionId: formData.sectionId,
        academicYearId: currentAcademicYear.id,
        enrollmentDate: formData.enrollmentDate,
        guardianName,
        guardianPhone: sanitizeInput(formData.guardianPhone),
        guardianEmail: sanitizeInput(formData.guardianEmail),
        status: formData.status,
        isActive: true,
      });
      showToast('success', t('students.studentCreated'));
    }

    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedStudent) {
      deleteStudent(selectedStudent.id);
      showToast('success', t('students.studentDeleted'));
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleExport = () => {
    const csvContent = [
      [
        t('students.studentNumber'),
        t('students.firstName') + ' (AR)',
        t('students.firstName') + ' (EN)',
        t('students.lastName') + ' (AR)',
        t('students.lastName') + ' (EN)',
        t('students.grade'),
        t('students.section'),
        t('students.status'),
      ].join(','),
      ...filteredStudents.map((s) => {
        const grade = getEnhancedGradeById(s.currentGradeId);
        const section = getSectionById(s.currentSectionId);
        return [
          s.studentNumber,
          s.firstName.ar,
          s.firstName.en,
          s.lastName.ar,
          s.lastName.en,
          grade ? grade.name.ar : '',
          section ? section.name.ar : '',
          s.status,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
      active: 'success',
      graduated: 'info',
      transferred: 'warning',
      withdrawn: 'danger',
      suspended: 'danger',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('students.title')}
          subtitle={`${filteredStudents.length} ${language === 'ar' ? 'طالب' : 'students'}`}
          action={
            <div className="flex items-center gap-2">
              {canExport && (
                <Button variant="outline" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
                  {t('common.export')}
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
                  {t('students.addStudent')}
                </Button>
              )}
            </div>
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            leftIcon={<Search className="w-5 h-5" />}
          />
          <Select
            value={filterGrade}
            onChange={(e) => { setFilterGrade(e.target.value); setFilterSection(''); }}
            options={filterGradeOptions}
            placeholder={t('students.grade')}
          />
          <Select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            options={filterSectionOptions}
            placeholder={t('students.section')}
            disabled={!filterGrade}
          />
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={statusOptions}
            placeholder={t('students.status')}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>{t('students.studentNumber')}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'اسم الطالب' : 'Student Name'}</TableCell>
              <TableCell isHeader>{t('students.grade')}</TableCell>
              <TableCell isHeader>{t('students.section')}</TableCell>
              <TableCell isHeader>{t('students.guardianPhone')}</TableCell>
              <TableCell isHeader>{t('students.status')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={7}>
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => {
                const grade = getEnhancedGradeById(student.currentGradeId);
                const section = getSectionById(student.currentSectionId);

                return (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Badge>{student.studentNumber}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                          {student.firstName.en.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">
                            {getLocalizedValue(student.firstName)} {getLocalizedValue(student.lastName)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {student.gender === 'male' ? '♂' : '♀'} {student.dateOfBirth}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{grade ? getLocalizedValue(grade.name) : '-'}</TableCell>
                    <TableCell>{section ? getLocalizedValue(section.name) : '-'}</TableCell>
                    <TableCell>{student.guardianPhone}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(student.status)}>
                        {t(`students.${student.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {canUpdate && (
                          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(student)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedStudent(student); setIsDeleteModalOpen(true); }}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedStudent ? t('students.editStudent') : t('students.addStudent')}
        size="full"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pe-2">
          <Input
            label={t('students.studentNumber')}
            value={formData.studentNumber}
            onChange={(e) => setFormData({ ...formData, studentNumber: e.target.value })}
            required
            disabled={!!selectedStudent}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input label={`${t('students.firstName')} (${t('common.arabic')})`} value={formData.firstNameAr} onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })} dir="rtl" required />
            <Input label={`${t('students.firstName')} (${t('common.english')})`} value={formData.firstNameEn} onChange={(e) => setFormData({ ...formData, firstNameEn: e.target.value })} dir="ltr" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={`${t('students.lastName')} (${t('common.arabic')})`} value={formData.lastNameAr} onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })} dir="rtl" required />
            <Input label={`${t('students.lastName')} (${t('common.english')})`} value={formData.lastNameEn} onChange={(e) => setFormData({ ...formData, lastNameEn: e.target.value })} dir="ltr" required />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input label={t('students.dateOfBirth')} type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} required />
            <Select label={t('students.gender')} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })} options={genderOptions} required />
            <Input label={t('students.nationalId')} value={formData.nationalId} onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label={t('grades.educationLevel')}
              value={formData.educationLevelId}
              onChange={(e) => setFormData({ ...formData, educationLevelId: e.target.value, gradeId: '', sectionId: '' })}
              options={[{ value: '', label: t('common.selectOption') }, ...levelOptions]}
              required
            />
            <Select
              label={t('students.grade')}
              value={formData.gradeId}
              onChange={(e) => setFormData({ ...formData, gradeId: e.target.value, sectionId: '' })}
              options={[{ value: '', label: t('common.selectOption') }, ...gradeOptions]}
              disabled={!formData.educationLevelId}
              required
            />
            <Select
              label={t('students.section')}
              value={formData.sectionId}
              onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
              options={[{ value: '', label: t('common.selectOption') }, ...sectionOptions]}
              disabled={!formData.gradeId}
              required
            />
          </div>

          <Input label={t('students.enrollmentDate')} type="date" value={formData.enrollmentDate} onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })} required />

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">{language === 'ar' ? 'بيانات ولي الأمر' : 'Guardian Information'}</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label={`${t('students.guardianName')} (${t('common.arabic')})`} value={formData.guardianNameAr} onChange={(e) => setFormData({ ...formData, guardianNameAr: e.target.value })} dir="rtl" required />
              <Input label={`${t('students.guardianName')} (${t('common.english')})`} value={formData.guardianNameEn} onChange={(e) => setFormData({ ...formData, guardianNameEn: e.target.value })} dir="ltr" />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input label={t('students.guardianPhone')} value={formData.guardianPhone} onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })} required dir="ltr" />
              <Input label={t('students.guardianEmail')} type="email" value={formData.guardianEmail} onChange={(e) => setFormData({ ...formData, guardianEmail: e.target.value })} dir="ltr" />
            </div>
          </div>

          {selectedStudent && (
            <Select
              label={t('students.status')}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              options={statusOptions.slice(1)}
            />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-800">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>{t('common.cancel')}</Button>
            <Button type="submit">{selectedStudent ? t('common.update') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('common.confirm')}
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {language === 'ar' ? 'هل أنت متأكد من حذف هذا الطالب؟' : 'Are you sure you want to delete this student?'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
};
