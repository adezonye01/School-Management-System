import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Search, 
  Download,
  Users,
  AlertCircle,
  Save
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { useAcademicStore } from '../stores/academicStore';
import { useAttendanceStore } from '../stores/attendanceStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { AttendanceStatus, EnhancedStudent } from '../types/database';

interface StudentAttendance {
  student: EnhancedStudent;
  status: AttendanceStatus;
  notes: string;
  arrivalTime: string;
  existingRecordId?: string;
}

export const Attendance: React.FC = () => {
  const { t } = useTranslation();
  const { 
    students,
    getEducationLevelsByBranch,
    getGradesByEducationLevel,
    getSectionsByGrade,
    getEnhancedGradeById,
    getSectionById,
  } = useAcademicStore();
  const { 
    updateAttendanceRecord,
    getAttendanceByDate,
    bulkAddAttendance,
    getStudentAttendanceSummary,
  } = useAttendanceStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { user, hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEducationLevel, setSelectedEducationLevel] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Attendance data
  const [attendanceData, setAttendanceData] = useState<StudentAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Student details modal
  const [selectedStudent, setSelectedStudent] = useState<EnhancedStudent | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const canCreate = hasPermission('students', 'create');
  const canUpdate = hasPermission('students', 'update');
  const canExport = hasPermission('students', 'export');

  // Get options
  const educationLevels = currentBranch ? getEducationLevelsByBranch(currentBranch.id) : [];
  const levelOptions = [
    { value: '', label: t('common.selectOption') },
    ...educationLevels.map(l => ({ value: l.id, label: getLocalizedValue(l.name) }))
  ];
  
  const grades = selectedEducationLevel ? getGradesByEducationLevel(selectedEducationLevel) : [];
  const gradeOptions = [
    { value: '', label: t('common.selectOption') },
    ...grades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }))
  ];
  
  const sections = selectedGrade && currentAcademicYear 
    ? getSectionsByGrade(selectedGrade, currentAcademicYear.id) 
    : [];
  const sectionOptions = [
    { value: '', label: t('common.selectOption') },
    ...sections.map(s => ({ value: s.id, label: getLocalizedValue(s.name) }))
  ];

  // Load students when section is selected
  const loadAttendance = () => {
    if (!selectedSection || !currentAcademicYear || !currentBranch) return;

    setIsLoading(true);
    
    // Get students in this section
    const sectionStudents = students.filter(
      s => s.currentSectionId === selectedSection && 
           s.academicYearId === currentAcademicYear.id &&
           s.isActive &&
           s.status === 'active'
    );

    // Get existing attendance records for this date
    const existingRecords = getAttendanceByDate(selectedDate, selectedSection, currentAcademicYear.id);

    // Map students to attendance data
    const attendance: StudentAttendance[] = sectionStudents.map(student => {
      const existingRecord = existingRecords.find(r => r.studentId === student.id);
      return {
        student,
        status: existingRecord?.status || 'present',
        notes: existingRecord?.notes || '',
        arrivalTime: existingRecord?.arrivalTime || '',
        existingRecordId: existingRecord?.id,
      };
    });

    setAttendanceData(attendance);
    setIsLoading(false);
  };

  // Effect to load attendance when filters change
  React.useEffect(() => {
    if (selectedSection && selectedDate) {
      loadAttendance();
    } else {
      setAttendanceData([]);
    }
  }, [selectedSection, selectedDate, currentAcademicYear?.id]);

  // Filter students by search
  const filteredAttendance = useMemo(() => {
    if (!searchQuery) return attendanceData;
    
    const query = searchQuery.toLowerCase();
    return attendanceData.filter(({ student }) =>
      student.firstName.ar.toLowerCase().includes(query) ||
      student.firstName.en.toLowerCase().includes(query) ||
      student.lastName.ar.toLowerCase().includes(query) ||
      student.lastName.en.toLowerCase().includes(query) ||
      student.studentNumber.toLowerCase().includes(query)
    );
  }, [attendanceData, searchQuery]);

  // Update individual student attendance
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.student.id === studentId 
          ? { ...item, status }
          : item
      )
    );
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.student.id === studentId 
          ? { ...item, notes }
          : item
      )
    );
  };

  const handleArrivalTimeChange = (studentId: string, arrivalTime: string) => {
    setAttendanceData(prev => 
      prev.map(item => 
        item.student.id === studentId 
          ? { ...item, arrivalTime }
          : item
      )
    );
  };

  // Mark all students with a specific status
  const markAllAs = (status: AttendanceStatus) => {
    setAttendanceData(prev => 
      prev.map(item => ({ ...item, status }))
    );
  };

  // Save attendance
  const handleSaveAttendance = () => {
    if (!currentBranch || !currentAcademicYear || !user) {
      showToast('error', language === 'ar' ? 'يرجى اختيار الفرع والسنة الدراسية' : 'Please select branch and academic year');
      return;
    }

    const newRecords: Parameters<typeof bulkAddAttendance>[0] = [];
    
    attendanceData.forEach(({ student, status, notes, arrivalTime, existingRecordId }) => {
      if (existingRecordId) {
        // Update existing record
        updateAttendanceRecord(existingRecordId, {
          status,
          notes: notes || undefined,
          arrivalTime: arrivalTime || undefined,
        });
      } else {
        // Add new record
        newRecords.push({
          studentId: student.id,
          sectionId: selectedSection,
          gradeId: selectedGrade,
          academicYearId: currentAcademicYear.id,
          date: selectedDate,
          status,
          notes: notes || undefined,
          arrivalTime: arrivalTime || undefined,
          recordedBy: user.id,
          branchId: currentBranch.id,
        });
      }
    });

    if (newRecords.length > 0) {
      bulkAddAttendance(newRecords);
    }

    showToast('success', language === 'ar' ? 'تم حفظ الحضور بنجاح' : 'Attendance saved successfully');
    loadAttendance(); // Refresh to show updated data
  };

  // View student details
  const handleViewStudentDetails = (student: EnhancedStudent) => {
    setSelectedStudent(student);
    setIsDetailsModalOpen(true);
  };

  // Get student summary
  const getStudentSummary = (studentId: string) => {
    if (!currentAcademicYear) return null;
    return getStudentAttendanceSummary(studentId, currentAcademicYear.id);
  };

  // Export attendance
  const handleExport = () => {
    const grade = getEnhancedGradeById(selectedGrade);
    const section = getSectionById(selectedSection);
    
    const csvContent = [
      [
        language === 'ar' ? 'رقم الطالب' : 'Student Number',
        language === 'ar' ? 'الاسم' : 'Name',
        language === 'ar' ? 'الحالة' : 'Status',
        language === 'ar' ? 'وقت الوصول' : 'Arrival Time',
        language === 'ar' ? 'ملاحظات' : 'Notes',
      ].join(','),
      ...filteredAttendance.map(({ student, status, arrivalTime, notes }) => [
        student.studentNumber,
        `${getLocalizedValue(student.firstName)} ${getLocalizedValue(student.lastName)}`,
        status,
        arrivalTime || '-',
        notes || '-',
      ].join(',')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${grade?.code || 'grade'}-${section?.code || 'section'}-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      total: attendanceData.length,
      present: attendanceData.filter(a => a.status === 'present').length,
      absent: attendanceData.filter(a => a.status === 'absent').length,
      late: attendanceData.filter(a => a.status === 'late').length,
      excused: attendanceData.filter(a => a.status === 'excused').length,
      sick: attendanceData.filter(a => a.status === 'sick').length,
    };
    return stats;
  }, [attendanceData]);

  const statusOptions: { value: AttendanceStatus; label: string }[] = [
    { value: 'present', label: language === 'ar' ? 'حاضر' : 'Present' },
    { value: 'absent', label: language === 'ar' ? 'غائب' : 'Absent' },
    { value: 'late', label: language === 'ar' ? 'متأخر' : 'Late' },
    { value: 'excused', label: language === 'ar' ? 'عذر' : 'Excused' },
    { value: 'sick', label: language === 'ar' ? 'مريض' : 'Sick' },
  ];

  return (
    <div className="space-y-6">
      {/* Filters Card */}
      <Card>
        <CardHeader
          title={language === 'ar' ? 'الحضور والغياب' : 'Attendance'}
          subtitle={language === 'ar' ? 'تسجيل وإدارة حضور الطلاب اليومي' : 'Record and manage daily student attendance'}
          action={
            <div className="flex items-center gap-2">
              {canExport && selectedSection && (
                <Button variant="outline" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
                  {t('common.export')}
                </Button>
              )}
              {(canCreate || canUpdate) && attendanceData.length > 0 && (
                <Button onClick={handleSaveAttendance} leftIcon={<Save className="w-4 h-4" />}>
                  {language === 'ar' ? 'حفظ الحضور' : 'Save Attendance'}
                </Button>
              )}
            </div>
          }
        />

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            label={language === 'ar' ? 'التاريخ' : 'Date'}
            leftIcon={<Calendar className="w-5 h-5" />}
          />
          <Select
            value={selectedEducationLevel}
            onChange={(e) => {
              setSelectedEducationLevel(e.target.value);
              setSelectedGrade('');
              setSelectedSection('');
            }}
            options={levelOptions}
            label={language === 'ar' ? 'المرحلة التعليمية' : 'Education Level'}
          />
          <Select
            value={selectedGrade}
            onChange={(e) => {
              setSelectedGrade(e.target.value);
              setSelectedSection('');
            }}
            options={gradeOptions}
            label={language === 'ar' ? 'الصف' : 'Grade'}
            disabled={!selectedEducationLevel}
          />
          <Select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            options={sectionOptions}
            label={language === 'ar' ? 'الفصل' : 'Section'}
            disabled={!selectedGrade}
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            leftIcon={<Search className="w-5 h-5" />}
            label={language === 'ar' ? 'بحث' : 'Search'}
            disabled={!selectedSection}
          />
        </div>

        {/* Quick Actions */}
        {selectedSection && attendanceData.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 me-2">
              {language === 'ar' ? 'تعيين الكل:' : 'Mark all as:'}
            </span>
            <Button size="sm" variant="outline" onClick={() => markAllAs('present')}>
              <CheckCircle className="w-4 h-4 text-green-500 me-1" />
              {language === 'ar' ? 'حاضر' : 'Present'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => markAllAs('absent')}>
              <XCircle className="w-4 h-4 text-red-500 me-1" />
              {language === 'ar' ? 'غائب' : 'Absent'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => markAllAs('late')}>
              <Clock className="w-4 h-4 text-yellow-500 me-1" />
              {language === 'ar' ? 'متأخر' : 'Late'}
            </Button>
          </div>
        )}

        {/* Summary Stats */}
        {selectedSection && attendanceData.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{summaryStats.total}</p>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'إجمالي الطلاب' : 'Total Students'}</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{summaryStats.present}</p>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'حاضر' : 'Present'}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{summaryStats.absent}</p>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'غائب' : 'Absent'}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{summaryStats.late}</p>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'متأخر' : 'Late'}</p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{summaryStats.excused}</p>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'عذر' : 'Excused'}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-600">{summaryStats.sick}</p>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'مريض' : 'Sick'}</p>
            </div>
          </div>
        )}

        {/* Attendance Table */}
        {!selectedSection ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {language === 'ar' 
                ? 'يرجى اختيار المرحلة التعليمية والصف والفصل لعرض قائمة الطلاب' 
                : 'Please select education level, grade, and section to view students'}
            </p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">{t('common.loading')}</p>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {language === 'ar' ? 'لا يوجد طلاب في هذا الفصل' : 'No students in this section'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell isHeader>#</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'الطالب' : 'Student'}</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'الحالة' : 'Status'}</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'وقت الوصول' : 'Arrival Time'}</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'ملاحظات' : 'Notes'}</TableCell>
                <TableCell isHeader>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendance.map(({ student, status, notes, arrivalTime }, index) => (
                <TableRow key={student.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                        status === 'present' ? 'bg-green-500' :
                        status === 'absent' ? 'bg-red-500' :
                        status === 'late' ? 'bg-yellow-500' :
                        status === 'excused' ? 'bg-indigo-500' :
                        'bg-gray-500'
                      }`}>
                        {student.firstName.en.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {getLocalizedValue(student.firstName)} {getLocalizedValue(student.lastName)}
                        </p>
                        <p className="text-sm text-gray-500">{student.studentNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {statusOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleStatusChange(student.id, option.value)}
                          className={`px-2 py-1 text-xs rounded-md transition-all ${
                            status === option.value
                              ? option.value === 'present' ? 'bg-green-500 text-white' :
                                option.value === 'absent' ? 'bg-red-500 text-white' :
                                option.value === 'late' ? 'bg-yellow-500 text-white' :
                                option.value === 'excused' ? 'bg-indigo-500 text-white' :
                                'bg-gray-500 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="time"
                      value={arrivalTime}
                      onChange={(e) => handleArrivalTimeChange(student.id, e.target.value)}
                      className="w-28"
                      disabled={status === 'absent'}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={notes}
                      onChange={(e) => handleNotesChange(student.id, e.target.value)}
                      placeholder={language === 'ar' ? 'ملاحظات...' : 'Notes...'}
                      className="w-40"
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewStudentDetails(student)}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Student Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title={language === 'ar' ? 'تفاصيل حضور الطالب' : 'Student Attendance Details'}
        size="lg"
      >
        {selectedStudent && currentAcademicYear && (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                {selectedStudent.firstName.en.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {getLocalizedValue(selectedStudent.firstName)} {getLocalizedValue(selectedStudent.lastName)}
                </h3>
                <p className="text-gray-500">{selectedStudent.studentNumber}</p>
              </div>
            </div>

            {/* Attendance Summary */}
            {(() => {
              const summary = getStudentSummary(selectedStudent.id);
              if (!summary || summary.totalDays === 0) {
                return (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      {language === 'ar' ? 'لا توجد سجلات حضور لهذا الطالب' : 'No attendance records for this student'}
                    </p>
                  </div>
                );
              }

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">{summary.totalDays}</p>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي الأيام' : 'Total Days'}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">{summary.presentDays}</p>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'أيام الحضور' : 'Present Days'}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-red-600">{summary.absentDays}</p>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'أيام الغياب' : 'Absent Days'}</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-yellow-600">{summary.lateDays}</p>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'أيام التأخير' : 'Late Days'}</p>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-indigo-600">{summary.excusedDays}</p>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'أيام العذر' : 'Excused Days'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-gray-600">{summary.sickDays}</p>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'أيام المرض' : 'Sick Days'}</p>
                    </div>
                  </div>

                  {/* Attendance Rate */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">
                        {language === 'ar' ? 'نسبة الحضور' : 'Attendance Rate'}
                      </span>
                      <span className={`text-lg font-bold ${
                        summary.attendanceRate >= 90 ? 'text-green-600' :
                        summary.attendanceRate >= 75 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {summary.attendanceRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full transition-all ${
                          summary.attendanceRate >= 90 ? 'bg-green-500' :
                          summary.attendanceRate >= 75 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(summary.attendanceRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
};
