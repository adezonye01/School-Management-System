import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Pencil, Trash2, Bus as BusIcon, MapPin, Users,
  User, ChevronDown, ChevronRight, Navigation
} from 'lucide-react';
import { Card } from '../components/ui/Card';
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
import type { TransportZone, Bus, StudentTransport, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';
import clsx from 'clsx';

type TabType = 'zones' | 'buses' | 'assignments';

export const Transport: React.FC = () => {
  const { t } = useTranslation();
  const {
    getTransportZonesByBranch, getBusesByBranch, getBusesByZone, getStudentsByBus,
    addTransportZone, updateTransportZone, deleteTransportZone,
    addBus, updateBus, deleteBus,
    addStudentTransport, updateStudentTransport, deleteStudentTransport,
    studentTransports,
  } = usePart4Store();
  const { students } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('zones');
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: TabType; id: string } | null>(null);
  const [expandedBus, setExpandedBus] = useState<string | null>(null);

  const [selectedZone, setSelectedZone] = useState<TransportZone | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<StudentTransport | null>(null);

  // Zone form
  const [zForm, setZForm] = useState({ nameAr: '', nameEn: '', code: '', descAr: '', descEn: '', monthlyFee: 0, annualFee: 0 });
  // Bus form
  const [bForm, setBForm] = useState({ busNumber: '', plateNumber: '', capacity: 40, model: '', year: 2024, driverNameAr: '', driverNameEn: '', driverPhone: '', supervisorNameAr: '', supervisorNameEn: '', supervisorPhone: '', zoneId: '' });
  // Assignment form
  const [aForm, setAForm] = useState({ studentId: '', busId: '', zoneId: '', pickupAr: '', pickupEn: '', pickupTime: '', dropoffTime: '', direction: 'both' as StudentTransport['direction'] });

  const canEdit = hasPermission('fees', 'update');

  const zones = currentBranch ? getTransportZonesByBranch(currentBranch.id) : [];
  const buses = currentBranch ? getBusesByBranch(currentBranch.id) : [];
  const branchStudents = currentBranch && currentAcademicYear ? students.filter((s) => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id && s.isActive) : [];
  const assignments = currentBranch ? studentTransports.filter((t) => t.branchId === currentBranch.id && t.isActive) : [];

  const zoneOptions = zones.map((z) => ({ value: z.id, label: `${getLocalizedValue(z.name)} (${z.monthlyFee} SAR/${language === 'ar' ? 'شهر' : 'mo'})` }));
  const busOptions = buses.map((b) => ({ value: b.id, label: `${b.busNumber} - ${getLocalizedValue(b.driverName)}` }));
  const studentOptions = branchStudents.map((s) => ({ value: s.id, label: `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)} (${s.studentNumber})` }));
  const directionOptions = [
    { value: 'both', label: language === 'ar' ? 'ذهاب وإياب' : 'Both Ways' },
    { value: 'to_school', label: language === 'ar' ? 'ذهاب فقط' : 'To School Only' },
    { value: 'from_school', label: language === 'ar' ? 'إياب فقط' : 'From School Only' },
  ];

  // Zone handlers
  const openZoneModal = (z?: TransportZone) => {
    if (z) { setSelectedZone(z); setZForm({ nameAr: z.name.ar, nameEn: z.name.en, code: z.code, descAr: z.description.ar, descEn: z.description.en, monthlyFee: z.monthlyFee, annualFee: z.annualFee }); }
    else { setSelectedZone(null); setZForm({ nameAr: '', nameEn: '', code: '', descAr: '', descEn: '', monthlyFee: 0, annualFee: 0 }); }
    setIsZoneModalOpen(true);
  };

  const saveZone = () => {
    if (!currentBranch) return;
    const name: LocalizedText = { ar: sanitizeInput(zForm.nameAr), en: sanitizeInput(zForm.nameEn) };
    const description: LocalizedText = { ar: sanitizeInput(zForm.descAr), en: sanitizeInput(zForm.descEn) };
    if (selectedZone) { updateTransportZone(selectedZone.id, { name, code: sanitizeInput(zForm.code), description, monthlyFee: zForm.monthlyFee, annualFee: zForm.annualFee }); }
    else { addTransportZone({ name, code: sanitizeInput(zForm.code), description, monthlyFee: zForm.monthlyFee, annualFee: zForm.annualFee, currency: 'SAR', branchId: currentBranch.id, isActive: true }); }
    showToast('success', t('common.success'));
    setIsZoneModalOpen(false);
  };

  // Bus handlers
  const openBusModal = (b?: Bus) => {
    if (b) { setSelectedBus(b); setBForm({ busNumber: b.busNumber, plateNumber: b.plateNumber, capacity: b.capacity, model: b.model || '', year: b.year || 2024, driverNameAr: b.driverName.ar, driverNameEn: b.driverName.en, driverPhone: b.driverPhone, supervisorNameAr: b.supervisorName?.ar || '', supervisorNameEn: b.supervisorName?.en || '', supervisorPhone: b.supervisorPhone || '', zoneId: b.zoneId }); }
    else { setSelectedBus(null); setBForm({ busNumber: '', plateNumber: '', capacity: 40, model: '', year: 2024, driverNameAr: '', driverNameEn: '', driverPhone: '', supervisorNameAr: '', supervisorNameEn: '', supervisorPhone: '', zoneId: '' }); }
    setIsBusModalOpen(true);
  };

  const saveBus = () => {
    if (!currentBranch) return;
    const driverName: LocalizedText = { ar: sanitizeInput(bForm.driverNameAr), en: sanitizeInput(bForm.driverNameEn) };
    const supervisorName: LocalizedText | undefined = bForm.supervisorNameAr ? { ar: sanitizeInput(bForm.supervisorNameAr), en: sanitizeInput(bForm.supervisorNameEn) } : undefined;
    const data = { busNumber: bForm.busNumber, plateNumber: bForm.plateNumber, capacity: bForm.capacity, model: bForm.model, year: bForm.year, driverName, driverPhone: bForm.driverPhone, supervisorName, supervisorPhone: bForm.supervisorPhone || undefined, zoneId: bForm.zoneId };
    if (selectedBus) { updateBus(selectedBus.id, data); }
    else { addBus({ ...data, branchId: currentBranch.id, isActive: true }); }
    showToast('success', t('common.success'));
    setIsBusModalOpen(false);
  };

  // Assignment handlers
  const openAssignModal = (a?: StudentTransport) => {
    if (a) { setSelectedAssignment(a); setAForm({ studentId: a.studentId, busId: a.busId, zoneId: a.zoneId, pickupAr: a.pickupPoint?.ar || '', pickupEn: a.pickupPoint?.en || '', pickupTime: a.pickupTime || '', dropoffTime: a.dropoffTime || '', direction: a.direction }); }
    else { setSelectedAssignment(null); setAForm({ studentId: '', busId: '', zoneId: '', pickupAr: '', pickupEn: '', pickupTime: '', dropoffTime: '', direction: 'both' }); }
    setIsAssignModalOpen(true);
  };

  const saveAssignment = () => {
    if (!currentBranch || !currentAcademicYear) return;
    const zone = zones.find((z) => z.id === aForm.zoneId);
    const pickupPoint: LocalizedText | undefined = aForm.pickupAr ? { ar: sanitizeInput(aForm.pickupAr), en: sanitizeInput(aForm.pickupEn) } : undefined;
    const data = { studentId: aForm.studentId, busId: aForm.busId, zoneId: aForm.zoneId, pickupPoint, pickupTime: aForm.pickupTime || undefined, dropoffTime: aForm.dropoffTime || undefined, direction: aForm.direction, monthlyFee: zone?.monthlyFee || 0 };
    if (selectedAssignment) { updateStudentTransport(selectedAssignment.id, data); }
    else { addStudentTransport({ ...data, academicYearId: currentAcademicYear.id, branchId: currentBranch.id, isActive: true }); }
    showToast('success', t('common.success'));
    setIsAssignModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'zones') deleteTransportZone(deleteTarget.id);
    else if (deleteTarget.type === 'buses') deleteBus(deleteTarget.id);
    else deleteStudentTransport(deleteTarget.id);
    showToast('success', t('common.success'));
    setIsDeleteOpen(false);
  };

  const getStudentName = (id: string) => { const s = branchStudents.find((st) => st.id === id); return s ? `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)}` : '-'; };
  const getZoneName = (id: string) => { const z = zones.find((zo) => zo.id === id); return z ? getLocalizedValue(z.name) : '-'; };

  const tabs = [
    { key: 'zones' as TabType, label: language === 'ar' ? '🗺️ المناطق' : '🗺️ Zones', count: zones.length },
    { key: 'buses' as TabType, label: language === 'ar' ? '🚌 الحافلات' : '🚌 Buses', count: buses.length },
    { key: 'assignments' as TabType, label: language === 'ar' ? '👨‍🎓 تعيينات الطلاب' : '👨‍🎓 Student Assignments', count: assignments.length },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"><MapPin className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{zones.length}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'مناطق' : 'Zones'}</p></div></div></Card>
        <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><BusIcon className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{buses.length}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'حافلات' : 'Buses'}</p></div></div></Card>
        <Card padding="sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{assignments.length}</p><p className="text-xs text-gray-500">{language === 'ar' ? 'طلاب مسجلين' : 'Enrolled'}</p></div></div></Card>
      </div>

      <Card>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={clsx('px-4 py-3 text-sm font-medium border-b-2 transition-colors', activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {tab.label} <Badge variant="default" size="sm">{tab.count}</Badge>
            </button>
          ))}
        </div>

        {/* ZONES TAB */}
        {activeTab === 'zones' && (
          <div>
            <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">{language === 'ar' ? 'المناطق الجغرافية' : 'Geographic Zones'}</h3>
              {canEdit && <Button onClick={() => openZoneModal()} leftIcon={<Plus className="w-4 h-4" />} size="sm">{language === 'ar' ? 'إضافة منطقة' : 'Add Zone'}</Button>}
            </div>
            <Table><TableHead><TableRow>
              <TableCell isHeader>{language === 'ar' ? 'المنطقة' : 'Zone'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'الرمز' : 'Code'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'شهري' : 'Monthly'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'سنوي' : 'Annual'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'الحافلات' : 'Buses'}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow></TableHead><TableBody>
              {zones.map((z) => (<TableRow key={z.id}>
                <TableCell><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /><div><p className="font-medium">{getLocalizedValue(z.name)}</p><p className="text-xs text-gray-500">{getLocalizedValue(z.description)}</p></div></div></TableCell>
                <TableCell><Badge>{z.code}</Badge></TableCell>
                <TableCell><span className="font-bold">{z.monthlyFee.toLocaleString()}</span> <span className="text-xs text-gray-500">SAR</span></TableCell>
                <TableCell><span className="font-bold">{z.annualFee.toLocaleString()}</span> <span className="text-xs text-gray-500">SAR</span></TableCell>
                <TableCell><Badge variant="info">{getBusesByZone(z.id).length}</Badge></TableCell>
                <TableCell><div className="flex gap-1">{canEdit && <Button variant="ghost" size="sm" onClick={() => openZoneModal(z)}><Pencil className="w-4 h-4" /></Button>}{canEdit && <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'zones', id: z.id }); setIsDeleteOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}</div></TableCell>
              </TableRow>))}
            </TableBody></Table>
          </div>
        )}

        {/* BUSES TAB */}
        {activeTab === 'buses' && (
          <div>
            <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">{language === 'ar' ? 'الحافلات المدرسية' : 'School Buses'}</h3>
              {canEdit && <Button onClick={() => openBusModal()} leftIcon={<Plus className="w-4 h-4" />} size="sm">{language === 'ar' ? 'إضافة حافلة' : 'Add Bus'}</Button>}
            </div>
            <div className="space-y-3">
              {buses.map((b) => {
                const isExp = expandedBus === b.id;
                const busStudents = getStudentsByBus(b.id);
                return (
                  <div key={b.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 cursor-pointer" onClick={() => setExpandedBus(isExp ? null : b.id)}>
                      <div className="flex items-center gap-4">
                        <button className="text-gray-400">{isExp ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}</button>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"><BusIcon className="w-6 h-6 text-white" /></div>
                        <div>
                          <p className="font-semibold">{b.busNumber} <Badge variant="default">{b.plateNumber}</Badge></p>
                          <p className="text-sm text-gray-500">{b.model} • {b.year} • {language === 'ar' ? `سعة: ${b.capacity}` : `Capacity: ${b.capacity}`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <Badge variant="info">{getZoneName(b.zoneId)}</Badge>
                        <Badge variant="default">{busStudents.length}/{b.capacity} {language === 'ar' ? 'طالب' : 'students'}</Badge>
                        {canEdit && <Button variant="ghost" size="sm" onClick={() => openBusModal(b)}><Pencil className="w-4 h-4" /></Button>}
                        {canEdit && <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'buses', id: b.id }); setIsDeleteOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}
                      </div>
                    </div>
                    {isExp && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border"><User className="w-4 h-4 text-blue-500" /><div><p className="text-xs text-gray-500">{language === 'ar' ? 'السائق' : 'Driver'}</p><p className="font-medium">{getLocalizedValue(b.driverName)}</p><p className="text-xs text-gray-400">{b.driverPhone}</p></div></div>
                          {b.supervisorName && <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border"><User className="w-4 h-4 text-purple-500" /><div><p className="text-xs text-gray-500">{language === 'ar' ? 'المشرف' : 'Supervisor'}</p><p className="font-medium">{getLocalizedValue(b.supervisorName)}</p><p className="text-xs text-gray-400">{b.supervisorPhone}</p></div></div>}
                        </div>
                        {busStudents.length > 0 && (
                          <div><p className="text-sm font-medium mb-2">{language === 'ar' ? 'الطلاب المسجلين' : 'Enrolled Students'}</p>
                            <div className="space-y-1">{busStudents.map((st) => (
                              <div key={st.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border text-sm">
                                <span className="font-medium">{getStudentName(st.studentId)}</span>
                                <div className="flex gap-2"><Badge variant="default">{st.pickupTime || '-'}</Badge><Badge variant="default">{st.monthlyFee} SAR/{language === 'ar' ? 'شهر' : 'mo'}</Badge></div>
                              </div>
                            ))}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">{language === 'ar' ? 'تعيينات الطلاب للمواصلات' : 'Student Transport Assignments'}</h3>
              {canEdit && <Button onClick={() => openAssignModal()} leftIcon={<Plus className="w-4 h-4" />} size="sm">{language === 'ar' ? 'إضافة تعيين' : 'Add Assignment'}</Button>}
            </div>
            <Table><TableHead><TableRow>
              <TableCell isHeader>{language === 'ar' ? 'الطالب' : 'Student'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'المنطقة' : 'Zone'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'الحافلة' : 'Bus'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'نقطة الصعود' : 'Pickup'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'الاتجاه' : 'Direction'}</TableCell>
              <TableCell isHeader>{language === 'ar' ? 'الرسوم/شهر' : 'Fee/mo'}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow></TableHead><TableBody>
              {assignments.length === 0 ? (
                <TableRow><TableCell className="text-center py-8" colSpan={7}><Navigation className="w-12 h-12 text-gray-300 mx-auto mb-2" /><p className="text-gray-500">{t('common.noData')}</p></TableCell></TableRow>
              ) : assignments.map((a) => {
                const bus = buses.find((b) => b.id === a.busId);
                return (
                  <TableRow key={a.id}>
                    <TableCell><span className="font-medium">{getStudentName(a.studentId)}</span></TableCell>
                    <TableCell><Badge variant="info">{getZoneName(a.zoneId)}</Badge></TableCell>
                    <TableCell>{bus?.busNumber || '-'}</TableCell>
                    <TableCell>{a.pickupPoint ? getLocalizedValue(a.pickupPoint) : '-'}</TableCell>
                    <TableCell><Badge variant="default">{directionOptions.find((d) => d.value === a.direction)?.label}</Badge></TableCell>
                    <TableCell><span className="font-bold">{a.monthlyFee.toLocaleString()}</span> SAR</TableCell>
                    <TableCell><div className="flex gap-1">{canEdit && <Button variant="ghost" size="sm" onClick={() => openAssignModal(a)}><Pencil className="w-4 h-4" /></Button>}{canEdit && <Button variant="ghost" size="sm" onClick={() => { setDeleteTarget({ type: 'assignments', id: a.id }); setIsDeleteOpen(true); }}><Trash2 className="w-4 h-4 text-red-500" /></Button>}</div></TableCell>
                  </TableRow>
                );
              })}
            </TableBody></Table>
          </div>
        )}
      </Card>

      {/* Zone Modal */}
      <Modal isOpen={isZoneModalOpen} onClose={() => setIsZoneModalOpen(false)} title={selectedZone ? (language === 'ar' ? 'تعديل المنطقة' : 'Edit Zone') : (language === 'ar' ? 'إضافة منطقة' : 'Add Zone')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><Input label={language === 'ar' ? 'الاسم (عربي)' : 'Name (AR)'} value={zForm.nameAr} onChange={(e) => setZForm({ ...zForm, nameAr: e.target.value })} dir="rtl" required /><Input label={language === 'ar' ? 'الاسم (إنجليزي)' : 'Name (EN)'} value={zForm.nameEn} onChange={(e) => setZForm({ ...zForm, nameEn: e.target.value })} dir="ltr" required /></div>
          <Input label={language === 'ar' ? 'الرمز' : 'Code'} value={zForm.code} onChange={(e) => setZForm({ ...zForm, code: e.target.value.toUpperCase() })} required />
          <div className="grid grid-cols-2 gap-4"><Input label={language === 'ar' ? 'الوصف (عربي)' : 'Desc (AR)'} value={zForm.descAr} onChange={(e) => setZForm({ ...zForm, descAr: e.target.value })} dir="rtl" /><Input label={language === 'ar' ? 'الوصف (إنجليزي)' : 'Desc (EN)'} value={zForm.descEn} onChange={(e) => setZForm({ ...zForm, descEn: e.target.value })} dir="ltr" /></div>
          <div className="grid grid-cols-2 gap-4"><Input label={language === 'ar' ? 'الرسوم الشهرية' : 'Monthly Fee'} type="number" value={zForm.monthlyFee} onChange={(e) => setZForm({ ...zForm, monthlyFee: parseFloat(e.target.value) || 0 })} min={0} required /><Input label={language === 'ar' ? 'الرسوم السنوية' : 'Annual Fee'} type="number" value={zForm.annualFee} onChange={(e) => setZForm({ ...zForm, annualFee: parseFloat(e.target.value) || 0 })} min={0} required /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="secondary" onClick={() => setIsZoneModalOpen(false)}>{t('common.cancel')}</Button><Button onClick={saveZone}>{selectedZone ? t('common.update') : t('common.create')}</Button></div>
        </div>
      </Modal>

      {/* Bus Modal */}
      <Modal isOpen={isBusModalOpen} onClose={() => setIsBusModalOpen(false)} title={selectedBus ? (language === 'ar' ? 'تعديل الحافلة' : 'Edit Bus') : (language === 'ar' ? 'إضافة حافلة' : 'Add Bus')} size="full">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pe-2">
          <div className="grid grid-cols-3 gap-4"><Input label={language === 'ar' ? 'رقم الحافلة' : 'Bus Number'} value={bForm.busNumber} onChange={(e) => setBForm({ ...bForm, busNumber: e.target.value })} required /><Input label={language === 'ar' ? 'رقم اللوحة' : 'Plate Number'} value={bForm.plateNumber} onChange={(e) => setBForm({ ...bForm, plateNumber: e.target.value })} required /><Input label={language === 'ar' ? 'السعة' : 'Capacity'} type="number" value={bForm.capacity} onChange={(e) => setBForm({ ...bForm, capacity: parseInt(e.target.value) || 40 })} required /></div>
          <div className="grid grid-cols-2 gap-4"><Input label={language === 'ar' ? 'الموديل' : 'Model'} value={bForm.model} onChange={(e) => setBForm({ ...bForm, model: e.target.value })} /><Input label={language === 'ar' ? 'السنة' : 'Year'} type="number" value={bForm.year} onChange={(e) => setBForm({ ...bForm, year: parseInt(e.target.value) || 2024 })} /></div>
          <Select label={language === 'ar' ? 'المنطقة' : 'Zone'} value={bForm.zoneId} onChange={(e) => setBForm({ ...bForm, zoneId: e.target.value })} options={[{ value: '', label: t('common.selectOption') }, ...zoneOptions]} required />
          <div className="border-t pt-4"><h4 className="font-medium mb-3">{language === 'ar' ? 'بيانات السائق' : 'Driver Info'}</h4>
            <div className="grid grid-cols-2 gap-4"><Input label={language === 'ar' ? 'اسم السائق (عربي)' : 'Driver (AR)'} value={bForm.driverNameAr} onChange={(e) => setBForm({ ...bForm, driverNameAr: e.target.value })} dir="rtl" required /><Input label={language === 'ar' ? 'اسم السائق (إنجليزي)' : 'Driver (EN)'} value={bForm.driverNameEn} onChange={(e) => setBForm({ ...bForm, driverNameEn: e.target.value })} dir="ltr" required /></div>
            <Input label={language === 'ar' ? 'هاتف السائق' : 'Driver Phone'} value={bForm.driverPhone} onChange={(e) => setBForm({ ...bForm, driverPhone: e.target.value })} dir="ltr" required className="mt-4" />
          </div>
          <div className="border-t pt-4"><h4 className="font-medium mb-3">{language === 'ar' ? 'بيانات المشرف (اختياري)' : 'Supervisor Info (Optional)'}</h4>
            <div className="grid grid-cols-2 gap-4"><Input label={language === 'ar' ? 'اسم المشرف (عربي)' : 'Supervisor (AR)'} value={bForm.supervisorNameAr} onChange={(e) => setBForm({ ...bForm, supervisorNameAr: e.target.value })} dir="rtl" /><Input label={language === 'ar' ? 'اسم المشرف (إنجليزي)' : 'Supervisor (EN)'} value={bForm.supervisorNameEn} onChange={(e) => setBForm({ ...bForm, supervisorNameEn: e.target.value })} dir="ltr" /></div>
            <Input label={language === 'ar' ? 'هاتف المشرف' : 'Supervisor Phone'} value={bForm.supervisorPhone} onChange={(e) => setBForm({ ...bForm, supervisorPhone: e.target.value })} dir="ltr" className="mt-4" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-800"><Button variant="secondary" onClick={() => setIsBusModalOpen(false)}>{t('common.cancel')}</Button><Button onClick={saveBus}>{selectedBus ? t('common.update') : t('common.create')}</Button></div>
        </div>
      </Modal>

      {/* Assignment Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title={language === 'ar' ? 'تعيين طالب للمواصلات' : 'Assign Student to Transport'} size="lg">
        <div className="space-y-4">
          <Select label={language === 'ar' ? 'الطالب' : 'Student'} value={aForm.studentId} onChange={(e) => setAForm({ ...aForm, studentId: e.target.value })} options={[{ value: '', label: t('common.selectOption') }, ...studentOptions]} required />
          <Select label={language === 'ar' ? 'المنطقة' : 'Zone'} value={aForm.zoneId} onChange={(e) => setAForm({ ...aForm, zoneId: e.target.value })} options={[{ value: '', label: t('common.selectOption') }, ...zoneOptions]} required />
          <Select label={language === 'ar' ? 'الحافلة' : 'Bus'} value={aForm.busId} onChange={(e) => setAForm({ ...aForm, busId: e.target.value })} options={[{ value: '', label: t('common.selectOption') }, ...busOptions]} required />
          <div className="grid grid-cols-2 gap-4"><Input label={language === 'ar' ? 'نقطة الصعود (عربي)' : 'Pickup Point (AR)'} value={aForm.pickupAr} onChange={(e) => setAForm({ ...aForm, pickupAr: e.target.value })} dir="rtl" /><Input label={language === 'ar' ? 'نقطة الصعود (إنجليزي)' : 'Pickup Point (EN)'} value={aForm.pickupEn} onChange={(e) => setAForm({ ...aForm, pickupEn: e.target.value })} dir="ltr" /></div>
          <div className="grid grid-cols-3 gap-4"><Input label={language === 'ar' ? 'وقت الصعود' : 'Pickup Time'} type="time" value={aForm.pickupTime} onChange={(e) => setAForm({ ...aForm, pickupTime: e.target.value })} /><Input label={language === 'ar' ? 'وقت النزول' : 'Dropoff Time'} type="time" value={aForm.dropoffTime} onChange={(e) => setAForm({ ...aForm, dropoffTime: e.target.value })} /><Select label={language === 'ar' ? 'الاتجاه' : 'Direction'} value={aForm.direction} onChange={(e) => setAForm({ ...aForm, direction: e.target.value as any })} options={directionOptions} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><Button variant="secondary" onClick={() => setIsAssignModalOpen(false)}>{t('common.cancel')}</Button><Button onClick={saveAssignment}>{selectedAssignment ? t('common.update') : t('common.create')}</Button></div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t('common.confirm')} size="sm">
        <p className="text-gray-600 dark:text-gray-300 mb-6">{language === 'ar' ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?'}</p>
        <div className="flex justify-end gap-3"><Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>{t('common.cancel')}</Button><Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button></div>
      </Modal>
    </div>
  );
};
