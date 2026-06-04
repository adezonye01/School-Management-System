import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Invoice,
  InvoiceItem,
  Payment
} from '../types/database';

// Sample invoices
const sampleInvoices: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNumber: 'INV-2024-001',
    studentId: 'student-1',
    academicYearId: 'year-2024-2025',
    issueDate: '2024-09-01',
    dueDate: '2024-09-30',
    totalAmount: 21200,
    discountAmount: 0,
    taxAmount: 0,
    netAmount: 21200,
    paidAmount: 21200,
    status: 'paid',
    branchId: 'branch-1',
    createdBy: 'user-admin',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-15T00:00:00Z',
  },
  {
    id: 'inv-002',
    invoiceNumber: 'INV-2024-002',
    studentId: 'student-2',
    academicYearId: 'year-2024-2025',
    issueDate: '2024-09-01',
    dueDate: '2024-10-15',
    totalAmount: 21200,
    discountAmount: 2120,
    taxAmount: 0,
    netAmount: 19080,
    paidAmount: 9540,
    status: 'partial',
    branchId: 'branch-1',
    createdBy: 'user-admin',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-10-01T00:00:00Z',
  },
  {
    id: 'inv-003',
    invoiceNumber: 'INV-2024-003',
    studentId: 'student-3',
    academicYearId: 'year-2024-2025',
    issueDate: '2024-09-01',
    dueDate: '2024-09-30',
    totalAmount: 21200,
    discountAmount: 0,
    taxAmount: 0,
    netAmount: 21200,
    paidAmount: 0,
    status: 'overdue',
    branchId: 'branch-1',
    createdBy: 'user-admin',
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
];

const sampleInvoiceItems: InvoiceItem[] = [
  { id: 'ii-1', invoiceId: 'inv-001', feeCategoryId: 'fee-tuition-basic', description: { ar: 'الرسوم الدراسية الأساسية', en: 'Basic Tuition' }, quantity: 1, unitPrice: 18000, totalPrice: 18000, discountAmount: 0 },
  { id: 'ii-2', invoiceId: 'inv-001', feeCategoryId: 'fee-books-text', description: { ar: 'الكتب المدرسية', en: 'Textbooks' }, quantity: 1, unitPrice: 1200, totalPrice: 1200, discountAmount: 0 },
  { id: 'ii-3', invoiceId: 'inv-001', feeCategoryId: 'fee-registration', description: { ar: 'رسوم التسجيل', en: 'Registration' }, quantity: 1, unitPrice: 2000, totalPrice: 2000, discountAmount: 0 },
  { id: 'ii-4', invoiceId: 'inv-002', feeCategoryId: 'fee-tuition-basic', description: { ar: 'الرسوم الدراسية الأساسية', en: 'Basic Tuition' }, quantity: 1, unitPrice: 18000, totalPrice: 18000, discountAmount: 1800 },
  { id: 'ii-5', invoiceId: 'inv-002', feeCategoryId: 'fee-books-text', description: { ar: 'الكتب المدرسية', en: 'Textbooks' }, quantity: 1, unitPrice: 1200, totalPrice: 1200, discountAmount: 120 },
  { id: 'ii-6', invoiceId: 'inv-002', feeCategoryId: 'fee-registration', description: { ar: 'رسوم التسجيل', en: 'Registration' }, quantity: 1, unitPrice: 2000, totalPrice: 2000, discountAmount: 200 },
  { id: 'ii-7', invoiceId: 'inv-003', feeCategoryId: 'fee-tuition-basic', description: { ar: 'الرسوم الدراسية الأساسية', en: 'Basic Tuition' }, quantity: 1, unitPrice: 18000, totalPrice: 18000, discountAmount: 0 },
  { id: 'ii-8', invoiceId: 'inv-003', feeCategoryId: 'fee-books-text', description: { ar: 'الكتب المدرسية', en: 'Textbooks' }, quantity: 1, unitPrice: 1200, totalPrice: 1200, discountAmount: 0 },
  { id: 'ii-9', invoiceId: 'inv-003', feeCategoryId: 'fee-registration', description: { ar: 'رسوم التسجيل', en: 'Registration' }, quantity: 1, unitPrice: 2000, totalPrice: 2000, discountAmount: 0 },
];

const samplePayments: Payment[] = [
  { id: 'pay-001', receiptNumber: 'RCP-2024-001', invoiceId: 'inv-001', studentId: 'student-1', amount: 21200, paymentMethod: 'bank_transfer', paymentDate: '2024-09-15', referenceNumber: 'TRF-98765', bankName: 'Al Rajhi Bank', receivedBy: 'user-admin', branchId: 'branch-1', createdAt: '2024-09-15T00:00:00Z' },
  { id: 'pay-002', receiptNumber: 'RCP-2024-002', invoiceId: 'inv-002', studentId: 'student-2', amount: 9540, paymentMethod: 'cash', paymentDate: '2024-10-01', receivedBy: 'user-admin', branchId: 'branch-1', createdAt: '2024-10-01T00:00:00Z' },
];

