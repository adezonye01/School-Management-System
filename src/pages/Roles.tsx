import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Shield, Copy, Users, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import { useToast } from '../components/ui/Toast';
import type { Role, LocalizedText, RolePermission, PermissionModule } from '../types/database';
import { sanitizeInput } from '../utils/security';
import clsx from 'clsx';

interface RoleFormData {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  permissions: RolePermission[];
}

const initialFormData: RoleFormData = {
  nameAr: '',
  nameEn: '',
  descriptionAr: '',
  descriptionEn: '',
  permissions: [],
};

export const Roles: React.FC = () => {
  const { t } = useTranslation();
  const { 
    roles, 
    users,
    permissionModules,
    addRole, 
    updateRole, 
    deleteRole,
    duplicateRole,
    addAuditLog 
  } = useDataStore();
  const { hasPermission, user } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormData>(initialFormData);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  const canCreate = hasPermission('roles', 'create');
  const canUpdate = hasPermission('roles', 'update');
  const canDelete = hasPermission('roles', 'delete');

  const filteredRoles = roles.filter((role) => {
    const query = searchQuery.toLowerCase();
    return (
      role.name.ar.toLowerCase().includes(query) ||
      role.name.en.toLowerCase().includes(query)
    );
  });

  const getUserCountForRole = (roleId: string) => {
    return users.filter((u) => u.roleId === roleId).length;
  };

  const toggleModule = (moduleCode: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleCode)
        ? prev.filter((m) => m !== moduleCode)
        : [...prev, moduleCode]
    );
  };

  const hasPermissionInForm = (moduleCode: string, action: string): boolean => {
    const modulePerm = formData.permissions.find((p) => p.moduleCode === moduleCode);
    return modulePerm?.actions.includes(action) || false;
  };

  const togglePermission = (moduleCode: string, action: string) => {
    setFormData((prev) => {
      const existingIndex = prev.permissions.findIndex((p) => p.moduleCode === moduleCode);
      
      if (existingIndex === -1) {
        // Add new module permission
        return {
          ...prev,
          permissions: [...prev.permissions, { moduleCode, actions: [action] }],
        };
      }

      const newPermissions = [...prev.permissions];
      const modulePerm = { ...newPermissions[existingIndex] };
      
      if (modulePerm.actions.includes(action)) {
        // Remove action
        modulePerm.actions = modulePerm.actions.filter((a) => a !== action);
        if (modulePerm.actions.length === 0) {
          // Remove entire module if no actions left
          newPermissions.splice(existingIndex, 1);
        } else {
          newPermissions[existingIndex] = modulePerm;
        }
      } else {
        // Add action
        modulePerm.actions = [...modulePerm.actions, action];
        newPermissions[existingIndex] = modulePerm;
      }

      return { ...prev, permissions: newPermissions };
    });
  };

  const toggleAllActionsForModule = (module: PermissionModule, checked: boolean) => {
    setFormData((prev) => {
      const newPermissions = prev.permissions.filter((p) => p.moduleCode !== module.code);
      
      if (checked) {
        newPermissions.push({
          moduleCode: module.code,
          actions: module.actions.map((a) => a.code),
        });
      }

      return { ...prev, permissions: newPermissions };
    });
  };

  const isAllActionsSelected = (module: PermissionModule): boolean => {
    const modulePerm = formData.permissions.find((p) => p.moduleCode === module.code);
    if (!modulePerm) return false;
    return module.actions.every((a) => modulePerm.actions.includes(a.code));
  };

  const isSomeActionsSelected = (module: PermissionModule): boolean => {
    const modulePerm = formData.permissions.find((p) => p.moduleCode === module.code);
    if (!modulePerm) return false;
    return modulePerm.actions.length > 0 && !isAllActionsSelected(module);
  };

  const selectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: permissionModules.map((m) => ({
        moduleCode: m.code,
        actions: m.actions.map((a) => a.code),
      })),
    }));
  };

  const deselectAllPermissions = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  };

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setSelectedRole(role);
      setFormData({
        nameAr: role.name.ar,
        nameEn: role.name.en,
        descriptionAr: role.description.ar,
        descriptionEn: role.description.en,
        permissions: [...role.permissions],
      });
      // Expand all modules with permissions
      setExpandedModules(role.permissions.map((p) => p.moduleCode));
    } else {
      setSelectedRole(null);
      setFormData(initialFormData);
      setExpandedModules([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRole(null);
    setFormData(initialFormData);
    setExpandedModules([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const name: LocalizedText = {
      ar: sanitizeInput(formData.nameAr),
      en: sanitizeInput(formData.nameEn),
    };

    const description: LocalizedText = {
      ar: sanitizeInput(formData.descriptionAr),
      en: sanitizeInput(formData.descriptionEn),
    };

    if (selectedRole) {
      updateRole(selectedRole.id, {
        name,
        description,
        permissions: formData.permissions,
      });

      addAuditLog({
        userId: user!.id,
        action: 'update',
        module: 'roles',
        entityId: selectedRole.id,
        oldValues: selectedRole,
        newValues: { name, description, permissions: formData.permissions },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('roles.roleUpdated'));
    } else {
      const newRole = addRole({
        name,
        description,
        branchId: null,
        isSystem: false,
        permissions: formData.permissions,
      });

      addAuditLog({
        userId: user!.id,
        action: 'create',
        module: 'roles',
        entityId: newRole.id,
        newValues: { name, description },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('roles.roleCreated'));
    }

    handleCloseModal();
  };

  const handleDelete = () => {
    if (selectedRole) {
      if (selectedRole.isSystem) {
        showToast('error', t('roles.cannotDeleteSystemRole'));
        setIsDeleteModalOpen(false);
        return;
      }

      const success = deleteRole(selectedRole.id);
      if (!success) {
        showToast('error', t('roles.usersWithRole'));
        setIsDeleteModalOpen(false);
        return;
      }

      addAuditLog({
        userId: user!.id,
        action: 'delete',
        module: 'roles',
        entityId: selectedRole.id,
        oldValues: selectedRole,
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });

      showToast('success', t('roles.roleDeleted'));
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
    }
  };

  const handleDuplicate = (role: Role) => {
    const newRole = duplicateRole(role.id);
    if (newRole) {
      addAuditLog({
        userId: user!.id,
        action: 'duplicate',
        module: 'roles',
        entityId: newRole.id,
        newValues: { sourceRoleId: role.id },
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
      });
      showToast('success', t('roles.roleCreated'));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('roles.title')}
          subtitle={`${filteredRoles.length} ${language === 'ar' ? 'دور' : 'roles'}`}
          action={
            canCreate && (
              <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
                {t('roles.addRole')}
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
              <TableCell isHeader>{t('roles.roleName')}</TableCell>
              <TableCell isHeader>{t('roles.description')}</TableCell>
              <TableCell isHeader>{t('roles.usersWithRole')}</TableCell>
              <TableCell isHeader>{t('common.status')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={5}>
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getLocalizedValue(role.name)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-gray-600 dark:text-gray-400 text-sm max-w-xs truncate">
                      {getLocalizedValue(role.description)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{getUserCountForRole(role.id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {role.isSystem ? (
                      <Badge variant="info">{t('roles.systemRole')}</Badge>
                    ) : (
                      <Badge variant="default">{t('roles.customRole')}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenModal(role)}
                          title={t('common.edit')}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
                      {canCreate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(role)}
                          title={t('roles.duplicateRole')}
                        >
                          <Copy className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      {canDelete && !role.isSystem && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
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
        title={selectedRole ? t('roles.editRole') : t('roles.addRole')}
        size="full"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('roles.roleNameAr')}
              value={formData.nameAr}
              onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
              required
              dir="rtl"
            />
            <Input
              label={t('roles.roleNameEn')}
              value={formData.nameEn}
              onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
              required
              dir="ltr"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('roles.descriptionAr')}
              value={formData.descriptionAr}
              onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
              dir="rtl"
            />
            <Input
              label={t('roles.descriptionEn')}
              value={formData.descriptionEn}
              onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
              dir="ltr"
            />
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {t('roles.assignPermissions')}
              </h4>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={selectAllPermissions}>
                  {t('roles.selectAll')}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={deselectAllPermissions}>
                  {t('roles.deselectAll')}
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
              {permissionModules.map((module) => (
                <div key={module.id} className="bg-white dark:bg-gray-800">
                  {/* Module Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => toggleModule(module.code)}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="text-gray-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleModule(module.code);
                        }}
                      >
                        {expandedModules.includes(module.code) ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </button>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isAllActionsSelected(module)}
                          onChange={(checked) => toggleAllActionsForModule(module, checked)}
                          className={clsx(
                            isSomeActionsSelected(module) && 'opacity-50'
                          )}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getLocalizedValue(module.name)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getLocalizedValue(module.description)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formData.permissions.find((p) => p.moduleCode === module.code)?.actions.length || 0} / {module.actions.length}
                    </div>
                  </div>

                  {/* Module Actions */}
                  {expandedModules.includes(module.code) && (
                    <div className="px-4 py-3 ps-16 bg-gray-50 dark:bg-gray-800/50 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                      {module.actions.map((action) => (
                        <Checkbox
                          key={action.code}
                          checked={hasPermissionInForm(module.code, action.code)}
                          onChange={() => togglePermission(module.code, action.code)}
                          label={getLocalizedValue(action.name)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={selectedRole?.isSystem && selectedRole?.permissions.some(p => p.moduleCode === '*')}>
              {selectedRole ? t('common.update') : t('common.create')}
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
            ? 'هل أنت متأكد من حذف هذا الدور؟'
            : 'Are you sure you want to delete this role?'}
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
