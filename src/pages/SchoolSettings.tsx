import React, { useState } from 'react';
import { Save, Calendar, Building2 } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { useAppStore } from '../stores/appStore';
import { useDataStore } from '../stores/dataStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';

export const SchoolSettings: React.FC = () => {
  const { currentBranch } = useAppStore();
  const { branches, academicYears } = useDataStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const isAr = language === 'ar';

  const [schoolNameAr, setSchoolNameAr] = useState('مدارس النور الأهلية');
  const [schoolNameEn, setSchoolNameEn] = useState('Al-Noor Private Schools');
  const [schoolMottoAr, setSchoolMottoAr] = useState('نحو تعليم متميز');
  const [schoolMottoEn, setSchoolMottoEn] = useState('Towards Distinguished Education');
  const [schoolPhone, setSchoolPhone] = useState('+967-1-234567');
  const [schoolEmail, setSchoolEmail] = useState('info@alnoor-school.edu.ye');
  const [schoolWebsite, setSchoolWebsite] = useState('www.alnoor-school.edu.ye');
  const [schoolAddressAr, setSchoolAddressAr] = useState('صنعاء - شارع الزبيري');
  const [schoolAddressEn, setSchoolAddressEn] = useState('Sana\'a - Al-Zubairi St.');
  const [principalAr, setPrincipalAr] = useState('أ. أحمد محمد العلي');
  const [principalEn, setPrincipalEn] = useState('Mr. Ahmed M. Al-Ali');
  const [currency, setCurrency] = useState('YER');
  const [timezone, setTimezone] = useState('Asia/Aden');
  const [passingGrade, setPassingGrade] = useState(50);
  const [maxAbsenceDays, setMaxAbsenceDays] = useState(15);

  const handleSave = () => {
    showToast('success', isAr ? 'تم حفظ الإعدادات بنجاح' : 'Settings saved successfully');
  };

  const activeBranches = branches.filter(b => b.isActive);
  const activeYears = academicYears.filter(y => !y.isArchived);
  const archivedYears = academicYears.filter(y => y.isArchived);

  return (
    <div className="space-y-6">
      {/* School Identity */}
      <Card>
        <CardHeader title={isAr ? '🏫 هوية المدرسة' : '🏫 School Identity'} />
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl text-white">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">🏫</div>
            <div>
              <h2 className="text-2xl font-bold">{isAr ? schoolNameAr : schoolNameEn}</h2>
              <p className="opacity-80">{isAr ? schoolMottoAr : schoolMottoEn}</p>
              <div className="flex gap-3 mt-2 text-sm opacity-70">
                <span>📞 {schoolPhone}</span>
                <span>📧 {schoolEmail}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'اسم المدرسة (عربي)' : 'School Name (Arabic)'} value={schoolNameAr} onChange={e => setSchoolNameAr(e.target.value)} dir="rtl" />
            <Input label={isAr ? 'اسم المدرسة (إنجليزي)' : 'School Name (English)'} value={schoolNameEn} onChange={e => setSchoolNameEn(e.target.value)} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'شعار المدرسة (عربي)' : 'Motto (Arabic)'} value={schoolMottoAr} onChange={e => setSchoolMottoAr(e.target.value)} dir="rtl" />
            <Input label={isAr ? 'شعار المدرسة (إنجليزي)' : 'Motto (English)'} value={schoolMottoEn} onChange={e => setSchoolMottoEn(e.target.value)} dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={isAr ? 'اسم المدير (عربي)' : 'Principal (Arabic)'} value={principalAr} onChange={e => setPrincipalAr(e.target.value)} dir="rtl" />
            <Input label={isAr ? 'اسم المدير (إنجليزي)' : 'Principal (English)'} value={principalEn} onChange={e => setPrincipalEn(e.target.value)} dir="ltr" />
          </div>
        </div>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader title={isAr ? '📞 بيانات التواصل' : '📞 Contact Info'} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label={isAr ? 'الهاتف' : 'Phone'} value={schoolPhone} onChange={e => setSchoolPhone(e.target.value)} dir="ltr" />
          <Input label={isAr ? 'البريد' : 'Email'} value={schoolEmail} onChange={e => setSchoolEmail(e.target.value)} dir="ltr" />
          <Input label={isAr ? 'الموقع' : 'Website'} value={schoolWebsite} onChange={e => setSchoolWebsite(e.target.value)} dir="ltr" />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Input label={isAr ? 'العنوان (عربي)' : 'Address (Arabic)'} value={schoolAddressAr} onChange={e => setSchoolAddressAr(e.target.value)} dir="rtl" />
          <Input label={isAr ? 'العنوان (إنجليزي)' : 'Address (English)'} value={schoolAddressEn} onChange={e => setSchoolAddressEn(e.target.value)} dir="ltr" />
        </div>
      </Card>

      {/* Academic Settings */}
      <Card>
        <CardHeader title={isAr ? '🎓 الإعدادات الأكاديمية' : '🎓 Academic Settings'} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Select label={isAr ? 'العملة' : 'Currency'} value={currency} onChange={e => setCurrency(e.target.value)} options={[{ value: 'YER', label: isAr ? 'ريال يمني' : 'Yemeni Rial' }, { value: 'SAR', label: isAr ? 'ريال سعودي' : 'Saudi Riyal' }, { value: 'USD', label: isAr ? 'دولار' : 'US Dollar' }]} />
          <Select label={isAr ? 'المنطقة الزمنية' : 'Timezone'} value={timezone} onChange={e => setTimezone(e.target.value)} options={[{ value: 'Asia/Aden', label: 'Asia/Aden (GMT+3)' }, { value: 'Asia/Riyadh', label: 'Asia/Riyadh (GMT+3)' }]} />
          <Input label={isAr ? 'نسبة النجاح (%)' : 'Passing Grade (%)'} type="number" value={passingGrade} onChange={e => setPassingGrade(parseInt(e.target.value) || 50)} min={0} max={100} />
          <Input label={isAr ? 'أيام الغياب القصوى' : 'Max Absence Days'} type="number" value={maxAbsenceDays} onChange={e => setMaxAbsenceDays(parseInt(e.target.value) || 15)} min={0} />
        </div>
      </Card>

      {/* Branches & Years Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader title={isAr ? '🏢 الفروع' : '🏢 Branches'} subtitle={`${activeBranches.length} ${isAr ? 'فرع نشط' : 'active branches'}`} />
          <div className="space-y-2">
            {activeBranches.map(branch => (
              <div key={branch.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium">{getLocalizedValue(branch.name)}</p>
                    <p className="text-xs text-gray-500">{branch.code} • {branch.phone}</p>
                  </div>
                </div>
                {currentBranch?.id === branch.id && <Badge variant="success">{isAr ? 'الحالي' : 'Current'}</Badge>}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title={isAr ? '📅 السنوات الدراسية' : '📅 Academic Years'} subtitle={`${activeYears.length} ${isAr ? 'نشطة' : 'active'} / ${archivedYears.length} ${isAr ? 'مؤرشفة' : 'archived'}`} />
          <div className="space-y-2">
            {academicYears.filter(y => y.branchId === currentBranch?.id).map(year => (
              <div key={year.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">{getLocalizedValue(year.name)}</p>
                    <p className="text-xs text-gray-500">{year.startDate} → {year.endDate}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {year.isCurrent && <Badge variant="success">{isAr ? 'جارية' : 'Current'}</Badge>}
                  {year.isArchived && <Badge variant="warning">{isAr ? 'مؤرشفة' : 'Archived'}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} leftIcon={<Save className="w-5 h-5" />}>
          {isAr ? 'حفظ جميع الإعدادات' : 'Save All Settings'}
        </Button>
      </div>
    </div>
  );
};
