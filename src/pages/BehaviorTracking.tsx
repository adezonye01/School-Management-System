import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, ThumbsUp, ThumbsDown, Search, AlertTriangle,
  Star, User, Calendar, Clock, Shield
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { usePart4Store } from '../stores/part4Store';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { BehaviorType } from '../types/database';
import clsx from 'clsx';

export const BehaviorTracking: React.FC = () => {
  const { t } = useTranslation();
  const {
    getBehaviorCategoriesByBranch, getIncidentsByBranch, getIncidentsByStudent,
    addBehaviorIncident, getStudentTotalPoints, getTriggeredActions,
    getParentByStudentId,
  } = usePart4Store();
  const { students } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { user } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'' | BehaviorType>('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Log form
  const [logStudentId, setLogStudentId] = useState('');
  const [logCategoryId, setLogCategoryId] = useState('');
  const [logDescAr, setLogDescAr] = useState('');
  const [logDescEn, setLogDescEn] = useState('');
  const [logActionAr, setLogActionAr] = useState('');
  const [logActionEn, setLogActionEn] = useState('');

  const branchCategories = currentBranch ? getBehaviorCategoriesByBranch(currentBranch.id) : [];
  const allIncidents = currentBranch && currentAcademicYear ? getIncidentsByBranch(currentBranch.id, currentAcademicYear.id) : [];

  const branchStudents = currentBranch && currentAcademicYear
    ? students.filter((s) => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id && s.isActive)
    : [];

  const filtered = allIncidents.filter((inc) => {
    const student = branchStudents.find((s) => s.id === inc.studentId);
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || (student && (
      student.firstName.ar.includes(q) || student.firstName.en.toLowerCase().includes(q) ||
      student.studentNumber.toLowerCase().includes(q)
    ));
    const matchType = !filterType || inc.type === filterType;
    return matchSearch && matchType;
  });

  const studentOptions = branchStudents.map((s) => ({
    value: s.id,
    label: `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)} (${s.studentNumber})`,
  }));

  const categoryOptions = branchCategories.map((c) => ({
    value: c.id,
    label: `${c.type === 'positive' ? '✅' : '⛔'} ${getLocalizedValue(c.name)} (${c.defaultPoints > 0 ? '+' : ''}${c.defaultPoints})`,
  }));

  // Stats
  const posCount = filtered.filter((i) => i.type === 'positive').length;
  const negCount = filtered.filter((i) => i.type === 'negative').length;
  const posPoints = filtered.filter((i) => i.type === 'positive').reduce((s, i) => s + i.points, 0);
  const negPoints = filtered.filter((i) => i.type === 'negative').reduce((s, i) => s + i.points, 0);

  const getStudentName = (id: string) => {
    const s = branchStudents.find((st) => st.id === id);
    return s ? `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)}` : '-';
  };

  const getCategoryName = (id: string) => {
    const c = branchCategories.find((cat) => cat.id === id);
    return c ? getLocalizedValue(c.name) : '-';
  };

  const openLogModal = () => {
    setLogStudentId(''); setLogCategoryId('');
    setLogDescAr(''); setLogDescEn(''); setLogActionAr(''); setLogActionEn('');
    setIsLogModalOpen(true);
  };

  const handleLogIncident = () => {
    if (!currentBranch || !currentAcademicYear || !user || !logStudentId || !logCategoryId) return;

    const category = branchCategories.find((c) => c.id === logCategoryId);
    if (!category) return;

    addBehaviorIncident({
      studentId: logStudentId,
      categoryId: logCategoryId,
      type: category.type,
      points: category.defaultPoints,
      severity: category.severity,
      description: { ar: logDescAr || getLocalizedValue(category.description), en: logDescEn || category.description.en },
      actionTaken: logActionAr ? { ar: logActionAr, en: logActionEn } : undefined,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      reportedBy: user.id,
      parentNotified: false,
      branchId: currentBranch.id,
      academicYearId: currentAcademicYear.id,
    });

    showToast('success', language === 'ar' ? 'تم تسجيل الحادثة بنجاح' : 'Incident logged successfully');
    setIsLogModalOpen(false);
  };

  const openStudentDetail = (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsStudentDetailOpen(true);
  };

  // Student detail data
  const detailIncidents = selectedStudentId && currentAcademicYear ? getIncidentsByStudent(selectedStudentId, currentAcademicYear.id) : [];
  const detailTotal = selectedStudentId && currentAcademicYear ? getStudentTotalPoints(selectedStudentId, currentAcademicYear.id) : 0;
  const detailTriggered = selectedStudentId && currentAcademicYear && currentBranch ? getTriggeredActions(selectedStudentId, currentAcademicYear.id, currentBranch.id) : [];
  const detailParent = selectedStudentId ? getParentByStudentId(selectedStudentId) : undefined;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><ThumbsUp className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-green-600">{posCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'حوادث إيجابية' : 'Positive'}</p></div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"><ThumbsDown className="w-5 h-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-red-600">{negCount}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'حوادث سلبية' : 'Negative'}</p></div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><Star className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-blue-600">+{posPoints}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'نقاط إيجابية' : 'Positive Pts'}</p></div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-orange-600" /></div>
            <div><p className="text-2xl font-bold text-orange-600">{negPoints}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'نقاط سلبية' : 'Negative Pts'}</p></div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={language === 'ar' ? 'متابعة السلوكيات والإنذارات' : 'Behavior & Discipline Tracking'}
          subtitle={`${filtered.length} ${language === 'ar' ? 'سجل' : 'records'}`}
          action={<Button onClick={openLogModal} leftIcon={<Plus className="w-4 h-4" />}>{language === 'ar' ? 'تسجيل حادثة' : 'Log Incident'}</Button>}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('common.search')} leftIcon={<Search className="w-5 h-5" />} />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value as '' | BehaviorType)} options={[
            { value: '', label: t('common.all') },
            { value: 'positive', label: language === 'ar' ? '✅ إيجابي' : '✅ Positive' },
            { value: 'negative', label: language === 'ar' ? '⛔ سلبي' : '⛔ Negative' },
          ]} />
        </div>

        <Table>
          <TableHead><TableRow>
            <TableCell isHeader>{language === 'ar' ? 'التاريخ' : 'Date'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'الطالب' : 'Student'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'الحادثة' : 'Incident'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'النوع' : 'Type'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'النقاط' : 'Points'}</TableCell>
            <TableCell isHeader>{language === 'ar' ? 'الخطورة' : 'Severity'}</TableCell>
            <TableCell isHeader>{t('common.actions')}</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell className="text-center py-8" colSpan={7}>
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-gray-500">{t('common.noData')}</p>
              </TableCell></TableRow>
            ) : filtered.map((inc) => {
              const severityColors: Record<string, string> = { minor: 'default', moderate: 'warning', major: 'danger', critical: 'danger' };
              return (
                <TableRow key={inc.id}>
                  <TableCell><div className="flex items-center gap-1 text-sm"><Calendar className="w-3.5 h-3.5 text-gray-400" />{inc.date}<Clock className="w-3.5 h-3.5 text-gray-400 ms-2" />{inc.time}</div></TableCell>
                  <TableCell>
                    <button onClick={() => openStudentDetail(inc.studentId)} className="font-medium text-blue-600 hover:underline">{getStudentName(inc.studentId)}</button>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{getCategoryName(inc.categoryId)}</p>
                    <p className="text-xs text-gray-500 max-w-xs truncate">{getLocalizedValue(inc.description)}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={inc.type === 'positive' ? 'success' : 'danger'}>
                      {inc.type === 'positive' ? (language === 'ar' ? '✅ إيجابي' : '✅ Positive') : (language === 'ar' ? '⛔ سلبي' : '⛔ Negative')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={clsx('text-lg font-bold', inc.points > 0 ? 'text-green-600' : 'text-red-600')}>
                      {inc.points > 0 ? '+' : ''}{inc.points}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant={severityColors[inc.severity] as any}>{inc.severity}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="sm" onClick={() => openStudentDetail(inc.studentId)}><User className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Log Incident Modal */}
      <Modal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} title={language === 'ar' ? '📝 تسجيل حادثة سلوكية' : '📝 Log Behavior Incident'} size="lg">
        <div className="space-y-4">
          <Select label={language === 'ar' ? 'الطالب' : 'Student'} value={logStudentId} onChange={(e) => setLogStudentId(e.target.value)} options={[{ value: '', label: t('common.selectOption') }, ...studentOptions]} required />
          <Select label={language === 'ar' ? 'نوع الحادثة' : 'Incident Category'} value={logCategoryId} onChange={(e) => setLogCategoryId(e.target.value)} options={[{ value: '', label: t('common.selectOption') }, ...categoryOptions]} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label={language === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'} value={logDescAr} onChange={(e) => setLogDescAr(e.target.value)} dir="rtl" />
            <Input label={language === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'} value={logDescEn} onChange={(e) => setLogDescEn(e.target.value)} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={language === 'ar' ? 'الإجراء المتخذ (عربي)' : 'Action Taken (Arabic)'} value={logActionAr} onChange={(e) => setLogActionAr(e.target.value)} dir="rtl" />
            <Input label={language === 'ar' ? 'الإجراء المتخذ (إنجليزي)' : 'Action Taken (English)'} value={logActionEn} onChange={(e) => setLogActionEn(e.target.value)} dir="ltr" />
          </div>
          {logCategoryId && (() => { const c = branchCategories.find((cat) => cat.id === logCategoryId); return c ? (
            <div className={clsx('p-3 rounded-lg border', c.type === 'positive' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800')}>
              <p className="text-sm font-medium">{getLocalizedValue(c.name)} • <span className={c.type === 'positive' ? 'text-green-700' : 'text-red-700'}>{c.defaultPoints > 0 ? '+' : ''}{c.defaultPoints} {language === 'ar' ? 'نقاط' : 'points'}</span></p>
              <p className="text-xs text-gray-500">{getLocalizedValue(c.description)}</p>
            </div>
          ) : null; })()}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsLogModalOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleLogIncident} disabled={!logStudentId || !logCategoryId}>{language === 'ar' ? 'تسجيل الحادثة' : 'Log Incident'}</Button>
          </div>
        </div>
      </Modal>

      {/* Student Detail Modal */}
      <Modal isOpen={isStudentDetailOpen} onClose={() => setIsStudentDetailOpen(false)} title={`📊 ${getStudentName(selectedStudentId)}`} size="full">
        <div className="space-y-5">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card padding="sm">
              <p className="text-xs text-gray-500">{language === 'ar' ? 'إجمالي النقاط' : 'Total Points'}</p>
              <p className={clsx('text-3xl font-bold', detailTotal >= 0 ? 'text-green-600' : 'text-red-600')}>{detailTotal > 0 ? '+' : ''}{detailTotal}</p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-gray-500">{language === 'ar' ? 'إيجابي / سلبي' : 'Positive / Negative'}</p>
              <p className="text-lg font-bold">
                <span className="text-green-600">{detailIncidents.filter((i) => i.type === 'positive').length}</span>
                {' / '}
                <span className="text-red-600">{detailIncidents.filter((i) => i.type === 'negative').length}</span>
              </p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-gray-500">{language === 'ar' ? 'ولي الأمر' : 'Parent'}</p>
              <p className="text-sm font-medium">{detailParent ? `${getLocalizedValue(detailParent.firstName)} ${getLocalizedValue(detailParent.lastName)}` : '-'}</p>
              <p className="text-xs text-gray-400">{detailParent?.phone}</p>
            </Card>
          </div>

          {/* Triggered Actions */}
          {detailTriggered.length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{language === 'ar' ? 'إجراءات تأديبية مُفعّلة:' : 'Triggered Disciplinary Actions:'}</p>
              <div className="flex flex-wrap gap-2">
                {detailTriggered.map((a) => (
                  <Badge key={a.id} variant="danger">{getLocalizedValue(a.name)} ({a.pointThreshold})</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h4 className="font-medium mb-3">{language === 'ar' ? 'سجل الحوادث' : 'Incident History'}</h4>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto">
              {detailIncidents.map((inc) => {
                const cat = branchCategories.find((c) => c.id === inc.categoryId);
                return (
                  <div key={inc.id} className={clsx('p-4 rounded-lg border-s-4', inc.type === 'positive' ? 'bg-green-50 dark:bg-green-900/10 border-green-500' : 'bg-red-50 dark:bg-red-900/10 border-red-500')}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{cat ? getLocalizedValue(cat.name) : '-'}</p>
                        <p className="text-sm text-gray-600 mt-1">{getLocalizedValue(inc.description)}</p>
                        {inc.actionTaken && <p className="text-sm text-blue-600 mt-1">{language === 'ar' ? 'الإجراء:' : 'Action:'} {getLocalizedValue(inc.actionTaken)}</p>}
                      </div>
                      <div className="text-end">
                        <span className={clsx('text-xl font-bold', inc.points > 0 ? 'text-green-600' : 'text-red-600')}>{inc.points > 0 ? '+' : ''}{inc.points}</span>
                        <p className="text-xs text-gray-400">{inc.date} {inc.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsStudentDetailOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
