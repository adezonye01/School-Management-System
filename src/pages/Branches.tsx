import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { Branch, LocalizedText } from '../types/database';
import { sanitizeInput } from '../utils/security';

interface BranchFormData {
  nameAr: string;
  nameEn: string;
  code: string;
  addressAr: string;
  addressEn: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const initialFormData: BranchFormData = {
  nameAr: '',
  nameEn: '',
  code: '',
  addressAr: '',
  addressEn: '',
  phone: '',
  email: '',
  isActive: true,
};

export const Branches: React.FC = () => {
  const { t } = useTranslation();
  const { branches, addBranch, updateBranch, deleteBranch, addAuditLog } = useDataStore();
  const { hasPermission, user } = useAuthStore();
  const { getLocalizedValue } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState<BranchFormData>(initialFormData);

  const canCreate = hasPermission('branches', 'create');
  const canUpdate = hasPermission('branches', 'update');
  const canDelete = hasPermission('branches', 'delete');

  const filteredBranches = branches.filter((branch) => {
    const query = searchQuery.toLowerCase();
    return (
      branch.name.ar.toLowerCase().includes(query) ||
      branch.name.en.toLowerCase().includes(query) ||
      branch.code.toLowerCase().includes(query)
    );
  });

  const handleOpenModal = (branch?: Branch) => {
    if (branch) {
      setSelectedBranch(branch);
      setFormData({
        nameAr: branch.name.ar,
        nameEn: branch.name.en,
        code: branch.code,
        addressAr: branch.address.ar,
        addressEn: branch.address.en,
        phone: branch.phone,
        email: branch.email,
        isActive: branch.isActive,
      });
    } else {
      setSelectedBranch(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBranch(null);
    setFormData(initialFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name: LocalizedText = {
      ar: sanitizeInput(formData.nameAr),
      en: sanitizeInput(formData.nameEn),
    };

    const address: LocalizedText = {
      ar: sanitizeInput(formData.addressAr),
      en: sanitizeInput(formData.addressEn),
    };

    if (selectedBranch) {
      updateBranch(selectedBranch.id, {
        name,
        code: sanitizeInput(formData.code),
        address,
        phone: sanitizeInput(formData.phone),
        email: sanitizeInput(formData.email),
        isActive: formData.isActive,
      });

      addAuditLog({
        userId: user!.id,
        action: 'update',
        module: 'branches',
        entityId: selectedBranch.id,
        oldValues: selectedBranch,
        newValues: { name, code: formData.code, address },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('branches.branchUpdated'));
    } else {
      const newBranch = addBranch({
        name,
        code: sanitizeInput(formData.code),
        address,
        phone: sanitizeInput(formData.phone),
        email: sanitizeInput(formData.email),
        isActive: formData.isActive,
      });

      addAuditLog({
        userId: user!.id,
        action: 'create',
        module: 'branches',
        entityId: newBranch.id,
        newValues: { name, code: formData.code },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('branches.branchCreated'));
    }

    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedBranch) {
      deleteBranch(selectedBranch.id);

      addAuditLog({
        userId: user!.id,
        action: 'delete',
        module: 'branches',
        entityId: selectedBranch.id,
        oldValues: selectedBranch,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('branches.branchDeleted'));
      setIsDeleteModalOpen(false);
      setSelectedBranch(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('branches.title')}
          subtitle={`${filteredBranches.length} ${t('sidebar.branches')}`}
          action={
            canCreate && (
              <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
                {t('branches.addBranch')}
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
              <TableCell isHeader>{t('branches.branchName')}</TableCell>
              <TableCell isHeader>{t('branches.branchCode')}</TableCell>
              <TableCell isHeader>{t('branches.address')}</TableCell>
              <TableCell isHeader>{t('branches.phone')}</TableCell>
              <TableCell isHeader>{t('common.status')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBranches.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredBranches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getLocalizedValue(branch.name)}
                        </p>
                        <p className="text-xs text-gray-500">{branch.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{branch.code}</Badge>
                  </TableCell>
                  <TableCell>{getLocalizedValue(branch.address)}</TableCell>
                  <TableCell>{branch.phone}</TableCell>
                  <TableCell>
                    <Badge variant={branch.isActive ? 'success' : 'danger'}>
                      {branch.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(branch)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBranch(branch);
                            setIsDeleteModalOpen(true);
                          }}
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
        title={selectedBranch ? t('branches.editBranch') : t('branches.addBranch')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('branches.branchNameAr')}
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              required
              dir="rtl"
            />
            <Input
              label={t('branches.branchNameEn')}
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <Input
            label={t('branches.branchCode')}
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            required
            maxLength={10}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('branches.addressAr')}
              value={formData.addressAr}
              onChange={(e) => setFormData({ ...formData, addressAr: e.target.value })}
              dir="rtl"
            />
            <Input
              label={t('branches.addressEn')}
              value={formData.addressEn}
              onChange={(e) => setFormData({ ...formData, addressEn: e.target.value })}
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('branches.phone')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              type="tel"
              dir="ltr"
            />
            <Input
              label={t('branches.email')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              type="email"
              dir="ltr"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
              {t('common.active')}
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {selectedBranch ? t('common.update') : t('common.create')}
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
          {t('branches.deleteBranchConfirm')}
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
