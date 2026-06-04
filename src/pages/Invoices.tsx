import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Eye, Trash2, Receipt, Search,
  CreditCard, ChevronDown, ChevronRight,
  CheckCircle, Clock, AlertTriangle, XCircle, Banknote,
  Building, Smartphone, FileText
} from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useInvoiceStore } from '../stores/invoiceStore';
import { useFeeStore } from '../stores/feeStore';
import { useAcademicStore } from '../stores/academicStore';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { Invoice, PaymentMethod } from '../types/database';
import clsx from 'clsx';

export const Invoices: React.FC = () => {
  const { t } = useTranslation();
  const {
    invoices, getInvoicesByBranch, getItemsByInvoice,
    getPaymentsByInvoice, addInvoice, addInvoiceItem, addPayment,
    deleteInvoice, generateInvoiceNumber, generateReceiptNumber,
    getPaymentsByStudent,
  } = useInvoiceStore();
  const { getFeeCategoryById, getFeeGradeAssignmentsByGrade } = useFeeStore();
  const { students, getEnhancedGradeById } = useAcademicStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { hasPermission, user } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStatementOpen, setIsStatementOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [statementStudentId, setStatementStudentId] = useState('');

  // Create invoice form
  const [createStudentId, setCreateStudentId] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [selectedFeeItems, setSelectedFeeItems] = useState<{ catId: string; amount: number; discount: number }[]>([]);

  // Payment form
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payRef, setPayRef] = useState('');
  const [payBank, setPayBank] = useState('');
  const [payCheckNum, setPayCheckNum] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const canCreate = hasPermission('fees', 'create');
  const canDelete = hasPermission('fees', 'delete');

  const branchInvoices = currentBranch && currentAcademicYear
    ? getInvoicesByBranch(currentBranch.id, currentAcademicYear.id)
    : [];

  const branchStudents = currentBranch && currentAcademicYear
    ? students.filter((s) => s.branchId === currentBranch.id && s.academicYearId === currentAcademicYear.id && s.isActive)
    : [];

  const filtered = branchInvoices.filter((inv) => {
    const student = branchStudents.find((s) => s.id === inv.studentId);
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || inv.invoiceNumber.toLowerCase().includes(q) ||
      (student && (student.firstName.ar.includes(q) || student.firstName.en.toLowerCase().includes(q) || student.studentNumber.toLowerCase().includes(q)));
    const matchStatus = !filterStatus || inv.status === filterStatus;
    return matchSearch && matchStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const statusOptions = [
    { value: '', label: t('common.all') },
    { value: 'draft', label: language === 'ar' ? 'مسودة' : 'Draft' },
    { value: 'issued', label: language === 'ar' ? 'صادرة' : 'Issued' },
    { value: 'paid', label: t('installments.paid') },
    { value: 'partial', label: t('installments.partial') },
    { value: 'overdue', label: t('installments.overdue') },
    { value: 'cancelled', label: language === 'ar' ? 'ملغاة' : 'Cancelled' },
  ];

  const paymentMethodOptions = [
    { value: 'cash', label: t('invoices.cash') },
    { value: 'bank_transfer', label: t('invoices.bankTransfer') },
    { value: 'check', label: t('invoices.check') },
    { value: 'digital_wallet', label: t('invoices.digitalWallet') },
    { value: 'card', label: t('invoices.card') },
  ];

  const studentOptions = branchStudents.map((s) => ({
    value: s.id,
    label: `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)} (${s.studentNumber})`,
  }));

  const getStudentName = (id: string) => {
    const s = branchStudents.find((st) => st.id === id);
    return s ? `${getLocalizedValue(s.firstName)} ${getLocalizedValue(s.lastName)}` : '-';
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; icon: React.ReactNode }> = {
      paid: { variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
      partial: { variant: 'warning', icon: <Clock className="w-3 h-3" /> },
      overdue: { variant: 'danger', icon: <AlertTriangle className="w-3 h-3" /> },
      issued: { variant: 'info', icon: <FileText className="w-3 h-3" /> },
      draft: { variant: 'default', icon: <FileText className="w-3 h-3" /> },
      cancelled: { variant: 'danger', icon: <XCircle className="w-3 h-3" /> },
    };
    const m = map[status] || map.draft;
    const label = statusOptions.find((o) => o.value === status)?.label || status;
    return <Badge variant={m.variant}><span className="flex items-center gap-1">{m.icon}{label}</span></Badge>;
  };

  const getPayMethodIcon = (method: PaymentMethod) => {
    const icons: Record<string, React.ReactNode> = {
      cash: <Banknote className="w-4 h-4 text-green-600" />,
      bank_transfer: <Building className="w-4 h-4 text-blue-600" />,
      check: <FileText className="w-4 h-4 text-purple-600" />,
      digital_wallet: <Smartphone className="w-4 h-4 text-orange-600" />,
      card: <CreditCard className="w-4 h-4 text-indigo-600" />,
    };
    return icons[method] || icons.cash;
  };

  // Stats
  const totalIssued = branchInvoices.reduce((s, i) => s + i.netAmount, 0);
  const totalPaid = branchInvoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalBalance = totalIssued - totalPaid;
  const overdueCount = branchInvoices.filter((i) => i.status === 'overdue').length;

  // Create Invoice
  const openCreateModal = () => {
    setCreateStudentId('');
    setCreateDueDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
    setSelectedFeeItems([]);
    setIsCreateOpen(true);
  };

  const loadStudentFees = (studentId: string) => {
    setCreateStudentId(studentId);
    const student = branchStudents.find((s) => s.id === studentId);
    if (!student || !currentAcademicYear) return;
    const assignments = getFeeGradeAssignmentsByGrade(student.currentGradeId, currentAcademicYear.id);
    setSelectedFeeItems(assignments.map((a) => ({ catId: a.feeCategoryId, amount: a.amount, discount: 0 })));
  };

  const handleCreateInvoice = () => {
    if (!currentBranch || !currentAcademicYear || !createStudentId || !user) return;

    const totalAmount = selectedFeeItems.reduce((s, i) => s + i.amount, 0);
    const discountAmount = selectedFeeItems.reduce((s, i) => s + i.discount, 0);
    const netAmount = totalAmount - discountAmount;

    const inv = addInvoice({
      invoiceNumber: generateInvoiceNumber(),
      studentId: createStudentId,
      academicYearId: currentAcademicYear.id,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: createDueDate,
      totalAmount,
      discountAmount,
      taxAmount: 0,
      netAmount,
      paidAmount: 0,
      status: 'issued',
      branchId: currentBranch.id,
      createdBy: user.id,
    });

    selectedFeeItems.forEach((item) => {
      const cat = getFeeCategoryById(item.catId);
      addInvoiceItem({
        invoiceId: inv.id,
        feeCategoryId: item.catId,
        description: cat ? cat.name : { ar: '-', en: '-' },
        quantity: 1,
        unitPrice: item.amount,
        totalPrice: item.amount,
        discountAmount: item.discount,
      });
    });

    showToast('success', language === 'ar' ? 'تم إنشاء الفاتورة بنجاح' : 'Invoice created successfully');
    setIsCreateOpen(false);
  };

  // Record Payment
  const openPaymentModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.netAmount - inv.paidAmount);
    setPayMethod('cash');
    setPayRef('');
    setPayBank('');
    setPayCheckNum('');
    setPayNotes('');
    setIsPaymentOpen(true);
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !currentBranch || !user || payAmount <= 0) return;

    addPayment({
      receiptNumber: generateReceiptNumber(),
      invoiceId: selectedInvoice.id,
      studentId: selectedInvoice.studentId,
      amount: payAmount,
      paymentMethod: payMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      referenceNumber: payRef || undefined,
      bankName: payBank || undefined,
      checkNumber: payCheckNum || undefined,
      notes: payNotes || undefined,
      receivedBy: user.id,
      branchId: currentBranch.id,
    });

    showToast('success', language === 'ar' ? 'تم تسجيل الدفعة بنجاح' : 'Payment recorded successfully');
    setIsPaymentOpen(false);
  };

  // Student Statement
  const openStatement = (studentId: string) => {
    setStatementStudentId(studentId);
    setIsStatementOpen(true);
  };

  const statementInvoices = statementStudentId ? invoices.filter((i) => i.studentId === statementStudentId) : [];
  const statementPayments = statementStudentId ? getPaymentsByStudent(statementStudentId) : [];
  const stmtTotalCharged = statementInvoices.reduce((s, i) => s + i.netAmount, 0);
  const stmtTotalPaid = statementPayments.reduce((s, p) => s + p.amount, 0);
  const stmtBalance = stmtTotalCharged - stmtTotalPaid;

  const handleDeleteInvoice = () => {
    if (selectedInvoice) {
      deleteInvoice(selectedInvoice.id);
      showToast('success', t('common.success'));
      setIsDeleteOpen(false);
      setSelectedInvoice(null);
      setExpandedInvoice(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'إجمالي المستحقات' : 'Total Charged'}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{totalIssued.toLocaleString()} <span className="text-xs font-normal">SAR</span></p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'إجمالي المحصّل' : 'Total Collected'}</p>
              <p className="text-lg font-bold text-green-600">{totalPaid.toLocaleString()} <span className="text-xs font-normal">SAR</span></p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'الرصيد المتبقي' : 'Outstanding Balance'}</p>
              <p className="text-lg font-bold text-orange-600">{totalBalance.toLocaleString()} <span className="text-xs font-normal">SAR</span></p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{language === 'ar' ? 'فواتير متأخرة' : 'Overdue Invoices'}</p>
              <p className="text-lg font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('invoices.title')}
          subtitle={`${filtered.length} ${language === 'ar' ? 'فاتورة' : 'invoices'}`}
          action={canCreate && (
            <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>{t('invoices.createInvoice')}</Button>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('common.search')} leftIcon={<Search className="w-5 h-5" />} />
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} options={statusOptions} />
        </div>

        {/* Invoices List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('common.noData')}</p>
            </div>
          ) : filtered.map((inv) => {
            const isExpanded = expandedInvoice === inv.id;
            const items = getItemsByInvoice(inv.id);
            const payments = getPaymentsByInvoice(inv.id);
            const balance = inv.netAmount - inv.paidAmount;
            const student = branchStudents.find((s) => s.id === inv.studentId);
            const grade = student ? getEnhancedGradeById(student.currentGradeId) : null;

            return (
              <div key={inv.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {/* Invoice Header */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50" onClick={() => setExpandedInvoice(isExpanded ? null : inv.id)}>
                  <div className="flex items-center gap-4">
                    <button className="text-gray-400">{isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}</button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-600">{inv.invoiceNumber}</span>
                        {getStatusBadge(inv.status)}
                      </div>
                      <p className="text-sm text-gray-500">{getStudentName(inv.studentId)} {grade ? `• ${getLocalizedValue(grade.name)}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="text-end">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{inv.netAmount.toLocaleString()} SAR</p>
                      {balance > 0 && <p className="text-sm text-red-500">{language === 'ar' ? 'متبقي' : 'Balance'}: {balance.toLocaleString()}</p>}
                    </div>
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <Button size="sm" onClick={() => openPaymentModal(inv)} leftIcon={<Banknote className="w-4 h-4" />}>
                        {language === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openStatement(inv.studentId)}><Eye className="w-4 h-4" /></Button>
                    {canDelete && inv.status === 'draft' && (
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedInvoice(inv); setIsDeleteOpen(true); }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {/* Items */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                      <h4 className="font-medium mb-3">{language === 'ar' ? 'بنود الفاتورة' : 'Invoice Items'}</h4>
                      <Table>
                        <TableHead><TableRow>
                          <TableCell isHeader>#</TableCell>
                          <TableCell isHeader>{language === 'ar' ? 'البند' : 'Item'}</TableCell>
                          <TableCell isHeader>{t('feeAssignment.amount')}</TableCell>
                          <TableCell isHeader>{language === 'ar' ? 'الخصم' : 'Discount'}</TableCell>
                          <TableCell isHeader>{language === 'ar' ? 'الصافي' : 'Net'}</TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                          {items.map((item, idx) => (
                            <TableRow key={item.id}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell><span className="font-medium">{getLocalizedValue(item.description)}</span></TableCell>
                              <TableCell>{item.totalPrice.toLocaleString()}</TableCell>
                              <TableCell>{item.discountAmount > 0 ? <span className="text-red-500">-{item.discountAmount.toLocaleString()}</span> : '-'}</TableCell>
                              <TableCell><span className="font-bold">{(item.totalPrice - item.discountAmount).toLocaleString()}</span></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <div className="flex justify-end mt-3">
                        <div className="w-64 space-y-1 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">{language === 'ar' ? 'المجموع' : 'Subtotal'}</span><span>{inv.totalAmount.toLocaleString()}</span></div>
                          {inv.discountAmount > 0 && <div className="flex justify-between text-red-500"><span>{language === 'ar' ? 'الخصم' : 'Discount'}</span><span>-{inv.discountAmount.toLocaleString()}</span></div>}
                          <div className="flex justify-between font-bold text-lg border-t pt-1"><span>{language === 'ar' ? 'الصافي' : 'Net'}</span><span>{inv.netAmount.toLocaleString()} SAR</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Payments */}
                    {payments.length > 0 && (
                      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium mb-3">{language === 'ar' ? 'المدفوعات' : 'Payments'}</h4>
                        <div className="space-y-2">
                          {payments.map((p) => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-3">
                                {getPayMethodIcon(p.paymentMethod)}
                                <div>
                                  <p className="font-medium text-sm">{p.receiptNumber}</p>
                                  <p className="text-xs text-gray-500">{new Date(p.paymentDate).toLocaleDateString()} • {paymentMethodOptions.find((o) => o.value === p.paymentMethod)?.label}</p>
                                  {p.referenceNumber && <p className="text-xs text-gray-400">{language === 'ar' ? 'المرجع' : 'Ref'}: {p.referenceNumber}</p>}
                                </div>
                              </div>
                              <span className="font-bold text-green-700">{p.amount.toLocaleString()} SAR</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Create Invoice Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title={t('invoices.createInvoice')} size="full">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pe-2">
          <Select label={language === 'ar' ? 'الطالب' : 'Student'} value={createStudentId} onChange={(e) => loadStudentFees(e.target.value)} options={[{ value: '', label: t('common.selectOption') }, ...studentOptions]} required />
          <Input label={t('invoices.dueDate')} type="date" value={createDueDate} onChange={(e) => setCreateDueDate(e.target.value)} required />

          {selectedFeeItems.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">{language === 'ar' ? 'بنود الفاتورة' : 'Fee Items'}</h4>
              <Table>
                <TableHead><TableRow>
                  <TableCell isHeader>{language === 'ar' ? 'الفئة' : 'Category'}</TableCell>
                  <TableCell isHeader>{t('feeAssignment.amount')}</TableCell>
                  <TableCell isHeader>{language === 'ar' ? 'الخصم' : 'Discount'}</TableCell>
                  <TableCell isHeader>{language === 'ar' ? 'الصافي' : 'Net'}</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {selectedFeeItems.map((item, idx) => {
                    const cat = getFeeCategoryById(item.catId);
                    return (
                      <TableRow key={idx}>
                        <TableCell>{cat ? getLocalizedValue(cat.name) : '-'}</TableCell>
                        <TableCell>
                          <Input type="number" value={item.amount} onChange={(e) => {
                            const updated = [...selectedFeeItems];
                            updated[idx] = { ...updated[idx], amount: parseFloat(e.target.value) || 0 };
                            setSelectedFeeItems(updated);
                          }} min={0} />
                        </TableCell>
                        <TableCell>
                          <Input type="number" value={item.discount} onChange={(e) => {
                            const updated = [...selectedFeeItems];
                            updated[idx] = { ...updated[idx], discount: parseFloat(e.target.value) || 0 };
                            setSelectedFeeItems(updated);
                          }} min={0} />
                        </TableCell>
                        <TableCell><span className="font-bold">{(item.amount - item.discount).toLocaleString()}</span></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="flex justify-end mt-3">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between"><span>{language === 'ar' ? 'المجموع' : 'Subtotal'}</span><span>{selectedFeeItems.reduce((s, i) => s + i.amount, 0).toLocaleString()}</span></div>
                  <div className="flex justify-between text-red-500"><span>{language === 'ar' ? 'الخصم' : 'Discount'}</span><span>-{selectedFeeItems.reduce((s, i) => s + i.discount, 0).toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t pt-1"><span>{language === 'ar' ? 'الصافي' : 'Net'}</span><span>{selectedFeeItems.reduce((s, i) => s + (i.amount - i.discount), 0).toLocaleString()} SAR</span></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-800">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleCreateInvoice} disabled={!createStudentId || selectedFeeItems.length === 0}>{t('common.create')}</Button>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentOpen} onClose={() => setIsPaymentOpen(false)} title={language === 'ar' ? '💳 تسجيل دفعة' : '💳 Record Payment'} size="lg">
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">{t('invoices.invoiceNumber')}</p>
                  <p className="font-bold text-blue-600">{selectedInvoice.invoiceNumber}</p>
                </div>
                <div className="text-end">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المتبقي' : 'Balance'}</p>
                  <p className="text-2xl font-bold text-red-600">{(selectedInvoice.netAmount - selectedInvoice.paidAmount).toLocaleString()} SAR</p>
                </div>
              </div>
            </div>

            <Input label={t('installments.amount')} type="number" value={payAmount} onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)} min={0} max={selectedInvoice.netAmount - selectedInvoice.paidAmount} required />

            <Select label={t('invoices.paymentMethod')} value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethod)} options={paymentMethodOptions} />

            {(payMethod === 'bank_transfer' || payMethod === 'check') && (
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('invoices.referenceNumber')} value={payRef} onChange={(e) => setPayRef(e.target.value)} />
                {payMethod === 'bank_transfer' && <Input label={t('invoices.bankName')} value={payBank} onChange={(e) => setPayBank(e.target.value)} />}
                {payMethod === 'check' && <Input label={t('invoices.checkNumber')} value={payCheckNum} onChange={(e) => setPayCheckNum(e.target.value)} />}
              </div>
            )}

            <Input label={language === 'ar' ? 'ملاحظات' : 'Notes'} value={payNotes} onChange={(e) => setPayNotes(e.target.value)} />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="secondary" onClick={() => setIsPaymentOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleRecordPayment} disabled={payAmount <= 0} leftIcon={<CheckCircle className="w-4 h-4" />}>
                {language === 'ar' ? 'تأكيد الدفع' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Student Statement Modal */}
      <Modal isOpen={isStatementOpen} onClose={() => setIsStatementOpen(false)} title={`📊 ${t('studentLedger.title')}`} size="full">
        <div className="space-y-4">
          {/* Student Info */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white">
            <p className="text-sm opacity-80">{language === 'ar' ? 'كشف حساب الطالب' : 'Student Account Statement'}</p>
            <p className="text-xl font-bold">{getStudentName(statementStudentId)}</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card padding="sm">
              <p className="text-xs text-gray-500">{t('studentLedger.totalCharges')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stmtTotalCharged.toLocaleString()} <span className="text-xs font-normal">SAR</span></p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-gray-500">{t('studentLedger.totalPayments')}</p>
              <p className="text-xl font-bold text-green-600">{stmtTotalPaid.toLocaleString()} <span className="text-xs font-normal">SAR</span></p>
            </Card>
            <Card padding="sm">
              <p className="text-xs text-gray-500">{t('studentLedger.currentBalance')}</p>
              <p className={clsx('text-xl font-bold', stmtBalance > 0 ? 'text-red-600' : 'text-green-600')}>
                {stmtBalance.toLocaleString()} <span className="text-xs font-normal">SAR</span>
              </p>
            </Card>
          </div>

          {/* Transactions */}
          <div>
            <h4 className="font-medium mb-3">{language === 'ar' ? 'سجل الحركات' : 'Transaction History'}</h4>
            <Table>
              <TableHead><TableRow>
                <TableCell isHeader>{language === 'ar' ? 'التاريخ' : 'Date'}</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'النوع' : 'Type'}</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'الرقم المرجعي' : 'Reference'}</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'مدين' : 'Debit'}</TableCell>
                <TableCell isHeader>{language === 'ar' ? 'دائن' : 'Credit'}</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {(() => {
                  // Merge invoices and payments into timeline
                  const transactions: { date: string; type: 'charge' | 'payment'; ref: string; debit: number; credit: number }[] = [];
                  statementInvoices.forEach((inv) => {
                    transactions.push({ date: inv.issueDate, type: 'charge', ref: inv.invoiceNumber, debit: inv.netAmount, credit: 0 });
                  });
                  statementPayments.forEach((p) => {
                    transactions.push({ date: p.paymentDate, type: 'payment', ref: p.receiptNumber, debit: 0, credit: p.amount });
                  });
                  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                  return transactions.map((tx, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'charge' ? 'warning' : 'success'}>
                          {tx.type === 'charge' ? (language === 'ar' ? 'فاتورة' : 'Invoice') : (language === 'ar' ? 'دفعة' : 'Payment')}
                        </Badge>
                      </TableCell>
                      <TableCell><span className="font-mono text-sm">{tx.ref}</span></TableCell>
                      <TableCell>{tx.debit > 0 ? <span className="text-red-600 font-medium">{tx.debit.toLocaleString()}</span> : '-'}</TableCell>
                      <TableCell>{tx.credit > 0 ? <span className="text-green-600 font-medium">{tx.credit.toLocaleString()}</span> : '-'}</TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsStatementOpen(false)}>{t('common.close')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title={t('common.confirm')} size="sm">
        <p className="text-gray-600 dark:text-gray-300 mb-6">{language === 'ar' ? 'هل أنت متأكد من حذف هذه الفاتورة؟' : 'Delete this invoice?'}</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={handleDeleteInvoice}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
};
