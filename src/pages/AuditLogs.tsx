import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardList, Search, Filter, Eye, Download } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Table, TableHead, TableBody, TableRow, TableCell } from '../components/ui/Table';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';
import type { AuditLog } from '../types/database';

export const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  const { auditLogs, users, permissionModules } = useDataStore();
  const { hasPermission } = useAuthStore();
  const { getLocalizedValue, language } = useLocalizedValue();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const canExport = hasPermission('auditLogs', 'export');

  const moduleOptions = permissionModules.map((m) => ({
    value: m.code,
    label: getLocalizedValue(m.name),
  }));

  const actionOptions = [
    { value: 'create', label: t('roles.create') },
    { value: 'read', label: t('roles.read') },
    { value: 'update', label: t('roles.update') },
    { value: 'delete', label: t('roles.delete') },
    { value: 'archive', label: language === 'ar' ? 'أرشفة' : 'Archive' },
    { value: 'rollover', label: language === 'ar' ? 'ترحيل' : 'Roll Over' },
    { value: 'duplicate', label: language === 'ar' ? 'نسخ' : 'Duplicate' },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const user = users.find((u) => u.id === log.userId);
    const userName = user
      ? `${getLocalizedValue(user.firstName)} ${getLocalizedValue(user.lastName)}`
      : '';
    
    const matchesSearch =
      !searchQuery ||
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = !filterModule || log.module === filterModule;
    const matchesAction = !filterAction || log.action === filterAction;
    const matchesDateFrom = !dateFrom || log.timestamp >= dateFrom;
    const matchesDateTo = !dateTo || log.timestamp <= dateTo + 'T23:59:59';

    return matchesSearch && matchesModule && matchesAction && matchesDateFrom && matchesDateTo;
  });

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user
      ? `${getLocalizedValue(user.firstName)} ${getLocalizedValue(user.lastName)}`
      : '-';
  };

  const getModuleName = (moduleCode: string) => {
    const module = permissionModules.find((m) => m.code === moduleCode);
    return module ? getLocalizedValue(module.name) : moduleCode;
  };

  const getActionBadgeVariant = (action: string): 'success' | 'danger' | 'warning' | 'info' | 'default' => {
    switch (action) {
      case 'create':
        return 'success';
      case 'delete':
        return 'danger';
      case 'update':
        return 'warning';
      case 'archive':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['User', 'Action', 'Module', 'Entity ID', 'Timestamp', 'IP Address'].join(','),
      ...filteredLogs.map((log) =>
        [
          getUserName(log.userId),
          log.action,
          log.module,
          log.entityId || '-',
          log.timestamp,
          log.ipAddress,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterModule('');
    setFilterAction('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title={t('auditLogs.title')}
          subtitle={`${filteredLogs.length} ${language === 'ar' ? 'سجل' : 'logs'}`}
          action={
            canExport && (
              <Button onClick={handleExport} leftIcon={<Download className="w-4 h-4" />} variant="outline">
                {t('common.export')}
              </Button>
            )
          }
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search')}
            leftIcon={<Search className="w-5 h-5" />}
          />
          <Select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...moduleOptions]}
            placeholder={t('auditLogs.module')}
          />
          <Select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            options={[{ value: '', label: t('common.all') }, ...actionOptions]}
            placeholder={t('auditLogs.action')}
          />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder={language === 'ar' ? 'من تاريخ' : 'From Date'}
          />
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder={language === 'ar' ? 'إلى تاريخ' : 'To Date'}
            />
            <Button variant="ghost" onClick={clearFilters} className="flex-shrink-0">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell isHeader>{t('auditLogs.user')}</TableCell>
              <TableCell isHeader>{t('auditLogs.action')}</TableCell>
              <TableCell isHeader>{t('auditLogs.module')}</TableCell>
              <TableCell isHeader>{t('auditLogs.timestamp')}</TableCell>
              <TableCell isHeader>{t('auditLogs.ipAddress')}</TableCell>
              <TableCell isHeader>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell className="text-center py-8" colSpan={6}>
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">{t('common.noData')}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs font-medium">
                          {getUserName(log.userId).charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{getUserName(log.userId)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {actionOptions.find((a) => a.value === log.action)?.label || log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{getModuleName(log.module)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(log.timestamp)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{log.ipAddress}</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLog(log);
                        setIsDetailModalOpen(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={t('auditLogs.details')}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">{t('auditLogs.user')}</label>
                <p className="font-medium">{getUserName(selectedLog.userId)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">{t('auditLogs.action')}</label>
                <p>
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {actionOptions.find((a) => a.value === selectedLog.action)?.label || selectedLog.action}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">{t('auditLogs.module')}</label>
                <p className="font-medium">{getModuleName(selectedLog.module)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">{t('auditLogs.timestamp')}</label>
                <p className="font-medium">{formatDate(selectedLog.timestamp)}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">{t('auditLogs.ipAddress')}</label>
                <p className="font-mono">{selectedLog.ipAddress}</p>
              </div>
              {selectedLog.entityId && (
                <div>
                  <label className="text-sm text-gray-500">Entity ID</label>
                  <p className="font-mono text-sm">{selectedLog.entityId}</p>
                </div>
              )}
            </div>

            {selectedLog.oldValues !== undefined && (
              <div>
                <label className="text-sm text-gray-500 block mb-2">{t('auditLogs.oldValues')}</label>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.oldValues, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.newValues !== undefined && (
              <div>
                <label className="text-sm text-gray-500 block mb-2">{t('auditLogs.newValues')}</label>
                <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.newValues, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t">
              <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
