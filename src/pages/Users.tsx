import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Users as UsersIcon, Search, Key } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { User, LocalizedText } from '../types/database';
import { sanitizeInput, isValidEmail } from '../utils/security';

interface UserFormData {
  username: string;
  email: string;
  firstNameAr: string;
  firstNameEn: string;
  lastNameAr: string;
  lastNameEn: string;
  phone: string;
  password: string;
  confirmPassword: string;
  roleId: string;
  branchIds: string[];
  isActive: boolean;
}

const initialFormData: UserFormData = {
  username: '',
  email: '',
  firstNameAr: '',
  firstNameEn: '',
  lastNameAr: '',
  lastNameEn: '',
  phone: '',
  password: '',
  confirmPassword: '',
  roleId: '',
  branchIds: [],
  isActive: true,
};

export const Users: React.FC = () => {
  const { t } = useTranslation();
  const { 
    users, 
    roles,
    branches,
    addUser, 
    updateUser, 
    deleteUser,
    addAuditLog 
  } = useDataStore();
  const { hasPermission, user: currentUser } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  const canCreate = hasPermission('users', 'create');
  const canUpdate = hasPermission('users', 'update');
  const canDelete = hasPermission('users', 'delete');

  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.firstName.ar.toLowerCase().includes(query) ||
      user.firstName.en.toLowerCase().includes(query);
    const matchesRole = !filterRole || user.roleId === filterRole;
    return matchesSearch && matchesRole;
  });

  const roleOptions = roles.map((r) => ({
    value: r.id,
    label: getLocalizedValue(r.name),
  }));

  const getRoleName = (roleId: string) => {
    const role = roles.find((r) => r.id === roleId);
    return role ? getLocalizedValue(role.name) : '-';
  };

  const getBranchNames = (branchIds: string[]) => {
    return branchIds
      .map((id) => {
        const branch = branches.find((b) => b.id === id);
        return branch ? getLocalizedValue(branch.name) : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.username.trim()) {
      errors.username = t('validation.required');
    }

    if (!formData.email.trim()) {
      errors.email = t('validation.required');
    } else if (!isValidEmail(formData.email)) {
      errors.email = t('validation.email');
    }

    if (!selectedUser && !formData.password) {
      errors.password = t('validation.required');
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('validation.passwordMatch');
    }

    if (!formData.roleId) {
      errors.roleId = t('validation.required');
    }

    if (formData.branchIds.length === 0) {
      errors.branchIds = t('validation.required');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        firstNameAr: user.firstName.ar,
        firstNameEn: user.firstName.en,
        lastNameAr: user.lastName.ar,
        lastNameEn: user.lastName.en,
        phone: user.phone,
        password: '',
        confirmPassword: '',
        roleId: user.roleId,
        branchIds: user.branchIds,
        isActive: user.isActive,
      });
    } else {
      setSelectedUser(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const firstName: LocalizedText = {
      ar: sanitizeInput(formData.firstNameAr),
      en: sanitizeInput(formData.firstNameEn),
    };

    const lastName: LocalizedText = {
      ar: sanitizeInput(formData.lastNameAr),
      en: sanitizeInput(formData.lastNameEn),
    };

    if (selectedUser) {
      const updateData: Partial<User> = {
        username: sanitizeInput(formData.username),
        email: sanitizeInput(formData.email),
        firstName,
        lastName,
        phone: sanitizeInput(formData.phone),
        roleId: formData.roleId,
        branchIds: formData.branchIds,
        currentBranchId: formData.branchIds[0],
        isActive: formData.isActive,
      };

      if (formData.password) {
        updateData.passwordHash = formData.password; // In real app, hash this
      }

      updateUser(selectedUser.id, updateData);

      addAuditLog({
        userId: currentUser!.id,
        action: 'update',
        module: 'users',
        entityId: selectedUser.id,
        oldValues: { username: selectedUser.username, email: selectedUser.email },
        newValues: { username: formData.username, email: formData.email },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('users.userUpdated'));
    } else {
      const newUser = addUser({
        username: sanitizeInput(formData.username),
        email: sanitizeInput(formData.email),
        passwordHash: formData.password, // In real app, hash this
        firstName,
        lastName,
        phone: sanitizeInput(formData.phone),
        roleId: formData.roleId,
        branchIds: formData.branchIds,
        currentBranchId: formData.branchIds[0],
        currentAcademicYearId: '',
        isActive: formData.isActive,
      });

      addAuditLog({
        userId: currentUser!.id,
        action: 'create',
        module: 'users',
        entityId: newUser.id,
        newValues: { username: formData.username, email: formData.email },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('users.userCreated'));
    }

    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedUser) {
      if (selectedUser.id === currentUser?.id) {
        showToast('error', language === 'ar' ? 'لا يمكنك حذف حسابك' : 'Cannot delete your own account');
        setIsDeleteModalOpen(false);
        return;
      }

      deleteUser(selectedUser.id);

      addAuditLog({
        userId: currentUser!.id,
        action: 'delete',
        module: 'users',
        entityId: selectedUser.id,
        oldValues: { username: selectedUser.username },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('users.userDeleted'));
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const handleToggleBranch = (branchId: string) => {
    setFormData((prev) => ({
      ...prev,
      branchIds: prev.branchIds.includes(branchId)
        ? prev.branchIds.filter((id) => id !== branchId)
        : [...prev.branchIds, branchId],
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('users.title')}
          subtitle={`${filteredUsers.length} ${language === 'ar' ? 'مستخدم' : 'users'}`}
          action={
            canCreate && (
              <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
                {t('users.addUser')}
              </Button>
            )
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            leftIcon={<Search className="w-5 h-5" />}
          />
          <Select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...roleOptions]}
            placeholder={t('users.role')}
          />
        </div>

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>{t('users.username')}</TableCell>
              <TableCell isHeader>{t('users.email')}</TableCell>
              <TableCell isHeader>{t('users.role')}</TableCell>
              <TableCell isHeader>{t('users.branches')}</TableCell>
              <TableCell isHeader>{t('common.status')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <UsersIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                        {user.firstName.en.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getLocalizedValue(user.firstName)} {getLocalizedValue(user.lastName)}
                        </p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="info">{getRoleName(user.roleId)}</Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {getBranchNames(user.branchIds)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenModal(user)}
                            title={t('common.edit')}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsResetPasswordModalOpen(true);
                            }}
                            title={t('users.resetPassword')}
                          >
                            <Key className="w-4 h-4 text-orange-500" />
                          </Button>
                        </>
                      )}
                      {canDelete && user.id !== currentUser?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
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
        title={selectedUser ? t('users.editUser') : t('users.addUser')}
        size="full"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('users.username')}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={formErrors.username}
              required
              dir="ltr"
            />
            <Input
              label={t('users.email')}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
              required
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('users.firstNameAr')}
              value={formData.firstNameAr}
              onChange={(e) => setFormData({ ...formData, firstNameAr: e.target.value })}
              required
              dir="rtl"
            />
            <Input
              label={t('users.firstNameEn')}
              value={formData.firstNameEn}
              onChange={(e) => setFormData({ ...formData, firstNameEn: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('users.lastNameAr')}
              value={formData.lastNameAr}
              onChange={(e) => setFormData({ ...formData, lastNameAr: e.target.value })}
              dir="rtl"
            />
            <Input
              label={t('users.lastNameEn')}
              value={formData.lastNameEn}
              onChange={(e) => setFormData({ ...formData, lastNameEn: e.target.value })}
              dir="ltr"
            />
          </div>

          <Input
            label={t('users.phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            dir="ltr"
          />

          {!selectedUser && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('users.password')}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                error={formErrors.password}
                required={!selectedUser}
              />
              <Input
                label={t('users.confirmPassword')}
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                error={formErrors.confirmPassword}
                required={!selectedUser}
              />
            </div>
          )}

          <Select
            label={t('users.role')}
            value={formData.roleId}
            onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
            options={roleOptions}
            placeholder={t('common.selectOption')}
            required
            error={formErrors.roleId}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('users.branches')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              {branches.filter(b => b.isActive).map((branch) => (
                <Checkbox
                  key={branch.id}
                  checked={formData.branchIds.includes(branch.id)}
                  onChange={() => handleToggleBranch(branch.id)}
                  label={getLocalizedValue(branch.name)}
                />
              ))}
            </div>
            {formErrors.branchIds && (
              <p className="mt-1 text-sm text-red-500">{formErrors.branchIds}</p>
            )}
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
              {selectedUser ? t('common.update') : t('common.create')}
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
            ? 'هل أنت متأكد من حذف هذا المستخدم؟'
            : 'Are you sure you want to delete this user?'}
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

      {/* Reset Password Modal */}
      <Modal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        title={t('users.resetPassword')}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label={t('users.password')}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <Input
            label={t('users.confirmPassword')}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsResetPasswordModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={() => {
                if (selectedUser && formData.password === formData.confirmPassword) {
                  updateUser(selectedUser.id, { passwordHash: formData.password });
                  showToast('success', t('users.passwordChanged'));
                  setIsResetPasswordModalOpen(false);
                  setFormData({ ...formData, password: '', confirmPassword: '' });
                }
              }}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
