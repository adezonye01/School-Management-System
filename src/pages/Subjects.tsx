import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, BookOpen, Search, Settings } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { Subject, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';

interface SubjectFormData {
  nameAr: string;
  nameEn: string;
  code: string;
  descriptionAr: string;
  descriptionEn: string;
}

const initialFormData: SubjectFormData = {
  nameAr: '',
  nameEn: '',
  code: '',
  descriptionAr: '',
  descriptionEn: '',
};

export const Subjects: React.FC = () => {
  const { t } = useTranslation();
  const { addSubject, updateSubject, deleteSubject, getSubjectsByBranch, getMappingsBySubject } = useAcademicStore();
  const { currentBranch } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>(initialFormData);

  const canCreate = hasPermission('subjects', 'create');
  const canUpdate = hasPermission('subjects', 'update');
  const canDelete = hasPermission('subjects', 'delete');

  const branchSubjects = currentBranch ? getSubjectsByBranch(currentBranch.id) : [];

  const filteredSubjects = branchSubjects.filter((subject) => {
    const query = searchQuery.toLowerCase();
    return (
      subject.name.ar.toLowerCase().includes(query) ||
      subject.name.en.toLowerCase().includes(query) ||
      subject.code.toLowerCase().includes(query)
    );
  });

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setSelectedSubject(subject);
      setFormData({
        nameAr: subject.name.ar,
        nameEn: subject.name.en,
        code: subject.code,
        descriptionAr: subject.description.ar,
        descriptionEn: subject.description.en,
      });
    } else {
      setSelectedSubject(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSubject(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentBranch) {
      showToast('error', t('branches.selectBranch'));
      return;
    }

    const name: LocalizedText = {
      ar: sanitizeInput(formData.nameAr),
      en: sanitizeInput(formData.nameEn),
    };

    const description: LocalizedText = {
      ar: sanitizeInput(formData.descriptionAr),
      en: sanitizeInput(formData.descriptionEn),
    };

    if (selectedSubject) {
      updateSubject(selectedSubject.id, {
        name,
        code: sanitizeInput(formData.code),
        description,
      });
      showToast('success', t('subjects.subjectUpdated'));
    } else {
      addSubject({
        name,
        code: sanitizeInput(formData.code),
        description,
        branchId: currentBranch.id,
        isActive: true,
      });
      showToast('success', t('subjects.subjectCreated'));
    }

    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedSubject) {
      deleteSubject(selectedSubject.id);
      showToast('success', t('subjects.subjectDeleted'));
      setIsDeleteModalOpen(false);
      setSelectedSubject(null);
    }
  };

  const getGradeCount = (subjectId: string) => {
    return getMappingsBySubject(subjectId).length;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('subjects.title')}
          subtitle={`${filteredSubjects.length} ${language === 'ar' ? 'مادة' : 'subjects'}`}
          action={
            canCreate && (
              <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
                {t('subjects.addSubject')}
              </Button>
            )
          }
        />

        {/* Search */}
        <div className="mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>{t('subjects.subjectName')}</TableCell>
              <TableCell isHeader>{t('subjects.subjectCode')}</TableCell>
              <TableCell isHeader>{t('subjects.description')}</TableCell>
              <TableCell isHeader>{t('subjects.assignToGrades')}</TableCell>
              <TableCell isHeader>{t('common.status')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getLocalizedValue(subject.name)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{subject.code}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {getLocalizedValue(subject.description)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">
                      {getGradeCount(subject.id)} {language === 'ar' ? 'صفوف' : 'grades'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={subject.isActive ? 'success' : 'danger'}>
                      {subject.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(subject)}
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = `/subject-mapping?subject=${subject.id}`}
                        title={t('subjectMapping.title')}
                      >
                        <Settings className="w-4 h-4 text-blue-500" />
                      </Button>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSubject(subject);
                            setIsDeleteModalOpen(true);
                          }}
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedSubject ? t('subjects.editSubject') : t('subjects.addSubject')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('subjects.subjectNameAr')}
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              required
              dir="rtl"
            />
            <Input
              label={t('subjects.subjectNameEn')}
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <Input
            label={t('subjects.subjectCode')}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            maxLength={10}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={`${t('subjects.description')} (${t('common.arabic')})`}
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              dir="rtl"
            />
            <Input
              label={`${t('subjects.description')} (${t('common.english')})`}
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              dir="ltr"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {selectedSubject ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t('common.confirm')}
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {language === 'ar'
            ? 'هل أنت متأكد من حذف هذه المادة؟'
            : 'Are you sure you want to delete this subject?'}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