interface InvoiceState {
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  payments: Payment[];

  // Invoice CRUD
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoiceById: (id: string) => Invoice | undefined;
  getInvoicesByStudent: (studentId: string) => Invoice[];
  getInvoicesByBranch: (branchId: string, academicYearId?: string) => Invoice[];

  // Invoice Items
  addInvoiceItem: (item: Omit<InvoiceItem, 'id'>) => InvoiceItem;
  getItemsByInvoice: (invoiceId: string) => InvoiceItem[];
  deleteInvoiceItem: (id: string) => void;

  // Payments
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  getPaymentsByInvoice: (invoiceId: string) => Payment[];
  getPaymentsByStudent: (studentId: string) => Payment[];
  deletePayment: (id: string) => void;

  // Helpers
  generateInvoiceNumber: () => string;
  generateReceiptNumber: () => string;
  recalcInvoiceStatus: (invoiceId: string) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set, get) => ({
      invoices: sampleInvoices,
      invoiceItems: sampleInvoiceItems,
      payments: samplePayments,

      addInvoice: (data) => {
        const inv: Invoice = { ...data, id: `inv-${uuidv4()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set((s) => ({ invoices: [...s.invoices, inv] }));
        return inv;
      },
      updateInvoice: (id, data) => {
        set((s) => ({ invoices: s.invoices.map((i) => i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i) }));
      },
      deleteInvoice: (id) => {
        set((s) => ({
          invoices: s.invoices.filter((i) => i.id !== id),
          invoiceItems: s.invoiceItems.filter((i) => i.invoiceId !== id),
          payments: s.payments.filter((p) => p.invoiceId !== id),
        }));
      },
      getInvoiceById: (id) => get().invoices.find((i) => i.id === id),
      getInvoicesByStudent: (studentId) => get().invoices.filter((i) => i.studentId === studentId),
      getInvoicesByBranch: (branchId, academicYearId) =>
        get().invoices.filter((i) => i.branchId === branchId && (!academicYearId || i.academicYearId === academicYearId)),

      addInvoiceItem: (data) => {
        const item: InvoiceItem = { ...data, id: `ii-${uuidv4()}` };
        set((s) => ({ invoiceItems: [...s.invoiceItems, item] }));
        return item;
      },
      getItemsByInvoice: (invoiceId) => get().invoiceItems.filter((i) => i.invoiceId === invoiceId),
      deleteInvoiceItem: (id) => {
        set((s) => ({ invoiceItems: s.invoiceItems.filter((i) => i.id !== id) }));
      },

      addPayment: (data) => {
        const payment: Payment = { ...data, id: `pay-${uuidv4()}`, createdAt: new Date().toISOString() };
        set((s) => ({ payments: [...s.payments, payment] }));
        // Update invoice paid amount
        const invoice = get().getInvoiceById(data.invoiceId);
        if (invoice) {
          const allPayments = [...get().getPaymentsByInvoice(data.invoiceId), payment];
          const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
          let status: Invoice['status'] = 'issued';
          if (totalPaid >= invoice.netAmount) status = 'paid';
          else if (totalPaid > 0) status = 'partial';
          get().updateInvoice(invoice.id, { paidAmount: totalPaid, status });
        }
        return payment;
      },
      getPaymentsByInvoice: (invoiceId) => get().payments.filter((p) => p.invoiceId === invoiceId),
      getPaymentsByStudent: (studentId) => get().payments.filter((p) => p.studentId === studentId),
      deletePayment: (id) => {
        const payment = get().payments.find((p) => p.id === id);
        set((s) => ({ payments: s.payments.filter((p) => p.id !== id) }));
        if (payment) {
          get().recalcInvoiceStatus(payment.invoiceId);
        }
      },

      generateInvoiceNumber: () => {
        const year = new Date().getFullYear();
        const count = get().invoices.length + 1;
        return `INV-${year}-${String(count).padStart(3, '0')}`;
      },
      generateReceiptNumber: () => {
        const year = new Date().getFullYear();
        const count = get().payments.length + 1;
        return `RCP-${year}-${String(count).padStart(3, '0')}`;
      },
      recalcInvoiceStatus: (invoiceId) => {
        const invoice = get().getInvoiceById(invoiceId);
        if (!invoice) return;
        const totalPaid = get().getPaymentsByInvoice(invoiceId).reduce((s, p) => s + p.amount, 0);
        let status: Invoice['status'] = 'issued';
        if (totalPaid >= invoice.netAmount) status = 'paid';
        else if (totalPaid > 0) status = 'partial';
        else if (new Date(invoice.dueDate) < new Date()) status = 'overdue';
        get().updateInvoice(invoiceId, { paidAmount: totalPaid, status });
      },
    }),
    { name: 'invoice-data-storage' }
  )
);
