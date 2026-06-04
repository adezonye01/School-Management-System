import React, { useState } from 'react';
import { School, CheckCircle, Upload, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAdmissionStore } from '../stores/admissionStore';
import { useAcademicStore } from '../stores/academicStore';
import { useDataStore } from '../stores/dataStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useAppStore } from '../stores/appStore';
import { changeLanguage } from '../i18n';
import clsx from 'clsx';

type Step = 1 | 2 | 3 | 4 | 5;

export const AdmissionForm: React.FC = () => {
  const { addApplication } = useAdmissionStore();
  const { getGradesByBranch } = useAcademicStore();
  const { branches, academicYears } = useDataStore();
  const { language, setLanguage } = useAppStore();
  const { getLocalizedValue } = useLocalizedValue();

  const [step, setStep] = useState<Step>(1);
  const [submitted, setSubmitted] = useState(false);
  const [appNumber, setAppNumber] = useState('');

  // Form state
  const [branchId, setBranchId] = useState('branch-1');
  const [gradeId, setGradeId] = useState('');
  const [studentFirstAr, setStudentFirstAr] = useState('');
  const [studentFirstEn, setStudentFirstEn] = useState('');
  const [studentLastAr, setStudentLastAr] = useState('');
  const [studentLastEn, setStudentLastEn] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [nationality, setNationality] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [parentFirstAr, setParentFirstAr] = useState('');
  const [parentFirstEn, setParentFirstEn] = useState('');
  const [parentLastAr, setParentLastAr] = useState('');
  const [parentLastEn, setParentLastEn] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentPhone2, setParentPhone2] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentRelation, setParentRelation] = useState<'father' | 'mother' | 'guardian'>('father');
  const [parentOccupation, setParentOccupation] = useState('');
  const [address, setAddress] = useState('');
  const [birthCert, setBirthCert] = useState(false);
  const [photo, setPhoto] = useState(false);
  const [prevReport, setPrevReport] = useState(false);
  const [idDoc, setIdDoc] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');

  const isAr = language === 'ar';
  const activeBranches = branches.filter(b => b.isActive);
  const branchGrades = getGradesByBranch(branchId);
  const currentYear = academicYears.find(y => y.isCurrent && y.branchId === branchId);

  const branchOptions = activeBranches.map(b => ({ value: b.id, label: getLocalizedValue(b.name) }));
  const gradeOptions = branchGrades.map(g => ({ value: g.id, label: getLocalizedValue(g.name) }));
  const genderOptions = [{ value: 'male', label: isAr ? 'ذكر' : 'Male' }, { value: 'female', label: isAr ? 'أنثى' : 'Female' }];
  const relationOptions = [{ value: 'father', label: isAr ? 'أب' : 'Father' }, { value: 'mother', label: isAr ? 'أم' : 'Mother' }, { value: 'guardian', label: isAr ? 'ولي أمر' : 'Guardian' }];

  const handleToggleLang = () => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
    changeLanguage(newLang);
  };

  const handleSubmit = () => {
    if (!currentYear) return;
    const app = addApplication({
      studentFirstNameAr: studentFirstAr, studentFirstNameEn: studentFirstEn,
      studentLastNameAr: studentLastAr, studentLastNameEn: studentLastEn,
      dateOfBirth: dob, gender, nationality, nationalId: nationalId || undefined, previousSchool: previousSchool || undefined,
      desiredGradeId: gradeId, desiredBranchId: branchId, academicYearId: currentYear.id,
      parentFirstNameAr: parentFirstAr, parentFirstNameEn: parentFirstEn,
      parentLastNameAr: parentLastAr, parentLastNameEn: parentLastEn,
      parentPhone, parentPhone2: parentPhone2 || undefined, parentEmail: parentEmail || undefined,
      parentRelation, parentNationalId: undefined, parentOccupation: parentOccupation || undefined,
      address: address || undefined,
      birthCertificateUploaded: birthCert, photoUploaded: photo, previousReportUploaded: prevReport, nationalIdUploaded: idDoc,
      bloodType: bloodType || undefined, allergies: allergies || undefined, medicalNotes: medicalNotes || undefined,
      status: 'pending',
    });
    setAppNumber(app.applicationNumber);
    setSubmitted(true);
  };

  const canNext = () => {
    if (step === 1) return branchId && gradeId && dob && studentFirstAr && studentLastAr && gender;
    if (step === 2) return parentFirstAr && parentLastAr && parentPhone && parentRelation;
    if (step === 3) return true;
    if (step === 4) return true;
    return true;
  };

  const stepLabels = [
    { ar: 'بيانات الطالب', en: 'Student Info' },
    { ar: 'ولي الأمر', en: 'Parent Info' },
    { ar: 'المستندات', en: 'Documents' },
    { ar: 'معلومات صحية', en: 'Health Info' },
    { ar: 'مراجعة وإرسال', en: 'Review & Submit' },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-700 mb-2">{isAr ? 'تم إرسال الطلب بنجاح!' : 'Application Submitted!'}</h1>
          <p className="text-gray-600 mb-4">{isAr ? 'رقم الطلب الخاص بك:' : 'Your application number:'}</p>
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
            <p className="text-3xl font-bold text-green-800 font-mono">{appNumber}</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">{isAr ? 'يرجى الاحتفاظ بهذا الرقم لمتابعة حالة طلبك. سيتم التواصل معك قريباً.' : 'Please save this number to track your application. We will contact you soon.'}</p>
          <Button onClick={() => window.location.reload()} className="w-full">{isAr ? 'تقديم طلب جديد' : 'Submit New Application'}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{isAr ? 'بوابة القبول والتسجيل' : 'Admission Portal'}</h1>
              <p className="text-sm text-gray-500">{isAr ? 'مدارس النور الأهلية' : 'Al-Noor Private Schools'}</p>
            </div>
          </div>
          <button onClick={handleToggleLang} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50 text-sm font-medium">
            <Globe className="w-4 h-4" />{language === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Steps */}
        <div className="flex items-center justify-between mb-8">
          {stepLabels.map((label, idx) => {
            const num = idx + 1;
            const isActive = step === num;
            const isDone = step > num;
            return (
              <React.Fragment key={num}>
                <div className="flex flex-col items-center gap-1">
                  <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all', isDone ? 'bg-green-600 text-white' : isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')}>
                    {isDone ? '✓' : num}
                  </div>
                  <span className={clsx('text-xs font-medium', isActive ? 'text-blue-600' : 'text-gray-400')}>{isAr ? label.ar : label.en}</span>
                </div>
                {idx < 4 && <div className={clsx('flex-1 h-1 mx-2 rounded', isDone ? 'bg-green-500' : 'bg-gray-200')} />}
              </React.Fragment>
            );
          })}
        </div>

        <Card className="p-6 md:p-8">
          {/* Step 1: Student Info */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold border-b pb-3">{isAr ? '👨‍🎓 بيانات الطالب' : '👨‍🎓 Student Information'}</h2>
              <div className="grid grid-cols-2 gap-4">
                <Select label={isAr ? 'الفرع' : 'Branch'} value={branchId} onChange={e => setBranchId(e.target.value)} options={branchOptions} required />
                <Select label={isAr ? 'الصف المطلوب' : 'Desired Grade'} value={gradeId} onChange={e => setGradeId(e.target.value)} options={[{ value: '', label: isAr ? 'اختر...' : 'Select...' }, ...gradeOptions]} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={isAr ? 'الاسم الأول (عربي)' : 'First Name (Arabic)'} value={studentFirstAr} onChange={e => setStudentFirstAr(e.target.value)} dir="rtl" required />
                <Input label={isAr ? 'الاسم الأول (إنجليزي)' : 'First Name (English)'} value={studentFirstEn} onChange={e => setStudentFirstEn(e.target.value)} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={isAr ? 'اسم العائلة (عربي)' : 'Last Name (Arabic)'} value={studentLastAr} onChange={e => setStudentLastAr(e.target.value)} dir="rtl" required />
                <Input label={isAr ? 'اسم العائلة (إنجليزي)' : 'Last Name (English)'} value={studentLastEn} onChange={e => setStudentLastEn(e.target.value)} dir="ltr" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label={isAr ? 'تاريخ الميلاد' : 'Date of Birth'} type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                <Select label={isAr ? 'الجنس' : 'Gender'} value={gender} onChange={e => setGender(e.target.value as any)} options={genderOptions} required />
                <Input label={isAr ? 'الجنسية' : 'Nationality'} value={nationality} onChange={e => setNationality(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={isAr ? 'رقم الهوية' : 'National ID'} value={nationalId} onChange={e => setNationalId(e.target.value)} />
                <Input label={isAr ? 'المدرسة السابقة' : 'Previous School'} value={previousSchool} onChange={e => setPreviousSchool(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2: Parent Info */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold border-b pb-3">{isAr ? '👨‍👩‍👧 بيانات ولي الأمر' : '👨‍👩‍👧 Parent Information'}</h2>
              <Select label={isAr ? 'صلة القرابة' : 'Relation'} value={parentRelation} onChange={e => setParentRelation(e.target.value as any)} options={relationOptions} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label={isAr ? 'الاسم الأول (عربي)' : 'First Name (Arabic)'} value={parentFirstAr} onChange={e => setParentFirstAr(e.target.value)} dir="rtl" required />
                <Input label={isAr ? 'الاسم الأول (إنجليزي)' : 'First Name (English)'} value={parentFirstEn} onChange={e => setParentFirstEn(e.target.value)} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={isAr ? 'اسم العائلة (عربي)' : 'Last Name (Arabic)'} value={parentLastAr} onChange={e => setParentLastAr(e.target.value)} dir="rtl" required />
                <Input label={isAr ? 'اسم العائلة (إنجليزي)' : 'Last Name (English)'} value={parentLastEn} onChange={e => setParentLastEn(e.target.value)} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={isAr ? 'رقم الهاتف' : 'Phone'} value={parentPhone} onChange={e => setParentPhone(e.target.value)} dir="ltr" required />
                <Input label={isAr ? 'هاتف بديل' : 'Alt Phone'} value={parentPhone2} onChange={e => setParentPhone2(e.target.value)} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={isAr ? 'البريد الإلكتروني' : 'Email'} type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} dir="ltr" />
                <Input label={isAr ? 'المهنة' : 'Occupation'} value={parentOccupation} onChange={e => setParentOccupation(e.target.value)} />
              </div>
              <Input label={isAr ? 'العنوان' : 'Address'} value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold border-b pb-3">{isAr ? '📎 المستندات المطلوبة' : '📎 Required Documents'}</h2>
              <p className="text-sm text-gray-500">{isAr ? 'حدد المستندات التي تم تجهيزها. يمكن رفعها لاحقاً عند زيارة المدرسة.' : 'Check documents you have ready. They can be uploaded later at school visit.'}</p>
              {[
                { checked: birthCert, set: setBirthCert, ar: 'شهادة الميلاد', en: 'Birth Certificate', required: true },
                { checked: photo, set: setPhoto, ar: 'صورة شخصية', en: 'Photo', required: true },
                { checked: idDoc, set: setIdDoc, ar: 'صورة الهوية / جواز السفر', en: 'ID / Passport Copy', required: true },
                { checked: prevReport, set: setPrevReport, ar: 'آخر شهادة مدرسية', en: 'Previous School Report', required: false },
              ].map((doc, i) => (
                <label key={i} className={clsx('flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all', doc.checked ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 hover:border-gray-300')}>
                  <input type="checkbox" checked={doc.checked} onChange={e => doc.set(e.target.checked)} className="w-5 h-5 text-green-600 rounded" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{isAr ? doc.ar : doc.en}</span>
                      {doc.required && <Badge variant="danger" size="sm">{isAr ? 'مطلوب' : 'Required'}</Badge>}
                    </div>
                  </div>
                  <Upload className={clsx('w-5 h-5', doc.checked ? 'text-green-500' : 'text-gray-300')} />
                </label>
              ))}
            </div>
          )}

          {/* Step 4: Health */}
          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold border-b pb-3">{isAr ? '🏥 المعلومات الصحية' : '🏥 Health Information'}</h2>
              <p className="text-sm text-gray-500">{isAr ? 'اختياري - يساعد في رعاية الطالب' : 'Optional - helps with student care'}</p>
              <div className="grid grid-cols-2 gap-4">
                <Select label={isAr ? 'فصيلة الدم' : 'Blood Type'} value={bloodType} onChange={e => setBloodType(e.target.value)} options={[{ value: '', label: '-' }, ...['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(v => ({ value: v, label: v }))]} />
                <Input label={isAr ? 'الحساسية' : 'Allergies'} value={allergies} onChange={e => setAllergies(e.target.value)} placeholder={isAr ? 'مثل: حساسية الفول السوداني' : 'e.g., Peanut allergy'} />
              </div>
              <Input label={isAr ? 'ملاحظات طبية أخرى' : 'Other Medical Notes'} value={medicalNotes} onChange={e => setMedicalNotes(e.target.value)} />
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-bold border-b pb-3">{isAr ? '📋 مراجعة الطلب' : '📋 Review Application'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm font-bold text-blue-800 mb-3">{isAr ? '👨‍🎓 الطالب' : '👨‍🎓 Student'}</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">{isAr ? 'الاسم:' : 'Name:'}</span> <strong>{studentFirstAr} {studentLastAr}</strong></p>
                    <p><span className="text-gray-500">{isAr ? 'الميلاد:' : 'DOB:'}</span> {dob}</p>
                    <p><span className="text-gray-500">{isAr ? 'الجنس:' : 'Gender:'}</span> {gender === 'male' ? (isAr ? 'ذكر' : 'Male') : (isAr ? 'أنثى' : 'Female')}</p>
                    <p><span className="text-gray-500">{isAr ? 'الصف:' : 'Grade:'}</span> {branchGrades.find(g => g.id === gradeId) ? getLocalizedValue(branchGrades.find(g => g.id === gradeId)!.name) : '-'}</p>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <p className="text-sm font-bold text-green-800 mb-3">{isAr ? '👨‍👩‍👧 ولي الأمر' : '👨‍👩‍👧 Parent'}</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">{isAr ? 'الاسم:' : 'Name:'}</span> <strong>{parentFirstAr} {parentLastAr}</strong></p>
                    <p><span className="text-gray-500">{isAr ? 'الهاتف:' : 'Phone:'}</span> {parentPhone}</p>
                    <p><span className="text-gray-500">{isAr ? 'البريد:' : 'Email:'}</span> {parentEmail || '-'}</p>
                    <p><span className="text-gray-500">{isAr ? 'الصلة:' : 'Relation:'}</span> {relationOptions.find(r => r.value === parentRelation)?.label}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-xl">
                <p className="text-sm font-bold text-yellow-800 mb-2">{isAr ? '📎 المستندات' : '📎 Documents'}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={birthCert ? 'success' : 'danger'}>{isAr ? 'شهادة الميلاد' : 'Birth Cert'} {birthCert ? '✓' : '✗'}</Badge>
                  <Badge variant={photo ? 'success' : 'danger'}>{isAr ? 'صورة' : 'Photo'} {photo ? '✓' : '✗'}</Badge>
                  <Badge variant={idDoc ? 'success' : 'danger'}>{isAr ? 'الهوية' : 'ID'} {idDoc ? '✓' : '✗'}</Badge>
                  <Badge variant={prevReport ? 'success' : 'default'}>{isAr ? 'شهادة سابقة' : 'Report'} {prevReport ? '✓' : '-'}</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setStep(s => Math.max(1, s - 1) as Step)} disabled={step === 1} leftIcon={isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}>
              {isAr ? 'السابق' : 'Previous'}
            </Button>
            {step < 5 ? (
              <Button onClick={() => setStep(s => Math.min(5, s + 1) as Step)} disabled={!canNext()} rightIcon={isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}>
                {isAr ? 'التالي' : 'Next'}
              </Button>
            ) : (
              <Button onClick={handleSubmit} leftIcon={<CheckCircle className="w-4 h-4" />} className="bg-green-600 hover:bg-green-700">
                {isAr ? 'إرسال الطلب' : 'Submit Application'}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
