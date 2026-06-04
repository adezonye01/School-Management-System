import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Eye, CheckCircle, XCircle, MessageSquare,
  Clock, UserPlus, FileText, AlertCircle
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useAdmissionStore } from '../stores/admissionStore';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { AdmissionApplication, AdmissionStatus } from '../types/database';
import clsx from 'clsx';

export const AdmissionReview: React.FC = () => {
  const { t } = useTranslation();
  const { getApplicationsByBranch, approveApplication, rejectApplication, requestChanges, updateApplication } = useAdmissionStore();
  const { getEnhancedGradeById, addStudent, getEducationLevelsByBranch, getSectionsByGrade } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { user } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'changes'>('approve');
  const [actionNotes, setActionNotes] = useState('');
  const [enrollSectionId, setEnrollSectionId] = useState('');

  const isAr = language === 'ar';
  const applications = currentBranch ? getApplicationsByBranch(currentBranch.id) : [];

  const filtered = applications.filter(app => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || app.applicationNumber.toLowerCase().includes(q) ||
      app.studentFirstNameAr.includes(q) || app.studentFirstNameEn.toLowerCase().includes(q) ||
      app.parentPhone.includes(q);
    const matchStatus = !filterStatus || app.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusOptions: { value: string; label: string }[] = [
    { value: '', label: t('common.all') },
    { value: 'pending', label: isAr ? '⏳ قيد الانتظار' : '⏳ Pending' },
    { value: 'under_review', label: isAr ? '🔍 قيد المراجعة' : '🔍 Under Review' },
    { value: 'approved', label: isAr ? '✅ مقبول' : '✅ Approved' },
    { value: 'rejected', label: isAr ? '❌ مرفوض' : '❌ Rejected' },
    { value: 'changes_requested', label: isAr ? '📝 بحاجة لتعديل' : '📝 Changes Needed' },
    { value: 'enrolled', label: isAr ? '🎓 مُسجّل' : '🎓 Enrolled' },
  ];

  const getStatusBadge = (status: AdmissionStatus) => {
    const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
      pending: { variant: 'warning', label: isAr ? 'قيد الانتظار' : 'Pending' },
      under_review: { variant: 'info', label: isAr ? 'قيد المراجعة' : 'Under Review' },
      approved: { variant: 'success', label: isAr ? 'مقبول' : 'Approved' },
      rejected: { variant: 'danger', label: isAr ? 'مرفوض' : 'Rejected' },
      changes_requested: { variant: 'warning', label: isAr ? 'بحاجة لتعديل' : 'Changes Needed' },
      enrolled: { variant: 'success', label: isAr ? 'مُسجّل' : 'Enrolled' },
    };
    const m = map[status] || map.pending;
    return <Badge variant={m.variant}>{m.label}</Badge>;
  };

  // Stats
  const pending = applications.filter(a => a.status === 'pending').length;
  const underReview = applications.filter(a => a.status === 'under_review').length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const enrolled = applications.filter(a => a.status === 'enrolled').length;

  const openDetail = (app: AdmissionApplication) => { setSelectedApp(app); setIsDetailOpen(true); };

  const openAction = (app: AdmissionApplication, type: 'approve' | 'reject' | 'changes') => {
    setSelectedApp(app); setActionType(type); setActionNotes(''); setEnrollSectionId('');
    setIsActionOpen(true);
  };

  const handleAction = () => {
    if (!selectedApp || !user) return;

    if (actionType === 'approve') {
      approveApplication(selectedApp.id, user.id);
      showToast('success', isAr ? 'تم قبول الطلب' : 'Application approved');
    } else if (actionType === 'reject') {
      rejectApplication(selectedApp.id, user.id, actionNotes);
      showToast('success', isAr ? 'تم رفض الطلب' : 'Application rejected');
    } else {
      requestChanges(selectedApp.id, user.id, actionNotes);
      showToast('success', isAr ? 'تم طلب تعديلات' : 'Changes requested');
    }
    setIsActionOpen(false);
    setIsDetailOpen(false);
  };

  // Enroll approved student
  const handleEnroll = (app: AdmissionApplication) => {
    if (!currentAcademicYear || !enrollSectionId) return;

    const grade = getEnhancedGradeById(app.desiredGradeId);
    const levels = currentBranch ? getEducationLevelsByBranch(currentBranch.id) : [];
    const levelId = grade ? grade.educationLevelId : levels[0]?.id || '';

    const student = addStudent({
      studentNumber: `STU-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      firstName: { ar: app.studentFirstNameAr, en: app.studentFirstNameEn },
      lastName: { ar: app.studentLastNameAr, en: app.studentLastNameEn },
      dateOfBirth: app.dateOfBirth,
      gender: app.gender,
      nationalId: app.nationalId,
      branchId: app.desiredBranchId,
      educationLevelId: levelId,
      currentGradeId: app.desiredGradeId,
      currentSectionId: enrollSectionId,
      academicYearId: currentAcademicYear.id,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'active',
      guardianName: { ar: `${app.parentFirstNameAr} ${app.parentLastNameAr}`, en: `${app.parentFirstNameEn} ${app.parentLastNameEn}` },
      guardianPhone: app.parentPhone,
      guardianEmail: app.parentEmail,
      address: app.address ? { ar: app.address, en: app.address } : undefined,
      medicalNotes: [app.bloodType, app.allergies, app.medicalNotes].filter(Boolean).join(' | ') || undefined,
      isActive: true,
    });

    updateApplication(app.id, { status: 'enrolled', enrolledStudentId: student.id });
    showToast('success', isAr ? `تم تسجيل الطالب ${app.studentFirstNameAr} بنجاح!` : `Student ${app.studentFirstNameEn} enrolled!`);
    setIsActionOpen(false);
    setIsDetailOpen(false);
  };

  const enrollSections = selectedApp ? getSectionsByGrade(selectedApp.desiredGradeId, currentAcademicYear?.id || '') : [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-600" /></div><div><p className="text-2xl font-bold text-yellow-600">{pending}</p><p className="text-xs text-gray-500">{isAr ? 'قيد الانتظار' : 'Pending'}</p></div></div></Card>
        <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><Search className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold text-blue-600">{underReview}</p><p className="text-xs text-gray-500">{isAr ? 'قيد المراجعة' : 'Under Review'}</p></div></div></Card>
        <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold text-green-600">{approved}</p><p className="text-xs text-gray-500">{isAr ? 'مقبول' : 'Approved'}</p></div></div></Card>
        <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><UserPlus className="w-5 h-5 text-purple-600" /></div><div><p className="text-2xl font-bold text-purple-600">{enrolled}</p><p className="text-xs text-gray-500">{isAr ? 'مُسجّل' : 'Enrolled'}</p></div></div></Card>
      </div>

      <Card>
        <CardHeader title={isAr ? 'إدارة طلبات القبول' : 'Admission Applications'} subtitle={`${filtered.length} ${isAr ? 'طلب' : 'applications'}`} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t('common.search')} leftIcon={<Search className="w-5 h-5" />} />
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={statusOptions} />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12"><FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{t('common.noData')}</p></div>
          ) : filtered.map(app => {
            const grade = getEnhancedGradeById(app.desiredGradeId);
            return (
              <div key={app.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                      {app.studentFirstNameEn.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{isAr ? `${app.studentFirstNameAr} ${app.studentLastNameAr}` : `${app.studentFirstNameEn} ${app.studentLastNameEn}`}</span>
                        {getStatusBadge(app.status)}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="font-mono">{app.applicationNumber}</span>
                        <span>{grade ? getLocalizedValue(grade.name) : '-'}</span>
                        <span>{app.parentPhone}</span>
                        <span>{new Date(app.submittedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(app)}><Eye className="w-4 h-4" /></Button>
                    {(app.status === 'pending' || app.status === 'under_review') && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openAction(app, 'approve')} className="text-green-600"><CheckCircle className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openAction(app, 'changes')} className="text-yellow-600"><MessageSquare className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openAction(app, 'reject')} className="text-red-600"><XCircle className="w-4 h-4" /></Button>
                      </>
                    )}
                    {app.status === 'approved' && (
                      <Button size="sm" onClick={() => { setSelectedApp(app); setActionType('approve'); setEnrollSectionId(''); setIsActionOpen(true); }} leftIcon={<UserPlus className="w-3.5 h-3.5" />} className="bg-purple-600 hover:bg-purple-700">
                        {isAr ? 'تسجيل' : 'Enroll'}
                      </Button>
                    )}
                  </div>
                </div>
                {app.reviewNotes && (app.status === 'rejected' || app.status === 'changes_requested') && (
                  <div className={clsx('mt-3 p-3 rounded-lg text-sm', app.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700')}>
                    <span className="font-medium">{isAr ? 'ملاحظات:' : 'Notes:'}</span> {app.reviewNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title={`📋 ${selectedApp?.applicationNumber || ''}`} size="full">
        {selectedApp && (() => {
          const grade = getEnhancedGradeById(selectedApp.desiredGradeId);
          return (
            <div className="space-y-5 max-h-[75vh] overflow-y-auto pe-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">{selectedApp.studentFirstNameEn.charAt(0)}</div>
                  <div>
                    <h2 className="text-xl font-bold">{isAr ? `${selectedApp.studentFirstNameAr} ${selectedApp.studentLastNameAr}` : `${selectedApp.studentFirstNameEn} ${selectedApp.studentLastNameEn}`}</h2>
                    <p className="text-gray-500">{selectedApp.applicationNumber}</p>
                  </div>
                </div>
                {getStatusBadge(selectedApp.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl">
                  <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-3">{isAr ? '👨‍🎓 الطالب' : '👨‍🎓 Student'}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">{isAr ? 'الاسم (عربي)' : 'Name (AR)'}</span><p className="font-medium">{selectedApp.studentFirstNameAr} {selectedApp.studentLastNameAr}</p></div>
                    <div><span className="text-gray-500">{isAr ? 'الاسم (إنجليزي)' : 'Name (EN)'}</span><p className="font-medium">{selectedApp.studentFirstNameEn} {selectedApp.studentLastNameEn}</p></div>
                    <div><span className="text-gray-500">{isAr ? 'الميلاد' : 'DOB'}</span><p className="font-medium">{selectedApp.dateOfBirth}</p></div>
                    <div><span className="text-gray-500">{isAr ? 'الجنس' : 'Gender'}</span><p className="font-medium">{selectedApp.gender === 'male' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')}</p></div>
                    <div><span className="text-gray-500">{isAr ? 'الجنسية' : 'Nationality'}</span><p className="font-medium">{selectedApp.nationality || '-'}</p></div>
                    <div><span className="text-gray-500">{isAr ? 'الصف المطلوب' : 'Grade'}</span><p className="font-bold text-blue-600">{grade ? getLocalizedValue(grade.name) : '-'}</p></div>
                    {selectedApp.previousSchool && <div className="col-span-2"><span className="text-gray-500">{isAr ? 'المدرسة السابقة' : 'Previous School'}</span><p className="font-medium">{selectedApp.previousSchool}</p></div>}
                  </div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl">
                  <h3 className="font-bold text-green-800 dark:text-green-300 mb-3">{isAr ? '👨‍👩‍👧 ولي الأمر' : '👨‍👩‍👧 Parent'}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">{isAr ? 'الاسم' : 'Name'}</span><p className="font-medium">{isAr ? `${selectedApp.parentFirstNameAr} ${selectedApp.parentLastNameAr}` : `${selectedApp.parentFirstNameEn} ${selectedApp.parentLastNameEn}`}</p></div>
                    <div><span className="text-gray-500">{isAr ? 'الصلة' : 'Relation'}</span><p className="font-medium">{selectedApp.parentRelation === 'father' ? (isAr ? 'أب' : 'Father') : selectedApp.parentRelation === 'mother' ? (isAr ? 'أم' : 'Mother') : (isAr ? 'ولي أمر' : 'Guardian')}</p></div>
                    <div><span className="text-gray-500">{isAr ? 'الهاتف' : 'Phone'}</span><p className="font-medium">{selectedApp.parentPhone}</p></div>
                    <div><span className="text-gray-500">{isAr ? 'البريد' : 'Email'}</span><p className="font-medium">{selectedApp.parentEmail || '-'}</p></div>
                    {selectedApp.address && <div className="col-span-2"><span className="text-gray-500">{isAr ? 'العنوان' : 'Address'}</span><p className="font-medium">{selectedApp.address}</p></div>}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl">
                <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-3">{isAr ? '📎 المستندات' : '📎 Documents'}</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { ok: selectedApp.birthCertificateUploaded, ar: 'شهادة الميلاد', en: 'Birth Cert' },
                    { ok: selectedApp.photoUploaded, ar: 'صورة شخصية', en: 'Photo' },
                    { ok: selectedApp.nationalIdUploaded, ar: 'الهوية', en: 'ID' },
                    { ok: selectedApp.previousReportUploaded, ar: 'شهادة سابقة', en: 'Report' },
                  ].map((d, i) => <Badge key={i} variant={d.ok ? 'success' : 'danger'}>{isAr ? d.ar : d.en} {d.ok ? '✓' : '✗'}</Badge>)}
                </div>
              </div>

              {selectedApp.bloodType && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                  <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2">{isAr ? '🏥 صحية' : '🏥 Health'}</h3>
                  <p className="text-sm">{isAr ? 'فصيلة الدم:' : 'Blood:'} {selectedApp.bloodType} {selectedApp.allergies ? `| ${isAr ? 'حساسية:' : 'Allergies:'} ${selectedApp.allergies}` : ''}</p>
                </div>
              )}

              {/* Actions */}
              {(selectedApp.status === 'pending' || selectedApp.status === 'under_review') && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={() => { setIsDetailOpen(false); openAction(selectedApp, 'approve'); }} leftIcon={<CheckCircle className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700 flex-1">{isAr ? 'قبول' : 'Approve'}</Button>
                  <Button variant="outline" onClick={() => { setIsDetailOpen(false); openAction(selectedApp, 'changes'); }} leftIcon={<MessageSquare className="w-4 h-4" />} className="flex-1">{isAr ? 'طلب تعديل' : 'Request Changes'}</Button>
                  <Button variant="danger" onClick={() => { setIsDetailOpen(false); openAction(selectedApp, 'reject'); }} leftIcon={<XCircle className="w-4 h-4" />} className="flex-1">{isAr ? 'رفض' : 'Reject'}</Button>
                </div>
              )}
              {selectedApp.status === 'approved' && (
                <div className="pt-4 border-t">
                  <Button onClick={() => { setIsDetailOpen(false); setActionType('approve'); setEnrollSectionId(''); setIsActionOpen(true); }} leftIcon={<UserPlus className="w-4 h-4" />} className="w-full bg-purple-600 hover:bg-purple-700">{isAr ? 'تسجيل كطالب رسمي' : 'Enroll as Official Student'}</Button>
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* Action Modal */}
      <Modal isOpen={isActionOpen} onClose={() => setIsActionOpen(false)} title={
        actionType === 'approve' && selectedApp?.status === 'approved' ? (isAr ? '🎓 تسجيل الطالب' : '🎓 Enroll Student')
        : actionType === 'approve' ? (isAr ? '✅ قبول الطلب' : '✅ Approve')
        : actionType === 'reject' ? (isAr ? '❌ رفض الطلب' : '❌ Reject')
        : (isAr ? '📝 طلب تعديلات' : '📝 Request Changes')
      } size="lg">
        {selectedApp && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              <span className="font-medium">{isAr ? `${selectedApp.studentFirstNameAr} ${selectedApp.studentLastNameAr}` : `${selectedApp.studentFirstNameEn} ${selectedApp.studentLastNameEn}`}</span>
              <span className="text-gray-500 ms-2">({selectedApp.applicationNumber})</span>
            </div>

            {/* Enroll form for approved */}
            {actionType === 'approve' && selectedApp.status === 'approved' && (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl">
                  <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">{isAr ? 'سيتم إنشاء سجل طالب رسمي وملف ولي أمر تلقائياً' : 'An official student and parent record will be auto-created'}</p>
                  <Select label={isAr ? 'اختر الفصل' : 'Select Section'} value={enrollSectionId} onChange={e => setEnrollSectionId(e.target.value)}
                    options={[{ value: '', label: isAr ? 'اختر...' : 'Select...' }, ...enrollSections.map(s => ({ value: s.id, label: getLocalizedValue(s.name) }))]} required />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsActionOpen(false)}>{t('common.cancel')}</Button>
                  <Button onClick={() => handleEnroll(selectedApp)} disabled={!enrollSectionId} leftIcon={<UserPlus className="w-4 h-4" />} className="bg-purple-600 hover:bg-purple-700">{isAr ? 'تسجيل الآن' : 'Enroll Now'}</Button>
                </div>
              </div>
            )}

            {/* Approve (first time) */}
            {actionType === 'approve' && selectedApp.status !== 'approved' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <p className="text-sm text-green-800 dark:text-green-300">{isAr ? 'سيتم قبول الطلب وإشعار ولي الأمر. يمكنك تسجيل الطالب لاحقاً.' : 'Application will be approved and parent notified. You can enroll later.'}</p>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsActionOpen(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleAction} leftIcon={<CheckCircle className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700">{isAr ? 'تأكيد القبول' : 'Confirm Approve'}</Button>
                </div>
              </div>
            )}

            {/* Reject */}
            {actionType === 'reject' && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{isAr ? 'يرجى ذكر سبب الرفض' : 'Please provide reason for rejection'}</p>
                </div>
                <Input label={isAr ? 'سبب الرفض' : 'Rejection Reason'} value={actionNotes} onChange={e => setActionNotes(e.target.value)} required placeholder={isAr ? 'اكتب سبب الرفض...' : 'Enter rejection reason...'} />
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsActionOpen(false)}>{t('common.cancel')}</Button>
                  <Button variant="danger" onClick={handleAction} disabled={!actionNotes} leftIcon={<XCircle className="w-4 h-4" />}>{isAr ? 'تأكيد الرفض' : 'Confirm Reject'}</Button>
                </div>
              </div>
            )}

            {/* Request Changes */}
            {actionType === 'changes' && (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">{isAr ? 'حدد التعديلات المطلوبة من ولي الأمر' : 'Specify required changes from parent'}</p>
                </div>
                <Input label={isAr ? 'التعديلات المطلوبة' : 'Required Changes'} value={actionNotes} onChange={e => setActionNotes(e.target.value)} required placeholder={isAr ? 'مثال: يرجى رفع صورة شخصية...' : 'e.g., Please upload a photo...'} />
                <div className="flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setIsActionOpen(false)}>{t('common.cancel')}</Button>
                  <Button onClick={handleAction} disabled={!actionNotes} leftIcon={<MessageSquare className="w-4 h-4" />}>{isAr ? 'إرسال الطلب' : 'Send Request'}</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
