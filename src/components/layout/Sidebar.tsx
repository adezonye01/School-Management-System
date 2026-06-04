import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import {
  LayoutDashboard, Building2, Calendar, Users, Shield, GraduationCap,
  BookOpen, DollarSign, FileText, Settings, ClipboardList, ChevronDown,
  School, Layers, Link, Scale, Hash, Wallet, Receipt, CreditCard,
  Bus, Heart, Search
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
  permissionModule?: string;
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation();
  const { sidebarOpen } = useAppStore();
  const { hasPermission } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);

  const menuItems: MenuItem[] = [
    // 1. Dashboard
    { key: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard', permissionModule: 'dashboard' },
    
    // 2. Student Search
    { key: 'studentSearch', icon: <Search className="w-5 h-5" />, path: '/student-search', permissionModule: 'students' },

    // 3. Student Affairs (القبول، الطلاب، السلوك، المواصلات)
    {
      key: 'studentAffairs',
      icon: <Users className="w-5 h-5" />,
      children: [
        { key: 'admissionReview', icon: <Users className="w-5 h-5" />, path: '/admission-review', permissionModule: 'students' },
        { key: 'students', icon: <Users className="w-5 h-5" />, path: '/students', permissionModule: 'students' },
        { key: 'behavior', icon: <Heart className="w-5 h-5" />, path: '/behavior', permissionModule: 'students' },
        { key: 'transport', icon: <Bus className="w-5 h-5" />, path: '/transport', permissionModule: 'settings' },
      ],
    },

    // 4. Academic (الأكاديمي: هيكل، مواد، درجات، شهادات)
    {
      key: 'academicManagement',
      icon: <School className="w-5 h-5" />,
      children: [
        { key: 'academicStructure', icon: <Layers className="w-5 h-5" />, path: '/academic-structure', permissionModule: 'grades' },
        { key: 'grades', icon: <GraduationCap className="w-5 h-5" />, path: '/grades', permissionModule: 'grades' },
        { key: 'subjects', icon: <BookOpen className="w-5 h-5" />, path: '/subjects', permissionModule: 'subjects' },
        { key: 'subjectMapping', icon: <Link className="w-5 h-5" />, path: '/subject-mapping', permissionModule: 'subjects' },
        { key: 'gradingScales', icon: <Scale className="w-5 h-5" />, path: '/grading-scales', permissionModule: 'settings' },
        { key: 'markEntry', icon: <BookOpen className="w-5 h-5" />, path: '/mark-entry', permissionModule: 'students' },
        { key: 'examSeating', icon: <Hash className="w-5 h-5" />, path: '/exam-seating', permissionModule: 'students' },
        { key: 'reportCards', icon: <FileText className="w-5 h-5" />, path: '/report-cards', permissionModule: 'students' },
        { key: 'promotion', icon: <GraduationCap className="w-5 h-5" />, path: '/promotion', permissionModule: 'students' },
      ],
    },

    // 5. Financial (المالي: رسوم، أقساط، خصومات، فواتير)
    {
      key: 'financialManagement',
      icon: <DollarSign className="w-5 h-5" />,
      children: [
        { key: 'feeCategories', icon: <Layers className="w-5 h-5" />, path: '/fee-categories', permissionModule: 'fees' },
        { key: 'feeAssignment', icon: <Link className="w-5 h-5" />, path: '/fee-assignment', permissionModule: 'fees' },
        { key: 'installments', icon: <CreditCard className="w-5 h-5" />, path: '/installments', permissionModule: 'fees' },
        { key: 'discounts', icon: <Wallet className="w-5 h-5" />, path: '/discounts', permissionModule: 'fees' },
        { key: 'studentDiscounts', icon: <GraduationCap className="w-5 h-5" />, path: '/student-discounts', permissionModule: 'fees' },
        { key: 'invoices', icon: <Receipt className="w-5 h-5" />, path: '/invoices', permissionModule: 'fees' },
      ],
    },

    // 6. Reports
    { key: 'reports', icon: <FileText className="w-5 h-5" />, path: '/reports', permissionModule: 'reports' },

    // 7. System & Settings
    {
      key: 'systemManagement',
      icon: <Settings className="w-5 h-5" />,
      children: [
        { key: 'schoolSettings', icon: <School className="w-5 h-5" />, path: '/school-settings', permissionModule: 'settings' },
        { key: 'branches', icon: <Building2 className="w-5 h-5" />, path: '/branches', permissionModule: 'branches' },
        { key: 'academicYears', icon: <Calendar className="w-5 h-5" />, path: '/academic-years', permissionModule: 'academicYears' },
        { key: 'users', icon: <Users className="w-5 h-5" />, path: '/users', permissionModule: 'users' },
        { key: 'roles', icon: <Shield className="w-5 h-5" />, path: '/roles', permissionModule: 'roles' },
        { key: 'studentAudit', icon: <Shield className="w-5 h-5" />, path: '/student-audit', permissionModule: 'students' },
        { key: 'auditLogs', icon: <ClipboardList className="w-5 h-5" />, path: '/audit-logs', permissionModule: 'auditLogs' },
      ],
    },
  ];

  const toggleMenu = (key: string) => {
    setExpandedMenus((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    if (item.permissionModule && !hasPermission(item.permissionModule, 'read')) return null;

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.key);

    const visibleChildren = hasChildren
      ? item.children!.filter((child) => !child.permissionModule || hasPermission(child.permissionModule, 'read'))
      : [];

    if (hasChildren && visibleChildren.length === 0) return null;

    if (hasChildren) {
      return (
        <div key={item.key}>
          <button
            onClick={() => toggleMenu(item.key)}
            className={clsx(
              'w-full flex items-center justify-between px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
              isExpanded && 'bg-gray-50 dark:bg-gray-700/50'
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {sidebarOpen && <span className="text-sm font-medium">{t(`sidebar.${item.key}`)}</span>}
            </div>
            {sidebarOpen && <ChevronDown className={clsx('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')} />}
          </button>
          {isExpanded && sidebarOpen && (
            <div className="mt-1 ms-4 ps-4 border-s border-gray-200 dark:border-gray-700">
              {visibleChildren.map((child) => renderMenuItem(child, true))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.key}
        to={item.path!}
        className={({ isActive }) =>
          clsx(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            isActive ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700',
            isChild && 'py-2'
          )
        }
      >
        {item.icon}
        {sidebarOpen && <span className="text-sm font-medium">{t(`sidebar.${item.key}`)}</span>}
      </NavLink>
    );
  };

  return (
    <aside className={clsx('fixed top-0 start-0 h-full bg-white dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700 z-40 transition-all duration-300', sidebarOpen ? 'w-64' : 'w-20')}>
      <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <School className="w-6 h-6 text-white" />
          </div>
          {sidebarOpen && <div className="text-start"><h1 className="text-sm font-bold text-gray-900 dark:text-white">{t('common.appName')}</h1></div>}
        </div>
      </div>
      <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>
    </aside>
  );
};
