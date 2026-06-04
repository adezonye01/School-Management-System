import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  Building2,
  Calendar,
  TrendingUp,
  DollarSign,
  BookOpen,
  Clock,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { useDataStore } from '../stores/dataStore';
import { useLocalizedValue } from '../hooks/useLocalizedValue';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color }) => {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
          {trend && (
            <p
              className={`text-sm mt-2 flex items-center gap-1 ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp
                className={`w-4 h-4 ${!trend.isPositive && 'rotate-180'}`}
              />
              {trend.value}%
            </p>
          )}
        </div>
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center ${color}`}
        >
          {icon}
        </div>
      </div>
      <div
        className={`absolute bottom-0 start-0 end-0 h-1 ${color.replace(
          'bg-',
          'bg-'
        )}`}
      />
    </Card>
  );
};

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { currentBranch, currentAcademicYear } = useAppStore();
  const { branches, users, grades, auditLogs } = useDataStore();
  const { getLocalizedValue } = useLocalizedValue();

  const stats = [
    {
      title: t('dashboard.totalStudents'),
      value: '1,248',
      icon: <GraduationCap className="w-7 h-7 text-white" />,
      trend: { value: 12, isPositive: true },
      color: 'bg-blue-500',
    },
    {
      title: t('dashboard.totalTeachers'),
      value: '86',
      icon: <Users className="w-7 h-7 text-white" />,
      trend: { value: 5, isPositive: true },
      color: 'bg-green-500',
    },
    {
      title: t('dashboard.totalBranches'),
      value: branches.filter((b) => b.isActive).length,
      icon: <Building2 className="w-7 h-7 text-white" />,
      color: 'bg-purple-500',
    },
    {
      title: t('dashboard.totalUsers'),
      value: users.length,
      icon: <Users className="w-7 h-7 text-white" />,
      color: 'bg-orange-500',
    },
  ];

  const recentActivities = auditLogs.slice(0, 5).map((log) => {
    const actingUser = users.find((u) => u.id === log.userId);
    return {
      id: log.id,
      user: actingUser ? getLocalizedValue(actingUser.firstName) + ' ' + getLocalizedValue(actingUser.lastName) : 'Unknown',
      action: log.action,
      module: t(`permissions.modules.${log.module}`),
      time: new Date(log.timestamp).toLocaleString(),
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {t('common.welcome')}، {user ? getLocalizedValue(user.firstName) : ''} 👋
        </h1>
        <p className="text-blue-100 mb-4">{t('dashboard.welcome')}</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
            <Building2 className="w-5 h-5" />
            <span className="text-sm">
              {t('dashboard.currentBranch')}: {currentBranch ? getLocalizedValue(currentBranch.name) : '-'}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
            <Calendar className="w-5 h-5" />
            <span className="text-sm">
              {t('dashboard.currentAcademicYear')}: {currentAcademicYear ? getLocalizedValue(currentAcademicYear.name) : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.quickStats')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {grades.length}
                </p>
                <p className="text-sm text-gray-500">{t('sidebar.grades')}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  95%
                </p>
                <p className="text-sm text-gray-500">{t('sidebar.fees')}</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4">
                <GraduationCap className="w-8 h-8 text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  32
                </p>
                <p className="text-sm text-gray-500">{t('sidebar.sections')}</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
                <BookOpen className="w-8 h-8 text-orange-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  18
                </p>
                <p className="text-sm text-gray-500">{t('sidebar.subjects')}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        <div>
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('dashboard.recentActivities')}
            </h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {activity.user}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.action} - {activity.module}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
