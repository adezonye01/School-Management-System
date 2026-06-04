import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Hash, RefreshCw, Download, Printer, Search, Pencil, Users } from 'lucide-react';
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
import type { ExamSeatingNumber } from '../types/database';

export const ExamSeating: React.FC = () => {
  const { t } = useTranslation();
  const { 
    getGradesByBranch,
    getSectionsByGrade,
    getStudentById,
    getEnhancedGradeById,
    getSectionById,
    getSeatingNumbers,
    generateSeatingNumbers,
    updateSeatingNumber,
    clearSeatingNumbers,
  } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [examPeriod, setExamPeriod] = useState('final');
  const [sortBy, setSortBy] = useState<'alphabeticalAr' | 'alphabeticalEn' | 'studentNumber' | 'random'>('alphabeticalAr');
  const [prefix, setPrefix] = useState('');
  const [startFrom, setStartFrom] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSeating, setSelectedSeating] = useState<ExamSeatingNumber | null>(null);
  const [editSeatingNumber, setEditSeatingNumber] = useState('');

  const canGenerate = hasPermission('students', 'update');

  const branchGrades = currentBranch ? getGradesByBranch(currentBranch.id) : [];
  const gradeSections = selectedGrade && currentAcademicYear 
    ? getSectionsByGrade(selectedGrade, currentAcademicYear.id) 
    : [];

  const gradeOptions = branchGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }));
  const sectionOptions = [
    { value: '', label: language === 'ar' ? 'جميع الفصول' : 'All Sections' },
    ...gradeSections.map(s => ({ value: s.id, label: getLocalizedValue(s.name) }))
  ];

  const examPeriodOptions = [
    { value: 'midterm-1', label: language === 'ar' ? 'منتصف الفصل الأول' : 'Midterm 1' },
    { value: 'midterm-2', label: language === 'ar' ? 'منتصف الفصل الثاني' : 'Midterm 2' },
    { value: 'final', label: language === 'ar' ? 'الاختبار النهائي' : 'Final Exam' },
  ];

  const sortByOptions = [
    { value: 'alphabeticalAr', label: t('examSeating.alphabeticalAr') },
    { value: 'alphabeticalEn', label: t('examSeating.alphabeticalEn') },
    { value: 'studentNumber', label: t('examSeating.studentNumber') },
    { value: 'random', label: t('examSeating.random') },
  ];

  const seatingNumbers = selectedGrade && currentAcademicYear
    ? getSeatingNumbers(selectedGrade, currentAcademicYear.id, examPeriod)
        .filter(sn => !selectedSection || sn.sectionId === selectedSection)
    : [];

  const filteredSeating = seatingNumbers.filter((sn) => {
    const student = getStudentById(sn.studentId);
    if (!student) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      student.firstName.ar.toLowerCase().includes(query) ||
      student.firstName.en.toLowerCase().includes(query) ||
      student.lastName.ar.toLowerCase().includes(query) ||
      student.lastName.en.toLowerCase().includes(query) ||
      student.studentNumber.toLowerCase().includes(query) ||
      sn.seatingNumber.toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    const numA = parseInt(a.seatingNumber.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.seatingNumber.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const handleGenerate = () => {
    if (!selectedGrade || !currentAcademicYear || !currentBranch) {
      showToast('error', language === 'ar' ? 'يرجى اختيار الصف' : 'Please select a grade');
      return;
    }

    generateSeatingNumbers(
      selectedGrade,
      selectedSection || null,
      currentAcademicYear.id,
      examPeriod,
      sortBy,
      prefix,
      startFrom,
      currentBranch.id
    );

    showToast('success', t('examSeating.generated'));
    setIsGenerateModalOpen(false);
  };

  const handleClear = () => {
    if (!selectedGrade || !currentAcademicYear) return;
    clearSeatingNumbers(selectedGrade, currentAcademicYear.id, examPeriod);
    showToast('success', t('common.success'));
  };

  const handleEditSeating = (seating: ExamSeatingNumber) => {
    setSelectedSeating(seating);
    setEditSeatingNumber(seating.seatingNumber);
    setIsEditModalOpen(true);
  };

  const handleSaveSeating = () => {
    if (selectedSeating && editSeatingNumber) {
      updateSeatingNumber(selectedSeating.id, editSeatingNumber);
      showToast('success', t('common.success'));
      setIsEditModalOpen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    const csvContent = [
      [
        language === 'ar' ? 'رقم الجلوس' : 'Seating Number',
        language === 'ar' ? 'رقم الطالب' : 'Student Number',
        language === 'ar' ? 'اسم الطالب (عربي)' : 'Student Name (Arabic)',
        language === 'ar' ? 'اسم الطالب (إنجليزي)' : 'Student Name (English)',
        language === 'ar' ? 'الصف' : 'Grade',
        language === 'ar' ? 'الفصل' : 'Section',
      ].join(','),
      ...filteredSeating.map((sn) => {
        const student = getStudentById(sn.studentId);
        const grade = getEnhancedGradeById(sn.gradeId);
        const section = getSectionById(sn.sectionId);
        return [
          sn.seatingNumber,
          student?.studentNumber || '',
          student ? `${student.firstName.ar} ${student.lastName.ar}` : '',
          student ? `${student.firstName.en} ${student.lastName.en}` : '',
          grade ? grade.name.ar : '',
          section ? section.name.ar : '',
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-seating-${examPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('examSeating.title')}
          subtitle={`${filteredSeating.length} ${language === 'ar' ? 'طالب' : 'students'}`}
          action={
            <div className="flex items-center gap-2">
              {canGenerate && (
                <Button 
                  onClick={() => setIsGenerateModalOpen(true)} 
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  {t('examSeating.generateNumbers')}
                </Button>
              )}
            </div>
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Select
            value={selectedGrade}
            onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSection(''); }}
            options={[{ value: '', label: t('common.selectOption') }, ...gradeOptions]}
            placeholder={t('examSeating.sortBy')}
            label={t('grades.gradeName')}
          />
          <Select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            options={sectionOptions}
            label={t('sections.sectionName')}
            disabled={!selectedGrade}
          />
          <Select
            value={examPeriod}
            onChange={(e) => setExamPeriod(e.target.value)}
            options={examPeriodOptions}
            label={t('examSeating.examPeriod')}
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            leftIcon={<Search className="w-5 h-5" />}
            label={t('common.search')}
          />
        </div>

        {/* Action Buttons */}
        {filteredSeating.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
              {t('examSeating.print')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} leftIcon={<Download className="w-4 h-4" />}>
              {t('examSeating.exportList')}
            </Button>
            {canGenerate && (
              <Button variant="outline" size="sm" onClick={handleClear} className="text-red-500">
                {language === 'ar' ? 'مسح الأرقام' : 'Clear Numbers'}
              </Button>
            )}
          </div>
        )}

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>{t('examSeating.seatingNumber')}</TableCell>
              <TableCell isHeader>{t('students.studentNumber')}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'اسم الطالب' : 'Student Name'}</TableCell>
              <TableCell isHeader>{t('grades.gradeName')}</TableCell>
              <TableCell isHeader>{t('sections.sectionName')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!selectedGrade ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{language === 'ar' ? 'يرجى اختيار الصف' : 'Please select a grade'}</p>
                </TableCell>
              </TableRow>
            ) : filteredSeating.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <Hash className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                  {canGenerate && (
                    <Button 
                      className="mt-4" 
                      onClick={() => setIsGenerateModalOpen(true)}
                      leftIcon={<RefreshCw className="w-4 h-4" />}
                    >
                      {t('examSeating.generateNumbers')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredSeating.map((sn) => {
                const student = getStudentById(sn.studentId);
                const grade = getEnhancedGradeById(sn.gradeId);
                const section = getSectionById(sn.sectionId);

                return (
                  <TableRow key={sn.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="info" size="md">
                          {sn.seatingNumber}
                        </Badge>
                        {sn.isManualOverride && (
                          <Badge variant="warning" size="sm">
                            {language === 'ar' ? 'يدوي' : 'Manual'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{student?.studentNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {student ? `${getLocalizedValue(student.firstName)} ${getLocalizedValue(student.lastName)}` : '-'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {student ? (language === 'ar' ? student.firstName.en : student.firstName.ar) : ''}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{grade ? getLocalizedValue(grade.name) : '-'}</TableCell>
                    <TableCell>{section ? getLocalizedValue(section.name) : '-'}</TableCell>
                    <TableCell>
                      {canGenerate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSeating(sn)}
                          title={t('examSeating.manualOverride')}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Generate Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title={t('examSeating.generateNumbers')}
        size="lg"
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {language === 'ar' 
                ? 'سيتم توليد أرقام جلوس جديدة للطلاب في الصف والفصل المحددين. سيتم استبدال أي أرقام موجودة.'
                : 'New seating numbers will be generated for students in the selected grade and section. Any existing numbers will be replaced.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('grades.gradeName')}
              value={selectedGrade}
              onChange={(e) => { setSelectedGrade(e.target.value); setSelectedSection(''); }}
              options={gradeOptions}
              required
            />
            <Select
              label={t('sections.sectionName')}
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              options={sectionOptions}
              disabled={!selectedGrade}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('examSeating.examPeriod')}
              value={examPeriod}
              onChange={(e) => setExamPeriod(e.target.value)}
              options={examPeriodOptions}
              required
            />
            <Select
              label={t('examSeating.sortBy')}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={sortByOptions}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('examSeating.prefix')}
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              placeholder="e.g., G1-, EX-"
            />
            <Input
              label={t('examSeating.startFrom')}
              type="number"
              value={startFrom}
              onChange={(e) => setStartFrom(parseInt(e.target.value) || 1)}
              min={1}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsGenerateModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleGenerate} leftIcon={<RefreshCw className="w-4 h-4" />}>
              {t('examSeating.generateNumbers')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('examSeating.manualOverride')}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={t('examSeating.seatingNumber')}
            value={editSeatingNumber}
            onChange={(e) => setEditSeatingNumber(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSaveSeating}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
